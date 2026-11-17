/* SEYVEO Web Push receiver (v1).
 * Network-only: do not cache app files or intercept fetches.
 * Delivery needs a separate authenticated backend that schedules pushes. */
'use strict';
self.addEventListener('install',()=>{self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('push',event=>{
 let info=null;
 if(event.data){try{info=event.data.json()}catch{info=null}}
 const notification=info&&typeof info==='object'&&info.notification&&typeof info.notification==='object'
  ?info.notification:info;
 const safe=notification&&typeof notification==='object'?notification:{};
 const title=typeof safe.title==='string'&&safe.title.trim()?safe.title.slice(0,90):'SEYVEO · Напоминание';
 const body=typeof safe.body==='string'&&safe.body.trim()?safe.body.slice(0,170):'Посмотрите ближайшее событие в календаре.';
 const tag=typeof safe.tag==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(safe.tag)?safe.tag:'seyveo-calendar';
 // One user-visible notification for every push. Never send silent pushes.
 event.waitUntil(self.registration.showNotification(title,{
  body,lang:'ru',tag,icon:new URL('assets/apple-touch-icon.png',self.registration.scope).href,
  data:{open:'calendar'}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=new URL('./#calendar',self.registration.scope).href;
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const existing=windows.find(item=>item.url.startsWith(self.registration.scope));
  if(existing){
   if(typeof existing.navigate==='function')await existing.navigate(url);
   if(typeof existing.focus==='function')await existing.focus();
  }else if(self.clients.openWindow){
   await self.clients.openWindow(url);
  }
 })());
});
/* Android installed-PWA Share Target: only this POST is intercepted.
   File blobs remain in IndexedDB on the device and are removed after handling. */
const SHARE_DB='seyveo-system-share-v1';
function sharedDb(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(SHARE_DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('incoming'))request.result.createObjectStore('incoming',{keyPath:'id'})};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('share storage unavailable'));
 });
}
async function saveShare(item){
 const db=await sharedDb();
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction('incoming','readwrite');
  tx.objectStore('incoming').put({...item,id:'pending'});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });}finally{db.close()}
}
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='POST'||url.pathname!==new URL('share-target',self.registration.scope).pathname)return;
 event.respondWith((async()=>{
  try{
   const form=await event.request.formData();
   const files=form.getAll('files').filter(v=>v&&typeof v==='object'&&typeof v.size==='number');
   if(files.length>4)throw Error('too many files');
   const accepted=/^(image\/(?:jpeg|png|webp)|application\/pdf|text\/plain|application\/vnd\.openxmlformats-officedocument\.(?:wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation))$/i;
   let total=0;
   for(const file of files){
    total+=file.size;
    if(!file.size||file.size>12*1024*1024||!(accepted.test(file.type||'')||(!file.type&&/\.(?:jpe?g|png|webp|pdf|txt|docx|xlsx|pptx)$/i.test(file.name||''))))throw Error('unsupported share');
   }
   if(total>20*1024*1024)throw Error('share exceeds limit');
   const info={files,title:String(form.get('title')||'').slice(0,200),text:String(form.get('text')||'').slice(0,2500),url:String(form.get('url')||'').slice(0,1200),at:Date.now()};
   if(!files.length&&!info.title&&!info.text&&!info.url)throw Error('empty share');
   await saveShare(info);
   return Response.redirect(new URL('index.html?seyveoShared=1',self.registration.scope).href,303);
  }catch(error){
   return Response.redirect(new URL('index.html?seyveoShareError=1',self.registration.scope).href,303);
  }
 })());
});
