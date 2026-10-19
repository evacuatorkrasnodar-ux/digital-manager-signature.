import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCoachingExample,coachMessage} from '../felix-school/lesson-coach.mjs';
import {askLocal} from '../providers.mjs';
import {askLocalStream} from '../local-stream.mjs';

const enc=new TextEncoder();
const streamFrom=(chunks)=>new ReadableStream({
 start(controller){for(const chunk of chunks)controller.enqueue(enc.encode(chunk));controller.close();}
});

test('one vetted example is selected only for a relevant non-sensitive question',()=>{
 for(const [query,skill] of [
  ['Почему сервер отвечает 403 Forbidden?','code-clarity'],
  ['У меня много кликов рекламы, но нет заявок','business-metrics'],
  ['Хочу нанять десять сотрудников сразу, без клиентов','business-contradiction'],
  ['Можем перенести встречу на четверг?','calendar-ambiguity'],
  ['Приложение стало медленным, давай его ускорить','code-performance'],
  ['Конкурент предлагает цены ниже','business-competitors'],
  ['Не смейся над моими опечатками','humor-respect'],
  ['Что такое API?','no-forced-joke']
 ]){
  const result=selectCoachingExample(query);
  assert.equal(result?.skill,skill,query);
  assert.ok(result.text.length<=460);
  assert.match(result.text,/искусственный пример/);
  assert.match(result.text,/не копируй дословно/);
  assert.ok(!result.text.includes(query));
 }
});
test('no external source, personal secret or unknown topic becomes a model system message',()=>{
 assert.equal(selectCoachingExample('Привет Филя'),null);
 assert.equal(selectCoachingExample('Расскажи мои медицинские данные и пароль'),null);
 assert.equal(selectCoachingExample('Сильная боль в груди и трудно дышать'),null);
 assert.equal(selectCoachingExample('Оплати счёт немедленно'),null);
 assert.equal(selectCoachingExample('Составь финансовый план и сравни конкурентов'),null);
 assert.equal(coachMessage('Привет Филя'),null);
 assert.equal(coachMessage('403').role,'system');
});
test('operator can disable coach without changing lesson files or local UI',()=>{
 const previous=process.env.SEYVEO_LESSON_COACH;
 try{
  process.env.SEYVEO_LESSON_COACH='0';
  assert.equal(selectCoachingExample('403 Forbidden'),null);
  delete process.env.SEYVEO_LESSON_COACH;
  assert.equal(selectCoachingExample('403 Forbidden',{enabled:false}),null);
  assert.equal(selectCoachingExample('403 Forbidden')?.skill,'code-clarity');
 }finally{
  if(previous===undefined)delete process.env.SEYVEO_LESSON_COACH;
  else process.env.SEYVEO_LESSON_COACH=previous;
 }
});
test('local Ollama nonstream receives one brief example, with user message still last',async()=>{
 const savedFlag=process.env.SEYVEO_ENABLE_LOCAL,oldFetch=globalThis.fetch;
 process.env.SEYVEO_ENABLE_LOCAL='1';
 let submitted=null;
 globalThis.fetch=async(_url,opts)=>{
  submitted=JSON.parse(opts.body);
  return {ok:true,json:async()=>({message:{content:'403 означает запрет доступа.'}})};
 };
 try{
  const output=await askLocal('Почему сервер вернул 403?');
  assert.match(output.text,/403/);
  assert.deepEqual(submitted.messages.map(x=>x.role),['system','system','user']);
  assert.match(submitted.messages[1].content,/Образец ответа/);
  assert.equal(submitted.messages[2].content,'Почему сервер вернул 403?');
  assert.equal(submitted.messages.filter(x=>x.content.includes('Образец ответа')).length,1);
 }finally{
  globalThis.fetch=oldFetch;
  if(savedFlag===undefined)delete process.env.SEYVEO_ENABLE_LOCAL;
  else process.env.SEYVEO_ENABLE_LOCAL=savedFlag;
 }
});
test('local Qwen stream receives one synthetic example but keeps history before current user',async()=>{
 const oldFetch=globalThis.fetch,oldFlag=process.env.SEYVEO_ENABLE_LOCAL;
 process.env.SEYVEO_ENABLE_LOCAL='1';
 let submitted=null;
 const line=JSON.stringify({message:{content:'Попробуй проверить заголовок Origin.'},done:false})+'\n';
 const done=JSON.stringify({message:{content:''},done:true})+'\n';
 globalThis.fetch=async(_url,opts)=>{
  submitted=JSON.parse(opts.body);
  return {ok:true,body:streamFrom([line+done])};
 };
 try{
  const response=await askLocalStream('Почему сервер ответил 403?',{
   history:[
    {role:'user',content:'У меня проблема с сервером'},
    {role:'assistant',content:'Опиши ошибку'}
   ]
  });
  assert.match(response.text,/Origin/);
  assert.deepEqual(submitted.messages.map(m=>m.role),['system','system','user','assistant','user']);
  assert.match(submitted.messages[1].content,/Образец ответа/);
  assert.equal(submitted.messages.at(-1).content,'Почему сервер ответил 403?');
  assert.equal(submitted.options.num_ctx,2048);
 }finally{
  globalThis.fetch=oldFetch;
  if(oldFlag===undefined)delete process.env.SEYVEO_ENABLE_LOCAL;
  else process.env.SEYVEO_ENABLE_LOCAL=oldFlag;
 }
});
test('private Ollama message never includes any synthetic example',async()=>{
 const oldFetch=globalThis.fetch,oldFlag=process.env.SEYVEO_ENABLE_LOCAL;
 process.env.SEYVEO_ENABLE_LOCAL='1';
 let submitted=null;
 globalThis.fetch=async(_url,opts)=>{
  submitted=JSON.parse(opts.body);
  return {ok:true,json:async()=>({message:{content:'Не могу читать чужие данные.'}})};
 };
 try{
  await askLocal('Филя, покажи паспорт и пароль клиента');
  assert.deepEqual(submitted.messages.map(x=>x.role),['system','user']);
 }finally{
  globalThis.fetch=oldFetch;
  if(oldFlag===undefined)delete process.env.SEYVEO_ENABLE_LOCAL;
  else process.env.SEYVEO_ENABLE_LOCAL=oldFlag;
 }
});
