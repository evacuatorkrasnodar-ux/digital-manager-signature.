const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/notebook-paper.js'),'utf8');
const controls=fs.readFileSync(path.join(root,'assets/seyveo-paper-typed-text.js'),'utf8');
const style=fs.readFileSync(path.join(root,'assets/seyveo-paper-typed-text.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const extract=(start,end)=>{
 const s=source.indexOf(start),e=source.indexOf(end,s+start.length);
 assert.ok(s>=0&&e>s,`missing ${start}`);
 return source.slice(s,e);
};

test('printed text survives normalization with exact Russian text and strict limits',()=>{
 const code=extract('function normalizeTextObject(item,height){','function normalize(obj){');
 const sandbox={MAX_TEXT_LENGTH:500,W:840,
  inkCoord:(n,max)=>Math.max(0,Math.min(max,Math.round((Number(n)||0)*10)/10)),
  validInkColor:c=>/^#[0-9a-fA-F]{6}$/.test(c)};
 const normalize=vm.runInNewContext(code+'\nnormalizeTextObject',sandbox);
 const result=normalize({text:'  Привет, Роман!\nНовая строка  ',x:80.24,y:194,size:45,width:525,color:'#3B77DF'},1188);
 assert.equal(result.text,'Привет, Роман!\nНовая строка');
 assert.equal(result.x,80.2);
 assert.equal(result.size,45);
 assert.equal(result.color,'#3b77df');
 assert.equal(normalize({text:'  ',x:1},1188),null,'empty text is not stored');
 const invalid=normalize({text:'А'.repeat(700),x:-100,y:9000,size:800,width:9999,color:'red'},1188);
 assert.equal(invalid.text.length,500);
 assert.equal(invalid.x,0);assert.equal(invalid.y,1068);
 assert.equal(invalid.size,104);assert.equal(invalid.color,'#171e29');
});

test('full sheet normalization preserves typed text alongside old ink and paper',()=>{
 const code=extract('function normalizeTextObject(item,height){','function inkWeight(s,p){');
 const sandbox={W:840,H:1188,MAX_PAGE_HEIGHT:2600,MAX_STROKES:250,MAX_POINTS:1300,
  MAX_PHOTO:155000,MAX_TEXTS:24,MAX_TEXT_LENGTH:500,
  patterns:['blank','lines','dots','grid'],tools:['pen','pencil','eraser','lasso','line','arrow','rect','circle','triangle','diamond'],
  inkCoord:(n,max)=>Math.max(0,Math.min(max,Math.round((Number(n)||0)*10)/10)),
  clamp:(n,max)=>Math.max(0,Math.min(max,Math.round(Number(n)||0))),
  validInkColor:c=>/^#[0-9a-fA-F]{6}$/.test(c),validGradient:()=>false};
 const normalize=vm.runInNewContext(code+'\nnormalize',sandbox);
 const before={pattern:'lines',background:'light',height:1188,
  strokes:[{tool:'pen',color:'#171e29',width:5,points:[[100,200,50]]}],
  texts:[{text:'Встреча с Романом',x:74,y:140,size:44,width:480,color:'#27609b'}]};
 const after=normalize(normalize(before));
 assert.equal(after.pattern,'lines');
 assert.equal(after.strokes.length,1);
 assert.equal(after.texts.length,1);
 assert.equal(after.texts[0].text,'Встреча с Романом');
 assert.equal(after.texts[0].color,'#27609b');
});

test('printed text paints into real page canvas and PNG previews, underneath ink',()=>{
 const code=extract('function paintText(ctx,item,pageH){','function paint(target,obj,background=false){');
 const drawn=[];
 const ctx={save(){},restore(){},measureText:value=>({width:value.length*12}),
  fillText:(value,x,y)=>drawn.push({value,x,y})};
 const draw=vm.runInNewContext(code+'\npaintText',{W:840});
 draw(ctx,{text:'Мама\nЛекарства',size:40,x:100,y:140,width:400,color:'#171e29'},1188);
 assert.deepEqual(drawn.map(x=>x.value),['Мама','Лекарства']);
 assert.equal(drawn[0].x,100);assert.equal(drawn[1].y,140+40*1.28);
 const paintBody=extract('function paint(target,obj,background=false){','function fitPaper(){');
 assert.ok(paintBody.indexOf('paintText(ctx,p.texts[i],pageH)')<paintBody.indexOf('paintStroke(ctx,s)'),
  'text is behind handwriting, allowing ink on top');
 assert.match(source,/paint\(out,p,true\);return out\.toDataURL\('image\/png'\)/);
});

test('typed text has native undo, save, reopen, clearing and iPhone ink isolation',()=>{
 assert.match(source,/texts:\(Array\.isArray\(p\.texts\)\?p\.texts:\[\]\)/);
 assert.match(source,/texts:\(data\.texts\|\|\[\]\)\.slice\(\)/);
 assert.match(source,/data\.texts=\(snapshot\.texts\|\|\[\]\)\.slice\(\)/);
 assert.match(source,/addTextObject:item=>\{[\s\S]*?rememberUndo\(\{type:'sheet',previous:snapshotSheet\(\)\}\)/);
 assert.match(source,/updateTextObject:\(index,changes\)=>\{[\s\S]*?rememberUndo\(\{type:'sheet',previous:snapshotSheet\(\)\}\)/);
 assert.match(source,/data\.strokes=\[\];data\.texts=\[\];data\.photo=''/);
 assert.match(source,/if\(!data\.strokes\.length&&!data\.photo&&!data\.texts\?\.length\)/);
 assert.match(source,/text:page\.texts\.length&&!page\.strokes\.length&&!page\.photo\?'Лист с текстом'/);
 assert.match(source,/dialog\.classList\.contains\('sv-paper-text-mode'\)\)return;/);
 assert.match(source,/dialog\.classList\.contains\('sv-paper-text-mode'\)\|\|finger!==null/);
});

test('text mode reuses Settings actions and supports touch placement, drag, font and color',()=>{
 assert.match(controls,/actions\.insertBefore\(action,actions\.querySelector\('#notePaperAddPhoto'\)\)/);
 assert.match(controls,/layer\.addEventListener\('click'/);
 assert.match(controls,/box\.addEventListener\('touchmove'/);
 assert.match(controls,/paper\.updateTextObject\(index,next\)/);
 assert.match(controls,/draft\.size=Math\.max\(24,Math\.min\(104,draft\.size\+step\)\)/);
 assert.match(controls,/paper\.getInkColor\(\)/);
 assert.match(controls,/textarea|createElement\('textarea'\)/);
 assert.match(style,/\.sv-paper-text-layer\[hidden\]\{display:none!important\}/);
 assert.match(style,/\.sv-paper-text-hit\.sv-paper-text-dragging/);
 assert.match(html,/assets\/seyveo-paper-typed-text\.js\?v=2/);
 assert.match(html,/assets\/seyveo-paper-typed-text\.css\?v=1/);
 assert.match(html,/assets\/notebook-paper\.js\?v=40/);
});
