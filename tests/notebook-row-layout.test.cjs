const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

const root = join(__dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'assets/seyveo-notebook-page.css'), 'utf8');

test('saved notebook notes keep thumbnail and copy on a single horizontal row', () => {
  const rule = css.match(/#svWorkShell\[data-active="notes"\] #notesDialog #notesList \.note-open\s*\{([^}]*)\}/)?.[1];
  assert.ok(rule, 'single owner of the notebook note-open layout');
  assert.match(rule, /display:flex!important/);
  assert.match(rule, /flex-direction:row!important/);
  assert.match(rule, /align-items:center!important/);
  assert.match(css, /\.note-open > \.note-paper-preview\{[\s\S]*?width:54px!important/);
  assert.match(html, /assets\/seyveo-notebook-page\.css\?v=5/);
});
