import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { createDevDocumentServer } from './dev-server.mjs';

const ownerPassword='test-owner-session-password-2026';
const employeePassword='test-employee-session-password-2026';

async function start(t){
  const server=createDevDocumentServer({
    ownerPassword,employeePassword,masterKey:Buffer.alloc(32,74)
  });
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));});
  const url='http://127.0.0.1:'+server.address().port;
  const call=async(path,method='GET',body,token)=>{
    const res=await fetch(url+path,{
      method,headers:{
        ...(body===undefined?{}:{'Content-Type':'application/json'}),
        ...(token?{'Authorization':'Bearer '+token}:{})
      },
      ...(body===undefined?{}:{body:JSON.stringify(body)})
    });
    return {status:res.status,body:await res.json(),headers:res.headers};
  };
  const login=(user,password,deviceLabel)=>call('/v1/sessions','POST',
    {login:user,password,deviceLabel});
  return {call,login,url};
}

test('independent employee and manager device sessions are private and individually revocable',async t=>{
  const {call,login}=await start(t);
  assert.equal((await call('/v1/sessions')).status,401);
  assert.equal((await login('owner',ownerPassword,'Phone\nInjected')).status,400);
  const managerPhone=await login('owner',ownerPassword,'Руководитель · iPhone');
  const managerLaptop=await login('owner',ownerPassword,'Руководитель · ноутбук');
  const employeePhone=await call('/v1/sessions','POST',{
    login:'elena',password:employeePassword,deviceLabel:'Елена · Android',
    role:'owner',userId:'owner',organizationId:'another-company'
  });
  for(const result of [managerPhone,managerLaptop,employeePhone])
    assert.equal(result.status,200);
  assert.equal(employeePhone.body.user.id,'elena');
  assert.equal(employeePhone.body.user.role,'employee');
  assert.notEqual(managerPhone.body.session.id,managerLaptop.body.session.id);
  assert.equal(typeof managerPhone.body.token,'string');

  const manager=managerPhone.body.token, manager2=managerLaptop.body.token;
  const employee=employeePhone.body.token;
  const managerList=await call('/v1/sessions','GET',undefined,manager);
  assert.equal(managerList.status,200);
  assert.equal(managerList.body.sessions.length,2);
  assert.equal(managerList.body.sessions.filter(x=>x.current).length,1);
  assert.equal(managerList.body.sessions.find(x=>x.current).id,managerPhone.body.session.id);
  assert.ok(managerList.body.sessions.every(x=>x.id!==employeePhone.body.session.id));
  assert.ok(!JSON.stringify(managerList.body).includes(manager));
  assert.ok(!JSON.stringify(managerList.body).includes(manager2));
  assert.match(managerList.headers.get('cache-control'),/no-store/);

  const employeeList=await call('/v1/sessions','GET',undefined,employee);
  assert.equal(employeeList.body.sessions.length,1);
  assert.equal(employeeList.body.sessions[0].id,employeePhone.body.session.id);
  assert.equal((await call('/v1/sessions/'+employeePhone.body.session.id,'DELETE',undefined,manager)).status,404);
  assert.equal((await call('/v1/sessions/'+managerPhone.body.session.id,'DELETE',undefined,employee)).status,404);
  assert.equal((await call('/v1/organizations','GET',undefined,employee)).status,200);

  // A stolen second token stops working immediately once its session is revoked.
  assert.equal((await call('/v1/sessions/'+managerLaptop.body.session.id,'DELETE',undefined,manager)).status,200);
  assert.equal((await call('/v1/organizations','GET',undefined,manager2)).status,401);
  assert.equal((await call('/v1/organizations','GET',undefined,manager)).status,200);
  assert.equal((await call('/v1/organizations','GET',undefined,employee)).status,200);
  assert.equal((await call('/v1/sessions','GET',undefined,manager)).body.sessions.length,1);
  assert.equal((await call('/v1/sessions/'+managerLaptop.body.session.id,'DELETE',undefined,manager)).status,404);

  assert.equal((await call('/v1/sessions/'+managerPhone.body.session.id,'DELETE',undefined,manager)).status,200);
  assert.equal((await call('/v1/sessions','GET',undefined,manager)).status,401);
  assert.equal((await call('/v1/organizations','GET',undefined,employee)).status,200);
});

test('training session limits protect against unbounded tokens without affecting another user',async t=>{
  const {call,login}=await start(t);
  const tokens=[];
  for(let i=0;i<5;i++){
    const session=await login('owner',ownerPassword,'Test device '+i);
    assert.equal(session.status,200);
    tokens.push(session);
  }
  assert.equal((await login('owner',ownerPassword,'Device 6')).status,429);
  const employee=await login('elena',employeePassword,'Elena test device');
  assert.equal(employee.status,200);
  assert.equal((await call('/v1/sessions/'+tokens[1].body.session.id,
    'DELETE',undefined,tokens[0].body.token)).status,200);
  const fresh=await login('owner',ownerPassword,'Replacement phone');
  assert.equal(fresh.status,200);
  assert.equal((await call('/v1/sessions','GET',undefined,fresh.body.token)).body.sessions.length,5);
  assert.equal((await call('/v1/organizations','GET',undefined,tokens[1].body.token)).status,401);
  assert.equal((await call('/v1/organizations','GET',undefined,employee.body.token)).status,200);
});

test('revoking a session blocks a document upload still waiting for its request body',async t=>{
  const {call,login,url}=await start(t);
  const phone=await login('owner',ownerPassword,'Test lost phone');
  const laptop=await login('owner',ownerPassword,'Test active laptop');
  assert.equal(phone.status,200);
  assert.equal(laptop.status,200);
  const route='/v1/organizations/demo-org/documents';
  const payload=JSON.stringify({
    recipientUserId:'elena',type:'approval',
    title:'Fictional delayed draft',body:'No real document'
  });
  let pending;
  const finished=new Promise((resolve,reject)=>{
    pending=httpRequest(url+route,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+phone.body.token
      }
    },res=>{
      let received='';
      res.on('data',chunk=>{received+=chunk});
      res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(received)}));
    });
    pending.on('error',reject);
  });
  pending.write(payload.slice(0,8));
  await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal((await call('/v1/sessions/'+phone.body.session.id,
    'DELETE',undefined,laptop.body.token)).status,200);
  pending.end(payload.slice(8));
  const result=await finished;
  assert.equal(result.status,401);
  assert.equal((await call(route,'GET',undefined,laptop.body.token)).body.documents.length,0);
});
