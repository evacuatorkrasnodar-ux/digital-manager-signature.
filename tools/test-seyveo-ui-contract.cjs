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
assert.match(workCss,/#svWorkHeader #calendarCreateMenu:not\(\[hidden\]\)/);
assert.doesNotMatch(workCss,/top:calc\(100% \+ 70px\)/,
 'The popover must remain anchored to the real shared header');
assert.match(workCss,/--sv-ui-glass/);

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
console.log('SEYVEO UI contract: tokens, dialogs, shared navigation and popovers verified.');
