/* Source regression tests: Cabinet navigation. No browser dependency. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const checks=[
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
