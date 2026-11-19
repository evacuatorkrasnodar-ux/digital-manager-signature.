const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'assets/seyveo-notebook-list-clean-v4.css'),'utf8');
const header=readFileSync(join(root,'assets/seyveo-notebook-page.css'),'utf8');

test('Notebook saved-page generation 4 has no legacy list container or list stylesheet',()=>{
 assert.match(html,/id="notesList" class="sv-note-clean-list" data-list-generation="4"/);
 assert.match(html,/assets\/seyveo-notebook-list-clean-v4\.css\?v=4/);
 assert.doesNotMatch(html,/assets\/seyveo-notebook-list-v3\.css/);
 assert.equal(existsSync(join(root,'assets/seyveo-notebook-list-v3.css')),false);
 assert.match(html,/card\.className='sv-nb4-note'/);
 assert.match(html,/open\.className='sv-nb4-open'/);
 assert.match(html,/thumbnail\.className='sv-nb4-preview'/);
 assert.doesNotMatch(header,/\.note-item\s*\{|\.note-paper-preview/);
});

test('entire iPhone saved-page canvas and list have no outside frame or decoration',()=>{
 assert.match(css,/--sv-nb-edge:7px;/);
 assert.match(css,/margin-inline:calc\(0px - var\(--sv-nb-edge\)\)!important/);
 assert.match(css,/@media\(max-width:355px\)/);
 assert.match(css,/\> #notesDialog\.sv-notebook-content\[open\]\{[\s\S]*?border:0!important;border-radius:0!important;outline:0!important/);
 assert.match(css,/#notesList\.sv-note-clean-list\{[\s\S]*?border:0!important;border-radius:0!important;outline:0!important/);
 assert.match(css,/#notesList\.sv-note-clean-list::after\{\s*content:none!important;display:none!important/);
 assert.match(css,/\.sv-nb4-note\{[\s\S]*?border:0!important;border-top:0!important;border-bottom:0!important/);
 assert.match(css,/\.sv-nb4-note::after\{\s*content:none!important;display:none!important/);
 assert.match(css,/\.sv-nb4-front\{[\s\S]*?background:#fff!important;background-image:none!important;box-shadow:none!important/);
 assert.doesNotMatch(css,/border-bottom:1px solid|border-top:1px solid/);
});

test('saved paper is a compact full-width row with correct light or dark preview',()=>{
 assert.match(css,/\.sv-nb4-note\{[\s\S]*?margin:0!important;padding:0!important/);
 assert.match(css,/\.sv-nb4-open\{[\s\S]*?padding:4px 0 4px 16px!important/);
 assert.match(css,/\.sv-nb4-dots\{[\s\S]*?margin:0 8px 0 0!important/);
 assert.match(css,/\.sv-nb4-remove\{\s*right:0!important/);
 assert.match(css,/\.sv-nb4-open\{[\s\S]*?gap:10px!important/);
 assert.match(css,/\.sv-nb4-front\{[\s\S]*?grid-template-columns:minmax\(0,1fr\) 50px!important/);
 assert.match(css,/\.sv-nb4-preview\{[\s\S]*?width:45px!important/);
 assert.match(css,/\.sv-nb4-preview\[data-paper-background="dark"\]\{\s*background:#202124!important/);
 assert.match(css,/\.sv-nb4-preview\[data-paper-background="light"\]\{[\s\S]*?filter:brightness\(\.96\)!important/);
 assert.match(html,/thumbnail\.dataset\.paperBackground=note\.paper\.background==='dark'\?'dark':'light'/);
});
