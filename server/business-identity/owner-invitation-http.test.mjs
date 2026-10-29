import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createBusinessIdentityBoundary} from './identity-boundary.mjs';
import {createOwnerInvitationHttpContract} from './owner-invitation-http.mjs';
import {createHttpsOwnerInviteClient} from '../../mobile/src/business/https-owner-invite-client.mjs';
import {prepareEmployeeInviteDelivery} from '../../mobile/src/business/employee-invite-delivery.mjs';
import {parseEmployeeQrInviteLink} from '../../mobile/src/auth/employee-qr-invite.mjs';

const origin='https://business.seyveo.example';
const linkBase='https://join.seyveo.example/join/employee/';
const time=Date.parse('2026-10-29T12:00:00Z');
const ownerToken='O'.repeat(48);
const workerToken='E'.repeat(48);
const otherToken='T'.repeat(48);
const org='company-1';
const digest=code=>createHash('sha256').update(code).digest('hex');

function fixture(overrides={}){
  const records=new Map(),memberships=new Map([
    [org+':owner',{organizationId:org,userId:'owner',role:'owner',status:'active'}],
    [org+':elena',{organizationId:org,userId:'elena',role:'employee',status:'active'}]
  ]);
  const verified=new Map([
    [ownerToken,{userId:'owner',sessionId:'session-owner'}],
    [workerToken,{userId:'elena',sessionId:'session-elena'}],
    [otherToken,{userId:'tanya',sessionId:'session-tanya'}]
  ]);
  const recipients=new Map([
    ['tanya',{userId:'tanya',verified:true,active:true}],
    ['worker2',{userId:'worker2',verified:true,active:true}]
  ]);
  const calls={create:0,cancel:0,recipient:0};
  const identity=createBusinessIdentityBoundary({
    now:()=>time,
    verifySession:async token=>{
      const person=verified.get(token);
      return person?{...person,audience:'seyveo-native',
        subjectType:'person',revoked:false,expiresAt:time+1800_000}:null;
    },
    loadMembership:async ({userId,organizationId})=>
      memberships.get(organizationId+':'+userId)||null,
    loadDocument:async()=>null,
    loadInvitation:async ({codeDigest})=>
      Array.from(records.values()).find(i=>i.codeDigest===codeDigest)||null,
    redeemInvitation:async ({invitationId,codeDigest,userId,organizationId,role})=>{
      const item=records.get(invitationId);
      if(!item||item.codeDigest!==codeDigest||item.userId!==userId||
         item.organizationId!==organizationId||item.role!==role||
         item.consumed||item.expiresAt<=time)return false;
      item.consumed=true;
      memberships.set(organizationId+':'+userId,{
        userId,organizationId,role:'employee',status:'active'
      });
      return true;
    }
  });
  const service=createOwnerInvitationHttpContract({
    apiOrigin:origin,identity,now:()=>time,
    resolveVerifiedRecipient:async ({employeeLogin})=>{
      calls.recipient++;return recipients.get(employeeLogin)||null;
    },
    issueInvitationAtomic:async ({
      invitationId,codeDigest,organizationId,employeeLogin,
      recipientUserId,role,issuedAt,expiresAt,assertOwnerActive
    })=>{
      calls.create++;
      if(!(await assertOwnerActive()))return false;
      const recipient=recipients.get(employeeLogin);
      if(role!=='employee'||!recipient||recipient.userId!==recipientUserId||
         !recipient.verified||!recipient.active||
         memberships.has(organizationId+':'+recipientUserId)||
         Array.from(records.values()).some(x=>
           x.organizationId===organizationId&&x.userId===recipientUserId&&!x.consumed))
        return false;
      if(Array.from(records.values()).filter(x=>x.organizationId===organizationId).length>=20)
        return false;
      records.set(invitationId,{
        id:invitationId,codeDigest,organizationId,
        userId:recipientUserId,role,employeeLogin,issuedAt,expiresAt,consumed:false
      });
      return true;
    },
    revokeInvitationAtomic:async ({
      organizationId,invitationId,assertOwnerActive
    })=>{
      calls.cancel++;
      if(!(await assertOwnerActive()))return false;
      const item=records.get(invitationId);
      if(!item||item.organizationId!==organizationId||item.consumed)return false;
      records.delete(invitationId);return true;
    },
    ...overrides
  });
  const session={
    token:ownerToken,sessionId:'session-owner',organizationId:org,
    expiresAt:time+900_000
  };
  const native=createHttpsOwnerInviteClient({
    apiOrigin:origin,organizationId:org,inviteLinkBase:linkBase,
    now:()=>time,getSession:async()=>session,
    fetchImpl:async (url,init)=>service.handle(new Request(url,init))
  });
  return {records,memberships,verified,recipients,service,native,
    identity,calls,session};
}
const post=(body,token=ownerToken,organizationId=org,extra={})=>
  new Request(origin+'/v1/organizations/'+organizationId+'/invitations',{
    method:'POST',headers:{
      Authorization:'Bearer '+token,'Content-Type':'application/json',...extra
    },body:typeof body==='string'?body:JSON.stringify(body)
  });
