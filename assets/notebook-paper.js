/* SEYVEO Paper · offline editable ink (no cloud, no automatic saving).
   Basic stroke smoothing only; handwriting correction needs a future AI service. */
(function(){
'use strict';
const W=840,H=1188,MAX_PAGE_HEIGHT=2600,MAX_STROKES=250,MAX_POINTS=1300,MAX_BYTES=350000,MAX_PHOTO=155000;
const tools=['pen','pencil','eraser','line','arrow','rect','circle','triangle','diamond'],patterns=['blank','lines','dots','grid'];
const SHAPE_TOOLS=new Set(['line','arrow','rect','circle','triangle','diamond']);
const COLORS=['#171e29','#556174','#27609b','#c54a51','#258463','#7954a3','#f6f7fb','#8e99aa','#aa5c22','#e73b39','#ff7a27','#ffb525','#2fb35f','#0c9999','#14b4cd','#3b77df','#6650d2','#983cde','#bd397b'];
const HEX_RE=/^#[0-9a-fA-F]{6}$/;
const validGradient=g=>Array.isArray(g)&&g.length===2&&g.every(c=>typeof c==='string'&&HEX_RE.test(c));
const gradientPaint=(ctx,g)=>{
 const paint=ctx.createLinearGradient(0,0,W,0);
 paint.addColorStop(0,g[0]);paint.addColorStop(1,g[1]);
 return paint;
};
const $=id=>document.getElementById(id);
const dialog=$('notePaperDialog'),canvas=$('notePaperCanvas');
if(!dialog||!canvas||!canvas.getContext('2d'))return;
const sheet=$('notePaperSheet'),stage=$('notePaperStage'),pattern=$('notePaperPattern'),status=$('notePaperStatus');
let data={pattern:'blank',background:'dark',height:H,strokes:[]},editID=null,pending=null,pointerID=null,changed=false,penTime=0,returnToList=false;
let activeColor='#f6f7fb',activeGradient=null,brushSize=5;
// Live strokes paint incrementally; old strokes are not recomputed per pointer event.
let liveTail=null,liveMid=null,shapeFrame=0;
const shapeSnapshot=document.createElement('canvas');
const shapeSnapshotCtx=shapeSnapshot.getContext('2d');
const brushControl=$('notePaperWidth'),moreButton=$('notePaperMore'),extras=$('notePaperExtras');
const photoView=$('notePaperPhotoPreview'),photoFile=$('notePaperPhotoFile');
const photoCache=new Map();
function photoImage(photo,redraw){
 if(!photo)return null;
 let entry=photoCache.get(photo);
 if(!entry){
  const image=new Image();entry={image,ready:false,callbacks:[]};
  if(photoCache.size>=5)photoCache.delete(photoCache.keys().next().value);
  photoCache.set(photo,entry);
  image.onload=()=>{entry.ready=true;for(const callback of entry.callbacks.splice(0))callback()};
  image.onerror=()=>{for(const callback of entry.callbacks.splice(0))callback()};
  image.src=photo;
 }
 if(redraw&&!entry.ready)entry.callbacks.push(redraw);
 return entry.ready?entry.image:null;
}
const clamp=(n,max)=>Math.max(0,Math.min(max,Math.round(Number(n)||0)));
function normalize(obj){
 const p=obj&&typeof obj==='object'?obj:{};
 // Older pages were 840 x 1188. New fullscreen pages store a taller virtual
 // canvas so strokes remain circular instead of being stretched on iPhone.
 const height=Number.isFinite(Number(p.height))&&Number(p.height)>=H?Math.min(MAX_PAGE_HEIGHT,Math.round(Number(p.height))):H;
 return{pattern:patterns.includes(p.pattern)?p.pattern:'blank',background:p.background==='dark'?'dark':'light',height,
 photo:typeof p.photo==='string'&&p.photo.length<MAX_PHOTO&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.photo)?p.photo:'',
 strokes:(Array.isArray(p.strokes)?p.strokes:[]).slice(0,MAX_STROKES)
 .filter(stroke=>stroke&&tools.includes(stroke.tool)&&Array.isArray(stroke.points))
 .map(stroke=>({tool:stroke.tool,color:COLORS.includes(stroke.color)?stroke.color:undefined,gradient:validGradient(stroke.gradient)?stroke.gradient.map(c=>c.toLowerCase()):undefined,width:Number.isFinite(stroke.width)?Math.max(1,Math.min(28,stroke.width)):undefined,points:stroke.points.slice(0,MAX_POINTS)
 .filter(point=>Array.isArray(point)&&point.length>=2&&Number.isFinite(Number(point[0]))&&Number.isFinite(Number(point[1])))
 .map(point=>[clamp(point[0],W),clamp(point[1],height),clamp(point.length>2?point[2]:50,100)])}))};
}
function paintStroke(ctx,s){
 if(!s.points.length)return;
 // Store geometric figures as precise two-point strokes; their coordinates
 // survive note saving, undo, duplication, rendering and PNG export.
 if(SHAPE_TOOLS.has(s.tool)){
  if(s.points.length<2)return;
  const [x,y]=s.points[0],[u,v]=s.points[1],dx=u-x,dy=v-y;
  const weight=Number.isFinite(s.width)?Math.max(1,Math.min(28,s.width)):5;
  ctx.save();ctx.globalCompositeOperation='source-over';
  ctx.strokeStyle=ctx.fillStyle=validGradient(s.gradient)?gradientPaint(ctx,s.gradient):COLORS.includes(s.color)?s.color:'#f6f7fb';
  ctx.lineWidth=weight;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
  if(s.tool==='line'||s.tool==='arrow'){
   ctx.moveTo(x,y);ctx.lineTo(u,v);
   if(s.tool==='arrow'){
    const angle=Math.atan2(dy,dx);
    const tip=Math.min(38,Math.max(12,Math.hypot(dx,dy)*.22,weight*2.5));
    ctx.moveTo(u-tip*Math.cos(angle-.55),v-tip*Math.sin(angle-.55));
    ctx.lineTo(u,v);
    ctx.lineTo(u-tip*Math.cos(angle+.55),v-tip*Math.sin(angle+.55));
   }
  }else if(s.tool==='rect'){
   ctx.rect(Math.min(x,u),Math.min(y,v),Math.abs(dx),Math.abs(dy));
  }else if(s.tool==='circle'){
   ctx.arc((x+u)/2,(y+v)/2,Math.hypot(dx,dy)/2,0,2*Math.PI);
  }else if(s.tool==='triangle'){
   ctx.moveTo((x+u)/2,Math.min(y,v));
   ctx.lineTo(Math.max(x,u),Math.max(y,v));
   ctx.lineTo(Math.min(x,u),Math.max(y,v));ctx.closePath();
  }else if(s.tool==='diamond'){
   const cx=(x+u)/2,cy=(y+v)/2,rx=Math.abs(dx)/2,ry=Math.abs(dy)/2;
   ctx.moveTo(cx,cy-ry);ctx.lineTo(cx+rx,cy);
   ctx.lineTo(cx,cy+ry);ctx.lineTo(cx-rx,cy);ctx.closePath();
  }
  ctx.stroke();ctx.restore();return;
 }
 const erase=s.tool==='eraser';
 const base=Number.isFinite(s.width)?Math.max(1,Math.min(28,s.width)):(erase?28:s.tool==='pencil'?3.5:4.8);
 const chosen=COLORS.includes(s.color)?s.color:null;
 const width=base*(erase?1:1); // consistent width independent of frame frequency
 ctx.save();ctx.globalCompositeOperation=erase?'destination-out':'source-over';
 ctx.strokeStyle=ctx.fillStyle=erase?'#000':validGradient(s.gradient)?gradientPaint(ctx,s.gradient):chosen?(s.tool==='pencil'?chosen+'a3':chosen):'#171e29';
 ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';
 const pts=s.points;
 if(pts.length===1){
  ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],width/2,0,2*Math.PI);ctx.fill();
 }else{
  const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  if(pts.length===2)ctx.lineTo(pts[1][0],pts[1][1]);
  else{
   const first=mid(pts[0],pts[1]);ctx.lineTo(first[0],first[1]);
   for(let i=1;i<pts.length-1;i++){
    const m=mid(pts[i],pts[i+1]);
    ctx.quadraticCurveTo(pts[i][0],pts[i][1],m[0],m[1]);
   }
   ctx.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]);
  }
  ctx.stroke();
 }
 ctx.restore();
}
function paint(target,obj,background=false){
 const ctx=target.getContext('2d');if(!ctx)return;
 const p=normalize(obj),pageH=p.height;
 ctx.save();ctx.setTransform(target.width/W,0,0,target.height/pageH,0,0);
 ctx.clearRect(0,0,W,pageH);for(const s of p.strokes)paintStroke(ctx,s);
 if(background){
  const photo=p.photo;
  const bitmap=photoImage(photo,()=>paint(target,p,true));
  if(bitmap){
   ctx.save();ctx.globalCompositeOperation='destination-over';
   const scale=Math.min(W/bitmap.naturalWidth,pageH/bitmap.naturalHeight);
   const w=bitmap.naturalWidth*scale,h=bitmap.naturalHeight*scale;
   ctx.drawImage(bitmap,(W-w)/2,(pageH-h)/2,w,h);ctx.restore();
  }
  // Add the template beneath strokes so the eraser never damages the paper.
  ctx.save();ctx.globalCompositeOperation='destination-over';
  ctx.strokeStyle=p.background==='dark'?'rgba(220,228,238,.14)':'rgba(95,110,136,.18)';ctx.fillStyle=p.background==='dark'?'rgba(220,228,238,.17)':'rgba(95,110,136,.22)';
  if(p.pattern==='lines')for(let y=66;y<pageH;y+=66){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  if(p.pattern==='dots')for(let y=35;y<pageH;y+=45)for(let x=35;x<W;x+=45){ctx.beginPath();ctx.arc(x,y,1.6,0,2*Math.PI);ctx.fill()}
  if(p.pattern==='grid'){
   for(let y=0;y<pageH;y+=52){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
   for(let x=0;x<W;x+=52){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,pageH);ctx.stroke()}
  }
  ctx.fillStyle=p.background==='dark'?'#202124':'#fff';ctx.fillRect(0,0,W,pageH);ctx.restore();
 }
 ctx.restore();
}
function fitPaper(){
 if(!dialog.open||!stage||!sheet)return;
 const rect=stage.getBoundingClientRect();
 if(rect.width<100||rect.height<100)return;
 // Fill the WHOLE stage instead of forcing A4 into a small centered rectangle.
 // Extend the virtual page proportionally so circles and brush widths are not
 // distorted on-screen. Never shrink a page and crop existing strokes.
 const width=Math.max(90,Math.floor(rect.width));
 const height=Math.max(120,Math.floor(rect.height));
 const logicalHeight=Math.max(H,Math.min(MAX_PAGE_HEIGHT,Math.round(W*height/width)));
 if((data.height||H)<logicalHeight)data.height=logicalHeight;
 if(canvas.height!==data.height){canvas.height=data.height;paint(canvas,data)}
 sheet.style.width=width+'px';sheet.style.height=height+'px';
}
window.addEventListener('resize',()=>{if(dialog.open)requestAnimationFrame(fitPaper)});
if(typeof ResizeObserver!=='undefined'&&stage){
 const observer=new ResizeObserver(()=>{if(dialog.open)fitPaper()});
 observer.observe(stage);
}
function render(redrawInk=true){
 sheet.dataset.pattern=data.pattern;sheet.dataset.inkBackground=data.background;pattern.value=data.pattern;syncPatternMenu();
 if(photoView){photoView.hidden=!data.photo;if(data.photo&&photoView.src!==data.photo)photoView.src=data.photo;if(!data.photo)photoView.removeAttribute('src')}
 if($('notePaperRemovePhoto'))$('notePaperRemovePhoto').hidden=!data.photo;
 if(redrawInk)paint(canvas,data);$('notePaperUndo').disabled=!data.strokes.length;
 const duplicate=$('notePaperDuplicate');if(duplicate)duplicate.disabled=!data.strokes.length||data.strokes.length>=MAX_STROKES;
}
function report(text){status.textContent=text||''}
function currentTool(){return document.querySelector('[data-paper-tool][aria-pressed=true]')?.dataset.paperTool||'pen'}
function selectTool(name){if(!tools.includes(name))return;
 document.querySelectorAll('[data-paper-tool]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.paperTool===name)));
}
function point(e){
 const box=canvas.getBoundingClientRect();
 return [clamp((e.clientX-box.left)/box.width*W,W),clamp((e.clientY-box.top)/box.height*(data.height||H),data.height||H),clamp((e.pointerType==='pen'?e.pressure:.5)*100,100)];
}
// Live ink pipeline: draw ONLY the new Bézier segment, keeping previously
// painted pixels intact. Historic strokes are replayed for Undo/export only.
const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
function drawLivePart(kind,from,to,control=null,dot=false){
 const ctx=canvas.getContext('2d');if(!ctx||!pending)return;
 ctx.save();ctx.setTransform(canvas.width/W,0,0,canvas.height/(data.height||H),0,0);
 const erase=pending.tool==='eraser';
 ctx.globalCompositeOperation=erase?'destination-out':'source-over';
 ctx.fillStyle=ctx.strokeStyle=erase?'#000':validGradient(pending.gradient)?gradientPaint(ctx,pending.gradient):pending.tool==='pencil'?pending.color+'a3':pending.color;
 ctx.lineWidth=pending.width;ctx.lineJoin='round';ctx.lineCap='round';
 ctx.beginPath();
 if(dot){ctx.arc(from[0],from[1],pending.width/2,0,2*Math.PI);ctx.fill()}
 else {
  ctx.moveTo(from[0],from[1]);
  if(control)ctx.quadraticCurveTo(control[0],control[1],to[0],to[1]);
  else ctx.lineTo(to[0],to[1]);
  ctx.stroke();
 }
 ctx.restore();
}
function addInkPoint(next,force=false){
 if(!pending||SHAPE_TOOLS.has(pending.tool))return;
 const prev=liveTail;
 if(!prev)return;
 const distance=Math.hypot(next[0]-prev[0],next[1]-prev[1]);
 if(distance<(force?0.65:1.4))return;
 // Reconstruct sparse Safari moves; the spline now stays gap-free even
 // when coalesced events arrive after a dropped frame.
 const count=Math.max(1,Math.min(42,Math.ceil(distance/12)));
 for(let step=1;step<=count;step++){
  const p=[prev[0]+(next[0]-prev[0])*step/count,
           prev[1]+(next[1]-prev[1])*step/count,next[2]];
  const points=pending.points;
  const last=liveTail;
  const middle=midpoint(last,p);
  if(liveMid)drawLivePart('curve',liveMid,middle,last);
  else drawLivePart('line',last,middle);
  liveMid=middle;liveTail=p;
  if(points.length>=MAX_POINTS){
   // Progressive history simplification avoids a hard 1300-point cut-off.
   const reduced=[points[0]];
   for(let j=2;j<points.length-3;j+=2)reduced.push(points[j]);
   reduced.push(...points.slice(-3));
   pending.points=reduced;
  }
  pending.points.push(p);
 }
}
function redrawShapePreview(){
 shapeFrame=0;
 if(!pending||!SHAPE_TOOLS.has(pending.tool)||!shapeSnapshotCtx)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.drawImage(shapeSnapshot,0,0);
 ctx.setTransform(canvas.width/W,0,0,canvas.height/(data.height||H),0,0);
 paintStroke(ctx,pending);
 ctx.restore();
}
function queueShapePreview(){
 if(shapeFrame)return;
 shapeFrame=requestAnimationFrame(redrawShapePreview);
}
function down(e){
 if(pending||pointerID!==null||e.button!==0||e.isPrimary===false)return;
 if(e.pointerType==='pen')penTime=Date.now()+2800;
 if(e.pointerType==='touch'&&Date.now()<penTime)return;
 if(data.strokes.length>=MAX_STROKES){report('Лист заполнен. Начните следующий.');return}
 e.preventDefault();pointerID=e.pointerId;
 pending={tool:currentTool(),color:activeColor,gradient:activeGradient?[...activeGradient]:undefined,width:brushSize,points:[point(e)]};
 liveTail=pending.points[0];liveMid=null;
 if(SHAPE_TOOLS.has(pending.tool)&&shapeSnapshotCtx){
  if(shapeSnapshot.width!==canvas.width)shapeSnapshot.width=canvas.width;
  if(shapeSnapshot.height!==canvas.height)shapeSnapshot.height=canvas.height;
  shapeSnapshotCtx.clearRect(0,0,shapeSnapshot.width,shapeSnapshot.height);
  shapeSnapshotCtx.drawImage(canvas,0,0);
 }else drawLivePart('dot',liveTail,liveTail,null,true);
 dialog.classList.add('sv-paper-inking');
 try{canvas.setPointerCapture(e.pointerId)}catch{}
}
function move(e){
 if(!pending||e.pointerId!==pointerID)return;
 e.preventDefault();
 if(SHAPE_TOOLS.has(pending.tool)){
  pending.points[1]=point(e);queueShapePreview();return;
 }
 const batches=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[e];
 const events=batches&&batches.length?batches:[e];
 for(const ev of events)addInkPoint(point(ev));
 // Some WebKit versions omit the parent event from the coalesced set.
 if(events[events.length-1]!==e)addInkPoint(point(e));
}
function finishStroke(e,addEndpoint=true){
 if(!pending||(e&&e.pointerId!==pointerID))return;
 if(e?.cancelable)e.preventDefault();
 if(SHAPE_TOOLS.has(pending.tool)){
  if(addEndpoint&&e)pending.points[1]=point(e);
  if(shapeFrame){cancelAnimationFrame(shapeFrame);shapeFrame=0}
  if(pending.points.length<2){
   pending=null;pointerID=null;dialog.classList.remove('sv-paper-inking');
   render();return;
  }
  redrawShapePreview();
 }else{
  if(addEndpoint&&e)addInkPoint(point(e),true);
  if(liveMid&&liveTail)drawLivePart('end',liveMid,liveTail);
 }
 data.strokes.push(pending);
 pending=null;pointerID=null;liveTail=null;liveMid=null;changed=true;
 dialog.classList.remove('sv-paper-inking');
 render(false); // only refresh controls, not the full history on every stroke
}
canvas.addEventListener('pointerdown',down);
canvas.addEventListener('pointermove',move);
canvas.addEventListener('pointerup',e=>finishStroke(e,true));
canvas.addEventListener('pointercancel',e=>finishStroke(e,false));
canvas.addEventListener('lostpointercapture',e=>finishStroke(e,false));
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&dialog.open)finishStroke(null,false);
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.querySelectorAll('[data-paper-tool]').forEach(btn=>btn.addEventListener('click',()=>{selectTool(btn.dataset.paperTool);if(btn.closest('.sv-paper-extras-panel'))closeExtras();if(btn.closest('#notePaperPatternMenu'))closePatternMenu(true);}));
pattern.addEventListener('change',()=>{if(!patterns.includes(pattern.value))return;data.pattern=pattern.value;changed=true;render()});
/* Glass-pattern picker. The original hidden select remains the only paper
   template value so saved notes and rendering logic stay unchanged. */
const patternTrigger=$('notePaperPatternTrigger');
const patternMenu=$('notePaperPatternMenu');
const patternLabel=$('notePaperPatternLabel');
const patternChoices=Array.from(patternMenu.querySelectorAll('[data-paper-pattern]'));
function closePatternMenu(restoreFocus=false){
 patternMenu.hidden=true;
 patternTrigger.setAttribute('aria-expanded','false');
 if(restoreFocus)patternTrigger.focus({preventScroll:true});
}
function syncPatternMenu(){
 const current=patterns.includes(pattern.value)?pattern.value:'blank';
 const active=patternChoices.find(item=>item.dataset.paperPattern===current);
 patternLabel.textContent=active?.textContent||'Чистая';
 patternChoices.forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.paperPattern===current)));
}
patternTrigger.addEventListener('click',()=>{
 closeColorMenu();
 const opening=patternMenu.hidden;
 patternMenu.hidden=!opening;
 patternTrigger.setAttribute('aria-expanded',String(opening));
 if(opening)syncPatternMenu();
});
patternChoices.forEach(item=>item.addEventListener('click',()=>{
 const choice=item.dataset.paperPattern;
 if(!patterns.includes(choice))return;
 pattern.value=choice;
 pattern.dispatchEvent(new Event('change',{bubbles:true}));
 closePatternMenu(true);
 closeExtras();
}));
document.addEventListener('pointerdown',event=>{
 if(!patternMenu.hidden&&!event.target.closest('.paper-pattern-control')&&!patternMenu.contains(event.target))closePatternMenu();
});
dialog.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!colorMenu.hidden){
  event.preventDefault();event.stopPropagation();closeColorMenu(true);
 }else if(event.key==='Escape'&&!patternMenu.hidden){
  event.preventDefault();event.stopPropagation();closePatternMenu(true);
 }
});


