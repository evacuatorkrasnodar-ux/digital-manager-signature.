const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

const html=read('index.html');
const pearl=read('assets/seyveo-white-pearl.css');
const home=read('assets/seyveo-home-dock-preview.css');
const depths=read('assets/seyveo-depth-system.css');
const header=read('assets/seyveo-header-system.css');
const silver=read('assets/seyveo-silver-flat-surfaces.css');
const newNote=read('assets/seyveo-notebook-home-new-dock.css');
const back=read('assets/seyveo-back-silver-flat.css');
const uiStandard=read('SEYVEO-UI-STANDARD.md');

test('White Pearl is the final stylesheet and the single current design contract',()=>{
 assert.equal((html.match(/seyveo-white-pearl\.css\?v=1/g)||[]).length,1);
 assert.match(html,/seyveo-white-pearl\.css\?v=1">\s*<\/body><\/html>\s*$/);
 assert.match(uiStandard,/Редакция 3\.2/);
 assert.match(uiStandard,/docs\/SEYVEO-WHITE-PEARL-STANDARD\.md/);
 assert.match(pearl,/--sv-white-pearl-surface:rgba\(255,255,255,\.92\)/);
 assert.match(pearl,/--sv-white-pearl-edge:/);
 assert.match(pearl,/--sv-white-pearl-circle-shadow:/);
 assert.match(pearl,/--sv-white-pearl-dock-shadow:/);
 assert.match(pearl,/--sv-white-pearl-press-scale:\.992/);
});

test('old grey recipes no longer define the approved light dock/button material',()=>{
 assert.doesNotMatch(home,/--sv-dock-pearl-bg:rgba\(190,193,202,\.10\)/);
 assert.doesNotMatch(depths,/Home optical polish v3|Notebook studio depth correction v4/);
 assert.doesNotMatch(depths,/--sv-dock-glass-finish:rgba\(225,229,234,\.48\)/);
 assert.doesNotMatch(silver,/--sv-flat-panel:#e4e7e9/);
 assert.match(back,/--sv-back-flat:var\(--sv-white-pearl-surface\)/);
 assert.match(header,/--sv-header-circle:var\(--sv-white-pearl-surface\)/);
});

test('main dock only styles existing surfaces and never paints the full footer',()=>{
 assert.match(pearl,/footer\.dock\.sv-shared-dock::before/);
 assert.match(pearl,/footer\.dock\.sv-shared-dock::after/);
 assert.doesNotMatch(pearl,/footer\.dock\.sv-shared-dock\s*\{\s*background:/);
});

test('new note uses one 60px pearl surface and preserves its actual click handler',()=>{
 assert.match(html,/id="svNoteHomeNew" class="sv-note-home-new-button"/);
 assert.match(html,/getElementById\('svNoteHomeNew'\)\?\.addEventListener\('click'/);
 assert.doesNotMatch(html,/id="svNoteNewStandalone"/);
 assert.match(newNote,/box-shadow:var\(--sv-white-pearl-circle-shadow/);
 assert.match(newNote,/width:60px!important;min-width:60px!important;max-width:60px!important/);
 assert.match(pearl,/#svNoteHomeNew:active/);
});

test('slim tool rails stay flat and gold Done/dark themes are protected',()=>{
 assert.match(pearl,/\.sv-note-tools-compact\[data-sv-unified-tools="true"\]/);
 assert.match(pearl,/\.sv-smart-ink-tools > button:is\(\[aria-pressed="true"\]/);
 assert.match(pearl,/#svNoteDone\.sv-note-nav-circle:not\(:active\)/);
 assert.match(depths,/:root\[data-theme="dark"\]/);
 assert.match(pearl,/:root\[data-theme="light"\]/);
 const braces=text=>text.split('{').length===text.split('}').length;
 assert.ok(braces(pearl));
 assert.ok(braces(newNote));
});
