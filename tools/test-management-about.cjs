/* SEYVEO · Business / Management routing regression.
 * Current approved UX: Business lives in "Дела", never in duplicate menus
 * under "Управление". Run with Node (no browser/server/dependencies).
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const management=fs.readFileSync('assets/management.js','utf8');
const work=fs.readFileSync('assets/seyveo-unified-tasks.js','utf8');
const business=fs.readFileSync('assets/seyveo-business-command.js','utf8');
const css=fs.readFileSync('assets/seyveo-business-command.css','utf8');

function one(id){
 const count=(html.match(new RegExp('id="'+id+'"','g'))||[]).length;
 assert.equal(count,1,'Single owned node: '+id);
}
for(const id of [
 'seyveoCleanManageMenu','seyveoCleanDetail','seyveoCleanLegacy','seyveoCleanBack',
 'seyveoCleanTitle','openManageRoadmap','manageRoadmapDialog',
 'seyveoBusinessCommandPage','unifiedTasksTabs','unifiedBusinessTasksView',
 'unifiedTasksTeamBoard','svcpManagerPeople','unifiedPeopleHost',
 'unifiedTasksChatHost','unifiedBusinessTasksHost','svcpChats','svcpTasks',
 'svcpTeam','seyveoStaffCards','seyveoRoiForm','svcpEmployeeProfileToggle',
 'svcpEmployeeAccountView','svcpEmployeeShiftCard','svcpEmployeeThanksCount'
])one(id);

const menuStart=html.indexOf('<div id="seyveoCleanManageMenu"');
const detailStart=html.indexOf('<div id="seyveoCleanDetail"');
assert.ok(menuStart>0&&detailStart>menuStart,'Management overview is intact');
const overview=html.slice(menuStart,detailStart);
assert.match(overview,/id="openManageRoadmap"/,'Ideas stays directly accessible');
assert.match(overview,/Карта развития · Поиск/,'Ideas has meaningful text');
assert.doesNotMatch(overview,/data-clean-business=/,
 'Business is in Дела, not a duplicate menu in Управление');
assert.doesNotMatch(overview,/data-clean-section="about"/,'No dead About page');
assert.doesNotMatch(overview,/Демо-режим|предпросмотры|Материалы SEYVEO/,
 'No old demo gallery / second main menu');
assert.match(overview,/id="seyveoDemoModeSelect"/,
 'Explicit role simulation remains available for testing ONE, Business, employee');

const workStart=html.indexOf('id="unifiedBusinessTasksView"');
const workEnd=html.indexOf('</main><div id="voiceHint"',workStart);
assert.ok(workStart>0&&workEnd>workStart,'Manager workspace exists within Дела');
const hub=html.slice(workStart,workEnd);
const actions=[...hub.matchAll(/data-business-hub="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(actions,['pulse','mail','documents','company'],
 'Single Business controls: Pulse, Mail, Documents and Company');
for(const id of ['svcpManagerPeople','unifiedPeopleHost','unifiedTasksChatHost',
 'unifiedBusinessTasksHost'])assert.ok(hub.includes('id="'+id+'"'),'Business owns '+id);
assert.match(hub,/<strong>Сотрудники<\/strong>/,'Manager can inspect staff');
assert.deepEqual(
 [...html.matchAll(/data-unified-tasks-tab="([^"]+)"/g)].map(m=>m[1]),
 ['personal','business','employee'],
 'ONE personal, manager business and employee work tabs share one page');
assert.match(html,/data-unified-tasks-tab="business" aria-pressed="false">Бизнес<\/button>/,
 'Manager tab has a short, unambiguous name');
assert.doesNotMatch(hub,/data-business-hub="(?:chat|tasks|people)"/,
 'No duplicate chats/tasks/people buttons in the manager tool list');
assert.doesNotMatch(html,/id="svcpOpenCompany"|id="svcpOpenPulse"|id="svcpOpenDocs"|id="svcpOpenMore"/,
 'Retired duplicate business controls must not return');

assert.match(work,/const isEmployee=\(\)=>previewMode==='employee'/);
assert.match(work,/const isManager=\(\)=>\['rise','autonom','large'\]\.includes\(previewMode\)/);
assert.match(work,/if\(isEmployee\(\)\)\{setEmployeeAccountOpen\(false\);navigate\('employee'\);return\}/,
 'Employee dock returns to her work screen');
assert.match(work,/if\(isManager\(\)\)\{openBusiness\('home'\);return\}/,
 'RISE/AUTONOM manager dock opens Business, not personal errands');
assert.match(work,/\n  openPersonal\(\);\n \}\);/,
 'ONE dock opens private tasks only');
assert.match(work,/if\(kind==='pulse'\)openPulse\(\)/);
assert.match(work,/if\(kind==='mail'\)window\.SEYVEO_SAYVI_SURFACES\?\.open\?\.\('mail','business'\)/);
assert.match(work,/if\(kind==='documents'\)window\.SEYVEO_SAYVI_SURFACES\?\.open\?\.\('contract','business'\)/);
assert.match(work,/if\(kind==='company'\)window\.SEYVEO_COMPANY_PASSPORT\?\.open\?\.\(\)/);
assert.match(work,/if\(staffReveal\.open\)window\.SEYVEO_BUSINESS_COMMAND\?\.openPeopleView\?\.\('team'\)/);
assert.match(work,/appendChild\(chats\)/,'Original chat is moved, not cloned');
assert.match(work,/appendChild\(tasks\)/,'Original task board is moved, not cloned');
assert.match(work,/function setEmployeeAccountOpen\(open\)/,
 'Employee shift, hours and recognition live behind one profile');
assert.match(css,/#tasksPage \.svcp-manager-row/,
 'Original Black Velvet manager rows still have their styles');
assert.match(business,/function preparePeopleContent\(\)/,
 'Existing HR and staffing widgets remain integrated');
assert.match(html,/assets\/seyveo-unified-tasks\.js\?v=17/,
 'Updated Business entry behavior is cache-versioned');

assert.match(management,/\$\('openManageRoadmap'\)\.addEventListener\('click'/);
assert.match(management,/roadmapDialog\.showModal\(\)/);
const marker='/* SEYVEO Management · one tap, one destination. Preserve original handlers. */';
const inlineStart=html.indexOf(marker);
assert.ok(inlineStart>0,'Management inline routing preserved');
const inlineEnd=html.indexOf('</script>',inlineStart);
assert.ok(inlineEnd>inlineStart);
new vm.Script(html.slice(inlineStart,inlineEnd),{filename:'SEYVEO Management navigation'});
assert.doesNotMatch(html.slice(inlineStart,inlineEnd),/about:\[/,
 'No obsolete About route recreated');
assert.doesNotMatch(html.slice(inlineStart,inlineEnd),/if\(key==='about'\)/);

console.log('PASS Business: clean Дела entry for manager/employee/ONE, single manager hub, preserved team/chat/tasks, Management without duplicate business rows.');
