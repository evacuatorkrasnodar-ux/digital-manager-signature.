import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentUpdateSync} from './mobile-sync-core.mjs';

const identity=(userId='elena')=>({userId,organizationId:'demo-org',accessToken:'fictional-session-token-long-enough'});
const event=(cursor,kind='assigned')=>({
  cursor,documentId:'doc-'+cursor,kind,at:'2026-10-29T01:00:00.000Z'
});
function setup(overrides={}){
 let user=identity(),value=0,received=[],accessLost=0,requests=[];
 let body={status:200,body:{events:[event(1),event(2,'status_changed')],nextCursor:2}};
 const client=createDocumentUpdateSync({
  getIdentity:async()=>user,
  readCursor:async()=>value,
  writeCursor:async(checkpoint,cursor)=>{assert.equal(checkpoint.userId,user.userId);value=cursor;},
  request:async args=>{requests.push(args);return body;},
  onEvent:async e=>{received.push(e);},
  onAccessLost:async()=>{accessLost++},
  ...overrides
 });
 return {client,requests,received,getCursor:()=>value,setIdentity:u=>user=u,
  setResponse:b=>body=b,getAuthLost:()=>accessLost};
}
test('two events apply once and checkpoint per event',async()=>{
 const f=setup();
 assert.deepEqual(await f.client.poll(),{state:'synced',cursor:2,handled:2,hasMore:false});
 assert.equal(f.getCursor(),2);assert.equal(f.received.length,2);
 assert.equal(f.requests[0].path,'/v1/organizations/demo-org/updates?after=0');
 f.setResponse({status:200,body:{events:[],nextCursor:2}});
 assert.deepEqual(await f.client.poll(),{state:'synced',cursor:2,handled:0,hasMore:false});
 assert.equal(f.requests[1].path,'/v1/organizations/demo-org/updates?after=2');
});
test('unauthorized session stops processing and requests sign-in',async()=>{
 const f=setup();f.setResponse({status:403,body:{error:'revoked'}});
 assert.equal((await f.client.poll()).state,'sign-in-required');
 assert.equal(f.getAuthLost(),1);assert.equal(f.received.length,0);
});
test('request errors cannot lose cursors',async()=>{
 const f=setup({request:async()=>{throw new Error('network unreachable')}});
 assert.deepEqual(await f.client.poll(),{state:'offline',cursor:0});
 assert.equal(f.getCursor(),0);
});
test('switching users mid-request discards stale updates',async()=>{
 let release;
 const suspended=new Promise(resolve=>{release=resolve;});
 const f=setup({request:async()=>suspended});
 const pending=f.client.poll();
 await Promise.resolve();await Promise.resolve();
 f.setIdentity(identity('tanya'));
 release({status:200,body:{events:[event(1)],nextCursor:1}});
 const result=await pending;
 assert.equal(result.state,'session-changed');
 assert.equal(f.received.length,0);assert.equal(f.getCursor(),0);
});
test('stopping client while request pending discards response',async()=>{
 let release;
 const delayed=new Promise(resolve=>{release=resolve;});
 const f=setup({request:async()=>delayed});
 const pending=f.client.poll();
 f.client.stop();
 release({status:200,body:{events:[event(1)],nextCursor:1}});
 assert.equal((await pending).state,'stopped');
 assert.equal((await f.client.poll()).state,'stopped');
 assert.equal(f.received.length,0);
});
test('malformed events and document body leakage fail closed',async()=>{
 const variations=[
  {events:[{...event(1),body:'secret'}],nextCursor:1},
  {events:[event(2),event(1)],nextCursor:2},
  {events:[{...event(1),kind:'different'}],nextCursor:1},
  {events:[event(1)],nextCursor:0},
  {events:[event(1)],nextCursor:-1}
 ];
 for(const response of variations){
  const f=setup();f.setResponse({status:200,body:response});
  const result=await f.client.poll();
  assert.equal(result.state,'protocol-error');
 }
});
test('handler failure does not advance cursor beyond successfully processed event',async()=>{
 let called=0,saved=0;
 const f=setup({
  writeCursor:async(_context,cursor)=>{saved=cursor;},
  onEvent:async()=>{called++;if(called===2)throw new Error('handler offline')}
 });
 const result=await f.client.poll();
 assert.equal(result.state,'retry');
 assert.equal(result.cursor,1);
 assert.equal(saved,1);
 assert.equal(result.handled,1);
});
test('empty batch may advance server cursor beyond invisible updates',async()=>{
 let saved=0;
 const f=setup({writeCursor:async(_,cursor)=>{saved=cursor}});
 f.setResponse({status:200,body:{events:[],nextCursor:10}});
 assert.equal((await f.client.poll()).cursor,10);
 assert.equal(saved,10);
});
test('parallel poll requests share a single network operation',async()=>{
 let release,calls=0;
 const promise=new Promise(resolve=>{release=resolve});
 const f=setup({request:async()=>{calls++;return promise}});
 const a=f.client.poll(),b=f.client.poll();
 assert.equal(a,b);
 release({status:200,body:{events:[],nextCursor:0}});
 await a;
 assert.equal(calls,1);
});
