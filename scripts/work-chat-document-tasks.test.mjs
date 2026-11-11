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
test('photos and documents share exactly one attached three-action footer',()=>{
 assert.match(script,/menu\.append\(svcpActionIcon\('Ответить','reply'/);
 assert.match(script,/menu\.append\(starControl\)/);
 assert.match(script,/menu\.append\(svcpActionIcon\('Поручить','task'/);
 assert.match(script,/function dockMediaActions\(\)/);
 assert.match(script,/container\.querySelector\(':scope > \.svcp-message-inline-actions'\)/);
 assert.match(script,/slot\.append\(row\)/);
 assert.match(script,/container\.classList\.add\('svcp-media-actions-contained'\)/);
 assert.match(script,/dockMediaActions\(\);/);
 assert.doesNotMatch(css,/top:-37px!important;bottom:auto!important/);
 assert.match(script,/previewable\?\(\)=>svcpOpenDocument\(localFile,message\):null/);
 assert.match(html,/assets\/seyveo-business-command\.js\?v=178/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=242/);
 assert.match(html,/assets\/seyveo-chat-attachments-unified\.css\?v=17/);
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
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=242/);
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
 assert.match(html,/assets\/seyveo-business-command\.js\?v=178/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=242/);
});

test('document Sayvi button uses exactly the approved Work Chat header symbol',()=>{
 const canonical=script.match(/sayviButton\.innerHTML='([^']+)'/);
 const viewer=script.match(/sayviTrigger\.innerHTML='([^']+)'/);
 assert.ok(canonical&&viewer,'both symbols are present');
 assert.equal(viewer[1],canonical[1]);
 assert.match(script,/Если просят подписать: проверь по доступному тексту сумму/);
 assert.match(script,/Никогда не гарантируй отсутствие мошенничества/);
});


test('Work Chat down-arrow honors hidden state even against floating grid CSS',async()=>{
 const jumpCss=await readFile(new URL('assets/seyveo-chat-jump.css',root),'utf8');
 const jumpJs=await readFile(new URL('assets/seyveo-chat-jump.js',root),'utf8');
 assert.match(jumpCss,/#svcpWorkChatScreen \.svcp-chat > #svcpScrollBottom\[hidden\]\{\s*display:none!important/);
 assert.match(jumpJs,/button\.hidden=distance<=125/);
 assert.match(jumpJs,/list\.addEventListener\('scroll',schedule/);
 assert.match(html,/assets\/seyveo-chat-jump\.css\?v=4/);
});
