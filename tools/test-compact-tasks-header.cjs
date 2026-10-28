/* SEYVEO · original Tasks header restored before experimental one-row toolbar.
   One existing back button and the original branding, not a copied header. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const personal=fs.readFileSync('assets/personal-tasks.css','utf8');
const business=fs.readFileSync('assets/seyveo-business-command.css','utf8');
const script=fs.readFileSync('assets/seyveo-unified-tasks.js','utf8');
const start=html.indexOf('<header class="manage-heading tasks-heading">');
const end=html.indexOf('</header>',start);
assert.ok(start>0&&end>start,'Original Tasks header is mounted');
const header=html.slice(start,end+9);
assert.doesNotMatch(header,/tasks-title-row/,'Compact toolbar is not reintroduced');
assert.match(header,/<p class="manage-caption">SEYVEO <span aria-hidden="true">\/<\/span> НА КОНТРОЛЕ<\/p>/,'Original two-level identity');
assert.match(header,/<h1 id="tasksTitle">Дела<\/h1>/,'Original Tasks title');
assert.ok(header.indexOf('unifiedTasksBack')<header.indexOf('manage-caption')&&
 header.indexOf('manage-caption')<header.indexOf('tasksTitle'),
 'Back, small SEYVEO label and large title retain their original vertical order');
for(const id of ['tasksTitle','unifiedTasksBack','unifiedTasksBackLabel','tasksOverview'])
 assert.equal((header.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Exactly one '+id);
assert.match(header,/id="tasksOverview"/,'Original task guidance preserved');
assert.match(personal,/#tasksPage \.tasks-heading\{margin:4px 0 13px\}/,'Previous heading rhythm restored');
assert.match(personal,/#tasksPage \.tasks-heading h1\{font-size:clamp\(28px,7vw,34px\)/,'Full-sized original title restored');
assert.doesNotMatch(personal,/\.tasks-title-row/,'No leftover compact CSS');
assert.match(business,/#tasksPage \.svcp-tasks-back\{display:inline-flex;align-items:center;gap:5px/,'Original back control and visible label');
assert.doesNotMatch(business,/\.svcp-tasks-back-arrow/,'Retired compact-only arrow removed');
assert.match(script,/\$\('unifiedTasksBack'\)\?\.addEventListener\('click'/,'Back behavior unchanged');
assert.match(html,/assets\/personal-tasks\.css\?v=23/,'New original-header stylesheet cache version');
assert.match(html,/assets\/seyveo-business-command\.css\?v=53/,'Back control stylesheet refreshed');
console.log('PASS Tasks header: previous original two-level appearance and working back navigation are restored.');
