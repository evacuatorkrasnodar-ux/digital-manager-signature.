const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const css=read('assets/seyveo-universal-dock-inset.css');
const glass=read('assets/seyveo-dock-active-glass.js');
const glassCss=read('assets/seyveo-dock-active-glass.css');

test('one 52px circular inset material reaches every dock family',()=>{
 assert.match(html,/seyveo-universal-dock-inset\.css\?v=1/);
 assert.ok(html.lastIndexOf('seyveo-universal-dock-inset.css')>html.lastIndexOf('seyveo-notebook-editor-v3.css'),'inset standard is last');
 assert.match(css,/--sv-inset-rim:1px solid rgba\(255,255,255,\.30\)/);
 assert.match(css,/--sv-inset-depth:inset 0 2\.1px 3\.2px/);
 for(const name of ['seyveo-music-dock','seyveo-browser-dock','sv-note-tools-compact','sv-newdock-button','sv-health-dock-tab']){
  assert.ok(css.includes(name),`covers ${name}`);
 }
 assert.match(css,/\.sv-health-dock-tab::before\{[\s\S]*?width:52px!important;height:52px!important/);
 assert.match(css,/\[data-space="health"\][\s\S]*?> #navManage:active\{[\s\S]*?box-shadow:var\(--sv-inset-depth\)!important/);
 assert.match(css,/#svNoteNewStandalone\.sv-note-draw-standalone::before\{[\s\S]*?width:52px!important;height:52px!important/);
 assert.match(css,/aspect-ratio:1\/1!important;border-radius:50%!important/);
 assert.match(css,/border:var\(--sv-inset-rim\)!important;background:var\(--sv-inset-fill\)!important/);
 assert.match(css,/\.sv-newdock-button:not\(:disabled\):is\(\[data-sv-active="true"\],:active\)/);
 assert.match(css,/html:root body #notePaperDialog\.sv-paper-studio\[open\]/);
 assert.match(css,/:root\[data-theme="dark"\] footer\.dock\.sv-shared-dock > \.sv-dock-active-indicator/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('shared footer inset works in Home, Music and Browser without changing Health or chat',()=>{
 const a=glass.indexOf(' function normal(){'),b=glass.indexOf(' function selected(){',a);
 assert.ok(a>=0&&b>a);
 const make=vm.runInNewContext(`(function(document,dock){${glass.slice(a,b)}\nreturn normal;})`);
 let space=null,conversation=false;
 const document={documentElement:{dataset:{theme:'light'},classList:{contains:name=>name==='seyveo-conversation'&&conversation}}};
 const dock={closest:()=>space===null?null:{dataset:{space}}};
 const normal=make(document,dock);
 for(const theme of ['light','dark']){
  document.documentElement.dataset.theme=theme;
  for(const mode of ['standard','music','browser'])assert.equal(normal(),true,`${theme}/${mode}`);
 }
 space='health';assert.equal(normal(),false,'Health uses its own two-tab circles');
 space=null;conversation=true;assert.equal(normal(),false,'chat composer remains independent');
 assert.match(glass,/tab\?\.element\|\|tab\.element\.disabled\|\|tab\.element\.getAttribute\('aria-disabled'\)==='true'/);
 assert.match(glassCss,/\.sv-dock-selection-ready > \.sv-dock-active-indicator/);
 assert.doesNotMatch(glassCss,/\.sv-dock-selection-ready:not\(\.seyveo-browser-dock\)/);
});
