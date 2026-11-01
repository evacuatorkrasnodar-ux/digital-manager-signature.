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
 const isCore=id==='seyveoConversationMic';
 button.id=id;
 button.type='button';
 button.className='seyveo-conversation-mic composer-icon'+(isCore?' seyveo-chat-core':'');
 button.setAttribute('aria-label','Говорить с Сэйви');
 button.setAttribute('aria-pressed','false');
 button.title=isCore?'Нажать — говорить с Сэйви; удерживать — голосовая команда':'Говорить с Сэйви';
 button.innerHTML=isCore
  ?'<span class="seyveo-chat-core-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2.6c1.4 5.7 3.7 8 9.4 9.4-5.7 1.4-8 3.7-9.4 9.4-1.4-5.7-3.7-8-9.4-9.4 5.7-1.4 8-3.7 9.4-9.4Z"/></svg></span>'
  :'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h7"/></svg>';
 let holdTimer=0,holding=false,lastHold=0;
 if(isCore){
  button.addEventListener('pointerdown',event=>{
   if(event.button!==0||event.isPrimary===false)return;
   clearTimeout(holdTimer);holding=false;
   holdTimer=setTimeout(()=>{
    if(!root.classList.contains('seyveo-conversation'))return;
    holding=true;
    window.SEYVEO_CONVERSATION_TOGGLE_VOICE?.();
   },480);
  });
  const finishHold=()=>{
   clearTimeout(holdTimer);holdTimer=0;
   if(!holding)return;
   holding=false;lastHold=Date.now();
   window.SEYVEO_CONVERSATION_STOP_VOICE?.();
  };
  button.addEventListener('pointerup',finishHold);
  button.addEventListener('pointercancel',finishHold);
  button.addEventListener('pointerleave',finishHold);
  button.addEventListener('contextmenu',event=>event.preventDefault());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finishHold()});
 }
 button.addEventListener('click',()=>{
   if(isCore&&Date.now()-lastHold<650)return;
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
/* One compact five-action chat dock: return · attach · Sayvi · Browser · send.
   Preserve the original Back, microphone, Send, and History handlers.
   History is in the + menu, not another permanent sixth icon. */
if(compact){
 const back=$('seyveoConversationBack');
 compact.insertBefore(back,compact.firstChild);
 const plus=document.createElement('button');
 plus.type='button';plus.id='seyveoChatPlus';
 plus.setAttribute('aria-label','Вложения и история');
 plus.setAttribute('aria-expanded','false');
 plus.setAttribute('aria-controls','seyveoChatTools');
 plus.title='Вложения и история';
 plus.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
 const photos=document.createElement('input');
 photos.type='file';photos.id='seyveoChatPhotoFile';
 photos.accept='image/*';photos.hidden=true;
 photos.setAttribute('aria-label','Выбрать фотографию из устройства');
 photos.addEventListener('change',()=>{
  if(photos.files?.length)
   window.alert('Фотография выбрана. Отправка изображений Сэйви пока не подключена.');
  photos.value='';
 });
 const tools=document.createElement('div');
 tools.id='seyveoChatTools';tools.className='seyveo-chat-tools';
 tools.setAttribute('aria-label','Вложения и история бесед');
 tools.hidden=true;
 tools.innerHTML='<button type="button" id="seyveoChatChoosePhoto"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m5.5 17 4.5-4 3 2 3.2-3 3 3"/></svg>Фотография</button>'+
  '<button type="button" id="seyveoChatOpenHistory"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v5h5M5.5 10A7.5 7.5 0 1 1 5 15M12 7.8V12l3 2"/></svg>История бесед</button>';
 function showTools(show){
  tools.hidden=!show;
  plus.setAttribute('aria-expanded',String(show));
 }
 plus.addEventListener('click',()=>showTools(tools.hidden));
 tools.querySelector('#seyveoChatChoosePhoto').addEventListener('click',()=>{
  showTools(false);photos.click();
 });
 tools.querySelector('#seyveoChatOpenHistory').addEventListener('click',()=>{
  showTools(false);window.SEYVEO_CHAT_HISTORY?.open();
 });
 document.addEventListener('pointerdown',event=>{
  if(!tools.hidden&&!tools.contains(event.target)&&!plus.contains(event.target))
   showTools(false);
 },true);
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!tools.hidden){showTools(false);plus.focus();event.stopPropagation();}
 });
 document.addEventListener('seyveo:conversation-close',()=>showTools(false));
 compact.insertBefore(plus,compact.querySelector('#seyveoConversationMic'));
 form.appendChild(tools);
 document.body.append(photos);
 const browser=document.createElement('button');
 browser.type='button';browser.id='seyveoChatBrowser';
 browser.title='Открыть SEYVEO Browser';
 browser.setAttribute('aria-label','Открыть SEYVEO Browser');
 browser.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.7 12h16.6M12 3.5c-4 4.7-4 12.3 0 17M12 3.5c4 4.7 4 12.3 0 17"/></svg>';
 browser.addEventListener('click',()=>{
  showTools(false);
  window.SEYVEO_CONVERSATION_STOP_VOICE?.();
  if(!window.SEYVEO_BROWSER?.open?.())status('Браузер пока недоступен',2500);
 });
 compact.insertBefore(browser,$('composerCompactSend'));
}
if(composerHead)composerHead.insertBefore(microphone('seyveoConversationMicLarge'),composerHead.querySelector('#collapseComposer'));

