import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
 CURRICULUM,validateSyntheticExample,validateGrade,lessonId,toSFT,
 evaluateOne,runAutonomousSchool,judgePrompt
} from './core.mjs';
import {createLocalOllama} from './ollama.mjs';
import {createSchoolStore} from './store.mjs';
import {parseArgs,run} from './run.mjs';

const sample={
 topic:'mail',
 question:'Клиент просит назвать стоимость доставки, но адрес доставки неизвестен. Как корректно ему ответить?',
 reference_answer:'Здравствуйте! Спасибо за обращение. Пожалуйста, уточните адрес доставки, после чего сможем рассчитать стоимость. Пока точную цену назвать нельзя.',
 criteria:['Не обещать точную цену без адреса','Вежливо запросить адрес доставки']
};
const perfect={score:5,safe:true,factually_supported:true,reason:'Все критерии соблюдены'};
const failure={score:2,safe:true,factually_supported:true,reason:'Не попросила адрес'};

test('Synthetic examples must have meaningful format, no private data or fake actions',()=>{
 const safe=validateSyntheticExample(sample);
 assert.equal(safe.topic,'mail');
 assert.equal(lessonId(safe).length,20);
 assert.equal(toSFT(safe).completion[0].role,'assistant');
 assert.throws(()=>validateSyntheticExample({...sample,question:'Контакт test@example.com и ещё одно поле'}),/possible-private-data/);
 assert.throws(()=>validateSyntheticExample({...sample,reference_answer:'Я уже отправила письмо клиенту. Всё готово.'}),/unverified-action/);
 assert.throws(()=>validateSyntheticExample({...sample,criteria:['очень хорошо']}),/invalid-criteria/);
 assert.throws(()=>validateSyntheticExample({...sample,topic:'not-known'}),/invalid-topic/);
 assert.throws(()=>validateGrade({score:6,safe:true,factually_supported:true,reason:'Ошибка'}),/invalid-grade/);
 assert.match(judgePrompt(safe,'Проверка',{}),/Критерии|критерии/);
});

test('Automated teacher builds candidate only if model judge verifies reference and student struggles',async()=>{
 const topic=CURRICULUM[0];
 const result=await evaluateOne({topic,
  generate:async()=>sample,
  grade:async(_lesson,_answer,options)=>options.isReference?perfect:failure,
  studentAnswer:async()=> 'Цена будет известна позднее.'
 });
 assert.equal(result.status,'candidate');
 assert.equal(result.sft.prompt[0].content,sample.question);
 assert.equal(result.referenceGrade.score,5);
 assert.equal(result.pupilGrade.score,2);
 const passed=await evaluateOne({topic,
  generate:async()=>sample,grade:async()=>perfect,
  studentAnswer:async()=>sample.reference_answer
 });
 assert.equal(passed.status,'already-passed');
 const rejected=await evaluateOne({topic,generate:async()=>sample,
  grade:async()=>({...perfect,score:3}),
  studentAnswer:async()=>{throw Error('should-not-call-student')}
 });
 assert.equal(rejected.status,'rejected');
});

test('School rejects bad teacher output without stopping other lessons',async()=>{
 const result=await runAutonomousSchool({count:2,
  generate:async(topic)=>topic.id==='mail'?{...sample,question:'Номер +79991234567'}:{...sample,topic:topic.id},
  grade:async()=>perfect,
  studentAnswer:async()=> 'Пример ответа ученицы.'
 });
 assert.equal(result.processed,2);
 assert.equal(result.counts.rejected,1);
});

test('Local Ollama endpoint and models are fixed; malformed output is refused',async()=>{
 const calls=[];
 const fetchImpl=async(url,opts)=>{
  calls.push({url,opts});
  if(url.endsWith('/api/tags'))return {ok:true,json:async()=>({
   models:[{name:'qwen3:8b'},{name:'qwen3:4b-instruct'}]})};
  return {ok:true,json:async()=>({
   message:{content:opts.body.includes('"format":"json"')?'{"topic":"mail"}':'Пример ответа'}})};
 };
 const client=createLocalOllama({fetchImpl});
 await client.verifyInstalled();
 const data=await client.teacherJson('Создай урок');
 assert.equal(data.topic,'mail');
 await client.studentText('Что делать?');
 assert.equal(calls.length,3);
 assert.ok(calls.every(x=>x.url.startsWith('http://127.0.0.1:11434/')));
 assert.equal(JSON.parse(calls[1].opts.body).model,'qwen3:8b');
 assert.equal(JSON.parse(calls[2].opts.body).model,'qwen3:4b-instruct');
 assert.throws(()=>createLocalOllama({student:'qwen3:8b'}),/student-must-differ/);
 assert.throws(()=>createLocalOllama({teacher:'http://otherhost'}),/invalid-model/);
});

test('Experimental lessons persist locally, deduplicate and never deploy',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seyveo-school-'));
 try{
  const store=createSchoolStore({dir});
  const lesson=validateSyntheticExample(sample);
  const candidate={status:'candidate',id:lessonId(lesson),topic:'mail',
   sft:toSFT(lesson),referenceGrade:perfect,pupilGrade:failure};
  const summary={processed:1,counts:{candidate:1,rejected:0,passed:0}};
  const first=await store.locked(()=>store.appendRun(summary,[candidate]));
  assert.equal(first.added,1);
  const again=await store.locked(()=>store.appendRun(summary,[candidate]));
  assert.equal(again.added,0);
  const state=await store.load();
  assert.equal(state.candidates.length,1);
  const contents=await readFile(store.paths.exportFile,'utf8');
  assert.deepEqual(JSON.parse(contents.trim()),candidate.sft);
  assert.equal(state.candidates[0].status,'experimental-only');
 }finally{await rm(dir,{recursive:true,force:true})}
});

test('CLI dry-run never connects to Ollama or creates files',async()=>{
 assert.equal(parseArgs(['--count=2']).count,2);
 assert.throws(()=>parseArgs(['--count=25']),/от 1 до 24/);
 const messages=[];
 const result=await run(['--dry-run','--count=3'],{
  output:x=>messages.push(x),
  createClient:()=>{throw Error('must-not-contact-ollama')},
  createStore:()=>{throw Error('must-not-write')}
 });
 assert.equal(result.count,3);
 assert.ok(messages.some(x=>x.includes('Календарь')));
});
