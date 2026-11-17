/* The far-date roulette is deliberately visual-only. Exercise its real
 * implementation with a tiny DOM stand-in so no browser or tasks are needed. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../assets/personal-tasks.js'),'utf8');
const start=source.indexOf('function svAgendaDistantTodayRail(');
const end=source.indexOf('/* A gentle date-wheel return.',start);
assert.ok(start>0&&end>start,'The actual roulette renderer must exist');

function makeElement(tag,cls,text){
 return {
  tag,className:cls||'',textContent:text||'',dataset:{},style:{},children:[],scrollLeft:0,
  append(...nodes){this.children.push(...nodes)},
  setAttribute(name,value){this[name]=value}
 };
}
function shiftDay(iso,days){
 const [year,month,day]=iso.split('-').map(Number);
 const result=new Date(Date.UTC(year,month-1,day+days));
 return result.toISOString().slice(0,10);
}
function scenario(current,today){
 const ticker=makeElement('div','sv-agenda-ticker');
 const strip={scrollLeft:0,parentElement:ticker};
 const track={children:[{dataset:{day:current}}]};
 const scope={
  Date,Intl,Math,Set,Map,
  document:{documentElement:{dataset:{theme:'light'}}},
  element:makeElement,
  svTaskDate:iso=>new Date(iso+'T12:00:00Z'),
  svTaskShiftDay:shiftDay,
  svTaskSelectedDate:current,
  svAgendaLastRows:[],
  svTaskEntryType:()=> 'task',svTaskCategory:()=> 'personal',svTaskDotTone:()=> 'blue',
  svAgendaRouletteOverlay:null
 };
 vm.createContext(scope);
 vm.runInContext(source.slice(start,end),scope);
 const rail=scope.svAgendaDistantTodayRail(strip,track,today,70);
 assert.ok(rail,'Far-date navigation must render a temporary rail');
 assert.strictEqual(ticker.children[0],rail.surface,'Rail must overlay the original calendar');
 const dates=rail.surface.children[0].children.map(day=>day.dataset.day);
 assert.ok(dates.length>20&&dates.length<40,'Roulette animates a compact sequence');
 assert.equal(new Set(dates).size,dates.length,'No repeated or overlapping dates');
 assert.deepEqual([...dates].sort(),dates,'Calendar remains chronologically ordered');
 assert.equal(dates[Math.round(rail.start/70)],current,'First frame keeps the viewed date');
 assert.equal(dates[Math.round(rail.target/70)],today,'Last frame lands exactly on today');
 assert.equal(rail.surface.scrollLeft,rail.start,'Start position must be stable');
 assert.equal(scope.svAgendaRouletteOverlay,rail.surface,'Cancellation can remove the overlay');
 assert.ok(current<today?rail.start<rail.target:rail.start>rail.target,
  'Wheel moves naturally forward or backward toward today');
}

scenario('2026-01-10','2026-11-17');
scenario('2027-08-23','2026-11-17');
scenario('2024-02-29','2026-11-17');
scenario('2028-01-01','2026-12-31');
console.log('PASS: Today roulette preserves first/last dates across months, years and leap days.');
