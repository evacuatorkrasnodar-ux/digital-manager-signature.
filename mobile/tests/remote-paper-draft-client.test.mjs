import test from 'node:test';
import assert from 'node:assert/strict';
import {createRemotePaperDraftClient}
  from '../src/paper/remote-draft-client.mjs';
import {createVerifiedAccountBridge}
  from '../src/auth/verified-account-bridge.mjs';
import {createRemotePaperDraftHandler}
  from '../../server/paper-remote-contract.mjs';

const api='https://api.seyveo.example';
const app='https://app.seyveo.example';
const issuer='https://login.seyveo.example';
const now=Date.parse('2026-11-19T12:00:00Z');
const token='T'.repeat(80);
const session={token,userId:'owner-1',sessionId:'session-1',expiresAt:now+30_000};
const input={request:'Нарисуй дерево на поляне',width:840,height:1188};
const consent=async()=>true;
const example={kind:'paper-preview',title:'Дерево',requiresConfirmation:true,
  originalUntouched:true,strokes:[{tool:'pen',color:'#171e29',width:4,
    points:[[20,20,50],[120,120,50]]}]};
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{
  status,headers:{'content-type':'application/json',...headers}
});

function fixture({getPersonalSession=async()=>session,fetchImpl=async()=>json(example)}={}){
  const calls=[];
  const client=createRemotePaperDraftClient({
    apiOrigin:api,appOrigin:app,getPersonalSession,
    fetchImpl:async(url,opts)=>{calls.push({url,opts});return fetchImpl(url,opts)},
    now:()=>now
  });
  return {client,calls};
}

test('Paper request requires HTTPS origins and cannot silently enable a local server',()=>{
  const valid={apiOrigin:api,appOrigin:app,
    getPersonalSession:async()=>session,fetchImpl:async()=>json(example)};
  for(const bad of [
    {apiOrigin:'http://api.seyveo.example'},
    {apiOrigin:api+'/v1/paper/draft'},
    {apiOrigin:'https://user:pass@api.seyveo.example'},
    {apiOrigin:'https://127.0.0.1'},
    {appOrigin:'https://app.seyveo.example/notes'},
    {appOrigin:'http://app.seyveo.example'},
    {fetchImpl:null},{getPersonalSession:null}
  ])assert.throws(()=>createRemotePaperDraftClient({...valid,...bad}));
});

test('invalid request and denied/absent consent call neither session nor network',async()=>{
  let checks=0;
  const f=fixture({getPersonalSession:async()=>{checks++;return session}});
  assert.equal((await f.client.requestDraft(input)).status,'consent-required');
  assert.equal((await f.client.requestDraft({...input,confirmTextSend:async()=>false})).status,'consent-required');
  assert.equal((await f.client.requestDraft({...input,confirmTextSend:async()=>{throw Error('dialog closed')}})).status,'consent-required');
  for(const args of [
    {...input,request:'a'.repeat(501),confirmTextSend:consent},
    {...input,width:60,confirmTextSend:consent},
    {...input,height:6000,confirmTextSend:consent},
    {...input,request:'\n'.repeat(480),confirmTextSend:consent},
    {...input,request:{image:'private'},confirmTextSend:consent}
  ])assert.equal((await f.client.requestDraft(args)).status,'invalid-request');
  assert.equal(checks,0);
  assert.equal(f.calls.length,0);
});

test('fresh per-request consent sends ONLY text and returns inert immutable preview',async()=>{
  const f=fixture();
  const confirmations=[];
  const args={...input,confirmTextSend:async details=>{
    confirmations.push(details);return true;
  }};
  const first=await f.client.requestDraft(args);
  const second=await f.client.requestDraft(args);
  assert.equal(first.status,'ready');
  assert.equal(second.status,'ready');
  assert.equal(confirmations.length,2);
  assert.deepEqual(confirmations[0],{
    request:input.request,recipient:api,purpose:'paper-preview'
  });
  assert.equal(f.calls.length,2);
  const {url,opts}=f.calls[0];
  assert.equal(url,api+'/v1/paper/draft');
  assert.equal(opts.method,'POST');
  assert.equal(opts.headers.Authorization,'Bearer '+token);
  assert.equal(opts.headers.Origin,app);
  assert.equal(opts.headers['x-seyveo-paper-consent'],'yes');
  assert.equal(opts.credentials,'omit');
  assert.equal(opts.redirect,'manual');
  assert.equal(opts.cache,'no-store');
  assert.equal(opts.referrerPolicy,'no-referrer');
  assert.deepEqual(JSON.parse(opts.body),{mode:'draw',...input});
  assert.equal(JSON.stringify(first).includes(token),false);
  assert.equal(first.preview.requiresConfirmation,true);
  assert.equal(first.preview.originalUntouched,true);
  assert.ok(Object.isFrozen(first.preview.strokes[0].points[0]));
  assert.throws(()=>first.preview.strokes[0].points[0].push(3));
  assert.equal(typeof f.client.apply, 'undefined');
});

test('anonymous or switched session cannot request or receive someone else’s draft',async()=>{
  const anonymous=fixture({getPersonalSession:async()=>null});
  assert.equal((await anonymous.client.requestDraft({...input,confirmTextSend:consent})).status,
    'sign-in-required');
  assert.equal(anonymous.calls.length,0);
  let checks=0;
  const switched=fixture({getPersonalSession:async()=>{
    checks++;return checks===1?session:{...session,sessionId:'other-session'};
  }});
  assert.equal((await switched.client.requestDraft({...input,confirmTextSend:consent})).status,
    'sign-in-required');
  assert.equal(switched.calls.length,1);
  const expired=fixture({getPersonalSession:async()=>({...session,expiresAt:now-1})});
  assert.equal((await expired.client.requestDraft({...input,confirmTextSend:consent})).status,
    'sign-in-required');
  assert.equal(expired.calls.length,0);
});

