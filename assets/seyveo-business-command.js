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
 {id:'dm-sayvi',label:'Сэйви',kind:'personal',hint:'Рабочий помощник',mark:'',person:'sayvi',section:'assistant'}
];
const state={tab:'chats',room:'general',viewpoint:'manager',file:null,objectUrl:null,filePurpose:'file',scanCode:'',replyTo:null,draftSource:null,chat:read(CHAT_KEY),tasks:read(TASK_KEY)};
let chatsFromTasks=false,lastRecognizedPerson=null,quickReactionTarget=null,focusSearchIndex=null,historyQuery='',historyWindow=35;
// Demo document requests appear as messages in the existing documents room.
// No transport: the message and workflow exist only on this device.
window.addEventListener('seyveo:document-flow-updated',event=>{
 const d=event.detail||{};
 if(d.reason==='created'&&typeof d.id==='string'){
  const duplicate=state.chat.some(x=>x?.documentFlowId===d.id);
  if(!duplicate){
   const item={room:'docs',role:'self',at:Date.now(),documentFlowId:d.id,
    text:'▤ '+String(d.title||'Документ').slice(0,100)+'\nДля Елены · учебный запрос. Нет доставки на другой телефон.'};
   const updated=state.chat.concat(item).slice(-500);
   if(save(CHAT_KEY,updated))state.chat=updated;
  }
 }
 renderDirectory();
 if(state.room==='docs'&&!$('svcpConversation')?.hidden)renderChat();
});

let chatFilter='all',editingMessageIndex=null;
let lastChatAccount=null;
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
/* Decode local voice audio only on-device. Bar heights follow the actual
   recorded amplitude, rather than a decorative repeated pattern. */
async function localVoiceAmplitudes(blob,count=25){
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;
 if(!AudioContextClass||!blob?.size)return null;
 const context=new AudioContextClass();
 try{
  const buffer=await blob.arrayBuffer();
  const decoded=await context.decodeAudioData(buffer);
  if(!decoded?.length)return null;
  const data=decoded.getChannelData(0),samples=data.length;
  const peaks=[];
  for(let i=0;i<count;i++){
   const begin=Math.floor(i*samples/count),end=Math.min(samples,Math.floor((i+1)*samples/count));
   const step=Math.max(1,Math.floor((end-begin)/350));
   let power=0,maximum=0,n=0;
   for(let j=begin;j<end;j+=step){
    const a=Math.abs(data[j]);power+=a*a;
    if(a>maximum)maximum=a;
    n++;
   }
   peaks.push(Math.max(Math.sqrt(power/Math.max(1,n)),maximum*.35));
  }
  const top=Math.max(.001,...peaks);
  return peaks.map(value=>Math.round(4+26*Math.pow(value/top,.72)));
 }catch{
  // Safari cannot decode every recorded codec; keep playback working.
  return null;
 }finally{
  try{await context.close()}catch{}
 }
}

/* SEYVEO · one type-aware attachment vocabulary for chat, drafts and tasks.
   Original files remain in the existing IndexedDB, never in task localStorage. */
function svcpFileKind(name='',mime=''){
 const value=String(name||'').toLowerCase();
 const type=String(mime||'').toLowerCase();
 const suffix=value.match(/\.([a-z0-9]+)$/i)?.[1]||'';
 if(suffix==='pdf'||type.includes('application/pdf'))return {kind:'pdf',mark:'PDF',label:'Документ PDF'};
 if(['doc','docx','rtf','odt'].includes(suffix)||type.includes('wordprocessingml')||type.includes('msword'))
  return {kind:'word',mark:'DOC',label:'Документ Word'};
 if(['xls','xlsx','csv','ods'].includes(suffix)||type.includes('spreadsheetml')||type.includes('ms-excel'))
  return {kind:'sheet',mark:'XLS',label:'Таблица'};
 if(['jpg','jpeg','png','webp','heic','heif','gif'].includes(suffix)||type.startsWith('image/'))
  return {kind:'image',mark:'IMG',label:'Изображение'};
 if(['mp4','mov','webm','m4v'].includes(suffix)||type.startsWith('video/'))
  return {kind:'video',mark:'VID',label:'Видео'};
 if(['txt','md'].includes(suffix)||type.startsWith('text/'))
  return {kind:'text',mark:'TXT',label:'Текстовый файл'};
 return {kind:'other',mark:'FILE',label:'Файл'};
}
function svcpFileBadge(name,type){
 const meta=svcpFileKind(name,type);
 const badge=el('span','svcp-file-badge svcp-file-badge--'+meta.kind,meta.mark);
 badge.setAttribute('aria-hidden','true');
 return badge;
}
function svcpFileSize(bytes){
 if(!Number.isFinite(bytes)||bytes<0)return '';
 if(bytes<1024)return Math.round(bytes)+' Б';
 const value=bytes<1048576?bytes/1024:bytes/1048576;
 return value.toLocaleString('ru-RU',{maximumFractionDigits:1})+(bytes<1048576?' КБ':' МБ');
}
function svcpFileCard(name,type,url,timeNode=null,onOpen=null,bytes=null,isOwn=false){
 const displayName=String(name||'Вложение');
 const node=el(onOpen?'button':url?'a':'div','svcp-file-card');
 const detail=svcpFileKind(displayName,type);
 const badge=svcpFileBadge(displayName,type);
 if(detail.kind==='pdf')badge.textContent='pdf';
 node.append(badge);
 const body=el('span','svcp-file-card-copy');
 const heading=el('span','svcp-file-card-heading');
 heading.append(el('strong','svcp-file-card-name',displayName));
 body.append(heading,el('small','svcp-file-card-type',svcpFileSize(bytes)||detail.label));
 node.append(body);
 if(timeNode){
  const status=el('span','svcp-file-card-status');status.append(timeNode);
  if(isOwn){
   const tick=el('span','svcp-local-save-check','✓');
   tick.title='Сохранено здесь · доставка не подтверждена';
   tick.setAttribute('aria-hidden','true');status.append(tick);
  }
  node.append(status);
 }
 if(onOpen){
  node.type='button';node.classList.add('svcp-file-card-open');
  node.setAttribute('aria-label','Посмотреть документ '+displayName);
  node.addEventListener('click',onOpen);
 }else if(url){
  node.href=url;
  node.download=displayName;
  node.setAttribute('aria-label','Открыть или сохранить файл: '+displayName);
  const arrow=el('span','svcp-file-card-arrow','↗');arrow.setAttribute('aria-hidden','true');
  node.append(arrow);
 }
 return node;
}


let svcpCurrentDocClose=null;
function svcpOpenDocument(file){
 if(!(file instanceof File)||!file.size){setStatus('Файл недоступен');return}
 svcpCurrentDocClose?.();
 let live=true,extracted=null;
 const ext=file.name.split('.').pop().toLowerCase();
 const kind=svcpFileKind(file.name,file.type).kind;
 const url=URL.createObjectURL(file),last=document.activeElement;
 const sheet=el('section','svcp-doc-overlay');
 sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');
 sheet.setAttribute('aria-label','Просмотр документа '+file.name);
 const top=el('header','svcp-doc-top'),back=el('button','svcp-doc-back');
 back.type='button';back.setAttribute('aria-label','Назад к чату');
 back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5.5-6.5 6.5 6.5 6.5"/></svg>';
 const heading=el('div','svcp-doc-heading');
 heading.append(el('strong','svcp-doc-title',file.name),el('small','svcp-doc-size',svcpFileSize(file.size)));
 // One unified back arrow. Overflow menu has no other commands once Share moves below.
 top.append(back,heading);
 const body=el('div','svcp-doc-body');
 const info=el('p','svcp-doc-info');info.setAttribute('role','status');
 const say=value=>{if(live)info.textContent=value};
 let preview;
 if(kind==='pdf'){
  preview=el('iframe','svcp-doc-pdf');preview.title='PDF '+file.name;preview.src=url;
 }else if(kind==='image'){
  preview=el('img','svcp-doc-image');preview.src=url;preview.alt=file.name;
 }else{
  preview=el('pre','svcp-doc-text',kind==='word'?'Читаю документ…':'Открываю файл…');
 }
 body.append(preview);
 function save(blob,name){
  const href=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=href;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(href),15000);
 }
 const base=file.name.replace(/\.[^.]*$/,'')||'Документ';
 async function getText(){
  if(extracted!==null)return extracted;
  if(kind==='text'){extracted=await file.text();return extracted}
  if(kind!=='word'&&kind!=='pdf')throw Error('Для этого формата нет текстового преобразования.');
  const form=new FormData();form.append('file',file,file.name);
  const response=await fetch('/api/seyveo-document-text',{method:'POST',body:form,credentials:'same-origin'});
  const data=await response.json().catch(()=>null);
  if(!response.ok||typeof data?.text!=='string')throw Error('Нужен локальный сервер SEYVEO для чтения Word/PDF.');
  if(data.truncated||!data.text.trim())throw Error('Полный текст недоступен. Копию создавать нельзя.');
  extracted=data.text;return extracted;
 }
 if(kind==='text'){
  getText().then(t=>{if(live)preview.textContent=t.slice(0,120000)})
   .catch(()=>{if(live)preview.textContent='Ошибка чтения текста.'});
 }else if(kind==='word'){
  getText().then(t=>{if(live)preview.textContent=t})
   .catch(()=>{if(live)preview.textContent='Предпросмотр Word требует локального сервера. Кнопка Word сохранит оригинал.'});
 }else if(kind!=='pdf'&&kind!=='image'){
  preview.textContent='Оригинал файла можно открыть в подходящем приложении.';
 }
 const icons={
  share:'<path d="M12 16V3m-5 5 5-5 5 5M4 14v7h16v-7"/>',
  eye:'<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.2"/>',
  word:'<path d="M7 3h8l4 4v14H7zM15 3v4h4M9 12l2 5 2-5 2 5 2-5"/>',
  pdf:'<path d="M7 3h8l4 4v14H7zM15 3v4h4M9 12h6M9 16h5"/>',
  print:'<path d="M6 8V3h12v5M6 17H4V9h16v8h-2M6 15h12v6H6z"/>',
  pen:'<path d="M4 17c3-7 4 4 7-2 3-8 4 3 8-3M4 21h16"/>'
 };
 function pill(label,icon,run){
  const button=el('button','svcp-doc-pill');button.type='button';
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[icon]+'</svg>';
  button.append(el('span','',label));button.addEventListener('click',run);
  return button;
 }
 // The document is already open; show five useful actions instead.
 const actionRail=el('div','svcp-doc-action-rail');
 actionRail.setAttribute('role','group');
 actionRail.setAttribute('aria-label','Действия с открытым документом');
 actionRail.append(pill('Word','word',async()=>{
  try{
   if(kind==='word'){save(file,file.name);say('Оригинал Word сохранён.');return}
   say('Подготавливаю Word…');const t=await getText();if(!live)return;
   const blob=window.SEYVEO_DOCS_EXPORT?.docxFromText?.(t);
   if(!blob)throw Error('Модуль Word недоступен.');
   save(blob,base+'-текстовая-копия.docx');
   say('Сохранена текстовая копия Word. Оформление оригинала может отличаться.');
  }catch(e){say(e.message||'Не удалось подготовить Word.')}
 }),pill('PDF','pdf',async()=>{
  try{
   if(kind==='pdf'){save(file,file.name);say('Оригинал PDF сохранён.');return}
   say('Подготавливаю PDF…');const t=await getText();if(!live)return;
   if(t.length>15000)throw Error('Для PDF поддерживается до 15 000 знаков.');
   if(!window.SEYVEO_CREATE_PDF)throw Error('Модуль PDF недоступен.');
   const blob=await window.SEYVEO_CREATE_PDF(t);if(!live)return;
   save(blob,base+'-текстовая-копия.pdf');
   say('Сохранена текстовая копия PDF, без исходного оформления.');
  }catch(e){say(e.message||'Не удалось подготовить PDF.')}
 }),pill('Печать','print',()=>{
  if(kind!=='pdf'&&kind!=='image'){say('Для печати открой оригинал в подходящем приложении либо подготовь PDF.');return}
  const popup=window.open(url,'_blank');
  say(popup?'В системном меню документа выбери «Печать».':'Разреши открытие окна для печати.');
 }));
 actionRail.append(pill('Поделиться','share',()=>{
  // Web Share has to start inside the tap handler to preserve user activation.
  const payload={files:[file],title:file.name};
  const fallback=()=>{
   say('Системное меню отправки файлов недоступно. Оригинал можно сохранить через Word или PDF.');
  };
  if(typeof navigator.share!=='function'){fallback();return}
  try{
   if(typeof navigator.canShare==='function'&&!navigator.canShare(payload)){fallback();return}
   Promise.resolve(navigator.share(payload)).catch(error=>{
    if(error?.name!=='AbortError')fallback();
   });
  }catch{fallback()}
 }));
 const doc=pill('Подпись','pen',()=>{
  if(typeof window.SEYVEO_SAYVI_SURFACES?.open!=='function'||
     !window.SEYVEO_DOCUMENT_CENTER?.importFromChat?.(file)){
   say('Передача в рабочие Документы сейчас недоступна.');return
  }
  close();
  window.SEYVEO_SAYVI_SURFACES?.open?.('contract','business');
 });
 doc.classList.add('svcp-doc-to-documents');
 doc.setAttribute('aria-label','Открыть в Документах для подписи');
 doc.title='В Документы · подпись';
 actionRail.append(doc);
 const bottom=el('footer','svcp-doc-bottom');bottom.append(actionRail,info);
 sheet.append(top,body,bottom);
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();close()}};
 function close(){
  if(!live)return;live=false;
  document.removeEventListener('keydown',onKey);
  sheet.remove();URL.revokeObjectURL(url);
  svcpCurrentDocClose=null;
  if(last?.isConnected)last.focus({preventScroll:true});
 }
 back.addEventListener('click',close);
 document.addEventListener('keydown',onKey);
 document.body.append(sheet);
 svcpCurrentDocClose=close;back.focus({preventScroll:true});
}

