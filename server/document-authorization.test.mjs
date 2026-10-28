import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canCreateDocument, canReadDocument, canReadDocumentAudit,
  canTransitionDocument, documentReadScope
} from './document-authorization.mjs';

const actor = userId => ({ userId });
const member = (userId, organizationId='org-a', role='employee', status='active') =>
  ({userId, organizationId, role, status});
const doc = (overrides={}) => ({
  id:'doc-1', organizationId:'org-a', creatorUserId:'boss',
  recipientUserId:'elena', type:'acknowledgement', status:'sent', ...overrides
});
const access = (userId, role='employee', document=doc()) =>
  ({ actor:actor(userId), membership:member(userId,'org-a',role), document });

test('manager may create documents only in her own active organization',()=>{
  assert.equal(canCreateDocument({actor:actor('boss'),membership:member('boss','org-a','manager'),organizationId:'org-a'}),true);
  assert.equal(canCreateDocument({actor:actor('boss'),membership:member('boss','org-a','manager'),organizationId:'org-b'}),false);
  assert.equal(canCreateDocument({actor:actor('elena'),membership:member('elena','org-a','employee'),organizationId:'org-a'}),false);
});
test('deny missing, inactive or forged principal/membership',()=>{
  assert.equal(canReadDocument({actor:actor('elena'),membership:member('elena','org-a','employee','revoked'),document:doc()}),false);
  assert.equal(canReadDocument({actor:actor('other'),membership:member('elena'),document:doc()}),false);
  assert.equal(canReadDocument({actor:actor('elena'),membership:{...member('elena'),role:'superadmin'},document:doc()}),false);
  assert.equal(canReadDocument({actor:actor('elena'),membership:null,document:doc()}),false);
});
test('tenant boundary is strict even for owners',()=>{
  assert.equal(canReadDocument({actor:actor('owner'),membership:member('owner','org-b','owner'),document:doc()}),false);
  assert.equal(canTransitionDocument({actor:actor('owner'),membership:member('owner','org-b','owner'),document:doc(),action:'revoke'}),false);
});
test('employee cannot read other employees documents',()=>{
  assert.equal(canReadDocument(access('elena')),true);
  assert.equal(canReadDocument(access('tanya')),false);
  assert.equal(canReadDocument(access('boss','manager')),true);
});
test('other managers cannot automatically read a private document',()=>{
  assert.equal(canReadDocument(access('other-manager','manager')),false);
  assert.equal(canReadDocument(access('owner','owner')),true);
  assert.equal(canReadDocumentAudit(access('tanya')),false);
});
test('recipient may read and acknowledge an acknowledgement request',()=>{
  assert.equal(canTransitionDocument({...access('elena'),action:'read'}),true);
  assert.equal(canTransitionDocument({...access('elena'),action:'acknowledge'}),true);
  assert.equal(canTransitionDocument({...access('elena'),action:'approve'}),false);
});
test('recipient may approve or return an approval request, not acknowledge',()=>{
  const document=doc({type:'approval',status:'read'});
  assert.equal(canTransitionDocument({...access('elena','employee',document),action:'approve'}),true);
  assert.equal(canTransitionDocument({...access('elena','employee',document),action:'return'}),true);
  assert.equal(canTransitionDocument({...access('elena','employee',document),action:'acknowledge'}),false);
});
test('non-recipient cannot approve or acknowledge, even as issuer',()=>{
  assert.equal(canTransitionDocument({...access('boss','manager'),action:'acknowledge'}),false);
  assert.equal(canTransitionDocument({...access('tanya'),action:'acknowledge'}),false);
  assert.equal(canTransitionDocument({...access('owner','owner'),action:'acknowledge'}),false);
});
test('issuer or org owner may revoke pending documents but not completed documents',()=>{
  assert.equal(canTransitionDocument({...access('boss','manager'),action:'revoke'}),true);
  assert.equal(canTransitionDocument({...access('owner','owner'),action:'revoke'}),true);
  assert.equal(canTransitionDocument({...access('elena'),action:'revoke'}),false);
  assert.equal(canTransitionDocument({...access('boss','manager',doc({status:'acknowledged'})),action:'revoke'}),false);
});
test('terminal states and unknown actions deny transitions',()=>{
  for(const status of ['approved','returned','revoked','acknowledged']){
    assert.equal(canTransitionDocument({...access('elena','employee',doc({status})),action:'read'}),false);
    assert.equal(canTransitionDocument({...access('elena','employee',doc({status,type:'approval'})),action:'approve'}),false);
  }
  assert.equal(canTransitionDocument({...access('elena'),action:'sign'}),false);
});
test('list queries are tenant-scoped and user-scoped',()=>{
  assert.deepEqual(documentReadScope({actor:actor('elena'),membership:member('elena'),organizationId:'org-a'}),
    {organizationId:'org-a',userId:'elena'});
  assert.deepEqual(documentReadScope({actor:actor('boss'),membership:member('boss','org-a','owner'),organizationId:'org-a'}),
    {organizationId:'org-a',userId:null});
  assert.equal(documentReadScope({actor:actor('boss'),membership:member('boss','org-a','owner'),organizationId:'org-b'}),null);
});
test('document shape must be valid',()=>{
  assert.equal(canReadDocument(access('elena','employee',doc({recipientUserId:''}))),false);
  assert.equal(canReadDocument(access('elena','employee',doc({status:'invalid'}))),false);
});
