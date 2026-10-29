import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrainingInvitations} from '../secure-documents/dev-invitations.mjs';

test('director invites Elena and Tanya; redemption, isolation and revocation',()=>{
 const users=new Map(),memberships=new Map([['owner',{userId:'owner',organizationId:'demo-company',role:'owner',status:'active'}]]);
 const revoked=[];
 const invitations=createTrainingInvitations({
  users,memberships,organizationId:'demo-company',
  makeEmployeeAccount:(userId,password)=>{
   if(typeof password!=='string'||password.length<12)throw Error('weak password');
   return {userId,role:'employee'};
  },
  revokeSessions:userId=>revoked.push(userId),
  now:()=>Date.parse('2026-10-29T12:00:00Z')
 });
 assert.throws(()=>invitations.create({actorUserId:'elena',employeeLogin:'tanya'}));
 const elena=invitations.create({actorUserId:'owner',employeeLogin:'elena'});
 const tanya=invitations.create({actorUserId:'owner',employeeLogin:'tanya'});
 assert.notEqual(elena.code,tanya.code);
 assert.equal(invitations.members({actorUserId:'owner'}).length,1);
 assert.throws(()=>invitations.redeem({code:elena.code,password:'short'}));
 assert.equal(invitations.redeem({code:elena.code,password:'elena-long-pass'}).user.id,'elena');
 assert.equal(invitations.redeem({code:tanya.code,password:'tanya-long-pass'}).user.id,'tanya');
 assert.throws(()=>invitations.redeem({code:elena.code,password:'elena-long-pass'}));
 assert.equal(invitations.members({actorUserId:'owner'}).length,3);
 assert.throws(()=>invitations.revoke({actorUserId:'elena',userId:'tanya'}));
 invitations.revoke({actorUserId:'owner',userId:'elena'});
 assert.equal(memberships.get('elena').status,'revoked');
 assert.equal(memberships.get('tanya').status,'active');
 assert.deepEqual(revoked,['elena']);
 assert.throws(()=>invitations.revoke({actorUserId:'owner',userId:'owner'}));
});
