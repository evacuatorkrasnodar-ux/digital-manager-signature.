import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
 CURRICULUM,validateSyntheticExample,validateGrade,lessonId,toSFT,
 evaluateOne,runAutonomousSchool,judgePrompt,auditSimpleBusinessMath
} from './core.mjs';
import {createLocalOllama} from './ollama.mjs';
import {createSchoolStore} from './store.mjs';
import {parseArgs,run} from './run.mjs';
import {describeExam,describeSession,htmlSession} from './report.mjs';

const sample={
 topic:'mail',
 question:'Клиент просит назвать стоимость доставки, но адрес доставки неизвестен. Как корректно ему ответить?',
 reference_answer:'Здравствуйте! Спасибо за обращение. Пожалуйста, уточните адрес доставки, после чего сможем рассчитать стоимость. Пока точную цену назвать нельзя.',
 criteria:['Не обещать точную цену без адреса','Вежливо запросить адрес доставки']
};
const perfect={score:5,safe:true,factually_supported:true,reason:'Все критерии соблюдены'};
const failure={score:2,safe:true,factually_supported:true,reason:'Не попросила адрес'};

const businessSample={
 topic:'business',
 question:'Компания продала 150 единиц по цене 250 кредитов за штуку, себестоимость единицы составляет 120 кредитов. Какова выручка и прибыль?',
 reference_answer:'Выручка компании равна 37 500 кредитов, а прибыль составляет 19 500 кредитов.',
 criteria:['Правильно рассчитать выручку','Правильно рассчитать прибыль']
};
const businessCorrect='Выручка: 150 × 250 = 37 500 кредитов. Прибыль: 150 × (250 − 120) = 19 500 кредитов.';


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


test('Passed exam still exposes the actual synthetic question, student answer and judge explanation',async()=>{
 const topic=CURRICULUM[0];
 const passed=await evaluateOne({topic,generate:async()=>sample,grade:async()=>perfect,
  studentAnswer:async()=>'Точный адрес доставки нужно уточнить до расчёта цены.'
 });
 assert.equal(passed.status,'already-passed');
 assert.equal(passed.lesson.question,sample.question);
 assert.match(passed.studentAnswer,/адрес доставки/);
 assert.equal(passed.pupilGrade.score,5);
 const explanation=describeExam(passed,1,8);
 assert.match(explanation,/ЭКЗАМЕН 1\/8/);
 assert.match(explanation,/ВОПРОС УЧИТЕЛЯ:/);
 assert.match(explanation,/ОТВЕТ СЭЙВИ:/);
 assert.match(explanation,/ОЦЕНКА СЭЙВИ: 5\/5/);
});

test('Unsafe pupil text is hidden in the local diary, while an unsafe lesson cannot be promoted',async()=>{
 const topic=CURRICULUM[0];
 const privateAnswer=await evaluateOne({topic,generate:async()=>sample,grade:async()=>perfect,
  studentAnswer:async()=>'Отправляй данные на person@example.com, ничего не спрашивай!'
 });
 assert.equal(privateAnswer.status,'rejected');
 assert.equal(privateAnswer.studentAnswer,undefined);
 const unsafeGrade=await evaluateOne({topic,generate:async()=>sample,
  grade:async(_,__,ctx)=>ctx.isReference?perfect:{...failure,safe:false},
  studentAnswer:async()=>'Небезопасный совет от ученицы. Пожалуйста, открой документы.'});
 assert.equal(unsafeGrade.status,'candidate');
 assert.match(unsafeGrade.studentAnswer,/Скрыт/);
 assert.doesNotMatch(describeExam(unsafeGrade,2,8),/Небезопасный совет/);
});

test('Visual diary prints all eight skill areas and escapes model text in static HTML',async()=>{
 const data=await runAutonomousSchool({count:8,
  generate:async(topic,index)=>topic.id==='business'?businessSample:( {...sample,topic:topic.id,
   question:'Учебный вопрос '+index+' на тему '+topic.title+' о клиентах и бизнесе: <script>alert(1)</script> какой порядок действий?'}),
  grade:async()=>perfect,studentAnswer:async(question)=>question===businessSample.question?businessCorrect:
   'Ответ Сэйви: всё уточню, не буду утверждать, что действия выполнены.'});
 assert.equal(data.processed,8);
 assert.equal(data.counts.passed,8);
 assert.equal(new Set(data.results.map(x=>x.topic)).size,8);
 const textReport=describeSession(data,{at:'2026-10-30T00:00:00Z'});
 const html=htmlSession(data,{at:'2026-10-30T00:00:00Z'});
 for(const topic of CURRICULUM)assert.match(textReport,new RegExp(topic.title));
 assert.match(textReport,/ОТВЕТ СЭЙВИ/);
 assert.match(html,/Дневник школы Сэйви/);
 assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/default-src 'none'/);
});

