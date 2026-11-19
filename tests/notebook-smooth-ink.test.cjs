const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'assets/seyveo-paper-smooth.js'),'utf8');
const style=fs.readFileSync(path.join(root,'assets/seyveo-paper-smooth.css'),'utf8');
const engine=fs.readFileSync(path.join(root,'assets/notebook-paper.js'),'utf8');
const gestures=fs.readFileSync(path.join(root,'assets/seyveo-paper-gestures.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

function smoother(){
 const begin=script.indexOf('const clamp=(n,min,max)=>');
 const end=script.indexOf('\n const action=document.createElement',begin);
 assert.ok(begin>=0&&end>begin);
 return vm.runInNewContext(script.slice(begin,end)+'\nsmoothPoints');
}
function ovalFitter(){
 const begin=script.indexOf('const clamp=(n,min,max)=>');
 const end=script.indexOf('\n const action=document.createElement',begin);
 assert.ok(begin>=0&&end>begin);
 return vm.runInNewContext(script.slice(begin,end)+'\nfitOval');
}
function shapeFitter(name){
 const begin=script.indexOf('const clamp=(n,min,max)=>');
 const end=script.indexOf('\n const action=document.createElement',begin);
 assert.ok(begin>=0&&end>begin);
 return vm.runInNewContext(script.slice(begin,end)+'\n'+name);
}

test('Sayvi recognizes a whole five-stroke house and previews straight walls and roof',()=>{
 const fit=shapeFitter('fitHouse');
 const edges=[[[300,160],[206,248]],[[300,160],[393,248]],
  [[206,248],[205,411]],[[393,248],[394,411]],[[205,411],[394,411]]];
 const input=edges.map(([a,b],edge)=>({tool:'pen',color:'#171e29',width:6,
  points:Array.from({length:21},(_,i)=>{
   const t=i/20;
   const offset=(i===0||i===20?0:6*Math.sin(i*.9));
   const x=a[0]+(b[0]-a[0])*t+(edge%2===0?offset:0);
   const y=a[1]+(b[1]-a[1])*t+(edge%2?offset:0);
   return [x,y,40+i%20,15];
  })}));
 const before=structuredClone(input),corrected=fit(input);
 assert.ok(corrected,'roof plus two walls and a base is classified as a house');
 assert.deepEqual(input,before,'no original ink changes during recognition');
 assert.equal(corrected.length,5,'the five original strokes are retained');
 for(let index=0;index<corrected.length;index++){
  assert.equal(corrected[index].points.length,input[index].points.length);
  assert.equal(JSON.stringify(corrected[index].points.map(p=>p.slice(2))),
   JSON.stringify(input[index].points.map(p=>p.slice(2))),
   'pressure and pen tilt are retained');
  assert.equal(corrected[index].color,input[index].color);
 }
 const roof=corrected[0].points;
 const walls=corrected.slice(2,4);
 assert.ok(roof.every((p,i)=>i===0||Math.abs((p[1]-roof[0][1])*(roof.at(-1)[0]-roof[0][0])
  -(p[0]-roof[0][0])*(roof.at(-1)[1]-roof[0][1]))<15),'roof edge is straight');
 assert.ok(walls.every(stroke=>stroke.points.every(p=>Math.abs(p[0]-stroke.points[0][0])<.2)),
  'both walls are vertical');
 assert.equal(fit(input.slice(0,4)),null,'an unfinished sketch is not inferred to be a house');
 const unrelated=[...input.slice(0,4),{...input[4],points:input[4].points.map(p=>[p[0]+250,p[1]+100,...p.slice(2)])}];
 assert.equal(fit(unrelated),null,'unconnected lines do not produce a house');
 assert.equal(fit(input.map((stroke,i)=>i===0?{...stroke,tool:'eraser'}:stroke)),null,
  'the eraser is never interpreted as part of the drawing');
});

test('Sayvi recognises a one-stroke Cyrillic С and makes the open arc smoother',()=>{
 const fit=shapeFitter('fitLetterC'),count=75,ideal=[],wobbly=[];
 for(let i=0;i<count;i++){
  const t=-.78-(Math.PI*2-1.56)*i/(count-1);
  ideal.push([280+85*Math.cos(t),310+96*Math.sin(t)]);
  const shake=2.4*Math.sin(t*9)+1.7*Math.cos(t*14);
  wobbly.push([280+(85+shake)*Math.cos(t),310+(96+shake)*Math.sin(t),45+i%20]);
 }
 for(const data of [wobbly,wobbly.slice().reverse()]){
  const before=structuredClone(data),after=fit(data);
  assert.ok(after,'recognised a well-formed open С in either writing direction');
  assert.deepEqual(data,before,'preview never mutates the original');
  assert.deepEqual(Array.from(after[0]),data[0]);
  assert.deepEqual(Array.from(after.at(-1)),data.at(-1));
  assert.deepEqual(after.map(p=>p[2]),data.map(p=>p[2]));
  const reference=data===wobbly?ideal:ideal.slice().reverse();
  const error=points=>points.reduce((sum,p,i)=>sum+Math.hypot(p[0]-reference[i][0],p[1]-reference[i][1]),0)/count;
  assert.ok(error(after)<error(data),`the С curve improved: ${error(data)} -> ${error(after)}`);
 }
});

test('a very shaky Cyrillic С is still corrected with explicit before/after approval',()=>{
 const fit=shapeFitter('fitLetterC'),count=81,ideal=[],rough=[];
 for(let i=0;i<count;i++){
  const t=-.85-(Math.PI*2-1.7)*i/(count-1);
  const x=300+86*Math.cos(t),y=310+93*Math.sin(t);
  ideal.push([x,y]);
  const wobble=14*Math.sin(t*8)+9*Math.cos(t*13);
  rough.push([x+wobble*Math.cos(t)+4*Math.sin(t*3),y+wobble*Math.sin(t),40+i%23]);
 }
 const original=structuredClone(rough),result=fit(rough);
 assert.ok(result,'a deeply wobbly yet recognisable С is offered for correction');
 assert.deepEqual(rough,original);
 assert.deepEqual(Array.from(result[0]),rough[0]);
 assert.deepEqual(Array.from(result.at(-1)),rough.at(-1));
 assert.deepEqual(result.map(p=>p[2]),rough.map(p=>p[2]));
 const error=points=>points.reduce((sum,p,i)=>sum+Math.hypot(p[0]-ideal[i][0],p[1]-ideal[i][1]),0)/count;
 assert.ok(error(result)<error(rough)*.8,`rough С improved from ${error(rough)} to ${error(result)}`);
});

test('a user can identify an unrecognisable scribble as С, О or a heart',()=>{
 const redraw=shapeFitter('redrawAs');
 const scribble=Array.from({length:17},(_,i)=>[170+i%3*22,200+i*3+(i%2?7:-7),30+i]);
 const original=structuredClone(scribble);
 for(const type of ['c','o','heart']){
  const result=redraw(scribble,type);
  assert.ok(result.length>=65,`${type} is smooth even from a few points`);
  assert.equal(result[0][2],scribble[0][2]);
  assert.equal(result.at(-1)[2],scribble.at(-1)[2]);
  assert.ok(result.every(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])));
  const distance=Math.hypot(result[0][0]-result.at(-1)[0],result[0][1]-result.at(-1)[1]);
  if(type==='c')assert.ok(distance>20,'letter С remains open');
  else assert.ok(distance<.2,'letter О and the heart are closed');
 }
 assert.deepEqual(scribble,original,'choices cannot mutate the source stroke');
 assert.equal(redraw([[2,2,60],[3,3,60],[4,4,60],[5,5,60],[6,6,60]],'heart'),null,'too tiny to infer size');
 assert.equal(redraw(scribble,'unknown'),null,'unknown labels cannot create ink');
});

