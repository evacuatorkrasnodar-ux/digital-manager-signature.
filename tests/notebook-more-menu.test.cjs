const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const menu=fs.readFileSync(path.join(root,'assets/seyveo-note-menu-dismiss.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/seyveo-notebook-list-v3.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('three-dot actions keep their labels, click handlers, and iPhone fallback',()=>{
 assert.match(html,/action\('Поделиться',\(\)=>\{shareNote\(note\)\}\)/);
 assert.match(html,/action\('Распечатать',\(\)=>\{printNote\(note\)\}\)/);
 assert.match(html,/action\('Удалить',\(\)=>deleteNoteWithUndo\(note\),'sv-nb3-danger'\)/);
 assert.match(html,/more\.className='sv-nb3-menu-trigger'/);
 assert.match(menu,/function closeActions\(\)/);
 assert.match(menu,/\.sv-nb3-menu-trigger,\.sv-nb3-more-action/);
 assert.doesNotMatch(css,/\.sv-nb3-menu-trigger\s*\{\s*display:none/);
 assert.doesNotMatch(css,/\.sv-nb3-popover > \.sv-nb3-danger\s*\{\s*display:none/);
});

test('three-dot actions are a compact iOS popover rather than a second card',()=>{
 const strip=css.match(/\.sv-nb3-popover:not\(\[hidden\]\)\s*\{([^}]*)\}/)?.[1];
 assert.ok(strip);
 assert.match(strip,/display:flex!important/);
 assert.match(strip,/position:absolute!important/);
 assert.match(strip,/width:190px!important/);
 assert.match(strip,/border-radius:13px!important/);
 const button=css.match(/\.sv-nb3-popover > button\s*\{([^}]*)\}/)?.[1];
 assert.ok(button);
 assert.match(button,/height:42px!important/);
 assert.match(button,/background:transparent!important/);
 assert.match(button,/font:500 14px/);
 assert.match(html,/assets\/seyveo-notebook-list-v3\.css\?v=2/);
 assert.match(css,/\.sv-nb3-menu-trigger\{[\s\S]*?visibility:visible!important/);
 assert.match(css,/\.sv-nb3-menu-trigger svg\{[\s\S]*?width:21px!important/);
 assert.match(html,/<circle cx="5" cy="12" r="1\.75"\/>/);
 assert.match(html,/assets\/seyveo-note-menu-dismiss\.js\?v=4/);
});

test('iPhone swipe reveals the red delete action while preserving vertical scrolling',()=>{
 assert.match(html,/const swipe=document\.createElement\('div'\);swipe\.className='sv-nb3-swipe'/);
 assert.match(html,/controls\.addEventListener\('touchstart'/);
 assert.match(html,/controls\.addEventListener\('touchmove'/);
 assert.match(html,/controls\.addEventListener\('touchend',finishSwipe/);
 assert.match(html,/Math\.abs\(dy\)>9&&Math\.abs\(dy\)>Math\.abs\(dx\)/);
 assert.match(css,/\.sv-nb3-swipe\.is-open\{\s*--note-swipe-offset:-168px/);
 assert.match(css,/\.sv-nb3-delete\{right:0!important;background:#FF3B30!important/);
 assert.match(css,/\.sv-nb3-more-action\{right:84px!important/);
 assert.match(css,/\.sv-nb3-content\{[\s\S]*?touch-action:pan-y!important/);
});

test('swipe and menu deletion offer Undo without immediately removing attachments',()=>{
 assert.match(html,/swipeMore\.className='sv-nb3-more-action'/);
 assert.match(html,/swipeDelete\.addEventListener\('click',\(\)=>deleteNoteWithUndo\(note\)\)/);
 assert.match(html,/pendingNoteDeletion=\{note,index,timer:window\.setTimeout\(settleNoteDeletion,6500\)\}/);
 assert.match(html,/notes\.splice\(Math\.min\(pending\.index,notes\.length\),0,pending\.note\)/);
 assert.match(html,/function settleNoteDeletion\(\)\{[\s\S]*?deleteForNote\(pending\.note\.id\)/);
 assert.match(css,/#svNoteUndoToast\[hidden\]\{display:none!important\}/);
});
