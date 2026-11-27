/* SEYVEO local lyrics: import only user-supplied text. No external catalog. */
(function(host,factory){
 const api=factory(host);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(host)host.SEYVEO_LYRICS=api;
})(typeof window!=='undefined'?window:null,function(w){
 'use strict';
 const LIMIT=128*1024,MAX_LINES=3000;
 function parse(input){
  if(typeof input!=='string'||input.length>LIMIT)return null;
  let offset=0;const timed=[],plain=[];
  const raw=input.replace(/^\uFEFF/,'').split(/\r\n|\n|\r/);
  for(const line of raw){
   const meta=line.match(/^\s*\[offset:\s*([+-]?\d+)\s*\]\s*$/i);
   if(meta){offset=Math.max(-60000,Math.min(60000,Number(meta[1])))/1000;continue}
   if(/^\s*\[(?:ar|ti|al|au|by|re|ve|length):.*\]\s*$/i.test(line))continue;
   let rest=line.trim(),times=[];
   while(true){
    const tag=rest.match(/^\[(\d{1,3}):([0-5]\d)(?:[.:](\d{1,3}))?\]/);
    if(!tag)break;
    times.push(Number(tag[1])*60+Number(tag[2])+(tag[3]?Number('0.'+tag[3]):0));
    rest=rest.slice(tag[0].length).trimStart();
   }
   rest=rest.replace(/<\d{1,3}:[0-5]\d(?:[.:]\d{1,3})?>/g,'').trim().slice(0,1000);
   if(times.length){for(const time of times){if(timed.length>=MAX_LINES)break;timed.push({time,text:rest})}}
   else if(rest&&plain.length<MAX_LINES)plain.push({text:rest});
  }
  if(timed.some(x=>x.text)){
   const lines=timed.map(x=>({...x,time:Math.max(0,x.time+offset)})).sort((a,b)=>a.time-b.time);
   return {timed:true,lines:lines.filter((x,i)=>!i||x.time!==lines[i-1].time||x.text!==lines[i-1].text)};
  }
  return plain.length?{timed:false,lines:plain}:null;
 }
 const stem=name=>String(name||'').replace(/\.[^.]+$/,'').normalize('NFC').trim().toLocaleLowerCase('ru-RU');
 const isText=file=>/\.(lrc|txt)$/i.test(file?.name||'');
 async function read(file){
  if(!isText(file)||!file.size||file.size>LIMIT)return null;
  const bytes=new Uint8Array(typeof file.arrayBuffer==='function'?await file.arrayBuffer():await new Promise((ok,no)=>{const reader=new w.FileReader();reader.onload=()=>ok(reader.result);reader.onerror=no;reader.readAsArrayBuffer(file)}));
  let text;
  if(bytes[0]===255&&bytes[1]===254)text=new TextDecoder('utf-16le').decode(bytes);
  else if(bytes[0]===254&&bytes[1]===255)text=new TextDecoder('utf-16be').decode(bytes);
  else {try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{text=new TextDecoder('windows-1251').decode(bytes)}}
  if(text.includes('\0'))return null;
  return parse(text);
 }
 let dbPromise;
 function db(){
  if(!w?.indexedDB)return Promise.reject(Error('storage'));
  if(!dbPromise)dbPromise=new Promise((ok,no)=>{
   const r=w.indexedDB.open('seyveo-local-lyrics-v1',1);
   r.onupgradeneeded=()=>r.result.createObjectStore('lyrics',{keyPath:'id'});
   r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();dbPromise=null};ok(r.result)};
   r.onerror=r.onblocked=()=>no(Error('storage'));
  }).catch(e=>{dbPromise=null;throw e});
  return dbPromise;
 }
 const memory=new Map();
 async function transaction(mode,fn){
  const database=await db();
  return new Promise((ok,no)=>{const tx=database.transaction('lyrics',mode);const req=fn(tx.objectStore('lyrics'));tx.oncomplete=()=>ok(req.result);tx.onerror=tx.onabort=()=>no(Error('storage'))});
 }
 async function get(id){
  if(!id)return null;
  if(memory.has(id))return memory.get(id);
  try{const row=await transaction('readonly',s=>s.get(id));if(row?.result)return row.result}catch{}
  return null;
 }
 async function put(id,result){
  if(!id||!result?.lines?.length)throw Error('invalid');
  if(memory.size>=100&&!memory.has(id))memory.delete(memory.keys().next().value);
  memory.set(id,result);
  try{await transaction('readwrite',s=>s.put({id,result}));return true}catch{return false}
 }
 async function remove(id){
  memory.delete(id);
  try{await transaction('readwrite',s=>s.delete(id));return true}catch{return false}
 }
 async function attach(files,library){
  let attached=0,temporary=0,skipped=0;
  for(const file of files.filter(isText).slice(0,40)){
   const matches=library.filter(t=>stem(t.file.name)===stem(file.name));
   if(matches.length!==1){skipped++;continue}
   try{const result=await read(file);if(!result){skipped++;continue}if(await put(matches[0].id,result))attached++;else temporary++}catch{skipped++}
  }
  return {attached,temporary,skipped};
 }
 return Object.freeze({parse,read,stem,isText,get,put,remove,attach});
});
