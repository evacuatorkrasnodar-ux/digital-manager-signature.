/* Real browserless render/safety tests for the SEYVEO Documents viewer. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/seyveo-docs-viewer.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/seyveo-docs-viewer.css'),'utf8');
class Element{
 constructor(name){this.tagName=name.toUpperCase();this.children=[];this.listeners={};
  this.className='';this.attributes={};this.textContent='';this.parentNode=null;}
 append(...nodes){for(const node of nodes){node.parentNode=this;this.children.push(node)}}
 replaceChildren(...nodes){for(const child of this.children)child.parentNode=null;
  this.children=[];this.append(...nodes)}
 setAttribute(k,v){this.attributes[k]=v}
 addEventListener(type,handler){(this.listeners[type]??=[]).push(handler)}
 click(){for(const cb of this.listeners.click||[])cb({target:this})}
 get isConnected(){return this.parentNode?.isConnected||this._root===true}
}
function find(root,predicate){const all=[];function walk(node){if(predicate(node))all.push(node);
 for(const x of node.children)walk(x)}walk(root);return all}
function namedAction(root,label){const all=find(root,n=>n.tagName==='BUTTON'&&
 n.children.some(x=>x.textContent===label));assert.equal(all.length,1,'action: '+label);return all[0]}
function fixture({shareAvailable=true}={}){
 const calls=[],revoked=[];
 const document={
  createElement:tag=>new Element(tag),
  createElementNS:(_,tag)=>new Element(tag)
 };
 let shared=0;const navigator={
  canShare:data=>shareAvailable&&data.files?.[0]?.name==='report.pdf',
  share:data=>{calls.push(['share',data]);shared++;return Promise.resolve()}
 };
 const URL={
  createObjectURL:file=>{calls.push(['blob',file]);return 'blob:seyveo-preview-'+calls.length},
  revokeObjectURL:url=>{revoked.push(url)}
 };
 const window={open:(url,target,flags)=>{calls.push(['print',url,target,flags]);return {}}};
 const context={window,document,navigator,URL};
 vm.runInNewContext(source,context,{filename:'seyveo-docs-viewer.js'});
 const root=new Element('main');root._root=true;
 const file=(name,type)=>new File(['test document content'],name,{type});
 return {window,root,URL,calls,revoked,file,document,get shared(){return shared}};
}
test('a PDF is displayed as actual local iframe with readable file header and four illustrated controls',()=>{
 const f=fixture(),file=f.file('report.pdf','application/pdf');
 const session=f.window.SEYVEO_DOCS_VIEWER.mount(f.root,file);
 assert.equal(typeof session.destroy,'function');
 assert.equal(find(f.root,x=>x.className==='svdv-name')[0].textContent,'report.pdf');
 assert.equal(find(f.root,x=>x.className==='svdv-meta')[0].textContent.includes('PDF'),true);
 assert.equal(find(f.root,x=>x.tagName==='IFRAME').length,1);
 assert.equal(find(f.root,x=>x.tagName==='IFRAME')[0].src.startsWith('blob:'),true);
 assert.equal(find(f.root,x=>x.className==='svdv-toolbar').length,1);
 for(const name of ['Поделиться','Печать','Подписать'])
  assert.ok(namedAction(f.root,name));
 assert.equal(find(f.root,x=>x.tagName==='SUMMARY').length,1);
 assert.equal(find(f.root,x=>x.tagName==='A').length,2);
 assert.equal(find(f.root,x=>x.className==='svdv-picture').length,0);
 session.destroy();
 assert.equal(f.root.children.length,0);
 assert.equal(f.revoked.length,1);
});
test('iPhone share starts from user interaction with file bytes but never sends to AI automatically',async()=>{
 const f=fixture(),file=f.file('report.pdf','application/pdf');
 f.window.SEYVEO_DOCS_VIEWER.mount(f.root,file,{onSayvi:()=>{throw Error('No silent chat')}});
 assert.equal(f.shared,0);
 namedAction(f.root,'Поделиться').click();
 assert.equal(f.shared,1);
 assert.equal(f.calls.find(x=>x[0]==='share')[1].files[0],file);
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(find(f.root,x=>x.className==='svdv-notice')[0].textContent,/системное меню/);
 const links=find(f.root,x=>x.tagName==='A');
 assert.equal(links[0].rel,'noopener noreferrer');
 assert.equal(links[1].download,'report.pdf');
});
test('print merely opens real PDF; does not falsely promise a printer completed job',()=>{
 const f=fixture();
 f.window.SEYVEO_DOCS_VIEWER.mount(f.root,f.file('report.pdf','application/pdf'));
 namedAction(f.root,'Печать').click();
 assert.equal(f.calls.filter(x=>x[0]==='print').length,1);
 assert.ok(f.calls.some(x=>x[0]==='print'&&x[1].startsWith('blob:')));
 assert.match(find(f.root,x=>x.className==='svdv-notice')[0].textContent,/системное меню/);
 assert.doesNotMatch(source,/печать выполнена|успешно распечатан/i);
});
test('photo can open actual scanned-image signing tool, PDF must refuse unsupported overlay',async()=>{
 const f=fixture(),input=f.file('photo.jpg','image/jpeg');
 let signed=null;
 f.window.SEYVEO_DOCS_VIEWER.mount(f.root,input,{
  onSignImage:file=>{signed=file;return Promise.resolve(true)}
 });
 assert.equal(find(f.root,x=>x.tagName==='IMG').length,1);
 namedAction(f.root,'Подписать').click();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(signed,input);
 const f2=fixture();let fakeSign=false;
 f2.window.SEYVEO_DOCS_VIEWER.mount(f2.root,f2.file('report.pdf','application/pdf'),{
  onSignImage:()=>{fakeSign=true;return true}
 });
 namedAction(f2.root,'Подписать').click();
 assert.equal(fakeSign,false);
 assert.match(find(f2.root,x=>x.className==='svdv-notice')[0].textContent,/готового PDF пока недоступна/);
});
test('unsupported office file shows honest original-only preview and no fake print',()=>{
 const f=fixture();
 f.window.SEYVEO_DOCS_VIEWER.mount(f.root,f.file('table.xlsx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
 assert.equal(find(f.root,x=>x.className==='svdv-fallback').length,1);
 assert.equal(find(f.root,x=>x.tagName==='IFRAME').length,0);
 namedAction(f.root,'Печать').click();
 assert.equal(f.calls.filter(x=>x[0]==='print').length,0);
 assert.match(find(f.root,x=>x.className==='svdv-notice')[0].textContent,/подходящем приложении/);
});
test('no file is displayed beyond size restrictions or after close; local blob urls are revoked',()=>{
 const f=fixture();
 const invalid=new File([new Uint8Array(1)],'empty.pdf');
 const tooLarge={name:'large.pdf',size:22*1024*1024,text:async()=>''};
 assert.equal(f.window.SEYVEO_DOCS_VIEWER.mount(f.root,tooLarge),false);
 const session=f.window.SEYVEO_DOCS_VIEWER.mount(f.root,invalid);
 assert.ok(session);
 session.destroy();session.destroy();
 assert.equal(f.revoked.length,1);
 assert.equal(f.calls.filter(x=>x[0]==='share').length,0);
});
test('viewer is Documents-only, paper-first, accessible and unrelated to home dock',()=>{
 assert.match(css,/#sayviSurfacePage \.svdv-stage\{/);
 assert.match(css,/#sayviSurfacePage \.svdv-toolbar\{/);
 assert.match(css,/#sayviSurfacePage \.svdv-more-options\{/);
 assert.match(css,/#sayviSurfacePage \.svdv-frame\{/);
 assert.match(css,/min-height:44px/);
 assert.doesNotMatch(css,/navHome|navManage|homeDock|sayviChatComposer/);
 assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});
