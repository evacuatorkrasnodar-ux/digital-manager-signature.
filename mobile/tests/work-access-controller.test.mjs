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