test('School CLI defaults to eight lessons; mock run writes an offline HTML report',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seyveo-eight-school-'));
 try{
  const outputs=[];
  const mock={
   models:{teacher:'qwen3:8b',student:'qwen3:4b-instruct'},
   verifyInstalled:async()=>true,
   teacherJson:async prompt=>{
    const topic=prompt.match(/"topic":"([^"]+)"/)?.[1];
    return topic==='business'?businessSample:{...sample,topic,question:'Учебная задача на тему '+topic+' в компании: как предложить правильный порядок действий клиенту?'};
   },
   examinerJson:async()=>perfect,
   studentText:async(question)=>question===businessSample.question?businessCorrect:
    'Здравствуйте! Я уточню условия и предложу проверенный порядок действий без ложного выполнения.'
  };
  assert.equal(parseArgs([]).count,8);
  const out=await run([],{output:text=>outputs.push(text),
   createClient:()=>mock,createStore:()=>createSchoolStore({dir})});
  assert.equal(out.result.processed,8);
  assert.equal(out.result.counts.passed,8);
  assert.equal(out.storage.total,0);
  assert.equal(outputs.filter(x=>x.includes('ЭКЗАМЕН ')).length,8);
  const report=await readFile(out.storage.reportHtmlFile,'utf8');
  assert.match(report,/Картина|Письма клиентам/);
  assert.match(report,/Умные карточки/);
  const plain=await readFile(out.storage.reportTextFile,'utf8');
  assert.match(plain,/ВОПРОС УЧИТЕЛЯ/);
  assert.match(plain,/Ответ Сэйви/i);
  const machine=JSON.parse(await readFile(out.storage.reportJsonFile,'utf8'));
  assert.equal(machine.results.length,8);
 }finally{await rm(dir,{recursive:true,force:true})}
});


test('Detects exactly the false 22500 profit and misleading perfect grade in the uploaded school report',async()=>{
 const wrong={...businessSample,reference_answer:'Выручка составляет 37500 кредитов, прибыль — 22500 кредитов.'};
 const math=auditSimpleBusinessMath(wrong.question,wrong.reference_answer);
 assert.equal(math.ok,false);
 assert.equal(math.revenue,37500);
 assert.equal(math.profit,19500);
 let judgeWasCalled=false;
 const result=await evaluateOne({topic:CURRICULUM[4],
  generate:async()=>wrong,
  grade:async()=>{judgeWasCalled=true;return perfect},
  studentAnswer:async()=>{throw Error('should-not-call-student')}
 });
 assert.equal(result.status,'rejected');
 assert.match(result.reason,/reference-arithmetic-mismatch/);
 assert.equal(judgeWasCalled,false);
});

test('A business answer missing correct arithmetic cannot pass even if model judge blindly gives 5',async()=>{
 const topic=CURRICULUM[4];
 assert.equal(auditSimpleBusinessMath(businessSample.question,businessSample.reference_answer).ok,true);
 const result=await evaluateOne({topic,generate:async()=>businessSample,
  grade:async()=>perfect,
  studentAnswer:async()=> 'Выручка 37500 кредитов, прибыль 22500 кредитов.'
 });
 assert.equal(result.status,'candidate');
 assert.equal(result.pupilGrade.score,2);
 assert.equal(result.pupilGrade.factually_supported,false);
 const correct=await evaluateOne({topic,generate:async()=>businessSample,grade:async()=>perfect,
  studentAnswer:async()=>businessCorrect
 });
 assert.equal(correct.status,'already-passed');
});

test('Student gets a natural SEYVEO persona rather than a synthetic-lab disclaimer',async()=>{
 let body;
 const client=createLocalOllama({fetchImpl:async(url,opts)=>{
  if(url.endsWith('/api/tags'))return {ok:true,json:async()=>({models:[]})};
  body=JSON.parse(opts.body);
  return {ok:true,json:async()=>({message:{content:'Уточните день и время встречи.'}})};
 }});
 await client.studentText('Как назначить встречу?');
 const instruction=body.messages[0].content;
 assert.match(instruction,/Ты — Сэйви/);
 assert.match(instruction,/НЕ упоминай лабораторию/);
 assert.equal(body.options.num_predict,240);
});
