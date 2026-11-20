const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const css=read('assets/seyveo-notebook-editor-v3.css');
const script=read('assets/seyveo-smart-note-ink.js');
const sayviMark=read('assets/seyveo-circular-interlace-mono.svg');

test('single Smart Note has scrollable keyboard toolbar with partial next action visible',()=>{
 assert.match(html,/seyveo-smart-note-ink\.js\?v=4/);
 assert.match(css,/\.sv-note-tools-compact\{[\s\S]*?display:flex!important;grid-template-columns:none!important;/);
 assert.match(css,/overflow-x:auto!important;overflow-y:hidden!important/);
 assert.match(css,/scrollbar-width:none/);
 assert.match(css,/\.sv-note-keyboard-open[\s\S]*?flex:0 0 50px!important/);
 assert.match(css,/--sv-dock-pearl-bg/);
 for(const action of ['text','table','eraser','more'])assert.match(script,new RegExp("create\\('"+action+"'"));
 assert.match(script,/bar\.insertBefore\(textBtn,check\)/);
 assert.match(script,/bar\.insertBefore\(tableBtn,bar\.querySelector\('\[data-note-tool="heading"\]'\)\)/);
});

test('both Smart Note dock surfaces reuse approved Home-dock pearl material',()=>{
 assert.match(html,/seyveo-notebook-editor-v3\.css\?v=8/);
 const pearl=css.slice(css.lastIndexOf('/* Light Smart Note dock:'));
 assert.match(pearl,/\.sv-note-tool-row\.sv-shared-dock::before/);
 assert.match(pearl,/\.sv-note-tool-row\.sv-shared-dock::after/);
 for(const token of ['border','bg','shadow','blur']){
  assert.match(pearl,new RegExp('--sv-dock-pearl-'+token));
 }
 assert.match(pearl,/data-theme="light"/);
});

test('navigation and every dropdown reuse Silver Mist with inline menu icons',()=>{
 const pearl=css.slice(css.lastIndexOf('/* One Silver Mist family'));
 for(const selector of ['button#noteReviewBack.sv-note-back-arrow','button#svNoteUndo.sv-note-nav-circle',
  '.sv-note-nav-actions .sv-note-action-pair','button#svNoteDone',
  '#svNoteTopMenu.sv-note-top-menu','#svNoteAttachmentMenu.sv-note-attachment-menu',
  '#svNoteFormatMenu.sv-note-format-menu']){
  assert.ok(pearl.includes(selector),`matches ${selector}`);
 }
 for(const token of ['--sv-dock-pearl-border','--sv-dock-pearl-bg','--sv-dock-pearl-shadow','--sv-dock-pearl-blur']){
  assert.ok(pearl.includes(token),`reuses ${token}`);
 }
 for(const action of ['copy','notes','paper','clear','print']){
  assert.match(html,new RegExp('data-sv-note-menu="'+action+'"[^>]*><svg[\\s\\S]*?</svg><span>'));
 }
 for(const fmt of ['heading','bold','italic','underline']){
  assert.match(html,new RegExp('data-note-format="'+fmt+'"[^>]*><svg[\\s\\S]*?</svg><span>'));
 }
 assert.match(pearl,/\.sv-note-keyboard-open[\s\S]*?box-shadow:var\(--sv-dock-pearl-shadow\)/);
});

test('typing and handwriting share ONE note ID, with vector ink persisted separately from text',()=>{
 assert.match(script,/canvas#svSmartNoteInkCanvas|ink\.id='svSmartNoteInkCanvas'/);
 assert.match(script,/setMode\('pen'\)/);
 assert.match(script,/setMode\('text',true\)/);
 assert.match(script,/editor\?\.ensureRecord\?\.\(\)/);
 assert.match(script,/\{\.\.\.n,inlineInk,updatedAt:Date\.now\(\)\}/);
 assert.match(script,/api\.putNotes\(next\)/);
 assert.match(script,/dlg\.addEventListener\('seyveo:smart-note-open'/);
 assert.match(html,/dlg\.dispatchEvent\(new CustomEvent\('seyveo:smart-note-open',\{detail:\{id\}\}\)\)/);
 assert.match(html,/else if\(note\.inlineInk\?\.strokes\?\.length\)openNoteReview\(note\.text,note\.id\)/);
 assert.doesNotMatch(script,/localStorage\.clear\(|\.removeItem\(/);
});

test('popovers keep their original nodes and work outside clipped toolbar',()=>{
 assert.match(script,/for\(const id of \['svNoteAttachmentMenu','svNoteFormatMenu'\]\)/);
 assert.match(script,/dlg\.append\(menu\)/);
 assert.match(css,/> :is\(#svNoteAttachmentMenu,#svNoteFormatMenu\):not\(\[hidden\]\)/);
});

test('resting dock never scrolls: Aa, pen, attachments and Sayvi stay visible',()=>{
 assert.match(css,/:not\(\.sv-note-keyboard-open\)[\s\S]*?grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/);
 assert.match(css,/:not\(\.sv-note-keyboard-open\)[\s\S]*?overflow:hidden!important;scroll-snap-type:none!important/);
 for(const action of ['text','sayvi'])assert.match(css,new RegExp('data-sv-smart-tool="'+action+'"'));
 assert.match(css,/data-note-tool="draw"/);
 assert.match(css,/data-note-tool="attachment"/);
 assert.match(script,/bar\.insertBefore\(draw,check\)/);
 assert.match(script,/bar\.insertBefore\(attach,check\)/);
 assert.match(script,/bar\.insertBefore\(sayviBtn,check\)/);
 assert.match(script,/bar\.insertBefore\(eraserBtn,check\)/);
 assert.match(css,/:not\(\.sv-note-keyboard-open\)[\s\S]*?\[data-note-tool="attachment"\]/);
 assert.match(css,/\.sv-note-keyboard-open[\s\S]*?width:calc\(100vw - 28px\)!important/);
});

test('Sayvi uses the original approved circular S instead of the old star',()=>{
 assert.match(css,/seyveo-circular-interlace-mono\.svg\?v=1/);
 assert.match(sayviMark,/aria-label="SEYVEO — переплетённые лепестки"/);
 assert.match(sayviMark,/M580 227L587 228/);
 assert.doesNotMatch(script,/class="sv-sayvi-symbol sv-smart-sayvi-icon"/);
});

test('three full-width paper templates persist on the same note and appear in reading mode',()=>{
 assert.match(script,/PAPER_STYLES=new Set\(\['plain','lined','grid'\]\)/);
 assert.match(script,/data-sv-paper-choice="plain"/);
 assert.match(script,/data-sv-paper-choice="lined"/);
 assert.match(script,/data-sv-paper-choice="grid"/);
 assert.match(script,/editor\?\.ensureRecord\?\.\(\)/);
 assert.match(script,/notePaperStyle:next/);
 assert.match(script,/dlg\.dataset\.svPaperStyle=paperStyle/);
 assert.match(html,/dlg\.dataset\.svPaperStyle=\['lined','grid'\]\.includes\(note\.notePaperStyle\)/);
 assert.match(css,/data-sv-paper-style="lined"/);
 assert.match(css,/data-sv-paper-style="grid"/);
 assert.match(css,/background-attachment:local/);
 assert.match(css,/border:0!important;border-radius:0!important;outline:0!important/);
 assert.doesNotMatch(script,/localStorage\.clear\(|removeItem\(/);
});

test('eraser and quick paper are only contextual ink tools',()=>{
 assert.match(script,/inkTools\.className='sv-smart-ink-tools'/);
 assert.match(script,/data-sv-ink-tool="eraser"/);
 assert.match(script,/data-sv-ink-tool="paper"/);
 assert.match(script,/inkTools\.hidden=next==='text'/);
 assert.match(css,/\.sv-smart-inking:not\(\.sv-note-keyboard-open\)/);
 assert.match(html,/data-sv-note-menu="paper"/);
});

test('Sayvi provides in-note edit actions, never redirects to chat',()=>{
 assert.match(script,/sayviPanel\.id='svSmartNoteSayviPanel'/);
 assert.match(script,/data-sv-sayvi-action="recognize"/);
 assert.match(script,/data-sv-sayvi-action="correct"/);
 assert.match(script,/data-sv-sayvi-action="smooth"/);
 assert.match(script,/data-sv-sayvi-action="format"/);
 assert.match(script,/createWorker\(\['rus','eng'\]/);
 assert.match(script,/fetch\('\/api\/seyveo-ask'/);
 assert.match(script,/sayviApply\.addEventListener\('click'/);
 assert.doesNotMatch(script,/chat\.open\(|location\.assign\(|note-handoff\.v1/);
 assert.match(css,/#svSmartNoteSayviPanel\.sv-smart-sayvi-panel:not\(\[hidden\]\)/);
});
