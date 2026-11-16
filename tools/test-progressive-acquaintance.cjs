'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const intro=read('assets/seyveo-my-broadcast.js');
const progressive=read('assets/seyveo-progressive-discovery.js');
const home=read('assets/seyveo-home-conversation.css');
const cinematic=read('assets/seyveo-sayvi-handoff-demo.js');
const index=read('index.html');

assert.match(intro,/const PROFILE_KEY='seyveo-first-acquaintance-v1'/,
 'First meeting reuses the existing profile instead of creating another account');
assert.match(intro,/introStep==='name'/,'Name comes first');
assert.match(intro,/onboarding\?'Начнём'/,'First meeting is one short name step');
assert.doesNotMatch(intro,/businessChoice|introStep='business'/,
 'Business never interrupts personal acquaintance');
assert.match(intro,/openProfile/,'Home offers a separate opt-in personal questionnaire');
assert.match(intro,/const PROFILE_SECTIONS=/,'Life, help and conversation are separate questionnaires');
assert.match(intro,/profileForm\.replaceChildren\(\)/,'Profile choices are rendered fresh when requested');
assert.match(intro,/Удалить ответы анкеты/,'Personal questionnaire answers can be erased');
assert.match(intro,/seyveo:profile-changed/,'Other screens hear profile updates');
assert.match(index,/SEYVEO_BROADCAST\?\.rememberName\?\.\(name\)/,
 'The explicit voice request can remember a name in the same profile');
assert.match(progressive,/location\.hash==='#sayvi-music'/,
 'Music is introduced on the actual Music screen');
assert.match(progressive,/location\.hash==='#sayvi-documents'/,
 'Document features are shown in the actual Documents screen');
assert.match(progressive,/location\.hash==='#manage'/,
 'Cabinet assistance appears in the actual Business screen');
assert.match(progressive,/!force&&!hasBusinessSubscription\(\)/,
 'Automatic business introduction requires verified Business access');
assert.match(progressive,/SEYVEO_SMART_CABINET\?\.open/,
 'Business setup opens the active goal-first cabinet constructor');
assert.doesNotMatch(progressive,/SEYVEO_SMART_START\?\.begin/,
 'Retired inline-chat onboarding cannot misroute to standalone Sayvi chat');
assert.match(progressive,/seyveo\.music\.preferences\.v1/,
 'Musical genres are saved on the device');
assert.match(progressive,/!type\|\|\(!force&&seen\[type\]\)/,
 'One-time discovery is not an interruption on every visit');
assert.match(cinematic,/return root\.classList\.contains\('sv-broadcast-onboarding'\);/,
 'After acquaintance the sphere is the permanent Home control');
assert.match(cinematic,/root\.classList\.toggle\('sv-home-card-sphere',withCards\)/,
 'The original sphere shrinks when there is a real card');
assert.match(home,/#seyveoLivingMoment \.lm-secondary\{\s*display:none!important;/,
 'Home exposes one featured card, not the full task list');
assert.match(home,/#svHomeLivingLine:is\(\[data-sv-presence="reply"\],\[data-sv-presence="listening"\]\):not\(\[hidden\]\)/,
 'Mini voice replies remain visible on Home while a card is present');
assert.match(index,/seyveo-home-conversation\.css\?v=2/,
 'Compact Home geometry is included');
assert.match(index,/seyveo-progressive-discovery\.js\?v=3/,
 'Section-specific introduction is included');
process.stdout.write('PASS: single-step personal meeting, voluntary Home questionnaires, subscription-gated business, one-card Home and persistent orb.\n');