let statusTimer=0,speakingNow=false;
let returnRoute=''; // Workspace to restore after this single conversation closes.
let returnSource='home';
const backIcon=$('seyveoConversationBack');
const contextGlyphs={
 home:'<path d="m12 4-8 6.5V20h6v-6h4v6h6v-9.5L12 4Z"/>',
 music:'<path d="M23 5v12.5a3 3 0 1 1-2-2.85V8l9-2v9.5a3 3 0 1 1-2-2.85V4z" transform="translate(-3 0) scale(.94)"/>',
 browser:'<circle cx="23" cy="12" r="8"/><path d="M15 12h16M23 4c-3.5 4.4-3.5 11.6 0 16M23 4c3.5 4.4 3.5 11.6 0 16"/>',
 calendar:'<rect x="15" y="5" width="16" height="16" rx="2"/><path d="M19 3v4M27 3v4M15 10h16"/>',
 tasks:'<path d="M16 6h14M16 12h14M16 18h14M12 6h1M12 12h1M12 18h1"/>',
 life:'<circle cx="23" cy="12" r="8"/><path d="M15 12h16M23 4c-3.5 4.4-3.5 11.6 0 16M23 4c3.5 4.4 3.5 11.6 0 16"/>',
 manage:'<rect x="15" y="8" width="16" height="13" rx="2"/><path d="M20 8V5h6v3M15 13h16"/>',
 documents:'<path d="M17 3h10l4 4v14H17zM27 3v5h4M20 12h8M20 16h8"/>',
 video:'<rect x="15" y="6" width="17" height="12" rx="3"/><path d="m22 9 5 3-5 3z"/>',
 sayvi:'<path d="M23 3c1.3 5.6 3.4 7.7 9 9-5.6 1.3-7.7 3.4-9 9-1.3-5.6-3.4-7.7-9-9 5.6-1.3 7.7-3.4 9-9z"/>'
};
const contextNames={home:'Главную',music:'Музыку',browser:'Браузер',
 calendar:'Календарь',tasks:'Дела',life:'Мой мир',manage:'Управление',
 documents:'Документы',video:'Видео',sayvi:'Сэйви'};
function sourceFromRoute(route){
 const r=String(route||'');
 if(r==='#sayvi-music')return 'music';
 if(r==='#sayvi-video')return 'video';
 if(r.startsWith('#calendar'))return 'calendar';
 if(r.startsWith('#sayvi-document'))return 'documents';
 if(r==='#tasks'||r==='#picture')return 'tasks';
 if(r.startsWith('#manage'))return 'manage';
 if(r==='#life')return 'life';
 if(r.startsWith('#sayvi'))return 'sayvi';
 return 'home';
}
function paintReturnButton(){
 if(!backIcon)return;
 const source=contextGlyphs[returnSource]?returnSource:'home';
 const svg=source==='home'
  ?'<svg viewBox="0 0 24 24" aria-hidden="true">'+contextGlyphs.home+'</svg>'
  :'<svg viewBox="0 0 34 24" aria-hidden="true"><path d="m8 7-5 5 5 5M3 12h8"/>'+contextGlyphs[source]+'</svg>';
 backIcon.innerHTML=svg;
 const label=source==='home'?'На Главную':'Назад в '+contextNames[source];
 backIcon.setAttribute('aria-label',label);
 backIcon.title=label;
 backIcon.dataset.returnSource=source;
}

