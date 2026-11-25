/* Explicitly imported and exported document copies, browser-local AES-GCM.
 * Separate from password-protected vault. No automatic device enumeration. */
(()=>{
'use strict';
const enc=new TextEncoder(),dec=new TextDecoder(),limit=20*1024*1024;
const check=a=>{if(!['personal','business'].includes(a))throw Error('Неизвестное пространство');};
let opening;
function db(){
 if(!window.isSecureContext||!window.crypto?.subtle||!window.indexedDB)return Promise.reject(Error('Хранилище недоступно'));
 if(!opening)opening=new Promise((resolve,reject)=>{
  const r=indexedDB.open('seyveo-document-files-v1',1);
  r.onupgradeneeded=()=>{r.result.createObjectStore('keys');r.result.createObjectStore('files',{keyPath:'id'});};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Хранилище занято'));
 }).catch(e=>{opening=null;throw e;});
 return opening;
}
async function run(store,mode,fn){
 const d=await db();return new Promise((resolve,reject)=>{
  const t=d.transaction(store,mode);let value;
  t.oncomplete=()=>resolve(value);t.onerror=()=>reject(t.error||Error('Ошибка хранилища'));t.onabort=()=>reject(t.error||Error('Операция прервана'));
  const r=fn(t.objectStore(store));r.onsuccess=()=>{value=r.result;};
 });
}
const keys=new Map();
function key(a){check(a);if(!keys.has(a))keys.set(a,(async()=>{
 const old=await run('keys','readonly',s=>s.get(a));if(old)return old;
 const k=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 try{await run('keys','readwrite',s=>s.add(k,a));return k;}catch(e){const winner=await run('keys','readonly',s=>s.get(a));if(winner)return winner;throw e;}
 })().catch(e=>{keys.delete(a);throw e;}));return keys.get(a);}
const id=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
async function seal(k,bytes,aad){const iv=crypto.getRandomValues(new Uint8Array(12));return {iv,data:await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(aad)},k,bytes)};}
async function unseal(k,part,aad){return crypto.subtle.decrypt({name:'AES-GCM',iv:part.iv,additionalData:enc.encode(aad)},k,part.data);}
const prefix=(a,i)=>'seyveo-file-v1:'+a+':'+i;
async function meta(row,k){return JSON.parse(dec.decode(await unseal(k,row.meta,prefix(row.area,row.id)+':meta')));}
async function rows(a){check(a);return (await run('files','readonly',s=>s.getAll())).filter(r=>r.area===a);}
function changed(a){document.dispatchEvent(new CustomEvent('seyveo:document-files-changed',{detail:{area:a}}));}
async function save(a,file,source='device'){
 check(a);if(!(file instanceof Blob)||!file.size||file.size>limit)throw Error('Размер файла должен быть до 20 МБ.');
 const i=id(),k=await key(a),tag=prefix(a,i);
 const m={name:String(file.name||'Документ').slice(0,180),type:file.type,createdAt:Date.now(),source:['scan','created','device'].includes(source)?source:'device',folder:'',size:file.size,kind:'file'};
 const [metadata,content]=await Promise.all([seal(k,enc.encode(JSON.stringify(m)),tag+':meta'),seal(k,await file.arrayBuffer(),tag+':data')]);
 await run('files','readwrite',s=>s.add({id:i,area:a,meta:metadata,content}));changed(a);return i;
}
async function list(a){const all=await rows(a);if(!all.length)return [];const k=await key(a);return Promise.all(all.map(async r=>({id:r.id,...await meta(r,k)})));}
async function row(a,i){check(a);const r=await run('files','readonly',s=>s.get(i));if(!r||r.area!==a)throw Error('Файл не найден');return r;}
async function get(a,i){const r=await row(a,i),k=await key(a),m=await meta(r,k);if(m.kind!=='file')throw Error('Не файл');return new File([await unseal(k,r.content,prefix(a,i)+':data')],m.name,{type:m.type,lastModified:m.createdAt});}
async function createFolder(a,name){check(a);name=String(name||'').trim().slice(0,60);if(!name)throw Error('Введите название');const i=id(),k=await key(a),m=await seal(k,enc.encode(JSON.stringify({kind:'folder',name,createdAt:Date.now()})),prefix(a,i)+':meta');await run('files','readwrite',s=>s.add({id:i,area:a,meta:m}));changed(a);return i;}
async function update(a,i,patch){const r=await row(a,i),k=await key(a),m=await meta(r,k);if(m.kind==='folder'&&typeof patch.name==='string'){const name=patch.name.trim().slice(0,60);if(!name)throw Error('Введите название');m.name=name;}if(m.kind==='folder'&&Number.isFinite(patch.order))m.order=patch.order;if(m.kind==='file'&&typeof patch.folder==='string'){if(patch.folder&&!['contracts','projects','clients'].includes(patch.folder)){const target=await row(a,patch.folder);if((await meta(target,k)).kind!=='folder')throw Error('Папка не найдена');}m.folder=patch.folder;}r.meta=await seal(k,enc.encode(JSON.stringify(m)),prefix(a,i)+':meta');await run('files','readwrite',s=>s.put(r));changed(a);}
async function remove(a,i){const r=await row(a,i),k=await key(a);if((await meta(r,k)).kind!=='file')throw Error('Нельзя удалить папку этим действием');await run('files','readwrite',s=>s.delete(i));changed(a);}
async function removeFolder(a,i){const r=await row(a,i),k=await key(a);if((await meta(r,k)).kind!=='folder')throw Error('Папка не найдена');const all=await list(a);if(all.some(x=>x.kind==='file'&&x.folder===i))throw Error('Сначала переместите документы из папки.');await run('files','readwrite',s=>s.delete(i));changed(a);}
async function setDefaultFolder(a,target,patch){
 check(a);if(!['contracts','projects','clients'].includes(target))throw Error('Системную папку изменять нельзя.');
 const i=a+':folder-pref:'+target,k=await key(a);
 const previous=await run('files','readonly',s=>s.get(i));
 const m=previous?await meta(previous,k):{kind:'folder-pref',target};
 if(typeof patch.name==='string'){const name=patch.name.trim().slice(0,60);if(!name)throw Error('Введите название');m.name=name;}
 if(Number.isFinite(patch.order))m.order=patch.order;
 if(typeof patch.hidden==='boolean')m.hidden=patch.hidden;
 const sealed=await seal(k,enc.encode(JSON.stringify(m)),prefix(a,i)+':meta');
 await run('files','readwrite',s=>s.put({id:i,area:a,meta:sealed}));changed(a);
}
// Provider attachment intake: local encrypted copy, exact-content deduplication
// within each workspace, no archive writes and no cross-workspace moves.
async function saveAttachment(a,file,source,folder=''){
 check(a);
 if(!['mail','work-chat','family-chat'].includes(source))throw Error('Неизвестный источник');
 if(!(file instanceof File)||!file.size||file.size>limit)throw Error('Размер файла должен быть до 20 МБ.');
 if((source==='work-chat'&&a!=='business')||(source==='family-chat'&&a!=='personal'))throw Error('Неверное пространство');
 if(folder){const target=await row(a,folder);if((await meta(target,await key(a))).kind!=='folder')throw Error('Папка не найдена');}
 const bytes=await file.arrayBuffer();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 const i='attachment-'+a+'-'+hash,k=await key(a),tag=prefix(a,i);
 const existing=await run('files','readonly',s=>s.get(i));if(existing)return {id:i,duplicate:true};
 const m={name:String(file.name||'Документ').slice(0,180),type:file.type,createdAt:Date.now(),source,folder,size:file.size,kind:'file'};
 const [metadata,content]=await Promise.all([seal(k,enc.encode(JSON.stringify(m)),tag+':meta'),seal(k,bytes,tag+':data')]);
 try{await run('files','readwrite',s=>s.add({id:i,area:a,meta:metadata,content}));}
 catch(e){if(await run('files','readonly',s=>s.get(i)))return {id:i,duplicate:true};throw e;}
 changed(a);return {id:i,duplicate:false};
}
window.SEYVEO_DOCUMENT_FILES=Object.freeze({save,list,get,createFolder,update,remove,removeFolder,setDefaultFolder,saveAttachment});
})();