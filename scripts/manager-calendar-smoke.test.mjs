import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [html,nav,calendar,calendarCss,employee]=await Promise.all([
  read('index.html'),read('assets/seyveo-unified-tasks.js'),
  read('assets/calendar.js'),read('assets/calendar.css'),
  read('assets/seyveo-employee-schedule.js')
]);

test('manager sees ordered three tabs with Calendar centered and director Cabinet renamed',()=>{
  const tabs=html.split('<div id="unifiedTasksTabs"')[1]?.split('</div>')[0];
  assert.ok(tabs);
  const names=[...tabs.matchAll(/data-unified-tasks-tab="([^"]+)"[^>]*>[\s\S]*?<span>([^<]+)<\/span><\/button>/g)];
  assert.deepEqual(names.map(x=>[x[1],x[2]]),[
    ['personal','Мои дела'],['calendar','Календарь'],
    ['business','Кабинет']
  ]);
  assert.match(tabs,/data-unified-tasks-tab="calendar"[^>]*hidden/);
  assert.match(tabs,/data-unified-tasks-tab="employee"[^>]*hidden>Моя работа<\/button>/);
  assert.match(nav,/if\(calendarTab\)calendarTab\.hidden=!isManager\(\)/);
  assert.match(nav,/if\(businessTab\)businessTab\.hidden=!isManager\(\)/);
  assert.match(nav,/if\(employeeTab\)employeeTab\.hidden=!isEmployee\(\)/);
  assert.match(html,/\.tasks-switch\[data-manager="true"\],#managerCalendarTabs\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(nav,/if\(taskTabs\)taskTabs\.hidden=false/);
});

test('Calendar tab opens the existing single calendar instead of duplicating its data or markup',()=>{
  assert.equal((html.match(/id="calendarPage"/g)||[]).length,1);
  assert.equal((html.match(/id="calendarMonthGrid"/g)||[]).length,1);
  assert.equal((html.match(/id="calendarEventForm"/g)||[]).length,1);
  assert.equal((html.match(/id="managerCalendarTabs"/g)||[]).length,1);
  assert.match(nav,/function openManagerCalendar\(\)/);
  assert.match(nav,/if\(location\.hash!=='#calendar'\)location\.hash='#calendar'/);
  assert.match(nav,/if\(button\.dataset\.unifiedTasksTab==='calendar'\)\{openManagerCalendar\(\);return\}/);
  assert.match(nav,/managerCalendarTabs\?\.addEventListener\('click'/);
  assert.match(nav,/navigate\(tab\.dataset\.managerCalendarTab==='business'\?'team':'personal'\)/);
  assert.match(nav,/managerCalendarContext=false/);
  assert.match(html,/id="managerCalendarTabs"[\s\S]*?data-manager-calendar-tab="calendar" aria-pressed="true"/);
  assert.match(html,/seyveo-unified-tasks\.js\?v=35/);
  assert.match(html,/calendar\.js\?v=33/);
  assert.match(html,/calendar\.css\?v=38/);
});

test('existing Calendar uses one event store for personal and work filtered day/week/month/deadlines',()=>{
  assert.match(calendar,/const STORE='seyveo-calendar-events-v1'/);
  assert.match(calendar,/kind:x\.kind==='business'\?'business':'personal'/);
  assert.match(calendar,/const visibleEvents=\(\)=>events\(\)\.filter/);
  assert.match(calendar,/const meeting=visibleEvents\(\)\.filter/);
  assert.match(calendar,/calendarEvents=visibleEvents\(\),personalTasks=/);
  assert.match(calendar,/visibleEvents\(\)\.filter\(x=>x\.date>=today\)/);
  assert.match(calendar,/function renderDeadlines\(\)/);
  assert.match(calendar,/function renderAgenda\(\)/);
  assert.match(calendar,/scope=next;/);
  assert.match(calendar,/const currentScope=selectedScope\(\)/);
  assert.match(calendar,/const nearby=engine\?\.nearest\(visibleEvents\(\)/);
  assert.match(calendar,/const slots=engine\.suggestions\(visibleEvents\(\)/);
  assert.match(calendar,/return visibleEvents\(\)\.find\(item=>item\.date===date/);
  assert.match(calendar,/setEventKind\(item\?\.kind\|\|\(selectedScope\(\)==='business'\?'business':'personal'\)\)/);
  assert.match(html,/data-calendar-scope="all"/);
  assert.match(html,/data-calendar-scope="personal"/);
  assert.match(html,/data-calendar-scope="business"/);
  assert.match(calendarCss,/#calendarPage \.cal-scope\[hidden\]\{display:none!important\}/);
});

test('employee/One calendar stays private, while employee shifts and manager tools remain in Staff',()=>{
  assert.match(calendar,/const selectedScope=\(\)=>managerPreview\(\)\?scope:'personal'/);
  assert.match(calendar,/if\(scopeControls\)scopeControls\.hidden=!managerPreview\(\)/);
  assert.match(calendar,/if\(!managerPreview\(\)\)return 'personal'/);
  assert.match(calendar,/const workKind=form\.querySelector/);
  assert.match(calendar,/if\(workKind\)workKind\.hidden=!managerPreview\(\)/);
  assert.match(calendar,/selectedScope\(\)==='business'\?\[\]:tasks\(\)/);
  assert.match(calendar,/selectedScope\(\)==='business'\?\[\]:\(window\.SEYVEO_SPACES\?\.calendarItems/);
  assert.match(html,/id="svcpManagerPeople"/);
  assert.match(html,/id="svcpManagerSchedule"/);
  assert.match(html,/id="svcpManagerRequestList"/);
  assert.match(html,/id="svcpEmployeeSchedule"/);
  assert.match(employee,/const PLAN_KEY='seyveo-elena-workweek-demo-v1'/);
  assert.match(employee,/function renderManager\(items,settings\)/);
  assert.doesNotMatch(nav,/data-business-hub="calendar"/);
  // One storage key and no separate workplace-calendar database.
  assert.doesNotMatch(calendar,/seyveo-manager-calendar-events-v/);
});
