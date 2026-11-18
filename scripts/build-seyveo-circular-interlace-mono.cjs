/* Approved SEYVEO circular mark: reproducible one-ink output for UI and print. */
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');

const assets=path.resolve(__dirname,'..','assets');
const source=fs.readFileSync(path.join(assets,'seyveo-circular-interlace-mono.svg'),'utf8');

async function build(){
  const rendered={};
  for(const [label,color] of [['black','#111718'],['white','#ffffff']]){
    const svg=source.replace('<g fill="#111718"','<g fill="'+color+'"');
    if(svg===source&&label==='white')throw Error('Could not recolor monochrome mark');
    await sharp(Buffer.from(svg),{density:600})
      .resize(512,512,{kernel:'lanczos3'})
      .png({compressionLevel:9})
      .toFile(path.join(assets,`seyveo-circular-interlace-mono-${label}-512.png`));
    rendered[label]=await sharp(Buffer.from(svg),{density:600})
      .resize(410,410,{kernel:'lanczos3'}).png().toBuffer();
  }
  const board=Buffer.from('<svg width="1080" height="560" xmlns="http://www.w3.org/2000/svg"><rect width="540" height="560" fill="#fbfcfc"/><rect x="540" width="540" height="560" fill="#171b1d"/></svg>');
  await sharp(board)
    .composite([
      {input:rendered.black,left:65,top:75},
      {input:rendered.white,left:605,top:75},
    ])
    .png({compressionLevel:9})
    .toFile(path.join(assets,'seyveo-circular-interlace-mono-preview.png'));
}

build().catch(error=>{console.error(error);process.exitCode=1});
