import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalInference} from '../src/core/localInference.mjs';

test('does not accept a missing native runtime',()=>{
 assert.throws(()=>createLocalInference({modelPath:'verified.gguf',integrityVerified:true}),/native-runtime-required/);
});
test('requires a successful native probe before replying',async()=>{
 const calls=[];
 const runtime={
  load:async path=>calls.push('load:'+path),
  complete:async (prompt)=>{calls.push('complete');return prompt.startsWith('Ответь')?'готова':'Локальный ответ';},
  unload:async()=>calls.push('unload')
 };
 const session=createLocalInference({runtime,modelPath:'verified.gguf',integrityVerified:true});
 await assert.rejects(session.reply('Привет'),/not-ready/);
 await session.initialize();
 assert.equal(session.status(),'ready');
 assert.equal(await session.reply('Привет'),'Локальный ответ');
 await session.unload();
 assert.equal(session.status(),'unloaded');
 assert.deepEqual(calls,['load:verified.gguf','complete','complete','unload']);
});
test('failed native probe never marks model ready',async()=>{
 let unloaded=false;
 const session=createLocalInference({modelPath:'verified.gguf',integrityVerified:true,runtime:{
  load:async()=>{}, complete:async()=>'', unload:async()=>{unloaded=true}
 }});
 await assert.rejects(session.initialize(),/unavailable/);
 assert.equal(session.status(),'unloaded');
 assert.equal(unloaded,true);
});

test('unverified model is rejected before calling native runtime',()=>{
 assert.throws(()=>createLocalInference({modelPath:'unverified.gguf',runtime:{}}),/model-integrity-unverified/);
});
