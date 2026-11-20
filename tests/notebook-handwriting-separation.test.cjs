const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const launcher=read('assets/seyveo-notebook-launch.js');
const handwriting=read('assets/seyveo-handwriting-page.js');
const style=read('assets/seyveo-handwriting-page.css');
const art=read('assets/notebook-paper.js');

test('four actions lead to independent writing, handwriting, scan and art editors',()=>{
 assert.match(launcher,/tiles\.append\(draw\)/);
 assert.match(launcher,/draw\.id='noteModeDraw'/);
 assert.match(launcher,/Холст и кисти/);
 assert.match(launcher,/noteModePaper:\{label:'От руки',run:\(\)=>window\.SEYVEO_HANDWRITING/);
 assert.match(launcher,/noteModeDraw:\{label:'Рисовать',run:\(\)=>window\.SEYVEO_PAPER/);
 assert.match(launcher,/id==='noteModePaper'\?'svHandwritingDialog'/);
 assert.match(launcher,/id==='noteModeDraw'\?'notePaperDialog'/);
});

test('new handwriting page is unframed, supports pen, eraser, undo and persistent strokes',()=>{
 assert.match(handwriting,/root\.id='svHandwritingDialog'/);
 assert.doesNotMatch(handwriting,/<h2 id="svHandwritingHeading">От руки<\/h2>/);
 assert.match(handwriting,/root\.setAttribute\('aria-label','Рукописный лист'\)/);
 assert.match(handwriting,/root\.showModal\(\)/);
 assert.match(handwriting,/data-hw-tool="pen"/);
 assert.match(handwriting,/data-hw-tool="eraser"/);
 assert.match(handwriting,/data-hw-action="undo"/);
 assert.match(handwriting,/pointerdown/);
 assert.match(handwriting,/pointermove/);
 assert.match(handwriting,/api\.putNotes\(next\)/);
 assert.match(handwriting,/noteKind:'handwriting',paper/);
 assert.match(style,/#svHandwritingDialog\.sv-handwriting-dialog\[open\]\{/);
 assert.match(style,/border:0!important;border-radius:0!important/);
 assert.match(style,/background:#fff!important/);
 assert.match(style,/#svHandwritingDialog #svHandwritingCanvas/);
});

test('existing art tablet and old saved artwork still use SEYVEO_PAPER',()=>{
 assert.match(art,/dialog=\$\('notePaperDialog'\)/);
 assert.match(art,/noteKind:'art'/);
 assert.match(html,/if\(note\.noteKind==='handwriting'\)window\.SEYVEO_HANDWRITING\?\.open\(note\)/);
 assert.match(html,/else if\(note\.paper\)window\.SEYVEO_PAPER\?\.open\(note\)/);
 assert.match(html,/window\.SEYVEO_PAPER\?\.preview\(thumbnail,note\.paper\)/);
 assert.match(html,/assets\/seyveo-handwriting-page\.js\?v=2/);
 assert.match(html,/assets\/seyveo-handwriting-page\.css\?v=2/);
});