test('hostile preview, redirects and wrong MIME are never displayed',async()=>{
  const bad=[
    {...example,strokes:[{...example.strokes[0],points:[[20,20,50],[9999,3,50]]}]},
    {...example,requiresConfirmation:false},
    {...example,title:'<script>alert(1)</script>'},
    {...example,strokes:[{...example.strokes[0],color:'url(javascript:evil())'}]},
    {...example,html:'<img src=x onerror=alert(1)>'},
    {...example,strokes:Array.from({length:61},()=>example.strokes[0])}
  ];
  for(const preview of bad){
    const f=fixture({fetchImpl:async()=>json(preview)});
    assert.equal((await f.client.requestDraft({...input,confirmTextSend:consent})).status,
      'invalid-preview');
  }
  for(const response of [
    new Response('',{status:302,headers:{Location:'https://evil.example'}}),
    json({error:'overloaded'},503),
    json(example,200,{'content-type':'text/html'}),
    json(example,200,{'content-length':'999999'})
  ]){
    const f=fixture({fetchImpl:async()=>response});
    assert.notEqual((await f.client.requestDraft({...input,confirmTextSend:consent})).status,
      'ready');
  }
});

test('network failure is safe, and concurrent taps cannot send twice',async()=>{
  const broken=fixture({fetchImpl:async()=>{throw Error('credentials and secret')}});
  const failure=await broken.client.requestDraft({...input,confirmTextSend:consent});
  assert.deepEqual(failure,{status:'unavailable'});
  let release;
  const pending=new Promise(resolve=>{release=resolve});
  const slow=fixture({fetchImpl:async()=>{await pending;return json(example)}});
  const first=slow.client.requestDraft({...input,confirmTextSend:consent});
  assert.equal((await slow.client.requestDraft({...input,confirmTextSend:consent})).status,'busy');
  release();
  assert.equal((await first).status,'ready');
  assert.equal(slow.calls.length,1);
});

test('verified native account bridge keeps Paper disabled unless explicitly configured',async()=>{
  const options={apiOrigin:api,issuer,
    credentialVault:{getAccessCredential:async()=>({
      token,subject:'subject-1',issuer,clientId:'seyveo-native',expiresAt:now+100_000
    })},
    now:()=>now,
    fetchImpl:async(url)=>{
      if(url.endsWith('/v1/me/session'))return json({
        kind:'verified-person-session',userId:'owner-1',sessionId:'session-1',
        expiresAt:now+30_000
      });
      if(url.endsWith('/v1/paper/draft'))return json(example);
      throw Error('unexpected route');
    }
  };
  assert.equal(createVerifiedAccountBridge(options).paperDraft,null);
  const enabled=createVerifiedAccountBridge({...options,paperAppOrigin:app});
  assert.equal((await enabled.paperDraft.requestDraft({...input,confirmTextSend:consent})).status,
    'ready');
});

test('native client speaks the exact authenticated server contract end to end',async()=>{
  let models=0;
  const handler=createRemotePaperDraftHandler({apiOrigin:api,appOrigins:[app],
    identity:{identifyVerifiedPerson:async({token:bearer})=>
      bearer===token?{userId:session.userId,sessionId:session.sessionId}:null},
    generateSketchJson:async({request,mode})=>{
      models++;
      assert.equal(request,input.request);
      assert.equal(mode,'draw');
      return JSON.stringify({version:1,title:'Дерево',strokes:[{
        points:[[0.1,0.1],[0.3,0.4]]
      }]});
    }
  });
  const f=fixture({fetchImpl:async(url,opts)=>handler(new Request(url,opts))});
  const result=await f.client.requestDraft({...input,confirmTextSend:consent});
  assert.equal(result.status,'ready');
  assert.equal(models,1);
  assert.deepEqual(result.preview.strokes[0].points[0],[84,118.8,50]);
});

test('a stalled native network request is aborted without exposing private text',async()=>{
  const f=createRemotePaperDraftClient({apiOrigin:api,appOrigin:app,
    getPersonalSession:async()=>session,now:()=>now,timeoutMs:1000,
    fetchImpl:async(_url,options)=>new Promise((_,reject)=>{
      options.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});
    })
  });
  const result=await f.requestDraft({...input,confirmTextSend:consent});
  assert.deepEqual(result,{status:'unavailable'});
});

test('owner cancellation before consent or during transport never displays a draft',async()=>{
  const cancelled=new AbortController();
  cancelled.abort();
  const a=fixture();
  assert.equal((await a.client.requestDraft({...input,
    confirmTextSend:consent,signal:cancelled.signal})).status,'cancelled');
  assert.equal(a.calls.length,0);
  const before=fixture();
  const duringConsent=new AbortController();
  assert.equal((await before.client.requestDraft({...input,
    signal:duringConsent.signal,confirmTextSend:async()=>{
      duringConsent.abort();return true;
    }})).status,'cancelled');
  assert.equal(before.calls.length,0);
  const transport=new AbortController();
  const online=fixture({fetchImpl:async(_url,opts)=>new Promise((_,reject)=>{
    opts.signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true});
  })});
  const promise=online.client.requestDraft({...input,
    confirmTextSend:consent,signal:transport.signal});
  // Allow the identity adapter to finish and the transport to start.
  await new Promise(resolve=>setTimeout(resolve,0));
  transport.abort();
  assert.equal((await promise).status,'cancelled');
});
