const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=pathName=>fs.readFileSync(path.join(__dirname,'../',pathName),'utf8');

const tasks=read('assets/personal-tasks.js');
const actions=read('assets/assistant-local-actions.js');
const calendar=read('assets/calendar.js');
const bridge=read('assets/seyveo-chat-calendar-bridge.js');

test('creator attribution distinguishes Sayvi, manual saves, and records from before tracking',()=>{
 const helper=tasks.slice(tasks.indexOf('function creatorOf(item)'),tasks.indexOf('function showCreator(item)'));
 const {creatorOf,creatorName}=new Function(helper+'return {creatorOf,creatorName};')();
 assert.equal(creatorOf({createdBy:'sayvi'}),'sayvi');
 assert.equal(creatorName({createdBy:'sayvi'}),'Сэйви');
 assert.equal(creatorOf({createdBy:'user'}),'user');
 assert.equal(creatorName({createdBy:'user'}),'Вы');
 assert.equal(creatorOf({source:'sayvi'}),'sayvi','respect an explicitly stored legacy Sayvi source');
 assert.equal(creatorOf({createdAt:'2026-11-16T12:00:00Z'}),'','never guess who created an old record');
 assert.equal(creatorName({createdBy:'arbitrary'}),'Не указан');
});

test('new task creation tags the actual writer, keeps it through edits, and reveals the author',()=>{
 assert.match(tasks,/createdBy:creatorOf\(item\)/,'saved author survives read and render');
 assert.match(tasks,/const createdBy=form\.dataset\.svCreatedBy==='sayvi'\?'sayvi':'user'/,'normal editor save is credited to the person');
 assert.match(tasks,/doneAt:'',createdBy\}/,'new form record persists the author');
 assert.match(tasks,/const createdBy=detail\.createdBy==='sayvi'\?'sayvi':'user'/,'assistant batch is explicitly tagged');
 assert.match(tasks,/showCreator\(task\)/,'edit screen identifies the saved creator');
 assert.match(tasks,/Кто создал: '\+creatorName\(item\)/,'the Details panel identifies the creator');
 assert.match(actions,/const detail=\{createdBy:'sayvi',items:/,'fast Sayvi action carries a signed-off origin in its plan');
 assert.equal((actions.match(/form\.dataset\.svCreatedBy='sayvi'/g)||[]).length,2,
  'both live-action task and calendar submission identify Sayvi');
 const home=read('index.html');
 assert.match(home,/id="svTaskCreatedBy"[^>]*hidden/,'the author line is shown only when editing an existing record');
});

test('calendar assistant and manual creation paths also preserve provenance',()=>{
 assert.match(calendar,/createdBy:x\.createdBy==='sayvi'\?'sayvi':x\.createdBy==='user'\?'user':''/);
 assert.match(calendar,/createdBy:old\?old\.createdBy:createdBy/,'editing does not rewrite the first creator');
 assert.match(calendar,/createdBy:'sayvi'/,'direct Sayvi calendar saves are identifiable');
 assert.match(bridge,/createdBy:'sayvi'/,'standalone chat calendar fallback is identifiable');
});
