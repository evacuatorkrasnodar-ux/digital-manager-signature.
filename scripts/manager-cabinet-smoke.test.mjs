/**
 * Focused SEYVEO demo UI regression checks.
 *
 * Static wiring, syntax and role isolation only: not a real-device,
 * screen-reader, browser pixel or server identity-security test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const [html,roles,tasks,css]=await Promise.all([
  read('index.html'),
  read('assets/seyveo-unified-tasks.js'),
  read('assets/seyveo-business-command.js'),
  read('assets/seyveo-business-command.css')
]);
const business=html.split('<section id="unifiedBusinessTasksView"')[1]
  ?.split('<div id="unifiedTasksChatHost"')[0];

test('director gets one heading, no duplicate cockpit, and a calm local demo status',()=>{
  assert.ok(business);
  assert.match(html,/id="tasksTitle"/);
  assert.match(business,/aria-label="Кабинет руководителя"/);
  assert.doesNotMatch(business, /svcp-manager-intro|Пульт руководителя|RISE · SEYVEO · ДЕМО/);
  assert.match(html,/id="svcpManagerSignal"[^>]*hidden/);
  assert.match(html,/id="svcpManagerStatus" role="status" aria-live="polite"/);
  assert.equal((html.match(/id="svcpManagerStatus"/g)||[]).length,1);
  assert.match(roles,/chosen==='business'\?'Кабинет руководителя':'Дела'/);
  assert.match(roles,/if\(managerSignal\)managerSignal\.hidden=chosen!=='business'/);
  assert.match(roles,/caption\.hidden=chosen==='business'/);
  assert.match(roles,/if\(taskTabs\)taskTabs\.hidden=false/);
  assert.match(roles,/page\.dataset\.workView=chosen/);
  assert.match(html,/data-unified-tasks-tab="calendar"/);
  assert.match(html,/data-unified-tasks-tab="business" aria-pressed="false">Кабинет/);
  assert.match(roles,/if\(calendarTab\)calendarTab\.hidden=!isManager\(\)/);
  assert.match(roles,/if\(taskTabs\)taskTabs\.dataset\.manager=String\(isManager\(\)\)/);
  assert.match(html,/id="managerCalendarTabs"/);
  assert.match(css,/#tasksPage #unifiedTasksTabs\[hidden\]/);
  assert.match(css,/#tasksPage \.svcp-manager-signal\[hidden\]/);
});

test('six business destinations share one card; employee details and schedule remain intact',()=>{
  const actions=business.indexOf('<div class="svcp-manager-actions"');
  const people=business.indexOf('<details id="svcpManagerPeople"');
  const sharedMenuClosing=business.lastIndexOf('</div>');
  assert.ok(actions>=0&&people>actions&&sharedMenuClosing>people);
  const buttons=[...business.matchAll(/data-business-hub="([^"]+)"/g)]
    .map(x=>x[1]);
  assert.deepEqual(buttons,['pulse','chats','mail','documents','company']);
  assert.equal((business.match(/id="svcpManagerPeople"/g)||[]).length,1);
  assert.match(business,/id="svcpManagerSchedule"/);
  assert.match(business,/id="svcpManagerRequestList"/);
  assert.match(business,/id="svcpBreakSetup"/);
  assert.match(business,/id="unifiedPeopleHost"/);
  assert.match(roles,/staffReveal\?\.addEventListener\('toggle'/);
  assert.match(roles,/const businessActions=page\.querySelector\('\.svcp-manager-actions'\)/);
  assert.match(css,/#tasksPage \.svcp-manager-staff>summary/);
  assert.doesNotMatch(css, /#tasksPage \.svcp-manager-intro/);
});

test('personal SEYVEO One and employee work routes remain reachable without a manager tab',()=>{
  assert.match(html,/id="unifiedPersonalTasksView"/);
  assert.match(html,/id="unifiedEmployeeTasksView"/);
  assert.match(html,/data-unified-tasks-tab="personal"/);
  assert.match(html,/data-unified-tasks-tab="employee"/);
  assert.match(roles,/if\(isEmployee\(\)\)\{navigate\('employee'\);return\}/);
  assert.match(roles,/if\(isManager\(\)\)\{openBusiness\('home'\);return\}/);
  assert.match(roles,/function openPersonal\(\)/);
  assert.match(roles,/function openBusiness\(source='manage'\)/);
  assert.match(roles,/function showChat\(/);
  assert.match(roles,/select\('business'\);\s*openWorkChat/);
  assert.match(roles,/chosen==='employee'\?'Моя работа'/);
  assert.match(roles,/if\(employee\)employee\.hidden=chosen!=='employee'/);
});

test('today area reuses live assignments, completion history and active counts',()=>{
  assert.match(html,/id="unifiedBusinessTasksHost"/);
  assert.match(tasks,/heading\.append\(el\('strong',null,'Сегодня'\),el\('small',null,'В работе · '\+open\.length\)\)/);
  assert.match(tasks,/Новых поручений нет\./);
  assert.match(tasks,/const done=state\.tasks/);
  assert.match(tasks,/const details=el\('details','svcp-task-history'\)/);
  assert.match(tasks,/summary\.append\(el\('strong',null,'Выполнено'\)/);
  assert.match(tasks,/state\.tasks=updated;renderTasks\(\)/);
  assert.match(roles,/const TASK_KEY='seyveo-business-command-tasks-demo-v1'/);
  assert.match(roles,/summary\.textContent=count/);
  assert.match(roles,/localStorage\.getItem\(TASK_KEY\)/);
  assert.doesNotMatch(business,/class="svcp-manager-intro"/);
});

test('no old cached stylesheet/scripts and compact original manager CSS rules',()=>{
  assert.match(html,/seyveo-business-command\.css\?v=62/);
  assert.match(html,/seyveo-business-command\.js\?v=64/);
  assert.match(html,/seyveo-unified-tasks\.js\?v=35/);
  assert.match(css,/#tasksPage \.svcp-manager-row\{[^}]*min-height:57px/);
  assert.match(css,/#tasksPage \.svcp-manager-art\{[^}]*width:35px/);
  assert.match(css,/#tasksPage \.svcp-manager-staff\{[^}]*margin:0;border:0/);
  assert.match(css,/#tasksPage\[data-work-view="business"\] \.tasks-heading h1/);
});
