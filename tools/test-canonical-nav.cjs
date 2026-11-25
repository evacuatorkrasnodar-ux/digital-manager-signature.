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
  ]
];
for(const [file,fragment] of checks){
 assert.ok(fs.readFileSync(path.join(root,file),'utf8').includes(fragment),file+' must retain '+fragment);
}
console.log('Canonical SEYVEO navigation: '+checks.length+' source checks passed.');
