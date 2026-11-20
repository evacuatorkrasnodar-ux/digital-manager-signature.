const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const native=read('assets/seyveo-native-paper-color.js');
const style=read('assets/seyveo-native-paper-color.css');
const paper=read('assets/notebook-paper.js');
const smart=read('assets/seyveo-smart-note-ink.js');
const smartStyle=read('assets/seyveo-notebook-editor-v3.css');

test('both editor color controls use native browser inputs without synthetic showPicker',()=>{
 assert.match(native,/native\.type='color'/);
 assert.match(smart,/type="color" value="#171e29"/);
 assert.doesNotMatch(native,/\.showPicker\(/);
 assert.doesNotMatch(smart,/\.showPicker\(/);
 assert.match(native,/native\.addEventListener\('input'/);
 assert.match(native,/native\.addEventListener\('change'/);
 assert.match(smart,/nativeColorPicker\.addEventListener\('input'/);
 assert.match(smart,/nativeColorPicker\.addEventListener\('change'/);
});
test('real touchscreen hit areas stay over rainbow icons for Safari iPhone and Android',()=>{
 assert.match(native,/control\.insertBefore\(native,menu\)/);
 assert.match(style,/> input#notePaperNativeColor\{/);
 assert.match(style,/opacity:\.01!important;pointer-events:auto!important/);
 assert.match(smart,/sv-smart-ink-native-label/);
 assert.match(smartStyle,/label\.sv-smart-ink-native-label > input\.sv-smart-ink-native-color/);
 assert.match(smartStyle,/opacity:\.01!important;pointer-events:auto!important/);
});
test('the old custom solid-color chooser is no longer loaded',()=>{
 assert.doesNotMatch(html,/seyveo-paper-custom-color\.(?:css|js)\?v=/);
 assert.match(html,/seyveo-native-paper-color\.css\?v=1/);
 assert.match(html,/seyveo-native-paper-color\.js\?v=1/);
 assert.match(style,/\[data-sv-menu-panel="colors"\]/);
 assert.match(style,/display:none!important/);
});
test('gradient drawing brushes remain available by their own control',()=>{
 assert.match(native,/notePaperGradientTrigger/);
 assert.match(native,/notePaperColorMenu-gradients-tab/);
 assert.match(paper,/gradientPresets\.forEach\(button=>button\.addEventListener\('click'/);
 assert.match(paper,/applyGradient\(pair,true\)/);
 assert.match(paper,/setInkColor:value=>/);
});
test('selecting a system color updates the actual brush on both screens',()=>{
 assert.match(native,/event=>api\.setInkColor\(event\.currentTarget\.value\)/);
 assert.match(smart,/penColor=next/);
 assert.match(smart,/color:penColor,points:/);
 assert.match(smart,/inkPenColor:penColor/);
});
