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
      'assets/seyveo-app-icon-maskable-512.png',
    ],
  );
  for (const {src} of manifest.icons) {
    assert.ok(existsSync(join(root, src.split('?')[0])), src);
  }
  assert.match(page, /rel="icon"[^>]+seyveo-favicon-32\.png\?v=5/);
  assert.match(page, /rel="icon"[^>]+seyveo-favicon-48\.png\?v=5/);
  assert.doesNotMatch(page, /rel="icon"[^>]+seyveo-favicon\.svg/);
  assert.match(page, /<title>SEYVEO<\/title>/);
  assert.match(page, /document\.title=[^\n]+:'SEYVEO';/);
  assert.doesNotMatch(page, /Цифровой управляющий · Living Interface/);
  for (const name of ['seyveo-favicon-32.png', 'seyveo-favicon-48.png']) {
    assert.ok(existsSync(join(root, 'assets', name)), name);
  }
  assert.match(page, /rel="apple-touch-icon"[^>]+seyveo-apple-touch-icon\.png\?v=5/);
  assert.match(page, /assets\/seyveo-app-icon-192\.png\?v=5/);
  assert.match(notifications, /assets\/seyveo-app-icon-192\.png/);
  assert.doesNotMatch(page + notifications + JSON.stringify(manifest), /assets\/(?:app-icon(?:-maskable)?\.svg|apple-touch-icon\.png|brand-tile\.svg)/);
});

test('3D light and dark source icons are kept for native platform packaging', () => {
  for (const name of [
    'seyveo-flow-silver-3d-source.png',
    'seyveo-app-icon-light-1024.png',
    'seyveo-app-icon-dark-1024.png',
  ]) {
    assert.ok(existsSync(join(root, 'assets', name)), name);
  }
  assert.doesNotMatch(text('manifest.webmanifest'), /seyveo-app-icon(?:-maskable)?\.svg/);
  const expectedSizes = {
    'seyveo-app-icon-light-1024.png': 1024,
    'seyveo-app-icon-dark-1024.png': 1024,
    'seyveo-app-icon-192.png': 192,
    'seyveo-app-icon-512.png': 512,
    'seyveo-app-icon-maskable-512.png': 512,
    'seyveo-apple-touch-icon.png': 180,
  };
  for (const [name, size] of Object.entries(expectedSizes)) {
    const png = readFileSync(join(root, 'assets', name));
    assert.equal(png.subarray(1, 4).toString(), 'PNG', name);
    assert.equal(png.readUInt32BE(16), size, name);
    assert.equal(png.readUInt32BE(20), size, name);
  }
});

test('Greeting reveal and still-used card icons are retained for their own migration', () => {
  assert.match(text('index.html'), /assets\/official-logo\.svg\?v=10/);
  assert.ok(existsSync(join(root, 'assets/seyveo-potok.svg')));
  assert.ok(existsSync(join(root, 'assets/seyveo-potok-blue.svg')));
  assert.ok(existsSync(join(root, 'assets/seyveo-flow-icon-air-dark.svg')));
});