const del=(id,token=ownerToken,organizationId=org)=>
  new Request(origin+'/v1/organizations/'+organizationId+'/invitations/'+id,{
    method:'DELETE',headers:{Authorization:'Bearer '+token}
  });

test('native director QR + share link works with authenticated server, verified-person acceptance',async()=>{
  const f=fixture();
  const created=await f.native.create({employeeLogin:'tanya'});
  assert.equal(created.status,'issued');
  assert.equal(created.serverResponse.invitation.employeeLogin,'tanya');
  assert.equal(f.records.size,1);
  const row=[...f.records.values()][0];
  assert.equal(row.role,'employee');
  assert.equal(row.userId,'tanya');
  assert.equal(row.codeDigest,digest(created.serverResponse.code));
  assert.equal(JSON.stringify(row).includes(created.serverResponse.code),false);
  const display=prepareEmployeeInviteDelivery({
    inviteLinkBase:linkBase,serverResponse:created.serverResponse,now:()=>time
  });
  assert.equal(display.status,'ready');
  assert.deepEqual(parseEmployeeQrInviteLink({
    inviteLinkBase:linkBase,scannedValue:display.url
  }),{status:'invite-present',invitationCode:created.serverResponse.code});
  assert.equal(await f.identity.canAccessBusiness({
    token:otherToken,organizationId:org,operation:'invite-employee'
  }),false);
  assert.equal(await f.identity.acceptVerifiedInvitation({
    token:workerToken,code:created.serverResponse.code
  }),false);
  assert.equal(await f.identity.acceptVerifiedInvitation({
    token:otherToken,code:created.serverResponse.code
  }),true);
  assert.equal(await f.identity.acceptVerifiedInvitation({
    token:otherToken,code:created.serverResponse.code
  }),false);
  assert.equal(f.memberships.get(org+':tanya').role,'employee');
  assert.equal(await f.identity.canAccessPersonal({
    token:ownerToken,accountUserId:'tanya'
  }),false);
});

test('director can revoke one-time invitation before employee uses QR',async()=>{
  const f=fixture();
  const created=await f.native.create({employeeLogin:'tanya'});
  assert.equal(created.status,'issued');
  assert.deepEqual(await f.native.cancel({
    invitationId:created.serverResponse.invitation.id
  }),{status:'cancelled'});
  assert.equal(f.records.size,0);
  assert.equal(await f.identity.acceptVerifiedInvitation({
    token:otherToken,code:created.serverResponse.code
  }),false);
  assert.equal(f.calls.cancel,1);
});

test('employee, outsider, revoked owner, wrong tenant cannot create or revoke',async()=>{
  const f=fixture();
  for(const token of [workerToken,otherToken,'X'.repeat(48)]){
    assert.equal((await f.service.handle(post({employeeLogin:'tanya'},token))).status,403);
    assert.equal((await f.service.handle(del('invitation-1',token))).status,403);
  }
  assert.equal((await f.service.handle(post({employeeLogin:'tanya'},ownerToken,
    'another-company'))).status,403);
  f.memberships.set(org+':owner',{
    organizationId:org,userId:'owner',role:'employee',status:'active'
  });
  assert.equal((await f.service.handle(post({employeeLogin:'tanya'}))).status,403);
  f.memberships.delete(org+':owner');
  assert.equal((await f.service.handle(post({employeeLogin:'tanya'}))).status,403);
  assert.equal(f.calls.create,0);
  assert.equal(f.calls.cancel,0);
});

