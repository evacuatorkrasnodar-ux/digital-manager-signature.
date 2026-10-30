import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createVoiceWorker} from './voice-worker.mjs';

function fakeWorker(){
 const stdout=new EventEmitter(),stderr=new EventEmitter(),proc=new EventEmitter();
 proc.stdout=stdout;proc.stderr=stderr;
 proc.stdin={
  writable:true,
  write(line,callback){
   const task=JSON.parse(line);
   queueMicrotask(()=>stdout.emit('data',Buffer.from(JSON.stringify({type:'result',id:task.id})+'\n')));
   callback?.();
  }
 };
 proc.kill=()=>{proc.emit('exit',0,null)};
 queueMicrotask(()=>stdout.emit('data',Buffer.from('{"type":"ready"}\n')));
 return proc;
}

test('reuses the same voice worker for multiple utterances',async()=>{
 let starts=0;
 const speaker=createVoiceWorker({spawnChild:()=>{starts++;return fakeWorker()}});
 try{
  await speaker.generate('Привет, Сэйви!','X:/private/one.wav');
  await speaker.generate('Сегодня хороший день.','X:/private/two.wav');
  assert.equal(starts,1,'model must load once');
 }finally{speaker.close()}
});

test('worker can restart after a process exit',async()=>{
 let starts=0,last=null;
 const speaker=createVoiceWorker({spawnChild:()=>{starts++;return last=fakeWorker()}});
 try{
  await speaker.generate('Привет','X:/private/one.wav');
  last.emit('exit',1,null);
  await speaker.generate('Повтор','X:/private/two.wav');
  assert.equal(starts,2);
 }finally{speaker.close()}
});
