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
// Local document metadata and immutable previous file versions.
const docTypes=Object.freeze({contract:'Договоры',invoice:'Счета',act:'Акты и УПД',delivery:'Накладные',tax:'Налоги',bank:'Банк',staff:'Кадры',other:'Другие документы'});
function inferDocumentType(name){
 const n=String(name||'').toLocaleLowerCase('ru-RU');
 for(const [type,re] of [['tax',/деклараци|3[- ]?ндфл|налог|отч[её]тност/],['bank',/выписка|плат[её]жн|bank.statement/],['staff',/трудов|кадров|отпуск|увольнен|приказ/],['delivery',/накладн|товарно.транспорт/],['act',/акт(?:[\s_.-]|$)|упд/],['invoice',/сч[её]т|invoice/],['contract',/договор|контракт|соглашен|contract|agreement/]])if(re.test(n))return type;
 return 'other';
}
const clean=(value,n)=>String(value||'').trim().slice(0,n);
function documentMeta(file,options={}){
 const type=Object.prototype.hasOwnProperty.call(docTypes,options.type)?options.type:inferDocumentType(file.name);
 return {docType:type,typeOrigin:options.type?'user':'filename',counterparty:clean(options.counterparty,120),reference:clean(options.reference,100),dueDate:/^\d{4}-\d{2}-\d{2}$/.test(options.dueDate||'')?options.dueDate:'',status:['draft','ready','sent','signed','paid','closed'].includes(options.status)?options.status:'',searchText:clean(options.text,12000),version:1,versions:[]};
}
async function updateDocument(a,i,patch){
 const r=await row(a,i),k=await key(a),m=await meta(r,k);if(m.kind!=='file')throw Error('Документ не найден');
 if(Object.prototype.hasOwnProperty.call(docTypes,patch.docType)){m.docType=patch.docType;m.typeOrigin='user';}
 for(const [field,max] of [['counterparty',120],['reference',100]])if(typeof patch[field]==='string')m[field]=clean(patch[field],max);
 if(typeof patch.dueDate==='string'){if(patch.dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(patch.dueDate))throw Error('Проверьте дату');m.dueDate=patch.dueDate;}
 if(['','draft','ready','sent','signed','paid','closed'].includes(patch.status))m.status=patch.status;
 r.meta=await seal(k,enc.encode(JSON.stringify(m)),prefix(a,i)+':meta');
 await run('files','readwrite',s=>s.put(r));changed(a);
}
async function addVersion(a,i,file,options={}){
 const r=await row(a,i),k=await key(a),m=await meta(r,k);if(m.kind!=='file')throw Error('Документ не найден');
 if(!(file instanceof File)||!file.size||file.size>limit)throw Error('Размер файла должен быть до 20 МБ.');
 const history=Array.isArray(m.versions)?m.versions:[];
 if(history.length>=10)throw Error('Достигнут предел локальной истории: 10 предыдущих версий.');
 const number=Number(m.version)||1,tag=prefix(a,i);
 const old={version:number,name:m.name,type:m.type,size:m.size,at:m.updatedAt||m.createdAt};
 const [previous,current]=await Promise.all([unseal(k,r.content,tag+':data'),file.arrayBuffer()]);
 const archived=await seal(k,previous,tag+':version:'+number);
 const content=await seal(k,current,tag+':data');
 const text=typeof options.text==='string'?clean(options.text,12000):file.type==='text/plain'?clean(await file.text(),12000):'';
 const next={...m,name:clean(file.name,180),type:file.type,size:file.size,updatedAt:Date.now(),version:number+1,versions:[...history,old],searchText:text};
 const sealed=await seal(k,enc.encode(JSON.stringify(next)),tag+':meta');
 const versions={...(r.history||{}),[number]:archived};
 // All previous bytes and the replacement commit in the same IDB record.
 await run('files','readwrite',s=>s.put({...r,meta:sealed,content,history:versions}));changed(a);return number+1;
}
async function getVersion(a,i,number){
 const r=await row(a,i),k=await key(a),m=await meta(r,k);if(m.kind!=='file')throw Error('Документ не найден');
 if(number===(m.version||1))return get(a,i);
 const entry=(m.versions||[]).find(x=>x.version===number);
 if(!entry||!r.history?.[number])throw Error('Версия недоступна');
 return new File([await unseal(k,r.history[number],prefix(a,i)+':version:'+number)],entry.name,{type:entry.type,lastModified:entry.at});
}
async function save(a,file,source='device',options={}){
 check(a);if(!(file instanceof Blob)||!file.size||file.size>limit)throw Error('Размер файла должен быть до 20 МБ.');
 const i=id(),k=await key(a),tag=prefix(a,i);
 const m={name:String(file.name||'Документ').slice(0,180),type:file.type,createdAt:Date.now(),source:['scan','created','device'].includes(source)?source:'device',folder:'',size:file.size,kind:'file',...documentMeta(file,{...options,text:typeof options.text==='string'?options.text:file.type==='text/plain'?await file.slice(0,48000).text():''})};
 const [metadata,content]=await Promise.all([seal(k,enc.encode(JSON.stringify(m)),tag+':meta'),seal(k,await file.arrayBuffer(),tag+':data')]);
 await run('files','readwrite',s=>s.add({id:i,area:a,meta:metadata,content}));changed(a);return i;
}
const TRASH_LIFETIME=30*24*60*60*1000;
// Compare encrypted metadata revisions in one transaction: no partial batch or stale overwrite.
async function commitBatch(changes){
 if(!changes.length)return;
 const d=await db();
 await new Promise((resolve,reject)=>{
  const tx=d.transaction('files','readwrite'),s=tx.objectStore('files');
  let conflict=false;
  tx.oncomplete=()=>resolve();
  tx.onabort=()=>reject(conflict?Error('Список изменился. Обновите его и повторите.'):tx.error||Error('Операция прервана'));
  tx.onerror=()=>reject(tx.error||Error('Ошибка хранилища'));
  for(const change of changes){
   const request=s.get(change.before.id);
   request.onsuccess=()=>{
    const current=request.result,iv=current?.meta?.iv,expected=change.before.meta.iv;
    if(!current||current.area!==change.before.area||!iv||iv.length!==expected.length||!Array.from(iv).every((v,n)=>v===expected[n])){
     conflict=true;tx.abort();return;
    }
    if(change.after)s.put(change.after);else s.delete(current.id);
   };
  }
 });
}
async function readIndex(a){
 const all=await rows(a);if(!all.length)return [];
 const k=await key(a),now=Date.now();
 const entries=await Promise.all(all.map(async r=>({r,m:await meta(r,k)})));
 const expired=entries.filter(x=>x.m.kind==='trash'&&x.m.deletedAt+TRASH_LIFETIME<=now);
 if(expired.length)try{await commitBatch(expired.map(x=>({before:x.r,after:null})));}catch{/* A concurrent restore wins. */}
 return entries.filter(x=>!expired.includes(x));
}
async function list(a){return (await readIndex(a)).filter(x=>x.m.kind!=='trash').map(x=>({id:x.r.id,...x.m}));}
async function listTrash(a){return (await readIndex(a)).filter(x=>x.m.kind==='trash').map(x=>({id:x.r.id,...x.m})).sort((x,y)=>y.deletedAt-x.deletedAt);}
async function changeFiles(a,ids,operation,folder=''){
 check(a);const unique=[...new Set(ids)];if(!unique.length)return 0;
 const k=await key(a),now=Date.now(),changes=[];
 if(operation==='move'&&folder&&!['contracts','projects','clients'].includes(folder)){
  if((await meta(await row(a,folder),k)).kind!=='folder')throw Error('Папка не найдена');
 }
 for(const i of unique){
  const r=await row(a,i),m=await meta(r,k);
  if(operation==='restore'){
   if(m.kind!=='trash'||m.deletedAt+TRASH_LIFETIME<=now)throw Error('Срок восстановления истёк или файл уже восстановлен.');
   m.kind='file';delete m.deletedAt;
   if(m.folder&&!['contracts','projects','clients'].includes(m.folder)){
    try{if((await meta(await row(a,m.folder),k)).kind!=='folder')m.folder='';}catch{m.folder='';}
   }
  }else{
   if(m.kind!=='file')throw Error('Выберите только локальные документы.');
   if(operation==='trash'){m.kind='trash';m.deletedAt=now;}
   else if(operation==='move')m.folder=folder;
   else throw Error('Неизвестное действие');
  }
  changes.push({before:r,after:{...r,meta:await seal(k,enc.encode(JSON.stringify(m)),prefix(a,i)+':meta')}});
 }
 await commitBatch(changes);changed(a);return changes.length;
}
const removeMany=(a,ids)=>changeFiles(a,ids,'trash');
const restoreMany=(a,ids)=>changeFiles(a,ids,'restore');
const moveMany=(a,ids,folder)=>changeFiles(a,ids,'move',folder);
async function row(a,i){check(a);const r=await run('files','readonly',s=>s.get(i));if(!r||r.area!==a)throw Error('Файл не найден');return r;}
// Only associate source text with the exact decrypted file instance, never with a filename.
const editableSource=new WeakMap(),fileIds=new WeakMap();
async function get(a,i){
 const r=await row(a,i),k=await key(a),m=await meta(r,k);if(m.kind!=='file')throw Error('Не файл');
 const file=new File([await unseal(k,r.content,prefix(a,i)+':data')],m.name,{type:m.type,lastModified:m.createdAt});
 fileIds.set(file,i);
 if(m.source==='created'&&typeof m.searchText==='string'&&m.searchText.trim())editableSource.set(file,m.searchText);
 return file;
}
function sourceText(file){return editableSource.get(file)||'';}
function sourceId(file){return fileIds.get(file)||'';}
async function createFolder(a,name){check(a);name=String(name||'').trim().slice(0,60);if(!name)throw Error('Введите название');const i=id(),k=await key(a),m=await seal(k,enc.encode(JSON.stringify({kind:'folder',name,createdAt:Date.now()})),prefix(a,i)+':meta');await run('files','readwrite',s=>s.add({id:i,area:a,meta:m}));changed(a);return i;}
async function update(a,i,patch){const r=await row(a,i),k=await key(a),m=await meta(r,k);if(m.kind==='folder'&&typeof patch.name==='string'){const name=patch.name.trim().slice(0,60);if(!name)throw Error('Введите название');m.name=name;}if(m.kind==='folder'&&Number.isFinite(patch.order))m.order=patch.order;if(m.kind==='file'&&typeof patch.name==='string'){const ext=String(m.name||'').match(/\.[^.]+$/)?.[0]||'';const base=patch.name.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g,'-').trim().slice(0,Math.max(1,180-ext.length));if(!base)throw Error('Введите название');m.name=base+ext;}if(m.kind==='file'&&typeof patch.folder==='string'){if(patch.folder&&!['contracts','projects','clients'].includes(patch.folder)){const target=await row(a,patch.folder);if((await meta(target,k)).kind!=='folder')throw Error('Папка не найдена');}m.folder=patch.folder;}r.meta=await seal(k,enc.encode(JSON.stringify(m)),prefix(a,i)+':meta');await run('files','readwrite',s=>s.put(r));changed(a);}
async function remove(a,i){return removeMany(a,[i]);}
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
 const existing=await run('files','readonly',s=>s.get(i));if(existing){const m=await meta(existing,k);if(m.kind==='trash'){if(m.deletedAt+TRASH_LIFETIME>Date.now()){await restoreMany(a,[i]);return {id:i,duplicate:true};}await commitBatch([{before:existing,after:null}]);}else return {id:i,duplicate:true};}
 const m={name:String(file.name||'Документ').slice(0,180),type:file.type,createdAt:Date.now(),source,folder,size:file.size,kind:'file',...documentMeta(file)};
 const [metadata,content]=await Promise.all([seal(k,enc.encode(JSON.stringify(m)),tag+':meta'),seal(k,bytes,tag+':data')]);
 try{await run('files','readwrite',s=>s.add({id:i,area:a,meta:metadata,content}));}
 catch(e){if(await run('files','readonly',s=>s.get(i)))return {id:i,duplicate:true};throw e;}
 changed(a);return {id:i,duplicate:false};
}
// Templates are independent encrypted records, not documents or folders.
async function saveTemplate(a,value){
 check(a);
 const name=String(value.name||'').trim().slice(0,100),officialId=String(value.officialId||'').slice(0,100),text=String(value.text||'');
 if(!name||(!officialId&&!text.trim())||text.length>12000)throw Error('Введите название и текст шаблона.');
 const data=JSON.stringify({text:officialId?'':text,officialId,format:value.format==='docx'?'docx':'pdf'});
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(data))),n=>n.toString(16).padStart(2,'0')).join('');
 const i='template-'+a+'-'+digest,k=await key(a),tag=prefix(a,i);
 if(await run('files','readonly',s=>s.get(i)))return {id:i,duplicate:true};
 const m={kind:'template',name,official:Boolean(officialId),createdAt:Date.now()};
 const [metadata,content]=await Promise.all([seal(k,enc.encode(JSON.stringify(m)),tag+':meta'),seal(k,enc.encode(data),tag+':data')]);
 try{await run('files','readwrite',s=>s.add({id:i,area:a,meta:metadata,content}));}
 catch(e){if(await run('files','readonly',s=>s.get(i)))return {id:i,duplicate:true};throw e;}
 changed(a);return {id:i,duplicate:false};
}
async function listTemplates(a){return (await list(a)).filter(x=>x.kind==='template').sort((x,y)=>y.createdAt-x.createdAt);}
async function getTemplate(a,i){const r=await row(a,i),k=await key(a),m=await meta(r,k);if(m.kind!=='template')throw Error('Шаблон не найден');return {...m,...JSON.parse(dec.decode(await unseal(k,r.content,prefix(a,i)+':data')))};}
async function renameTemplate(a,i,name){const r=await row(a,i),k=await key(a),m=await meta(r,k);if(m.kind!=='template')throw Error('Шаблон не найден');name=String(name||'').trim().slice(0,100);if(!name)throw Error('Введите название');m.name=name;r.meta=await seal(k,enc.encode(JSON.stringify(m)),prefix(a,i)+':meta');await run('files','readwrite',s=>s.put(r));changed(a);}
async function removeTemplate(a,i){const r=await row(a,i),k=await key(a);if((await meta(r,k)).kind!=='template')throw Error('Шаблон не найден');await run('files','readwrite',s=>s.delete(i));changed(a);}
window.SEYVEO_DOCUMENT_FILES=Object.freeze({save,list,listTrash,removeMany,restoreMany,moveMany,get,sourceText,sourceId,createFolder,update,remove,removeFolder,setDefaultFolder,saveAttachment,saveTemplate,listTemplates,getTemplate,renameTemplate,removeTemplate,docTypes,inferDocumentType,updateDocument,addVersion,getVersion});
})();