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
 assert.match(html,/action\('Удалить',\(\)=>\{[\s\S]*?window\.confirm\('Удалить запись\?/);
 assert.doesNotMatch(menu,/button\.innerHTML=svg\(kind\)/,'legacy SVG replacement must not inflate buttons');
 assert.match(menu,/function closeActions\(\)/);
});

test('expanded note actions are an inline 44px row with no huge image buttons',()=>{
 const strip=css.match(/#svWorkShell\[data-active="notes"\] #notesDialog #notesList \.note-more-options:not\(\[hidden\]\)\s*\{([^}]*)\}/)?.[1];
 assert.ok(strip);
 assert.match(strip,/display:grid!important/);
 assert.match(strip,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
 assert.match(strip,/overflow:visible!important/);
 const button=css.match(/#svWorkShell\[data-active="notes"\] #notesDialog #notesList \.note-more-options > button\s*\{([^}]*)\}/)?.[1];
 assert.ok(button);
 assert.match(button,/height:44px!important/);
 assert.match(button,/max-height:44px!important/);
 assert.match(button,/background:transparent!important/);
 assert.match(button,/font-size:12\.5px!important/);
 assert.match(css,/\.note-more-options > button svg\{[\s\S]*?max-width:19px!important/);
 assert.match(css,/\.note-more-options:has\(> button:nth-child\(4\)\)/);
 assert.match(html,/assets\/seyveo-notebook-page\.css\?v=10/);
 assert.match(html,/assets\/seyveo-note-menu-dismiss\.js\?v=3/);
});
