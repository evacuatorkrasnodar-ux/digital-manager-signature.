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
 assert.match(html,/<link rel="stylesheet" href="assets\/seyveo-notebook-editor-v3\.css\?v=32">\s*<link rel="stylesheet" href="assets\/seyveo-universal-dock-inset\.css\?v=1">\s*<link rel="stylesheet" href="assets\/seyveo-notebook-context-actions\.css\?v=9">\s*<\/body>/);
 assert.match(css,/dialog#noteReviewDialog\.notes-dialog\.note-review-dialog\[open\]\{[\s\S]*?width:100vw!important;[\s\S]*?border:0!important;border-radius:0!important;outline:0!important;[\s\S]*?box-shadow:none!important;/);
 assert.match(css,/dialog#noteReviewDialog\.notes-dialog\.note-review-dialog\[open\]::backdrop\{[\s\S]*?backdrop-filter:none!important;/);
 assert.doesNotMatch(editor,/sv-note-document-capsule|sv-note-document-icon|sv-note-header/);
 assert.match(editor,/<input id="svNoteTitle"[\s\S]*?<form id="noteReviewForm" class="sv-note-editor">[\s\S]*?<textarea id="noteReviewText"/);
 assert.doesNotMatch(editor.split('<form id="noteReviewForm"')[1]?.split('<textarea id="noteReviewText"')[0]||'',/id="svNoteTitle"/);
 for(const selector of ['form#noteReviewForm.sv-note-editor','input#svNoteTitle.sv-note-title-input','textarea#noteReviewText']){
  assert.ok(css.includes(selector),`new style owns ${selector}`);
 }
});

