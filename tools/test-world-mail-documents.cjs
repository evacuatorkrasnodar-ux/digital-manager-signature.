/* SEYVEO · One personal document area + native in-app Mail.
 * Run: node tools/test-world-mail-documents.cjs
 * No network call, mail send, or file write happens in this regression. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const html=read('index.html'),life=read('assets/calendar-spaces.js');
const source=read('assets/sayvi-surfaces.js'),style=read('assets/sayvi-surfaces.css');
const grid=html.match(/<div id="calendarSpaces"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'';
const kinds=[...grid.matchAll(/data-calendar-space="([^"]+)"/g)].map(m=>m[1]);
assert.equal(kinds.length,13,'World contains thirteen personal destinations');
assert.equal(new Set(kinds).size,13,'No duplicated World tiles');
for(const name of ['family','documents','mail','play','music'])assert.ok(kinds.includes(name),'World includes '+name);
assert.match(grid,/>Личные документы<\/span>/);
assert.match(grid,/>Почта<\/span>/);
assert.match(html,/data-world-space="mail"/);
assert.match(html,/data-world-space="documents"/);
assert.match(html,/assets\/calendar-spaces\.js\?v=15/);
assert.match(html,/assets\/sayvi-surfaces\.js\?v=13/);
assert.match(html,/assets\/sayvi-surfaces\.css\?v=7/);
assert.match(life,/SEYVEO_SAYVI_SURFACES\?\.open\?\.\('mail','personal'\)/);
assert.match(life,/SEYVEO_SAYVI_SURFACES\?\.open\?\.\('contract','personal'\)/);
assert.match(source,/function mailView\(\)/);
assert.match(source,/Черновик хранится только в памяти текущего сеанса/);
assert.match(source,/Отправить · недоступно/);
assert.match(style,/\.sv-mail-folder\[aria-pressed="true"\]/);
const mailSection=source.slice(source.indexOf('function mailView(){'),source.indexOf('const extensions=new Set('));
assert.doesNotMatch(mailSection,/fetch\s*\(|XMLHttpRequest|sendBeacon|window\.open\s*\(/,
 'No sending or external browser handoff in Mail');

class Node {
 constructor(tag='div'){
  this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.attrs={};
  this.dataset={};this.hidden=false;this.value='';this.textContent='';this.className='';
  this.offsetWidth=1;this.style={};this.disabled=false;this.type='';
  this.classList={
   add:(...classes)=>{this.className+=' '+classes.join(' ')},
   remove:(...classes)=>{for(const k of classes)this.className=this.className.replaceAll(k,'')}
  };
 }
 append(...children){this.children.push(...children)}
 replaceChildren(...children){this.children=children}
 setAttribute(k,v){this.attrs[k]=v}
 getAttribute(k){return this.attrs[k]}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f)}
 click(){for(const f of this.listeners.click||[])f({preventDefault(){}})}
 querySelector(s){return s==='span:last-child'?new Node('span'):null}
 focus(){}
}
function find(node,fn){
 return node.children.flatMap(c=>(fn(c)?[c]:[]).concat(find(c,fn)));
}
const ids=[
 'sayviSurfacePage','sayviSurfaceSubject','sayviSurfaceTitle','sayviSurfaceIntro',
 'sayviSurfaceBody','sayviSurfaceFootnote','sayviSurfaceBack','sayviSurfaceSymbol','navHome'
];
const nodes=Object.fromEntries(ids.map(id=>[id,new Node()]));
const handlers={},loc={hash:'#life'},docUse={area:null,mounted:0};
const windowMock={
 addEventListener(k,f){(handlers[k]??=[]).push(f)},
 SEYVEO_DOCUMENT_CENTER:{
  setArea(area){docUse.area=area},
  mount(parent){docUse.mounted++;parent.append(new Node('article'));return true},
  destroy(){}
 }
};
const documentMock={
 getElementById:id=>nodes[id]||null,
 createElement:tag=>new Node(tag),
 createElementNS:(ns,tag)=>new Node(tag),
 querySelector:()=>null
};
vm.runInNewContext(source,{
 window:windowMock,document:documentMock,location:loc,
 sessionStorage:{getItem:()=>null,setItem(){}},
 URL:{revokeObjectURL(){}}
},{filename:'sayvi-surfaces.js',timeout:1700});
const api=windowMock.SEYVEO_SAYVI_SURFACES;
api.open('mail','personal');
handlers.hashchange.forEach(fn=>fn());
assert.equal(loc.hash,'#sayvi-mail','In-app Mail route, not Connections');
assert.equal(nodes.sayviSurfaceTitle.textContent,'Почта');
let root=nodes.sayviSurfaceBody;
assert.equal(find(root,x=>x.className.includes('sv-mail-folder')).length,3,'Inbox/Sent/Drafts shown');
const write=find(root,x=>x.className.includes('sv-mail-compose'))[0];
assert.ok(write,'Write is an actual button');write.click();
const fields=find(root,x=>x.className.includes('sv-mail-input'));
assert.equal(fields.length,3,'Recipient, subject, body');
fields[0].value='reader@example.test';
fields[1].value='Мой черновик';
fields[2].value='Не отправлять';
const form=find(root,x=>x.tagName==='FORM')[0];
assert.ok(form);form.listeners.submit[0]({preventDefault(){}});
assert.equal(find(root,x=>x.className.includes('sv-mail-draft-row')).length,1,
 'Draft is available in this session without pretending to send');
assert.equal(find(root,x=>x.className.includes('sv-mail-draft-row'))[0]
 .children[0].children[0].textContent,'Мой черновик');
api.open('contract','personal');
handlers.hashchange.forEach(fn=>fn());
assert.equal(docUse.area,'personal','Personal route selects the personal tab of one center');
assert.equal(docUse.mounted,1,'No cloned document center');
assert.equal(nodes.sayviSurfaceTitle.textContent,'Личные документы');
nodes.sayviSurfaceBack.click();
assert.equal(loc.hash,'#life','Back returns to My World');
console.log('PASS My World: 13 entries incl. Family, in-app Mail drafts, one personal document center and Back.');
