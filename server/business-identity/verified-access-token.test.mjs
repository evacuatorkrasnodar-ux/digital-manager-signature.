import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {createVerifiedJwtAccessSession} from './verified-access-token.mjs';
import {createBusinessIdentityBoundary} from './identity-boundary.mjs';

const issuer='https://login.seyveo.example';
const audience='https://api.seyveo.example';
const clientId='seyveo-native-app';
const nowSeconds=Number.parseInt(Date.parse('2026-10-29T12:00:00Z')/1000);
const now=()=>nowSeconds*1000;
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
const otherKeys=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...keys.publicKey.export({format:'jwk'}),kid:'primary-key',
  use:'sig',alg:'RS256',key_ops:['verify']};
let revoked=false,active=true,online=true;
const identity=()=>({
  userId:'elena',active,subjectType:'person'
});
const config=()=>({
  issuer,audience,clientId,jwks:[jwk],now,
  resolvePerson:async({issuer:iss,subject,clientId:cid})=>{
    if(!online||iss!==issuer||subject!=='subject-1'||cid!==clientId)
      throw Error('No trusted user account');
    return identity();
  },
  isRevoked:async()=>{if(!online)throw Error('Revocation store down');return revoked}
});
const header=()=>({alg:'RS256',typ:'at+jwt',kid:'primary-key'});
const claims=()=>({
  iss:issuer,sub:'subject-1',aud:audience,client_id:clientId,
  iat:nowSeconds-30,exp:nowSeconds+300,jti:'session-1'
});
const json=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const issue=({h={},c={},key=keys.privateKey}={})=>{
  const part1=json({...header(),...h}),part2=json({...claims(),...c});
  return part1+'.'+part2+'.'+
    sign('RSA-SHA256',Buffer.from(part1+'.'+part2,'ascii'),key).toString('base64url');
};
const create=options=>createVerifiedJwtAccessSession({...config(),...options});

test('verifies a signed at+jwt, maps its subject to trusted person and checks revocation',async()=>{
  revoked=false;active=true;online=true;
  let lookups=0;
  const verifySession=create({
    resolvePerson:async ({issuer:iss,subject,clientId:cid})=>{
      lookups++;assert.equal(iss,issuer);assert.equal(subject,'subject-1');
      assert.equal(cid,clientId);return {userId:'elena',active:true,subjectType:'person'};
    },
    isRevoked:async ({issuer:iss,subject,jti,userId})=>{
      assert.deepEqual({issuer:iss,subject,jti,userId},{
        issuer,subject:'subject-1',jti:'session-1',userId:'elena'
      });return false;
    }
  });
  const result=await verifySession(issue());
  assert.deepEqual(result,{
    userId:'elena',sessionId:'session-1',audience:'seyveo-native',
    subjectType:'person',revoked:false,expiresAt:(nowSeconds+300)*1000
  });
  assert.equal(Object.isFrozen(result),true);
  assert.equal(lookups,1);
});

test('wrong signature, unknown kid, non-access-token type and algorithm confusion fail',async()=>{
  const verifySession=create();
  const broken=issue();
  for(const token of [
    issue({key:otherKeys.privateKey}),
    broken.slice(0,-2)+'ab',
    issue({h:{kid:'unknown'}}),
    issue({h:{typ:'JWT'}}),
    issue({h:{typ:'id+jwt'}}),
    issue({h:{alg:'none'}}),
    issue({h:{alg:'HS256'}}),
    issue({h:{jku:'https://attacker.invalid/jwks'}}),
    issue({h:{jwk:jwk}}),
    issue({h:{x5u:'https://attacker.invalid/cert'}}),
    issue({h:{crit:['exp']}}),
    'not.a.jwt.with.four.parts',
    'not-even-close',
    '',
    null
  ])assert.equal(await verifySession(token),null,String(token).slice(0,35));
});

test('issuer, audience, client identity, expiry and required claims must match',async()=>{
  const verifySession=create();
  const bad=[
    {iss:'https://attacker.example'},
    {aud:'https://something-else.invalid'},
    {aud:[]},
    {aud:['https://something-else.invalid']},
    {aud:[audience,audience]},
    {client_id:'untrusted-client'},
    {sub:'../other-person'},
    {sub:''},
    {jti:'../session'},
    {jti:null},
    {iat:nowSeconds+31},
    {iat:0},
    {exp:nowSeconds},
    {exp:nowSeconds-1},
    {exp:nowSeconds+4000},
    {nbf:nowSeconds+31},
    {nbf:0},
    {exp:nowSeconds-40,iat:nowSeconds-20}
  ];
  for(const invalid of bad)
    assert.equal(await verifySession(issue({c:invalid})),null,JSON.stringify(invalid));
  const good=await verifySession(issue({c:{
    aud:[audience,'https://another-allowed-resource.example'],
    nbf:nowSeconds-30
  }}));
  assert.equal(good?.userId,'elena');
});

