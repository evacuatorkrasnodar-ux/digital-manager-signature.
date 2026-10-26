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
 if(root.classList.contains('seyveo-conversation')){
   renderTurns([]);
   reply.hidden=false;
   stage.classList.add('has-inline-reply');
   quiet.hidden=true;
 }else{
   reply.hidden=true;
   stage.classList.remove('has-inline-reply');
 }
});

const header=document.createElement('header');
header.id='seyveoConversationHeader';
header.className='seyveo-conversation-header';
header.hidden=true;
header.innerHTML='<button type="button" id="seyveoConversationBack" aria-label="Назад к предыдущему экрану" title="Назад"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg></button>'+
 '<div class="seyveo-conversation-heading"><strong class="seyveo-conversation-name" aria-label="Сэйви"><span aria-hidden="true">С</span><span aria-hidden="true">э</span><span aria-hidden="true">й</span><span aria-hidden="true">в</span><span aria-hidden="true">и</span><span class="seyveo-name-dots" aria-hidden="true"><i></i><i></i><i></i></span></strong><span id="seyveoConversationStatus" role="status" aria-live="polite">На связи</span></div>'+
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
// The existing Back control closes the conversation. There is no secondary
// keyboard-dismiss arrow; native keyboards can close by their own controls.
if(compact){
 const mic=compact.querySelector('.seyveo-conversation-mic');
 // Reuse the actual original header controls and live assistant status.
 // These nodes remain hidden on Home and in the expanded Notes editor.
 compact.insertBefore($('seyveoConversationBack'),compact.firstChild);
 compact.insertBefore($('seyveoConversationHistory'),mic);
 compact.insertBefore(header.querySelector('.seyveo-conversation-heading'),mic);
}

/* Leftmost photo picker: no extra app destinations or fake attachment sending. */
if(compact){
 const plus=document.createElement('button');
 plus.type='button';plus.id='seyveoChatPlus';
 plus.setAttribute('aria-label','Выбрать фотографию');
 plus.title='Выбрать фотографию';
 plus.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
 const photos=document.createElement('input');
 photos.type='file';photos.id='seyveoChatPhotoFile';
 photos.accept='image/*';photos.hidden=true;
 photos.setAttribute('aria-label','Выбрать фотографию из устройства');
 photos.addEventListener('change',()=>{
  if(photos.files?.length){
   window.alert('Фотография выбрана. Отправка изображений Сэйви пока не подключена.');
  }
  photos.value='';
 });
 plus.addEventListener('click',()=>{
  if(root.classList.contains('seyveo-conversation'))photos.click();
 });
 compact.insertBefore(plus,compact.firstChild);
 document.body.append(photos);
}
/* One reversible expand control for the existing chat textarea. */
if(compact){
 const toggle=document.createElement('button');
 toggle.type='button';
 toggle.id='seyveoChatExpand';
 toggle.setAttribute('aria-label','Раскрыть поле ввода');
 toggle.setAttribute('aria-expanded','false');
 toggle.title='Раскрыть поле ввода';
 const draw=()=>{
  const expanded=root.classList.contains('seyveo-chat-compose-expanded');
  toggle.innerHTML=expanded
   ?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
   :'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';
  toggle.setAttribute('aria-label',expanded?'Свернуть поле ввода':'Раскрыть поле ввода');
  toggle.setAttribute('aria-expanded',String(expanded));
  toggle.title=expanded?'Свернуть поле ввода':'Раскрыть поле ввода';
 };
 toggle.addEventListener('click',()=>{
  root.classList.toggle('seyveo-chat-compose-expanded');
  draw();
  if(typeof syncChatGeometry==='function')requestAnimationFrame(syncChatGeometry);
  $('question')?.focus({preventScroll:true});
 });
 compact.insertBefore(toggle,compact.querySelector('#seyveoConversationMic'));
 draw();
}
if(composerHead)composerHead.insertBefore(microphone('seyveoConversationMicLarge'),composerHead.querySelector('#collapseComposer'));

