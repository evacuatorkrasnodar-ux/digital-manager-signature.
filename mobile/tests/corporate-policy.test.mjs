import test from 'node:test';
import assert from 'node:assert/strict';
import {allowed,invitePreview} from '../src/work/corporate-policy.mjs';
const m=(role,status='active',organizationId='org-a',branchIds=['branch-1'])=>({role,status,organizationId,branchIds});
const check=(membership,permission,extra={})=>allowed({membership,permission,organizationId:'org-a',branchId:'branch-1',subjectUserId:'person-1',resourceAssigneeId:'person-1',...extra});
test('denies missing, suspended, revoked, cross-organization, and unknown role',()=>{
 assert.equal(check(null,'tasks:read'),false);
 assert.equal(check(m('employee','revoked'),'tasks:read'),false);
 assert.equal(check(m('employee','suspended'),'tasks:read'),false);
 assert.equal(check(m('owner','active','org-b'),'org:manage'),false);
 assert.equal(check(m('superadmin'),'org:manage'),false);
});
test('employee sees only assigned tasks; cannot manage, invite, or read arbitrary files',()=>{
 assert.equal(check(m('employee'),'tasks:read'),true);
 assert.equal(check(m('employee'),'tasks:read',{resourceAssigneeId:'other'}),false);
 for(const p of ['roles:assign','members:invite','members:revoke','org:manage','files:read','tasks:review'])
  assert.equal(check(m('employee'),p),false,p);
});
test('manager is scoped to branches and cannot change roles',()=>{
 assert.equal(check(m('manager'),'tasks:create'),true);
 assert.equal(check(m('manager'),'tasks:create',{branchId:'branch-2'}),false);
 assert.equal(check(m('manager'),'roles:assign'),false);
 assert.equal(check(m('manager'),'members:invite'),false);
 assert.equal(check(m('manager','active','org-a',null),'tasks:create'),false);
});
test('owner can manage memberships but never receives personal vault access',()=>{
 assert.equal(check(m('owner'),'members:invite'),true);
 assert.equal(check(m('owner'),'members:revoke'),true);
 assert.equal(check(m('owner'),'personal:read'),false);
});
test('preview invitation is non-functional and rejects invalid inputs',()=>{
 const d=invitePreview({organizationId:'org-a',branchId:'branch-1',role:'employee',expiresAt:Date.now()+60000});
 assert.equal(d.status,'preview-only');
 assert.equal('token' in d,false);
 assert.throws(()=>invitePreview({organizationId:'org-a',branchId:'branch-1',role:'admin',expiresAt:Date.now()+60000}));
 assert.throws(()=>invitePreview({organizationId:'org-a',branchId:'branch-1',role:'employee',expiresAt:Date.now()-1}));
});
