/**
 * Guardrails for SEYVEO Black Velvet work-chat composer.
 * Static assertions do not replace real iPhone X/Android visual tests.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [html,css,script,base]=await Promise.all([
  read('index.html'),
  read('assets/seyveo-work-chat-screen.css'),
  read('assets/seyveo-business-command.js'),
  read('assets/seyveo-business-command.css')
]);

test('manager task and send are distinct, keyboard-accessible actions in one composer',()=>{
  const form=html.split('<form id="svcpChatForm"')[1]?.split('</form>')[0];
  assert.ok(form);
  assert.match(form,/id="svcpChatInput"/);
  assert.match(form,/id="svcpPolishMessage"/);
  assert.match(form,/id="svcpVoiceRecord"/);
  assert.match(form,/class="svcp-primary svcp-chat-send"/);
  assert.match(form,/id="svcpComposerDirectTask"/);
  assert.match(form,/id="svcpComposerDirectTask"[^>]*type="button"/);
  assert.match(form,/Создать поручение из написанного текста/);
  assert.match(form,/id="svcpComposerDirectTask"[^>]*hidden/);
  assert.match(form,/id="svcpComposerDirectTask"[^>]*><svg/);
  assert.match(form,/id="svcpComposerDirectTask"[\s\S]*?<span>Поручить<\/span>/);
  assert.equal((form.match(/type="submit"/g)||[]).length,1);
  assert.equal((form.match(/id="svcpComposerDirectTask"/g)||[]).length,1);
});

test('composer uses a single row, oval paper plane, and inline assignment at all widths',()=>{
  assert.match(css,/#svcpWorkChatScreen #svcpChatForm\.svcp-can-assign\{[\s\S]*?grid-template-columns:38px minmax\(0,1fr\) 87px 58px!important/);
  assert.match(css,/#svcpWorkChatScreen #svcpChatForm #svcpComposerDirectTask:not\(\[hidden\]\)\{[\s\S]*?grid-column:3!important;grid-row:1!important/);
  assert.match(css,/#svcpWorkChatScreen #svcpChatForm\.svcp-can-assign \.svcp-chat-send\{[\s\S]*?grid-column:4!important;grid-row:1!important/);
  assert.match(css,/#svcpWorkChatScreen #svcpChatForm \.svcp-chat-send\{[\s\S]*?width:58px!important;min-width:58px!important;height:46px!important;[\s\S]*?border-radius:999px!important/);
  assert.match(css,/@media\(max-width:390px\)\{[\s\S]*?grid-template-columns:33px minmax\(0,1fr\) 72px 52px!important/);
  assert.match(css,/@media\(max-width:340px\)\{[\s\S]*?grid-template-columns:32px minmax\(0,1fr\) 40px 52px!important/);
  assert.doesNotMatch(css,/#svcpComposerDirectTask:not\(\[hidden\]\)\{grid-column:2 \/ -1!important;grid-row:2!important/);
  assert.doesNotMatch(css,/#svcpChatForm :is\(#svcpVoiceRecord,\.svcp-chat-send\)\{/);
  assert.match(css,/#svcpWorkChatScreen #svcpChatForm #svcpVoiceRecord,/);
  assert.match(css,/#svcpWorkChatScreen #svcpChatForm \.svcp-chat-send\{/);
  assert.match(css,/border-radius:50%!important/); // microphone stays round
});

test('task is contextual to typed personal chat with an employee, not a permanent second line',()=>{
  assert.match(script,/function syncComposerActions\(\)/);
  assert.match(script,/privateAssignmentRecipient\(\)&&text&&/);
  assert.match(script,/!state\.file&&!state\.scanCode&&editingMessageIndex===null/);
  assert.match(script,/if\(task\)task\.hidden=!ready/);
  assert.match(script,/form\.classList\.toggle\('svcp-can-assign',ready\)/);
  assert.match(script,/syncComposerActions\(\);\s*resizeWorkComposer\(\);/);
  assert.match(script,/function updatePerspective\(\)/);
  assert.match(script,/const person=privateAssignmentRecipient\(\),input=\$\('svcpChatInput'\)/);
  assert.match(script,/const created=storeTask\(text,\{assigneeId:person,room:state\.room\}\)/);
  assert.match(script,/role:'self',text:'📌 Поручение: '\+text/);
  assert.match(script,/if\(save\(CHAT_KEY,updated\)\)/);
  assert.match(script,/Демо, без отправки на другой телефон/);
  assert.match(html,/seyveo-work-chat-screen\.css\?v=30/);
  assert.match(html,/seyveo-business-command\.js\?v=66/);
});

test('existing Sayvi assistant remains attached to the employee message, without duplicate helper',()=>{
  assert.match(script,/function guideSteps\(text\)/);
  assert.match(script,/function openGuide\(bubble,msg\)/);
  assert.match(script,/function isGuideRequest\(msg\)/);
  assert.match(script,/state\.viewpoint==='elena'&&!isOwn&&isGuideRequest\(msg\)/);
  assert.match(script,/btn\('✦ Сэйви, помоги',\(\)=>openGuide\(bubble,msg\),'svcp-guide-launch'\)/);
  assert.match(script,/const title=el\('strong','svcp-guide-title','✦ Сэйви поможет'\)/);
  assert.match(css,/#svcpWorkChatScreen \.svcp-guide-launch/);
  assert.match(css,/#svcpWorkChatScreen \.svcp-guide-panel/);
  assert.equal((html.match(/id="svcpComposerDirectTask"/g)||[]).length,1);
  assert.doesNotMatch(base,/svcp-guide-launch\s*\{display:none/);
});
