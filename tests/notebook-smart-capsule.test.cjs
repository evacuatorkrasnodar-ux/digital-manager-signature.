const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const css=read('assets/seyveo-notebook-editor-v3.css');
const script=read('assets/seyveo-smart-note-ink.js');

test('single Smart Note has scrollable keyboard toolbar with partial next action visible',()=>{
 assert.match(html,/seyveo-smart-note-ink\.js\?v=1/);
 assert.match(css,/\.sv-note-tools-compact\{[\s\S]*?display:flex!important;grid-template-columns:none!important;/);
 assert.match(css,/overflow-x:auto!important;overflow-y:hidden!important/);
 assert.match(css,/scrollbar-width:none/);
 assert.match(css,/\.sv-note-keyboard-open[\s\S]*?flex:0 0 50px!important/);
 assert.match(css,/--sv-dock-pearl-bg/);
 for(const action of ['text','table','eraser','more'])assert.match(script,new RegExp("create\\('"+action+"'"));
 assert.match(script,/bar\.insertBefore\(textBtn,check\)/);
 assert.match(script,/bar\.insertBefore\(tableBtn,attach\)/);
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