let statusTimer=0,speakingNow=false;
let returnRoute=''; // Workspace to restore after this single conversation closes.
const sendButton=$('composerCompactSend');
const sendIcon=sendButton?.innerHTML||'';
const stopIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2.4"/></svg>';
let activeAction=null;
// Busy only while there is a real cancelable task or an active spoken reply.
// A future streaming AI can reuse this interface with an AbortController.
function syncActionButton(){
 if(!sendButton)return;
 const busy=Boolean(activeAction);
 sendButton.classList.toggle('seyveo-stop-action',busy);
 sendButton.type=busy?'button':'submit';
 sendButton.innerHTML=busy?stopIcon:sendIcon;
 sendButton.title=busy?'Остановить действие':'Отправить Сэйви';
 sendButton.setAttribute('aria-label',busy?'Остановить действие':
   form.dataset.composerMode==='notes'?'Сохранить в Блокнот':'Отправить Сэйви');
}
function finishAction(){
 if(!activeAction)return;
 activeAction=null;
 syncActionButton();
 if(!speakingNow)status('На связи');
}
function cancelAction(){
 if(!activeAction)return false;
 const active=activeAction;
 activeAction=null;
 syncActionButton();
 try{active.cancel?.()}catch{}
 speakingNow=false;
 status('Остановлено',1200);
 return true;
}
function beginAction(cancel){
 if(activeAction)return false;
 activeAction={kind:'queued',cancel};
 syncActionButton();
 status('Сэйви обрабатывает…');
 return true;
}
sendButton?.addEventListener('click',event=>{
 if(!activeAction)return;
 event.preventDefault();
 event.stopImmediatePropagation();
 cancelAction();
});
function status(value,duration=0){
 const label=$('seyveoConversationStatus');
 if(!label)return;
 clearTimeout(statusTimer);
 label.textContent=value||'На связи';
 // Only a real assistant activity phase animates her name; the heading has
 // fixed geometry so speech/typing will never shift the input or header.
 const active=/думает|слушает|отвечает|пишет|печатает|обрабатывает/i.test(value||'');
 label.classList.toggle('is-processing',active);
 label.closest('.seyveo-conversation-heading')?.classList.toggle('is-processing',active);
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
 // Empty thread gets an ordinary welcome line, not another fullscreen overlay.
 if(reply.hidden)renderTurns(turns);
 reply.hidden=false;
 stage.classList.add('has-inline-reply');
}
function open(){
 if(root.classList.contains('seyveo-conversation'))return;
 // Chat reuses the original Home conversation, then restores the caller's
 // workspace on Back. No second chat, no replacement sphere or dock.
 if(home.hidden){
  returnRoute=location.hash||'';
  document.getElementById('navHome')?.click();
 }
 if(home.hidden)return;
 root.classList.add('seyveo-conversation');
 // Reuse the original writer and the existing saved thread.
 window.SEYVEO_CONVERSATION_ENSURE_INPUT?.();
 header.hidden=false;
 revealExisting();
 // The orb is still the centre of Home. Full chat is deliberately text-first.
 quiet.hidden=true;
 status('На связи');
 queueChatGeometry();
 scrollToLatest();
}
function close(){
 if(activeAction)cancelAction();
 root.style.removeProperty('--sayvi-chat-height');
 root.style.removeProperty('--sayvi-chat-top');
 root.style.removeProperty('--sayvi-composer-space');
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
 const destination=returnRoute;
 returnRoute='';
 if(destination&&location.hash!==destination)location.hash=destination;
}
async function copyTextValue(value,label='Ответ'){
 try{
   if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');
   await navigator.clipboard.writeText(value);
   status(label+' скопирован'+(label==='Ответ'?'':'о'),1800);
 }catch{
   status('Выделите текст для копирования',2800);
 }
}
function copyReply(value){return copyTextValue(value,'Ответ')}
function reviseQuestion(value){
 const input=$('question');
 if(!input)return;
 const original=String(value||'').trim(),draft=input.value.trim();
 if(!original)return;
 // Never throw away a different unsent draft while replaying an older question.
 if(draft&&draft!==original){
   status('Сначала отправьте или очистите текущий черновик',2800);
   return;
 }
 window.SEYVEO_CONVERSATION_ENSURE_INPUT?.();
 input.value=original;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 input.focus({preventScroll:true});
 input.setSelectionRange(original.length,original.length);
 status('Измени текст и отправь',1600);
}
function saveReplyToNotes(value){
 const api=window.SEYVEO_NOTES_API;
 if(typeof api?.getNotes!=='function'||typeof api?.putNotes!=='function'){
   status('Блокнот пока недоступен',2800);return;
 }
 const content=String(value||'').trim();
 if(!content){status('Нет текста для сохранения',2200);return}
 if(content.length>8000){
   status('Ответ слишком длинный для одной записи',2800);return;
 }
 // Choosing "В Блокнот" is the explicit save action. Keep the original
 // paragraph breaks but DO NOT mark conversational prose as no-wrap poetry.
 const prior=api.getNotes();
 if(prior[0]?.text===content&&Date.now()-prior[0].createdAt<10000){
   status('Уже сохранено в Блокнот',2000);return;
 }
 const note={
   id:String(Date.now())+'-'+Math.random().toString(36).slice(2),
   text:content,createdAt:Date.now()
 };
 if(api.putNotes([note,...prior]))status('Сохранено в Блокнот',2200);
 else status('Не удалось сохранить. Проверьте память устройства.',3200);
}
function replyAction(label,icon,onClick){
 const button=document.createElement('button');
 button.type='button';
 button.className='seyveo-conversation-reply-action';
 button.setAttribute('aria-label',label);
 button.title=label;
 button.innerHTML=icon;
 const textLabel=document.createElement('span');
 textLabel.textContent=label;
 button.append(textLabel);
 button.addEventListener('click',onClick);
 return button;
}
const COPY_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"/></svg>';
const NOTE_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5h11l3 3V21H5zM16 3.5V7h3M8.5 11h7M8.5 15h7M8.5 19h4"/></svg>';
const UP_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v10H4V10h3Zm0 0 5-7c1-1.3 3-.5 3 1v4h4a2 2 0 0 1 1.95 2.5l-2 9A2 2 0 0 1 17 21H7"/></svg>';
const DOWN_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14V4H4v10h3Zm0 0 5 7c1 1.3 3 .5 3-1v-4h4a2 2 0 0 0 1.95-2.5l-2-9A2 2 0 0 0 17 3H7"/></svg>';
const SHARE_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m0 0-4 4m4-4 4 4M5 13v7h14v-7"/></svg>';
const SOUND_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/></svg>';
const EDIT_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17-.5 3.5L7 20l12-12-3-3L4 17Zm10.5-10.5 3 3M4 12V5h7"/></svg>';

