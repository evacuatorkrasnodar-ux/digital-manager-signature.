/* SEYVEO Document Vault · opt-in, browser-local encrypted prototype.
 * AES-256-GCM encrypts file contents and document metadata; PBKDF2-SHA256
 * derives independent non-extractable keys for Personal and Business.
 * No passphrases or keys are persisted. Not a native secure enclave or backup.
 * All operations fail closed if Web Crypto or IndexedDB is unavailable. */
(()=>{
'use strict';
const DB='seyveo-document-vault-v1', CONFIG='config', RECORDS='records';
const ITERATIONS=250000, MAX_SIZE=20*1024*1024, VERSION=1;
const encoder=new TextEncoder(),decoder=new TextDecoder();
const areas=['personal','business'];
let keys=null,epoch=0;
const supported=()=>!!(window.isSecureContext&&window.crypto?.subtle&&window.indexedDB);
function fail(message){throw new Error(message)}
function random(length){const v=new Uint8Array(length);crypto.getRandomValues(v);return v}
function id(){return [...random(16)].map(n=>n.toString(16).padStart(2,'0')).join('')}
function openDb(){
 if(!supported())return Promise.reject(new Error('Нужно защищённое HTTPS-соединение и доступное хранилище браузера.'));
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains(CONFIG))db.createObjectStore(CONFIG,{keyPath:'id'});
   if(!db.objectStoreNames.contains(RECORDS))db.createObjectStore(RECORDS,{keyPath:'id'});
  };
  req.onerror=()=>reject(req.error||new Error('База документов недоступна.'));
  req.onblocked=()=>reject(new Error('Закройте другие вкладки SEYVEO и попробуйте снова.'));
  req.onsuccess=()=>resolve(req.result);
 });
}
async function store(name,mode,action){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  let result,finished=false;
  const tx=db.transaction(name,mode),object=tx.objectStore(name);
  const cleanup=()=>{if(!finished){finished=true;db.close()}};
  tx.oncomplete=()=>{cleanup();resolve(result)};
  tx.onerror=()=>{cleanup();reject(tx.error||new Error('Ошибка сохранения документов.'))};
  tx.onabort=()=>{cleanup();reject(tx.error||new Error('Операция с архивом прервана.'))};
  try{
   const request=action(object);
   request.onsuccess=()=>{result=request.result};
  }catch(e){try{tx.abort()}catch{}cleanup();reject(e)}
 });
}
const getConfig=()=>store(CONFIG,'readonly',s=>s.get('main'));
const getRows=()=>store(RECORDS,'readonly',s=>s.getAll());
const getRow=key=>store(RECORDS,'readonly',s=>s.get(key));
const saveRow=row=>store(RECORDS,'readwrite',s=>s.put(row));
const eraseRow=key=>store(RECORDS,'readwrite',s=>s.delete(key));
function lock(){keys=null;epoch++}
function requireKeys(){if(!keys)fail('Сначала разблокируйте архив.');return keys}
async function derive(material,salt){
 return crypto.subtle.deriveKey(
  {name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt),iterations:ITERATIONS},
  material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function material(passphrase){
 return crypto.subtle.importKey('raw',encoder.encode(passphrase),'PBKDF2',false,['deriveKey']);
}
async function seal(key,bytes,aad){
 const iv=random(12);
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(aad)},key,bytes);
 return {iv,encrypted};
}
async function unseal(key,iv,cipher,aad){
 return crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(iv),additionalData:encoder.encode(aad)},key,cipher);
}
async function setup(passphrase){
 if(!supported())fail('В этом браузере защищённый архив недоступен.');
 if(typeof passphrase!=='string'||passphrase.length<12)fail('Нужно не меньше 12 символов в пароле архива.');
 if(await getConfig())fail('Архив уже создан. Откройте его существующим паролем.');
 const generation=epoch;
 const base=await material(passphrase),newKeys={};
 const cfg={id:'main',version:VERSION,iterations:ITERATIONS,spaces:{}};
 for(const a of areas){
  const salt=random(16),key=await derive(base,salt);
  const check=await seal(key,encoder.encode('SEYVEO-V1-'+a),'check:'+a);
  cfg.spaces[a]={salt,iv:check.iv,check:check.encrypted};
  newKeys[a]=key;
 }
 if(generation!==epoch)fail('Создание архива было отменено.');
 await store(CONFIG,'readwrite',s=>s.add(cfg));
 if(generation===epoch)keys=newKeys;
 return true;
}
async function unlock(passphrase){
 if(!supported())fail('В этом браузере защищённый архив недоступен.');
 const cfg=await getConfig();
 if(!cfg||cfg.version!==VERSION||cfg.iterations!==ITERATIONS)fail('Архив не найден или его версия не поддерживается.');
 const generation=epoch,base=await material(passphrase),newKeys={};
 try{
  for(const a of areas){
   const space=cfg.spaces?.[a];
   if(!space)fail('Повреждена конфигурация архива.');
   const key=await derive(base,space.salt);
   const check=decoder.decode(await unseal(key,space.iv,space.check,'check:'+a));
   if(check!=='SEYVEO-V1-'+a)fail('Неверный пароль или повреждённый архив.');
   newKeys[a]=key;
  }
 }catch{fail('Неверный пароль или повреждённый архив.')}
 if(generation!==epoch)fail('Разблокировка была отменена.');
 keys=newKeys;
 return true;
}
async function status(){
 if(!supported())return {supported:false,initialized:false,unlocked:false};
 const cfg=await getConfig();
 return {supported:true,initialized:!!cfg,unlocked:!!keys};
}
async function addFile(area,file){
 if(!areas.includes(area))fail('Неизвестное пространство.');
 const key=requireKeys()[area];
 if(!(file instanceof Blob)||file.size===0||file.size>MAX_SIZE)fail('Нужен файл размером до 20 МБ.');
 const recordId=id(),name=String(file.name||'Документ').slice(0,180);
 const payload=await file.arrayBuffer();
 if(!keys||keys[area]!==key)fail('Архив был заблокирован.');
 const metadata={name,type:String(file.type||'application/octet-stream').slice(0,120),size:file.size,createdAt:Date.now()};
 const sealedMeta=await seal(key,encoder.encode(JSON.stringify(metadata)),'meta:'+recordId+':'+area);
 const sealedFile=await seal(key,payload,'file:'+recordId+':'+area);
 if(!keys||keys[area]!==key)fail('Архив был заблокирован.');
 await saveRow({id:recordId,area,ivMeta:sealedMeta.iv,meta:sealedMeta.encrypted,ivFile:sealedFile.iv,content:sealedFile.encrypted});
 return recordId;
}
async function list(area){
 if(!areas.includes(area))fail('Неизвестное пространство.');
 const key=requireKeys()[area],rows=await getRows(),result=[];
 for(const row of rows){
  if(row.area!==area)continue;
  if(!keys||keys[area]!==key)fail('Архив заблокирован.');
  let meta;
  try{meta=JSON.parse(decoder.decode(await unseal(key,row.ivMeta,row.meta,'meta:'+row.id+':'+area)))}
  catch{fail('Не удалось прочитать зашифрованную запись архива.')}
  result.push({id:row.id,...meta});
 }
 result.sort((a,b)=>b.createdAt-a.createdAt);
 return result;
}
async function getFile(area,recordId){
 if(!areas.includes(area))fail('Неизвестное пространство.');
 const key=requireKeys()[area],row=await getRow(recordId);
 if(!row||row.area!==area)fail('Документ не найден.');
 const meta=JSON.parse(decoder.decode(await unseal(key,row.ivMeta,row.meta,'meta:'+row.id+':'+area)));
 const data=await unseal(key,row.ivFile,row.content,'file:'+row.id+':'+area);
 if(!keys||keys[area]!==key)fail('Архив заблокирован.');
 return new File([data],meta.name,{type:meta.type,lastModified:meta.createdAt});
}
async function remove(area,recordId){
 if(!areas.includes(area))fail('Неизвестное пространство.');
 requireKeys();
 const row=await getRow(recordId);
 if(!row||row.area!==area)fail('Документ не найден.');
 await eraseRow(recordId);
 return true;
}
window.addEventListener('pagehide',lock);
window.SEYVEO_DOCUMENT_VAULT=Object.freeze({status,setup,unlock,lock,addFile,list,getFile,remove,supported,maxSize:MAX_SIZE});
})();
