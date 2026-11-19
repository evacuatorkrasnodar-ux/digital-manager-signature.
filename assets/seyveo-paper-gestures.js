/* SEYVEO Paper · two-finger zoom/pan, ink lasso, move/scale/copy.
   Gestures are view-only until the person confirms an ink edit. */
(()=>{
 'use strict';
 const paper=window.SEYVEO_PAPER;
 const dialog=document.getElementById('notePaperDialog');
 const stage=document.getElementById('notePaperStage');
 const sheet=document.getElementById('notePaperSheet');
 const canvas=document.getElementById('notePaperCanvas');
 const settings=document.getElementById('notePaperSettingsMenu');
 if(!paper?.getEditableStrokes||!paper?.applyStrokeEdit||!paper?.cancelActiveStroke||!dialog||!stage||!sheet||!canvas||!settings)return;
 const lassoButton=document.createElement('button');
 lassoButton.type='button';lassoButton.className='sv-newdock-menu-action';
 lassoButton.dataset.paperTool='lasso';lassoButton.setAttribute('aria-pressed','false');
 lassoButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke-dasharray="3 3" d="M5 5c6-4 14 0 14 7S12 21 6 17 6 10 10 11"/><circle cx="10" cy="11" r="1.6" fill="currentColor" stroke="none"/></svg><span>Выделить фрагмент</span>';
 settings.insertBefore(lassoButton,settings.querySelector('.sv-newdock-clear'));
 const overlay=document.createElement('canvas');overlay.className='sv-paper-selection-overlay';
 overlay.setAttribute('aria-hidden','true');sheet.append(overlay);
 const actionBar=document.createElement('div');actionBar.className='sv-paper-selection-actions';
 actionBar.hidden=true;actionBar.setAttribute('role','toolbar');actionBar.setAttribute('aria-label','Действия с выделением');
 actionBar.innerHTML='<button type="button" data-edit="copy" aria-label="Дублировать выделение" title="Копировать"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button><button type="button" data-edit="smaller" aria-label="Уменьшить выделение" title="Уменьшить">−</button><button type="button" data-edit="bigger" aria-label="Увеличить выделение" title="Увеличить">+</button><button type="button" data-edit="done" aria-label="Завершить выделение" title="Готово">✓</button>';
 stage.append(actionBar);
 const zoomBadge=document.createElement('div');zoomBadge.className='sv-paper-zoom-badge';zoomBadge.setAttribute('aria-live','off');zoomBadge.hidden=true;stage.append(zoomBadge);

 const fingers=new Map();let pinch=null,skipTouchUntil=0;
 const zoom={scale:1,x:0,y:0};
 let mode=false,lastTool='pen',selection=null,trace=null,drag=null,frame=0,badgeTimer=0;
 const range=(v,min,max)=>Math.max(min,Math.min(max,v));
 const geometry=()=>paper.getEditGeometry();
 const stageCenter=()=>{const b=stage.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2,width:b.width,height:b.height}};
 const visualPoint=ev=>{const b=canvas.getBoundingClientRect(),g=geometry();return [range((ev.clientX-b.left)/b.width*g.width,0,g.width),range((ev.clientY-b.top)/b.height*g.height,0,g.height)]};
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 function applyZoom(){
  sheet.style.transformOrigin='center center';
  sheet.style.transform=`translate3d(${zoom.x.toFixed(2)}px,${zoom.y.toFixed(2)}px,0) scale(${zoom.scale.toFixed(3)})`;
 }
 function clampZoom(){
  const center=stageCenter();
  zoom.x=range(zoom.x,-(zoom.scale-1)*center.width/2,(zoom.scale-1)*center.width/2);
  zoom.y=range(zoom.y,-(zoom.scale-1)*center.height/2,(zoom.scale-1)*center.height/2);
  if(zoom.scale<=1.001){zoom.scale=1;zoom.x=0;zoom.y=0}
 }
 function showZoom(){
  zoomBadge.textContent=Math.round(zoom.scale*100)+'%';zoomBadge.hidden=false;
  clearTimeout(badgeTimer);badgeTimer=setTimeout(()=>{zoomBadge.hidden=true},1100);
 }
 function startPinch(){
  if(fingers.size<2||paper.isPenNearby())return;
  paper.cancelActiveStroke();paper.previewStrokeEdit?.(paper.getEditableStrokes());trace=null;drag=null;
  const [a,b]=[...fingers.values()].slice(0,2),center=stageCenter();
  const midpoint=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  pinch={distance:Math.max(1,distance(a,b)),scale:zoom.scale,anchorX:(midpoint[0]-center.x-zoom.x)/zoom.scale,anchorY:(midpoint[1]-center.y-zoom.y)/zoom.scale};
  skipTouchUntil=Date.now()+350;
 }
 function movePinch(){
  if(!pinch||fingers.size<2)return;
  const [a,b]=[...fingers.values()].slice(0,2),center=stageCenter();
  const midpoint=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  zoom.scale=range(pinch.scale*distance(a,b)/pinch.distance,1,4);
  zoom.x=midpoint[0]-center.x-pinch.anchorX*zoom.scale;
  zoom.y=midpoint[1]-center.y-pinch.anchorY*zoom.scale;
  clampZoom();applyZoom();showZoom();
 }
 function pointInside(p,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
   const a=polygon[i],b=polygon[j];
   if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
 }
 function strokePath(stroke){
  const pts=stroke.points||[];
  if(pts.length<2)return pts;
  const [x,y]=pts[0],[u,v]=pts[1],dx=u-x,dy=v-y;
  let anchors=null;
  if(stroke.tool==='circle'){
   const cx=(x+u)/2,cy=(y+v)/2,r=Math.hypot(dx,dy)/2;
   return Array.from({length:65},(_,i)=>[cx+Math.cos(i*Math.PI/32)*r,cy+Math.sin(i*Math.PI/32)*r]);
  }
  if(stroke.tool==='rect')anchors=[[x,y],[u,y],[u,v],[x,v],[x,y]];
  else if(stroke.tool==='triangle')anchors=[[(x+u)/2,Math.min(y,v)],[Math.max(x,u),Math.max(y,v)],[Math.min(x,u),Math.max(y,v)],[(x+u)/2,Math.min(y,v)]];
  else if(stroke.tool==='diamond')anchors=[[(x+u)/2,Math.min(y,v)],[Math.max(x,u),(y+v)/2],[(x+u)/2,Math.max(y,v)],[Math.min(x,u),(y+v)/2],[(x+u)/2,Math.min(y,v)]];
  else if(stroke.tool==='line'||stroke.tool==='arrow')anchors=[[x,y],[u,v]];
  if(!anchors)return pts;
  const sampled=[];
  for(let i=1;i<anchors.length;i++){
   const a=anchors[i-1],b=anchors[i],steps=Math.max(1,Math.ceil(distance(a,b)/12));
   for(let j=0;j<steps;j++)sampled.push([a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps]);
  }
  sampled.push(anchors[anchors.length-1]);return sampled;
 }
 function bounds(indices,strokes){
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const id of indices)for(const p of strokePath(strokes[id]||{})){
   x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1]);
  }
  return Number.isFinite(x0)?{x0,y0,x1,y1}:null;
 }
 function drawOverlay(){
  const g=geometry();if(!g)return;
  const neededW=canvas.width,neededH=canvas.height;
  if(overlay.width!==neededW||overlay.height!==neededH){overlay.width=neededW;overlay.height=neededH}
  const ctx=overlay.getContext('2d');
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,overlay.width,overlay.height);
  ctx.setTransform(overlay.width/g.width,0,0,overlay.height/g.height,0,0);
  const unit=Math.max(.8,2/zoom.scale)*(g.width/Math.max(1,canvas.clientWidth));
  ctx.lineWidth=unit;ctx.strokeStyle='#4e84a9';ctx.fillStyle='rgba(80,141,184,.09)';
  ctx.setLineDash([7/zoom.scale,5/zoom.scale]);
  if(trace?.length>1){
   ctx.beginPath();ctx.moveTo(trace[0][0],trace[0][1]);
   for(const p of trace.slice(1))ctx.lineTo(p[0],p[1]);ctx.stroke();
  }
  if(selection){
   const box=bounds(selection.indices,paper.getEditableStrokes([]));
   if(box){
    const dx=drag?.delta?.[0]||0,dy=drag?.delta?.[1]||0,pad=11;
    ctx.beginPath();ctx.rect(box.x0-pad+dx,box.y0-pad+dy,box.x1-box.x0+2*pad,box.y1-box.y0+2*pad);
    ctx.fill();ctx.stroke();
   }
  }
 }
 function clearSelection(){selection=null;trace=null;drag=null;actionBar.hidden=true;drawOverlay()}
 function chooseFromTrace(){
  if(!trace||trace.length<8){trace=null;drawOverlay();return}
  const snapshot=paper.getEditableStrokes([]),chosen=[];
  snapshot.forEach((stroke,index)=>{
   if(stroke.tool==='eraser')return;
   const path=strokePath(stroke),stride=Math.max(1,Math.ceil(path.length/130));
   for(let i=0;i<path.length;i+=stride){if(pointInside(path[i],trace)){chosen.push(index);break}}
  });
  selection=chosen.length?{indices:chosen}:null;trace=null;
  actionBar.hidden=!selection;drawOverlay();
 }
 function moveSelection(dx,dy){
  if(!selection)return;
  const g=geometry(),strokes=paper.getEditableStrokes(selection.indices);
  for(const index of selection.indices){
   strokes[index].points=strokes[index].points.map(p=>[range(p[0]+dx,0,g.width),range(p[1]+dy,0,g.height),...p.slice(2)]);
  }
  if(paper.applyStrokeEdit(strokes))drawOverlay();
 }
 function previewMove(){
  if(!selection||!drag||drag.lasso)return;
  const [dx,dy]=drag.delta,g=geometry(),strokes=paper.getEditableStrokes(selection.indices);
  for(const index of selection.indices){
   strokes[index].points=strokes[index].points.map(p=>[range(p[0]+dx,0,g.width),range(p[1]+dy,0,g.height),...p.slice(2)]);
  }
  paper.previewStrokeEdit?.(strokes);
 }
 function scaleSelection(factor){
  if(!selection)return;
  const g=geometry(),strokes=paper.getEditableStrokes(selection.indices);
  const box=bounds(selection.indices,strokes);if(!box)return;
  const cx=(box.x0+box.x1)/2,cy=(box.y0+box.y1)/2;
  for(const index of selection.indices){
   const s=strokes[index];
   s.points=s.points.map(p=>[range(cx+(p[0]-cx)*factor,0,g.width),range(cy+(p[1]-cy)*factor,0,g.height),...p.slice(2)]);
   if(Number.isFinite(s.width))s.width=range(s.width*factor,1,28);
  }
  if(paper.applyStrokeEdit(strokes))drawOverlay();
 }
 actionBar.addEventListener('click',event=>{
  const key=event.target.closest('[data-edit]')?.dataset.edit;
  if(!key||!selection)return;
  if(key==='done'){clearSelection();return}
  if(key==='smaller'||key==='bigger'){scaleSelection(key==='bigger'?1.2:1/1.2);return}
  if(key==='copy'){
   const strokes=paper.getEditableStrokes([]),copies=selection.indices.map(i=>strokes[i]);
   if(strokes.length+copies.length>250)return;
   const first=strokes.length,g=geometry();
   copies.forEach(s=>strokes.push({...s,points:s.points.map(p=>[range(p[0]+18,0,g.width),range(p[1]+18,0,g.height),...p.slice(2)])}));
   if(paper.applyStrokeEdit(strokes)){
    selection.indices=copies.map((_,i)=>first+i);drawOverlay();
   }
  }
 });

 function setLasso(enabled){
  if(enabled){
   const active=dialog.querySelector('[data-paper-tool][aria-pressed="true"]')?.dataset.paperTool;
   if(active&&active!=='lasso')lastTool=active;
  }
  mode=enabled;
  for(const button of dialog.querySelectorAll('[data-paper-tool]')){
   button.setAttribute('aria-pressed',String(button.dataset.paperTool===(enabled?'lasso':lastTool)));
  }
  if(!enabled)clearSelection();
  lassoButton.setAttribute('aria-pressed',String(mode));
 }
 lassoButton.addEventListener('click',()=>{
  setLasso(!mode);settings.hidden=true;
  document.getElementById('notePaperSettings')?.setAttribute('aria-expanded','false');
 });
 for(const button of dialog.querySelectorAll('[data-paper-tool]')){
  if(button===lassoButton)continue;
  button.addEventListener('click',()=>{if(mode){mode=false;clearSelection();lassoButton.setAttribute('aria-pressed','false')}});
 }

 // Capture before the ink engine: a second finger converts a possible first
 // finger mark into navigation, never accidentally committing it as ink.
 canvas.addEventListener('pointerdown',event=>{
  if(event.pointerType==='touch'&&paper.isPenNearby())return;
  if(event.pointerType==='touch'&&!paper.isPenNearby()){
   fingers.set(event.pointerId,[event.clientX,event.clientY]);
   // Keep both contacts tracked when one finger moves beyond the sheet edge.
   try{canvas.setPointerCapture(event.pointerId)}catch{}
   if(fingers.size===2){startPinch();event.preventDefault();event.stopImmediatePropagation();return}
   if(pinch||Date.now()<skipTouchUntil){event.preventDefault();event.stopImmediatePropagation();return}
  }
  if(!mode||pinch)return;
  event.preventDefault();event.stopImmediatePropagation();
  const p=visualPoint(event),box=selection?bounds(selection.indices,paper.getEditableStrokes([])):null;
  if(box&&p[0]>=box.x0-18&&p[0]<=box.x1+18&&p[1]>=box.y0-18&&p[1]<=box.y1+18){
   drag={id:event.pointerId,start:p,delta:[0,0]};
  }else{clearSelection();trace=[p];drag={id:event.pointerId,lasso:true}}
  try{canvas.setPointerCapture(event.pointerId)}catch{}
 },true);
 canvas.addEventListener('pointermove',event=>{
  if(fingers.has(event.pointerId)){
   fingers.set(event.pointerId,[event.clientX,event.clientY]);
   if(pinch){event.preventDefault();event.stopImmediatePropagation();movePinch();return}
  }
  if(!mode||!drag||drag.id!==event.pointerId)return;
  event.preventDefault();event.stopImmediatePropagation();
  const p=visualPoint(event);
  if(drag.lasso){
   if(distance(trace[trace.length-1],p)>2)trace.push(p);
  }else drag.delta=[p[0]-drag.start[0],p[1]-drag.start[1]];
  if(!frame)frame=requestAnimationFrame(()=>{frame=0;previewMove();drawOverlay()});
 },true);
 function finish(event){
  if(fingers.has(event.pointerId)){
   fingers.delete(event.pointerId);
   if(pinch){
    event.preventDefault();event.stopImmediatePropagation();
    if(fingers.size<2){pinch=null;skipTouchUntil=Date.now()+350;paper.refreshInkResolution?.(zoom.scale);drawOverlay()}
    return;
   }
  }
  if(!mode||!drag||drag.id!==event.pointerId)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(drag.lasso)chooseFromTrace();
  else{
   const [dx,dy]=drag.delta;
   if(Math.hypot(dx,dy)>2)moveSelection(dx,dy);
   else paper.previewStrokeEdit?.(paper.getEditableStrokes());
  }
  drag=null;drawOverlay();
 }
 canvas.addEventListener('pointerup',finish,true);
 canvas.addEventListener('pointercancel',finish,true);
 canvas.addEventListener('lostpointercapture',finish,true);
 dialog.addEventListener('close',()=>{
  fingers.clear();pinch=null;setLasso(false);
  zoom.scale=1;zoom.x=0;zoom.y=0;applyZoom();
  zoomBadge.hidden=true;
 });
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(dialog.open)drawOverlay()}).observe(stage);
 document.getElementById('notePaperUndo')?.addEventListener('click',()=>requestAnimationFrame(()=>{
  if(selection&&selection.indices.some(i=>i>=paper.getEditableStrokes().length))clearSelection();
  else drawOverlay();
 }));
})();