async function shareReply(value){
 try{
   if(navigator.share){await navigator.share({title:'Ответ Сэйви',text:value});return}
   await navigator.clipboard.writeText(value);
   status('Текст скопирован — его можно отправить',2000);
 }catch(error){
   if(error?.name!=='AbortError')status('Поделиться не удалось — используйте копирование',2800);
 }
}
function readReply(value){
 const speak=window.SEYVEO_CONVERSATION_READ_REPLY;
 if(typeof speak==='function')speak(value);
 else status('Озвучивание недоступно',2300);
}
// Feedback is a personal mark on this device, not a model training signal.
const VOTES_KEY='seyveo-local-reply-feedback-v1';
function replyKey(turn){
 const source=String(turn.question||'')+'\u241F'+String(turn.answer||'');
 let hash=2166136261;
 for(let i=0;i<source.length;i++){
   hash=Math.imul(hash^source.charCodeAt(i),16777619);
 }
 return (hash>>>0).toString(36);
}
function voteFor(key){
 try{return JSON.parse(localStorage.getItem(VOTES_KEY)||'{}')?.[key]||null}
 catch{return null}
}
function saveVote(key,value){
 try{
   const raw=JSON.parse(localStorage.getItem(VOTES_KEY)||'{}');
   const map=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
   delete map[key];if(value)map[key]=value;
   const entries=Object.entries(map).slice(-120);
   localStorage.setItem(VOTES_KEY,JSON.stringify(Object.fromEntries(entries)));
   return true;
 }catch{return false}
}
function makeFeedbackActions(turn){
 const key=replyKey(turn);
 const useful=replyAction('Полезный ответ',UP_ICON,()=>set('up'));
 const notUseful=replyAction('Ответ не подошёл',DOWN_ICON,()=>set('down'));
 function refresh(){
   const vote=voteFor(key);
   useful.setAttribute('aria-pressed',String(vote==='up'));
   notUseful.setAttribute('aria-pressed',String(vote==='down'));
 }
 function set(next){
   const selected=voteFor(key)===next?null:next;
   if(!saveVote(key,selected)){status('Не удалось сохранить оценку',2000);return}
   refresh();status('Отметка сохранена только на этом устройстве',1700);
 }
 refresh();return [useful,notUseful];
}
// Display only: shorten excessive blank lines without touching saved messages.
function displayChatText(value){
 return String(value??'').replace(/\r\n?/g,'\n')
  .replace(/(?:[ \t]*\n){3,}/g,'\n\n').trim();
}
let lastRenderedTurnCount=0;
let latestScrollRequest=0;
function scrollToLatest(){
 // The last message must be scrolled into view AFTER the fixed writer's
 // real size and iOS visible viewport have been committed to the layout.
 const request=++latestScrollRequest;
 requestAnimationFrame(()=>{
  if(request!==latestScrollRequest||
     !root.classList.contains('seyveo-conversation'))return;
  syncChatGeometry();
  requestAnimationFrame(()=>{
   if(request!==latestScrollRequest||
      !root.classList.contains('seyveo-conversation'))return;
   text.scrollTop=Math.max(0,text.scrollHeight-text.clientHeight);
  });
 });
}
function renderTurns(turns){
 const previous=text.scrollTop;
 const atBottom=text.scrollHeight-text.clientHeight-previous<42;
 const isNewTurn=turns.length>lastRenderedTurnCount;
 lastRenderedTurnCount=turns.length;
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
     body.textContent=who==='sayvi'
       ?displayChatText(value).replace(/\n{2,}/g,'\n')
       :displayChatText(value);
     item.append(label,body);
     if(who==='you'){
       // Keep oversized pasted questions readable without editing stored data.
       const visibleText=displayChatText(value);
       if(visibleText.length>440||visibleText.split('\n').length>9){
         item.classList.add('seyveo-message-folded');
         const expand=document.createElement('button');
         expand.type='button';
         expand.className='seyveo-conversation-expand';
         expand.textContent='Показать полностью';
         expand.setAttribute('aria-expanded','false');
         expand.addEventListener('click',()=>{
           const folded=item.classList.toggle('seyveo-message-folded');
           expand.textContent=folded?'Показать полностью':'Свернуть';
           expand.setAttribute('aria-expanded',String(!folded));
         });
         item.append(expand);
       }
       // The message bubble and its quiet actions are separate siblings:
       // copy/edit must sit BELOW the owner's bubble, never inside it.
       const group=document.createElement('div');
       group.className='seyveo-conversation-user-group';
       const userActions=document.createElement('div');
       userActions.className='seyveo-conversation-user-actions';
       const ownText=String(value||'');
       userActions.append(
         replyAction('Копировать свой вопрос',COPY_ICON,()=>copyTextValue(ownText,'Сообщение')),
         replyAction('Изменить и отправить заново',EDIT_ICON,()=>reviseQuestion(ownText))
       );
       group.append(item,userActions);
       nodes.push(group);
       continue;
     }
     if(String(value||'').trim()){
       const actions=document.createElement('div');
       actions.className='seyveo-conversation-reply-actions';
       const answer=String(value);
       actions.append(
         replyAction('Копировать',COPY_ICON,()=>copyReply(answer)),
         ...makeFeedbackActions(turn),
         replyAction('Поделиться',SHARE_ICON,()=>shareReply(answer)),
         replyAction('Озвучить',SOUND_ICON,()=>readReply(answer)),
         replyAction('В Блокнот',NOTE_ICON,()=>saveReplyToNotes(answer))
       );
       item.append(actions);
     }
     nodes.push(item);
   }
 });
 if(!turns.length){
   const welcome=document.createElement('div');
   welcome.className='seyveo-chat-welcome';
   const heading=document.createElement('strong');
   heading.textContent='Сэйви на связи';
   const hint=document.createElement('p');
   hint.textContent='Напиши, что нужно сделать, или просто поговорим.';
   welcome.append(heading,hint);
   nodes.push(welcome);
 }
 text.replaceChildren(...nodes);
 if(atBottom||isNewTurn)scrollToLatest();
}
// Only the chat shell follows iPhone's *visible* viewport.
// Open Canvas has no top header: transcript and composer stay separate while
// typing; the Home sphere and dock are unchanged outside the conversation.
let chatFrame=0;
function syncChatGeometry(){
 if(!root.classList.contains('seyveo-conversation'))return;
 // Keep the most recent message visible when the keyboard or writer moves,
 // but don't drag someone away from older messages they are reading.
 const stickToBottom=text.scrollHeight-text.clientHeight-text.scrollTop<56;
 const viewport=window.visualViewport;
 const height=Math.max(280,Math.round(viewport?.height||window.innerHeight));
 const top=Math.max(0,Math.round(viewport?.offsetTop||0));
 root.style.setProperty('--sayvi-chat-height',height+'px');
 root.style.setProperty('--sayvi-chat-top',top+'px');
 // Measure the actual native writer and its offset above the safe-area.
 // Do not add a second arbitrary 30px gutter below the transcript.
 const rect=form.getBoundingClientRect();
 const composerHeight=Math.ceil(rect.height);
 const visibleBottom=top+height;
 const bottomOffset=Math.max(8,Math.min(96,Math.round(visibleBottom-rect.bottom)));
 root.style.setProperty('--sayvi-composer-space',
  (composerHeight+bottomOffset+10)+'px');
 if(stickToBottom)requestAnimationFrame(()=>{text.scrollTop=text.scrollHeight});
}
function queueChatGeometry(){
 if(chatFrame)return;
 chatFrame=requestAnimationFrame(()=>{chatFrame=0;syncChatGeometry()});
}
if(window.visualViewport){
 window.visualViewport.addEventListener('resize',queueChatGeometry);
 window.visualViewport.addEventListener('scroll',queueChatGeometry);
}
window.addEventListener('resize',queueChatGeometry);
$('question')?.addEventListener('input',queueChatGeometry);
$('question')?.addEventListener('focus',()=>{
 queueChatGeometry();
 setTimeout(queueChatGeometry,200);
});
$('question')?.addEventListener('blur',()=>{
 queueChatGeometry();
 setTimeout(queueChatGeometry,250);
});
if(typeof ResizeObserver==='function'){
 const observer=new ResizeObserver(queueChatGeometry);
 observer.observe(form);
}

