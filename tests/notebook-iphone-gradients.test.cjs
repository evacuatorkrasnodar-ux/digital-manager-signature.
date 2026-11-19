const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const menuScript=fs.readFileSync(path.join(root,'assets/seyveo-paper-menu-polish.js'),'utf8');
const paletteCss=fs.readFileSync(path.join(root,'assets/seyveo-paper-palette-refine.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('all six iPhone gradient thumbnails are raster images with original color stops',()=>{
 const source=menuScript.split("  const raster=document.createElement('canvas');")[1]?.split('  // iOS Safari:')[0];
 assert.ok(source,'raster preview block is present');
 const stops=[...html.matchAll(/data-paper-gradient="(#[\da-f]{6},#[\da-f]{6})"/gi)].map(m=>m[1]);
 assert.equal(stops.length,6);
 const actual=[];
 const chips=[];
 const buttons=stops.map(value=>{
  const chip={append(image){this.image=image}};
  chips.push(chip);
  return {dataset:{paperGradient:value},querySelector:()=>chip};
 });
 const fakeContext={
  createLinearGradient(x1,y1,x2,y2){
   const entry={start:[x1,y1],end:[x2,y2],colors:[]};
   actual.push(entry);
   return {addColorStop(_,color){entry.colors.push(color)}};
  },
  fillRect(){},set fillStyle(_value){}
 };
 const canvas={getContext:()=>fakeContext,toDataURL:()=> 'data:image/png;base64,AA=='};
 const document={createElement(tag){
  if(tag==='canvas')return canvas;
  assert.equal(tag,'img');
  return {setAttribute(){}};
 }};
 const presets={querySelectorAll:()=>buttons};
 vm.runInNewContext("const raster=document.createElement('canvas');"+source,{document,presets});
 for(let i=0;i<6;i++){
  assert.deepEqual(actual[i].colors,stops[i].split(','));
  assert.equal(chips[i].image.className,'sv-gradient-raster');
  assert.match(chips[i].image.src,/^data:image\/png;base64,/);
 }
});

test('iPhone shows raster images without changing gradient controls or theme',()=>{
 assert.match(paletteCss,/\.sv-gradient-chip > img\.sv-gradient-raster\{[\s\S]*?display:block!important/);
 assert.match(menuScript,/chip\.append\(image\)/);
 assert.match(menuScript,/view=buildSegments\(colorMenu/);
 assert.match(html,/assets\/seyveo-paper-menu-polish\.js\?v=8/);
 assert.match(html,/assets\/seyveo-paper-palette-refine\.css\?v=2/);
});
