const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const css=read('assets/seyveo-notebook-editor-v3.css');
const contextCss=read('assets/seyveo-notebook-context-actions.css');
const script=read('assets/seyveo-smart-note-ink.js');
const sayviMark=read('assets/seyveo-circular-interlace-mono.svg');

test('single Smart Note has scrollable keyboard toolbar with partial next action visible',()=>{
 assert.match(html,/seyveo-smart-note-ink\.js\?v=10/);
 assert.match(css,/\.sv-note-tools-compact\{[\s\S]*?display:flex!important;grid-template-columns:none!important;/);
 assert.match(css,/overflow-x:auto!important;overflow-y:hidden!important/);
 assert.match(css,/scrollbar-width:none/);
 assert.match(css,/\.sv-note-keyboard-open[\s\S]*?flex:0 0 50px!important/);
 assert.match(css,/--sv-dock-pearl-bg/);
 for(const action of ['text','table','eraser'])assert.match(script,new RegExp("create\\('"+action+"'"));
 assert.doesNotMatch(script,/create\('more'/);
 assert.match(script,/bar\.insertBefore\(textBtn,check\)/);
 assert.match(script,/bar\.insertBefore\(tableBtn,bar\.querySelector\('\[data-note-tool="heading"\]'\)\)/);
});

test('both Smart Note dock surfaces reuse approved Home-dock pearl material',()=>{
 assert.match(html,/seyveo-notebook-editor-v3\.css\?v=19/);
 const pearl=css.slice(css.lastIndexOf('/* Light Smart Note dock:'));
 assert.match(pearl,/\.sv-note-tool-row\.sv-shared-dock::before/);
 assert.match(pearl,/\.sv-note-tool-row\.sv-shared-dock::after/);
 for(const token of ['border','bg','shadow','blur']){
  assert.match(pearl,new RegExp('--sv-dock-pearl-'+token));
 }
 assert.match(pearl,/data-theme="light"/);
});

test('header and contextual text capsule reuse Silver Mist without a three-dot button',()=>{
 const pearl=css.slice(css.lastIndexOf('/* One Silver Mist family'));
 for(const selector of ['button#noteReviewBack.sv-note-back-arrow','button#svNoteDone',
  '#svNoteTopMenu.sv-note-top-menu','#svNoteAttachmentMenu.sv-note-attachment-menu',
  '#svNoteFormatMenu.sv-note-format-menu']){
  assert.ok(pearl.includes(selector),`matches ${selector}`);
 }
 for(const token of ['--sv-dock-pearl-border','--sv-dock-pearl-bg','--sv-dock-pearl-shadow','--sv-dock-pearl-blur']){
  assert.ok(pearl.includes(token),`reuses ${token}`);
 }
 for(const action of ['undo','copy','clear']){
  assert.match(html,new RegExp('data-sv-note-menu="'+action+'"[^>]*><svg[\\s\\S]*?</svg></button>'));
 }
 assert.doesNotMatch(html,/id="svNoteMore"/);
 assert.match(contextCss,/#svNoteTopMenu\.sv-note-top-menu:not\(\[hidden\]\)/);
 assert.doesNotMatch(html,/data-sv-note-menu="(?:notes|paper|print)"/);
 for(const fmt of ['heading','bold','italic','underline']){
  assert.match(html,new RegExp('data-note-format="'+fmt+'"[^>]*><svg[\\s\\S]*?</svg><span>'));
 }
 assert.match(pearl,/\.sv-note-keyboard-open[\s\S]*?box-shadow:var\(--sv-dock-pearl-shadow\)/);
});

test('typing and handwriting share ONE note ID, with vector ink persisted separately from text',()=>{
 assert.match(script,/canvas#svSmartNoteInkCanvas|ink\.id='svSmartNoteInkCanvas'/);
 assert.match(script,/setMode\('pen'\)/);
 assert.match(script,/setMode\('text',true\)/);
 assert.match(script,/editor\?\.ensureRecord\?\.\(\)/);
 assert.match(script,/\{\.\.\.n,inlineInk,inkPenColor:penColor,inkPenWidth:penWidth,updatedAt:Date\.now\(\)\}/);
 assert.match(script,/api\.putNotes\(next\)/);
 assert.match(script,/dlg\.addEventListener\('seyveo:smart-note-open'/);
 assert.match(html,/dlg\.dispatchEvent\(new CustomEvent\('seyveo:smart-note-open',\{detail:\{id\}\}\)\)/);
 assert.match(html,/else if\(note\.inlineInk\?\.strokes\?\.length\)openNoteReview\(note\.text,note\.id\)/);
 assert.doesNotMatch(script,/localStorage\.clear\(|\.removeItem\(/);
});

test('popovers keep their original nodes and work outside clipped toolbar',()=>{
 assert.match(script,/for\(const id of \['svNoteAttachmentMenu','svNoteFormatMenu'\]\)/);
 assert.match(script,/dlg\.append\(menu\)/);
 assert.match(css,/> :is\(#svNoteAttachmentMenu,#svNoteFormatMenu\):not\(\[hidden\]\)/);
});

test('resting dock never scrolls: Aa, pen, attachments and Sayvi stay visible',()=>{
 assert.match(css,/:not\(\.sv-note-keyboard-open\)[\s\S]*?grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/);
 assert.match(css,/:not\(\.sv-note-keyboard-open\)[\s\S]*?overflow:hidden!important;scroll-snap-type:none!important/);
 for(const action of ['text','sayvi'])assert.match(css,new RegExp('data-sv-smart-tool="'+action+'"'));
 assert.match(css,/data-note-tool="draw"/);
 assert.match(css,/data-note-tool="attachment"/);
 assert.match(script,/bar\.insertBefore\(draw,check\)/);
 assert.match(script,/bar\.insertBefore\(attach,check\)/);
 assert.match(script,/bar\.insertBefore\(sayviBtn,check\)/);
 assert.match(script,/bar\.insertBefore\(eraserBtn,check\)/);
 assert.match(css,/:not\(\.sv-note-keyboard-open\)[\s\S]*?\[data-note-tool="attachment"\]/);
 assert.match(css,/\.sv-note-keyboard-open[\s\S]*?width:calc\(100vw - 28px\)!important/);
});

test('Sayvi uses the original approved circular S instead of the old star',()=>{
 assert.match(css,/seyveo-circular-interlace-mono\.svg\?v=1/);
 assert.match(sayviMark,/aria-label="SEYVEO — переплетённые лепестки"/);
 assert.match(sayviMark,/M580 227L587 228/);
 assert.doesNotMatch(script,/class="sv-sayvi-symbol sv-smart-sayvi-icon"/);
});

test('three full-width paper templates persist on the same note and appear in reading mode',()=>{
 assert.match(script,/PAPER_STYLES=new Set\(\['plain','lined','grid'\]\)/);
 assert.match(script,/data-sv-paper-choice="plain"/);
 assert.match(script,/data-sv-paper-choice="lined"/);
 assert.match(script,/data-sv-paper-choice="grid"/);
 assert.match(script,/editor\?\.ensureRecord\?\.\(\)/);
 assert.match(script,/notePaperStyle:next/);
 assert.match(script,/dlg\.dataset\.svPaperStyle=paperStyle/);
 assert.match(html,/dlg\.dataset\.svPaperStyle=\['lined','grid'\]\.includes\(note\.notePaperStyle\)/);
 assert.match(css,/data-sv-paper-style="lined"/);
 assert.match(css,/data-sv-paper-style="grid"/);
 assert.match(css,/background-attachment:local/);
 assert.match(css,/border:0!important;border-radius:0!important;outline:0!important/);
 assert.doesNotMatch(script,/localStorage\.clear\(|removeItem\(/);
});

test('eraser and quick paper are only contextual ink tools',()=>{
 assert.match(script,/inkTools\.className='sv-smart-ink-tools'/);
 assert.match(script,/data-sv-ink-tool="eraser"/);
 assert.match(script,/data-sv-ink-tool="paper"/);
 assert.match(script,/inkTools\.hidden=next==='text'/);
 assert.match(css,/\.sv-smart-inking:not\(\.sv-note-keyboard-open\)/);
 assert.match(script,/create\('paper','Стиль бумаги'/);
 assert.match(script,/paperTrigger\.addEventListener\('click',togglePaper\)/);
 assert.match(script,/inkPaperBtn\.addEventListener\('click',togglePaper\)/);
});

test('vertical handwriting capsule has six tools and safe eraser hold',()=>{
 for(const action of ['undo','eraser','width','color','paper','voice']){
  assert.match(script,new RegExp('data-sv-ink-tool="'+action+'"'));
 }
 assert.doesNotMatch(script,/data-sv-ink-tool="clear"/);
 assert.match(script,/inkUndoBtn\.addEventListener\('click',\(\)=>travelHistory\(\)\)/);
 assert.match(script,/eraserHoldTimer=window\.setTimeout\(\(\)=>\{eraserHoldTriggered=true;clearHandwriting\(\);\},650\)/);
 assert.match(script,/if\(modeLabel\)modeLabel\.textContent=mode==='text'\?'Печатный текст':'Рукописный ввод'/);
 assert.match(script,/INK_WIDTHS=\[3,5,9\]/);
 assert.match(script,/INK_COLORS=\[/);
 assert.match(script,/data-sv-pen-custom-color/);
 assert.match(script,/penColor=next;setMode\('pen'\)/);
 assert.match(script,/width:mode==='eraser'\?35:penWidth,color:penColor/);
 assert.match(script,/strokeStyle=ctx\.fillStyle=validColor\(s\.color\)/);
 assert.match(script,/color:validColor\(s\.color\)/);
 assert.match(script,/function clearHandwriting\(\)/);
 assert.match(script,/window\.confirm\('Удалить все нарисованные штрихи/);
 assert.match(script,/smoothUndo=previous/);
 assert.match(css,/left:50%!important;right:auto!important;bottom:calc\(82px/);
 assert.match(css,/width:min\(272px,calc\(100vw - 40px\)\)!important;height:42px/);
 assert.match(contextCss,/width:48px!important;min-width:48px!important;max-width:48px!important/);
 assert.match(contextCss,/height:248px!important;min-height:248px!important;max-height:248px!important/);
 assert.match(contextCss,/width:36px!important;min-width:36px!important;max-width:36px!important/);
 assert.match(css,/#svSmartInkPicker\.sv-smart-ink-picker:not\(\[hidden\]\)/);
 assert.match(css,/\.sv-note-keyboard-open:not\(\.sv-smart-inking\)[\s\S]*?#svSmartNotePaperPanel\.sv-smart-paper-panel:not\(\[hidden\]\)/);
 assert.doesNotMatch(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
 assert.match(css,/button\[data-sv-smart-tool="paper"\]:not\(\[hidden\]\)\{/);
 assert.match(css,/button\[data-sv-smart-tool="paper"\]:not\(\[hidden\]\)\{\s*display:none!important/);
 assert.match(css,/#svSmartNotePaperPanel\.sv-smart-paper-panel:not\(\[hidden\]\)\{[\s\S]*?top:auto!important/);
});

test('color chooser and compact text capsule have balanced Apple-like icon grids',()=>{
 assert.match(css,/\.sv-smart-ink-color-options\{\s*display:grid!important;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
 assert.match(script,/label class="sv-smart-custom-color"/);
 assert.match(css,/\.sv-smart-custom-color>span\{[\s\S]*?conic-gradient\(/);
 assert.match(css,/\.sv-smart-custom-color>input\{[\s\S]*?opacity:0!important/);
 assert.match(css,/#svNoteTopMenu\.sv-note-top-menu>button\{[\s\S]*?height:39px!important;min-height:39px!important;max-height:39px!important/);
 assert.match(css,/#svNoteTopMenu\.sv-note-top-menu>button>svg\{[\s\S]*?stroke-width:1\.5!important/);
 assert.match(contextCss,/grid-template-columns:repeat\(3,40px\)!important/);
 assert.match(script,/data-sv-ink-tool="width"[\s\S]*?M5 6\.5h7/);
});

test('Sayvi provides in-note edit actions, never redirects to chat',()=>{
 assert.match(script,/sayviPanel\.id='svSmartNoteSayviPanel'/);
 assert.match(script,/data-sv-sayvi-action="recognize"/);
 assert.match(script,/data-sv-sayvi-action="correct"/);
 assert.match(script,/data-sv-sayvi-action="smooth"/);
 assert.match(script,/data-sv-sayvi-action="format"/);
 assert.match(script,/createWorker\(\['rus','eng'\]/);
 assert.match(script,/fetch\('\/api\/seyveo-ask'/);
 assert.match(script,/sayviApply\.addEventListener\('click'/);
 assert.doesNotMatch(script,/chat\.open\(|location\.assign\(|note-handoff\.v1/);
 assert.match(css,/#svSmartNoteSayviPanel\.sv-smart-sayvi-panel:not\(\[hidden\]\)/);
});

test('attachment popover has just two compact choices and follows the paperclip',()=>{
 const popup=css.slice(css.lastIndexOf('/* Notes dock polish v18'));
 for(const choice of ['camera','file'])assert.match(html,new RegExp('data-note-attachment="'+choice+'"'));
 assert.equal([...html.matchAll(/data-note-attachment="(?:camera|file)"/g)].length,2);
 assert.match(html,/anchor=btn\.getBoundingClientRect\(\),bounds=dlg\.getBoundingClientRect\(\)/);
 assert.match(html,/menu\.style\.setProperty\('--sv-attach-menu-left'/);
 assert.match(popup,/width:min\(184px,calc\(100vw - 32px\)\)!important/);
 assert.match(popup,/grid-template-columns:minmax\(0,1fr\)!important/);
 assert.match(popup,/height:40px!important;min-height:40px!important;max-height:40px!important/);
 assert.match(popup,/\.sv-note-keyboard-open[\s\S]*?bottom:calc\(55px/);
});

test('resting dock keeps unified glyph sizes, centered new note and visible Sayvi',()=>{
 const polish=css.slice(css.lastIndexOf('/* Notes dock polish v18'));
 assert.match(polish,/width:52px!important;min-width:0!important;max-width:52px!important/);
 assert.match(polish,/width:25px!important;min-width:25px!important;max-width:25px!important/);
 assert.match(polish,/#svNoteNewStandalone\.sv-note-draw-standalone\{[\s\S]*?place-items:center!important/);
 assert.match(polish,/color:#27313a!important/);
 assert.match(polish,/width:34px!important;min-width:34px!important;max-width:34px!important/);
 assert.match(polish,/button:is\(\[aria-pressed="true"\],\[aria-expanded="true"\],:active\)/);
 assert.match(polish,/box-shadow:inset 0 2\.1px 3\.2px rgba\(31,42,58,\.17\)/);
 assert.doesNotMatch(polish,/button\[aria-pressed="true"\]::after/);
 // The polish must not reveal the hidden checklist, eraser or other tools.
 const restingTools=polish.split('> button:not([hidden]){')[1].split('}\n')[0];
 assert.doesNotMatch(restingTools,/display:grid!important/);
 for(const viewport of [320,375,390,428]){
  const left=Math.max(Math.max(14,Math.min(viewport*.05,22)),viewport/2-175);
  const width=Math.min(248,Math.max(176,viewport-2*left-80));
  const newNoteLeft=viewport-left-60;
  assert.ok(newNoteLeft-(left+width)>=19.9,`dock gap at ${viewport}px`);
  assert.ok(Math.abs((viewport-(newNoteLeft+60))-left)<.001,`outer margins at ${viewport}px`);
 }
});
