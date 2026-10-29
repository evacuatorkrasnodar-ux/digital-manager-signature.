'use strict';
/* Current SEYVEO regression: white Music favorites are separate from
   golden staff recognition. Work chat keeps one real local engine.
   This is a static contract, not a cross-device delivery test. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('index.html');
const js=read('assets/seyveo-business-command.js');
const music=read('assets/seyveo-music.css');
const mini=read('assets/seyveo-music-dock.css');
const chat=read('assets/seyveo-work-chat-screen.css');
const employee=read('assets/seyveo-business-command.css');

for(const source of [music,mini]){
 assert.ok(source.includes('conic-gradient(from 50deg,#0b0c0e,#24262a,#090a0c,#1c1e21,#090a0c,#121417,#0b0c0e)'),
  'Full and miniature vinyl remain black');
 assert.ok(!source.includes('conic-gradient(from 50deg,#374d4b,#151f23,#5e7972,#1b2e31,#0e171b,#374d4b)'),
  'Old green vinyl is not restored');
}
assert.ok(music.includes('fill:rgba(255,255,255,.06);stroke:#ffffff'),
 'White outline of Music favorite');
assert.ok(music.includes('fill:url(#svMusicStarMetal);stroke:#ffffff'),
 'White metallic Music favorite when selected');
assert.match(html,/id="svMusicStarMetal"[^>]*>[\s\S]*?stop-color="#ffffff"/,
 'Music metallic gradient exists');

/* Explicit staff appreciation is a different action from song favorite
   and chat's normal saved-message star. */
assert.match(html,/id="svcpRecognizeOpen" class="svcp-recognize-launch svcp-gratitude-award"/,
 'Dedicated HR recognition entry is mounted');
assert.match(html,/Поблагодарить сотрудника золотой звездой, записать награду в личное дело/,
 'Recognition is tied to a staff record, not a Music track');
assert.match(html,/id="svcpRecognizeOpenCard"[^>]*>✦ Посмотреть знак в карточке сотрудника/,
 'Recognition can be viewed in the staff record');
assert.match(chat,/#svcpWorkChatScreen \.svcp-gratitude-award svg\{[\s\S]*?stroke:#D9B270!important/,
 'Gold award is visually distinct from white Music star');
assert.match(chat,/#svcpWorkChatScreen \.svcp-message-menu \.svcp-action-star/,
 'Saved message is independent from HR appreciation');
assert.match(employee,/#tasksPage \.svcp-manager-row\{/,
 'Manager business destinations keep existing visual ownership');

/* Full team messenger and safe local prototype features stay wired. */
for(const id of ['svcpHistorySearch','svcpChatTaskDraft','svcpCameraBarcode','svcpMessages',
 'svcpRecognizeOpen','svcpWorkChatScreen','svcpEmployeeAvatar'])
 assert.ok(html.includes('id="'+id+'"'),'Existing feature preserved: '+id);
assert.ok(html.includes('placeholder="Имя, должность, сообщение…"'),
 'Discoverable chat search');
for(const label of ["all:'Команда'","people:'Сотрудники'","extra:'Рабочие группы'","assistant:'Сэйви'"])
 assert.ok(js.includes(label),'Chat section '+label);
assert.ok(js.includes("const managerDialog=employeePreviewActive()&&room.id==='dm-elena'"),
 'Employee receives correct opposite-side chat identity');
assert.ok(js.includes("managerDialog?'Р':room.mark"),
 'Chat avatar changes for employee preview');
assert.ok(js.includes('const roomHits=ROOMS.filter(room=>'),
 'Search includes role/name even if a chat is silent');
assert.ok(js.includes('!roomHits.length&&!chatHits.length&&!taskHits.length'),
 'Empty search covers all three categories');
assert.ok(js.includes('Только на этом устройстве · без отправки'),
 'Local chat attachments do not masquerade as delivered');
assert.match(html,/assets\/seyveo-business-command\.css\?v=64/,
 'Current work stylesheet is cache-busted');
assert.match(html,/assets\/seyveo-unified-tasks\.js\?v=36/,
 'Current unified work script is cache-busted');
console.log('PASS black vinyl, white Music favorite, golden HR award and role-safe local work chat');