test('Sayvi suggests a rough С or О that is too shaky for automatic refitting',()=>{
 const guess=shapeFitter('guessIntent'),fitC=shapeFitter('fitLetterC'),fitO=shapeFitter('fitOval');
 const n=91;
 const roughC=Array.from({length:n},(_,i)=>{
  const t=-.85-(Math.PI*2-1.7)*i/(n-1);
  const r=80+40*Math.sin(10*t)+14*Math.cos(16*t);
  return [300+r*Math.cos(t),250+r*Math.sin(t),50+i%12];
 });
 const roughO=Array.from({length:n},(_,i)=>{
  const t=Math.PI*2*i/(n-1);
  const r=80+17*Math.sin(10*t)+5.95*Math.cos(16*t);
  return [300+r*Math.cos(t),250+r*Math.sin(t),50+i%12];
 });
 const cOriginal=structuredClone(roughC),oOriginal=structuredClone(roughO);
 assert.equal(fitC(roughC),null,'too much wobble to modify С automatically');
 assert.equal(fitO(roughO),null,'too much wobble to modify О automatically');
 assert.equal(guess(roughC),'c','a fuzzy С earns an optional suggestion');
 assert.equal(guess(roughO),'o','a fuzzy О earns an optional suggestion');
 assert.equal(guess(roughC.slice().reverse()),'c','drawing direction is not important');
 assert.equal(guess(roughO.slice().reverse()),'o','reverse closed loop is recognised');
 assert.deepEqual(roughC,cOriginal);assert.deepEqual(roughO,oOriginal);
});

