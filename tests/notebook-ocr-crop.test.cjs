const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const source=readFileSync(join(__dirname,'../assets/notebook-paper.js'),'utf8');
const start=source.indexOf('function visibleInkBounds(pixels,width,height){');
const end=source.indexOf('function paintText(ctx,item,pageH){',start);
assert.ok(start>0&&end>start,'pixel-level crop helper is available');
const bounds=vm.runInNewContext(source.slice(start,end)+'\nvisibleInkBounds',{});

function ink(width,height,samples){
 const pixels=new Uint8ClampedArray(width*height*4);
 for(const [x,y,alpha] of samples)pixels[(y*width+x)*4+3]=alpha;
 return pixels;
}

test('OCR crops to visible ink, ignoring erased and barely visible pixels',()=>{
 const pixels=ink(12,8,[[1,0,0],[2,1,6],[5,3,255],[9,6,60]]);
 assert.deepEqual(JSON.parse(JSON.stringify(bounds(pixels,12,8))),
  {left:5,right:9,top:3,bottom:6});
});

test('a fully erased page is not sent to the OCR engine',()=>{
 assert.equal(bounds(ink(6,6,[[1,2,0],[4,3,0]]),6,6),null);
 assert.match(source,/if\(!visible\)throw Error\('На листе не осталось видимых чернил/);
 assert.match(source,/ctx\.getImageData\(0,0,W,raw\.height\)\.data/);
});
