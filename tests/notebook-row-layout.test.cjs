const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const layout=readFileSync(join(root,'assets/seyveo-notebook-list-v3.css'),'utf8');
const retired=readFileSync(join(root,'assets/seyveo-notebook-page.css'),'utf8');

test('the Notebook list has one fresh stylesheet and independent row classes',()=>{
 assert.match(html,/assets\/seyveo-notebook-list-v3\.css\?v=2/);
 assert.match(html,/assets\/seyveo-notebook-page\.css\?v=15/);
 assert.match(html,/card\.className='sv-nb3-row'/);
 assert.match(html,/open\.className='sv-nb3-open'/);
 assert.match(html,/thumbnail\.className='sv-nb3-thumb'/);
 assert.doesNotMatch(retired,/\.note-item\s*\{/,'old list card styles are retired');
 assert.doesNotMatch(retired,/\.note-paper-preview/,'old thumbnail styles are retired');
});

test('Notebook rows use full-width dividers without cards, frames, grey panels or rounded corners',()=>{
 assert.match(layout,/\#notesList\.notes-list\{[\s\S]*?padding:0!important/);
 assert.match(layout,/\.sv-nb3-row\{[\s\S]*?border-bottom:1px solid rgba\(60,60,67,\.10\)!important/);
 assert.match(layout,/\.sv-nb3-row\{[\s\S]*?border-radius:0!important;[\s\S]*?background:transparent!important/);
 assert.match(layout,/\.sv-nb3-content\{[\s\S]*?background:#fff!important/);
 assert.match(layout,/\.sv-nb3-swipe\{[\s\S]*?border-radius:0!important/);
});

test('saved ink is a compact single-row preview with dark and light backgrounds',()=>{
 assert.match(layout,/\.sv-nb3-open\{[\s\S]*?flex-direction:row!important/);
 assert.match(layout,/\.sv-nb3-thumb\{[\s\S]*?width:45px!important/);
 assert.match(layout,/\.sv-nb3-thumb\[data-paper-background="dark"\]\{\s*background:#202124!important/);
 assert.match(html,/thumbnail\.dataset\.paperBackground=note\.paper\.background==='dark'\?'dark':'light'/);
});
