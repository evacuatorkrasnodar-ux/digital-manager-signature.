'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const checks=[
  [
    "assets/seyveo-work-shell.js",
    "if(syncFrame)return;"
  ],
  [
    "assets/seyveo-work-shell.js",
    "if(syncFrame){cancelAnimationFrame(syncFrame);syncFrame=0;}"
  ],
  [
    "assets/seyveo-work-shell.js",
    "if(searchTasks.dataset.svHeaderIcon!==nextSearchIcon)"
  ],
  [
    "assets/seyveo-work-shell.js",
    "if(tab.textContent!==nextTabLabel)"
  ],
  [
    "assets/seyveo-scroll-glass.js",
    "new ResizeObserver(scheduleMeasure)"
  ],
  [
    "assets/seyveo-scroll-glass.js",
    "if(el.style.getPropertyValue(name)!==px)"
  ],
  [
    "index.html",
    "if(routeChanged)window.scrollTo(0,0);"
  ],
  [
    "index.html",
    "if(routeChanged&&location.hash&&location.hash!=='#home'"
  ]
];
for(const [file,fragment] of checks)assert.ok(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8').includes(fragment),file+' must retain '+fragment);
console.log('Stable view source checks passed: '+checks.length);
