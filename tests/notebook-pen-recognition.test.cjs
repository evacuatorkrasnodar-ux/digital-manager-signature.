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

test('saved pressure strokes render with changing line widths',()=>{
 const paintSource=paper.match(/function paintStroke\(ctx,s\)\{[\s\S]*?\n\}/)?.[0];
 const paintStroke=vm.runInNewContext(`${weightSource}\n${paintSource};paintStroke`,{
  clamp:(n,max)=>Math.max(0,Math.min(max,Math.round(Number(n)||0))),
  SHAPE_TOOLS:new Set(['line','arrow','rect','circle','triangle','diamond']),
  COLORS:['#171e29'],validGradient:()=>false,validInkColor:()=>true
 });
 const weights=[];
 const context={
  save(){},restore(){},beginPath(){},arc(){},fill(){},moveTo(){},lineTo(){},quadraticCurveTo(){},
  stroke(){weights.push(this.lineWidth)}
 };
 paintStroke(context,{
  tool:'pen',color:'#171e29',width:10,pressureSensitive:true,
  points:[[0,0,10,0],[10,5,30,0],[20,10,95,0],[30,10,95,0]]
 });
 assert.ok(weights.length>=3);
 assert.ok(Math.max(...weights)-Math.min(...weights)>2);
});

test('handwriting recognition stays opt-in, preserves ink and offers review',()=>{
 assert.match(recognition,/entry\.addEventListener\('click',show\)/);
 assert.match(recognition,/createHandwritingRecognizer/);
 assert.match(recognition,/worker\.recognize\(image\)/);
 assert.match(recognition,/textarea class="sv-pr-text"/);
 assert.match(recognition,/data-pr-save/);
 assert.match(paper,/exportInkOcrPng/);
 assert.match(html,/assets\/seyveo-paper-recognition\.js\?v=9/);
 assert.match(html,/assets\/notebook-paper\.js\?v=46/);
});

test('recognition review prevents empty scans and accidental duplicate notes',()=>{
 const source=recognition.match(/const sync=\(\)=>\{[\s\S]*?\n \};/)?.[0];
 const context={busy:false,inkAvailable:true,savedText:'Привет, мир',chatMode:false,
  text:{value:'Привет, мир'},runButton:{},copyButton:{},sheetButton:{},saveButton:{}};
 const sync=vm.runInNewContext(`${source}\nsync`,context);
 sync();
 assert.equal(context.saveButton.disabled,true,'same result cannot be saved twice');
 context.text.value='Привет, мир!';sync();
 assert.equal(context.saveButton.disabled,false,'edited text can be saved');
 context.inkAvailable=false;sync();
 assert.equal(context.runButton.disabled,true,'empty handwritten page cannot start OCR');
 assert.match(recognition,/savedText=value/);
 assert.match(recognition,/data-pr-close aria-label="Закрыть распознавание">Готово/);
});

test('weak handwritten OCR retries sparse lines only once and keeps the stronger reading',()=>{
 const start=recognition.indexOf(' function ocrReading(result){');
 const end=recognition.indexOf(' async function imageRecognition(){',start);
 assert.ok(start>0&&end>start,'the retry decision is independently testable');
 const evaluate=vm.runInNewContext(recognition.slice(start,end)+'\n({ocrReading,retrySparse,bestReading})',{});
 const paragraph=evaluate.ocrReading({data:{text:'  Привет, Роман!  ',confidence:83}});
 assert.equal(paragraph.text,'Привет, Роман!');
 assert.equal(evaluate.retrySparse(paragraph),false,'a clear sentence does not waste iPhone CPU');
 assert.equal(evaluate.retrySparse({text:'',confidence:null}),true);
 assert.equal(evaluate.retrySparse({text:'Првет',confidence:29}),true);
 const sparse={text:'Привет, Роман!',confidence:72};
 assert.equal(evaluate.bestReading({text:'Првет, Роман',confidence:37},sparse),sparse);
 assert.equal(evaluate.bestReading(paragraph,{text:'П',confidence:96}),paragraph,
  'one confident character must not replace a whole sentence');
 assert.equal(evaluate.bestReading(paragraph,{text:'Привeт',confidence:63}),paragraph);
 assert.match(recognition,/tessedit_pageseg_mode:'11'/);
});

test('only confusable Latin letters in predominantly Cyrillic words are suggested',()=>{
 const start=recognition.indexOf(' const latinTwins=Object.freeze(');
 const end=recognition.indexOf(' function updateScriptSuggestion(){',start);
 assert.ok(start>0&&end>start);
 const proposal=vm.runInNewContext(recognition.slice(start,end)+'\nmixedScriptProposal',{});
 const result=proposal('Привeт, Рoман!');
 assert.equal(result.text,'Привет, Роман!');
 assert.equal(result.count,2);
 assert.equal(proposal('Hello Apple 2026').count,0);
 assert.equal(proposal('Иванov').count,0,'unknown characters must not be guessed');
 assert.equal(proposal('Роман').count,0);
 assert.equal(proposal('Aа').count,0,'a two-character ambiguous token is not confidently Russian');
 assert.match(recognition,/data-pr-fix-script hidden/);
});
