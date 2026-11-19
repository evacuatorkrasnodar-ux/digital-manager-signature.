const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const dark=fs.readFileSync(path.join(root,'assets/seyveo-paper-outline.css'),'utf8');
const pearl=fs.readFileSync(path.join(root,'assets/seyveo-paper-pearl-theme.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('Graphite and Pearl selected tools never create circular overlays',()=>{
 assert.match(dark,/\.sv-paper-studio\[open\]:not\(\.sv-paper-light-surface\)[^\n]+data-sv-active="true"/);
 for(const style of [dark,pearl]){
  const active=style.match(/#svPaperNewDock > button\.sv-newdock-button\[data-sv-active="true"\]\{([^}]+)\}/);
  assert.ok(active,'active state is declared');
  assert.match(active[1],/background:transparent!important/);
  assert.match(active[1],/box-shadow:none!important/);
 }
});

test('Graphite responds during touch and respects reduced motion',()=>{
 assert.match(dark,/\.sv-newdock-button:not\(\[data-sv-active="true"\]\):active/);
 assert.match(dark,/\.sv-newdock-button\[data-sv-active="true"\]:active/);
 assert.match(dark,/transition:color \.16s ease,opacity \.16s ease!important/);
 assert.match(dark,/@media\(prefers-reduced-motion:reduce\)/);
});

test('both themes preserve capsule dimensions and distinct materials',()=>{
 assert.match(dark,/height:48px!important;[\s\S]*?background:#171719!important/);
 assert.match(dark,/width:40px!important;\s*height:40px!important/);
 assert.match(dark,/\.sv-paper-studio\[open\]:not\(\.sv-paper-light-surface\)/);
 assert.match(pearl,/\.sv-paper-light-surface[^\n]+#svPaperNewDock > button\.sv-newdock-button\[data-sv-active="true"\]/);
 assert.match(html,/assets\/seyveo-paper-outline\.css\?v=12/);
});
