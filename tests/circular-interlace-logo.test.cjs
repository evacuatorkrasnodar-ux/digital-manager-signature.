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

test('Monochrome circular logo has genuine open gaps and no metallic effects',()=>{
  const svg=readFileSync(asset('seyveo-circular-interlace-mono.svg'),'utf8');
  assert.match(svg,/<circle cx="500" cy="500" r="410"/);
  assert.equal((svg.match(/stroke="#000" stroke-width="48"/g)||[]).length,2);
  assert.match(svg,/mask="url\(#seyveo-petal-gaps\)"/);
  assert.doesNotMatch(svg,/(linearGradient|radialGradient|filter|opacity|<image)/i);
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
  assert.ok(ink>60000,'large readable one-ink mark');
  assert.ok(empty>100000,'gaps and outer background must remain transparent');
});
