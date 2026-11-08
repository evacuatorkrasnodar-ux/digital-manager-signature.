import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {createStagingOidcReadiness} from './check-oidc-ready.mjs';

const host='auth.example-company.org';
const issuer='https://'+host+'/realms/seyveo';
const discovery=issuer+'/.well-known/openid-configuration';
const jwksUri=issuer+'/protocol/openid-connect/certs';
const metadata=()=>({
  issuer,authorization_endpoint:issuer+'/protocol/openid-connect/auth',
  token_endpoint:issuer+'/protocol/openid-connect/token',
  jwks_uri:jwksUri,
  authorization_response_iss_parameter_supported:true,
  response_types_supported:['code'],
  code_challenge_methods_supported:['S256']
});
const {publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwks=()=>({keys:[{
  ...publicKey.export({format:'jwk'}),
  kid:'operator-test-key',kty:'RSA',alg:'RS256',use:'sig',key_ops:['verify']
}]});
const response=value=>new Response(JSON.stringify(value),{
  status:200,headers:{'Content-Type':'application/json'}
});
function fixture({settings=metadata(),keys=jwks(),failure}={}){
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push({url,options});
    if(failure)return failure(url);
    if(url===discovery)return response(settings);
    if(url===jwksUri)return response(keys);
    throw new Error('Untrusted URL');
  };
  return {
    calls,ready:createStagingOidcReadiness({
      authHost:host,fetchImpl,now:()=>Date.parse('2026-11-08T12:00:00Z')
    })
  };
}

test('strict public metadata+RSA keys+PKCE+callback issuer pass with no secret tokens',async()=>{
  const f=fixture();
  assert.deepEqual(await f.ready.check(),{status:'public-oidc-ready'});
  assert.deepEqual(f.calls.map(c=>c.url),[discovery,jwksUri]);
  for(const call of f.calls){
    assert.equal(call.options.method,'GET');
    assert.equal(call.options.redirect,'manual');
    assert.equal(call.options.credentials,'omit');
    assert.equal(call.options.cache,'no-store');
    assert.equal(call.options.referrerPolicy,'no-referrer');
    assert.deepEqual(call.options.headers,{Accept:'application/json'});
    assert.equal('Authorization' in call.options.headers,false);
  }
});

test('RFC 9207 issuer-response support is mandatory for SEYVEO native callback',async()=>{
  for(const flag of [false,undefined,'true',null]){
    const settings=metadata();
    if(flag===undefined)delete settings.authorization_response_iss_parameter_supported;
    else settings.authorization_response_iss_parameter_supported=flag;
    assert.deepEqual(await fixture({settings}).ready.check(),{status:'blocked'});
  }
});

test('wrong issuer, missing PKCE, password-style flow or foreign JWKS host blocked',async()=>{
  for(const changes of [
    {issuer:'https://attacker.org/realms/seyveo'},
    {code_challenge_methods_supported:['plain']},
    {response_types_supported:['token']},
    {jwks_uri:'https://attacker.org/jwks'},
    {authorization_endpoint:'http://'+host+'/auth'},
    {token_endpoint:'https://attacker.org/token'}
  ]){
    const settings={...metadata(),...changes};
    assert.deepEqual(await fixture({settings}).ready.check(),{status:'blocked'});
  }
});

test('invalid, private or weak JWT signing keys cannot mark provider ready',async()=>{
  for(const keys of [
    {keys:[]},
    {keys:[{...jwks().keys[0],alg:'HS256'}]},
    {keys:[{...jwks().keys[0],d:'secret-private-exponent'}]},
    {keys:[{...jwks().keys[0],kty:'oct'}]}
  ])assert.deepEqual(await fixture({keys}).ready.check(),{status:'blocked'});
});

test('public provider outage, HTML, redirects, and bad JSON never leak error data',async()=>{
  const cases=[
    async()=>{throw new Error('private API secrets in exception')},
    async()=>new Response('not json',{headers:{'Content-Type':'text/html'}}),
    async()=>new Response('',{status:302,headers:{Location:'https://attacker.org'}}),
    async()=>new Response('{broken',{headers:{'Content-Type':'application/json'}})
  ];
  for(const failure of cases){
    const result=await fixture({failure}).ready.check();
    assert.deepEqual(result,{status:'blocked'});
    assert.equal(JSON.stringify(result).includes('secret'),false);
  }
});

test('invalid operator configuration rejected before any network request',()=>{
  for(const authHost of [
    'localhost','auth.example.invalid','auth.test','https://auth.example-company.org',
    '192.0.2.1','evil.org:8443','user@evil.org','evil.org/path','other.internal'
  ]){
    assert.throws(()=>createStagingOidcReadiness({
      authHost,fetchImpl:async()=>{throw new Error('should not fetch')}
    }),TypeError);
  }
});