test('a guess never guesses shapes from a square, a line or tiny disconnected ink',()=>{
 const guess=shapeFitter('guessIntent');
 const corners=[[100,100],[220,100],[220,220],[100,220],[100,100]],square=[];
 for(let k=0;k<4;k++)for(let i=0;i<25;i++){
  const t=i/25;
  square.push([corners[k][0]*(1-t)+corners[k+1][0]*t,corners[k][1]*(1-t)+corners[k+1][1]*t,50]);
 }
 square.push([100,100,50]);
 assert.equal(guess(square),null,'a rectangular frame must not become О');
 assert.equal(guess(Array.from({length:41},(_,i)=>[100+i*4,200+i*.4,50])),null,'a line is not a letter');
 assert.equal(guess([[1,1,50],[2,3,50],[4,2,50]]),null,'short accidental marks get no guess');
});

test('a closed О, a U-shaped letter and a straight stroke are not mistaken for С',()=>{
 const fit=shapeFitter('fitLetterC'),count=75;
 const o=Array.from({length:count},(_,i)=>{
  const t=Math.PI*2*i/(count-1);return [260+80*Math.cos(t),260+90*Math.sin(t),60];
 });
 assert.equal(fit(o),null,'a completed О stays closed');
 const u=Array.from({length:count},(_,i)=>{
  const t=Math.PI-(Math.PI*i/(count-1));return [200+80*Math.cos(t),200+100*Math.sin(t),60];
 });
 assert.equal(fit(u),null,'a У-образный штрих stays distinct');
 const line=Array.from({length:count},(_,i)=>[100+i*3,250+i*.4,60]);
 assert.equal(fit(line),null,'a straight letter stem stays straight');
 const corners=[[220,100],[100,100],[100,220],[220,220]],angular=[];
 for(let k=0;k<3;k++)for(let i=0;i<25;i++){
  const t=i/25;
  angular.push([corners[k][0]*(1-t)+corners[k+1][0]*t,corners[k][1]*(1-t)+corners[k+1][1]*t,60]);
 }
 angular.push([220,220,60]);
 assert.equal(fit(angular),null,'a three-sided angular bracket must stay angular');
});

test('Sayvi restores a shaky tilted heart without changing the artist’s ink pressure',()=>{
 const fit=shapeFitter('fitHeart');
 for(const direction of [1,-1]){
  const n=97,angle=.32,ideal=[],drawing=[];
  for(let i=0;i<n;i++){
   const t=direction*Math.PI*2*i/(n-1);
   const u=16*Math.sin(t)**3,v=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));
   const x=300+u*3.9*Math.cos(angle)-v*3.9*Math.sin(angle);
   const y=290+u*3.9*Math.sin(angle)+v*3.9*Math.cos(angle);
   ideal.push([x,y]);
   drawing.push([x+2.4*Math.sin(t*11),y+2.2*Math.cos(t*9),55+i%15]);
  }
  const before=structuredClone(drawing),after=fit(drawing);
  assert.ok(after,`recognised a closed heart in direction ${direction}`);
  assert.deepEqual(drawing,before);
  assert.deepEqual(after.map(p=>p[2]),drawing.map(p=>p[2]));
  assert.deepEqual(after[0].slice(0,2),after.at(-1).slice(0,2));
  const error=points=>points.reduce((sum,p,i)=>sum+Math.hypot(p[0]-ideal[i][0],p[1]-ideal[i][1]),0)/n;
  assert.ok(error(after)<error(drawing)*.8,`heart error improved: ${error(drawing)} -> ${error(after)}`);
 }
});

