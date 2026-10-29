import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
import {createDevDocumentServer} from './dev-server.mjs';

test('conditional polling is account-bound and updates after an acknowledgement',async t=>{
 const server=createDevDocumentServer({
  ownerPassword:'development-owner-2026-password',
  employeePassword:'development-employee-2026-password',
  masterKey:randomBytes(32)
 });
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 t.after(async()=>{await new Promise(resolve=>server.close(resolve))});
 const url='http://127.0.0.1:'+server.address().port;
 async function call(path,{method='GET',body,token,etag}={}){
  const r=await fetch(url+path,{method,headers:{
   ...(body?{'Content-Type':'application/json'}:{}),
   ...(token?{Authorization:'Bearer '+token}:{}),
   ...(etag?{'If-None-Match':etag}:{})
  },...(body?{body:JSON.stringify(body)}:{})});
  return {status:r.status,tag:r.headers.get('etag'),cache:r.headers.get('cache-control'),
   body:r.status===304?null:await r.json(),raw:r};
 }
 async function login(name,password){
  const response=await call('/v1/sessions',{method:'POST',body:{login:name,password}});
  assert.equal(response.status,200);return response.body.token;
 }
 const owner=await login('owner','development-owner-2026-password');
 const elena=await login('elena','development-employee-2026-password');
 const base='/v1/organizations/demo-org';
 const empty=await call(base+'/inbox',{token:elena});
 assert.equal(empty.status,200);assert.equal(empty.body.total,0);
 assert.match(empty.tag,/^"svdm-[A-Za-z0-9_-]+"$/);
 assert.match(empty.cache,/no-store/);
 const same=await call(base+'/inbox',{token:elena,etag:empty.tag});
 assert.equal(same.status,304);assert.equal(same.body,null);
 const unauthorized=await call(base+'/inbox',{etag:empty.tag});
 assert.equal(unauthorized.status,401);
 const different=await call(base+'/inbox',{token:owner,etag:empty.tag});
 assert.equal(different.status,200);
 assert.notEqual(different.tag,empty.tag);
 const created=await call(base+'/documents',{
  method:'POST',token:owner,
  body:{title:'Synthetic instruction',body:'not in an inbox',recipientUserId:'elena',
   type:'acknowledgement'}
 });
 assert.equal(created.status,201);
 const id=created.body.document.id;
 const newInbox=await call(base+'/inbox',{token:elena,etag:empty.tag});
 assert.equal(newInbox.status,200);
 assert.equal(newInbox.body.pending,1);
 assert.equal(newInbox.body.documents[0].id,id);
 assert.notEqual(newInbox.tag,empty.tag);
 assert.equal(JSON.stringify(newInbox.body).includes('not in an inbox'),false);
 const doc=await call(base+'/documents/'+id+'/actions',{
  method:'POST',token:elena,body:{action:'acknowledge'}
 });
 assert.equal(doc.status,200);
 const acknowledged=await call(base+'/inbox',{token:elena,etag:newInbox.tag});
 assert.equal(acknowledged.status,200);
 assert.equal(acknowledged.body.pending,0);
 assert.notEqual(acknowledged.tag,newInbox.tag);
 const pendingZero=await call(base+'/inbox',{token:elena,etag:acknowledged.tag});
 assert.equal(pendingZero.status,304);
});
