const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const text = (name) => readFileSync(join(root, name), 'utf8');

test('SEYVEO FLOW is the only installed-app and browser-tab identity', () => {
  const manifest = JSON.parse(text('manifest.webmanifest'));
  const page = text('index.html');
  const notifications = text('sw.js');

  assert.equal(manifest.name, 'SEYVEO');
  assert.deepEqual(
    manifest.icons.map(({ src }) => src.split('?')[0]),
    [
      'assets/seyveo-app-icon-192.png',
      'assets/seyveo-app-icon-512.png',
      'assets/seyveo-app-icon.svg',
      'assets/seyveo-app-icon-maskable-512.png',
      'assets/seyveo-app-icon-maskable.svg',
    ],
  );
  for (const {src} of manifest.icons) {
    assert.ok(existsSync(join(root, src.split('?')[0])), src);
  }
  assert.match(page, /rel="icon"[^>]+seyveo-favicon\.svg/);
  assert.match(page, /rel="apple-touch-icon"[^>]+seyveo-apple-touch-icon\.png/);
  assert.match(page, /assets\/seyveo-app-icon\.svg\?v=1/);
  assert.match(notifications, /assets\/seyveo-app-icon-192\.png/);
  assert.doesNotMatch(page + notifications + JSON.stringify(manifest), /assets\/(?:app-icon(?:-maskable)?\.svg|apple-touch-icon\.png|brand-tile\.svg)/);
});

test('Greeting reveal and still-used card icons are retained for their own migration', () => {
  assert.match(text('index.html'), /assets\/official-logo\.svg\?v=10/);
  assert.ok(existsSync(join(root, 'assets/seyveo-potok.svg')));
  assert.ok(existsSync(join(root, 'assets/seyveo-potok-blue.svg')));
  assert.ok(existsSync(join(root, 'assets/seyveo-flow-icon-air-dark.svg')));
});
