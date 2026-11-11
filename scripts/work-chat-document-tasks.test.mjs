import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [script,css,html]=await Promise.all([
 readFile(new URL('assets/seyveo-business-command.js',root),'utf8'),
 readFile(new URL('assets/seyveo-work-chat-screen.css',root),'utf8'),
 readFile(new URL('index.html',root),'utf8')
]);
test('manager may assign standalone document messages',()=>{
 assert.match(script,/if\(canAssign&&bubble\.classList\.contains\('svcp-document-only'\)\)/);
 assert.match(script,/bubble\.classList\.add\('svcp-document-assignable'\)/);
 assert.match(script,/prepareTask\(msg,index\)/);
 assert.match(script,/attachmentMediaId:msg\.mediaId/);
 assert.match(script,/if\(hasFile&&!clean\)title\.value=/);
});
test('document assignment shows exactly one action without blocking file opening',()=>{
 assert.match(css,/\.svcp-document-only\.svcp-document-assignable > \.svcp-message-inline-actions/);
 assert.match(css,/> :not\(\.svcp-action-task\)\{display:none!important\}/);
 assert.match(css,/top:calc\(100% \+ 3px\)!important/);
 assert.match(script,/previewable\?\(\)=>svcpOpenDocument\(localFile,message\):null/);
 assert.match(html,/assets\/seyveo-business-command\.js\?v=173/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=238/);
});

test('expanded Work Chat keeps microphone beside send when text or files are present',()=>{
 assert.match(css,/#svcpChatForm\.svcp-compose-multiline \.svcp-chat-compose-field > #svcpVoiceRecord\{/);
 assert.match(css,/right:59px!important;bottom:-48px!important/);
 assert.match(css,/right:8px!important;bottom:-48px!important/);
 assert.match(css,/display:grid!important;visibility:visible!important;pointer-events:auto!important/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=238/);
});

test('document viewer offers contextual real Sayvi support without replacing its action rail',()=>{
 assert.match(script,/function svcpOpenDocument\(file,sourceMessage=null\)/);
 assert.match(script,/top\.append\(back,heading,sayviTrigger\)/);
 assert.match(script,/sayviTrigger\.setAttribute\('aria-label','Спросить Сэйви об этом документе'\)/);
 assert.match(script,/if\(!\['word','pdf','text'\]\.includes\(kind\)\)sayviTrigger\.hidden=true/);
 assert.match(script,/function hideSayvi\(\)/);
 assert.match(script,/async function readDocumentForSayvi\(\)/);
 assert.match(script,/async function askDocumentSayvi\(question\)/);
 assert.match(script,/body:JSON\.stringify\(\{[\s\S]*message:query/);
 assert.match(script,/part\.type==='delta'/);
 assert.match(script,/sourceMessage\?senderName\(sourceMessage\)/);
 assert.match(script,/if\(shortened\)reply\.textContent=/);
 assert.match(script,/if\(!live\)return;live=false;\s*hideSayvi\(\)/);
 assert.match(script,/actionRail\.append\(doc\)/);
 assert.match(css,/\.svcp-doc-sayvi-panel\[hidden\]\{display:none!important\}/);
 assert.match(css,/\.svcp-doc-sayvi-panel\{/);
 assert.match(css,/\.svcp-doc-sayvi-input\{/);
 assert.match(html,/assets\/seyveo-business-command\.js\?v=173/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=238/);
});
