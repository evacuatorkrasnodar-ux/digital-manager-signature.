const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const html=readFileSync(join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('let pendingNoteDeletion=null;');
const end=html.indexOf('function renderNotes(){',start);
assert.ok(start>=0&&end>start,'undo deletion controller is in the notebook');
const source=html.slice(start,end);

function createHarness(){
 const original=[
  {id:'one',text:'Первая',attachmentsCount:2},
  {id:'two',text:'Вторая'},
  {id:'three',text:'Третья'}
 ];
 let notes=original.slice(),timer=null,removed=[],renders=0;
 const elements=new Map();
 const body={append(node){elements.set(node.id,node)}};
 const document={body,createElement(tag){
  const element={tag,hidden:false,children:[],attributes:{},
   setAttribute(name,value){this.attributes[name]=value},
   append(...children){this.children.push(...children)},
   addEventListener(name,fn){this[name]=fn}};
  return element;
 }};
 const context={document,
  $:id=>elements.get(id)||null,
  window:{setTimeout(fn,ms){timer={fn,ms};return timer},SEYVEO_NOTE_ATTACHMENTS:{deleteForNote:id=>removed.push(id)}},
  clearTimeout(id){if(id===timer)timer=null},
  getNotes:()=>notes.slice(),putNotes:next=>{notes=next.slice();return true},
  notesMessage:()=>{},renderNotes:()=>{renders++}
 };
 vm.createContext(context);
 vm.runInContext(source+'\nthis.controller={deleteNoteWithUndo,settleNoteDeletion};',context);
 return{context,notes:()=>notes,removed,timer:()=>timer,renders:()=>renders,toast:()=>elements.get('svNoteUndoToast')};
}

test('swipe deletion removes a note but keeps attachments during Undo grace period',()=>{
 const h=createHarness();
 h.context.controller.deleteNoteWithUndo(h.notes()[1]);
 assert.deepEqual(h.notes().map(n=>n.id),['one','three']);
 assert.deepEqual(h.removed,[],'attachments stay intact while Undo is offered');
 assert.equal(h.timer().ms,6500);
 assert.equal(h.toast().hidden,false);
 assert.equal(h.renders(),1);
 h.toast().children[1].click();
 assert.deepEqual(h.notes().map(n=>n.id),['one','two','three'],'Undo restores the original position');
 assert.deepEqual(h.removed,[]);
 assert.equal(h.toast().hidden,true);
 assert.equal(h.timer(),null);
});

test('attachments are only removed when the undo window expires',()=>{
 const h=createHarness();
 h.context.controller.deleteNoteWithUndo(h.notes()[0]);
 h.timer().fn();
 assert.deepEqual(h.notes().map(n=>n.id),['two','three']);
 assert.deepEqual(h.removed,['one']);
 assert.equal(h.toast().hidden,true);
});
