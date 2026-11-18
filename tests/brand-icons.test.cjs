const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const { createHash } = require('node:crypto');
const sharp = require('sharp');

const root = join(__dirname, '..');
const text = (name) => readFileSync(join(root, name), 'utf8');

test('SEYVEO restores the November 16 PWA icon without changing browser favicons', () => {
  const manifest = JSON.parse(text('manifest.webmanifest'));
  const page = text('index.html');
  const notifications = text('sw.js');

  assert.equal(manifest.name, 'SEYVEO');
  assert.deepEqual(
    manifest.icons.map(({ src }) => src.split('?')[0]),
    [
      'assets/app-icon.svg',
      'assets/app-icon-maskable.svg',
    ],
  );
  for (const {src} of manifest.icons) {
    assert.ok(existsSync(join(root, src.split('?')[0])), src);
  }
  assert.match(page, /rel="icon"[^>]+seyveo-favicon-32\.png\?v=7/);
  assert.match(page, /rel="icon"[^>]+seyveo-favicon-48\.png\?v=7/);
  assert.match(page, /assets\/seyveo-tab-favicon\.js\?v=1/);
  assert.match(page, /data-icon-dark="assets\/seyveo-favicon-dark-32\.png\?v=2"/);
  assert.match(page, /data-icon-dark="assets\/seyveo-favicon-dark-48\.png\?v=2"/);
  assert.doesNotMatch(page, /rel="icon"[^>]+seyveo-favicon\.svg/);
  assert.match(page, /<title>SEYVEO<\/title>/);
  assert.match(page, /document\.title=[^\n]+:'SEYVEO';/);
  assert.doesNotMatch(page, /Цифровой управляющий · Living Interface/);
  for (const name of ['seyveo-favicon-32.png', 'seyveo-favicon-48.png', 'seyveo-favicon-dark-32.png', 'seyveo-favicon-dark-48.png']) {
    assert.ok(existsSync(join(root, 'assets', name)), name);
  }
  assert.match(text('assets/seyveo-tab-favicon.js'), /prefers-color-scheme: dark/);
  const tabSvg = text('assets/seyveo-tab-mark.svg');
  assert.match(tabSvg, /prefers-color-scheme:dark/);
  assert.equal((tabSvg.match(/<path\b/g) || []).length, 2);
  assert.doesNotMatch(tabSvg, /<(?:rect|circle)\b/);
  assert.match(page, /rel="apple-touch-icon"[^>]+apple-touch-icon\.png\?v=4/);
  assert.match(page, /assets\/seyveo-app-icon-192\.png\?v=5/);
  assert.match(notifications, /assets\/seyveo-app-icon-192\.png/);
  assert.match(page, /manifest\.webmanifest\?v=19/);
  const restoredSources = {
    'app-icon.svg': 'b1811d771ca325830e11b392a1bc3f63c4ceb00a6d033cb642f21e12747465d4',
    'app-icon-maskable.svg': 'cff181af2ffc363f4290a5cb1aca7cfd8ceac86bb05c257be7ccd769f4ed5f37',
    'apple-touch-icon.png': 'bf205c9ad256d94268c0c0906cbe73a0df544e845e5af3e0d6d721c042229dec',
  };
  for (const [name, expected] of Object.entries(restoredSources)) {
    const actual = createHash('sha256').update(readFileSync(join(root, 'assets', name))).digest('hex');
    assert.equal(actual, expected, `${name} must match the November 16 original`);
  }
});

test('3D light and dark source icons are kept for native platform packaging', () => {
  for (const name of [
    'seyveo-flow-silver-3d-source.png',
    'seyveo-app-icon-light-1024.png',
    'seyveo-app-icon-dark-1024.png',
    'seyveo-petals-hdr-source.png',
    'seyveo-velvet-hdr-source.jpg',
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
    'seyveo-pwa-velvet-1024.png': 1024,
    'seyveo-pwa-velvet-192.png': 192,
    'seyveo-pwa-velvet-512.png': 512,
    'seyveo-pwa-velvet-maskable-512.png': 512,
    'seyveo-pwa-velvet-apple-180.png': 180,
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

test('Browser favicon switches between graphite and silver as system theme changes', () => {
  const links = [32, 48].map(size => ({
    href: `assets/seyveo-favicon-${size}.png?v=7`,
    dataset: {
      iconLight: `assets/seyveo-favicon-${size}.png?v=7`,
      iconDark: `assets/seyveo-favicon-dark-${size}.png?v=2`,
    },
    getAttribute(key) { return this[key]; },
    setAttribute(key, value) { this[key] = value; },
  }));
  let changed;
  const theme = { matches: false, addEventListener(_name, callback) { changed = callback; } };
  runInNewContext(text('assets/seyveo-tab-favicon.js'), {
    document: { querySelectorAll: () => links },
    window: { matchMedia: () => theme },
  });
  assert.ok(changed);
  theme.matches = true;
  changed();
  assert.ok(links.every(link => link.href === link.dataset.iconDark));
  theme.matches = false;
  changed();
  assert.ok(links.every(link => link.href === link.dataset.iconLight));
});

test('Browser favicon petals fill nearly the entire tab width without a tile', async () => {
  for (const size of [32, 48]) {
    for (const flavor of ['', 'dark-']) {
      const filename=join(root, 'assets', `seyveo-favicon-${flavor}${size}.png`);
      const {data,info}=await sharp(filename).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      let left=size,right=-1;
      for(let y=0;y<size;y++)for(let x=0;x<size;x++){
        if(data[(y*size+x)*info.channels+3]>64){left=Math.min(left,x);right=Math.max(right,x)}
      }
      assert.ok(right-left+1>=size*.84, `${flavor}${size}: petals are too small in the tab`);
      assert.equal(data[3],0, `${flavor}${size}: favicon must have a transparent canvas`);
    }
  }
});
