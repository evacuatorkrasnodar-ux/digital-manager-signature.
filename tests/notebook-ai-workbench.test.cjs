const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const requests=require('../assets/seyveo-paper-ai-requests.js');
const client=fs.readFileSync(path.join(root,'assets/seyveo-paper-ai-workbench.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('one ordinary request yields multiple real actions and honest future steps',()=>{
 const result=requests.plan('Сэйви, выровняй линии, прочитай рукопись и проверь ошибки. Нарисуй дерево.');
 assert.deepEqual(result.steps.map(step=>[step.id,step.status]),[
  ['smooth','available'],['recognize','available'],['draw','future'],['spelling','future']
 ]);
 assert.deepEqual(result.steps.filter(step=>step.status==='available').map(step=>step.target),
  ['notePaperSmoothInk','notePaperRecognizeOpen']);
 assert.equal(result.unmatched,false);
});

test('unknown intent is not called a completed AI operation',()=>{
 assert.equal(requests.plan('Сэйви, сделай нечто невероятное').unmatched,true);
 assert.equal(requests.plan('Привет').steps.length,0);
 assert.equal(requests.plan('нарисуй кота').steps[0].status,'future');
 assert.equal(requests.plan('мой почерк и напечатай надпись').steps.length,2);
 assert.ok(requests.plan('x'.repeat(1200)).request.length<=600);
});

test('workbench reuses genuine Paper tools without mutating the page or calling a pretend model',()=>{
 assert.match(client,/actions\.insertBefore\(entry,actions\.firstElementChild\)/);
 assert.match(client,/target\.click\(\)/);
 assert.match(client,/button\.disabled=true/);
 assert.match(client,/results\.replaceChildren\(\)/);
 assert.match(client,/Ничего не изменено/);
 assert.match(html,/seyveo-paper-ai-requests\.js\?v=2/);
 assert.match(html,/seyveo-paper-ai-workbench\.js\?v=2/);
 assert.match(html,/seyveo-paper-ai-workbench\.css\?v=2/);
});

test('a model proposal must satisfy geometry and consent before joining the original ink',()=>{
 const valid={kind:'paper-preview',requiresConfirmation:true,originalUntouched:true,title:'Дерево',
  strokes:[{tool:'pen',color:'#171e29',width:4,points:[[30,40,50],[50,60,50]]}]};
 const normalized=requests.verifyDraft(valid);
 assert.ok(normalized);
 assert.deepEqual(normalized.strokes[0].points[0],[30,40,50]);
 assert.equal(requests.verifyDraft({...valid,requiresConfirmation:false}),null);
 assert.equal(requests.verifyDraft({...valid,strokes:[{...valid.strokes[0],points:[[30,40,50],[10000,60,50]]}]}),null);
 assert.equal(requests.verifyDraft({...valid,strokes:[{...valid.strokes[0],color:'url(javascript:alert(1))'}]}),null);
 assert.equal(requests.verifyDraft({...valid,strokes:Array.from({length:61},()=>valid.strokes[0])}),null);
 assert.match(client,/\[\.\.\.old,\.\.\.draft\.strokes\]/);
 assert.match(client,/paper\.applyStrokeEdit/);
 assert.match(client,/localPC\(\)/);
 assert.match(client,/\/api\/seyveo-paper-draft/);
});
