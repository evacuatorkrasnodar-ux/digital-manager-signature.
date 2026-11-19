const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const menu=fs.readFileSync(path.join(root,'assets/seyveo-note-menu-dismiss.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/seyveo-notebook-page.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('three-dot actions keep their actual labels and original click handlers',()=>{
 assert.match(html,/action\('Поделиться',\(\)=>\{shareNote\(note\)\}\)/);
 assert.match(html,/action\('Распечатать',\(\)=>\{printNote\(note\)\}\)/);
 assert.match(html,/action\('Удалить',\(\)=>deleteNoteWithUndo\(note\),'note-delete'\)/);
 assert.doesNotMatch(menu,/button\.innerHTML=svg\(kind\)/,'legacy SVG replacement must not inflate buttons');
 assert.match(menu,/function closeActions\(\)/);
});

test('three-dot actions are a compact iOS popover, never a new full-width row',()=>{
 const strip=css.match(/#svWorkShell\[data-active="notes"\] #notesDialog #notesList \.note-more-options:not\(\[hidden\]\)\s*\{([^}]*)\}/)?.[1];
 assert.ok(strip);
 assert.match(strip,/display:flex!important/);
 assert.match(strip,/position:absolute!important/);
 assert.match(strip,/width:190px!important/);
 assert.match(strip,/border-radius:15px!important/);
 const button=css.match(/#svWorkShell\[data-active="notes"\] #notesDialog #notesList \.note-more-options > button\s*\{([^}]*)\}/)?.[1];
 assert.ok(button);
 assert.match(button,/height:42px!important/);
 assert.match(button,/max-height:42px!important/);
 assert.match(button,/background:transparent!important/);
 assert.match(button,/font-size:14px!important/);
 assert.match(css,/\.note-more-options > button svg\{[\s\S]*?max-width:19px!important/);
 assert.match(html,/assets\/seyveo-notebook-page\.css\?v=14/);
 assert.match(html,/assets\/seyveo-note-menu-dismiss\.js\?v=3/);
});

test('iPhone swipe reveals a red delete action while keeping normal taps and vertical scrolling',()=>{
 assert.match(html,/const swipe=document\.createElement\('div'\);swipe\.className='note-swipe-shell'/);
 assert.match(html,/controls\.addEventListener\('touchstart'/);
 assert.match(html,/controls\.addEventListener\('touchmove'/);
 assert.match(html,/controls\.addEventListener\('touchend',finishSwipe/);
 assert.match(html,/Math\.abs\(dy\)>9&&Math\.abs\(dy\)>Math\.abs\(dx\)/);
 assert.match(css,/\.note-swipe-shell\.is-open\{\s*--note-swipe-offset:-168px/);
 assert.match(css,/\.note-swipe-delete\{\s*right:0!important;\s*background:#FF3B30!important/);
 assert.match(css,/\.note-swipe-more\{\s*right:84px!important/);
});

test('iPhone hides the permanent dots, with actions accessible only on a swipe',()=>{
 assert.match(html,/swipeMore\.className='note-swipe-more'/);
 assert.match(html,/swipeMore\.addEventListener\('click',\(\)=>toggleActions\(true\)\)/);
 assert.match(html,/swipe\.append\(swipeMore,swipeDelete,controls\)/);
 assert.match(css,/@media\(max-width:600px\), \(pointer:coarse\)\{[\s\S]*?\.note-more-button\{\s*display:none!important/);
 assert.match(css,/\.note-more-options > \.note-delete\{\s*display:none!important/);
 assert.match(css,/\.note-swipe-shell\{[\s\S]*?border-radius:0!important/);
 assert.match(css,/\.note-swipe-delete,\.note-swipe-more\)\{[\s\S]*?opacity:0!important;\s*pointer-events:none!important/);
});

test('swiping works with mouse or pen and Safari explicitly owns only horizontal movement',()=>{
 assert.match(html,/controls\.addEventListener\('pointerdown'/);
 assert.match(html,/controls\.addEventListener\('pointermove'/);
 assert.match(html,/controls\.addEventListener\('pointerup',finishPointerSwipe\)/);
 assert.match(html,/event\.pointerType==='touch'\|\|event\.button!==0/);
 assert.match(html,/controls\.setPointerCapture\(event\.pointerId\)/);
 assert.match(html,/if\(event\.cancelable\)event\.preventDefault\(\)/);
 assert.match(html,/\},\{passive:false\}\);/);
 assert.match(html,/swipe\.classList\.toggle\('is-open',offset<-48\)/);
});

test('swipe and menu deletion both offer a short undo without destroying attachments immediately',()=>{
 assert.match(html,/swipeDelete\.addEventListener\('click',\(\)=>deleteNoteWithUndo\(note\)\)/);
 assert.match(html,/pendingNoteDeletion=\{note,index,timer:window\.setTimeout\(settleNoteDeletion,6500\)\}/);
 assert.match(html,/undo\.addEventListener\('click',[\s\S]*?notes\.splice\(Math\.min\(pending\.index,notes\.length\),0,pending\.note\)/);
 assert.match(html,/function settleNoteDeletion\(\)\{[\s\S]*?deleteForNote\(pending\.note\.id\)/);
 assert.doesNotMatch(html,/window\.confirm\('Удалить запись\?/);
 assert.match(css,/#svNoteUndoToast\[hidden\]\{display:none!important\}/);
});
