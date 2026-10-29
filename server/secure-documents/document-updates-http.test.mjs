import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createDevDocumentServer} from './dev-server.mjs';

test('local document events require a session and follow the right recipient',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'seyveo-http-updates-'));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const opts={sqlitePath:join(dir,'docs.sqlite'),masterKey:randomBytes(32),
  ownerPassword:'sample-owner-long-password-2026',
  employeePassword:'sample-employee-long-password-2026'};
 const start=async()=>{
  const server=createDevDocumentServer(opts);
  server.listen(0,'127.0.0.1');await once(server,'listening');
  return {server,base:'http://127.0.0.1:'+server.address().port};
 };
 const call=async(h,path,method='GET',data,token)=>{
  const response=await fetch(h.base+path,{method,
   headers:{...(data?{'Content-Type':'application/json'}:{}),
    ...(token?{Authorization:'Bearer '+token}:{})},
   ...(data?{body:JSON.stringify(data)}:{})});
  return {status:response.status,data:await response.json()};
 };
 const login=async(h,user,password)=>{
  const r=await call(h,'/v1/sessions','POST',{login:user,password});
  assert.equal(r.status,200);return r.data.token;
 };
 const base='/v1/organizations/demo-org';
 const h=await start();
 const owner=await login(h,'owner',opts.ownerPassword);
 const elena=await login(h,'elena',opts.employeePassword);
 assert.equal((await call(h,base+'/updates')).status,401);
 assert.equal((await call(h,'/v1/organizations/other-org/updates','GET',undefined,elena)).status,404);
 assert.equal((await call(h,base+'/updates?after=-1','GET',undefined,elena)).status,400);
 assert.equal((await call(h,base+'/updates?after=1&after=2','GET',undefined,elena)).status,400);
 const original=(await call(h,base+'/updates','GET',undefined,elena)).data;
 assert.deepEqual(original.events,[]);
 const doc=await call(h,base+'/documents','POST',{
  type:'acknowledgement',recipientUserId:'elena',
  title:'Synthetic test',body:'Confidential body never sent in updates'
 },owner);
 assert.equal(doc.status,201);
 const id=doc.data.document.id;
 const incoming=await call(h,base+'/updates?after=0','GET',undefined,elena);
 assert.equal(incoming.status,200);
 assert.equal(incoming.data.events.length,1);
 assert.equal(incoming.data.events[0].documentId,id);
 assert.equal(incoming.data.events[0].kind,'assigned');
 assert.equal(JSON.stringify(incoming.data).includes('Confidential body'),false);
 assert.equal((await call(h,base+'/updates','GET',undefined,owner)).data.events.length,0);
 const cursor=incoming.data.nextCursor;
 assert.equal((await call(h,base+'/updates?after='+cursor,'GET',undefined,elena)).data.events.length,0);
 assert.equal((await call(h,base+'/documents/'+id+'/actions','POST',{action:'acknowledge'},elena)).status,200);
 const ownerEvents=await call(h,base+'/updates','GET',undefined,owner);
 assert.equal(ownerEvents.data.events.length,1);
 assert.equal(ownerEvents.data.events[0].kind,'status_changed');
 await new Promise(resolve=>h.server.close(resolve));
 const reopened=await start();
 assert.equal((await call(reopened,base+'/updates','GET',undefined,owner)).status,401);
 const ownerAgain=await login(reopened,'owner',opts.ownerPassword);
 assert.equal((await call(reopened,base+'/updates','GET',undefined,ownerAgain)).data.events.length,1);
 await new Promise(resolve=>reopened.server.close(resolve));
});
