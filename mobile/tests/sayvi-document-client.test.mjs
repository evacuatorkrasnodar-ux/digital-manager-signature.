import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSayviDocumentClient,validateSayviDocumentEndpoint,validateSayviExplanationResponse
} from '../src/browser/sayvi-document-client.mjs';

const url='https://api.example.com/api/browser/document-explain';
const handoff={
  source:'user-selected-local-document',fileName:'contract.pdf',
  excerpt:'Текст договора',truncated:true
};
const reply={summary:'Краткое объяснение',keyPoints:['Пункт 1'],
 cautions:['Проверьте полный текст'],incomplete:true,advisory:true,executed:false};

test('trusted HTTPS endpoint only, exact path, no redirects or credentials',()=>{
  assert.equal(validateSayviDocumentEndpoint(url),url);
  for(const endpoint of [
    'http://example.com/api/browser/document-explain',
    'https://example.com/other',
    'https://username:password@example.com/api/browser/document-explain',
    'https://localhost/api/browser/document-explain',
    'https://example.com/api/browser/document-explain?to=bad',
    'https://example.com:8443/api/browser/document-explain'
  ])assert.throws(()=>validateSayviDocumentEndpoint(endpoint));
});

test('requires a token from the app after user-approved invocation',async()=>{
  let fetched=0;
  const client=createSayviDocumentClient({
    endpoint:url,getAccessToken:async()=> '',
    fetchImpl:async()=>{fetched++;return {ok:true,json:async()=>reply}}
  });
  await assert.rejects(()=>client.explain(handoff),/document-login-required/);
  assert.equal(fetched,0);
});

test('approved handoff sends only selected fragment and displays verified real answer',async()=>{
  let calls=0,request=null;
  const client=createSayviDocumentClient({
    endpoint:url,getAccessToken:async()=> 'development-test-token-not-a-secret',
    fetchImpl:async(_url,opts)=>{
      calls++;request=opts;
      return {ok:true,headers:{get:()=> 'application/json'},json:async()=>reply};
    }
  });
  assert.equal(calls,0);
  const answer=await client.explain(handoff);
  assert.equal(calls,1);
  assert.equal(answer.summary,reply.summary);
  assert.equal(request.redirect,'error');
  const sent=JSON.parse(request.body);
  assert.equal(sent.approved,true);
  assert.equal(sent.cloudConsent,true);
  assert.equal(sent.document.excerpt,handoff.excerpt);
  assert.equal('fileId' in sent.document,false);
  assert.equal('uri' in sent.document,false);
});

test('unknown, oversized or unsafe document input is refused before network',async()=>{
  let calls=0;
  const c=createSayviDocumentClient({
    endpoint:url,getAccessToken:async()=> 'development-test-token-not-a-secret',
    fetchImpl:async()=>{calls++;throw Error('unexpected')}
  });
  await assert.rejects(()=>c.explain({...handoff,fileName:'secret.exe'}));
  await assert.rejects(()=>c.explain({...handoff,excerpt:'x'.repeat(6001)}));
  assert.equal(calls,0);
});

test('malformed AI reply is never shown as successful analysis',()=>{
  assert.throws(()=>validateSayviExplanationResponse({...reply,advisory:false}));
  assert.throws(()=>validateSayviExplanationResponse({summary:'hello'}));
  assert.equal(validateSayviExplanationResponse(reply).executed,false);
});
