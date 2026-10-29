import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createDevDocumentServer } from './dev-server.mjs';

test('two local authenticated sessions see different inbox/outbox updates',async t=>{
 const folder=mkdtempSync(join(tmpdir(),'seyveo-inbox-'));
 t.after(()=>rmSync(folder,{force:true,recursive:true}));
 const config={
  ownerPassword:'fictional-owner-password-2026',
  employeePassword:'fictional-employee-password-2026',
  masterKey:randomBytes(32),
  sqlitePath:join(folder,'test.sqlite')
 };
 const start=async()=>{
  const server=createDevDocumentServer(config);
  server.listen(0,'127.0.0.1');await once(server,'listening');
  return {server,base:'http://127.0.0.1:'+server.address().port};
 };
 const request=async(host,path,method='GET',body,token)=>{
  const response=await fetch(host.base+path,{
   method,
   headers:{...(body?{'Content-Type':'application/json'}:{}),
    ...(token?{Authorization:'Bearer '+token}:{})},
   ...(body?{body:JSON.stringify(body)}:{})
  });
  return {status:response.status,value:await response.json()};
 };
 const login=async(host,user,pass)=>{
  const result=await request(host,'/v1/sessions','POST',{login:user,password:pass});
  assert.equal(result.status,200);
  return result.value.token;
 };
 const host=await start();
 const owner=await login(host,'owner',config.ownerPassword);
 const elena=await login(host,'elena',config.employeePassword);
 const root='/v1/organizations/demo-org';
 assert.equal((await request(host,root+'/inbox','GET',undefined,elena)).value.total,0);
 assert.equal((await request(host,root+'/inbox','GET',undefined,owner)).value.total,0);
 const body={type:'acknowledgement',recipientUserId:'elena',
  title:'Фиктивное уведомление',body:'Training-only content stays out of inbox'};
 const created=await request(host,root+'/documents','POST',body,owner);
 assert.equal(created.status,201);
 const docId=created.value.document.id;
 const inbox=await request(host,root+'/inbox','GET',undefined,elena);
 assert.equal(inbox.status,200);
 assert.equal(inbox.value.total,1);
 assert.equal(inbox.value.pending,1);
 assert.equal(inbox.value.documents[0].id,docId);
 assert.equal(JSON.stringify(inbox.value).includes(body.body),false);
 const outbox=await request(host,root+'/outbox','GET',undefined,owner);
 assert.equal(outbox.status,200);
 assert.equal(outbox.value.total,1);
 assert.equal(outbox.value.pending,1);
 assert.equal((await request(host,root+'/outbox','GET',undefined,elena)).value.total,0);
 assert.equal((await request(host,root+'/inbox','GET',undefined,owner)).value.total,0);
 assert.equal((await request(host,'/v1/organizations/other-org/inbox','GET',undefined,elena)).status,404);
 assert.equal((await request(host,root+'/inbox')).status,401);
 const confirmed=await request(host,root+'/documents/'+docId+'/actions','POST',{action:'acknowledge'},elena);
 assert.equal(confirmed.status,200);
 assert.equal((await request(host,root+'/outbox','GET',undefined,owner)).value.pending,0);
 assert.equal((await request(host,root+'/inbox','GET',undefined,elena)).value.documents[0].status,'acknowledged');
 await new Promise(resolve=>host.server.close(resolve));
 const restarted=await start();
 assert.equal((await request(restarted,root+'/inbox','GET',undefined,elena)).status,401);
 const fresh=await login(restarted,'elena',config.employeePassword);
 assert.equal((await request(restarted,root+'/inbox','GET',undefined,fresh)).value.documents[0].status,'acknowledged');
 await new Promise(resolve=>restarted.server.close(resolve));
});
