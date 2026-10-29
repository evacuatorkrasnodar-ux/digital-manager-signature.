import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {createDiscoveredOidcAccessVerifier}
  from './oidc-discovery-verifier.mjs';
import {createBusinessIdentityBoundary} from './identity-boundary.mjs';

const issuer='https://login.seyveo.example/realms/native';
const discovery=issuer+'/.well-known/openid-configuration';
const authorization=issuer+'/protocol/openid-connect/auth';
const tokenEndpoint=issuer+'/protocol/openid-connect/token';
const jwksUri=issuer+'/protocol/openid-connect/certs';
const audience='https://api.seyveo.example';
const clientId='seyveo-native';
const timestamp=Date.parse('2026-10-29T12:00:00.000Z');
const nowSec=Math.floor(timestamp/1000);
const key1=generateKeyPairSync('rsa',{modulusLength:2048});
const key2=generateKeyPairSync('rsa',{modulusLength:2048});
const publicJwk=(key,kid)=>({
  ...key.publicKey.export({format:'jwk'}),
  use:'sig',alg:'RS256',kid,key_ops:['verify']
});
const jwk1=publicJwk(key1,'provider-key-1');
const jwk2=publicJwk(key2,'provider-key-2');
const metadata=()=>({
  issuer,authorization_endpoint:authorization,
  token_endpoint:tokenEndpoint,jwks_uri:jwksUri,
  response_types_supported:['code'],
  code_challenge_methods_supported:['S256'],
  id_token_signing_alg_values_supported:['RS256']
});
const json=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function jwt({kid='provider-key-1',key=key1,head={},claims={}}={}){
  const h=json({alg:'RS256',typ:'at+jwt',kid,...head});
  const p=json({
    iss:issuer,aud:audience,client_id:clientId,sub:'subject-1',
    iat:nowSec-20,exp:nowSec+240,jti:'session-123',...claims
  });
  const sig=sign('RSA-SHA256',Buffer.from(h+'.'+p,'ascii'),key.privateKey)
    .toString('base64url');
  return [h,p,sig].join('.');
}
const fixture=(options={})=>{
  let time=timestamp,revoked=false,accountActive=true,online=true;
  const calls=[],state={metadata:metadata(),keys:[jwk1]};
  const responses=new Map();
  let fallback=null;
  const fetchImpl=async (url,init)=>{
    calls.push({url,init});
    if(!online)throw new Error('provider offline');
    if(responses.has(url))return responses.get(url);
    if(fallback)return fallback(url);
    const value=url===discovery?state.metadata:
      url===jwksUri?{keys:state.keys}:null;
    if(!value)return new Response('not found',{status:404});
    return new Response(JSON.stringify(value),{
      status:200,headers:{'content-type':'application/json'}
    });
  };
  const config={
    issuer,audience,clientId,fetchImpl,
    now:()=>time,
    resolvePerson:async ({issuer:iss,subject,clientId:cid})=>{
      if(iss!==issuer||subject!=='subject-1'||cid!==clientId)
        return null;
      return {userId:'tanya',active:accountActive,subjectType:'person'};
    },
    isRevoked:async()=>revoked,
    ...options
  };
  const adapter=createDiscoveredOidcAccessVerifier(config);
  return {
    adapter,calls,state,responses,
    setTime:n=>{time=n},setRevoked:x=>{revoked=x},
    setOnline:x=>{online=x},setAccountActive:x=>{accountActive=x},
    setFallback:fn=>{fallback=fn}
  };
};
test('discovers only configured issuer, bounded JSON and keys then verifies real RSA signed access JWT',async()=>{
  const f=fixture();
  const checked=await f.adapter.verifySession(jwt());
  assert.deepEqual(checked,{
    userId:'tanya',sessionId:'session-123',audience:'seyveo-native',
    subjectType:'person',revoked:false,expiresAt:(nowSec+240)*1000
  });
  assert.deepEqual(f.calls.map(c=>c.url),[discovery,jwksUri]);
  for(const {init} of f.calls){
    assert.equal(init.method,'GET');
    assert.equal(init.redirect,'manual');
    assert.equal(init.credentials,'omit');
    assert.equal(init.cache,'no-store');
    assert.equal(init.referrerPolicy,'no-referrer');
    assert.ok(init.signal);
  }
  assert.deepEqual(await f.adapter.getTrustedProviderConfig(),{
    issuer,authorizationEndpoint:authorization,
    tokenEndpoint,jwksUri
  });
  assert.equal(f.calls.length,2);
  assert.equal(Object.isFrozen(checked),true);
});

test('cached public keys never cache account status or session revocation',async()=>{
  const f=fixture();
  assert.equal((await f.adapter.verifySession(jwt()))?.userId,'tanya');
  f.setRevoked(true);
  assert.equal(await f.adapter.verifySession(jwt()),null);
  f.setRevoked(false);f.setAccountActive(false);
  assert.equal(await f.adapter.verifySession(jwt()),null);
  assert.equal(f.calls.length,2);
});

test('expired metadata must refresh; provider outage denies access even with old valid signature',async()=>{
  const f=fixture();
  // Token lifetime is intentionally longer than the 5-minute JWKS cache.
  // Its RFC 9068 lifetime remains safely under the one-hour maximum.
  const longLived=jwt({claims:{exp:nowSec+1200}});
  assert.equal((await f.adapter.verifySession(longLived))?.userId,'tanya');
  f.setTime(timestamp+300001);f.setOnline(false);
  assert.equal(await f.adapter.verifySession(longLived),null);
  assert.equal(await f.adapter.getTrustedProviderConfig(),null);
  f.setOnline(true);
  assert.equal((await f.adapter.verifySession(longLived))?.userId,'tanya');
  assert.equal(f.calls.length,6);
  // An expired access token must still fail after keys were refreshed.
  f.setTime(timestamp+1201000);
  assert.equal(await f.adapter.verifySession(longLived),null);
});

