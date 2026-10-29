import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createNativePkceFlow} from '../src/auth/native-pkce-core.mjs';
import {createNativeCodeExchange} from '../src/auth/native-code-exchange.mjs';

const provider=Object.freeze({
  issuer:'https://login.seyveo.example/realms/seyveo',
  authorizationEndpoint:'https://login.seyveo.example/realms/seyveo/protocol/openid-connect/auth',
  tokenEndpoint:'https://login.seyveo.example/realms/seyveo/protocol/openid-connect/token',
  redirectUri:'https://app.seyveo.example/authorize/callback',
  clientId:'seyveo-native'
});
const clock=Date.parse('2026-10-29T12:00:00Z');
const sessionTokens=Object.freeze({
  access_token:'synthetic-access-token-0123456789',
  id_token:'synthetic-signed-id-token-0123456789',
  refresh_token:'synthetic-refresh-token-0123456789',
  expires_in:300,
  token_type:'Bearer'
});
function response(body=sessionTokens, options={}){
  const raw=options.raw??JSON.stringify(body);
  const mime=options.mime??'application/json; charset=utf-8';
  return {
    status:options.status??200,
    type:options.type??'basic',
    headers:{get:key=>key==='content-type'?mime:
      key==='content-length'?(options.length??String(Buffer.byteLength(raw))):null},
    text:async()=>raw
  };
}
async function grant(){
  const flow=createNativePkceFlow({
    ...provider,
    randomBytes:async count=>randomBytes(count),
    sha256:async bytes=>createHash('sha256').update(bytes).digest(),
    now:()=>clock
  });
  const started=await flow.begin();
  assert.equal(started.status,'browser-required');
  const authorized=new URL(provider.redirectUri);
  authorized.searchParams.set('state',new URL(started.authorizationUrl).searchParams.get('state'));
  authorized.searchParams.set('code','synthetic-authorization-code-9876543');
  authorized.searchParams.set('iss',provider.issuer);
  const result=flow.acceptCallback(authorized.href);
  assert.equal(result.status,'exchange-required');
  return result;
}
const fixture=(overrides={})=>{
  const called={fetch:[],verify:[],save:[]};
  const exchange=createNativeCodeExchange({
    issuer:provider.issuer,tokenEndpoint:provider.tokenEndpoint,
    redirectUri:provider.redirectUri,clientId:provider.clientId,
    now:()=>clock,
    fetchImpl:async(url,options)=>{
      called.fetch.push({url,options});return response();
    },
    verifyIdToken:async args=>{
      called.verify.push(args);
      return {verified:true,iss:provider.issuer,aud:provider.clientId,
        nonce:args.expectedNonce,sub:'subject-123',exp:Math.floor(clock/1000)+600};
    },
    saveVerifiedSession:async record=>{called.save.push(record)},
    ...overrides
  });
  return {exchange,called};
};

test('one-use PKCE grant exchanges through exact HTTPS endpoint and stores only verified OIDC session',async()=>{
  const g=await grant(), f=fixture();
  const result=await f.exchange.redeem(g);
  assert.deepEqual(result,{status:'stored'});
  assert.equal(f.called.fetch.length,1);
  assert.equal(f.called.fetch[0].url,provider.tokenEndpoint);
  const {options}=f.called.fetch[0];
  assert.equal(options.method,'POST');
  assert.equal(options.redirect,'manual');
  assert.equal(options.credentials,'omit');
  assert.equal(options.cache,'no-store');
  assert.equal(options.referrerPolicy,'no-referrer');
  assert.equal(options.headers['Content-Type'],'application/x-www-form-urlencoded');
  const body=new URLSearchParams(options.body);
  assert.deepEqual([...body.keys()],[
    'grant_type','code','redirect_uri','client_id','code_verifier'
  ]);
  assert.equal(body.get('grant_type'),'authorization_code');
  assert.equal(body.get('code'),g.authorizationCode);
  assert.equal(body.get('code_verifier'),g.codeVerifier);
  assert.equal(body.get('redirect_uri'),provider.redirectUri);
  assert.equal(body.get('client_id'),provider.clientId);
  assert.equal(options.body.includes('client_secret'),false);
  assert.equal(options.body.includes(g.nonce),false);
  assert.deepEqual(f.called.verify,[{
    idToken:sessionTokens.id_token,
    expectedIssuer:provider.issuer,
    expectedAudience:provider.clientId,
    expectedNonce:g.nonce
  }]);
  assert.equal(f.called.save.length,1);
  assert.deepEqual(f.called.save[0],{
    issuer:provider.issuer,subject:'subject-123',clientId:provider.clientId,
    accessToken:sessionTokens.access_token,
    idToken:sessionTokens.id_token,
    refreshToken:sessionTokens.refresh_token,
    accessTokenExpiresIn:300,
    idTokenExpiresAt:clock+600_000
  });
  assert.deepEqual(await f.exchange.redeem(g),{status:'used'});
  assert.equal(f.called.fetch.length,1);
});

