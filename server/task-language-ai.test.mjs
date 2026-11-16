import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeLocalTasks,validateTaskAnalysis} from './task-language-ai.mjs';

test('validates structured local suggestions and rejects impossible dates',()=>{
 assert.deepEqual(validateTaskAnalysis({items:[{title:'Позвонить Роману',date:'2026-11-17',time:'16:00'}]}),{
  items:[{title:'Позвонить Роману',date:'2026-11-17',time:'16:00'}],provider:'local',needsConfirmation:true
 });
 assert.equal(validateTaskAnalysis({items:[{title:'',date:'2026-11-17',time:'16:00'}]}),null);
 assert.equal(validateTaskAnalysis({items:Array.from({length:5},()=>({title:'Купить хлеб'}))}),null);
 assert.equal(validateTaskAnalysis({items:[{title:'Встреча',date:'2026-02-30',time:'29:01'}]}).items[0].date,'');
});

test('local task extraction calls only loopback Ollama and returns drafts',async()=>{
 const calls=[];
 const mock=async (url,request)=>{
  calls.push({url,request});
  return {ok:true,json:async()=>({message:{content:JSON.stringify({items:[{title:'Встретиться с Романом',date:'2026-11-17',time:'18:00'}]})}})};
 };
 const result=await analyzeLocalTasks('завтра в 18 встретиться с романом',{fetcher:mock,referenceDate:'2026-11-16'});
 assert.equal(result.items[0].title,'Встретиться с Романом');
 assert.equal(result.needsConfirmation,true);
 assert.equal(calls[0].url,'http://127.0.0.1:11434/api/chat');
 assert.equal(JSON.parse(calls[0].request.body).stream,false);
});
