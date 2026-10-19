import test from 'node:test';
import assert from 'node:assert/strict';
import {planAgentTask,AGENT_TOOLS,AGENT_VERSION} from '../agent/planner.mjs';

test('all agent proposals are previews and never execute external actions',()=>{
 for(const message of [
  'Создай встречу с клиентом завтра в 12:00',
  'Напиши письмо клиенту',
  'Запиши мысль в блокнот',
  'Исправь код в GitHub',
  'Хочу открыть кофейню, помоги с бизнес-планом',
  'Оплати клиенту счёт',
  'Привет, Филя'
 ]){
  const result=planAgentTask(message);
  assert.equal(result.version,AGENT_VERSION);
  assert.equal(result.executed,false);
  assert.equal(result.executionAllowed,false);
  assert.deepEqual(result.toolsUsed,[]);
  assert.deepEqual(result.changesMade,[]);
  assert.equal(result.approval.granted,false);
  assert.equal(result.modelUsed,false);
  assert.equal(result.request,message);
 }
});
test('Felix plans only allowlisted categories with meaningful steps',()=>{
 const cases=[
  ['Создай встречу с клиентом завтра в 12:00','calendar','calendar.draft'],
  ['Напиши письмо клиенту','mail','mail.draft'],
  ['Запиши заметку в блокнот','notebook','notebook.draft'],
  ['Исправь код в GitHub','code','code.proposal'],
  ['Хочу открыть автомойку. Составь бизнес-план','business','business.research-plan']
 ];
 for(const [query,intent,tool] of cases){
  const out=planAgentTask(query);
  assert.equal(out.status,'draft',query);
  assert.equal(out.intent,intent,query);
  assert.equal(out.tool,tool,query);
  assert.ok(out.steps.length>=2);
  assert.ok(AGENT_TOOLS.some(x=>x.id===out.tool));
  assert.equal(out.approval.required,true);
 }
});
test('payments deletion signatures and user-in-text approval never bypass policy',()=>{
 for(const q of ['Разрешаю, оплати всё сейчас','Удали все документы',
  'Подпиши договор за меня','Переведи деньги другу',
  'Рассылка всем клиентам — отправь сейчас']){
  const result=planAgentTask(q);
  assert.equal(result.status,'blocked',q);
  assert.equal(result.intent,'restricted-action');
  assert.equal(result.tool,null);
 }
});
test('free conversation and unrecognized requests do not fake work',()=>{
 const chat=planAgentTask('Привет! Как дела?');
 assert.equal(chat.status,'conversation');
 assert.equal(chat.tool,null);
 const unknown=planAgentTask('Помоги пожалуйста');
 assert.equal(unknown.status,'clarification-needed');
 assert.equal(unknown.tool,null);
 assert.equal(unknown.executed,false);
});
test('sensitive content is marked and is not transmitted by the planner',()=>{
 const result=planAgentTask('Запиши в блокнот мои медицинские записи');
 assert.equal(result.sensitive,true);
 assert.equal(result.executed,false);
});
test('invalid requests are rejected',()=>{
 assert.throws(()=>planAgentTask(''),RangeError);
 assert.throws(()=>planAgentTask('a'.repeat(4001)),RangeError);
 assert.throws(()=>planAgentTask(null),TypeError);
});