test('tampered payload, invalid encoding and large body cannot enter identity adapter',async()=>{
  const verifySession=create();
  const valid=issue();
  const [head,body,sig]=valid.split('.');
  for(const token of [
    [head,json({...claims(),sub:'owner'}),sig].join('.'),
    [head,body+'!',sig].join('.'),
    valid+'.',
    valid+'.extra',
    'A'.repeat(9000),
    [head,json({...claims(),large:'x'.repeat(6000)}),sig].join('.')
  ])assert.equal(await verifySession(token),null);
});

test('revoked sessions, inactive accounts, machine subjects or offline status fail closed',async()=>{
  const token=issue();
  revoked=true;
  assert.equal(await create()(token),null);
  revoked=false;active=false;
  assert.equal(await create()(token),null);
  active=true;
  const machine=create({resolvePerson:async()=>({
    userId:'bot',active:true,subjectType:'service'
  })});
  assert.equal(await machine(token),null);
  const untrusted=create({isRevoked:async()=>undefined});
  assert.equal(await untrusted(token),null);
  online=false;
  assert.equal(await create()(token),null);
  online=true;
});

test('key sets must be preapproved public RSA verification keys, never token-controlled',()=>{
  const invalid=[
    [],
    [{...jwk,kid:'bad key'}],
    [{...jwk,alg:'HS256'}],
    [{...jwk,use:'enc'}],
    [{...jwk,key_ops:['sign']}],
    [jwk,jwk],
    [{...jwk,d:'secret'}],
    [{...jwk,dp:'private'}],
    [{...jwk,kty:'oct'}]
  ];
  for(const jwks of invalid)
    assert.throws(()=>createVerifiedJwtAccessSession({...config(),jwks}),TypeError);
  for(const override of [
    {issuer:'http://login.seyveo.example'},
    {issuer:'https://user:pass@login.seyveo.example'},
    {issuer:'https://login.seyveo.example?bad=1'},
    {clientId:''},
    {audience:''},
    {isRevoked:undefined},
    {resolvePerson:undefined}
  ])assert.throws(()=>createVerifiedJwtAccessSession({...config(),...override}),TypeError);
});

test('JWT verification plugs into existing One-versus-Business boundary without trusting roles',async()=>{
  const signed=issue({c:{role:'owner',organization_id:'other-business'}});
  const verifier=create({
    resolvePerson:async()=>({userId:'elena',active:true,subjectType:'person'}),
    isRevoked:async()=>false
  });
  const identityBoundary=createBusinessIdentityBoundary({
    verifySession:verifier,now,
    loadMembership:async ({userId,organizationId})=>({
      userId,organizationId,role:'employee',status:'active'
    }),
    loadDocument:async ({organizationId,documentId})=>({
      id:documentId,organizationId,creatorUserId:'owner',
      recipientUserId:'elena',type:'approval',status:'sent'
    }),
    loadInvitation:async()=>null,
    redeemInvitation:async()=>false
  });
  assert.equal(await identityBoundary.canAccessPersonal({
    token:signed,accountUserId:'elena'
  }),true);
  assert.equal(await identityBoundary.canAccessPersonal({
    token:signed,accountUserId:'owner'
  }),false);
  assert.equal(await identityBoundary.canAccessBusiness({
    token:signed,organizationId:'business-1',operation:'view-workspace'
  }),true);
  assert.equal(await identityBoundary.canAccessBusiness({
    token:signed,organizationId:'business-1',operation:'invite-employee'
  }),false);
  assert.equal(await identityBoundary.canAccessBusiness({
    token:signed,organizationId:'business-1',operation:'create-document'
  }),false);
  assert.equal(await identityBoundary.canAccessBusiness({
    token:signed,organizationId:'business-1',operation:'act-on-document',
    documentId:'document-1',action:'approve'
  }),true);
  assert.equal(await identityBoundary.canAccessBusiness({
    token:signed,organizationId:'business-1',operation:'act-on-document',
    documentId:'document-1',action:'revoke'
  }),false);
  const forged=issue({c:{iss:'https://other.invalid',role:'owner'}});
  assert.equal(await identityBoundary.canAccessBusiness({
    token:forged,organizationId:'business-1',operation:'view-workspace'
  }),false);
});
