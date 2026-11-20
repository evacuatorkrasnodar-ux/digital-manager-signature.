/* SEYVEO Notebook · offline attachments (IndexedDB).
   Binary files are NEVER stored in localStorage or sent to a service. */
(function(){
 'use strict';
 const editor=document.getElementById('noteReviewDialog');
 const reader=document.getElementById('noteReadDialog');
 const editForm=document.getElementById('noteReviewForm');
 const editBottom=editor?.querySelector('.sv-note-bottom');
 if(!editor||!reader||!editForm||!editBottom)return;
 const DB_NAME='seyveo-notebook-files-v1',STORE='attachments';
 const MAX_FILE=10*1024*1024,MAX_PER_NOTE=12;
 const AUDIO_TYPES=Object.freeze({
  'audio/mp4':'audio/mp4','audio/m4a':'audio/mp4','audio/x-m4a':'audio/mp4',
  'audio/mpeg':'audio/mpeg','audio/mp3':'audio/mpeg','audio/x-mp3':'audio/mpeg',
  'audio/wav':'audio/wav','audio/x-wav':'audio/wav','audio/wave':'audio/wav',
  'audio/webm':'audio/webm','audio/ogg':'audio/ogg','audio/opus':'audio/ogg'
 });
 const AUDIO_EXTENSIONS=Object.freeze({
  m4a:'audio/mp4',mp3:'audio/mpeg',wav:'audio/wav',webm:'audio/webm',
  ogg:'audio/ogg',opus:'audio/ogg'
 });
 function audioTypeFor(file){
  const type=String(file?.type||'').split(';')[0].trim().toLowerCase();
  if(AUDIO_TYPES[type])return AUDIO_TYPES[type];
  if(type&&!['application/octet-stream','application/x-unknown'].includes(type)&&!type.startsWith('audio/'))return null;
  const extension=String(file?.name||'').split('.').pop().toLowerCase();
  return AUDIO_EXTENSIONS[extension]||null;
 }
 let dbPromise=null,editGeneration=0,readGeneration=0;
 let editUrls=[],readUrls=[];
 const playingAudio=new Set();
 const byId=id=>document.getElementById(id);
 function openDatabase(){
  if(!('indexedDB' in window))return Promise.reject(new Error('IndexedDB unavailable'));
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
   const request=indexedDB.open(DB_NAME,1);
   request.onupgradeneeded=()=>{
    const db=request.result;
    if(!db.objectStoreNames.contains(STORE)){
     const store=db.createObjectStore(STORE,{keyPath:'id'});
     store.createIndex('noteId','noteId',{unique:false});
    }
   };
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||new Error('Cannot open storage'));
   request.onblocked=()=>reject(new Error('Storage is busy'));
  });
  return dbPromise;
 }
 async function attachmentsFor(noteId){
  if(!noteId)return[];
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readonly');
   const request=tx.objectStore(STORE).index('noteId').getAll(noteId);
   request.onsuccess=()=>resolve((request.result||[]).sort((a,b)=>a.createdAt-b.createdAt));
   request.onerror=()=>reject(request.error||new Error('Read failed'));
  });
 }
 async function addAttachment(noteId,file,metadata={}){
  const db=await openDatabase();
  const contentType=String(metadata.mimeType||file.type||'application/octet-stream').slice(0,110);
  const entry={
   id:String(Date.now())+'-'+Math.random().toString(36).slice(2),
   noteId,
   name:String(file.name||'Вложение').slice(0,180),
   type:contentType,
   size:file.size,
   createdAt:Date.now(),
   fileLastModified:Number.isFinite(file.lastModified)&&file.lastModified>946684800000&&file.lastModified<Date.now()+86400000?file.lastModified:null,
   blob:file.slice(0,file.size,contentType),
   ...(metadata.kind==='voice'?{
    kind:'voice',durationMs:Math.max(0,Math.round(metadata.durationMs||0)),
    transcript:String(metadata.transcript||'').slice(0,16000),
    ...(metadata.imported===true?{imported:true}:{})
   }:{})
  };
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite');
   tx.oncomplete=()=>resolve(entry);
   tx.onerror=()=>reject(tx.error||new Error('Write failed'));
   tx.onabort=()=>reject(tx.error||new Error('Write aborted'));
   tx.objectStore(STORE).put(entry);
  });
 }
 async function updateTranscript(noteId,id,transcript){
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite');
   const store=tx.objectStore(STORE),request=store.get(id);
   request.onsuccess=()=>{
    const entry=request.result;
    if(!entry||entry.noteId!==noteId||!(entry.kind==='voice'||audioTypeFor(entry))){tx.abort();return;}
    store.put({...entry,transcript:String(transcript||'').slice(0,16000)});
   };
   tx.oncomplete=()=>resolve(true);
   tx.onabort=()=>reject(new Error('Audio attachment not found'));
   tx.onerror=()=>reject(tx.error||new Error('Transcription save failed'));
  });
 }
 async function removeAttachment(noteId,id){
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite');
   const store=tx.objectStore(STORE);
   const query=store.get(id);
   query.onsuccess=()=>{
    if(query.result?.noteId===noteId)store.delete(id);
   };
   tx.oncomplete=resolve;
   tx.onerror=()=>reject(tx.error||new Error('Delete failed'));
  });
 }
 async function deleteForNote(noteId){
  if(!noteId)return;
  try{
   const db=await openDatabase();
   await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    const cursor=tx.objectStore(STORE).index('noteId').openCursor(noteId);
    cursor.onsuccess=()=>{
     if(cursor.result){cursor.result.delete();cursor.result.continue();}
    };
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error||new Error('Delete failed'));
   });
  }catch(error){console.warn('SEYVEO: attachment cleanup failed',error);}
 }
 function setCount(noteId,count){
  const api=window.SEYVEO_NOTES_API;
  const notes=api?.getNotes?.();
  if(!Array.isArray(notes))return;
  const note=notes.find(n=>n.id===noteId);
  if(!note || (note.attachmentsCount||0)===count)return;
  api.putNotes(notes.map(n=>n.id===noteId?{...n,attachmentsCount:count,updatedAt:Date.now()}:n));
 }
 function previewableImage(type){
  // SVG and HTML must never be opened as active documents on this origin.
  return ['image/jpeg','image/png','image/webp','image/gif','image/avif','image/heic','image/heif'].includes(type);
 }
 function sizeLabel(size){
  if(size<1024)return size+' Б';
  if(size<1024*1024)return Math.max(1,Math.round(size/1024))+' КБ';
  return (size/1024/1024).toFixed(1).replace('.',',')+' МБ';
 }
 function clearUrls(which){
  for(const audio of playingAudio){audio.pause();playingAudio.delete(audio);}
  const urls=which==='edit'?editUrls:readUrls;
  urls.forEach(url=>URL.revokeObjectURL(url));
  urls.length=0;
 }
 let statusTimeout=null;
 function tell(message){
  if(statusTimeout!==null){clearTimeout(statusTimeout);statusTimeout=null;}
  const target=!editor.open&&reader.open?byId('svNoteReaderStatus'):byId('svNoteAttachmentStatus');
  if(!target)return;
  target.textContent=message;
  target.hidden=!message;
  if(message&&/^(Вложение сохранено|Сохранено вложений|Аудиофайл сохранён|Вложение удалено)/.test(message)){
   statusTimeout=setTimeout(()=>{target.hidden=true;target.textContent='';statusTimeout=null;},2600);
  }
 }
 const editorList=document.createElement('div');
 editorList.id='svNoteAttachments';
 editorList.className='sv-note-attachments';
 editorList.hidden=true;
 editorList.setAttribute('aria-label','Вложения заметки');
 editForm.insertBefore(editorList,editBottom);
 const editStatus=document.createElement('small');
 editStatus.id='svNoteAttachmentStatus';editStatus.className='sv-note-attachment-status';
 editStatus.setAttribute('role','status');editStatus.setAttribute('aria-live','polite');editStatus.hidden=true;
 editForm.insertBefore(editStatus,editBottom);
 const readerList=document.createElement('div');
 readerList.id='svNoteReaderAttachments';readerList.className='sv-note-attachments sv-note-reader-files';
 readerList.hidden=true;readerList.setAttribute('aria-label','Вложения заметки');
 byId('noteReadContent')?.after(readerList);
 const readStatus=document.createElement('small');
 readStatus.id='svNoteReaderStatus';readStatus.className='sv-note-attachment-status';
 readStatus.setAttribute('role','status');readStatus.hidden=true;
 readerList.after(readStatus);
 const fileInput=document.createElement('input');
 fileInput.type='file';fileInput.id='svNoteFileInput';
 fileInput.multiple=true;fileInput.hidden=true;
 fileInput.setAttribute('aria-label','Выбрать файлы для заметки');
 editForm.append(fileInput);
 const photoInput=byId('svNotePhotoInput'),cameraInput=byId('svNoteCameraInput');
 if(photoInput)photoInput.multiple=true;
 // The capture="environment" camera input stays single-photo.
 function fileAction(item){
  const url=URL.createObjectURL(item.blob);
  const link=document.createElement('a');
  link.href=url;link.rel='noopener';
  const preview=previewableImage(item.type)||item.type==='application/pdf';
  if(preview)link.target='_blank';
  else link.download=item.name||'Вложение';
  document.body.append(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 function durationLabel(milliseconds){
  const seconds=Math.max(0,Math.floor(milliseconds/1000));
  return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 }
 function audioDisplayName(item){
  const name=String(item?.name||'').trim();
  const stem=name.replace(/\.(?:m4a|mp3|wav|webm|ogg|opus)$/i,'').trim();
  const unnamed=!stem||/^[\d\s._-]{8,}$/.test(stem)||
   /^(?:audio|recording|voice|rec)[\s_-]*\d{6,}$/i.test(stem)||
   /^Голосовая запись(?:\s+\d{1,2}:\d{2})?$/i.test(stem);
  if(!unnamed)return name;
  const when=Number(item?.fileLastModified)||Number(item?.createdAt);
  const date=Number.isFinite(when)&&when>946684800000?new Date(when):new Date();
  const day=date.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
  const time=date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  return 'Запись · '+day+', '+time;
 }
 function appendRemove(card,item,canRemove){
  if(!canRemove)return;
  const remove=document.createElement('button');remove.type='button';
  const isAudio=card.classList.contains('sv-note-audio');
  remove.className='sv-note-file-remove'+(isAudio?' sv-note-audio-remove':'');
  remove.innerHTML=isAudio?
   '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/></svg>':
   '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 7h15M9 7V4.5h6V7m3 0-.8 13H6.8L6 7M10 11v5m4-5v5"/></svg>';
  remove.title=isAudio?'Убрать запись':'Удалить вложение';
  remove.setAttribute('aria-label',(isAudio?'Удалить аудиозапись ':'Удалить вложение ')+item.name);
  remove.addEventListener('click',async()=>{
   if(!window.confirm('Удалить вложение «'+item.name+'»?'))return;
   remove.disabled=true;
   try{
    await removeAttachment(item.noteId,item.id);
    const remaining=await attachmentsFor(item.noteId);
    setCount(item.noteId,remaining.length);
    await refreshEditor();
    tell('Вложение удалено.');
   }catch{tell('Не получилось удалить файл. Проверьте память устройства.');remove.disabled=false;}
  });
  card.append(remove);
 }
 function audioCard(item,canRemove,urls){
  const card=document.createElement('div');card.className='sv-note-file sv-note-audio';
  const url=URL.createObjectURL(item.blob);urls.push(url);
  const audio=new Audio(url);audio.preload='metadata';
  const play=document.createElement('button');play.type='button';play.className='sv-note-audio-play';
  const playIcon='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5.8v12.4l9.4-6.2Z" fill="currentColor" stroke="none"/></svg>';
  const pauseIcon='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 6v12M16 6v12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>';
  play.setAttribute('aria-label','Воспроизвести запись');play.innerHTML=playIcon;
  const detail=document.createElement('div');detail.className='sv-note-audio-detail';
  const title=document.createElement('strong');title.textContent=audioDisplayName(item);
  title.title=item.name||'';
  const waveform=document.createElement('div');waveform.className='sv-note-audio-wave';
  waveform.setAttribute('role','slider');waveform.tabIndex=0;
  waveform.setAttribute('aria-label','Перемотать голосовую запись');
  waveform.setAttribute('aria-valuemin','0');waveform.setAttribute('aria-valuemax','100');
  waveform.setAttribute('aria-valuenow','0');
  [5,9,13,8,15,18,11,21,14,17,10,22,16,20,13,23,17,26,17,23,13,20,16,22,10,17,14,21,11,18,15,8,13,9,5].forEach((height,index)=>{
   const bar=document.createElement('i');bar.style.height=height+'px';
   bar.style.setProperty('--sv-wave-duration',(0.58+(index*7%9)*.065)+'s');
   bar.style.setProperty('--sv-wave-delay',(-((index*11)%17)*.083)+'s');
   waveform.append(bar);
  });
  const time=document.createElement('small');time.textContent=durationLabel(item.durationMs||0);
  detail.append(title,waveform);card.append(play,detail,time);
  const duration=()=>Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:(item.durationMs||0)/1000;
  const seek=ratio=>{
   const total=duration();
   if(total>0)audio.currentTime=Math.max(0,Math.min(total,ratio*total));
  };
  const seekAt=event=>{
   const box=waveform.getBoundingClientRect();
   if(box.width>0)seek((event.clientX-box.left)/box.width);
  };
  waveform.addEventListener('click',seekAt);
  let scrubbing=false;
  waveform.addEventListener('pointerdown',event=>{
   if(event.pointerType==='mouse'&&event.button!==0)return;
   scrubbing=true;
   if(waveform.setPointerCapture)waveform.setPointerCapture(event.pointerId);
   seekAt(event);
  });
  waveform.addEventListener('pointermove',event=>{if(scrubbing)seekAt(event);});
  for(const kind of ['pointerup','pointercancel','lostpointercapture']){
   waveform.addEventListener(kind,()=>{scrubbing=false;});
  }
  waveform.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();
   const total=duration();
   if(event.key==='Home')seek(0);
   else if(event.key==='End')seek(1);
   else if(total>0)seek((audio.currentTime+(event.key==='ArrowRight'?1:-1))/total);
  });
  play.addEventListener('click',async()=>{
   if(!audio.paused){audio.pause();return;}
   for(const other of playingAudio)if(other!==audio)other.pause();
   try{await audio.play();}catch{tell('Не удалось воспроизвести запись.');}
  });
  const sync=()=>{
   const playing=!audio.paused&&!audio.ended;
   play.innerHTML=playing?pauseIcon:playIcon;
   play.setAttribute('aria-label',playing?'Пауза':'Воспроизвести запись');
   card.classList.toggle('sv-note-audio-playing',playing);
   if(playing)playingAudio.add(audio);else playingAudio.delete(audio);
   const total=Number.isFinite(audio.duration)?audio.duration*1000:item.durationMs||0;
   time.textContent=durationLabel(audio.currentTime*1000)+' / '+durationLabel(total);
   const percent=total>0?Math.max(0,Math.min(1,audio.currentTime*1000/total)):0;
   const heard=Math.round(percent*waveform.children.length);
   for(let i=0;i<waveform.children.length;i++)waveform.children[i].classList.toggle('sv-note-audio-heard',i<heard);
   waveform.setAttribute('aria-valuenow',String(Math.round(percent*100)));
   waveform.setAttribute('aria-valuetext',durationLabel(audio.currentTime*1000)+' из '+durationLabel(total));
  };
  for(const kind of ['play','pause','ended','timeupdate','loadedmetadata','seeked'])audio.addEventListener(kind,sync);
  if(canRemove){
   const toText=document.createElement('button');toText.type='button';
   toText.className='sv-note-audio-text';toText.textContent='Распознать';
   toText.title='Превратить голосовую запись в текст';
   toText.setAttribute('aria-label','Распознать речь в текст: '+item.name);
   toText.addEventListener('click',()=>window.SEYVEO_NOTE_VOICE?.transcribe(item));
   card.append(toText);
  }
  appendRemove(card,item,canRemove);
  return card;
 }
 function fileCard(item,canRemove,urls){
  const audioType=audioTypeFor(item);
  if(audioType){
   const playable=audioType===item.blob?.type&&audioType===item.type?item:
    {...item,type:audioType,blob:item.blob.slice(0,item.blob.size,audioType)};
   return audioCard(playable,canRemove,urls);
  }
  const card=document.createElement('div');card.className='sv-note-file';
  let icon;
  if(previewableImage(item.type)){
   icon=document.createElement('img');icon.alt='';
   const url=URL.createObjectURL(item.blob);
   urls.push(url);icon.src=url;icon.loading='lazy';
  }else{
   icon=document.createElement('span');icon.className='sv-note-file-symbol';
   icon.setAttribute('aria-hidden','true');
   icon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 3.5h8l4.5 4.5v12a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V5A1.5 1.5 0 0 1 6 3.5Z"/><path d="M14 3.5V8h4.5M8 12h8M8 16h6"/></svg>';
  }
  icon.classList.add('sv-note-file-icon');card.append(icon);
  const info=document.createElement('div');info.className='sv-note-file-info';
  const name=document.createElement('strong');name.textContent=item.name;
  const size=document.createElement('small');size.textContent=sizeLabel(item.size);
  info.append(name,size);card.append(info);
  const open=document.createElement('button');open.type='button';
  open.className='sv-note-file-action';
  const action=previewableImage(item.type)||item.type==='application/pdf'?'Открыть':'Скачать';
  open.setAttribute('aria-label',action+': '+item.name);
  open.title=action;
  open.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 5h5v5M19 5l-9 9"/><path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></svg>';
  open.addEventListener('click',()=>fileAction(item));card.append(open);
  appendRemove(card,item,canRemove);
  return card;
 }
 async function refreshEditor(){
  const token=++editGeneration;
  clearUrls('edit');editorList.replaceChildren();
  const noteId=editor.open?editor.dataset.noteId:'';
  editorList.hidden=true;
  if(!noteId)return;
  try{
   const attachments=await attachmentsFor(noteId);
   if(token!==editGeneration||!editor.open||editor.dataset.noteId!==noteId)return;
   for(const item of attachments)editorList.append(fileCard(item,true,editUrls));
   editorList.hidden=attachments.length===0;
  }catch{tell('Не удалось загрузить вложения на этом устройстве.');}
 }
 async function refreshReader(){
  const token=++readGeneration;
  clearUrls('read');readerList.replaceChildren();
  readerList.hidden=true;
  const noteId=reader.open?reader.dataset.noteId:'';
  if(!noteId)return;
  try{
   const attachments=await attachmentsFor(noteId);
   if(token!==readGeneration||!reader.open||reader.dataset.noteId!==noteId)return;
   attachments.forEach(item=>readerList.append(fileCard(item,false,readUrls)));
   readerList.hidden=attachments.length===0;
  }catch{
   readStatus.hidden=false;readStatus.textContent='Не удалось загрузить вложения.';
  }
 }
 async function processFiles(input){
  if(!editor.open)return;
  const files=Array.from(input.files||[]);
  input.value='';
  if(!files.length)return;
  const tooLarge=files.find(file=>file.size>MAX_FILE);
  if(tooLarge){tell('Файл «'+tooLarge.name+'» слишком большой. Максимум 10 МБ.');return;}
  try{await openDatabase()}catch{
   tell('Хранилище файлов недоступно. Проверьте настройки Safari и свободное место.');
   return;
  }
  if(!editor.open)return;
  let noteId=editor.dataset.noteId;
  if(!noteId){
   noteId=window.SEYVEO_NOTES_EDITOR?.ensureRecord?.();
   if(!noteId){tell('Не удалось сохранить заметку для вложения.');return;}
  }
  try{
   const before=await attachmentsFor(noteId);
   if(before.length+files.length>MAX_PER_NOTE){
    tell('В одной заметке можно хранить до '+MAX_PER_NOTE+' вложений.');return;
   }
   let inserted=0;
   for(const file of files){
    const audioType=audioTypeFor(file);
    await addAttachment(noteId,file,audioType?{
     kind:'voice',imported:true,durationMs:0,transcript:'',mimeType:audioType
    }:{});
    inserted++;
   }
   const after=await attachmentsFor(noteId);
   setCount(noteId,after.length);
   await refreshEditor();
   tell(inserted===1&&audioTypeFor(files[0])?'Аудиофайл сохранён. Нажми «В текст».':
    inserted===1?'Вложение сохранено на устройстве.':'Сохранено вложений: '+inserted+'.');
  }catch(error){
   console.warn('SEYVEO: attachment save failed',error);
   const after=await attachmentsFor(noteId).catch(()=>null);
   if(after)setCount(noteId,after.length);
   await refreshEditor();
   tell('Не удалось сохранить все вложения. Проверьте свободное место на устройстве.');
  }
 }
 [photoInput,cameraInput,fileInput].filter(Boolean).forEach(input=>{
  input.addEventListener('change',()=>{void processFiles(input);});
 });
 const observer=(dialog,refresh)=>{
  const watch=new MutationObserver(()=>{if(dialog.open)void refresh();});
  watch.observe(dialog,{attributes:true,attributeFilter:['open','data-note-id']});
  dialog.addEventListener('close',()=>{
   if(dialog===editor){++editGeneration;clearUrls('edit');editorList.replaceChildren();editorList.hidden=true;editStatus.hidden=true;}
   else{++readGeneration;clearUrls('read');readerList.replaceChildren();readerList.hidden=true;readStatus.hidden=true;}
  });
 };
 observer(editor,refreshEditor);
 observer(reader,refreshReader);
 window.SEYVEO_NOTE_ATTACHMENTS=Object.freeze({
  deleteForNote,
  refreshEditor,
  refreshReader,
  updateTranscript,
  async saveRecordedAudio(blob,durationMs,transcript=''){
   if(!editor.open)throw new Error('Заметка закрыта.');
   if(!blob?.size)throw new Error('Получилась пустая запись. Повтори ещё раз.');
   if(blob.size>MAX_FILE)throw new Error('Запись больше 10 МБ. Запиши более короткий фрагмент.');
   await openDatabase();
   const noteId=editor.dataset.noteId||window.SEYVEO_NOTES_EDITOR?.ensureRecord?.();
   if(!noteId)throw new Error('Не удалось создать запись заметки.');
   const before=await attachmentsFor(noteId);
   if(before.length>=MAX_PER_NOTE)throw new Error('В этой заметке уже 12 вложений.');
   const extension=blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':'webm';
   const name='Голосовая запись '+new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})+'.'+extension;
   const file=new File([blob],name,{type:blob.type||'audio/webm'});
   const entry=await addAttachment(noteId,file,{kind:'voice',durationMs,transcript});
   setCount(noteId,before.length+1);
   await refreshEditor();
   tell('Вложение сохранено на устройстве.');
   return entry;
  },
  choose(kind){
   if(!editor.open)return false;
   const input=kind==='photo'?photoInput:kind==='camera'?cameraInput:kind==='file'?fileInput:null;
   if(!input)return false;
   input.click();
   return true;
  }
 });
})();