test('refuses unverified, mismatched or malformed grants before network access',async()=>{
  const g=await grant(), f=fixture();
  for(const bad of [
    null,{status:'authorization-denied'}, {...g,clientId:'evil-app'},
    {...g,issuer:'https://attacker.invalid'},
    {...g,redirectUri:'https://evil.invalid/cb'},
    {...g,codeVerifier:'short'}, {...g,nonce:'short'},
    {...g,authorizationCode:'x'},
    {...g,authorizationCode:'x\nbad'}
  ])assert.deepEqual(await f.exchange.redeem(bad),{status:'rejected'});
  assert.equal(f.called.fetch.length,0);
  assert.deepEqual(await f.exchange.redeem(g),{status:'stored'});
});

test('redirects, cookies, error statuses, MIME mismatch or oversized replies never store credentials',async()=>{
  const replies=[
    response({}, {status:302}),
    response({}, {status:401}),
    response({}, {type:'opaqueredirect'}),
    response(sessionTokens,{mime:'text/plain'}),
    response(sessionTokens,{length:'9999999'}),
    response(sessionTokens,{raw:'x'.repeat(25000),length:''}),
    response(sessionTokens,{raw:'{invalid-json'}),
    null
  ];
  for(const reply of replies){
    const f=fixture({fetchImpl:async()=>reply});
    assert.deepEqual(await f.exchange.redeem(await grant()),{status:'unavailable'});
    assert.equal(f.called.save.length,0);
  }
});

test('token type, required credentials and response expiry are rejected before verifying ID token',async()=>{
  const bodies=[
    {...sessionTokens,token_type:'mac'},
    {...sessionTokens,access_token:''},
    {...sessionTokens,id_token:null},
    {...sessionTokens,expires_in:0},
    {...sessionTokens,expires_in:3601},
    {...sessionTokens,expires_in:'300'},
    {...sessionTokens,refresh_token:'bad'},
    {...sessionTokens,refresh_token:[]}
  ];
  for(const body of bodies){
    const f=fixture({fetchImpl:async()=>response(body)});
    assert.deepEqual(await f.exchange.redeem(await grant()),{status:'verification-failed'});
    assert.equal(f.called.verify.length,0);
    assert.equal(f.called.save.length,0);
  }
});

test('unverified or mismatched signed ID token claims cannot be stored',async()=>{
  const g=await grant();
  const base={verified:true,iss:provider.issuer,aud:provider.clientId,
    nonce:g.nonce,sub:'person-123',exp:Math.floor(clock/1000)+180};
  const modifications=[
    {verified:false},{verified:undefined},{iss:'https://evil.invalid'},
    {aud:'another-client'},{nonce:'wrong'}, {sub:''},
    {exp:Math.floor(clock/1000)}, {exp:'unknown'}
  ];
  for(const change of modifications){
    const f=fixture({verifyIdToken:async()=>({...base,...change})});
    assert.deepEqual(await f.exchange.redeem(g),{status:'verification-failed'});
    assert.equal(f.called.save.length,0);
  }
});

test('verification/storage failure or TLS/network error fails closed and never prints secrets',async()=>{
  const g=await grant();
  const errors=[
    {verifyIdToken:async()=>{throw Error('unsafe-'+sessionTokens.id_token)}},
    {saveVerifiedSession:async()=>{throw Error('unsafe-'+sessionTokens.access_token)}},
    {fetchImpl:async()=>{throw Error('unsafe-'+g.authorizationCode)}}
  ];
  for(const override of errors){
    const f=fixture(override);
    assert.deepEqual(await f.exchange.redeem(g),{status:'unavailable'});
    assert.deepEqual(await f.exchange.redeem(g),{status:'used'});
  }
});

test('mismatched, noncanonical or untrusted OAuth endpoint configuration fails closed',()=>{
  const overrides=[
    {issuer:'http://login.seyveo.example'},
    {tokenEndpoint:'http://login.seyveo.example/oauth/token'},
    {tokenEndpoint:'https://evil.invalid/oauth/token'},
    {tokenEndpoint:'https://login.seyveo.example/'},
    {tokenEndpoint:'https://name:secret@login.seyveo.example/oauth/token'},
    {tokenEndpoint:'https://login.seyveo.example/oauth/token?forward=https://evil.invalid'},
    {redirectUri:'http://app.seyveo.example/authorize/callback'},
    {redirectUri:'https://app.seyveo.example'},
    {clientId:'bad client'},
    {verifyIdToken:undefined},
    {saveVerifiedSession:undefined}
  ];
  for(const change of overrides)
    assert.throws(()=>fixture(change),TypeError,JSON.stringify(change));
});

test('issuer root URL and access-only response without ID token cannot silently authenticate',async()=>{
  const g=await grant();
  const f=fixture({
    fetchImpl:async()=>response({
      access_token:sessionTokens.access_token,
      expires_in:300,token_type:'Bearer'
    })
  });
  assert.deepEqual(await f.exchange.redeem(g),{status:'verification-failed'});
  assert.equal(f.called.save.length,0);
});
