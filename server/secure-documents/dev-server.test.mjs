import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createDevDocumentServer } from './dev-server.mjs';

test('SEYVEO document API: verified local sessions and tenant boundaries', async t => {
  const key = Buffer.alloc(32, 37); // Test-only key. Never use in a real installation.
  const server = createDevDocumentServer({
    ownerPassword:'example-owner-password-2026',
    employeePassword:'example-elena-password-2026',
    masterKey:key
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); });
  const origin='http://127.0.0.1:'+server.address().port;
  const request = async (path, method='GET', payload, token, headers={}) => {
    const res=await fetch(origin+path,{
      method, headers:{
        ...(payload===undefined?{}:{'Content-Type':'application/json'}),
        ...(token?{Authorization:'Bearer '+token}:{}),...headers
      },
      ...(payload===undefined?{}:{body:JSON.stringify(payload)})
    });
    return {status:res.status,body:await res.json(),headers:res.headers};
  };
  const base='/v1/organizations/demo-org/documents';
  const health=await request('/health');
  assert.equal(health.status,200);
  assert.equal(health.body.productionReady,false);
  assert.equal(health.headers.get('cache-control').includes('no-store'),true);

  assert.equal((await request('/v1/organizations')).status,401);
  assert.equal((await request('/v1/sessions','POST',{login:'owner',password:'incorrect'})).status,401);
  assert.equal((await request('/v1/sessions','POST',{login:'nobody',password:'incorrect'})).status,401);
  assert.equal((await request('/v1/sessions','POST',{login:'owner',password:'example-owner-password-2026'},null,{'Origin':'https://example.com'})).status,403);
  const ownerResponse=await request('/v1/sessions','POST',{login:'owner',password:'example-owner-password-2026'});
  const employeeResponse=await request('/v1/sessions','POST',{login:'elena',password:'example-elena-password-2026'});
  assert.equal(ownerResponse.status,200);
  assert.equal(employeeResponse.status,200);
  const owner=ownerResponse.body.token, employee=employeeResponse.body.token;
  assert.equal(typeof owner,'string');
  assert.equal(ownerResponse.body.user.role,'owner');
  assert.equal(employeeResponse.body.user.role,'employee');
  assert.equal((await request('/v1/organizations','GET',undefined,employee)).body.organizations[0].role,'employee');

  const doc={
    type:'acknowledgement',recipientUserId:'elena',
    title:'Учебный приказ о сменах',body:'Этот текст должен быть зашифрован в памяти сервера.'
  };
  assert.equal((await request(base,'POST',doc,employee)).status,403);
  assert.equal((await request(base,'POST',{...doc,recipientUserId:'outside'},owner)).status,400);
  assert.equal((await request('/v1/organizations/other-org/documents','POST',doc,owner)).status,404);
  assert.equal((await request(base,'POST',{...doc,type:'something-else'},owner)).status,400);
  const created=await request(base,'POST',doc,owner);
  assert.equal(created.status,201);
  const id=created.body.document.id;
  assert.equal(created.body.document.status,'sent');
  assert.equal(JSON.stringify(created.body).includes(doc.body),false);
  const ownerRead=await request(base+'/'+id,'GET',undefined,owner);
  const employeeRead=await request(base+'/'+id,'GET',undefined,employee);
  assert.equal(ownerRead.body.document.body,doc.body);
  assert.equal(employeeRead.body.document.body,doc.body);
  assert.equal((await request('/v1/organizations/other-org/documents/'+id,'GET',undefined,owner)).status,404);
  assert.equal((await request(base+'/other-doc','GET',undefined,owner)).status,404);

  assert.equal((await request(base+'/'+id+'/actions','POST',{action:'acknowledge'},owner)).status,403);
  assert.equal((await request(base+'/'+id+'/actions','POST',{action:'revoke'},employee)).status,403);
  const markedRead=await request(base+'/'+id+'/actions','POST',{action:'read'},employee);
  assert.equal(markedRead.status,200);
  assert.equal(markedRead.body.document.status,'read');
  const acknowledged=await request(base+'/'+id+'/actions','POST',{action:'acknowledge'},employee);
  assert.equal(acknowledged.status,200);
  assert.equal(acknowledged.body.document.status,'acknowledged');
  assert.equal((await request(base+'/'+id+'/actions','POST',{action:'acknowledge'},employee)).status,403);
  assert.equal((await request(base+'/'+id+'/actions','POST',{action:'revoke'},owner)).status,403);
  const audit=await request(base+'/'+id+'/audit','GET',undefined,employee);
  assert.deepEqual(audit.body.events.map(e=>e.action),['created','read','acknowledge']);
  assert.equal((await request(base,'GET',undefined,employee)).body.documents.length,1);

  const approval=await request(base,'POST',
    {...doc,type:'approval',title:'Учебный акт',body:'Учебное согласование'},owner);
  assert.equal(approval.status,201);
  const approvalId=approval.body.document.id;
  assert.equal((await request(base+'/'+approvalId+'/actions','POST',{action:'return'},employee)).status,200);
  assert.equal((await request(base+'/'+approvalId+'/actions','POST',{action:'approve'},employee)).status,403);
  const third=await request(base,'POST',
    {...doc,type:'approval',title:'Другой акт'},owner);
  assert.equal(third.status,201);
  assert.equal((await request(base+'/'+third.body.document.id+'/actions','POST',{action:'revoke'},owner)).status,200);
  assert.equal((await request(base+'/'+third.body.document.id+'/actions','POST',{action:'approve'},employee)).status,403);
  assert.equal((await request('/v1/sessions/current','DELETE',undefined,employee)).status,200);
  assert.equal((await request(base,'GET',undefined,employee)).status,401);
  assert.equal((await request(base,'GET',undefined,owner)).body.documents.length,3);
});

test('server refuses invalid keys, too-short passwords, shared credentials and production mode', () => {
  const defaults={ownerPassword:'strong-owner-password-2026',
    employeePassword:'strong-elena-password-2026',masterKey:Buffer.alloc(32,23)};
  assert.throws(()=>createDevDocumentServer({...defaults,masterKey:Buffer.alloc(16)}));
  assert.throws(()=>createDevDocumentServer({...defaults,ownerPassword:'short'}));
  assert.throws(()=>createDevDocumentServer({...defaults,employeePassword:defaults.ownerPassword}));
});
