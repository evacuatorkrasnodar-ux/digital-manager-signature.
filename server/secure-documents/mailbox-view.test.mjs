import test from 'node:test';
import assert from 'node:assert/strict';
import {projectDocumentMailbox} from './mailbox-view.mjs';

const context=(userId='elena',organizationId='org-one')=>({
 actor:{userId},membership:{userId,organizationId,status:'active',role:'employee'},
 organizationId
});
const doc=(overrides={})=>({
 id:'d1',organizationId:'org-one',creatorUserId:'boss',
 recipientUserId:'elena',type:'acknowledgement',status:'sent',
 title:'Учебный приказ',body:'Private text must never be in an inbox list',
 createdAt:'2026-10-27T10:00:00.000Z',updatedAt:'2026-10-27T10:00:00.000Z',
 ...overrides
});
test('employee inbox contains only their addressed documents with no content',()=>{
 const docs=[doc(),doc({id:'d2',recipientUserId:'tanya'}),doc({id:'d3',organizationId:'org-two'})];
 const box=projectDocumentMailbox({...context(),documents:docs,folder:'inbox'});
 assert.equal(box.total,1);assert.equal(box.pending,1);assert.equal(box.documents[0].id,'d1');
 assert.equal(box.documents[0].body,undefined);
 assert.equal(JSON.stringify(box).includes('Private text must'),false);
});
test('outbox contains only authored documents; no role leakage',()=>{
 const docs=[doc(),doc({id:'d2',creatorUserId:'tanya',recipientUserId:'boss'}),
  doc({id:'d3',creatorUserId:'boss',recipientUserId:'anna',status:'approved'})];
 const box=projectDocumentMailbox({...context('boss'),documents:docs,folder:'outbox'});
 assert.deepEqual(box.documents.map(x=>x.id).sort(),['d1','d3']);
 assert.equal(box.pending,1);
 assert.equal(projectDocumentMailbox({...context('elena'),documents:docs,folder:'outbox'}).total,0);
});
test('completed documents remain in history, pending count is accurate',()=>{
 const docs=[doc(),doc({id:'read',status:'read'}),doc({id:'complete',status:'acknowledged'}),
  doc({id:'revoked',status:'revoked'})];
 const box=projectDocumentMailbox({...context(),documents:docs,folder:'inbox'});
 assert.equal(box.total,4);assert.equal(box.pending,2);
});
test('wrong tenant, revoked membership, forged session context and unknown folder deny',()=>{
 const docs=[doc()];
 for(const bad of [
  {...context(),membership:{...context().membership,status:'revoked'}},
  {...context(),actor:{userId:'tanya'}},
  {...context(),membership:{...context().membership,organizationId:'org-two'}},
  {...context(),organizationId:'org-two'}
 ]){
  assert.throws(()=>projectDocumentMailbox({...bad,documents:docs,folder:'inbox'}));
 }
 assert.throws(()=>projectDocumentMailbox({...context(),documents:docs,folder:'others'}));
});
test('items are ordered by latest update, with no additional server fields',()=>{
 const docs=[doc({id:'old'}),doc({id:'new',updatedAt:'2026-10-28T14:00:00.000Z',token:'private'})];
 const box=projectDocumentMailbox({...context(),documents:docs,folder:'inbox'});
 assert.deepEqual(box.documents.map(x=>x.id),['new','old']);
 assert.equal(box.documents[0].token,undefined);
});
