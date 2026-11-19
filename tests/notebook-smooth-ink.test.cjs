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
  constructor(id=''){this.id=id;this.children=[];this.listeners={};this.attributes={};this.style={};
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
 const [before,after,cancel,apply]=bar.children;
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
 source=[];
 dialog.fire('sv-paper-render');
 assert.equal(action.hidden,false,'the command remains visible on a blank page');
 action.click();
 assert.equal(announcements.at(-1),'Сначала напиши или нарисуй что-нибудь ручкой.');
 assert.equal(overlay.hidden,true);
 assert.equal(applied.length,1,'blank-page tip never commits an edit');
});

test('a tiny, material-matched comparison bar offers explicit Apply and Cancel',()=>{
 assert.match(script,/actions\.insertBefore\(action,actions\.querySelector\('#notePaperAddPhoto'\)\)/);
 assert.doesNotMatch(script,/action\.hidden=/,'the command cannot disappear on a clean sheet');
 assert.match(script,/paper\.announce\?\.\('Сначала напиши или нарисуй что-нибудь ручкой\.'\)/);
 assert.match(script,/const before=document\.createElement\('button'\);before\.type='button';before\.textContent='До'/);
 assert.match(script,/const after=document\.createElement\('button'\);after\.type='button';after\.textContent='После'/);
 assert.match(script,/const cancel=document\.createElement\('button'\);cancel\.type='button';cancel\.textContent='Отмена'/);
 assert.match(script,/const apply=document\.createElement\('button'\);apply\.type='button';apply\.textContent='Применить'/);
 assert.match(script,/before\.addEventListener\('click',\(\)=>compare\(false\)\)/);
 assert.match(script,/after\.addEventListener\('click',\(\)=>compare\(true\)\)/);
 assert.match(script,/cancel\.addEventListener\('click',\(\)=>stop\(false\)\)/);
 assert.match(script,/apply\.addEventListener\('click',\(\)=>stop\(true\)\)/);
 assert.match(script,/dock\?\.getBoundingClientRect\(\)\.bottom/);
 assert.match(style,/\.sv-paper-smooth-layer\[hidden\]\{display:none!important\}/);
 assert.match(style,/\.sv-paper-smooth-bar > button\[aria-pressed="true"\]/);
 assert.match(style,/sv-paper-light-surface \.sv-paper-smooth-bar/);
});

test('preview edits only pen and pencil, preserving text, photos and undo history',()=>{
 assert.match(script,/const eligible=stroke=>\['pen','pencil'\]\.includes\(stroke\.tool\)/);
 assert.match(script,/proposal=paper\.getEditableStrokes\(indices\)/);
 assert.match(script,/next=fitHeart\(stroke\.points\)\|\|fitOval\(stroke\.points\)\|\|fitStraight\(stroke\.points\)\|\|smoothPoints\(stroke\.points\)/);
 assert.match(script,/paper\.previewStrokeEdit\(next\?proposal:original\)/);
 assert.match(script,/if\(commit\)\{\s*if\(!paper\.applyStrokeEdit\(proposal\)/);
 assert.match(script,/else if\(restore\)paper\.previewStrokeEdit\(original\)/);
 assert.match(engine,/applyStrokeEdit:next=>\{[\s\S]*rememberUndo\(\{type:'replace',previous:before\}\)/);
 assert.match(engine,/previewStrokeEdit:next=>\{\s*if\(!pending&&Array\.isArray\(next\)\)paint\(canvas,\{\.\.\.data,strokes:next\}\)/);
 assert.match(script,/if\(active\)stop\(false,false\)/);
 assert.match(script,/paper\.announce\?\.\('Штрихи уже ровные — исправлять нечего\.'\)/);
 assert.match(engine,/announce:message=>report\(message\)/);
 assert.match(script,/event\.key==='Escape'/);
 assert.match(engine,/dialog\.classList\.contains\('sv-paper-smooth-mode'\)\)return;/);
 assert.match(gestures,/dialog\.classList\.contains\('sv-paper-smooth-mode'\)/);
 assert.match(html,/assets\/notebook-paper\.js\?v=44/);
 assert.match(html,/assets\/seyveo-paper-gestures\.js\?v=9/);
 assert.match(html,/assets\/seyveo-paper-smooth\.css\?v=1/);
 assert.match(html,/assets\/seyveo-paper-smooth\.js\?v=5/);
});
