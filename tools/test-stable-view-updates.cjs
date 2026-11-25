'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const checks=[
  ['assets/seyveo-work-shell.js','if(el.hidden!==hidden)el.hidden=hidden;'],
  ['assets/seyveo-work-shell.js',"setData(shell,'agendaScroll',String(innerScroll));"],
  ['assets/seyveo-work-shell.js',"setData(shell,'active',active);"],
  ['assets/seyveo-scroll-glass.js',"if(screen.style.getPropertyValue('--sv-scroll-glass-opacity')!==progress)"],
  ['assets/seyveo-scroll-glass.js','if(paintFrame){cancelAnimationFrame(paintFrame);paintFrame=0;}'],
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
// Exercise the actual period renderer with a minimal DOM double, so that
// repeated year updates cannot replace the zodiac artwork or stale the title.
const vm=require('node:vm');
const work=fs.readFileSync(path.resolve(__dirname,'../assets/seyveo-work-shell.js'),'utf8');
const render=work.match(/const syncCalendarPeriod=\(\)=>\{[\s\S]*?\n \};/)?.[0];
assert.ok(render,'Calendar period renderer must remain available');
let textWrites=0,children=[];
const title={dataset:{},set textContent(value){textWrites++;this.label=value;children=[];},append(node){children.push(node);}};
const calendar={hidden:false};
const calendarPeriodLabel={textContent:'2026'};
const heading={dataset:{calendarPeriod:'true'}};
const context={title,calendar,calendarPeriodLabel,heading,zodiacNames:Array(12).fill('Лошади'),zodiacEmoji:Array(12).fill(''),horseArt:'<svg/>',document:{createElement:()=>({setAttribute(){}})}};
const sync=vm.runInNewContext(render+'\n syncCalendarPeriod;',context);
sync();
assert.equal(title.label,'2026');
assert.equal(children.length,1);
const original=children[0];
sync();
assert.equal(textWrites,1,'same year must not redraw');
assert.equal(children[0],original,'keep the original artwork');
calendarPeriodLabel.textContent='Ноябрь 2026';
sync();
assert.equal(title.label,'Ноябрь 2026');
assert.equal(children.length,0);
heading.dataset.calendarPeriod='false';
calendarPeriodLabel.textContent='Декабрь 2026';
sync();
assert.equal(textWrites,2,'hidden calendar header must not replace another title');
heading.dataset.calendarPeriod='true';
delete title.dataset.calendarLabel;
sync();
assert.equal(title.label,'Декабрь 2026');
console.log('Stable view source checks passed: '+checks.length+'; calendar renderer behavior passed.');
