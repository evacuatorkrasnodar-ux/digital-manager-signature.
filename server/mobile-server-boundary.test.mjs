import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExecutionPlan} from './mobile-server-boundary.mjs';
test('private content never travels without explicit consent',()=>{
 const p=buildExecutionPlan({online:true,authenticated:true,sensitive:true});
 assert.equal(p.route,'device-only');assert.deepEqual(p.uploads,[]);
});
test('cloud requires both login and per-request consent',()=>{
 assert.equal(buildExecutionPlan({online:true,cloudConsent:true}).reason,'authentication-required');
 assert.equal(buildExecutionPlan({online:true,authenticated:true}).reason,'consent-required');
});
test('ordinary chat can reach server only when authorized',()=>{
 const p=buildExecutionPlan({online:true,authenticated:true,cloudConsent:true});
 assert.equal(p.route,'server');assert.deepEqual(p.uploads,['approved-message-only']);
});
test('approved text can use remote voice without uploading master recording',()=>{
 const p=buildExecutionPlan({requestType:'speech',online:true,authenticated:true,cloudConsent:true});
 assert.equal(p.capability,'remote-voice');assert.deepEqual(p.uploads,['approved-text-only']);
});
test('simple commands remain local even without Internet',()=>{
 const p=buildExecutionPlan({requestType:'command',localSupported:true});
 assert.equal(p.route,'device');
});
