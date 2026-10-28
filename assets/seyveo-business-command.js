/* SEYVEO · Business Command — isolated local prototype.
 * No chat transport, corporate server, identity verification or file uploads.
 * Personal SEYVEO / My World data is never read by this module.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=$('seyveoBusinessCommandPage');
if(!root)return;
const chatRoot=$('svcpChats');
const CHAT_KEY='seyveo-business-command-chat-demo-v1';
const TASK_KEY='seyveo-business-command-tasks-demo-v1';
const RECOGNITION_KEY='seyveo-peer-recognition-demo-v1';
const RECOGNITION_TYPES=Object.freeze({
 help:{name:'Спасибо',symbol:'⭐'},
 mentor:{name:'Выручил',symbol:'🙌'},
 initiative:{name:'Хорошая идея',symbol:'💡'},
 reliable:{name:'Отличная работа',symbol:'🔥'},
 support:{name:'Поддержка',symbol:'💚'}
});
const RECOGNITION_NAMES={tanya:'Таня',anna:'Анна',mikhail:'Михаил',elena:'Елена','manager-demo':'Вы · демо'};
const ROOMS=[
 {id:'general',label:'Общий чат',kind:'groups',hint:'Для всех сотрудников · общие объявления и вопросы',mark:'◎',section:'all'},
 {id:'dm-elena',label:'Елена',kind:'personal',hint:'Кассир · личный рабочий чат',mark:'Е',person:'elena',section:'people',roleGroup:'Касса'},
 {id:'dm-anna',label:'Анна',kind:'personal',hint:'Старший продавец · личный рабочий чат',mark:'А',person:'anna',section:'people',roleGroup:'Торговый зал'},
 {id:'dm-mikhail',label:'Михаил',kind:'personal',hint:'Продавец · личный рабочий чат',mark:'М',person:'mikhail',section:'people',roleGroup:'Торговый зал'},
 {id:'team',label:'Смена и команда',kind:'groups',hint:'Обсуждение смен и задач · дополнительная группа',mark:'▦',section:'extra'},
 {id:'docs',label:'Обсуждение документов',kind:'groups',hint:'Вопросы по рабочим файлам, не хранилище документов',mark:'▤',section:'extra'},
 {id:'dm-sayvi',label:'Сэйви',kind:'personal',hint:'Рабочие подсказки · пока шаблонное демо',mark:'✧',person:'sayvi',section:'assistant'}
];
const state={tab:'chats',room:'general',viewpoint:'manager',file:null,objectUrl:null,filePurpose:'file',scanCode:'',replyTo:null,draftSource:null,chat:read(CHAT_KEY),tasks:read(TASK_KEY)};
let chatsFromTasks=false,lastRecognizedPerson=null,quickReactionTarget=null,focusSearchIndex=null,historyQuery='',historyWindow=35;
let chatFilter='all',editingMessageIndex=null;
let mediaDatabasePromise=null,mediaRenderedUrls=[];
/* Only local browser storage, never a server upload or a message delivery. */
function mediaDatabase(){
 if(!('indexedDB' in window))return Promise.reject(new Error('Локальное хранилище медиа недоступно'));
 if(!mediaDatabasePromise){
  mediaDatabasePromise=new Promise((resolve,reject)=>{
   const req=indexedDB.open('seyveo-workchat-media-v1',1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files',{keyPath:'id'})};
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error||new Error('Не удалось открыть локальное хранилище'));
   req.onblocked=()=>reject(new Error('Хранилище занято другой вкладкой'));
  }).catch(error=>{mediaDatabasePromise=null;throw error});
 }
 return mediaDatabasePromise;
}
async function saveMediaLocally(file){
 const db=await mediaDatabase();
 const id='photo-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('files','readwrite');
  tx.oncomplete=resolve;
  tx.onerror=()=>reject(tx.error||new Error('Не сохранился файл'));
  tx.onabort=()=>reject(tx.error||new Error('Запись отменена'));
  tx.objectStore('files').put({id,blob:file,name:file.name,type:file.type,at:Date.now()});
 });
 return id;
}
async function loadMediaLocally(id){
 const db=await mediaDatabase();
 return new Promise((resolve,reject)=>{
  const request=db.transaction('files','readonly').objectStore('files').get(id);
  request.onsuccess=()=>resolve(request.result||null);
  request.onerror=()=>reject(request.error||new Error('Файл недоступен'));
 });
}
function clearMediaRenderUrls(){
 for(const url of mediaRenderedUrls)URL.revokeObjectURL(url);
 mediaRenderedUrls=[];
}
function restoreStoredMedia(container,message){
 if(!message.mediaId)return;
 const slot=el('div','svcp-media-slot','Открываю вложение…');
 container.append(slot);
 loadMediaLocally(message.mediaId).then(record=>{
  if(!slot.isConnected)return;
  slot.replaceChildren();
  if(!record?.blob){slot.textContent='Вложение недоступно на этом устройстве';return}
  const url=URL.createObjectURL(record.blob);mediaRenderedUrls.push(url);
  if(record.type?.startsWith('image/')){
   const picture=el('img','svcp-chat-media-image');
   picture.src=url;picture.alt='Фото: '+(record.name||'рабочая съёмка');picture.loading='lazy';
   slot.append(picture);
  }else if(record.type?.startsWith('audio/')||message.mediaType?.startsWith('audio/')){
   const audio=el('audio','svcp-chat-media-audio');audio.src=url;audio.preload='metadata';
   const control=el('button','svcp-audio-play','▶');control.type='button';
   control.setAttribute('aria-label','Воспроизвести голосовое сообщение');
   const wave=el('span','svcp-audio-wave');
   for(let i=0;i<19;i++){const stick=el('i');stick.style.height=(7+((i*17+13)%19))+'px';wave.append(stick)}
   const duration=el('time','svcp-audio-duration',
    message.audioDuration?voiceDuration(message.audioDuration*1000):'Голосовое');
   control.addEventListener('click',async()=>{try{
    if(audio.paused){await audio.play()}else audio.pause();
   }catch{setStatus('Аудиозапись не удалось воспроизвести')}});
   audio.addEventListener('play',()=>{control.textContent='Ⅱ';control.setAttribute('aria-label','Приостановить голосовое')});
   audio.addEventListener('pause',()=>{control.textContent='▶';control.setAttribute('aria-label','Воспроизвести голосовое')});
   audio.addEventListener('ended',()=>{control.textContent='▶'});
   audio.addEventListener('timeupdate',()=>{
    if(Number.isFinite(audio.duration)&&audio.duration>0){
     wave.style.setProperty('--svcp-play-progress',Math.min(100,Math.round(audio.currentTime/audio.duration*100))+'%');
     duration.textContent=voiceDuration((audio.duration-audio.currentTime)*1000);
    }
   });
   slot.classList.add('svcp-voice-message');
   slot.append(control,wave,duration,audio);
  }else if(record.type?.startsWith('video/')){
   const video=el('video','svcp-chat-media-video');
   video.src=url;video.controls=true;video.playsInline=true;video.preload='metadata';
   video.setAttribute('aria-label','Рабочее видео: '+(record.name||''));slot.append(video);
  }else{
   const link=el('a','svcp-chat-media-file','Открыть файл · '+(record.name||'вложение'));
   link.href=url;link.download=record.name||'seyveo-file';slot.append(link);
  }
  const note=el('small','svcp-chat-media-local','Только на этом устройстве · без отправки');
  slot.append(note);
 }).catch(()=>{if(slot.isConnected)slot.textContent='Вложение недоступно в этом браузере'});
}


/* One real audio recording flow, using the existing local chat and IndexedDB.
 * No dictation, upload, background mic or cross-device delivery.
 * Tap mic -> stop -> review -> send (or discard). */
