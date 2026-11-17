/* The 44px page-action standard never changes the permanent 60px dock. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const tokens=read('assets/seyveo-header-system.css');
const shell=read('assets/seyveo-work-shell.js');
const home=read('assets/seyveo-home-work-actions-flat.css');
const cards=read('assets/seyveo-card-system.css');
const editor=read('assets/seyveo-task-editor-v3.css');
const health=read('assets/seyveo-health-graphite-flat.css');
const favorites=read('assets/seyveo-home-favorites.css');
const generic=read('assets/seyveo-back-silver-flat.css');
const html=read('index.html');

for(const [name,value] of Object.entries({
 '--sv-action-circle-size':'44px',
 '--sv-action-glyph-size':'20px',
 '--sv-nav-single-size':'44px',
 '--sv-nav-capsule-height':'44px',
 '--sv-nav-capsule-cell':'42px',
 '--sv-nav-double-width':'92px',
 '--sv-nav-triple-width':'134px',
 '--sv-header-slot':'44px'
}))assert.ok(tokens.includes(`${name}:${value};`),`${name} must be ${value}`);

assert.match(shell,/var\(--sv-nav-triple-width,134px\)/);
assert.match(shell,/:host\(\[data-task-selecting="true"\]\) \.sv-history-dual\{\s*display:flex!important;width:var\(--sv-nav-single-size,44px\)/);
assert.match(shell,/sv-review-cards-badge:not\(\[hidden\]\)\{position:absolute;top:4px;right:1px;/);
assert.match(home,/\.lm-polymer\.sv-card-icon-button:is\([\s\S]*?flex:0 0 var\(--sv-action-circle-size,44px\)!important;/);
assert.match(cards,/:root\[data-theme="light"\],[\s\S]*?--sv-card-icon-touch:var\(--sv-action-circle-size,44px\)/,
 'Card Studio and live Home actions must share 44px');
assert.match(editor,/#personalTaskSave\{[\s\S]*?width:var\(--sv-action-circle-size,44px\)!important/);
assert.match(editor,/\.sv-new-task-header\{[\s\S]*?grid-template-rows:44px!important;align-content:start!important;[\s\S]*?height:calc\(62px \+ var\(--sv-task-top-inset\)\)!important;/,
 'New Task header must use the same 44px action row as Work');
assert.match(editor,/--sv-task-top-inset:calc\(16px \+ env\(safe-area-inset-top,0px\)\)/,
 'New Task must align to the regular 16px phone page gutter');
assert.doesNotMatch(editor,/--sv-task-top-inset:max\(22px/,
 'The former 22px offset must stay removed');
assert.match(health,/sv-health-header-add:not\(\[hidden\]\)\{[\s\S]*?width:var\(--sv-action-circle-size,44px\)!important/);
assert.match(favorites,/sv-home-favorite-icon\{\s*position:relative;display:grid;place-items:center;width:var\(--sv-action-circle-size,44px\)/);
assert.match(generic,/\.sv-header-material-circle\{\s*box-sizing:border-box!important;\s*width:var\(--sv-action-circle-size,44px\)!important/);
for(const [name,version] of Object.entries({
 'seyveo-header-system.css':15,'seyveo-work-header.js':34,'seyveo-work-shell.js':100,
 'seyveo-home-work-actions-flat.css':71,'seyveo-task-editor-v3.css':56,
 'seyveo-home-favorites.css':34,'seyveo-back-silver-flat.css':7,'seyveo-health-graphite-flat.css':82,
 'seyveo-card-system.css':36
}))assert.ok(html.includes(`${name}?v=${version}`),`${name} needs a fresh asset version`);
assert.match(read('assets/seyveo-home-dock-preview.css'),/height:60px!important/,
 'The main dock stays 60px tall');
console.log('PASS: 44px round actions and grouped page capsules, unchanged main dock.');
