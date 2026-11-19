const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const iphone=fs.readFileSync(path.join(root,'assets/seyveo-paper-iphone-tuning.css'),'utf8');
const confirm=fs.readFileSync(path.join(root,'assets/seyveo-ink-confirm.css'),'utf8');
const pearl=fs.readFileSync(path.join(root,'assets/seyveo-paper-pearl-theme.css'),'utf8');

test('iPhone Pearl palette and the actual Save button share the lower baseline',()=>{
 assert.match(iphone,/\.sv-paper-palette\s*\{\s*transform:translateY\(20px\)!important/);
 assert.match(iphone,/\.sv-paper-light-surface\s*>\s*#notePaperSave\.sv-ink-confirm\s*\{\s*bottom:calc\(env\(safe-area-inset-bottom,0px\) - 9px\)!important/);
 assert.doesNotMatch(iphone,/#notePaperSave\.sv-paper-save/,'obsolete selector must not return');
 assert.match(confirm,/#notePaperSave\.sv-ink-confirm\s*\{[\s\S]*?bottom:calc\(11px \+ env\(safe-area-inset-bottom,0px\)\)/);
 assert.match(pearl,/\.sv-paper-light-surface\s*>\s*#notePaperSave\.sv-ink-confirm/);
});

test('Pearl keeps the Calendar white action material without resizing Save',()=>{
 assert.match(pearl,/\.sv-paper-light-surface\s*>\s*#notePaperSave\.sv-ink-confirm\s*\{\s*background:#fff!important/);
 assert.match(pearl,/border:1px solid rgba\(34,43,54,\.09\)!important/);
 assert.match(confirm,/width:47px!important;\s*height:47px!important/);
 assert.match(pearl,/\.sv-paper-light-surface \.sv-paper-top #notePaperUndo:disabled svg\s*\{\s*opacity:\.78!important/);
 assert.match(pearl,/#notePaperPatternMenu :is\(\.sv-paper-layouts,\.sv-paper-shape-grid\) > button\s*\{\s*background:#f0f1f3!important/);
 assert.match(pearl,/\.sv-polish-segments\s*\{\s*background:#ededef!important/);
});
