import test from 'node:test';
import assert from 'node:assert/strict';
import {transitionMembership,validateMembershipRecord} from '../src/work/membership-lifecycle.mjs';
import {allowed} from '../src/work/corporate-policy.mjs';
const base={organizationId:'company-a',userId:'elena',role:'employee',branchIds:['shop-1'],status:'invited'};
const can=(membership)=>allowed({membership,organizationId:'company-a',branchId:'shop-1',permission:'tasks:read',subjectUserId:'elena',resourceAssigneeId:'elena'});
test('invite preview grants nothing; accepted membership allows only own assigned tasks',()=>{
 assert.equal(validateMembershipRecord(base),true);
 assert.equal(can(base),false);
 const accepted=transitionMembership(base,'accept');
 assert.equal(accepted.ok,true);
 assert.equal(can(accepted.membership),true);
 assert.equal(allowed({membership:accepted.membership,organizationId:'company-a',branchId:'shop-1',permission:'tasks:read',subjectUserId:'elena',resourceAssigneeId:'tanya'}),false);
 assert.equal(can({...accepted.membership,organizationId:'company-b'}),false);
});
test('revocation denies all work access and cannot be undone by accepting old invite',()=>{
 const active=transitionMembership(base,'accept').membership;
 const revoked=transitionMembership(active,'revoke');
 assert.equal(revoked.ok,true);
 assert.equal(can(revoked.membership),false);
 assert.deepEqual(transitionMembership(revoked.membership,'accept'),{ok:false,reason:'not-invited'});
 assert.deepEqual(transitionMembership(revoked.membership,'revoke'),{ok:false,reason:'already-revoked'});
});
test('role change is not client-side enrollment and no personal vault permission exists',()=>{
 const active=transitionMembership(base,'accept').membership;
 assert.equal(allowed({membership:active,organizationId:'company-a',branchId:'shop-1',permission:'members:invite'}),false);
 assert.equal(allowed({membership:active,organizationId:'company-a',branchId:'shop-1',permission:'personal:read'}),false);
 assert.equal(validateMembershipRecord({...base,userId:''}),false);
 assert.equal(validateMembershipRecord({...base,branchIds:[null]}),false);
});
