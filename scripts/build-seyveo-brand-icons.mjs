// SEYVEO FLOW · original continuous silver 3D ribbons for app icons.
// The approved vector in seyveo-flow-icon-air-dark.svg remains for tiny UI controls.
// Installed web apps use one fallback icon; native Light/Dark variants are prepared separately.
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const assets = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const silver = resolve(assets, 'seyveo-flow-silver-3d-source.png');
if (!existsSync(silver)) {
  throw new Error('An approved SEYVEO silver source image is missing');
}
const output = (name) => resolve(assets, name);
const magick = (...args) => execFileSync('magick', args, { stdio: 'ignore' });

// Two true-to-reference app icons. Light is slightly deepened to keep silver
// visible against a nearly white Home Screen; Dark preserves the original metal.
magick(
  '-size', '1024x1024', 'radial-gradient:#FFFFFF-#F2F3F5',
  '(', silver, '-channel', 'RGB', '-evaluate', 'multiply', '0.89', '+channel', ')',
  '-compose', 'Over', '-composite',
  output('seyveo-app-icon-light-1024.png'),
);
magick(
  '-size', '1024x1024', 'radial-gradient:#26272B-#17181B', silver,
  '-compose', 'Over', '-composite',
  output('seyveo-app-icon-dark-1024.png'),
);

// PWA/iOS installation icon: one universally legible graphite version.
// Apple-touch-icon wins over manifest icons on iOS; native dynamic switching
// of Light/Dark icon assets is not promised for an installed web app.
for (const [size, name] of [
  [192, 'seyveo-app-icon-192.png'],
  [512, 'seyveo-app-icon-512.png'],
  [180, 'seyveo-apple-touch-icon.png'],
]) {
  magick(
    output('seyveo-app-icon-dark-1024.png'),
    '-filter', 'Lanczos', '-resize', `${size}x${size}`, output(name),
  );
}

// Keep the silver sphere fully inside Android's circular maskable safe zone.
magick(
  '-size', '512x512', 'radial-gradient:#26272B-#17181B',
  '(', silver, '-filter', 'Lanczos', '-resize', '410x410', ')',
  '-gravity', 'center', '-compose', 'Over', '-composite',
  output('seyveo-app-icon-maskable-512.png'),
);

// Preserve the enlarged two-petal tab sign on any full native icon rebuild.
execFileSync(process.execPath, [resolve(dirname(fileURLToPath(import.meta.url)), 'build-seyveo-tab-favicons.cjs')], {stdio:'ignore'});
console.log('Built SEYVEO 3D light/dark, PWA, iOS, maskable and tab icons.');
