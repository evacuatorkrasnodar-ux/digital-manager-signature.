/* Native-free functional regression of SEYVEO Docs developer studio.
 * Checks genuine offline bytes, real tool controls, and privacy contract.
 */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const exportCode=fs.readFileSync(path.join(root,'assets/seyveo-docs-export.js'),'utf8');
const studioCode=fs.readFileSync(path.join(root,'assets/seyveo-docs-studio.js'),'utf8');
const tinyJpeg=Uint8Array.from([255,216,255,224,0,16,74,70,73,70,0,255,217]);

function exporter(){
 const window={};
 vm.runInNewContext(exportCode,{window,TextEncoder,Uint8Array,Blob});
 return window.SEYVEO_DOCS_EXPORT;
}

test('real generated scanned PDF has pages, JPEG objects, xref and EOF',async()=>{
 const api=exporter();
 const page={width:300,height:400,jpegBytes:tinyJpeg};
 const file=api.pdfFromJpegs([page,page]);
 assert.equal(file.type,'application/pdf');
 const result=Buffer.from(await file.arrayBuffer()).toString('latin1');
 assert.match(result,/^%PDF-1\.4/);
 assert.match(result,/\/Count 2\b/);
 assert.match(result,/\/Subtype \/Image/g);
 assert.match(result,/\/Filter \/DCTDecode/);
 assert.match(result,/xref\n0 9\n/);
 assert.match(result,/startxref\n\d+\n%%EOF/);
 assert.equal((result.match(/0 obj/g)||[]).length,8);
});
test('DOCX is a real ZIP with editable OOXML document and escaped text',async()=>{
 const api=exporter();
 const blob=api.docxFromText('Привет & мир\n<Договор> "тест"');
 assert.equal(blob.type,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
 const result=Buffer.from(await blob.arrayBuffer()).toString('utf8');
 assert.match(result,/^PK\x03\x04/);
 assert.match(result,/\[Content_Types\]\.xml/);
 assert.match(result,/word\/document\.xml/);
 assert.match(result,/officeDocument/);
 assert.match(result,/Привет &amp; мир/);
 assert.match(result,/&lt;Договор&gt; &quot;тест&quot;/);
 assert.match(result,/PK\x01\x02/);
 assert.match(result,/PK\x05\x06/);
});
test('export refuses malformed pages, excessive count, blank or oversized text',()=>{
 const api=exporter();
 assert.throws(()=>api.pdfFromJpegs([]),/страниц/);
 assert.throws(()=>api.pdfFromJpegs(Array(13).fill({
  width:20,height:20,jpegBytes:tinyJpeg
 })),/страниц/);
 assert.throws(()=>api.pdfFromJpegs([{
  width:300,height:400,jpegBytes:Uint8Array.of(22,44,55,66)
 }]),/Неверное/);
 assert.throws(()=>api.docxFromText(' '),/Введите текст/);
 assert.throws(()=>api.docxFromText('x'.repeat(61000)),/Введите текст/);
});

class FakeNode {
 constructor(tag='div'){
  this.tagName=tag.toUpperCase();this.children=[];this.listeners={};
  this.textContent='';this.className='';this.hidden=false;
  this.value='';this.files=[];this.dataset={};this.attributes={};
  this.parentNode=null;this.style={};
  this.width=650;this.height=240;
 }
 append(...nodes){for(const n of nodes){this.children.push(n);n.parentNode=this;}}
 replaceChildren(...nodes){for(const c of this.children)c.parentNode=null;
  this.children=[];this.append(...nodes);}
 setAttribute(name,value){this.attributes[name]=value;}
 addEventListener(key,fn){(this.listeners[key]??=[]).push(fn);}
 click(){for(const fn of this.listeners.click??[])fn({target:this});}
 remove(){if(!this.parentNode)return;const p=this.parentNode;
  p.children.splice(p.children.indexOf(this),1);this.parentNode=null;}
 emit(type,values={}){for(const fn of this.listeners[type]??[])
  fn({target:this,preventDefault(){},pointerId:1,clientX:100,clientY:80,...values});}
 getBoundingClientRect(){return{left:0,top:0,width:650,height:240};}
 setPointerCapture(){}
 getContext(){
  const canvas=this;
  return {
   fillStyle:'#fff',font:'28px Arial',strokeStyle:'#222',
   lineWidth:3.5,lineCap:'round',lineJoin:'round',
   fillRect(){},drawImage(){},fillText(){},clearRect(){},
   beginPath(){},moveTo(){},lineTo(){},stroke(){},
   measureText:t=>({width:t.length*20})
  };
 }
 toDataURL(){return 'data:image/jpeg;base64,'+Buffer.from(tinyJpeg).toString('base64');}
 toBlob(callback){callback(new Blob([tinyJpeg],{type:'image/png'}));}
 querySelector(selector){
  const search=n=>{
   if(selector.startsWith('.')&&n.className.split(/\s+/).includes(selector.slice(1)))
    return n;
   for(const child of n.children){const hit=search(child);if(hit)return hit;}
   return null;
  };
  return search(this);
 }
}
function find(root,predicate){
 const found=[],walk=n=>{
  if(predicate(n))found.push(n);
  for(const child of n.children)walk(child);
 };
 walk(root);return found;
}
function label(root,text){
 const hits=find(root,n=>n.tagName==='BUTTON'&&n.textContent===text);
 assert.ok(hits.length,'Missing action '+text);
 return hits.at(-1);
}
function fixture(){
 let picked=0,created=[],saved=[],revoked=[];
 const document={
  createElement:tag=>new FakeNode(tag),
  body:new FakeNode('body')
 };
 const mockUrl={
  createObjectURL(blob){const value='blob:studio-'+(created.length+1);
   created.push({url:value,blob});return value;},
  revokeObjectURL(url){revoked.push(url);}
 };
 class FakeImage{
  constructor(){this.naturalWidth=800;this.naturalHeight=1100;}
  set src(value){if(value)this.onload?.();}
 }
 const window={
  setTimeout:callback=>callback(),
  SEYVEO_DOCS_EXPORT:exporter()
 };
 const context={
  document,window,URL:mockUrl,Image:FakeImage,
  Blob,File,TextEncoder,Uint8Array,atob:globalThis.atob,
  Date,Error
 };
 vm.runInNewContext(studioCode,context,{filename:'seyveo-docs-studio.js'});
 const root=new FakeNode('main');
 window.SEYVEO_DOCS_STUDIO.mount(root,{
  area:'personal',
  getCurrentFile:()=>null,
  onPick:()=>{picked++;},
  onImport:file=>{saved.push(file);},
  onSayvi:()=>{}
 });
 return {root,window,created,saved,revoked,get picked(){return picked;}};
}
test('all five controls mount and each action opens an actual tool',()=>{
 const f=fixture();
 for(const name of ['Сканировать','Добавить файл','Создать','Подписать','Печать'])
  assert.ok(label(f.root,name));
 label(f.root,'Добавить файл').click();
 assert.equal(f.picked,1);
 label(f.root,'Создать').click();
 assert.ok(find(f.root,n=>n.tagName==='TEXTAREA').length);
 assert.ok(label(f.root,'Сохранить Word'));
 label(f.root,'Подписать').click();
 assert.ok(find(f.root,n=>n.tagName==='CANVAS').length);
 assert.ok(label(f.root,'Сохранить PNG'));
 label(f.root,'Печать').click();
 assert.ok(label(f.root,'Выбрать файл'));
 assert.ok(find(f.root,n=>n.tagName==='A'&&n.textContent==='Открыть для печати').length===0);
 label(f.root,'Сканировать').click();
 assert.ok(label(f.root,'Камера'));
 assert.ok(label(f.root,'Фото из галереи'));
 assert.match(studioCode,/без отправки в интернет/);
});
test('developer creates actual Word from editable text and can draw a PNG',()=>{
 const f=fixture();
 label(f.root,'Создать').click();
 const textarea=find(f.root,n=>n.tagName==='TEXTAREA')[0];
 textarea.value='Свой документ. Проверка редактора.';
 label(f.root,'Сохранить Word').click();
 assert.ok(f.created.some(x=>x.blob.type.includes('wordprocessingml.document')));
 label(f.root,'Подписать').click();
 const canvas=find(f.root,n=>n.tagName==='CANVAS')[0];
 canvas.emit('pointerdown');
 canvas.emit('pointermove');
 canvas.emit('pointerup');
 label(f.root,'Сохранить PNG').click();
 assert.ok(f.created.some(x=>x.blob.type==='image/png'));
});
test('photos make a real local PDF, permit explicit import to the vault',async()=>{
 const f=fixture();
 label(f.root,'Сканировать').click();
 const input=find(f.root,n=>n.tagName==='INPUT'&&n.accept==='image/jpeg,image/png,image/webp')[0];
 assert.ok(input);
 input.files=[new File([tinyJpeg],'photo.jpg',{type:'image/jpeg'})];
 input.emit('change');
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(label(f.root,'Сохранить PDF'));
 label(f.root,'Сохранить PDF').click();
 assert.ok(f.created.some(x=>x.blob.type==='application/pdf'));
 label(f.root,'В архив').click();
 assert.equal(f.saved.length,1);
 assert.equal(f.saved[0].type,'application/pdf');
 assert.match(f.saved[0].name,/скан\.pdf/);
 f.window.SEYVEO_DOCS_STUDIO.reset();
 assert.ok(f.revoked.length>=1);
});
test('staging tool has no network APIs, fake OCR or legally binding signature claim',()=>{
 assert.doesNotMatch(studioCode,/\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
 assert.match(studioCode,/Автоуглы и OCR добавим/);
 assert.match(studioCode,/не КЭП/);
 assert.match(studioCode,/не утверждает, что принтер найден/);
 assert.match(studioCode,/SEYVEO_DOCS_EXPORT\.pdfFromJpegs/);
 assert.match(studioCode,/SEYVEO_DOCS_EXPORT\.docxFromText/);
});
