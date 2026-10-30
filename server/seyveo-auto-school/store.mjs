/* Experimental dataset: local-only, atomic snapshots, no user conversation data.
 * Do not train a production model directly from this queue.
 */
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,rename,mkdir,rm,open} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {homedir} from 'node:os';

export function schoolDataDir(){
 const base=process.platform==='win32'?
  (process.env.LOCALAPPDATA||join(homedir(),'AppData','Local')):
  join(homedir(),'.local','state');
 return join(base,'SEYVEO','auto-school');
}
export function createSchoolStore({dir=schoolDataDir()}={}){
 const stateFile=join(dir,'state.json');
 const exportFile=join(dir,'experimental-sft.jsonl');
 const lockFile=join(dir,'running.lock');
 async function load(){
  try{
   const state=JSON.parse(await readFile(stateFile,'utf8'));
   if(state?.version!==1||!Array.isArray(state.candidates)||state.candidates.length>5000)
    throw Error('invalid-school-state');
   return state;
  }catch(e){
   if(e.code==='ENOENT')return {version:1,candidates:[],runs:[]};
   throw e;
  }
 }
 async function atomicWrite(path,content){
  const temp=path+'.'+randomUUID()+'.tmp';
  try{
   await writeFile(temp,content,{mode:0o600,flag:'wx'});
   await rename(temp,path);
  }finally{await rm(temp,{force:true}).catch(()=>{})}
 }
 async function save(state){
  await mkdir(dir,{recursive:true,mode:0o700});
  await atomicWrite(stateFile,JSON.stringify(state,null,2));
  await atomicWrite(exportFile,state.candidates.map(x=>JSON.stringify(x.sft)).join('\n')+
   (state.candidates.length?'\n':''));
 }
 return Object.freeze({
  dir,
  paths:{stateFile,exportFile,lockFile},
  load,
  async locked(task){
   await mkdir(dir,{recursive:true,mode:0o700});
   let handle;
   try{handle=await open(lockFile,'wx',0o600)}
   catch(e){if(e.code==='EEXIST')throw Error('school-already-running');throw e}
   try{return await task()}
   finally{await handle.close();await rm(lockFile,{force:true})}
  },
  async appendRun(summary,results){
   const state=await load();
   const known=new Set(state.candidates.map(x=>x.id));
   let added=0;
   for(const result of results){
    if(result.status!=='candidate'||known.has(result.id))continue;
    known.add(result.id);
    state.candidates.push({
     id:result.id,topic:result.topic,createdAt:new Date().toISOString(),
     referenceScore:result.referenceGrade.score,studentScore:result.pupilGrade.score,
     status:'experimental-only',sft:result.sft
    });
    added++;
   }
   if(state.candidates.length>5000)throw Error('school-dataset-full');
   state.runs=[...(state.runs||[]),{
    at:new Date().toISOString(),processed:summary.processed,counts:summary.counts,added
   }].slice(-100);
   await save(state);
   return {added,total:state.candidates.length,exportFile};
  }
 });
}
