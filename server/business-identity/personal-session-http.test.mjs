import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersonalSessionHttpContract} from './personal-session-http.mjs';
const origin='https://api.seyveo.example';
const now=Date.parse('2026-11-08T12:00:00Z');
const token='A'.repeat(48);
function fixture({identity}={}){
  const calls=[];
  let enabled=true;
  const verified=identity||{
    identifyVerifiedPerson:async({token:t})=>{
      calls.push(t);
      return enabled&&t===token?{userId:'elena',sessionId:'session-1'}:null;
    }
  };
  const api=createPersonalSessionHttpContract({
    apiOrigin:origin,identity:verified,now:()=>now
  });
  const get=async(path='/v1/me/session',method='GET',auth=token)=>
    api.handle(new Request(origin+path,{
      method,headers:auth?{Authorization:'Bearer '+auth}:{}
    }));
  return {api,get,calls,revoke:()=>{enabled=false;}};
}
test('verified native personal session identifies ONE without granting any role',async()=>{
  const f=fixture();
  const response=await f.get();
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{
    kind:'verified-person-session',
    userId:'elena',sessionId:'session-1',expiresAt:now+30_000
  });
  assert.equal(response.headers.get('Cache-Control'),'no-store, max-age=0');
  assert.equal(response.headers.get('Vary'),'Authorization');
  assert.deepEqual(f.calls,[token,token]);
});
test('missing or invalid bearer is rejected before identity lookup',async()=>{
  const f=fixture();
  for(const invalid of ['', 'short', 'Bearer X'.repeat(1000)]){
    const r=await f.get('/v1/me/session','GET',invalid);
    assert.equal(r.status,401);
  }
  assert.deepEqual(f.calls,[]);
});
test('revoked account, changed identity and changed session fail closed',async()=>{
  const f=fixture();f.revoke();
  assert.equal((await f.get()).status,401);
  for(const changed of [
    {userId:'another',sessionId:'session-1'},
    {userId:'elena',sessionId:'second-session'}
  ]){
    let count=0;
    const g=fixture({identity:{
      identifyVerifiedPerson:async()=>++count===1
        ?{userId:'elena',sessionId:'session-1'}:changed
    }});
    assert.equal((await g.get()).status,401);
  }
});
test('cross-origin requests, query role injection and wrong verbs are rejected',async()=>{
  const f=fixture();
  assert.equal((await f.get('/v1/me/session?role=owner')).status,403);
  assert.equal((await f.get('/v1/me/admin')).status,404);
  assert.equal((await f.get('/v1/me/session','POST')).status,405);
  assert.equal((await f.api.handle(new Request(origin+'/v1/me/session',{
    headers:{Authorization:'Bearer '+token,Origin:'https://other.example'}
  }))).status,403);
});
test('no trusted identity adapter or HTTP-only API is permitted',()=>{
  assert.throws(()=>createPersonalSessionHttpContract({
    apiOrigin:origin,identity:{}
  }),TypeError);
  assert.throws(()=>createPersonalSessionHttpContract({
    apiOrigin:'http://api.seyveo.example',
    identity:{identifyVerifiedPerson:async()=>null}
  }),TypeError);
});
