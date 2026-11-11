import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [js,css,html]=await Promise.all([
 readFile(new URL('assets/seyveo-business-command.js',root),'utf8'),
 readFile(new URL('assets/seyveo-work-chat-screen.css',root),'utf8'),
 readFile(new URL('index.html',root),'utf8')
]);

test('one chronological work history includes messages, attachments and assignments',()=>{
 assert.match(html,/data-svcp-chat-filter="history"/);
 assert.match(js,/function renderWorkHistory\(\)/);
 assert.match(js,/state\.chat\.forEach\(\(msg,index\)=>\{/);
 assert.match(js,/const kind=msg\.mediaId\?'Файл':msg\.taskId\?'Поручение':'Сообщение'/);
 assert.match(js,/state\.tasks\.forEach\(\(task,index\)=>\{/);
 assert.match(js,/entries\.sort\(\(a,b\)=>b\.at-a\.at/);
 assert.match(js,/openRoom\(entry\.roomId\);focusSearchIndex=entry\.index;renderChat\(\)/);
 assert.match(js,/requestAnimationFrame\(\(\)=>focusTask\(entry\.index\)\)/);
});

test('employee history is scoped to accessible rooms and own assignments',()=>{
 assert.match(js,/const allowed=roomId=>ROOMS\.some\(room=>room\.id===roomId\)&&/);
 assert.match(js,/employeeAllowedRoom\(roomId\)/);
 assert.match(js,/employeePreviewActive\(\)&&task\.assigneeId!=='elena'/);
 assert.match(js,/const manager=!employeePreviewActive\(\)&&state\.viewpoint!=='elena'/);
 assert.match(js,/if\(manager\)\{\s*const remove=el\('button','svcp-work-history-delete'/);
});

test('only the manager gets local message and task deletion actions',()=>{
 assert.match(js,/if\(!employeePreviewActive\(\)&&state\.viewpoint==='manager'\)\{\s*const moderating=!isOwn/);
 assert.match(js,/if\(!employeePreviewActive\(\)&&state\.viewpoint==='manager'\)\s*extra\.append\(decorateTaskAction\(btn\('Удалить'/);
 assert.match(js,/if\(employeePreviewActive\(\)\|\|state\.viewpoint!=='manager'\)return/);
});

test('history follows existing design and preserves full room navigation',()=>{
 assert.match(html,/assets\/seyveo-business-command\.js\?v=175/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=240/);
 assert.match(css,/\.svcp-chat-filters\{\s*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
 assert.match(css,/\.svcp-work-history-row\{/);
 assert.match(css,/\.svcp-work-history-delete\{/);
 assert.match(js,/if\(chatFilter==='history'\)\{renderWorkHistory\(\);return\}\s*if\(renderHistorySearch\(\)\)return/);
});
