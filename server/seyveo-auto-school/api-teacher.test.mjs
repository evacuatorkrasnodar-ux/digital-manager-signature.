import test from 'node:test';
import assert from 'node:assert/strict';
import {createApiTeacher} from './api-teacher.mjs';
import {parseArgs} from './run.mjs';

test('API teaching must be separately selected and require key',()=>{
 assert.equal(parseArgs([]).teacherApi,false);
 assert.equal(parseArgs(['--teacher-api']).teacherApi,true);
 assert.throws(()=>createApiTeacher({env:{}}),/openai-api-key-missing/);
});
test('teacher sends only supplied synthetic prompt, no chat or audio',async()=>{
 let seen;
 const fetchImpl=async(url,options)=>{
  seen={url,options};
  return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:'{"topic":"mail"}'}]}]})};
 };
 const teacher=createApiTeacher({env:{OPENAI_API_KEY:'test-only'},fetchImpl});
 assert.deepEqual(await teacher.generate('Создай вымышленные примеры. Только синтетические данные.'),{topic:'mail'});
 assert.equal(seen.url,'https://api.openai.com/v1/responses');
 const body=JSON.parse(seen.options.body);
 assert.equal(body.store,false);
 assert.equal(body.input,'Создай вымышленные примеры. Только синтетические данные.');
 assert.equal('messages' in body,false);
});
test('reject arbitrary private prompts before sending',async()=>{
 const teacher=createApiTeacher({env:{OPENAI_API_KEY:'fake'},fetchImpl:()=>{throw Error('must not call')}});
 await assert.rejects(teacher.generate('Поговори с клиентом'),/synthetic-prompt-required/);
});
