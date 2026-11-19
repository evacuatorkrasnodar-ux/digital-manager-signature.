const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const paper=fs.readFileSync(path.join(root,'assets/notebook-paper.js'),'utf8');
const gestures=fs.readFileSync(path.join(root,'assets/seyveo-paper-gestures.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=paper.match(/function snapFreehandShape\(stroke\)\{[\s\S]*?\n\}/)?.[0];
const snap=vm.runInNewContext(`${source}\nsnapFreehandShape`,{W:840,H:1188,data:{height:1188}});

test('long-pressed circular handwriting becomes exact circle geometry',()=>{
 const points=Array.from({length:41},(_,i)=>{
  const angle=i/40*Math.PI*2;
  return [150+68*Math.cos(angle),150+68*Math.sin(angle),50,0];
 });
 const shape=snap({tool:'pen',width:5,points});
 assert.equal(shape?.tool,'circle');
 assert.equal(shape.points.length,2);
 assert.ok(Math.abs(shape.points[0][1]-shape.points[1][1])<.1,'circle uses diameter, not diagonal');
});

test('held nearly straight strokes become lines, short strokes remain ink',()=>{
 const points=Array.from({length:20},(_,i)=>[50+i*9,80+i*.75+Math.sin(i)*.3,50,0]);
 assert.equal(snap({tool:'pen',width:5,points})?.tool,'line');
 assert.equal(snap({tool:'pen',width:5,points:[[0,0,50,0],[2,2,50,0]]}),null);
});

test('hand-drawn closed rectangle snaps to a rectangle',()=>{
 const points=[];
 for(let i=0;i<=10;i++)points.push([40+i*15,60,50,0]);
 for(let i=1;i<=10;i++)points.push([190,60+i*9,50,0]);
 for(let i=1;i<=10;i++)points.push([190-i*15,150,50,0]);
 for(let i=1;i<=10;i++)points.push([40,150-i*9,50,0]);
 assert.equal(snap({tool:'pen',width:4,points})?.tool,'rect');
});

test('two-finger navigation and lasso remain transient and do not overwrite ink',()=>{
 assert.match(gestures,/fingers\.size===2/);
 assert.match(gestures,/paper\.cancelActiveStroke\(\)/);
 assert.match(gestures,/getBoundingClientRect\(\)/);
 assert.match(gestures,/pointInside\(p,trace\)/);
 assert.match(gestures,/paper\.applyStrokeEdit\(strokes\)/);
 assert.match(gestures,/data-edit="copy"/);
 assert.match(html,/assets\/seyveo-paper-gestures\.js\?v=1/);
 assert.match(html,/assets\/notebook-paper\.js\?v=22/);
});
