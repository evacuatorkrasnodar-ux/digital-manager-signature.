const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const source=readFileSync(join(root,'assets/management.js'),'utf8');
const group=source.match(/\{id:'paper',name:'SEYVEO Paper · умный Блокнот',items:\[([\s\S]*?)\n \]\},/);
const entries=group?.[1].matchAll(/\['(paper_[a-z_]+)','[^']*','[^']*','(ready|demo|plan)'\]/g);
const roadmap=[...(entries||[])].map(match=>({id:match[1],status:match[2]}));

test('Paper roadmap lists every feature once and preserves known progress keys',()=>{
 assert.ok(group,'Paper group must remain in management');
 assert.equal(roadmap.length,19);
 assert.equal(new Set(roadmap.map(item=>item.id)).size,19);
 const count=status=>roadmap.filter(item=>item.status===status).length;
 assert.deepEqual([count('ready'),count('demo'),count('plan')],[8,5,6]);
 const status=id=>roadmap.find(item=>item.id===id)?.status;
 assert.equal(status('paper_smooth'),'demo');
 assert.equal(status('paper_handwriting_ocr'),'demo');
 assert.equal(status('paper_scanner'),'demo');
 assert.equal(status('paper_ai_drawing'),'plan');
 assert.equal(status('paper_ai_understanding'),'plan');
 assert.equal(status('paper_spelling'),'plan');
 assert.equal(status('paper_typeset_hand'),'demo');
 assert.equal(status('paper_living_handwriting'),'demo');
 for(const id of ['paper_text','paper_actions','paper_to_calendar','paper_sheet','paper_tools',
  'paper_stylus','paper_photo','paper_export','paper_scanner','paper_handwriting_ocr',
  'paper_picture_layers','paper_smooth','paper_spelling','paper_beauty','paper_typeset_hand',
  'paper_living_handwriting','paper_documents'])assert.ok(status(id),id+' progress key removed');
});

test('the current UI requests a fresh management script instead of cached roadmap',()=>{
 const html=readFileSync(join(root,'index.html'),'utf8');
 assert.match(html,/assets\/management\.js\?v=66/);
});

test('the unified Paper mission is recorded without duplicating roadmap items',()=>{
 const mission=readFileSync(join(root,'docs/SEYVEO-PAPER-AI-UNIFIED-SPEC.md'),'utf8');
 const master=readFileSync(join(root,'docs/SEYVEO-IDEAS-MASTER.md'),'utf8');
 for(const id of ['paper_ai_drawing','paper_ai_understanding','paper_handwriting_ocr',
  'paper_spelling','paper_living_handwriting','paper_typeset_hand','paper_documents']){
  assert.match(mission,new RegExp('`'+id+'`'),id+' is included in the unified brief');
 }
 assert.match(master,/SEYVEO-PAPER-AI-UNIFIED-SPEC\.md/);
 assert.match(mission,/не обещание|не означает|нельзя объявлять/);
 assert.equal(roadmap.length,19,'no extra management card is added');
});
