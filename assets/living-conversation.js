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
// One native textarea; its height grows within the same single-line toolbar,
// up to four lines, without ever introducing a second row of controls.
function syncFeatherDraft(){
 if(!root.classList.contains('seyveo-conversation'))return;
 const input=$('question');
 if(!input)return;
 form.style.setProperty('--sayvi-draft-height','38px');
 const height=Math.max(38,Math.min(106,input.scrollHeight||38));
 form.style.setProperty('--sayvi-draft-height',height+'px');
}
$('question')?.addEventListener('input',updateSendAccent);
$('question')?.addEventListener('input',syncFeatherDraft);
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
if(compact){
 // Exactly one compact microphone. Clean up legacy injected microphone
 // controls from old local-server versions, without touching any other actions.
 const cleanDuplicateMics=()=>{
  const own=compact.querySelector('#seyveoConversationMic');
  if(!own)return;
  for(const button of compact.querySelectorAll('button')){
   if(button===own)continue;
   const signature=[button.id,button.getAttribute('aria-label'),button.title].join(' ');
   if(/seyveoLocalMic|microphone|микрофон|диктовк|говорить с (?:сэйви|seyveo)/iu.test(signature)){
    button.remove();
   }
  }
 };
 compact.insertBefore(microphone('seyveoConversationMic'),compact.querySelector('#composerCompactSend'));
 cleanDuplicateMics();
 // Some legacy local scripts may mount their controls after this module.
 // Keep the single composer microphone even if one is appended later.
 const micObserver=new MutationObserver(()=>cleanDuplicateMics());
 micObserver.observe(compact,{childList:true});
 window.addEventListener('pagehide',()=>micObserver.disconnect(),{once:true});
}
// Keep Back, the centred assistant title, and History in the real top header.
// The original single textarea stays in the form; CSS arranges it between
// attachment and the context-sensitive voice/send button without cloning it.
if(compact){
 const plus=document.createElement('button');
 plus.type='button';plus.id='seyveoChatPlus';
 plus.setAttribute('aria-label','Дополнительные действия');
 plus.setAttribute('aria-expanded','false');
 plus.setAttribute('aria-controls','seyveoChatTools');
 plus.title='Дополнительные действия';
 plus.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
 compact.insertBefore(plus,compact.firstChild);

 const photos=document.createElement('input');
 photos.type='file';photos.id='seyveoChatPhotoFile';photos.accept='image/*';
 photos.hidden=true;photos.setAttribute('aria-label','Выбрать фотографию');
 photos.addEventListener('change',()=>{
  if(photos.files?.length)status('Фото выбрано. Отправка вложений пока не подключена.',3600);
  photos.value='';
 });
 document.body.append(photos);

 const tools=document.createElement('div');
 tools.id='seyveoChatTools';tools.className='seyveo-chat-tools';
 tools.hidden=true;tools.setAttribute('role','group');
 tools.setAttribute('aria-label','Действия Сэйви');
 tools.innerHTML=
  '<button type="button" data-sayvi-tool="photo"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.4"/><path d="m5 17 5-4 3 2 3-3 3 3"/></svg>Фотография</button>'+
  '<button type="button" data-sayvi-tool="browser"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c-4 4.5-4 12.5 0 17M12 3.5c4 4.5 4 12.5 0 17"/></svg>Браузер</button>'+
  '<button type="button" data-sayvi-tool="note"><svg viewBox="0 0 24 24"><path d="M5 3.5h11l3 3V21H5zM16 3.5V7h3M8.5 11h7M8.5 15h7"/></svg>Сохранить в Блокнот</button>';
 form.appendChild(tools);
 function showTools(show){
  tools.hidden=!show;
  plus.setAttribute('aria-expanded',String(show));
 }
 plus.addEventListener('click',()=>showTools(tools.hidden));
 tools.addEventListener('click',event=>{
  const action=event.target.closest('button[data-sayvi-tool]')?.dataset.sayviTool;
  if(!action)return;
  showTools(false);
  if(action==='photo')photos.click();
  else if(action==='browser'){
   if(!window.SEYVEO_BROWSER?.open?.())status('Браузер пока недоступен',2400);
  }else if(action==='note'){
   const draft=$('question')?.value.trim();
   if(draft)saveReplyToNotes(draft);
   else status('Сначала напишите текст',2200);
  }
 });
 document.addEventListener('pointerdown',event=>{
  if(!tools.hidden&&!tools.contains(event.target)&&!plus.contains(event.target))
   showTools(false);
 },true);
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!tools.hidden){
   showTools(false);plus.focus({preventScroll:true});
   event.stopPropagation();
  }
 });
 document.addEventListener('seyveo:conversation-close',()=>showTools(false));
}
if(composerHead)composerHead.insertBefore(microphone('seyveoConversationMicLarge'),composerHead.querySelector('#collapseComposer'));

