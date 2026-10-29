import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {
  createEmployeeQrInviteLink,parseEmployeeQrInviteLink
} from '../src/auth/employee-qr-invite.mjs';
import {createBusinessIdentityBoundary} from '../../server/business-identity/identity-boundary.mjs';

const inviteLinkBase='https://join.seyveo.example/join/employee/';
const invitationCode=randomBytes(32).toString('base64url');
const ownerToken='O'.repeat(48);
const elenaToken='E'.repeat(48);
const outsiderToken='X'.repeat(48);
const date=Date.parse('2026-10-29T12:00:00Z');

test('owner-provided invite secret becomes an exact QR link without role or personal data',()=>{
  const link=createEmployeeQrInviteLink({inviteLinkBase,invitationCode});
  assert.equal(link,inviteLinkBase+invitationCode);
  assert.equal(link.includes('employeeRole='),false);
  assert.equal(link.includes('employeeEmail='),false);
  assert.deepEqual(parseEmployeeQrInviteLink({inviteLinkBase,scannedValue:link}),{
    status:'invite-present',invitationCode
  });
});

test('QR parser refuses unrelated domains, plaintext HTTP, redirects, parameters and embedded credentials',()=>{
  const good=createEmployeeQrInviteLink({inviteLinkBase,invitationCode});
  const rejected=[
    '',null,undefined,'not-a-qr',good+'?role=owner',
    good+'?next=https%3A%2F%2Fevil.invalid',
    good+'#access_token=anything',
    good+'/',good+'.',' '+good,
    good.replace('https://','http://'),
    good.replace('join.seyveo.example','join.seyveo.example.attacker.invalid'),
    good.replace('join.seyveo.example','attacker.invalid'),
    good.replace('/join/employee/','/join/admin/'),
    good.replace('/join/employee/','/join/employee/%2e%2e/'),
    good.replace(invitationCode,'A'.repeat(42)),
    good.replace(invitationCode,'A'.repeat(44)),
    good.replace(invitationCode,'%41'+invitationCode.slice(1)),
    good.replace('https://','https://user:pass@'),
    good+'x'.repeat(2100)
  ];
  for(const scannedValue of rejected){
    assert.deepEqual(parseEmployeeQrInviteLink({inviteLinkBase,scannedValue}),{
      status:'invalid-qr'
    },String(scannedValue).slice(0,85));
  }
});

test('untrusted QR origins cannot be configured as official company invite URLs',()=>{
  const badBases=[
    'http://join.seyveo.example/join/employee/',
    'https://localhost/join/employee/',
    'https://join.seyveo.local/join/employee/',
    'https://join.seyveo.example/',
    'https://join.seyveo.example/join/employee',
    'https://join.seyveo.example/join/employee/?role=owner',
    'https://join.seyveo.example/join/employee/#fragment',
    'https://user:pass@join.seyveo.example/join/employee/',
    'https://join.seyveo.example:444/join/employee/',
    'https://join.seyveo.example/join/employee/../admin/',
    'https://join.seyveo.example/%6aoin/employee/',
    ''
  ];
  for(const base of badBases){
    assert.throws(()=>createEmployeeQrInviteLink({
      inviteLinkBase:base,invitationCode
    }),TypeError,base);
  }
  assert.throws(()=>createEmployeeQrInviteLink({
    inviteLinkBase,invitationCode:'invalid'
  }),TypeError);
});

test('scanning a QR grants nothing; only its intended authenticated employee can redeem once',async()=>{
  const issuedCode=createHash('sha256').update(invitationCode).digest('hex');
  const pending=new Map([[issuedCode,{
    id:'invitation-1',
    organizationId:'fictional-company-1',
    userId:'elena',
    role:'employee',
    consumed:false,
    expiresAt:date+60_000
  }]]);
  const memberships=new Map([
    ['owner',{userId:'owner',role:'owner',organizationId:'fictional-company-1',status:'active'}]
  ]);
  const verified=new Map([
    [ownerToken,{userId:'owner',sessionId:'owner-device-1'}],
    [elenaToken,{userId:'elena',sessionId:'employee-device-1'}]
  ]);
  let transactionCalls=0;
  const identity=createBusinessIdentityBoundary({
    now:()=>date,
    verifySession:async token=>{
      const person=verified.get(token);
      return person?{
        ...person,subjectType:'person',audience:'seyveo-native',
        revoked:false,expiresAt:date+300_000
      }:null;
    },
    loadMembership:async ({organizationId,userId})=>{
      const record=memberships.get(userId);
      return record?.organizationId===organizationId?record:null;
    },
    loadDocument:async()=>null,
    loadInvitation:async ({codeDigest})=>pending.get(codeDigest)||null,
    redeemInvitation:async ({invitationId,codeDigest,userId,organizationId,role})=>{
      transactionCalls++;
      const record=pending.get(codeDigest);
      if(!record||record.consumed||record.id!==invitationId||
         record.expiresAt<=date||record.userId!==userId||
         record.organizationId!==organizationId||role!=='employee')return false;
      pending.set(codeDigest,{...record,consumed:true});
      memberships.set(userId,{userId,organizationId,role:'employee',status:'active'});
      return true;
    }
  });
  const link=createEmployeeQrInviteLink({inviteLinkBase,invitationCode});
  const scan=parseEmployeeQrInviteLink({inviteLinkBase,scannedValue:link});
  assert.equal(scan.status,'invite-present');
  assert.equal(memberships.has('elena'),false);
  assert.equal(await identity.acceptVerifiedInvitation({
    token:outsiderToken,code:scan.invitationCode
  }),false);
  assert.equal(await identity.acceptVerifiedInvitation({
    token:ownerToken,code:scan.invitationCode
  }),false);
  assert.equal(memberships.has('elena'),false);
  assert.equal(await identity.acceptVerifiedInvitation({
    token:elenaToken,code:scan.invitationCode
  }),true);
  assert.equal(memberships.get('elena')?.role,'employee');
  assert.equal(memberships.get('owner')?.role,'owner');
  assert.equal(await identity.acceptVerifiedInvitation({
    token:elenaToken,code:scan.invitationCode
  }),false);
  assert.equal(transactionCalls,1);
  assert.equal(await identity.canAccessPersonal({
    token:ownerToken,accountUserId:'elena'
  }),false);
  assert.equal(await identity.canAccessPersonal({
    token:elenaToken,accountUserId:'elena'
  }),true);
});

test('expired or manager-role invitations are refused even with a correctly scanned QR',async()=>{
  for(const bad of [{expiresAt:date-1},{role:'owner'},{consumed:true}]){
    let invoked=0;
    const boundary=createBusinessIdentityBoundary({
      now:()=>date,
      verifySession:async()=>({
        userId:'elena',sessionId:'elena-device',
        audience:'seyveo-native',subjectType:'person',
        revoked:false,expiresAt:date+60_000
      }),
      loadMembership:async()=>null,
      loadDocument:async()=>null,
      loadInvitation:async()=>({
        id:'invite-1',userId:'elena',
        organizationId:'fictional-company-1',role:'employee',
        expiresAt:date+60_000,consumed:false,...bad
      }),
      redeemInvitation:async()=>{invoked++;return true}
    });
    assert.equal(await boundary.acceptVerifiedInvitation({
      token:elenaToken,code:invitationCode
    }),false);
    assert.equal(invoked,0);
  }
});
