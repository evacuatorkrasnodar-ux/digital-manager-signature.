const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const home=read('assets/seyveo-home-dock-preview.css');
const active=read('assets/seyveo-dock-active-glass.css');
const notes=read('assets/seyveo-notebook-editor-v3.css');
const handoff=read('assets/seyveo-sayvi-handoff-demo.css');
const clamp=(min,value,max)=>Math.min(max,Math.max(min,value));

test('Home and Notebook use one 248px Apple-like track with 60px round actions',()=>{
 assert.match(html,/seyveo-home-dock-preview\.css\?v=42/);
 assert.match(html,/seyveo-dock-active-glass\.css\?v=8/);
 assert.match(html,/seyveo-notebook-editor-v3\.css\?v=17/);
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
 assert.doesNotMatch(notes.slice(notes.lastIndexOf('/* Notes dock polish v17')),/button\[aria-pressed="true"\]::after\{/);
 assert.match(notes,/width:54px!important;min-width:0!important;max-width:54px!important/);
 assert.match(notes,/border:1px solid rgba\(255,255,255,\.30\)!important/);
});
