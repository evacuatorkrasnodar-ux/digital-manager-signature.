const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

const root = join(__dirname, '..');
const shell = readFileSync(join(root, 'assets/seyveo-work-shell.js'), 'utf8');
const header = readFileSync(join(root, 'assets/seyveo-work-header.js'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');

test('Notebook list hides redundant Back, card-review and Add controls', () => {
  assert.match(shell, /reviewCards\.hidden=history\|\|calendarOnly\|\|active==='notes'/);
  assert.match(shell, /back\.hidden=\(active==='personal'&&!history&&!nested\)\|\|active==='notes'/);
  assert.match(shell, /add\.hidden=active==='employee'\|\|active==='notes'/);
});

test('Work header maintains the fixed grid and 44px actions for seamless switching', () => {
  assert.match(header, /grid-template-columns:var\(--sv-header-slot,44px\) minmax\(0,1fr\) var\(--sv-header-slot,44px\)/);
  assert.match(header, /\.control\[hidden\]\{display:none!important\}/);
  assert.match(html, /assets\/seyveo-work-shell\.js\?v=106/);
});
