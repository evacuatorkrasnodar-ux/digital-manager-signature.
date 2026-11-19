const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const engine=fs.readFileSync(path.join(root,'assets/notebook-paper.js'),'utf8');
const editor=fs.readFileSync(path.join(root,'assets/seyveo-paper-photo-edit.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/seyveo-paper-photo-edit.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const gestures=fs.readFileSync(path.join(root,'assets/seyveo-paper-gestures.js'),'utf8');
function extract(start,end){
 const begin=engine.indexOf(start),finish=engine.indexOf(end,begin+start.length);
 assert.ok(begin>=0&&finish>begin,`missing ${start}`);
 return engine.slice(begin,finish);
}

test('photo positions are bounded, numeric and backward-compatible',()=>{
 const code=extract('function normalizePhotoLayout(layout,height){','function normalizeTextObject(item,height){');
 const {normalizePhotoLayout,photoBounds}=vm.runInNewContext(code+'\n({normalizePhotoLayout,photoBounds})',{W:840,H:1188});
 assert.equal(normalizePhotoLayout(null,1188),null);
 const safe=normalizePhotoLayout({x:-100,y:30000,scale:99},1400);
 assert.equal(safe.x,32);assert.equal(safe.y,1368);assert.equal(safe.scale,3.2);
 const legacy=photoBounds({height:1188,photoLayout:null},{naturalWidth:1200,naturalHeight:800});
 assert.equal(legacy.x,0);assert.equal(legacy.y,314);assert.equal(legacy.width,840);assert.equal(legacy.height,560);
 const moved=photoBounds({height:1188,photoLayout:{x:300,y:450,scale:.5}},{naturalWidth:1200,naturalHeight:800});
 assert.equal(moved.x,90);assert.equal(moved.y,310);assert.equal(moved.width,420);assert.equal(moved.height,280);
});

test('photo position is saved beside ink, text and undo snapshots',()=>{
 assert.match(engine,/photoLayout:normalizePhotoLayout\(p\.photoLayout,height\)/);
 assert.match(engine,/photoLayout:data\.photoLayout\?\{\.\.\.data\.photoLayout\}:null/);
 assert.match(engine,/data\.photoLayout=snapshot\.photoLayout\?\{\.\.\.snapshot\.photoLayout\}:null/);
 assert.match(engine,/setPhotoLayout:next=>\{[\s\S]*rememberUndo\(\{type:'sheet',previous:snapshotSheet\(\)\}\)/);
 assert.match(engine,/data\.photo=image;data\.photoLayout=null/);
 assert.match(engine,/data\.photo='';data\.photoLayout=null/);
});

test('visible picture and exported PNG use one shared frame calculation',()=>{
 assert.match(engine,/const bounds=photoBounds\(p,bitmap\);[\s\S]*?ctx\.drawImage\(bitmap,bounds\.x,bounds\.y,bounds\.width,bounds\.height\)/);
 assert.match(engine,/const bounds=photoBounds\(data,photoView\)/);
 assert.match(engine,/photoView\.style\.left=bounds\.x\/W\*100/);
 assert.match(engine,/photoView\.style\.height=bounds\.height\/\(data\.height\|\|H\)\*100/);
 assert.match(engine,/photoView\?\.addEventListener\('load'/);
 assert.match(css,/\.paper-photo-image\{\s*inset:auto;object-fit:fill/);
});

test('PNG painter exports a moved, half-sized image at its exact sheet coordinates',()=>{
 const geometry=extract('function normalizePhotoLayout(layout,height){','function normalizeTextObject(item,height){');
 const painter=extract('function paint(target,obj,background=false){','function fitPaper(){');
 const draws=[];
 const context={save(){},restore(){},setTransform(){},clearRect(){},fillRect(){},
  drawImage(...args){draws.push(args)}};
 const sandbox={W:840,H:1188,canvas:{},hiddenTextIndex:-1,
  normalize:p=>p,photoImage:()=>({naturalWidth:1200,naturalHeight:800}),
  paintStroke(){},paintText(){}};
 const paint=vm.runInNewContext(geometry+painter+'\npaint',sandbox);
 paint({width:840,height:1188,getContext:()=>context},
  {height:1188,photo:'mock-image',photoLayout:{x:300,y:450,scale:.5},
   strokes:[],texts:[],background:'light',pattern:'blank'},true);
 assert.equal(draws.length,1);
 assert.deepEqual(draws[0].slice(1),[90,310,420,280]);
});

test('compact editor has drag and resize, iPhone touch handlers and no extra persistent dock',()=>{
 assert.match(editor,/actions\.insertBefore\(action,actions\.querySelector\('#notePaperRemovePhoto'\)\)/);
 assert.match(editor,/action\.hidden=!paper\.hasPhoto\(\)/);
 assert.match(editor,/const factor=1\+\(dx\*vx\+dy\*vy\)\/\(vx\*vx\+vy\*vy\)/);
 assert.match(editor,/frame\.addEventListener\('touchstart'/);
 assert.match(editor,/frame\.addEventListener\('touchmove'/);
 assert.match(editor,/frame\.addEventListener\('touchcancel'/);
 assert.match(editor,/frame\.addEventListener\('pointerdown'/);
 assert.match(editor,/paper\.setPhotoLayout\(layout\)/);
 assert.match(editor,/dock\?\.getBoundingClientRect\(\)\.bottom/);
 assert.match(gestures,/dialog\.classList\.contains\('sv-paper-photo-mode'\)/);
 assert.match(engine,/dialog\.classList\.contains\('sv-paper-photo-mode'\)/);
 assert.match(html,/assets\/seyveo-paper-photo-edit\.js\?v=1/);
 assert.match(html,/assets\/seyveo-paper-photo-edit\.css\?v=2/);
 assert.match(css,/> #notePaperEditPhoto\[hidden\],\s*#notePaperDialog \.sv-paper-photo-edit-layer\[hidden\]\{display:none!important\}/);
 assert.match(html,/assets\/notebook-paper\.js\?v=45/);
 assert.match(html,/assets\/seyveo-paper-gestures\.js\?v=9/);
});
