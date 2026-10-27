/* SEYVEO · Theme palette contract
 * Run: node tools/test-theme-palettes.cjs
 * Pure source-level regression. Browser/device visual QA is still required.
 */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('index.html');
const css={
 life:read('assets/living-space.css'),
 music:read('assets/seyveo-music.css'),
 talk:read('assets/living-conversation.css'),
 conversation:read('assets/conversation-refined.css'),
 dock:read('assets/floating-navigation.css'),
 wellness:read('assets/personal-wellness.css'),
 smartHome:read('assets/seyveo-smart-home.css'),
 surfaces:read('assets/sayvi-surfaces.css')
};
const match=html.match(/data-theme-choice="([^"]+)"/g)||[];
assert.deepEqual(match.map(x=>x.slice(19,-1)),['auto','dark','graphite','sapphire','light'],
 'One original settings page offers all theme choices in stable order');
assert.match(html,/const THEME_VALUES=\['auto','dark','graphite','sapphire','light'\]/);
assert.match(html,/dataset\.palette=palette/);
assert.match(html,/THEME_VALUES\.includes\(raw\.theme\)/,'Legacy theme values still restore');
assert.match(html,/THEME_VALUES\.includes\(previous\.theme\)/,'Older theme migrations still work');
assert.match(html,/assets\/floating-navigation\.css\?v=38/);
assert.match(html,/assets\/living-space\.css\?v=44/);
assert.match(html,/assets\/seyveo-music\.css\?v=36/);
assert.match(html,/assets\/living-conversation\.css\?v=14/);
assert.match(html,/assets\/conversation-refined\.css\?v=36/);
assert.match(html,/assets\/personal-wellness\.css\?v=18/);
assert.match(html,/assets\/seyveo-smart-home\.css\?v=5/);
assert.match(html,/assets\/sayvi-surfaces\.css\?v=6/);
for(const variant of ['graphite','sapphire']){
 const selector='[data-theme=dark][data-palette='+variant+']';
 assert.ok(html.includes(selector),'Global tokens: '+variant);
 assert.ok(css.life.includes(selector),'My World / dialogs: '+variant);
 assert.ok(css.music.includes(selector),'Music panels: '+variant);
 assert.ok(css.talk.includes(selector),'Feather Chat: '+variant);
 assert.ok(css.dock.includes(selector),'Dock: '+variant);
 assert.ok(css.wellness.includes(selector),'Wellness breathing and care: '+variant);
}
assert.match(css.life,/:root\[data-theme=light\]/,'White gradient available');
assert.match(css.music,/:root\[data-theme=light\]/,'White music sheet available');
assert.match(css.talk,/html\.seyveo-conversation\[data-theme=light\]/,'White chat available');
assert.match(css.life,/background:var\(--sv-life-viewport-gradient\)/,
 'All-page background is controlled by palette variable');
assert.match(css.life,/background:var\(--sv-life-dialog-bg\)!important/,
 'My World and subpage dialogs use the same palette');
assert.match(css.music,/background:var\(--sv-music-sheet-gradient\)/,
 'Player providers use selected palette');
assert.match(css.conversation,/background:var\(--sv-chat-canvas\)/,
 'Feather Chat canvas uses palette');
assert.match(css.conversation,/background:var\(--sv-chat-composer-gradient\)!important/,
 'Feather Chat writer uses palette');
assert.doesNotMatch(css.life,/html\.sv-space-active:not\(\[data-theme=light\]\):has\(#lifePage/,
 'Old per-page green globals must not override graphite/sapphire');
assert.match(css.smartHome,/color-mix\(in srgb,var\(--seyveo-emerald\) 3%,transparent\)/,
 'Smart Home uses shared theme accent');
assert.match(css.surfaces,/--sv-complete:var\(--seyveo-emerald\)/,
 'Mail and document actions share global accent');
assert.match(css.wellness,/background:var\(--sv-care-breath-disc\)/,
 'Wellness disc follows selected theme');
assert.ok(!html.includes('assets/home-mail-demo.js'),'Home cards are unchanged');
console.log('PASS theme contract: all options, restore, shared backgrounds, My World and dialogs, music, chat, dock.');
