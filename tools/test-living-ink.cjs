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
for(const property of ['background:transparent!important','border:0!important','box-shadow:none!important','backdrop-filter:none!important'])
 assert.ok(dockShell.includes(property),'Dock has no painted shell: '+property);
assert.doesNotMatch(dockShell,/backdrop-filter:blur\(|border:1px solid var\(--seyveo-nav-line\)/);
assert.match(dock,/height:46px!important;min-height:46px!important/,'Touchable navigation');
assert.match(dock,/prefers-reduced-motion:reduce/,'Respects reduced motion');
assert.match(dock,/seyveo-ink-emerge/,'Signs rise once from the page');

const rail=cssBlock(composer,'#assistantQuickrail.assistant-quickrail');
for(const prop of ['border:0','background:transparent','box-shadow:none'])
 assert.ok(rail.includes(prop),'Quick actions have no outer box: '+prop);
assert.match(composer,/seyveo-quick-ink/,'Quick labels use bounded appearance');
assert.ok(!home.includes('background:rgba(28,31,33,.85)!important'),'Retired quickrail paint is removed');

assert.doesNotMatch(future,/background-color:var\(--card\)!important|box-shadow:inset 0 1px 0 var\(--future-soft\)/,'Old glass never repaints workspaces');
assert.doesNotMatch(future,/:root\[data-seyveo-presence=listening\] \.dock>\.assistant-button\s*\{/,'No duplicate painted voice capsule');
assert.doesNotMatch(continuity,/--sv-living-dock-glint/,'No redundant scene ring');
assert.match(continuity,/\.sv-cascade/,'Single-workspace reveal preserved');
assert.match(wellness,/#calendarPersonalTools \.pw-water-insight\{/,'Health insights still exist');
assert.match(life,/\.calendar-space-edit input,\.calendar-space-edit select,\.calendar-space-edit textarea\{/,'Real editors stay mounted');
assert.match(life,/min-height:48px/,'Editable targets stay accessible');
assert.match(quick,/const KEY='seyveo-assistant-quick-actions-v1'/,'Favorites preserve their existing storage key');
assert.equal((roadmap.match(/\['living_intent'/g)||[]).length,1,'One Living Ink roadmap entry');
for(const item of ['composer-intent.css','future-surfaces.css','floating-navigation.css',
 'home-velvet.css','living-space.css','personal-wellness.css','calendar-spaces.css'])
 assert.match(html,new RegExp('assets/'+item.replace(/[.*+?^$\u007b\u007d()|[\]\\]/g,'\\$&')+'\\?v=\\d+'),'Versioned file: '+item);
console.log('PASS Living Ink: one drawable dock, real actions, no glass conflict, useful editors and accessible motion.');
