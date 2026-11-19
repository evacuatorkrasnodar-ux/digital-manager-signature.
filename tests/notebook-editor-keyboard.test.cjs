const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const editorStyles=html.match(/<style id="sv-note-editor-v2">([\s\S]*?)<\/style>/)?.[1]||'';
const homeMaterial=fs.readFileSync(path.join(__dirname,'..','assets/seyveo-home-dock-preview.css'),'utf8');
const toolMarkup=html.split('<div class="sv-note-tools sv-note-tools-compact"')[1]?.split('<div id="svNoteAttachmentMenu"')[0]||'';
const viewportScript=html.split('<script id="sv-note-editor-tools">')[1]?.split('</script>')[0]||'';

test('expanded editor reuses exactly the four existing capsule icons',()=>{
 const tools=[...toolMarkup.matchAll(/data-note-tool="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(tools,['checklist','attachment','heading','draw']);
 assert.match(editorStyles,/\.sv-note-keyboard-open[\s\S]*?width:calc\(100vw - 28px\)!important;/);
 assert.match(editorStyles,/\.sv-note-keyboard-open[\s\S]*?grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important;/);
 assert.match(editorStyles,/\.sv-note-keyboard-open[\s\S]*?\.sv-note-draw-standalone\{\s*display:none!important;/);
});

test('mobile keyboard gets one full-width material surface with no extra circle',()=>{
 const start=editorStyles.indexOf('/* Apple Notes keyboard toolbar:');
 const keyboardCss=editorStyles.slice(start);
 assert.ok(start>0);
 assert.match(keyboardCss,/\.sv-note-tool-row\.sv-shared-dock\{\s*height:44px!important;min-height:44px!important;max-height:44px!important;/);
 assert.match(keyboardCss,/\.sv-note-tool-row\.sv-shared-dock::before\{\s*left:14px!important;[\s\S]*?width:calc\(100vw - 28px\)!important;\s*top:1px!important;bottom:auto!important;height:42px!important;/);
 assert.match(keyboardCss,/\.sv-note-tool-row\.sv-shared-dock::after\{\s*display:none!important;/);
 assert.match(keyboardCss,/\.sv-note-tools-compact\{[\s\S]*?width:calc\(100vw - 28px\)!important;[\s\S]*?height:44px!important;min-height:44px!important;max-height:44px!important;/);
 assert.match(keyboardCss,/width:44px!important;\s*min-width:44px!important;\s*height:44px!important;\s*min-height:44px!important;/);
});

test('compact light Notebook dock inherits exactly the live Home pearl tokens',()=>{
 for(const token of ['--sv-dock-pearl-border','--sv-dock-pearl-bg','--sv-dock-pearl-blur','--sv-dock-pearl-shadow']){
  assert.ok(homeMaterial.includes(token+':'),'Home dock owns '+token);
  assert.ok(editorStyles.includes('var('+token+')!important;'),'Notebook shares '+token);
 }
 assert.match(editorStyles,/:root\[data-theme="light"\] #noteReviewDialog\.note-review-dialog\[open\] \.sv-note-bottom \.sv-note-tool-row\.sv-shared-dock::before,/);
 assert.match(editorStyles,/:root\[data-theme="light"\] #noteReviewDialog\.note-review-dialog\[open\] \.sv-note-bottom \.sv-note-tool-row\.sv-shared-dock::after\{/);
 assert.match(editorStyles,/\.sv-note-tools-compact>button:not\(\[hidden\]\),[\s\S]*?color:#0b0b0d!important;/);
});

test('resting Notebook capsule stretches to the 270px reference while its new-note circle stays separate',()=>{
 const mobileCss=editorStyles.slice(editorStyles.indexOf('/* Notebook footer parity'));
 assert.match(mobileCss,/--sv-note-home-left:max\(12px, calc\(50vw - 175px\)\);/);
 assert.match(mobileCss,/--sv-note-home-search:calc\(100vw - var\(--sv-note-home-left\) - 60px\);/);
 assert.match(mobileCss,/--sv-note-capsule-width:min\(270px, calc\(100vw - 104px\)\);/);
 assert.match(mobileCss,/\.sv-note-tool-row\.sv-shared-dock::before\{[\s\S]*?width:var\(--sv-note-capsule-width\)!important;/);
 assert.match(mobileCss,/\.sv-note-tools-compact\{[\s\S]*?width:var\(--sv-note-capsule-width\)!important;/);
 const geometry=(viewport)=>({left:Math.max(12,viewport/2-175),width:Math.min(270,viewport-104)});
 for(const viewport of [320,337,375,390,454]){
  const {left,width}=geometry(viewport);
  const circleLeft=viewport-left-60;
  assert.ok(circleLeft-(left+width)>=20-1e-6,`${viewport}px must have a 20px gap`);
 }
 assert.equal(geometry(375).width,270);
});

test('Apple-style header reuses real note actions and keeps four dock icons',()=>{
 for(const id of ['svNoteUndo','svNoteShare','svNoteMore','svNoteDone']){
  assert.match(html,new RegExp('<button id="'+id+'"[^>]*aria-label="[^"]+"'));
 }
 assert.match(html,/<div class="sv-note-action-pair">[\s\S]*?id="svNoteShare"[\s\S]*?id="svNoteMore"[\s\S]*?<\/div>/);
 assert.match(editorStyles,/\.sv-note-nav-brand\{\s*visibility:hidden!important;/);
 assert.match(editorStyles,/\.sv-note-nav-actions :is\(#svNoteUndo,#svNoteShare,#svNoteMore,#svNoteDone\)/);
 assert.match(editorStyles,/\.sv-note-nav-actions #svNoteDone\{\s*background:#c69c09!important;color:#fff!important;/);
 assert.match(editorStyles,/html\[data-theme="light"\] body dialog#noteReviewDialog\.note-review-dialog\[open\]\s*\.sv-note-nav-actions > #svNoteDone\{\s*background:#c69c09!important;\s*color:#fff!important;/);
 assert.match(html,/\$\('svNoteDone'\)\.addEventListener\('click',closeNoteReviewSafely\)/);
 assert.match(viewportScript,/getElementById\('svNoteUndo'\)[\s\S]*?execCommand\('undo'\)/);
 assert.match(viewportScript,/getElementById\('svNoteShare'\)[\s\S]*?navigator\.share\(\{title,text\}\)/);
 assert.deepEqual([...toolMarkup.matchAll(/data-note-tool="([^"]+)"/g)].map(m=>m[1]),['checklist','attachment','heading','draw']);
});

test('header controls share one top anchor and Share/More render as one capsule',()=>{
 const navMarkup=html.split('<button id="noteReviewBack"')[1]?.split('<div id="svNoteTopMenu"')[0]||'';
 assert.match(navMarkup,/<div class="sv-note-header">\s*<div class="sv-note-nav-brand">[\s\S]*?<\/div>\s*<\/div>\s*<div class="sv-note-nav-actions">/);
 assert.match(editorStyles,/\.sv-note-nav-actions,\s*html body dialog#noteReviewDialog\.note-review-dialog\[open\] button#noteReviewBack\.sv-note-back-arrow\{\s*top:max\(26px, env\(safe-area-inset-top,0px\)\)!important;/);
 assert.match(editorStyles,/html body dialog#noteReviewDialog\.note-review-dialog\[open\] \.sv-note-nav-actions\{\s*right:19px!important;/);
 assert.match(editorStyles,/\.sv-note-action-pair\{\s*display:grid!important;\s*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important;/);
 assert.match(editorStyles,/\.sv-note-action-pair > :is\(button#svNoteShare,button#svNoteMore\)\{[\s\S]*?border:0!important;border-radius:0!important;[\s\S]*?box-shadow:none!important;/);
 assert.match(editorStyles,/\.sv-note-action-pair > button#svNoteMore\{\s*border-left:1px solid/);
});

test('keyboard state follows viewport shrink and recovers without focus-only jumps',()=>{
 const start=viewportScript.indexOf('let lastNoteHeight=0,noteViewportFrame=0,restingNoteHeight=0;');
 const end=viewportScript.indexOf('const queueNoteViewportSync=',start);
 assert.ok(start>=0&&end>start,'actual editor viewport logic is present');
 const flags=new Set(),props={};
 const focusedField={matches:()=>true},document={activeElement:null};
 const dlg={open:true,contains:el=>el===focusedField,
  classList:{toggle:(name,enabled)=>enabled?flags.add(name):flags.delete(name)},
  style:{setProperty:(key,val)=>props[key]=val}};
 const viewport={height:844},window={visualViewport:viewport,innerHeight:844};
 const sync=vm.runInNewContext(viewportScript.slice(start,end)+'\nsync',{dlg,document,window,Math});
 sync();
 assert.equal(props['--sv-note-height'],'844px');
 assert.equal(flags.size,0);
 document.activeElement=focusedField;
 sync();
 assert.equal(flags.size,0,'just focusing does not pretend a software keyboard opened');
 viewport.height=525;
 sync();
 assert.ok(flags.has('sv-note-keyboard-open'));
 assert.equal(props['--sv-note-height'],'525px');
 viewport.height=844;
 sync();
 assert.equal(flags.size,0,'dock returns after keyboard closes');
 viewport.height=525;
 document.activeElement=null;
 sync();
 assert.equal(flags.size,0,'unfocused editor does not show keyboard bar');
});
