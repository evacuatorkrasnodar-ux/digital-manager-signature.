import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {safeInstruction} from '../hybrid-core.mjs';
import {selectCoachingExample,coachMessage} from '../felix-school/lesson-coach.mjs';
import {evaluateLocalFelix,validateCases,FELIX_EXAM_SUITES}
 from '../felix-school/evaluate.mjs';

async function load(path){return readFile(new URL(path,import.meta.url),'utf8')}

test('24 synthetic business lessons are well formed and teach different skills',async()=>{
 const lines=(await load('../felix-school/lessons-batch4-business.jsonl')).trim().split(/\r?\n/u);
 assert.equal(lines.length,24);
 const skills=new Set(),prompts=new Set();
 for(const line of lines){
  const item=JSON.parse(line);
  assert.match(item.skill,/^[a-z][a-z0-9-]+$/);
  assert.equal(item.messages.length,2);
  assert.deepEqual(item.messages.map(v=>v.role),['user','assistant']);
  assert.ok(item.messages.every(v=>typeof v.content==='string'&&v.content.length>20));
  assert.ok(!skills.has(item.skill));
  assert.ok(!prompts.has(item.messages[0].content));
  skills.add(item.skill);prompts.add(item.messages[0].content);
 }
 for(const skill of ['revenue-vs-profit','break-even-basic','margin-vs-markup',
  'cash-flow-vs-profit','tax-no-assumptions','humor-with-financial-stress'])assert.ok(skills.has(skill));
});

test('12 unseen exam prompts never duplicate lesson questions',async()=>{
 const existingFiles=['../felix-school/lessons.jsonl','../felix-school/persona-lessons.jsonl',
  '../felix-school/lessons-batch2.jsonl','../felix-school/lessons-batch3-dialogue.jsonl',
  '../felix-school/lessons-batch4-business.jsonl'];
 const examples=new Set();
 for(const f of existingFiles){
  const all=(await load(f)).trim().split(/\r?\n/u).map(JSON.parse);
  for(const row of all){
   for(const message of row.messages){
    if(message.role==='user')examples.add(message.content.trim().toLowerCase());
   }
  }
 }
 const exam=JSON.parse(await load('../felix-school/exam-batch4-business.json'));
 assert.equal(validateCases(exam).length,12);
 for(const row of exam.cases){
  assert.ok(!examples.has(row.input.trim().toLowerCase()),row.id);
 }
});
test('economic literacy rules are active in the normal Felix model instruction',()=>{
 const prompt=safeInstruction('Феликс');
 assert.match(prompt,/различай выручку, прибыль, денежный поток и прогноз/);
 assert.match(prompt,/не выдумывай расходы/);
 assert.match(prompt,/объясни спокойно почему/);
});
test('only bounded real-time model examples match arithmetic requests',()=>{
 for(const [request,skill] of [
  ['Выручка 50 тысяч, а какая прибыль?','revenue-vs-profit'],
  ['Сколько заказов до точки безубыточности?','break-even-basic'],
  ['Посчитай маржу с продаж','margin-vs-markup'],
  ['В отчёте прибыль, но на счёте денег нет','cash-flow-vs-profit']
 ]){
  const selected=selectCoachingExample(request);
  assert.equal(selected?.skill,skill,request);
  assert.ok(selected.text.length<=460);
  assert.match(selected.text,/не переноси числа/);
  assert.equal(coachMessage(request).role,'system');
 }
 assert.equal(selectCoachingExample('Я потерял все деньги из-за мошенников'),null);
 assert.equal(selectCoachingExample('Проанализируй мои банковские счета'),null);
});
test('exam is offline unless --live is explicitly set and supports batch4',async()=>{
 assert.equal(FELIX_EXAM_SUITES.batch4,'./exam-batch4-business.json');
 let calls=0;const messages=[];
 const result=await evaluateLocalFelix({suite:'batch4',limit:12,live:false,
  fetchImpl:async()=>{calls++;throw Error('network not allowed')},
  log:value=>messages.push(value)});
 assert.equal(result.status,'dry-run');
 assert.equal(result.total,12);
 assert.equal(calls,0);
 assert.ok(messages.some(s=>s.includes('dry-run')));
});
test('mocked local Ollama requests include rubric coaching without contacting GPT',async()=>{
 let calls=0,posted=null;
 const result=await evaluateLocalFelix({suite:'batch4',limit:1,live:true,log:()=>{},
  fetchImpl:async (url,opts)=>{
   calls++;
   assert.equal(url,'http://127.0.0.1:11434/api/chat');
   posted=JSON.parse(opts.body);
   return {ok:true,json:async()=>({message:{content:'75 000 − 52 000 = 23 000 ₽ прибыли до налогов.'}})};
  }
 });
 assert.equal(calls,1);
 assert.equal(result.status,'evaluated');
 assert.equal(result.total,1);
 assert.equal(result.passed,1);
 assert.equal(posted.messages.at(-1).role,'user');
 assert.equal(posted.messages.at(-1).content,
  'У студии оборот 75 000 рублей и все затраты 52 000 за тот же месяц. Сколько осталось до налогов?');
 assert.ok(posted.messages[0].content.includes('Феликс'));
});
