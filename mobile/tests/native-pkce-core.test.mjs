import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createNativePkceFlow} from '../src/auth/native-pkce-core.mjs';

const config={
  issuer:'https://login.seyveo.example/realms/seyveo',
  authorizationEndpoint:'https://login.seyveo.example/realms/seyveo/protocol/openid-connect/auth',
  redirectUri:'https://app.seyveo.example/authorize/callback',
  clientId:'seyveo-native',
};
const entropy=()=>randomBytes(96);
const sha256=async input=>createHash('sha256').update(input).digest();
const fixture=(options={})=>createNativePkceFlow({
  ...config,randomBytes:async()=>entropy(),sha256,
  ...options
});
const authResponse=(authorizationUrl,code='fictional-code-987654321')=>{
  const request=new URL(authorizationUrl);
  const callback=new URL(config.redirectUri);
  callback.searchParams.set('code',code);
  callback.searchParams.set('state',request.searchParams.get('state'));
  callback.searchParams.set('iss',config.issuer);
  return callback.href;
};

test('PKCE generates fresh 256-bit state/verifier/nonce, S256 challenge and code-only browser URL',async()=>{
  const seed=Uint8Array.from({length:96},(_,i)=>i);
  const client=fixture({now:()=>Date.parse('2026-10-29T12:00:00Z'),randomBytes:async count=>{
    assert.equal(count,96);return seed;
  }});
  const started=await client.begin();
  assert.equal(started.status,'browser-required');
  assert.equal(started.expiresAt,'2026-10-29T12:05:00.000Z');
  const url=new URL(started.authorizationUrl);
  assert.equal(url.origin,'https://login.seyveo.example');
  assert.equal(url.searchParams.get('response_type'),'code');
  assert.equal(url.searchParams.get('client_id'),'seyveo-native');
  assert.equal(url.searchParams.get('redirect_uri'),config.redirectUri);
  assert.equal(url.searchParams.get('scope'),'openid');
  assert.equal(url.searchParams.get('code_challenge_method'),'S256');
  assert.equal(url.searchParams.get('state').length,43);
  assert.equal(url.searchParams.get('nonce').length,43);
  assert.equal(url.searchParams.get('code_challenge').length,43);
  assert.equal(url.searchParams.has('code_verifier'),false);
  assert.equal(url.searchParams.has('client_secret'),false);
  assert.equal(url.searchParams.has('access_token'),false);

  const res=client.acceptCallback(authResponse(started.authorizationUrl));
  assert.equal(res.status,'exchange-required');
  assert.equal(res.authorizationCode,'fictional-code-987654321');
  assert.equal(res.clientId,config.clientId);
  assert.equal(res.redirectUri,config.redirectUri);
  assert.equal(res.issuer,config.issuer);
  assert.equal(res.codeVerifier.length,43);
  const expected=createHash('sha256').update(res.codeVerifier,'ascii').digest('base64url');
  assert.equal(url.searchParams.get('code_challenge'),expected);
  assert.equal(res.nonce,url.searchParams.get('nonce'));
  assert.equal(JSON.stringify(started).includes(res.codeVerifier),false);
  assert.deepEqual(client.acceptCallback(authResponse(started.authorizationUrl)),
    {status:'no-pending-authentication'});
});
test('random authorization attempts rotate nonce/state/verifier and older callback cannot take over',async()=>{
  const flow=fixture();
  const one=await flow.begin();
  const two=await flow.begin();
  assert.notEqual(new URL(one.authorizationUrl).searchParams.get('state'),
    new URL(two.authorizationUrl).searchParams.get('state'));
  assert.notEqual(new URL(one.authorizationUrl).searchParams.get('nonce'),
    new URL(two.authorizationUrl).searchParams.get('nonce'));
  assert.deepEqual(flow.acceptCallback(authResponse(one.authorizationUrl)),{status:'rejected'});
  assert.equal(flow.acceptCallback(authResponse(two.authorizationUrl)).status,'exchange-required');
});
test('rejects forged state without destroying legitimate in-progress login',async()=>{
  const flow=fixture();
  const started=await flow.begin();
  const forged=new URL(authResponse(started.authorizationUrl));
  forged.searchParams.set('state','forged-state-value');
  assert.equal(flow.acceptCallback(forged.href).status,'rejected');
  assert.equal(flow.acceptCallback(authResponse(started.authorizationUrl)).status,'exchange-required');
});
test('rejects wrong redirect, duplicate params, nonmatching issuer and implicit tokens',async()=>{
  const variations=[
    url=>url.replace('app.seyveo.example','attacker.invalid'),
    url=>url.replace('/authorize/callback','/authorize/callback/other'),
    url=>url.replace('https:','http:'),
    url=>url+'#access_token=stolen',
    url=>url+'&state=duplicate',
    url=>url+'&iss=https%3A%2F%2Fattacker.invalid',
    url=>url+'&code=duplicate',
    url=>url+'&access_token=should-not-be-in-redirect',
    url=>url.replace('iss=https%3A%2F%2Flogin.seyveo.example%2Frealms%2Fseyveo','iss=https%3A%2F%2Fother.invalid'),
    url=>url.replace('code=fictional-code-987654321','code=x')
  ];
  for(const mutate of variations){
    const flow=fixture();
    const started=await flow.begin();
    const callback=mutate(authResponse(started.authorizationUrl));
    assert.equal(flow.acceptCallback(callback).status,'rejected',callback);
  }
});
test('correct matching state consumes a rejected callback; expired/cancelled attempts cannot be reused',async()=>{
  const flow=fixture();
  let started=await flow.begin();
  const malformed=new URL(authResponse(started.authorizationUrl));
  malformed.searchParams.delete('iss');
  assert.equal(flow.acceptCallback(malformed.href).status,'rejected');
  assert.equal(flow.acceptCallback(authResponse(started.authorizationUrl)).status,'no-pending-authentication');
  started=await flow.begin();
  flow.cancel();
  assert.equal(flow.acceptCallback(authResponse(started.authorizationUrl)).status,'no-pending-authentication');
  let timestamp=Date.parse('2026-10-29T12:00:00Z');
  const expiring=fixture({now:()=>timestamp});
  const pending=await expiring.begin();
  timestamp+=300001;
  assert.equal(expiring.acceptCallback(authResponse(pending.authorizationUrl)).status,'expired');
  assert.equal(expiring.acceptCallback(authResponse(pending.authorizationUrl)).status,'no-pending-authentication');
});
test('OAuth cancellation never returns code or code verifier',async()=>{
  const flow=fixture();
  const started=await flow.begin();
  const redirect=new URL(config.redirectUri);
  redirect.searchParams.set('error','access_denied');
  redirect.searchParams.set('state',new URL(started.authorizationUrl).searchParams.get('state'));
  redirect.searchParams.set('iss',config.issuer);
  assert.deepEqual(flow.acceptCallback(redirect.href),{status:'authorization-denied'});
  assert.deepEqual(flow.acceptCallback(authResponse(started.authorizationUrl)),
    {status:'no-pending-authentication'});
});
test('bad configuration or unavailable cryptographic randomness fails closed',async()=>{
  for(const bad of [
    {issuer:'http://login.seyveo.example/realms/seyveo'},
    {authorizationEndpoint:'http://login.seyveo.example/authorize'},
    {authorizationEndpoint:'https://attacker.invalid/authorize'},
    {redirectUri:'http://app.seyveo.example/authorize/callback'},
    {redirectUri:'https://app.seyveo.example/'},
    {redirectUri:'https://user:pass@app.seyveo.example/authorize/callback'},
    {redirectUri:'https://app.seyveo.example/authorize/callback#frag'},
    {clientId:'bad client ID'},
    {randomBytes:null},
    {sha256:null}
  ])assert.throws(()=>fixture(bad),TypeError);
  const missingRng=fixture({randomBytes:async()=>{throw Error('No CSPRNG available')}});
  await assert.rejects(missingRng.begin(),/Secure native authorization unavailable/);
  const weakRng=fixture({randomBytes:async()=>new Uint8Array(16)});
  await assert.rejects(weakRng.begin(),/Secure native authorization unavailable/);
  const missingDigest=fixture({sha256:async()=>new Uint8Array(12)});
  await assert.rejects(missingDigest.begin(),/Secure native authorization unavailable/);
});
test('starting a new authorization invalidates pending asynchronous earlier attempt',async()=>{
  let resume;
  let firstCall=true;
  const flow=fixture({
    randomBytes:async()=>{
      if(firstCall){
        firstCall=false;
        return new Promise(resolve=>{resume=resolve});
      }
      return randomBytes(96);
    }
  });
  const first=flow.begin();
  await Promise.resolve();
  const second=await flow.begin();
  resume(randomBytes(96));
  assert.deepEqual(await first,{status:'superseded'});
  assert.equal(flow.acceptCallback(authResponse(second.authorizationUrl)).status,'exchange-required');
});