test('top navigation keeps Back, an editable centered note title and golden Done',()=>{
 for(const id of ['noteReviewBack','svNoteDone']){
  assert.match(editor,new RegExp('<button id="'+id+'"[^>]*aria-label="[^\"]+"'));
 }
 assert.doesNotMatch(editor,/id="svNoteUndo"|id="svNoteMore"|id="svNoteShare"|id="svNoteSearch"|id="svNoteSearchPanel"|class="sv-note-action-pair"|id="svNotePrintTop"/);
 assert.match(editor,/id="svNoteInputModeLabel"[^>]*>Печатный текст<\/span>/);
 assert.match(contextCss,/#svNoteInputModeLabel\.sv-note-input-mode-label/);
 assert.match(editor,/<input id="svNoteTitle" class="sv-note-title-input"[^>]*placeholder="Название заметки"[^>]*aria-label="Название заметки"/);
 assert.match(css,/left:50%!important;right:auto!important;transform:translateX\(-50%\)!important/);
 assert.match(css,/text-align:center!important;[\s\S]*?text-overflow:ellipsis!important/);
 assert.match(contextCss,/clip-path:inset\(50%\)!important/);
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

test('note body starts immediately beneath navigation, even on a notched iPhone',()=>{
 assert.match(css,/padding:max\(84px,calc\(env\(safe-area-inset-top,0px\) \+ 56px\)\) 20px max\(10px,env\(safe-area-inset-bottom,0px\)\)!important/);
 assert.doesNotMatch(css,/clamp\(76px,20vh,140px\)/);
 for(const safeTop of [0,20,44,60]){
  const navBottom=Math.max(26,safeTop)+44;
  const editorTop=Math.max(84,safeTop+56);
  assert.ok(editorTop-navBottom>=12,`body clears navigation at ${safeTop}px safe area`);
  assert.ok(editorTop-navBottom<=14,`body is not stranded below navigation at ${safeTop}px`);
 }
 assert.match(css,/top:max\(26px,env\(safe-area-inset-top,0px\)\)!important/);
 assert.match(css,/height:44px!important;min-height:44px!important;max-height:44px!important/);
});

test('header title edits keep autosave and never steal the handwriting canvas',()=>{
 assert.match(editor,/<input id="svNoteTitle"[^>]*maxlength="120"[^>]*autocomplete="off">/);
 assert.match(html,/\$\('svNoteTitle'\)\.addEventListener\('input',scheduleNoteAutosave\)/);
 assert.match(html,/const title=\$\('svNoteTitle'\)\.value\.trim\(\)\.replace\(\/\\s\+\/g,' '\)\.slice\(0,120\)/);
 assert.match(html,/\$\('svNoteTitle'\)\.value=titleMatch\?titleMatch\[1\]:''/);
 assert.match(css,/width:min\(260px,calc\(100vw - 168px\)\)!important/);
 assert.match(css,/font:550 16px\/1\.15 -apple-system/);
 assert.match(css,/white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important/);
 assert.match(contextCss,/\.sv-ink-stroking[\s\S]*?#svNoteTitle\)\{\s*opacity:0!important;pointer-events:none!important/);
});

test('typing hint hides only in handwriting mode and returns for Aa',()=>{
 assert.match(css,/textarea#noteReviewText::placeholder\{color:var\(--note-placeholder\)!important;opacity:1!important\}/);
 assert.match(css,/\.sv-smart-inking\s+textarea#noteReviewText::placeholder\{opacity:0!important\}/);
 assert.match(css,/\.sv-smart-inking\s+#svNoteRichEditor:empty::before\{opacity:0!important\}/);
 assert.match(css,/--note-title:#606a74/);
 assert.match(html,/placeholder="Что нужно запомнить\?"/);
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
 assert.match(css,/\.sv-smart-ink-tools\[hidden\],[\s\S]*?:not\(\.sv-smart-inking\)[\s\S]*?\.sv-note-keyboard-open\s+\.sv-smart-ink-tools\{display:none!important\}/);
});

test('a real note text focus leaves pen mode before the keyboard accessory appears',()=>{
 const smart=fs.readFileSync(path.join(root,'assets/seyveo-smart-note-ink.js'),'utf8');
 assert.match(html,/seyveo-smart-note-ink\.js\?v=17/);
 const start=smart.indexOf(" dlg.addEventListener('focusin',event=>{");
 const end=smart.indexOf('\n function load(id){',start);
 assert.ok(start>=0&&end>start);
 let callback,mode='pen',switchCount=0;
 const dlg={addEventListener:(name,listener)=>{if(name==='focusin')callback=listener;}};
 const setMode=next=>{mode=next;switchCount++;};
 vm.runInNewContext(smart.slice(start,end),{dlg,setMode,mode});
 const textEvent={target:{matches:selector=>selector.includes('#noteReviewText')}};
 callback(textEvent);
 assert.equal(switchCount,1);
 assert.equal(mode,'text');
 callback({target:{matches:()=>false}});
 assert.equal(switchCount,1,'unrelated buttons never switch writing mode');
});

test('keyboard state follows viewport shrink and recovers without focus-only jumps',()=>{
 const start=viewportScript.indexOf('let lastNoteHeight=0,noteViewportFrame=0,restingNoteHeight=0;');
 const end=viewportScript.indexOf('const queueNoteViewportSync=',start);
 assert.ok(start>=0&&end>start,'actual editor viewport logic is present');
 const flags=new Set(),props={};
 let penMode=false;
 const focusedField={matches:()=>true},document={activeElement:null};
 const dlg={open:true,contains:el=>el===focusedField,
  classList:{toggle:(name,enabled)=>enabled?flags.add(name):flags.delete(name),contains:name=>name==='sv-smart-inking'&&penMode},
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
 penMode=true;
 sync();
 assert.ok(!flags.has('sv-note-keyboard-open'),'hybrid pen and keyboard state is impossible');
 penMode=false;
 sync();
 assert.ok(flags.has('sv-note-keyboard-open'),'typed text restores keyboard state');
 viewport.height=844;
 sync();
 assert.equal(flags.size,0,'dock returns after keyboard closes');
 viewport.height=525;
 document.activeElement=null;
 sync();
 assert.equal(flags.size,0,'unfocused editor does not show keyboard bar');
});
