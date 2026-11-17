'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../assets/personal-tasks.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
assert.match(html,/personal-tasks\.js\?v=127/,'The calendar fix must bypass the old mobile cache');
const start=source.indexOf('function svAgendaOpenAtToday(){');
const end=source.indexOf('new MutationObserver(',start);
assert.ok(start>0&&end>start,'The actual opening handler must exist');

const page={hidden:true};
const root={classList:{contains:name=>name==='sv-agenda-scroll-active'}};
const activity={renders:0,aligns:0,rouletteStops:0};
const scope={
 Date,document:{documentElement:root},
 $:()=>page,svAgendaWasOpen:false,svAgendaExplicitFocus:false,
 svAgendaUserInteracted:true,svAgendaInitiallyAligned:true,svAgendaOpeningUntil:0,
 svTaskSelectedDate:'2026-11-20',svTaskWindowStart:'2026-11-20',
 svAgendaTodayTimer:1,clearTimeout(){},
 svAgendaStopRoulette(){activity.rouletteStops++},
 svTaskISO:()=> '2026-11-17',
 render(){activity.renders++},
 requestAnimationFrame(callback){activity.aligns++;callback()},
 svAgendaAlignInitial(){}
};
vm.createContext(scope);
vm.runInContext(source.slice(start,end),scope);

scope.svAgendaOpenAtToday();
assert.equal(activity.renders,0,'A hidden Tasks page should not be reset');
page.hidden=false;
scope.svAgendaOpenAtToday();
assert.equal(scope.svTaskSelectedDate,'2026-11-17','Opening selects the real current date');
assert.equal(scope.svTaskWindowStart,'2026-11-17','The visible rail starts at today');
assert.equal(scope.svAgendaUserInteracted,false,'A fresh open is not a swipe');
assert.equal(scope.svAgendaInitiallyAligned,false,'The rail is queued for physical alignment');
assert.equal(activity.renders,1);
assert.equal(activity.aligns,1);
assert.equal(activity.rouletteStops,1,'A previous date-wheel is cancelled on entry');

scope.svTaskSelectedDate='2026-11-23';
scope.svAgendaOpenAtToday();
assert.equal(scope.svTaskSelectedDate,'2026-11-23','Browsing remains intact within a visit');
assert.equal(activity.renders,1,'No unwanted render/roulette on every event');

page.hidden=true;
scope.svAgendaOpenAtToday();
page.hidden=false;
scope.svAgendaOpenAtToday();
assert.equal(scope.svTaskSelectedDate,'2026-11-17','Reopening Tasks returns directly to today');
assert.equal(activity.renders,2);

page.hidden=true;scope.svAgendaOpenAtToday();
scope.svAgendaExplicitFocus=true;
scope.svTaskSelectedDate='2027-08-23';
page.hidden=false;scope.svAgendaOpenAtToday();
assert.equal(scope.svTaskSelectedDate,'2027-08-23','Explicit Sayvi date focus is preserved');
assert.equal(activity.renders,2);

const alignStart=source.indexOf('function svAgendaAlignInitial(){');
const alignEnd=source.indexOf('/* Every fresh entry into My Tasks',alignStart);
assert.ok(alignStart>0&&alignEnd>alignStart,'The physical first-paint alignment must exist');
const railDays=Array.from({length:28},(_,i)=>({dataset:{day:i===21?'2026-11-17':'other-'+i}}));
const rail={clientWidth:350,scrollTo(options){this.lastScroll=options}};
const track={firstElementChild:{getBoundingClientRect:()=>({width:70})},children:railDays,
 querySelector:selector=>selector.includes('2026-11-17')?railDays[21]:null};
rail.querySelector=()=>track;
const agendaList={clientHeight:500,scrollTo(options){this.lastScroll=options}};
const mark=[];
const alignScope={
 Date,document:{documentElement:root,querySelector:()=>rail},list:agendaList,
 svAgendaInitiallyAligned:false,svAgendaUserInteracted:false,
 svTaskISO:()=> '2026-11-17',svTaskSelectedDate:'2026-11-13',svTaskWindowStart:'2026-11-13',
 svAgendaIgnoreStripScrollUntil:0,svAgendaMarkSelected:date=>mark.push(date),
 svAgendaAnchorCache:null,svAgendaGetAnchors:()=>[{iso:'2026-11-17',top:240}],
 svAgendaDockPreviousY:0
};
vm.createContext(alignScope);
vm.runInContext(source.slice(alignStart,alignEnd),alignScope);
alignScope.svAgendaAlignInitial();
assert.equal(alignScope.svTaskSelectedDate,'2026-11-17');
assert.equal(rail.lastScroll.left,21*70,"Today's day must begin in the first column");
assert.equal(rail.lastScroll.behavior,'instant','No opening roulette or smooth jump');
assert.equal(agendaList.lastScroll.top,240,"Agenda content must begin at today's section");
assert.deepEqual(mark,['2026-11-17']);

assert.match(source,/if\(!svAgendaUserInteracted\|\|!svAgendaCanReturnToday\(\)/,
 'An idle date roulette must never begin before user interaction');
assert.match(source,/if\(!railUserScrolling\|\|svAgendaRolling/,
 'Programmatic rail scrolling cannot select a different day');
assert.match(source,/strip\.scrollTo\(\{left:\[\.\.\.track\.children\]\.indexOf\(todayDay\)\*unit,behavior:'instant'\}\)/,
 'Opening must position the rail on today instantly');
console.log('PASS: Today is first on open, human browsing remains, and idle scroll is ignored.');
