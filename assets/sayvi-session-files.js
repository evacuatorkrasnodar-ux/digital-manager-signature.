/* SEYVEO · private temporary cache for user-selected chat documents.
 * Encrypted with a per-tab AES-GCM key. No raw file bytes in localStorage,
 * no upload, and no reuse after the browser session key expires.
 */
(()=>{
 'use strict';
 const DB_NAME='seyveo.sayvi.session-files.v1';
 const SECRET='seyveo.sayvi.session-files.key.v1';
 const TTL=12*60*60*1000;
 const MAX_BYTES=8*1024*1024;
 const MAX_ENTRIES=24;
 let dbPromise=null,keyPromise=null;

 function openDatabase(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
   if(!('indexedDB' in window))return reject(Error('storage-unavailable'));
   const request=indexedDB.open(DB_NAME,1);
   request.onupgradeneeded=()=>{
    if(!request.result.objectStoreNames.contains('files'))
     request.result.createObjectStore('files',{keyPath:'id'});
   };
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(Error('storage-unavailable'));
   request.onblocked=()=>reject(Error('storage-blocked'));
  }).catch(error=>{dbPromise=null;throw error;});
  return dbPromise;
 }
 function keyForSession(){
  if(keyPromise)return keyPromise;
  keyPromise=(async()=>{
   if(!window.crypto?.subtle||!window.crypto?.getRandomValues)throw Error('crypto-unavailable');
   let raw=sessionStorage.getItem(SECRET);
   if(!raw||!/^[a-f0-9]{64}$/.test(raw)){
    const bytes=crypto.getRandomValues(new Uint8Array(32));
    raw=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    sessionStorage.setItem(SECRET,raw);
   }
   const keyBytes=new Uint8Array(raw.match(/.{2}/g).map(value=>parseInt(value,16)));
   return crypto.subtle.importKey('raw',keyBytes,{name:'AES-GCM'},false,['encrypt','decrypt']);
  })().catch(error=>{keyPromise=null;throw error;});
  return keyPromise;
 }
 async function transact(method,run){
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction('files',method),store=tx.objectStore('files');
   let answer;
   tx.oncomplete=()=>resolve(answer);
   tx.onerror=()=>reject(Error('storage-failed'));
   tx.onabort=()=>reject(Error('storage-aborted'));
   try{run(store,result=>{answer=result;});}
   catch(error){tx.abort();reject(error);}
  });
 }
 async function removeExpired(){
  const now=Date.now();
  await transact('readwrite',(store)=>{
   const request=store.openCursor(),old=[];
   request.onsuccess=()=>{
    const cursor=request.result;
    if(!cursor){
     // Keep the newest limited number of encrypted records.
     old.sort((a,b)=>b.created-a.created);
     old.slice(MAX_ENTRIES).forEach(x=>store.delete(x.id));
     return;
    }
    const x=cursor.value;
    if(!x||!Number.isFinite(x.created)||now-x.created>TTL||x.created>now+60000)
     cursor.delete();
    else old.push({id:x.id,created:x.created});
    cursor.continue();
   };
  });
 }
 async function remember(files){
  const refs={};
  if(!Array.isArray(files)||!files.length)return refs;
  try{
   const key=await keyForSession();
   for(const file of files.slice(0,6)){
    if(!file||typeof file.name!=='string'||file.size<1||file.size>MAX_BYTES)continue;
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,await file.arrayBuffer());
    const id='doc-'+Date.now().toString(36)+'-'+crypto.randomUUID();
    await transact('readwrite',(store)=>{
     store.put({id,created:Date.now(),name:file.name.slice(0,200),
      type:String(file.type||'application/octet-stream').slice(0,100),
      size:file.size,iv,encrypted});
    });
    refs[file.name]=id;
   }
   await removeExpired().catch(()=>{});
  }catch{
   // Private browsing and devices without WebCrypto simply require reattaching.
   return refs;
  }
  return refs;
 }
 async function restore(id){
  if(typeof id!=='string'||!/^doc-[a-z0-9-]{8,90}$/i.test(id))return null;
  try{
   const key=await keyForSession();
   const record=await transact('readonly',(store,done)=>{
    const request=store.get(id);
    request.onsuccess=()=>done(request.result||null);
   });
   if(!record||Date.now()-record.created>TTL||record.created>Date.now()+60000||
     record.size<1||record.size>MAX_BYTES)return null;
   const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv},key,record.encrypted);
   if(bytes.byteLength!==record.size)return null;
   return new File([bytes],record.name,{type:record.type||'application/octet-stream'});
  }catch{return null;}
 }
 window.SEYVEO_CHAT_FILES=Object.freeze({remember,restore});
})();
