const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const editor=html.match(/<style id="sv-note-editor-v2">([\s\S]*?)<\/style>/)?.[1];
assert.ok(editor,'Notebook editor styles must remain present');

test('white theme uses a clean full-screen canvas with no frame',()=>{
 assert.match(editor,/:root\[data-theme="light"\] #noteReviewDialog\.note-review-dialog\[open\]\{\s*background:#fff!important;\s*background-color:#fff!important;\s*background-image:none!important;/);
 assert.match(editor,/#noteReviewDialog\.note-review-dialog\[open\]\{box-sizing:border-box!important;position:fixed!important;[\s\S]*?border:0!important;border-radius:0!important;/);
 assert.match(editor,/#noteReviewDialog\.note-review-dialog\[open\]\{\s*background:var\(--bg\)!important;/,'dark palette can still use its own surface');
});

test('title and body have subdued, legible placeholders without input outlines',()=>{
 assert.match(editor,/font-size:22px!important;\s*font-weight:550!important;/);
 assert.match(editor,/#svNoteTitle\.sv-note-title-input::placeholder\{\s*color:rgba\(54,63,72,\.67\)!important;/);
 assert.match(editor,/#noteReviewText::placeholder\{\s*color:rgba\(75,85,95,\.57\)!important;/);
 assert.match(editor,/#noteReviewText\{[\s\S]*?border:0!important;border-radius:0!important;/);
});

test('mobile editor dock has 60px surfaces and accessible new-note control',()=>{
 const footer=editor.slice(editor.indexOf('/* Notebook footer parity with the approved 60px Home dock.'));
 assert.match(footer,/\.sv-note-tool-row\.sv-shared-dock\{[\s\S]*?height:60px!important;min-height:60px!important;/);
 assert.match(footer,/\.sv-note-tool-row\.sv-shared-dock::before\{[\s\S]*?height:60px!important;/);
 assert.match(footer,/\.sv-note-tool-row\.sv-shared-dock::after\{[\s\S]*?width:60px!important;height:60px!important;/);
 assert.match(footer,/\.sv-note-draw-standalone\{[\s\S]*?width:60px!important;min-width:60px!important;max-width:60px!important;/);
 assert.match(html,/<button[^>]*id="svNoteNewStandalone"/);
});