const voiceRecordButton=$('svcpVoiceRecord'),voicePanel=$('svcpVoiceCapture');
const voiceStopButton=$('svcpVoiceStop'),voiceSendButton=$('svcpVoiceSend'),voiceCancelButton=$('svcpVoiceCancel');
const voicePreview=$('svcpVoicePreview'),voiceClock=$('svcpVoiceClock'),voiceLabel=$('svcpVoiceLabel');
const voiceHint=$('svcpVoiceHint');
let voiceSession=null,voiceDraft=null,voicePreviewUrl=null,voiceRequestId=0,voiceSaving=false;
function voiceDuration(ms){
 const seconds=Math.max(0,Math.floor(ms/1000));
 return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
}
function releaseVoiceStream(stream){
 try{stream?.getTracks().forEach(track=>track.stop())}catch{}
}
function clearVoiceDraft(){
 voiceDraft=null;
 if(voicePreview) {
  voicePreview.pause();voicePreview.removeAttribute('src');voicePreview.load();
  voicePreview.hidden=true;
 }
 if(voicePreviewUrl){URL.revokeObjectURL(voicePreviewUrl);voicePreviewUrl=null}
}
function setVoicePanel(open,stateName='recording'){
 if(!voicePanel)return;
 voicePanel.hidden=!open;voicePanel.dataset.state=stateName;
 voiceRecordButton?.setAttribute('aria-expanded',String(open));
 if(voiceStopButton)voiceStopButton.hidden=stateName!=='recording';
 if(voiceSendButton)voiceSendButton.hidden=stateName!=='ready';
 if(voiceLabel)voiceLabel.textContent=stateName==='recording'?'Идёт запись голоса':
  stateName==='processing'?'Подготавливаю запись…':
  stateName==='error'?'Микрофон недоступен':'Голосовое сообщение';
}
function showVoiceError(message){
  setStatus(message);
  setVoicePanel(true,'error');
  if(voiceHint)voiceHint.textContent=message;
}
function cancelVoice(){
 voiceRequestId++;
 if(voiceSession){
  const current=voiceSession;voiceSession=null;
  current.discard=true;clearInterval(current.timer);
  releaseVoiceStream(current.stream);
  try{if(current.recorder?.state!=='inactive')current.recorder.stop()}catch{}
 }
 clearVoiceDraft();setVoicePanel(false);
 if(voiceClock)voiceClock.textContent='00:00';
 voiceSaving=false;
 if(voiceSendButton)voiceSendButton.disabled=false;
}
function stopVoice(){
 const current=voiceSession;
 if(!current||current.finished)return;
 current.finished=true;clearInterval(current.timer);
 setVoicePanel(true,'processing');
 if(voiceHint)voiceHint.textContent='Сохраняю запись для прослушивания…';
 // Stop the mic immediately even before the encoder finishes its final chunk.
 try{
  if(current.recorder.state!=='inactive')current.recorder.stop();
  else current.recorder.onstop?.();
 }catch{
  current.discard=true;releaseVoiceStream(current.stream);voiceSession=null;
  setStatus('Не удалось завершить запись голоса.');cancelVoice();
 }
 releaseVoiceStream(current.stream);
}
async function startVoice(){
 if(voiceSession){stopVoice();return}
 if(voiceSaving)return;
 if(voiceDraft){setStatus('Сначала отправь или удали уже записанное голосовое.');return}
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
  showVoiceError('Здесь запись голоса недоступна. Открой SEYVEO через HTTPS в браузере с поддержкой микрофона.');return;
 }
 const requested=++voiceRequestId;
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  if(requested!==voiceRequestId){releaseVoiceStream(stream);return}
  const choices=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];
  const mime=choices.find(type=>{try{return MediaRecorder.isTypeSupported(type)}catch{return false}});
  let recorder;
  try{recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined)}
  catch{
   try{recorder=new MediaRecorder(stream)}
   catch(error){releaseVoiceStream(stream);throw error}
  }
  const session={recorder,stream,chunks:[],room:state.room,viewpoint:state.viewpoint,
   started:Date.now(),timer:null,finished:false,discard:false,token:requested};
  voiceSession=session;
  recorder.ondataavailable=e=>{if(e.data?.size)session.chunks.push(e.data)};
  recorder.onerror=()=>{
   if(session.discard)return;
   cancelVoice();
   showVoiceError('Ошибка записи. Проверь разрешение на микрофон.');
  };
  recorder.onstop=()=>{
   releaseVoiceStream(session.stream);clearInterval(session.timer);
   if(session.discard||voiceSession!==session||session.token!==voiceRequestId)return;
   voiceSession=null;
   const duration=Math.max(0,Date.now()-session.started);
   const mimeType=recorder.mimeType||session.chunks[0]?.type||'audio/mp4';
   const audio=new Blob(session.chunks,{type:mimeType});
   if(!audio.size||duration<450){
    setStatus('Запись слишком короткая. Попробуй ещё раз.');cancelVoice();return;
   }
   voiceDraft={blob:audio,duration,room:session.room,viewpoint:session.viewpoint};
   if(voicePreview){
    voicePreviewUrl=URL.createObjectURL(audio);
    voicePreview.src=voicePreviewUrl;voicePreview.hidden=false;
   }
   if(voiceHint)voiceHint.textContent='Прослушай запись и отправь, либо удали.';
   setVoicePanel(true,'ready');
  };
  try{recorder.start(300)}
  catch(error){session.discard=true;voiceSession=null;releaseVoiceStream(stream);throw error}
  clearVoiceDraft();
  setVoicePanel(true,'recording');
  if(voiceClock)voiceClock.textContent='00:00';
  if(voiceHint)voiceHint.textContent='Нажми «Остановить», чтобы прослушать голосовое перед отправкой.';
  session.timer=setInterval(()=>{
   if(voiceSession!==session)return;
   const duration=Date.now()-session.started;
   if(voiceClock)voiceClock.textContent=voiceDuration(duration);
   if(duration>=120000)stopVoice();
  },250);
 }catch(error){
  if(requested!==voiceRequestId)return;
  const denied=error?.name==='NotAllowedError'||error?.name==='PermissionDeniedError';
  cancelVoice();
  showVoiceError(denied?'Для голосовых сообщений разреши доступ к микрофону в настройках браузера.':
   'Не удалось включить запись голоса. Проверь микрофон и разрешения.');
 }
}
async function sendVoice(){
 if(voiceSaving||!voiceDraft)return;
 if(voiceSession){stopVoice();return}
 const draft=voiceDraft;
 if(state.room!==draft.room){
  setStatus('Запись начата в другом чате. Вернись туда или удали запись.');return;
 }
 voiceSaving=true;if(voiceSendButton)voiceSendButton.disabled=true;
 const mime=draft.blob.type||'audio/mp4';
 const ext=mime.includes('mp4')?'m4a':mime.includes('ogg')?'ogg':'webm';
 const name='seyveo-voice-'+Date.now()+'.'+ext;
 try{
  const file=new File([draft.blob],name,{type:mime});
  const mediaId=await saveMediaLocally(file);
  // The same room history and one recipient context as text messages.
  const entry={room:draft.room,text:'Голосовое сообщение · '+voiceDuration(draft.duration),
   at:Date.now(),role:draft.viewpoint==='elena'?'demo-elena':'self',
   mediaId,mediaType:mime,mediaPurpose:'voice',audioDuration:Math.round(draft.duration/1000)};
  const updated=state.chat.concat(entry).slice(-500);
  if(!save(CHAT_KEY,updated))return;
  state.chat=updated;
  cancelVoice();
  renderChat();renderDirectory();
  setStatus('Голосовое сообщение сохранено в переписке на этом устройстве. Другим людям пока не доставляется.');
 }catch{
  const message='Не получилось сохранить голосовое на устройстве. Проверь свободное место и повтори.';
  setStatus(message);if(voiceHint)voiceHint.textContent=message;
 }finally{
  voiceSaving=false;
  if(voiceSendButton)voiceSendButton.disabled=false;
 }
}
voiceRecordButton?.addEventListener('click',startVoice);
voiceStopButton?.addEventListener('click',stopVoice);
voiceCancelButton?.addEventListener('click',cancelVoice);
voiceSendButton?.addEventListener('click',sendVoice);
window.addEventListener('seyveo:work-chat-closing',cancelVoice);

function read(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.slice(-(key===CHAT_KEY?500:100)):[]}catch{return []}}
function save(key,list){try{localStorage.setItem(key,JSON.stringify(list));return true}catch{setStatus('Не удалось сохранить на этом устройстве. Проверьте свободное место и разрешения браузера.');return false}}
let statusResetTimer=null;
function setStatus(s){
 const el=$('svcpChatStatus');if(!el)return;
 el.textContent=s;
 clearTimeout(statusResetTimer);
 const screen=$('svcpWorkChatScreen');
 if(screen&&!screen.hidden&&screen.dataset.view==='room'){
  el.dataset.show='true';
  statusResetTimer=setTimeout(()=>{el.dataset.show='false'},3400);
 }else el.dataset.show='false';
}
window.addEventListener('seyveo:work-chat-closing',()=>{
 clearTimeout(statusResetTimer);
 const el=$('svcpChatStatus');if(el)el.dataset.show='false';
});
function syncComposerActions(){
 const form=$('svcpChatForm');if(!form)return;
 const text=$('svcpChatInput')?.value.trim()||'';
 form.dataset.hasContent=String(!!(text||state.file||state.scanCode));
}
$('svcpChatInput')?.addEventListener('input',syncComposerActions);
function el(tag,cls,txt){const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node}

/* Reuse the working employee, shift, recruitment and ROI widgets rather than
   creating parallel copies. Moving existing DOM nodes preserves their listeners. */
function peopleView(name){
 const hiring=name==='hiring';
 const directory=$('svcpPeopleDirectory'),recruitment=$('svcpPeopleHiring');
 if(directory)directory.hidden=hiring;
 if(recruitment)recruitment.hidden=!hiring;
 document.querySelectorAll('#svcpTeam [data-svcp-people]').forEach(button=>{
  button.setAttribute('aria-pressed',String(button.dataset.svcpPeople===(hiring?'hiring':'team')));
 });
}
function preparePeopleContent(){
 const cards=$('seyveoStaffCards'),cardsHost=$('svcpPeopleCardsHost');
 if(cards&&cardsHost){
  const obsoleteWrapper=cards.closest('details.seyveo-hr-fold');
  cardsHost.append(cards);
  // This wrapper belonged to the old recruiting menu and is now empty.
  obsoleteWrapper?.remove();
 }
 const shiftFold=$('seyveoShiftToggle')?.closest('details.seyveo-hr-fold');
 const shiftHost=$('svcpPeopleShiftHost');
 if(shiftFold&&shiftHost)shiftHost.append(shiftFold);
 const interview=$('seyveoHrDemoOpen');
 const recruitingBody=interview?.closest('details.seyveo-manage-fold')?.querySelector('.seyveo-manage-fold-body');
 const recruitingHost=$('svcpPeopleHiringHost');
 if(recruitingBody&&recruitingHost)recruitingHost.append(...Array.from(recruitingBody.childNodes));
 const roi=$('seyveoRoiForm'),roiHost=$('pictureEfficiencyHost');
 if(roi&&roiHost)roiHost.append(roi);
 peopleView('team');
}
document.querySelectorAll('#svcpTeam [data-svcp-people]').forEach(button=>
 button.addEventListener('click',()=>peopleView(button.dataset.svcpPeople)));
function tab(name){
 if(!['chats','team','tasks'].includes(name))return;
 state.tab=name;
 // Panels now live in different workspaces; the old parent is not their root.
 // Update by persistent element IDs instead of querying the retired container.
 const panels={chats:$('svcpChats'),team:$('svcpTeam'),tasks:$('svcpTasks')};
 if(name==='chats'){
  if(panels.chats)panels.chats.hidden=false;
  chatsFromTasks=false;showInbox();
 }else if(name==='tasks')renderTasks();
 else peopleView('team');
}
chatRoot.querySelectorAll('[data-svcp-room]').forEach(button=>
 button.addEventListener('click',()=>openRoom(button.dataset.svcpRoom)));
