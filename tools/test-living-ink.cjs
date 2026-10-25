/* SEYVEO Living Ink visual-source contract.
 * Check the actual styles/components, not a demo screenshot. Real-device visual
 * acceptance (iPhone X, modern iOS and Android) is still required. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');
const vm=require('node:vm');
const inlineScripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
 .map(match=>match[1]).filter(code=>code.trim());
assert.ok(inlineScripts.length>0,'Main document has inline scripts');
for(const code of inlineScripts)new vm.Script(code,{filename:'index.html inline script'});

const dock=read('assets/floating-navigation.css');
const composer=read('assets/composer-intent.css');
const home=read('assets/home-velvet.css');
const future=read('assets/future-surfaces.css');
const continuity=read('assets/living-space.css');
const videoStyles=read('assets/seyveo-video.css');

// Quiet Cinema uses the existing shared workspace stylesheet, NOT a new layer.
for(const page of ['tasksPage','calendarPage','picturePage','lifePage','managePage',
 'sayviSurfacePage','sayviAnswerPage','sayviMusicPage','sayviVideoPage'])
 assert.ok(continuity.includes('#'+page),'Shared Quiet Cinema includes '+page);
assert.match(continuity,/sv-quiet-scene-enter/,'Workspace entry is compositor friendly');
assert.match(continuity,/--sv-q-surface/,'One shared visual surface token');
assert.match(continuity,/prefers-reduced-motion:reduce/,'Animation can be disabled');
assert.match(continuity,/#lifePage #calendarSpaces\.calendar-spaces-grid/,'My World has a single row surface');
assert.match(continuity,/#tasksPage \.personal-tasks-list/,'Tasks have one outlined list');
assert.match(continuity,/#calendarPage #calendarView/,'Calendar retains a real interactive grid');
assert.match(continuity,/#picturePage #pictureBusinessCharts/,'Business charts remain available');
assert.match(html,/assets\/living-space\.css\?v=22/,'All screens use versioned common stylesheet');
assert.match(html,/assets\/seyveo-video\.css\?v=3/,'Video page uses current source');
assert.match(continuity,/#calendarPage\.sv-cascade \.calendar-space-button/,'Calendar keeps independent row reveal');
assert.doesNotMatch(continuity,/#lifePage\.sv-cascade \.calendar-space-button,/,'My World children do not double animate');
assert.doesNotMatch(continuity,/#tasksPage\.sv-cascade \.personal-task-row,/,'Task rows no longer double animate');
assert.match(continuity,/#manageRoadmapDialog,#pictureBreakdownDialog/,'Dialogs share text-first actions');
assert.match(continuity,/text-underline-offset:5px/,'Confirmed actions are text, not capsules');
assert.doesNotMatch(videoStyles,/calc\(95px \+ env\(safe-area-inset-bottom/,'No doubled video bottom safe area');
assert.doesNotMatch(videoStyles,/calc\(90px \+ env\(safe-area-inset-bottom/,'Compact video does not waste vertical space');

const decisionCss=read('assets/living-moment.css');
const decisionJs=read('assets/living-moment.js');
const managementCinema=read('assets/management-glass-showcase.css');
const music=read('assets/seyveo-music-dock.js');
const wellness=read('assets/personal-wellness.css');
const life=read('assets/calendar-spaces.css');
const roadmap=read('assets/management.js');
const quick=read('assets/assistant-quick-swipe.js');
const cssBlock=(source,selector)=>{
 const start=source.indexOf(selector+'{');
 assert.ok(start>=0,'CSS selector exists: '+selector);
 const close=source.indexOf('}',start);
 assert.ok(close>start,'CSS selector closes: '+selector);
 return source.slice(start,close+1);
};

assert.equal((html.match(/<footer class="dock"/g)||[]).length,1,'Exactly one persistent dock');
assert.equal((html.match(/id="orbCluster"/g)||[]).length,1,'One original sphere');
assert.match(music,/const dock=document\.querySelector\('footer\.dock'\)/,'Music changes original dock');
assert.match(music,/if\(!mode\|\|!event\.isTrusted\)return/,'Programmatic navigation stays native');

const dockShell=cssBlock(dock,'.dock');
assert.match(dockShell,/border:1px solid rgba\(235,238,244,\.21\)!important/,'Thin dock outline');
assert.match(dockShell,/backdrop-filter:none!important/,'No power-hungry blurring');
assert.match(dockShell,/box-shadow:inset 0 1px 0 rgba\(255,255,255,\.05\)!important/,'No large shadow');
assert.doesNotMatch(dockShell,/backdrop-filter:blur\(/);
assert.match(dock,/--seyveo-dock-height:58px/,'Dock is more compact');
assert.match(dock,/height:48px!important;min-height:48px!important/,'Four side tabs retain large hit targets');
const selectedDockTab=cssBlock(dock,'.dock>.nav-item.active');
assert.match(selectedDockTab,/border-color:rgba\(236,239,245,\.39\)!important/,'Selected tab uses a thin outline');
assert.match(selectedDockTab,/background:transparent!important/,'Selected tab has no grey stain');
assert.doesNotMatch(selectedDockTab,/background:rgba\(/,'No tinted active capsule');
assert.match(dock,/:root\[data-theme="light"\] \.dock>\.nav-item.active/,'Outline also works in light mode');
assert.match(html,/assets\/floating-navigation\.css\?v=31/,'Updated dock CSS deployed');
assert.match(dock,/prefers-reduced-motion:reduce/,'Honors reduced motion');
assert.doesNotMatch(dock,/sv-magnetic-reveal/,'Carousel animation retired');

assert.match(dock,/SEYVEO Living Ink · readable composer/,'The compact input contrast stays intentional');
assert.match(dock,/radial-gradient\(ellipse 87% 91% at 47% 50%/,'Compact input gets a feathered ink veil without a painted panel');
assert.match(dock,/#ask\.prompt:not\(\.expanded\) #question::placeholder\{/,'Real composer hint has a contrast rule');
assert.match(dock,/--sv-ink-input-hint:#b7c2d0/,'Black Velvet hint is legible');
assert.match(dock,/:root\[data-theme="light"\] #ask\.prompt:not\(\.expanded\)/,'Light theme avoids white-on-white');
assert.match(dock,/#ask\.prompt:not\(\.expanded\):focus-within\{/,'Focus increases contrast only, not geometry');
assert.match(dock,/border-width:0!important/,'No visible gray input capsule');
assert.doesNotMatch(dock,/backdrop-filter:blur\(20px\).*#ask\.prompt:not/,'No old frosted glass shell');
assert.match(html,/assets\/floating-navigation\.css\?v=\d+/,'The deployed index loads the current dock stylesheet');


const rail=cssBlock(composer,'#assistantQuickrail.assistant-quickrail');
for(const prop of ['border:0','background:transparent','box-shadow:none'])
 assert.ok(rail.includes(prop),'Quick actions have no outer box: '+prop);
assert.match(composer,/seyveo-quick-ink/,'Quick labels use bounded appearance');
assert.ok(!home.includes('background:rgba(28,31,33,.85)!important'),'Retired quickrail paint is removed');

assert.doesNotMatch(future,/background-color:var\(--card\)!important|box-shadow:inset 0 1px 0 var\(--future-soft\)/,'Old glass never repaints workspaces');
assert.doesNotMatch(future,/:root\[data-seyveo-presence=listening\] \.dock>\.assistant-button\s*\{/,'No duplicate painted voice capsule');
assert.doesNotMatch(continuity,/--sv-living-dock-glint/,'No redundant scene ring');
assert.match(continuity,/\.sv-cascade/,'Single-workspace reveal preserved');
// One Living Velvet atmosphere on every page, including Home.
assert.match(continuity,/:root:not\(\[data-theme=light\]\) body\{/,'One dark canvas for all pages');
assert.match(continuity,/:root\[data-theme=light\] body\{/,'Light atmosphere is also shared');
assert.doesNotMatch(continuity,/body:has\(#homePage:not\(\[hidden\]\)\)/,'Home must not override the atmospheric background');
assert.match(continuity,/linear-gradient\(180deg,#191b1f 0%,#141619 52%,#101216 100%\)/,'Black graphite depth restored');
assert.match(continuity,/rgba\(222,224,230,\.077\)/,'Subtle pearl halo restored');
assert.doesNotMatch(continuity,/background-attachment:fixed|backdrop-filter:blur\(/,'No scroll-heavy background filters');
assert.match(html,/assets\/living-space\.css\?v=\d+/,'Current shared atmosphere stylesheet uses a versioned URL');
assert.match(wellness,/#calendarPersonalTools \.pw-water-insight\{/,'Health insights still exist');
assert.match(life,/\.calendar-space-edit input,\.calendar-space-edit select,\.calendar-space-edit textarea\{/,'Real editors stay mounted');
assert.match(life,/min-height:48px/,'Editable targets stay accessible');
assert.match(quick,/const KEY='seyveo-assistant-quick-actions-v1'/,'Favorites preserve their existing storage key');
assert.equal((roadmap.match(/\['living_intent'/g)||[]).length,1,'One Living Ink roadmap entry');
// Historical Oct 23 Quiet Cinema v3: original plasma geometry and cinematic stage.
// Management Quiet Cinema is one connected surface, never a grid of glass cards.
assert.match(managementCinema,/#seyveoCleanManageMenu\{/,'Management has one connected card');
assert.match(managementCinema,/seyveo-manage-cinema-rise/,'Management sections reveal in sequence');
assert.match(managementCinema,/\.manage-chevron\{\s*display:none!important/,'No decorative chevrons');
assert.match(managementCinema,/prefers-reduced-motion:reduce/,'Motion follows device preference');
assert.doesNotMatch(managementCinema,/backdrop-filter|filter:blur/,'No blur layers on Management');
assert.match(html,/management-glass-showcase\.css\?v=4/,'Updated Management styling is loaded');

assert.match(decisionJs,/Home Quiet Cinema v3/);
assert.match(decisionJs,/stage=\$\('stage'\)/,'Cinema must resolve stage before guarding it');
assert.match(decisionJs,/location\.hash==='#home'/,'Home route also enables the film');
assert.match(decisionJs,/function startPreview/);
assert.match(decisionJs,/window\.SEYVEO_LIVING_MOMENT/);
assert.match(decisionCss,/Black Velvet — Cinematic Presence/);
assert.match(decisionCss,/#homePage #orbCluster/);
assert.doesNotMatch(decisionJs,/lm-film-card|sv-decision|clean cinematic director/);
assert.doesNotMatch(decisionCss,/\.lm-film-card|\.sv-decision/);
assert.match(decisionCss,/\.lm-reveal \.lm-inline-item:nth-child\(2\)/,'Second flat row rises after the first');
assert.match(decisionCss,/\.lm-preview\.lm-gather \.lm-field/,'Three original rows gather in a single drawn card');
assert.match(decisionCss,/\.lm-preview\.lm-gather \.lm-inline-item/,'The second and third task stay visible after merging');
assert.doesNotMatch(decisionCss,/#seyveoLivingMoment\.lm-gather \.lm-secondary\{\s*max-height:0/,'Gather never deletes secondary items');
assert.match(decisionJs,/controls\.append\(open,execute\)/,'Only two actions: Подробнее and Исполнить');
assert.match(decisionJs,/seyveo:home-task-complete/,'Real completion uses validated personal task storage');
assert.match(decisionJs,/function finishPreviewItem/,'Demo completion removes only the selected example');
assert.doesNotMatch(decisionJs,/lm-inline-arrow/,'No extra arrow glyphs on task rows');
assert.match(decisionCss,/\.lm-polymer--main::after/,'Button arrows are disabled in the scene stylesheet');
assert.match(html,/<button class="btn primary" id="resolve" type="button">Исполнить<\/button>/,'Real advice has explicit execution entry');
assert.doesNotMatch(decisionJs,/hold\(\(\)=>disappear\(\),TIMING\.quiet\)/,'No automatic dismissal of the gathered card');
assert.match(decisionJs,/function gatherPreview/,'Three examples gather into one scene');
assert.doesNotMatch(decisionJs,/sessionStorage\.getItem\(SESSION\)/,'Same-tab reload shows the demo');
// The two actions remain visually unpainted on both themes and sizes.
const actionStart=decisionCss.indexOf('#seyveoLivingMoment .lm-polymer,\n');
assert.ok(actionStart>=0,'Text-action selector exists');
const actionCss=decisionCss.slice(actionStart,decisionCss.indexOf('}',actionStart)+1);
for(const token of ['border:0','border-radius:0','background:none','box-shadow:none'])
 assert.ok(actionCss.includes(token),'Unpainted action: '+token);
assert.match(decisionCss,/#seyveoLivingMoment \.lm-polymer::after/,'Arrows are removed from task actions');
assert.doesNotMatch(decisionCss,/background:linear-gradient\(165deg,rgba\(248,250,252,\.072\)/,'Heavy capsule gradient is retired');
assert.match(html,/living-moment\.css\?v=38/);
assert.match(html,/living-moment\.js\?v=\d+/);
for(const item of ['composer-intent.css','future-surfaces.css','floating-navigation.css',
 'home-velvet.css','living-space.css','personal-wellness.css','calendar-spaces.css'])
 assert.match(html,new RegExp('assets/'+item.replace(/[.*+?^$\u007b\u007d()|[\]\\]/g,'\\$&')+'\\?v=\\d+'),'Versioned file: '+item);
console.log('PASS Living Ink: one drawable dock, real actions, no glass conflict, useful editors and accessible motion.');
