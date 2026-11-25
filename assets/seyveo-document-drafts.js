/* Local drafts: encrypted at rest with non-extractable browser-local keys.
 * Not password-protected, not a backup, never uploaded. No plaintext fallback. */
(()=>{
'use strict';
const DB='seyveo-document-drafts-v1',enc=new TextEncoder(),dec=new TextDecoder();
const allowed=area=>['personal','business'].includes(area);
let database=null;
function open(){
 if(!window.isSecureContext||!crypto.subtle||!window.indexedDB)return Promise.reject(Error('Локальное хранилище недоступно'));
 if(!database)database=new Promise((resolve,reject)=>{
  const r=indexedDB.open(DB,1);
  r.onupgradeneeded=()=>{r.result.createObjectStore('keys');r.result.createObjectStore('drafts',{keyPath:'id'});};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Хранилище занято'));
 }).catch(e=>{database=null;throw e;});
 return database;
}
async function request(name,mode,fn){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(name,mode);let result;
  tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error||Error('Сохранение прервано'));tx.onerror=()=>reject(tx.error||Error('Ошибка хранилища'));
  const r=fn(tx.objectStore(name));r.onsuccess=()=>{result=r.result;};
 });
}
const keys=new Map();
async function key(area){
 if(!allowed(area))throw Error('Неизвестное пространство');
 if(!keys.has(area))keys.set(area,(async()=>{
  const existing=await request('keys','readonly',s=>s.get(area));if(existing)return existing;
  const generated=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  try{await request('keys','readwrite',s=>s.add(generated,area));return generated;}
  catch(e){const winner=await request('keys','readonly',s=>s.get(area));if(winner)return winner;throw e;}
 })().catch(e=>{keys.delete(area);throw e;}));
 return keys.get(area);
}
const aad=(area,id)=>enc.encode('seyveo-draft-v1:'+area+':'+id);
const queues=new Map();
function serial(id,work){
 const next=(queues.get(id)||Promise.resolve()).catch(()=>{}).then(work);
 queues.set(id,next);
 next.then(()=>{if(queues.get(id)===next)queues.delete(id);},()=>{if(queues.get(id)===next)queues.delete(id);});
 return next;
}
function save(area,value){
 if(!allowed(area)||!value?.id)return Promise.reject(Error('Некорректный черновик'));
 const snapshot=JSON.stringify(value),id=value.id;
 return serial(id,async()=>{
  const k=await key(area),iv=crypto.getRandomValues(new Uint8Array(12));
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(area,id)},k,enc.encode(snapshot));
  await request('drafts','readwrite',s=>s.put({id,area,iv,data}));
 });
}
async function list(area){
 if(!allowed(area))throw Error('Неизвестное пространство');
 await Promise.allSettled([...queues.values()]);
 const rows=(await request('drafts','readonly',s=>s.getAll())).filter(r=>r.area===area);
 if(!rows.length)return [];
 const k=await key(area),items=[];
 for(const row of rows){
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:row.iv,additionalData:aad(area,row.id)},k,row.data);
  const value=JSON.parse(dec.decode(plain));if(value.id===row.id)items.push(value);
 }
 return items.sort((a,b)=>b.updatedAt-a.updatedAt);
}
function remove(area,id){return serial(id,async()=>{
 const row=await request('drafts','readonly',s=>s.get(id));
 if(row?.area===area)await request('drafts','readwrite',s=>s.delete(id));
});}
window.SEYVEO_DOCUMENT_DRAFTS=Object.freeze({save,list,remove,id:()=>crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('')});
})();
