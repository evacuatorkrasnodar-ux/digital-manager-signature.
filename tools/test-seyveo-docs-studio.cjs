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
   translate(){},rotate(){},
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
function fixture({shareNavigator=null,deferImageLoad=false}={}){
 let picked=0,created=[],saved=[],revoked=[],pendingImages=[];
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
  set src(value){
   if(!value)return;
   if(deferImageLoad)pendingImages.push(this);
   else this.onload?.();
  }
 }
 const window={
  setTimeout:callback=>callback(),
  SEYVEO_DOCS_EXPORT:exporter()
 };
 const context={
  document,window,URL:mockUrl,Image:FakeImage,
  Blob,File,TextEncoder,Uint8Array,atob:globalThis.atob,
  navigator:shareNavigator,Date,Error
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
 return {
  root,window,created,saved,revoked,
  resumeImages:()=>{
   const queued=pendingImages.splice(0);
   for(const img of queued)img.onload?.();
  },
  get picked(){return picked;}
 };
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
 assert.match(studioCode,/Автоматическая обрезка и OCR пока не подключены/);
 assert.match(studioCode,/не КЭП/);
 assert.match(studioCode,/Принтер и параметры выбираются в системе/);
 assert.match(studioCode,/SEYVEO_DOCS_EXPORT\.pdfFromJpegs/);
 assert.match(studioCode,/SEYVEO_DOCS_EXPORT\.docxFromText/);
});

test('scanner can rotate and reorder real multi-page photos, and sign chosen page',async()=>{
 const f=fixture();
 label(f.root,'Сканировать').click();
 const input=find(f.root,n=>n.tagName==='INPUT'&&n.multiple)[0];
 input.files=[
  new File([tinyJpeg],'one.jpg',{type:'image/jpeg'}),
  new File([tinyJpeg],'two.jpg',{type:'image/jpeg'})
 ];
 input.emit('change');
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(find(f.root,n=>n.textContent==='Страницы · 2').length);
 assert.equal(find(f.root,n=>n.tagName==='BUTTON'&&n.textContent==='↻').length,2);
 const moves=find(f.root,n=>n.tagName==='BUTTON'&&n.textContent==='→');
 assert.equal(moves.length,2);
 assert.equal(moves[0].disabled,false);
 assert.equal(moves[1].disabled,true);
 moves[0].click();
 assert.ok(find(f.root,n=>n.textContent==='Изменён порядок страниц.').length);
 label(f.root,'↻').click();
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(find(f.root,n=>n.textContent.includes('повёрнута на 90°')).length);
 label(f.root,'Подписать').click();
 const selector=find(f.root,n=>n.tagName==='SELECT')[0];
 assert.ok(selector);
 assert.equal(selector.children.length,2);
 selector.value='0';
 const canvas=find(f.root,n=>n.tagName==='CANVAS')[0];
 canvas.emit('pointerdown');canvas.emit('pointermove');canvas.emit('pointerup');
 label(f.root,'Добавить подпись в PDF').click();
 await new Promise(resolve=>setImmediate(resolve));
 const pdfs=f.created.filter(x=>x.blob.type==='application/pdf');
 assert.equal(pdfs.length,1);
 const pdf=Buffer.from(await pdfs[0].blob.arrayBuffer()).toString('latin1');
 assert.match(pdf,/\/Count 2\b/);
 assert.ok(find(f.root,n=>n.textContent.includes('странице 1')).length);
});
test('system Save to Files / Share is triggered directly on tap with PDF File',async()=>{
 const sent=[];
 const navigator={
  canShare(data){return data.files?.[0]?.type==='application/pdf';},
  share(data){sent.push(data);return Promise.resolve();}
 };
 const f=fixture({shareNavigator:navigator});
 label(f.root,'Сканировать').click();
 const input=find(f.root,n=>n.tagName==='INPUT'&&n.multiple)[0];
 input.files=[new File([tinyJpeg],'photo.jpg',{type:'image/jpeg'})];
 input.emit('change');
 await new Promise(resolve=>setImmediate(resolve));
 label(f.root,'В Файлы / поделиться').click();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(sent.length,1);
 assert.equal(sent[0].files[0].type,'application/pdf');
 assert.equal(sent[0].files[0].name,'SEYVEO-скан.pdf');
 assert.ok(find(f.root,n=>n.textContent.includes('системное меню')).length);
});
test('late photo capture cannot appear after role change or closing Docs',async()=>{
 const f=fixture({deferImageLoad:true});
 label(f.root,'Сканировать').click();
 const input=find(f.root,n=>n.tagName==='INPUT'&&n.multiple)[0];
 input.files=[new File([tinyJpeg],'photo.jpg',{type:'image/jpeg'})];
 input.emit('change');
 f.window.SEYVEO_DOCS_STUDIO.reset();
 f.resumeImages();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(find(f.root,n=>n.tagName==='BUTTON'&&n.textContent==='Сохранить PDF').length,0);
 assert.ok(f.revoked.length>=1);
});
test('studio iPhone controls retain minimum touch targets and honest capability labels',()=>{
 const css=fs.readFileSync(path.join(root,'assets/seyveo-docs-studio.css'),'utf8');
 assert.match(css,/sv-doc-tool-thumb-actions/);
 assert.match(css,/min-width:44px;min-height:44px/);
 assert.match(css,/sv-doc-tool-page-select/);
 assert.match(css,/font-size:16px/);
 assert.match(studioCode,/подписи не является КЭП/i);
 assert.match(studioCode,/navigator\.canShare/);
 assert.doesNotMatch(studioCode,/\bfetch\s*\(/);
});

test('fresh scan can be printed directly without saving or importing first',async()=>{
 const f=fixture();
 label(f.root,'Сканировать').click();
 const input=find(f.root,n=>n.tagName==='INPUT'&&n.multiple)[0];
 input.files=[new File([tinyJpeg],'letter.jpg',{type:'image/jpeg'})];
 input.emit('change');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.saved.length,0);
 label(f.root,'Печать').click();
 const open=find(f.root,n=>n.tagName==='A'&&n.textContent==='Открыть для печати');
 assert.equal(open.length,1);
 assert.equal(open[0].target,'_blank');
 assert.ok(f.created.some(x=>x.blob.type==='application/pdf'));
 assert.equal(f.saved.length,0);
});

