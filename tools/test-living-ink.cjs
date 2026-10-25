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
const dock=read('assets/floating-navigation.css');
const composer=read('assets/composer-intent.css');
const home=read('assets/home-velvet.css');
const future=read('assets/future-surfaces.css');
const continuity=read('assets/living-space.css');
const decisionCss=read('assets/living-moment.css');
const decisionJs=read('assets/living-moment.js');
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
assert.match(dockShell,/border:1px solid rgba\(235,238,244,.23\)!important/,'Fine outline');
assert.match(dockShell,/backdrop-filter:none!important/,'No power-hungry blurring');
assert.match(dockShell,/box-shadow:inset 0 1px 0 rgba\(255,255,255,.05\)!important/,'No large shadow');
assert.doesNotMatch(dockShell,/backdrop-filter:blur\(/);
assert.match(dock,/height:52px!important;min-height:52px!important/,'Accessible side tabs');
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
// Exactly one Quiet Atmosphere background per theme, shared across ALL pages.
assert.match(continuity,/:root:not\(\[data-theme=light\]\) body\{/,'Dark graphite is shared by every page');
assert.match(continuity,/:root\[data-theme=light\] body\{/,'Light atmosphere is also shared');
assert.doesNotMatch(continuity,/body:has\(#homePage:not\(\[hidden\]\)\)/,'No Home-only backdrop override');
assert.match(continuity,/rgba\(222,224,230,\.077\)/,'Pearl glow is deliberately softer');
assert.doesNotMatch(continuity,/background-attachment:fixed|backdrop-filter:blur\(/,'No scroll-heavy background filters');
assert.match(html,/assets\/living-space\.css\?v=\d+/,'Current shared atmosphere stylesheet uses a versioned URL');
assert.match(wellness,/#calendarPersonalTools \.pw-water-insight\{/,'Health insights still exist');
assert.match(life,/\.calendar-space-edit input,\.calendar-space-edit select,\.calendar-space-edit textarea\{/,'Real editors stay mounted');
assert.match(life,/min-height:48px/,'Editable targets stay accessible');
assert.match(quick,/const KEY='seyveo-assistant-quick-actions-v1'/,'Favorites preserve their existing storage key');
assert.equal((roadmap.match(/\['living_intent'/g)||[]).length,1,'One Living Ink roadmap entry');
// One canonical Quiet Cinema scene; never reintroduce the retired deck.
assert.match(decisionJs,/function createSurface\(primary,other=\[\],real=false\)/);
assert.match(decisionJs,/const scenes=all;/,'All ten demo stories join the one queue');
assert.match(decisionJs,/previewScene=createSurface\(scenes\[0\],scenes\.slice\(1\),!demo\)/);
assert.match(decisionJs,/previewScene=createSurface\(stories\[0\],stories\.slice\(1\),true\)/,'Real tasks share the same renderer');
assert.match(decisionJs,/const visibleFilms=window\.innerHeight<=650\?2:window\.innerHeight<=800\?3:4/,'Rising art fits small phones');
assert.match(decisionJs,/queue\.slice\(0,visibleFilms\)\.forEach/,'A short series rises from below');
assert.match(decisionJs,/field\.classList\.add\('lm-film-running'\)/);
assert.match(decisionJs,/field\.classList\.remove\('lm-film-running'\)/,'The introduction is removed after convergence');
assert.match(decisionJs,/introNode\.remove\(\)/,'No permanent duplicate card container');
assert.match(decisionJs,/field\.addEventListener\('pointerup'/,'Swipe support uses native pointer events');
assert.match(decisionJs,/Math\.abs\(dx\)<62/,'Ignore taps and small accidental drags');
assert.match(decisionJs,/if\(queue\.length>1\)queue\.push\(queue\.shift\(\)\)/,'Swipe defers; it never deletes');
assert.match(decisionJs,/localStorage\.setItem\('seyveo-home-task-order-v1'/,'Saved task display order survives');
assert.match(decisionJs,/const completedItem=queue\.shift\(\)/,'Completion advances to the next task');
assert.match(decisionJs,/task\.done=true;task\.doneAt=/,'A real tap marks only a saved task complete');
assert.match(decisionJs,/if\(discussTask\(shown,\{demo:!real\}\)\)return/,'Full detail opens in the original chat');
assert.match(decisionJs,/demoLaunch\.textContent='Повторить кинематографический показ'/,'Replay after the educational film');
assert.match(decisionJs,/if\(startPreview\(\)\)autoDemoShown=true/,'Demo remains available from idle');
assert.equal((decisionJs.match(/id:'demo-\d+'/g)||[]).length,10,'Ten fictional examples, not ten real saved tasks');
assert.match(decisionJs,/Все сведения вымышлены/,'Training stories are unmistakably labeled');
assert.doesNotMatch(decisionJs,/showLedger|lm-deck-|demoLedgerItems/,'No duplicate decision engine');
assert.doesNotMatch(decisionCss,/\.lm-deck/, 'No legacy decision deck styles');
assert.match(decisionCss,/@keyframes lm-film-rise/,'Bottom-to-top film entrance');
assert.match(decisionCss,/@keyframes lm-film-gather/,'Multiple sheets gather into one');
assert.match(decisionCss,/\.lm-scene\.lm-swipe-out/,'Defer or finish has an actual exit animation');
assert.match(decisionCss,/\.lm-film-running \.lm-scene/,'The one final card stays hidden during the opening film');
assert.match(decisionCss,/prefers-reduced-motion:reduce/,'Reduced motion support remains');
assert.match(decisionCss,/overflow-y:hidden!important/,'Home uses one non-scrolling viewport');
assert.match(decisionCss,/:has\(#homePage:not\(\[hidden\]\)\):not\(\.seyveo-conversation\)/,'Home-only scroll lock');
assert.match(decisionCss,/max-height:900px/,'iPhone X receives compact layouts');
assert.match(decisionCss,/#homePage #seyveoLivingMoment \.lm-inline-item/,'Original illustrated decision list survives');
assert.match(decisionCss,/lm-symbol-arrive/,'Original symbol reveal stays');

for(const item of ['composer-intent.css','future-surfaces.css','floating-navigation.css',
 'home-velvet.css','living-space.css','personal-wellness.css','calendar-spaces.css'])
 assert.match(html,new RegExp('assets/'+item.replace(/[.*+?^$\u007b\u007d()|[\]\\]/g,'\\$&')+'\\?v=\\d+'),'Versioned file: '+item);
console.log('PASS Living Ink: one drawable dock, real actions, no glass conflict, useful editors and accessible motion.');