test('issuer pinning, altered endpoints and missing code+S256 metadata fail',async()=>{
  const variants=[
    {issuer:'https://attacker.example/realms/native'},
    {jwks_uri:'https://evil.example/certs'},
    {jwks_uri:'http://login.seyveo.example/certs'},
    {jwks_uri:issuer+'/certs?redirect=https://evil.example'},
    {authorization_endpoint:'https://evil.example/auth'},
    {token_endpoint:'https://evil.example/token'},
    {code_challenge_methods_supported:['plain']},
    {response_types_supported:['token']},
    {jwks_uri:issuer+'/'}
  ];
  for(const variant of variants){
    const f=fixture();f.state.metadata={...metadata(),...variant};
    assert.equal(await f.adapter.verifySession(jwt()),null,JSON.stringify(variant));
  }
});

test('refuse redirect or wrong media type/oversize metadata before trust is established',async()=>{
  for(const reply of [
    new Response('',{status:302,headers:{location:'https://evil.example/jwks'}}),
    new Response('{"issuer":"bad"}',{status:200,
      headers:{'content-type':'text/html'}}),
    new Response('x'.repeat(20000),{status:200,
      headers:{'content-type':'application/json','content-length':'20000'}}),
    new Response('x'.repeat(20000),{status:200,
      headers:{'content-type':'application/json'}}),
    new Response('{"broken":',{status:200,headers:{'content-type':'application/json'}})
  ]){
    const f=fixture();f.responses.set(discovery,reply);
    assert.equal(await f.adapter.verifySession(jwt()),null);
  }
});

test('weak/untrusted keys, private key material and invalid key sets fail closed',async()=>{
  const invalid=[
    [],
    [null],
    [{...jwk1,alg:'HS256'}],
    [{...jwk1,kty:'oct'}],
    [{...jwk1,d:'secret'}],
    [jwk1,jwk1],
    Array.from({length:11},(_,i)=>({...jwk1,kid:'id-'+i}))
  ];
  for(const keys of invalid){
    const f=fixture();f.state.keys=keys;
    assert.equal(await f.adapter.verifySession(jwt()),null);
  }
});

test('unknown kid triggers throttled rotation to newly published trusted RSA key',async()=>{
  const f=fixture();
  assert.equal((await f.adapter.verifySession(jwt()))?.userId,'tanya');
  f.state.keys=[jwk2];
  const rotated=jwt({kid:'provider-key-2',key:key2});
  assert.equal((await f.adapter.verifySession(rotated))?.userId,'tanya');
  assert.equal(f.calls.length,4);
  for(let i=0;i<8;i++)
    assert.equal(await f.adapter.verifySession(jwt({kid:'unknown-key'})),null);
  assert.equal(f.calls.length,4);
  assert.equal(await f.adapter.verifySession(jwt()),null);
});

test('ID tokens and fabricated claims never authenticate SEYVEO Business staff',async()=>{
  const f=fixture();
  for(const x of [
    jwt({head:{typ:'JWT'}}),
    jwt({head:{alg:'none'}}),
    jwt({claims:{aud:'another-audience'}}),
    jwt({claims:{client_id:'another-app'}}),
    jwt({claims:{role:'owner',organizationId:'other-business'},key:key2})
  ])assert.equal(await f.adapter.verifySession(x),null);
  const signed=jwt({claims:{role:'owner',organizationId:'other-business'}});
  const membership={
    userId:'tanya',organizationId:'company-1',role:'employee',status:'active'
  };
  const boundary=createBusinessIdentityBoundary({
    now:()=>timestamp,verifySession:f.adapter.verifySession,
    loadMembership:async()=>membership,
    loadDocument:async()=>null,
    loadInvitation:async()=>null,
    redeemInvitation:async()=>false
  });
  assert.equal(await boundary.canAccessBusiness({
    token:signed,organizationId:'company-1',operation:'invite-employee'
  }),false);
  assert.equal(await boundary.canAccessBusiness({
    token:signed,organizationId:'company-1',operation:'view-workspace'
  }),true);
  assert.equal(await boundary.canAccessPersonal({
    token:signed,accountUserId:'owner'
  }),false);
});

test('invalid trust config is rejected before any HTTP fetching',()=>{
  for(const overrides of [
    {issuer:'http://login.seyveo.example'},
    {issuer:'https://localhost'},
    {issuer:'https://evil.internal'},
    {issuer:'https://login.seyveo.example?redirect=1'},
    {issuer:'https://login.seyveo.example/#secret'},
    {cacheMs:300001},{cacheMs:10},
    {clientId:''},{audience:''},
    {fetchImpl:null},{isRevoked:null},
    {resolvePerson:undefined}
  ])assert.throws(()=>createDiscoveredOidcAccessVerifier({
    issuer,audience,clientId,
    fetchImpl:async()=>new Response('{}'),
    now:()=>timestamp,resolvePerson:async()=>null,isRevoked:async()=>true,
    ...overrides
  }),TypeError,JSON.stringify(overrides));
});

test('concurrent verified requests reuse one metadata+JWKS discovery',async()=>{
  const f=fixture();
  const values=await Promise.all(Array.from({length:8},
    ()=>f.adapter.verifySession(jwt())));
  assert.equal(values.filter(x=>x?.userId==='tanya').length,8);
  assert.equal(f.calls.length,2);
});
