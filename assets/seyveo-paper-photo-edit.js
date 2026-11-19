/* SEYVEO Paper · position and resize a photo on the original page.
   The page engine owns storage, Undo and PNG output. No second canvas. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const sheet=document.getElementById('notePaperSheet');
 const photo=document.getElementById('notePaperPhotoPreview');
 const menu=document.getElementById('notePaperSettingsMenu');
 const actions=menu?.querySelector('[data-sv-menu-panel="actions"]');
 const dock=document.getElementById('svPaperNewDock');
 const paper=window.SEYVEO_PAPER;
 if(!dialog||!sheet||!photo||!actions||!paper?.setPhotoLayout||actions.querySelector('#notePaperEditPhoto'))return;
 const action=document.createElement('button');
 action.type='button';action.id='notePaperEditPhoto';action.className='sv-newdock-menu-action';
 action.setAttribute('aria-label','Переместить или изменить размер фотографии');
 action.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="4.5" width="15" height="15" rx="2.5"/><path d="m8 15 3-3 2.4 2.4 2.8-3.4M15.5 4.5v-2M19.5 8.5h2"/></svg><span>Настроить фото</span>';
 actions.insertBefore(action,actions.querySelector('#notePaperRemovePhoto'));
 const layer=document.createElement('div');layer.className='sv-paper-photo-edit-layer';layer.hidden=true;
 layer.setAttribute('aria-label','Перемещение и размер фотографии');
 const frame=document.createElement('div');frame.className='sv-paper-photo-frame';
 frame.setAttribute('role','group');frame.setAttribute('aria-label','Перетащите фотографию для перемещения');
 const handle=document.createElement('div');handle.className='sv-paper-photo-handle';
 handle.setAttribute('role','button');handle.setAttribute('aria-label','Изменить размер фотографии');
 handle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m8 17 9-9M13 17h4v-4"/></svg>';
 frame.append(handle);
 const hint=document.createElement('div');hint.className='sv-paper-photo-hint';
 const label=document.createElement('span');label.textContent='Двигай фото · угол меняет размер';
 const done=document.createElement('button');done.type='button';done.textContent='Готово';
 done.setAttribute('aria-label','Завершить настройку фотографии');
 hint.append(label,done);layer.append(frame,hint);sheet.append(layer);
 const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const geometry=()=>paper.getEditGeometry();
 const percent=(n,max)=>n/max*100+'%';
 let active=false,gesture=null,layout=null;
 function positionControls(){
  const origin=sheet.getBoundingClientRect().top;
  const bottom=dock?.getBoundingClientRect().bottom||origin+60;
  hint.style.top=Math.max(74,Math.ceil(bottom-origin+14))+'px';
 }
 function bounds(value){
  const g=geometry(),naturalWidth=photo.naturalWidth,naturalHeight=photo.naturalHeight;
  if(!naturalWidth||!naturalHeight)return null;
  const fit=Math.min(g.width/naturalWidth,g.height/naturalHeight)*value.scale;
  const width=naturalWidth*fit,height=naturalHeight*fit;
  return {x:value.x-width/2,y:value.y-height/2,width,height};
 }
 function place(value){
  const b=bounds(value);if(!b)return;
  const g=geometry();
  for(const node of [photo,frame]){
   node.style.left=percent(b.x,g.width);node.style.top=percent(b.y,g.height);
   node.style.width=percent(b.width,g.width);node.style.height=percent(b.height,g.height);
  }
 }
 function refresh(){
  action.hidden=!paper.hasPhoto();
  if(!paper.hasPhoto()){if(active)stopMode();return}
  if(active&&!gesture){layout=paper.getPhotoLayout();place(layout);positionControls()}
 }
 function begin(kind,x,y){
  if(!active||!paper.hasPhoto()||gesture)return;
  const origin=paper.getPhotoLayout();if(!origin||!bounds(origin))return;
  gesture={kind,startX:x,startY:y,origin,moved:false};
  frame.classList.add('sv-paper-photo-moving');
 }
 function progress(x,y){
  if(!gesture)return;
  const rect=sheet.getBoundingClientRect(),g=geometry();
  if(!rect.width||!rect.height)return;
  const dx=(x-gesture.startX)/rect.width*g.width;
  const dy=(y-gesture.startY)/rect.height*g.height;
  if(!gesture.moved&&Math.hypot(x-gesture.startX,y-gesture.startY)<2)return;
  gesture.moved=true;
  const origin=gesture.origin;
  if(gesture.kind==='size'){
   const b=bounds(origin);if(!b)return;
   const vx=b.width/2,vy=b.height/2;
   const factor=1+(dx*vx+dy*vy)/(vx*vx+vy*vy);
   layout={...origin,scale:clamp(origin.scale*factor,.25,3.2)};
  }else layout={...origin,x:clamp(origin.x+dx,32,g.width-32),y:clamp(origin.y+dy,32,g.height-32)};
  place(layout);
 }
 function end(commit){
  if(!gesture)return;
  const moved=gesture.moved;
  gesture=null;frame.classList.remove('sv-paper-photo-moving');
  if(commit&&moved&&layout)paper.setPhotoLayout(layout);
  layout=paper.getPhotoLayout();
  if(layout)place(layout);
 }
 if(isIOS){
  frame.addEventListener('touchstart',event=>{
   if(event.touches.length!==1)return;
   const t=event.touches[0];
   begin(event.target.closest('.sv-paper-photo-handle')?'size':'move',t.clientX,t.clientY);
   if(gesture&&event.cancelable)event.preventDefault();
  },{passive:false});
  frame.addEventListener('touchmove',event=>{
   if(!gesture)return;
   if(event.touches.length!==1){end(false);return}
   const t=event.touches[0];progress(t.clientX,t.clientY);
   if(event.cancelable)event.preventDefault();
  },{passive:false});
  frame.addEventListener('touchend',event=>{
   if(!gesture)return;
   const t=event.changedTouches[0];if(t)progress(t.clientX,t.clientY);
   end(true);if(event.cancelable)event.preventDefault();
  },{passive:false});
  frame.addEventListener('touchcancel',()=>end(false));
 }else{
  frame.addEventListener('pointerdown',event=>{
   if(event.button!==0)return;
   event.preventDefault();event.stopPropagation();
   begin(event.target.closest('.sv-paper-photo-handle')?'size':'move',event.clientX,event.clientY);
   if(gesture)frame.setPointerCapture?.(event.pointerId);
  });
  frame.addEventListener('pointermove',event=>{if(gesture){event.preventDefault();progress(event.clientX,event.clientY)}});
  frame.addEventListener('pointerup',event=>{if(gesture){progress(event.clientX,event.clientY);end(true)}});
  frame.addEventListener('pointercancel',()=>end(false));
  frame.addEventListener('lostpointercapture',()=>end(false));
 }
 function stopMode(){
  if(!active)return;
  end(true);active=false;layer.hidden=true;
  dialog.classList.remove('sv-paper-photo-mode');action.setAttribute('aria-pressed','false');
 }
 function startMode(){
  if(active){stopMode();return}
  if(!paper.hasPhoto())return;
  // Only one editor at once; finish an existing text draft first.
  if(dialog.classList.contains('sv-paper-text-mode'))document.getElementById('notePaperTextAction')?.click();
  paper.cancelActiveStroke?.();
  active=true;layout=paper.getPhotoLayout();layer.hidden=false;
  dialog.classList.add('sv-paper-photo-mode');action.setAttribute('aria-pressed','true');
  positionControls();place(layout);
 }
 action.addEventListener('click',()=>{
  menu.hidden=true;
  document.getElementById('notePaperSettings')?.setAttribute('aria-expanded','false');
  startMode();
 });
 done.addEventListener('click',stopMode);
 dialog.addEventListener('click',event=>{
  if(active&&event.target.closest('#svPaperNewDock [data-paper-tool],#notePaperSave,#notePaperBack,#notePaperSayvi'))stopMode();
 },{capture:true});
 dialog.addEventListener('sv-paper-render',refresh);
 dialog.addEventListener('sv-paper-photo-ready',refresh);
 dialog.addEventListener('close',stopMode);
 window.addEventListener('resize',()=>{if(active){positionControls();if(!gesture)place(layout)}});
 refresh();
})();
