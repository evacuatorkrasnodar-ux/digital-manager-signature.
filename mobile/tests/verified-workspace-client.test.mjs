import test from 'node:test';
import assert from 'node:assert/strict';
import {createVerifiedWorkspaceClient} from '../src/business/verified-workspace-client.mjs';

const origin='https://api.seyveo.example';
const code='Q'.repeat(43);
const clock=Date.parse('2026-11-08T12:00:00Z');
const token='A'.repeat(48);
const session={token,userId:'elena',sessionId:'elena-session',expiresAt:clock+1_800_000};
const member=(id,role='employee')=>({
  id:'m-'+id,organizationId:id,name:'Учебная компания '+id,
  kind:'business',role,navigation:role==='employee'?'work':'cabinet'
});
const manifest=(workspaces=[])=>({
  kind:'verified-workspace-manifest',version:1,
  personal:{id:'personal',kind:'personal'},workspaces,
  activeWorkspaceId:null,issuedAt:clock
});
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{
  status,headers:{'Content-Type':'application/json; charset=utf-8',...headers}
});
function fixture({
  initial=[],onFetch,initialSession=session
}={}){
  let activeSession=initialSession,spaces=[...initial],calls=[];
  let count=0;
  const fetchImpl=async(url,request)=>{
    count++;calls.push({url,request});
    if(onFetch)return onFetch({url,request,count,session:activeSession});
    if(request.method==='GET')return json(manifest(spaces));
    if(request.method==='POST'){
      if(JSON.parse(request.body).code!==code)return json({error:'unavailable'},409);
      spaces=[...spaces,member('new-shop')];
      return json({ok:true},201);
    }
    return json({error:'method'},405);
  };
  const client=createVerifiedWorkspaceClient({
    apiOrigin:origin,getPersonalSession:async()=>activeSession,
    fetchImpl,now:()=>clock
  });
  return {
    client,calls,
    setSession:s=>{activeSession=s;},
    setSpaces:s=>{spaces=s;}
  };
}
test('no session cannot load workspaces or spend a code',async()=>{
  const f=fixture({initialSession:null});
  assert.equal((await f.client.load()).status,'sign-in-required');
  assert.equal((await f.client.acceptCode({code})).status,'sign-in-required');
  assert.equal(f.calls.length,0);
});
test('one verified account begins with ONE and no work tab',async()=>{
  const f=fixture();
  const r=await f.client.load();
  assert.equal(r.status,'ready');
  assert.deepEqual(r.navigation.tabs,['personal','calendar']);
  assert.equal(r.navigation.workspaces.length,0);
  assert.equal(r.navigation.activeWorkspaceId,null);
  assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].url,origin+'/v1/me/workspaces');
  const req=f.calls[0].request;
  assert.equal(req.method,'GET');
  assert.equal(req.headers.Authorization,'Bearer '+token);
  assert.equal(req.redirect,'manual');
  assert.equal(req.credentials,'omit');
  assert.equal(req.cache,'no-store');
  assert.equal(req.referrerPolicy,'no-referrer');
  assert.equal(req.body,undefined);
});
test('one personal identity can see multiple authorized organizations',async()=>{
  const f=fixture({initial:[member('shop-a'),member('shop-b','owner')]});
  const result=await f.client.load();
  assert.equal(result.status,'ready');
  assert.equal(result.navigation.workspaces.length,2);
  assert.equal(result.navigation.mode,'personal');
  assert.equal(result.navigation.showWorkSwitch,true);
  assert.deepEqual(result.navigation.tabs,['personal','calendar']);
});
test('one-use code joins a verified company only after post-acceptance server refresh',async()=>{
  const f=fixture({initial:[member('shop-old')]});
  const result=await f.client.acceptCode({code});
  assert.equal(result.status,'joined');
  assert.equal(result.workspace.name,'Учебная компания new-shop');
  assert.equal(result.navigation.activeWorkspaceId,'m-new-shop');
  assert.deepEqual(result.navigation.tabs,['personal','calendar','employee']);
  assert.deepEqual(f.calls.map(x=>x.request.method),['GET','POST','GET']);
  assert.equal(f.calls[1].url,origin+'/v1/invitations/accept');
  assert.deepEqual(JSON.parse(f.calls[1].request.body),{code});
  assert.equal(f.calls[1].request.headers.Authorization,'Bearer '+token);
  assert.equal(f.calls[1].request.credentials,'omit');
  assert.equal(f.calls[1].request.cache,'no-store');
  assert.equal(f.calls[1].request.referrerPolicy,'no-referrer');
  assert.equal(f.calls.every(c=>!c.url.includes(code)),true);
  assert.equal(JSON.stringify(result).includes(code),false);
  assert.equal(JSON.stringify(result).includes(token),false);
});
test('no invented membership if accept says ok but refreshed list is unchanged',async()=>{
  const f=fixture({onFetch:async({request})=>
    request.method==='POST'?json({ok:true},201):json(manifest([]))});
  const result=await f.client.acceptCode({code});
  assert.equal(result.status,'verification-pending');
  assert.deepEqual(result.navigation.tabs,['personal','calendar']);
  assert.equal(result.navigation.activeWorkspaceId,null);
});
test('bad code and expired/reused code do not grant any rights',async()=>{
  const f=fixture({onFetch:async({request})=>
    request.method==='POST'?json({private:'not-for-ui'},409):json(manifest([]))});
  for(const invalid of ['',null,'veryshort','ABC?path=owner',code+'x']){
    assert.deepEqual(await f.client.acceptCode({code:invalid}),{status:'invalid-code'});
  }
  assert.equal(f.calls.length,0);
  const r=await f.client.acceptCode({code});
  assert.deepEqual(r,{status:'invalid-or-expired'});
  assert.equal(f.calls.length,2);
  assert.equal(JSON.stringify(r).includes('private'),false);
});
test('logout or person switch during baseline prevents POST',async()=>{
  let active={...session};
  const calls=[];
  const client=createVerifiedWorkspaceClient({
    apiOrigin:origin,now:()=>clock,
    getPersonalSession:async()=>active,
    fetchImpl:async(_url,request)=>{
      calls.push(request.method);
      active={...session,userId:'other-person'};
      return json(manifest([]));
    }
  });
  assert.equal((await client.acceptCode({code})).status,'sign-in-required');
  assert.deepEqual(calls,['GET']);
});
test('session switch immediately after POST never claims joined',async()=>{
  let active={...session},called=0;
  const client=createVerifiedWorkspaceClient({
    apiOrigin:origin,now:()=>clock,
    getPersonalSession:async()=>active,
    fetchImpl:async(_url,request)=>{
      called++;
      if(request.method==='POST'){
        active={...session,sessionId:'new-session'};
        return json({ok:true},201);
      }
      return json(manifest([]));
    }
  });
  const r=await client.acceptCode({code});
  assert.equal(r.status,'sign-in-required');
  assert.equal(called,2);
});
test('401, 503, redirect, broken JSON and malformed tenant manifest all fail closed',async()=>{
  const responses=[
    json({secret:'private'},401),json({secret:'private'},503),
    new Response('',{status:302,headers:{location:origin+'/somewhere'}}),
    new Response('broken JSON',{status:200,headers:{'Content-Type':'application/json'}}),
    json({...manifest(),workspaces:[member('shop-a'),member('shop-a')]}),
    json({role:'owner',workspaces:[member('shop-a')]}),
    json(manifest([]),200,{'Content-Type':'text/html'}),
    json(manifest([]),200,{'Content-Length':'99999999'})
  ];
  for(const response of responses){
    const f=fixture({onFetch:async()=>response});
    const result=await f.client.load();
    assert.notEqual(result.status,'ready');
    assert.deepEqual(result.navigation.tabs,['personal','calendar']);
    assert.equal(result.navigation.activeWorkspaceId,null);
  }
});
test('same code cannot be consumed twice simultaneously',async()=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve});
  const f=fixture({onFetch:async({request})=>{
    if(request.method==='GET'){await gate;return json(manifest([]));}
    return json({ok:true},201);
  }});
  const first=f.client.acceptCode({code});
  assert.deepEqual(await f.client.acceptCode({code}),{status:'busy'});
  release();
  const r=await first;
  assert.equal(r.status,'verification-pending');
});
test('bad API hosts and missing trusted session adapters cannot initialize',()=>{
  for(const invalid of [
    {apiOrigin:'http://api.seyveo.example'},
    {apiOrigin:'https://localhost'},
    {apiOrigin:'https://evil.example/path'},
    {apiOrigin:'https://name:pass@evil.example'},
    {apiOrigin:'https://api.seyveo.example?next=evil'},
    {apiOrigin:'https://api.seyveo.example#fragment'},
    {getPersonalSession:null},{fetchImpl:null}
  ])assert.throws(()=>createVerifiedWorkspaceClient({
    apiOrigin:origin,getPersonalSession:async()=>session,
    fetchImpl:async()=>json(manifest([])),...invalid
  }),TypeError);
});
