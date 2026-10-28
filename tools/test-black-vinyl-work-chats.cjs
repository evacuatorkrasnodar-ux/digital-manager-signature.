'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('assets/seyveo-business-command.js','utf8');
const main=fs.readFileSync('assets/seyveo-music.css','utf8');
const mini=fs.readFileSync('assets/seyveo-music-dock.css','utf8');
for(const css of [main,mini])assert.ok(css.includes('conic-gradient(from 50deg,#0b0c0e,#24262a,#090a0c,#1c1e21,#090a0c,#121417,#0b0c0e)'),'Both vinyl records are black');
assert.ok(!main.includes('conic-gradient(from 50deg,#374d4b,#151f23,#5e7972,#1b2e31,#0e171b,#374d4b)')&&!mini.includes('conic-gradient(from 50deg,#374d4b,#151f23,#5e7972,#1b2e31,#0e171b,#374d4b)'),'Green vinyl is retired');
assert.ok(main.includes('fill:rgba(255,255,255,.06);stroke:#ffffff'),'White star outline on every theme');
assert.ok(main.includes('fill:url(#svMusicStarMetal);stroke:#ffffff'),'White filled favorite');
assert.ok(html.includes('stop-color="#ffffff"')&&html.includes('stop-color="#cbd1d9"'),'Monochrome star in all themes');
for(const label of ["all:'Команда'","people:'Сотрудники'","extra:'Рабочие группы'","assistant:'Сэйви'"])
 assert.ok(js.includes(label),'Chat section '+label);
assert.ok(js.includes("const managerDialog=employeePreviewActive()&&room.id==='dm-elena'"));
assert.ok(js.includes("managerDialog?'Р':room.mark"),'Manager avatar correct for employee');
assert.ok(js.includes('const roomHits=ROOMS.filter(room=>'),'Silent chats searchable by name and role');
assert.ok(js.includes('!roomHits.length&&!chatHits.length&&!taskHits.length'),'Complete empty search status');
assert.ok(html.includes('placeholder="Имя, должность, сообщение…"'),'Clear search prompt');
for(const id of ['svcpChatTaskDraft','svcpCameraBarcode','svcpMessages'])
 assert.ok(html.includes('id="'+id+'"'),'Existing chat feature preserved '+id);
assert.ok(js.includes('Только на этом устройстве · без отправки'),'Local demo is labeled honestly');
console.log('PASS black vinyl, white star, organized and searchable role-correct local work chats');
