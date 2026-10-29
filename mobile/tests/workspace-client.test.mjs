import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkspaceClient} from '../src/work/workspace-client.mjs';
const session={token:'a'.repeat(32),sessionId:'session-1',userId:'elena',organizationId:'org-1',expiresAt:20000};
const body={serverVerified:true,trainingOnly:false,work:{userId:'elena',organizationId:'org-1',role:'employee',status:'active'}};
const make=(reply=body,getSession=async()=>session)=>createWorkspaceClient({
 origin:'https://api.seyveo.example',getSession,now:()=>10000,
 fetchImpl:async()=>({status:200,text:async()=>JSON.stringify(reply)})
});
test('active matching production membership can be displayed',async()=>{
 assert.deepEqual(await make().refresh(),{status:'ready',workspace:{organizationId:'org-1',role:'employee'}});
});
test('training response and other tenants fail closed',async()=>{
 for(const reply of [{...body,trainingOnly:true},{...body,work:{...body.work,organizationId:'other'}},{...body,work:{...body.work,status:'revoked'}}])
  assert.deepEqual(await make(reply).refresh(),{status:'unavailable',workspace:null});
});
test('expired or switched session does not open work',async()=>{
 assert.equal((await make(body,async()=>({...session,expiresAt:1})).refresh()).workspace,null);
 let count=0;
 assert.equal((await make(body,async()=>({...session,sessionId:++count===1?'session-1':'session-2'})).refresh()).workspace,null);
});
test('network errors do not open work',async()=>{
 const client=createWorkspaceClient({origin:'https://api.seyveo.example',getSession:async()=>session,now:()=>10000,fetchImpl:async()=>{throw Error('offline')}});
 assert.equal((await client.refresh()).workspace,null);
});