test('heart detector ignores circles, squares and open handwriting',()=>{
 const heart=shapeFitter('fitHeart'),n=97;
 const circle=Array.from({length:n},(_,i)=>{
  const t=2*Math.PI*i/(n-1);return [200+60*Math.cos(t),200+60*Math.sin(t),50];
 });
 assert.equal(heart(circle),null,'a circle must never turn into a heart');
 const oval=circle.map((p,i)=>[p[0]+(p[0]-200)*.65,p[1]-(p[1]-200)*.22,p[2]]);
 assert.equal(heart(oval),null,'a tilted or elongated letter O must not become a heart');
 const corners=[[100,100],[220,100],[220,220],[100,220],[100,100]],square=[];
 for(let k=0;k<4;k++)for(let i=0;i<24;i++){
  const t=i/24;
  square.push([corners[k][0]*(1-t)+corners[k+1][0]*t,corners[k][1]*(1-t)+corners[k+1][1]*t,50]);
 }
 square.push([100,100,50]);
 assert.equal(heart(square),null,'a box must stay a box');
 assert.equal(heart([[30,30,50],[42,41,50],[54,56,50],[66,78,50]]),null);
});

test('a wobbly straight leg of a letter becomes straight; curves and endpoints remain safe',()=>{
 const straight=shapeFitter('fitStraight'),n=20;
 const points=Array.from({length:n},(_,i)=>[120+i*7,240+i*.8+(i%2?1.9:-1.9),40+i%15]);
 const source=structuredClone(points),result=straight(points);
 assert.ok(result,'confidently near-straight pen stroke recognised');
 assert.deepEqual(points,source);
 assert.deepEqual(Array.from(result[0]),points[0]);assert.deepEqual(Array.from(result.at(-1)),points.at(-1));
 assert.deepEqual(result.map(p=>p[2]),points.map(p=>p[2]));
 const deviation=path=>{
  const a=path[0],b=path.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  return path.reduce((sum,p)=>sum+Math.abs((p[0]-a[0])*dy-(p[1]-a[1])*dx)/length,0);
 };
 assert.ok(deviation(result)<deviation(points)*.05);
 const curved=Array.from({length:25},(_,i)=>{
  const t=Math.PI*i/24;return [200+75*Math.cos(t),260+75*Math.sin(t),50];
 });
 assert.equal(straight(curved),null,'a curved letter is not flattened into a line');
});

test('Sayvi squares up a wobbly, tilted oval while preserving pressure and closing its seam',()=>{
 const fit=ovalFitter(),n=65,tilt=.44,center=[280,340];
 const ideal=[],wobbly=[];
 for(let i=0;i<n;i++){
  const t=Math.PI*2*i/(n-1),wobble=3*Math.sin(t*9)+2*Math.cos(t*13);
  const u=92*Math.cos(t),v=52*Math.sin(t);
  ideal.push([center[0]+u*Math.cos(tilt)-v*Math.sin(tilt),center[1]+u*Math.sin(tilt)+v*Math.cos(tilt)]);
  const nu=(92+wobble)*Math.cos(t),nv=(52+wobble)*Math.sin(t);
  wobbly.push([center[0]+nu*Math.cos(tilt)-nv*Math.sin(tilt),center[1]+nu*Math.sin(tilt)+nv*Math.cos(tilt),40+i%16]);
 }
 const original=structuredClone(wobbly);
 const result=fit(wobbly);
 assert.ok(result,'the recogniser accepts a closed, mildly shaky oval');
 assert.equal(result.length,wobbly.length);
 assert.deepEqual(result.map(p=>p[2]),wobbly.map(p=>p[2]));
 assert.deepEqual(wobbly,original,'the original is immutable during preview');
 assert.deepEqual(result[0].slice(0,2),result.at(-1).slice(0,2),'closed ink has no open seam');
 const error=points=>points.reduce((sum,p,i)=>sum+Math.hypot(p[0]-ideal[i][0],p[1]-ideal[i][1]),0)/n;
 assert.ok(error(result)<error(wobbly),`oval deviation fell from ${error(wobbly)} to ${error(result)}`);
});

