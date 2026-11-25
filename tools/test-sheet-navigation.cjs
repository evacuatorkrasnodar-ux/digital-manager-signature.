'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const context={window:{},document:{readyState:'complete',getElementById:()=>null}};
vm.runInNewContext(read('assets/seyveo-sheet-navigation.js'),context);
const attach=context.window.SEYVEO_SHEET_NAVIGATION.attach;
function handle(){
 const events=new Map();
 return {events,addEventListener(k,f){if(!events.has(k))events.set(k,[]);events.get(k).push(f);},setPointerCapture(){},
 fire(k,opts={}){for(const f of events.get(k)||[])f({pointerId:1,clientX:0,clientY:0,button:0,isPrimary:true,target:{closest:()=>null},...opts});}};
}
let up=0,down=0;
const h=handle();
attach(h,()=>up++,()=>down++);
attach(h,()=>up++,()=>down++);
assert.equal(h.events.get('pointerdown').length,1);
const drag=(x,y,opts={})=>{h.fire('pointerdown',opts);h.fire('pointerup',{clientX:x,clientY:y});};
drag(0,60);assert.equal(down,1);
drag(0,-60);assert.equal(up,1);
drag(80,55);drag(0,20);assert.equal(down,1);
drag(0,60,{target:{closest:()=>true}});assert.equal(down,1);
drag(0,60,{isPrimary:false});assert.equal(down,1);
h.fire('pointerdown');h.fire('pointercancel');h.fire('pointerup',{clientY:60});assert.equal(down,1);
h.fire('pointerdown');h.fire('lostpointercapture');h.fire('pointerup',{clientY:60});assert.equal(down,1);
const onlyClose=handle();attach(onlyClose,null,()=>down++);onlyClose.fire('pointerdown');onlyClose.fire('pointerup',{clientY:-70});assert.equal(down,1);
assert.match(read('assets/seyveo-document-pickers.js'),/bottom=true/);
assert.match(read('assets/seyveo-docs-studio.js'),/templateDialog\('Мои шаблоны',\{librarySheet:true\}\)/);
assert.match(read('assets/seyveo-docs-studio.js'),/if\(librarySheet\)\{/);
const inbox=read('assets/seyveo-work-inbox-actions.js');
assert.match(inbox,/swipeSafeViews=new Set\(\['new','staff','team-structure','one','archives'\]\)/);
assert.match(inbox,/if\(!overlay.hidden&&swipeSafeViews.has\(sheetType\)\)back.click\(\)/);
assert.match(inbox,/sheetGrip.hidden=!safeSwipe/);
console.log('Shared sheet navigation: gesture direction, threshold, cancellation, interactive targets and opt-in checks passed.');
