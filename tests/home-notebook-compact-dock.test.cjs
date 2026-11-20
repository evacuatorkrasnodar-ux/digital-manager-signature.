const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const home=read('assets/seyveo-home-dock-preview.css');
const active=read('assets/seyveo-dock-active-glass.css');
const activeJs=read('assets/seyveo-dock-active-glass.js');
const notes=read('assets/seyveo-notebook-editor-v3.css');
const handoff=read('assets/seyveo-sayvi-handoff-demo.css');
const clamp=(min,value,max)=>Math.min(max,Math.max(min,value));

test('Home and Notebook use one 248px Apple-like track with 60px round actions',()=>{
 assert.match(html,/seyveo-home-dock-preview\.css\?v=42/);
 assert.match(html,/seyveo-dock-active-glass\.css\?v=10/);
 assert.match(html,/seyveo-dock-active-glass\.js\?v=4/);
 assert.match(html,/seyveo-notebook-editor-v3\.css\?v=22/);
 assert.match(home,/--sv-feng-capsule:clamp\(176px,calc\(100vw[\s\S]*?- 80px\),248px\);/);
 assert.match(notes,/--note-width:clamp\(176px,calc\(100vw - var\(--note-left\) - var\(--note-left\) - 80px\),248px\);/);
 assert.match(home,/grid-template-columns:repeat\(4,minmax\(0,calc\(var\(--sv-feng-capsule\) \/ 4\)\)\) minmax\(0,1fr\) 60px!important/);
 assert.match(notes,/--note-right:calc\(100vw - var\(--note-left\) - 60px\);/);
 assert.doesNotMatch(active,/--sv-feng-capsule\s*:/,'glass must not stretch the track');
 assert.match(handoff,/max-width:calc\(var\(--sv-feng-capsule\) \* \.75\)/);
});

test('compact dock preserves touch areas and independent right-circle spacing',()=>{
 for(const viewport of [320,337,375,390,428,768]){
  const homeSide=clamp(14,.05*viewport,22);
  const homePill=clamp(176,viewport-2*homeSide-80,248);
  const noteSide=viewport<=699?homeSide:Math.max(homeSide,viewport/2-175);
  const notePill=clamp(176,viewport-2*noteSide-80,248);
  const homeGap=viewport-2*homeSide-homePill-60;
  const noteGap=viewport-2*noteSide-notePill-60;
  assert.ok(homeGap>=19.9,`Home: gap at ${viewport}px`);
  assert.ok(noteGap>=19.9,`Notebook: gap at ${viewport}px`);
  assert.equal(notePill,homePill,`same capsule width at ${viewport}px`);
  assert.ok(notePill/4>=44,`four optical tracks fit touch targets at ${viewport}px`);
 }
 assert.match(home,/height:60px!important;min-height:60px!important/);
 assert.match(notes,/height:60px!important;min-height:60px!important/);
 assert.match(notes,/\.sv-note-keyboard-open[\s\S]*?height:42px!important/);
});

test('Notebook aligns to the Home edge and has no fifth wrapped icon or underline',()=>{
 const mobile=notes.slice(notes.lastIndexOf('/* On an iPhone the Notebook pair'));
 assert.match(mobile,/@media\(max-width:699px\)/);
 assert.match(mobile,/--note-left:max\(clamp\(14px,5vw,22px\),env\(safe-area-inset-left,0px\)\)/);
 assert.match(mobile,/--note-right:calc\(100vw - max\(clamp\(14px,5vw,22px\),env\(safe-area-inset-right,0px\)\) - 60px\)/);
 assert.doesNotMatch(notes,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
 assert.match(notes,/button\[data-sv-smart-tool="paper"\]:not\(\[hidden\]\)\{\s*display:none!important/);
 assert.doesNotMatch(notes.slice(notes.lastIndexOf('/* Notes dock polish v18')),/button\[aria-pressed="true"\]::after\{/);
 assert.match(notes,/width:52px!important;min-width:0!important;max-width:52px!important/);
 assert.match(notes,/border:1px solid rgba\(255,255,255,\.30\)!important/);
});

test('Home inset is mathematically circular and centered in each icon track',()=>{
 assert.match(active,/width:var\(--sv-indicator-size,52px\)!important;\s*height:var\(--sv-indicator-size,52px\)!important/);
 assert.match(active,/top:calc\(\(60px - var\(--sv-indicator-size,52px\)\) \/ 2\)!important/);
 assert.match(active,/border-radius:50%!important/);
 assert.doesNotMatch(activeJs,/--sv-indicator-width/);
 const start=activeJs.indexOf(' function draw(tab){'),end=activeJs.indexOf(' function refresh(){',start);
 assert.ok(start>=0&&end>start,'original indicator geometry is testable');
 const props={},dock={getBoundingClientRect:()=>({left:22,width:350,height:60})};
 const indicator={style:{setProperty:(key,value)=>{props[key]=value}},dataset:{}};
 const create=vm.runInNewContext(`(function(dock,indicator){${activeJs.slice(start,end)}\nreturn draw;})`,{Math});
 const draw=create(dock,indicator);
 for(const width of [52,56,62,78]){
  const tab={element:{getBoundingClientRect:()=>({left:100,width,height:58})},accent:'tasks'};
  assert.equal(draw(tab),true);
  const diameter=Number.parseFloat(props['--sv-indicator-size']);
  const x=Number.parseFloat(props['--sv-indicator-x']);
  assert.equal(diameter,Math.max(40,Math.min(52,width-8)),`circle diameter for ${width}px track`);
  assert.ok(Math.abs(22+x+diameter/2-(100+width/2))<.01,'circle is exactly centered over the icon');
 }
});
