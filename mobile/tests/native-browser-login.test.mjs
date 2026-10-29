import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createNativePkceFlow} from '../src/auth/native-pkce-core.mjs';
import {createNativeBrowserLogin} from '../src/auth/native-browser-login.mjs';
import {createNativeCodeExchange} from '../src/auth/native-code-exchange.mjs';

const issuer='https://login.seyveo.example/realms/seyveo';
const authorizationEndpoint=issuer+'/protocol/openid-connect/auth';
const tokenEndpoint=issuer+'/protocol/openid-connect/token';
const redirectUri='com.seyveo.digitalmanager:/oauth2redirect';
const httpsRedirect='https://app.seyveo.example/authorize/callback';
const clientId='seyveo-native';
const time=Date.parse('2026-10-29T12:00:00Z');
const provider=(redirectMode='private-use',uri=redirectUri)=>({
  issuer,authorizationEndpoint,redirectUri:uri,clientId,redirectMode,
  randomBytes:async size=>randomBytes(size),
  sha256:async bytes=>createHash('sha256').update(bytes).digest(),
  now:()=>time
});
function callback(authUrl,target=redirectUri,change={}){
  const params=new URL(authUrl).searchParams;
  const c=new URL(target);
  c.searchParams.set('state',change.state??params.get('state'));
  c.searchParams.set('code',change.code??'authorized-code-012345678901');
  c.searchParams.set('iss',change.iss??issuer);
  if(change.extra)c.searchParams.set('role','owner');
  return c.href;
}
function setupBrowser(overrides={}){
  const flow=createNativePkceFlow(provider());
  const calls={open:[],grant:[]};
  const bridge=createNativeBrowserLogin({
    flow,redirectUri,platform:'ios',
    openAuthSession:async(url,redirect,options)=>{
      calls.open.push({url,redirect,options});
      return {type:'success',url:callback(url)};
    },
    exchangeGrant:async grant=>{
      calls.grant.push(grant);
      return {status:'stored'};
    },
    ...overrides
  });
  return {bridge,calls};
}

test('iPhone X style private URI opens system browser, accepts matching PKCE callback then stores only verified exchange',async()=>{
  const f=setupBrowser();
  assert.deepEqual(await f.bridge.signIn(),{status:'signed-in'});
  assert.equal(f.calls.open.length,1);
  assert.equal(f.calls.open[0].redirect,redirectUri);
  assert.equal(f.calls.open[0].options.preferUniversalLinks,false);
  assert.equal(f.calls.open[0].options.preferEphemeralSession,false);
  const start=new URL(f.calls.open[0].url);
  assert.equal(start.origin,new URL(issuer).origin);
  assert.equal(start.searchParams.get('redirect_uri'),redirectUri);
  assert.equal(start.searchParams.get('code_challenge_method'),'S256');
  assert.equal(start.searchParams.get('response_type'),'code');
  assert.equal(start.searchParams.has('client_secret'),false);
  assert.equal(f.calls.grant.length,1);
  assert.equal(f.calls.grant[0].redirectUri,redirectUri);
  assert.equal(f.calls.grant[0].nonce.length,43);
  assert.equal(f.calls.grant[0].codeVerifier.length,43);
  assert.equal(JSON.stringify(f.bridge).includes(f.calls.grant[0].authorizationCode),false);
});

test('browser cancellation and error do not exchange tokens',async()=>{
  for(const result of [
    {type:'cancel'},{type:'dismiss'}, {type:'error'}, {type:'success'},
    {type:'success',url:'https://evil.example/?code=stolen'}
  ]){
    const f=setupBrowser({openAuthSession:async()=>result});
    const status=await f.bridge.signIn();
    assert.ok(['cancelled','unavailable'].includes(status.status));
    assert.equal(f.calls.grant.length,0);
  }
});

test('a matching issuer and state is mandatory; no authority comes from malicious callback',async()=>{
  for(const edit of [
    url=>callback(url,redirectUri,{iss:'https://evil.example'}),
    url=>callback(url,redirectUri,{state:'X'.repeat(43)}),
    url=>callback(url,redirectUri,{extra:true}),
    url=>callback(url,'com.seyveo.digitalmanager:/other'),
    url=>callback(url).replace('com.seyveo.digitalmanager:', 'otherapp:')
  ]){
    let exchange=0;
    const f=setupBrowser({
      openAuthSession:async url=>({type:'success',url:edit(url)}),
      exchangeGrant:async()=>{exchange++;return {status:'stored'}}
    });
    assert.deepEqual(await f.bridge.signIn(),{status:'unavailable'});
    assert.equal(exchange,0);
  }
});

