const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const engine=fs.readFileSync(path.join(__dirname,'../assets/notebook-paper.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const start=engine.indexOf('function previewWindow(p,bitmap){');
const end=engine.indexOf('function previewList(target,obj){',start);
assert.ok(start>=0&&end>start,'focused preview window is available');
const previewWindow=vm.runInNewContext(engine.slice(start,end)+'\npreviewWindow',{
 W:840,photoBounds:(p)=>p.photoBounds
});

const page=(strokes=[],texts=[],height=2400)=>({height,strokes,texts});

test('compact preview zooms toward sparse handwriting without changing its coordinates',()=>{
 const points=[[110,105],[290,220]];
 const source=page([{tool:'pen',width:5,points}]);
 const original=JSON.stringify(source);
 const frame=previewWindow(source,null);
 assert.ok(frame.width<840&&frame.height<1200,'large empty page margins are removed');
 assert.ok(frame.x<=110&&frame.x+frame.width>=290);
 assert.ok(frame.y<=105&&frame.y+frame.height>=220);
 assert.equal(JSON.stringify(source),original,'saved ink is immutable');
});

test('tall handwriting shows its first detail without dark letterbox bars',()=>{
 const frame=previewWindow(page([{tool:'pen',width:5,points:[[40,15],[800,2390]]}]),null);
 assert.ok(frame.x<=40&&frame.x+frame.width>=800);
 assert.ok(frame.y<=15,'preview opens at the start of the handwriting');
 assert.ok(frame.height<1200,'a tall note is not compressed into a tiny stripe');
 assert.ok(Math.abs(frame.width/frame.height-46/60)<.0001,'the canvas is full-bleed');
});

test('a blank tall page also produces a full-width clean paper preview',()=>{
 const frame=previewWindow(page([],[],2600),null);
 assert.ok(frame.height<1200);
 assert.equal(frame.y,0);
 assert.ok(Math.abs(frame.width/frame.height-46/60)<.0001);
});

test('photo position contributes to preview focus, including photos without ink',()=>{
 const source={...page(),photoBounds:{x:270,y:900,width:180,height:260}};
 const frame=previewWindow(source,{naturalWidth:600,naturalHeight:900});
 assert.ok(frame.x<=270&&frame.x+frame.width>=450);
 assert.ok(frame.y<=900&&frame.y+frame.height>=1160);
});

test('full Paper exports stay independent from notebook list previews',()=>{
 assert.match(engine,/open,preview:previewList,share,print,normalize,importPhoto,compressPhoto/);
 assert.match(engine,/function previewList\(target,obj\)\{[\s\S]*?paint\(source,p,true\)/);
 assert.match(engine,/ctx\.drawImage\(source,sx,sy,sw,sh,0,0,target\.width,target\.height\)/);
 assert.match(engine,/async function png\(p\)\{[\s\S]*?paint\(out,p,true\)/);
 assert.match(html,/assets\/notebook-paper\.js\?v=47/);
});
