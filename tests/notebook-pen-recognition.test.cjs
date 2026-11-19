const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const paper=fs.readFileSync(path.join(root,'assets/notebook-paper.js'),'utf8');
const recognition=fs.readFileSync(path.join(root,'assets/seyveo-paper-recognition.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

const weightSource=paper.match(/function inkWeight\(s,p\)\{[\s\S]*?\n\}/)?.[0];
const inkWeight=vm.runInNewContext(`${weightSource};inkWeight`,{
 clamp:(n,max)=>Math.max(0,Math.min(max,Math.round(Number(n)||0))),
 SHAPE_TOOLS:new Set(['line','arrow','rect','circle','triangle','diamond'])
});

test('stylus pressure makes ink thinner or thicker without affecting mouse strokes',()=>{
 const pen={tool:'pen',width:10,pressureSensitive:true};
 assert.ok(inkWeight(pen,[0,0,10,0])<inkWeight(pen,[0,0,50,0]));
 assert.ok(inkWeight(pen,[0,0,50,0])<inkWeight(pen,[0,0,95,0]));
 assert.equal(inkWeight({tool:'pen',width:10},[0,0,95,0]),10);
 assert.equal(inkWeight({tool:'eraser',width:10,pressureSensitive:true},[0,0,95,0]),10);
});

test('pencil tilt changes shading while pen strokes do not depend on tilt',()=>{
 const pencil={tool:'pencil',width:6,pressureSensitive:true};
 assert.ok(inkWeight(pencil,[0,0,50,70])>inkWeight(pencil,[0,0,50,0]));
 const pen={tool:'pen',width:6,pressureSensitive:true};
 assert.equal(inkWeight(pen,[0,0,50,70]),inkWeight(pen,[0,0,50,0]));
});

test('handwriting recognition stays opt-in, preserves ink and offers review',()=>{
 assert.match(recognition,/entry\.addEventListener\('click',show\)/);
 assert.match(recognition,/createHandwritingRecognizer/);
 assert.match(recognition,/worker\.recognize\(image\)/);
 assert.match(recognition,/textarea class="sv-pr-text"/);
 assert.match(recognition,/data-pr-save/);
 assert.match(paper,/exportInkOcrPng/);
 assert.match(html,/assets\/seyveo-paper-recognition\.js\?v=1/);
 assert.match(html,/assets\/notebook-paper\.js\?v=21/);
});
