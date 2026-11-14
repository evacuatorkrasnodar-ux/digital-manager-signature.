/* SEYVEO · Camera and local attachments for the smart task editor.
 * Files stay on the user's device in IndexedDB. OCR runs in-browser only;
 * recognized text is a suggestion and is never silently saved as a task. */
(()=>{
 'use strict';
 const dialog=document.getElementById('personalTaskDialog');
 const button=document.getElementById('svNewTaskCameraButton');
 const menu=document.getElementById('svNewTaskCameraMenu');
 const take=document.getElementById('svNewTaskTakePhoto');
 const choose=document.getElementById('svNewTaskChooseFile');
 const capture=document.getElementById('svNewTaskCaptureInput');
 const picker=document.getElementById('svNewTaskFileInput');
 const preview=document.getElementById('svNewTaskAttachmentPreview');
 const title=document.getElementById('personalTaskTitle');
 const status=document.getElementById('personalTaskStatus');
 if(!dialog||!button||!menu||!capture||!picker||!preview||!title)return;
 const DB='seyveo-task-files-v1',STORE='files',LIMIT=10*1024*1024;
 const IMAGE=/^image\/(?:jpeg|png|webp|gif|heic|heif)$/i;
 const OTHER=/^(?:application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain)$/i;
 const EXT=/\.(?:jpe?g|png|webp|gif|heic|heif|pdf|docx?|txt)$/i;
 let pending=null,existing=null,removed=false,previewURL='',generation=0,ocrSuggestion='',ocrMessage='',ocrLoader=null;
 let dbPromise=null;
 function report(message){if(status)status.textContent=message}
 function setMenu(open){menu.hidden=!open;button.setAttribute('aria-expanded',String(open))}
 function database(){
  if(dbPromise)return dbPromise;
  if(!window.indexedDB)return Promise.reject(Error('Хранилище вложений недоступно'));
  dbPromise=new Promise((resolve,reject)=>{
   const request=indexedDB.open(DB,1);
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'taskId'})};
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||Error('Не удалось открыть хранилище'));
   request.onblocked=()=>reject(Error('Хранилище занято'));
  }).catch(error=>{dbPromise=null;throw error});
  return dbPromise;
 }
 async function get(taskId){
  const db=await database();
  return new Promise((resolve,reject)=>{
   const request=db.transaction(STORE,'readonly').objectStore(STORE).get(taskId);
   request.onsuccess=()=>resolve(request.result||null);
   request.onerror=()=>reject(request.error||Error('Не удалось прочитать вложение'));
  });
 }
 async function transact(taskIds,entry){
  if(!taskIds.length)return;
  const db=await database();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
   for(const taskId of taskIds){if(entry)store.put({...entry,taskId});else store.delete(taskId)}
   tx.oncomplete=()=>resolve();
   tx.onerror=()=>reject(tx.error||Error('Не удалось сохранить вложение'));
   tx.onabort=()=>reject(tx.error||Error('Запись вложения отменена'));
  });
 }
 function clearURL(){if(previewURL){URL.revokeObjectURL(previewURL);previewURL=''}}
 function formatSize(bytes){return bytes<1024*1024?Math.max(1,Math.round(bytes/1024))+' КБ':(bytes/1048576).toFixed(1).replace('.',',')+' МБ'}
 function icon(){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d','M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 16h5');svg.append(path);return svg;
 }
 function render(){
  preview.replaceChildren();
  const file=pending||(removed?null:existing?.blob);
  const meta=pending?{name:pending.name,size:pending.size,type:pending.type}:(removed?null:existing?.meta);
  preview.hidden=!meta;
  if(!meta)return;
  clearURL();
  const card=document.createElement('div');card.className='sv-task-attachment-card';
  const thumb=document.createElement('span');thumb.className='sv-task-attachment-thumb';
  if(file&&IMAGE.test(meta.type)){
   previewURL=URL.createObjectURL(file);
   const img=document.createElement('img');img.src=previewURL;img.alt='Миниатюра вложения';
   img.addEventListener('error',()=>{thumb.replaceChildren(icon())},{once:true});thumb.append(img);
  }else thumb.append(icon());
  const copy=document.createElement('span');copy.className='sv-task-attachment-copy';
  const name=document.createElement('strong');name.textContent=meta.name;
  const details=document.createElement('small');details.textContent=formatSize(meta.size)+(ocrMessage?' · '+ocrMessage:'');
  copy.append(name,details);
  const remove=document.createElement('button');remove.type='button';remove.className='sv-task-attachment-remove';
  remove.setAttribute('aria-label','Убрать вложение');remove.textContent='×';
  remove.addEventListener('click',()=>{generation++;pending=null;removed=true;ocrSuggestion='';ocrMessage='';render()});
  card.append(thumb,copy,remove);preview.append(card);
  if(ocrSuggestion){
   const suggestion=document.createElement('div');suggestion.className='sv-task-ocr-suggestion';
   const hint=document.createElement('p');hint.textContent='Сэйви прочитала: '+ocrSuggestion;
   const use=document.createElement('button');use.type='button';use.textContent='Добавить текст';
   use.addEventListener('click',()=>{
    title.value=[title.value.trim(),ocrSuggestion].filter(Boolean).join(' ').slice(0,140);
    title.dispatchEvent(new Event('input',{bubbles:true}));ocrSuggestion='';ocrMessage='Текст добавлен';render();
   });
   suggestion.append(hint,use);preview.append(suggestion);
  }
 }
 function reset(){
  generation++;pending=null;existing=null;removed=false;ocrSuggestion='';ocrMessage='';
  clearURL();preview.replaceChildren();preview.hidden=true;setMenu(false);
  capture.value='';picker.value='';
 }
 async function load(taskId,meta){
  reset();if(!taskId||!meta)return;
  const token=++generation;
  existing={taskId,meta,blob:null};render();
  try{const item=await get(taskId);if(token!==generation||!dialog.open)return;
   existing={taskId,meta,blob:item?.blob||null};render();
  }catch{if(token===generation)report('Файл этого дела пока недоступен на устройстве.')}
 }
 function getMeta(){
  if(pending)return {name:String(pending.name||'Вложение').slice(0,130),type:String(pending.type||'').slice(0,110),size:pending.size};
  if(removed)return null;
  return existing?.meta||null;
 }
 async function persist(taskIds){
  if(!pending)return;
  const blob=pending.slice(0,pending.size,pending.type);
  await transact(taskIds,{blob,name:pending.name,type:pending.type,size:pending.size,createdAt:Date.now()});
 }
 async function afterSave(taskIds){
  if(removed&&existing?.taskId)try{await transact([existing.taskId],null)}catch{}
 }
 async function removeFor(taskIds){try{await transact(taskIds,null)}catch{}}
 async function openFor(taskId){
  try{
   const item=await get(taskId);
   if(!item?.blob){report('Вложение на этом устройстве не найдено.');return false}
   const url=URL.createObjectURL(item.blob);
   const link=document.createElement('a');link.href=url;
   link.download=String(item.name||'Вложение').slice(0,130);
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   return true;
  }catch{return false}
 }
 function isAccepted(file){return Boolean(file&&(IMAGE.test(file.type)||OTHER.test(file.type)||EXT.test(file.name)))}
 async function selectFile(file){
  setMenu(false);
  if(!file)return;
  if(!isAccepted(file)){report('Выбери фотографию, PDF, Word или текстовый файл.');return}
  if(!file.size||file.size>LIMIT){report('Размер вложения должен быть не больше 10 МБ.');return}
  const token=++generation;
  pending=file;removed=false;ocrSuggestion='';ocrMessage=IMAGE.test(file.type)?'Читаю надписи…':'Добавлено';
  render();report('Файл прикреплён. Напиши, что с ним нужно сделать.');
  if(IMAGE.test(file.type)&&file.size<=6*1024*1024)await recognize(file,token);
  else if(IMAGE.test(file.type)){ocrMessage='Фото прикреплено';render()}
 }
 function loadOcr(){
  if(window.Tesseract)return Promise.resolve(window.Tesseract);
  if(ocrLoader)return ocrLoader;
  ocrLoader=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.async=true;
   script.src='https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
   script.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(Error('OCR unavailable'));
   script.onerror=()=>reject(Error('OCR loading failed'));
   document.head.append(script);
  }).catch(error=>{ocrLoader=null;throw error});
  return ocrLoader;
 }
 async function recognize(file,token){
  let worker=null;
  try{
   const engine=await loadOcr();if(token!==generation||!dialog.open)return;
   worker=await engine.createWorker(['rus','eng'],1);
   if(token!==generation||!dialog.open)return;
   const result=await worker.recognize(file);
   if(token!==generation||!dialog.open)return;
   const text=String(result?.data?.text||'').replace(/[\r\n]+/g,' ').replace(/\s+/g,' ').trim();
   const confidence=Number(result?.data?.confidence||0);
   if(confidence>=45&&text.length>=5){ocrSuggestion=text.slice(0,120);ocrMessage='Текст найден'}
   else ocrMessage='Фото прикреплено';
  }catch{if(token===generation)ocrMessage='Фото прикреплено'}
  finally{if(worker)try{await worker.terminate()}catch{};if(token===generation)render()}
 }
 button.addEventListener('click',()=>{title.blur();setMenu(menu.hidden)});
 take?.addEventListener('click',()=>{setMenu(false);capture.click()});
 choose?.addEventListener('click',()=>{setMenu(false);picker.click()});
 capture.addEventListener('change',()=>{const file=capture.files?.[0];capture.value='';void selectFile(file)});
 picker.addEventListener('change',()=>{const file=picker.files?.[0];picker.value='';void selectFile(file)});
 dialog.addEventListener('pointerdown',event=>{
  if(!menu.hidden&&!menu.contains(event.target)&&!button.contains(event.target))setMenu(false);
 },true);
 dialog.addEventListener('cancel',event=>{if(!menu.hidden){event.preventDefault();setMenu(false)}});
 dialog.addEventListener('close',reset);
 window.SEYVEO_TASK_ATTACHMENTS=Object.freeze({reset,load,getMeta,persist,afterSave,removeFor,openFor});
})();
