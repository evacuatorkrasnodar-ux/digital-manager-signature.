import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLearningQueue} from '../learning-queue.mjs';

test('SEYVEO consent-based local queue: review, privacy and persistence',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seyveo-learning-'));
 const file=join(dir,'review.json');
 const approved=[];
 const queue=createLearningQueue({file,approveExample:async(question,answer)=>approved.push({question,answer})});
 try{
  assert.deepEqual(await queue.list(),[]);
  const example={question:'Как ответить на обычный вопрос?',answer:'Вежливо, кратко и точно.',confirmed:true};
  await assert.rejects(()=>queue.propose({...example,confirmed:false}),/consent-required/);
  await assert.rejects(()=>queue.propose({...example,question:'Контакт test@example.com'}),/private-data/);
  await assert.rejects(()=>queue.propose({...example,answer:'Секретный API key клиента здесь'}),/private-data/);
  assert.deepEqual(await queue.list(),[]);
  const first=await queue.propose(example);
  const id=first.example.id;
  assert.equal(first.example.status,'pending');
  assert.equal(approved.length,0);
  await assert.rejects(()=>queue.propose(example),/duplicate-example/);
  await assert.rejects(()=>queue.review(id,'publish'),/invalid-action/);
  await assert.rejects(()=>queue.review(id,'approve'.replace('approve','oops')),/invalid-action/);
  const ok=await queue.review(id,'approve');
  assert.equal(ok.items[0].status,'approved');
  assert.equal(approved.length,1);
  assert.equal(approved[0].question,example.question);
  await assert.rejects(()=>queue.review(id,'approve'),/already-reviewed/);
  const reloaded=createLearningQueue({file,approveExample:async()=>{throw Error('must not run')}});
  assert.equal((await reloaded.list())[0].status,'approved');
  const second=await queue.propose({question:'Как вежливо уточнить адрес?',answer:'Попросить адрес без выдуманного расчёта.',confirmed:true});
  await queue.review(second.example.id,'reject');
  assert.equal((await queue.list())[1].status,'rejected');
  assert.equal(approved.length,1);
  await queue.review(second.example.id,'delete');
  assert.equal((await queue.list()).length,1);
  const onDisk=JSON.parse(await readFile(file,'utf8'));
  assert.equal(onDisk.version,1);
  assert.equal(onDisk.items.length,1);
 }finally{await rm(dir,{recursive:true,force:true})}
});

test('SEYVEO does not mark an example approved when the local bank refuses it',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seyveo-learning-fail-'));
 const file=join(dir,'review.json');
 const queue=createLearningQueue({file,approveExample:async()=>{throw Error('failed-local-bank')}});
 try{
  const draft=await queue.propose({question:'Вопрос без данных пользователя',answer:'Ответ по существу.',confirmed:true});
  await assert.rejects(()=>queue.review(draft.example.id,'approve'),/failed-local-bank/);
  assert.equal((await queue.list())[0].status,'pending');
 }finally{await rm(dir,{recursive:true,force:true})}
});