function restoreStoredMedia(container,message){
 if(!message.mediaId)return;
 const slot=el('div','svcp-media-slot','Открываю вложение…');
 container.append(slot);
 loadMediaLocally(message.mediaId).then(record=>{
  if(!slot.isConnected)return;
  const thread=$('svcpMessages');
  const followLatest=!!thread&&(thread.scrollHeight-thread.scrollTop-thread.clientHeight<160);
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
   const sticks=[];
   for(let i=0;i<25;i++){
    const stick=el('i');
    stick.style.height='4px';
    stick.classList.add('svcp-wave-pending');
    wave.append(stick);sticks.push(stick);
   }
   // Analysis is asynchronous and must not delay playback or chat rendering.
   localVoiceAmplitudes(record.blob,sticks.length).then(heights=>{
    if(!wave.isConnected)return;
    sticks.forEach((stick,i)=>{
     stick.style.height=(heights?heights[i]:4)+'px';
     stick.classList.remove('svcp-wave-pending');
    });
   });
   const updateWaveProgress=()=>{
    const ratio=Number.isFinite(audio.duration)&&audio.duration>0
     ?Math.min(1,Math.max(0,audio.currentTime/audio.duration)):0;
    sticks.forEach((stick,i)=>stick.classList.toggle('svcp-wave-heard',(i+.5)/sticks.length<=ratio));
   };
   const duration=el('time','svcp-audio-duration',
    message.audioDuration?voiceDuration(Math.max(1000,message.audioDuration*1000)):'00:01');
   control.addEventListener('click',async()=>{try{
    if(audio.paused){await audio.play()}else audio.pause();
   }catch{setStatus('Аудиозапись не удалось воспроизвести')}});
   audio.addEventListener('play',()=>{control.textContent='Ⅱ';control.setAttribute('aria-label','Приостановить голосовое')});
   audio.addEventListener('pause',()=>{control.textContent='▶';control.setAttribute('aria-label','Воспроизвести голосовое')});
   audio.addEventListener('ended',()=>{
    control.textContent='▶';
    updateWaveProgress();
    duration.textContent=voiceDuration(Math.max(1000,(message.audioDuration||Math.ceil(audio.duration)||1)*1000));
   });
   audio.addEventListener('timeupdate',()=>{
    if(Number.isFinite(audio.duration)&&audio.duration>0){
     updateWaveProgress();
     duration.textContent=voiceDuration(Math.max(1000,Math.ceil(audio.duration-audio.currentTime)*1000));
    }
   });
   slot.classList.add('svcp-voice-message');
   slot.append(control,wave,duration,audio);
  }else if(record.type?.startsWith('video/')){
   const video=el('video','svcp-chat-media-video');
   video.src=url;video.controls=true;video.playsInline=true;video.preload='metadata';
   video.setAttribute('aria-label','Рабочее видео: '+(record.name||''));slot.append(video);
  }else{
   const timestamp=container.querySelector('.svcp-bubble-meta .svcp-time');
   const filename=record.name||message.mediaName||'Вложение';
   const localFile=record.blob instanceof File?record.blob:new File([record.blob],filename,{type:record.type||message.mediaType||''});
   const previewable=['pdf','word','text'].includes(svcpFileKind(filename,record.type||message.mediaType||'').kind);
   const tile=svcpFileCard(filename,record.type||message.mediaType||'',url,timestamp,
    previewable?()=>svcpOpenDocument(localFile):null,record.blob.size,container.classList.contains('is-self'));
   if(container.classList.contains('svcp-document-only')){
    let hold=null,blocked=false,startX=0,startY=0;
    const clear=()=>{if(hold!==null){clearTimeout(hold);hold=null}};
    tile.addEventListener('pointerdown',e=>{
     if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
     blocked=false;startX=e.clientX;startY=e.clientY;clear();
     hold=setTimeout(()=>{
      hold=null;blocked=true;
      container.dispatchEvent(new Event('svcp:document-context'));
     },490);
    });
    tile.addEventListener('pointermove',e=>{
     if(Math.abs(e.clientX-startX)>10||Math.abs(e.clientY-startY)>10)clear();
    });
    tile.addEventListener('pointerup',clear);
    tile.addEventListener('pointercancel',()=>{clear();blocked=false});
    tile.addEventListener('click',e=>{
     if(!blocked)return;
     e.preventDefault();e.stopImmediatePropagation();blocked=false;
    },true);
    tile.addEventListener('contextmenu',e=>{
     e.preventDefault();clear();blocked=true;
     container.dispatchEvent(new Event('svcp:document-context'));
    });
   }
   slot.append(tile);
   if(timestamp)container.classList.add('svcp-file-time-inside');
  }
  // The file card itself is sufficient. Delivery limitations remain in
  // the send-status feedback, not repeated beneath every chat attachment.
  // Media is inserted asynchronously after renderChat scrolled to the latest.
  // Preserve the reading position unless the user was already near the bottom.
  if(followLatest&&thread)requestAnimationFrame(()=>{
   if(slot.isConnected)thread.scrollTop=thread.scrollHeight;
  });
 }).catch(()=>{if(slot.isConnected)slot.textContent='Вложение недоступно в этом браузере'});
}


/* One real audio recording flow, using the existing local chat and IndexedDB.
 * No dictation, upload, background mic or cross-device delivery.
 * Tap mic -> stop -> review -> send (or discard). */
const voiceRecordButton=$('svcpVoiceRecord'),voicePanel=$('svcpVoiceCapture');
const voiceStopButton=$('svcpVoiceStop'),voiceSendButton=$('svcpVoiceSend'),voiceCancelButton=$('svcpVoiceCancel');
const voicePreview=$('svcpVoicePreview'),voiceClock=$('svcpVoiceClock'),voiceLabel=$('svcpVoiceLabel');
const voiceHint=$('svcpVoiceHint'),voicePreviewPlay=$('svcpVoicePreviewPlay');
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
 if(voicePreviewPlay){voicePreviewPlay.hidden=true;voicePreviewPlay.textContent='▶'}
 if(voicePreviewUrl){URL.revokeObjectURL(voicePreviewUrl);voicePreviewUrl=null}
}
function setVoicePanel(open,stateName='recording'){
 if(!voicePanel)return;
 voicePanel.hidden=!open;voicePanel.dataset.state=stateName;
 voiceRecordButton?.setAttribute('aria-expanded',String(open));
 if(voiceStopButton)voiceStopButton.hidden=stateName!=='recording';
 if(voiceSendButton)voiceSendButton.hidden=stateName!=='ready';
 if(voicePreviewPlay)voicePreviewPlay.hidden=stateName!=='ready';
 if(voiceLabel)voiceLabel.textContent=stateName==='recording'?'Идёт запись голоса':
  stateName==='processing'?'Подготавливаю запись…':
  stateName==='error'?'Нет микрофона':'Голосовое';
}
function showVoiceError(message){
 // An unavailable/denied microphone is NOT an active recording.
 // Restore the composer immediately; show the reason in a short status toast.
 setVoicePanel(false);
 if(voiceHint)voiceHint.textContent='';
 setStatus(message);
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
    voicePreview.load();
   }
   if(voiceClock)voiceClock.textContent=voiceDuration(duration);
   if(voiceHint)voiceHint.textContent='Прослушай запись и отправь, либо удали.';
   setVoicePanel(true,'ready');
  };
  try{recorder.start(300)}
  catch(error){session.discard=true;voiceSession=null;releaseVoiceStream(stream);throw error}
  clearVoiceDraft();
  setVoicePanel(true,'recording');
  if(voiceClock)voiceClock.textContent='00:00';
  if(voiceHint)voiceHint.textContent='Отпусти микрофон, чтобы закончить запись.';
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
   mediaId,mediaType:mime,mediaPurpose:'voice',audioDuration:Math.max(1,Math.ceil(draft.duration/1000))};
  const updated=state.chat.concat(entry).slice(-500);
  if(!save(CHAT_KEY,updated))return;
  state.chat=updated;
  cancelVoice();
  renderChat();renderDirectory();
  setStatus('Голосовое сохранено только на этом устройстве');
 }catch{
  const message='Не получилось сохранить голосовое на устройстве. Проверь свободное место и повтори.';
  setStatus(message);if(voiceHint)voiceHint.textContent=message;
 }finally{
  voiceSaving=false;
  if(voiceSendButton)voiceSendButton.disabled=false;
 }
}
voicePreviewPlay?.addEventListener('click',async()=>{
 if(!voicePreview||!voiceDraft)return;
 try{
  if(voicePreview.paused)await voicePreview.play();
  else voicePreview.pause();
 }catch{setStatus('Не удалось воспроизвести запись. Попробуй ещё раз.')}
});
voicePreview?.addEventListener('play',()=>{
 if(voicePreviewPlay){voicePreviewPlay.textContent='Ⅱ';voicePreviewPlay.setAttribute('aria-label','Пауза')}
});
voicePreview?.addEventListener('pause',()=>{
 if(voicePreviewPlay){voicePreviewPlay.textContent='▶';voicePreviewPlay.setAttribute('aria-label','Прослушать запись')}
});
voicePreview?.addEventListener('ended',()=>{
 if(voicePreviewPlay)voicePreviewPlay.textContent='▶';
 if(voiceClock&&voiceDraft)voiceClock.textContent=voiceDuration(voiceDraft.duration);
});
voicePreview?.addEventListener('timeupdate',()=>{
 if(!voicePreview.paused&&voiceClock&&voiceDraft)
  voiceClock.textContent=voiceDuration(Math.max(0,voiceDraft.duration-voicePreview.currentTime*1000));
});
/* Hold-to-record on touch / mouse / pen. The release is tracked on window
 * because the composer is hidden while the voice strip is showing. */
let voiceHold=null;
voiceRecordButton?.addEventListener('pointerdown',event=>{
 if(event.button!==0||voiceHold||voiceSaving)return;
 if(voiceSession||voiceDraft){event.preventDefault();return}
 event.preventDefault(); // prevent a synthetic click from starting a second recording
 const hold={pointerId:event.pointerId,released:false};
 voiceHold=hold;
 startVoice().then(()=>{
  if(voiceHold!==hold)return;
  // A rejected permission prompt may finish before pointerup. Always release
  // the hold if there is no recording, or the next press would be ignored.
  if(hold.released||(!voiceSession&&!voiceDraft)){
   voiceHold=null;
   if(voiceSession&&!voiceSession.finished)stopVoice();
  }
 });
});
function endVoiceHold(event){
 const hold=voiceHold;
 if(!hold||event.pointerId!==hold.pointerId)return;
 hold.released=true;
 if(voiceSession&&!voiceSession.finished){
  voiceHold=null;
  stopVoice();
 }
}
window.addEventListener('pointerup',endVoiceHold,true);
window.addEventListener('pointercancel',endVoiceHold,true);
// Preserve keyboard/switch accessibility; suppress physical tap/click toggling.
voiceRecordButton?.addEventListener('click',event=>{
 if(event.detail!==0){event.preventDefault();return}
 startVoice();
});
voiceRecordButton?.addEventListener('contextmenu',event=>event.preventDefault());

