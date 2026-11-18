// Favicons are bare SEYVEO petals, deliberately maximized in the tab canvas.
// The installed PWA icon remains a separate green-velvet rounded square.
const path = require('node:path');
const fs = require('node:fs');
const sharp = require('sharp');

const assets = path.resolve(__dirname, '..', 'assets');
const tab = fs.readFileSync(path.join(assets, 'seyveo-tab-mark.svg'), 'utf8');
const petals = [...tab.matchAll(/<path\s+class="(?:left|right)"\s+d="([^"]+)"\s*\/>/g)].map(match=>match[1]);
if(petals.length!==2)throw new Error('Expected exactly two approved SEYVEO tab petals');

async function main(){
  for(const dark of [false,true]){
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="10 22 360 156" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="a" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${dark?'#fcfffd':'#3a544b'}"/><stop offset="1" stop-color="${dark?'#acc5b9':'#102c23'}"/></linearGradient>
        <linearGradient id="b" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${dark?'#ffffff':'#70897d'}"/><stop offset="1" stop-color="${dark?'#c1d8cc':'#314b40'}"/></linearGradient>
      </defs>
      <path d="${petals[0]}" fill="url(#a)"/>
      <path d="${petals[1]}" fill="url(#b)"/>
    </svg>`;
    for(const size of [32,48]){
      const name=`seyveo-favicon-${dark?'dark-':''}${size}.png`;
      await sharp(Buffer.from(markup),{density:600})
        .resize(size,size,{fit:'contain',kernel:'lanczos3'})
        .png({compressionLevel:9}).toFile(path.join(assets,name));
    }
  }
  console.log('Built maximized light/dark SEYVEO browser-tab petals without a square.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
