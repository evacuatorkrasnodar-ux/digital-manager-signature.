/* SEYVEO shared interface contract — source regression checks.
 * Read-only, no browser or third-party dependencies.
 * The browser/device screenshot pass is a separate required QA step.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const html = read('index.html');
const tokens = read('assets/seyveo-velvet-system.css');
const navCss = read('assets/navigation-system.css');
const navJs = read('assets/navigation-system.js');
const life = read('assets/living-space.css');
const workCss = read('assets/seyveo-work-shell.css');
const workJs = read('assets/seyveo-work-shell.js');

for (const token of [
 '--sv-ui-glass:', '--sv-ui-glass-filter:', '--sv-ui-sheet:',
 '--sv-ui-sheet-border:', '--sv-ui-sheet-filter:',
 '--sv-ui-field:', '--sv-ui-touch:', '--sv-ui-icon:', '--sv-ui-stroke:'
]) assert.ok(tokens.includes(token), token + ' is part of canonical Velvet tokens');

assert.doesNotMatch(navJs,/navStyle\s*=\s*document\.createElement\(['"]style['"]\)/,
 'Navigation must never append a conflicting late stylesheet');
assert.match(navCss,/button:is\(\.sv-nav-back,\.sv-nav-arrow\)/,
 'One rule owns static and JavaScript-decorated arrows');
assert.match(navCss,/--sv-ui-touch/);
assert.match(navJs,/function createArrow\(/);
assert.match(navJs,/replaceChildren\(createArrow\(\)\)/);

assert.doesNotMatch(life,/--sv-life-dialog-bg\s*:\s*#[a-f0-9]+/i,
 'My World dialogs must not return to independent green pigments');
assert.doesNotMatch(life,/--sv-life-contacts-bg\s*:\s*#[a-f0-9]+/i,
 'Contacts must share the neutral sheet rather than own a hardcoded pigment');
assert.match(life,/--sv-life-dialog-bg:var\(--sv-ui-sheet\)/);

assert.match(workJs,/const heading=document\.createElement\('header'\)/);
assert.match(workJs,/const createMenu=document\.getElementById\('calendarCreateMenu'\)/);
assert.match(workJs,/calendarAdd\?\.click\(\)/,
 'The single visible + delegates calendar actions to the original controller');
assert.match(workCss,/#svWorkShell > #calendarCreateMenu\{order:0!important\}/,
 'Calendar creation choices must remain in the shared work shell flow, directly beneath the stable header');
assert.doesNotMatch(workCss,/top:calc\(100% \+ 70px\)/,
 'The popover must remain anchored to the real shared header');
assert.match(workCss,/--sv-ui-quiet-surface/,
 'The single work header must retain the approved quiet flat action surface');

for (const file of [
 'assets/dialog-velvet.css', 'assets/calendar.css',
 'assets/personal-tasks.css', 'assets/notebook-paper.css',
 'assets/calendar-spaces.css', 'assets/passport-cards.css',
 'assets/company-signature.css', 'assets/business-map.css',
 'assets/sayvi-surfaces.css'
]) assert.match(read(file),/--sv-ui-(sheet|glass)/, file + ' uses canonical materials');


/* Cabinet chooser and nested tool detail must share the same accessible
 * material and navigation. No fake secondary "Выбрать все" action inside
 * a single instrument's configuration screen. */
const cabinetCss=read('assets/seyveo-business-command.css');
const cabinetJs=read('assets/seyveo-unified-tasks.js');
assert.match(cabinetCss,/\.sv-cabinet-dialog\s*\{[\s\S]*?background:var\(--sv-ui-sheet\)/);
assert.match(cabinetCss,/\.sv-cabinet-footer\s*\{[\s\S]*?background:var\(--sv-ui-sheet\)/);
assert.match(cabinetCss,/#svCabinetDialog\[data-cabinet-view="guide"\] \.sv-cabinet-reset/);
assert.match(cabinetCss,/\.sv-cabinet-guide-back\s*\{[\s\S]*?background:transparent/);
assert.match(cabinetCss,/\.sv-cabinet-source\s*\{[\s\S]*?background:var\(--sv-ui-field\)/);
assert.match(cabinetJs,/dialog\.dataset\.cabinetView='guide'/);
assert.match(cabinetJs,/dialog\.dataset\.cabinetView='catalog'/);
assert.match(cabinetJs,/saveButton\?\.addEventListener\('click',save\)/);
assert.match(cabinetJs,/cancelButton\?\.addEventListener\('click',cancel\)/);

for(const file of [
 'assets/seyveo-browser.css','assets/seyveo-connect.css',
 'assets/seyveo-connections.css','assets/seyveo-fan-workshop.css',
 'assets/personal-wellness.css','assets/seyveo-smart-home.css',
 'assets/account-demo.css','assets/connection-coach.css'
]){
 assert.match(read(file),/var\(--sv-ui-(?:sheet|glass|field|selected-surface)\)/,
  file+' shares a canonical SEYVEO surface token');
}
const dialogs = [...html.matchAll(/<dialog\b[^>]*\bid="([^"]+)"/g)].map(x=>x[1]);
assert.ok(dialogs.length>=30,'The main app retains all existing dialog destinations');
assert.equal(new Set(dialogs).size,dialogs.length,'Each existing dialog has a unique ID');
for(const name of ['assets/navigation-system.css','assets/seyveo-velvet-system.css',
 'assets/dialog-velvet.css','assets/seyveo-work-shell.css','assets/seyveo-work-shell.js']){
 assert.ok(html.includes(name+'?v='),name+' is loaded with a Safari cache version');
}

/* Prevent a late inline style from resurrecting the oversized cabinet Save pill.
 * The 44px hit target stays; only the visual capsule disappears. */
assert.doesNotMatch(html,/id="seyveo-action-design-standard"/,
 'No independent inline Cabinet Save styles may override its module');
const tasksCss=read('assets/personal-tasks.css');
const calendarCss=read('assets/calendar.css');
const fullscreenCss=read('assets/seyveo-fullscreen-workspaces.css');
const docFlowCss=read('assets/seyveo-document-flow.css');
assert.match(tasksCss,/#personalTaskDialog #personalTaskSave::before\{\s*display:none!important/,
 'Task Save cannot draw a pseudo-element pill');
assert.match(tasksCss,/#personalTaskDialog #personalTaskSave\{[\s\S]*?min-height:44px!important/,
 'Task Save must retain an accessible 44px target');
assert.match(calendarCss,/#calendarEventDialog \.cal-dialog-actions>\.btn\.primary\{[\s\S]*?height:44px!important/,
 'Event Save must retain an accessible 44px target');
assert.match(cabinetCss,/\.sv-cabinet-save\{\s*min-width:0;background:transparent/,
 'Cabinet Save must be a flat action');
assert.match(fullscreenCss,/\.seyveo-passport-form \.btn\.primary\{[\s\S]*?background:transparent!important/,
 'Company Save should not be a raised capsule');
assert.match(docFlowCss,/#sayviSurfacePage \.svdf-picker-sheet\[open\]\{[^\n]*background:var\(--sv-ui-sheet\)/,
 'Document picker must use the approved sheet material');
for(const file of [
 'assets/onboarding.css','assets/seyveo-offline-manager.css',
 'assets/seyveo-pay.css','assets/seyveo-family-chat.css'
]){
 assert.match(read(file),/background:var\(--sv-ui-sheet\)/,
  file+' must use shared modal material');
}
console.log('SEYVEO UI contract: tokens, dialogs, shared navigation and popovers verified.');
