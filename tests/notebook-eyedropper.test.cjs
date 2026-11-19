const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const picker=fs.readFileSync(path.join(root,'assets/seyveo-paper-custom-color.js'),'utf8');
const pickerStyle=fs.readFileSync(path.join(root,'assets/seyveo-paper-custom-color.css'),'utf8');
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
 assert.match(html,/assets\/seyveo-paper-custom-color\.js\?v=8/);
 assert.match(html,/assets\/notebook-paper\.js\?v=40/);
});

test('blank sheet never enters sampling mode or paints a dark bubble over toolbar',()=>{
 const guard=picker.indexOf('if(!photoReady&&!hasInk)');
 const enter=picker.indexOf("dialog.classList.add('sv-ink-sampling')",guard);
 assert.ok(guard>=0&&enter>guard,'the source check runs before full-screen sampling starts');
 assert.match(picker,/pickerNotice\(photoLoading\?/);
 assert.match(pickerStyle,/top:calc\(90px \+ env\(safe-area-inset-top,0px\)\)/);
 assert.match(pickerStyle,/\.sv-paper-light-surface \.sv-ink-sample-instruction\{[\s\S]*?background:rgba\(255,255,255,\.96\)/);
 assert.match(picker,/trigger\.addEventListener\('click',\(\)=>\{if\(picking\)stopSampling\(false\)\}/);
 assert.match(html,/assets\/seyveo-paper-custom-color\.css\?v=6/);
});

test('Palette contains one labeled pipette with a crisp vector icon',()=>{
 assert.match(picker,/class="sv-ink-pipette-caption" aria-hidden="true">Пипетка<\/span>/);
 assert.match(picker,/class="sv-ink-pipette-icon" aria-hidden="true"><svg viewBox="0 0 24 24"/);
 assert.match(pickerStyle,/\.sv-ink-pipette-icon\{[\s\S]*?width:36px;height:36px/);
 assert.match(pickerStyle,/\.sv-gradient-head\{\s*padding-right:124px!important/);
 assert.match(picker,/colorHead\.append\(pipette\)/,'there should be only one functional dropper');
});

test('the pipette stays visible despite the legacy rule hiding header subtitles',()=>{
 const oldToolbar=fs.readFileSync(path.join(root,'assets/seyveo-notebook-toolbar.css'),'utf8');
 assert.match(oldToolbar,/\.sv-gradient-head span\{\s*display:none!important/);
 assert.match(pickerStyle,/\.sv-gradient-head > button\.sv-ink-pipette > \.sv-ink-pipette-caption\{\s*display:block!important/);
 assert.match(pickerStyle,/\.sv-gradient-head > button\.sv-ink-pipette > \.sv-ink-pipette-icon\{\s*display:grid!important/);
 assert.match(pickerStyle,/\.sv-paper-light-surface #notePaperColorMenu\.paper-color-menu \.sv-ink-sv\{\s*border:1px solid rgba\(48,60,75,\.16\)!important/);
});

test('eyedropper has a connected silhouette and shares one centerline with Palette',()=>{
 assert.match(picker,/transform="rotate\(45 12 12\)"/);
 assert.match(picker,/<circle cx="12" cy="5\.2" r="2\.9"\/>/,'a round rubber bulb replaces the pencil-like cap');
 assert.match(picker,/M10\.2 8v7\.4c0 \.75/,'a slender glass tube with a tapered nozzle');
 assert.match(picker,/M12 20\.2c-\.65\.98[\s\S]*?fill="currentColor" stroke="none"/,'a visible liquid drop sits below the nozzle');
 assert.doesNotMatch(picker,/m15\.25 6\.45-9\.8 9\.8/,'remove the pencil-like old silhouette');
 assert.match(pickerStyle,/\.sv-gradient-head\{\s*display:flex!important;flex-direction:row!important;align-items:center!important/);
 assert.match(pickerStyle,/\.sv-gradient-head > button\.sv-ink-pipette\{\s*position:static!important/);
 assert.match(pickerStyle,/\.sv-ink-pipette-icon\{\s*color:#28313d!important/);
});