voiceStopButton?.addEventListener('click',stopVoice);
voiceCancelButton?.addEventListener('click',cancelVoice);
voiceSendButton?.addEventListener('click',sendVoice);
window.addEventListener('seyveo:work-chat-closing',cancelVoice);

function read(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.slice(-(key===CHAT_KEY?500:100)):[]}catch{return []}}
function save(key,list){try{localStorage.setItem(key,JSON.stringify(list));return true}catch{setStatus('Не удалось сохранить на этом устройстве. Проверьте свободное место и разрешения браузера.');return false}}
// Shared local commit for chat composer and Home quick replies.
// Successful persistence is NOT external delivery.
function commitChatMessages(entries){
 if(!Array.isArray(entries)||!entries.length)return false;
 const updated=state.chat.concat(entries).slice(-500);
 if(!save(CHAT_KEY,updated))return false;
 state.chat=updated;
 notifyRecognitionSuggestions();
 return true;
}
let statusResetTimer=null;
function setStatus(s){
 const el=$('svcpChatStatus');if(!el)return;
 el.textContent=s;
 clearTimeout(statusResetTimer);
 const screen=$('svcpWorkChatScreen');
 // Golden Sayvi only for a real positive announcement, not regular actions.
 const goodNews=/(?:поздравляю|хорошая новость|отличные новости|награда|поощрение|успешно завершен)/iu.test(String(s));
 screen?.classList.toggle('svcp-sayvi-good-news',goodNews);
 if(screen&&!screen.hidden&&screen.dataset.view==='room'){
  el.dataset.show='true';
  statusResetTimer=setTimeout(()=>{
   el.dataset.show='false';
   screen.classList.remove('svcp-sayvi-good-news');
  },s==='Голосовое сохранено только на этом устройстве'?2100:3000);
 }else{
  el.dataset.show='false';
  screen?.classList.remove('svcp-sayvi-good-news');
 }
}
window.addEventListener('seyveo:work-chat-closing',()=>{
 clearTimeout(statusResetTimer);
 const el=$('svcpChatStatus');if(el)el.dataset.show='false';
 $('svcpWorkChatScreen')?.classList.remove('svcp-sayvi-good-news');
});
function syncComposerActions(){
 const form=$('svcpChatForm');if(!form)return;
 const text=$('svcpChatInput')?.value.trim()||'';
 form.dataset.hasContent=String(!!(text||state.file||state.scanCode));
 // "Поручить" belongs to the manager's action menu on a sent message,
 // not the cramped writing dock. Preserve the original task review workflow.
 const task=$('svcpComposerDirectTask');
 if(task)task.hidden=true;
 form.classList.remove('svcp-can-assign');
}
$('svcpChatInput')?.addEventListener('input',syncComposerActions);
/* The single-line input must never be temporarily resized to measure its text:
 * Safari draws that temporary state during keyboard animation. A detached,
 * invisible mirror measures both available widths without touching the dock. */
const svcpComposeMeasure=document.createElement('div');
svcpComposeMeasure.setAttribute('aria-hidden','true');
svcpComposeMeasure.style.cssText='position:fixed;left:-10000px;top:0;display:block;visibility:hidden;pointer-events:none;box-sizing:border-box;padding:0;margin:0;border:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;line-height:24px;font-size:16px;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;';
document.body.appendChild(svcpComposeMeasure);
function measuredComposeHeight(value,width){
 svcpComposeMeasure.style.width=Math.max(20,width)+'px';
 svcpComposeMeasure.textContent=(value||'')+'\u200b';
 return Math.ceil(svcpComposeMeasure.getBoundingClientRect().height);
}
function resizeWorkComposer(){
 const input=$('svcpChatInput'),form=$('svcpChatForm');
 if(!input||!form)return;
 const value=input.value;
 // Explicit idle reset: no stale expanded height or wrap state after sending.
 if(!value&&!state.file&&!state.scanCode){
  form.classList.remove('svcp-compose-multiline');
  form.style.setProperty('--svcp-editor-height','40px');
  form.style.setProperty('--svcp-compose-height','56px');
  form.style.setProperty('height','56px','important');
  input.style.setProperty('height','40px','important');
  input.style.setProperty('overflow-y','hidden','important');
  const host=form.closest('.svcp-chat');
  host?.style.setProperty('--svcp-current-compose-height','56px');
  return;
 }
 const compact=window.matchMedia('(max-width:390px)').matches;
 const base=compact?38:40;
 const formWidth=form.getBoundingClientRect().width||Math.max(240,window.innerWidth-12);
 // The writing dock no longer reserves space for "Поручить".
 // Keep enough room for the send icon, without stealing emoji/input width.
 const shortWidth=formWidth-132-15-54;
 const hasNewline=value.includes('\n');
 const textHeight=measuredComposeHeight(value,shortWidth);
 const wraps=!!value&&(hasNewline||textHeight>24);
 // In multiline the text occupies the full width. Tool buttons use the
 // separate 42px bottom row. No second background/capsule is introduced.
 const expandedHeight=measuredComposeHeight(value,formWidth-32);
 const editorHeight=wraps?Math.min(144,Math.max(44,expandedHeight+16)):base;
 const targetHeight=wraps?editorHeight+55:56;
 form.classList.toggle('svcp-compose-multiline',wraps);
 form.style.setProperty('--svcp-editor-height',editorHeight+'px');
 form.style.setProperty('--svcp-compose-height',targetHeight+'px');
 form.style.setProperty('height',targetHeight+'px','important');
 input.style.setProperty('height',editorHeight+'px','important');
 input.style.setProperty('overflow-y',wraps&&expandedHeight+16>144?'auto':'hidden','important');
}

$('svcpChatInput')?.addEventListener('input',resizeWorkComposer);

/* Read-only size observer: the floating preview knows the composer height.
   It never changes the composer itself and cannot create a layout feedback loop. */
const svcpComposerFrame=$('svcpChatForm');
if(svcpComposerFrame&&typeof ResizeObserver==='function'){
 const svcpComposerSizer=new ResizeObserver(entries=>{
  const host=svcpComposerFrame.closest('.svcp-chat');
  if(!host)return;
  const h=Math.max(56,Math.ceil(entries[0]?.target.getBoundingClientRect().height||56));
  if(host.style.getPropertyValue('--svcp-current-compose-height')!==h+'px')
   host.style.setProperty('--svcp-current-compose-height',h+'px');
 });
 svcpComposerSizer.observe(svcpComposerFrame);
}

/* A separate Plus like Home's search circle: file and camera are
   offered in its small menu, preserving the original input handlers. */
const svcpAttachMenu=$('svcpAttachMenu');
function closeWorkAttachMenu(){
 if(svcpAttachMenu)svcpAttachMenu.hidden=true;
 $('svcpAttachFile')?.setAttribute('aria-expanded','false');
}
$('svcpAttachFile')?.addEventListener('click',event=>{
 event.stopPropagation();
 const open=!!svcpAttachMenu?.hidden;
 setCameraTray(false);
 if(!svcpAttachMenu)return;
 svcpAttachMenu.hidden=!open;
 $('svcpAttachFile')?.setAttribute('aria-expanded',String(open));
});
$('svcpAttachChooseFile')?.addEventListener('click',()=>{
 closeWorkAttachMenu();
 const picker=$('svcpFile');if(!picker)return;
 picker.value='';picker.click();
});
$('svcpAttachChooseCamera')?.addEventListener('click',()=>{
 closeWorkAttachMenu();
 $('svcpCameraToggle')?.click();
});
document.addEventListener('pointerdown',event=>{
 if(svcpAttachMenu?.hidden)return;
 if(svcpAttachMenu?.contains(event.target)||$('svcpAttachFile')?.contains(event.target))return;
 closeWorkAttachMenu();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape')closeWorkAttachMenu();
});

/* Draft polishing is opt-in and never sends a message. Basic offline demo only. */
function polishDraftLocally(raw){
 let value=raw.trim().replace(/[ \t]+/g,' ').replace(/\s*([,;:!?])\s*/g,'$1 ').replace(/\s+([.])/g,'$1');
 const replacements=[
  [/\bщас\b/giu,'сейчас'],[/\bпж\b/giu,'пожалуйста'],[/\bплиз\b/giu,'пожалуйста'],
  [/\bспс\b/giu,'спасибо'],[/\bнезнаю\b/giu,'не знаю'],[/\bнемогу\b/giu,'не могу'],
  [/\bче\b/giu,'что'],[/\bчё\b/giu,'что'],[/\bок\b/giu,'хорошо']
 ];
 for(const [pattern,replacement] of replacements)value=value.replace(pattern,replacement);
 value=value.replace(/\s+/g,' ').trim();
 if(!value)return '';
 value=value.charAt(0).toLocaleUpperCase('ru-RU')+value.slice(1);
 if(!/[.!?…]$/.test(value))value+='.';
 return value;
}
$('svcpPolishMessage')?.addEventListener('click',()=>{
 const input=$('svcpChatInput');if(!input)return;
 setCameraTray(false);
 const original=input.value;
 if(!original.trim()){setStatus('Сначала напиши сообщение своими словами.');input.focus();return}
 const improved=polishDraftLocally(original);
 if(!improved||improved===original.trim()){setStatus('Текст уже выглядит аккуратно. Проверь его перед отправкой.');return}
 input.value=improved;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 input.focus({preventScroll:true});
 input.setSelectionRange(improved.length,improved.length);
 setStatus('Сэйви поправила оформление текста (демо). Проверь смысл перед отправкой.');
});

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
/* SEYVEO Work Chat typing presence: actual local typing, never simulated activity. */
const workTypingPeers=new Map();
const workTypingSource='work-'+Math.random().toString(36).slice(2);
let workTypingChannel=null;
try{
 if(typeof BroadcastChannel==='function')workTypingChannel=new BroadcastChannel('seyveo-workchat-typing-demo-v1');
}catch(_error){workTypingChannel=null}
let workTypingIdleTimer=null,workTypingExpiryTimer=null;
let workTypingOwnContext=null,workTypingLastSentAt=0;
function workTypingIdentity(){
 return state.viewpoint==='elena'
  ?{userId:'elena',name:'Елена'}
  :{userId:'manager-demo',name:'Руководитель'};
}
function workTypingBaseDetail(){
 const current=roomDetails();
 return state.viewpoint==='elena'?'Просмотр от лица Елены · демо'
  :current.kind==='personal'?(current.hint.split(' · ')[0]||'Личный чат'):'Рабочая группа';
}
function updateWorkTypingIndicator(){
 const now=Date.now();
 for(const [key,peer] of workTypingPeers){
  if(peer.expires<=now)workTypingPeers.delete(key);
 }
 if(workTypingExpiryTimer!==null)clearTimeout(workTypingExpiryTimer);
 workTypingExpiryTimer=null;
 const upcoming=[...workTypingPeers.values()].map(peer=>peer.expires).filter(time=>time>now);
 if(upcoming.length){
  workTypingExpiryTimer=setTimeout(updateWorkTypingIndicator,Math.max(50,Math.min(...upcoming)-now+30));
 }
 const title=$('svcpConversationTitle'),detail=$('svcpConversationDetail');
 if(!title||!detail||$('svcpConversation')?.hidden)return;
 const room=roomDetails(),own=workTypingIdentity();
 const peer=[...workTypingPeers.values()].find(item=>
  item.roomId===room.id && item.userId!==own.userId &&
  (room.kind!=='personal'||item.userId==='manager-demo'||item.userId===room.person));
 const shownName=state.viewpoint==='elena'&&room.id==='dm-elena'?'Руководитель':room.label;
 title.textContent=shownName;
 title.classList.toggle('svcp-peer-typing',!!peer&&room.kind==='personal');
 detail.textContent=peer
  ?(room.kind==='personal'?'печатает…':peer.name+' печатает…')
  :workTypingBaseDetail();
 detail.classList.toggle('svcp-peer-typing',!!peer&&room.kind!=='personal');
}
function receiveWorkTyping(raw){
 if(!raw||typeof raw!=='object'||raw.source===workTypingSource)return;
 const roomId=typeof raw.roomId==='string'?raw.roomId:'';
 const userId=typeof raw.userId==='string'?raw.userId:'';
 const name=typeof raw.name==='string'?raw.name.trim().slice(0,40):'';
 if(!ROOMS.some(room=>room.id===roomId)||!userId||userId.length>64||!name)return;
 const key=roomId+'::'+userId;
 if(raw.active===true)workTypingPeers.set(key,{roomId,userId,name,expires:Date.now()+3700});
 else if(raw.active===false)workTypingPeers.delete(key);
 else return;
 updateWorkTypingIndicator();
}
if(workTypingChannel)workTypingChannel.addEventListener('message',event=>receiveWorkTyping(event.data));
/* Future authorized chat transport may dispatch this event when a genuine
   remote user begins/stops typing. No remote presence is invented locally. */
