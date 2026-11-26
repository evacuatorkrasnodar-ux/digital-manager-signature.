const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

const root = join(__dirname, '..');
const shell = readFileSync(join(root, 'assets/seyveo-work-shell.js'), 'utf8');
const css = readFileSync(join(root, 'assets/seyveo-notebook-page.css'), 'utf8');
const launcher = readFileSync(join(root, 'assets/seyveo-notebook-launch.js'), 'utf8');

test('Notebook shows Smart Note, camera, art and personal documents; legacy handwriting remains readable', () => {
  assert.match(shell, /shell\.append\(notebookChoices\)/);
  assert.match(shell, /notebookChoices\.hidden=true/);
  assert.match(shell, /notebookChoices\.hidden=active!=='notes'/);
  for (const id of ['noteModeText', 'noteModePaper', 'noteModeScan', 'noteModeDraw', 'noteModeDocuments']) {
    assert.match(launcher, new RegExp(`${id}:\\{label:`));
  }
  assert.match(launcher, /noteModePaper:\{label:'От руки',run:\(\)=>window\.SEYVEO_HANDWRITING\?\.open/);
  assert.match(launcher, /noteModeDraw:\{label:'Рисовать',run:\(\)=>window\.SEYVEO_PAPER\?\.open/);
  assert.match(launcher, /if\(legacyInkTile\)legacyInkTile\.hidden=true/);
  assert.match(launcher, /replaceChildren\(document\.createTextNode\('Заметка'\)\)/);
  assert.match(css, /#svWorkShell > #svNotebookCreateTiles\[hidden\]\{display:none!important\}/);
  assert.match(css, /#svWorkShell\[data-active="notes"\] > #svNotebookCreateTiles:not\(\[hidden\]\)\{/);
  assert.match(css, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/);
  assert.match(css, /#svWorkShell\[data-active="notes"\] #svNotebookCreateTiles > \.paper-choice-item\[hidden\]\{display:none!important\}/);
  assert.match(css, /flex:0 0 44px!important/);
});

test('Notebook replaces the plus without changing its shared header geometry', () => {
  assert.match(shell, /add\.hidden=active==='employee'\|\|active==='notes'/);
  assert.match(css, /top:6px!important/);
  assert.match(css, /left:50%!important/);
  assert.match(css, /transform:translateX\(-50%\)!important/);
});

test('Personal documents open before Notebook closes so Back restores Notebook',()=>{
 assert.match(launcher,/noteModeDocuments:\{label:'Документы',run:\(\)=>window\.SEYVEO_SAYVI_SURFACES\?\.open\?\.\('contract','personal'\)/);
 assert.match(launcher,/if\(id==='noteModeDocuments'\)[\s\S]*?if\(route\.run\(\)===true\)[\s\S]*?if\(notebook\.open\)notebook\.close\(\)/);
});
