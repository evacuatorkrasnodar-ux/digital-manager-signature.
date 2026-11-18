/* Pixel-faithful monochrome from the user's APPROVED colour emblem.
 * Its opaque petal mask, not a newly drawn circle, defines the silhouette. */
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');

const assets=path.resolve(__dirname,'..','assets');
const approved=path.join(assets,'seyveo-circular-interlace-approved-color.png');
const cutoff=225;

async function main(){
  const {data,info}=await sharp(approved).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==info.height)throw Error('The approved emblem must be square');
  const names=[['black',17,23,24],['white',255,255,255]];
  const large={};
  for(const [name,r,g,b] of names){
    const out=Buffer.alloc(data.length);
    for(let i=0;i<data.length;i+=4){
      out[i]=r;out[i+1]=g;out[i+2]=b;
      out[i+3]=data[i+3]>=cutoff?255:0;
    }
    large[name]=await sharp(out,{raw:{width:info.width,height:info.height,channels:4}})
      .resize(1024,1024,{kernel:'lanczos3'}).png({compressionLevel:9}).toBuffer();
    fs.writeFileSync(path.join(assets,`seyveo-circular-interlace-exact-${name}-1024.png`),large[name]);
  }
  const left=await sharp(large.black).resize(480,480).png().toBuffer();
  const right=await sharp(large.white).resize(480,480).png().toBuffer();
  const board=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><rect width="600" height="600" fill="#ffffff"/><rect x="600" width="600" height="600" fill="#171b1d"/></svg>');
  await sharp(board)
    .composite([{input:left,left:60,top:60},{input:right,left:660,top:60}])
    .png({compressionLevel:9})
    .toFile(path.join(assets,'seyveo-circular-interlace-exact-mono-preview.png'));
}

main().catch(error=>{console.error(error);process.exitCode=1});
