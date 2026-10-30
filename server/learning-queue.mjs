/* SEYVEO Learning Engine · owner-reviewed local example queue.
 * Proposals NEVER leave this PC. Approval updates the local example bank,
 * not a global model, and never changes model weights.
 */
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,rename,mkdir,unlink} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {homedir} from 'node:os';

const MAX_ITEMS=80;
const PRIVATE=/(?:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(?:\+?\d[\d ()-]{9,}\d)|парол|password|api.?key|secret|token|sk-[a-z0-9_-]{8}|паспорт|снилс|инн|cvv|cvc|номер\s+карт|адрес\s+(?:клиента|проживания)|private\s+key)/iu;

export function learningQueueFile(){
 const base=process.platform==='win32'?
   (process.env.LOCALAPPDATA||join(homedir(),'AppData','Local')):
   join(homedir(),'.local','state');
 return join(base,'SEYVEO','learning-proposals.json');
}
function validateText(value,max){
 if(typeof value!=='string')throw Error('invalid-example');
 const text=value.replace(/\s+/gu,' ').trim();
 if(text.length<4||text.length>max)throw Error('invalid-example');
 if(PRIVATE.test(text))throw Error('private-data');
 return text;
}
export function createLearningQueue({file=learningQueueFile(),approveExample}={}){
 let lock=Promise.resolve();
 const serial=fn=>{
  const next=lock.then(fn,fn);lock=next.catch(()=>{});return next;
 };
 async function read(){
  let raw;
  try{raw=await readFile(file,'utf8')}
  catch(e){if(e.code==='ENOENT')return [];throw e}
  const parsed=JSON.parse(raw);
  if(parsed?.version!==1||!Array.isArray(parsed.items)||parsed.items.length>MAX_ITEMS)throw Error('invalid-learning-file');
  if(parsed.items.some(x=>typeof x.id!=='string'||!['pending','approved','rejected'].includes(x.status)||
    typeof x.question!=='string'||typeof x.answer!=='string'))throw Error('invalid-learning-file');
  return parsed.items;
 }
 async function save(items){
  await mkdir(dirname(file),{recursive:true,mode:0o700});
  const temp=file+'.'+randomUUID()+'.tmp';
  try{
   await writeFile(temp,JSON.stringify({version:1,items},null,2),{flag:'wx',mode:0o600});
   await rename(temp,file);
  }finally{await unlink(temp).catch(()=>{})}
 }
 return Object.freeze({
  list:()=>serial(async()=>read()),
  propose:payload=>serial(async()=>{
   if(payload?.confirmed!==true)throw Error('consent-required');
   const question=validateText(payload.question,600);
   const answer=validateText(payload.answer,1800);
   const items=await read();
   if(items.length>=MAX_ITEMS)throw Error('learning-full');
   if(items.some(x=>x.status==='pending'&&x.question===question&&x.answer===answer))
    throw Error('duplicate-example');
   const example={id:randomUUID(),question,answer,status:'pending',
    consent:true,createdAt:new Date().toISOString()};
   items.push(example);
   await save(items);
   return {items,example};
  }),
  review:(id,action)=>serial(async()=>{
   if(typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))throw Error('invalid-id');
   if(!['approve','reject','delete'].includes(action))throw Error('invalid-action');
   const items=await read();
   const item=items.find(x=>x.id===id);
   if(!item)throw Error('unknown-id');
   if(action!=='delete'&&item.status!=='pending')throw Error('already-reviewed');
   if(action==='approve'){
    if(typeof approveExample!=='function')throw Error('approval-not-configured');
    await approveExample(item.question,item.answer);
    item.status='approved';
   }else if(action==='reject')item.status='rejected';
   else items.splice(items.indexOf(item),1);
   if(action!=='delete')item.reviewedAt=new Date().toISOString();
   await save(items);
   return {items};
  })
 });
}
