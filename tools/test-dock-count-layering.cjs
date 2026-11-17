'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const badge=fs.readFileSync(path.join(root,'assets/seyveo-review-cards.css'),'utf8');
const material=fs.readFileSync(path.join(root,'assets/seyveo-home-dock-preview.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.match(badge,/#navTasks\[data-sv-review-count\]::before\s*\{content:none!important;display:none!important\}/);
assert.match(badge,/#navTasks\{position:relative;z-index:auto!important\}/);
assert.match(badge,/#navTasks\[data-sv-review-count\]::after\s*\{[\s\S]*?z-index:-1!important/);
assert.match(badge,/#navTasks\[data-sv-review-count\]:is\(\.active,\.sv-dock-nav-press\)::after\s*\{\s*z-index:3!important/);
assert.doesNotMatch(badge,/radial-gradient\(circle at 28%/);
assert.match(material,/--sv-dock-pearl-blur:blur\(4px\)/);
assert.match(html,/seyveo-review-cards\.css\?v=27/);
console.log('PASS: one sharp dock badge sits under the original pearl glass until pressed.');
