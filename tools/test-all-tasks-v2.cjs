/* SEYVEO · All Tasks v2 structural regression checks. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('assets/seyveo-work-shell.js','utf8');
const css=fs.readFileSync('assets/seyveo-all-tasks-v2.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const taskData=fs.readFileSync('assets/personal-tasks.js','utf8');

assert.match(source,/toolPanel\.id='svAllTasksView'/);
assert.match(source,/actionCapsule\.id='svTaskActionCapsule'/);
assert.match(source,/toolPanel\.append\(results\)/);
assert.match(source,/document\.body\.append\(actionCapsule\)/);
assert.doesNotMatch(source,/selectionBar|svAllTasksFooter/);
assert.doesNotMatch(source,/svInlineTaskTools|svTaskSelectionBar/);
assert.doesNotMatch(source,/document\.head\.append\(style\)/);

assert.match(css,/#svAllTasksView \.sv-tool-results\{/);
assert.match(css,/overflow-y:auto/);
assert.match(css,/#svTaskActionCapsule\{/);
assert.doesNotMatch(css,/#svAllTasksFooter|sv-tool-action-row/);
assert.match(css,/position:fixed;z-index:110/);
assert.match(css,/background:transparent;border:0;box-shadow:none/);

assert.match(source,/SEYVEO_PERSONAL_TASK_TOOLS\?\.list/);
assert.match(source,/SEYVEO_PERSONAL_TASK_TOOLS\?\.removeMany/);
assert.match(source,/SEYVEO_PERSONAL_TASK_HISTORY\?\.restore/);
assert.match(taskData,/window\.SEYVEO_PERSONAL_TASK_TOOLS=Object\.freeze/);
assert.match(taskData,/window\.SEYVEO_PERSONAL_TASK_HISTORY=Object\.freeze/);
assert.match(html,/assets\/seyveo-all-tasks-v2\.css\?v=\d+/);
console.log('PASS: All Tasks uses one standalone action capsule and preserves the original task store.');
