import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkAccessController} from '../src/work/work-access-controller.mjs';
test('locking cancels a pending response',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve});
 const controller=createWorkAccessController({refresh:()=>gate});
 const pending=controller.refresh();
 assert.equal(controller.getState().status,'checking');
 controller.lock();
 release({status:'ready',workspace:{organizationId:'example',role:'employee'}});
 await pending;
 assert.deepEqual(controller.getState(),{status:'locked',workspace:null});
});
test('failed refresh remains locked',async()=>{
 const controller=createWorkAccessController({refresh:async()=>{throw Error('offline')}});
 await controller.refresh();
 assert.equal(controller.getState().status,'locked');
});

test('latest refresh wins over an earlier response',async()=>{
 let firstResolve;
 let calls=0;
 const controller=createWorkAccessController({refresh:()=>++calls===1?new Promise(resolve=>{firstResolve=resolve}):Promise.resolve({status:'ready',workspace:{organizationId:'company-new',role:'manager'}})});
 const first=controller.refresh();
 await controller.refresh();
 firstResolve({status:'ready',workspace:{organizationId:'company-old',role:'owner'}});
 await first;
 assert.deepEqual(controller.getState(),{status:'verified',workspace:{organizationId:'company-new',role:'manager'}});
});
test('subscription observes lock and can be removed',async()=>{
 const controller=createWorkAccessController({refresh:async()=>({status:'ready',workspace:{organizationId:'company',role:'employee'}})});
 const seen=[];
 const unsubscribe=controller.subscribe(s=>seen.push(s.status));
 await controller.refresh();controller.lock();unsubscribe();controller.lock();
 assert.deepEqual(seen,['locked','checking','verified','locked']);
});
test('invalid or unsupported role never opens work',async()=>{
 const controller=createWorkAccessController({refresh:async()=>({status:'ready',workspace:{organizationId:'company',role:'superuser'}})});
 assert.equal((await controller.refresh()).status,'locked');
});
