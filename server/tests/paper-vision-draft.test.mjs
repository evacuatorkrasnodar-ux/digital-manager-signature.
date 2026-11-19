import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {proposeLocalPaperDraft} from '../paper-vision-draft.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const output={version:1,title:'Дерево',strokes:[{points:[[.4,.2],[.4,.8]]}]};
const withOptIn=async fn=>{
 const old=process.env.SEYVEO_ENABLE_PAPER_AI;
 process.env.SEYVEO_ENABLE_PAPER_AI='1';
 try{return await fn()}
 finally{if(old===undefined)delete process.env.SEYVEO_ENABLE_PAPER_AI;
  else process.env.SEYVEO_ENABLE_PAPER_AI=old}
};

test('private Paper draft is disabled until the operator enables it',async()=>{
 const old=process.env.SEYVEO_ENABLE_PAPER_AI;
 delete process.env.SEYVEO_ENABLE_PAPER_AI;
 try{
  await assert.rejects(()=>proposeLocalPaperDraft({mode:'draw',request:'дерево'},
   {fetcher:()=>{throw Error('must-not-send')}}),/paper-ai-not-configured/);
 }finally{if(old!==undefined)process.env.SEYVEO_ENABLE_PAPER_AI=old}
});

test('only a fixed loopback model receives an explicit text request',async()=>withOptIn(async()=>{
 let calls=0;
 const result=await proposeLocalPaperDraft({mode:'draw',request:'Нарисуй дерево'},
  {model:'qwen2.5vl:3b',fetcher:async(url,options)=>{
   calls++;
   assert.equal(url,'http://127.0.0.1:11434/api/chat');
   assert.equal(options.method,'POST');
   const body=JSON.parse(options.body);
   assert.equal(body.stream,false);
   assert.equal(body.format,'json');
   assert.match(body.messages[0].content,/Нарисуй дерево/);
   assert.equal(body.messages[0].images,undefined);
   return {ok:true,json:async()=>({message:{content:JSON.stringify(output)}})};
  }});
 assert.equal(calls,1);
 assert.equal(result.requiresConfirmation,true);
 assert.equal(result.originalUntouched,true);
 assert.equal(result.strokes[0].points[0][0],336);
 assert.equal(result.provider,'local');
 assert.equal(result.source,'model-proposal');
}));

test('bad model output and unsafe requests never reach the Paper editor',async()=>withOptIn(async()=>{
 const fake=async()=>({ok:true,json:async()=>({message:{content:'<script>alert(1)</script>'}})});
 await assert.rejects(()=>proposeLocalPaperDraft({mode:'draw',request:'дом'},{fetcher:fake}),/invalid-draft-json/);
 await assert.rejects(()=>proposeLocalPaperDraft({mode:'improve',request:'дом'},{fetcher:fake}),/unsupported-paper-mode/);
 await assert.rejects(()=>proposeLocalPaperDraft({mode:'draw',request:'дом'},{model:'evil/../api',fetcher:fake}),/invalid-model/);
 await assert.rejects(()=>proposeLocalPaperDraft({mode:'draw',request:'дом',height:9000},{fetcher:fake}),/invalid-paper-size/);
 await assert.rejects(()=>proposeLocalPaperDraft({mode:'draw',request:'а'.repeat(600)},{fetcher:fake}),/invalid-request/);
 const server=readFileSync(resolve(root,'server/http.mjs'),'utf8');
 assert.match(server,/\/v1\/paper-draft/);
 assert.match(server,/validToken\(req\.headers\.authorization\)/);
 assert.match(server,/validOrigin\(req\.headers\.origin\)/);
}));
