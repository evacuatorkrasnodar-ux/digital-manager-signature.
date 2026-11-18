const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'assets/seyveo-home-favorites.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/seyveo-home-favorites.css'), 'utf8');
const iconsBlock = script.match(/const favoriteGlyphs=(\{[\s\S]*?\});\nconst apps=/);
assert.ok(iconsBlock, 'The Home icon collection exists');
const icons = vm.runInNewContext('(' + iconsBlock[1] + ')');

test('every Home and Business shortcut uses one 64-unit Notebook-style icon grid', () => {
  assert.equal(Object.keys(icons).length, 21);
  assert.match(script, /function icon\(id\).*?viewBox="0 0 64 64"/);
  assert.match(css, /\.sv-home-favorite-icon svg\{\s*width:36px;height:36px/);
  for (const [name, markup] of Object.entries(icons)) {
    assert.match(markup, /<(?:path|rect|circle|ellipse)/, name);
    assert.doesNotMatch(markup, /<svg\b/, name + ' must not nest SVG');
  }
});

test('Notebook-inspired selective gray accents stay on vector icon details', () => {
  assert.match(icons.notebook, /fill="#c9ced3"/);
  assert.match(icons.music, /fill="#dce1e5"/);
  assert.match(icons.management, /fill="#e7eaed"/);
  assert.match(icons.browser, /fill="#cbd2d8"/);
  assert.match(css, /stroke-width:2\.1/);
});
