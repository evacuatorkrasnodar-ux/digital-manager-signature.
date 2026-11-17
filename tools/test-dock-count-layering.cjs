'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const badge=fs.readFileSync(path.join(root,'assets/seyveo-review-cards.css'),'utf8');
const badgeLogic=fs.readFileSync(path.join(root,'assets/seyveo-review-cards.js'),'utf8');
const material=fs.readFileSync(path.join(root,'assets/seyveo-home-dock-preview.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.match(badge,/#navTasks\[data-sv-review-count\]::before\{content:none!important;display:none!important\}/);
assert.match(badge,/#navTasks\[data-sv-review-count\]::after\s*\{\s*content:attr\(data-sv-review-count\)!important/);
assert.match(badge,/color:#FFF!important;opacity:\.40!important/);
assert.match(badge,/color:transparent;background:#F4A66D;opacity:\.68/);
assert.match(badge,/\.sv-dock-review-underlay-digit\{background:#D6534A;opacity:1\}/,
 'The selected counter disc must match the red Tasks icon');
assert.match(badge,/\.dock\.sv-shared-dock > \.sv-dock-review-underlay\s*\{[\s\S]*?z-index:-1!important/);
assert.match(badge,/body > footer\.dock\.sv-shared-dock:has\(> #navTasks:is\(\.active,\.sv-dock-nav-press\)\)/);
assert.match(badge,/\.sv-dock-review-underlay\{z-index:2!important\}/);
assert.match(badgeLogic,/dock\.prepend\(countUnderlay\)/);
assert.match(badgeLogic,/if\(countUnderlay\)countUnderlay\.hidden=total===0/);
assert.doesNotMatch(badge,/radial-gradient\(circle at 28%/);
assert.match(material,/--sv-dock-pearl-blur:blur\(4px\)/);
assert.ok(Number(html.match(/seyveo-review-cards\.css\?v=(\d+)/)?.[1])>=33,
 'The changed counter color must bypass the cached stylesheet');
assert.match(html,/seyveo-review-cards\.js\?v=19/);
console.log('PASS: quiet disc beneath pearl glass and one translucent white digit.');
