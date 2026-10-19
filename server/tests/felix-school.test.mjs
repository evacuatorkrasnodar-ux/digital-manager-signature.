import test from 'node:test';
import assert from 'node:assert/strict';
import {gradeAnswer,validateCases,evaluateLocalFelix} from '../felix-school/evaluate.mjs';

test('school guards malformed and duplicate evaluation prompts',()=>{
 assert.throws(()=>validateCases({version:1,cases:[{id:'one',input:'hi',patterns:['hello']},{id:'one',input:'hello',patterns:['hello']}]}),/duplicate/);
 assert.throws(()=>validateCases({version:1,cases:[{id:'safe-1',input:'Hi',patterns:['[']}]}));
});
test('school scores only declared diagnostic signals',()=>{
 assert.equal(gradeAnswer('Привет, Филя!', ['привет','фил'])[0].pass,true);
 assert.equal(gradeAnswer('Не могу открыть телефон', ['нет доступа'])[0].pass,false);
});
test('school dry-run never contacts Ollama or cloud',async()=>{
 let networkCalls=0;const logs=[];
 const result=await evaluateLocalFelix({live:false,fetchImpl:async()=>{networkCalls++;throw Error('Network disabled')},log:message=>logs.push(message)});
 assert.equal(result.status,'dry-run');
 assert.equal(result.total,6);
 assert.equal(networkCalls,0);
 assert.ok(logs.some(x=>x.includes('dry-run')));
});
