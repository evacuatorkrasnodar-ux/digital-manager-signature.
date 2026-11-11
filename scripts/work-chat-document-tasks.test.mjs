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
test('document actions form one compact top row with reply, bookmark, and assignment',()=>{
 assert.match(script,/menu\.append\(svcpActionIcon\('Ответить','reply'/);
 assert.match(script,/menu\.append\(starControl\)/);
 assert.match(script,/menu\.append\(svcpActionIcon\('Поручить','task'/);
 assert.match(css,/\.svcp-document-only\.svcp-document-assignable > \.svcp-message-inline-actions/);
 assert.match(css,/top:-37px!important;bottom:auto!important/);
 assert.match(css,/max-width:116px!important/);
 assert.match(css,/> :is\(\.svcp-action-reply,\.svcp-action-star,\.svcp-action-task\)/);
 assert.doesNotMatch(css,/> :not\(\.svcp-action-task\)\{display:none!important\}/);
 assert.match(script,/previewable\?\(\)=>svcpOpenDocument\(localFile,message\):null/);
 assert.match(html,/assets\/seyveo-business-command\.js\?v=175/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=240/);
});

test('expanded composer physically places the original live mic and send in its bottom toolbar',()=>{
 assert.match(script,/function svcpPlaceComposerActions\(expanded\)/);
 assert.match(script,/const parent=expanded\?svcpComposerHost:svcpComposerField/);
 assert.match(script,/for\(const node of \[svcpComposerMic,svcpComposerSend\]\)/);
 assert.match(script,/svcpPlaceComposerActions\(wraps\)/);
 assert.match(script,/svcpPlaceComposerActions\(false\)/);
 assert.match(css,/#svcpChatForm\.svcp-compose-multiline\.svcp-voice-on-toolbar > :is\(#svcpVoiceRecord,\.svcp-chat-send\)/);
 assert.match(css,/visibility:visible!important;pointer-events:auto!important;opacity:1!important/);
 assert.match(css,/> #svcpVoiceRecord\{\s*right:55px!important/);
 assert.match(css,/> \.svcp-chat-send\{\s*right:8px!important/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=240/);
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
 assert.match(html,/assets\/seyveo-business-command\.js\?v=175/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=240/);
});