test('hand-drawn circles stay circular with different sampling densities and drawing directions',()=>{
 const fit=ovalFitter();
 for(const count of [33,49,97])for(const direction of [1,-1]){
  const circle=Array.from({length:count},(_,i)=>{
   const t=direction*Math.PI*2*i/(count-1);
   const wave=Math.sin(t*5)*2+Math.cos(t*11)*1.2;
   return [200+(65+wave)*Math.cos(t),200+(65+wave)*Math.sin(t),50+i%13];
  });
  const result=fit(circle);
  assert.ok(result,`recognised a ${count}-point circle in direction ${direction}`);
  const centerError=points=>points.reduce((sum,p)=>sum+Math.abs(Math.hypot(p[0]-200,p[1]-200)-65),0)/points.length;
  assert.ok(centerError(result)<centerError(circle),`circularity improved at ${count} points`);
 }
});

test('shape recognition will not turn an open letter, a heart or a square into an oval',()=>{
 const fit=ovalFitter(),n=65;
 const open=Array.from({length:n},(_,i)=>{
  const t=Math.PI*1.7*i/(n-1);return [180+80*Math.cos(t),200+80*Math.sin(t),60];
 });
 assert.equal(fit(open),null,'a letter C is not a circle');
 const heart=Array.from({length:n},(_,i)=>{
  const t=Math.PI*2*i/(n-1);
  return [300+3.5*16*Math.sin(t)**3,250-3.5*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t)),60];
 });
 assert.equal(fit(heart),null,'the point and lobes of a heart are intentional');
 const square=[];
 const corners=[[100,100],[220,100],[220,220],[100,220],[100,100]];
 for(let k=0;k<4;k++)for(let i=0;i<20;i++){
  const t=i/20;
  square.push([corners[k][0]*(1-t)+corners[k+1][0]*t,corners[k][1]*(1-t)+corners[k+1][1]*t,60]);
 }
 square.push([100,100,60]);
 assert.equal(fit(square),null,'square corners remain square');
});

test('smoothing reduces short jitter without changing endpoints, pen pressure or the source',()=>{
 const smooth=smoother();
 const source=Array.from({length:19},(_,i)=>[10+i*4,50+(i%2?2:-2),Math.min(100,40+i)]);
 const original=structuredClone(source);
 const result=smooth(source);
 assert.deepEqual(source,original,'the original remains untouched until Apply');
 assert.deepEqual(Array.from(result[0]),source[0]);
 assert.deepEqual(Array.from(result[1]),source[1]);
 assert.deepEqual(Array.from(result.at(-2)),source.at(-2));
 assert.deepEqual(Array.from(result.at(-1)),source.at(-1));
 assert.deepEqual(result.map(p=>p[2]),source.map(p=>p[2]));
 const noise=points=>points.slice(2,-2).reduce((sum,p)=>sum+Math.abs(p[1]-50),0);
 assert.ok(noise(result)<noise(source)*.88,`noise fell from ${noise(source)} to ${noise(result)}`);
});

test('short and long strokes are safe, and deliberate corners are not moved far',()=>{
 const smooth=smoother();
 const short=[[5,5,20],[10,10,30],[15,15,40]];
 assert.deepEqual(JSON.parse(JSON.stringify(smooth(short))),short);
 const corner=[[0,20,45],[8,20,45],[16,20,45],[24,20,45],[32,20,45],
  [40,20,45],[40,28,45],[40,36,45],[40,44,45],[40,52,45],[40,60,45]];
 const result=smooth(corner);
 assert.ok(Math.hypot(result[5][0]-40,result[5][1]-20)<4,'the right angle remains recognisable');
 assert.deepEqual(Array.from(result.at(-1)),corner.at(-1));
});