window.addEventListener('seyveo:workchat-typing',event=>receiveWorkTyping(event.detail));
function broadcastWorkTyping(active,context){
 const detail={kind:'typing',roomId:context.roomId,userId:context.userId,name:context.name,
  active,source:workTypingSource};
 try{workTypingChannel?.postMessage(detail)}catch(_error){}
 window.dispatchEvent(new CustomEvent('seyveo:workchat-typing-outbound',{detail}));
}
function stopWorkTypingLocal(){
 if(workTypingIdleTimer!==null)clearTimeout(workTypingIdleTimer);
 workTypingIdleTimer=null;
 if(workTypingOwnContext)broadcastWorkTyping(false,workTypingOwnContext);
 workTypingOwnContext=null;
 workTypingLastSentAt=0;
}
function onWorkTypingInput(){
 const input=$('svcpChatInput');
 if(!input||!input.value.trim()||$('svcpConversation')?.hidden){stopWorkTypingLocal();return}
 const sender=workTypingIdentity();
 const context={roomId:state.room,userId:sender.userId,name:sender.name};
 if(workTypingOwnContext && 
  (workTypingOwnContext.roomId!==context.roomId||workTypingOwnContext.userId!==context.userId)){
  stopWorkTypingLocal();
 }
 const now=Date.now();
 if(!workTypingOwnContext||now-workTypingLastSentAt>=950){
  broadcastWorkTyping(true,context);
  workTypingLastSentAt=now;
 }
 workTypingOwnContext=context;
 if(workTypingIdleTimer!==null)clearTimeout(workTypingIdleTimer);
 workTypingIdleTimer=setTimeout(stopWorkTypingLocal,2600);
}
$('svcpChatInput')?.addEventListener('input',onWorkTypingInput);
$('svcpChatInput')?.addEventListener('blur',stopWorkTypingLocal);
window.addEventListener('seyveo:work-chat-sent',stopWorkTypingLocal);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopWorkTypingLocal()});
window.addEventListener('pagehide',stopWorkTypingLocal);

function senderName(msg){
 if(msg.role==='recognition')return '✦ Знак признания · демо';
 if(msg.role==='sayvi')return 'Сэйви';
 if(msg.role==='demo-elena')return 'Елена · учебный пример';
 return roomDetails().kind==='personal'?'Руководитель':'Вы';
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
// A change between the employee and manager previews must never reuse
// stale search/filter/perspective state from the other role. Messages remain
// untouched in the same local demo storage.
function syncChatAccount(){
 const account=employeePreviewActive()?'employee':'manager';
 if(lastChatAccount===account)return;
 lastChatAccount=account;
 chatFilter='all';
 historyQuery='';
 focusSearchIndex=null;
 historyWindow=35;
 const search=$('svcpHistorySearch');
 if(search)search.value='';
 $('svcpChatFilters')?.querySelectorAll('[data-svcp-chat-filter]').forEach(button=>
  button.setAttribute('aria-pressed',String(button.dataset.svcpChatFilter==='all')));
 editingMessageIndex=null;
}
function showInbox(){
 stopWorkTypingLocal();
 syncChatAccount();
 cancelVoice();editingMessageIndex=null;
 const container=$('svcpWorkChatScreen');
 if(container)container.dataset.view='inbox';
 const info=$('svcpRoomInfo');if(info)info.hidden=true;
 $('svcpRoomInfoToggle')?.setAttribute('aria-expanded','false');
 $('svcpConversationHeading')?.setAttribute('aria-expanded','false');
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
 stopWorkTypingLocal();
 syncChatAccount();
 cancelVoice();editingMessageIndex=null;
 const container=$('svcpWorkChatScreen');
 if(container)container.dataset.view='room';
 const info=$('svcpRoomInfo');if(info)info.hidden=true;
 $('svcpRoomInfoToggle')?.setAttribute('aria-expanded','false');
 $('svcpConversationHeading')?.setAttribute('aria-expanded','false');
 closeRecognition();
 closeComposerEmoji();
 setCameraTray(false);
 historyWindow=35;
 $('svcpRecognizeOpenCard').hidden=true;lastRecognizedPerson=null;
 const selected=ROOMS.find(x=>x.id===roomId);if(!selected)return;
 if(employeePreviewActive()&&!employeeAllowedRoom(selected.id))return;
 state.room=selected.id;
 // Single-person chats do not repeat sender names inside every bubble.
 // Group author labels remain visible. Aria labels still retain identity.
 const conversation=$('svcpConversation');
 if(conversation){
  conversation.dataset.roomKind=selected.kind;
  conversation.dataset.roomId=selected.id;
 }
 state.viewpoint=employeePreviewActive()?'elena':'manager';
 const avatar=$('svcpRoomAvatar');if(avatar)avatar.textContent=state.viewpoint==='elena'&&selected.id==='dm-elena'?'Р':selected.mark;
 const roomName=$('svcpRoomInfoName');if(roomName)roomName.textContent=
  state.viewpoint==='elena'&&selected.id==='dm-elena'?'Руководитель':selected.label;
 const roomDescription=$('svcpRoomInfoDescription');
 if(roomDescription)roomDescription.textContent=selected.kind==='personal'
  ?(selected.hint.split(' · ')[0]||'Личный чат')
  :selected.hint;
 $('svcpChatDirectory').hidden=true;
 $('svcpConversation').hidden=false;
 $('svcpConversationTitle').textContent=employeePreviewActive()&&selected.id==='dm-elena'
 ?'Руководитель':selected.label;
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
  ?'Просмотр от лица Елены · демо'
  :current.kind==='personal'?(current.hint.split(' · ')[0]||'Личный чат'):'Рабочая группа';
 $('svcpMentionElena').hidden=true; // No hard-coded employee shortcut in group chat headers; @mentions belong in the composer.
 const chips=chatRoot.querySelector('.svcp-rooms');if(chips)chips.hidden=current.kind!=='groups';
 $('svcpRecognizeOpen').hidden=true; // Awards are offered contextually beside relevant messages.
 const directTask=$('svcpComposerDirectTask'),recipient=privateAssignmentRecipient();
 if(directTask){
  directTask.setAttribute('aria-label',recipient
   ?'Создать поручение для '+STAFF[recipient]+' из написанного текста'
   :'Поручить написанное сотруднику');
 }
 $('svcpChatInput').placeholder='Сообщение…';
 syncComposerActions();
 resizeWorkComposer();
 window.dispatchEvent(new CustomEvent('seyveo:work-role-preview',{detail:{role:state.viewpoint==='elena'?'employee':'manager'}}));
 updateWorkTypingIndicator();
}
function toggleRoomInformation(){
 const panel=$('svcpRoomInfo');if(!panel)return;
 panel.hidden=!panel.hidden;
 const expanded=String(!panel.hidden);
 $('svcpRoomInfoToggle')?.setAttribute('aria-expanded',expanded);
 $('svcpConversationHeading')?.setAttribute('aria-expanded',expanded);
}
$('svcpRoomInfoToggle')?.addEventListener('click',toggleRoomInformation);
$('svcpConversationHeading')?.addEventListener('click',toggleRoomInformation);
$('svcpConversationBack')?.addEventListener('click',showInbox);
$('svcpConversationSearch')?.addEventListener('click',()=>{
 showInbox();
 $('svcpHistorySearch')?.focus({preventScroll:true});
});
$('svcpElenaPerspective')?.addEventListener('click',()=>{
 if(employeePreviewActive())return;
 stopWorkTypingLocal();
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
const QUICK_EMOJIS=['👍','❤️','😂','🔥','👏','😊'];
const MORE_EMOJI_GROUPS=[
 {name:'Эмоции',emojis:['🥰','😍','🤣','😄','😁','😉','🥹','😢','😮','🤔','😎','🙏']},
 {name:'Поддержка',emojis:['💚','💙','💜','🫶','💪','🙌','👌','🤝','💯','✨','🎉','🏆']},
 {name:'Работа',emojis:['✅','📌','🚀','💡','👀','👏','🤩','🙈','☕','🌟','🎯','🤗']}
];
function closeMessageMenus(){
 chatRoot.querySelectorAll('.svcp-message-menu').forEach(menu=>{
  menu.hidden=true;menu.style.transform='';
 });
 chatRoot.querySelectorAll('.svcp-more-trigger').forEach(trigger=>trigger.setAttribute('aria-expanded','false'));
 $('svcpWorkChatScreen')?.querySelectorAll('.svcp-message-context-menu').forEach(menu=>menu.remove());
}
document.addEventListener('pointerdown',event=>{
 if(event.target.closest?.('.svcp-message-menu,.svcp-more-trigger,.svcp-message-context-menu'))return;
 closeMessageMenus();
});
$('svcpMessages')?.addEventListener('scroll',closeMessageMenus,{passive:true});
/* Five essential emoji choices live inside the existing message capsule.
 * No popover, no camera tray, no second composer row. */
const composerEmojiStrip=$('svcpComposerEmojiStrip');
const composerEmojiButton=$('svcpComposerEmojiToggle');
const inlineEmojiField=$('svcpChatForm')?.querySelector('.svcp-chat-compose-field');
const inlineEmojiChoices=['👍','❤️','😂','🙏','✅'];
if(composerEmojiStrip&&inlineEmojiField)inlineEmojiField.appendChild(composerEmojiStrip);
function closeComposerEmoji(){
 if(composerEmojiStrip)composerEmojiStrip.hidden=true;
 $('svcpChatForm')?.classList.remove('svcp-emoji-inline-open');
 composerEmojiButton?.setAttribute('aria-expanded','false');
}
function insertComposerEmoji(emoji){
 const input=$('svcpChatInput');if(!input)return;
 const from=typeof input.selectionStart==='number'?input.selectionStart:input.value.length;
 const to=typeof input.selectionEnd==='number'?input.selectionEnd:from;
 const value=input.value.slice(0,from)+emoji+input.value.slice(to);
 if(input.maxLength>0&&value.length>input.maxLength)return;
 input.value=value;
 closeComposerEmoji();
 input.focus({preventScroll:true});
 input.setSelectionRange(from+emoji.length,from+emoji.length);
 input.dispatchEvent(new Event('input',{bubbles:true}));
}
function renderComposerEmojis(){
 if(!composerEmojiStrip)return;
 composerEmojiStrip.replaceChildren();
 for(const emoji of inlineEmojiChoices){
  const option=el('button','svcp-composer-emoji-choice',emoji);
  option.type='button';
  option.setAttribute('aria-label','Вставить '+emoji);
  option.addEventListener('click',()=>insertComposerEmoji(emoji));
  composerEmojiStrip.appendChild(option);
 }
}
composerEmojiButton?.addEventListener('click',event=>{
 event.preventDefault();
 const form=$('svcpChatForm');
 if(!form||!composerEmojiStrip)return;
 const opening=!form.classList.contains('svcp-emoji-inline-open');
 closeRecognition();closeMessageMenus();
 closeComposerEmoji();
 if(!opening)return;
 // Emoji works in BOTH composer sizes. The expanded mode places the five
 // choices on its lower action row without covering the typed draft.
 renderComposerEmojis();
 form.classList.add('svcp-emoji-inline-open');
 composerEmojiStrip.hidden=false;
 composerEmojiButton.setAttribute('aria-expanded','true');
});
document.addEventListener('pointerdown',event=>{
 const form=$('svcpChatForm');
 if(!form?.classList.contains('svcp-emoji-inline-open'))return;
 if(composerEmojiStrip?.contains(event.target)||composerEmojiButton?.contains(event.target))return;
 closeComposerEmoji();
});
function toggleMessageMenu(menu,trigger){
 const opening=menu.hidden;
 closeRecognition();
 closeMessageMenus();
 if(!opening)return;
 menu.hidden=false;
 trigger.setAttribute('aria-expanded','true');
 // Keep the compact action rail inside the iPhone viewport even for edge bubbles.
 menu.style.transform='';
 const bounds=menu.getBoundingClientRect();
 const margin=8,viewportWidth=document.documentElement.clientWidth;
 const dx=bounds.left<margin?margin-bounds.left:bounds.right>viewportWidth-margin
  ?viewportWidth-margin-bounds.right:0;
 if(dx)menu.style.transform='translateX('+Math.round(dx)+'px)';
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
 const room=roomDetails();
 if(state.viewpoint!=='manager'||room.kind!=='personal'||!room.person||!STAFF[room.person])return;
 // A dedicated gold recognition, never a bookmark or an emoji reaction.
 applyPersonReaction(room.person,'help');
});
$('svcpReactionCancel')?.addEventListener('click',closeRecognition);
// A reaction picker belongs to the message: dismiss it on any outside tap.
document.addEventListener('pointerdown',event=>{
 const picker=$('svcpReactionPicker');
 if(!picker||picker.hidden)return;
 if(picker.contains(event.target)||event.target.closest?.('#svcpRecognizeOpen'))return;
 closeRecognition();
});
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape')return;
 closeMessageMenus();
 closeRecognition();
 setCameraTray(false);
});
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
/* An opt-in, evidence-based LOCAL demo prompt. A quick "готово" alone
 * is never sufficient for a workplace award. No personnel scoring. */
