import test from 'node:test';
import assert from 'node:assert/strict';
import {createVerifiedAccountBridge}
  from '../src/auth/verified-account-bridge.mjs';

const apiOrigin='https://api.seyveo.example';
const issuer='https://login.seyveo.example/realms/seyveo';
const token='A'.repeat(80);
const now=Date.parse('2026-11-08T12:00:00Z');
const code='Q'.repeat(43);
const credential={
  token,issuer,clientId:'seyveo-native',
  subject:'oidc-sub-1',expiresAt:now+300_000
};
const json=(body,status=200,extraHeaders={})=>
  new Response(JSON.stringify(body),{
    status,headers:{'Content-Type':'application/json',...extraHeaders}
  });
const member={
  id:'m-shop',organizationId:'shop',name:'Учебная компания',
  kind:'business',role:'employee',navigation:'work'
};
const manifest=workspaces=>({
  kind:'verified-workspace-manifest',version:1,
  personal:{id:'personal',kind:'personal'},
  workspaces,activeWorkspaceId:null,issuedAt:now
});

function fixture({customFetch}={}){
  let secret={...credential},signedIn=true,joined=false;
  let calls=[];
  const credentialVault={
    getAccessCredential:async()=>signedIn?secret:null
  };
  const fetchImpl=async(url,request)=>{
    calls.push({url,request});
    if(customFetch)return customFetch({url,request,signOut,changeToken});
    if(!signedIn)return json({error:'unauthorized'},401);
    if(url.endsWith('/v1/me/session'))return json({
      kind:'verified-person-session',userId:'elena',
      sessionId:'verified-session-1',expiresAt:now+30_000
    });
    if(url.endsWith('/v1/me/workspaces'))
      return json(manifest(joined?[member]:[]));
    if(url.endsWith('/v1/invitations/accept')){
      if(JSON.parse(request.body).code!==code)
        return json({error:'unavailable'},409);
      joined=true;
      return json({ok:true},201);
    }
    return json({error:'not-found'},404);
  };
  const bridge=createVerifiedAccountBridge({
    apiOrigin,issuer,credentialVault,fetchImpl,now:()=>now
  });
  function signOut(){signedIn=false;}
  function changeToken(){secret={...credential,token:'B'.repeat(80)};}
  return {bridge,calls,signOut,changeToken};
}
test('no local vault token means no even provisional account identity',async()=>{
  const f=fixture();
  f.signOut();
  assert.equal(await f.bridge.getPersonalSession(),null);
  const r=await f.bridge.workspaces.load();
  assert.equal(r.status,'sign-in-required');
  assert.deepEqual(r.navigation.tabs,['personal','calendar']);
  assert.equal(f.calls.length,0);
});
test('server verifies identity and session before passing token to workspaces',async()=>{
  const f=fixture();
  const person=await f.bridge.getPersonalSession();
  assert.deepEqual(person,{
    token,userId:'elena',sessionId:'verified-session-1',
    expiresAt:now+30_000
  });
  assert.equal(f.calls[0].url,apiOrigin+'/v1/me/session');
  assert.equal(f.calls[0].request.method,'GET');
  assert.equal(f.calls[0].request.headers.Authorization,'Bearer '+token);
  assert.equal(f.calls[0].request.credentials,'omit');
  assert.equal(f.calls[0].request.redirect,'manual');
  assert.equal(f.calls[0].request.cache,'no-store');
  assert.equal(f.calls[0].request.referrerPolicy,'no-referrer');
});
test('one personal identity accepts invite and sees Work only after fresh server proof',async()=>{
  const f=fixture();
  const before=await f.bridge.workspaces.load();
  assert.equal(before.status,'ready');
  assert.deepEqual(before.navigation.tabs,['personal','calendar']);
  const joined=await f.bridge.workspaces.acceptCode({code});
  assert.equal(joined.status,'joined');
  assert.deepEqual(joined.navigation.tabs,['personal','calendar','employee']);
  assert.equal(joined.navigation.activeWorkspaceId,'m-shop');
  assert.equal(f.calls.some(x=>x.url.includes(code)),false);
  assert.equal(JSON.stringify(joined).includes(token),false);
  assert.equal(JSON.stringify(joined).includes(code),false);
});
test('if a token is replaced while identity response is pending, deny the entire request',async()=>{
  const f=fixture({customFetch:async({changeToken})=>{
    changeToken();
    return json({kind:'verified-person-session',
      userId:'elena',sessionId:'verified-session-1',
      expiresAt:now+30_000});
  }});
  assert.equal(await f.bridge.getPersonalSession(),null);
  const result=await f.bridge.workspaces.load();
  assert.equal(result.status,'sign-in-required');
});
test('remote server refusal never turns into an offline workspace',async()=>{
  for(const reply of [
    json({error:'unauthorized'},401),
    json({userId:'elena',sessionId:'fake'},200),
    json({kind:'verified-person-session',userId:'owner',
      sessionId:'s1',expiresAt:now+300_000}),
    json({kind:'verified-person-session',userId:'../root',
      sessionId:'s1',expiresAt:now+30_000}),
    new Response('',{status:302,headers:{Location:apiOrigin+'/other'}}),
    new Response('secret server error',{status:503}),
    json({kind:'verified-person-session',userId:'elena',
      sessionId:'s1',expiresAt:now+30_000},200,{'Content-Type':'text/html'}),
    json({kind:'verified-person-session',userId:'elena',
      sessionId:'s1',expiresAt:now+30_000},200,{'Content-Length':'99999'})
  ]){
    const f=fixture({customFetch:async()=>reply});
    assert.equal(await f.bridge.getPersonalSession(),null);
  }
});
test('missing trusted callbacks and unpinned servers cannot create a bridge',()=>{
  for(const change of [
    {apiOrigin:'http://api.seyveo.example'},
    {apiOrigin:'https://api.seyveo.example/v1'},
    {apiOrigin:'https://user:pass@api.seyveo.example'},
    {apiOrigin:'https://localhost'},
    {credentialVault:null},{fetchImpl:null},{issuer:'not-https'}
  ])assert.throws(()=>createVerifiedAccountBridge({
    apiOrigin,issuer,
    credentialVault:{getAccessCredential:async()=>credential},
    fetchImpl:async()=>json({}),now:()=>now,...change
  }),TypeError);
});