test('live controls compare without committing, Cancel restores and Apply commits exactly once',()=>{
 class Node{
  constructor(id=''){this.id=id;this.children=[];this.listeners={};this.attributes={};this.style={};this.dataset={};
   this.hidden=false;this.classNames=new Set();this.classList={
    contains:name=>this.classNames.has(name),add:name=>this.classNames.add(name),
    remove:name=>this.classNames.delete(name)};}
  setAttribute(key,value){this.attributes[key]=value}
  append(...nodes){this.children.push(...nodes)}
  addEventListener(name,cb){(this.listeners[name]??=[]).push(cb)}
  click(){for(const cb of this.listeners.click??[])cb({target:this})}
  fire(name){for(const cb of this.listeners[name]??[])cb({target:this})}
  querySelector(selector){if(selector==='[data-sv-menu-panel="actions"]')return actions;return null}
  insertBefore(node){this.children.push(node)}
  getBoundingClientRect(){return {top:100,bottom:150}}
 }
 const dialog=new Node('notePaperDialog'),sheet=new Node('notePaperSheet');
 const menu=new Node('notePaperSettingsMenu'),dock=new Node('svPaperNewDock');
 const actions=new Node('actions'),settings=new Node('notePaperSettings');
 const nodes={notePaperDialog:dialog,notePaperSheet:sheet,notePaperSettingsMenu:menu,
  svPaperNewDock:dock,notePaperSettings:settings};
 let source=[{tool:'pen',points:Array.from({length:11},(_,i)=>[i*4,50+(i%2?3:-3),60]),color:'#111111'},
  {tool:'eraser',points:[[0,0,80],[5,5,80],[10,10,80],[15,15,80],[20,20,80]],color:'#ffffff'}];
 const original=structuredClone(source),previews=[],applied=[],announcements=[];
 const paper={getEditableStrokes:indices=>source.map((s,i)=>indices.includes(i)?structuredClone(s):s),
  previewStrokeEdit:strokes=>previews.push(structuredClone(strokes)),
  applyStrokeEdit:strokes=>{applied.push(structuredClone(strokes));source=strokes;dialog.fire('sv-paper-render');return true},
  cancelActiveStroke:()=>{},announce:message=>announcements.push(message)};
 const document={getElementById:id=>nodes[id]||null,
  createElement:()=>new Node(),addEventListener:()=>{}};
 const window={SEYVEO_PAPER:paper,addEventListener:()=>{}};
 vm.runInNewContext(script,{document,window,Math});
 assert.equal(actions.children.length,1,'no second menu or dock was added');
 const action=actions.children[0];
 assert.equal(action.hidden,false);
 const overlay=sheet.children[0],bar=overlay.children[0];
 const [before,after,hint,cancel,apply,choices]=bar.children;
 action.click();
 assert.equal(overlay.hidden,false);
 assert.equal(dialog.classList.contains('sv-paper-smooth-mode'),true);
 assert.equal(previews.length,1);
 assert.notDeepEqual(previews[0][0].points,original[0].points);
 assert.deepEqual(previews[0][1],original[1],'eraser stays exactly as it was');
 assert.equal(applied.length,0);
 before.click();
 assert.deepEqual(previews.at(-1),original);
 after.click();
 assert.notDeepEqual(previews.at(-1)[0].points,original[0].points);
 cancel.click();
 assert.deepEqual(previews.at(-1),original);
 assert.deepEqual(source,original);
 assert.equal(applied.length,0);
 assert.equal(overlay.hidden,true);
 action.click();apply.click();
 assert.equal(applied.length,1);
 assert.notDeepEqual(source[0].points,original[0].points);
 assert.deepEqual(source[1],original[1]);
 assert.equal(overlay.hidden,true);
 source=structuredClone(original);
 action.click();hint.click();
 assert.equal(choices.hidden,false,'the small intention chips only appear when requested');
 choices.listeners.click[0]({target:{closest:()=>({dataset:{svShape:'c'}})}});
 assert.equal(choices.hidden,true);
 assert.equal(previews.at(-1)[0].points.length>=65,true,'a hand-drawn letter template is previewed');
 assert.deepEqual(source,original,'the hint has not modified saved ink');
 cancel.click();
 assert.deepEqual(source,original,'Cancel restores the scribble before manual correction');
 assert.equal(applied.length,1);
 action.click();hint.click();
 choices.listeners.click[0]({target:{closest:()=>({dataset:{svShape:'o'}})}});
 apply.click();
 assert.equal(applied.length,2,'explicit Apply commits the chosen letter just once');
 assert.equal(source[0].points.length>=65,true);
 assert.deepEqual(source[1],original[1],'unrelated eraser strokes remain intact');
 source=[{tool:'pen',points:Array.from({length:20},(_,i)=>[40+i*6,100,50]),color:'#111111'}];
 dialog.fire('sv-paper-render');action.click();
 assert.equal(overlay.hidden,false,'a perfectly straight line can still be intentionally relabelled');
 assert.match(announcements.at(-1),/Штрихи уже ровные/);
 hint.click();
 choices.listeners.click[0]({target:{closest:()=>({dataset:{svShape:'heart'}})}});
 apply.click();
 assert.equal(applied.length,3,'an explicit label can create one Undo-able edit from otherwise straight ink');
 assert.ok(source[0].points.length>=65);
 source=[];
 dialog.fire('sv-paper-render');
 assert.equal(action.hidden,false,'the command remains visible on a blank page');
 action.click();
 assert.equal(announcements.at(-1),'Сначала напиши или нарисуй что-нибудь ручкой.');
 assert.equal(overlay.hidden,true);
 assert.equal(applied.length,3,'blank-page tip never commits an edit');

 source=[{tool:'pen',color:'#111111',points:Array.from({length:91},(_,i)=>{
  const t=2*Math.PI*i/90,r=80+17*Math.sin(10*t)+5.95*Math.cos(16*t);
  return [300+r*Math.cos(t),250+r*Math.sin(t),40+i%16];
 })}];
 const roughOriginal=structuredClone(source);
 action.click();
 assert.equal(hint.textContent,'О?','a tiny guess takes the place of the existing «Это…» control');
 assert.match(hint.attributes['aria-label'],/предполагает букву О/);
 assert.equal(choices.hidden,true,'no extra menu appeared');
 assert.deepEqual(source,roughOriginal,'the first guess did not change the drawing');
 hint.click();
 assert.equal(hint.textContent,'Это…','after preview the familiar manual choices remain available');
 assert.equal(previews.at(-1)[0].points.length>=65,true,'one tap previews an elegant О');
 assert.deepEqual(source,roughOriginal,'even a guessed shape is not committed automatically');
 hint.click();
 assert.equal(choices.hidden,false,'author can correct Sayvi’s guess');
 cancel.click();
 assert.deepEqual(source,roughOriginal,'Cancel restores a guessed shape too');
 assert.equal(applied.length,3,'the new prediction does not secretly save ink');

 source=[[[280,140],[185,235]],[[280,140],[375,235]],[[185,235],[185,390]],
  [[375,235],[375,390]],[[185,390],[375,390]]].map(([a,b])=>({tool:'pen',color:'#171e29',
   points:Array.from({length:20},(_,i)=>[a[0]+(b[0]-a[0])*i/19,
    a[1]+(b[1]-a[1])*i/19+Math.sin(Math.PI*i/19)*3,55])}));
 const houseOriginal=structuredClone(source);
 action.click();
 assert.equal(hint.textContent,'Дом?','a complete house earns a compact suggestion');
 assert.deepEqual(source,houseOriginal,'recognition has not replaced the drawn house');
 hint.click();
 assert.equal(hint.textContent,'Это…','after seeing the house the author may choose another intent');
 assert.notDeepEqual(previews.at(-1),houseOriginal,'the house correction is visible before approval');
 assert.deepEqual(source,houseOriginal,'the preview is not an edit');
 apply.click();
 assert.equal(applied.length,4,'Apply commits the five-stroke house in one edit');
 assert.equal(source.length,5,'the original number of strokes stays intact');
});

