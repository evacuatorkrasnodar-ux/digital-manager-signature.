// Rebuild only the installed PWA icon. The approved two-wave mark is taken
// pixel-for-pixel from the existing HDR tile; its shape is never regenerated.
// Browser favicons, the Sayvi orb, and in-app brand artwork stay untouched.
const path = require('node:path');
const sharp = require('sharp');

const assets = path.resolve(__dirname, '..', 'assets');
const original = path.join(assets, 'seyveo-app-icon-light-1024.png');
const size = 1024;

const velvet = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="velvet" cx="50%" cy="49%" r="78%">
      <stop offset="0" stop-color="#096049"/>
      <stop offset=".30" stop-color="#08583f"/>
      <stop offset=".60" stop-color="#074b36"/>
      <stop offset=".82" stop-color="#063c2c"/>
      <stop offset="1" stop-color="#052f24"/>
    </radialGradient>
    <linearGradient id="air" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6dbaa3" stop-opacity=".07"/>
      <stop offset=".5" stop-color="#001b13" stop-opacity="0"/>
      <stop offset="1" stop-color="#002016" stop-opacity=".09"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#velvet)"/>
  <rect width="1024" height="1024" fill="url(#air)"/>
  <rect x="4" y="4" width="1016" height="1016" rx="226" fill="none" stroke="#6caa96" stroke-width="3" stroke-opacity=".28"/>
</svg>`);

const smooth = (v) => {
  const t = Math.min(1, Math.max(0, (v - 12) / 22));
  return t * t * (3 - 2 * t);
};

async function main() {
  const { data, info } = await sharp(original).raw().toBuffer({ resolveWithObject: true });
  if (info.width !== size || info.height !== size || info.channels < 3) {
    throw new Error('Unexpected source icon dimensions');
  }
  const petals = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Avoid bringing over the old almost-black background or tile outline.
      if (x < 58 || x > 954 || y < 265 || y > 744) continue;
      const from = (y * size + x) * info.channels;
      const alpha = Math.round(smooth(data[from]) * 255);
      if (!alpha) continue;
      const to = (y * size + x) * 4;
      petals[to] = data[from];
      petals[to + 1] = data[from + 1];
      petals[to + 2] = data[from + 2];
      petals[to + 3] = alpha;
    }
  }

  // Old ribbon width ~860px; new width ~655px with ample green around it.
  const mark = await sharp(petals, { raw: { width: size, height: size, channels: 4 } })
    .resize(780, 780, { kernel: 'lanczos3' })
    .png().toBuffer();
  const icon = await sharp(velvet)
    .composite([{ input: mark, left: 122, top: 122 }])
    .png().toBuffer();

  const outputs = [
    [1024, 'seyveo-pwa-velvet-1024.png'],
    [512, 'seyveo-pwa-velvet-512.png'],
    [512, 'seyveo-pwa-velvet-maskable-512.png'],
    [192, 'seyveo-pwa-velvet-192.png'],
    [180, 'seyveo-pwa-velvet-apple-180.png'],
  ];
  for (const [edge, name] of outputs) {
    await sharp(icon).resize(edge, edge, { kernel: 'lanczos3' })
      .png({ compressionLevel: 9 }).toFile(path.join(assets, name));
  }
  console.log('Built SEYVEO PWA icon with broader emerald velvet and smaller original ribbons.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
