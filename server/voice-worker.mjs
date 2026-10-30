/* SEYVEO Voice Worker: one persistent local Python process, model loaded once.
 * The worker is accessible only through server-side stdio, not from the network.
 */
import {spawn} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const WORKER_SCRIPT=resolve(dirname(fileURLToPath(import.meta.url)),'seyveo-voice-school','voice_worker.py');

export function createVoiceWorker({spawnChild=spawn,python=process.platform==='win32'?'py':'python3',script=WORKER_SCRIPT}={}){
 let child=null,boot=null,bootResolve=null,bootReject=null,task=null,serial=0,buffer='';
 function reset(error){
  const failure=error instanceof Error?error:new Error(String(error||'Голосовой движок остановился.'));
  if(bootReject){const reject=bootReject;bootReject=null;bootResolve=null;reject(failure)}
  if(task){const rejected=task;task=null;clearTimeout(rejected.timer);rejected.reject(failure)}
  child=null;boot=null;buffer='';
 }
 function handle(line){
  let data;
  try{data=JSON.parse(line)}catch{return}
  if(data.type==='ready'){
   if(bootResolve){const resolveReady=bootResolve;bootResolve=null;bootReject=null;resolveReady()}
   return;
  }
  if(data.type==='fatal'){
   reset(new Error(String(data.error||'Ошибка голосового движка.')));
   return;
  }
  if(!task||data.id!==task.id)return;
  const done=task;task=null;clearTimeout(done.timer);
  if(data.type==='result')done.resolve();
  else if(data.type==='error')done.reject(new Error(String(data.error||'Ошибка генерации.')));
 }
 function start(){
  if(boot)return boot;
  boot=new Promise((resolveReady,rejectReady)=>{
   bootResolve=resolveReady;bootReject=rejectReady;
   const args=[...(process.platform==='win32'?['-3.11']:[]),script];
   const proc=spawnChild(python,args,{
    windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,HF_HUB_DISABLE_SYMLINKS_WARNING:'1'}
   });
   child=proc;
   proc.stdout.on('data',data=>{
    buffer+=data.toString('utf8');
    if(buffer.length>131072){reset(new Error('Повреждён вывод голосового движка.'));proc.kill();return}
    let position;
    while((position=buffer.indexOf('\n'))>=0){
     const line=buffer.slice(0,position).trim();
     buffer=buffer.slice(position+1);
     if(line)handle(line);
    }
   });
   proc.stderr.on('data',data=>{
    // Ignore routine Python/transformers diagnostics; report only serious errors.
    const message=data.toString('utf8');
    if(/Traceback|Error:|Exception:|No such file/i.test(message))
     console.error('[SEYVEO Voice Worker]',message.slice(-1200));
   });
   proc.on('error',error=>reset(error));
   proc.on('exit',(code,signal)=>reset(new Error('Голосовой движок завершился: '+String(code??signal))));
  });
  return boot;
 }
 async function generate(text,output){
  await start();
  if(task)throw new Error('Голосовой движок уже создаёт другую фразу.');
  if(!child||!child.stdin.writable)throw new Error('Голосовой движок не готов.');
  return new Promise((resolveResult,rejectResult)=>{
   const id=++serial;
   const timer=setTimeout(()=>{
    if(task?.id!==id)return;
    const stalled=child;
    reset(new Error('Голосовой движок не ответил.'));
    if(stalled)stalled.kill();
   },480000);
   task={id,resolve:resolveResult,reject:rejectResult,timer};
   child.stdin.write(JSON.stringify({id,text,output})+'\n',error=>{
    if(error&&task?.id===id){
     clearTimeout(timer);task=null;rejectResult(error);
    }
   });
  });
 }
 function close(){
  if(child){const proc=child;reset(new Error('Голосовой движок остановлен.'));proc.kill()}
 }
 return {generate,close};
}
