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
const start=html.indexOf('<header class="manage-heading tasks-heading">');
const end=html.indexOf('</header>',start);
assert.ok(start>0&&end>start,'Original Tasks header retained for non-shared fallback');
const header=html.slice(start,end+9);
assert.match(header,/<h1 id="tasksTitle">Дела<\/h1>/);
assert.match(header,/id="unifiedTasksBack"/);
assert.equal((header.match(/id="tasksTitle"/g)||[]).length,1);
assert.match(shell,/heading\.id='svWorkHeader'/);
assert.match(shell,/title\.id='svWorkTitle'/);
assert.match(shell,/add\.id='svWorkAdd'/);
assert.match(shell,/shell\.prepend\(heading\)/);
assert.match(shell,/const choices=\[\['personal','Мои дела'\],\['calendar','Календарь'\],\['business','Кабинет'\]\]/);
assert.match(shell,/calendarAdd\?\.click\(\)/,'Calendar plus still calls the original handler');
assert.match(shell,/personalAdd\?\.click\(\)/,'Task plus still calls the original handler');
assert.match(shell,/cabinetAdd\?\.click\(\)/,'Cabinet plus still calls the original handler');
assert.match(shell,/legacyCalendarBack\?\.click\(\)/,'Calendar Back handler preserved');
assert.match(css,/#svWorkShell\[data-shared-work="true"\] \.tasks-heading/);
assert.match(css,/#svWorkHeader/);
assert.match(css,/#svWorkHeader #calendarCreateMenu:not\(\[hidden\]\)/);
assert.match(css,/--sv-ui-glass/);
assert.match(tasks,/\$\('unifiedTasksBack'\)\?\.addEventListener\('click'/);
assert.match(html,/assets\/seyveo-work-shell\.css\?v=\d+/);
console.log('PASS: one stable Work header, existing Tasks fallback, original actions preserved.');