// Writing inside the Home input must NOT open the full conversation.
 // Only ↗, an explicit microphone action or sending a message opens chat.
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
 else if(phase==='speaking'){
   speakingNow=true;
   if(root.classList.contains('seyveo-conversation')&&!activeAction){
     activeAction={kind:'speech',cancel:()=>window.SEYVEO_CONVERSATION_STOP_SPEECH?.()};
     syncActionButton();
   }
   status('Сэйви отвечает…');
 }
 else if(phase==='text'||phase==='end'||phase==='ack'){
   if(phase==='end'){
     speakingNow=false;
     if(activeAction?.kind==='speech')finishAction();
   }
   if(!activeAction&&!speakingNow)status('На связи',500);
 }
 else if(phase==='stop'){
   speakingNow=false;
   if(activeAction?.kind==='speech')finishAction();
   status('На связи');syncMic(false);
 }
});
window.addEventListener('hashchange',()=>{
 if(home.hidden||location.hash && !['','#home'].includes(location.hash)){
   // Navigation away from chat explicitly cancels a pending return target.
   returnRoute='';
   root.classList.remove('seyveo-conversation');
   root.style.removeProperty('--sayvi-chat-height');
   root.style.removeProperty('--sayvi-chat-top');
   root.style.removeProperty('--sayvi-composer-space');
   header.hidden=true;syncMic(false);
 }
});
window.SEYVEO_CHAT_ACTIVITY=Object.freeze({
 begin:beginAction,finish:finishAction,cancel:cancelAction,
 isBusy:()=>Boolean(activeAction)
});
window.SEYVEO_CONVERSATION={open,close,renderTurns,status};
})();