const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const editorStyles=html.match(/<style id="sv-note-editor-v2">([\s\S]*?)<\/style>/)?.[1]||'';
const toolMarkup=html.split('<div class="sv-note-tools sv-note-tools-compact"')[1]?.split('<div id="svNoteAttachmentMenu"')[0]||'';
const viewportScript=html.split('<script id="sv-note-editor-tools">')[1]?.split('</script>')[0]||'';

test('expanded editor reuses exactly the four existing capsule icons',()=>{
 const tools=[...toolMarkup.matchAll(/data-note-tool="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(tools,['checklist','attachment','heading','draw']);
 assert.match(editorStyles,/\.sv-note-keyboard-open[\s\S]*?width:calc\(100vw - 40px\)!important;/);
 assert.match(editorStyles,/\.sv-note-keyboard-open[\s\S]*?grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important;/);
 assert.match(editorStyles,/\.sv-note-keyboard-open[\s\S]*?\.sv-note-draw-standalone\{\s*display:none!important;/);
});

test('mobile keyboard gets one full-width material surface with no extra circle',()=>{
 const start=editorStyles.indexOf('/* Apple Notes-style writing state:');
 const keyboardCss=editorStyles.slice(start);
 assert.ok(start>0);
 assert.match(keyboardCss,/\.sv-note-tool-row\.sv-shared-dock::before\{\s*left:20px!important;[\s\S]*?width:calc\(100vw - 40px\)!important;/);
 assert.match(keyboardCss,/\.sv-note-tool-row\.sv-shared-dock::after\{\s*display:none!important;/);
 assert.match(keyboardCss,/width:44px!important;\s*min-width:44px!important;\s*height:44px!important;\s*min-height:44px!important;/);
});

test('keyboard state follows viewport shrink and recovers without focus-only jumps',()=>{
 const start=viewportScript.indexOf('let lastNoteHeight=0,noteViewportFrame=0,restingNoteHeight=0;');
 const end=viewportScript.indexOf('const queueNoteViewportSync=',start);
 assert.ok(start>=0&&end>start,'actual editor viewport logic is present');
 const flags=new Set(),props={};
 const focusedField={matches:()=>true},document={activeElement:null};
 const dlg={open:true,contains:el=>el===focusedField,
  classList:{toggle:(name,enabled)=>enabled?flags.add(name):flags.delete(name)},
  style:{setProperty:(key,val)=>props[key]=val}};
 const viewport={height:844},window={visualViewport:viewport,innerHeight:844};
 const sync=vm.runInNewContext(viewportScript.slice(start,end)+'\nsync',{dlg,document,window,Math});
 sync();
 assert.equal(props['--sv-note-height'],'844px');
 assert.equal(flags.size,0);
 document.activeElement=focusedField;
 sync();
 assert.equal(flags.size,0,'just focusing does not pretend a software keyboard opened');
 viewport.height=525;
 sync();
 assert.ok(flags.has('sv-note-keyboard-open'));
 assert.equal(props['--sv-note-height'],'525px');
 viewport.height=844;
 sync();
 assert.equal(flags.size,0,'dock returns after keyboard closes');
 viewport.height=525;
 document.activeElement=null;
 sync();
 assert.equal(flags.size,0,'unfocused editor does not show keyboard bar');
});
