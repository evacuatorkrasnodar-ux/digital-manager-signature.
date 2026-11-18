const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {createHash}=require('node:crypto');
const path=require('node:path');
const sharp=require('sharp');

const root=path.resolve(__dirname,'..');
const asset=name=>path.join(root,'assets',name);

test('Approved circular jade/platinum artwork is preserved byte for byte',()=>{
  const approved=readFileSync(asset('seyveo-circular-interlace-approved-color.png'));
  assert.equal(createHash('sha256').update(approved).digest('hex'),
    '12ed6769c0c6f430b0a64ac1f7ba6a07f19dc8cbe68b88d1e3a51acc90f9158a');
});

test('Monochrome SVG traces the approved petal silhouette with open gaps',()=>{
  const svg=readFileSync(asset('seyveo-circular-interlace-mono.svg'),'utf8');
  assert.match(svg,/fill-rule="evenodd"/);
  assert.equal((svg.match(/<path d=/g)||[]).length,3);
  assert.doesNotMatch(svg,/(linearGradient|radialGradient|filter|opacity|<image)/i);
});

test('Traced vector matches the exact approved artwork mask',async()=>{
  const approved=await sharp(asset('seyveo-circular-interlace-approved-color.png'))
    .ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const svg=await sharp(asset('seyveo-circular-interlace-mono.svg'))
    .resize(approved.info.width,approved.info.height)
    .ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let disagreement=0,ink=0;
  for(let i=3;i<approved.data.length;i+=4){
    const source=approved.data[i]>=225;
    const traced=svg.data[i]>=127;
    if(source)ink++;
    if(source!==traced)disagreement++;
  }
  assert.ok(ink>300000);
  assert.ok(disagreement/ink<.016,`SVG must closely follow original petals, disagreement=${disagreement}`);
});

test('Black and white variants have matching transparent contours at 512px',async()=>{
  const black=await sharp(asset('seyveo-circular-interlace-mono-black-512.png'))
    .raw().ensureAlpha().toBuffer({resolveWithObject:true});
  const white=await sharp(asset('seyveo-circular-interlace-mono-white-512.png'))
    .raw().ensureAlpha().toBuffer({resolveWithObject:true});
  assert.equal(black.info.width,512);
  assert.equal(white.info.height,512);
  let ink=0,empty=0;
  for(let i=0;i<black.data.length;i+=4){
    assert.equal(black.data[i+3],white.data[i+3],`alpha mismatch at pixel ${i/4}`);
    if(black.data[i+3]>240){
      ink++;
      assert.ok(black.data[i]<50,'black version must be near black');
      assert.ok(white.data[i]>240,'white version must be pure white');
    }
    if(black.data[i+3]===0)empty++;
  }
  assert.ok(ink>55000,'readable one-ink mark at 512px');
  assert.ok(empty>100000,'gaps and outer background must remain transparent');
});
