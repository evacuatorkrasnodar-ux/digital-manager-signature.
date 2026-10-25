/* SEYVEO · Fixed navigation and current layout contract.
   Static geometry is not a replacement for device rendering. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(dir,'assets/floating-navigation.css'),'utf8');
const source=fs.readFileSync(path.join(dir,'assets/magnetic-ink-dock.js'),'utf8');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const chat=fs.readFileSync(path.join(dir,'assets/conversation-refined.css'),'utf8');
assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
assert.match(css,/--seyveo-dock-height:64px/);
assert.match(css,/--seyveo-dock-bottom:max\(7px,calc\(env\(safe-area-inset-bottom,0px\) - 20px\)\)/);
assert.match(css,/bottom:var\(--seyveo-dock-bottom\)!important/);
assert.match(css,/height:52px!important;min-height:52px!important/,'44+ px side hit areas');
const slots=[['.nav-home',1],['.nav-tasks',2],['.assistant-button',3],['#navPicture',4],['.nav-manage',5]];
for(const [selector,position] of slots){
 const rule=css.split('.dock>'+selector+'{')[1]?.split('}')[0];
 assert.ok(rule,'Missing CSS position: '+selector);
 assert.ok(rule.includes('grid-column:'+position+'!important'),selector+' in column '+position);
 assert.ok(rule.includes('grid-row:1!important'),selector+' stays in row');
}
let previous=-1;
for(const id of ['navHome','navTasks','assistantButton','navPicture','navManage']){
 const current=html.indexOf('id="'+id+'"');
 assert.ok(current>previous,'Original element and order retained: '+id);
 previous=current;
}
assert.equal((html.match(/<footer class="dock"/g)||[]).length,1);
assert.ok(html.includes('</div></div><footer class="dock"'),'Dock is outside app scroller');
assert.match(html,/assets\/floating-navigation\.css\?v=\d+/);
assert.match(html,/assets\/magnetic-ink-dock\.js\?v=\d+/);
assert.match(html,/id="assistantButton" class="assistant-button" aria-label="Сэйви: открыть единый разговор/);
assert.match(source,/const buttonIds=\['navHome','navTasks','navPicture','navManage'\]/);
assert.doesNotMatch(source,/pointerdown|pointerup|switchPage\(/,'No swipe carousel');
assert.doesNotMatch(css,/sv-magnetic-reveal|sv-magnetic-ink-snap/,'No swipe animations');
assert.match(chat,/\.seyveo-conversation-heading\.is-processing \.seyveo-name-dots\{opacity:1\}/,'Chat status preserved');
assert.doesNotMatch(css,/data-seyveo-view="(?:home|manage|picture)"/,'No screen-specific dock offsets');
function portrait(width,height,safeBottom){
 const small=width<=355;
 const size=Math.min(440,width-(small?8:14));
 const pad=small?4:7, gap=small?1:2;
 const cell=(size-2-2*pad-4*gap)/5;
 const bottom=Math.max(7,safeBottom-20);
 const top=height-bottom-64;
 const center=(width-size)/2+1+pad+2*(cell+gap)+cell/2;
 assert.ok(cell>=44,'All slots remain comfortably tappable');
 assert.ok(top>0,'Dock fits height');
 assert.ok(Math.abs(center-width/2)<.001,'Center button horizontally balanced');
 return {width,height,sideCell:Math.round(cell),bottom,top};
}
const x=portrait(375,812,34),small=portrait(320,568,0);
assert.equal(x.bottom,14);assert.equal(small.bottom,7);
console.log('PASS fixed dock: one panel, 4 stable routes, central Sayvi, safe area',JSON.stringify({x,small}));