test('a tiny, material-matched comparison bar offers explicit Apply and Cancel',()=>{
 assert.match(script,/actions\.insertBefore\(action,actions\.querySelector\('#notePaperAddPhoto'\)\)/);
 assert.doesNotMatch(script,/action\.hidden=/,'the command cannot disappear on a clean sheet');
 assert.match(script,/paper\.announce\?\.\('Сначала напиши или нарисуй что-нибудь ручкой\.'\)/);
 assert.match(script,/const before=document\.createElement\('button'\);before\.type='button';before\.textContent='До'/);
 assert.match(script,/const after=document\.createElement\('button'\);after\.type='button';after\.textContent='После'/);
 assert.match(script,/const hint=document\.createElement\('button'\);hint\.type='button';hint\.textContent='Это…'/);
 assert.match(script,/const cancel=document\.createElement\('button'\);cancel\.type='button';cancel\.textContent='Отмена'/);
 assert.match(script,/const apply=document\.createElement\('button'\);apply\.type='button';apply\.textContent='Применить'/);
 assert.match(script,/before\.addEventListener\('click',\(\)=>compare\(false\)\)/);
 assert.match(script,/after\.addEventListener\('click',\(\)=>compare\(true\)\)/);
 assert.match(script,/cancel\.addEventListener\('click',\(\)=>stop\(false\)\)/);
 assert.match(script,/apply\.addEventListener\('click',\(\)=>stop\(true\)\)/);
 assert.match(script,/dock\?\.getBoundingClientRect\(\)\.bottom/);
 assert.match(style,/\.sv-paper-smooth-layer\[hidden\]\{display:none!important\}/);
 assert.match(style,/\.sv-paper-smooth-choices\[hidden\]\{display:none!important\}/);
 assert.match(style,/sv-paper-light-surface \.sv-paper-smooth-choices/);
 assert.match(style,/\.sv-paper-smooth-bar > button\[aria-pressed="true"\]/);
 assert.match(style,/sv-paper-light-surface \.sv-paper-smooth-bar/);
});

