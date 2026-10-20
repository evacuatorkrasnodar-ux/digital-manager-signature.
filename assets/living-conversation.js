/* SEYVEO · Living Conversation v1.
   Isolated chat presentation over the existing Home, assistant and stores.
   No second input, no changes to SecureVault or the approved sphere art. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=document.documentElement;
const home=$('homePage'),stage=$('stage'),orb=$('orb');
const form=$('ask'),reply=$('orbInlineReply'),text=$('orbInlineReplyText');
const quiet=$('quietSignal');
if(!home||!stage||!orb||!form||!reply||!text||!quiet)return;
// The send accent tracks actual text, not focus or an invented busy state.
function updateSendAccent(){
 form.classList.toggle('seyveo-has-text',
   form.dataset.composerMode!=='notes' && !!$('question')?.value.trim());
}
$('question')?.addEventListener('input',updateSendAccent);
form.addEventListener('submit',()=>queueMicrotask(updateSendAccent));
form.addEventListener('click',event=>{
 if(event.target.closest('#composerModeAsk,#composerModeNotes,#clearText'))
   queueMicrotask(updateSendAccent);
});
updateSendAccent();

// Rehydrate the SAME thread from the current local history after a reload.
// Do not make an independent second conversation store.
if(!Array.isArray(window.SEYVEO_DEMO_CHAT_TURNS)||
   !window.SEYVEO_DEMO_CHAT_TURNS.length){
 const saved=window.SEYVEO_CHAT_HISTORY?.recent?.(30);
 window.SEYVEO_DEMO_CHAT_TURNS=Array.isArray(saved)?saved:[];
}
window.addEventListener('seyveo:chat-history-cleared',()=>{
 window.SEYVEO_DEMO_CHAT_TURNS=[];
 text.replaceChildren();
 reply.hidden=true;
 stage.classList.remove('has-inline-reply');
 if(root.classList.contains('seyveo-conversation')){
   if(quiet.parentElement!==stage)stage.insertBefore(quiet,reply);
   quiet.hidden=false;
 }
});

const header=document.createElement('header');
header.id='seyveoConversationHeader';
header.className='seyveo-conversation-header';
header.hidden=true;
header.innerHTML='<button type="button" id="seyveoConversationBack" aria-label="Вернуться на Главную" title="Главная"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg></button>'+
 '<div class="seyveo-conversation-heading"><strong>Сэйви</strong><span id="seyveoConversationStatus" role="status" aria-live="polite">На связи</span></div>'+
 '<button type="button" id="seyveoConversationHistory" aria-label="История бесед" title="История"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v5h5M5.5 10A7.5 7.5 0 1 1 5 15M12 7.8V12l3 2"/></svg></button>';
home.insertBefore(header,stage);

function microphone(id){
 const button=document.createElement('button');
 button.id=id;
 button.type='button';
 button.className='seyveo-conversation-mic composer-icon';
 button.setAttribute('aria-label','Говорить с Сэйви');
 button.setAttribute('aria-pressed','false');
 button.title='Говорить с Сэйви';
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h7"/></svg>';
 button.addEventListener('click',()=>{
   if(!root.classList.contains('seyveo-conversation'))open();
   window.SEYVEO_CONVERSATION_TOGGLE_VOICE?.();
 });
 return button;
}
const compact=$('ask').querySelector('.composer-compact');
const composerHead=$('ask').querySelector('.composer-head');
if(compact)compact.insertBefore(microphone('seyveoConversationMic'),compact.querySelector('#composerCompactSend'));
if(composerHead)composerHead.insertBefore(microphone('seyveoConversationMicLarge'),composerHead.querySelector('#collapseComposer'));

let statusTimer=0,speakingNow=false;
function status(value,duration=0){
 const label=$('seyveoConversationStatus');
 if(!label)return;
 clearTimeout(statusTimer);
 label.textContent=value||'На связи';
 label.classList.toggle('is-processing',/думает|слушает|отвечает/i.test(value||''));
 if(duration)statusTimer=setTimeout(()=>status('На связи'),duration);
}
function syncMic(on){
 for(const id of ['seyveoConversationMic','seyveoConversationMicLarge']){
   const btn=$(id);
   if(btn){btn.setAttribute('aria-pressed',String(on));btn.setAttribute('aria-label',on?'Остановить запись':'Говорить с Сэйви')}
 }
}
function revealExisting(){
 const turns=window.SEYVEO_DEMO_CHAT_TURNS||[];
 if(!turns.length||!reply.hidden)return;
 renderTurns(turns);
 reply.hidden=false;
 stage.classList.add('has-inline-reply');
}
function open(){
 if(home.hidden)return;
 root.classList.add('seyveo-conversation');
 header.hidden=false;
 revealExisting();
 // One and the same original pearl line, under the compact sphere.
 if(reply.hidden && quiet.parentElement!==stage)stage.insertBefore(quiet,reply);
 if(!reply.hidden && quiet.parentElement!==reply)reply.prepend(quiet);
 quiet.hidden=false;
 status('На связи');
}
function close(){
 // A conversation may be recording: never leave the microphone active on exit.
 window.SEYVEO_CONVERSATION_STOP_VOICE?.();
 root.classList.remove('seyveo-conversation');
 header.hidden=true;
 syncMic(false);
 if(!form.hidden)$('hideInput')?.click();
 // The user explicitly exited the conversation; restore Home idle behavior.
 window.SEYVEO_DEMO_CHAT_ACTIVE=false;
 if(!reply.hidden)$('orbInlineReplyClose')?.click();
 else {
   const original=stage.querySelector('.message');
   if(original && quiet.parentElement!==original)original.append(quiet);
   // The regular Home status controls the line's idle visibility.
   quiet.hidden=$('kicker')?.textContent!=='На связи';
 }
}
async function copyReply(value){
 try{
   if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');
   await navigator.clipboard.writeText(value);
   status('Ответ скопирован',1800);
 }catch{
   // Keep the text visible for native manual selection when permission is denied.
   status('Выделите текст ответа для копирования',2800);
 }
}
function saveReplyToNotes(value){
 const api=window.SEYVEO_NOTES_API;
 if(typeof api?.reviewText!=='function'){
   status('Блокнот пока недоступен',2800);return;
 }
 // The owner reviews and explicitly saves the text in the existing Notebook.
 api.reviewText(value,{preserveLines:true});
}
function replyAction(label,icon,onClick){
 const button=document.createElement('button');
 button.type='button';
 button.className='seyveo-conversation-reply-action';
 button.setAttribute('aria-label',label);
 button.innerHTML=icon;
 const textLabel=document.createElement('span');
 textLabel.textContent=label;
 button.append(textLabel);
 button.addEventListener('click',onClick);
 return button;
}
const COPY_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"/></svg>';
const NOTE_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5h11l3 3V21H5zM16 3.5V7h3M8.5 11h7M8.5 15h7M8.5 19h4"/></svg>';
function renderTurns(turns){
 const previous=text.scrollTop;
 const atBottom=text.scrollHeight-text.clientHeight-previous<42;
 const nodes=[];
 turns.forEach(turn=>{
   for(const [who,value] of [['you',turn.question],['sayvi',turn.answer]]){
     const item=document.createElement('section');
     item.className='seyveo-conversation-turn seyveo-conversation-turn--'+who;
     const label=document.createElement('span');
     label.className='seyveo-conversation-speaker';
     label.textContent=who==='you'?'Вы':'Сэйви';
     const body=document.createElement('div');
     body.className='seyveo-conversation-body';
     body.textContent=String(value||'');
     item.append(label,body);
     if(who==='sayvi'&&String(value||'').trim()){
       const actions=document.createElement('div');
       actions.className='seyveo-conversation-reply-actions';
       const answer=String(value);
       actions.append(
         replyAction('Копировать',COPY_ICON,()=>copyReply(answer)),
         replyAction('В Блокнот',NOTE_ICON,()=>saveReplyToNotes(answer))
       );
       item.append(actions);
     }
     nodes.push(item);
   }
 });
 text.replaceChildren(...nodes);
 if(atBottom)requestAnimationFrame(()=>{text.scrollTop=text.scrollHeight});
}
// On Home, a short assistant tap opens a compact choice, not the conversation.
 // Writing starts when the person explicitly taps the text field.
 const question=$('question');
 question?.addEventListener('focus',()=>{
   if(form.hidden||root.classList.contains('seyveo-conversation'))return;
   if(form.dataset.composerMode==='notes')return;
   open();
 });
$('seyveoConversationBack').addEventListener('click',close);
$('seyveoConversationHistory').addEventListener('click',()=>window.SEYVEO_CHAT_HISTORY?.open());
document.addEventListener('seyveo:assistant-presence',e=>{
 const phase=e.detail?.phase;
 if(phase==='listening'){
   // Never hide the pressed Home dock while a hold-to-talk gesture is active.
   if(root.classList.contains('seyveo-conversation'))status('Сэйви слушает…');
   syncMic(true);
 }
 else if(phase==='listening-end'){if(!speakingNow)status('На связи');syncMic(false);}
 else if(phase==='thinking'){open();status('Сэйви думает…');}
 else if(phase==='speaking'){speakingNow=true;status('Сэйви отвечает…');}
 else if(phase==='text'||phase==='end'||phase==='ack'){
   if(phase==='end')speakingNow=false;
   if(!speakingNow)status('На связи',500);
 }
 else if(phase==='stop'){speakingNow=false;status('На связи');syncMic(false);}
});
window.addEventListener('hashchange',()=>{
 if(home.hidden||location.hash && !['','#home'].includes(location.hash)){
   root.classList.remove('seyveo-conversation');
   header.hidden=true;syncMic(false);
 }
});
window.SEYVEO_CONVERSATION={open,close,renderTurns,status};
})();