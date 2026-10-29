import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrainingInvitations} from './dev-invitations.mjs';

function sample(){
  const users=new Map([['owner',{userId:'owner',role:'owner'}]]);
  const memberships=new Map([['owner',{userId:'owner',role:'owner',organizationId:'demo-org',status:'active'}]]);
  let time=Date.parse('2026-10-29T12:00:00Z');
  const revoked=[];
  const invitations=createTrainingInvitations({
    users,memberships,organizationId:'demo-org',
    now:()=>time,
    makeEmployeeAccount:(id,password)=>{
      if(typeof password!=='string'||password.length<12)
        throw new Error('Invalid training password.');
      return {userId:id,role:'employee',password};
    },
    revokeSessions:id=>revoked.push(id)
  });
  return {users,memberships,invitations,revoked,advance:ms=>{time+=ms}};
}
test('codes are single-use, 32-byte random and stored as hashes only',()=>{
  const s=sample();
  const first=s.invitations.create({actorUserId:'owner',employeeLogin:'tanya'});
  assert.match(first.code,/^[A-Za-z0-9_-]{43}$/);
  assert.match(first.invitation.id,/^[0-9a-f-]{36}$/);
  assert.equal(JSON.stringify(first.invitation).includes(first.code),false);
  assert.throws(()=>s.invitations.create({actorUserId:'owner',employeeLogin:'tanya'}));
  assert.throws(()=>s.invitations.redeem({code:first.code,password:'weak'}));
  assert.equal(s.users.has('tanya'),false);
  assert.equal(s.memberships.has('tanya'),false);
  const created=s.invitations.redeem({code:first.code,password:'fictional-test-password'});
  assert.equal(created.user.id,'tanya');
  assert.equal(s.memberships.get('tanya').role,'employee');
  assert.throws(()=>s.invitations.redeem({code:first.code,password:'fictional-test-password'}));
  assert.throws(()=>s.invitations.create({actorUserId:'owner',employeeLogin:'tanya'}));
  assert.throws(()=>s.invitations.create({actorUserId:'employee',employeeLogin:'another'}));
});
test('expired invitations cannot be redeemed and no longer reserve usernames',()=>{
  const s=sample();
  const first=s.invitations.create({actorUserId:'owner',employeeLogin:'marina'});
  s.advance(15*60*1000);
  assert.throws(()=>s.invitations.redeem({code:first.code,password:'fictional-test-password'}));
  const replacement=s.invitations.create({actorUserId:'owner',employeeLogin:'marina'});
  assert.notEqual(first.code,replacement.code);
  assert.equal(s.invitations.redeem({code:replacement.code,password:'fictional-test-password'}).user.id,'marina');
});
test('redeem attempts are capped per time window without burning valid unused invites',()=>{
  const s=sample();
  const invite=s.invitations.create({actorUserId:'owner',employeeLogin:'boris'});
  for(let i=0;i<10;i++){
    assert.throws(()=>s.invitations.redeem({code:'bad',password:'fictional-test-password'}));
  }
  assert.throws(()=>s.invitations.redeem({code:invite.code,password:'fictional-test-password'}),/Too many/);
  assert.equal(s.users.has('boris'),false);
  s.advance(60*1000);
  assert.equal(s.invitations.redeem({code:invite.code,password:'fictional-test-password'}).user.id,'boris');
});
test('only owner can revoke an employee; revoked identity is never reinstated by new invitation',()=>{
  const s=sample();
  const code=s.invitations.create({actorUserId:'owner',employeeLogin:'worker'}).code;
  s.invitations.redeem({code,password:'fictional-test-password'});
  assert.throws(()=>s.invitations.revoke({actorUserId:'worker',userId:'worker'}));
  assert.throws(()=>s.invitations.revoke({actorUserId:'owner',userId:'owner'}));
  s.invitations.revoke({actorUserId:'owner',userId:'worker'});
  assert.equal(s.memberships.get('worker').status,'revoked');
  assert.deepEqual(s.revoked,['worker']);
  assert.throws(()=>s.invitations.create({actorUserId:'owner',employeeLogin:'worker'}));
});
