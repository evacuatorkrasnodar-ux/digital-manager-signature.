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
 health:read('assets/calendar-spaces.css'),
 notes:read('assets/notebook-smart.css'),
 paper:read('assets/notebook-paper.css'),
 scan:read('assets/notebook-scan.css'),
 secondary:read('assets/sections-velvet.css'),
 smartHome:read('assets/seyveo-smart-home.css'),
 surfaces:read('assets/sayvi-surfaces.css'),
 home:read('assets/home-velvet.css')
};
const match=html.match(/data-theme-choice="([^"]+)"/g)||[];
assert.deepEqual(match.map(x=>x.slice(19,-1)),['auto','graphite','light','dark','sapphire','plum'],
 'One original settings page offers all theme choices in stable order');
assert.match(html,/const THEME_VALUES=\['auto','graphite','light','dark','sapphire','plum'\]/);
assert.match(html,/dataset\.palette=palette/);
assert.match(html,/Все темы — с фирменным HDR-эффектом SEYVEO/,'All themes openly explain HDR-inspired styling');
for(const ink of ['--text:#ffffff;--secondary:#d9dde1','--text:#242a31;--secondary:#626a73'])assert.ok(html.includes(ink),'Neutral foreground is independent of palette');
assert.match(html,/id="svcpThankStarMetal"/,'Original employee award star remains');
assert.match(html,/id="svMusicStarMetal"/,'Actual Music favorite icon uses metallic Hollywood-inspired SVG');
assert.match(html,/id="svMusicStarInitial"/,'Artist initial appears inside Music star');
const miniVinyl=read('assets/seyveo-music-dock.css');
assert.ok(css.music.includes('conic-gradient(from 50deg,#374d4b,#151f23,#5e7972,#1b2e31,#0e171b,#374d4b)'),'Large colored vinyl retains its original pigments');
assert.ok(miniVinyl.includes('conic-gradient(from 50deg,#374d4b,#151f23,#5e7972,#1b2e31,#0e171b,#374d4b)'),'Mini record inherits the same original colored vinyl pigments');
assert.match(read('assets/seyveo-music.js'),/person\.replace\(\/\^\[\^\\p\{L\}\]\+\/u/,'Music star recognizes the first Unicode letter of an artist');
assert.doesNotMatch(read('assets/seyveo-music.js'),/favoriteButton\.textContent=liked/,'Favorite redraw never destroys the SVG');
for(const choice of ['auto','graphite','light','dark','sapphire','plum']){
 const row=html.match(new RegExp('<button[^>]*data-theme-choice="'+choice+'"[^>]*>[\\s\\S]*?<\\/button>'));
 assert.ok(row&&row[0].includes('<small>HDR · '),'Visible HDR material label on '+choice);
}
assert.match(html,/--bg:#1c1b1a;--card:#282522;--card2:#302c28/,'Copper Dune matches the screenshot's warm graphite');
assert.match(css.life,/--sv-life-dialog-bg:#1c1b1a;--sv-life-contacts-bg:#1c1b1a/,'Personal dialogs share the Connections near-black background');
assert.match(css.music,/linear-gradient\(168deg,#24221f 0%,#201e1c 43%,#1c1b1a 100%\)/,'Music matches screenshot background without brown cast');
assert.match(css.home,/--home-glass:rgba\(40,37,34,.85\)/,'Home cards follow the Connections material');
assert.match(html,/const state=\{theme:'graphite',history:\[\]\}/,'Fresh installs default to Classic Graphite');
assert.match(html,/const effectiveTheme=\(\)=>state\.theme==='auto'\?\(systemThemeQuery\.matches\?'graphite':'light'\):state\.theme/,'Auto uses Graphite for dark, White for light');
for(const title of ['Classic Graphite','White Velvet','Emerald Royale','Midnight Sapphire','Copper Dune'])assert.match(html,new RegExp('<strong>'+title+'</strong>'),'Theme name: '+title);
for(const token of ['--seyveo-hdr-stage','--seyveo-hdr-glint'])assert.ok((html.match(new RegExp(token,'g'))||[]).length>=6,'HDR-inspired materials on all palettes: '+token);
assert.match(html,/THEME_VALUES\.includes\(raw\.theme\)/,'Legacy theme values still restore');
assert.match(html,/THEME_VALUES\.includes\(previous\.theme\)/,'Older theme migrations still work');
assert.match(html,/assets\/floating-navigation\.css\?v=43/);
assert.match(html,/assets\/living-space\.css\?v=54/);
assert.match(html,/assets\/seyveo-music\.css\?v=44/);
assert.match(html,/assets\/living-conversation\.css\?v=21/);
assert.match(html,/assets\/conversation-refined\.css\?v=38/);
assert.match(html,/assets\/personal-wellness\.css\?v=29/);
assert.match(html,/assets\/calendar-spaces\.css\?v=25/);
assert.match(html,/assets\/sections-velvet\.css\?v=12/);
assert.match(html,/assets\/notebook-smart\.css\?v=29/);
assert.match(html,/assets\/notebook-paper\.css\?v=14/);
assert.match(html,/assets\/notebook-scan\.css\?v=8/);
assert.match(html,/assets\/seyveo-smart-home\.css\?v=5/);
assert.match(html,/assets\/sayvi-surfaces\.css\?v=7/);
assert.match(html,/assets\/home-velvet\.css\?v=20/);
const refreshed={
 'composer-intent.css':22,
 'seyveo-music-dock.css':10,
 'business-map.css':14,
 'company-signature.css':8,
 'passport-cards.css':27,
 'account-demo.css':6,
 'connection-coach.css':10,
 'picture.css':18,
 'network-care.css':4,
 'home-widgets.css':4,
 'assistant-intents.css':3
};
for(const [name,version] of Object.entries(refreshed)){
 assert.ok(html.includes('assets/'+name+'?v='+version),'Reload updated '+name);
}
for(const variant of ['graphite','sapphire','plum']){
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
 'Old per-page green globals must not override selected palettes');
assert.match(css.smartHome,/color-mix\(in srgb,var\(--seyveo-emerald\) 3%,transparent\)/,
 'Smart Home uses shared theme accent');
assert.match(css.surfaces,/--sv-complete:var\(--seyveo-emerald\)/,
 'Mail and document actions share global accent');
assert.match(css.wellness,/background:var\(--sv-care-breath-disc\)/,
 'Wellness disc follows selected theme');
assert.match(css.wellness,/0 0 25px var\(--seyveo-hdr-active\)/,
 'Care breathing glow follows graphite, sapphire and emerald');
assert.match(css.wellness,/filter:drop-shadow\(0 7px 15px var\(--seyveo-hdr-active\)\)/,
 'Care water figure has no fixed emerald glow');
assert.match(css.health,/--health-ink:var\(--seyveo-emerald\)/,
 'Health pressure icon follows selected accent');
assert.match(css.health,/--health-wash:var\(--seyveo-specular\);--health-ink:var\(--text\)/,
 'Health pulse icon stays distinguishable without permanent pink pigment');
assert.doesNotMatch(css.health,/#(?:9ec6e9|e8a4b5|4b88b3|b76c80)/i,
 'No leftover fixed blue or pink Health palette');
assert.match(css.notes,/:root\[data-theme=light\] #notesDialog \.notes-list\{\s*background:var\(--card\)/,
 'Notebook list obeys light palette');
assert.match(css.notes,/:root\[data-theme=light\] #noteReadDialog \.note-read-content/,
 'Notebook reader theme remains wired');
assert.match(css.paper,/border:1px solid var\(--seyveo-hdr-outline\);\s*background:linear-gradient\(135deg,var\(--seyveo-specular\),transparent\),var\(--card\)/,
 'Notebook creation chooser inherits all dark palette colors');
assert.match(css.scan,/border-radius:7px;border:1px solid var\(--seyveo-hdr-outline\)/,
 'Notebook scanner checkbox inherits shared theme');
assert.match(css.secondary,/background:var\(--card\);border-color:var\(--seyveo-hdr-outline\)/,
 'Health, Care and Notebook secondary white surfaces share active theme');
assert.match(css.paper,/\.paper-sheet\{[^}]*background:#fff/,
 'Actual notebook drawing paper is intentionally white for saved drawings');

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
assert.match(css.passports,/#homeHeader \.home-world-popover:not\(\[hidden\]\)\{background:color-mix/,
 'My World shortcut popover follows selected palette');
assert.match(css.talk,/\.seyveo-conversation-turn--sayvi \.seyveo-conversation-body\{color:var\(--text\)\}/,
 'Sayvi Chat text follows theme on all screens');
assert.match(css.conversation,/max-width:min\(91%,460px\)/,
 'Chat geometry remains intact');
assert.match(css.subscription,/border-radius:27px;overflow:hidden;background:var\(--card\);color:var\(--text\)/,
 'Subscription modal follows palette');
assert.match(css.connections,/background:var\(--seyveo-hdr-active\)/,
 'Connection status tint follows palette');
assert.match(css.businessPicture,/linear-gradient\(180deg,var\(--text\),var\(--seyveo-emerald\)\)/,
 'Business Pulse chart bars follow palette');
assert.match(css.network,/background:var\(--seyveo-hdr-active\)/,
 'Network controls follow palette');
assert.ok(!html.includes('assets/home-mail-demo.js'),'Home cards are unchanged');
console.log('PASS theme contract: Auto graphite/white, five manual palettes, subtle HDR-style pigments, Notebook reader/paper/scanner, Health, Care, original sphere/dock, nested dialogs, music and chat.');
