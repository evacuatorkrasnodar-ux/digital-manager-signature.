const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const picker=fs.readFileSync(path.join(root,'assets/seyveo-paper-custom-color.js'),'utf8');
const paper=fs.readFileSync(path.join(root,'assets/notebook-paper.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const photoColorSource=picker.match(/function photoColor\(x,y\)\{[\s\S]*?\n \}/)?.[0];
const sampleAtSource=picker.match(/function sampleAt\(clientX,clientY\)\{[\s\S]*?\n \}/)?.[0];

test('photo pipette reads the exact stored image pixel, not a fractional blend',()=>{
 let sampled;
 const photo={hidden:false,complete:true,naturalWidth:200,naturalHeight:100,
  getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})};
 const sandbox={
  document:{getElementById:()=>photo},
  getComputedStyle:()=>({objectFit:'contain'}),
  sampleCtx:{clearRect(){},drawImage(...args){sampled=args},
   getImageData:()=>({data:[18,52,86,255]})},
  rgbHex:(r,g,b)=>'#'+[r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('')
 };
 const photoColor=vm.runInNewContext(`${photoColorSource}\nphotoColor`,sandbox);
 assert.equal(photoColor(44.45,40.9),'#123456');
 assert.equal(sampled[1],88,'horizontal point is mapped to the source pixel');
 assert.equal(sampled[2],31,'vertical point is mapped without interpolation');
 assert.equal(photoColor(30,15),null,'letterboxed margins are not photo pixels');
});

test('the pipette prioritizes the photo over handwriting covering it',()=>{
 const sandbox={paper:{getBackground:()=> 'light'},photoColor:()=> '#ad3040',
  canvas:{getBoundingClientRect:()=>({left:0,top:0,right:200,bottom:200,width:200,height:200}),
   getContext:()=>{throw Error('Drawing pixels must not override photo sampling')}}};
 const sampleAt=vm.runInNewContext(`${sampleAtSource}\nsampleAt`,sandbox);
 assert.equal(sampleAt(80,100),'#ad3040');
});

test('iPhone photo sampling does not create a stroke and shows a live HEX preview',()=>{
 assert.match(paper,/dialog\.classList\.contains\('sv-ink-sampling'\)/);
 assert.match(picker,/colorHead\.append\(pipette\)/,'use one existing pipette in the menu header');
 assert.match(picker,/\.sv-ink-sample-value/);
 assert.match(picker,/overlay\.addEventListener\('touchend'/);
 assert.match(picker,/overlay\.addEventListener\('pointercancel'/);
 assert.match(html,/assets\/seyveo-paper-custom-color\.js\?v=4/);
 assert.match(html,/assets\/notebook-paper\.js\?v=39/);
});