let statusTimer=0,speakingNow=false;
let returnRoute=''; // Workspace to restore after this single conversation closes.
const sendButton=$('composerCompactSend');
const sendIcon=sendButton?.innerHTML||'';
const chatSendIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m0 0-6 6m6-6 6 6"/></svg>';
const stopIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2.4"/></svg>';
let activeAction=null;
// Busy only while there is a real cancelable task or an active spoken reply.
// A future streaming AI can reuse this interface with an AbortController.
function syncActionButton(){
 if(!sendButton)return;
 const busy=Boolean(activeAction);
 sendButton.classList.toggle('seyveo-stop-action',busy);
 form.classList.toggle('seyveo-action-busy',busy);
 sendButton.type=busy?'button':'submit';
 sendButton.innerHTML=busy?stopIcon:(root.classList.contains('seyveo-conversation')?chatSendIcon:sendIcon);
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
 syncActionButton();updateSendAccent();
 // Reuse the original writer and the existing saved thread.
 window.SEYVEO_CONVERSATION_ENSURE_INPUT?.();
 header.hidden=false;
 revealExisting();
 // The orb is still the centre of Home. Full chat is deliberately text-first.
 quiet.hidden=true;
 status('На связи');
 requestAnimationFrame(()=>{syncFeatherDraft();queueChatGeometry()});
 scrollToLatest();
}
function close(){
 window.dispatchEvent(new Event('seyveo:conversation-closed'));
 if(businessIntroduction){businessIntroduction=null;renderTurns(window.SEYVEO_DEMO_CHAT_TURNS||[])}
 if(activeAction)cancelAction();
 root.style.removeProperty('--sayvi-chat-height');
 root.style.removeProperty('--sayvi-chat-top');
 root.style.removeProperty('--sayvi-composer-space');
 // A conversation may be recording: never leave the microphone active on exit.
 window.SEYVEO_CONVERSATION_STOP_VOICE?.();
 root.classList.remove('seyveo-conversation');
 form.style.removeProperty('--sayvi-draft-height');
 $('seyveoChatTools')?.setAttribute('hidden','');
 $('seyveoChatPlus')?.setAttribute('aria-expanded','false');
 syncActionButton();
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
 if(activeAction?.kind==='stream'&&turns.length&&String(turns[turns.length-1]?.answer||'').trim())finishAction();
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
     if(who==='sayvi'&&turn.rich){
       const rich=window.SEYVEO_RICH_ANSWER?.render?.(turn.rich);
       if(rich)item.append(rich);
     }
     if(who==='sayvi'&&turn.search){
       const sources=window.SEYVEO_LIVE_SEARCH_UI?.render?.(turn.search);
       if(sources)item.append(sources);
     }
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
       if(turn.smartStart){nodes.push(item);continue}
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
     if(String(value||'').trim()&&!turn.smartStart){
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
// One live stream inside the real Feather Chat.
// A pending answer is plain text without premature actions.
// When the stream completes, showWrittenReply adds the regular actions,
// including the existing speaker, under the complete message.
let streamedBody=null;
let streamDraft='';
function beginStream(question,cancel){
 open();
 if(activeAction?.kind==='stream')finishAction();
 streamDraft='';
 // Stop appears only when the caller provides a real cancellation callback.
 if(typeof cancel==='function'&&(!activeAction||activeAction.kind==='queued')){
  activeAction={kind:'stream',cancel};syncActionButton();
 }
 status('Сэйви пишет…');
 const turns=window.SEYVEO_DEMO_CHAT_TURNS||[];
 renderTurns([...turns,{question:String(question||''),answer:''}]);
 const bodies=text.querySelectorAll('.seyveo-conversation-turn--sayvi .seyveo-conversation-body');
 streamedBody=bodies[bodies.length-1]||null;
 if(streamedBody)streamedBody.textContent='Сэйви думает…';
 scrollToLatest();
}
function updateStream(answer){
 // Keep the latest received text even if the chat was re-rendered during a stream.
 streamDraft=String(answer??'');
 if(!streamedBody||!streamedBody.isConnected){
  const bodies=text.querySelectorAll('.seyveo-conversation-turn--sayvi .seyveo-conversation-body');
  streamedBody=bodies[bodies.length-1]||null;
 }
 if(!streamedBody)return;
 const nearBottom=text.scrollHeight-text.clientHeight-text.scrollTop<64;
 streamedBody.textContent=displayChatText(streamDraft)||'Сэйви думает…';
 status('Сэйви пишет…');
 if(nearBottom)text.scrollTop=text.scrollHeight;
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
// The approved private voice prepares audio on CPU before playback.
// It must NEVER turn the normal Send button into Stop while generating.
document.addEventListener('seyveo:voice-status',event=>{
 if(!root.classList.contains('seyveo-conversation'))return;
 const state=event.detail?.stage;
 if(state==='preparing')status('Готовлю голос Сэйви…');
 else if(state==='playing')status('Сэйви говорит');
 else if(state==='idle')status('На связи');
 else if(state==='error'){
  status('Не удалось озвучить: '+String(event.detail?.message||'Ошибка'),5000);
 }
});
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
   form.style.removeProperty('--sayvi-draft-height');
   $('seyveoChatTools')?.setAttribute('hidden','');
   $('seyveoChatPlus')?.setAttribute('aria-expanded','false');
   syncActionButton();
   root.style.removeProperty('--sayvi-chat-height');
   root.style.removeProperty('--sayvi-chat-top');
   root.style.removeProperty('--sayvi-composer-space');
   header.hidden=true;syncMic(false);
 }
});
window.SEYVEO_CHAT_ACTIVITY=Object.freeze({
 begin:beginAction,finish:()=>{if(activeAction?.kind==='queued')finishAction()},cancel:cancelAction,
 isBusy:()=>Boolean(activeAction)
});
// A verified search service can deliver this payload without replacing Feather Chat.
function showSearchResults(payload){
 const q=String(payload?.query||'').trim().slice(0,1000);
 if(!q)return false;
 const supplied=Array.isArray(payload?.results)?payload.results.slice(0,6):[];
 const available=payload?.status==='results'&&supplied.length>0;
 const rich=available?(window.SEYVEO_RICH_ANSWER?.cleanBlocks?.(payload?.blocks)||[]):[];
 const summary=String(payload?.answer||'').trim().slice(0,20000);
 const answer=available
  ?summary||'Нашла материалы по твоему вопросу. Ниже источники, даты и фотографии, если они доступны. Важные факты лучше сверять с оригинальными публикациями.'
  :payload?.status==='unavailable'
   ?String(payload?.message||'Интернет-поиск пока не подключён. Я не буду придумывать новости и ссылки.').slice(0,280)
   :'По этому запросу пока не нашла проверяемых источников.';
 const turn={question:q,answer,rich,search:available?{status:'results',results:supplied}:null};
 const turns=window.SEYVEO_DEMO_CHAT_TURNS||(window.SEYVEO_DEMO_CHAT_TURNS=[]);
 turns.push(turn);
 if(turns.length>30)turns.splice(0,turns.length-30);
 open();
 renderTurns(turns);
 // Provider search results are transient; only the user's question and generic reply persist.
 window.SEYVEO_CHAT_HISTORY?.add({question:q,answer,kind:'search'});
 return true;
}
window.addEventListener('seyveo:web-search-results',event=>{
 if(event.detail)showSearchResults(event.detail);
});
// The intelligence service can choose a readable format for grounded data.
// The renderer never guesses figures or creates illustrations by itself.
function showRichAnswer(payload){
 const question=String(payload?.question||'').trim().slice(0,3500);
 const answer=String(payload?.answer||'').trim().slice(0,20000);
 const rich=window.SEYVEO_RICH_ANSWER?.cleanBlocks?.(payload?.blocks)||[];
 if(!question||(!answer&&!rich.length))return false;
 const turns=window.SEYVEO_DEMO_CHAT_TURNS||(window.SEYVEO_DEMO_CHAT_TURNS=[]);
 turns.push({question,answer,rich});
 if(turns.length>30)turns.splice(0,turns.length-30);
 open();
 renderTurns(turns);
 window.SEYVEO_CHAT_HISTORY?.add({question,answer,rich,kind:'reply'});
 return true;
}
window.addEventListener('seyveo:rich-answer',event=>{
 if(event.detail)showRichAnswer(event.detail);
});
// Owner-confirmed business introduction inside the existing chat, not a second
// form or a simulated AI. Answers are private, transient until Save, and never
// added to the general chat-history store.
let businessIntroduction=null;
function showBusinessIntroduction(){
 if(!businessIntroduction)return;
 const turns=window.SEYVEO_DEMO_CHAT_TURNS||[];
 renderTurns([...turns,...businessIntroduction.turns]);
}
function beginBusinessIntroduction(){
 if(businessIntroduction)return showBusinessIntroduction();
 const saved=window.SEYVEO_BUSINESS_MAP?.getState?.()||{};
 businessIntroduction={
  step:'about',about:String(saved.description||''),goal:String(saved.goal||''),turns:[{
   question:'Хочу познакомить Сэйви с моим делом',
   answer:'Расскажи, чем занимается твой бизнес. Можно своими словами или голосом. Это останется приватным и сохранится только с твоего согласия.'+
    (saved.description?'\nУ меня уже есть описание. Напиши «оставить», чтобы не менять его.':'')
  }]
 };
 open();showBusinessIntroduction();
 status('Знакомство с бизнесом');
 return true;
}
form.addEventListener('submit',event=>{
 if(!businessIntroduction)return;
 // Intercept before ordinary assistant sending: private onboarding must not
 // silently go to a remote AI or the regular conversation history.
 event.preventDefault();event.stopImmediatePropagation();
 const input=$('question');const value=String(input?.value||'').trim();
 if(!value)return;
 input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
 const intro=businessIntroduction;
 if(/^(отмена|отменить|выйти)$/i.test(value)){
  businessIntroduction=null;
  renderTurns(window.SEYVEO_DEMO_CHAT_TURNS||[]);
  status('Знакомство отменено — ничего не сохранено',3500);
  return;
 }
 if(intro.step==='about'){
  if(value.toLowerCase()==='оставить'&&!intro.about){
   intro.turns.push({question:value,answer:'Пока нет описания. Расскажи о своём бизнесе несколькими словами.'});
  }else{
   if(value.toLowerCase()!=='оставить')intro.about=value.slice(0,1000);
   intro.step='goal';
   intro.turns.push({question:value,answer:'Какая сейчас главная цель твоего бизнеса? Можно ответить своими словами. Если цель уже сохранена, напиши «оставить».'});
  }
 }else if(intro.step==='goal'){
  if(value.toLowerCase()==='оставить'&&!intro.goal){
   intro.turns.push({question:value,answer:'Цель пока не сохранена. Напиши, к чему хочешь прийти.'});
  }else{
   if(value.toLowerCase()!=='оставить')intro.goal=value.slice(0,320);
   intro.step='confirm';
   intro.turns.push({question:value,answer:'Я предлагаю запомнить:\nДело: '+intro.about+'\nЦель: '+intro.goal+'\nНапиши «сохранить» для подтверждения или «отмена», чтобы ничего не менять. Эти сведения не войдут в QR-визитку.'});
  }
 }else if(intro.step==='confirm'){
  if(value.toLowerCase()==='сохранить'){
   const result=window.SEYVEO_BUSINESS_MAP?.savePrivateBusinessContext?.(intro.about,intro.goal);
   intro.turns.push({question:value,answer:result?.message||'Не удалось сохранить. Попробуй ещё раз.'});
   if(result?.ok)businessIntroduction=null;
  }else{
   intro.turns.push({question:value,answer:'Для сохранения напиши «сохранить». Для отмены — «отмена». Другие сообщения пока не записываются в память бизнеса.'});
  }
 }
 renderTurns([...(window.SEYVEO_DEMO_CHAT_TURNS||[]),...intro.turns]);
 if(businessIntroduction)status('Знакомство с бизнесом');
 else status('На связи');
},true);

