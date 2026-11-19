const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const dark=fs.readFileSync(path.join(root,'assets/seyveo-paper-outline.css'),'utf8');
const pearl=fs.readFileSync(path.join(root,'assets/seyveo-paper-pearl-theme.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('Graphite active tool has the same recessed shadow geometry as Pearl',()=>{
 assert.match(dark,/\.sv-paper-studio\[open\]:not\(\.sv-paper-light-surface\)[^\n]+data-sv-active="true"/);
 assert.match(dark,/box-shadow:inset 0 1\.5px 2px rgba\(0,0,0,\.45\),inset 0 -1px \.75px rgba\(255,255,255,\.11\)!important/);
 assert.match(pearl,/box-shadow:inset 0 1\.5px 2px rgba\(31,42,58,\.11\),inset 0 -1px \.75px rgba\(255,255,255,\.34\)!important/);
});

test('Graphite responds during touch and respects reduced motion',()=>{
 assert.match(dark,/\.sv-newdock-button:not\(\[data-sv-active="true"\]\):active/);
 assert.match(dark,/\.sv-newdock-button\[data-sv-active="true"\]:active/);
 assert.match(dark,/transition:background-color \.16s ease,box-shadow \.16s ease!important/);
 assert.match(dark,/@media\(prefers-reduced-motion:reduce\)/);
});

test('only dark button material changes; capsule dimensions and Pearl stay intact',()=>{
 assert.match(dark,/height:48px!important;[\s\S]*?background:#171719!important/);
 assert.match(dark,/width:40px!important;\s*height:40px!important/);
 assert.match(dark,/\.sv-paper-studio\[open\]:not\(\.sv-paper-light-surface\)/);
 assert.match(pearl,/\.sv-paper-light-surface[^\n]+#svPaperNewDock > button\.sv-newdock-button\[data-sv-active="true"\]/);
 assert.match(html,/assets\/seyveo-paper-outline\.css\?v=12/);
});
