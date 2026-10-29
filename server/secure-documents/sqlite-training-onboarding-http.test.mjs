import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createDevDocumentServer} from './dev-server.mjs';

const ownerPassword='sample-owner-sqlite-password-2026';
const elenaPassword='sample-elena-sqlite-password-2026';
const newPassword='sample-tanya-sqlite-password-2026';
const base='/v1/organizations/demo-org';
const invitePath=base+'/invitations';

function createHarness(t){
  const dir=mkdtempSync(join(tmpdir(),'seyveo-staff-persist-'));
  const sqlitePath=join(dir,'documents.sqlite'),masterKey=randomBytes(32);
  const open=[];
  t.after(async()=>{
    for(const s of open)
      if(s.listening)await new Promise(resolve=>s.close(resolve));
    rmSync(dir,{recursive:true,force:true});
  });
  async function start(){
    const server=createDevDocumentServer({
      ownerPassword,employeePassword:elenaPassword,masterKey,sqlitePath
    });
    server.listen(0,'127.0.0.1');
    await once(server,'listening');
    open.push(server);
    const root='http://127.0.0.1:'+server.address().port;
    const request=async(path,method='GET',body,token)=>{
      const res=await fetch(root+path,{
        method,headers:{
          ...(body===undefined?{}:{'Content-Type':'application/json'}),
          ...(token?{Authorization:'Bearer '+token}:{})
        },
        ...(body===undefined?{}:{body:JSON.stringify(body)})
      });
      return {status:res.status,body:await res.json()};
    };
    const login=async(user,password)=>request('/v1/sessions','POST',{login:user,password});
    return {server,request,login};
  }
  return {start,sqlitePath,masterKey};
}
async function stop(server){await new Promise(resolve=>server.close(resolve));}

test('SQLite onboarding persists invited employee credentials, company role and documents across restart',async t=>{
  const h=createHarness(t);
  const first=await h.start();
  const owner=await first.login('owner',ownerPassword);
  const elena=await first.login('elena',elenaPassword);
  assert.equal(owner.status,200);
  assert.equal(elena.status,200);
  const ownerToken=owner.body.token,elenaToken=elena.body.token;
  assert.equal((await first.request(invitePath,'POST',{employeeLogin:'tanya'},elenaToken)).status,403);
  assert.equal((await first.request('/v1/organizations/other-org/invitations','POST',
    {employeeLogin:'tanya'},ownerToken)).status,404);
  assert.equal((await first.request(invitePath,'POST',{employeeLogin:'owner'},ownerToken)).status,400);
  const pending=await first.request(invitePath,'POST',{employeeLogin:'tanya'},ownerToken);
  assert.equal(pending.status,201);
  assert.equal(typeof pending.body.code,'string');
  assert.equal((await first.request('/v1/invitations/accept','POST',
    {code:pending.body.code,password:'short'})).status,400);
  assert.equal((await first.request('/v1/invitations/accept','POST',{
    code:pending.body.code,password:newPassword,role:'owner',organizationId:'outsider'
  })).status,201);
  assert.equal((await first.request('/v1/invitations/accept','POST',
    {code:pending.body.code,password:newPassword})).status,400);
  assert.equal((await first.request(invitePath,'POST',{employeeLogin:'tanya'},ownerToken)).status,400);
  const tanya=await first.login('tanya',newPassword);
  assert.equal(tanya.status,200);
  assert.deepEqual(tanya.body.user,{id:'tanya',role:'employee',organizationId:'demo-org'});
  assert.equal((await first.request(invitePath,'POST',{employeeLogin:'other'},tanya.body.token)).status,403);
  const members=await first.request(base+'/members','GET',undefined,ownerToken);
  assert.equal(members.status,200);
  assert.equal(members.body.members.find(m=>m.userId==='tanya').role,'employee');
  assert.ok(!JSON.stringify(members.body).includes(newPassword));

  const draft={recipientUserId:'tanya',type:'approval',
    title:'Sample contract',body:'Fictional confidential text, never use real contracts'};
  const made=await first.request(base+'/documents','POST',draft,ownerToken);
  assert.equal(made.status,201);
  const id=made.body.document.id;
  assert.equal((await first.request(base+'/documents/'+id,'GET',undefined,elenaToken)).status,404);
  assert.equal((await first.request(base+'/documents/'+id,'GET',undefined,tanya.body.token)).status,200);
  await stop(first.server);

  const raw=readFileSync(h.sqlitePath);
  assert.equal(raw.includes(Buffer.from(newPassword)),false);
  assert.equal(raw.includes(Buffer.from(draft.body)),false);
  assert.equal(raw.includes(Buffer.from(pending.body.code)),false);
  assert.equal(raw.includes(Buffer.from('sample-tanya-sqlite-password')),false);

  const second=await h.start();
  assert.equal((await second.request(base+'/members','GET',undefined,ownerToken)).status,401);
  const tanyaAgain=await second.login('tanya',newPassword);
  assert.equal(tanyaAgain.status,200);
  assert.equal((await second.login('tanya','wrong-password')).status,401);
  const ownerAgain=(await second.login('owner',ownerPassword)).body.token;
  assert.equal((await second.request(base+'/documents/'+id,'GET',undefined,tanyaAgain.body.token)).body.document.body,draft.body);
  assert.equal((await second.request(base+'/documents/'+id+'/actions','POST',
    {action:'approve'},tanyaAgain.body.token)).status,200);
  assert.equal((await second.request(base+'/documents/'+id,'GET',undefined,(await second.login('elena',elenaPassword)).body.token)).status,404);

  // Membership revocation commits first, then wipes the live sessions.
  assert.equal((await second.request(base+'/members/tanya','DELETE',undefined,tanyaAgain.body.token)).status,403);
  assert.equal((await second.request(base+'/members/tanya','DELETE',undefined,ownerAgain)).status,200);
  assert.equal((await second.request(base+'/documents/'+id,'GET',undefined,tanyaAgain.body.token)).status,401);
  assert.equal((await second.login('tanya',newPassword)).status,403);
  assert.equal((await second.request(invitePath,'POST',{employeeLogin:'tanya'},ownerAgain)).status,400);
  await stop(second.server);

  const third=await h.start();
  const admin=(await third.login('owner',ownerPassword)).body.token;
  assert.equal((await third.login('tanya',newPassword)).status,403);
  assert.equal((await third.request(base+'/members','GET',undefined,admin)).body.members.find(m=>m.userId==='tanya').status,'revoked');
  assert.equal((await third.request(base+'/documents/'+id,'GET',undefined,admin)).status,200);
});

