import test from 'node:test';
import assert from 'node:assert/strict';
import {askLocalStream,localOptionsFor} from '../local-stream.mjs';

const enc=new TextEncoder();
const ollamaLines=[
 {model:'qwen3:4b-instruct',message:{role:'assistant',content:'Привет, '},done:false},
 {model:'qwen3:4b-instruct',message:{role:'assistant',content:'я Феликс.'},done:false},
 {model:'qwen3:4b-instruct',message:{role:'assistant',content:''},done:true}
];
function mockReader(parts){
 return new ReadableStream({
  start(controller){
   for(const part of parts)controller.enqueue(enc.encode(part));
   controller.close();
  }
 });
}
test('Adaptive token budget chooses short, regular and business responses',()=>{
 assert.equal(localOptionsFor('Ответь коротко: кто ты?').num_predict,110);
 assert.equal(localOptionsFor('Привет!').num_predict,150);
 assert.equal(localOptionsFor('Расскажи что-нибудь интересное о путешествиях и городах в свободной форме').num_predict,150);
 assert.equal(localOptionsFor('Расскажи об обычных занятиях, свободном времени, путешествиях, городах, красивых местах и неторопливом отдыхе без дополнительных условий').num_predict,200);
 assert.equal(localOptionsFor('Предложи три конкретных шага найти клиентов для SEYVEO').num_predict,320);
 assert.equal(localOptionsFor('Подробно объясни но ответь коротко').num_predict,110);
 assert.equal(localOptionsFor('Привет').num_ctx,2048);
 assert.equal(localOptionsFor('Привет').num_thread,8);
});
test('Stream sends real partial tokens, with bounded local CPU options and no cloud',async()=>{
 const oldFlag=process.env.SEYVEO_ENABLE_LOCAL;
 const oldModel=process.env.SEYVEO_LOCAL_MODEL;
 const oldThreads=process.env.SEYVEO_LOCAL_THREADS;
 const oldFetch=globalThis.fetch;
 process.env.SEYVEO_ENABLE_LOCAL='1';
 process.env.SEYVEO_LOCAL_MODEL='qwen3:4b-instruct';
 process.env.SEYVEO_LOCAL_THREADS='6';
 const data=ollamaLines.map(v=>JSON.stringify(v)+'\n').join('');
 const received=[];
 let request=null;
 globalThis.fetch=async(url,opts)=>{
  request={url,opts};
  // Split NDJSON across UTF-8 chunks, including a Cyrillic word.
  return {ok:true,body:mockReader([data.slice(0,48),data.slice(48,88),data.slice(88)])};
 };
 try{
  const out=await askLocalStream('Ответь коротко: кто ты?',{onDelta:v=>received.push(v)});
  assert.deepEqual(received,['Привет, ','я Феликс.']);
  assert.equal(out.text,'Привет, я Феликс.');
  assert.equal(request.url,'http://127.0.0.1:11434/api/chat');
  const body=JSON.parse(request.opts.body);
  assert.equal(body.stream,true);
  assert.equal(body.keep_alive,'15m');
  assert.equal(body.options.num_predict,110);
  assert.equal(body.options.num_ctx,2048);
  assert.equal(body.options.num_thread,6);
  assert.match(body.messages[0].content,/Qwen3 4B/);
  assert.equal(request.opts.headers.authorization,undefined);
 }finally{
  globalThis.fetch=oldFetch;
  for(const [key,value] of [
   ['SEYVEO_ENABLE_LOCAL',oldFlag],
   ['SEYVEO_LOCAL_MODEL',oldModel],
   ['SEYVEO_LOCAL_THREADS',oldThreads]
  ]){
   if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
 }
});
test('Truncated or malformed streamed response never counts as complete',async()=>{
 const oldFetch=globalThis.fetch,oldFlag=process.env.SEYVEO_ENABLE_LOCAL;
 process.env.SEYVEO_ENABLE_LOCAL='1';
 globalThis.fetch=async()=>({
  ok:true,
  body:mockReader([JSON.stringify(ollamaLines[0])+'\n'])
 });
 try{
  await assert.rejects(()=>askLocalStream('Привет'),/incomplete-ollama-response/);
  globalThis.fetch=async()=>({ok:true,body:mockReader(['broken json\n'])});
  await assert.rejects(()=>askLocalStream('Привет'),/invalid-ollama-stream/);
 }finally{
  globalThis.fetch=oldFetch;
  if(oldFlag===undefined)delete process.env.SEYVEO_ENABLE_LOCAL;else process.env.SEYVEO_ENABLE_LOCAL=oldFlag;
 }
});
