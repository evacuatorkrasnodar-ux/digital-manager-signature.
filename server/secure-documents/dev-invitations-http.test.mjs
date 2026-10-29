import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createDevDocumentServer} from './dev-server.mjs';

const passwords={
  owner:'fictional-owner-dev-password-2026',
  elena:'fictional-elena-dev-password-2026',
  tanya:'fictional-tanya-dev-password-2026'
};
const base='/v1/organizations/demo-org';
async function start(t){
  const server=createDevDocumentServer({
    ownerPassword:passwords.owner,
    employeePassword:passwords.elena,
    masterKey:Buffer.alloc(32,79)
  });
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(async()=>await new Promise(done=>server.close(done)));
  const origin='http://127.0.0.1:'+server.address().port;
  const send=async(path,method='GET',body,token)=>{
    const res=await fetch(origin+path,{
      method,headers:{
        ...(body===undefined?{}:{'Content-Type':'application/json'}),
        ...(token?{Authorization:'Bearer '+token}:{})
      },...(body===undefined?{}:{body:JSON.stringify(body)})
    });
    return {status:res.status,body:await res.json(),headers:res.headers};
  };
  const login=async(login,password)=>{
    const res=await send('/v1/sessions','POST',{login,password,deviceLabel:'Тестовый телефон'});
    return res;
  };
  return {send,login};
}

test('training manager invites a new employee with their own password; employee only sees assigned documents',async t=>{
  const {send,login}=await start(t);
  const manager=await login('owner',passwords.owner);
  const elena=await login('elena',passwords.elena);
  assert.equal(manager.status,200);
  assert.equal(elena.status,200);
  const ownerToken=manager.body.token,elenaToken=elena.body.token;

  assert.equal((await send(base+'/invitations','POST',{employeeLogin:'tanya'},elenaToken)).status,403);
  assert.equal((await send(base+'/invitations','POST',{employeeLogin:'tanya'})).status,401);
  assert.equal((await send('/v1/organizations/another-org/invitations','POST',
    {employeeLogin:'tanya'},ownerToken)).status,404);
  assert.equal((await send(base+'/invitations','POST',
    {employeeLogin:'owner',role:'employee'},ownerToken)).status,400);
  assert.equal((await send(base+'/invitations','POST',
    {employeeLogin:'elena'},ownerToken)).status,400);

  const invited=await send(base+'/invitations','POST',{
    employeeLogin:'tanya',role:'owner',organizationId:'another-org'
  },ownerToken);
  assert.equal(invited.status,201);
  assert.match(invited.body.code,/^[A-Za-z0-9_-]{43}$/);
  assert.equal(invited.body.invitation.employeeLogin,'tanya');
  assert.equal(invited.body.invitation.code,undefined);
  assert.equal((await send(base+'/invitations','POST',
    {employeeLogin:'tanya'},ownerToken)).status,400);

  const passwordTooWeak=await send('/v1/invitations/accept','POST',{
    code:invited.body.code,password:'short'
  });
  assert.equal(passwordTooWeak.status,400);
  const accepted=await send('/v1/invitations/accept','POST',{
    code:invited.body.code,password:passwords.tanya,
    role:'owner',organizationId:'another-org',userId:'owner'
  });
  assert.equal(accepted.status,201);
  assert.deepEqual(accepted.body.user,{id:'tanya',organizationId:'demo-org',role:'employee'});
  assert.equal((await send('/v1/invitations/accept','POST',{
    code:invited.body.code,password:'another-strong-password'
  })).status,400);
  const joined=await login('tanya',passwords.tanya);
  assert.equal(joined.status,200);
  assert.equal(joined.body.user.role,'employee');
  const tanyaToken=joined.body.token;
  assert.equal((await send(base+'/invitations','POST',{employeeLogin:'lena'},tanyaToken)).status,403);
  assert.equal((await send(base+'/members','GET',undefined,tanyaToken)).status,403);

  const managerMembers=await send(base+'/members','GET',undefined,ownerToken);
  assert.equal(managerMembers.status,200);
  assert.deepEqual(managerMembers.body.members.map(x=>x.userId),['elena','owner','tanya']);
  assert.ok(!JSON.stringify(managerMembers.body).includes(passwords.tanya));
  assert.ok(!JSON.stringify(managerMembers.body).includes(invited.body.code));

  const docs=base+'/documents';
  const privateDocument={
    recipientUserId:'tanya',type:'acknowledgement',
    title:'Training shift schedule',body:'Synthetic only, not personal data.'
  };
  assert.equal((await send(docs,'POST',privateDocument,tanyaToken)).status,403);
  const created=await send(docs,'POST',privateDocument,ownerToken);
  assert.equal(created.status,201);
  const id=created.body.document.id;
  assert.equal((await send(docs+'/'+id,'GET',undefined,tanyaToken)).body.document.body,privateDocument.body);
  assert.equal((await send(docs+'/'+id,'GET',undefined,elenaToken)).status,404);
  assert.equal((await send(base+'/inbox','GET',undefined,tanyaToken)).body.documents.length,1);
  assert.equal((await send(base+'/inbox','GET',undefined,elenaToken)).body.documents.length,0);
  assert.equal((await send(docs+'/'+id+'/actions','POST',{action:'acknowledge'},tanyaToken)).status,200);

  assert.equal((await send(base+'/members/tanya','DELETE',undefined,elenaToken)).status,403);
  assert.equal((await send(base+'/members/owner','DELETE',undefined,ownerToken)).status,404);
  assert.equal((await send(base+'/members/tanya','DELETE',undefined,ownerToken)).status,200);
  assert.equal((await send(docs+'/'+id,'GET',undefined,tanyaToken)).status,401);
  assert.equal((await login('tanya',passwords.tanya)).status,403);
  assert.equal((await send(base+'/members','GET',undefined,ownerToken)).body.members.find(x=>x.userId==='tanya').status,'revoked');
  assert.equal((await send(docs+'/'+id,'GET',undefined,ownerToken)).status,200);
  assert.equal((await send(base+'/invitations','POST',{employeeLogin:'tanya'},ownerToken)).status,400);
});

