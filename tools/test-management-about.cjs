/* SEYVEO · Current Business / Management routing regression.
 * Director operations are in "Дела → Кабинет", while "Управление"
 * owns assistant settings, subscriptions, connections and product ideas.
 * Static wiring tests only; real company authorization is not asserted. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=name=>fs.readFileSync(name,'utf8');
const html=read('index.html');
const management=read('assets/management.js');
const work=read('assets/seyveo-unified-tasks.js');
const business=read('assets/seyveo-business-command.js');
const css=read('assets/seyveo-business-command.css');

const one=id=>assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'One owner for '+id);
for(const id of [
 'seyveoCleanManageMenu','seyveoCleanDetail','seyveoCleanLegacy','seyveoCleanBack',
 'seyveoCleanTitle','openManageRoadmap','manageRoadmapDialog',
 'seyveoBusinessCommandPage','unifiedTasksTabs','unifiedBusinessTasksView',
 'unifiedTasksTeamBoard','svcpManagerPeople','unifiedPeopleHost',
 'unifiedTasksChatHost','unifiedBusinessTasksHost','svcpChats','svcpTasks',
 'svcpTeam','seyveoStaffCards','seyveoRoiForm','svcpEmployeeShiftCard','svcpEmployeeThanksCount'
])one(id);
const menuStart=html.indexOf('<div id="seyveoCleanManageMenu"');
const detailStart=html.indexOf('<div id="seyveoCleanDetail"');
assert.ok(menuStart>0&&detailStart>menuStart,'Management overview exists');
const overview=html.slice(menuStart,detailStart);
assert.match(overview,/id="openManageRoadmap"/,'Idea register still accessible');
assert.match(overview,/Карта развития · Поиск/);
assert.doesNotMatch(overview,/data-clean-business=/,'No second Business hub under Management');
assert.doesNotMatch(overview,/data-clean-section="about"/,'No empty About route');
assert.match(overview,/id="seyveoDemoModeSelect"/,'Role presentation selector remains');

const start=html.indexOf('<section id="unifiedBusinessTasksView"');
const end=html.indexOf('</main><div id="voiceHint"',start);
assert.ok(start>0&&end>start,'Director cabinet belongs to Tasks page');
const hub=html.slice(start,end);
assert.match(hub,/aria-label="Кабинет руководителя"/);
const actions=[...hub.matchAll(/data-business-hub="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(actions,['pulse','chats','mail','documents','company'],
 'Five direct actions plus one staff disclosure in Director Cabinet');
assert.match(hub,/id="svcpManagerPeople"/);
assert.match(hub,/<strong>Сотрудники<\/strong>/);
for(const id of ['unifiedPeopleHost','unifiedTasksChatHost','unifiedBusinessTasksHost',
 'svcpManagerSchedule','svcpManagerRequestList','svcpBreakSetup'])
 assert.ok(hub.includes('id="'+id+'"'),'Director work feature remains: '+id);
assert.doesNotMatch(html,/id="svcpOpenCompany"|id="svcpOpenPulse"|id="svcpOpenDocs"|id="svcpOpenMore"/,
 'Retired duplicate business controls cannot return');

const tabs=[...html.matchAll(/data-unified-tasks-tab="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(tabs,['personal','calendar','business','employee'],
 'Personal, Calendar, Cabinet and employee work share the same shell');
assert.match(html,/data-unified-tasks-tab="business" aria-pressed="false">[\s\S]*?<span>Кабинет<\/span>/);
assert.match(html,/data-unified-tasks-tab="calendar" aria-pressed="false" hidden/);
assert.match(work,/const isEmployee=\(\)=>previewMode==='employee'/);
assert.match(work,/const isManager=\(\)=>\['rise','autonom','large'\]\.includes\(previewMode\)/);
assert.match(work,/if\(isEmployee\(\)\)\{navigate\('employee'\);return\}/);
assert.match(work,/if\(isManager\(\)\)\{openBusiness\('home'\);return\}/);
assert.match(work,/function openBusiness\(source='manage'\)/);
assert.match(work,/function showChat\(/);
assert.match(work,/appendChild\(chats\)/,'Live chat is moved instead of cloned');
assert.match(work,/appendChild\(tasks\)/,'Live task list is moved instead of cloned');
for(const k of ['pulse','chats','mail','documents','company'])
 assert.ok(work.includes("if(kind==='"+k+"')"),'Director shortcut has a handler: '+k);
assert.match(work,/staffReveal\?\.addEventListener\('toggle'/);
assert.match(css,/#tasksPage \.svcp-manager-row\{/);
assert.match(css,/#tasksPage \.svcp-manager-staff>summary/);
assert.match(business,/function preparePeopleContent\(\)/);
assert.match(html,/assets\/seyveo-unified-tasks\.js\?v=38/);

assert.match(management,/\$\('openManageRoadmap'\)\.addEventListener\('click'/);
assert.match(management,/roadmapDialog\.showModal\(\)/);
const marker='/* SEYVEO Management · one tap, one destination. Preserve original handlers. */';
const inlineStart=html.indexOf(marker);
assert.ok(inlineStart>0,'Management routing remains installed');
const inlineEnd=html.indexOf('</script>',inlineStart);
assert.ok(inlineEnd>inlineStart);
new vm.Script(html.slice(inlineStart,inlineEnd),{filename:'SEYVEO Management navigation'});
assert.doesNotMatch(html.slice(inlineStart,inlineEnd),/about:\[/);
assert.doesNotMatch(html.slice(inlineStart,inlineEnd),/if\(key==='about'\)/);
console.log('PASS one director cabinet in Dela, separate Management settings, preserved staff/chat/task navigation');
