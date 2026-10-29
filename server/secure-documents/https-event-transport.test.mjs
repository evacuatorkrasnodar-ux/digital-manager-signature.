import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createHttpsDocumentEventRequest,createHttpsDocumentUpdateSync
} from './https-event-transport.mjs';

const ORIGIN='https://documents.seyveo.example';
const TOKEN='syntheticBearerToken0123456789_abcd';
const PATH='/v1/organizations/demo-org/updates?after=0';
const event={cursor:1,documentId:'example-doc-1',kind:'assigned',at:'2026-10-29T08:00:00Z'};
const response=(status,body,headers={'content-type':'application/json'})=>({
  status,headers:{get:name=>headers[name.toLowerCase()]??null},
  text:async()=>JSON.stringify(body)
});

test('HTTPS adapter sends only validated event GETs to the exact configured origin',async()=>{
  const sent=[];
  const request=createHttpsDocumentEventRequest({
    apiOrigin:ORIGIN,fetchImpl:async(url,options)=>{
      sent.push({url,options});
      return response(200,{events:[event],nextCursor:1});
    }
  });
  const result=await request({method:'GET',path:PATH,accessToken:TOKEN});
  assert.deepEqual(result,{status:200,body:{events:[event],nextCursor:1}});
  assert.equal(sent.length,1);
  assert.equal(sent[0].url,ORIGIN+PATH);
  assert.equal(sent[0].options.headers.Authorization,'Bearer '+TOKEN);
  assert.equal(sent[0].options.method,'GET');
  assert.equal(sent[0].options.redirect,'manual');
  assert.equal(sent[0].options.cache,'no-store');
  assert.equal(sent[0].options.credentials,'omit');
  assert.equal(sent[0].options.referrerPolicy,'no-referrer');
  assert.equal(sent[0].options.headers.Accept,'application/json');
});

test('refuses HTTP, loopback, URL paths, credentials, ports masquerading as origin',()=>{
  const bad=[
    'http://documents.seyveo.example',
    'http://127.0.0.1:8787',
    'https://127.0.0.1',
    'https://[::1]',
    'https://localhost',
    'https://host.local',
    'https://host.internal',
    'https://host.invalid',
    'https://documents.seyveo.example/',
    'https://documents.seyveo.example/v1',
    'https://documents.seyveo.example?token=secret',
    'https://documents.seyveo.example#frag',
    'https://user:pass@documents.seyveo.example',
    'https://documents.seyveo.example:443',
    'file:///home/user/data',
    'javascript:alert(1)',
    'totally invalid'
  ];
  for(const apiOrigin of bad){
    assert.throws(()=>createHttpsDocumentEventRequest({
      apiOrigin,fetchImpl:async()=>{throw new Error('Unexpected call')}
    }),TypeError,apiOrigin);
  }
});

test('refuses all off-path requests before constructing a network call',async()=>{
  let calls=0;
  const request=createHttpsDocumentEventRequest({
    apiOrigin:ORIGIN,fetchImpl:async()=>{calls++;return response(200,{events:[],nextCursor:0})}
  });
  for(const [method,path,accessToken] of [
    ['POST',PATH,TOKEN],
    ['GET','https://elsewhere.invalid/steal',TOKEN],
    ['GET','//elsewhere.invalid/steal',TOKEN],
    ['GET','/v1/organizations/demo-org/inbox',TOKEN],
    ['GET','/v1/organizations/demo-org/updates?after=-1',TOKEN],
    ['GET','/v1/organizations/demo-org/updates?after=0&token=x',TOKEN],
    ['GET','/v1/organizations/demo-org/updates?after=0#bad',TOKEN],
    ['GET','/v1/organizations/../updates?after=0',TOKEN],
    ['GET','/v1/organizations/demo-org/updates?after=0','weak'],
    ['GET',PATH,TOKEN+'\nInjected-Header: 1']
  ]){
    await assert.rejects(request({method,path,accessToken}),/Invalid document event request/);
  }
  assert.equal(calls,0);
});

test('redirects, wrong MIME type and oversized event batches fail with sanitized errors',async()=>{
  const malicious='secret-value-not-for-logs';
  for(const reply of [
    {status:301,headers:{get:()=> 'https://bad.invalid'},text:async()=>malicious},
    {status:302,headers:{get:()=>null},text:async()=>malicious},
    {status:0,type:'opaqueredirect',headers:{get:()=>null},text:async()=>malicious},
    response(200,{events:[],nextCursor:0},{'content-type':'text/plain'}),
    response(200,{events:[],nextCursor:0},{'content-type':'application/json','content-length':'999999'}),
    {status:200,headers:{get:name=>name==='content-type'?'application/json':null},text:async()=> 'z'.repeat(20000)},
    {status:200,headers:{get:name=>name==='content-type'?'application/json':null},text:async()=> '{oops'},
  ]){
    const request=createHttpsDocumentEventRequest({apiOrigin:ORIGIN,fetchImpl:async()=>reply});
    await assert.rejects(
      request({method:'GET',path:PATH,accessToken:TOKEN}),
      error=>error.message==='SEYVEO document event transport unavailable.'&&
        !error.message.includes(TOKEN)&&!error.message.includes(malicious)
    );
  }
});

test('revoked token triggers existing login-required behavior without parsing server errors',async()=>{
  let calls=0,accessLost=0,cursor=0;
  const sync=createHttpsDocumentUpdateSync({
    apiOrigin:ORIGIN,
    fetchImpl:async()=>{
      calls++;
      return {status:403,text:async()=>{throw new Error('Do not read confidential error body.')}};
    },
    getIdentity:async()=>({userId:'elena',organizationId:'demo-org',accessToken:TOKEN}),
    readCursor:async()=>cursor,
    writeCursor:async(_,n)=>{cursor=n},
    onEvent:async()=>{throw new Error('Events should never be delivered')},
    onAccessLost:async()=>{accessLost++}
  });
  assert.equal((await sync.poll()).state,'sign-in-required');
  assert.equal((await sync.poll()).state,'stopped');
  assert.equal(calls,1);
  assert.equal(accessLost,1);
  assert.equal(cursor,0);
});

test('successful HTTPS response integrates with cursor sync without collecting document bodies',async()=>{
  let cursor=0,seen=[],requests=0;
  const sync=createHttpsDocumentUpdateSync({
    apiOrigin:ORIGIN,
    fetchImpl:async(url,options)=>{
      assert.equal(url,ORIGIN+PATH);
      assert.equal(options.headers.Authorization,'Bearer '+TOKEN);
      requests++;
      return response(200,{events:[event],nextCursor:1});
    },
    getIdentity:async()=>({userId:'elena',organizationId:'demo-org',accessToken:TOKEN}),
    readCursor:async()=>cursor,
    writeCursor:async(_,n)=>{cursor=n},
    onEvent:async e=>{seen.push(e)}
  });
  assert.deepEqual(await sync.poll(),{state:'synced',cursor:1,handled:1,hasMore:false});
  assert.deepEqual(seen,[event]);
  assert.equal(cursor,1);
  assert.equal(requests,1);
});
