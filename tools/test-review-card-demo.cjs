/* Review-room demo content must remain presentation-only. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('assets/seyveo-review-cards.js','utf8');
const css=fs.readFileSync('assets/seyveo-review-cards.css','utf8');
assert.match(js,/const designExamples=\[/);
for(const label of ['Проверить договор','Елена · сообщение','Ответить на письмо']){
 assert.ok(js.includes(label),`Missing training card: ${label}`);
}
assert.match(js,/renderDesignCards\(\);\s*room\.hidden=false/);
assert.match(js,/content\.querySelector\('\.sv-review-demo-list'\)\?\.remove\(\)/);
assert.match(js,/const progress=demoCount\?/);
assert.match(css,/\.sv-review-demo-actions button\{[\s\S]*?min-height:44px/);
assert.doesNotMatch(js,/localStorage\.setItem|fetch\(|removeMany\(/,'Training cards must never mutate the task store');
console.log('PASS: Three isolated review design examples with 44px actions.');
