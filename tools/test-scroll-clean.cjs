/* SEYVEO · Clean scrolling contract.
 * Bars never appear as gray nested rails, but long content remains scrollable.
 * Run: node tools/test-scroll-clean.cjs
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),globalCss=read('assets/seyveo-scroll-clean.css');
const familyCss=read('assets/seyveo-family-chat.css');
const businessCss=read('assets/seyveo-business-command.css');
assert.match(html,/assets\/seyveo-scroll-clean\.css\?v=\d+/,'Clean scrolling stylesheet loaded');
const head=html.slice(0,html.indexOf('</head>'));
const finalCss=head.match(/<link rel="stylesheet"[^>]*>/g)||[];
assert.match(finalCss.at(-1),/seyveo-scroll-clean\.css/,'Global scroll policy is last stylesheet');
assert.match(globalCss,/html,body,body \*\{[\s\S]*?scrollbar-width:none!important/,'Firefox scrollbar tracks disabled');
assert.match(globalCss,/body \*::-webkit-scrollbar\{[\s\S]*?display:none!important/,'WebKit scrollbar tracks disabled');
assert.doesNotMatch(globalCss,/(?:overflow-x|overflow-y|overflow):\s*hidden/,'Never hide or clip actual app scrolling globally');
assert.match(familyCss,/\.svf-dialog\{[^}]*height:min\(730px/,'Family view has one viewport-fitting height');
assert.match(familyCss,/\.svf-shell\{[^}]*height:100%/,'Family flex layout follows dialog');
assert.match(familyCss,/\.svf-thread\{[^}]*min-height:0;overflow-y:auto/,'Long conversation accessible within available space');
assert.doesNotMatch(familyCss,/scrollbar-width:thin/,'No gray family scrollbar');
assert.match(familyCss,/\.svf-compose textarea\{[^}]*resize:none/,'No native resize handle in family chat');
assert.doesNotMatch(businessCss,/\.svcp-messages\{height:220px/,'Command messages are not forced to 220px');
assert.match(businessCss,/\.svcp-messages\{height:auto;min-height:185px;max-height:/,'Command chat grows until history requires scroll');
for(const id of ['lifePage','seyveoFamilyDialog','seyveoBusinessCommandPage','orbCluster']){
 assert.ok(html.includes('id="'+id+'"'),'Original navigation and visual remains: '+id);
}
console.log('PASS Clean Scroll: no visible rails, Family fits phone, long histories remain accessible, core surfaces preserved.');
