/* SEYVEO Fullscreen Workspaces · mobile-only shared geometry.
 * node tools/test-fullscreen-workspaces.cjs
 * Static contract; iPhone/Android visual and keyboard QA remains necessary.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/seyveo-fullscreen-workspaces.css','utf8');
const names=[...html.matchAll(/<dialog\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]);
const screens=[
 'calendarSpaceDialog','seyveoSmartHomeDialog','seyveoContactsDialog','seyveoFamilyDialog',
 'notesDialog','noteReadDialog','noteReviewDialog','noteModeDialog','notePaperDialog',
 'noteScanDialog','calendarEventDialog','personalTaskDialog','manageRoadmapDialog',
 'manageConnectionsDialog','manageDataDialog','assistantChatHistoryDialog',
 'homeWidgetsManageDialog','seyveoAccountDemo','seyveoPulseDialog','seyveoStudioDialog',
 'seyveoCompanyDialog','seyveoQrCardDialog','seyveoAvatarDialog','homeWidgetDetails',
 'pictureBreakdownDialog','assistantQuickSettings','onboardDialog','seyveoPayDialog'
];
for(const id of screens){
 assert.equal(names.filter(x=>x===id).length,1,'Existing workspace preserved once: '+id);
 assert.match(css,new RegExp('#'+id+'\\b'),'Fullscreen selector includes workspace: '+id);
}
for(const id of ['wakeVoiceConsent','seyveoCallDialog','businessMapDialog']){
 assert.ok(names.includes(id),'Existing small/disabled dialog preserved');
 assert.doesNotMatch(css,new RegExp('#'+id+'\\b'),'Not every transient dialog is a full-screen page');
}
const head=html.slice(0,html.indexOf('</head>'));
const linked=[...head.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(x=>x[1]);
assert.match(linked.at(-1),/seyveo-fullscreen-workspaces\.css\?v=\d+/,'Responsive sizing stylesheet wins over old dialog widths');
assert.match(css,/@media \(max-width:720px\)/,'Only phone-scale viewport changes');
assert.match(css,/width:100vw!important/);
assert.match(css,/height:100dvh!important/);
assert.match(css,/max-height:100dvh!important/);
assert.match(css,/border-radius:0!important/);
assert.match(css,/overflow-y:auto!important/,'Long content remains accessible by scrolling');
assert.match(css,/env\(safe-area-inset-top,0px\)/);
assert.match(css,/env\(safe-area-inset-bottom,0px\)/);
assert.match(css,/dialog#notesDialog\.notes-dialog\[open\]/,'Notebook fit-content mode overridden');
assert.match(css,/\.notes-list:not\(\.is-empty\)/,'Notebook list stays scrollable');
assert.match(css,/dialog#seyveoFamilyDialog\.svf-dialog\[open\]/,'Family nested rail collapsed into a single phone screen');
assert.match(css,/\.svf-thread,/,'Long family messages remain readable');
assert.doesNotMatch(css,/\.plasma|#orbCluster|\.dock\b|#homePage/,'Never restyle approved sphere or dock');
assert.match(html,/id="lifePage"/);
assert.match(html,/id="seyveoBusinessCommandPage"/);
console.log('PASS SEYVEO mobile workspaces: '+screens.length+' full-screen destinations, safe areas, original navigation and data, small alerts unchanged.');
