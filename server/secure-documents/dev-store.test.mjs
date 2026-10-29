import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createEncryptedDevStore } from './dev-store.mjs';

const fakeDocument = () => ({
  id:'doc-1',organizationId:'demo-org',creatorUserId:'owner',
  recipientUserId:'elena',type:'acknowledgement',
  title:'Учебный приказ для Елены',status:'sent',
  createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
  sealed:{iv:randomBytes(12),tag:randomBytes(16),
    encrypted:Buffer.from('synthetic ciphertext','utf8')}
});
test('AES-GCM snapshot survives restart and contains no plaintext document metadata', t=>{
  const dir=mkdtempSync(join(tmpdir(),'seyveo-dev-store-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const filePath=join(dir,'documents.enc');
  const key=randomBytes(32);
  const store=createEncryptedDevStore({filePath,masterKey:key});
  const empty=store.load();
  assert.equal(empty.documents.size,0);
  const doc=fakeDocument(), actorUserId='owner';
  const log=[{at:new Date().toISOString(),actorUserId,action:'created',status:'sent'}];
  store.save({documents:new Map([[doc.id,doc]]),audit:new Map([[doc.id,log]])});
  const ciphertext=readFileSync(filePath);
  assert.equal(ciphertext.includes(Buffer.from(doc.title)),false);
  assert.equal(ciphertext.includes(Buffer.from(doc.recipientUserId)),false);
  assert.equal(ciphertext.includes(Buffer.from('synthetic ciphertext')),false);
  assert.equal(ciphertext.includes(Buffer.from('created')),false);
  if(process.platform!=='win32'){
    assert.equal(statSync(filePath).mode & 0o077,0);
    assert.equal(statSync(dir).mode & 0o077,0);
  }
  const reopened=createEncryptedDevStore({filePath,masterKey:key}).load();
  assert.equal(reopened.documents.size,1);
  assert.equal(reopened.documents.get(doc.id).title,doc.title);
  assert.deepEqual(reopened.audit.get(doc.id),log);
  assert.deepEqual(reopened.documents.get(doc.id).sealed.encrypted,doc.sealed.encrypted);
});

test('wrong key and tampered encrypted snapshot fail closed', t=>{
  const dir=mkdtempSync(join(tmpdir(),'seyveo-dev-integrity-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const filePath=join(dir,'snapshot.enc'),key=randomBytes(32);
  const store=createEncryptedDevStore({filePath,masterKey:key});
  const doc=fakeDocument();
  store.save({documents:new Map([[doc.id,doc]]),audit:new Map([[doc.id,[{at:new Date().toISOString(),actorUserId:'owner',action:'created',status:'sent'}]]])});
  assert.throws(()=>createEncryptedDevStore({filePath,masterKey:randomBytes(32)}).load());
  const raw=JSON.parse(readFileSync(filePath,'utf8'));
  const ciphertext=Buffer.from(raw.ciphertext,'base64url');
  ciphertext[0]^=0x01;
  raw.ciphertext=ciphertext.toString('base64url');
  writeFileSync(filePath,JSON.stringify(raw),{mode:0o600});
  assert.throws(()=>store.load());
});

test('reject non-private existing snapshots, invalid schema and relative paths', t=>{
  const dir=mkdtempSync(join(tmpdir(),'seyveo-dev-insecure-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const key=randomBytes(32),filePath=join(dir,'snapshot.enc');
  assert.throws(()=>createEncryptedDevStore({filePath:'relative.enc',masterKey:key}));
  const store=createEncryptedDevStore({filePath,masterKey:key});
  assert.throws(()=>store.save({documents:new Map([['bad',{id:'bad'}]]),audit:new Map()}));
  assert.equal(store.load().documents.size,0);
  if(process.platform!=='win32'){
    writeFileSync(filePath,'{}',{mode:0o644});
    assert.throws(()=>store.load());
  }
});
