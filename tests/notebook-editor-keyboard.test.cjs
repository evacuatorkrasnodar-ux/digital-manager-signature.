const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/seyveo-notebook-editor-v3.css'),'utf8');
const contextCss=fs.readFileSync(path.join(root,'assets/seyveo-notebook-context-actions.css'),'utf8');
const home=fs.readFileSync(path.join(root,'assets/seyveo-home-dock-preview.css'),'utf8');
const editor=html.split('<dialog id="noteReviewDialog"')[1]?.split('</dialog>')[0]||'';
const toolbar=editor.split('<div class="sv-note-tools sv-note-tools-compact"')[1]?.split('<div id="svNoteAttachmentMenu"')[0]||'';
const viewportScript=html.split('<script id="sv-note-editor-tools">')[1]?.split('</script>')[0]||'';

test('editor is one rebuilt borderless full-screen page, with no legacy inline skin',()=>{
 assert.doesNotMatch(html,/<style id="sv-note-editor-v2"/);
 assert.match(html,/<link rel="stylesheet" href="assets\/seyveo-notebook-editor-v3\.css\?v=22">\s*<link rel="stylesheet" href="assets\/seyveo-universal-dock-inset\.css\?v=1">\s*<link rel="stylesheet" href="assets\/seyveo-notebook-context-actions\.css\?v=7">\s*<\/body>/);
 assert.match(css,/dialog#noteReviewDialog\.notes-dialog\.note-review-dialog\[open\]\{[\s\S]*?width:100vw!important;[\s\S]*?border:0!important;border-radius:0!important;outline:0!important;[\s\S]*?box-shadow:none!important;/);
 assert.match(css,/dialog#noteReviewDialog\.notes-dialog\.note-review-dialog\[open\]::backdrop\{[\s\S]*?backdrop-filter:none!important;/);
 assert.doesNotMatch(editor,/sv-note-document-capsule|sv-note-document-icon|sv-note-header/);
 assert.match(editor,/<form id="noteReviewForm" class="sv-note-editor">[\s\S]*?<input id="svNoteTitle"[\s\S]*?<textarea id="noteReviewText"/);
 for(const selector of ['form#noteReviewForm.sv-note-editor','input#svNoteTitle.sv-note-title-input','textarea#noteReviewText']){
  assert.ok(css.includes(selector),`new style owns ${selector}`);
 }
});

test('top navigation keeps only Back, mode label and golden Done',()=>{
 for(const id of ['noteReviewBack','svNoteDone']){
  assert.match(editor,new RegExp('<button id="'+id+'"[^>]*aria-label="[^\"]+"'));
 }
 assert.doesNotMatch(editor,/id="svNoteUndo"|id="svNoteMore"|id="svNoteShare"|id="svNoteSearch"|id="svNoteSearchPanel"|class="sv-note-action-pair"|id="svNotePrintTop"/);
 assert.match(editor,/id="svNoteInputModeLabel"[^>]*>Печатный текст<\/span>/);
 assert.match(contextCss,/#svNoteInputModeLabel\.sv-note-input-mode-label/);
 assert.doesNotMatch(css,/\.sv-note-nav-actions \.sv-note-action-pair/);
 assert.match(css,/\.sv-note-nav-actions button#svNoteDone\{\s*background:#c69c09!important;color:#fff!important;/);
 assert.match(html,/\$\('svNoteDone'\)\.addEventListener\('click',closeNoteReviewSafely\)/);
 assert.match(viewportScript,/const undoTyped=\(\)=>\{[\s\S]*?execCommand\('undo'\)/);
 assert.match(viewportScript,/window\.SEYVEO_NOTE_TEXT_UNDO=undoTyped/);
 assert.doesNotMatch(viewportScript,/getElementById\('svNoteShare'\)|printCurrent/);
 const menu=editor.split('<div id="svNoteTopMenu"')[1]?.split('</div>')[0]||'';
 assert.deepEqual([...menu.matchAll(/data-sv-note-menu="([^"]+)"/g)].map(m=>m[1]),['undo','copy','clear']);
 assert.doesNotMatch(menu,/clear-ink/);
 assert.match(contextCss,/grid-template-columns:repeat\(3,40px\)!important/);
 assert.match(html,/action\('Поделиться',\(\)=>\{shareNote\(note\)\}\)/);
 assert.match(html,/action\('Распечатать',\(\)=>\{printNote\(note\)\}\)/);
});

test('note title sits immediately beneath navigation, even on a notched iPhone',()=>{
 assert.match(css,/padding:max\(84px,calc\(env\(safe-area-inset-top,0px\) \+ 56px\)\) 20px max\(10px,env\(safe-area-inset-bottom,0px\)\)!important/);
 assert.doesNotMatch(css,/clamp\(76px,20vh,140px\)/);
 for(const safeTop of [0,20,44,60]){
  const navBottom=Math.max(26,safeTop)+44;
  const editorTop=Math.max(84,safeTop+56);
  assert.ok(editorTop-navBottom>=12,`title clears navigation at ${safeTop}px safe area`);
  assert.ok(editorTop-navBottom<=14,`title is not stranded below navigation at ${safeTop}px`);
 }
 assert.match(css,/height:48px!important;min-height:48px!important;max-height:48px!important/);
});

test('bottom uses the four original icons and a separate new-note circle',()=>{
 assert.deepEqual([...toolbar.matchAll(/data-note-tool="([^"]+)"/g)].map(m=>m[1]),[
  'checklist','attachment','heading','draw'
 ]);
 assert.match(editor,/id="svNoteNewStandalone" class="sv-note-draw-standalone"/);
 assert.match(css,/--note-width:clamp\(176px,calc\(100vw - var\(--note-left\) - var\(--note-left\) - 80px\),248px\);/);
 assert.match(css,/--note-left:max\(clamp\(14px,5vw,22px\),calc\(50vw - 175px\)\);/);
 assert.match(css,/--note-right:calc\(100vw - var\(--note-left\) - 60px\);/);
 assert.ok(home.includes('--sv-dock-pearl-bg:'));
 assert.match(css,/--note-pill:var\(--sv-dock-pearl-bg,/);
 for(const width of [320,337,375,390,454]){
  const left=Math.max(Math.max(14,Math.min(width*.05,22)),width/2-175);
  const pill=Math.min(248,Math.max(176,width-2*left-80)),circle=width-left-60;
  assert.ok(circle-left-pill>=20-1e-6,`maintain a 20px gap at ${width}px`);
 }
});

test('software keyboard switches dock to one narrow 42px full-width capsule',()=>{
 assert.match(css,/\.sv-note-keyboard-open\s+\.sv-note-bottom\{/);
 assert.match(css,/\.sv-note-keyboard-open\s+\.sv-note-bottom \.sv-note-tool-row\.sv-shared-dock::before\{[\s\S]*?left:14px!important;width:calc\(100vw - 28px\)!important;[\s\S]*?height:42px!important;/);
 assert.match(css,/\.sv-note-keyboard-open\s+\.sv-note-bottom \.sv-note-tool-row\.sv-shared-dock::after\{display:none!important\}/);
 assert.match(css,/\.sv-note-keyboard-open\s+\.sv-note-bottom \.sv-note-tool-row\.sv-shared-dock>\.sv-note-draw-standalone\{display:none!important\}/);
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
