const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'assets/seyveo-notebook-list-clean-v4.css'),'utf8');
const menu=readFileSync(join(root,'assets/seyveo-note-menu-dismiss.js'),'utf8');

test('the fresh Notebook row retains its original real actions and three dots',()=>{
 assert.match(html,/more\.className='sv-nb4-dots'/);
 assert.match(html,/action\('Поделиться',\(\)=>\{shareNote\(note\)\}\)/);
 assert.match(html,/action\('Распечатать',\(\)=>\{printNote\(note\)\}\)/);
 assert.match(html,/action\('Удалить',\(\)=>deleteNoteWithUndo\(note\),'sv-nb4-danger'\)/);
 assert.match(css,/\.sv-nb4-dots\{[\s\S]*?display:grid!important/);
 assert.match(css,/\.sv-nb4-dots\{[\s\S]*?opacity:1!important;visibility:visible!important/);
 assert.match(menu,/list\.querySelectorAll\('\.sv-nb4-note'\)/);
 assert.match(html,/assets\/seyveo-note-menu-dismiss\.js\?v=5/);
});

test('iPhone touch swipe opens the two original actions without blocking vertical scroll',()=>{
 assert.match(html,/swipe\.className='sv-nb4-slide'/);
 assert.match(html,/swipeMore\.className='sv-nb4-more'/);
 assert.match(html,/swipeDelete\.className='sv-nb4-remove'/);
 assert.match(css,/\.sv-nb4-slide\.is-open\{\s*--note-swipe-offset:-168px/);
 assert.match(css,/\.sv-nb4-front\{[\s\S]*?touch-action:pan-y!important/);
 assert.match(css,/\.sv-nb4-remove\{\s*right:0!important;background:#ff3b30!important/);
 assert.match(html,/controls\.addEventListener\('touchstart'/);
 assert.match(html,/controls\.addEventListener\('touchmove'/);
 assert.match(html,/controls\.addEventListener\('pointermove'/);
});

test('Undo deletion keeps notes and attachments recoverable for the grace period',()=>{
 assert.match(html,/swipeDelete\.addEventListener\('click',\(\)=>deleteNoteWithUndo\(note\)\)/);
 assert.match(html,/pendingNoteDeletion=\{note,index,timer:window\.setTimeout\(settleNoteDeletion,6500\)\}/);
 assert.match(html,/notes\.splice\(Math\.min\(pending\.index,notes\.length\),0,pending\.note\)/);
 assert.match(html,/function settleNoteDeletion\(\)\{[\s\S]*?deleteForNote\(pending\.note\.id\)/);
 assert.match(css,/#svNoteUndoToast\[hidden\]\{display:none!important\}/);
});
