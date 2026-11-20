const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/seyveo-notebook-editor-v3.css'),'utf8');

test('light and dark editor use one full-screen background, without a page frame',()=>{
 assert.match(css,/:root\[data-theme="light"\] body #noteReviewDialog\{\s*--note-page:#fff;/);
 assert.match(css,/:root\[data-theme="dark"\] body #noteReviewDialog\{\s*--note-page:#111214;/);
 assert.match(css,/dialog#noteReviewDialog\.notes-dialog\.note-review-dialog\[open\]\{[\s\S]*?width:100vw!important;[\s\S]*?border:0!important;border-radius:0!important;outline:0!important;[\s\S]*?box-shadow:none!important;[\s\S]*?background:var\(--note-page,#fff\)!important;/);
 assert.doesNotMatch(html,/<style id="sv-note-editor-v2"/);
});

test('title and body have readable placeholders and no nested card',()=>{
 assert.match(css,/input#svNoteTitle\.sv-note-title-input\{[\s\S]*?border:0!important;border-radius:0!important;outline:0!important;/);
 assert.match(css,/input#svNoteTitle::placeholder\{color:var\(--note-title\)!important;opacity:1!important\}/);
 assert.match(css,/textarea#noteReviewText\{[\s\S]*?border:0!important;border-radius:0!important;outline:0!important;/);
 assert.match(css,/textarea#noteReviewText::placeholder\{color:var\(--note-placeholder\)!important;opacity:1!important\}/);
 assert.doesNotMatch(html.split('<dialog id="noteReviewDialog"')[1].split('</dialog>')[0],/sv-note-document-capsule/);
});

test('resting dock keeps 60px capsule and accessible separate note button',()=>{
 assert.match(css,/\.sv-note-tool-row\.sv-shared-dock::before,[\s\S]*?\.sv-note-tool-row\.sv-shared-dock::after\{[\s\S]*?height:60px!important;/);
 assert.match(css,/\.sv-note-tool-row\.sv-shared-dock::after\{\s*left:var\(--note-right\)!important;right:auto!important;width:60px!important;/);
 assert.match(css,/\.sv-note-tool-row\.sv-shared-dock>\.sv-note-draw-standalone\{[\s\S]*?width:60px!important;min-width:60px!important;max-width:60px!important;/);
 assert.match(html,/<button id="svNoteNewStandalone" class="sv-note-draw-standalone" type="button"[^>]*aria-label="Создать новую заметку"/);
});

test('no footer sheet: editor reserves safe space and dock floats transparently over one page',()=>{
 assert.match(css,/form#noteReviewForm\.sv-note-editor\{[\s\S]*?padding:0 0 calc\(70px \+ env\(safe-area-inset-bottom,0px\)\)!important;/);
 assert.match(css,/\.sv-note-bottom\{[\s\S]*?position:absolute!important;[\s\S]*?background:transparent!important;background-image:none!important;/);
 assert.match(css,/\.sv-note-bottom::before,[\s\S]*?\.sv-note-bottom::after\{[\s\S]*?content:none!important;display:none!important;/);
 assert.match(css,/:root\[data-theme="light"\]:has\(dialog#noteReviewDialog\[open\]\)/);
});
