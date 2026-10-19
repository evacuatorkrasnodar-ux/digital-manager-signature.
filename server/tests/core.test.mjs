import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMessage,decide,classify,MAX_MESSAGE_CHARS,responseUnavailable,safeInstruction} from '../hybrid-core.mjs';
import {askCloud,askLocal,availableModels} from '../providers.mjs';
import {respond} from '../brain.mjs';

test('rejects empty and excessive messages',()=>{
 assert.throws(()=>normalizeMessage('   '),RangeError);
 assert.throws(()=>normalizeMessage('x'.repeat(MAX_MESSAGE_CHARS+1)),RangeError);
 assert.equal(normalizeMessage(' Привет! '),'Привет!');
});
test('prefers local for routine requests',()=>{
 const route=decide('Привет, как дела?',{allowCloud:true},{local:true,cloud:true});
 assert.equal(route.route,'local');
 assert.equal(route.executionAllowed,false);
});
test('routes complex request to GPT-6 only with per-request cloud consent',()=>{
 const yes=decide('Проанализируй бизнес и стратегию',{allowCloud:true},{local:true,cloud:true});
 assert.equal(yes.route,'cloud');assert.equal(yes.proposedCloudModel,'gpt-6.1-sol');
 const no=decide('Проанализируй бизнес и стратегию',{allowCloud:false},{local:true,cloud:true});
 assert.equal(no.route,'local');
});
test('sensitive messages cannot be sent to cloud',()=>{
 const task='Мои секретные номера и медицинские записи';
 const choice=decide(task,{mode:'cloud',allowCloud:true},{local:false,cloud:true});
 assert.equal(choice.route,'unavailable');
 assert.equal(choice.privacy,'sensitive');
 assert.match(responseUnavailable(choice).text,/личные данные/);
});
test('private preference always blocks cloud',()=>{
 assert.equal(decide('Поговорим?',{mode:'private',allowCloud:true},{local:false,cloud:true}).route,'unavailable');
});
test('dangerous external actions require approval and are never executed',()=>{
 const plan=decide('Отправь деньги и удали документы',{allowCloud:true},{local:true,cloud:true});
 assert.equal(plan.humanApprovalRequired,true);
 assert.equal(plan.executionAllowed,false);
});
test('no fake AI when no provider connected',async()=>{
 const savedLocal=process.env.SEYVEO_ENABLE_LOCAL;
 const savedCloud=process.env.SEYVEO_ENABLE_CLOUD;
 process.env.SEYVEO_ENABLE_LOCAL='0';process.env.SEYVEO_ENABLE_CLOUD='0';
 try{
  const result=await respond({message:'Привет, Феликс'});
  assert.equal(result.status,'not-connected');
  assert.equal(result.executed,false);
 }finally{
  if(savedLocal===undefined)delete process.env.SEYVEO_ENABLE_LOCAL;else process.env.SEYVEO_ENABLE_LOCAL=savedLocal;
  if(savedCloud===undefined)delete process.env.SEYVEO_ENABLE_CLOUD;else process.env.SEYVEO_ENABLE_CLOUD=savedCloud;
 }
});
test('cloud adapter sends server-side key and never stores prompts at OpenAI',async()=>{
 const oldKey=process.env.OPENAI_API_KEY,oldFlag=process.env.SEYVEO_ENABLE_CLOUD,oldFetch=globalThis.fetch;
 process.env.OPENAI_API_KEY='dummy-key-for-local-test';
 process.env.SEYVEO_ENABLE_CLOUD='1';
 let received=null;
 globalThis.fetch=async(url,opts)=>{
  received={url,opts};
  return {ok:true,json:async()=>({output:[{type:'message',content:[{type:'output_text',text:'Проверочный ответ'}]}]})};
 };
 try{
  assert.equal(availableModels().cloud,true);
  const result=await askCloud('Привет',{name:'Феликс',model:'gpt-6-luna'});
  assert.equal(result.text,'Проверочный ответ');
  assert.equal(received.url,'https://api.openai.com/v1/responses');
  const body=JSON.parse(received.opts.body);
  assert.equal(body.store,false);
  assert.equal(body.max_output_tokens,700);
  assert.equal(body.model,'gpt-6-luna');
  assert.match(received.opts.headers.authorization,/^Bearer /);
  await assert.rejects(()=>askCloud('hi',{model:'unauthorized-model'}),/model-not-allowed/);
 }finally{
  globalThis.fetch=oldFetch;
  if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;
  if(oldFlag===undefined)delete process.env.SEYVEO_ENABLE_CLOUD;else process.env.SEYVEO_ENABLE_CLOUD=oldFlag;
 }
});

test('Felix uses installed Ollama qwen3 model on loopback by default',async()=>{
 const beforeFlag=process.env.SEYVEO_ENABLE_LOCAL;
 const beforeModel=process.env.SEYVEO_LOCAL_MODEL;
 const beforeFetch=globalThis.fetch;
 process.env.SEYVEO_ENABLE_LOCAL='1';
 delete process.env.SEYVEO_LOCAL_MODEL;
 let recorded=null;
 globalThis.fetch=async (url,opts)=>{
  recorded={url,opts};
  return {ok:true,json:async()=>({message:{content:'Привет, я Феликс.'}})};
 };
 try{
  const result=await askLocal('Привет!',{name:'Феликс'});
  assert.equal(result.model,'qwen3:4b-instruct');
  assert.equal(result.text,'Привет, я Феликс.');
  assert.equal(recorded.url,'http://127.0.0.1:11434/api/chat');
  const input=JSON.parse(recorded.opts.body);
  assert.equal(input.model,'qwen3:4b-instruct');
  assert.equal(input.messages[1].content,'Привет!');
  assert.match(input.messages[0].content,/не имя пользователя/);
 }finally{
  globalThis.fetch=beforeFetch;
  if(beforeFlag===undefined)delete process.env.SEYVEO_ENABLE_LOCAL;else process.env.SEYVEO_ENABLE_LOCAL=beforeFlag;
  if(beforeModel===undefined)delete process.env.SEYVEO_LOCAL_MODEL;else process.env.SEYVEO_LOCAL_MODEL=beforeModel;
 }
});
test('Felix and Milissa distinguish the assistant name from the person',()=>{
 assert.match(safeInstruction('Феликс'),/не называй его Феликсом/);
 assert.match(safeInstruction('Милисса'),/Ты Милисса/);
});

test('Felix handles typos and preserves original text formatting',()=>{
 const prompt=safeInstruction('Феликс');
 assert.match(prompt,/опечатки/);
 assert.match(prompt,/раскладке клавиатуры/);
 assert.match(prompt,/переносы строк/);
});
