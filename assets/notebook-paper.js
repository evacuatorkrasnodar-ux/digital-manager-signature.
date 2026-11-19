/* SEYVEO Paper · editable vector ink, pen-pressure and tilt-aware rendering.
   Recognition is an explicit user action and never changes the original ink. */
(function(){
'use strict';
const W=840,H=1188,MAX_PAGE_HEIGHT=2600,MAX_STROKES=250,MAX_POINTS=1300,MAX_BYTES=350000,MAX_PHOTO=155000;
const tools=['pen','pencil','eraser','lasso','line','arrow','rect','circle','triangle','diamond'],patterns=['blank','lines','dots','grid'];
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
const iosFingerInk=/iPhone|iPod/i.test(navigator.userAgent||'');
let data={pattern:'blank',background:'dark',height:H,strokes:[]},editID=null,pending=null,pointerID=null,changed=false,penTime=0,returnToList=false;
let activeColor='#f6f7fb',activeGradient=null,brushSize=5;
let undoStack=[],lastInkMotionAt=0;
function rememberUndo(action){
 undoStack.push(action);
 // Each replaced sheet may be large; keep mobile memory bounded.
 if(undoStack.length>32)undoStack.shift();
}
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
// Preserve subpixel positions while keeping saved strokes compact.
const inkCoord=(n,max)=>Math.max(0,Math.min(max,Math.round((Number(n)||0)*10)/10));
function normalize(obj){
 const p=obj&&typeof obj==='object'?obj:{};
 // Older pages were 840 x 1188. New fullscreen pages store a taller virtual
 // canvas so strokes remain circular instead of being stretched on iPhone.
 const height=Number.isFinite(Number(p.height))&&Number(p.height)>=H?Math.min(MAX_PAGE_HEIGHT,Math.round(Number(p.height))):H;
 return{pattern:patterns.includes(p.pattern)?p.pattern:'blank',background:p.background==='dark'?'dark':'light',height,
 photo:typeof p.photo==='string'&&p.photo.length<MAX_PHOTO&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.photo)?p.photo:'',
 strokes:(Array.isArray(p.strokes)?p.strokes:[]).slice(0,MAX_STROKES)
 .filter(stroke=>stroke&&tools.includes(stroke.tool)&&Array.isArray(stroke.points))
 .map(stroke=>({tool:stroke.tool,color:COLORS.includes(stroke.color)?stroke.color:undefined,gradient:validGradient(stroke.gradient)?stroke.gradient.map(c=>c.toLowerCase()):undefined,width:Number.isFinite(stroke.width)?Math.max(1,Math.min(28,stroke.width)):undefined,...(stroke.pressureSensitive===true?{pressureSensitive:true}:{}),points:stroke.points.slice(0,MAX_POINTS)
 .filter(point=>Array.isArray(point)&&point.length>=2&&Number.isFinite(Number(point[0]))&&Number.isFinite(Number(point[1])))
 .map(point=>{
  const values=[inkCoord(point[0],W),inkCoord(point[1],height),clamp(point.length>2?point[2]:50,100)];
  if(stroke.pressureSensitive===true)values.push(clamp(point.length>3?point[3]:0,90));
  return values;
 })}))};
}
function inkWeight(s,p){
 const base=Number.isFinite(s.width)?Math.max(1,Math.min(28,s.width)):5;
 if(!s.pressureSensitive||s.tool==='eraser'||SHAPE_TOOLS.has(s.tool))return base;
 const force=clamp(p?.[2]??50,100)/100;
 const tilt=s.tool==='pencil'?1+Math.min(.32,clamp(p?.[3]??0,90)/220):1;
 return base*(.58+.84*force)*tilt;
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
 if(s.pressureSensitive&&!erase){
  // Segment-by-segment Béziers retain true S Pen / Apple Pencil pressure in
  // saved notes, Undo, print and PNG export. Legacy strokes remain unchanged.
  ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],inkWeight(s,pts[0])/2,0,2*Math.PI);ctx.fill();
  const segment=(from,to,control=null)=>{
   ctx.lineWidth=(inkWeight(s,from)+inkWeight(s,to)+(control?inkWeight(s,control):0))/(control?3:2);
   ctx.beginPath();ctx.moveTo(from[0],from[1]);
   if(control)ctx.quadraticCurveTo(control[0],control[1],to[0],to[1]);
   else ctx.lineTo(to[0],to[1]);
   ctx.stroke();
  };
  if(pts.length===2)segment(pts[0],pts[1]);
  else if(pts.length>2){
   let from=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2,(pts[0][2]+pts[1][2])/2,(pts[0][3]+pts[1][3])/2];
   segment(pts[0],from);
   for(let i=1;i<pts.length-1;i++){
    const p=pts[i],q=pts[i+1];
    const to=[(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2,(p[3]+q[3])/2];
    segment(from,to,p);from=to;
   }
   segment(from,pts[pts.length-1]);
  }
 }else if(pts.length===1){
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
 sheet.style.width=width+'px';sheet.style.height=height+'px';
 // Retina: the old fixed-size bitmap was stretched across physical pixels.
 // Keep the original world coordinates, but rasterise at display resolution.
 const dpr=Math.min(3,Math.max(1,window.devicePixelRatio||1));
 const backingWidth=Math.max(1,Math.round(width*dpr));
 const backingHeight=Math.max(1,Math.round(height*dpr));
 if(canvas.width!==backingWidth||canvas.height!==backingHeight){
  canvas.width=backingWidth;canvas.height=backingHeight;
  paint(canvas,data);
 }
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
// Status notices are temporary. Cancel the previous timer so repeated
// actions cannot leave an old message stuck on the canvas.
let statusTimer=null;
function report(message){
 if(statusTimer!==null){clearTimeout(statusTimer);statusTimer=null}
 const value=String(message||'');
 status.textContent=value;
 if(!value)return;
 const duration=/Готовлю|Сохраняю|Загружаю/.test(value)?6500:2400;
 statusTimer=window.setTimeout(()=>{
  status.textContent='';
  statusTimer=null;
 },duration);
}
dialog.addEventListener('close',()=>report(''));
dialog.addEventListener('pointerdown',event=>{
 // Tapping the drawing surface dismisses a stale tip immediately.
 if(event.target===canvas&&status.textContent)report('');
},{passive:true});
function currentTool(){return document.querySelector('[data-paper-tool][aria-pressed=true]')?.dataset.paperTool||'pen'}
function selectTool(name){if(!tools.includes(name))return;
 document.querySelectorAll('[data-paper-tool]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.paperTool===name)));
}
function snapFreehandShape(stroke){
 if(stroke.tool!=='pen'||stroke.points.length<9)return null;
 const pts=stroke.points;
 let x0=W,y0=data.height||H,x1=0,y1=0;
 for(const p of pts){x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])}
 const w=x1-x0,h=y1-y0,diag=Math.hypot(w,h);
 if(diag<54)return null;
 const first=pts[0],last=pts[pts.length-1];
 const closed=Math.hypot(last[0]-first[0],last[1]-first[1])<diag*.18;
 let shape=null,ends=null;
 if(closed&&w>40&&h>40){
  const cx=(x0+x1)/2,cy=(y0+y1)/2;
  const radius=Math.min(w,h)/2;
  const circleError=pts.reduce((total,p)=>total+Math.abs(Math.hypot(p[0]-cx,p[1]-cy)-radius),0)/pts.length;
  const edgeDistance=pts.filter(p=>Math.min(Math.abs(p[0]-x0),Math.abs(p[0]-x1),Math.abs(p[1]-y0),Math.abs(p[1]-y1))<Math.min(w,h)*.07).length/pts.length;
  if(edgeDistance>.87)shape='rect';
  else if(Math.abs(w-h)/Math.max(w,h)<.28&&circleError<radius*.28)shape='circle';
  if(shape)ends=shape==='circle'?[[x0,cy,50,0],[x1,cy,50,0]]:[[x0,y0,50,0],[x1,y1,50,0]];
 }else if(!closed){
  const dx=last[0]-first[0],dy=last[1]-first[1],length=Math.hypot(dx,dy);
  if(length>55){
   const error=pts.reduce((total,p)=>total+Math.abs((p[0]-first[0])*dy-(p[1]-first[1])*dx)/length,0)/pts.length;
   if(error<Math.max(5,length*.035)){shape='line';ends=[first,last]}
  }
 }
 return shape?{...stroke,tool:shape,pressureSensitive:false,points:ends}:null;
}
function point(e){
 const box=canvas.getBoundingClientRect();
 const force=e.pointerType==='pen'&&Number.isFinite(e.pressure)?e.pressure:.5;
 const tilt=e.pointerType==='pen'?Math.hypot(Number(e.tiltX)||0,Number(e.tiltY)||0):0;
 return [inkCoord((e.clientX-box.left)/box.width*W,W),inkCoord((e.clientY-box.top)/box.height*(data.height||H),data.height||H),clamp(force*100,100),clamp(tilt,90)];
}
// Live ink pipeline: draw ONLY the new Bézier segment, keeping previously
// painted pixels intact. Historic strokes are replayed for Undo/export only.
const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,(a[3]+b[3])/2];
function drawLivePart(kind,from,to,control=null,dot=false){
 const ctx=canvas.getContext('2d');if(!ctx||!pending)return;
 ctx.save();ctx.setTransform(canvas.width/W,0,0,canvas.height/(data.height||H),0,0);
 const erase=pending.tool==='eraser';
 ctx.globalCompositeOperation=erase?'destination-out':'source-over';
 ctx.fillStyle=ctx.strokeStyle=erase?'#000':validGradient(pending.gradient)?gradientPaint(ctx,pending.gradient):pending.tool==='pencil'?pending.color+'a3':pending.color;
 ctx.lineWidth=dot?inkWeight(pending,from):(inkWeight(pending,from)+inkWeight(pending,to)+(control?inkWeight(pending,control):0))/(control?3:2);
 ctx.lineJoin='round';ctx.lineCap='round';
 ctx.beginPath();
 if(dot){ctx.arc(from[0],from[1],ctx.lineWidth/2,0,2*Math.PI);ctx.fill()}
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
           prev[1]+(next[1]-prev[1])*step/count,
           prev[2]+(next[2]-prev[2])*step/count,
           prev[3]+(next[3]-prev[3])*step/count];
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
 if(iosFingerInk&&e.pointerType==='touch'&&!e.iosTouchFallback)return;
 if(currentTool()==='lasso')return;
 if(pending||pointerID!==null||e.button!==0||e.isPrimary===false)return;
 if(e.pointerType==='pen')penTime=Date.now()+2800;
 // Large touch contacts are commonly the side of the hand resting on an iPad
 // or Galaxy Tab. Ignore them and any finger while the stylus is nearby.
 if(e.pointerType==='touch'&&(Date.now()<penTime||Math.max(e.width||0,e.height||0)>27))return;
 if(data.strokes.length>=MAX_STROKES){report('Лист заполнен. Начните следующий.');return}
 e.preventDefault();pointerID=e.pointerId;
 pending={tool:currentTool(),color:activeColor,gradient:activeGradient?[...activeGradient]:undefined,width:brushSize,pressureSensitive:e.pointerType==='pen',points:[point(e)]};
 liveTail=pending.points[0];liveMid=null;
 lastInkMotionAt=Date.now();
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
 if(iosFingerInk&&e.pointerType==='touch'&&!e.iosTouchFallback)return;
 if(e.pointerType==='pen')penTime=Date.now()+2800;
 if(!pending||e.pointerId!==pointerID)return;
 e.preventDefault();
 const nextPoint=point(e);
 if(liveTail&&Math.hypot(nextPoint[0]-liveTail[0],nextPoint[1]-liveTail[1])>2)lastInkMotionAt=Date.now();
 if(SHAPE_TOOLS.has(pending.tool)){
  pending.points[1]=nextPoint;queueShapePreview();return;
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
 const snapped=addEndpoint&&pending.tool==='pen'&&Date.now()-lastInkMotionAt>=520?snapFreehandShape(pending):null;
 data.strokes.push(snapped||pending);
 rememberUndo({type:'add',count:1});
 pending=null;pointerID=null;liveTail=null;liveMid=null;changed=true;
 dialog.classList.remove('sv-paper-inking');
 render(Boolean(snapped)); // Snap redraws the one finished freehand line/figure.
}
canvas.addEventListener('pointerdown',down);
canvas.addEventListener('pointermove',move);
canvas.addEventListener('pointerup',e=>{if(!(iosFingerInk&&e.pointerType==='touch'))finishStroke(e,true)});
canvas.addEventListener('pointercancel',e=>{if(!(iosFingerInk&&e.pointerType==='touch'))finishStroke(e,false)});
canvas.addEventListener('lostpointercapture',e=>{if(!(iosFingerInk&&e.pointerType==='touch'))finishStroke(e,false)});
if(iosFingerInk&&sheet){
 // iPhone Safari can cancel or retarget PointerEvents around fullscreen
 // dialogs. TouchEvents reliably follow the original contact instead.
 let finger=null;
 const asInkEvent=t=>({iosTouchFallback:true,pointerType:'touch',pointerId:100000+(t.identifier||0),
  clientX:t.clientX,clientY:t.clientY,button:0,isPrimary:true,width:1,height:1,
  preventDefault(){}});
 const matching=event=>Array.from(event.changedTouches||[]).find(t=>t.identifier===finger);
 sheet.addEventListener('touchstart',event=>{
  if(!dialog.open||finger!==null||event.touches.length!==1)return;
  const t=event.changedTouches[0];if(!t)return;
  finger=t.identifier;const input=asInkEvent(t);
  down(input);
  if(pointerID!==input.pointerId){finger=null;return}
  dialog.dataset.iosInkInput='drawing';event.preventDefault();
 },{capture:true,passive:false});
 sheet.addEventListener('touchmove',event=>{
  if(finger===null)return;
  if(event.touches.length!==1){
   pending=null;pointerID=null;liveTail=null;liveMid=null;finger=null;
   dialog.classList.remove('sv-paper-inking');paint(canvas,data);
   return;
  }
  const t=matching(event);if(!t)return;
  move(asInkEvent(t));event.preventDefault();
 },{capture:true,passive:false});
 const touchFinish=(event,commit)=>{
  if(finger===null)return;
  const t=matching(event);if(!t)return;
  finishStroke(asInkEvent(t),commit);
  finger=null;dialog.dataset.iosInkInput='ready';event.preventDefault();
 };
 sheet.addEventListener('touchend',event=>touchFinish(event,true),{capture:true,passive:false});
 sheet.addEventListener('touchcancel',event=>touchFinish(event,false),{capture:true,passive:false});
 dialog.addEventListener('close',()=>{finger=null});
}
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
 if(!patternMenu.hidden&&!event.target.closest('.paper-pattern-control')&&!event.target.closest('#svPaperNewDock')&&!patternMenu.contains(event.target))closePatternMenu();
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
 if(gradientPreview)gradientPreview.style.setProperty('--sv-gradient-preview','linear-gradient(115deg,'+a+','+b+')');
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

