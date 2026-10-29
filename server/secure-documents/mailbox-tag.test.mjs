import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mailboxTag,mailboxUnchanged } from './mailbox-tag.mjs';

const key=Buffer.alloc(32,17);
const actor={userId:'elena'};
const organizationId='demo-org';
const doc={id:'d1',title:'Synthetic notice',status:'sent',type:'acknowledgement',
 organizationId,createdAt:'2026-10-29T00:00:00Z',updatedAt:'2026-10-29T00:00:00Z'};
const box={folder:'inbox',documents:[doc],total:1,pending:1};

test('stable revision tag for identical authorised mailbox',()=>{
 const args={masterKey:key,actor,organizationId,mailbox:box};
 const tag=mailboxTag(args);
 assert.equal(mailboxTag(args),tag);
 assert.match(tag,/^"svdm-[A-Za-z0-9_-]+"$/);
 assert.equal(tag.includes('Synthetic notice'),false);
 assert.equal(mailboxUnchanged(tag,tag),true);
 assert.equal(mailboxUnchanged(' '+tag+' ',tag),true);
});
test('changes when data or identity changes',()=>{
 const base=mailboxTag({masterKey:key,actor,organizationId,mailbox:box});
 const scenarios=[
  {actor:{userId:'owner'},organizationId,mailbox:box,masterKey:key},
  {actor,organizationId:'other-company',mailbox:box,masterKey:key},
  {actor,organizationId,mailbox:{...box,folder:'outbox'},masterKey:key},
  {actor,organizationId,mailbox:{...box,documents:[{...doc,status:'acknowledged'}],pending:0},masterKey:key},
  {actor,organizationId,mailbox:box,masterKey:randomBytes(32)}
 ];
 for(const scenario of scenarios)assert.notEqual(mailboxTag(scenario),base);
});
test('never honor weak, wildcard, combined or oversized conditional headers',()=>{
 const tag=mailboxTag({masterKey:key,actor,organizationId,mailbox:box});
 for(const bad of ['*','W/'+tag,tag+', '+tag,'', 'a'.repeat(513)])
  assert.equal(mailboxUnchanged(bad,tag),false);
});
test('fail closed when missing verified mailbox context',()=>{
 for(const invalid of [
  {masterKey:Buffer.alloc(16),actor,organizationId,mailbox:box},
  {masterKey:key,actor:{},organizationId,mailbox:box},
  {masterKey:key,actor,organizationId,mailbox:{...box,folder:'other'}},
  {masterKey:key,actor,organizationId,mailbox:{...box,documents:null}}
 ])assert.throws(()=>mailboxTag(invalid));
});
