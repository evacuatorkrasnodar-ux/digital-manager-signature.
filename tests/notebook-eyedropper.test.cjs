const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const paper=read('assets/notebook-paper.js');
const paperStyle=read('assets/seyveo-paper-pearl-theme.css');
const paperMenu=read('assets/seyveo-paper-menu-polish.js');
const smart=read('assets/seyveo-smart-note-ink.js');
const smartStyle=read('assets/seyveo-notebook-editor-v3.css');
const inkContextStyle=read('assets/seyveo-notebook-context-actions.css');

test('both Notebook and Drawing open real browser color pickers from physical taps',()=>{
 assert.match(html,/id="notePaperNativeColor" type="color"/);
 assert.match(smart,/type="color" value="#171e29"/);
 assert.match(smart,/nativeColorPicker=inkColorBtn\.querySelector/);
 assert.doesNotMatch(smart,/showPicker\(|nativeColorPicker\.click\(/);
 assert.match(paper,/nativeColorInput\?\.addEventListener\('input'/);
 assert.match(paper,/nativeColorInput\?\.addEventListener\('change'/);
 assert.match(smart,/nativeColorPicker\.addEventListener\('input'/);
 assert.match(smart,/nativeColorPicker\.addEventListener\('change'/);
});

test('native touch areas stay directly above the rainbow ring without overlay panels',()=>{
 assert.match(html,/class="sv-paper-native-color"/);
 assert.match(smart,/class="sv-smart-ink-native-label"/);
 assert.match(paperStyle,/> label\.sv-paper-native-color > input#notePaperNativeColor\{/);
 assert.match(paperStyle,/opacity:\.01!important;pointer-events:auto!important/);
 assert.match(smartStyle,/label\.sv-smart-ink-native-label > input\.sv-smart-ink-native-color\{/);
 assert.match(smartStyle,/opacity:\.01!important;pointer-events:auto!important/);
 assert.match(inkContextStyle,/:is\(button,label\)\[data-sv-ink-tool="color"\]/);
});

test('no leftover homemade solid-color picker is loaded',()=>{
 assert.doesNotMatch(html,/seyveo-paper-custom-color\.(?:css|js)\?v=/);
 assert.doesNotMatch(html,/seyveo-native-paper-color\.(?:css|js)\?v=/);
 assert.doesNotMatch(html,/data-paper-color="#171e29" aria-label="Чёрный" aria-pressed="false"/);
 assert.doesNotMatch(paperMenu,/view=buildSegments\(colorMenu/);
 assert.doesNotMatch(smart,/data-sv-color-tab|INK_GRID/);
});

test('gradient drawing brushes remain in a separate compact control',()=>{
 assert.match(html,/id="notePaperColorTrigger"[^>]+aria-label="Градиенты"/);
 assert.match(html,/class="sv-paper-gradient-glyph"/);
 assert.match(html,/data-paper-gradient="#e9eff8,#809ebd"/);
 assert.match(paper,/gradientPresets\.forEach\(button=>button\.addEventListener\('click'/);
 assert.match(paper,/applyGradient\(pair,true\)/);
 assert.match(paperStyle,/\.sv-paper-gradient-glyph\{/);
});

test('selecting a system color updates the actual pen, not just its preview',()=>{
 assert.match(paper,/activeColor=hex;activeGradient=null/);
 assert.match(paper,/getInkColor:\(\)=>activeColor/);
 assert.match(smart,/penColor=next/);
 assert.match(smart,/color:penColor,points:/);
 assert.match(smart,/inkPenColor:penColor/);
});