const STAFF={elena:'Елена',anna:'Анна',mikhail:'Михаил'};
function roomDetails(){return ROOMS.find(x=>x.id===state.room)||ROOMS[0]}
function privateAssignmentRecipient(){
 const room=roomDetails();
 return state.viewpoint==='manager'&&room.kind==='personal'&&room.person&&
  Object.prototype.hasOwnProperty.call(STAFF,room.person)?room.person:'';
}
function employeePreviewActive(){return window.SEYVEO_PREVIEW?.isEmployee?.()===true}
function employeeAllowedRoom(roomId){return ['general','team','docs','dm-elena','dm-sayvi'].includes(roomId)}
function senderName(msg){
 if(msg.role==='recognition')return '✦ Знак признания · демо';
 if(msg.role==='sayvi')return 'Сэйви · демо';
 if(msg.role==='demo-elena')return 'Елена · учебный пример';
 return roomDetails().kind==='personal'?'Руководитель · демо':'Вы · демо';
}
function renderDirectory(){
 const list=$('svcpConversationList');if(!list)return;
 if(renderHistorySearch())return;
 list.replaceChildren();
 $('svcpChatFilters')?.querySelectorAll('[data-svcp-chat-filter]').forEach(button=>
  button.setAttribute('aria-pressed',String(button.dataset.svcpChatFilter===chatFilter)));
 if(chatFilter==='saved'){
  const savedMessages=state.chat.map((msg,index)=>({msg,index}))
   .filter(({msg})=>msg?.starred&&typeof msg.text==='string'&&
    ROOMS.some(room=>room.id===msg.room)&&(!employeePreviewActive()||employeeAllowedRoom(msg.room)))
   .reverse();
  if(!savedMessages.length){
   list.append(el('p','svcp-search-empty','Здесь будут отмеченные тобой сообщения. Звёздочку можно поставить в меню сообщения.'));
   return;
  }
  for(const {msg,index} of savedMessages){
   const room=ROOMS.find(r=>r.id===msg.room);
   const row=el('button','svcp-search-result svcp-saved-result');row.type='button';
   row.append(el('strong',null,'★ '+(employeePreviewActive()&&room.id==='dm-elena'?'Руководитель':room.label)),
    el('span',null,msg.text.slice(0,145)));
   row.addEventListener('click',()=>{openRoom(msg.room);focusSearchIndex=index;renderChat()});
   list.append(row);
  }
  return;
 }
 /* Keep the existing rooms and conversation IDs so old local messages still open.
    One compact name/role line and one real message preview, not three descriptions. */
 const latest=new Map();
 for(const item of state.chat){
  if(item&&typeof item.text==='string'&&item.text.trim())latest.set(item.room,item);
 }
 const roleLabels={elena:'Кассир',anna:'Старший продавец',mikhail:'Продавец'};
 const groupHints={general:'Объявления и вопросы команды',team:'Смены и рабочие задачи',docs:'Вопросы по рабочим файлам'};
 function previewTime(at){
  if(!Number.isFinite(Number(at)))return '';
  const date=new Date(at),now=new Date();
  if(Number.isNaN(date.getTime()))return '';
  if(date.toDateString()===now.toDateString())return date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  const startOfToday=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
  if(date.getTime()>=startOfToday-86400000&&date.getTime()<startOfToday)return 'Вчера';
  return date.toLocaleDateString('ru-RU',{day:'numeric',month:'short',...(date.getFullYear()===now.getFullYear()?{}:{year:'2-digit'})});
 }
 const visibleRooms=ROOMS.filter(room=>
  (!employeePreviewActive()||employeeAllowedRoom(room.id))&&
  (chatFilter!=='people'||room.kind==='personal')&&
  (chatFilter!=='groups'||room.kind==='groups'))
  .sort((a,b)=>(Number(latest.get(b.id)?.at)||0)-(Number(latest.get(a.id)?.at)||0));
 for(const room of visibleRooms){
  const managerDialog=employeePreviewActive()&&room.id==='dm-elena';
  const person=room.person&&roleLabels[room.person];
  const last=latest.get(room.id);
  const name=managerDialog?'Руководитель':room.label;
  const row=el('button','svcp-directory-item');row.type='button';
  row.setAttribute('aria-label',(room.kind==='personal'?'Открыть личный чат: ':'Открыть чат: ')+name+(person&&!managerDialog?', '+person:''));
  const avatar=el('span','svcp-directory-avatar'+(room.person==='sayvi'?' is-sayvi':''),managerDialog?'Р':room.mark);
  avatar.setAttribute('aria-hidden','true');
  const body=el('span','svcp-directory-item-body');
  const headline=el('span','svcp-directory-item-head');
  headline.append(el('strong','svcp-directory-name',name));
  if(last?.at){
   const time=el('time','svcp-directory-time',previewTime(last.at));
   const d=new Date(last.at);
   if(!Number.isNaN(d.getTime()))time.dateTime=d.toISOString();
   headline.append(time);
  }
  const role=managerDialog?'Личный рабочий чат':person?person:room.person==='sayvi'?'Помощник':
   room.kind==='groups'?'Группа':'';
  const lastLine=last?last.text.replace(/\s+/g,' ').trim():null;
  const fallback=managerDialog?'Написать руководителю':person?'Начать переписку':room.person==='sayvi'?'Рабочие подсказки':groupHints[room.id]||'Открыть чат';
  const description=el('span','svcp-directory-preview');
  if(role){
   description.append(el('span','svcp-directory-role',role));
   description.append(document.createTextNode(' · '));
  }
  description.append(document.createTextNode(lastLine||fallback));
  body.append(headline,description);
  const arrow=el('span','svcp-directory-chevron','›');arrow.setAttribute('aria-hidden','true');
  row.append(avatar,body,arrow);
  row.addEventListener('click',()=>openRoom(room.id));
  list.append(row);
 }
}
$('svcpChatFilters')?.addEventListener('click',event=>{
 const button=event.target.closest('[data-svcp-chat-filter]');
 if(!button)return;
 const next=button.dataset.svcpChatFilter;
 if(!['all','people','groups','saved'].includes(next))return;
 chatFilter=next;
 const search=$('svcpHistorySearch');if(search){search.value='';historyQuery=''}
 renderDirectory();
});
/* Search existing local chat history and team assignments, no new archive page. */
function renderHistorySearch(){
 const query=historyQuery.trim().toLocaleLowerCase('ru-RU'),list=$('svcpConversationList');
 if(!query||!list)return false;
 list.replaceChildren();
 const chatHits=state.chat.map((item,index)=>({item,index}))
  .filter(({item})=>item&&typeof item.text==='string'&&
   (!employeePreviewActive()||employeeAllowedRoom(item.room))&&ROOMS.some(room=>room.id===item.room)&&
   (item.text.toLocaleLowerCase('ru-RU').includes(query)||
    (ROOMS.find(room=>room.id===item.room)?.label||'').toLocaleLowerCase('ru-RU').includes(query)))
  .reverse().slice(0,30);
 const roleLabels={elena:'Кассир',anna:'Старший продавец',mikhail:'Продавец'};
 const roomHits=ROOMS.filter(room=>{
  if(employeePreviewActive()&&!employeeAllowedRoom(room.id))return false;
  const name=employeePreviewActive()&&room.id==='dm-elena'?'Руководитель':room.label;
  const role=employeePreviewActive()&&room.id==='dm-elena'?'руководитель':roleLabels[room.person]||room.hint;
  return (name+' '+role).toLocaleLowerCase('ru-RU').includes(query);
 });
 const taskHits=state.tasks.map((item,index)=>({item,index}))
  .filter(({item})=>item&&typeof item.text==='string'&&
   (!employeePreviewActive()||item.assigneeId==='elena')&&item.text.toLocaleLowerCase('ru-RU').includes(query))
  .reverse().slice(0,30);
 function heading(textValue,count){
  const h=el('div','svcp-search-results-heading');
  h.append(el('strong',null,textValue),el('small',null,String(count)));
  list.append(h);
 }
 function resultRow(title,excerpt,click){
  const row=el('button','svcp-search-result');
  row.type='button';
  row.append(el('strong',null,title),el('span',null,excerpt));
  row.addEventListener('click',click);
  list.append(row);
 }
 if(roomHits.length){
  heading('Чаты',roomHits.length);
  for(const room of roomHits){
   const name=employeePreviewActive()&&room.id==='dm-elena'?'Руководитель':room.label;
   const role=employeePreviewActive()&&room.id==='dm-elena'?'Личный рабочий чат':roleLabels[room.person]||room.hint;
   resultRow(name,role,()=>openRoom(room.id));
  }
 }
 heading('Сообщения',chatHits.length);
 for(const {item,index} of chatHits){
  const room=ROOMS.find(x=>x.id===item.room);
  resultRow(room?.label||'Чат',item.text.slice(0,150),()=>{
   openRoom(item.room);
   focusSearchIndex=index;
   renderChat();
  });
 }
 heading('Поручения',taskHits.length);
 for(const {item,index} of taskHits){
  resultRow((item.done?'✓ Выполнено · ':'В работе · ')+(STAFF[item.assigneeId]||'Команда'),item.text.slice(0,150),()=>{
   if(employeePreviewActive()){
    window.SEYVEO_UNIFIED_TASKS?.openChat?.('tasks','dm-elena','elena');
    return;
   }
   window.SEYVEO_UNIFIED_TASKS?.openBusiness?.('preserve');
   requestAnimationFrame(()=>focusTask(index));
  });
 }
 if(!roomHits.length&&!chatHits.length&&!taskHits.length){
  list.append(el('p','svcp-search-empty','Ничего не найдено. Попробуйте имя, должность или слово из сообщения.'));
 }
 return true;
}
$('svcpHistorySearch')?.addEventListener('input',event=>{
 historyQuery=event.target.value||'';
 if(!renderHistorySearch())renderDirectory();
});
function focusTask(index){
 const list=$('svcpTaskList');
 if(!list)return;
 const row=list.querySelector('[data-svcp-task-index="'+index+'"]');
 if(!row)return;
 const archive=row.closest('details.svcp-task-history');if(archive)archive.open=true;
 row.classList.add('is-search-hit');
 row.scrollIntoView({block:'center',behavior:'auto'});
}
function showInbox(){
 cancelVoice();editingMessageIndex=null;
 const container=$('svcpWorkChatScreen');
 if(container)container.dataset.view='inbox';
 const info=$('svcpRoomInfo');if(info)info.hidden=true;
 $('svcpRoomInfoToggle')?.setAttribute('aria-expanded','false');
 closeRecognition();
 closeComposerEmoji();
 setCameraTray(false);
 $('svcpRecognizeOpenCard').hidden=true;lastRecognizedPerson=null;
 state.viewpoint=employeePreviewActive()?'elena':'manager';
 window.dispatchEvent(new CustomEvent('seyveo:work-role-preview',{detail:{role:state.viewpoint==='elena'?'employee':'manager'}}));
 $('svcpChatDirectory').hidden=false;
 $('svcpConversation').hidden=true;
 $('svcpReturnToTasks').hidden=true;
 $('svcpTaskDiscussionQuick').hidden=true;
 clearReply();cancelTaskDraft();cleanupPreview();
 const composer=$('svcpChatInput');if(composer)composer.value='';
 syncComposerActions();
 renderDirectory();
}
function openRoom(roomId){
 cancelVoice();editingMessageIndex=null;
 const container=$('svcpWorkChatScreen');
 if(container)container.dataset.view='room';
 const info=$('svcpRoomInfo');if(info)info.hidden=true;
 $('svcpRoomInfoToggle')?.setAttribute('aria-expanded','false');
 closeRecognition();
 closeComposerEmoji();
 setCameraTray(false);
 historyWindow=35;
 $('svcpRecognizeOpenCard').hidden=true;lastRecognizedPerson=null;
 const selected=ROOMS.find(x=>x.id===roomId);if(!selected)return;
 if(employeePreviewActive()&&!employeeAllowedRoom(selected.id))return;
 state.room=selected.id;
 state.viewpoint=employeePreviewActive()?'elena':'manager';
 const avatar=$('svcpRoomAvatar');if(avatar)avatar.textContent=state.viewpoint==='elena'&&selected.id==='dm-elena'?'Р':selected.mark;
 const roomName=$('svcpRoomInfoName');if(roomName)roomName.textContent=
  state.viewpoint==='elena'&&selected.id==='dm-elena'?'Руководитель':selected.label;
 const roomDescription=$('svcpRoomInfoDescription');
 if(roomDescription)roomDescription.textContent=selected.hint+
  (selected.kind==='groups'?' · общий рабочий разговор':' · личная переписка');
 $('svcpChatDirectory').hidden=true;
 $('svcpConversation').hidden=false;
 $('svcpConversationTitle').textContent=employeePreviewActive()&&selected.id==='dm-elena'
 ?'Руководитель':selected.person&&selected.person!=='sayvi'
 ?selected.label+' · '+(selected.id==='dm-elena'?'кассир':selected.id==='dm-anna'?'старший продавец':'продавец')
 :selected.label;
 clearReply();cancelTaskDraft();cleanupPreview();
 const composer=$('svcpChatInput');if(composer)composer.value='';
 syncComposerActions();
 $('svcpOpenTasks').hidden=true;
 $('svcpPreviewOnHome').hidden=true;
 $('svcpReturnToTasks').hidden=true;
 $('svcpTaskDiscussionQuick').hidden=true;
 updatePerspective();renderChat();
}
function updatePerspective(){
 const current=roomDetails();
 const allowed=current.kind==='groups'||current.id==='dm-elena';
 const button=$('svcpElenaPerspective');
 button.hidden=employeePreviewActive()||!allowed;
 button.textContent=state.viewpoint==='elena'?'Вернуться к руководителю':'Взгляд Елены';
 button.setAttribute('aria-pressed',String(state.viewpoint==='elena'));
 $('svcpConversationDetail').textContent=state.viewpoint==='elena'
  ?'Как выглядел бы чат у Елены · учебный пример'
  :current.hint+' · на одном устройстве';
 $('svcpMentionElena').hidden=current.kind!=='groups';
 const chips=chatRoot.querySelector('.svcp-rooms');if(chips)chips.hidden=current.kind!=='groups';
 $('svcpRecognizeOpen').hidden=state.viewpoint==='elena'||!(current.person&&STAFF[current.person]);
 const directTask=$('svcpComposerDirectTask'),recipient=privateAssignmentRecipient();
 if(directTask){
  directTask.hidden=!recipient;
  directTask.setAttribute('aria-label',recipient
   ?'Создать поручение для '+STAFF[recipient]+' из написанного текста'
   :'Поручить написанное сотруднику');
  $('svcpChatForm')?.classList.toggle('svcp-can-assign',!!recipient);
 }
 $('svcpChatInput').placeholder=state.viewpoint==='elena'?'Ответ Елены · локальное демо…':current.person==='sayvi'?'Спросить Сэйви · демо…':'Сообщение или @Сэйви…';
 window.dispatchEvent(new CustomEvent('seyveo:work-role-preview',{detail:{role:state.viewpoint==='elena'?'employee':'manager'}}));
}
$('svcpRoomInfoToggle')?.addEventListener('click',()=>{
 const panel=$('svcpRoomInfo'),button=$('svcpRoomInfoToggle');if(!panel)return;
 panel.hidden=!panel.hidden;button?.setAttribute('aria-expanded',String(!panel.hidden));
});
$('svcpConversationBack')?.addEventListener('click',showInbox);
$('svcpConversationSearch')?.addEventListener('click',()=>{
 showInbox();
 $('svcpHistorySearch')?.focus({preventScroll:true});
});
$('svcpElenaPerspective')?.addEventListener('click',()=>{
 if(employeePreviewActive())return;
 state.viewpoint=state.viewpoint==='elena'?'manager':'elena';
 clearReply();cancelTaskDraft();updatePerspective();renderChat();
});
$('svcpMentionElena')?.addEventListener('click',()=>{
 const input=$('svcpChatInput');if(!input)return;
 input.value=(input.value.trim()?input.value.trim()+' ':'')+'@Елена ';
 input.focus({preventScroll:true});
 input.setSelectionRange(input.value.length,input.value.length);
});