test('preview edits only pen and pencil, preserving text, photos and undo history',()=>{
 assert.match(script,/const eligible=stroke=>\['pen','pencil'\]\.includes\(stroke\.tool\)/);
 assert.match(script,/proposal=paper\.getEditableStrokes\(indices\)/);
 assert.match(script,/const next=heart\|\|oval\|\|letterC\|\|fitStraight\(stroke\.points\)\|\|smoothPoints\(stroke\.points\)/);
 assert.match(script,/guess=heart\?'heart':oval\?'o':letterC\?'c':guessIntent\(stroke\.points,true\)/);
 assert.match(script,/if\(suggested\)\{chooseShape\(suggested\);return\}/);
 assert.match(script,/paper\.previewStrokeEdit\(next\?proposal:original\)/);
 assert.match(script,/if\(commit\)\{\s*if\(hasChanges\)\{if\(!paper\.applyStrokeEdit\(proposal\)/);
 assert.match(script,/else if\(restore\)paper\.previewStrokeEdit\(original\)/);
 assert.match(engine,/applyStrokeEdit:next=>\{[\s\S]*rememberUndo\(\{type:'replace',previous:before\}\)/);
 assert.match(engine,/previewStrokeEdit:next=>\{\s*if\(!pending&&Array\.isArray\(next\)\)paint\(canvas,\{\.\.\.data,strokes:next\}\)/);
 assert.match(script,/if\(active\)stop\(false,false\)/);
 assert.match(script,/paper\.announce\?\.\('Штрихи уже ровные — исправлять нечего\. Можно подсказать Сэйви через «Это…»\.'\)/);
 assert.match(engine,/announce:message=>report\(message\)/);
 assert.match(script,/event\.key==='Escape'/);
 assert.match(engine,/dialog\.classList\.contains\('sv-paper-smooth-mode'\)\)return;/);
 assert.match(gestures,/dialog\.classList\.contains\('sv-paper-smooth-mode'\)/);
 assert.match(html,/assets\/notebook-paper\.js\?v=44/);
 assert.match(html,/assets\/seyveo-paper-gestures\.js\?v=9/);
 assert.match(html,/assets\/seyveo-paper-smooth\.css\?v=2/);
 assert.match(html,/assets\/seyveo-paper-smooth\.js\?v=10/);
});
