/* SEYVEO · handoff from Sayvi chat to the approved Notebook tablet.
 * This adds no new editor. The existing Paper canvas, tools, color picker,
 * stylus pressure and rendering stay owned by notebook-paper.js.
 * Only Save and Back are routed to the chat while explicitly in chat mode.
 */
(()=>{
 'use strict';
 const HANDOFF='seyveo.sayvi.paper-handoff.v1';
 const MAX_AGE=15*60*1000;
 if(new URLSearchParams(location.search).get('seyveo-draw')!=='chat')return;
 let handoff=null;
 try{handoff=JSON.parse(sessionStorage.getItem(HANDOFF)||'null')}catch{}
 if(!handoff||handoff.state!=='open'||!Number.isFinite(handoff.at)||
   Date.now()-handoff.at>MAX_AGE||handoff.at>Date.now()+60000)return;

 const dialog=document.getElementById('notePaperDialog');
 const save=document.getElementById('notePaperSave');
 const back=document.getElementById('notePaperBack');
 const cancel=document.getElementById('notePaperCancel');
 const status=document.getElementById('notePaperStatus');
 const paper=window.SEYVEO_PAPER;
 if(!dialog||!save||!back||!paper?.open||!paper?.exportChatPng||!paper?.closeForChat)return;
 let active=false,busy=false,navigating=false;
 function report(value){if(status)status.textContent=value;}
 function returnToChat(state,ref){
  if(navigating)return;
  try{
   sessionStorage.setItem(HANDOFF,JSON.stringify({
    at:Date.now(),state,draft:typeof handoff.draft==='string'?handoff.draft.slice(0,8000):'',
    ...(ref?{ref}:{})
   }));
  }catch{}
  navigating=true;
  try{paper.closeForChat();}catch{}
  location.assign('./sayvi-chat-new.html');
 }
 function onBack(event){
  if(!active)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(busy)return;
  if(paper.hasChatChanges?.()&&
     !window.confirm('Закрыть планшет без прикрепления рисунка?'))return;
  returnToChat('cancelled');
 }
 async function onSave(event){
  if(!active)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(busy)return;
  if(!paper.hasChatContent?.()){
   report('Сначала нарисуй мысль, затем нажми галочку.');return;
  }
  if(!window.SEYVEO_CHAT_FILES?.remember){
   report('Хранилище рисунков недоступно. Попробуй обновить страницу.');return;
  }
  busy=true;save.disabled=true;
  try{
   const encoded=await paper.exportChatPng();
   if(typeof encoded!=='string'||!encoded.startsWith('data:image/png;base64,'))
    throw Error('Не удалось подготовить PNG.');
   const base64=encoded.slice(encoded.indexOf(',')+1);
   const binary=atob(base64);
   const bytes=new Uint8Array(binary.length);
   for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   const file=new File([bytes],'Рисунок SEYVEO.png',{type:'image/png'});
   const refs=await window.SEYVEO_CHAT_FILES.remember([file]);
   const ref=refs?.[file.name];
   if(!ref)throw Error('Не удалось временно сохранить рисунок на устройстве.');
   returnToChat('ready',ref);
  }catch(error){
   report(error?.message||'Не удалось прикрепить рисунок. Попробуй снова.');
   busy=false;save.disabled=false;
  }
 }
 // Capture events before Notebook's normal Save/Back listeners. Chat drawings
 // must never silently create a Notebook note.
 save.addEventListener('click',onSave,true);
 back.addEventListener('click',onBack,true);
 cancel?.addEventListener('click',onBack,true);
 dialog.addEventListener('cancel',onBack,true);
 dialog.addEventListener('close',()=>{
  if(active&&!navigating)returnToChat('cancelled');
 });
 try{
  paper.open();
  if(!dialog.open)throw Error('Планшет не открылся.');
  active=true;
  back.setAttribute('aria-label','Вернуться в чат Сэйви');
  save.setAttribute('aria-label','Прикрепить рисунок к чату Сэйви');
  save.title='Прикрепить в чат';
 }catch(error){
  report(error?.message||'Не удалось открыть планшет.');
  returnToChat('cancelled');
 }
})();