/* SEYVEO Notebook · dedicated handwriting page.
 * Keeps original vector strokes in the existing Notebook storage schema.
 * Does not modify the full-featured painting canvas (SEYVEO_PAPER). */
(()=>{
 'use strict';
 if(window.SEYVEO_HANDWRITING)return;
 const W=840,H=1188,MAX_STROKES=220,MAX_POINTS=1300,MAX_BYTES=340000;
 const root=document.createElement('dialog');
 root.id='svHandwritingDialog';root.className='sv-handwriting-dialog';
 root.setAttribute('aria-labelledby','svHandwritingHeading');
 root.innerHTML=`
  <header class="sv-hw-header">
   <button type="button" class="sv-hw-back" aria-label="Назад к блокноту"><svg viewBox="0 0 24 24"><path d="m14.5 5-7 7 7 7"/></svg></button>
   <h2 id="svHandwritingHeading">От руки</h2>
   <div class="sv-hw-nav">
    <button type="button" data-hw-action="undo" aria-label="Отменить штрих" disabled><svg viewBox="0 0 24 24"><path d="m9.4 7.2-5 5 5 5M4.6 12.2h8.7a5.6 5.6 0 0 1 0 11.2"/></svg></button>
    <button type="button" data-hw-action="redo" aria-label="Вернуть штрих" disabled><svg viewBox="0 0 24 24"><path d="m14.6 7.2 5 5-5 5m4.8-5H10.7a5.6 5.6 0 0 0 0 11.2"/></svg></button>
    <button type="button" data-hw-action="save" class="sv-hw-done" aria-label="Готово — сохранить рукописную заметку"><svg viewBox="0 0 24 24"><path d="m4.8 12.1 5 4.7 9.5-10"/></svg></button>
   </div>
  </header>
  <main class="sv-hw-main">
   <input id="svHandwritingTitle" class="sv-hw-title" type="text" maxlength="120" placeholder="Название заметки" aria-label="Название заметки" autocomplete="off">
   <div class="sv-hw-stage" aria-label="Рукописный лист">
    <canvas id="svHandwritingCanvas" width="840" height="1188" aria-label="Пишите пальцем или стилусом"></canvas>
   </div>
  </main>
  <footer class="sv-hw-footer">
   <div class="sv-hw-tools" role="toolbar" aria-label="Инструменты рукописной заметки">
    <button type="button" data-hw-tool="pen" aria-label="Ручка" aria-pressed="true"><svg viewBox="0 0 24 24"><path d="M3.7 18.2c2.2-1.6 4.3-7.7 6.4-7.7 2.4 0 .7 5.8 2.9 5.8 1.6 0 2.5-2.8 4-2.8M16.4 6.7l2.5-2.5 1.9 1.9-2.5 2.5-3.1 1z"/></svg></button>
    <button type="button" data-hw-tool="eraser" aria-label="Ластик" aria-pressed="false"><svg viewBox="0 0 24 24"><path d="m4.1 14.7 9.1-9.1a2.3 2.3 0 0 1 3.2 0l3.1 3.1a2.3 2.3 0 0 1 0 3.2l-7.8 7.8H8.5zM9.2 9.6l7.4 7.4M12 19.7h8"/></svg></button>
    <label class="sv-hw-width" aria-label="Толщина ручки"><svg viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18" stroke-width="1.5"/><circle cx="11" cy="12" r="3.3" fill="currentColor" stroke="none"/></svg><input type="range" min="2" max="11" step="1" value="5" aria-label="Толщина линии"></label>
    <button type="button" data-hw-action="lines" aria-label="Линованный лист" aria-pressed="false"><svg viewBox="0 0 24 24"><path d="M5 5h14M5 10h14M5 15h14M5 20h14"/></svg></button>
   </div>
  </footer>
  <p class="sv-hw-status" role="status" aria-live="polite" hidden></p>`;
 document.body.append(root);
 const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
 const stage=root.querySelector('.sv-hw-stage');
 const title=root.querySelector('#svHandwritingTitle');
 const status=root.querySelector('.sv-hw-status');
 const widthControl=root.querySelector('input[type="range"]');
 const toolButtons=[...root.querySelectorAll('[data-hw-tool]')];
 const action=name=>root.querySelector(`[data-hw-action="${name}"]`);
 let strokes=[],redoStack=[],activeStroke=null,activePointer=null;
 let noteId=null,dirty=false,tool='pen',lineSize=5,pattern='blank',returnToNotes=true;

 function notice(message=''){
  status.textContent=message;status.hidden=!message;
 }
 function syncControls(){
  action('undo').disabled=!strokes.length;
  action('redo').disabled=!redoStack.length;
  toolButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.hwTool===tool)));
  action('lines').setAttribute('aria-pressed',String(pattern==='lines'));
  stage.classList.toggle('is-ruled',pattern==='lines');
 }
 function resize(){
  if(!root.open)return;
  const bounds=stage.getBoundingClientRect();
  if(!bounds.width||!bounds.height)return;
  const scale=Math.min(bounds.width/W,bounds.height/H);
  canvas.style.width=Math.floor(W*scale)+'px';
  canvas.style.height=Math.floor(H*scale)+'px';
 }
 function paintOne(stroke){
  const points=stroke?.points;if(!points?.length)return;
  ctx.save();
  ctx.globalCompositeOperation=stroke.tool==='eraser'?'destination-out':'source-over';
  ctx.strokeStyle=ctx.fillStyle='#171e29';
  ctx.lineWidth=stroke.width;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
  if(points.length===1){ctx.arc(points[0][0],points[0][1],stroke.width/2,0,Math.PI*2);ctx.fill()}
  else if(points.length===2){ctx.lineTo(points[1][0],points[1][1]);ctx.stroke()}
  else{
   const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
   const first=midpoint(points[0],points[1]);ctx.lineTo(first[0],first[1]);
   for(let i=1;i<points.length-1;i++){
    const next=midpoint(points[i],points[i+1]);
    ctx.quadraticCurveTo(points[i][0],points[i][1],next[0],next[1]);
   }
   ctx.lineTo(...points[points.length-1].slice(0,2));ctx.stroke();
  }
  ctx.restore();
 }
 function render(){
  ctx.clearRect(0,0,W,H);
  strokes.forEach(paintOne);if(activeStroke)paintOne(activeStroke);
  syncControls();
 }
 function point(event){
  const rect=canvas.getBoundingClientRect();
  const x=(event.clientX-rect.left)*W/rect.width;
  const y=(event.clientY-rect.top)*H/rect.height;
  return [Math.round(Math.max(0,Math.min(W,x))*10)/10,
   Math.round(Math.max(0,Math.min(H,y))*10)/10,
   Math.max(1,Math.min(100,Math.round((event.pressure||.5)*100)))];
 }
 function finishStroke(event){
  if(!activeStroke||activePointer===null||event&&event.pointerId!==activePointer)return;
  if(activeStroke.points.length&&strokes.length<MAX_STROKES){
   strokes.push(activeStroke);redoStack=[];dirty=true;
  }
  activeStroke=null;activePointer=null;render();
 }
 canvas.addEventListener('pointerdown',event=>{
  if(activePointer!==null||event.isPrimary===false||event.button>0)return;
  if(strokes.length>=MAX_STROKES){notice('На листе слишком много штрихов. Сохраните запись.');return}
  if(!canvas.getBoundingClientRect().width)return;
  event.preventDefault();notice('');
  activePointer=event.pointerId;
  activeStroke={tool:tool==='eraser'?'eraser':'pen',
   color:'#171e29',width:tool==='eraser'?34:lineSize,points:[point(event)]};
  try{canvas.setPointerCapture(event.pointerId)}catch{}
  render();
 });
 canvas.addEventListener('pointermove',event=>{
  if(!activeStroke||activePointer!==event.pointerId)return;
  event.preventDefault();
  const next=point(event),last=activeStroke.points.at(-1);
  if(Math.hypot(next[0]-last[0],next[1]-last[1])<1.1)return;
  if(activeStroke.points.length<MAX_POINTS)activeStroke.points.push(next);
  render();
 });
 canvas.addEventListener('pointerup',finishStroke);
 canvas.addEventListener('pointercancel',finishStroke);
 canvas.addEventListener('lostpointercapture',finishStroke);
 function undo(){if(!strokes.length||activeStroke)return;redoStack.push(strokes.pop());dirty=true;render()}
 function redo(){if(!redoStack.length||activeStroke)return;strokes.push(redoStack.pop());dirty=true;render()}
 action('undo').addEventListener('click',undo);
 action('redo').addEventListener('click',redo);
 action('lines').addEventListener('click',()=>{pattern=pattern==='lines'?'blank':'lines';dirty=true;syncControls()});
 toolButtons.forEach(button=>button.addEventListener('click',()=>{tool=button.dataset.hwTool;syncControls()}));
 widthControl.addEventListener('input',()=>{lineSize=Number(widthControl.value)||5});
 title.addEventListener('input',()=>{dirty=true});

 function save(){
  finishStroke();
  if(!strokes.length){notice('Напишите что-нибудь на листе.');return false}
  const api=window.SEYVEO_NOTES_API;
  if(!api){notice('Блокнот ещё не загрузился.');return false}
  const existing=api.getNotes();
  const paper={pattern,background:'light',height:H,strokes:strokes.map(stroke=>({
   tool:stroke.tool,color:stroke.color,width:stroke.width,
   points:stroke.points.map(pt=>pt.slice())})),texts:[]};
  if(JSON.stringify(paper).length>MAX_BYTES){notice('Лист слишком большой. Сохраните его частями.');return false}
  const name=title.value.trim()||'Рукописная заметка',now=Date.now();
  const old=noteId?existing.find(note=>note.id===noteId):null;
  if(noteId&&!old){notice('Запись больше не найдена. Сохранение отменено.');return false}
  const entry={...old,id:old?.id||String(now)+'-hw-'+Math.random().toString(36).slice(2),
   text:name,title:name,noteKind:'handwriting',paper,
   createdAt:old?.createdAt||now,updatedAt:now};
  const next=old?existing.map(note=>note.id===old.id?entry:note):[entry,...existing];
  if(!api.putNotes(next)){notice('Не удалось сохранить лист. Проверьте память устройства.');return false}
  dirty=false;root.close();return true;
 }
 action('save').addEventListener('click',save);
 function back(){
  finishStroke();
  if(dirty&&!window.confirm('Закрыть рукописный лист без сохранения?'))return;
  dirty=false;root.close();
 }
 root.querySelector('.sv-hw-back').addEventListener('click',back);
 root.addEventListener('cancel',event=>{if(dirty&&!window.confirm('Закрыть лист без сохранения?'))event.preventDefault();else dirty=false});
 root.addEventListener('close',()=>{activeStroke=null;activePointer=null;if(returnToNotes){returnToNotes=false;window.SEYVEO_NOTES_API?.openNotes()}});
 root.addEventListener('keydown',event=>{
  if(!(event.ctrlKey||event.metaKey)||event.altKey)return;
  const key=event.key.toLowerCase();
  if(key==='z'){event.preventDefault();event.shiftKey?redo():undo()}
  else if(key==='s'){event.preventDefault();save()}
 });
 window.addEventListener('resize',resize);
 window.visualViewport?.addEventListener('resize',resize);
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
 observer?.observe(stage);
 function open(note=null){
  if(root.open)return;
  if(note&&note.noteKind!=='handwriting')return;
  noteId=note?.id||null;pattern=note?.paper?.pattern==='lines'?'lines':'blank';
  strokes=Array.isArray(note?.paper?.strokes)?note.paper.strokes.map(stroke=>({
   tool:stroke.tool==='eraser'?'eraser':'pen',color:'#171e29',
   width:Number.isFinite(stroke.width)?stroke.width:5,
   points:Array.isArray(stroke.points)?stroke.points.map(pt=>pt.slice(0,3)):[]
  })):[];
  redoStack=[];activeStroke=null;activePointer=null;dirty=false;tool='pen';lineSize=5;
  widthControl.value='5';title.value=note?.title||'';returnToNotes=true;notice('');
  root.showModal();requestAnimationFrame(()=>{resize();render()});
 }
 window.SEYVEO_HANDWRITING=Object.freeze({open});
})();
