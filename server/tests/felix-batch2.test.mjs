import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateLocalFelix,validateCases,FELIX_EXAM_SUITES} from '../felix-school/evaluate.mjs';

const read=async(path)=>readFile(new URL(path,import.meta.url),'utf8');

test('batch 2 contains 32 independent synthetic high-quality dialogue examples',async()=>{
 const lines=(await read('../felix-school/lessons-batch2.jsonl')).trim().split(/\r?\n/u);
 assert.equal(lines.length,32);
 const skills=new Set(),questions=new Set();
 for(const line of lines){
  const item=JSON.parse(line);
  assert.match(item.skill,/^[a-z][a-z0-9-]+$/);
  assert.equal(item.messages.length,2);
  assert.deepEqual(item.messages.map(m=>m.role),['user','assistant']);
  assert.ok(item.messages.every(m=>typeof m.content==='string'&&m.content.trim().length>12));
  assert.ok(!skills.has(item.skill));
  assert.ok(!questions.has(item.messages[0].content));
  skills.add(item.skill);questions.add(item.messages[0].content);
 }
 for(const essential of ['self-correction','no-forced-joke','business-contradiction',
  'code-no-shell','medical-serious','care-boundaries','consent-no-history']){
  assert.ok(skills.has(essential),essential);
 }
});
test('held-out batch 2 exam is separate from teaching questions',async()=>{
 const train=(await read('../felix-school/lessons-batch2.jsonl')).trim().split(/\r?\n/u).map(JSON.parse);
 const trainingPrompts=new Set(train.map(v=>v.messages[0].content.trim().toLowerCase()));
 const baseline=(await read('../felix-school/lessons.jsonl')).trim().split(/\r?\n/u).map(JSON.parse);
 for(const row of baseline)trainingPrompts.add(row.messages[0].content.trim().toLowerCase());
 const persona=(await read('../felix-school/persona-lessons.jsonl')).trim().split(/\r?\n/u).map(JSON.parse);
 for(const row of persona)trainingPrompts.add(row.messages[0].content.trim().toLowerCase());
 const exam=JSON.parse(await read('../felix-school/exam-batch2.json'));
 assert.equal(exam.cases.length,20);
 assert.equal(validateCases(exam).length,20);
 assert.ok(exam.description.includes('Held-out'));
 for(const item of exam.cases){
  assert.ok(!trainingPrompts.has(item.input.trim().toLowerCase()),item.id);
  assert.ok(item.patterns.length>0);
  assert.ok(item.patterns.every(p=>typeof p==='string'));
 }
});
test('offline exam preview requires neither Ollama nor any paid API',async()=>{
 let contacted=false;
 const info=await evaluateLocalFelix({
  live:false,suite:'batch2',limit:20,
  fetchImpl:async()=>{contacted=true;throw Error('No network permitted');},
  log:()=>{}
 });
 assert.equal(info.status,'dry-run');
 assert.equal(info.total,20);
 assert.equal(contacted,false);
 assert.deepEqual(Object.keys(FELIX_EXAM_SUITES).sort(),['baseline','batch2']);
});
test('exam rejects arbitrary suite paths, overlong exam requests and unsafe limits',async()=>{
 await assert.rejects(()=>evaluateLocalFelix({suite:'../../secrets',live:false,log:()=>{}}),/invalid-exam-suite/);
 await assert.rejects(()=>evaluateLocalFelix({suite:'batch2',limit:0,live:false,log:()=>{}}),/invalid-exam-limit/);
 await assert.rejects(()=>evaluateLocalFelix({suite:'batch2',limit:100,live:false,log:()=>{}}),/invalid-exam-limit/);
});