const RECOGNITION_SNOOZE_KEY='seyveo-recognition-suggestions-v1';
function recognitionSourceKey(msg){
 return String(msg.room||'')+':'+String(msg.at||'')+':'+String(msg.role||'');
}
function readRecognitionSnoozes(){
 try{
  const value=JSON.parse(localStorage.getItem(RECOGNITION_SNOOZE_KEY)||'{}');
  return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 }catch{return {}}
}
function suggestedRecognition(msg,person){
 if(!person||!STAFF[person]||msg.role!=='demo-elena'||person!=='elena'||msg.mediaId)return null;
 const words=String(msg.text||'').toLocaleLowerCase('ru-RU').replace(/ё/g,'е');
 if(words.length<18)return null;
 const initiative=/(?:сама|самостоятельно|по своей инициативе|заметила|обнаружила|предложила)/u.test(words);
 const outcome=/(?:исправила|устранила|решила|проверила|помогла|выручила|разобралась|подготовила|сделала|закончила|выполнила)/u.test(words);
 const work=/(?:ценник|товар|выкладк|остатк|касс|покупател|коллег|смен|проблем|ошибк|документ|заказ|отчет|поручени)/u.test(words);
 if(!(work&&outcome))return null;
 const context=state.chat.filter(x=>x.room===msg.room&&x.at<msg.at&&x.role!=='recognition').slice(-8);
 const request=context.some(x=>/(?:помоги|помочь|проверь|исправь|разберись|нужно|поручаю|проблем|ошибк|ценник|возврат)/iu.test(x.text||''));
 const colleague=/(?:помогла|выручила|коллег)/u.test(words);
 if(!initiative&&!request&&!colleague)return null;
 const reason=colleague?'Помощь коллегам':initiative?'Инициатива и результат':'Выполнение важной рабочей задачи';
 return {reason,person,sourceKey:recognitionSourceKey(msg),at:Number(msg.at)};
}
function pendingRecognitionSuggestions(){
 const dismissed=readRecognitionSnoozes(),awarded=read(RECOGNITION_KEY);
 const seen=new Set(),out=[];
 for(let i=state.chat.length-1;i>=0&&out.length<5;i--){
  const msg=state.chat[i];
  if(!msg||msg.role!=='demo-elena'||!Number.isFinite(Number(msg.at))||Date.now()-Number(msg.at)>7*86400000)continue;
  const suggestion=suggestedRecognition(msg,'elena');
  if(!suggestion||seen.has(suggestion.sourceKey))continue;
  seen.add(suggestion.sourceKey);
  if(dismissed[suggestion.sourceKey]||awarded.some(x=>x?.sourceKey===suggestion.sourceKey))continue;
  // Once a manager awards this colleague today, do not ask again today.
  const day=new Date().toISOString().slice(0,10);
  if(awarded.some(x=>x?.from==='manager-demo'&&x.to==='elena'&&x.kind==='help'&&String(x.at||'').slice(0,10)===day))continue;
  out.push({...suggestion,text:String(msg.text||'').slice(0,150)});
 }
 return out;
}
function notifyRecognitionSuggestions(){
 window.dispatchEvent(new Event('seyveo:recognition-suggestions-changed'));
}
function dismissRecognitionSuggestion(sourceKey){
 if(!sourceKey)return;
 try{
  const all=readRecognitionSnoozes();
  all[sourceKey]=Date.now();
  const rows=Object.entries(all).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,100);
  localStorage.setItem(RECOGNITION_SNOOZE_KEY,JSON.stringify(Object.fromEntries(rows)));
 }catch{setStatus('Не удалось сохранить отметку «Позже» на устройстве.')}
 notifyRecognitionSuggestions();
}
function awardRecognitionSuggestion(sourceKey){
 const proposal=pendingRecognitionSuggestions().find(x=>x.sourceKey===sourceKey);
 if(!proposal)return false;
 if(!window.confirm('⭐ Отметить '+STAFF[proposal.person]+' за «'+proposal.reason+'»? Награда попадёт в учебную карточку сотрудника.'))return false;
 return applyPersonReaction(proposal.person,'help',proposal.reason,proposal.sourceKey);
}
window.SEYVEO_RECOGNITION_COACH=Object.freeze({
 homeSuggestion(){
  if(state.viewpoint!=='manager'||employeePreviewActive())return null;
  const proposal=pendingRecognitionSuggestions()[0];
  return proposal?{kind:'recognition',sourceKey:proposal.sourceKey,
   title:'⭐ Есть повод поблагодарить коллегу',
   message:'Сэйви заметила возможную заслугу '+STAFF[proposal.person]+': '+proposal.reason.toLowerCase()+'. Проверьте поступок перед награждением.',
   why:'Предложение по учебной переписке, решение принимает руководитель.',
   detail:proposal.text}:null;
 },
 award:awardRecognitionSuggestion,
 later:dismissRecognitionSuggestion,
 pending:pendingRecognitionSuggestions
});
function applyPersonReaction(person,kind,reason,sourceKey=''){
 const reward=RECOGNITION_TYPES[kind];
 if(!STAFF[person]||!reward)return;
 const entries=read(RECOGNITION_KEY);
 const day=new Date().toISOString().slice(0,10);
 if(entries.some(x=>x&&x.from==='manager-demo'&&x.to===person&&x.kind===kind&&String(x.at||'').slice(0,10)===day)){
  setStatus('Такой знак уже поставлен сегодня. Можешь выбрать другую эмоцию.');
  return false;
 }
 const item={id:'reaction-'+Date.now().toString(36),from:'manager-demo',to:person,kind,
  reason:reason||'Быстрая благодарность в личном рабочем чате',at:new Date().toISOString(),demo:true,...(sourceKey?{sourceKey}:{})};
 if(!save(RECOGNITION_KEY,entries.concat(item).slice(-100)))return false;
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
 notifyRecognitionSuggestions();
 return true;
}
function applyMessageEmoji(index,emoji){
 const msg=state.chat[index];
 if(!emoji||!msg||typeof msg.text!=='string')return;
 const existing=msg.demoReaction===emoji?'':emoji;
 const updated=state.chat.map((item,i)=>i===index?{...item,demoReaction:existing}:item);
 if(!save(CHAT_KEY,updated))return;
 state.chat=updated;
 // Update only the affected bubble, preserving scroll, media playback and focus.
 const bubble=Array.from($('svcpMessages')?.querySelectorAll('.svcp-bubble[data-chat-index]')||[])
  .find(node=>Number(node.dataset.chatIndex)===index);
 if(bubble){
  bubble.querySelector('.svcp-bubble-reaction')?.remove();
  if(existing){
   const chip=btn(existing+' 1',()=>applyMessageEmoji(index,existing),'svcp-bubble-reaction');
   chip.setAttribute('aria-label','Убрать реакцию '+existing);
   const actions=bubble.querySelector('.svcp-message-inline-actions');
   if(actions)bubble.insertBefore(chip,actions);else bubble.append(chip);
  }
 }else renderChat();
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

// SEYVEO GUIDE: local, opt-in walkthrough. It does not operate a cash register.
function guideSteps(text){
 const t=String(text||'').toLocaleLowerCase('ru-RU');
 if(/касс|смен|z.?отч[её]т|эвотор|1с|выручк/u.test(t))
  return ['Уточни у коллеги модель кассы и название программы.','Проверь права доступа и наличие незавершённых продаж или возвратов.','Открой в кассовой программе раздел смены и следуй её штатным инструкциям. Не закрывай смену, если есть расхождения.','Проверь сформированный отчёт и сообщи коллеге результат. Подтверждай выполнение только после проверки.'];
 if(/ценник|выклад|товар|полк|штрих.?код/u.test(t))
  return ['Уточни товар и ожидаемый результат.','Сверь штрихкод, цену и название с разрешённой базой магазина.','Проверь выкладку или ценник и исправь только то, на что есть полномочия.','При необходимости прикрепи фото и сообщи коллеге результат.'];
 if(/документ|накладн|возврат|заказ/u.test(t))
  return ['Уточни номер документа или заказа и ожидаемое действие.','Проверь данные в рабочей системе и свои полномочия.','Выполни действие по утверждённой инструкции компании.','Проверь результат и ответь коллеге.'];
 return ['Прочитай просьбу и уточни, какой результат нужен.','Уточни рабочую программу и доступные действия.','Выполни задачу по инструкции компании; при сомнении спроси коллегу.','Проверь результат и сообщи об этом в чат.'];
}
function openGuide(bubble,msg){
 chatRoot.querySelectorAll('.svcp-guide-panel').forEach(node=>node.remove());
 const steps=guideSteps(msg.text);let step=0;
 const panel=el('section','svcp-guide-panel');
 panel.setAttribute('aria-label','SEYVEO GUIDE — помощь с рабочим заданием');
 const title=el('strong','svcp-guide-title','Сэйви поможет');
 const description=el('p','svcp-guide-description','Разберём задачу по шагам. Это подсказки, а не автоматическое выполнение.');
 const progress=el('small','svcp-guide-progress');
 const instruction=el('p','svcp-guide-instruction');
 const controls=el('div','svcp-guide-controls');
 const next=btn('Дальше',()=>{if(step<steps.length-1){step++;refresh()}else{panel.remove();setStatus('Проверь результат и ответь коллеге в чате.');}},'svcp-guide-next');
 const question=btn('Уточнить',()=>{
  const input=$('svcpChatInput');if(input){input.value='Подскажи, пожалуйста, ';input.focus({preventScroll:true});input.dispatchEvent(new Event('input',{bubbles:true}));}
 },'svcp-guide-question');
 const close=btn('×',()=>panel.remove(),'svcp-guide-close');
 close.setAttribute('aria-label','Закрыть помощь Сэйви');
 function refresh(){progress.textContent='Шаг '+(step+1)+' из '+steps.length;instruction.textContent=steps[step];next.textContent=step===steps.length-1?'Завершить':'Дальше';}
 controls.append(question,next);
 panel.append(title,close,description,progress,instruction,controls);
 bubble.append(panel);refresh();
 panel.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function isGuideRequest(msg){
 return msg.role!=='recognition'&&msg.role!=='sayvi'&&typeof msg.text==='string'
  && /помоги|помочь|нужно|пожалуйста|проверь|сделай|закрой|открой|распечатай|подготовь|исправь|посмотри|разберись|поручаю|задани|смену|отч[её]т/u.test(msg.text.toLocaleLowerCase('ru-RU'));
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
  thread.append(el('p','svcp-note','Здесь пока нет сообщений. Начните разговор.'));
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
   const isOwn=state.viewpoint==='elena'?msg.role==='demo-elena':msg.role==='self';
   const mentioned=state.viewpoint==='elena'&&roomDetails().kind==='groups'&&msg.text.toLocaleLowerCase('ru-RU').includes('@елена');
   // Short emoji-only messages use a compact bubble, not the 104px text minimum.
   // The time, bookmark, reply and assignment actions remain accessible.
   const emojiOnly=!msg.mediaId&&!msg.taskId&&!msg.replyTo&&!isRecognition&&
    !msg.demoReaction&&/^[\p{Extended_Pictographic}\uFE0F\u200D\u{1F3FB}-\u{1F3FF}]{1,14}$/u.test(String(msg.text||'').trim());
   const shortText=!msg.mediaId&&!msg.taskId&&!msg.replyTo&&!isRecognition&&!emojiOnly&&
    !msg.documentFlowId&&String(msg.text||'').trim().length>0&&
    String(msg.text||'').trim().length<=5&&!String(msg.text||'').includes('\n');
   const bubble=el('article','svcp-bubble '+(isRecognition?'is-recognition':isSayvi?'is-sayvi':isOwn?'is-self':'is-other')+(msg.taskId?' is-task':'')+(emojiOnly?' is-emoji-only':'')+(shortText?' is-short-text':'')+(mentioned?' is-mentioned':'')+(index===focusSearchIndex?' is-search-hit':''));
   bubble.dataset.chatIndex=String(index);
   bubble.setAttribute('aria-label',isSayvi?'Демонстрационная подсказка Сэйви':senderName(msg));
   const meta=el('div','svcp-bubble-meta');
   meta.append(el('strong','svcp-sender',senderName(msg)),el('time','svcp-time',formatTime(msg.at)));
 if(isOwn)meta.querySelector('.svcp-time').title='Сохранено в этом браузере · не подтверждение доставки';
   bubble.append(meta);
   if(msg.replyTo&&typeof msg.replyTo.text==='string'){
    // The single timestamp belongs at the message's bottom-right corner.
    const quote=el('div','svcp-quote');
    const heading=el('div','svcp-quote-heading');
    heading.append(el('strong','svcp-quote-sender',msg.replyTo.sender||'Сообщение'));
    quote.append(heading,el('span','svcp-quote-excerpt',msg.replyTo.text.slice(0,160)));
    bubble.append(quote);
    bubble.classList.add('svcp-has-quote-time');
   }
   if(msg.mediaPurpose!=='voice'){
    let taskText=msg.taskId?String(msg.text||'').replace(/^\s*📌\s*Поручение:\s*/u,''):msg.text;
    if(msg.mediaId&&msg.mediaPurpose!=='voice')
     taskText=String(taskText||'').replace(/(?:^|\n)\s*(?:📎\s*Вложение|🎬\s*Видео|📷\s*Фото (?:выкладки|ценника)|▥\s*Фото штрихкода)\s*$/gmu,'').trim();
    if(msg.taskId){
     const label=el('small','svcp-task-message-label','Поручение');
     // In direct messages the sender is already in the conversation header.
     // Place task type next to timestamp instead of using a third text row.
     if(roomDetails().kind==='personal'){
      meta.insertBefore(label,meta.querySelector('.svcp-time'));
      bubble.classList.add('svcp-task-inline-label');
     }else bubble.append(label);
    }
    if(taskText)bubble.append(el('span','svcp-message-text',taskText));
    // A file without a caption should be a single card, never a card inside
    // another painted message bubble. Keep quotes and tasks unchanged.
    if(msg.mediaId&&!msg.replyTo&&!msg.taskId&&!msg.documentFlowId&&!taskText){
     bubble.classList.add('svcp-file-only');
     if(['pdf','word','sheet','text','other'].includes(svcpFileKind(msg.mediaName,msg.mediaType).kind))
      bubble.classList.add('svcp-document-only');
    }
   }
   if(msg.documentFlowId&&window.SEYVEO_DOCUMENT_FLOW?.get?.(msg.documentFlowId)){
    const doc=window.SEYVEO_DOCUMENT_FLOW.get(msg.documentFlowId);
    const action=btn('▤ Открыть документ · демо',()=>{
     window.SEYVEO_SAYVI_SURFACES?.open?.('contract','business');
     // The document workspace mounts after the route change.
     window.setTimeout(()=>window.SEYVEO_DOCUMENT_CENTER?.openApprovals?.(msg.documentFlowId),70);
    },'svcp-document-flow-open');
    action.setAttribute('aria-label','Открыть учебный документ в согласованиях');
    bubble.append(action);
    const label={sent:'Ожидает ознакомления',read:'Просмотрено',approved:'Подтверждено',returned:'Возвращено',revoked:'Отозвано'}[doc.state];
    bubble.append(el('small','svcp-document-flow-state',label||'Учебный документ'));
   }
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
    if(state.viewpoint==='elena'&&!isOwn&&isGuideRequest(msg)){
     const helper=btn('Сэйви, помоги',()=>openGuide(bubble,msg),'svcp-guide-launch');
     helper.setAttribute('aria-label','Сэйви поможет выполнить это задание');
     bubble.append(helper);
    }
    // Sayvi recognition suggestions are a small contextual star UNDER
    // the relevant message, not a bulky prompt inside its bubble.
    // The manager must tap and confirm before any recognition is awarded.
    // One quiet row of actions is always available UNDER the message.
    // No ellipsis, dropdown or long-press-only controls.
    // Exactly three quick actions are visible. Other operations remain
    // available on long press, desktop right-click, or keyboard menu key.
    const menu=el('div','svcp-message-inline-actions');
    menu.setAttribute('role','group');
    menu.setAttribute('aria-label','Основные действия с сообщением');
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
      star:"<path d=\"M6 4.5h12v16l-6-4-6 4Z\"/>",award:"<path d=\"m12 2.8 2.85 5.77 6.37.93-4.61 4.5 1.09 6.35L12 17.35l-5.7 3 1.09-6.35-4.61-4.5 6.37-.93Z\"/>",copy:"<rect x=\"8\" y=\"8\" width=\"11\" height=\"12\" rx=\"2\"/><path d=\"M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2\"/>",
      edit:"<path d=\"M12.7 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-5.7\"/><path d=\"m10.2 15.5-3.1.7.7-3.1L17.2 3.7a2.2 2.2 0 0 1 3.1 3.1l-9.4 9.4-3.1.7\"/><path d=\"m16.3 4.6 3.1 3.1\"/>",delete:"<path d=\"M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6\"/>",
      task:"<rect x=\"4\" y=\"5\" width=\"16\" height=\"15\" rx=\"2\"/><path d=\"M8 10h8M8 14h5\"/><path d=\"M17 17v5m-2.5-2.5h5\"/>"
     };
     svg.innerHTML=parts[kind]||'';
     control.appendChild(svg);
     return control;
    }
    menu.append(svcpActionIcon('Ответить','reply',()=>{
     closeMessageMenus();startReply(msg);
    },'svcp-message-menu-item'));
    // Keep bookmark independent of staff-recognition awards.
    const starControl=svcpActionIcon(msg.starred?'Убрать из избранного':'В избранное','star',()=>{
     const updated=state.chat.map((item,i)=>i===index?{...item,starred:!item.starred}:item);
     if(!save(CHAT_KEY,updated))return;
     state.chat=updated;
     bubble.querySelector('.svcp-bubble-saved')?.remove();
     starControl.classList.toggle('is-saved',!!updated[index].starred);
     starControl.setAttribute('aria-label',updated[index].starred?'Убрать из избранного':'В избранное');
     starControl.title=starControl.getAttribute('aria-label');
     starControl.setAttribute('aria-pressed',String(!!updated[index].starred));
     closeMessageMenus();renderDirectory();
    },'svcp-message-menu-item');
    starControl.classList.toggle('is-saved',!!msg.starred);
    starControl.setAttribute('aria-pressed',String(!!msg.starred));
    menu.append(starControl);
    const canAssign=!msg.taskId&&(!isSayvi||typeof msg.suggestTask==='string'&&msg.suggestTask.trim())&&state.viewpoint!=='elena';
    if(canAssign){
     menu.append(svcpActionIcon('Поручить','task',()=>{
      closeMessageMenus();prepareTask(msg,index);
     },'svcp-message-menu-item'));
    }
    // Context-only actions. Edit and deletion permissions are preserved.
    const secondary=[];
    secondary.push({title:'Копировать',kind:'copy',run:async()=>{
     closeMessageMenus();
     try{await navigator.clipboard.writeText(msg.text);setStatus('Сообщение скопировано')}
     catch{setStatus('Не удалось скопировать. Выдели текст сообщения вручную.')}
    }});
    if(isOwn&&!msg.mediaId&&!msg.taskId&&Date.now()-Number(msg.at)>=0&&Date.now()-Number(msg.at)<=15*60*1000){
     secondary.push({title:'Редактировать',kind:'edit',run:()=>{
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
     }});
    }
    if(isOwn||state.viewpoint==='manager'){
     const moderating=!isOwn;
     secondary.push({title:moderating?'Убрать из локального чата':'Удалить у себя',kind:'delete',run:()=>{
      closeMessageMenus();
      if(!window.confirm(moderating
       ?'Убрать сообщение из локального рабочего чата на этом устройстве? У других участников оно не удалится.'
       :'Удалить это сообщение из локальной истории на этом устройстве?'))return;
      const updated=state.chat.filter((_,i)=>i!==index);
      if(!save(CHAT_KEY,updated))return;
      state.chat=updated;renderChat();renderDirectory();
      setStatus('Сообщение убрано только на этом устройстве.');
     }});
    }
    const recognitionProposal=state.viewpoint==='manager'&&!employeePreviewActive()&&msg.role==='demo-elena'
     ?pendingRecognitionSuggestions().find(x=>x.sourceKey===recognitionSourceKey(msg))
     :null;
    if(recognitionProposal){
     secondary.push({title:'Поощрить сотрудника',kind:'award',run:()=>{
      closeMessageMenus();
      if(awardRecognitionSuggestion(recognitionProposal.sourceKey))renderChat();
     }});
    }
    // Single standalone emoji: no visible action rail. The same actions stay
    // available through the long-press / right-click / keyboard context menu.
    if(emojiOnly||bubble.classList.contains('svcp-document-only')){
     secondary.unshift(
      {title:'Ответить',kind:'reply',run:()=>{closeMessageMenus();startReply(msg)}},
      {title:msg.starred?'Убрать из избранного':'В избранное',kind:'star',
       run:()=>starControl.click()}
     );
     if(canAssign)secondary.splice(2,0,
      {title:'Поручить',kind:'task',run:()=>{closeMessageMenus();prepareTask(msg,index)}});
    }
    const openContextActions=()=>{
     const screen=$('svcpWorkChatScreen');
     if(!screen||!bubble.isConnected||!secondary.length)return;
     closeMessageMenus();
     const panel=el('div','svcp-message-context-menu');
     panel.setAttribute('role','menu');
     panel.setAttribute('aria-label','Дополнительные действия');
     secondary.forEach(action=>{
      const item=svcpActionIcon(action.title,action.kind,action.run,'svcp-message-context-action');
      item.setAttribute('role','menuitem');
      item.append(el('span','svcp-context-action-label',action.title));
      panel.append(item);
     });
     screen.append(panel);
     const rect=bubble.getBoundingClientRect(),host=screen.getBoundingClientRect();
     const width=panel.offsetWidth,height=panel.offsetHeight;
     let left=isOwn?rect.right-host.left-width:rect.left-host.left;
     left=Math.max(10,Math.min(left,host.width-width-10));
     let top=rect.bottom-host.top+8;
     if(top+height>host.height-12)top=rect.top-host.top-height-8;
     top=Math.max(10,Math.min(top,host.height-height-10));
     panel.style.left=left+'px';
     panel.style.top=top+'px';
     panel.querySelector('[role="menuitem"]')?.focus({preventScroll:true});
    };
    // Tap opens the file; long press opens reply, bookmark and assign.
    bubble.addEventListener('svcp:document-context',openContextActions);
    // A bubble remains keyboard-discoverable, without another visible button.
    bubble.tabIndex=0;
    bubble.setAttribute('aria-keyshortcuts','Shift+F10');
    bubble.title='Удерживайте сообщение для дополнительных действий';
    bubble.addEventListener('keydown',event=>{
     if(event.target!==bubble)return;
     if(event.key==='ContextMenu'||(event.shiftKey&&event.key==='F10')||
        event.key==='Enter'||event.key===' '){
      event.preventDefault();openContextActions();
     }
    });
    const eligibleTarget=target=>!target.closest?.(
     'button,audio,video,a,input,textarea,.svcp-media-slot,.svcp-message-inline-actions'
    );
    let pressStartX=0,pressStartY=0,swipeEligible=false,pressTimer=null,didOpenContext=false;
    const clearPressTimer=()=>{if(pressTimer!==null){clearTimeout(pressTimer);pressTimer=null}};
    bubble.addEventListener('pointerdown',event=>{
     clearPressTimer();didOpenContext=false;swipeEligible=false;
     if(event.button!==0||!eligibleTarget(event.target))return;
     pressStartX=event.clientX;pressStartY=event.clientY;
     swipeEligible=event.pointerType==='touch'||event.pointerType==='pen';
     if(swipeEligible){
      pressTimer=setTimeout(()=>{
       pressTimer=null;
       if(!bubble.isConnected)return;
       didOpenContext=true;swipeEligible=false;
       openContextActions();
       if(navigator.vibrate)navigator.vibrate(8);
      },460);
     }
    });
    bubble.addEventListener('pointermove',event=>{
     if(pressTimer!==null&&(Math.abs(event.clientX-pressStartX)>12||
       Math.abs(event.clientY-pressStartY)>12))clearPressTimer();
    });
    bubble.addEventListener('pointerup',event=>{
     clearPressTimer();
     if(didOpenContext){didOpenContext=false;swipeEligible=false;return}
     const dx=event.clientX-pressStartX,dy=event.clientY-pressStartY;
     if(swipeEligible&&dx>65&&Math.abs(dy)<45){
      startReply(msg);if(navigator.vibrate)navigator.vibrate(8);
     }
     swipeEligible=false;
    });
    bubble.addEventListener('pointercancel',()=>{clearPressTimer();swipeEligible=false});
    bubble.addEventListener('pointerleave',()=>{clearPressTimer();swipeEligible=false});
    bubble.addEventListener('contextmenu',event=>{
     if(!eligibleTarget(event.target))return;
     event.preventDefault();
     if(!$('svcpWorkChatScreen')?.querySelector('.svcp-message-context-menu'))openContextActions();
    });
    // Do not mount or reserve layout space for the three-action row on emojis.
    if(!emojiOnly){
     bubble.classList.add('svcp-has-inline-actions');
     bubble.append(menu);
    }
   }
   // Every message gets one clock in its bottom corner. File cards and
   // sticker-like emoji already have a dedicated overlay and keep it.
   const fileType=String(msg.mediaType||'').toLowerCase();
   const usesFileCard=!!msg.mediaId&&msg.mediaPurpose!=='voice'&&
    !fileType.startsWith('image/')&&!fileType.startsWith('video/')&&!fileType.startsWith('audio/');
   if(!emojiOnly&&!usesFileCard){
    const clock=meta.querySelector('.svcp-time');
    if(clock){
     const stamp=el('span','svcp-message-stamp');
     stamp.setAttribute('aria-label','Время сообщения: '+clock.textContent);
     stamp.append(clock);
     if(isOwn){
      const saved=el('span','svcp-message-local-check','✓');
      saved.title='Сохранено на устройстве · не подтверждение доставки';
      saved.setAttribute('aria-hidden','true');stamp.append(saved);
     }
     bubble.append(stamp);
     bubble.classList.add('svcp-bottom-stamp');
    }
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
 $('svcpReplyText').textContent='Ответ · '+state.replyTo.sender+' · '+state.replyTo.text;
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
function svcpShowDraftAttachment(){
 const host=$('svcpTaskAttachment');if(!host)return;
 host.replaceChildren();
 const source=state.draftSource;
 if(!source?.attachmentMediaId){host.hidden=true;return}
 host.hidden=false;
 const card=svcpFileCard(source.attachmentName||'Вложение',source.attachmentType||'');
 card.classList.add('svcp-task-file-card');
 const remove=btn('×',()=>{
  if(!state.draftSource)return;
  delete state.draftSource.attachmentMediaId;
  delete state.draftSource.attachmentName;
  delete state.draftSource.attachmentType;
  svcpShowDraftAttachment();
 },'svcp-task-file-remove');
 remove.setAttribute('aria-label','Убрать вложение из поручения');
 card.append(remove);
 host.append(card);
 if(!source.attachmentName||source.attachmentName==='Вложение'){
  const wanted=source.attachmentMediaId;
  loadMediaLocally(wanted).then(record=>{
   if(!record?.name||state.draftSource?.attachmentMediaId!==wanted)return;
   state.draftSource.attachmentName=record.name;
   state.draftSource.attachmentType=record.type||'';
   svcpShowDraftAttachment();
  }).catch(()=>{});
 }
}
function prepareTask(msg,index=null){
 const proposed=typeof msg.suggestTask==='string'&&msg.suggestTask.trim()?msg.suggestTask:msg.text;
 const hasFile=!!msg.mediaId&&msg.mediaPurpose!=='voice';
 const clean=String(proposed||'')
  .replace(/@(?:сэйви|сэй|seyveo|sayvi)(?=\s|[,:.!?]|$)\s*[,—:-]?\s*/gi,'')
  .replace(/\[Выбран файл:[\s\S]*$/,'')
  .replace(/(?:^|\n)\s*(?:📎\s*Вложение|🎬\s*Видео|📷\s*Фото (?:выкладки|ценника)|▥\s*Фото штрихкода)\s*$/gmu,'')
  .trim().slice(0,140);
 if(!clean&&!hasFile){setStatus('В этом сообщении нет текста для поручения.');return}
 const room=ROOMS.find(x=>x.id===msg.room);
 state.draftSource={room:msg.room,assigneeId:room?.person&&room.person!=='sayvi'?room.person:'',
  ...(Number.isInteger(index)?{messageIndex:index}:{}),
  ...(hasFile?{attachmentMediaId:msg.mediaId,attachmentName:msg.mediaName||'Вложение',attachmentType:msg.mediaType||''}:{})};
 setTaskRecipient(state.draftSource.assigneeId);
 closeTaskRecipientPicker();
 const title=$('svcpChatTaskTitle');
 title.value=clean;
 title.placeholder=hasFile?'Что нужно сделать с файлом?':'Что нужно сделать?';
 svcpShowDraftAttachment();
 $('svcpChatTaskDraft').hidden=false;
 document.activeElement?.blur?.();
}
function setTaskRecipient(id){
 const select=$('svcpChatTaskAssignee');
 if(!select)return;
 select.value=id||'';
 const option=select.options[select.selectedIndex];
 $('svcpRecipientValue').textContent=option?.textContent||'Выберите получателя';
 $('svcpRecipientChoices')?.querySelectorAll('[data-recipient-id]').forEach(button=>{
  const selected=button.dataset.recipientId===select.value;
  button.setAttribute('aria-pressed',String(selected));
 });
}
function closeTaskRecipientPicker(){
 const choices=$('svcpRecipientChoices'),toggle=$('svcpRecipientToggle');
 if(choices)choices.hidden=true;
 toggle?.setAttribute('aria-expanded','false');
}
$('svcpRecipientToggle')?.addEventListener('click',()=>{
 const choices=$('svcpRecipientChoices');if(!choices)return;
 const open=choices.hidden;
 choices.hidden=!open;
 $('svcpRecipientToggle').setAttribute('aria-expanded',String(open));
});
$('svcpRecipientChoices')?.querySelectorAll('[data-recipient-id]').forEach(button=>
 button.addEventListener('click',()=>{
  setTaskRecipient(button.dataset.recipientId);
  closeTaskRecipientPicker();
  $('svcpRecipientToggle')?.focus({preventScroll:true});
 }));
document.addEventListener('pointerdown',event=>{
 if(!event.target.closest?.('.svcp-task-recipient-picker'))closeTaskRecipientPicker();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&$('svcpRecipientToggle')?.getAttribute('aria-expanded')==='true'){
  closeTaskRecipientPicker();
  $('svcpRecipientToggle')?.focus({preventScroll:true});
 }
});
function cancelTaskDraft(){
 state.draftSource=null;
 $('svcpChatTaskDraft').hidden=true;
 svcpShowDraftAttachment();
 closeTaskRecipientPicker();
}
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
  text:title,done:false,assigneeId,createdAt:Date.now(),
  ...(source?.attachmentMediaId?{
   attachmentMediaId:source.attachmentMediaId,
   attachmentName:String(source.attachmentName||'Вложение').slice(0,160),
   attachmentType:String(source.attachmentType||'').slice(0,120)
  }:{}),
  ...(source?.room==='business-mail'?{mailHistory:[{event:'assigned',at:Date.now()}]}:{}),
  ...(source?.approvalFlow?{approvalFlow:true,reviewStatus:'assigned'}:{}),
  ...(source?.room?{source:source.room==='business-mail'?'business-mail':'chat',room:source.room}:{}),
  ...(source?.mailDraftId?{mailDraftId:source.mailDraftId}:{})
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
// Local demo bridge: uses the same manager task store and UI as chat assignments.
window.SEYVEO_BUSINESS_TASK_DEMO=Object.freeze({
 openTask(id){const i=state.tasks.findIndex(t=>t.id===id);if(i<0)return false;window.SEYVEO_UNIFIED_TASKS?.openBusiness?.();requestAnimationFrame(()=>focusTask(i));return true;},
 assignFromMail({text,assigneeId,mailDraftId}={}){
  if(typeof text!=='string'||!text.trim()||text.length>140)return {ok:false,reason:'Поручение должно содержать не более 140 символов'};
  const created=storeTask(text,{assigneeId,approvalFlow:true,room:'business-mail',mailDraftId});
  return created?{ok:true,id:created[0].id,ids:created.map(t=>t.id),localOnly:true}:{ok:false,reason:'Поручение не создано'};
 }
});
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
 const created=storeTask(title,source);
 if(!created)return;
 if(Number.isInteger(source.messageIndex)){
  const message=state.chat[source.messageIndex];
  if(message&&!message.taskId&&message.room===source.room){
   const updated=state.chat.map((item,i)=>i===source.messageIndex?{...item,taskId:created[0].id}:item);
   if(save(CHAT_KEY,updated)){state.chat=updated;renderChat()}
  }
 }
 if(!Number.isInteger(source.messageIndex)&&$('svcpChatInput')?.value.trim()===String(title).trim()){
  $('svcpChatInput').value='';
  syncComposerActions();resizeWorkComposer();
 }
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
/* Keep Sayvi reachable in the actual conversation header, without a second
 * full-height row taking space away from messages. Moving the existing button
 * retains its original click handler and accessible label. */
{
 const sayviButton=$('svcpCallSayvi');
 const header=$('svcpConversation')?.querySelector('.svcp-conversation-bar');
 const info=$('svcpRoomInfoToggle');
 if(sayviButton&&header&&info){
  header.insertBefore(sayviButton,info);
  // Reuse the approved etched Sayvi mark instead of the legacy decorative span.
  // Keep the existing button, label, and mention handler untouched.
  sayviButton.innerHTML='<svg class="svcp-header-sayvi-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.5C13.65 2.5 14.25 7 16.4 8.6 18 10.05 21.5 10.4 21.5 12S18 13.95 16.4 15.4C14.25 17 13.65 21.5 12 21.5S9.75 17 7.6 15.4C6 13.95 2.5 13.6 2.5 12S6 10.05 7.6 8.6C9.75 7 10.35 2.5 12 2.5Z"/><circle cx="12" cy="12" r="1.7"/></svg>';
 }
}
/* Camera is a single entry point, with user-initiated system capture on mobile. */
const fileInput=$('svcpFile');
const cameraInputs={photo:$('svcpCameraPhoto'),file:fileInput};
const cameraTray=$('svcpCameraTray'),cameraToggle=$('svcpCameraToggle');
const cameraPurposeNames={photo:'Фото',file:'Вложение'};
let cameraBusy=false;
function setCameraTray(open){
 if(!cameraTray||!cameraToggle)return;
 if(open)closeComposerEmoji();
 else{
  closeComposerEmoji();
 }
 cameraTray.hidden=!open;cameraToggle.setAttribute('aria-expanded',String(open));
 $('svcpAttachFile')?.setAttribute('aria-expanded',String(open));
}
cameraToggle?.addEventListener('click',()=>{
 setCameraTray(false);
 const picker=$('svcpCameraPhoto');if(!picker)return;
 picker.value='';picker.click();
});
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
 if(state.file&&!state.file.type.startsWith('image/')&&!state.file.type.startsWith('video/'))
  display.append(svcpFileBadge(state.file.name,state.file.type));
 const info=el('div','svcp-selected-info');
 if(state.file){
  info.append(el('strong',null,state.file.name));
  info.append(el('small',null,svcpFileKind(state.file.name,state.file.type).label+' · Только на этом устройстве'));
 }else if(state.scanCode){
  info.append(el('strong',null,'Штрихкод'));
  info.append(el('small','svcp-scanned-code',state.scanCode+' · каталог не проверен'));
 }
 display.append(info);
 const remove=btn('',()=>{cleanupPreview();setStatus('Вложение убрано.')},'svcp-ghost svcp-selected-remove');
 remove.setAttribute('aria-label','Убрать вложение');
 remove.title='Убрать вложение';
 remove.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12M10 10v6M14 10v6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 display.append(remove);
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
 setCameraTray(false);
}
// One camera action; the image type will be inferred when vision is connected.
$('svcpCameraPhoto')?.addEventListener('change',()=>{
 const file=$('svcpCameraPhoto').files?.[0];
 if(file)pickCaptureFile(file,'photo');
});
$('svcpFile')?.addEventListener('change',()=>{
 const file=$('svcpFile').files?.[0];
 if(file)pickCaptureFile(file,'file');
});
function btn(text,action,cls){
 const button=el('button',cls,text);button.type='button';button.addEventListener('click',action);return button;
}
$('svcpChatForm')?.addEventListener('submit',async event=>{
 event.preventDefault();
 if(cameraBusy)return;
 const input=$('svcpChatInput'),txt=input?.value.trim()||'';
 if(editingMessageIndex!==null){
  const index=editingMessageIndex,msg=state.chat[index];
  if(!msg||msg.room!==state.room||!txt||Date.now()-Number(msg.at)>15*60*1000){setStatus('Напиши новый текст или выйди из редактирования.');return}
  const updated=state.chat.map((item,i)=>i===index?{...item,text:txt,editedAt:Date.now()}:item);
  if(!save(CHAT_KEY,updated))return;
  state.chat=updated;editingMessageIndex=null;input.value='';
  clearReply();syncComposerActions();resizeWorkComposer();
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
   ...(mediaId?{mediaId,mediaType:type,mediaName:file.name,mediaPurpose:purpose}:{}),
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
  if(!commitChatMessages(messages))return;
  closeComposerEmoji();setCameraTray(false);
  input.value='';cleanupPreview();clearReply();cancelTaskDraft();syncComposerActions();resizeWorkComposer();
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
 // Only actual saved tasks are displayed in the manager workspace.
 // The action opens the existing working chat and its assignment composer.
 list.replaceChildren();
 const open=state.tasks.map((task,index)=>({task,index})).filter(x=>x.task&&typeof x.task.text==='string'&&!x.task.done);
 const done=state.tasks.map((task,index)=>({task,index})).filter(x=>x.task&&typeof x.task.text==='string'&&x.task.done);
 const create=el('button','svcp-manager-task-create');
 create.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg><span>Поручить</span>';
 create.type='button';
 create.setAttribute('aria-label','Создать поручение в рабочем чате');
 create.addEventListener('click',()=>{
  const openChat=window.SEYVEO_UNIFIED_TASKS?.openChat;
  if(typeof openChat==='function')openChat('tasks');
  else setStatus('Рабочий чат недоступен. Поручение не создано.');
 });
 const heading=el('div','svcp-task-section-head');
 const headingText=el('div','svcp-task-section-heading');
 headingText.append(el('strong',null,'Поручения'),el('small',null,open.length?'В работе · '+open.length:'Нет активных'));
 heading.append(headingText,create);
 list.append(heading);
 function taskRow(t,i){
  const row=el('div','svcp-task'+(t.done?' is-done':''));
  row.setAttribute('data-svcp-task-index',String(i));
  const approval=t.approvalFlow===true;
  let checkbox=null;
  if(!approval){
   checkbox=el('input');checkbox.type='checkbox';checkbox.checked=!!t.done;
   checkbox.setAttribute('aria-label',(t.done?'Вернуть в работу: ':'Завершить поручение: ')+t.text);
   checkbox.addEventListener('change',()=>{
    const updated=state.tasks.map((item,index)=>index===i?{...item,done:checkbox.checked}:item);
    if(!save(TASK_KEY,updated)){checkbox.checked=!checkbox.checked;return}
    state.tasks=updated;renderTasks();syncPreviewAfterTaskEdit();
   });
  }
  const copy=el('div','svcp-task-copy');
  copy.append(el('strong','svcp-task-title',t.text));
  if(t.source==='business-mail')copy.append(el('small','svcp-task-assignee','SEYVEO · BUSINESS MAIL · локальное демо'));
  // Legacy demo records remain stored, but assignees are chosen in chat.
  if(t.assigneeId&&Object.prototype.hasOwnProperty.call(STAFF,t.assigneeId))
   copy.append(el('small','svcp-task-assignee',STAFF[t.assigneeId]));
  if(t.attachmentMediaId){
   const fileButton=el('button','svcp-task-file-open');
   fileButton.type='button';
   fileButton.setAttribute('aria-label','Открыть локальное вложение: '+(t.attachmentName||'Вложение'));
   fileButton.append(svcpFileBadge(t.attachmentName,t.attachmentType));
   const text=el('span','svcp-task-file-name',t.attachmentName||'Вложение');
   fileButton.append(text);
   fileButton.addEventListener('click',async()=>{
    try{
     const record=await loadMediaLocally(t.attachmentMediaId);
     if(!record?.blob){setStatus('Файл не найден на этом устройстве.');return}
     const url=URL.createObjectURL(record.blob),link=el('a');
     link.href=url;link.download=record.name||t.attachmentName||'seyveo-file';
     document.body.append(link);link.click();link.remove();
     setTimeout(()=>URL.revokeObjectURL(url),30000);
    }catch{setStatus('Не удалось открыть вложение на этом устройстве.')}
   });
   copy.append(fileButton);
  }
  if(approval){
   const employee=STAFF[t.assigneeId]||'сотрудника';
   const statusNames={assigned:'Ожидает: '+employee,review:'Ожидает проверки',rework:'Возвращено на доработку',approved:'Принято руководителем'};
   const status=el('small','svcp-approval-demo-state',statusNames[t.reviewStatus]||'Ожидает Елену');
   copy.append(status);
   if(t.reportText)copy.append(el('p','svcp-approval-demo-report',(STAFF[t.assigneeId]||'Сотрудник')+': '+String(t.reportText).slice(0,350)));
   if(t.reviewStatus==='review'&&t.photoSelected){
    const image=window.SEYVEO_APPROVAL_DEMO_PHOTO?.get?.(t.id);
    if(image){
     const img=el('img','svcp-approval-demo-proof');img.src=image;img.alt='Фото результата Елены · локальный просмотр';
     copy.append(img);
    }else copy.append(el('small','svcp-approval-demo-note','Фото было выбрано, но не сохранилось после перезагрузки страницы.'));
   }
  }
  const actions=el('div','svcp-task-actions');
  const extra=el('div','svcp-task-extra');
  extra.hidden=!(approval&&t.reviewStatus==='review'&&!t.done);
  const assist=btn('Сэйви',()=>{
   const person=t.assigneeId&&Object.prototype.hasOwnProperty.call(STAFF,t.assigneeId)?STAFF[t.assigneeId]:'';
   const stateText=approval
    ?({assigned:'Ожидает выполнения',review:'Результат на проверке',rework:'На доработке',approved:'Принято'}[t.reviewStatus]||'Рабочее поручение')
    :'Рабочее поручение';
   const opened=window.SEYVEO_TASK_ASSIST?.open?.({
    title:t.text,kind:'work',assignee:person,
    note:stateText+(t.reportText?' · Отчёт: '+String(t.reportText).slice(0,180):'')
   });
   if(!opened)setStatus('Не удалось открыть Сэйви. Поручение осталось без изменений.');
  },'svcp-task-sayvi');
  assist.setAttribute('aria-label','Обсудить с Сэйви поручение: '+t.text);
  const more=btn('⋯',()=>{
   extra.hidden=!extra.hidden;
   more.setAttribute('aria-expanded',String(!extra.hidden));
  },'svcp-task-more');
  more.setAttribute('aria-label','Дополнительные действия с поручением: '+t.text);
  more.setAttribute('aria-expanded',String(!extra.hidden));
  actions.append(assist,more);
  if(approval&&t.reviewStatus==='review'&&!t.done){
   const resolve=(accepted)=>{
    if(employeePreviewActive())return;
    // The manager is the ONLY demo perspective permitted to approve.
    const updated=state.tasks.map((item,j)=>j===i?{
     ...item,reviewStatus:accepted?'approved':'rework',done:accepted,
     reviewedAt:Date.now(),
     ...(item.mailHistory?{mailHistory:[...item.mailHistory,{event:accepted?'approved':'rework',at:Date.now(),actor:'manager'}]}:{})
    }:item);
    if(!save(TASK_KEY,updated))return;
    state.tasks=updated;renderTasks();
   };
   extra.append(btn('Принять',()=>resolve(true),'svcp-approval-demo-accept'));
   extra.append(btn('Доработать',()=>resolve(false),'svcp-approval-demo-switch'));
  }
  extra.append(btn('Обсудить',()=>openTaskDiscussion(t),'svcp-task-discuss'));
  extra.append(btn('Удалить',()=>{
   const updated=state.tasks.filter((_,index)=>index!==i);
   if(!save(TASK_KEY,updated))return;
   state.tasks=updated;renderTasks();syncPreviewAfterTaskEdit();
  },'svcp-ghost'));
  if(checkbox)row.append(checkbox);
  row.append(copy,actions,extra);
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
 // The header already states the empty condition; do not repeat it below.
 if(activeBox.childElementCount)list.append(activeBox);
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
 resetChatForRoleChange:()=>{
  // The mode picker has already updated SEYVEO_PREVIEW when called.
  lastChatAccount=null;
  syncChatAccount();
  showInbox();
 },
 showChat:(roomId=null,viewpoint='manager')=>{
  chatsFromTasks=true;
  if(roomId&&ROOMS.some(x=>x.id===roomId)){
   if(employeePreviewActive()&&!employeeAllowedRoom(roomId)){showInbox();return}
   openRoom(roomId);
   if(employeePreviewActive()&&roomId==='dm-elena'){
    state.viewpoint='elena';updatePerspective();renderChat();
   }
  }else showInbox();
 },
 openPeopleView:peopleView,
 // Home replies use the existing local chat store; not a network send.
 sendLocalText:(person,text)=>{
  const room='dm-'+String(person||'').toLowerCase();
  const message=String(text||'').trim();
  if(!ROOMS.some(item=>item.id===room&&item.person)||!message||message.length>1200)return false;
  if(!commitChatMessages([{room,text:message,at:Date.now(),role:'self'}]))return false;
  window.dispatchEvent(new Event('seyveo:work-chat-sent'));
  renderDirectory();
  if(state.room===room&&$('svcpConversation')&&!$('svcpConversation').hidden)renderChat();
  setStatus('Ответ сохранён в переписке на этом устройстве. Доставка другому человеку пока не подключена.');
  return true;
 },
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
window.addEventListener('seyveo:employee-task-updated',()=>{
 const incoming=read(TASK_KEY);
 let changed=false;
 const updated=incoming.map(task=>{
  const prior=state.tasks.find(t=>t.id===task.id);
  if(task.source!=='business-mail'||!prior||task.reviewStatus!=='review'||prior.reviewStatus==='review')return task;
  changed=true;
  return {...task,mailHistory:[...(task.mailHistory||[]),{event:'review',at:Date.now(),actor:task.assigneeId,report:String(task.reportText||'').slice(0,350),photoSelected:!!task.photoSelected}]};
 });
 if(changed)save(TASK_KEY,updated);
 state.tasks=changed?updated:incoming;
 renderTasks();
 syncPreviewAfterTaskEdit();
});
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
/* Messages: compact header search. The global dock search remains app-wide. */
(function installDirectorySearch(){
 const screen=$('svcpWorkChatScreen');
 const trailing=screen?.querySelector('.svcp-work-chat-trailing');
 const field=$('svcpHistorySearch');
 if(!screen||!trailing||!field||trailing.querySelector('.svcp-directory-search-toggle'))return;
 trailing.removeAttribute('aria-hidden');
 const toggle=document.createElement('button');
 toggle.type='button';
 toggle.className='svcp-directory-search-toggle';
 toggle.setAttribute('aria-label','Поиск в сообщениях');
 toggle.setAttribute('aria-controls','svcpHistorySearch');
 toggle.setAttribute('aria-expanded','false');
 toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.4"/><path d="m16 16 5 5"/></svg>';
 trailing.append(toggle);
 function setOpen(open){
  screen.classList.toggle('svcp-directory-search-open',open);
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Закрыть поиск в сообщениях':'Поиск в сообщениях');
  if(open){field.focus({preventScroll:true});}
  else if(field.value){field.value='';field.dispatchEvent(new Event('input',{bubbles:true}));}
 }
 toggle.addEventListener('click',()=>setOpen(!screen.classList.contains('svcp-directory-search-open')));
 field.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   event.preventDefault();setOpen(false);toggle.focus({preventScroll:true});
  }
 });
})();
})();
