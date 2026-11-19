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
 assert.match(html,/seyveo-paper-ai-requests\.js\?v=1/);
 assert.match(html,/seyveo-paper-ai-workbench\.js\?v=1/);
 assert.match(html,/seyveo-paper-ai-workbench\.css\?v=1/);
});