/* A small, reversible reaction instead of a multi-field appreciation form.
 * "manager-demo" is not a verified employee identity; no HR decision is made.
 * An emoji on a message stays in the chat; person recognition is a separate
 * explicit button in the personal chat and uses the previous staff-ledger key.
 */
/* A chat emoji is never a staff performance award. Awards remain explicit. */
const QUICK_EMOJIS=['👍','❤️','😂','🔥','👏','⭐','😊'];
const MORE_EMOJI_GROUPS=[
 {name:'Эмоции',emojis:['🥰','😍','🤣','😄','😁','😉','🥹','😢','😮','🤔','😎','🙏']},
 {name:'Поддержка',emojis:['💚','💙','💜','🫶','💪','🙌','👌','🤝','💯','✨','🎉','🏆']},
 {name:'Работа',emojis:['✅','📌','🚀','💡','👀','👏','🤩','🙈','☕','🌟','🎯','🤗']}
];
function closeMessageMenus(){
 chatRoot.querySelectorAll('.svcp-message-menu').forEach(menu=>{menu.hidden=true});
 chatRoot.querySelectorAll('.svcp-more-trigger').forEach(trigger=>trigger.setAttribute('aria-expanded','false'));
}
/* Emoji composer is separate from message reactions: an inline strip, not a modal. */
const composerEmojiStrip=$('svcpComposerEmojiStrip');
const composerEmojiButton=$('svcpComposerEmojiToggle');
let composerMoreEmojis=false;
function closeComposerEmoji(){
 if(composerEmojiStrip)composerEmojiStrip.hidden=true;
 if(composerEmojiButton)composerEmojiButton.setAttribute('aria-expanded','false');
 composerMoreEmojis=false;
}
function insertComposerEmoji(emoji){
 const input=$('svcpChatInput');
 if(!input)return;
 const from=typeof input.selectionStart==='number'?input.selectionStart:input.value.length;
 const to=typeof input.selectionEnd==='number'?input.selectionEnd:from;
 const value=input.value.slice(0,from)+emoji+input.value.slice(to);
 if(input.maxLength>0&&value.length>input.maxLength)return;
 input.value=value;
 input.focus({preventScroll:true});
 input.setSelectionRange(from+emoji.length,from+emoji.length);
 input.dispatchEvent(new Event('input',{bubbles:true}));
}
function renderComposerEmojis(){
 if(!composerEmojiStrip)return;
 composerEmojiStrip.replaceChildren();
 const emojis=composerMoreEmojis
  ?[...QUICK_EMOJIS,...MORE_EMOJI_GROUPS.flatMap(group=>group.emojis)]
  :QUICK_EMOJIS;
 for(const emoji of emojis){
  const option=el('button','svcp-composer-emoji-choice',emoji);
  option.type='button';option.setAttribute('aria-label','Вставить '+emoji);
  option.addEventListener('click',()=>insertComposerEmoji(emoji));
  composerEmojiStrip.append(option);
 }
 const more=el('button','svcp-composer-emoji-expand',composerMoreEmojis?'Меньше':'＋');
 more.type='button';more.setAttribute('aria-expanded',String(composerMoreEmojis));
 more.setAttribute('aria-label',composerMoreEmojis?'Скрыть дополнительные эмодзи':'Показать другие эмодзи');
 more.addEventListener('click',()=>{
  composerMoreEmojis=!composerMoreEmojis;
  renderComposerEmojis();
 });
 composerEmojiStrip.append(more);
}
composerEmojiButton?.addEventListener('click',()=>{
 const show=composerEmojiStrip.hidden;
 closeRecognition();closeMessageMenus();
 if(show){composerEmojiStrip.hidden=false;renderComposerEmojis();}
 else closeComposerEmoji();
 composerEmojiButton.setAttribute('aria-expanded',String(show));
});
function toggleMessageMenu(menu,trigger){
 const opening=menu.hidden;
 closeRecognition();
 closeMessageMenus();
 menu.hidden=!opening;
 trigger.setAttribute('aria-expanded',String(opening));
}
const reactionHome=$('svcpReactionPicker')?.parentElement;
function closeRecognition(){
 const panel=$('svcpReactionPicker');
 if(panel){
  panel.hidden=true;
  if(reactionHome&&panel.parentElement!==reactionHome)reactionHome.appendChild(panel);
 }
 $('svcpRecognizeOpen')?.setAttribute('aria-expanded','false');
 quickReactionTarget=null;
}
function showReactions(target,near=null){
 closeMessageMenus();
 closeRecognition();
 quickReactionTarget=target;
 const panel=$('svcpReactionPicker');
 if(!panel)return;
 const person=target.type==='person';
 $('svcpReactionLabel').textContent=person
  ?'Отметить '+STAFF[target.person]+' · знак сохранится в карточке сотрудника'
  :'Реакция на сообщение';
 $('svcpReactionOptions').hidden=!person;
 $('svcpMessageReactionOptions').hidden=person;
 $('svcpMessageReactionMore').hidden=true;
 $('svcpEmojiMoreToggle').setAttribute('aria-expanded','false');
 if(near)near.appendChild(panel);
 panel.hidden=false;
 $('svcpRecognizeOpen')?.setAttribute('aria-expanded',String(person));
}
$('svcpRecognizeOpen')?.addEventListener('click',()=>{
 if(!$('svcpReactionPicker').hidden&&quickReactionTarget?.type==='person'){closeRecognition();return}
 const room=roomDetails();
 if(room.kind!=='personal'||!room.person||!STAFF[room.person]){
  setStatus('Чтобы знак попал в карточку человека, откройте его личный рабочий чат.');
  return;
 }
 showReactions({type:'person',person:room.person});
});
$('svcpReactionCancel')?.addEventListener('click',closeRecognition);
/* Compact familiar emojis first, expandable library second. No scrolling tray. */
const quickEmojis=el('div','svcp-reaction-options svcp-quick-emojis');
quickEmojis.id='svcpMessageReactionOptions';
quickEmojis.setAttribute('role','group');
quickEmojis.setAttribute('aria-label','Быстрые реакции на сообщение');
quickEmojis.hidden=true;
const moreEmojis=el('div','svcp-emoji-more');
moreEmojis.id='svcpMessageReactionMore';
moreEmojis.hidden=true;
const personReactionOptions=$('svcpReactionOptions');
personReactionOptions.before(quickEmojis,moreEmojis);
function addEmojiButton(host,emoji){
 const button=btn(emoji,()=>{
  const target=quickReactionTarget;
  if(target?.type!=='message')return;
  closeRecognition();
  applyMessageEmoji(target.index,emoji);
 },'svcp-emoji-option');
 button.setAttribute('aria-label','Реакция '+emoji);
 host.append(button);
}
QUICK_EMOJIS.forEach(emoji=>addEmojiButton(quickEmojis,emoji));
const moreToggle=btn('＋',()=>{
 moreEmojis.hidden=!moreEmojis.hidden;
 moreToggle.setAttribute('aria-expanded',String(!moreEmojis.hidden));
},'svcp-emoji-more-toggle');
moreToggle.id='svcpEmojiMoreToggle';
moreToggle.setAttribute('aria-label','Показать больше эмодзи');
moreToggle.setAttribute('aria-controls','svcpMessageReactionMore');
moreToggle.setAttribute('aria-expanded','false');
quickEmojis.append(moreToggle);
for(const group of MORE_EMOJI_GROUPS){
 const section=el('section','svcp-emoji-group'),choices=el('div','svcp-emoji-grid');
 section.append(el('small','svcp-emoji-heading',group.name));
 group.emojis.forEach(emoji=>addEmojiButton(choices,emoji));
 section.append(choices);moreEmojis.append(section);
}
function applyPersonReaction(person,kind){
 const reward=RECOGNITION_TYPES[kind];
 if(!STAFF[person]||!reward)return;
 const entries=read(RECOGNITION_KEY);
 const day=new Date().toISOString().slice(0,10);
 if(entries.some(x=>x&&x.from==='manager-demo'&&x.to===person&&x.kind===kind&&String(x.at||'').slice(0,10)===day)){
  setStatus('Такой знак уже поставлен сегодня. Можешь выбрать другую эмоцию.');
  return;
 }
 const item={id:'reaction-'+Date.now().toString(36),from:'manager-demo',to:person,kind,
  reason:'Быстрая оценка в личном рабочем чате (без комментария)',at:new Date().toISOString(),demo:true};
 if(!save(RECOGNITION_KEY,entries.concat(item).slice(-100)))return;
 const entry={room:'dm-'+person,role:'recognition',at:Date.now(),
  text:reward.symbol+' '+RECOGNITION_NAMES['manager-demo']+' отметили '+STAFF[person]+' · '+reward.name,
  recognitionId:item.id};
 const updated=read(CHAT_KEY).concat(entry).slice(-500);
 if(save(CHAT_KEY,updated)){state.chat=updated;renderChat()}
 lastRecognizedPerson=person;
 $('svcpRecognizeOpenCard').textContent='Открыть карточку '+STAFF[person];
 $('svcpRecognizeOpenCard').hidden=false;
 setStatus('Знак '+reward.symbol+' сохранён в учебной карточке '+STAFF[person]+'. Это не проверенная оценка работы.');
 window.dispatchEvent(new CustomEvent('seyveo:recognition-changed',{detail:{personId:person}}));
}
function applyMessageEmoji(index,emoji){
 const msg=state.chat[index];
 if(!emoji||!msg||typeof msg.text!=='string')return;
 const existing=msg.demoReaction===emoji?'':emoji;
 const updated=state.chat.map((item,i)=>i===index?{...item,demoReaction:existing}:item);
 if(!save(CHAT_KEY,updated))return;
 state.chat=updated;
 renderChat();
 setStatus(existing?'Реакция '+emoji+' добавлена в чат · демо':'Реакция убрана.');
}
$('svcpReactionOptions')?.querySelectorAll('[data-svcp-reaction]').forEach(button=>
 button.addEventListener('click',()=>{
  const target=quickReactionTarget,kind=button.dataset.svcpReaction;
  if(target?.type!=='person')return;
  closeRecognition();
  applyPersonReaction(target.person,kind);
 }));
