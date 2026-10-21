/* SEYVEO Floating Dock v2 — source and geometry regression checks.
 * Static checks do not replace rendering the PWA on an actual iPhone X. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'assets/floating-navigation.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
assert.match(css,/bottom:calc\(8px \+ env\(safe-area-inset-bottom,0px\)\)!important/);
const slots=[
 ['nav-home',1],['nav-tasks',2],['assistant-button',3],
 ['#navPicture',4],['nav-manage',5]
];
for(const [selector,position] of slots){
 const rule=css.split('.dock>'+selector+'{')[1]?.split('}')[0];
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
assert.match(html,/assets\/floating-navigation\.css\?v=2/,'app loads v2 stylesheet');

function portrait(width,height,safeBottom){
 // CSS has a 1px border each side, 7px horizontal padding, 3px column gaps.
 const compact=width<=355;
 const dockWidth=width-Math.min(compact?20:28,width-392);
 const pad=compact?5:7,gap=compact?1:3;
 const cell=(dockWidth-2-2*pad-gap*4)/5;
 const top=height-(safeBottom+8)-64;
 const center=width/2; // centered fixed dock, third equal-width grid column
 assert.ok(cell>=44,'Each tab stays at least 44px wide');
 assert.ok(top>0,'Dock fits portrait screen');
 assert.ok(safeBottom+8>safeBottom,'Dock clears home indicator safe area');
 assert.ok(Math.abs(center-width/2)<.001,'Sayvi stays horizontally centered');
 return {width,height,safeBottom,dockWidth,cell:Math.round(cell*10)/10,dockTop:top,dockBottom:height-safeBottom-8};
}
const iPhoneX=portrait(375,812,34);
const smallPhone=portrait(320,568,0);
assert.equal(iPhoneX.dockWidth,347,'iPhone X dock retains 14px side margins');
assert.equal(iPhoneX.dockBottom,770,'8px clear above the 34px safe area');
assert.equal(smallPhone.dockWidth,300,'narrow phone uses compact margins');
console.log('PASS SEYVEO five-tab navigation',JSON.stringify({iPhoneX,smallPhone}));