test('exchange cannot report sign-in without trusted verified and stored session',async()=>{
  for(const payload of [
    {status:'verification-failed'}, {status:'unavailable'},
    {status:'rejected'}, {status:'used'}, null
  ]){
    const f=setupBrowser({exchangeGrant:async()=>payload});
    assert.deepEqual(await f.bridge.signIn(),{status:'unavailable'});
  }
  const f=setupBrowser({exchangeGrant:async()=>{throw Error('secret access token')}});
  assert.deepEqual(await f.bridge.signIn(),{status:'unavailable'});
});

test('overlapping native system browser attempts are blocked',async()=>{
  let release;
  const pending=new Promise(resolve=>{release=resolve});
  let launches=0;
  const f=setupBrowser({
    openAuthSession:async url=>{
      launches++;await pending;
      return {type:'success',url:callback(url)};
    }
  });
  const first=f.bridge.signIn();
  assert.deepEqual(await f.bridge.signIn(),{status:'busy'});
  release();
  assert.deepEqual(await first,{status:'signed-in'});
  assert.equal(launches,1);
});

test('only exact reverse-domain callback is allowed; claimed HTTPS requires proven native association',()=>{
  const flow=createNativePkceFlow(provider());
  for(const config of [
    {redirectUri:'seyveo://login'},
    {redirectUri:'com.seyveo.digitalmanager://oauth2redirect'},
    {redirectUri:'http://app.seyveo.example/callback'},
    {redirectMode:'claimed-https',redirectUri:httpsRedirect},
    {redirectMode:'some-other-mode'}
  ]){
    assert.throws(()=>createNativeBrowserLogin({
      flow,redirectUri,platform:'ios',
      openAuthSession:async()=>({type:'cancel'}),
      exchangeGrant:async()=>({status:'stored'}),
      ...config
    }),TypeError);
  }
  assert.throws(()=>createNativePkceFlow(provider('private-use','seyveo:/oauth2redirect')),TypeError);
  assert.throws(()=>createNativePkceFlow(provider('claimed-https',redirectUri)),TypeError);
  const httpsFlow=createNativePkceFlow(provider('claimed-https',httpsRedirect));
  assert.ok(createNativeBrowserLogin({
    flow:httpsFlow,redirectUri:httpsRedirect,
    redirectMode:'claimed-https',verifiedHttpsCallbackReady:true,
    platform:'ios',openAuthSession:async()=>({type:'cancel'}),
    exchangeGrant:async()=>({status:'stored'})
  }));
});

test('private-use PKCE authorization code still requires cryptographically VERIFIED ID token before secure store',async()=>{
  const f=setupBrowser();
  let stored=null;
  const exchange=createNativeCodeExchange({
    issuer,tokenEndpoint,redirectUri,clientId,redirectMode:'private-use',
    now:()=>time,
    fetchImpl:async()=>new Response(JSON.stringify({
      access_token:'fictional-access-token-12345678',
      id_token:'fictional-id-token-123456789012',
      token_type:'Bearer',expires_in:120
    }),{status:200,headers:{'Content-Type':'application/json'}}),
    verifyIdToken:async ({expectedNonce,expectedIssuer,expectedAudience})=>({
      verified:true,nonce:expectedNonce,
      iss:expectedIssuer,aud:expectedAudience,
      sub:'person-123',exp:Math.floor(time/1000)+120
    }),
    saveVerifiedSession:async session=>{stored=session}
  });
  const secure=setupBrowser({
    openAuthSession:async url=>({type:'success',url:callback(url)}),
    exchangeGrant:grant=>exchange.redeem(grant)
  });
  assert.deepEqual(await secure.bridge.signIn(),{status:'signed-in'});
  assert.equal(stored?.subject,'person-123');
  assert.equal(stored?.clientId,clientId);

  const refused=createNativeCodeExchange({
    issuer,tokenEndpoint,redirectUri,clientId,redirectMode:'private-use',
    now:()=>time,
    fetchImpl:async()=>new Response(JSON.stringify({
      access_token:'fictional-access-token-12345678',
      id_token:'fictional-id-token-123456789012',
      token_type:'Bearer',expires_in:120
    }),{status:200,headers:{'Content-Type':'application/json'}}),
    verifyIdToken:async()=>({verified:false}),
    saveVerifiedSession:async()=>{throw Error('unexpected store')}
  });
  const noSignIn=setupBrowser({exchangeGrant:grant=>refused.redeem(grant)});
  assert.deepEqual(await noSignIn.bridge.signIn(),{status:'unavailable'});
});

test('Expo native scheme is registered, and existing M1 personal vault screen stays unchanged',async()=>{
  const config=JSON.parse(await readFile(new URL('../app.json',import.meta.url),'utf8'));
  const schemes=Array.isArray(config.expo.scheme)?config.expo.scheme:[config.expo.scheme];
  assert.ok(schemes.includes('com.seyveo.digitalmanager'));
  const app=await readFile(new URL('../App.tsx',import.meta.url),'utf8');
  assert.equal(app.includes('createExpoNativeLogin'),false);
});