test('owner can cancel an invite, and code never reactivates it',async t=>{
  const {send,login}=await start(t);
  const owner=(await login('owner',passwords.owner)).body.token;
  const created=await send(base+'/invitations','POST',{employeeLogin:'newworker'},owner);
  assert.equal(created.status,201);
  const path=base+'/invitations/'+created.body.invitation.id;
  assert.equal((await send(path,'DELETE',undefined,'not-a-valid-token')).status,401);
  assert.equal((await send(path,'DELETE',undefined,owner)).status,200);
  assert.equal((await send(path,'DELETE',undefined,owner)).status,404);
  assert.equal((await send('/v1/invitations/accept','POST',{
    code:created.body.code,password:'another-strong-password'
  })).status,400);
  assert.equal((await login('newworker','another-strong-password')).status,401);
  assert.equal((await send(base+'/members','GET',undefined,owner)).body.members.length,2);
});

test('invited account disappears after local restart; accounts are never persisted',async t=>{
  const first=await start(t);
  const owner=(await first.login('owner',passwords.owner)).body.token;
  const invite=await first.send(base+'/invitations','POST',{employeeLogin:'tempworker'},owner);
  assert.equal(invite.status,201);
  assert.equal((await first.send('/v1/invitations/accept','POST',
    {code:invite.body.code,password:'temporary-fake-password-2026'})).status,201);
  const second=await start(t);
  assert.equal((await second.login('tempworker','temporary-fake-password-2026')).status,401);
  assert.equal((await second.send('/v1/invitations/accept','POST',{
    code:invite.body.code,password:'temporary-fake-password-2026'
  })).status,400);
});
