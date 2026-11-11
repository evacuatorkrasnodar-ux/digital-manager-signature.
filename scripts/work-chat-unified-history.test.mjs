import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [js,css,html]=await Promise.all([
 readFile(new URL('assets/seyveo-business-command.js',root),'utf8'),
 readFile(new URL('assets/seyveo-work-chat-screen.css',root),'utf8'),
 readFile(new URL('index.html',root),'utf8')
]);

test('Work Chat history groups messages and attachments by conversation, tasks by assignee',()=>{
 assert.match(html,/id="svcpWorkHistoryTop"/);
 assert.match(html,/id="svcpWorkHistory"/);
 assert.doesNotMatch(html,/data-svcp-chat-filter="history"/);
 assert.match(js,/function workHistoryEntries\(query=''\)/);
 assert.match(js,/for\(const room of ROOMS\)/);
 assert.match(js,/const all=state\.chat\.map\(\(msg,index\)=>\(\{msg,index\}\)\)/);
 assert.match(js,/entries\.push\(\{\s*kind:'room',key:'room:'\+room\.id/);
 assert.match(js,/const assignees=new Map\(\)/);
 assert.match(js,/state\.tasks\.forEach\(\(task,index\)=>/);
 assert.match(js,/kind:'task',key:'task:'\+group\.id/);
 assert.match(js,/entries\.sort\(\(a,b\)=>b\.at-a\.at/);
 assert.match(js,/openRoom\(entry\.roomId\)/);
 assert.match(js,/requestAnimationFrame\(\(\)=>focusTask\(entry\.index\)\)/);
});

test('search matches file names without creating one row per file',()=>{
 assert.match(js,/String\(msg\.mediaName\|\|''\)/);
 assert.match(js,/const nFiles=all\.filter\(\(\{msg\}\)=>!!msg\.mediaId\)\.length/);
 assert.match(js,/group\.all\.length\+' всего'/);
 assert.match(js,/const entries=workHistoryEntries\(q\)/);
 assert.match(html,/id="svcpWorkHistoryQuery"/);
});

test('employee history is scoped and manager has local-only deletion',()=>{
 assert.match(js,/employeeAllowedRoom\(room\)/);
 assert.match(js,/employeePreviewActive\(\)&&task\.assigneeId!=='elena'/);
 assert.match(js,/function canManageWorkHistory\(\)\{return !employeePreviewActive\(\)&&state\.viewpoint==='manager'\}/);
 assert.match(js,/if\(!canManageWorkHistory\(\)\|\|!keys\.size\)return/);
 assert.match(js,/if\(!employeePreviewActive\(\)&&state\.viewpoint==='manager'\)\{\s*const moderating=!isOwn/);
 assert.match(js,/if\(!employeePreviewActive\(\)&&state\.viewpoint==='manager'\)\s*extra\.append\(decorateTaskAction\(btn\('Удалить'/);
});

test('standard history navigation uses circle back, centered title, icon menu and avatars',()=>{
 assert.match(html,/id="svcpWorkHistoryBack"[^>]*class="svcp-work-history-back"/);
 assert.match(html,/id="svcpWorkHistoryFind"><svg/);
 assert.match(html,/id="svcpWorkHistorySelect"><svg/);
 assert.match(html,/id="svcpWorkHistoryClear"><svg/);
 assert.match(css,/#svcpWorkHistory \.svcp-work-history-head\{[\s\S]*?grid-template-columns:42px minmax\(0,1fr\) 42px/);
 assert.match(css,/#svcpWorkHistory \.svcp-work-history-head > #svcpWorkHistoryBack\{[\s\S]*?background:#38383A/);
 assert.match(css,/#svcpWorkHistory \.svcp-work-history-avatar\{/);
 assert.match(js,/const avatar=el\('span','svcp-work-history-avatar',entry\.mark\)/);
 assert.match(html,/assets\/seyveo-business-command\.js\?v=178/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=242/);
 assert.match(html,/assets\/seyveo-chat-attachments-unified\.css\?v=17/);
});
