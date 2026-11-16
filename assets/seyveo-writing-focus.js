/* SEYVEO · One-tap writing focus for all in-page editors.
 * A real Write/Edit/Reply tap focuses the newly opened text field before the
 * trusted click finishes. On iOS this is essential for the native keyboard.
 * No polling, focus stealing, layout changes or simulated keyboard events. */
(()=>{
 'use strict';
 if(window.SEYVEO_WRITING_FOCUS)return;
 const editableSelector=[
  'textarea','input:not([type])','input[type="text"]','input[type="email"]',
  'input[type="url"]','input[type="tel"]','[contenteditable="true"]'
 ].join(',');
 const snapshots=new WeakMap();
 const visible=element=>{
  if(!element?.isConnected||element.disabled||element.readOnly||
     element.closest('[hidden],[inert]'))return false;
  const style=getComputedStyle(element);
  return style.display!=='none'&&style.visibility!=='hidden'&&
   element.getClientRects().length>0;
 };
 const fields=()=>Array.from(document.querySelectorAll(editableSelector)).filter(visible);
 const intent=button=>{
  if(!button||button.disabled)return false;
  if(['edit','reply','write'].includes(button.dataset.cardAction))return true;
  const label=(button.getAttribute('aria-label')||button.textContent||'')
   .trim().toLocaleLowerCase('ru-RU').replace(/\s+/g,' ');
  return /^(?:написать|исправить|редактировать|ответить|продолжить черновик|новое письмо|создать заметку)(?:\s|$|[.:])/u.test(label)&&
   !/^(?:исправить|редактировать)\s+(?:дату|время|срок|цвет|размер)/u.test(label);
 };
 const focusField=element=>{
  if(!visible(element)||document.activeElement===element)return false;
  try{element.focus({preventScroll:true});}catch{element.focus();}
  if(document.activeElement!==element)return false;
  if(typeof element.setSelectionRange==='function'){
   const end=element.value?.length||0;
   try{element.setSelectionRange(end,end);}catch{}
  }else if(element.isContentEditable&&document.createRange&&window.getSelection){
   const range=document.createRange(),selection=window.getSelection();
   range.selectNodeContents(element);range.collapse(false);
   selection?.removeAllRanges();selection?.addRange(range);
  }
  return true;
 };
 const priority=(items,button)=>{
  const activeDialog=document.querySelector('dialog[open]');
  if(activeDialog){const inDialog=items.find(item=>activeDialog.contains(item));if(inDialog)return inDialog;}
  const parent=button.closest('.lm-field,.sv-card-system,.svmail,#svcpWorkChatScreen,#sayviComposer');
  if(parent){const nearby=items.find(item=>parent.contains(item));if(nearby)return nearby;}
  return items[0];
 };
 // Capture only the before-state. The normal button handlers are free to
 // reveal their existing editor; bubble runs afterwards in the SAME click.
 document.addEventListener('click',event=>{
  if(event.isTrusted===false)return;
  const button=event.target.closest?.('button,[role="button"]');
  if(!intent(button))return;
  snapshots.set(event,{button,before:new Set(fields())});
 },true);
 document.addEventListener('click',event=>{
  const snapshot=snapshots.get(event);
  if(!snapshot)return;
  snapshots.delete(event);
  const after=fields();
  const revealed=after.filter(item=>!snapshot.before.has(item));
  const label=(snapshot.button.getAttribute('aria-label')||snapshot.button.textContent||'')
   .trim().toLocaleLowerCase('ru-RU');
  const replying=label.startsWith('ответить');
  if(after.includes(document.activeElement)&&
     ((!revealed.length&&!replying)||revealed.includes(document.activeElement)))return;
  if(revealed.length){focusField(priority(revealed,snapshot.button));return;}
  // Reply in either chat can reuse a composer that was already on screen.
  if(!replying)return;
  const chat=snapshot.button.closest('#svcpWorkChatScreen')?
   document.getElementById('svcpChatInput'):
   snapshot.button.closest('#sayviMessages,#sayviComposer')?
    document.getElementById('sayviInput'):null;
  if(chat)focusField(chat);
 },false);
 window.SEYVEO_WRITING_FOCUS=Object.freeze({version:1});
})();
