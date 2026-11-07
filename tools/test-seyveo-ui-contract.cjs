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

const dialogs = [...html.matchAll(/<dialog\b[^>]*\bid="([^"]+)"/g)].map(x=>x[1]);
assert.ok(dialogs.length>=30,'The main app retains all existing dialog destinations');
assert.equal(new Set(dialogs).size,dialogs.length,'Each existing dialog has a unique ID');
for(const name of ['assets/navigation-system.css','assets/seyveo-velvet-system.css',
 'assets/dialog-velvet.css','assets/seyveo-work-shell.css','assets/seyveo-work-shell.js']){
 assert.ok(html.includes(name+'?v='),name+' is loaded with a Safari cache version');
}
console.log('SEYVEO UI contract: tokens, dialogs, shared navigation and popovers verified.');
