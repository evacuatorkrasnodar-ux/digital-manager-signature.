/* SEYVEO Smart Calendar: local interval planning, no remote directions or availability.
   Duration and round-trip travel buffers are explicitly user-defined.
   Legacy entries without duration stay UNKNOWN, never silently get a 60-minute duration. */
(function(){
'use strict';
const TIME=/^([01]\d|2[0-3]):[0-5]\d$/,DATE=/^\d{4}-\d{2}-\d{2}$/;
const DURATIONS=[30,60,90,120],TRAVELS=[0,15,30,60],MS=60000;
const minute=s=>TIME.test(s||'')?Number(s.slice(0,2))*60+Number(s.slice(3,5)):null;
const label=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const day=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const duration=n=>DURATIONS.includes(Number(n))?Number(n):0;
const travel=n=>TRAVELS.includes(Number(n))?Number(n):0;
function validDate(value){
 if(!DATE.test(value||''))return false;
 const [y,m,d]=value.split('-').map(Number);
 const actual=new Date(y,m-1,d);
 return actual.getFullYear()===y&&actual.getMonth()===m-1&&actual.getDate()===d;
}
function instant(date,time){
 if(!validDate(date)||minute(time)===null)return null;
 const [y,m,d]=date.split('-').map(Number);
 return new Date(y,m-1,d,Number(time.slice(0,2)),Number(time.slice(3,5))).getTime();
}
function interval(item){
 const start=instant(item.date,item.time);
 if(start===null)return null;
 const dur=duration(item.duration),road=travel(item.travel);
 return {start,end:start+dur*MS,from:start-road*MS,to:start+(dur+road)*MS,known:dur>0};
}
function issue(all,date,time,except=null,settings={}){
 const desired={date,time,duration:settings.duration===undefined?60:settings.duration,travel:settings.travel||0};
 const requested=interval(desired);
 if(!requested)return null;
 const clashes=[];
 for(const item of Array.isArray(all)?all:[]){
  if(!item||item.id===except||typeof item.title!=='string')continue;
  const existing=interval(item);
  if(!existing)continue;
  const gap=Math.abs(requested.start-existing.start)/MS;
  const sameStart=requested.start===existing.start;
  const overlaps=requested.from<existing.to&&existing.from<requested.to;
  const legacyHint=!requested.known||!existing.known;
  // Unknown durations create caution, never a confirmed interval clash.
  const unknownClose=legacyHint&&(
   gap<60||
   (requested.known&&existing.start>=requested.from&&existing.start<requested.to)||
   (existing.known&&requested.start>=existing.from&&requested.start<existing.to));
  if(!sameStart&&!overlaps&&!unknownClose)continue;
  const kind=sameStart?'same':legacyHint?'caution':'overlap';
  clashes.push({item,kind,minutesApart:gap});
 }
 const rank={same:0,overlap:1,caution:2};
 return clashes.sort((a,b)=>rank[a.kind]-rank[b.kind]||a.minutesApart-b.minutesApart||a.item.time.localeCompare(b.item.time))[0]||null;
}
function nearest(all,date,time,except=null,settings={}) {
 const result=issue(all,date,time,except,settings);
 return result?{...result.item,kindOfIssue:result.kind,minutesApart:result.minutesApart}:null;
}
function suggestions(all,date,time,except=null,now=new Date(),settings={}){
 if(!validDate(date)||minute(time)===null)return [];
 const today=day(now);if(date<today)return [];
 const opts={duration:settings.duration===undefined?60:settings.duration,travel:settings.travel||0};
 const limit=now.getHours()*60+now.getMinutes()+15;
 const candidates=[];
 for(let start=540;start<=1140;start+=30){
  if(date===today&&start<limit)continue;
  if(!issue(all,date,label(start),except,opts))candidates.push(start);
 }
 const req=minute(time);
 return candidates.sort((a,b)=>Math.abs(a-req)-Math.abs(b-req)||a-b)
  .slice(0,3).sort((a,b)=>a-b).map(label);
}
function tightPair(all,date){
 if(!validDate(date))return null;
 const sorted=(Array.isArray(all)?all:[]).filter(x=>x&&x.date===date&&minute(x.time)!==null)
  .slice().sort((a,b)=>a.time.localeCompare(b.time));
 for(let i=0;i<sorted.length;i++){
  for(let k=i+1;k<sorted.length;k++){
   const earlier=sorted[i],later=sorted[k];
   const overlap=issue([earlier],later.date,later.time,later.id,{duration:later.duration||0,travel:later.travel||0});
   if(overlap&&overlap.kind!=='same')
    return {first:earlier,second:later,minutesApart:minute(later.time)-minute(earlier.time),kind:overlap.kind};
  }
 }
 return null;
}
window.SEYVEO_CALENDAR_TIME=Object.freeze({nearest,suggestions,tightPair,issue,duration,travel});
})();