$('svcpRecognizeOpenCard')?.addEventListener('click',()=>{
 if(lastRecognizedPerson)window.SEYVEO_STAFF_CARDS?.open?.(lastRecognizedPerson);
});
function formatTime(ts){
 const dt=new Date(ts);
 return Number.isFinite(dt.getTime())?dt.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'';
}
function renderChat(){
 closeRecognition();
 closeMessageMenus();
 chatRoot.querySelectorAll('[data-svcp-room]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.svcpRoom===state.room)));
 const thread=$('svcpMessages');if(!thread)return;
 clearMediaRenderUrls();
 thread.replaceChildren();
 const messages=state.chat.map((msg,index)=>({msg,index}))
  .filter(x=>x.msg&&x.msg.room===state.room&&typeof x.msg.text==='string');
 const focusAt=focusSearchIndex===null?-1:messages.findIndex(x=>x.index===focusSearchIndex);
 const visible=focusAt>=0
  ?messages.slice(Math.max(0,focusAt-16),Math.min(messages.length,focusAt+17))
  :messages.slice(-historyWindow);
 const older=$('svcpLoadOlder');
 if(older){
  older.hidden=focusAt>=0||messages.length<=historyWindow;
  older.textContent='↑ Ранние сообщения · ещё '+Math.max(0,messages.length-historyWindow);
 }
 if(!visible.length){
  thread.append(el('p','svcp-note','Пока нет сообщений. Напишите заметку для команды или позовите Сэйви через @Сэйви. Это локальная демонстрация.'));
 }else{
  let lastDay='';
  for(const {msg,index} of visible){
   if(Number.isFinite(Number(msg.at))&&msg.at){
    const date=new Date(msg.at);
    const dateKey=Number.isNaN(date.getTime())?'':date.toDateString();
    if(dateKey&&dateKey!==lastDay){
     lastDay=dateKey;
     const today=new Date(),yesterday=new Date(today);
     yesterday.setDate(today.getDate()-1);
     const label=dateKey===today.toDateString()?'Сегодня':dateKey===yesterday.toDateString()?'Вчера'
      :date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',...(date.getFullYear()===today.getFullYear()?{}:{year:'numeric'})});
     thread.append(el('div','svcp-chat-day',label));
    }
   }
   const isSayvi=msg.role==='sayvi',isRecognition=msg.role==='recognition';
   const isOwn=state.viewpoint==='elena'?msg.role==='demo-elena':!isSayvi&&msg.role!=='demo-elena';
   const mentioned=state.viewpoint==='elena'&&roomDetails().kind==='groups'&&msg.text.toLocaleLowerCase('ru-RU').includes('@елена');
   const bubble=el('article','svcp-bubble '+(isRecognition?'is-recognition':isSayvi?'is-sayvi':isOwn?'is-self':'is-other')+(mentioned?' is-mentioned':'')+(index===focusSearchIndex?' is-search-hit':''));
   bubble.setAttribute('aria-label',isSayvi?'Демонстрационная подсказка Сэйви':senderName(msg));
   const meta=el('div','svcp-bubble-meta');
   meta.append(el('strong','svcp-sender',senderName(msg)),el('time','svcp-time',formatTime(msg.at)));
   bubble.append(meta);
   if(msg.replyTo&&typeof msg.replyTo.text==='string'){
    bubble.append(el('div','svcp-quote',(msg.replyTo.sender||'Сообщение')+' · '+msg.replyTo.text.slice(0,160)));
   }
   if(msg.mediaPurpose!=='voice')bubble.append(el('span','svcp-message-text',msg.text));
   if(msg.editedAt)bubble.append(el('small','svcp-message-edited','изменено'));
   if(msg.mediaId)restoreStoredMedia(bubble,msg);
   if(msg.starred)bubble.append(el('small','svcp-bubble-saved','★ Избранное'));
   if(msg.demoReaction){
    const chip=btn(msg.demoReaction+' 1',()=>applyMessageEmoji(index,msg.demoReaction),'svcp-bubble-reaction');
    chip.setAttribute('aria-label','Убрать реакцию '+msg.demoReaction);
    bubble.append(chip);
   }
   if(mentioned)bubble.append(el('small','svcp-mention-notice','Упоминание Елены · уведомление не отправлено'));
   if(!isRecognition){
    const actions=el('div','svcp-message-actions');
    const menu=el('div','svcp-message-menu');menu.hidden=true;
    menu.setAttribute('role','group');menu.setAttribute('aria-label','Действия с сообщением');
    const moreButton=btn('···',()=>toggleMessageMenu(menu,moreButton),'svcp-message-action svcp-more-trigger');
    moreButton.setAttribute('aria-label','Действия с сообщением');
    moreButton.setAttribute('aria-expanded','false');
    actions.append(moreButton);
    function svcpActionIcon(title,kind,callback,className){
     const control=btn('',callback,className+' svcp-icon-action svcp-action-'+kind);
     control.setAttribute('aria-label',title);
     control.title=title;
     const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
     svg.setAttribute('viewBox','0 0 24 24');
     svg.setAttribute('aria-hidden','true');
     svg.setAttribute('fill','none');
     svg.setAttribute('stroke','currentColor');
     svg.setAttribute('stroke-width','1.8');
     svg.setAttribute('stroke-linecap','round');
     svg.setAttribute('stroke-linejoin','round');
     const parts={
      reply:"<path d=\"M9 10 4 14l5 4\"/><path d=\"M4 14h9a7 7 0 0 1 7 7\"/>",reaction:"<path d=\"M12 20s-8-4.5-8-10a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 5.5-8 10-8 10Z\"/>",
      star:"<path d=\"m12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2L12 17.3l-5.7 2.9 1.1-6.2-4.5-4.4 6.3-.9Z\"/>",award:"<path d=\"m12 2.8 2.85 5.77 6.37.93-4.61 4.5 1.09 6.35L12 17.35l-5.7 3 1.09-6.35-4.61-4.5 6.37-.93Z\"/>",copy:"<rect x=\"8\" y=\"8\" width=\"11\" height=\"12\" rx=\"2\"/><path d=\"M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2\"/>",
      edit:"<path d=\"m5 17-1 3 3-1L19 7a2.1 2.1 0 0 0-3-3Z\"/><path d=\"M14 6l4 4\"/>",delete:"<path d=\"M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6\"/>",
      task:"<rect x=\"4\" y=\"5\" width=\"16\" height=\"15\" rx=\"2\"/><path d=\"M8 10h8M8 14h5\"/><path d=\"M17 17v5m-2.5-2.5h5\"/>"
     };
     svg.innerHTML=parts[kind]||'';
     control.appendChild(svg);
     return control;
    }
    menu.append(svcpActionIcon('Ответить','reply',()=>{closeMessageMenus();startReply(msg)},'svcp-message-menu-item'));
    menu.append(svcpActionIcon('Реакция','reaction',()=>showReactions({type:'message',index},bubble),'svcp-message-menu-item'));
    // HR appreciation is NOT a bookmark. Only an identifiable colleague earns
    // a golden recognition event, recorded by the existing staff-card ledger.
    const awardPerson=state.viewpoint==='manager'&&msg.role==='demo-elena'?'elena':null;
    if(awardPerson){
     const thank=svcpActionIcon('Золотая звезда благодарности · в личное дело','award',()=>{
      closeMessageMenus();
      applyPersonReaction(awardPerson,'help');
     },'svcp-message-menu-item');
     thank.setAttribute('aria-description','Поощрение сотрудника, сохраняется в карточке, не в избранном');
     menu.append(thank);
    }
    const starControl=svcpActionIcon(msg.starred?'Убрать из избранного':'В избранное','star',()=>{
     const updated=state.chat.map((item,i)=>i===index?{...item,starred:!item.starred}:item);
     if(!save(CHAT_KEY,updated))return;
     state.chat=updated;renderChat();renderDirectory();
    },'svcp-message-menu-item');
    starControl.classList.toggle('is-saved',!!msg.starred);
    menu.append(starControl);
    menu.append(svcpActionIcon('Копировать','copy',async()=>{
     closeMessageMenus();
     try{await navigator.clipboard.writeText(msg.text);setStatus('Сообщение скопировано')}
     catch{setStatus('Не удалось скопировать. Выдели текст сообщения вручную.')}
    },'svcp-message-menu-item'));
    if(isOwn&&!msg.mediaId&&!msg.taskId){
     menu.append(svcpActionIcon('Изменить','edit',()=>{
      closeMessageMenus();clearReply();
      editingMessageIndex=index;
      const editPreview=$('svcpReplyPreview'),editText=$('svcpReplyText');
      if(editPreview)editPreview.hidden=false;
      if(editText)editText.textContent='Редактирование · нажми × для отмены';
      const input=$('svcpChatInput');if(input){
       input.value=msg.text;input.focus({preventScroll:true});
       input.dispatchEvent(new Event('input',{bubbles:true}));
      }
      setStatus('Редактирование · измени текст и нажми «Отправить».');
     },'svcp-message-menu-item'));
    }
    if(isOwn){
     menu.append(svcpActionIcon('Удалить у себя','delete',()=>{
      closeMessageMenus();
      if(!window.confirm('Удалить это сообщение из локальной истории?'))return;
      const updated=state.chat.filter((_,i)=>i!==index);
      if(!save(CHAT_KEY,updated))return;
      state.chat=updated;renderChat();renderDirectory();
      setStatus('Сообщение удалено из этого браузера.');
     },'svcp-message-menu-item'));
    }
    if(!msg.taskId&&(!isSayvi||typeof msg.suggestTask==='string'&&msg.suggestTask.trim())&&state.viewpoint!=='elena'){
     menu.append(svcpActionIcon('Поручить','task',()=>{
      closeMessageMenus();
      if(privateAssignmentRecipient())assignExistingMessage(msg,index);
      else prepareTask(msg);
     },'svcp-message-menu-item'));
    }
    bubble.tabIndex=0;
    bubble.setAttribute('aria-description','Нажмите, чтобы ответить, выбрать реакцию или создать поручение');
    let longPressTimer=null,pressStartX=0,pressStartY=0;
    const clearHold=()=>{clearTimeout(longPressTimer);longPressTimer=null};
    bubble.addEventListener('pointerdown',event=>{
     if(event.target.closest('button,audio,.svcp-message-menu'))return;
     pressStartX=event.clientX;pressStartY=event.clientY;
     clearHold();
     longPressTimer=setTimeout(()=>{
      longPressTimer=null;
      toggleMessageMenu(menu,moreButton);
      if(navigator.vibrate)navigator.vibrate(12);
     },480);
    });
    bubble.addEventListener('pointermove',event=>{
     if(longPressTimer&&Math.hypot(event.clientX-pressStartX,event.clientY-pressStartY)>12)clearHold();
    });
    bubble.addEventListener('pointerup',event=>{
     if(longPressTimer&&event.clientX-pressStartX>85&&Math.abs(event.clientY-pressStartY)<65){
      clearHold();startReply(msg);
     }else clearHold();
    });
    bubble.addEventListener('pointercancel',clearHold);
    bubble.addEventListener('contextmenu',event=>{event.preventDefault();clearHold();toggleMessageMenu(menu,moreButton)});
    bubble.addEventListener('click',event=>{
     if(event.target.closest('button,audio,.svcp-media-slot'))return;
     if(event.target.closest('.svcp-message-menu'))return;
     // Ordinary tap reads the message; hold or swipe opens the actions.
    });
    bubble.addEventListener('keydown',event=>{
     if((event.key==='Enter'||event.key===' ')&&event.target===bubble){
      event.preventDefault();toggleMessageMenu(menu,moreButton);
     }
    });
    bubble.append(actions,menu);
   }
   thread.append(bubble);
  }
 }
 if(focusSearchIndex!==null){
  const target=thread.querySelector('.svcp-bubble.is-search-hit');
  thread.scrollTop=target?Math.max(0,target.offsetTop-thread.offsetTop-24):thread.scrollHeight;
  focusSearchIndex=null;
 }else thread.scrollTop=thread.scrollHeight;
}
$('svcpLoadOlder')?.addEventListener('click',()=>{
 historyWindow=Math.min(500,historyWindow+35);
 renderChat();
 const thread=$('svcpMessages');
 if(thread)thread.scrollTop=0;
});
function startReply(msg){
 state.replyTo={text:String(msg.text||'').slice(0,160),sender:senderName(msg)};
 $('svcpReplyText').textContent='Ответ на: '+state.replyTo.sender+' · '+state.replyTo.text;
 $('svcpReplyPreview').hidden=false;
 $('svcpChatInput')?.focus({preventScroll:true});
}
function clearReply(){state.replyTo=null;$('svcpReplyPreview').hidden=true;$('svcpReplyText').textContent=''}
$('svcpReplyCancel')?.addEventListener('click',()=>{
 if(editingMessageIndex!==null){
  editingMessageIndex=null;
  const input=$('svcpChatInput');if(input){
   input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
  }
 }
 clearReply();
});
function suggestFromChat(message){
 const request=message.replace(/@(?:сэйви|сэй|seyveo|sayvi)(?=\s|[,:.!?]|$)\s*[,—:-]?\s*/gi,'').trim();
 if(/возврат|вернуть товар/i.test(request))return {
  text:'В этой демонстрации инструкции компании ещё не подключены. Лучше уточнить утверждённый порядок возврата у ответственного. Могу подготовить поручение на проверку.',
  task:'Уточнить утверждённый порядок возврата товара'
 };
 if(/график|смен[ыуе]|выходн/i.test(request))return {
  text:'Могу подготовить поручение по графику. Для точного ответа о сменах сначала нужны согласованные данные компании.',
  task:'Уточнить и подтвердить график смен'
 };
 if(/поруч|задач|подготов|проверь|нужно|сдела|договор|заказ|отчёт|отчет|план|напомни/i.test(request))return {
  text:'Могу оформить сказанное как поручение. Проверьте формулировку и подтвердите добавление — без этого ничего не запишу.',
  task:request.slice(0,140)
 };
 return {
  text:'Я здесь. Сейчас это пробная подсказка без подключения ИИ и корпоративных инструкций. Могу помочь подготовить поручение из конкретного рабочего сообщения — после вашего подтверждения.',
  task:''
 };
}
function prepareTask(msg){
 const proposed=typeof msg.suggestTask==='string'&&msg.suggestTask.trim()?msg.suggestTask:msg.text;
 // Images and file names are never promoted to tasks automatically.
 const clean=String(proposed||'').replace(/@(?:сэйви|сэй|seyveo|sayvi)(?=\s|[,:.!?]|$)\s*[,—:-]?\s*/gi,'').replace(/\[Выбран файл:[\s\S]*$/,'').trim().slice(0,140);
 if(!clean){setStatus('В этом сообщении нет текста для поручения.');return}
 const room=ROOMS.find(x=>x.id===msg.room);
 state.draftSource={room:msg.room,assigneeId:room?.person&&room.person!=='sayvi'?room.person:''};
 $('svcpChatTaskAssignee').value=state.draftSource.assigneeId;
 $('svcpChatTaskTitle').value=clean;
 $('svcpChatTaskDraft').hidden=false;
 $('svcpChatTaskTitle').focus({preventScroll:true});
}
function cancelTaskDraft(){state.draftSource=null;$('svcpChatTaskDraft').hidden=true}
$('svcpChatTaskCancel')?.addEventListener('click',cancelTaskDraft);
$('svcpOpenTasks')?.addEventListener('click',()=>window.SEYVEO_UNIFIED_TASKS?.openBusiness?.());
function taskDuplicateKey(task){
 if(!task||task.done||typeof task.text!=='string')return '';
 return (task.assigneeId||'')+'|'+task.text.trim().replace(/\s+/g,' ').toLocaleLowerCase('ru-RU');
}
function taskRecipients(assigneeId){
 if(assigneeId==='all')return Object.keys(STAFF);
 return Object.prototype.hasOwnProperty.call(STAFF,assigneeId)?[assigneeId]:[];
}
function feedbackTask(message){
 setStatus(message);
}
function storeTask(text,source){
 const title=String(text||'').trim().slice(0,140);
 if(!title)return false;
 const chosen=String(source?.assigneeId||'');
 const recipients=taskRecipients(chosen);
 if(!recipients.length){
  feedbackTask('Сначала выберите сотрудника или всю команду — без получателя поручение не создаётся.');
  return false;
 }
 const fresh=recipients.filter(assigneeId=>
  !state.tasks.some(item=>taskDuplicateKey(item)===taskDuplicateKey({text:title,assigneeId,done:false}))
 );
 if(!fresh.length){
  feedbackTask('Такое поручение уже есть у выбранных сотрудников.');
  return false;
 }
 const created=fresh.map((assigneeId,i)=>({
  id:'chat-'+Date.now()+'-'+i+'-'+Math.random().toString(36).slice(2,7),
  text:title,done:false,assigneeId,
  ...(source?.room?{source:'chat',room:source.room}:{})
 }));
 const updated=state.tasks.concat(created).slice(-60);
 if(!save(TASK_KEY,updated))return false;
 state.tasks=updated;renderTasks();
 window.dispatchEvent(new Event('seyveo:manager-tasks-updated'));
 const demoElena=created.find(item=>item.assigneeId==='elena');
 if(demoElena){state.lastDemoTaskId=demoElena.id;$('svcpPreviewOnHome').hidden=false}
 else{$('svcpPreviewOnHome').hidden=true}
 const status=chosen==='all'
  ?'Созданы отдельные поручения: '+fresh.map(id=>STAFF[id]).join(', ')+'.'
  :'Поручение для '+STAFF[fresh[0]]+' создано.';
 feedbackTask(status+' Пока это локальное демо: уведомления сотрудникам не отправляются.');
 return created;
}
function assignExistingMessage(msg,index){
 const person=privateAssignmentRecipient();
 if(!person||msg.taskId)return;
 const text=String(msg.suggestTask||msg.text||'').trim();
 if(!text||text.length>140||text.includes('[Выбран файл:')){
  setStatus('Для поручения нужен текст до 140 символов без вложения.');
  return;
 }
 const created=storeTask(text,{assigneeId:person,room:state.room});
 if(!created)return;
 const updated=state.chat.map((item,i)=>i===index?{...item,taskId:created[0].id}:item);
 if(save(CHAT_KEY,updated)){
  state.chat=updated;
  renderChat();
 }else setStatus('Поручение создано, но отметку в чате сохранить не удалось.');
}
$('svcpChatTaskDraft')?.addEventListener('submit',event=>{
 event.preventDefault();
 const title=$('svcpChatTaskTitle').value;
 const source={...(state.draftSource||{}),assigneeId:$('svcpChatTaskAssignee').value};
 if(!storeTask(title,source))return;
 cancelTaskDraft();
 $('svcpOpenTasks').hidden=false;
});
$('svcpCallSayvi')?.addEventListener('click',()=>{
 const input=$('svcpChatInput');if(!input)return;
 if(!/(^|\s)@(?:сэйви|сэй|seyveo|sayvi)(?=\s|[,:.!?]|$)/i.test(input.value))
  input.value=(input.value.trim()?input.value.trim()+' ':'')+'@Сэйви ';
 input.focus({preventScroll:true});
 input.setSelectionRange(input.value.length,input.value.length);
 input.dispatchEvent(new Event('input',{bubbles:true}));
});
/* Camera is a single entry point, with user-initiated system capture on mobile. */
const fileInput=$('svcpFile');
const cameraInputs={shelf:$('svcpCameraPhoto'),price:$('svcpCameraPhoto'),
 video:$('svcpCameraVideo'),barcode:$('svcpCameraBarcode'),file:fileInput};
const cameraTray=$('svcpCameraTray'),cameraToggle=$('svcpCameraToggle');
const cameraPurposeNames={shelf:'Фото выкладки',price:'Фото ценника',
 video:'Рабочее видео',barcode:'Штрихкод',file:'Вложение'};
let cameraBusy=false,photoCapturePurpose='shelf';
function setCameraTray(open){
 if(!cameraTray||!cameraToggle)return;
 cameraTray.hidden=!open;cameraToggle.setAttribute('aria-expanded',String(open));
}
cameraToggle?.addEventListener('click',()=>setCameraTray(cameraTray.hidden));
document.addEventListener('keydown',event=>{if(event.key==='Escape')setCameraTray(false)});
function cleanupPreview(){
 if(state.objectUrl){URL.revokeObjectURL(state.objectUrl);state.objectUrl=null}
 state.file=null;state.filePurpose='file';state.scanCode='';
 for(const input of new Set(Object.values(cameraInputs))){if(input)input.value=''}
 const barcode=$('svcpBarcodeInput');if(barcode)barcode.value='';
 const display=$('svcpAttachmentPreview');
 if(display){display.replaceChildren();display.hidden=true}
 syncComposerActions();
}
function renderCapturePreview(){
 syncComposerActions();
 const display=$('svcpAttachmentPreview');if(!display)return;
 display.replaceChildren();
 if(!state.file&&!state.scanCode){display.hidden=true;return}
 display.hidden=false;display.classList.add('svcp-work-media-preview');
 if(state.file){
  if(state.objectUrl){URL.revokeObjectURL(state.objectUrl);state.objectUrl=null}
  state.objectUrl=URL.createObjectURL(state.file);
  if(state.file.type.startsWith('image/')){
   const img=el('img','svcp-selected-photo');
   img.src=state.objectUrl;img.alt='Выбранный снимок, пока только на этом устройстве';
   display.append(img);
  }else if(state.file.type.startsWith('video/')){
   const video=el('video','svcp-selected-video');video.src=state.objectUrl;
   video.controls=true;video.playsInline=true;video.preload='metadata';
   display.append(video);
  }
 }
 const info=el('div','svcp-selected-info');
 info.append(el('strong',null,cameraPurposeNames[state.filePurpose]||'Вложение'));
 if(state.file)info.append(el('small',null,state.file.name+' · сохранится в этом браузере после отправки'));
 if(state.scanCode)info.append(el('small','svcp-scanned-code','Код: '+state.scanCode+' · товар по базе не проверен'));
 else if(state.filePurpose==='shelf')info.append(el('small',null,'Для проверки выкладки снимите всю полку и отдельно крупно ценники.'));
 else if(state.filePurpose==='price')info.append(el('small',null,'Ценник должен быть читаемым. Сверка с каталогом пока недоступна.'));
 else if(state.filePurpose==='barcode')info.append(el('small',null,'Если код не распознался, введите цифры вручную.'));
 display.append(info);
 display.append(btn('Убрать',()=>{cleanupPreview();setStatus('Вложение убрано.')},'svcp-ghost svcp-selected-remove'));
}
async function detectPhotoBarcode(file){
 if(!file||state.file!==file)return;
 const manual=$('svcpBarcodeManual');
 if(manual)manual.hidden=false;
 if(typeof window.BarcodeDetector!=='function'){
  setStatus('Сканирование штрихкода не поддерживается этим браузером. Введите код вручную или сохраните фото без кода.');
  return;
 }
 try{
  const formats=typeof window.BarcodeDetector.getSupportedFormats==='function'
   ?await window.BarcodeDetector.getSupportedFormats():[];
  const wanted=['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code'];
  const allowed=formats.filter(x=>wanted.includes(x));
  const detector=new window.BarcodeDetector(allowed.length?{formats:allowed}:undefined);
  // BarcodeDetector accepts an ImageBitmapSource, not a File/Blob.
  // Decode the camera image first, and release its bitmap after scanning.
  let bitmap=null;
  let results=[];
  try{
   if(typeof createImageBitmap==='function'){
    bitmap=await createImageBitmap(file);
    results=await detector.detect(bitmap);
   }else{
    const url=URL.createObjectURL(file);
    try{
     const photo=new Image();
     photo.src=url;
     await photo.decode();
     results=await detector.detect(photo);
    }finally{URL.revokeObjectURL(url)}
   }
  }finally{bitmap?.close?.()}
  if(state.file!==file)return;
  const recognized=results.find(x=>typeof x.rawValue==='string'&&x.rawValue.trim());
  if(!recognized){setStatus('Код на фото не распознан. Попробуйте ближе или введите вручную.');return}
  state.scanCode=recognized.rawValue.trim().slice(0,96);
  renderCapturePreview();
  setStatus('Распознан код '+state.scanCode+'. Название товара и цену без базы магазина проверить нельзя.');
 }catch{
  setStatus('Автоматическое распознавание здесь недоступно. Можно ввести код вручную или прикрепить фото.');
 }
}
function pickCaptureFile(file,purpose){
 cleanupPreview();
 if(!file)return;
 const cap=file.type.startsWith('video/')?60*1024*1024:16*1024*1024;
 if(file.size>cap){
  setStatus('Файл слишком большой для локального демо. Видео до 60 МБ, фото и другие файлы до 16 МБ.');
  return;
 }
 state.file=file;
 state.filePurpose=purpose;
 renderCapturePreview();
 if(purpose==='barcode'){setCameraTray(true);detectPhotoBarcode(file)}
 else setCameraTray(false);
}
// "Выкладка" and "Ценник" use one photo input; register its change
// listener only once, otherwise the second handler overwrites the purpose.
$('svcpCameraPhoto')?.addEventListener('change',()=>{
 const file=$('svcpCameraPhoto').files?.[0];
 if(file)pickCaptureFile(file,photoCapturePurpose);
});
for(const [kind,id] of [['video','svcpCameraVideo'],['barcode','svcpCameraBarcode'],['file','svcpFile']]){
 const picker=$(id);
 picker?.addEventListener('change',()=>{
  const file=picker.files?.[0];
  if(file)pickCaptureFile(file,kind);
 });
}
cameraTray?.querySelectorAll('[data-svcp-capture]').forEach(button=>
 button.addEventListener('click',()=>{
  const type=button.dataset.svcpCapture;
  const input=cameraInputs[type];if(!input)return;
  if(type==='shelf'||type==='price')photoCapturePurpose=type;
  if(type==='barcode'){$('svcpBarcodeManual').hidden=false}
  else setCameraTray(false);
  input.value='';input.click();
 }));
$('svcpBarcodeUse')?.addEventListener('click',()=>{
 const raw=$('svcpBarcodeInput')?.value.trim().replace(/\s+/g,'')||'';
 if(!/^[0-9A-Za-z.-]{4,48}$/.test(raw)){
  setStatus('Введите штрихкод длиной 4–48 символов, без пробелов и специальных знаков.');
  return;
 }
 state.scanCode=raw;
 if(!state.file)state.filePurpose='barcode';
 renderCapturePreview();
 setCameraTray(false);
 setStatus('Код '+raw+' добавлен к сообщению. Проверка по товарной базе ещё не подключена.');
});
function btn(text,action,cls){
 const button=el('button',cls,text);button.type='button';button.addEventListener('click',action);return button;
}
/* Direct assignment while composing in a personal chat:
   text is the task, the current employee is the recipient. No extra form. */
$('svcpComposerDirectTask')?.addEventListener('click',()=>{
 const person=privateAssignmentRecipient(),input=$('svcpChatInput');
 const text=input?.value.trim()||'';
 if(!person){setStatus('Поручение напрямую доступно в личном чате сотрудника.');return}
 if(!text){setStatus('Напишите поручение и нажмите «Поручить».');input?.focus({preventScroll:true});return}
 if(text.length>140){
  setStatus('Для поручения можно написать до 140 символов. Сократите текст или отправьте как сообщение.');
  input?.focus({preventScroll:true});return;
 }
 if(state.file){
  setStatus('Прикрепление файлов к поручениям пока не подключено. Уберите файл или отправьте обычное сообщение.');
  return;
 }
 const created=storeTask(text,{assigneeId:person,room:state.room});
 if(!created)return;
 const message={
  room:state.room,role:'self',text:'📌 Поручение: '+text,at:Date.now(),
  taskId:created[0].id,
  ...(state.replyTo?{replyTo:state.replyTo}:{})
 };
 const updated=state.chat.concat(message).slice(-500);
 if(save(CHAT_KEY,updated)){
  state.chat=updated;
  input.value='';
  closeComposerEmoji();clearReply();cancelTaskDraft();
  renderChat();
  setStatus('Поручение для '+STAFF[person]+' сохранено в делах и переписке. Демо, без отправки на другой телефон.');
 }else{
  setStatus('Поручение для '+STAFF[person]+' создано в делах, но сообщение в чате не сохранилось.');
 }
});
$('svcpChatForm')?.addEventListener('submit',async event=>{
 event.preventDefault();
 if(cameraBusy)return;
 const input=$('svcpChatInput'),txt=input?.value.trim()||'';
 if(editingMessageIndex!==null){
  const index=editingMessageIndex,msg=state.chat[index];
  if(!msg||msg.room!==state.room||!txt){setStatus('Напиши новый текст или выйди из редактирования.');return}
  const updated=state.chat.map((item,i)=>i===index?{...item,text:txt,editedAt:Date.now()}:item);
  if(!save(CHAT_KEY,updated))return;
  state.chat=updated;editingMessageIndex=null;input.value='';
  clearReply();syncComposerActions();
  window.dispatchEvent(new Event('seyveo:work-chat-sent'));
  renderChat();renderDirectory();setStatus('Изменение сохранено на этом устройстве.');
  return;
 }
 const file=state.file,purpose=state.filePurpose,barcode=state.scanCode;
 if(!txt&&!file&&!barcode){setStatus('Напишите сообщение или откройте камеру.');return}
 const type=file?.type||'';
 const label=file?(purpose==='shelf'?'📷 Фото выкладки':purpose==='price'?'📷 Фото ценника':
  purpose==='barcode'?'▥ Фото штрихкода':type.startsWith('video/')?'🎬 Видео':'📎 Вложение'):'';
 const message=[txt,label,barcode?'Штрихкод: '+barcode:''].filter(Boolean).join('\n');
 cameraBusy=true;
 const sendButton=$('svcpChatForm')?.querySelector('[type="submit"]');
 if(sendButton)sendButton.disabled=true;
 try{
  let mediaId=null;
  if(file){
   try{mediaId=await saveMediaLocally(file)}
   catch{
    setStatus('Файл не удалось сохранить в браузере. Проверьте свободное место и разрешения. Сообщение не отправлено.');
    return;
   }
  }
  const entry={room:state.room,text:message,at:Date.now(),
   role:state.viewpoint==='elena'?'demo-elena':'self',
   ...(mediaId?{mediaId,mediaType:type,mediaPurpose:purpose}:{}),
   ...(state.replyTo?{replyTo:state.replyTo}:{})};
  const callSayvi=state.room==='dm-sayvi'||/(^|\s)@(?:сэйви|сэй|seyveo|sayvi)(?=\s|[,:.!?]|$)/i.test(txt);
  const messages=[entry];
  if(callSayvi){
   if(file){
    messages.push({room:state.room,role:'sayvi',at:Date.now(),
     text:'Файл сохранён локально. Я пока не умею анализировать изображения и видео в этом демо. Для проверки выкладки нужны зрение ИИ, инструкции магазина и каталог товаров.'});
   }else{
    const advice=suggestFromChat(txt);
    messages.push({room:state.room,role:'sayvi',text:advice.text,at:Date.now(),...(advice.task?{suggestTask:advice.task}:{})});
   }
  }
  const updated=state.chat.concat(messages).slice(-500);
  if(!save(CHAT_KEY,updated))return;
  state.chat=updated;
  closeComposerEmoji();setCameraTray(false);
  input.value='';cleanupPreview();clearReply();cancelTaskDraft();syncComposerActions();
  window.dispatchEvent(new Event('seyveo:work-chat-sent'));
  renderChat();
  setStatus(mediaId?'Фото/видео или файл сохранены только в этом браузере. Доставки другим людям и анализа ИИ пока нет.':
   barcode?'Код записан локально, но не проверен по каталогу магазина.':
   callSayvi?'Сэйви ответила шаблонной подсказкой, не настоящим ИИ.':'Сообщение сохранено локально, без доставки на другие устройства.');
 }finally{
  cameraBusy=false;
  if(sendButton)sendButton.disabled=false;
 }
});
$('svcpChatInput')?.addEventListener('keydown',event=>{
 if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){
  event.preventDefault();$('svcpChatForm')?.requestSubmit();
 }
});
function renderTasks(){
 const list=$('svcpTaskList');if(!list)return;
 window.dispatchEvent(new Event('seyveo:manager-tasks-updated'));
 const wasHistoryOpen=!!list.querySelector('.svcp-task-history[open]');
 list.replaceChildren();
 const open=state.tasks.map((task,index)=>({task,index})).filter(x=>x.task&&typeof x.task.text==='string'&&!x.task.done);
 const done=state.tasks.map((task,index)=>({task,index})).filter(x=>x.task&&typeof x.task.text==='string'&&x.task.done);
 const heading=el('div','svcp-task-section-head');
 heading.append(el('strong',null,'Поручения'),el('small',null,String(open.length)));
 list.append(heading);
 function taskRow(t,i){
  const row=el('div','svcp-task'+(t.done?' is-done':''));
  row.setAttribute('data-svcp-task-index',String(i));
  const checkbox=el('input');checkbox.type='checkbox';checkbox.checked=!!t.done;
  checkbox.setAttribute('aria-label',(t.done?'Вернуть в работу: ':'Завершить поручение: ')+t.text);
  checkbox.addEventListener('change',()=>{
   const updated=state.tasks.map((item,index)=>index===i?{...item,done:checkbox.checked}:item);
   if(!save(TASK_KEY,updated)){checkbox.checked=!checkbox.checked;return}
   state.tasks=updated;renderTasks();syncPreviewAfterTaskEdit();
  });
  const copy=el('div','svcp-task-copy');
  copy.append(el('strong','svcp-task-title',t.text));
  // Legacy demo records remain stored, but assignees are chosen in chat.
  if(t.assigneeId&&Object.prototype.hasOwnProperty.call(STAFF,t.assigneeId))
   copy.append(el('small','svcp-task-assignee',STAFF[t.assigneeId]));
  const actions=el('div','svcp-task-actions');
  actions.append(btn('Обсудить',()=>openTaskDiscussion(t),'svcp-task-discuss'));
  actions.append(btn('Удалить',()=>{
   const updated=state.tasks.filter((_,index)=>index!==i);
   if(!save(TASK_KEY,updated))return;
   state.tasks=updated;renderTasks();syncPreviewAfterTaskEdit();
  },'svcp-ghost'));
  row.append(checkbox,copy,actions);
  return row;
 }
 const openSeen=new Set(),dups=[];
 const activeBox=el('div','svcp-task-active');
 for(const {task,index} of open){
  const key=taskDuplicateKey(task);
  if(key&&openSeen.has(key)){dups.push(index);continue}
  if(key)openSeen.add(key);
  activeBox.append(taskRow(task,index));
 }
 if(!activeBox.childElementCount)activeBox.append(el('p','svcp-task-zero','Поручений пока нет.'));
 list.append(activeBox);
 if(dups.length){
  const info=el('div','svcp-duplicate-summary');
  info.append(el('span',null,'Одинаковых активных задач скрыто: '+dups.length));
  info.append(btn('Убрать повторы',()=>{
   const set=new Set(dups),updated=state.tasks.filter((_,i)=>!set.has(i));
   if(!save(TASK_KEY,updated))return;
   state.tasks=updated;renderTasks();syncPreviewAfterTaskEdit();
  },'svcp-ghost'));
  list.append(info);
 }
 if(done.length){
  const details=el('details','svcp-task-history');
  details.open=wasHistoryOpen;
  const summary=el('summary','svcp-task-history-title');
  summary.append(el('strong',null,'Выполнено'),el('small',null,String(done.length)),el('span','svcp-history-chevron','›'));
  details.append(summary);
  const completed=el('div','svcp-task-completed');
  const completedSeen=new Set(),duplicateDone=[];
  for(const {task,index} of done){
   const key=taskDuplicateKey({...task,done:false});
   if(key&&completedSeen.has(key)){duplicateDone.push(index);continue}
   if(key)completedSeen.add(key);
   completed.append(taskRow(task,index));
  }
  details.append(completed);
  if(duplicateDone.length){
   const info=el('div','svcp-duplicate-summary');
   info.append(el('span',null,'Одинаковых выполненных записей: '+duplicateDone.length));
   info.append(btn('Убрать повторы',()=>{
    const set=new Set(duplicateDone),updated=state.tasks.filter((_,i)=>!set.has(i));
    if(!save(TASK_KEY,updated))return;
    state.tasks=updated;renderTasks();syncPreviewAfterTaskEdit();
   },'svcp-ghost'));
   details.append(info);
  }
  list.append(details);
 }
}
function openTaskDiscussion(task){
 if(!task||typeof task.text!=='string')return;
 const person=task.assigneeId&&Object.prototype.hasOwnProperty.call(STAFF,task.assigneeId)?task.assigneeId:'';
 const roomId=person?'dm-'+person:'general';
 window.SEYVEO_UNIFIED_TASKS?.openChat?.('tasks',roomId);
 chatsFromTasks=true;
 if(person==='elena'){
  state.viewpoint='elena';
  updatePerspective();renderChat();
  // In an assignment discussion the employee identity is already explicit.
  // Keep a single easy way back rather than two cramped header controls.
  $('svcpElenaPerspective').hidden=true;
 }
 const message={room:roomId,role:'self',text:task.text};
 startReply(message);
 $('svcpReturnToTasks').hidden=false;
 $('svcpTaskDiscussionQuick').hidden=false;
}
function returnToTasks(){
 chatsFromTasks=false;
 $('svcpReturnToTasks').hidden=true;
 $('svcpTaskDiscussionQuick').hidden=true;
 window.SEYVEO_UNIFIED_TASKS?.openBusiness?.('preserve');
}
$('svcpReturnToTasks')?.addEventListener('click',returnToTasks);
chatRoot.querySelectorAll('[data-svcp-discuss-template]').forEach(button=>button.addEventListener('click',()=>{
 const input=$('svcpChatInput');if(!input)return;
 input.value=button.dataset.svcpDiscussTemplate||'';
 input.focus({preventScroll:true});
 input.setSelectionRange(input.value.length,input.value.length);
}));
// Business tools keep their original handlers; the surrounding layout is unified.
root.querySelectorAll('[data-svcp-feature]').forEach(button=>
 button.addEventListener('click',()=>
  window.SEYVEO_BUSINESS_NAV?.openFeature?.(button.dataset.svcpFeature)));
/* Only a user-requested preview: this is not a real incoming push or an
   employee account. It uses the same already-saved demonstration task. */
let previewStarted=false;
function syncPreviewAfterTaskEdit(){
 if(!state.lastDemoTaskId)return;
 if(workTaskForPreview())return;
 state.lastDemoTaskId=null;
 previewStarted=false;
 $('svcpWorkHomePreview').hidden=true;
 $('svcpPreviewOnHome').hidden=true;
 resetHomeReply();
}
function workTaskForPreview(){
 return state.tasks.find(t=>t&&t.id===state.lastDemoTaskId&&t.assigneeId==='elena'&&!t.done)||null;
}
function resetHomeReply(){
 const form=$('svcpHomeReplyForm'),result=$('svcpHomeReplyResult');
 form.hidden=true;
 $('svcpHomePreviewReply').setAttribute('aria-expanded','false');
 $('svcpHomeReplyText').value='';
 result.hidden=true;
 $('svcpHomeOpenChat').hidden=true;
 $('svcpHomeReplyStatus').textContent='';
 const choices=$('svcpHomeSayviSuggestions');choices.hidden=true;
 $('svcpHomeSayviHelp').setAttribute('aria-expanded','false');
}
$('svcpHomePreviewReply')?.addEventListener('click',()=>{
 if(!workTaskForPreview())return;
 const form=$('svcpHomeReplyForm');
 if(form.hidden){
  resetHomeReply();
  form.hidden=false;
  $('svcpHomePreviewReply').setAttribute('aria-expanded','true');
  $('svcpHomeReplyText').focus({preventScroll:true});
 }else resetHomeReply();
});
$('svcpHomeReplyCancel')?.addEventListener('click',resetHomeReply);
$('svcpHomeSayviHelp')?.addEventListener('click',()=>{
 if(!workTaskForPreview())return;
 const panel=$('svcpHomeSayviSuggestions');
 panel.hidden=!panel.hidden;
 $('svcpHomeSayviHelp').setAttribute('aria-expanded',String(!panel.hidden));
});
function sayviReplyDraft(kind,task){
 const subject=String(task?.text||'поручение').trim().slice(0,95);
 if(kind==='accept')return 'Приняла поручение «'+subject+'». Приступаю к выполнению.';
 if(kind==='clarify')return 'Подскажите, пожалуйста, к какому времени нужно выполнить поручение «'+subject+'»? Хочу всё сделать правильно.';
 if(kind==='disagree')return 'Хотела бы обсудить поручение «'+subject+'». Есть вопросы по условиям. Можно предложить другой вариант выполнения?';
 return '';
}
$('svcpHomeSayviSuggestions')?.querySelectorAll('[data-svcp-home-suggestion]').forEach(button=>
 button.addEventListener('click',()=>{
  const task=workTaskForPreview();if(!task)return;
  const text=sayviReplyDraft(button.dataset.svcpHomeSuggestion,task);
  if(!text)return;
  $('svcpHomeReplyText').value=text.slice(0,500);
  $('svcpHomeSayviSuggestions').hidden=true;
  $('svcpHomeSayviHelp').setAttribute('aria-expanded','false');
  $('svcpHomeReplyText').focus({preventScroll:true});
 }));
$('svcpHomeReplyForm')?.addEventListener('submit',event=>{
 event.preventDefault();
 const task=workTaskForPreview(),input=$('svcpHomeReplyText'),text=input.value.trim().slice(0,500);
 if(!task||!text)return;
 const reply={room:'dm-elena',role:'demo-elena',text,at:Date.now(),
  replyTo:{sender:'Руководитель · поручение',text:task.text.slice(0,160)}};
 const updated=read(CHAT_KEY).concat(reply).slice(-500);
 const status=$('svcpHomeReplyStatus');
 if(!save(CHAT_KEY,updated)){
  status.textContent='Не удалось записать ответ. Проверьте место на устройстве.';
  $('svcpHomeReplyResult').hidden=false;
  return;
 }
 state.chat=updated;
 resetHomeReply();
 status.textContent='✓ Добавлено в учебный чат Елены. Реальной доставки пока нет.';
 $('svcpHomeOpenChat').hidden=false;
 $('svcpHomeReplyResult').hidden=false;
 renderDirectory();
});
$('svcpHomeOpenChat')?.addEventListener('click',()=>{
 if($('svcpHomeReplyResult').hidden)return;
 window.SEYVEO_BUSINESS_COMMAND?.openPrivateChat?.('elena','elena');
});
function syncWorkPreview(){
 const task=workTaskForPreview(),card=$('svcpWorkHomePreview');
 if(!card)return;
 if(!task){card.hidden=true;resetHomeReply();return}
 $('svcpHomePreviewTitle').textContent=task.text;
 $('svcpHomePreviewExecute').textContent=previewStarted?'Подтвердить выполнение':'Исполнить';
 $('svcpHomePreviewDetail').textContent=previewStarted
  ?'Задача в работе · подтвердите выполнение, когда она действительно сделана'
  :'Поручение руководителя · учебная демонстрация на одном устройстве';
 card.hidden=false;
}
$('svcpPreviewOnHome')?.addEventListener('click',()=>{
 const task=workTaskForPreview();
 if(!task){$('svcpPreviewOnHome').hidden=true;return}
 previewStarted=false;
 resetHomeReply();
 syncWorkPreview();
 location.hash='#home';
});
$('svcpHomePreviewClose')?.addEventListener('click',()=>{
 $('svcpWorkHomePreview').hidden=true;
 state.lastDemoTaskId=null;
 previewStarted=false;
 resetHomeReply();
});
$('svcpHomePreviewDetails')?.addEventListener('click',()=>{
 window.SEYVEO_UNIFIED_TASKS?.openBusiness?.();
});
$('svcpHomePreviewExecute')?.addEventListener('click',()=>{
 const task=workTaskForPreview();if(!task)return;
 if(!previewStarted){previewStarted=true;syncWorkPreview();return}
 const updated=state.tasks.map(item=>item.id===task.id?{...item,done:true}:item);
 if(!save(TASK_KEY,updated))return;
 state.tasks=updated;
 state.lastDemoTaskId=null;
 previewStarted=false;
 $('svcpWorkHomePreview').hidden=true;
 $('svcpPreviewOnHome').hidden=true;
 resetHomeReply();
 renderTasks();
 window.dispatchEvent(new CustomEvent('seyveo:demo-task-completed',{detail:{id:task.id}}));
});
syncComposerActions();
window.SEYVEO_BUSINESS_COMMAND=Object.freeze({
 openTab:tab,
 showChat:(roomId=null,viewpoint='manager')=>{
  chatsFromTasks=true;
  if(roomId&&ROOMS.some(x=>x.id===roomId)){
   if(employeePreviewActive()&&!employeeAllowedRoom(roomId)){showInbox();return}
   openRoom(roomId);
   if((employeePreviewActive()||viewpoint==='elena')&&roomId==='dm-elena'){
    state.viewpoint='elena';updatePerspective();renderChat();
   }
  }else showInbox();
 },
 openPeopleView:peopleView,
 openPrivateChat:(person,view='manager')=>{
  const id='dm-'+String(person||'').toLowerCase();
  if(!ROOMS.some(x=>x.id===id&&x.person))return false;
  window.SEYVEO_UNIFIED_TASKS?.openChat?.('manage',id,view);
  return true;
 }
});
window.addEventListener('pagehide',()=>{cancelVoice();cleanupPreview();clearMediaRenderUrls()});
preparePeopleContent();
renderTasks();
tab('chats');
window.addEventListener('storage',event=>{
 if(event.key===CHAT_KEY){
  state.chat=read(CHAT_KEY);
  renderDirectory();
  if(!$('svcpConversation').hidden)renderChat();
 }
 if(event.key===TASK_KEY){
  state.tasks=read(TASK_KEY);
  renderTasks();
  syncPreviewAfterTaskEdit();
  if(historyQuery.trim())renderHistorySearch();
 }
});
})();
