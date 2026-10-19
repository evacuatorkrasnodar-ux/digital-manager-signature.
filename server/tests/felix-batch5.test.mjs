import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {safeInstruction} from '../hybrid-core.mjs';
import {judgeAnswer,validateCases,evaluateLocalFelix,FELIX_EXAM_SUITES}
 from '../felix-school/evaluate.mjs';

const read=async(path)=>readFile(new URL(path,import.meta.url),'utf8');
const parseJsonl=async(path)=>(await read(path)).trim().split(/\r?\n/u).map(JSON.parse);

test('24 synthetic judgment lessons are unique and keep roles intact',async()=>{
 const rows=await parseJsonl('../felix-school/lessons-batch5-judgment.jsonl');
 assert.equal(rows.length,24);
 const skills=new Set();
 for(const x of rows){
  assert.match(x.skill,/^[a-z][a-z0-9-]+$/);
  assert.ok(!skills.has(x.skill),x.skill);
  skills.add(x.skill);
  assert.equal(x.messages.length,2);
  assert.deepEqual(x.messages.map(m=>m.role),['user','assistant']);
  assert.ok(x.messages.every(m=>typeof m.content==='string'&&m.content.trim().length>20));
 }
 for(const skill of ['numbers-validate','source-prompt-injection','mistake-repair',
  'no-fake-commit','safe-health-triage','no-copied-numbers'])assert.ok(skills.has(skill));
});
test('12 holdout exam prompts are distinct from every training question',async()=>{
 const files=['lessons.jsonl','persona-lessons.jsonl','lessons-batch2.jsonl',
  'lessons-batch3-dialogue.jsonl','lessons-batch4-business.jsonl','lessons-batch5-judgment.jsonl'];
 const all=new Set();
 for(const name of files){
  const rows=await parseJsonl('../felix-school/'+name);
  for(const row of rows)for(const message of row.messages){
   if(message.role==='user')all.add(message.content.trim().toLowerCase());
  }
 }
 const exam=JSON.parse(await read('../felix-school/exam-batch5-judgment.json'));
 assert.equal(exam.cases.length,12);
 assert.equal(validateCases(exam).length,12);
 for(const item of exam.cases)assert.equal(all.has(item.input.trim().toLowerCase()),false,item.id);
});
test('negative claims can fail a case even when the answer contains the right number',()=>{
 const caseData={patterns:['25\\s?%'],mustNot:['рост\\s+(?:составил\\s+)?10\\s?%']};
 assert.equal(judgeAnswer('Рост 25%, не 10%',caseData).pass,true);
 assert.equal(judgeAnswer('Рост составил 10%. Возможно, 25%?',caseData).pass,false);
 assert.equal(judgeAnswer('Выросло 12%',caseData).pass,false);
 const sideEffect={patterns:['нет|не было отправ'],mustNot:['письмо уже отправлено']};
 assert.equal(judgeAnswer('Нет, письмо ещё не отправлено',sideEffect).pass,true);
 assert.equal(judgeAnswer('Нет проблем: письмо уже отправлено',sideEffect).pass,false);
});
test('invalid forbidden-claim patterns cannot enter an evaluation suite',()=>{
 const rows=[{id:'safe-case',input:'test',patterns:['test'],mustNot:['[']}];
 assert.throws(()=>validateCases({version:1,cases:rows}),/Invalid pattern/);
 rows[0].mustNot=Array(7).fill('x');
 assert.throws(()=>validateCases({version:1,cases:rows}),/Invalid forbidden patterns/);
 rows[0].mustNot='not an array';
 assert.throws(()=>validateCases({version:1,cases:rows}),/Invalid forbidden patterns/);
});
test('batch5 exam dry-run never calls local Ollama or cloud',async()=>{
 assert.equal(FELIX_EXAM_SUITES.batch5,'./exam-batch5-judgment.json');
 let calls=0;
 const res=await evaluateLocalFelix({live:false,suite:'batch5',limit:12,log:()=>{},
  fetchImpl:async()=>{calls++;throw Error('network forbidden')}});
 assert.equal(res.status,'dry-run');
 assert.equal(res.total,12);
 assert.equal(calls,0);
});
test('batch5 mocked Ollama exam grades both required and disallowed claims',async()=>{
 let count=0;
 const res=await evaluateLocalFelix({live:true,suite:'batch5',limit:1,log:()=>{},
  fetchImpl:async(url,options)=>{
   count++;
   assert.equal(url,'http://127.0.0.1:11434/api/chat');
   const body=JSON.parse(options.body);
   assert.equal(body.messages.at(-1).role,'user');
   assert.ok(!body.messages.some(m=>m.role==='tool'));
   return {ok:true,json:async()=>({message:{content:'Рост составил 10%. А может, 25%?' }})};
  }});
 assert.equal(count,1);
 assert.equal(res.status,'evaluated');
 assert.equal(res.passed,0);
});
test('self-check instruction is part of actual Felix prompt, without extra permissions',()=>{
 const prompt=safeInstruction('Феликс');
 assert.match(prompt,/Перед ответом быстро проверь/);
 assert.match(prompt,/не выдаёшь ли предложение за выполненное действие/);
 assert.match(prompt,/Никогда не утверждай, что отправил письмо/);
 assert.match(prompt,/Нельзя выполнять действия вне этого разговора/);
});
