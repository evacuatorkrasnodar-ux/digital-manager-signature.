/* SEYVEO · voluntary local Felix memory.
 * No model calls or cloud sync. Only explicitly confirmed notes are saved.
 * The file lives OUTSIDE the downloaded repository and is not encrypted.
 */
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,rename,unlink,mkdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {homedir} from 'node:os';

const MAX_ITEMS=24;
const MAX_NOTE=180;
const SENSITIVE=/(?:парол|password|секретн(?:ый|ая|ое|ые)\s+ключ|api.?key|sk-[a-z0-9_-]{12}|cvv|cvc|пин.?код|номер\s+карт|паспорт|снилс|банковск|приватн(?:ый|ая)\s+ключ)/iu;

export function memoryFileLocation(){
 const base=process.platform==='win32'
  ?(process.env.LOCALAPPDATA||join(homedir(),'AppData','Local'))
  :join(homedir(),'.local','state');
 return join(base,'SEYVEO','felix-memory.json');
}
export function validateNote(value){
 if(typeof value!=='string')throw Error('invalid-note');
 const note=value.replace(/\s+/gu,' ').trim();
 if(!note||note.length>MAX_NOTE)throw Error('note-too-long');
 if(SENSITIVE.test(note))throw Error('sensitive-note');
 return note;
}
export function createMemoryStore(path=memoryFileLocation()){
 let queue=Promise.resolve();
 const serialize=(fn)=>{
  const next=queue.then(fn,fn);
  queue=next.catch(()=>{});
  return next;
 };
 async function read(){
  let raw;
  try{raw=await readFile(path,'utf8')}
  catch(e){if(e.code==='ENOENT')return [];throw e}
  const state=JSON.parse(raw);
  if(!state||state.version!==1||!Array.isArray(state.items)||state.items.length>MAX_ITEMS)throw Error('invalid-memory-file');
  const result=[];
  for(const item of state.items){
   if(typeof item?.id!=='string'||! /^[a-f0-9-]{36}$/i.test(item.id)||
      typeof item?.text!=='string'||item.text.length>MAX_NOTE||
      typeof item?.createdAt!=='string')throw Error('invalid-memory-file');
   result.push(Object.freeze({id:item.id,text:item.text,createdAt:item.createdAt}));
  }
  return result;
 }
 async function write(items){
  await mkdir(dirname(path),{recursive:true,mode:0o700});
  const temp=path+'.'+randomUUID()+'.tmp';
  try{
   await writeFile(temp,JSON.stringify({version:1,items},null,2),{mode:0o600,flag:'wx'});
   await rename(temp,path);
  }finally{
   await unlink(temp).catch(()=>{});
  }
 }
 return Object.freeze({
  location:path,
  list:()=>serialize(async()=>read()),
  add:text=>serialize(async()=>{
   const note=validateNote(text);
   const items=await read();
   if(items.some(x=>x.text.toLocaleLowerCase('ru')===note.toLocaleLowerCase('ru')))return {items,duplicate:true};
   if(items.length>=MAX_ITEMS)throw Error('memory-full');
   items.push({id:randomUUID(),text:note,createdAt:new Date().toISOString()});
   await write(items);
   return {items,duplicate:false};
  }),
  remove:id=>serialize(async()=>{
   if(typeof id!=='string'||! /^[a-f0-9-]{36}$/i.test(id))throw Error('invalid-id');
   const items=await read();
   const next=items.filter(x=>x.id!==id);
   if(next.length===items.length)throw Error('unknown-id');
   await write(next);
   return next;
  }),
  clear:()=>serialize(async()=>{await write([]);return []})
 });
}
export function memoryContext(items){
 if(!Array.isArray(items)||!items.length)return '';
 // Bound prompt size on slow CPU and keep room for user's actual question.
 const notes=[];
 let used=0;
 for(const item of items.slice(-12)){
  const note=validateNote(item.text);
  if(used+note.length>1200)break;
  notes.push('• '+note);
  used+=note.length;
 }
 return notes.join('\n');
}