test('visual-first Apple-inspired Docs controls show unique icons and short step diagrams',()=>{
 const f=fixture();
 const artKinds=['scan','file','create','sign','print'];
 assert.ok(artKinds.every(name=>studioCode.includes(name+":'")));
 assert.match(studioCode,/PICTOGRAMS=Object\.freeze/);
 const artworks=find(f.root,n=>n.className?.split(' ').includes('sv-doc-art'));
 assert.equal(artworks.length,5);
 assert.ok(artworks.every(n=>n.innerHTML?.startsWith('<svg')));
 for(const tool of ['Сканировать','Создать','Подписать','Печать']){
  label(f.root,tool).click();
  const steps=find(f.root,n=>n.className==='sv-doc-tool-step');
  assert.equal(steps.length,3);
  assert.equal(find(f.root,n=>n.className==='sv-doc-tool-step-arrow').length,2);
 }
 const css=fs.readFileSync(path.join(root,'assets/seyveo-docs-studio.css'),'utf8');
 assert.match(css,/\.sv-doc-tool-grid \.sv-doc-tool-button\{\s*display:flex;flex-direction:column-reverse/);
 assert.match(css,/\.sv-doc-tool-scan\{\s*display:grid;grid-template-columns/);
 assert.match(css,/\.sv-doc-tool-help summary/);
});

test('scanner design has sample paper guides before capture and real image after capture',async()=>{
 const f=fixture();
 label(f.root,'Сканировать').click();
 assert.equal(find(f.root,n=>n.className==='sv-doc-scan-stage').length,1);
 assert.equal(find(f.root,n=>n.className==='sv-doc-scan-sheet-sample').length,1);
 assert.equal(find(f.root,n=>n.className?.startsWith('sv-doc-scan-corner ')).length,4);
 assert.ok(find(f.root,n=>n.textContent==='Пример листа').length);
 assert.equal(find(f.root,n=>n.className==='sv-doc-scan-sheet-image').length,0);
 const input=find(f.root,n=>n.tagName==='INPUT'&&n.multiple)[0];
 input.files=[
  new File([tinyJpeg],'photo1.jpg',{type:'image/jpeg'}),
  new File([tinyJpeg],'photo2.jpg',{type:'image/jpeg'})
 ];
 input.emit('change');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(find(f.root,n=>n.className==='sv-doc-scan-sheet-sample').length,0);
 const preview=find(f.root,n=>n.className==='sv-doc-scan-sheet-image');
 assert.equal(preview.length,1);
 assert.equal(preview[0].alt,'Страница 1 из 2');
 assert.equal(find(f.root,n=>n.className?.split(' ').includes('sv-doc-tool-thumb-select')).length,2);
 assert.equal(find(f.root,n=>n.className==='sv-doc-tool-pdf-card').length,1);
 const choose=find(f.root,n=>n.className?.split(' ').includes('sv-doc-tool-thumb-select'))[1];
 choose.click();
 const after=find(f.root,n=>n.className==='sv-doc-scan-sheet-image');
 assert.equal(after.length,1);
 assert.equal(after[0].alt,'Страница 2 из 2');
 assert.equal(find(f.root,n=>n.className?.split(' ').includes('sv-doc-tool-thumb-select'))[1].attributes['aria-pressed'],'true');
 assert.equal(find(f.root,n=>n.className?.split(' ').includes('sv-doc-tool-thumb-select'))[0].attributes['aria-pressed'],'false');
 label(f.root,'Посмотреть').click();
 assert.ok(f.created.some(x=>x.blob.type==='application/pdf'));
 assert.ok(find(f.root,n=>n.textContent?.includes('Предпросмотр PDF открыт')).length);
 f.window.SEYVEO_DOCS_STUDIO.reset();
 assert.ok(f.revoked.length>=1);
});
test('scanner style never changes global home dock, assistant chat or false OCR status',()=>{
 const css=fs.readFileSync(path.join(root,'assets/seyveo-docs-studio.css'),'utf8');
 assert.match(css,/\.sv-doc-scan-stage\{/);
 assert.match(css,/\.sv-doc-scan-guide\{/);
 assert.match(css,/\.sv-doc-scan-corner-tl\{/);
 assert.match(css,/\.sv-doc-scan-sheet-image\{/);
 assert.match(css,/\.sv-doc-tool-thumb-select\[aria-pressed="true"\]/);
 assert.match(css,/\.sv-doc-tool-pdf-card\{/);
 assert.doesNotMatch(css,/navHome|navManage|homeDock|sayviChatComposer/);
 assert.match(studioCode,/Направляющие · пример/);
 assert.match(studioCode,/Автоматическая обрезка и OCR пока не подключены/);
});
