'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {checkPermission,checkInviteRole}=require('../policy.cjs');

const id='person-1',org='org-1';
const person=(role,branchId,extra={})=>({
  userId:id,organizationId:org,membershipStatus:'active',
  grants:[{role,...(branchId?{branchId}: {})}],...extra
});
const resource=(props={})=>({
  organizationId:org,branchId:'branch-1',classification:'general',
  assigneeUserId:'person-2',...props
});

test('owner can read company documents but never a personal vault',()=>{
  assert.equal(checkPermission(person('owner'),'documents.read',resource()).allowed,true);
  assert.equal(checkPermission(person('owner'),'documents.read',resource({classification:'personal-vault'})).allowed,false);
});

test('cross-organization data is always denied',()=>{
  assert.equal(checkPermission(person('owner'),'documents.read',resource({organizationId:'org-2'})).allowed,false);
});

test('inactive or missing server membership is denied',()=>{
  assert.equal(checkPermission(person('owner',null,{membershipStatus:'revoked'}),'documents.read',resource()).allowed,false);
  assert.equal(checkPermission(null,'documents.read',resource()).allowed,false);
});

test('an unknown or signature action is denied even for owner',()=>{
  assert.equal(checkPermission(person('owner'),'documents.sign',resource()).allowed,false);
  assert.equal(checkPermission(person('owner'),'unknown.action',resource()).allowed,false);
});

test('employee reads own assigned document in own branch',()=>{
  const actor=person('employee','branch-1');
  assert.equal(checkPermission(actor,'documents.read',resource({assigneeUserId:id})).allowed,true);
  assert.equal(checkPermission(actor,'documents.approve',resource({assigneeUserId:id})).allowed,true);
  assert.equal(checkPermission(actor,'documents.approve',resource()).allowed,false);
  assert.equal(checkPermission(actor,'documents.edit',resource({assigneeUserId:id})).allowed,false);
  assert.equal(checkPermission(actor,'documents.send',resource({assigneeUserId:id})).allowed,false);
});

test('branch-scoped role cannot read another branch',()=>{
  const actor=person('employee','branch-1');
  assert.equal(checkPermission(actor,'documents.read',resource({branchId:'branch-2',assigneeUserId:id})).allowed,false);
  assert.equal(checkPermission(person('employee'),'documents.read',resource({assigneeUserId:id})).allowed,false);
});

test('store manager does not see HR or finance documents',()=>{
  const actor=person('store_manager','branch-1');
  assert.equal(checkPermission(actor,'documents.read',resource({classification:'general'})).allowed,true);
  assert.equal(checkPermission(actor,'documents.read',resource({classification:'hr'})).allowed,false);
  assert.equal(checkPermission(actor,'documents.read',resource({classification:'finance'})).allowed,false);
});

test('HR and accounting have separate document classifications',()=>{
  assert.equal(checkPermission(person('hr'),'documents.read',resource({classification:'hr'})).allowed,true);
  assert.equal(checkPermission(person('hr'),'documents.read',resource({classification:'finance'})).allowed,false);
  assert.equal(checkPermission(person('accountant'),'documents.read',resource({classification:'finance'})).allowed,true);
  assert.equal(checkPermission(person('accountant'),'documents.read',resource({classification:'hr'})).allowed,false);
});

test('employee only sees assigned tasks and own work schedule',()=>{
  const actor=person('employee','branch-1');
  assert.equal(checkPermission(actor,'tasks.read',resource({assigneeUserId:id})).allowed,true);
  assert.equal(checkPermission(actor,'tasks.read',resource()).allowed,false);
  assert.equal(checkPermission(actor,'schedule.read',resource({userId:id})).allowed,true);
  assert.equal(checkPermission(actor,'schedule.read',resource({userId:'person-2'})).allowed,false);
});

test('HR may invite basic employees but not grant elevated roles',()=>{
  const actor=person('hr');
  assert.equal(checkInviteRole(actor,resource(),'employee').allowed,true);
  assert.equal(checkInviteRole(actor,resource(),'accountant').allowed,false);
  assert.equal(checkInviteRole(actor,resource(),'owner').allowed,false);
});

test('owner may invite accounting but cannot transfer ownership via invite',()=>{
  const actor=person('owner');
  assert.equal(checkInviteRole(actor,resource(),'accountant').allowed,true);
  assert.equal(checkInviteRole(actor,resource(),'owner').allowed,false);
});

test('store manager invitations must stay within own branch',()=>{
  const actor=person('store_manager','branch-1');
  assert.equal(checkInviteRole(actor,resource(),'employee').allowed,true);
  assert.equal(checkInviteRole(actor,resource({branchId:'branch-2'}),'employee').allowed,false);
});
