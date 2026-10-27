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
 assistantWriter:read('assets/composer-intent.css'),
 musicDock:read('assets/seyveo-music-dock.css'),
 businessMap:read('assets/business-map.css'),
 businessPassport:read('assets/company-signature.css'),
 passports:read('assets/passport-cards.css'),
 subscription:read('assets/account-demo.css'),
 connections:read('assets/connection-coach.css'),
 businessPicture:read('assets/picture.css'),
 network:read('assets/network-care.css'),
 wellness:read('assets/personal-wellness.css'),
 smartHome:read('assets/seyveo-smart-home.css'),
 surfaces:read('assets/sayvi-surfaces.css'),
 home:read('assets/home-velvet.css')
};
const match=html.match(/data-theme-choice="([^"]+)"/g)||[];
assert.deepEqual(match.map(x=>x.slice(19,-1)),['auto','dark','graphite','sapphire','light'],
 'One original settings page offers all theme choices in stable order');
assert.match(html,/const THEME_VALUES=\['auto','dark','graphite','sapphire','light'\]/);
assert.match(html,/dataset\.palette=palette/);
assert.match(html,/THEME_VALUES\.includes\(raw\.theme\)/,'Legacy theme values still restore');
assert.match(html,/THEME_VALUES\.includes\(previous\.theme\)/,'Older theme migrations still work');
assert.match(html,/assets\/floating-navigation\.css\?v=39/);
assert.match(html,/assets\/living-space\.css\?v=44/);
assert.match(html,/assets\/seyveo-music\.css\?v=36/);
assert.match(html,/assets\/living-conversation\.css\?v=14/);
assert.match(html,/assets\/conversation-refined\.css\?v=36/);
assert.match(html,/assets\/personal-wellness\.css\?v=18/);
assert.match(html,/assets\/seyveo-smart-home\.css\?v=5/);
assert.match(html,/assets\/sayvi-surfaces\.css\?v=6/);
assert.match(html,/assets\/home-velvet\.css\?v=18/);
const refreshed={
 'composer-intent.css':18,
 'seyveo-music-dock.css':8,
 'business-map.css':14,
 'company-signature.css':8,
 'passport-cards.css':26,
 'account-demo.css':6,
 'connection-coach.css':10,
 'picture.css':17,
 'network-care.css':4,
 'home-widgets.css':4,
 'assistant-intents.css':3
};
for(const [name,version] of Object.entries(refreshed)){
 assert.ok(html.includes('assets/'+name+'?v='+version),'Reload updated '+name);
}
for(const variant of ['graphite','sapphire']){
 const selector='[data-theme=dark][data-palette='+variant+']';
 assert.ok(html.includes(selector),'Global tokens: '+variant);
 assert.ok(css.life.includes(selector),'My World / dialogs: '+variant);
 assert.ok(css.music.includes(selector),'Music panels: '+variant);
 assert.ok(css.talk.includes(selector),'Feather Chat: '+variant);
 assert.ok(css.dock.includes(selector),'Dock: '+variant);
 assert.ok(css.wellness.includes(selector),'Wellness breathing and care: '+variant);
 assert.ok(css.home.includes(selector),'Home utility surfaces: '+variant);
 assert.ok(css.dock.includes('data-palette='+variant+'] .dock>#assistantButton'),
  'Original central Sayvi button follows '+variant+' (not a copied button)');
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

assert.match(css.dock,/#ceramic-night stop:nth-child\(1\)\{stop-color:var\(--sv-ceramic-face-1/,
 'Original SVG ceramic gradient inherits palette');
assert.match(css.dock,/#rim-night stop:nth-child\(1\)\{stop-color:var\(--sv-ceramic-rim-1/,
 'Original SVG chrome edge inherits palette');
assert.match(css.assistantWriter,/background:var\(--sv-expanded-writer-background\)!important/,
 'Expanded Feather writer uses selected palette');
assert.match(css.musicDock,/color:var\(--secondary\)!important/,
 'Music dock uses selected palette');
assert.match(css.businessMap,/background:var\(--bg\);color:var\(--text\);color-scheme:inherit/,
 'Business onboarding inherits dark/white palette');
assert.match(css.businessPassport,/background:var\(--card\)!important/,
 'Company passport follows the theme');
assert.match(css.businessPassport,/#seyveoQrCardDialog\.sv-qr-dialog[^{]*\{[^}]*background:var\(--card\)/,
 'Company QR dialog follows palette');
assert.match(css.businessPassport,/background:#fff;width:238px/,
 'QR image remains truly white for scanner readability');
assert.match(css.passports,/background:linear-gradient\(152deg,var\(--card2\) 0%,var\(--card\) 47%,var\(--bg\) 100%\)/,
 'Original profile/studio passport fills inherit palette');
assert.match(css.subscription,/border-radius:27px;overflow:hidden;background:var\(--card\);color:var\(--text\)/,
 'Subscription modal follows palette');
assert.match(css.connections,/background:var\(--seyveo-hdr-active\)/,
 'Connection status tint follows palette');
assert.match(css.businessPicture,/linear-gradient\(180deg,var\(--text\),var\(--seyveo-emerald\)\)/,
 'Business Pulse chart bars follow palette');
assert.match(css.network,/background:var\(--seyveo-hdr-active\)/,
 'Network controls follow palette');
assert.ok(!html.includes('assets/home-mail-demo.js'),'Home cards are unchanged');
console.log('PASS theme contract: 4 palettes, central SVG button, real navigation, nested dialogs, onboarding, passports, Pulse, documents, wellness, music and chat.');
