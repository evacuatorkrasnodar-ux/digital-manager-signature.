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
 home:read('assets/home-velvet.css'),
 browser:read('assets/seyveo-browser.css')
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
assert.ok(css.music.includes('fill:rgba(255,255,255,.06);stroke:#ffffff'),'White silhouette in every theme');
assert.ok(html.includes('stop-color="#ffffff"')&&html.includes('stop-color="#cbd1d9"'),'White gradient is fixed independent of theme');
const miniVinyl=read('assets/seyveo-music-dock.css');
assert.ok(css.music.includes('conic-gradient(from 50deg,#0b0c0e,#24262a,#090a0c,#1c1e21,#090a0c,#121417,#0b0c0e)'),'Large vinyl is naturally black');
assert.ok(miniVinyl.includes('conic-gradient(from 50deg,#0b0c0e,#24262a,#090a0c,#1c1e21,#090a0c,#121417,#0b0c0e)'),'Mini record matches the full black vinyl');
assert.match(read('assets/seyveo-music.js'),/person\.replace\(\/\^\[\^\\p\{L\}\]\+\/u/,'Music star recognizes the first Unicode letter of an artist');
assert.doesNotMatch(read('assets/seyveo-music.js'),/favoriteButton\.textContent=liked/,'Favorite redraw never destroys the SVG');
for(const choice of ['auto','graphite','light','dark','sapphire','plum']){
 const row=html.match(new RegExp('<button[^>]*data-theme-choice="'+choice+'"[^>]*>[\\s\\S]*?<\\/button>'));
 assert.ok(row&&row[0].includes('<small>HDR · '),'Visible HDR material label on '+choice);
}
assert.match(html,/--bg:#1c1b1a;--card:#282522;--card2:#302c28/,'Copper Dune matches the reference graphite');
assert.match(css.life,/--sv-life-dialog-bg:#1c1b1a;--sv-life-contacts-bg:#1c1b1a/,'Personal dialogs share the Connections near-black background');
assert.match(css.music,/linear-gradient\(168deg,#24221f 0%,#201e1c 43%,#1c1b1a 100%\)/,'Music matches screenshot background without brown cast');
assert.match(css.home,/--sv-home-glass:rgba\(40,37,34,.85\)/,'Shared Home Velvet material follows the selected palette');
assert.match(css.home,/--home-glass:var\(--sv-home-glass\)/,'Home consumes its shared Velvet material');
assert.match(css.browser,/var\(--sv-home-glass\)/,'Browser uses the same material as Home');
assert.match(css.browser,/var\(--sv-life-viewport-gradient,var\(--bg\)\)/,'Browser uses the main viewport gradient');
assert.match(html,/assets\/seyveo-browser\.css\?v=59/,'Browser theme stylesheet is refreshed');
assert.match(html,/assets\/seyveo-browser\.js\?v=45/,'Browser context-aware Sayvi script is refreshed');
const browserJS=read('assets/seyveo-browser.js');
assert.match(browserJS,/function syncHistoryStack\(/,'Continue Browsing uses a shared expand and collapse state');
assert.ok(browserJS.includes("const historyTimesKey='seyveo-browser-history-times-v1'"),'History timestamps are stored separately without fabricating times for legacy URLs');
assert.ok(browserJS.includes('times[url]=Date.now()'),'A new real visit records its actual timestamp');
assert.ok(browserJS.includes('function removeHistory(url)'),'History removal is reusable across Browser sections');
assert.ok(browserJS.includes('function clearHistory()'),'History clear removes visit and time storage without removing favorites');
assert.ok(browserJS.includes("window.confirm('Удалить всю историю браузера SEYVEO? Вкладки и избранное останутся.')"),'Clear all requires explicit confirmation');
assert.ok(browserJS.includes("managerSection==='history'"),'Compact History is isolated from Favorites and Collections');
assert.ok(browserJS.includes("clock.dateTime=new Date(time).toISOString()"),'History uses machine-readable real visit timestamps');
assert.ok(browserJS.includes("function historyDay(when)"),'History is grouped by actual dates without invented legacy visits');
assert.ok(browserJS.includes("return 'Без даты'"),'Old URLs without times are honestly marked as undated');
assert.ok(browserJS.includes("removeHistory(address);render()"),'Recent tabs can delete the same History record');
assert.ok(browserJS.includes("removeHistory(link);render()"),'Continue Browsing removes the same History record');
assert.ok(css.browser.includes('.sb-manager-secondary.is-history{gap:5px;padding-top:14px}'),'History row spacing is compact and isolated');

assert.ok(css.browser.includes('.sb-manager-select{min-width:0;min-height:79px'),'Opened tabs match the first page full-width card height');
assert.ok(css.browser.includes('min-height:79px;border-bottom:1px solid var(--sv-home-outline)'),'Recently closed tabs match full-width card height');
assert.ok(css.browser.includes('.sb-collection-open{min-width:0;min-height:67px'),'Collections match two-up Recent Tabs card height');
assert.ok(css.browser.includes('.sb-manager-collections-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:9px}'),'Collections use the first page two-column width and gap');
assert.ok(css.browser.includes('padding:0 2px 24px;'),'All second-page cards align with first-page left/right inset');
assert.ok(css.browser.includes('.sb-tab-preview{width:57px;height:56px}'),'iPhone open-tab preview fits its compact card');
assert.ok(css.browser.includes('.sb-manager-closed-row{min-height:75px}'),'Narrow iPhone recently closed tab uses compact height');
assert.ok(css.browser.includes('.sb-collection-open{min-height:63px;gap:6px;padding:5px 0 5px 6px}'),'Narrow iPhone collection cards match paired recent cards');
assert.ok(css.browser.includes('.sb-manager-heading{margin-top:13px;margin-bottom:9px}'),'Section headings use a compact regular mobile rhythm');
assert.ok(css.browser.includes('.sb-history-entry{'),'History rows have their own theme-aware Black Velvet style');
assert.ok(css.browser.includes('.sb-history-entry-delete{'),'History has a dedicated single-entry delete control');
assert.match(browserJS,/slot\.inert=folded/,'Collapsed cards cannot receive keyboard focus');
assert.match(browserJS,/showAllHistory=!showAllHistory;syncHistoryStack\(\)/,'History toggle animates the existing stack without replacing cards');
assert.match(css.browser,/\.sb-history-slot\.is-folded/,'History cards fold into a single visible card');
assert.ok(css.browser.includes('scroll-snap-type:x mandatory'),'Recent browser tabs use native horizontal swipe navigation');
assert.ok(css.browser.includes('min-height:67px;height:67px'),'Recent tabs have compact height');
assert.ok(!css.browser.includes('>.sb-home-recent-tabs{margin-top:auto'),'Recent tabs flow immediately after Continue Browsing');
assert.ok(css.browser.includes('@media(max-width:600px)'),'iPhone portrait and Plus layouts share compact rhythm');
assert.ok(css.browser.includes('.seyveo-browser-home{min-height:62px;max-height:70px}'),'Browser title space shrinks below iPhone camera safe area');
assert.ok(browserJS.includes('for(const entry of recentEntries)'),'All recent tabs appear in the swipe rail');
assert.ok(browserJS.includes('data-open-tab-manager'),'Recent tabs expose Show All');
assert.ok(browserJS.includes("managerSection='tabs';tabManager(true)"),'Show All opens existing tab manager');
assert.ok(css.browser.includes('flex:0 0 calc((100% - var(--sb-recent-gap)) / 2)'),'Recent cards fit two across');
assert.ok(!css.browser.includes('flex-basis:57%'),'Small screens retain exactly two full-width cards');
assert.ok(browserJS.includes('function paintSiteMark('),'Browser icons use one shared vector renderer');
assert.ok(css.browser.includes('grid-auto-flow:column;grid-auto-columns:calc(25% - 6px)'),'Four Quick Access tiles fit the iPhone viewport and still scroll for additional tiles');
assert.ok(css.browser.includes('grid-auto-columns:calc(25% - 4.5px)'),'Four tiles remain fully visible on narrow iPhones');
assert.ok(!css.browser.includes('background:radial-gradient(ellipse 46% 48% at 50% 43%,var(--seyveo-hdr-active),transparent 85%)'),'Browser logo has no unintended light patch');
assert.ok(css.browser.includes('.seyveo-browser-shortcuts.is-expanded'),'Quick Access can reveal all original tiles');
assert.ok(css.browser.includes('.seyveo-browser-bar{height:40px;min-height:40px;max-height:40px'),'Browser address bar has a 40px outer height');
assert.ok(css.browser.includes('width:36px;height:36px;flex:none'),'QR scan fits the compact field');
assert.ok(!css.browser.includes('.seyveo-browser-bar{min-height:58px;max-height:62px'),'Old Browser bar height does not override the compact field');
assert.match(html,/assets\/seyveo-browser-dock\.js\?v=5/,'Browser dock uses original central Sayvi');
assert.match(html,/assets\/living-conversation\.js\?v=33/,'Existing Feather Chat close hook loaded');
const browserDockJS=read('assets/seyveo-browser-dock.js');
const conversationJS=read('assets/living-conversation.js');
assert.ok(browserDockJS.includes("event.target.closest?.('#assistantButton')"),'Original central Sayvi opens Browser assistant');
assert.ok(!browserJS.includes('<header class="seyveo-browser-top">'),'Browser does not render a redundant top back arrow');
assert.ok(browserJS.includes('function goToSeyveoHome()'),'Browser uses SEYVEO Home as the dock house destination');
assert.ok(browserJS.includes("root.querySelector('.seyveo-browser-bar').after(switcher)"),'The original tab switcher and search share the same root-level flex slot');
assert.ok(browserJS.includes('switcher.hidden=!managerOpen'),'Exactly one of search and tab switcher shows at a time');
assert.ok(!browserJS.includes('sb-manager-brand'),'Tabs manager does not create a duplicate brand or typography');
assert.ok(!browserJS.includes('data-manager-back'),'Tabs have no redundant top back button');
assert.ok(browserJS.includes('else if(managerOpen)tabManager(false);else close()'),'Escape returns from Tabs rather than closing Browser');
assert.ok(browserJS.includes("root.classList.toggle('is-managing',managerOpen)"),'Manager swaps content below the same stationary header');
assert.ok(browserJS.includes("$('.seyveo-browser-home').hidden=!home&&!managerOpen"),'The original logo stays visible even when tabs open from a webpage');
assert.ok(css.browser.includes('position:relative;inset:auto;z-index:5'),'Tabs manager participates in normal Browser layout');
assert.ok(css.browser.includes('.seyveo-browser.is-managing>.seyveo-browser-bar'),'On Tabs screen the existing tab switcher replaces search in exactly its slot');
assert.ok(css.browser.includes('.sb-manager-switcher{\n display:grid;grid-template-columns:repeat(4,minmax(0,1fr));'),'Keep the original four-part tabs control untouched');
assert.ok(css.browser.includes('width:100%;flex:none;height:40px;min-height:40px;max-height:40px;margin:0'),'The existing tabs switcher has the same width/height and flex sizing as search');
assert.ok(css.browser.includes('.sb-manager-switcher[hidden]'),'The tab bar never occupies a hidden layout slot');
assert.ok(!browserJS.includes('managerHeading'),'No extra manager heading is created or rendered');
assert.ok(css.browser.includes('padding:0 0 24px;\n color:var(--text,#edf5ef);'),'Tabs panel has no extra inset relative to search');
assert.ok(css.browser.includes('.sb-manager-tabs-panel>.sb-manager-heading:first-child{margin-top:4px}'),'Tabs heading has the same start rhythm as Quick Access');
assert.ok(css.browser.includes('.sb-manager-tabs-panel>.sb-manager-heading:first-child{margin-top:4px}'),'Mobile first content heading uses the same four-point offset');
assert.ok(!browserJS.includes("['tabs','Вкладки','Страницы']"),'Unrequested second-line labels removed from manager buttons');
assert.ok(browserJS.includes('if(managerOpen)tabManager(false);navigate(url)'),'Search from Tabs returns to the selected webpage');
assert.ok(css.browser.includes('.seyveo-browser-manager:not([hidden]){background:transparent;background-image:none}'),'Tabs inherit the exact same theme background');

assert.ok(browserJS.includes("document.getElementById('navHome')?.click()"),'House uses existing SEYVEO Home navigation');
assert.ok(browserJS.includes('home:goToSeyveoHome'),'House no longer resets the current browser tab');
assert.ok(browserDockJS.includes("setButton(outer[2],'home','Главная SEYVEO')"),'Dock house is labeled for the real Home destination');
assert.ok(browserJS.includes("root.addEventListener('touchstart'"),'Browser has an iPhone edge-return gesture');
assert.ok(browserJS.includes("root.addEventListener('touchend'"),'Browser edge-return gesture has a safe completion');
assert.ok(css.browser.includes('padding-top:max(env(safe-area-inset-top),12px)'),'Brand starts below the camera safe area');
assert.ok(css.browser.includes('.seyveo-browser-bar input{font-size:16px}'),'iPhone search avoids keyboard auto-zoom');

assert.ok(browserJS.includes('function askSayvi()'),'Browser hands off to existing Feather Chat');
assert.ok(browserJS.includes('function resumeAfterSayvi()'),'Browser restores its own iframe after chat');
assert.ok(browserJS.includes('suspendedForSayvi=true'),'Browser pauses instead of reloading the page');
assert.ok(conversationJS.includes("new Event('seyveo:conversation-close')"),'Feather Chat signals Back to the Browser');
assert.ok(browserJS.includes("document.addEventListener('seyveo:conversation-close',resumeAfterSayvi)"),'Browser resumes only after Feather Chat closes');
assert.ok(browserJS.includes("field&&!field.value.trim()"),'Existing drafts cannot be overwritten by Browser context');
assert.ok(!browserJS.includes('frame.contentDocument'),'Browser does not read third-party page content without permission');
assert.ok(browserDockJS.includes('SEYVEO_DOCK_VOICE_CLICK_SUPPRESSED'),'Long hold never opens duplicate Feather Chat');
assert.ok(html.includes('window.SEYVEO_DOCK_VOICE_CLICK_SUPPRESSED=()=>'),'One existing mic distinguishes tap from press-and-hold');
assert.ok(html.includes("!window.SEYVEO_BROWSER?.state?.().open)goHome()"),'Speech does not force Browser back to Home');
assert.ok(html.includes("window.SEYVEO_BROWSER.voiceCommand?.(phrase)"),'Existing speech recognition sends words to Browser');
assert.ok(browserJS.includes('function browserVoiceCommand(transcript)'),'Browser supports voice search without new microphone controls');
assert.ok(browserJS.includes('voiceCommand:browserVoiceCommand'),'Voice command API available to existing center button');
assert.ok(browserJS.includes('privateQuery'),'Private dictated requests are not sent to Yandex automatically');
assert.ok(browserJS.includes('function browserVoiceUnavailable(message)'),'Unsupported speech falls back to normal Sayvi chat');


assert.ok(browserJS.includes('data-quick-toggle'),'Quick Access exposes Show All button');
for(const brand of ['youtube','wikipedia','yandex','habr'])assert.ok(browserJS.includes(brand+":'<svg"),'Local SVG for '+brand);
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
assert.match(html,/assets\/home-velvet\.css\?v=23/);
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
