import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {inspectLocalPaperModel} from '../paper-model-health.mjs';
import {checkPaperModelForLauncher} from '../check-paper-model.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const response=models=>new Response(JSON.stringify({models}),{
 status:200,headers:{'content-type':'application/json'}
});

test('Paper readiness is fully disabled until explicit local opt-in',async()=>{
 let calls=0;
 const r=await inspectLocalPaperModel({enabled:false,fetcher:()=>{calls++;throw Error('network')}});
 assert.equal(r.status,'disabled');
 assert.equal(r.enabled,false);
 assert.equal(r.localOnly,true);
 assert.equal(calls,0);
});

test('fixed loopback status shows ready only when the exact selected model exists',async()=>{
 const calls=[];
 const fetcher=async(url,opts)=>{
  calls.push({url,opts});
  return response([{name:'qwen2.5vl:3b'},{name:'qwen3:4b-instruct'}]);
 };
 const ready=await inspectLocalPaperModel({enabled:true,model:'qwen2.5vl:3b',fetcher});
 assert.equal(ready.status,'ready');
 assert.equal(ready.enabled,true);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'http://127.0.0.1:11434/api/tags');
 assert.equal(calls[0].opts.redirect,'error');
 assert.equal(calls[0].opts.cache,'no-store');
 assert.equal(calls[0].opts.method,'GET');
 assert.equal(calls[0].opts.body,undefined);
 const missing=await inspectLocalPaperModel({enabled:true,model:'qwen2.5vl:7b',fetcher});
 assert.equal(missing.status,'model-not-installed');
 assert.equal(missing.enabled,false);
});

test('offline, invalid responses, hostile names and huge tags fail closed',async()=>{
 for(const fetcher of [
  async()=>{throw Error('offline')},
  async()=>new Response('',{status:503}),
  async()=>new Response('not json'),
  async()=>new Response('x'.repeat(130_000)),
  async()=>new Response('{}',{headers:{'content-length':'500000'}}),
  async()=>response({name:'qwen2.5vl:3b'}),
  async()=>response(Array.from({length:501},()=>({name:'qwen2.5vl:3b'})))
 ]){
  const status=await inspectLocalPaperModel({enabled:true,fetcher});
  assert.equal(status.enabled,false);
  assert.equal(status.status,'ollama-offline');
 }
 let calls=0;
 const hostile=await inspectLocalPaperModel({enabled:true,model:'qwen/../../example',
  fetcher:()=>{calls++;throw Error('never call')}});
 assert.equal(hostile.status,'invalid-configuration');
 assert.equal(calls,0);
});

test('Windows launcher has visible consent before any model download',async()=>{
 const ready=await checkPaperModelForLauncher({inspect:async()=>({status:'ready'})});
 assert.equal(ready.exitCode,0);
 assert.equal((await checkPaperModelForLauncher({
  inspect:async()=>({status:'model-not-installed'})
 })).exitCode,2);
 assert.equal((await checkPaperModelForLauncher({
  inspect:async()=>({status:'ollama-offline'})
 })).exitCode,3);
 const script=readFileSync(resolve(root,'server/start-paper-ai.cmd'),'utf8');
 assert.match(script,/set "OLLAMA_HOST=127\.0\.0\.1:11434"/);
 assert.match(script,/set "SEYVEO_ENABLE_CLOUD=0"/);
 assert.match(script,/choice \/C YN/);
 assert.match(script,/if errorlevel 2 goto :cancelled/);
 assert.match(script,/ollama pull qwen2\.5vl:3b/);
 assert.ok(script.indexOf('choice /C YN')<script.indexOf('ollama pull qwen2.5vl:3b'));
 assert.match(script,/node "%~dp0real-app-local\.mjs"/);
 const local=readFileSync(resolve(root,'server/real-app-local.mjs'),'utf8');
 assert.match(local,/send\(res,200,await inspectLocalPaperModel\(\)\)/);
 const ui=readFileSync(resolve(root,'assets/seyveo-paper-ai-workbench.js'),'utf8');
 assert.match(ui,/data\.enabled===true&&data\.status==='ready'/);
 assert.doesNotMatch(script,/SEYVEO_ENABLE_CLOUD=1/);
});
