const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const read = file => readFileSync(join(root, file), 'utf8');
const html = read('index.html');
const canvas = read('assets/seyveo-unified-white-canvas.css');
const header = read('assets/seyveo-header-system.css');

test('My World retains one real back control and one titlebar', () => {
  const start = html.indexOf('<main class="life-main" id="lifePage"');
  const end = html.indexOf('</header>', start);
  const section = html.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.equal((section.match(/id="lifeBack"/g) || []).length, 1);
  assert.equal((section.match(/id="lifeTitle"/g) || []).length, 1);
  assert.match(section, /class="sv-continuity-titlebar"/);
});

test('My World has exactly the white Home canvas with no green spotlight', () => {
  assert.match(canvas, /:root\[data-theme="light"\]\.sv-space-active:has\(#lifePage:not\(\[hidden\]\)\) body\s*\{\s*background:#FFFFFF!important;\s*background-image:none!important;/);
  assert.match(header, /#lifePage:not\(\[hidden\]\) > \.life-heading > \.sv-continuity-titlebar\{\s*background:transparent!important;background-image:none!important;/);
});

test('My World back button uses shared 44px circle material and black chevron', () => {
  assert.match(header, /--sv-header-slot:44px;/);
  assert.match(header, /button#lifeBack\.life-back\{[\s\S]*?border:var\(--sv-header-circle-border\)!important;[\s\S]*?box-shadow:var\(--sv-header-circle-shadow\)!important;/);
  assert.match(header, /button#lifeBack\.life-back svg\{[\s\S]*?stroke-width:var\(--sv-header-back-weight\)!important;/);
});
