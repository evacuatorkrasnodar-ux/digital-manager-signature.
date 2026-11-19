const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const recognition=fs.readFileSync(path.join(root,'assets/seyveo-paper-recognition.js'),'utf8');
const textEditor=fs.readFileSync(path.join(root,'assets/seyveo-paper-typed-text.js'),'utf8');
const styles=fs.readFileSync(path.join(root,'assets/seyveo-paper-recognition.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

function mount({chat=false,dark=false,confirm=()=>true,ink=[[[150,200],[200,310]]]}={}){
 const nodes={};
 const make=()=>({hidden:false,disabled:false,open:false,value:'',textContent:'',className:'',
  handlers:{},attributes:{},classList:{add(){}},
  addEventListener(type,fn){this.handlers[type]=fn},
  fire(type){return this.handlers[type]?.({})},
  setAttribute(name,value){this.attributes[name]=value},
  querySelector(selector){return this.children?.[selector]||{}},
  showModal(){this.open=true},close(){this.open=false}
 });
 const menu=make(),tablet=make(),status=make(),settings=make(),entry=make(),overlay=make();
 tablet.open=true;
 menu.insertBefore=node=>{nodes.entry=node};
 const buttons=['[data-pr-run]','[data-pr-sheet]','[data-pr-copy]','[data-pr-save]',
  '[data-pr-close]','textarea','.sv-pr-status'];
 overlay.children=Object.fromEntries(buttons.map(key=>[key,make()]));
 const body={append(node){nodes.overlay=node}};
 const added=[];
 let editCalls=0;
 const paper={getInkStrokes:()=>ink,getEditGeometry:()=>({width:840,height:1188}),
  getBackground:()=>dark?'dark':'light',addTextObject(item){added.push(item);return true},
  exportInkOcrPng:()=>''};
 const document={body,createElement:tag=>tag==='dialog'?overlay:entry,
  getElementById:id=>({notePaperSettingsMenu:menu,notePaperDialog:tablet,
   notePaperSettings:settings,notePaperStatus:status})[id]};
 const window={SEYVEO_PAPER:paper,SEYVEO_PAPER_TEXT:{editLast(){editCalls++;return true}},
  confirm,setTimeout(){}};
 vm.runInNewContext(recognition,{window,document,location:{search:chat?'?seyveo-draw=chat':''},URLSearchParams,navigator:{},console});
 return {added,overlay,entry,buttons:overlay.children,status,getEditCalls:()=>editCalls};
}

test('recognized copy goes onto original ink sheet and immediately opens existing editor',()=>{
 const ui=mount();ui.entry.fire('click');
 const field=ui.buttons.textarea;field.value='  Привет, Роман!  ';
 field.fire('input');
 assert.equal(ui.buttons['[data-pr-sheet]'].disabled,false);
 ui.buttons['[data-pr-sheet]'].fire('click');
 assert.equal(ui.added.length,1);
 assert.equal(ui.added[0].text,'Привет, Роман!');
 assert.equal(ui.added[0].color,'#171e29');
 assert.ok(ui.added[0].y>310,'put new text beneath handwriting when there is space');
 assert.equal(ui.getEditCalls(),1);
 assert.equal(ui.overlay.open,false);
});

test('text placement chooses the free upper part when handwriting fills bottom',()=>{
 const ui=mount({dark:true,ink:[[[120,430],[240,1100]]]});
 ui.entry.fire('click');ui.buttons.textarea.value='Это распознанный текст';
 ui.buttons['[data-pr-sheet]'].fire('click');
 assert.equal(ui.added[0].y,76);
 assert.equal(ui.added[0].color,'#f6f7fb');
});

test('sheet length limit requires consent, rather than silently losing OCR content',()=>{
 let accepts=false,asks=0;
 const ui=mount({confirm:()=>{asks++;return accepts}});
 ui.entry.fire('click');ui.buttons.textarea.value='Я'.repeat(520);
 ui.buttons['[data-pr-sheet]'].fire('click');
 assert.equal(asks,1);assert.equal(ui.added.length,0);
 assert.equal(ui.overlay.open,true);
 accepts=true;ui.buttons['[data-pr-sheet]'].fire('click');
 assert.equal(asks,2);
 assert.equal(ui.added[0].text.length,500);
});

test('chat drawings do not expose save-to-sheet or save-to-notes',()=>{
 const ui=mount({chat:true});ui.entry.fire('click');
 ui.buttons.textarea.value='Привет';ui.buttons.textarea.fire('input');
 assert.equal(ui.buttons['[data-pr-sheet]'].hidden,true);
 assert.equal(ui.buttons['[data-pr-sheet]'].disabled,true);
 assert.equal(ui.buttons['[data-pr-save]'].hidden,true);
 ui.buttons['[data-pr-sheet]'].fire('click');
 assert.equal(ui.added.length,0);
});

test('uses the same editable printed-text mode and three compact iPhone actions',()=>{
 assert.match(textEditor,/window\.SEYVEO_PAPER_TEXT=Object\.freeze\(\{editLast\(\)/);
 assert.match(textEditor,/if\(!active\)startMode\(\);\s*openEditor\(count-1\)/);
 assert.match(styles,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(styles,/\.sv-pr-chat \.sv-pr-actions\{grid-template-columns:1fr\}/);
 assert.match(html,/seyveo-paper-recognition\.js\?v=6/);
 assert.match(html,/seyveo-paper-typed-text\.js\?v=2/);
});
