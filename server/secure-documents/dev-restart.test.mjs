import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createDevDocumentServer} from './dev-server.mjs';

test('documents and status survive opt-in encrypted restart',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'seyveo-restart-'));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const storagePath=join(dir,'docs.enc'),masterKey=randomBytes(32);
 const opts={ownerPassword:'example-owner-password-2026',
   employeePassword:'example-elena-password-2026',masterKey,storagePath};
 async function launch(){
  const server=createDevDocumentServer(opts);
  server.listen(0,'127.0.0.1');await once(server,'listening');
  return {server,url:'http://127.0.0.1:'+server.address().port};
 }
 async function call(host,path,method='GET',data,token){
  const res=await fetch(host.url+path,{method,
   headers:{...(data?{'Content-Type':'application/json'}:{}),
     ...(token?{Authorization:'Bearer '+token}:{})},
   ...(data?{body:JSON.stringify(data)}:{})});
  return {status:res.status,body:await res.json()};
 }
 const route='/v1/organizations/demo-org/documents';
 const first=await launch();
 const owner=(await call(first,'/v1/sessions','POST',
  {login:'owner',password:opts.ownerPassword})).body.token;
 const created=await call(first,route,'POST',
  {type:'acknowledgement',title:'Учебный документ',recipientUserId:'elena',
   body:'Тестовое содержимое только для проверки'},owner);
 assert.equal(created.status,201);
 const id=created.body.document.id;
 await new Promise(resolve=>first.server.close(resolve));
 assert.equal(readFileSync(storagePath,'utf8').includes('Тестовое содержимое'),false);
 const second=await launch();
 assert.equal((await call(second,route,'GET',undefined,owner)).status,401);
 const refreshed=(await call(second,'/v1/sessions','POST',
  {login:'owner',password:opts.ownerPassword})).body.token;
 assert.equal((await call(second,route+'/'+id,'GET',undefined,refreshed)).body.document.body,
  'Тестовое содержимое только для проверки');
 const elena=(await call(second,'/v1/sessions','POST',
  {login:'elena',password:opts.employeePassword})).body.token;
 assert.equal((await call(second,route+'/'+id+'/actions','POST',
  {action:'acknowledge'},elena)).status,200);
 await new Promise(resolve=>second.server.close(resolve));
 const third=await launch();
 const newOwner=(await call(third,'/v1/sessions','POST',
  {login:'owner',password:opts.ownerPassword})).body.token;
 assert.equal((await call(third,route+'/'+id,'GET',undefined,newOwner)).body.document.status,
  'acknowledged');
 assert.deepEqual((await call(third,route+'/'+id+'/audit','GET',undefined,newOwner))
  .body.events.map(e=>e.action),['created','acknowledge']);
 await new Promise(resolve=>third.server.close(resolve));
 assert.throws(()=>createDevDocumentServer({...opts,masterKey:randomBytes(32)}));
});