/* The actual shared SEYVEO footer dock serves Feather Chat, too.
 * No duplicate markup or second imitation sphere: original gestures, glass
 * and player integrations remain owned by their existing modules. */
const signatureDock=document.querySelector('footer.dock');
const chatDockButtons=['navHome','navTasks','navPicture','navManage'].map(id=>$(id));
const chatDockIcons={
 plus:'<path d="M12 5v14M5 12h14"/>',
 browser:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c-4.2 4.8-4.2 12.2 0 17M12 3.5c4.2 4.8 4.2 12.2 0 17"/>',
 send:'<path d="m5 12 14-7-5 14-3-6-6-1ZM11 13l8-8"/>',
 stop:'<rect x="7" y="7" width="10" height="10" rx="2.3"/>'
};
const dockGlyph=(paths,box='0 0 24 24')=>
 '<svg class="seyveo-dock-nav-svg" viewBox="'+box+'" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
const isFeatherDock=()=>root.classList.contains('seyveo-conversation')
 && !window.SEYVEO_BROWSER?.state?.().open && !signatureDock?.classList.contains('seyveo-music-dock');
function paintFeatherDock(){
 if(!signatureDock||chatDockButtons.some(button=>!button)||!isFeatherDock())return;
 signatureDock.classList.add('seyveo-chat-dock');
 const origin=contextGlyphs[returnSource]?returnSource:'home';
 const backArt=origin==='home'
  ?dockGlyph(contextGlyphs.home)
  :dockGlyph('<path d="m8 7-5 5 5 5M3 12h8"/>'+contextGlyphs[origin],'0 0 34 24');
 const busy=Boolean(activeAction);
 const details=[
  [backArt,origin==='home'?'На Главную':'Назад в '+contextNames[origin]],
  [dockGlyph(chatDockIcons.plus),'Вложения и история'],
  [dockGlyph(chatDockIcons.browser),'Открыть SEYVEO Browser'],
  [dockGlyph(busy?chatDockIcons.stop:chatDockIcons.send),busy?'Остановить действие':'Отправить Сэйви']
 ];
 chatDockButtons.forEach((button,index)=>{
  const [art,label]=details[index];
  button.innerHTML=art+'<span>'+label+'</span>';
  button.title=label;button.setAttribute('aria-label',label);
  button.removeAttribute('aria-current');
  button.classList.remove('active','sv-nav-feedback');
  delete button.dataset.svFixedAction;
  delete button.dataset.svMusicAction;
  delete button.dataset.svBrowserAction;
 });
 signatureDock.setAttribute('aria-label','Фирменный док Сэйви — возврат, вложения, голос, браузер, отправка');
}
function releaseFeatherDock(){
 if(!signatureDock?.classList.contains('seyveo-chat-dock'))return;
 signatureDock.classList.remove('seyveo-chat-dock');
 window.SEYVEO_MAGNETIC_INK?.refresh?.();
}
signatureDock?.addEventListener('click',event=>{
 if(!isFeatherDock())return;
 const button=event.target.closest?.('button');
 if(!button||!signatureDock.contains(button))return;
 const id=button.id;
 if(id==='assistantButton'){
  event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();
  if(window.SEYVEO_DOCK_VOICE_CLICK_SUPPRESSED?.())return;
  window.SEYVEO_CONVERSATION_TOGGLE_VOICE?.();
  return;
 }
 const index=['navHome','navTasks','navPicture','navManage'].indexOf(id);
 if(index<0)return;
 event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();
 if(index===0){close();return;}
 if(index===1){$('seyveoChatPlus')?.click();return;}
 if(index===2){
  $('seyveoChatPlus')?.setAttribute('aria-expanded','false');
  $('seyveoChatTools')?.setAttribute('hidden','');
  window.SEYVEO_CONVERSATION_STOP_VOICE?.();
  const result=window.SEYVEO_BROWSER?.open?.();
  if(!result)status('Браузер пока недоступен',2500);
  return;
 }
 if(index===3){
  // Delegate to the existing real Send/Stop handler, never invent another submit.
  if(activeAction){cancelAction();return;}
  if(!$('question')?.value.trim()){
   $('question')?.focus({preventScroll:true});return;
  }
  sendButton?.click();
 }
},true);
document.addEventListener('seyveo:browser-dock-exit',()=>{
 if(root.classList.contains('seyveo-conversation'))paintFeatherDock();
});
document.addEventListener('seyveo:music-dock-exit',()=>{
 if(root.classList.contains('seyveo-conversation'))paintFeatherDock();
});
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
 if(isFeatherDock())paintFeatherDock();
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
function open(options){
 if(root.classList.contains('seyveo-conversation')){
  if(options?.source==='browser'){
   returnSource='browser';paintReturnButton();
   paintFeatherDock();
  }
  return;
 }
 // Snapshot the caller BEFORE routing to Home; the Back icon is contextual.
 const sourceHint=options&&typeof options==='object'?options.source:'';
 returnRoute=home.hidden?(location.hash||''):'';
 returnSource=sourceHint==='browser'?'browser':sourceFromRoute(returnRoute);
 if(home.hidden){
  // A Music/Browser dock replaces navHome with player/navigation controls.
  // Never synthesize a tap on "Previous track" merely to open the chat.
  const playerOwnsDock=signatureDock?.classList.contains('seyveo-music-dock')
    ||window.SEYVEO_BROWSER_DOCK?.isActive?.();
  if(!playerOwnsDock)document.getElementById('navHome')?.click();
  if(home.hidden){
   // Use the existing hashchange router, and retain the caller for Back.
   if(location.hash)history.pushState(null,'',location.pathname+location.search);
   window.dispatchEvent(new Event('hashchange'));
  }
 }
 if(home.hidden)return;
 paintReturnButton();
 root.classList.add('seyveo-conversation');
 paintFeatherDock();
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
 releaseFeatherDock();
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
 returnRoute='';returnSource='home';
 if(destination&&location.hash!==destination)location.hash=destination;
 // Allow a suspended browser caller to return to its exact tab and scroll.
 // Ordinary Feather Chat exits are unchanged when no browser is waiting.
 document.dispatchEvent(new Event('seyveo:conversation-close'));
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
   // A discoverable entry in the existing chat, not another permanent dock
   // button. The same Browser is also accessible via «Мой мир» and voice.
   const browser=document.createElement('button');
   browser.type='button';
   browser.className='seyveo-chat-browser-entry';
   browser.setAttribute('aria-label','Открыть SEYVEO Browser');
   browser.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c-4.6 4.8-4.6 11.2 0 16M12 4c4.6 4.8 4.6 11.2 0 16"/></svg><span>Открыть браузер</span>';
   browser.addEventListener('click',()=>window.SEYVEO_BROWSER?.open?.());
   const detail=document.createElement('small');
   detail.className='seyveo-chat-browser-location';
   detail.textContent='Также доступен в разделе «Мой мир»';
   welcome.append(heading,hint,browser,detail);
   nodes.push(welcome);
 }
 // Existing users have past messages and never see the welcome screen.
 // Show one small discovery line, not a permanent Home tile or extra chat.
 let discovered=false;
 try{discovered=localStorage.getItem('seyveo-browser-discovery-v1')==='seen'}catch{}
 if(turns.length&&!discovered){
  const nudge=document.createElement('div');
  nudge.className='seyveo-chat-browser-nudge';
  const globe=document.createElement('span');globe.setAttribute('aria-hidden','true');
  globe.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c-4.6 4.8-4.6 11.2 0 16M12 4c4.6 4.8 4.6 11.2 0 16"/></svg>';
  const label=document.createElement('span');label.textContent='У Сэйви есть свой браузер';
  const launch=document.createElement('button');launch.type='button';launch.textContent='Открыть';launch.setAttribute('aria-label','Открыть SEYVEO Browser');
  const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='seyveo-chat-browser-dismiss';
  dismiss.textContent='×';dismiss.setAttribute('aria-label','Больше не показывать подсказку о браузере');
  function markSeen(){
   try{localStorage.setItem('seyveo-browser-discovery-v1','seen')}catch{}
   nudge.remove();
  }
  launch.addEventListener('click',()=>{if(window.SEYVEO_BROWSER?.open?.()===true)markSeen()});
  dismiss.addEventListener('click',markSeen);
  nudge.append(globe,label,launch,dismiss);nodes.push(nudge);
 }
 text.replaceChildren(...nodes);
 // Keep the developer Flow card inside the SAME transcript after re-render.
 window.SEYVEO_BROWSER_FLOW?.mount?.(text);
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
   releaseFeatherDock();
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
window.SEYVEO_CONVERSATION={open,close,renderTurns,beginStream,updateStream,status,showSearchResults,showRichAnswer,
 endStream:()=>{if(activeAction?.kind==='stream')finishAction();else status('На связи');streamedBody=null;}
};
})();