/* Color picker: store an allowlisted color per stroke. Old notes without
   a color still render exactly as before. Eraser behavior is unchanged. */
const colorTrigger=$('notePaperColorTrigger');
const colorMenu=$('notePaperColorMenu');
const colorDot=$('notePaperColorDot');
const colorChoices=Array.from(dialog.querySelectorAll('[data-paper-color]'));
const gradientPresets=[...dialog.querySelectorAll('[data-paper-gradient]')];
const gradientColorStart=$('noteGradientStartColor'),gradientColorEnd=$('noteGradientEndColor');
const gradientHexStart=$('noteGradientStartHex'),gradientHexEnd=$('noteGradientEndHex');
const gradientPreview=$('noteGradientPreview');
function updateGradientEditor(){
 const a=gradientColorStart?.value||'#e9eff8',b=gradientColorEnd?.value||'#809ebd';
 if(gradientPreview)gradientPreview.style.background='linear-gradient(115deg,'+a+','+b+')';
}
function syncColorMenu(){
 colorDot.style.setProperty('--sv-active-ink',activeGradient?'linear-gradient(115deg,'+activeGradient[0]+','+activeGradient[1]+')':'conic-gradient(#e73b39,#ffb525,#2fb35f,#14b4cd,#6650d2,#bd397b,#e73b39)');
 colorChoices.forEach(button=>button.setAttribute('aria-pressed',String(!activeGradient&&button.dataset.paperColor===activeColor)));
 gradientPresets.forEach(button=>{
  const colors=button.dataset.paperGradient.split(',');
  button.setAttribute('aria-pressed',String(Boolean(activeGradient)&&activeGradient[0]===colors[0]&&activeGradient[1]===colors[1]));
 });
}
function closeColorMenu(restoreFocus=false){
 colorMenu.hidden=true;
 colorTrigger.setAttribute('aria-expanded','false');
 if(restoreFocus)colorTrigger.focus({preventScroll:true});
}
colorTrigger.addEventListener('click',()=>{
 closePatternMenu();
 const opening=colorMenu.hidden;
 colorMenu.hidden=!opening;
 colorTrigger.setAttribute('aria-expanded',String(opening));
 if(opening)syncColorMenu();
});
colorChoices.forEach(button=>button.addEventListener('click',()=>{
 if(!COLORS.includes(button.dataset.paperColor))return;
 activeColor=button.dataset.paperColor;
 activeGradient=null;
 syncColorMenu();
 if(currentTool()==='eraser')selectTool('pen');
 closeColorMenu(Boolean(button.closest('.paper-color-menu')));
}));
const gradientControls=[[gradientColorStart,gradientHexStart],[gradientColorEnd,gradientHexEnd]];
for(const [picker,hex] of gradientControls){
 if(!picker||!hex)continue;
 picker.addEventListener('input',()=>{hex.value=picker.value.toUpperCase();updateGradientEditor()});
 hex.addEventListener('input',()=>{
  const value=hex.value.trim();
  if(HEX_RE.test(value)){picker.value=value;hex.setCustomValidity('');updateGradientEditor()}
  else hex.setCustomValidity('Введите HEX, например #AABBCC');
 });
 hex.addEventListener('blur',()=>{
  if(!HEX_RE.test(hex.value.trim())){hex.value=picker.value.toUpperCase();hex.setCustomValidity('')}
 });
}
function applyGradient(colors,focus=false){
 if(!validGradient(colors))return;
 activeGradient=colors.map(v=>v.toLowerCase());
 if(currentTool()==='eraser')selectTool('pen');
 syncColorMenu();closeColorMenu(focus);
}
gradientPresets.forEach(button=>button.addEventListener('click',()=>{
 const pair=button.dataset.paperGradient.split(',');
 if(!validGradient(pair))return;
 gradientColorStart.value=pair[0];gradientColorEnd.value=pair[1];
 gradientHexStart.value=pair[0].toUpperCase();gradientHexEnd.value=pair[1].toUpperCase();
 updateGradientEditor();applyGradient(pair,true);
}));
$('noteGradientApply')?.addEventListener('click',()=>{
 const a=gradientHexStart.value.trim(),b=gradientHexEnd.value.trim();
 if(!validGradient([a,b])){
  if(!HEX_RE.test(a))gradientHexStart.focus();else gradientHexEnd.focus();
  return;
 }
 applyGradient([a,b],true);
});
updateGradientEditor();
if(brushControl)brushControl.addEventListener('input',()=>{
 brushSize=Math.max(1,Math.min(28,Number(brushControl.value)||5));
 brushControl.setAttribute('aria-valuetext',String(brushSize));
});
function closeExtras(){
 if(!extras||!moreButton)return;
 extras.hidden=true;moreButton.setAttribute('aria-expanded','false');
}
moreButton?.addEventListener('click',()=>{
 const opening=extras.hidden;
 extras.hidden=!opening;moreButton.setAttribute('aria-expanded',String(opening));
 if(!opening){closePatternMenu();closeColorMenu()}
});
document.addEventListener('pointerdown',event=>{
 if(extras&&!extras.hidden&&!event.target.closest('.sv-paper-extras'))closeExtras();
});
dialog.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&extras&&!extras.hidden){
  event.preventDefault();event.stopPropagation();closeExtras();
 }
});

