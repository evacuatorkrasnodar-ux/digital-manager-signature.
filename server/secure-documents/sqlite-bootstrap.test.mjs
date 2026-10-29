import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {openDevTenantStore} from './sqlite-tenant-store.mjs';

test('bootstrap is idempotent, revocation persists, title listings are scoped',t=>{
 const dir=mkdtempSync(join(tmpdir(),'seyveo-bootstrap-'));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const opts={filePath:join(dir,'demo.sqlite'),masterKey:randomBytes(32)};
 const owner={userId:'owner'},elena={userId:'elena'};
 let store=openDevTenantStore(opts);
 const init={organizationId:'demo-org',ownerUserId:'owner',employeeUserId:'elena'};
 store.ensureDemoTenant(init);
 store.ensureDemoTenant(init);
 assert.equal(store.getMembership({actor:elena,organizationId:'demo-org'}).role,'employee');
 const d=store.createDocument({actor:owner,organizationId:'demo-org',
  recipientUserId:'elena',type:'approval',title:'Fictional training act',body:'Synthetic'});
 assert.equal(store.listDocuments({actor:elena,organizationId:'demo-org'})[0].title,'Fictional training act');
 assert.throws(()=>store.getMembership({actor:elena,organizationId:'other-org'}));
 store.revokeMember({actor:owner,organizationId:'demo-org',userId:'elena'});
 assert.throws(()=>store.getMembership({actor:elena,organizationId:'demo-org'}));
 store.close();
 store=openDevTenantStore(opts);
 store.ensureDemoTenant(init);
 assert.throws(()=>store.getMembership({actor:elena,organizationId:'demo-org'}));
 assert.equal(store.listDocuments({actor:owner,organizationId:'demo-org'}).length,1);
 assert.throws(()=>store.ensureDemoTenant({...init,ownerUserId:'other-owner'}));
 store.close();
});
