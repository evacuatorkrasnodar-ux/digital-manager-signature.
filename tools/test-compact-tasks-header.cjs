/* SEYVEO work header regression: the original Tasks page stays mounted,
 * but a single permanent header is visible when switching Work tabs.
 * No hardcoded CSS cache version; version numbers change with each deployment.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html');
const shell=read('assets/seyveo-work-shell.js');
const css=read('assets/seyveo-work-shell.css');
const tasks=read('assets/seyveo-unified-tasks.js');
const component=read('assets/seyveo-work-header.js');
const start=html.indexOf('<header class="manage-heading tasks-heading">');
const end=html.indexOf('</header>',start);
assert.ok(start>0&&end>start,'Original Tasks header retained for non-shared fallback');
const header=html.slice(start,end+9);
assert.match(header,/<h1 id="tasksTitle">Мои дела<\/h1>/);
assert.match(header,/id="unifiedTasksBack"/);
assert.equal((header.match(/id="tasksTitle"/g)||[]).length,1);
// The single header now lives in a Shadow DOM component. Verify the actual
// mounted controls rather than retired IDs from the old implementation.
assert.equal((shell.match(/SEYVEO_WORK_HEADER\?\.create\(\)/g)||[]).length,1);
assert.equal((shell.match(/shell\.prepend\(heading\)/g)||[]).length,1);
assert.match(component,/document\.createElement\('seyveo-work-head'\)/);
assert.match(component,/host\.attachShadow\(\{mode:'open'\}\)/);
assert.equal((component.match(/<header class="bar">/g)||[]).length,1);
assert.match(component,/class="control back sv-canonical-back"/);
assert.match(component,/class="title"/);
assert.match(component,/class="control action"/);
assert.match(shell,/const choices=\[\['personal','Мои дела'\],\['notes','Блокнот'\],\['wallet','Кошелёк'\],\['business','Кабинет'\],\['employee','Моя работа'\]\]/);
assert.match(shell,/if\(legacy\)legacy\.style\.setProperty\('display','none','important'\)/);
assert.match(shell,/calendarAdd\?\.click\(\)/,'Calendar plus still calls the original handler');
assert.match(shell,/personalAdd\?\.click\(\)/,'Task plus still calls the original handler');
assert.match(shell,/cabinetAdd\?\.click\(\)/,'Cabinet plus still calls the original handler');
assert.match(shell,/legacyCalendarBack\?\.click\(\)/,'Calendar Back handler preserved');
assert.match(css,/#svWorkShell\[data-shared-work="true"\] \.tasks-heading/);
assert.match(css,/#svWorkShell > #calendarCreateMenu\{order:0!important\}/);
assert.match(shell,/const destination=inSharedHeader\?shell:menuHome/);
assert.match(component,/--sv-header-circle-shadow/);
assert.match(component,/--sv-nav-single-size,44px/);
assert.match(component,/--sv-nav-capsule-cell,42px/);
assert.match(component,/:host\(\[data-calendar-period="true"\]\) \.title\{[^}]*overflow:hidden;text-overflow:ellipsis;/);
assert.match(component,/\.title:has\(\.sv-zodiac-symbol\)/);
assert.match(html,/assets\/seyveo-work-header\.js\?v=/);
assert.match(tasks,/\$\('unifiedTasksBack'\)\?\.addEventListener\('click'/);
assert.match(html,/assets\/seyveo-work-shell\.css\?v=\d+/);
console.log('PASS: one stable Work header, existing Tasks fallback, original actions preserved.');
