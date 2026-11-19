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
const strokePathSource=gestures.match(/function strokePath\(stroke\)\{[\s\S]*?\n \}/)?.[0];
const strokePath=vm.runInNewContext(`${strokePathSource}\nstrokePath`,{distance:(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])});

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

test('lasso measures the real outline of circles, rectangles and long lines',()=>{
 const circle=strokePath({tool:'circle',points:[[100,200],[300,200]]});
 assert.ok(Math.min(...circle.map(p=>p[1]))<=100.1,'circle top is included');
 assert.ok(Math.max(...circle.map(p=>p[1]))>=299.9,'circle bottom is included');
 const rectangle=strokePath({tool:'rect',points:[[100,120],[300,280]]});
 assert.ok(rectangle.some(p=>p[0]===300&&p[1]===120),'top-right corner is selectable');
 const line=strokePath({tool:'line',points:[[0,0],[360,0]]});
 assert.ok(line.length>20,'long straight line has selectable intermediate points');
});

test('undo history uses bounded lightweight stroke snapshots',()=>{
 assert.match(paper,/if\(undoStack\.length>32\)undoStack\.shift\(\)/);
 assert.match(paper,/const before=data\.strokes\.slice\(\)/);
 assert.match(paper,/getEditableStrokes:indices=>/);
});

test('Safari touch release outside canvas exits stuck pinch state',()=>{
 const source=gestures.match(/function releaseOutsideCanvas\(event\)\{[\s\S]*?\n \}/)?.[0];
 let refreshed=0;
 const sandbox={fingers:new Map([[5,[20,20]],[6,[30,30]]]),pinch:{distance:12},skipTouchUntil:0,
  paper:{refreshInkResolution:()=>{refreshed++}},zoom:{scale:2},drawOverlay:()=>{}};
 vm.runInNewContext(`${source}\nreleaseOutsideCanvas({pointerType:'touch',pointerId:5})`,sandbox);
 assert.equal(sandbox.fingers.size,1);
 assert.equal(sandbox.pinch,null);
 assert.equal(refreshed,1);
 assert.match(gestures,/if\(event\.isPrimary&&fingers\.size\)\{fingers\.clear\(\);pinch=null\}/);
 const touchNavigation=gestures.slice(gestures.indexOf("if(event.pointerType==='touch'&&!paper.isPenNearby())"),gestures.indexOf('if(!mode||pinch)return'));
 assert.doesNotMatch(touchNavigation,/canvas\.setPointerCapture\(event\.pointerId\)/);
});

test('iPhone loads native drawing without installing gesture interception',()=>{
 const classes=[];
 const context={navigator:{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',platform:'iPhone',maxTouchPoints:5},
  document:{documentElement:{classList:{add:value=>classes.push(value)}},getElementById:()=>{throw Error('Gesture layer should not start')}}};
 assert.doesNotThrow(()=>vm.runInNewContext(gestures,context));
 assert.deepEqual(classes,['sv-paper-ios-ink-safe']);
 assert.match(html,/assets\/seyveo-paper-gestures\.css\?v=2/);
});

test('two-finger navigation and lasso remain transient and do not overwrite ink',()=>{
 assert.match(gestures,/fingers\.size===2/);
 assert.match(gestures,/paper\.cancelActiveStroke\(\)/);
 assert.match(gestures,/getBoundingClientRect\(\)/);
 assert.match(gestures,/pointInside\(path\[i\],trace\)/);
 assert.match(gestures,/paper\.applyStrokeEdit\(strokes\)/);
 assert.match(gestures,/data-edit="copy"/);
 assert.match(html,/assets\/seyveo-paper-gestures\.js\?v=4/);
 assert.match(html,/assets\/notebook-paper\.js\?v=23/);
});
