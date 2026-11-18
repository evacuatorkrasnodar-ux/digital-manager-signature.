// SEYVEO FLOW · one approved silhouette, all application icon sizes.
// Source of truth: assets/seyveo-flow-icon-air-dark.svg.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = resolve(root, 'assets');
const source = readFileSync(resolve(assets, 'seyveo-flow-icon-air-dark.svg'), 'utf8');
const inner = source.replace(/^<svg[^>]*>\s*/, '').replace(/<\/svg>\s*$/, '');
if (!inner.includes('pearlA') || !inner.includes('<path')) {
  throw new Error('Approved SEYVEO FLOW vector source is missing');
}

function squareIcon(markSize) {
  const inset = (512 - markSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="SEYVEO FLOW">
  <defs><radialGradient id="graphite" cx=".47" cy=".42" r=".88"><stop stop-color="#25262A"/><stop offset="1" stop-color="#1A1B1E"/></radialGradient></defs>
  <rect width="512" height="512" fill="url(#graphite)"/>
  <svg x="${inset}" y="${inset}" width="${markSize}" height="${markSize}" viewBox="36 10 665 665">
    ${inner}
  </svg>
</svg>
`;
}

const paths = [...source.matchAll(/<path d="([^"]+)" fill="url\(#[^)]+\)"\/>/g)]
  .map((match) => `  <path d="${match[1]}"/>`).join('\n');
if (paths.split('\n').length !== 4) throw new Error('Expected four approved silver ribbon contours');
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="36 10 665 665" role="img" aria-label="SEYVEO FLOW">
  <style>
    path { fill: #202124; }
    @media (prefers-color-scheme: dark) { path { fill: #F2F3F5; } }
  </style>
${paths}
</svg>
`;

writeFileSync(resolve(assets, 'seyveo-app-icon.svg'), squareIcon(394));
writeFileSync(resolve(assets, 'seyveo-app-icon-maskable.svg'), squareIcon(304));
writeFileSync(resolve(assets, 'seyveo-favicon.svg'), favicon);

const exports = [
  ['seyveo-app-icon.svg', 'seyveo-app-icon-192.png', 192],
  ['seyveo-app-icon.svg', 'seyveo-app-icon-512.png', 512],
  ['seyveo-app-icon-maskable.svg', 'seyveo-app-icon-maskable-512.png', 512],
  ['seyveo-app-icon.svg', 'seyveo-apple-touch-icon.png', 180],
  ['seyveo-app-icon.svg', 'seyveo-favicon-32.png', 32],
];
for (const [input, output, width] of exports) {
  execFileSync('inkscape', [
    resolve(assets, input),
    '--export-type=png',
    `--export-width=${width}`,
    `--export-filename=${resolve(assets, output)}`,
  ], { stdio: 'ignore' });
}
console.log('Built SEYVEO application, maskable, tab and iOS icons from the approved vector.');
