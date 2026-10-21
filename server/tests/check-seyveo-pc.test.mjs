import test from 'node:test';
import assert from 'node:assert/strict';
import {REQUIRED_MODEL,OLLAMA_LOCAL,installedModelNames,checkModelInventory,inspectPc}
 from '../check-seyveo-pc.mjs';

test('local-only preflight endpoint is never a public or cloud address',()=>{
 assert.equal(OLLAMA_LOCAL,'http://127.0.0.1:11434/api/tags');
 assert.equal(REQUIRED_MODEL,'qwen3:4b-instruct');
});
test('inventory rejects malformed names and does not invent installed models',()=>{
 assert.deepEqual(installedModelNames(null),[]);
 assert.deepEqual(installedModelNames({models:[null,{name:' '},{name:'qwen3:4b-instruct'},{}]}),
  ['qwen3:4b-instruct']);
 assert.equal(checkModelInventory(['other-model']).ready,false);
 assert.equal(checkModelInventory([REQUIRED_MODEL]).ready,true);
});
test('successful probe is read-only GET and reports installed model',async()=>{
 const logs=[],requests=[];
 const result=await inspectPc({
  fetchFn:async (url,options)=>{
   requests.push({url,method:options.method,redirect:options.redirect});
   return {ok:true,json:async()=>({models:[{name:REQUIRED_MODEL}]})};
  },report:line=>logs.push(line)
 });
 assert.equal(result.ollamaOnline,true);
 assert.equal(result.modelReady,true);
 assert.deepEqual(requests,[{url:OLLAMA_LOCAL,method:'GET',redirect:'error'}]);
 assert.ok(logs.some(x=>x.includes('no external network')));
});
test('missing Ollama and missing model do not count as ready',async()=>{
 const silent=()=>{};
 const absent=await inspectPc({fetchFn:async()=>{throw Error('offline')},report:silent});
 assert.equal(absent.ollamaOnline,false);
 assert.equal(absent.modelReady,false);
 const missing=await inspectPc({fetchFn:async()=>({ok:true,json:async()=>({models:[]})}),report:silent});
 assert.equal(missing.ollamaOnline,true);
 assert.equal(missing.modelReady,false);
});