document.getElementById('openSayviBusinessIntro')?.addEventListener('click',beginBusinessIntroduction);
window.SEYVEO_CONVERSATION={beginBusinessIntroduction,open,close,renderTurns,beginStream,updateStream,status,showSearchResults,showRichAnswer,
 endStream:()=>{if(activeAction?.kind==='stream')finishAction();else status('На связи');streamedBody=null;}
};
})();


/* SEYVEO Smart Start · guided steps in the original conversation.
 * All controls are local DOM elements inside existing Sayvi turns.
 * Explicit consent before saving. No artificial chat history, integrations
 * or server roles are created by this walkthrough.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const chat=window.SEYVEO_CONVERSATION,composer=$('ask'),thread=$('orbInlineReplyText');
 const home=$('svSmartStartHome'),homeForm=$('svSmartStartHomeForm');
 if(!chat||!composer||!thread)return;
 const PLAN_KEY='seyveo-smart-start-v1',DRAFT_KEY='seyveo-smart-start-draft-v1',SKIP_KEY='seyveo-smart-start-home-later-v1',OPT_OUT_KEY='seyveo-smart-start-opt-out-v1';
 const ROLES=['Управляющий','Кассир','Продавец','Кладовщик','Завхоз','Водитель','Грузчик','Бухгалтер','Кадровик','Директор магазина','Администратор','Повар','Официант','Бариста','Курьер','Прораб','Строитель','Мастер','Менеджер','Другая должность'];
 const roleSuggestions=business=>/магазин|торгов|продукт/i.test(business)?['Директор магазина','Управляющий','Кассир','Продавец','Кладовщик','Завхоз','Водитель','Грузчик','Бухгалтер','Другая должность']:/ресторан|кафе|общепит/i.test(business)?['Управляющий','Администратор','Повар','Официант','Бариста','Кассир','Курьер','Бухгалтер','Другая должность']:/строит|ремонт|монтаж/i.test(business)?['Прораб','Строитель','Мастер','Водитель','Менеджер','Бухгалтер','Другая должность']:['Управляющий','Менеджер','Администратор','Кассир','Водитель','Бухгалтер','Кадровик','Другая должность'];
 const SOURCES=['1С','Битрикс24','Кассовая система','Excel / CSV','Другая программа','Пока ничем'];
 const FEATURES=[
  {id:'team',title:'Команда и поручения',detail:'Личные и групповые чаты, задачи и контроль после подключения защищённых аккаунтов'},
  {id:'docs',title:'Документы',detail:'Рабочие файлы и согласования с ограничением доступа'},
  {id:'sales',title:'Продажи и товары',detail:'Реальные показатели после подключения 1С, CRM или кассовой системы'},
  {id:'finance',title:'Финансы',detail:'Данные из банка после разрешения; переводы подтверждаются отдельно'}
 ];
 let session=null,cabinetHandoffTimer=null,greetingDismissedInSession=false;
 function get(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
 function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
 function el(tag,cls,value){
  const e=document.createElement(tag);
  if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;
 }
 function btn(label,fn,cls=''){
  const b=el('button','sv-smart-start-btn'+(cls?' '+cls:''),label);
  b.type='button';b.addEventListener('click',fn);return b;
 }
 function prompt(){
  if(!session)return '';
  switch(session.step){
   case 'name':return 'Как к вам обращаться? Для знакомства достаточно имени.';
   case 'business':return 'Чем занимается ваша компания? Выберите пример или напишите своими словами.';
   case 'employees':return 'Сколько человек работает в компании, включая вас? Это поможет предложить подходящие возможности для команды.';
   case 'roles':return 'Какие должности есть в команде? Отметьте нужные. В будущем вы сможете назначать поручения прямо из защищённого чата и обмениваться рабочими документами.';
   case 'systems':return 'Какими программами вы пользуетесь? Подключённые 1С, Битрикс24 или касса помогут показывать реальные показатели — когда соответствующие интеграции заработают.';
   case 'features':return 'Что вам хотелось бы настроить? Выберите нужные направления.';
   case 'confirm':return 'Посмотрите план. Ничего не подключится автоматически. Сохранить ответы на этом устройстве?';
   default:return '';
  }
 }
 function choices(container,property,entries,notes={}){
  const list=el('div','sv-smart-start-checklist');
  for(const [id,label] of entries){
   const row=el('label','sv-smart-start-checkrow'),check=el('input'),body=el('span');
   check.type='checkbox';check.value=id;check.checked=session[property].includes(id);
   body.append(el('strong',null,label));
   if(notes[id])body.append(el('small',null,notes[id]));
   check.addEventListener('change',()=>{
    const next=new Set(session[property]);
    if(property==='sources'&&check.checked){
     if(id==='Пока ничем')next.clear();else next.delete('Пока ничем');
    }
    if(check.checked)next.add(id);else next.delete(id);
    session[property]=[...next];
    if(property==='sources')list.querySelectorAll('input').forEach(input=>{input.checked=next.has(input.value)});
   });
   row.append(check,body);list.append(row);
  }
  container.append(list);
 }
 function draw(){
  if(!session)return;
  chat.open();
  chat.renderTurns([...(window.SEYVEO_DEMO_CHAT_TURNS||[]),...session.turns]);
  const bubbles=thread.querySelectorAll('.seyveo-conversation-turn--sayvi');
  const last=bubbles[bubbles.length-1];if(!last)return;
  const wrap=el('div','sv-smart-start-controls'),step=session.step;
  if(step==='name'||step==='employees'){
   const row=el('div','sv-smart-start-answer'),input=el('input');
   input.type=step==='employees'?'number':'text';input.inputMode=step==='employees'?'numeric':'text';
   input.placeholder=step==='name'?'Например, Роман':'Например, 12';
   if(step==='employees'){input.min='1';input.max='100000'}else input.maxLength=60;
   input.setAttribute('aria-label',step==='name'?'Имя':'Количество сотрудников');
   input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();advance(input.value)}});
   row.append(input,btn('Продолжить',()=>advance(input.value),'is-primary'));wrap.append(row);
  }else if(step==='business'){
   const chips=el('div','sv-smart-start-chips');
   for(const option of ['Продуктовые магазины','Ресторан или кафе','Строительство','Услуги','Для себя','Просто посмотреть'])
    chips.append(btn(option,()=>option==='Просто посмотреть'?exploreApp():advance(option),'is-chip'));
   wrap.append(chips,el('small','sv-smart-start-note','Свой вариант можно написать в обычном поле чата.'));
  }else if(['roles','sources','features'].includes(step)){
   const suggested=roleSuggestions(session.business);
   const data=step==='roles'?[...new Set([...suggested,...session.roles].filter(x=>x!=='Другая должность'))].map(x=>[x,x]):
    step==='sources'?[...new Set([...SOURCES,...session.sources])].map(x=>[x,x]):FEATURES.map(x=>[x.id,x.title]);
   const notes=step==='features'?Object.fromEntries(FEATURES.map(x=>[x.id,x.detail])):{};
   choices(wrap,step,data,notes);
   if(step==='sources')wrap.append(el('small','sv-smart-start-note',
    'Сейчас это выбор для плана, а не вход в 1С или Битрикс24. Пароли и токены не нужны.'));
   if(step==='roles')wrap.append(el('small','sv-smart-start-note',
    'Нет нужной должности? Напишите её название в поле чата — я добавлю в план.'));
   if(step==='sources')wrap.append(el('small','sv-smart-start-note',
    'Можно написать название другой программы прямо в чате.'));
   wrap.append(btn('Продолжить',()=>advance('__selected__'),'is-primary'));
  }else if(step==='confirm'){
   const summary=el('div','sv-smart-start-summary');
   for(const [label,value] of [
    ['Имя',session.name||'Не указано'],['Деятельность',session.business||'Не указана'],
    ['Сотрудников',String(session.employees||'—')],['Должности',session.roles.join(', ')||'Позже'],
    ['Программы',session.sources.join(', ')||'Позже'],
    ['Направления',session.features.map(id=>FEATURES.find(x=>x.id===id)?.title).filter(Boolean).join(', ')||'Позже']
   ]){
    const p=el('p');p.append(el('strong',null,label+': '),document.createTextNode(value));summary.append(p);
   }
   wrap.append(summary,btn('Сохранить план',finish,'is-primary'));
  }else if(step==='done'){
   wrap.append(btn('Посмотреть мой кабинет',revealCabinet,'is-primary'));
   wrap.append(btn('Пока останусь в чате',()=>{
    if(cabinetHandoffTimer)clearTimeout(cabinetHandoffTimer);
    cabinetHandoffTimer=null;
    chat.status('Конечно. Кабинет готов, когда захочешь его посмотреть.',3400);
   }));
  }
  if(step!=='done'){
   const foot=el('div','sv-smart-start-footer');
   if(step!=='name')foot.append(btn('Назад',back));
   foot.append(btn('Продолжить позже',()=>pause(false)));
   wrap.append(foot);
  }
  last.append(wrap);
  chat.status('Знакомство · настройка SEYVEO');
  requestAnimationFrame(()=>{thread.scrollTop=thread.scrollHeight});
 }
 // Make free-text answers equivalent to the same checkboxes. Never discard them
 // while moving to the next step. Unknown professions are allowed as labels,
 // NOT as permission templates. They grant no access.
 function acceptFreeText(step,value){
  if(value==='__selected__')return true;
  if(/^(?:позже|пропустить|пока не знаю)$/i.test(value)){
   session[step]=[];return true;
  }
  if(step==='roles'){
   const normalizeRole=raw=>{
    const label=raw.trim().replace(/\s+/g,' ').slice(0,60);
    if(/^кассир[ыа-я]*$/iu.test(label))return 'Кассир';
    if(/^водител[ьиуяе]*$/iu.test(label))return 'Водитель';
    if(/^продавц[ыа-я]*|^продавец$/iu.test(label))return 'Продавец';
    if(/^кладовщик[иа-я]*$/iu.test(label))return 'Кладовщик';
    if(/^бухгалтер[ыа-я]*$/iu.test(label))return 'Бухгалтер';
    if(/^грузчик[иа-я]*$/iu.test(label))return 'Грузчик';
    return label;
   };
   const parts=value.split(/[,;\n]+|\s+и\s+(?=[А-ЯЁа-яё])/i)
    .map(normalizeRole).filter(Boolean);
   if(!parts.length)return false;
   session.roles=[...new Set([...session.roles,...parts])].slice(0,30);
   return true;
  }
  if(step==='sources'){
   const names=[];
   if(/(?:^|\W)1\s*[cс](?:$|\W)/iu.test(value))names.push('1С');
   if(/битр[ие]кс|bitrix/iu.test(value))names.push('Битрикс24');
   if(/касс|эвотор|атол|штрих[- ]?м/iu.test(value))names.push('Кассовая система');
   if(/excel|эксел|csv|таблиц/iu.test(value))names.push('Excel / CSV');
   if(/^(?:нет|ничего|не пользуюсь|пока ничем)$/iu.test(value))names.push('Пока ничем');
   if(!names.length){
    const typed=value.slice(0,65);
    names.push('Другая программа: '+typed);
   }
   if(names.includes('Пока ничем'))session.sources=['Пока ничем'];
   else session.sources=[...new Set([...session.sources.filter(x=>x!=='Пока ничем'),...names])].slice(0,15);
   return true;
  }
  if(step==='features'){
   const found=[];
   if(/сотрудник|поручени|команд|чат|смен|персонал|кадр/i.test(value))found.push('team');
   if(/документ|договор|акт|согласован|письм|эдо/i.test(value))found.push('docs');
   if(/продаж|выручк|товар|склад|остатк|клиент|заказ/i.test(value))found.push('sales');
   if(/банк|ден[ье]г|финанс|плат[её]ж|сч[её]т/i.test(value))found.push('finance');
   if(!found.length)return false;
   session.features=[...new Set([...session.features,...found])];
   return true;
  }
  return false;
 }
 function choiceSummary(step){
  const entries=session[step]||[];
  if(!entries.length)return 'Выберу позже';
  return step==='features'?entries.map(id=>FEATURES.find(x=>x.id===id)?.title||id).join(', '):entries.join(', ');
 }
 function advance(value){
  if(!session)return;
  const raw=String(value||'').trim().slice(0,400);
  if(!raw){chat.status('Укажите ответ',2500);return}
  if(/^(отмена|выйти)$/i.test(raw)){pause(false);return}
  if(/парол[ья]|api[_ -]?key|access[_ -]?token|client[_ -]?secret|bearer\s|банковск.{0,8}код/i.test(raw)){
   chat.status('Пароли, коды и ключи доступа здесь вводить не нужно',4200);return;
  }
  const oldStep=session.step;
  let shown=raw;
  if(oldStep==='name'){session.name=raw.slice(0,60);session.step='business'}
  else if(oldStep==='business'){
   if(/^(?:просто посмотреть|посмотреть|пока без настройки)$/i.test(raw)){exploreApp();return}
   const personal=/^для себя$|^личн(?:ое|ый|ая)(?:\s|$)/i.test(raw);
   session.business=personal?'Для себя':raw.slice(0,160);
   session.step=personal?'confirm':'employees';
   if(personal)session.employees=1;
  }else if(oldStep==='employees'){
   const n=Number(raw.replace(/\s/g,''));
   if(!Number.isInteger(n)||n<1||n>100000){chat.status('Укажите целое число от 1 до 100000',2900);return}
   session.employees=n;session.step='roles';
  }else if(oldStep==='roles'||oldStep==='sources'||oldStep==='features'){
   if(!acceptFreeText(oldStep,raw)){
    chat.status('Отметьте нужные пункты или напишите, что хотите настроить',3600);
    return;
   }
   shown=choiceSummary(oldStep);
   session.step=oldStep==='roles'?'sources':oldStep==='sources'?'features':'confirm';
  }else if(oldStep==='confirm'){
   if(/^(сохранить|готово)$/i.test(raw)){finish();return}
   chat.status('Подтвердите кнопкой «Сохранить план»',2400);return;
  }else return;
  session.turns.push({question:shown,answer:prompt(),smartStart:true});
  draw();
 }
 function back(){
  if(!session)return;
  const steps=['name','business','employees','roles','sources','features','confirm'];
  const n=steps.indexOf(session.step);
  if(n<1)return;
  session.step=steps[n-1];
  if(session.business==='Для себя'&&session.step==='features')session.step='business';
  session.turns.push({question:'Вернуться',answer:prompt(),smartStart:true});
  draw();
 }
 function pause(silent){
  if(cabinetHandoffTimer)clearTimeout(cabinetHandoffTimer);
  cabinetHandoffTimer=null;
  if(!session)return;
  if(session.step!=='done'){
   const {name,business,employees,roles,sources,features,step}=session;
   if(!save(DRAFT_KEY,{name,business,employees,roles,sources,features,step})){
    if(!silent){chat.status('Не удалось сохранить черновик',2800);return}
   }
  }
  session=null;chat.renderTurns(window.SEYVEO_DEMO_CHAT_TURNS||[]);
  syncHome();
  if(!silent)chat.status('Сохранила ответы. Продолжим, когда удобно.',3000);
 }
 function revealCabinet(){
  if(!session||session.step!=='done')return;
  if(cabinetHandoffTimer)clearTimeout(cabinetHandoffTimer);
  cabinetHandoffTimer=null;
  const plan=get(PLAN_KEY);
  if(!plan)return;
  const result=session.cabinetLayoutResult;
  // Leave the private setup and navigate through existing destinations only.
  session=null;
  chat.close();
  if(plan.business==='Для себя'){
   $('navPicture')?.click();
   return;
  }
  const work=window.SEYVEO_UNIFIED_TASKS;
  if(typeof work?.openBusiness!=='function')return;
  if(!window.SEYVEO_PREVIEW?.isManager?.()){
   // An intentional Business VIEW switch in the local prototype, not server access.
   work.previewRole?.('manager');
  }
  work.openBusiness('home');
  window.SEYVEO_SMART_CABINET?.showArrival?.(plan,result);
 }
 function finish(){
  if(!session)return;
  const {name,business,employees,roles,sources,features}=session;
  const record={version:1,name,business,employees,roles:roles.slice(),sources:sources.slice(),
   features:features.slice(),connected:false,updatedAt:new Date().toISOString()};
  if(!save(PLAN_KEY,record)){chat.status('Не удалось сохранить на устройстве',3000);return}
  const layoutResult=window.SEYVEO_SMART_CABINET?.prepareFromPlan?.(record);
  session.cabinetLayoutResult=layoutResult;
  try{localStorage.removeItem(DRAFT_KEY)}catch{}
  if(name){
   try{
    const key='seyveo-first-acquaintance-v1',prev=get(key)||{};
    const focus=['life','start','pro','max'].includes(prev.focus)?prev.focus:(business==='Для себя'?'life':'pro');
    save(key,{...prev,schemaVersion:1,name,focus,assistantName:'Сэйви',
     assistantVoice:'female',assistantAliases:['Сэйви','Сэй','SEYVEO'],lifeIncluded:true,
     createdAt:prev.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
    window.dispatchEvent(new Event('seyveo:profile-changed'));
   }catch{}
  }
  session.step='done';
  const note=business==='Для себя'?
   'Готово! Я сохранила твои пожелания. Сейчас покажу «Мой мир» — там есть музыка, браузер, личная почта и другие возможности.':
   (layoutResult?.reason==='existing-layout'?
    'Готово! Я учла твои ответы, а прежний порядок кабинета сохранила. Сейчас покажу его — вместе сможем изменить всё, что захочешь.':
    'Готово! Я подготовила тебе кабинет из доступных инструментов для твоей работы. Сейчас покажу его — можем добавить нужное, убрать лишнее и передвинуть карточки пальцем.')+
   '\nА ещё в «Моём мире» есть музыка, собственный браузер и личная почта.';
  session.turns.push({question:'Сохранить мой план',answer:note+
   '\nУчётные программы, банки и защищённые аккаунты сотрудников ещё не подключены — их настроим отдельно, когда функции станут доступны.',smartStart:true});
  draw();
  syncHome();
  window.dispatchEvent(new Event('seyveo:smart-start-complete'));
  // A short reading pause, or tap "Посмотреть мой кабинет" to go immediately.
  // Do not navigate away while writing or while app is hidden.
  if(cabinetHandoffTimer)clearTimeout(cabinetHandoffTimer);
  cabinetHandoffTimer=setTimeout(()=>{
   if(session?.step==='done'&&document.visibilityState==='visible'&&
    document.documentElement.classList.contains('seyveo-conversation')&&
    !String($('question')?.value||'').trim())revealCabinet();
  },6000);
 }
 function begin(opts={}){
  if(cabinetHandoffTimer)clearTimeout(cabinetHandoffTimer);
  cabinetHandoffTimer=null;
  const draft=opts.resume?get(DRAFT_KEY):null,old=get(PLAN_KEY);
  let name=String(opts.name||draft?.name||old?.name||get('seyveo-first-acquaintance-v1')?.name||'').trim().slice(0,60);
  session={
   name,business:String(draft?.business||'').slice(0,160),employees:Number(draft?.employees)||null,
   roles:Array.isArray(draft?.roles)?draft.roles.filter(v=>typeof v==='string'&&v.length<=60).slice(0,30):[],
   sources:Array.isArray(draft?.sources)?draft.sources.filter(v=>typeof v==='string'&&v.length<=85).slice(0,15):[],
   features:Array.isArray(draft?.features)?draft.features.filter(v=>FEATURES.some(x=>x.id===v)):[],
   step:['name','business','employees','roles','sources','features','confirm'].includes(draft?.step)?draft.step:(name?'business':'name'),
   turns:[]
  };
  if(!session.name)session.step='name';
  session.turns.push({question:'Начнём знакомство с SEYVEO',answer:
   (name?'Рада знакомству, '+name+'! ':'Привет! Я Сэйви. Меня создала команда SEYVEO. Друзья зовут меня просто Сэй. ')+'Давай настроим SEYVEO под твои задачи. '+prompt()+
   '\nОтвечайте вручную или нажимайте на кнопки и галочки. Подключения и приглашения не запускаются автоматически.',smartStart:true});
  draw();syncHome();
  return true;
 }
 composer.addEventListener('submit',event=>{
  if(!session||session.step==='done')return;
  event.preventDefault();event.stopImmediatePropagation();
  const input=$('question'),value=String(input?.value||'').trim();
  if(!value)return;
  input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
  advance(value);
 },true);
 function isHomeRoute(){
  const route=location.hash;
  return !route||route==='#'||route==='#home';
 }
 function syncHome(){
  if(!home)return;
  let skipped=false,optedOut=false;
  try{
   skipped=localStorage.getItem(SKIP_KEY)==='1';
   optedOut=localStorage.getItem(OPT_OUT_KEY)==='1';
  }catch{}
  const visible=isHomeRoute()&&!greetingDismissedInSession&&!skipped&&!optedOut&&
   !session&&!get('seyveo-first-acquaintance-v1')&&!get(PLAN_KEY)&&!get(DRAFT_KEY);
  home.hidden=!visible;
  if(!visible)home.classList.remove('is-greeting');
  document.documentElement.classList.toggle('sv-smart-start-home-active',visible);
  const entry=$('svCabinetStartWithSayvi')?.querySelector('span');
  if(entry)entry.textContent=get(DRAFT_KEY)?'Продолжить настройку с Сэйви':'Настроить компанию с Сэйви';
  if(visible)$('seyveoNameTip')?.setAttribute('hidden','');
 }
 function dismissHome(mode='later'){
  clearNameIdle();
  greetingDismissedInSession=true;
  try{localStorage.setItem(mode==='opt-out'?OPT_OUT_KEY:SKIP_KEY,'1')}catch{}
  if(home){home.hidden=true;home.classList.remove('is-greeting')}
  document.documentElement.classList.remove('sv-smart-start-home-active');
 }
 function exploreApp(){
  if(session)pause(true);
  dismissHome('later');
  chat.close();
 }
 // First acquaintance should flow into the existing large chat as soon
 // as the person finishes typing, without another "Continue" button.
 // A short idle interval prevents navigating in the middle of keystrokes.
 const homeNameInput=$('svSmartStartHomeName');
 let nameIdleTimer=null,nameComposing=false;
 const homeTitle=$('svSmartStartHomeTitle');
 const homeMessage=$('svSmartStartHomeMessage');
 const homeHint=$('svSmartStartHomeHint');
 function clearNameIdle(){
  if(nameIdleTimer!==null)clearTimeout(nameIdleTimer);
  nameIdleTimer=null;
 }
 function resetNameGreeting(){
  home?.classList.remove('is-greeting');
  if(homeTitle)homeTitle.textContent='Привет! Я Сэйви';
  if(homeMessage)homeMessage.textContent='SEYVEO — команда, которая меня создала. Друзья зовут меня просто Сэй. А как мне обращаться к тебе?';
  if(homeHint)homeHint.textContent='Напиши своё имя — и продолжим знакомство.';
 }
 function enterChatAfterName(){
  clearNameIdle();
  if(!home||home.hidden||session||document.visibilityState==='hidden'||!isHomeRoute())return;
  const name=String(homeNameInput?.value||'').trim().replace(/\s+/g,' ').slice(0,60);
  if(!name)return;
  home.hidden=true;
  document.documentElement.classList.remove('sv-smart-start-home-active');
  begin({name,resume:!!get(DRAFT_KEY)});
 }
 function greetBeforeChat(){
  clearNameIdle();
  if(!home||home.hidden||session||document.visibilityState==='hidden'||nameComposing||!isHomeRoute())return;
  const name=String(homeNameInput?.value||'').trim().replace(/\s+/g,' ').slice(0,60);
  if(name.length<2)return;
  homeNameInput?.blur(); // Close the iPhone keyboard so Sayvi's greeting is visible.
  home.classList.add('is-greeting');
  if(homeTitle)homeTitle.textContent='Рада знакомству, '+name+'!';
  if(homeMessage)homeMessage.textContent='Ну что, настроим твой бизнес? Я помогу всё сделать по шагам.';
  if(homeHint)homeHint.textContent='Открываю чат Сэйви…';
  // Give the greeting a moment to be read. No "Continue" control.
  nameIdleTimer=setTimeout(enterChatAfterName,1450);
 }
 function scheduleNameTransition(){
  clearNameIdle();resetNameGreeting();
  if(nameComposing||!home||home.hidden||session||!isHomeRoute())return;
  if(String(homeNameInput?.value||'').trim().length<2)return;
  // Avoid navigating in the middle of typing a name.
  nameIdleTimer=setTimeout(greetBeforeChat,1600);
 }
 homeNameInput?.addEventListener('input',scheduleNameTransition);
 homeNameInput?.addEventListener('compositionstart',()=>{nameComposing=true;clearNameIdle()});
 homeNameInput?.addEventListener('compositionend',()=>{nameComposing=false;scheduleNameTransition()});
 homeNameInput?.addEventListener('keydown',event=>{
  if(event.key!=='Enter'||event.isComposing||nameComposing)return;
  event.preventDefault();greetBeforeChat();
 });
 homeForm?.addEventListener('submit',event=>{event.preventDefault();greetBeforeChat()});
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){
   clearNameIdle();
  }else if(home&&!home.hidden&&!session){
   // Returning from another app must not trigger an unexpected redirect.
   resetNameGreeting();
  }
 });
 $('svSmartStartHomeLater')?.addEventListener('click',()=>dismissHome('later'));
 $('svSmartStartHomeOptOut')?.addEventListener('click',()=>dismissHome('opt-out'));
 // Give normal app navigation precedence over the onboarding timer.
 // Capturing the click BEFORE route handlers prevents a late automatic jump.
 document.addEventListener('click',event=>{
  if(!home||home.hidden)return;
  const target=event.target;
  if(!(target instanceof Element)||home.contains(target))return;
  if(!target.closest('button,a,summary,[role="button"]'))return;
  dismissHome('exploring');
 },true);
 $('svCabinetStartWithSayvi')?.addEventListener('click',()=>{
  $('svCabinetDialog')?.close?.();
  begin({resume:!!get(DRAFT_KEY)});
 });
 // Reuse the existing "Tell Sayvi about my business" entry. Capture before
 // the legacy handler so it does not open two competing introductions.
 $('openSayviBusinessIntro')?.addEventListener('click',event=>{
  event.preventDefault();event.stopImmediatePropagation();
  begin({resume:!!get(DRAFT_KEY)});
 },true);
 $('seyveoConversationBack')?.addEventListener('click',()=>pause(true),true);
 window.addEventListener('seyveo:conversation-closed',()=>{if(session)pause(true)});
 window.addEventListener('hashchange',()=>{
  if(home&&!home.hidden&&!isHomeRoute())dismissHome('exploring');
  if(session&&location.hash&&!['#home','#'].includes(location.hash))pause(true);
 });
 window.addEventListener('seyveo:profile-changed',syncHome);
 window.addEventListener('storage',event=>{
  if([PLAN_KEY,DRAFT_KEY,'seyveo-first-acquaintance-v1',SKIP_KEY,OPT_OUT_KEY].includes(event.key))syncHome();
 });
 syncHome();
 window.SEYVEO_SMART_START=Object.freeze({begin,resume:()=>begin({resume:true}),getPlan:()=>get(PLAN_KEY)});
})();