document.addEventListener('pointerdown',event=>{
 if(!colorMenu.hidden&&!event.target.closest('.paper-color-control'))closeColorMenu();
});

$('notePaperUndo').addEventListener('click',()=>{if(!data.strokes.length)return;data.strokes.pop();changed=true;render();report('Последний штрих отменён.')});
$('notePaperDuplicate')?.addEventListener('click',()=>{
 if(!data.strokes.length||data.strokes.length>=MAX_STROKES)return;
 const last=data.strokes[data.strokes.length-1];
 const copy={...last,points:last.points.map(([x,y,p])=>[clamp(x+25,W),clamp(y+25,data.height||H),p])};
 data.strokes.push(copy);changed=true;render();report('Последний штрих дублирован.');
});
function open(note=null){
 dialog.classList.remove('sv-paper-inking');
 if(shapeFrame){cancelAnimationFrame(shapeFrame);shapeFrame=0}
 liveTail=null;liveMid=null;
 data=note?.paper?normalize(note.paper):{pattern:'blank',photo:'',background:'dark',height:H,strokes:[]};editID=note?.id||null;changed=false;pending=null;pointerID=null;penTime=0;returnToList=true;
 closePatternMenu();closeColorMenu();
 activeColor=[...data.strokes].reverse().find(stroke=>COLORS.includes(stroke.color))?.color||(data.background==='dark'?'#f6f7fb':'#171e29');
 activeGradient=null;
 brushSize=[...data.strokes].reverse().find(stroke=>Number.isFinite(stroke.width))?.width||5;
 if(brushControl){brushControl.value=String(brushSize);brushControl.setAttribute('aria-valuetext',String(brushSize));}
 if(extras)extras.hidden=true;if(moreButton)moreButton.setAttribute('aria-expanded','false');
 syncColorMenu();
 $('notePaperTitle').textContent=editID?'Мой лист':'Чистый лист';selectTool('pen');report('');
 if(!dialog.open)dialog.showModal();
 document.documentElement.classList.add('sv-paper-drawing');
 requestAnimationFrame(()=>{fitPaper();render()});
}
function discard(){
 if(changed&&!window.confirm('Закрыть лист без сохранения?'))return;
 dialog.close();
}
$('notePaperCancel').addEventListener('click',discard);$('notePaperBack').addEventListener('click',discard);
dialog.addEventListener('cancel',e=>{if(changed&&!window.confirm('Закрыть лист без сохранения?'))e.preventDefault()});
dialog.addEventListener('close',()=>{document.documentElement.classList.remove('sv-paper-drawing');dialog.classList.remove('sv-paper-inking');if(shapeFrame){cancelAnimationFrame(shapeFrame);shapeFrame=0}liveTail=null;liveMid=null;closeExtras();closePatternMenu();closeColorMenu();pending=null;pointerID=null;if(returnToList){returnToList=false;window.SEYVEO_NOTES_API?.openNotes()}});
$('notePaperSave').addEventListener('click',()=>{
 if(pending)return;
 if(!data.strokes.length&&!data.photo){report('Напишите, нарисуйте или добавьте фотографию.');return}
 const api=window.SEYVEO_NOTES_API,list=api?.getNotes();
 if(!api||!list){report('Блокнот недоступен.');return}
 const page=normalize(data);
 if(JSON.stringify(page).length>MAX_BYTES){report('Слишком много штрихов для одного листа.');return}
 let updated;
 if(editID){
  if(!list.some(n=>n.id===editID)){report('Запись не найдена.');return}
  updated=list.map(n=>n.id===editID?{...n,paper:page,updatedAt:Date.now()}:n);
 }else updated=[{id:String(Date.now())+'-'+Math.random().toString(36).slice(2),text:'Рукописный лист',paper:page,createdAt:Date.now()},...list];
 if(!api.putNotes(updated)){report('Не хватает места для сохранения. Лист пока открыт.');return}
 changed=false;dialog.close();
});
async function png(p){
 if(p?.photo)await new Promise(resolve=>{const image=photoImage(p.photo,resolve);if(image)resolve()});
 const out=document.createElement('canvas');out.width=W;out.height=normalize(p).height;
 paint(out,p,true);return out.toDataURL('image/png');
}
async function share(note){
 try{
  const encoded=await png(note.paper);
  if(typeof File!=='undefined'&&navigator.share&&navigator.canShare){
   const decoded=atob(encoded.split(',')[1]),bytes=new Uint8Array(decoded.length);
   for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
   const file=new File([bytes],'SEYVEO-Paper.png',{type:'image/png'});
   if(navigator.canShare({files:[file]})){
    navigator.share({title:'Мой лист · SEYVEO',files:[file]}).catch(e=>{
     if(e?.name!=='AbortError')window.SEYVEO_NOTES_API?.message('Отправка листа не удалась.');
    });return;
   }
  }
  const link=document.createElement('a');link.href=encoded;link.download='SEYVEO-Paper.png';link.click();
  window.SEYVEO_NOTES_API?.message('Лист подготовлен как PNG.');
 }catch{window.SEYVEO_NOTES_API?.message('Не удалось подготовить изображение.')}
}
async function print(note){
 const win=window.open('','_blank');
 if(!win){window.SEYVEO_NOTES_API?.message('Разрешите новое окно для печати.');return}
 try{
  const encoded=await png(note.paper);win.opener=null;win.document.open();
  win.document.write('<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>SEYVEO Paper</title>'
   +'<style>@page{size:A4;margin:10mm}body{margin:0}img{display:block;max-width:100%;max-height:95vh;margin:auto}</style></head>'
   +'<body><img id="page" alt="Лист" src="'+encoded+'"></body></html>');
  win.document.close();const picture=win.document.getElementById('page');
  const show=()=>{win.focus();win.print()};
  if(picture.complete)show();else picture.addEventListener('load',show,{once:true});
 }catch{try{win.close()}catch{}window.SEYVEO_NOTES_API?.message('Печать не удалась.')}
}
/* Camera and gallery: image stays local, compressed and stored with this page.
   No photo is uploaded. Only one picture per page to respect iPhone storage. */
