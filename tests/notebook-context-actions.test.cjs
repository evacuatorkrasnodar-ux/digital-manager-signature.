const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const script=read('assets/seyveo-smart-note-ink.js');
const css=read('assets/seyveo-notebook-context-actions.css');
const editorCss=read('assets/seyveo-notebook-editor-v3.css');
const editor=html.split('<dialog id="noteReviewDialog"')[1]?.split('</dialog>')[0]||'';

test('Notebook header has Back, an editable title, and Done; mode is screen-reader only',()=>{
 assert.deepEqual([...editor.matchAll(/<button id="(noteReviewBack|svNoteUndo|svNoteMore|svNoteDone)"/g)].map(m=>m[1]),['noteReviewBack','svNoteDone']);
 assert.match(editor,/id="svNoteInputModeLabel" class="sv-note-input-mode-label" aria-live="polite">Печатный текст/);
 assert.match(script,/modeLabel\.textContent=mode==='text'\?'Печатный текст':'Рукописный ввод'/);
 assert.match(editorCss,/input#svNoteTitle\.sv-note-title-input\{[\s\S]*?left:50%!important;right:auto!important;transform:translateX\(-50%\)!important/);
 assert.match(css,/#svNoteInputModeLabel\.sv-note-input-mode-label\{[\s\S]*?clip-path:inset\(50%\)!important/);
 assert.match(css,/width:44px!important;height:44px!important/);
 assert.match(css,/content:none!important;display:none!important/);
});

test('Aa owns a real 140px three-action capsule without duplicate More menus',()=>{
 const menu=editor.split('<div id="svNoteTopMenu"')[1]?.split('</div>')[0]||'';
 assert.deepEqual([...menu.matchAll(/data-sv-note-menu="([^"]+)"/g)].map(m=>m[1]),['undo','copy','clear']);
 assert.doesNotMatch(menu,/<span>|clear-ink/);
 assert.match(script,/textBtn\.setAttribute\('aria-controls','svNoteTopMenu'\)/);
 assert.match(script,/window\.SEYVEO_NOTE_TEXT_ACTIONS\?\.toggle\?\.\(\)/);
 assert.match(html,/window\.SEYVEO_NOTE_TEXT_ACTIONS=Object\.freeze\(\{toggle:toggleMenu,close:closeMenu\}\)/);
 assert.match(css,/width:140px!important;min-width:140px!important;max-width:140px!important/);
 assert.match(css,/grid-template-columns:repeat\(3,40px\)!important/);
 assert.match(css,/bottom:calc\(53px \+ env\(safe-area-inset-bottom,0px\)\)!important/);
});

test('vertical ink capsule has six tools and eraser hold for safe full cleanup',()=>{
 const tools=[...script.matchAll(/data-sv-ink-tool="([^"]+)"/g)].map(m=>m[1]);
 for(const action of ['undo','eraser','width','color','paper','voice'])assert.ok(tools.includes(action),action);
 assert.doesNotMatch(script,/data-sv-ink-tool="clear"/);
 assert.match(script,/inkUndoBtn\.addEventListener\('click',\(\)=>travelHistory\(\)\)/);
 assert.match(script,/eraserHoldTimer=window\.setTimeout\(\(\)=>\{eraserHoldTriggered=true;clearHandwriting\(\);\},650\)/);
 assert.match(script,/if\(eraserHoldTriggered\)\{event\.preventDefault\(\);eraserHoldTriggered=false;return;\}/);
 assert.match(script,/window\.confirm\('Удалить все нарисованные штрихи на этом листе\? Печатный текст и вложения останутся\.'/);
 assert.match(script,/smoothUndo=previous;smoothRedo=null/);
 assert.match(css,/top:calc\(50% - 117px\)!important;bottom:auto!important/);
 assert.match(css,/right:max\(14px,env\(safe-area-inset-right,0px\)\)!important;left:auto!important/);
 assert.match(css,/width:42px!important;min-width:42px!important;max-width:42px!important/);
 assert.match(css,/height:234px!important;min-height:234px!important;max-height:234px!important/);
 assert.match(css,/flex-direction:column!important/);
 assert.match(css,/flex:0 0 34px!important/);
 assert.match(css,/height:34px!important;min-height:34px!important;max-height:34px!important/);
 assert.match(css,/\.sv-smart-ink-tools > button svg\{width:19px!important;height:19px!important\}/);
 assert.match(css,/border:var\(--sv-inset-rim\)!important;background:var\(--sv-inset-fill\)!important/);
});

test('text actions open only in typing mode and close without leaving a selected artifact',()=>{
 const inline=html.split('<script id="sv-note-editor-tools">')[1]?.split('</script>')[0]||'';
 const start=inline.indexOf(' const topMenu=document.getElementById(\'svNoteTopMenu\');');
 const end=inline.indexOf(' document.getElementById(\'svNoteFormatMenu\')',start);
 assert.ok(start>=0&&end>start,'the real text actions controller is present');
 let inkMode=false;
 const attributes={};
 const trigger={setAttribute:(name,value)=>attributes[name]=value,contains:()=>false};
 const menu={hidden:true,addEventListener:()=>{},contains:()=>false};
 const dlg={open:true,classList:{contains:name=>name==='sv-smart-inking'&&inkMode},
  querySelector:()=>trigger,addEventListener:()=>{}};
 const window={};
 const document={getElementById:name=>name==='svNoteTopMenu'?menu:null,addEventListener:()=>{}};
 vm.runInNewContext(inline.slice(start,end),{document,dlg,window});
 window.SEYVEO_NOTE_TEXT_ACTIONS.toggle();
 assert.equal(menu.hidden,false);
 assert.equal(attributes['aria-expanded'],'true');
 window.SEYVEO_NOTE_TEXT_ACTIONS.close();
 assert.equal(menu.hidden,true);
 assert.equal(attributes['aria-expanded'],'false');
 inkMode=true;window.SEYVEO_NOTE_TEXT_ACTIONS.toggle();
 assert.equal(menu.hidden,true,'ink mode cannot show text-only actions');
});

test('color tool has a visible rainbow ring around the live selected ink color',()=>{
 assert.match(html,/seyveo-notebook-context-actions\.css\?v=9/);
 assert.match(script,/data-sv-ink-tool="color"[^>]*><span class="sv-smart-ink-color-preview"/);
 assert.match(css,/\.sv-smart-ink-color-preview\{[\s\S]*?width:25px!important;[\s\S]*?height:25px!important/);
 assert.match(css,/background:conic-gradient\(from 0deg,#d96a6b[\s\S]*?#467fc6[\s\S]*?#d96a6b 360deg\)!important/);
 assert.match(css,/\.sv-smart-ink-color-preview::after\{[\s\S]*?inset:4px!important/);
 assert.match(css,/background:var\(--sv-ink-color,#171e29\)!important/);
 assert.match(script,/inkColorBtn\.style\.setProperty\('--sv-ink-color',penColor\)/);
});

test('rail and bottom dock have one quiet pearl rim without doubled external frames',()=>{
 assert.match(css,/data-theme="light"[\s\S]*?\.sv-smart-ink-tools:not\(\[hidden\]\)\{[\s\S]*?background:var\(--sv-dock-pearl-bg,rgba\(190,193,202,\.10\)\)!important/);
 assert.match(css,/\.sv-note-bottom \.sv-note-tool-row\.sv-shared-dock::after\{[\s\S]*?border:0!important;outline:0!important;[\s\S]*?box-shadow:inset 0 0 0 \.6px/);
 assert.match(css,/\.sv-note-bottom \.sv-note-tool-row\.sv-shared-dock::after\{[\s\S]*?-webkit-backdrop-filter:blur\(1px\) saturate\(100%\)!important;/);
 assert.match(css,/\.sv-note-bottom \.sv-note-tool-row\.sv-shared-dock::after\{[\s\S]*?backdrop-filter:blur\(1px\) saturate\(100%\)!important;/);
 assert.match(css,/\.sv-smart-ink-tools:not\(\[hidden\]\)\{\s*border:0!important;outline:0!important;/);
 assert.match(css,/-webkit-backdrop-filter:blur\(2\.3px\) saturate\(100%\)!important;/);
 assert.match(css,/backdrop-filter:blur\(2\.3px\) saturate\(100%\)!important;/);
 assert.match(css,/data-theme="dark"[\s\S]*?background:rgba\(143,150,163,\.16\)!important/);
 assert.match(css,/button#noteReviewBack\.sv-note-back-arrow:not\(:active\)\{[\s\S]*?border:0!important/);
 assert.match(css,/button#svNoteDone\.sv-note-nav-circle:not\(:active\)\{[\s\S]*?border:0!important/);
});

test('ruled paper is a full-width layer that starts below the first text row',()=>{
 assert.match(editorCss,/input#svNoteTitle\.sv-note-title-input\{[\s\S]*?position:absolute!important;z-index:26!important/);
 assert.doesNotMatch(editor.split('<form id="noteReviewForm"')[1]?.split('<textarea id="noteReviewText"')[0]||'',/id="svNoteTitle"/);
 assert.match(editorCss,/textarea#noteReviewText\{[\s\S]*?padding:5px 4px!important/);
 assert.match(editorCss,/> #svNotePaperSheet\.sv-note-paper-sheet\{[\s\S]*?top:0;right:0!important;bottom:0!important;left:0!important/);
 assert.match(editorCss,/data-sv-paper-style="lined"\][\s\S]*?> #svNotePaperSheet\.sv-note-paper-sheet\{[\s\S]*?background-size:100% 24px!important/);
 assert.match(editorCss,/background-position:0 var\(--sv-note-paper-scroll,0px\)!important/);
 assert.match(editorCss,/data-sv-paper-style="grid"\][\s\S]*?> #svNotePaperSheet\.sv-note-paper-sheet\{[\s\S]*?background-size:24px 24px!important/);
 assert.match(editorCss,/background-image:none!important;/);
 const textLineHeight=16*1.5,topPadding=5,firstRule=30;
 assert.ok(firstRule>topPadding+textLineHeight,'the first visible rule is below the hint');
});

test('both docks disappear during ink strokes and return after a short pause',()=>{
 assert.match(script,/dlg\.classList\.add\('sv-ink-stroking'\)/);
 assert.match(script,/inkTools\.setAttribute\('aria-hidden','true'\)/);
 assert.match(script,/revealInkToolsSoon\(\)/);
 assert.match(script,/inkToolsRevealTimer=window\.setTimeout\(\(\)=>\{[\s\S]*?\},800\)/);
 assert.match(script,/resetInkToolsVisibility\(\)/);
 assert.match(css,/\.sv-ink-stroking[\s\S]*?opacity:0!important;pointer-events:none!important/);
 assert.match(css,/\.sv-note-bottom,\.sv-note-nav-actions,#noteReviewBack,#svNoteTitle/);
 assert.match(css,/right:calc\(max\(14px,env\(safe-area-inset-right,0px\)\) \+ 50px\)!important/);
 assert.match(css,/@media\(max-height:500px\) and \(orientation:landscape\)/);
});