test('verified recipient is mandatory; responses do not enumerate accounts',async()=>{
  const f=fixture();
  const missing=await f.service.handle(post({employeeLogin:'nobody'}));
  assert.equal(missing.status,409);
  assert.deepEqual(await missing.json(),{error:'unavailable'});
  f.recipients.set('nobody',{userId:'nobody',verified:false,active:true});
  assert.equal((await f.service.handle(post({employeeLogin:'nobody'}))).status,409);
  f.recipients.set('nobody',{userId:'nobody',verified:true,active:false});
  assert.equal((await f.service.handle(post({employeeLogin:'nobody'}))).status,409);
  assert.equal(f.records.size,0);
});

test('reject client role claims, body oversize, browser origin, other host',async()=>{
  const f=fixture();
  for(const body of [
    {employeeLogin:'tanya',role:'owner'},
    {employeeLogin:'tanya',organizationId:'other-company'},
    {employeeLogin:'tanya',redirect:'https://evil.invalid'},
    {employeeLogin:'Tanya'},
    {employeeLogin:'../tanya'},
    {employeeLogin:'x'.repeat(2049)}
  ])assert.equal((await f.service.handle(post(body))).status,400);
  assert.equal((await f.service.handle(post({employeeLogin:'tanya'},
    ownerToken,org,{Origin:'https://other.example'}))).status,403);
  assert.equal((await f.service.handle(new Request(
    'https://attacker.invalid/v1/organizations/company-1/invitations',{
      method:'POST',headers:{Authorization:'Bearer '+ownerToken,
        'Content-Type':'application/json'},
      body:'{"employeeLogin":"tanya"}'
    }))).status,403);
  assert.equal(f.records.size,0);
});

test('atomic store prohibits concurrent duplicate invitations',async()=>{
  const f=fixture();
  const responses=await Promise.all([
    f.native.create({employeeLogin:'tanya'}),
    f.native.create({employeeLogin:'tanya'})
  ]);
  assert.deepEqual(responses.map(x=>x.status).sort(),['conflict','issued']);
  assert.equal(f.records.size,1);
});

test('revoked owner between identity checks cannot issue or receive code',async()=>{
  const f=fixture({
    resolveVerifiedRecipient:async()=>{
      f.memberships.set(org+':owner',{
        userId:'owner',organizationId:org,role:'employee',status:'active'
      });
      return {userId:'tanya',verified:true,active:true};
    }
  });
  const response=await f.service.handle(post({employeeLogin:'tanya'}));
  assert.equal(response.status,403);
  assert.deepEqual(await response.json(),{error:'not-authorized'});
  assert.equal(f.records.size,0);
});

test('response is no-store, with generic errors that never echo invite secret',async()=>{
  const f=fixture();
  const response=await f.service.handle(post({employeeLogin:'worker2'}));
  assert.equal(response.status,201);
  assert.match(response.headers.get('cache-control'),/no-store/);
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  const answer=await response.json();
  assert.equal(answer.code.length,43);
  const forbidden=await f.service.handle(del(answer.invitation.id,workerToken));
  assert.equal(forbidden.status,403);
  assert.equal(JSON.stringify(await forbidden.json()).includes(answer.code),false);
});

test('incomplete adapters or insecure origins cannot initialize service',()=>{
  const f=fixture();
  for(const override of [
    {apiOrigin:'http://business.seyveo.example'},
    {apiOrigin:'https://localhost'},
    {apiOrigin:'https://other.example/not-origin'},
    {identity:null},{resolveVerifiedRecipient:null},
    {issueInvitationAtomic:null},{revokeInvitationAtomic:null}
  ])assert.throws(()=>createOwnerInvitationHttpContract({
    apiOrigin:origin,identity:f.identity,
    resolveVerifiedRecipient:async()=>null,
    issueInvitationAtomic:async()=>false,revokeInvitationAtomic:async()=>false,
    ...override
  }),TypeError);
});
