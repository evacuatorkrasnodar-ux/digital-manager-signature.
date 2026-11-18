// Official SEYVEO S-shaped circular brand: approved color petals, clean cuts.
// Keep the currently installed PWA's background exactly as it is in
// app-icon.svg / app-icon-maskable.svg; replace only the foreground artwork.
// The browser-tab variants have a truly transparent background.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const assets = path.resolve(__dirname, '..', 'assets');
const read = name => fs.readFileSync(path.join(assets, name));
const output = name => path.join(assets, name);

// The original color concept contains rough translucent pixels around the edge.
// Its approved three-part silhouette supplies a perfect alpha matte, including
// the two white-space channels that must survive at favicon sizes.
const square = {left:198, top:213, width:832, height:832};
function backdrop(name) {
  const svg = read(name).toString();
  const opening = svg.split('<g transform=')[0];
  if (opening === svg || !opening.includes('id="back"')) {
    throw Error(`PWA background could not be isolated: ${name}`);
  }
  return Buffer.from(opening + '</svg>');
}

async function writePng(bytes, name) {
  await sharp(bytes).png({compressionLevel:9}).toFile(output(name));
}

async function main() {
  const matte = await sharp(read('seyveo-circular-interlace-mono.svg'))
    .resize(1254, 1254).png().toBuffer();
  const clean = await sharp(read('seyveo-circular-interlace-approved-color.png'))
    .composite([{input:matte, blend:'dest-in'}]).png().toBuffer();
  await writePng(clean, 'seyveo-circular-interlace-color-clean.png');

  const cropped = await sharp(clean).extract(square).png().toBuffer();
  const base = await sharp(backdrop('app-icon.svg'))
    .resize(1024,1024).png().toBuffer();
  const maskableBase = await sharp(backdrop('app-icon-maskable.svg'))
    .resize(1024,1024).png().toBuffer();

  for (const [name, background, edge] of [
    ['seyveo-pwa-circular-s-1024.png',base,774],
    ['seyveo-pwa-circular-s-maskable-1024.png',maskableBase,688],
  ]) {
    const mark = await sharp(cropped).resize(edge,edge,{kernel:'lanczos3'}).png().toBuffer();
    const icon = await sharp(background).composite([{
      input:mark, left:Math.floor((1024-edge)/2), top:Math.floor((1024-edge)/2),
    }]).png().toBuffer();
    await writePng(icon,name);
  }

  for (const [size,name,source] of [
    [512,'seyveo-pwa-circular-s-512.png','seyveo-pwa-circular-s-1024.png'],
    [192,'seyveo-pwa-circular-s-192.png','seyveo-pwa-circular-s-1024.png'],
    [180,'seyveo-pwa-circular-s-apple-180.png','seyveo-pwa-circular-s-1024.png'],
    [512,'seyveo-pwa-circular-s-maskable-512.png','seyveo-pwa-circular-s-maskable-1024.png'],
  ]) {
    await sharp(output(source)).resize(size,size,{kernel:'lanczos3'})
      .png({compressionLevel:9}).toFile(output(name));
  }

  for (const size of [32,48]) {
    for (const dark of [false,true]) {
      const name=`seyveo-tab-circular-s-${dark?'dark-':''}${size}.png`;
      let icon=sharp(cropped).resize(size,size,{kernel:'lanczos3'});
      // On white browser chrome, preserve color while deepening pale platinum.
      if (!dark) icon=icon.linear(.80,0);
      await icon.png({compressionLevel:9}).toFile(output(name));
    }
  }
  console.log('Built color SEYVEO S: current velvet PWA background and transparent browser tabs.');
}

main().catch(error=>{console.error(error);process.exitCode=1});
