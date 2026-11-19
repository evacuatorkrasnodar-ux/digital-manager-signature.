/* SEYVEO Paper · editable typed text on the same vector sheet.
   The real canvas/storage stays owned by notebook-paper.js. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const sheet=document.getElementById('notePaperSheet');
 const menu=document.getElementById('notePaperSettingsMenu');
 const actions=menu?.querySelector('[data-sv-menu-panel="actions"]');
 const paper=window.SEYVEO_PAPER;
 if(!dialog||!sheet||!actions||!paper?.addTextObject||actions.querySelector('#notePaperTextAction'))return;
 const icon=paths=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
 const action=document.createElement('button');
 action.type='button';action.id='notePaperTextAction';action.className='sv-newdock-menu-action';
 action.innerHTML=icon('<path d="M4 6h16M12 6v14M8 20h8M7 6v3M17 6v3"/>')+'<span>Добавить текст</span>';
 action.setAttribute('aria-label','Напечатать текст на листе');
 actions.insertBefore(action,actions.querySelector('#notePaperAddPhoto'));

 const layer=document.createElement('div');
 layer.className='sv-paper-text-layer';layer.hidden=true;
 layer.setAttribute('aria-label','Редактирование печатного текста');
 sheet.append(layer);
 const hint=document.createElement('div');hint.className='sv-paper-text-hint';
 const hintLabel=document.createElement('span');hintLabel.textContent='Коснись листа, чтобы добавить текст';
 const hintDone=document.createElement('button');hintDone.type='button';hintDone.textContent='Готово';
 hintDone.setAttribute('aria-label','Завершить работу с текстом');
 hint.append(hintLabel,hintDone);layer.append(hint);
 const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 let active=false,editor=null,toolbar=null,draft=null,editingIndex=-1,boxes=[];
 const geometry=()=>paper.getEditGeometry();
 const toCss=(value,max)=>value/max*100+'%';
 // Safari auto-zooms the entire page when a focused textarea is below 16px.
 const pxFont=size=>Math.max(16,size*sheet.clientWidth/geometry().width)+'px';
 const point=(clientX,clientY)=>{
  const rect=sheet.getBoundingClientRect(),g=geometry();
  return {x:Math.max(0,Math.min(g.width-140,Math.round((clientX-rect.left)/rect.width*g.width))),
   y:Math.max(0,Math.min(g.height-120,Math.round((clientY-rect.top)/rect.height*g.height)))};
 };
 function place(node,item){
  const g=geometry();
  node.style.left=toCss(item.x,g.width);
  node.style.top=toCss(item.y,g.height);
  node.style.width=toCss(Math.min(item.width,g.width-item.x),g.width);
  node.style.fontSize=pxFont(item.size);
  node.style.color=item.color;
  node.style.setProperty('--sv-paper-text-item-color',item.color);
 }
 function clearBoxes(){for(const node of boxes)node.remove();boxes=[]}
 function stopEditor(commit){
  if(!editor)return;
  if(commit){
   const text=editor.value.trim();
   if(text){
    const item={...draft,text};
    if(editingIndex<0)paper.addTextObject(item);
    else paper.updateTextObject(editingIndex,item);
   }else if(editingIndex>=0)paper.removeTextObject(editingIndex);
  }
  editor.remove();toolbar?.remove();editor=null;toolbar=null;draft=null;editingIndex=-1;
  paper.setTextEditing(-1);
  if(active){hint.hidden=false;renderBoxes()}
 }
 function autoHeight(){
  if(!editor)return;
  editor.style.height='auto';
  editor.style.height=Math.max(44,Math.min(sheet.clientHeight*.52,editor.scrollHeight+4))+'px';
 }
 function openEditor(index,position){
  if(editor)stopEditor(true);
  const objects=paper.getTextObjects();
  editingIndex=Number.isInteger(index)?index:-1;
  draft=editingIndex>=0?{...objects[editingIndex]}:{
   text:'',x:position.x,y:position.y,size:44,width:Math.min(520,geometry().width-position.x),
   color:(()=>{
    const current=paper.getInkColor()||'#171e29';
    if(paper.getBackground()==='light'&&current==='#f6f7fb')return '#171e29';
    if(paper.getBackground()==='dark'&&current==='#171e29')return '#f6f7fb';
    return current;
   })()};
  if(!draft)return;
  hint.hidden=true;
  paper.setTextEditing(editingIndex);
  clearBoxes();
  editor=document.createElement('textarea');
  editor.className='sv-paper-text-editor';
  editor.setAttribute('aria-label','Текст на листе');
  editor.setAttribute('placeholder','Введите текст');
  editor.setAttribute('maxlength','500');
  editor.setAttribute('spellcheck','true');
  editor.setAttribute('autocapitalize','sentences');
  editor.value=draft.text;
  place(editor,draft);
  layer.append(editor);
  toolbar=document.createElement('div');toolbar.className='sv-paper-text-controls';
  toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Настройки текста');
  const minus=document.createElement('button');minus.type='button';minus.textContent='A−';minus.setAttribute('aria-label','Уменьшить текст');
  const plus=document.createElement('button');plus.type='button';plus.textContent='A+';plus.setAttribute('aria-label','Увеличить текст');
  const color=document.createElement('button');color.type='button';color.className='sv-paper-text-color';color.setAttribute('aria-label','Применить выбранный цвет из палитры');color.title='Цвет из палитры';
  const done=document.createElement('button');done.type='button';done.className='sv-paper-text-done';done.textContent='Готово';
  const remove=document.createElement('button');remove.type='button';remove.className='sv-paper-text-remove';remove.setAttribute('aria-label','Удалить текст');
  remove.innerHTML=icon('<path d="M4.5 7h15M9 7V4.5h6V7M7 7l.8 12.5h8.4L17 7M10 10.5v6M14 10.5v6"/>');
  toolbar.append(minus,plus,color,done,remove);layer.append(toolbar);
  const syncColor=()=>{color.style.setProperty('--sv-text-color',draft.color)};
  const resize=step=>{
   draft.size=Math.max(24,Math.min(104,draft.size+step));
   place(editor,draft);autoHeight();editor.focus({preventScroll:true});
  };
  minus.addEventListener('click',()=>resize(-8));plus.addEventListener('click',()=>resize(8));
  color.addEventListener('click',()=>{
   draft.color=paper.getInkColor()||draft.color;
   place(editor,draft);syncColor();editor.focus({preventScroll:true});
  });
  done.addEventListener('click',()=>stopEditor(true));
  remove.addEventListener('click',()=>{
   if(editingIndex>=0)paper.removeTextObject(editingIndex);
   stopEditor(false);
  });
  editor.addEventListener('input',autoHeight);
  editor.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();stopEditor(false)}
   else if(event.key==='Enter'&&(event.metaKey||event.ctrlKey)){event.preventDefault();stopEditor(true)}
  });
  syncColor();autoHeight();
  editor.focus({preventScroll:true});
 }
 function bindTextBox(box,index,item){
  let start=null,dragged=false,origin=null;
  function begin(x,y){
   if(editor)stopEditor(true);
   start={x,y};origin={...item};dragged=false;
  }
  function progress(x,y){
   if(!start)return;
   if(!dragged&&Math.hypot(x-start.x,y-start.y)<7)return;
   if(!dragged){dragged=true;paper.setTextEditing(index);box.classList.add('sv-paper-text-dragging')}
   const g=geometry(),rect=sheet.getBoundingClientRect();
   const dx=(x-start.x)/rect.width*g.width,dy=(y-start.y)/rect.height*g.height;
   place(box,{...origin,x:Math.max(0,Math.min(g.width-140,origin.x+dx)),y:Math.max(0,Math.min(g.height-120,origin.y+dy))});
  }
  function end(x,y){
   if(!start)return;
   if(dragged){
    const g=geometry(),rect=sheet.getBoundingClientRect();
    const next={x:Math.max(0,Math.min(g.width-140,Math.round(origin.x+(x-start.x)/rect.width*g.width))),
     y:Math.max(0,Math.min(g.height-120,Math.round(origin.y+(y-start.y)/rect.height*g.height)))};
    paper.updateTextObject(index,next);
    paper.setTextEditing(-1);
    renderBoxes();
   }else openEditor(index);
   start=null;origin=null;
  }
  if(isIOS){
   box.addEventListener('touchstart',event=>{if(event.touches.length!==1)return;const t=event.touches[0];begin(t.clientX,t.clientY)},{passive:true});
   box.addEventListener('touchmove',event=>{if(!start||event.touches.length!==1)return;const t=event.touches[0];progress(t.clientX,t.clientY);if(dragged)event.preventDefault()},{passive:false});
   box.addEventListener('touchend',event=>{if(!start)return;const t=event.changedTouches[0];if(t){const wasDragged=dragged;end(t.clientX,t.clientY);if(wasDragged)event.preventDefault()}},{passive:false});
   box.addEventListener('touchcancel',()=>{start=null;origin=null;paper.setTextEditing(-1);renderBoxes()});
  }else{
   box.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();begin(event.clientX,event.clientY);box.setPointerCapture?.(event.pointerId)});
   box.addEventListener('pointermove',event=>{if(start){event.preventDefault();progress(event.clientX,event.clientY)}});
   box.addEventListener('pointerup',event=>{if(start){event.preventDefault();end(event.clientX,event.clientY)}});
   box.addEventListener('pointercancel',()=>{start=null;origin=null;paper.setTextEditing(-1);renderBoxes()});
  }
  // A tap is handled in touchend/pointerup, never duplicated by click.
  box.addEventListener('click',event=>event.stopPropagation());
 }
 function renderBoxes(){
  if(!active||editor)return;
  hint.hidden=false;
  clearBoxes();
  paper.getTextObjects().forEach((item,index)=>{
   const box=document.createElement('button');box.type='button';
   box.className='sv-paper-text-hit';
   box.textContent=item.text;
   box.setAttribute('aria-label','Изменить или переместить текст: '+item.text.slice(0,45));
   place(box,item);layer.append(box);boxes.push(box);bindTextBox(box,index,item);
  });
 }
 function stopMode(){
  if(!active)return;
  stopEditor(true);active=false;layer.hidden=true;clearBoxes();
  dialog.classList.remove('sv-paper-text-mode');action.setAttribute('aria-pressed','false');
  paper.setTextEditing(-1);
 }
 hintDone.addEventListener('click',stopMode);
 function startMode(){
  if(active){stopMode();return}
  active=true;layer.hidden=false;dialog.classList.add('sv-paper-text-mode');
  action.setAttribute('aria-pressed','true');renderBoxes();
 }
 action.addEventListener('click',()=>{
  const settings=document.getElementById('notePaperSettings');
  menu.hidden=true;settings?.setAttribute('aria-expanded','false');startMode();
 });
 layer.addEventListener('click',event=>{
  if(!active||event.target!==layer)return;
  openEditor(-1,point(event.clientX,event.clientY));
 });
 dialog.addEventListener('click',event=>{
  if(!active)return;
  if(event.target.closest('#svPaperNewDock [data-paper-tool],#notePaperSave,#notePaperBack,#notePaperSayvi'))stopMode();
 },{capture:true});
 dialog.addEventListener('click',event=>{
  if(!active||!editor||!event.target.closest('[data-paper-color]'))return;
  requestAnimationFrame(()=>{
   if(!editor||!draft)return;
   draft.color=paper.getInkColor()||draft.color;
   place(editor,draft);
   toolbar?.querySelector('.sv-paper-text-color')?.style.setProperty('--sv-text-color',draft.color);
  });
 });
 dialog.addEventListener('sv-paper-render',()=>{if(active&&!editor)renderBoxes()});
 dialog.addEventListener('close',()=>{
  if(editor)stopEditor(false);
  active=false;layer.hidden=true;clearBoxes();dialog.classList.remove('sv-paper-text-mode');
  action.setAttribute('aria-pressed','false');paper.setTextEditing(-1);
 });
 window.addEventListener('resize',()=>{if(active){if(editor){place(editor,draft);autoHeight()}else renderBoxes()}});
})();
