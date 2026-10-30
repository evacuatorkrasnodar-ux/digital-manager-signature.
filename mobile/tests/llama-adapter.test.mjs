import test from 'node:test';
import assert from 'node:assert/strict';
import {createLlamaRnRuntime} from '../src/core/llamaRnAdapter.mjs';
import {createLocalInference} from '../src/core/localInference.mjs';
test('llama adapter works with native session contract',async()=>{
 const calls=[];
 const init=async params=>{
  calls.push(params);
  return {
   completion:async request=>({text:request.messages[1].content==='Ответь одним словом: готова.'?'готова':'Привет от Сэйви'}),
   release:async()=>{calls.push('release')}
  };
 };
 const runtime=createLlamaRnRuntime(init,{gpuLayers:0,contextSize:1024});
 const session=createLocalInference({runtime,modelPath:'file:///verified.gguf',integrityVerified:true});
 await session.initialize();
 assert.equal(session.status(),'ready');
 assert.equal(await session.reply('Привет'),'Привет от Сэйви');
 await session.unload();
 assert.equal(calls[0].model,'file:///verified.gguf');
 assert.equal(calls[0].n_gpu_layers,0);
 assert.equal(calls[1],'release');
});
test('invalid GGUF path is refused',async()=>{
 const runtime=createLlamaRnRuntime(async()=>{throw Error('must-not-load')});
 await assert.rejects(runtime.load('model.bin'),/invalid-gguf-path/);
});
