// Crop the ORIGINAL November 16 PWA petals, without its velvet background.
// Geometry and metallic gradients come straight from the approved app icon.
// The PWA itself is never modified by this builder.
const path = require('node:path');
const fs = require('node:fs');
const sharp = require('sharp');

const assets = path.resolve(__dirname, '..', 'assets');
const source = fs.readFileSync(path.join(assets, 'app-icon.svg'), 'utf8');
const defs = source.match(/<defs>([\s\S]*?)<\/defs>/)?.[1];
const petals = [...source.matchAll(/<path\s+d="([^"]+)"\s+fill="url\(#(steel|platinum)\)"\s*\/>/g)];
if(!defs||petals.length!==2||petals[0][2]!=='steel'||petals[1][2]!=='platinum'){
  throw new Error('The November 16 PWA source must contain two metallic petals');
}

async function main(){
  for(const dark of [false,true]){
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="19 20 344 157" preserveAspectRatio="xMidYMid meet">
      <defs>${defs}</defs>
      <path d="${petals[0][1]}" fill="url(#steel)"/>
      <path d="${petals[1][1]}" fill="url(#platinum)"/>
    </svg>`;
    for(const size of [32,48]){
      const name=`seyveo-favicon-${dark?'dark-':''}${size}.png`;
      let icon=sharp(Buffer.from(markup),{density:600})
        .resize(size,size,{fit:'contain',kernel:'lanczos3'});
      // Bright metallic highlights blend into a white Safari/Chrome tab.
      // Only the light-browser variant gets a slightly darker exposure;
      // the dark variant retains the exact PWA steel/platinum material.
      if(!dark)icon=icon.linear(.76,0);
      await icon.png({compressionLevel:9}).toFile(path.join(assets,name));
    }
  }
  console.log('Built maximized light/dark SEYVEO browser-tab petals without a square.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
