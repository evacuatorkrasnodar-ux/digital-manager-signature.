import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createDevDocumentServer} from './dev-server.mjs';
import {openDevTenantStore} from './sqlite-tenant-store.mjs';

test('SQLite HTTP workflow survives restart and rejects revoked employee',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'sv-http-db-'));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const sqlitePath=join(dir,'trial.sqlite'),masterKey=randomBytes(32);
 const opts={sqlitePath,masterKey,ownerPassword:'example-owner-2026-local',
  employeePassword:'example-employee-2026-local'};
 const route='/v1/organizations/demo-org/documents';
 async function start(){
  const server=createDevDocumentServer(opts);
  server.listen(0,'127.0.0.1');await once(server,'listening');
  return {server,url:'http://127.0.0.1:'+server.address().port};
 }
 async function call(host,path,method='GET',body,token){
  const res=await fetch(host.url+path,{method,headers:{
   ...(body?{'Content-Type':'application/json'}:{}),
   ...(token?{Authorization:'Bearer '+token}:{})},
   ...(body?{body:JSON.stringify(body)}:{})});
  return {status:res.status,json:await res.json()};
 }
 const login=async(host,user,pass)=>(await call(host,'/v1/sessions','POST',
  {login:user,password:pass})).json.token;
 const a=await start();
 assert.equal((await call(a,'/health')).json.backend,'sqlite-experimental');
 const owner=await login(a,'owner',opts.ownerPassword);
 const employee=await login(a,'elena',opts.employeePassword);
 const content={recipientUserId:'elena',type:'acknowledgement',
  title:'Training contract',body:'Only fictional document content'};
 assert.equal((await call(a,route,'POST',content,employee)).status,403);
 const created=await call(a,route,'POST',content,owner);
 assert.equal(created.status,201);
 const id=created.json.document.id;
 assert.equal((await call(a,route,'GET',undefined,employee)).json.documents[0].title,content.title);
 assert.equal((await call(a,route+'/'+id+'/actions','POST',{action:'acknowledge'},owner)).status,404);
 assert.equal((await call(a,route+'/'+id+'/actions','POST',{action:'acknowledge'},employee)).status,200);
 await new Promise(resolve=>a.server.close(resolve));
 assert.equal(readFileSync(sqlitePath,'utf8').includes(content.body),false);
 const b=await start();
 assert.equal((await call(b,route,'GET',undefined,owner)).status,401);
 const owner2=await login(b,'owner',opts.ownerPassword);
 assert.equal((await call(b,route+'/'+id,'GET',undefined,owner2)).json.document.status,'acknowledged');
 const employee2=await login(b,'elena',opts.employeePassword);
 const db=openDevTenantStore({filePath:sqlitePath,masterKey});
 db.revokeMember({actor:{userId:'owner'},organizationId:'demo-org',userId:'elena'});
 db.close();
 assert.equal((await call(b,route,'GET',undefined,employee2)).status,403);
 await new Promise(resolve=>b.server.close(resolve));
 const c=await start();
 assert.equal((await call(c,'/v1/sessions','POST',{login:'elena',
  password:opts.employeePassword})).status,403);
 assert.equal((await call(c,'/v1/sessions','POST',{login:'owner',
  password:opts.ownerPassword})).status,200);
 await new Promise(resolve=>c.server.close(resolve));
 assert.throws(()=>createDevDocumentServer({...opts,masterKey:randomBytes(32)}));
});
