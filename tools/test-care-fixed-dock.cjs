/* SEYVEO: Care and Health scroll beneath ONE stationary real dock.
 * Run: node tools/test-care-fixed-dock.cjs
 * This checks structure and routing. Mobile Safari device test still required.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html');
const css=read('assets/seyveo-fullscreen-workspaces.css');
const spaces=read('assets/calendar-spaces.js');
const wellness=read('assets/personal-wellness.js');
const dock=read('assets/seyveo-dock-continuity.js');
const begin=html.indexOf('<dialog id="calendarSpaceDialog"');
const end=html.indexOf('</dialog>',begin);
assert.ok(begin>0&&end>begin,'Health/Care dialog exists');
const care=html.slice(begin,end+9);
assert.equal((html.match(/id="svCareScroll"/g)||[]).length,1,'Only one Care scroll region');
assert.ok(care.indexOf('id="calendarSpaceTitleHeading"')<care.indexOf('id="svCareScroll"'),
 'Header remains outside scroll region');
assert.ok(care.indexOf('id="calendarMeasureBack"')<care.indexOf('id="svCareScroll"'),
 'Measurement Back remains outside scroll region');
for(const id of ['calendarSpaceIntro','calendarPersonalTools','calendarHealthOverview',
 'calendarSpaceJournal','calendarSpacePrivacy','calendarSpaceClose']){
 assert.ok(care.indexOf('id="'+id+'"')>care.indexOf('id="svCareScroll"'),'Care content inside the scrolling region: '+id);
}
assert.ok(care.includes('</div>\n</dialog>'),'Content region closes before dialog');
assert.match(css,/dialog#calendarSpaceDialog\.cal-space-dialog\[open\]\{[\s\S]*?overflow:hidden!important/,
 'Outer dialog must NEVER scroll together with the dock');
assert.match(css,/#calendarSpaceDialog > #svCareScroll\.sv-care-scroll\{[\s\S]*?flex:1 1 auto;[\s\S]*?min-height:0;[\s\S]*?overflow-y:auto;/,
 'Care content is the only scrolling surface');
assert.match(css,/scrollbar-width:none/,'Visible scrollbar hidden, touch scroll intact');
assert.equal((html.match(/<footer class="dock"/g)||[]).length,1,'Only the original dock');
assert.match(dock,/next\.appendChild\(dock\)/,'The real dock moves to the dialog, never a clone');
assert.match(css,/dialog\.seyveo-dock-host\[open\] > footer\.dock/,
 'The dock is a direct dialog child, separate from scrollable Care content');
for(const file of [spaces,well]){
 assert.doesNotMatch(file,/(?:dialog|\$\('calendarSpaceDialog'\))\.scrollTop=0;/,
  'No scroll reset on the dialog/dock shell');
}
assert.equal((spaces.match(/\$\('svCareScroll'\)\.scrollTop=0;/g)||[]).length,3,
 'All three Health/space reset paths scroll the content only');
assert.equal((wellness.match(/\$\('svCareScroll'\)\.scrollTop=0;/g)||[]).length,3,
 'Care focus and Back paths scroll only the content');
for(const file of ['assets/seyveo-fullscreen-workspaces.css?v=3',
 'assets/calendar-spaces.js?v=20','assets/personal-wellness.js?v=19']){
 assert.ok(html.includes(file),'Updated asset URL avoids stale cache: '+file);
}
assert.match(spaces,/const KEY='seyveo-life-spaces-v1'/,'Existing measurement storage preserved');
assert.match(wellness,/const KEY='seyveo-private-health-care-v1'/,
 'Existing Care storage preserved');
console.log('PASS Care/Health: stationary original dock, independent scroll and Back, no data loss.');
