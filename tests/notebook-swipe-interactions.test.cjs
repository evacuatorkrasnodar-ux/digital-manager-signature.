const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const html=readFileSync(join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('function renderNotes(){');
const end=html.indexOf('function openNotes(){',start);
assert.ok(start>0&&end>start);

class Node{
 constructor(tag){
  this.tag=tag;this.children=[];this.listeners={};this.hidden=false;this.attrs={};this.dataset={};
  this._classes=new Set();this.style={values:{},setProperty:(k,v)=>{this.style.values[k]=v},removeProperty:k=>{delete this.style.values[k]}};
  this.classList={
   add:name=>this._classes.add(name),remove:name=>this._classes.delete(name),
   contains:name=>this._classes.has(name),
   toggle:(name,force)=>{const set=force===undefined?!this._classes.has(name):Boolean(force);if(set)this._classes.add(name);else this._classes.delete(name);return set}
  };
 }
 set className(value){this._classes=new Set(value.split(/\s+/).filter(Boolean))}
 get className(){return [...this._classes].join(' ')}
 append(...nodes){this.children.push(...nodes)}
 prepend(...nodes){this.children.unshift(...nodes)}
 replaceChildren(...nodes){this.children=nodes}
 setAttribute(name,value){this.attrs[name]=value}
 getAttribute(name){return this.attrs[name]??null}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
 fire(name,event={}){for(const fn of this.listeners[name]??[])fn(event)}
 querySelectorAll(selector){
  const classes=selector.split(',').map(part=>[...part.matchAll(/\.([\w-]+)/g)].map(match=>match[1]));
  const result=[];
  const visit=node=>{for(const child of node.children){if(classes.some(parts=>parts.every(c=>child._classes?.has(c))))result.push(child);visit(child)}};
  visit(this);return result;
 }
 getBoundingClientRect(){return{top:175,bottom:250,width:390,height:75}}
 setPointerCapture(id){this.captured=id}
 hasPointerCapture(id){return this.captured===id}
 releasePointerCapture(id){if(this.captured===id)this.captured=null}
}

function fixture(){
 const list=new Node('div'),count=new Node('span');let opens=0;
 const doc={createElement:tag=>new Node(tag)};
 const sandbox={document:doc,$:id=>({notesList:list,notesCount:count,notesDialog:{close:()=>opens++}}[id]),
  window:{SEYVEO_PAPER:{preview(){}},SEYVEO_NOTE_SCHEDULE_HINT:()=>null},
  getNotes:()=>[{id:'paper-1',text:'',paper:{background:'light'},createdAt:'2026-11-19T08:00:00Z'}],
  deleteNoteWithUndo:()=>{},openNoteRead:()=>{},shareNote:()=>{},printNote:()=>{},Date,Intl};
 vm.createContext(sandbox);
 vm.runInContext(html.slice(start,end)+'\nthis.renderNotes=renderNotes;',sandbox);
 sandbox.renderNotes();
 const card=list.children[0],swipe=card.children[0],controls=swipe.children[2];
 return{list,card,swipe,controls,opens:()=>opens};
}

test('a mouse drag reveals both actions without opening a note',()=>{
 const f=fixture();let prevented=0;
 f.controls.fire('pointerdown',{pointerType:'mouse',button:0,pointerId:7,clientX:240,clientY:180});
 f.controls.fire('pointermove',{pointerId:7,clientX:154,clientY:181,preventDefault:()=>prevented++});
 assert.ok(f.swipe.classList.contains('is-dragging'));
 assert.equal(f.swipe.style.values['--note-swipe-offset'],'-86px');
 f.controls.fire('pointerup',{pointerId:7,clientX:154,clientY:181});
 assert.ok(f.swipe.classList.contains('is-open'));
 assert.equal(f.opens(),0);
 assert.equal(prevented,1);
 assert.equal(f.swipe.style.values['--note-swipe-offset'],undefined);
 const more=f.swipe.children[0],menu=f.card.children[1];
 more.fire('click');
 assert.equal(menu.hidden,false,'more opens the same actions menu');
});

test('an iPhone horizontal swipe opens, while scrolling vertically remains native',()=>{
 const f=fixture();let prevented=0;
 const point=(x,y)=>({clientX:x,clientY:y});
 f.controls.fire('touchstart',{touches:[point(230,180)]});
 f.controls.fire('touchmove',{touches:[point(225,117)],cancelable:true,preventDefault:()=>prevented++});
 f.controls.fire('touchend',{changedTouches:[point(225,117)]});
 assert.equal(prevented,0,'do not block scrolling');
 assert.ok(!f.swipe.classList.contains('is-open'));
 f.controls.fire('touchstart',{touches:[point(230,180)]});
 f.controls.fire('touchmove',{touches:[point(167,182)],cancelable:true,preventDefault:()=>prevented++});
 f.controls.fire('touchend',{changedTouches:[point(167,182)]});
 assert.equal(prevented,1,'horizontal movement is handled by the list');
 assert.ok(f.swipe.classList.contains('is-open'));
 assert.equal(f.opens(),0);
});
