const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const script=read('assets/seyveo-smart-note-ink.js');
const css=read('assets/seyveo-notebook-context-actions.css');
const editor=html.split('<dialog id="noteReviewDialog"')[1]?.split('</dialog>')[0]||'';

test('Notebook header has just Back, centered mode, and Done',()=>{
 assert.deepEqual([...editor.matchAll(/<button id="(noteReviewBack|svNoteUndo|svNoteMore|svNoteDone)"/g)].map(m=>m[1]),['noteReviewBack','svNoteDone']);
 assert.match(editor,/id="svNoteInputModeLabel" class="sv-note-input-mode-label" aria-live="polite">Печатный текст/);
 assert.match(script,/modeLabel\.textContent=mode==='text'\?'Печатный текст':'Рукописный ввод'/);
 assert.match(css,/left:50%!important;right:auto!important;[\s\S]*?transform:translateX\(-50%\)!important/);
 assert.match(css,/width:44px!important;height:44px!important/);
 assert.match(css,/content:none!important;display:none!important/);
});

test('Aa owns a real 140px three-action capsule without duplicate More menus',()=>{
 const menu=editor.split('<div id="svNoteTopMenu"')[1]?.split('</div>')[0]||'';
 assert.deepEqual([...menu.matchAll(/data-sv-note-menu="([^"]+)"/g)].map(m=>m[1]),['undo','copy','clear']);
 assert.doesNotMatch(menu,/<span>|clear-ink/);
 assert.match(script,/textBtn\.setAttribute\('aria-controls','svNoteTopMenu'\)/);
 assert.match(script,/window\.SEYVEO_NOTE_TEXT_ACTIONS\?\.toggle\?\.\(\)/);
 assert.match(html,/window\.SEYVEO_NOTE_TEXT_ACTIONS=Object\.freeze\(\{toggle:toggleMenu,close:closeMenu\}\)/);
 assert.match(css,/width:140px!important;min-width:140px!important;max-width:140px!important/);
 assert.match(css,/grid-template-columns:repeat\(3,40px\)!important/);
 assert.match(css,/bottom:calc\(53px \+ env\(safe-area-inset-bottom,0px\)\)!important/);
});

test('ink capsule owns Undo and explicit stroke deletion, without touching text',()=>{
 const tools=[...script.matchAll(/data-sv-ink-tool="([^"]+)"/g)].map(m=>m[1]);
 for(const action of ['undo','eraser','width','color','paper','voice','clear'])assert.ok(tools.includes(action),action);
 assert.match(script,/inkUndoBtn\.addEventListener\('click',\(\)=>travelHistory\(\)\)/);
 assert.match(script,/inkClearBtn\.addEventListener\('click',\(\)=>clearHandwriting\(\)\)/);
 assert.match(script,/window\.confirm\('Удалить все нарисованные штрихи на этом листе\? Печатный текст и вложения останутся\.'/);
 assert.match(script,/smoothUndo=previous;smoothRedo=null/);
 assert.match(css,/width:min\(284px,calc\(100vw - 36px\)\)!important/);
 assert.match(css,/flex:0 0 36px!important/);
 assert.match(css,/height:36px!important;min-height:36px!important;max-height:36px!important/);
 assert.match(css,/border:var\(--sv-inset-rim\)!important;background:var\(--sv-inset-fill\)!important/);
});

test('text actions open only in typing mode and close without leaving a selected artifact',()=>{
 const inline=html.split('<script id="sv-note-editor-tools">')[1]?.split('</script>')[0]||'';
 const start=inline.indexOf(' const topMenu=document.getElementById(\'svNoteTopMenu\');');
 const end=inline.indexOf(' document.getElementById(\'svNoteFormatMenu\')',start);
 assert.ok(start>=0&&end>start,'the real text actions controller is present');
 let inkMode=false;
 const attributes={};
 const trigger={setAttribute:(name,value)=>attributes[name]=value,contains:()=>false};
 const menu={hidden:true,addEventListener:()=>{},contains:()=>false};
 const dlg={open:true,classList:{contains:name=>name==='sv-smart-inking'&&inkMode},
  querySelector:()=>trigger,addEventListener:()=>{}};
 const window={};
 const document={getElementById:name=>name==='svNoteTopMenu'?menu:null,addEventListener:()=>{}};
 vm.runInNewContext(inline.slice(start,end),{document,dlg,window});
 window.SEYVEO_NOTE_TEXT_ACTIONS.toggle();
 assert.equal(menu.hidden,false);
 assert.equal(attributes['aria-expanded'],'true');
 window.SEYVEO_NOTE_TEXT_ACTIONS.close();
 assert.equal(menu.hidden,true);
 assert.equal(attributes['aria-expanded'],'false');
 inkMode=true;window.SEYVEO_NOTE_TEXT_ACTIONS.toggle();
 assert.equal(menu.hidden,true,'ink mode cannot show text-only actions');
});
