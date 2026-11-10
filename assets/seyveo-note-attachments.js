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
 let dbPromise=null,editGeneration=0,readGeneration=0;
 let editUrls=[],readUrls=[];
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
 async function addAttachment(noteId,file){
  const db=await openDatabase();
  const entry={
   id:String(Date.now())+'-'+Math.random().toString(36).slice(2),
   noteId,
   name:String(file.name||'Вложение').slice(0,180),
   type:String(file.type||'application/octet-stream').slice(0,110),
   size:file.size,
   createdAt:Date.now(),
   blob:file.slice(0,file.size,file.type)
  };
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite');
   tx.oncomplete=()=>resolve(entry);
   tx.onerror=()=>reject(tx.error||new Error('Write failed'));
   tx.onabort=()=>reject(tx.error||new Error('Write aborted'));
   tx.objectStore(STORE).put(entry);
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
  if(message&&/^(Вложение сохранено|Сохранено вложений|Вложение удалено)/.test(message)){
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
 function fileCard(item,canRemove,urls){
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
  if(canRemove){
   const remove=document.createElement('button');remove.type='button';
   remove.className='sv-note-file-remove';
   remove.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 7h15M9 7V4.5h6V7m3 0-.8 13H6.8L6 7M10 11v5m4-5v5"/></svg>';
   remove.title='Удалить вложение';
   remove.setAttribute('aria-label','Удалить вложение '+item.name);
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
    await addAttachment(noteId,file);
    inserted++;
   }
   const after=await attachmentsFor(noteId);
   setCount(noteId,after.length);
   await refreshEditor();
   tell(inserted===1?'Вложение сохранено на устройстве.':'Сохранено вложений: '+inserted+'.');
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
  choose(kind){
   if(!editor.open)return false;
   const input=kind==='photo'?photoInput:kind==='camera'?cameraInput:kind==='file'?fileInput:null;
   if(!input)return false;
   input.click();
   return true;
  }
 });
})();