$('notePaperUndo').addEventListener('click',()=>{
 if(!data.strokes.length)return;
 const action=undoStack.pop();
 if(action?.type==='replace')data.strokes=action.previous;
 else if(action?.type==='add')data.strokes.splice(-action.count);
 else data.strokes.pop();
 changed=true;render();report('Последнее действие отменено.');
});
$('notePaperDuplicate')?.addEventListener('click',()=>{
 if(!data.strokes.length||data.strokes.length>=MAX_STROKES)return;
 const last=data.strokes[data.strokes.length-1];
 const copy={...last,points:last.points.map(([x,y,p,t])=>[clamp(x+25,W),clamp(y+25,data.height||H),p,t||0])};
 data.strokes.push(copy);rememberUndo({type:'add',count:1});changed=true;render();report('Последний штрих дублирован.');
});
function open(note=null){
 dialog.classList.remove('sv-paper-inking');
 if(shapeFrame){cancelAnimationFrame(shapeFrame);shapeFrame=0}
 liveTail=null;liveMid=null;
 data=note?.paper?normalize(note.paper):{pattern:'blank',photo:'',background:'dark',height:H,strokes:[]};editID=note?.id||null;changed=false;pending=null;pointerID=null;penTime=0;undoStack=[];returnToList=true;
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
 // Chat handoff: export from the same approved tablet, without creating
 // a second editor or silently saving a Notebook record.
 hasChatContent:()=>Boolean(data.strokes.length||data.photo),
 hasChatChanges:()=>changed,
 getEditGeometry:()=>({width:W,height:data.height||H}),
 getEditableStrokes:indices=>{
  // For live dragging, only clone the affected strokes; unrelated ink stays
  // immutable and shares storage until the edit is committed.
  const selected=Array.isArray(indices)?new Set(indices):null;
  return data.strokes.map((s,i)=>selected&&!selected.has(i)?s:{...s,points:s.points.map(p=>p.slice())});
 },
 previewStrokeEdit:next=>{
  if(!pending&&Array.isArray(next))paint(canvas,{...data,strokes:next});
 },
 isPenNearby:()=>Date.now()<penTime,
 refreshInkResolution:scale=>{
  if(!dialog.open||pending||!sheet)return;
  const width=Math.max(1,sheet.clientWidth),height=Math.max(1,sheet.clientHeight);
  const scaleFactor=Math.min(3,Math.max(1,(window.devicePixelRatio||1)*Math.min(4,Math.max(1,scale||1))),Math.sqrt(9000000/(width*height)));
  const bw=Math.round(width*scaleFactor),bh=Math.round(height*scaleFactor);
  if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;paint(canvas,data)}
 },
 cancelActiveStroke:()=>{
  if(!pending)return;
  if(shapeFrame){cancelAnimationFrame(shapeFrame);shapeFrame=0}
  pending=null;pointerID=null;liveTail=null;liveMid=null;
  dialog.classList.remove('sv-paper-inking');paint(canvas,data);
 },
 applyStrokeEdit:next=>{
  if(pending||!Array.isArray(next)||next.length>MAX_STROKES)return false;
  // Committed ink is immutable: a shallow snapshot makes Undo inexpensive.
  const before=data.strokes.slice();
  data.strokes=normalize({...data,strokes:next}).strokes;
  rememberUndo({type:'replace',previous:before});
  changed=true;render();return true;
 },
 getInkStrokes:()=>data.strokes.filter(s=>(s.tool==='pen'||s.tool==='pencil')&&s.points.length)
  .map(s=>s.points.map(p=>[p[0],p[1],p[2]])),
 exportInkOcrPng:()=>{
  if(!dialog.open||pending)throw Error('Завершите рисование перед распознаванием.');
  const writing=data.strokes.filter(s=>(s.tool==='pen'||s.tool==='pencil')&&s.points.length);
  if(!writing.length)throw Error('На листе пока нет рукописного текста.');
  // Render ink only, preserving erased areas. Convert any color/background to
  // high-contrast black-on-white and crop blank margins for better mobile OCR.
  const raw=document.createElement('canvas');raw.width=W;raw.height=data.height||H;
  const ctx=raw.getContext('2d');
  for(const stroke of data.strokes){
   paintStroke(ctx,{...stroke,color:'#171e29',gradient:undefined});
  }
  let x0=W,y0=raw.height,x1=0,y1=0;
  for(const stroke of writing)for(const p of stroke.points){
   x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);
   y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);
  }
  const left=Math.max(0,Math.floor(x0-32));
  const right=Math.min(W,Math.ceil(x1+32));
  const top=Math.max(0,Math.floor(y0-32));
  const bottom=Math.min(raw.height,Math.ceil(y1+32));
  const w=Math.max(1,right-left),h=Math.max(1,bottom-top);
  const out=document.createElement('canvas');
  const scale=Math.min(2,2600/Math.max(w,h));
  out.width=Math.max(1,Math.round(w*scale));out.height=Math.max(1,Math.round(h*scale));
  const target=out.getContext('2d');target.fillStyle='#fff';target.fillRect(0,0,out.width,out.height);
  target.drawImage(raw,left,top,w,h,0,0,out.width,out.height);
  return out.toDataURL('image/png');
 },
 exportChatPng:async()=>{
  if(!dialog.open)throw Error('Планшет не открыт.');
  if(pending)throw Error('Заверши штрих перед прикреплением.');
  if(!data.strokes.length&&!data.photo)throw Error('Сначала нарисуй мысль.');
  return png(normalize(data));
 },
 closeForChat:()=>{
  if(!dialog.open)return;
  returnToList=false;
  changed=false;
  dialog.close();
 },
 clearSheet:()=>{
  if(pending)return false;
  const hasContent=Boolean(data.strokes.length||data.photo);
  if(hasContent&&!window.confirm('Очистить весь лист? Рисунок и фото будут удалены. Это действие нельзя отменить.'))return false;
  if(!hasContent&&data.pattern==='blank'){report('Лист уже чистый.');return true}
  data.strokes=[];data.photo='';data.pattern='blank';undoStack=[];
  changed=true;render();
  report('Лист очищен.');return true;
 },
 blankPaper:()=>{
  if(pending)return false;
  if(data.pattern==='blank'){report('Уже выбран чистый лист.');return true}
  data.pattern='blank';changed=true;render();report('Выбрана чистая бумага.');return true;
 },
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
