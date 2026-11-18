// Reproduce the approved SEYVEO PWA icon from its two HDR material masters.
// The background and the two petals are original approved raster artwork;
// resize/composite only. Browser-tab marks and the Home sphere are separate.
const path = require('node:path');
const sharp = require('sharp');

const assets = path.resolve(__dirname, '..', 'assets');
const background = path.join(assets, 'seyveo-velvet-hdr-source.jpg');
const petals = path.join(assets, 'seyveo-petals-hdr-source.png');

async function main() {
  const base = await sharp(background)
    .resize(1024, 1024, { kernel: 'lanczos3' })
    .png().toBuffer();

  // Crop only transparent margins from the original two-petal artwork.
  // Preserve the approved contours, highlights, relative spacing and color.
  const mark = await sharp(petals)
    .extract({ left: 174, top: 463, width: 868, height: 340 })
    .resize({ width: 730, kernel: 'lanczos3' })
    .png().toBuffer();
  const { width, height } = await sharp(mark).metadata();
  const icon = await sharp(base)
    .composite([{input: mark, left: Math.round((1024 - width) / 2), top: Math.round((1024 - height) / 2)}])
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
      .png({compressionLevel:9}).toFile(path.join(assets, name));
  }
  console.log('Built SEYVEO PWA from the approved dark velvet and HDR platinum/green petals.');
}

main().catch(error=>{console.error(error);process.exitCode=1;});
