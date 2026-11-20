const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const script=fs.readFileSync(path.join(root,'assets/seyveo-smart-note-ink.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/seyveo-notebook-editor-v3.css'),'utf8');

test('handwriting is mounted on the fullscreen dialog, outside padded text and footer',()=>{
 assert.match(script,/ink\.hidden=true;dlg\.append\(ink\)/);
 assert.doesNotMatch(script,/form\.append\(ink\)/);
 assert.match(css,/> canvas#svSmartNoteInkCanvas\.sv-smart-ink-canvas\{[\s\S]*?inset:0!important;width:100%!important;height:100%!important/);
 assert.match(css,/> canvas#svSmartNoteInkCanvas[\s\S]*?border:0!important;border-radius:0!important;outline:0!important/);
 assert.match(css,/> canvas#svSmartNoteInkCanvas\[hidden\]\{display:none!important\}/);
 assert.match(css,/\.sv-smart-inking[\s\S]*?> canvas#svSmartNoteInkCanvas\.sv-smart-ink-canvas\{pointer-events:auto!important\}/);
 assert.match(script,/observer\?\.observe\(dlg\)/);
});

test('canvas geometry and pointer points reach every actual edge of the page',()=>{
 const start=script.indexOf(' function geometry(){');
 const end=script.indexOf('\n function resize(){',start);
 assert.ok(start>=0&&end>start);
 const page={left:0,top:0,width:390,height:760};
 const field={left:20,top:132,width:350,height:545};
 const context={W:840,dlg:{getBoundingClientRect:()=>page},getTarget:()=>({getBoundingClientRect:()=>field})};
 const pair=vm.runInNewContext(script.slice(start,end)+'\n({geometry,migrateLegacyInk})',context);
 assert.equal(pair.geometry().width,390);
 assert.equal(pair.geometry().height,760);
 const pointStart=script.indexOf(' function point(event){');
 const pointEnd=script.indexOf('\n function save(){',pointStart);
 assert.ok(pointStart>=0&&pointEnd>pointStart);
 const point=vm.runInNewContext(script.slice(pointStart,pointEnd)+'\npoint',{W:840,geometry:pair.geometry});
 assert.deepEqual(JSON.parse(JSON.stringify(point({clientX:0,clientY:0,pressure:.5}))),[0,0,50]);
 const endPoint=point({clientX:390,clientY:760,pressure:.5});
 assert.equal(endPoint[0],840,'right edge is not inset');
 assert.ok(endPoint[1]>1600,'bottom edge is below the old form boundary');
 assert.doesNotMatch(script,/getTarget\(\)\.scrollTop/);
 assert.match(script,/ctx\.setTransform\(scale,0,0,scale,0,0\)/);
});

test('old padded-form handwriting migrates to full-bleed coordinates without moving pixels',()=>{
 const page={left:0,top:0,width:390,height:760};
 const field={left:20,top:132,width:350,height:545};
 const context={W:840,dlg:{getBoundingClientRect:()=>page},getTarget:()=>({getBoundingClientRect:()=>field})};
 const begin=script.indexOf(' function migrateLegacyInk(list){');
 const end=script.indexOf('\n function resize(){',begin);
 const migrate=vm.runInNewContext(script.slice(begin,end)+'\nmigrateLegacyInk',context);
 const previous=[{tool:'pen',width:5,color:'#171e29',points:[[0,0,55],[840,336,60]]}];
 const converted=migrate(previous);
 const [first,last]=converted[0].points;
 assert.ok(Math.abs(first[0]*390/840-20)<.1);
 assert.ok(Math.abs(first[1]*390/840-132)<.1);
 assert.ok(Math.abs(last[0]*390/840-370)<.1);
 assert.ok(Math.abs(last[1]*390/840-(132+336*350/840))<.1);
 assert.ok(Math.abs(converted[0].width*390/840-5*350/840)<.01);
 assert.equal(previous[0].points[0][0],0,'no mutation of stored version 1 strokes');
 assert.match(script,/Number\(note\?\.inlineInk\?\.version\|\|1\)<2\)strokes=migrateLegacyInk\(strokes\)/);
 assert.match(script,/inlineInk=\{version:2,width:W,strokes:/);
});
