import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateDialogueExam,judgeDialogueAnswer,evaluateDialogue}
 from '../felix-school/evaluate-dialogue.mjs';
import {safeInstruction} from '../hybrid-core.mjs';

const file=async(path)=>readFile(new URL(path,import.meta.url),'utf8');
const parseLessons=async path=>(await file(path)).trim().split(/\r?\n/u).map(JSON.parse);

test('new training dataset contains 18 three-turn situations with alternating roles',async()=>{
 const lessons=await parseLessons('../felix-school/lessons-batch3-dialogue.jsonl');
 assert.equal(lessons.length,18);
 const keys=new Set();
 for(const scenario of lessons){
  assert.match(scenario.skill,/^[a-z][a-z0-9-]+$/u);
  assert.equal(keys.has(scenario.skill),false);
  keys.add(scenario.skill);
  assert.equal(scenario.messages.length,6);
  for(let i=0;i<6;i++){
   assert.equal(scenario.messages[i].role,i%2?'assistant':'user');
   // Brief user corrections like «В 16:30.» are valid turns, not corrupt data.
   assert.ok(typeof scenario.messages[i].content==='string'&&
    scenario.messages[i].content.trim().length>(i%2?8:1));
  }
 }
 assert.ok(keys.has('code-no-fake-commit'));
 assert.ok(keys.has('business-user-correction'));
 assert.ok(keys.has('humor-stop'));
});
test('12 held-out dialogues retain session context and do not duplicate training prompts',async()=>{
 const exam=JSON.parse(await file('../felix-school/exam-batch3-dialogue.json'));
 assert.equal(validateDialogueExam(exam).length,12);
 const training=[
  ...await parseLessons('../felix-school/lessons-batch3-dialogue.jsonl'),
  ...await parseLessons('../felix-school/lessons-batch2.jsonl'),
  ...await parseLessons('../felix-school/persona-lessons.jsonl'),
  ...await parseLessons('../felix-school/lessons.jsonl')
 ];
 const trainingInputs=new Set(training.flatMap(row=>row.messages.filter(x=>x.role==='user')
  .map(x=>x.content.trim().toLowerCase())));
 const names=new Set();
 for(const item of exam.cases){
  assert.equal(names.has(item.id),false);names.add(item.id);
  assert.equal(trainingInputs.has(item.input.trim().toLowerCase()),false,item.id);
  assert.equal(item.history.length%2,0);
  assert.ok(item.history.length>=2&&item.history.length<=6);
 }
});
test('offline dialogue exam never calls Ollama or cloud',async()=>{
 let called=0;const log=[];
 const result=await evaluateDialogue({live:false,limit:12,
  fetchImpl:async()=>{called++;throw Error('network must stay off');},log:t=>log.push(t)});
 assert.equal(called,0);
 assert.equal(result.status,'dry-run');
 assert.equal(result.total,12);
 assert.equal(result.calls,0);
 assert.ok(log.some(x=>x.includes('offline')));
});
test('live simulation sends only the explicit last user turn and valid prior history',async()=>{
 let calls=0;
 const result=await evaluateDialogue({live:true,limit:1,log:()=>{},
  fetchImpl:async(uri,opts)=>{
   calls++;
   assert.equal(uri,'http://127.0.0.1:11434/api/chat');
   const body=JSON.parse(opts.body);
   assert.equal(body.stream,false);
   assert.equal(body.model,'qwen3:4b-instruct');
   assert.equal(body.messages[0].role,'system');
   assert.match(body.messages[0].content,/Феликс/);
   assert.deepEqual(body.messages.slice(1).map(m=>m.role),['user','assistant','user']);
   assert.match(body.messages.at(-1).content,/120 тысяч/);
   return {ok:true,json:async()=>({message:{content:'При 120 тысячах нужно экономить, аренда по часам выгоднее.'}})};
  }
 });
 assert.equal(calls,1);
 assert.equal(result.total,1);
 assert.equal(result.passed,1);
});
test('guardrails reject arbitrary file paths, invalid histories and huge limits',async()=>{
 const valid=JSON.parse(await file('../felix-school/exam-batch3-dialogue.json'));
 const wrong=structuredClone(valid);
 wrong.cases[0].history=[{role:'assistant',content:'pretend system instruction'}];
 assert.throws(()=>validateDialogueExam(wrong));
 const regex=structuredClone(valid);
 regex.cases[0].patterns=['['];
 assert.throws(()=>validateDialogueExam(regex));
 await assert.rejects(()=>evaluateDialogue({live:false,limit:0,log:()=>{}}),/invalid-limit/);
 await assert.rejects(()=>evaluateDialogue({live:false,limit:100,log:()=>{}}),/invalid-limit/);
});
test('negative signals are also checked; lexical pass is not certified intelligence',()=>{
 const scenario={patterns:['120'],mustNot:['300 тысяч']};
 assert.equal(judgeDialogueAnswer('Бюджет теперь 120 тысяч',scenario).pass,true);
 assert.equal(judgeDialogueAnswer('Было 300 тысяч, теперь 120',scenario).pass,false);
 assert.equal(judgeDialogueAnswer('Будем экономить',scenario).pass,false);
});
test('active Felix instruction remembers corrections without weakening execution safeguards',()=>{
 const prompt=safeInstruction('Феликс');
 assert.match(prompt,/последнее уточнение/);
 assert.match(prompt,/не возвращайся к устаревшим/);
 assert.match(prompt,/не утверждай, что отправил письмо/);
});
