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
 assert.match(css,/\.sv-smart-inking[\s\S]*?> canvas#svSmartNoteInkCanvas\.sv-smart-ink-canvas\{pointer-events:none!important\}/);
 assert.match(script,/observer\?\.observe\(dlg\)/);
});

test('one separate paper plane fills the width and continues below the dock',()=>{
 assert.match(script,/paperSheet\.id='svNotePaperSheet'/);
 assert.match(script,/paperSheet\.hidden=true;[\s\S]*?dlg\.prepend\(paperSheet\)/);
 assert.match(script,/paperSheet\.style\.top=Math\.max\(0,Math\.ceil\(field\.top-g\.rect\.top\+30\)\)/);
 assert.match(script,/paperSheet\.hidden=paperStyle==='plain'/);
 assert.match(script,/const textScroll=mode==='text'\?\(getTarget\(\)\.scrollTop\|\|0\):0/);
 assert.match(script,/paperSheet\.style\.setProperty\('--sv-note-paper-scroll',-\(textScroll\+inkScrollY\*g\.width\/W\)\+'px'\)/);
 assert.match(css,/> #svNotePaperSheet\.sv-note-paper-sheet\{[\s\S]*?top:0;right:0!important;bottom:0!important;left:0!important/);
 assert.match(css,/background-position:0 var\(--sv-note-paper-scroll,0px\)!important/);
 assert.match(css,/data-sv-paper-style="grid"[\s\S]*?background-size:24px 24px!important/);
 assert.match(css,/\[data-sv-paper-style="lined"\][\s\S]*?background-image:none!important/);
 assert.match(css,/border:0!important;outline:0!important;border-radius:0!important/);
});

test('the display canvas retains full-page coordinates for saved notes',()=>{
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
 const point=vm.runInNewContext(script.slice(pointStart,pointEnd)+'\npoint',{W:840,geometry:pair.geometry,inkScrollY:0});
 assert.deepEqual(JSON.parse(JSON.stringify(point({clientX:0,clientY:0,pressure:.5}))),[0,0,50]);
 const endPoint=point({clientX:390,clientY:760,pressure:.5});
 assert.equal(endPoint[0],840,'right edge is not inset');
 assert.ok(endPoint[1]>1600,'bottom edge is below the old form boundary');
 assert.match(script.slice(pointStart,pointEnd),/\+inkScrollY/);
 assert.match(script,/ctx\.setTransform\(scale,0,0,scale,0,-inkScrollY\*scale\)/);
});

test('new handwriting reaches all four paper edges below the protected heading',()=>{
 assert.match(script,/inkSafeArea\.id='svSmartNoteInkSafeArea'/);
 assert.match(script,/inkSafeArea\.hidden=true;[\s\S]*?dlg\.append\(inkSafeArea\)/);
 assert.match(script,/inkSafeArea\.style\.top=Math\.max\(0,Math\.ceil\(field\.top-g\.rect\.top\+32\)\)/);
 assert.match(css,/> #svSmartNoteInkSafeArea\.sv-smart-ink-safe-area\{[\s\S]*?bottom:0!important/);
 assert.match(css,/left:0!important;right:0!important/);
 assert.match(css,/\.sv-note-bottom\{[\s\S]*?pointer-events:none!important/);
 assert.match(css,/\.sv-note-bottom :is\(button,\[role="button"\]\)\{pointer-events:auto!important\}/);
 assert.match(css,/background:transparent!important;box-shadow:none!important/);
 assert.match(css,/> #svSmartNoteInkSafeArea\[hidden\]\{display:none!important\}/);
 assert.match(css,/\.sv-smart-inking[\s\S]*?> #svSmartNoteInkSafeArea\.sv-smart-ink-safe-area:not\(\[hidden\]\)\{pointer-events:auto!important\}/);
 assert.match(script,/inkSafeArea\.addEventListener\('pointerdown'/);
 assert.match(script,/inkSafeArea\.addEventListener\('pointermove'/);
 assert.doesNotMatch(script,/ink\.addEventListener\('pointerdown'/);
 assert.match(script,/inkSafeArea\.setPointerCapture\(event\.pointerId\)/);
 assert.match(script,/ctx\.rect\(\(safe\.left-g\.rect\.left\)/);
 assert.match(script,/ctx\.clip\(\)/);
 assert.match(script,/if\(event\.clientX<safe\.left\|\|event\.clientX>safe\.right\|\|event\.clientY<safe\.top\|\|event\.clientY>safe\.bottom\)\{finish\(event\);return;\}/);
 assert.match(script,/ink\.hidden=next==='text';inkSafeArea\.hidden=next==='text'/);
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
 assert.match(script,/inlineInk=\{version:2,width:W,pageHeight:Math\.ceil\(inkPageHeight\),strokes:/);
});

test('long handwritten notes scroll vertically and expand without replacing prior ink',()=>{
 const start=script.indexOf(' function point(event){');
 const end=script.indexOf('\n function save(){',start);
 assert.ok(start>0&&end>start);
 const snippet=script.slice(start,end);
 let drawn=0,offsetUpdates=0;
 const sandbox={W:840,inkScrollY:0,inkPageHeight:1680,mode:'pen',
  geometry:()=>({rect:{left:0,top:0},width:420,height:840}),
  syncPaperOffset:()=>{offsetUpdates++;},render:()=>{drawn++;}};
 const api=vm.runInNewContext(snippet+'\n({point,scrollInk})',sandbox);
 const first=api.point({clientX:0,clientY:840,pressure:.5});
 assert.equal(first[0],0);
 assert.equal(first[1],1680);
 api.scrollInk(240);
 assert.equal(sandbox.inkScrollY,480,'paper moves in document coordinates');
 assert.ok(sandbox.inkPageHeight>1680,'blank paper grows beneath the viewport');
 const later=api.point({clientX:420,clientY:840,pressure:.5});
 assert.equal(later[0],840);
 assert.equal(later[1],2160,'stroke points include the page offset');
 for(let i=0;i<8;i++)api.scrollInk(740);
 assert.ok(sandbox.inkScrollY>9000,'one long note continues beyond the first screen');
 api.scrollInk(-100000);
 assert.equal(sandbox.inkScrollY,0,'scrolling back returns to the beginning');
 assert.ok(drawn>=10&&offsetUpdates>=10,'scroll repaints ink and background together');
 assert.match(script,/touchPointers\.size>=2/);
 assert.match(script,/inkSafeArea\.addEventListener\('wheel'/);
 assert.match(script,/pageHeight:Math\.ceil\(inkPageHeight\)/);
 assert.doesNotMatch(script,/maxY=Math\.min\(5000,/,'OCR must not crop long notes at the old fixed height');
 assert.match(script,/raw\.height=Math\.max\(1,Math\.round\(height\*scale\)\)/);
});