async function compressPhoto(file){
 if(!file||!file.type.startsWith('image/')||file.type==='image/svg+xml'||file.size>15*1024*1024)
  throw new Error('Выберите фотографию размером до 15 МБ.');
 const url=URL.createObjectURL(file);
 try{
  const bitmap=await new Promise((resolve,reject)=>{
   const image=new Image();image.onload=()=>resolve(image);
   image.onerror=()=>reject(new Error('Не удалось открыть изображение.'));
   image.src=url;
  });
  const temp=document.createElement('canvas');
  const ctx=temp.getContext('2d');if(!ctx)throw new Error('Браузер не может обработать фото.');
  for(const maxSide of [1050,850,700,560]){
   const factor=Math.min(1,maxSide/Math.max(bitmap.naturalWidth,bitmap.naturalHeight));
   temp.width=Math.max(1,Math.round(bitmap.naturalWidth*factor));
   temp.height=Math.max(1,Math.round(bitmap.naturalHeight*factor));
   ctx.fillStyle='#fff';ctx.fillRect(0,0,temp.width,temp.height);
   ctx.drawImage(bitmap,0,0,temp.width,temp.height);
   for(const quality of [.78,.62,.48]){
    const encoded=temp.toDataURL('image/jpeg',quality);
    if(encoded.length<MAX_PHOTO)return encoded;
   }
  }
  throw new Error('Фотография слишком большая для локального Блокнота.');
 }finally{URL.revokeObjectURL(url)}
}
async function importPhoto(file){
 if(!file)return;
 report('Готовлю фотографию…');
 try{
  const image=await compressPhoto(file);
  data.photo=image;data.pattern='blank';changed=true;render();
  report('Фото добавлено. Можно писать поверх и сохранить лист.');
 }catch(error){report(error?.message||'Не получилось добавить фотографию.')}
}
$('notePaperAddPhoto')?.addEventListener('click',()=>{closeExtras();photoFile?.click()});
photoFile?.addEventListener('change',()=>{
 const file=photoFile.files?.[0];photoFile.value='';
 if(file)importPhoto(file);
});
$('notePaperRemovePhoto')?.addEventListener('click',()=>{
 if(!data.photo)return;
 if(!window.confirm('Убрать фотографию с листа? Штрихи останутся.'))return;
 data.photo='';changed=true;render();report('Фотография убрана.');
});
window.SEYVEO_PAPER=Object.freeze({
 getBackground:()=>data.background,
 setBackground:(background)=>{
  if(background!=='dark'&&background!=='light')return;
  if(data.background===background)return;
  data.background=background;
  if(background==='light'&&activeColor==='#f6f7fb')activeColor='#171e29';
  else if(background==='dark'&&activeColor==='#171e29')activeColor='#f6f7fb';
  changed=true;syncColorMenu();render();
 },
 openSayvi:()=>{
  const chat=window.SEYVEO_CONVERSATION;
  if(typeof chat?.open!=='function'){report('Сэйви пока недоступна.');return}
  if(changed&&!window.confirm('Открыть Сэйви? Несохранённые изменения листа будут потеряны.'))return;
  returnToList=false;dialog.close();chat.open();
 },
 open,preview:(target,p)=>{target.height=Math.round(target.width*normalize(p).height/W);paint(target,p,true)},share,print,normalize,importPhoto,compressPhoto});
})();