test('unused SQLite invitation survives restart but is single-use and owner-cancellable',async t=>{
  const h=createHarness(t);
  const first=await h.start();
  const owner=(await first.login('owner',ownerPassword)).body.token;
  const created=await first.request(invitePath,'POST',{employeeLogin:'marina'},owner);
  assert.equal(created.status,201);
  await stop(first.server);
  const second=await h.start();
  const newOwner=(await second.login('owner',ownerPassword)).body.token;
  const joined=await second.request('/v1/invitations/accept','POST',{
    code:created.body.code,password:'sample-marina-strong-2026'
  });
  assert.equal(joined.status,201);
  assert.equal((await second.login('marina','sample-marina-strong-2026')).status,200);
  assert.equal((await second.request('/v1/invitations/accept','POST',{
    code:created.body.code,password:'sample-marina-strong-2026'
  })).status,400);
  const other=await second.request(invitePath,'POST',{employeeLogin:'boris'},newOwner);
  assert.equal(other.status,201);
  assert.equal((await second.request(invitePath+'/'+other.body.invitation.id,'DELETE',undefined,newOwner)).status,200);
  assert.equal((await second.request('/v1/invitations/accept','POST',{
    code:other.body.code,password:'sample-boris-strong-2026'
  })).status,400);
  await stop(second.server);
  const third=await h.start();
  assert.equal((await third.login('marina','sample-marina-strong-2026')).status,200);
  assert.equal((await third.login('boris','sample-boris-strong-2026')).status,401);
});

test('SQLite encrypted employee verifiers fail closed under wrong key or tampering',async t=>{
  const h=createHarness(t);
  const first=await h.start();
  const owner=(await first.login('owner',ownerPassword)).body.token;
  const created=await first.request(invitePath,'POST',{employeeLogin:'worker'},owner);
  assert.equal(created.status,201);
  assert.equal((await first.request('/v1/invitations/accept','POST',
    {code:created.body.code,password:'example-worker-password-2026'})).status,201);
  await stop(first.server);
  assert.throws(()=>createDevDocumentServer({
    ownerPassword,employeePassword:elenaPassword,sqlitePath:h.sqlitePath,
    masterKey:randomBytes(32)
  }));
});
