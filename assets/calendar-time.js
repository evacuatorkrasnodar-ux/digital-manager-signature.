/* SEYVEO Smart Calendar · local start-time suggestions.
   Events have NO duration; suggestions are tentative, not true free/busy. */
(function(){
'use strict';
const TIME=/^([01]\d|2[0-3]):[0-5]\d$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const minute=s=>TIME.test(s||'')?Number(s.slice(0,2))*60+Number(s.slice(3,5)):null;
const label=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const day=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function timed(all,date,except=null){
 return (Array.isArray(all)?all:[]).filter(x=>x&&x.date===date&&x.id!==except&&minute(x.time)!==null);
}
/* Only considers START times, never inferred appointment durations. */
function nearest(all,date,time,except=null){
 const desired=minute(time);
 if(desired===null||!DATE.test(date||''))return null;
 return timed(all,date,except)
  .map(x=>({...x,minutesApart:Math.abs(minute(x.time)-desired)}))
  .filter(x=>x.minutesApart<60)
  .sort((a,b)=>a.minutesApart-b.minutesApart||a.time.localeCompare(b.time))[0]||null;
}
function suggestions(all,date,time,except=null,now=new Date()){
 const requested=minute(time);
 if(requested===null||!DATE.test(date||''))return [];
 const today=day(now),blocked=timed(all,date,except).map(x=>minute(x.time));
 if(date<today)return [];
 const limit=now.getHours()*60+now.getMinutes()+15;
 const candidates=[];
 for(let start=540;start<=1140;start+=30){
  if(date===today&&start<limit)continue;
  if(blocked.every(saved=>Math.abs(saved-start)>=60))candidates.push(start);
 }
 return candidates.sort((a,b)=>Math.abs(a-requested)-Math.abs(b-requested)||a-b)
  .slice(0,3).sort((a,b)=>a-b).map(label);
}
function tightPair(all,date){
 const sorted=timed(all,date).slice().sort((a,b)=>a.time.localeCompare(b.time));
 for(let i=1;i<sorted.length;i++){
  const diff=minute(sorted[i].time)-minute(sorted[i-1].time);
  if(diff>0&&diff<60)return{first:sorted[i-1],second:sorted[i],minutesApart:diff};
 }
 return null;
}
window.SEYVEO_CALENDAR_TIME=Object.freeze({nearest,suggestions,tightPair});
})();