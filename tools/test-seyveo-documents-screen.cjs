/* SEYVEO Documents: focused UI regression without installing a DOM emulator.
 * Tests one approved Management connection hub, files, archive and Sayvi
 * actions. No browser data, tokens or document bytes are used.
 */
'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'assets/documents-center.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/documents-center.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const surfaces=fs.readFileSync(path.join(root,'assets/sayvi-surfaces.js'),'utf8');
const flow=fs.readFileSync(path.join(root,'assets/seyveo-document-flow.js'),'utf8');
const flowCss=fs.readFileSync(path.join(root,'assets/seyveo-document-flow.css'),'utf8');

class Node {
 constructor(tag='div'){
  this.dataset={};
  this.tagName=tag.toUpperCase();
  this.className='';this.textContent='';this.children=[];this.listeners={};
  this.attrs={};this.open=false;this.parentNode=null;
  this.classList={add:n=>{this.className+=(this.className?' ':'')+n}};
 }
 get isConnected(){return this._root===true||!!this.parentNode?.isConnected;}
 append(...kids){for(const node of kids){this.children.push(node);node.parentNode=this;}}
 replaceChildren(...kids){for(const c of this.children)c.parentNode=null;this.children=[];this.append(...kids);}
 setAttribute(key,value){this.attrs[key]=value;}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 click(){for(const fn of this.listeners.click??[])fn({target:this});}
 emit(type){for(const fn of this.listeners[type]??[])fn({target:this});}
}
function elements(start,className){
 const hits=[];const walk=node=>{
  if(node.className.split(' ').includes(className))hits.push(node);
  for(const child of node.children)walk(child);
 };
 walk(start);return hits;
}
function fixture({employee=false,records=[]}={}){
 const messages=[],opened=[],selected=[],calls=[];
 const page=new Node('main');page.dataset.svSubject='contract';
 const doc={
  createElement:tag=>new Node(tag),
  createElementNS:(_url,tag)=>new Node(tag),
  getElementById:id=>id==='sayviSurfacePage'?page:null
 };
 let panel;
 const window={
  addEventListener:()=>{},
  SEYVEO_PREVIEW:{
   isEmployee:()=>employee,
   isManager:()=>!employee
  },
  SEYVEO_DOCUMENT_FLOW:{
   getRecords:()=>records,
   mount:el=>{calls.push('flow');el.append(new Node('article'));return true;},
   select:id=>selected.push(id)
  },
  SEYVEO_SMART_CONNECTIONS:{open:section=>opened.push(section)},
  SEYVEO_DOCUMENT_VAULT:{lock:()=>calls.push('lock')},
  SEYVEO_DOCS_STUDIO:{reset:()=>calls.push('scan-reset')},
  SEYVEO_DOCUMENT_VAULT_UI:{mount:(_el,api)=>{panel=api;return true}},
  SEYVEO_CONVERSATION:{open:()=>messages.push('chat')}
 };
 const location={hash:''};
 const context={window,document:doc,location,sessionStorage:{setItem(){}},URL};
 vm.runInNewContext(code,context,{filename:'documents-center.js'});
 const host=new Node('main');host._root=true;
 assert.equal(window.SEYVEO_DOCUMENT_CENTER.mount(host),true);
 return {host,page,window,messages,opened,selected,calls,location,
  get vaultPanel(){return panel}};
}
test('documents page preserves personal archive, file picker, and both chat actions',()=>{
 const f=fixture();
 assert.equal(elements(f.host,'sv-doc-switch').length,1);
 assert.equal(elements(f.host,'sv-doc-safe-area').length,1);
 assert.equal(elements(f.host,'sv-doc-primary').length,1);
 assert.equal(elements(f.host,'sv-doc-vault-shell').length,1);
 assert.equal(elements(f.host,'sv-doc-chat-list').length,1);
 assert.equal(elements(f.host,'sv-doc-chat-action').length,2);
 assert.equal(elements(f.host,'sv-doc-connections-entry').length,0);
 assert.equal(elements(f.host,'sv-doc-primary')[0].textContent,'Добавить документ');
 const chat=elements(f.host,'sv-doc-chat-action');
 chat[0].click();
 assert.deepEqual(f.messages,['chat']);
});
test('business screen routes to ONE approved Management service connection hub',()=>{
 const f=fixture({records:[{state:'sent'}]});
 assert.equal(f.window.SEYVEO_DOCUMENT_CENTER.setArea('business'),true);
 assert.equal(elements(f.host,'sv-doc-flow-card').length,1);
 assert.equal(elements(f.host,'sv-doc-vault-shell').length,1);
 assert.equal(elements(f.host,'sv-doc-connections-entry').length,1);
 assert.equal(elements(f.host,'sv-doc-connectors').length,0);
 elements(f.host,'sv-doc-connections-entry')[0].click();
 assert.deepEqual(f.opened,['services']);
 assert.equal(elements(f.host,'sv-doc-integrations').length,0);
});
test('KEP from existing encrypted vault redirects to Smart Connections without fake signing',()=>{
 const f=fixture();f.window.SEYVEO_DOCUMENT_CENTER.setArea('business');
 const archive=elements(f.host,'sv-doc-vault-shell')[0];
 archive.open=true;archive.emit('toggle');
 assert.equal(typeof f.vaultPanel.showIntegrations,'function');
 f.vaultPanel.showIntegrations();
 assert.deepEqual(f.opened,['services']);
});
test('business employee preview only sees approvals, not owner encrypted archive or connections',()=>{
 const f=fixture({employee:true});
 f.window.SEYVEO_DOCUMENT_CENTER.setArea('business');
 assert.equal(elements(f.host,'sv-doc-role-info').length,1);
 assert.equal(elements(f.host,'sv-doc-workspace').length,1);
 assert.equal(elements(f.host,'sv-doc-primary').length,0);
 assert.equal(elements(f.host,'sv-doc-vault-shell').length,0);
 assert.equal(elements(f.host,'sv-doc-connections-entry').length,0);
 assert.ok(f.calls.includes('lock'));
});
test('approval route, distinct personal and business tabs, and original scroll padding survive',()=>{
 const f=fixture();
 const count=f.calls.filter(x=>x==='scan-reset').length;
 f.window.SEYVEO_DOCUMENT_CENTER.openApprovals('approval-1');
 assert.ok(f.calls.filter(x=>x==='scan-reset').length>count);
 assert.deepEqual(f.selected,['approval-1']);
 assert.equal(elements(f.host,'sv-doc-workspace').length,1);
 assert.equal(f.page.dataset.svDocView,'flow');
 assert.match(css,/padding-bottom:calc\(150px \+ env\(safe-area-inset-bottom,0px\)\)/);
 assert.match(css,/scroll-padding-bottom/);
});
test('approved glass and core mark are scoped: no dock edits, no duplicate connection list',()=>{
 assert.match(css,/\.sv-doc-chat-list\{/);
 assert.match(css,/\.sv-doc-connections-entry\{/);
 assert.match(css,/sayvi-core-mark\.svg/);
 assert.doesNotMatch(css,/#(?:navHome|navTasks|navManage)|footer\.dock/);
 assert.doesNotMatch(code,/function connectorsPanel\(|function connectorRow\(|integrationsOpen/);
 assert.match(code,/hub\.open\('services'\)/);
 assert.match(html,/assets\/documents-center\.css\?v=18/);
 assert.match(html,/assets\/documents-center\.js\?v=20/);
 assert.match(html,/assets\/seyveo-document-flow\.css\?v=14/);
 assert.match(html,/assets\/seyveo-document-flow\.js\?v=10/);
 assert.match(html,/assets\/sayvi-surfaces\.js\?v=44/);
 assert.match(html,/assets\/seyveo-docs-studio\.css\?v=9/);
 assert.match(html,/assets\/seyveo-docs-export\.js\?v=1/);
 assert.match(html,/assets\/seyveo-docs-studio\.js\?v=11/);
 assert.match(html,/assets\/seyveo-docs-viewer\.js\?v=1/);
 assert.match(html,/assets\/seyveo-docs-viewer\.css\?v=2/);
 assert.match(html,/assets\/seyveo-smart-connections\.js/);
});

test('one header Back returns director to encrypted archive before leaving Documents',()=>{
 const f=fixture();
 f.window.SEYVEO_DOCUMENT_CENTER.setArea('business');
 assert.equal(f.page.dataset.svDocView,'archive');
 const count=f.calls.filter(x=>x==='scan-reset').length;
 elements(f.host,'sv-doc-flow-card')[0].click();
 assert.ok(f.calls.filter(x=>x==='scan-reset').length>count);
 assert.equal(f.page.dataset.svDocView,'flow');
 assert.equal(elements(f.host,'sv-doc-flow-back').length,0);
 assert.equal(f.window.SEYVEO_DOCUMENT_CENTER.backFromNested(),true);
 assert.equal(f.page.dataset.svDocView,'archive');
 assert.equal(elements(f.host,'sv-doc-vault-shell').length,1);
 assert.equal(f.window.SEYVEO_DOCUMENT_CENTER.backFromNested(),false);
 assert.match(surfaces,/currentKind\(\)==='contract'&&[\s\S]{0,80}backFromNested\?\.\(\)/);
});
test('employee Back exits normally; never exposes owner archive on a nested flow',()=>{
 const f=fixture({employee:true});
 f.window.SEYVEO_DOCUMENT_CENTER.setArea('business');
 assert.equal(f.page.dataset.svDocView,'flow');
 assert.equal(f.window.SEYVEO_DOCUMENT_CENTER.backFromNested(),false);
 assert.equal(elements(f.host,'sv-doc-vault-shell').length,0);
});
test('Docs fold storage notes into one disclosure without duplicate global footer',()=>{
 assert.match(css,/data-sv-subject="contract"[\s\S]*#sayviSurfaceFootnote\{display:none!important\}/);
 assert.match(css,/\.sv-doc-safety\{/);
 assert.match(code,/Безопасность и хранение/);
 assert.doesNotMatch(code,/Вернуться в хранилище/);
});
test('approval workflow keeps warning visible and avoids duplicate numeric scorecards',()=>{
 assert.match(flow,/Демо · не загружайте настоящие документы/);
 assert.match(flow,/без шифрования/);
 assert.match(flow,/без серверной отправки, проверки ролей/);
 assert.match(flow,/Мои входящие/);
 assert.match(flow,/Отправленные документы/);
 assert.match(flow,/История ·/);
 assert.doesNotMatch(flow,/host\.append\(\$\('p','svdf-compact-status'/);
 assert.match(flowCss,/var\(--sv-doc-wash,var\(--card\)\)/);
 assert.match(flowCss,/svdf-lead h2\{font-size:21px/);
});

test('Docs quick actions are mounted by the studio when installed, not duplicated',()=>{
 const stub=fs.readFileSync(path.join(root,'assets/seyveo-docs-studio.js'),'utf8');
 assert.match(code,/SEYVEO_DOCS_STUDIO\?\.mount\?\./);
 assert.match(code,/onPick:\(\)=>picker\.click\(\)/);
 assert.match(code,/onImport:file=>/);
 assert.match(code,/if\(studioReady\)\{\s*host\.append\(tools\)/);
 assert.match(stub,/Сканировать/);
 assert.match(stub,/Добавить файл/);
 assert.match(stub,/Сохранить PDF/);
 assert.match(stub,/Сохранить Word/);
 assert.match(stub,/Подписать копию PDF/);
 assert.match(stub,/Открыть для печати/);
 assert.match(code,/SEYVEO_DOCS_STUDIO\?\.reset\?\.\(\)/);
});

test('compact Documents home has one locked archive row, no duplicate protection intro',()=>{
 assert.match(code,/summary\.append\(makeIcon\('lock'\),archiveTitle\)/);
 assert.match(code,/sv-doc-vault-copy/);
 assert.doesNotMatch(code,/introCopy\.append\(el\('strong','','Защищённые документы'\)/);
 assert.match(code,/safety\.append\(el\('summary','','Безопасность и хранение'\)/);
});

test('new local file viewer takes priority over legacy fallback and self-revokes on unmount',()=>{
 assert.match(code,/SEYVEO_DOCS_VIEWER\?\.mount\?\.\(parent,file/);
 assert.match(code,/viewerSession\.destroy\(\)/);
 assert.match(code,/onSignImage:image=>window\.SEYVEO_DOCS_STUDIO\?\.openImageForSignature\?\.\(image\)/);
 assert.match(code,/const opened=window\.SEYVEO_DOCS_VIEWER/);
 assert.match(code,/archive\.open=archiveExpanded;[\s\S]*host\.append\(preview\);[\s\S]*host\.append\(archive\)/);
 assert.match(code,/const sum=el\('summary','','Просмотр документа'\)/);
});


test('all six Docs surfaces consume one Liquid Glass geometry and colour contract',()=>{
 const studioCss=fs.readFileSync(path.join(root,'assets/seyveo-docs-studio.css'),'utf8');
 const viewerCss=fs.readFileSync(path.join(root,'assets/seyveo-docs-viewer.css'),'utf8');
 for(const token of [
  '--sv-doc-radius-card:22px',
  '--sv-doc-radius-tile:19px',
  '--sv-doc-radius-control:17px',
  '--sv-doc-touch:44px',
  '--sv-doc-frost:blur(18px) saturate(1.1)'
 ])assert.ok(css.includes(token),'Documents token missing: '+token);
 assert.match(css,/min-height:44px;padding:2px;margin:0 0 19px/);
 assert.match(css,/width:100%;min-height:39px;border-radius:13px/);
 assert.match(css,/sv-vault-row-actions>.*sv-doc-action/s);
 assert.match(studioCss,/var\(--sv-doc-radius-card,22px\)/);
 assert.match(studioCss,/var\(--sv-doc-radius-tile,19px\)/);
 assert.match(studioCss,/var\(--sv-doc-frost,blur\(18px\) saturate\(1\.1\)\)/);
 assert.match(studioCss,/var\(--sv-doc-touch,44px\)/);
 assert.match(viewerCss,/var\(--sv-doc-radius-card,22px\)/);
 assert.match(viewerCss,/var\(--sv-doc-radius-control,17px\)/);
 assert.match(viewerCss,/var\(--sv-doc-paper-shadow,/);
 assert.match(flowCss,/var\(--sv-doc-radius-card,22px\)/);
 assert.match(flowCss,/var\(--sv-doc-radius-tile,19px\)/);
 assert.match(flowCss,/var\(--sv-doc-frost,blur\(18px\) saturate\(1\.1\)\)/);
 assert.doesNotMatch(flowCss,/var\(--sv-doc-frost,var\(--sv-doc-frost/);
 for(const stylesheet of [css,studioCss,viewerCss,flowCss]){
  assert.doesNotMatch(stylesheet,/#(?:navHome|navTasks|navManage)|footer\.dock|sayviChatComposer/);
 }
});

test('light-mode approvals use neutral glass; iPhone editing avoids automatic Safari zoom',()=>{
 assert.match(flowCss,/:root\[data-theme="light"\] #sayviSurfacePage \.svdf-primary\{[\s\S]{0,155}background:var\(--sv-doc-picked,var\(--card2\)\)/);
 assert.match(flowCss,/#sayviSurfacePage \.svdf-feedback\{color:var\(--secondary\)/);
 assert.match(flowCss,/#sayviSurfacePage \.svdf-return-input\{[\s\S]{0,350}font-size:16px/);
 assert.match(flowCss,/#sayviSurfacePage :is\(\.svdf-revision-body,\.svdf-revision-note\)\{[\s\S]{0,300}font-size:16px/);
 assert.match(flowCss,/#sayviSurfacePage \.svdf-log summary:focus-visible/);
 assert.match(flowCss,/\.svdf-actions \.svdf-quiet\{[\s\S]{0,100}min-height:var\(--sv-doc-touch,44px\)/);
 assert.match(flowCss,/@media\(max-width:355px\)/);
});

test('Documents Home is a light Apple-style hierarchy instead of five large blocks',()=>{
 const studioCss=fs.readFileSync(path.join(root,'assets/seyveo-docs-studio.css'),'utf8');
 const studioJs=fs.readFileSync(path.join(root,'assets/seyveo-docs-studio.js'),'utf8');
 assert.match(studioJs,/sv-doc-tools-heading','Быстрые действия'/);
 assert.match(studioCss,/\.sv-doc-tool-grid\{\s*display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(studioCss,/\.sv-doc-tool-grid \.sv-doc-tool-button\{[\s\S]{0,300}background:transparent/);
 assert.match(studioCss,/\.sv-doc-tool-scan\{[\s\S]{0,125}grid-template-columns:56px minmax\(0,1fr\) 12px/);
 assert.match(studioCss,/\.sv-doc-tool-grid \.sv-doc-art,[\s\S]{0,160}width:55px;height:55px/);
 assert.match(css,/\.sv-doc-vault-summary\{[\s\S]{0,230}grid-template-columns:42px minmax\(0,1fr\) 12px/);
 assert.match(css,/\.sv-doc-vault-copy\{[\s\S]{0,200}grid-column:2;grid-row:1/);
 assert.match(css,/\.sv-doc-chat-action \.sv-doc-symbol\.sv-sayvi-symbol\{[\s\S]{0,240}sayvi-core-mark\.svg/);
 assert.match(code,/makeIcon\(primary\?'sayvi':'review'\)/);
 assert.match(css,/\.sv-doc-safety:not\(\[open\]\) \.sv-doc-note\{display:none\}/);
 assert.match(code,/Демо-согласования не предназначены для конфиденциальных документов/);
 assert.doesNotMatch(studioCss,/#(?:navHome|navManage|navTasks)|footer\.dock/);
});
