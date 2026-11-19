import test from 'node:test';
import assert from 'node:assert/strict';
import {createRemotePaperDraftHandler} from '../paper-remote-contract.mjs';

const apiOrigin='https://api.seyveo.com';
const appOrigin='https://evacuatorkrasnodar-ux.github.io';
const token='test.token.with-verifier.2026';
const sketch=JSON.stringify({version:1,title:'Дерево',strokes:[{points:[[.2,.2],[.4,.7]]}]});
const input={mode:'draw',request:'Нарисуй дерево',width:840,height:1188};
const create=(overrides={})=>createRemotePaperDraftHandler({apiOrigin,appOrigins:[appOrigin],
 identity:{identifyVerifiedPerson:async()=>({userId:'roman',sessionId:'session-1'})},
 generateSketchJson:async()=>sketch,...overrides});
const request=(body=input,options={})=>new Request(apiOrigin+'/v1/paper/draft',{
 method:'POST',headers:{origin:appOrigin,authorization:'Bearer '+token,
  'content-type':'application/json','x-seyveo-paper-consent':'yes',...options.headers},
 body:JSON.stringify(body)
});

test('remote Paper contract cannot be activated without an exact HTTPS origin and verified identity',()=>{
 assert.throws(()=>create({apiOrigin:'http://api.seyveo.com'}),/exact-https/);
 assert.throws(()=>create({appOrigins:['*']}));
 assert.throws(()=>create({identity:null}),/verified-identity/);
});

test('consented verified request returns only validated, unapplied drawing strokes',async()=>{
 const calls=[];
 const handler=create({generateSketchJson:async data=>{calls.push(data);return sketch}});
 const response=await handler(request());
 assert.equal(response.status,200);
 assert.equal(response.headers.get('access-control-allow-origin'),appOrigin);
 assert.equal(response.headers.get('cache-control'),'no-store');
 const draft=await response.json();
 assert.equal(draft.kind,'paper-preview');
 assert.equal(draft.requiresConfirmation,true);
 assert.equal(draft.originalUntouched,true);
 assert.equal(draft.strokes[0].points[0][0],168);
 assert.equal(calls.length,1);
 assert.equal(calls[0].request,'Нарисуй дерево');
 assert.deepEqual(Object.keys(calls[0]).sort(),['height','mode','request','signal','width']);
 assert.equal(calls[0].userId,undefined);
 assert.equal(calls[0].token,undefined);
});

test('absent consent, bad tokens, origins and private images never reach the model',async()=>{
 let calls=0;
 const handler=create({generateSketchJson:async()=>{calls++;return sketch}});
 const denied=[
  request(input,{headers:{'x-seyveo-paper-consent':'no'}}),
  request(input,{headers:{authorization:'Bearer bad'}}),
  request({...input,image:'private-handwriting'}),
  request({...input,request:'а'.repeat(501)}),
  request({...input,request:'x'.repeat(480),padding:'z'.repeat(5000)}),
  request(input,{headers:{origin:'https://attacker.example'}})
 ];
 for(const req of denied)assert.notEqual((await handler(req)).status,200);
 assert.equal(calls,0);
});

test('per-session limit, recheck and hostile model output fail closed',async()=>{
 let at=0;
 const handler=create({now:()=>at});
 for(let i=0;i<3;i++)assert.equal((await handler(request())).status,200);
 assert.equal((await handler(request())).status,429);
 at=61000;
 assert.equal((await handler(request())).status,200);
 let checks=0;
 const revoked=create({identity:{identifyVerifiedPerson:async()=>{
  checks++;return {userId:'roman',sessionId:checks===1?'session-1':'revoked'};
 }}});
 assert.equal((await revoked(request())).status,401);
 const malformed=create({generateSketchJson:async()=>'<script>alert(1)</script>'});
 assert.equal((await malformed(request())).status,503);
 const preflight=new Request(apiOrigin+'/v1/paper/draft',{
  method:'OPTIONS',headers:{origin:appOrigin,'access-control-request-method':'POST'}
 });
 const response=await handler(preflight);
 assert.equal(response.status,204);
 assert.match(response.headers.get('access-control-allow-headers'),/authorization/);
});
