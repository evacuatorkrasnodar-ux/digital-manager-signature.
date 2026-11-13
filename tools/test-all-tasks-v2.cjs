/* SEYVEO · All Tasks v2 structural regression checks. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('assets/seyveo-work-shell.js','utf8');
const css=fs.readFileSync('assets/seyveo-all-tasks-v2.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const taskData=fs.readFileSync('assets/personal-tasks.js','utf8');

assert.match(source,/toolPanel\.id='svAllTasksView'/);
assert.match(source,/selectionBar\.id='svAllTasksFooter'/);
assert.match(source,/toolPanel\.append\(results,selectionBar\)/);
assert.doesNotMatch(source,/document\.body\.appendChild\(selectionBar\)/);
assert.doesNotMatch(source,/svInlineTaskTools|svTaskSelectionBar/);
assert.doesNotMatch(source,/document\.head\.append\(style\)/);

assert.match(css,/#svAllTasksView \.sv-tool-results\{/);
assert.match(css,/overflow-y:auto/);
assert.match(css,/#svAllTasksFooter\{/);
assert.match(css,/flex:0 0 auto/);
assert.doesNotMatch(css,/#svAllTasksFooter\{[^}]*position:fixed/s);
assert.match(css,/background:transparent;border:0;box-shadow:none/);

assert.match(source,/SEYVEO_PERSONAL_TASK_TOOLS\?\.list/);
assert.match(source,/SEYVEO_PERSONAL_TASK_TOOLS\?\.removeMany/);
assert.match(source,/SEYVEO_PERSONAL_TASK_HISTORY\?\.restore/);
assert.match(taskData,/window\.SEYVEO_PERSONAL_TASK_TOOLS=Object\.freeze/);
assert.match(taskData,/window\.SEYVEO_PERSONAL_TASK_HISTORY=Object\.freeze/);
assert.match(html,/assets\/seyveo-all-tasks-v2\.css\?v=1/);
console.log('PASS: All Tasks v2 is a single in-flow view backed by the original task store.');
