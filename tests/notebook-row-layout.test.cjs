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
  assert.match(css, /\.note-open > \.note-paper-preview\{[\s\S]*?width:46px!important/);
  assert.match(html, /assets\/seyveo-notebook-page\.css\?v=9/);
});

test('paper rows stay compact despite retired 86px !important rules', () => {
  assert.match(css, /#notesList \.paper-note \.note-item-actions,\s*#svWorkShell\[data-active="notes"\] #notesDialog #notesList \.paper-note \.note-open\s*\{\s*min-height:62px!important/);
  assert.match(css, /#notesList \.note-item\s*\{[\s\S]*?min-height:66px!important/);
  assert.match(css, /#notesList\.notes-list\s*\{[\s\S]*?padding:0 12px!important/);
  assert.match(css, /#notesList \.note-more-button\s*\{[\s\S]*?width:44px!important/);
});

test('full paper previews use matching light or dark letterbox backgrounds', () => {
  assert.match(html, /thumbnail\.dataset\.paperBackground=note\.paper\.background==='dark'\?'dark':'light'/);
  assert.match(css, /\.note-open > \.note-paper-preview\{[\s\S]*?object-fit:contain!important;[\s\S]*?background:#FFFFFF!important/);
  assert.match(css, /\.note-paper-preview\[data-paper-background="dark"\]\{\s*background:#202124!important/);
});
