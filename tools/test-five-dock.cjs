/* SEYVEO Floating Dock v2 — source and geometry regression checks.
 * Static checks do not replace rendering the PWA on an actual iPhone X. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'assets/floating-navigation.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const chatCss=fs.readFileSync(path.join(root,'assets/conversation-refined.css'),'utf8');

assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
assert.match(css,/--seyveo-dock-bottom:calc\(8px \+ env\(safe-area-inset-bottom,0px\)\)/,'Single approved safe-area offset');
assert.match(css,/bottom:var\(--seyveo-dock-bottom\)!important/,'Every page uses one dock bottom token');
assert.match(css,/--seyveo-dock-height:56px/,'One compact 56px dock-height token');
const slots=[
 ['nav-home',1],['nav-tasks',2],['assistant-button',3],
 ['#navPicture',4],['nav-manage',5]
];
for(const [selector,position] of slots){
 const cssSelector=selector.startsWith('#')?selector:'.'+selector;
 const rule=css.split('.dock>'+cssSelector+'{')[1]?.split('}')[0];
 assert.ok(rule,selector+' CSS placement exists');
 assert.ok(rule.includes('grid-column:'+position+'!important'),selector+' has the correct column');
 assert.ok(rule.includes('grid-row:1!important'),selector+' stays on the same row');
}
assert.match(css,/\.dock>#navPicture\{display:flex!important/,'Picture is visible');
assert.doesNotMatch(css,/\.dock>#navPicture\{display:none!important/,'old hiding rule must stay deleted');
const expected=['navHome','navTasks','assistantButton','navPicture','navManage'];
let last=-1;
for(const id of expected){
 const at=html.indexOf('id="'+id+'"');
 assert.ok(at>=0,id+' exists');
 assert.ok(at>last,id+' keeps left-to-right DOM order');
 last=at;
}
assert.match(html,/assets\/floating-navigation\.css\?v=\d+/,'app loads versioned dock stylesheet');
assert.ok(html.includes('</div></div><footer class="dock"'),'Dock is a direct body child, not in scrolling app');
assert.ok(!html.includes('id="homePictureTrigger"'),'No duplicate Picture control on Home');
assert.ok(!html.includes("$('homePictureTrigger')"),'No dead Picture handler on Home');
assert.ok(!css.includes('home-picture-trigger'),'Removed Home-only Picture styles');
assert.ok(!css.includes('data-seyveo-view="home"'),'No Home-only dock overrides');
const inline=html.slice(html.indexOf('<style>'),html.indexOf('</style>'));
assert.doesNotMatch(inline,/\.dock\s*\{|\.nav-item\s*\{|\.assistant-button\s*\{/,'No obsolete inline dock geometry or overlays');
assert.equal((html.match(/<footer class="dock"/g)||[]).length,1,'One persistent dock in the DOM');
assert.match(html,/assets\/conversation-refined\.css\?v=\d+/,'Open Canvas chat CSS is cache-busted');
assert.match(css,/height:46px!important;min-height:46px!important/,'Touch targets remain above 44px');
assert.match(html,/id="assistantButton" class="assistant-button" aria-label="Сэйви:/,'Sayvi remains accessible');
assert.ok(!html.includes('dock-assistant-label'),'No duplicate Sayvi caption in five-tab dock');
assert.ok(!css.includes('.dock-assistant-label'),'No stale Sayvi caption rule');

assert.ok(!chatCss.includes('seyveo-name-thinking'),'Sayvi letters no longer move');
assert.ok(chatCss.includes('animation:none!important;transform:none!important;opacity:1!important'),'Sayvi name is fixed');
assert.ok(chatCss.includes('animation:seyveo-dot-thinking .78s ease-in-out infinite'),'Only nearby dots retain working animation');
assert.ok(chatCss.includes('.seyveo-conversation-heading.is-processing .seyveo-name-dots{opacity:1}'),'Dots activate only on real work');

function portrait(width,height,safeBottom){
 // CSS has a 1px border each side, 7px horizontal padding, 3px column gaps.
 const compact=width<=355;
 const dockWidth=Math.min(392,width-(compact?20:28));
 const pad=compact?5:7,gap=compact?1:3;
 const cell=(dockWidth-2-2*pad-gap*4)/5;
 const top=height-(safeBottom+8)-56;
 const dockLeft=(width-dockWidth)/2;
 const assistantCenter=dockLeft+1+pad+2*(cell+gap)+cell/2;
 assert.ok(cell>=44,'Each tab stays at least 44px wide');
 assert.ok(top>0,'Dock fits portrait screen');
 assert.ok(safeBottom+8>safeBottom,'Dock clears home indicator safe area');
 assert.ok(Math.abs(assistantCenter-width/2)<.001,'Sayvi stays horizontally centered');
 return {width,height,safeBottom,dockWidth,cell:Math.round(cell*10)/10,dockTop:top,dockBottom:height-safeBottom-8};
}
const iPhoneX=portrait(375,812,34);
const smallPhone=portrait(320,568,0);
assert.equal(iPhoneX.dockWidth,347,'iPhone X dock retains 14px side margins');
assert.equal(iPhoneX.dockBottom,770,'8px clear above the 34px safe area');
assert.equal(smallPhone.dockWidth,300,'narrow phone uses compact margins');
console.log('PASS SEYVEO five-tab navigation',JSON.stringify({iPhoneX,smallPhone}));
