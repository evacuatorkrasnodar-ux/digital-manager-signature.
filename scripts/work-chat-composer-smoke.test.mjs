/**
 * Guardrails for SEYVEO work chat across all matte smoke themes.
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

test('Messenger directory uses the same neutral title/back navigation as SEYVEO pages',()=>{
 const header=html.split('<header class="svcp-work-chat-header">')[1]?.split('</header>')[0];
 assert.ok(header,'Messenger directory header exists');
 assert.match(header,/id="svcpWorkChatBack"/);
 assert.match(header,/<h1 id="svcpWorkChatTitle">Сообщения<\/h1>/);
 assert.match(header,/class="svcp-work-chat-trailing"/);
 assert.doesNotMatch(header,/svcp-work-chat-mark/);
 assert.match(css,/#svcpWorkChatScreen \.svcp-work-chat-header\{[\s\S]*?grid-template-columns:44px minmax\(0,1fr\) 44px/);
 assert.match(css,/#svcpWorkChatScreen \.svcp-work-chat-back svg\{[\s\S]*?width:19px;height:19px/);
 assert.match(css,/#svcpWorkChatScreen \.svcp-directory-avatar\{[\s\S]*?color:var\(--secondary\)/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=72/);
});

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

test('work composer keeps the deliberate two-row layout while using Sayvi separate smoke glass',()=>{
 assert.match(css,/#svcpWorkChatScreen #svcpChatForm\{\s*display:grid!important;grid-template-columns:44px 44px 44px 44px minmax\(0,1fr\) auto 44px!important;grid-template-rows:minmax\(44px,auto\) 44px!important/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatInput\{\s*grid-column:1\/-1!important;grid-row:1!important/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatForm #svcpAttachFile\{\s*grid-column:1!important;grid-row:2!important/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatForm #svcpCameraToggle\{\s*grid-column:2!important;grid-row:2!important/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatForm > #svcpPolishMessage\{grid-column:3!important/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatForm > #svcpComposerEmojiToggle\{grid-column:4!important/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatForm #svcpComposerDirectTask:not\(\[hidden\]\)\{[\s\S]*?grid-column:6!important;grid-row:2!important/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatForm #svcpVoiceRecord,[\s\S]*?grid-column:7!important;grid-row:2!important/);
 assert.match(css,/@media\(max-width:390px\)\{[\s\S]*?grid-template-columns:40px 40px 40px 40px minmax\(0,1fr\) auto 40px!important/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatForm\[data-has-content="true"\] #svcpVoiceRecord\{display:none!important\}/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatForm\[data-has-content="true"\] \.svcp-chat-send\{display:grid!important\}/);
});

test('chat bubble, input and independent tool controls use the same neutral smoke material as Sayvi',()=>{
 assert.match(css,/--svcp-smoke-glass:rgba\(184,195,201,\.19\)/);
 assert.match(css,/--svcp-smoke-input:rgba\(184,195,201,\.25\)/);
 assert.match(css,/:root\[data-theme="light"\] #svcpWorkChatScreen\{[\s\S]*?--svcp-smoke-glass:rgba\(99,121,133,\.22\)/);
 assert.match(css,/#svcpWorkChatScreen \.svcp-bubble\{[\s\S]*?border:0!important;[\s\S]*?background:var\(--svcp-smoke-glass\)!important/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatInput\{[\s\S]*?background:var\(--svcp-smoke-input\)!important/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatForm\{\s*background:transparent!important;background-image:none!important;[\s\S]*?border:0!important;box-shadow:none!important/);
 assert.match(css,/#svcpWorkChatScreen\[data-view="room"\] #svcpChatForm\{[\s\S]*?background:transparent!important;[\s\S]*?border:0!important/);
 assert.match(css,/#svcpWorkChatScreen #svcpChatForm \.svcp-chat-send\{[\s\S]*?background:var\(--svcp-smoke-glass\)!important/);
 assert.match(css,/#svcpWorkChatScreen \.svcp-message-menu:not\(\[hidden\]\)\{[\s\S]*?background:var\(--svcp-smoke-glass\)!important/);
 assert.match(css,/@media\(prefers-reduced-transparency:reduce\)/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=72/);
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
  assert.match(html,/seyveo-work-chat-screen\.css\?v=72/);
  assert.match(html,/seyveo-business-command\.js\?v=99/);
});

test('one-to-one chat hides redundant author captions but keeps group names and accessible authors',()=>{
 assert.match(script,/conversation\.dataset\.roomKind=selected\.kind/);
 assert.match(css,/#svcpWorkChatScreen #svcpConversation\[data-room-kind="personal"\] \.svcp-bubble:not\(\.is-sayvi\) \.svcp-sender\{\s*display:none!important/);
 assert.match(script,/bubble\.setAttribute\('aria-label'/);
 assert.match(html,/seyveo-business-command\.js\?v=99/);
});

test('Sayvi Core is the only intelligence icon in the work-chat polish button',()=>{
 const btn=html.split('id="svcpPolishMessage"')[1]?.split('</button>')[0];
 assert.ok(btn,'polish button must remain available');
 assert.match(btn,/class="sv-sayvi-core-mark"/);
 assert.match(btn,/class="sv-sayvi-core-upper"/);
 assert.match(btn,/class="sv-sayvi-core-lower"/);
 assert.match(btn,/class="sv-sayvi-core-seed"/);
 assert.match(btn,/aria-label="Сэйви: сделать сообщение грамотнее"/);
 assert.doesNotMatch(btn,/M15\.5 1\.6C17\.8/);
 assert.doesNotMatch(html,/svcp-seyveo-light-icon-color/);
});

test('Sayvi Core breathes slowly, stays still, and honors reduced motion',()=>{
 assert.match(css,/@keyframes sv-sayvi-core-breathe/);
 assert.match(css,/@keyframes sv-sayvi-core-halo/);
 assert.match(css,/animation:sv-sayvi-core-breathe 5\.2s ease-in-out infinite/);
 assert.match(css,/#svcpWorkChatScreen #svcpPolishMessage \.sv-sayvi-core-seed\{[\s\S]*?fill:var\(--sv-sayvi-core-neutral\);/);
 assert.doesNotMatch(css,/fill:var\(--sv-sayvi-core-neutral\)!important/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{[\s\S]*?sv-sayvi-core-halo/);
 assert.match(css,/:root\[data-theme="light"\] #svcpWorkChatScreen\{[\s\S]*?--sv-sayvi-core-awake:/);
 assert.match(html,/seyveo-work-chat-screen\.css\?v=72/);
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
