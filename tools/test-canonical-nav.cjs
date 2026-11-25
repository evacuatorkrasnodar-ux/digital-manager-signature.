/* Source regression tests: Cabinet navigation. No browser dependency. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const checks=[
  ["assets/seyveo-docs-viewer.js","mark.className+=' sv-sayvi-symbol'"],
  ["assets/seyveo-docs-viewer.css","display:block;flex:0 0 24px;width:24px;height:24px;"],
  ["assets/seyveo-docs-studio.js","ctx.fillText(line,margin,y,usable)"],
  ["assets/seyveo-docs-viewer.css","grid-template-columns:minmax(0,1fr);min-width:0;width:100%;max-width:100%;"],
  ["assets/seyveo-docs-viewer.js","el('span','svdv-sayvi-mark')"],
  ["assets/seyveo-docs-viewer.js","event.preventDefault();more.open=false;summary.focus();"],
  ["assets/documents-shelf.js","function editFolderName(state,category=null)"],
  ["assets/documents-shelf.js","await localFiles().createFolder(state.options.area,name)"],
  ["assets/documents-shelf.js","if(category)await updateFolder(state,category,{name});"],
  ["assets/seyveo-documents-graphite-flat.css","dialog.sv-doc-folder-name-sheet[open]"],
  ["assets/seyveo-pay.css","flex:0 0 var(--sv-nav-single-size,44px);display:grid;place-items:center;appearance:none;"],
  ["assets/seyveo-personal-wallet.css",".sw-row-main > div{flex:1 1 auto;min-width:0;overflow:hidden}"],
  ["assets/seyveo-personal-wallet.css","white-space:normal;overflow-wrap:anywhere;font-variant-numeric:tabular-nums"],
  ["assets/seyveo-personal-wallet.css","box-sizing:border-box;width:var(--sv-nav-single-size,44px);min-width:var(--sv-nav-single-size,44px);"],
  ["sayvi-chat-new.html","assets/seyveo-header-system.css?v="],
  ["sayvi-chat-new.html","width:var(--sv-nav-single-size,44px);height:var(--sv-nav-single-size,44px);min-width:var(--sv-nav-single-size,44px)"],
  ["sayvi-chat-new.html","body #sayviHistory .history-head #sayviHistoryMenuButton,"],
  ["sayvi-chat-new.html","grid-template-columns:var(--sv-header-symmetric-grid,44px minmax(0,1fr) 44px)!important;"],
  ["assets/seyveo-work-inbox-actions.css","grid-template-rows:var(--sv-nav-single-size,44px)!important;"],
  ["assets/seyveo-work-inbox-actions.css",":is(#svcpWorkHistoryBack,#svcpWorkHistoryMenuButton):is(:active,:hover,:focus)"],
  ["assets/seyveo-chat-header-v2.css"," + var(--sv-nav-single-size,44px) + 20px)!important;"],
  ["assets/seyveo-family-chat.css",".svf-iconbutton{width:var(--sv-nav-single-size,44px);height:var(--sv-nav-single-size,44px);"],
  ["assets/seyveo-header-system.css","--sv-note-header-top:max(26px,env(safe-area-inset-top,0px));"],
  ["assets/seyveo-notebook-editor-v3.css","top:var(--sv-note-header-top,max(26px,env(safe-area-inset-top,0px)))!important;"],
  ["assets/notebook-scan.css","top:var(--sv-note-header-top,max(26px,env(safe-area-inset-top,0px)))!important;"],
  ["assets/seyveo-notebook-editor-v3.css","grid-template-columns:var(--sv-header-symmetric-grid,44px minmax(0,1fr) 44px)!important;"],
  ["assets/notebook-scan.css","right:var(--sv-note-header-side,19px)!important;"],
  ["assets/seyveo-mail-white-pearl.css","left:var(--sv-header-compact-row,48px)!important;right:var(--sv-header-compact-row,48px)!important;"],
  ["assets/seyveo-mail-white-pearl.css",".sv-mail-top-buttons{align-items:center!important;height:var(--sv-nav-capsule-height,44px)!important"],
  ["assets/seyveo-mail-white-pearl.css","flex:0 0 var(--sv-nav-single-size,44px)!important;width:var(--sv-nav-single-size,44px)!important;height:var(--sv-nav-single-size,44px)!important;"],
  ["assets/seyveo-header-system.css","--sv-header-action-top:calc((var(--sv-apple-nav-row) - var(--sv-header-slot)) / 2);"],
  ["assets/seyveo-header-system.css","top:var(--sv-header-action-top,0px)!important;right:0!important;"],
  ["assets/seyveo-header-search-flat.css","top:var(--sv-header-action-top,0px)!important;"],
  ["assets/seyveo-documents-graphite-flat.css","top:var(--sv-header-action-top,0px)!important;"],
  ["assets/seyveo-back-silver-flat.css","flex:0 0 var(--sv-nav-single-size,44px)!important;"],
  ["assets/seyveo-sheet-navigation.css","grid-template-rows:8px var(--sv-nav-single-size,44px)!important"],
  [
    "assets/seyveo-header-system.css",
    "--sv-nav-single-size:44px;"
  ],
  [
    "assets/seyveo-header-system.css",
    "--sv-nav-double-width:92px;"
  ],
  [
    "assets/seyveo-header-system.css",
    "--sv-nav-triple-width:134px;"
  ],
  [
    "assets/seyveo-header-system.css",
    "--sv-nav-capsule-cell:42px;"
  ],
  [
    "assets/seyveo-header-system.css",
    "--sv-header-slot:var(--sv-nav-single-size);"
  ],
  [
    "assets/navigation-system.css",
    "var(--sv-nav-single-size,var(--sv-ui-touch,44px))"
  ],
  [
    "assets/seyveo-back-silver-flat.css",
    "border:var(--sv-back-button-edge,0)!important"
  ],
  [
    "assets/living-space.css",
    "#manageThemeScreen #manageThemeBack::before{content:none!important;display:none!important}"
  ],
  [
    "assets/calendar.css",
    "var(--sv-nav-double-width,92px)"
  ],
  [
    "assets/seyveo-work-header.js",
    "var(--sv-nav-double-width,92px)"
  ],
  [
    "assets/seyveo-work-header.js",
    "var(--sv-nav-triple-width,134px)"
  ],
  [
    "assets/seyveo-mail-white-pearl.css",
    "var(--sv-nav-double-width,92px)"
  ],
  [
    "assets/seyveo-personal-wallet.js",
    "sw-month sv-month-nav"
  ],
  [
    "assets/seyveo-white-pearl.css",
    "color:#007aff!important"
  ],
  ["assets/seyveo-docs-viewer.css","width:var(--sv-nav-single-size,44px)"],
  ["assets/seyveo-fan-workshop.css","width:var(--sv-nav-single-size,44px)"],
  ["assets/seyveo-connect.css","width:var(--sv-nav-single-size,44px)"],
  ["assets/seyveo-white-pearl.css",".svdv-sheet-top > :is(.svdv-sheet-close,.svdv-sheet-expand)"],
  ["assets/seyveo-unified-menu-material.css","--sv-menu-compact-radius:18px;"],
  ["assets/seyveo-unified-menu-material.css","--sv-menu-action-height:44px;"],
  ["assets/seyveo-documents-graphite-flat.css","border-radius:var(--sv-menu-compact-radius,18px)!important"],
  ["assets/seyveo-docs-viewer.css","box-shadow:var(--sv-menu-shadow)!important"],
  ["assets/seyveo-mail-white-pearl.css","border-radius:var(--sv-menu-compact-radius,18px)!important"],
  ["assets/seyveo-notebook-list-clean-v4.css","border-radius:var(--sv-menu-compact-radius,18px)!important"],
  ["assets/seyveo-header-system.css","--sv-header-symmetric-grid:var(--sv-header-slot) minmax(0,1fr) var(--sv-header-slot);"],
  ["assets/seyveo-header-system.css","--sv-header-compact-row:calc(var(--sv-header-slot) + 4px);"],
  ["assets/seyveo-header-system.css","--sv-header-sheet-row:calc(var(--sv-header-slot) + 16px);"],
  ["assets/seyveo-work-header.js","height:var(--sv-header-work-tabs-row,74px)"],
  ["assets/seyveo-mail-white-pearl.css","left:var(--sv-header-double-reserve,96px)!important"],
  ["assets/seyveo-company-flat-polish.css","grid-template-rows:var(--sv-header-compact-row,48px)!important"],
  ["assets/seyveo-work-inbox-actions.css","height:var(--sv-header-sheet-row,60px)!important"]
];
for(const [file,fragment] of checks){
 assert.ok(fs.readFileSync(path.join(root,file),'utf8').includes(fragment),file+' must retain '+fragment);
}
console.log('Canonical SEYVEO navigation: '+checks.length+' source checks passed.');
