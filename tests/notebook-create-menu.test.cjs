const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

const root = join(__dirname, '..');
const shell = readFileSync(join(root, 'assets/seyveo-work-shell.js'), 'utf8');
const css = readFileSync(join(root, 'assets/seyveo-notebook-page.css'), 'utf8');
const launcher = readFileSync(join(root, 'assets/seyveo-notebook-launch.js'), 'utf8');

test('Notebook reuses all three existing editors in a hidden popover', () => {
  assert.match(shell, /shell\.append\(notebookChoices\)/);
  assert.match(shell, /notebookChoices\.hidden=true/);
  assert.match(shell, /else if\(section==='notes'\)toggleNotebookCreateMenu\(\)/);
  assert.match(shell, /if\(active!=='notes'\)closeNotebookCreateMenu\(\)/);
  for (const id of ['noteModeText', 'noteModePaper', 'noteModeScan']) {
    assert.match(launcher, new RegExp(`${id}:\\{label:`));
  }
  assert.match(css, /#svWorkShell > #svNotebookCreateTiles\[hidden\]\{display:none!important\}/);
  assert.match(css, /#svWorkShell\[data-active="notes"\] > #svNotebookCreateTiles:not\(\[hidden\]\)\{/);
});

test('Notebook add control exposes its three options accessibly', () => {
  assert.match(shell, /active==='notes'\?'svNotebookCreateTiles'/);
  assert.match(shell, /notebookChoices\.querySelector\('button'\)\?\.focus/);
  assert.match(shell, /event\.composedPath\(\)/);
});
