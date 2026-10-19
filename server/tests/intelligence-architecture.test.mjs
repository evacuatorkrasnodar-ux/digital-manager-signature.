import test from 'node:test';
import assert from 'node:assert/strict';
import {FELIX_CAPABILITIES,intelligenceCatalog,intelligencePlan,INTELLIGENCE_VERSION}
 from '../intelligence/architecture.mjs';

test('entire architecture is available as a consistent immutable registry',()=>{
 const catalog=intelligenceCatalog();
 assert.equal(catalog.version,INTELLIGENCE_VERSION);
 assert.equal(catalog.mode,'architecture-preview');
 assert.equal(catalog.limits.productionReady,false);
 assert.equal(catalog.limits.currentExecution,'disabled');
 assert.ok(catalog.capabilities.length>=18);
 const names=catalog.capabilities.map(c=>c.id);
 assert.equal(names.length,new Set(names).size);
 for(const section of ['business','development','documents','finance','calendar',
  'notebook','communications','health','care','personal','memory','learning',
  'voice','integrations','security','knowledge','intelligence','dialogue']){
  assert.ok(names.includes(section),section);
 }
 assert.ok(FELIX_CAPABILITIES.every(c=>c.executionEnabled===false&&c.automaticAccess===false));
 assert.ok(FELIX_CAPABILITIES.every(c=>c.readiness==='blueprint'||c.readiness==='prototype'||c.readiness==='server-adapter'));
});
test('business planning is a preview, never an actual market research',()=>{
 const plan=intelligencePlan('Хочу открыть кафе, помоги с бизнес-планом',
  {},{local:true,cloud:false});
 assert.equal(plan.task.capability,'business');
 assert.equal(plan.task.intent,'business');
 assert.equal(plan.intelligence.route,'local');
 assert.equal(plan.safety.executed,false);
 assert.equal(plan.safety.externalCallsMade,0);
 assert.equal(plan.readyToExecute,false);
 assert.deepEqual(plan.safety.changesMade,[]);
});
test('no-cloud consent blocks selection even if cloud is technically ready',()=>{
 const task='Проанализируй бизнес и стратегию';
 const no=intelligencePlan(task,{allowCloud:false},{local:true,cloud:true});
 assert.equal(no.intelligence.route,'local');
 assert.equal(no.intelligence.cloudConsent,false);
 const yes=intelligencePlan(task,{allowCloud:true},{local:true,cloud:true});
 assert.equal(yes.intelligence.route,'cloud');
 assert.equal(yes.intelligence.cloudConsent,true);
 assert.equal(yes.intelligence.providerCalled,false);
 assert.equal(yes.intelligence.routeVerified,false);
 assert.equal(yes.safety.executed,false);
});
test('sensitive requests never become cloud calls, even with explicit cloud mode',()=>{
 const plan=intelligencePlan('Проанализируй мои медицинские записи',
  {mode:'cloud',allowCloud:true},{local:true,cloud:true});
 assert.equal(plan.intelligence.route,'local');
 assert.equal(plan.intelligence.cloudConsent,false);
 assert.equal(plan.safety.privateData,true);
 assert.equal(plan.safety.executed,false);
});
test('dangerous operations stay blocked regardless of model availability',()=>{
 for(const request of ['Оплати счёт','Удали все документы','Переведи деньги']){
  const plan=intelligencePlan(request,{mode:'cloud',allowCloud:true},{local:true,cloud:true});
  assert.equal(plan.status,'blocked');
  assert.equal(plan.readyToExecute,false);
  assert.equal(plan.safety.approvalGranted,false);
  assert.equal(plan.safety.executed,false);
  assert.deepEqual(plan.safety.toolsUsed,[]);
 }
});
test('unconnected models are disclosed, not fabricated',()=>{
 const plan=intelligencePlan('Привет, Филя',{allowCloud:false},{local:false,cloud:false});
 assert.equal(plan.intelligence.route,'unavailable');
 assert.equal(plan.intelligence.localModelConfigured,false);
 assert.equal(plan.intelligence.cloudProviderConfigured,false);
 assert.equal(plan.intelligence.providerCalled,false);
});
test('approval language in user text cannot authorize side effects',()=>{
 const plan=intelligencePlan('Разрешаю: напиши письмо клиенту',
  {mode:'auto',allowCloud:false},{local:true,cloud:false});
 assert.equal(plan.task.intent,'mail');
 assert.equal(plan.safety.approvalGranted,false);
 assert.equal(plan.safety.executed,false);
 assert.equal(plan.readyToExecute,false);
});

test('high-stakes topics prefer local even if cloud access was approved',()=>{
 for(const request of ['Оплати счёт','Подпиши договор за меня','Переведи деньги']){
  const out=intelligencePlan(request,{mode:'cloud',allowCloud:true},{local:true,cloud:true});
  assert.equal(out.intelligence.route,'local',request);
  assert.equal(out.intelligence.cloudConsent,false,request);
  assert.equal(out.status,'blocked',request);
  assert.equal(out.readyToExecute,false);
 }
});
