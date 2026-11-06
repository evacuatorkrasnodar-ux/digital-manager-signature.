/* SEYVEO · one local life-events reader for Home, My World and Sayvi.
 * The existing Calendar, Tasks and private Spaces stay the ONLY writers.
 * No new store, network request, health read or automatic family disclosure. */
(()=>{
'use strict';
const EVENT_KEY='seyveo-calendar-events-v1';
const TASK_KEY='seyveo-personal-tasks-v1';
const KEYS=new Set([EVENT_KEY,TASK_KEY,'seyveo-life-spaces-v1']);
const pad=n=>String(n).padStart(2,'0');
const key=date=>date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate());
const validDate=s=>{
 if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const [y,m,d]=s.split('-').map(Number);
 const day=new Date(y,m-1,d);
 return day.getFullYear()===y&&day.getMonth()+1===m&&day.getDate()===d;
};
const clock=s=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s)?s:'';
const cleanTitle=s=>typeof s==='string'?s.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,140):'';
function readRows(store,max){
 try{
  const arr=JSON.parse(localStorage.getItem(store)||'[]');
  return Array.isArray(arr)?arr.slice(-max):[];
 }catch{return []}
}
/* Internal, non-sensitive events only. Business events do not leak into ONE. */
function calendarFor(date){
 if(!validDate(date))return [];
 return readRows(EVENT_KEY,300)
  .filter(r=>r&&typeof r.id==='string'&&r.date===date&&
   r.kind!=='business'&&cleanTitle(r.title))
  .map(r=>({id:r.id,title:cleanTitle(r.title),date,time:clock(r.time),kind:'event'}))
  .sort((a,b)=>(a.time||'00:00').localeCompare(b.time||'00:00')||
    a.title.localeCompare(b.title,'ru'));
}
function tasksFor(date){
 if(!validDate(date))return [];
 return readRows(TASK_KEY,150)
  .filter(r=>r&&typeof r.id==='string'&&r.due===date&&r.done!==true&&cleanTitle(r.title))
  .map(r=>({id:r.id,title:cleanTitle(r.title),date,kind:'task'}));
}
/* Family dates are used only INSIDE My World (never Home or Sayvi). */
function worldDatesFor(date){
 if(!validDate(date))return [];
 let raw=[];
 try{raw=window.SEYVEO_SPACES?.calendarItems?.(date)||[]}catch{}
 if(!Array.isArray(raw))return [];
 return raw.filter(r=>r&&r.space==='world'&&
  (r.kind==='День рождения'||r.kind==='Важная дата')&&cleanTitle(r.title))
  .map(r=>({id:String(r.id||''),date,kind:r.kind,title:cleanTitle(r.title)}));
}
function day(date){
 return {date,events:calendarFor(date),tasks:tasksFor(date),dates:worldDatesFor(date)};
}
/* Upcoming genuine personal Calendar entries may surface as quiet Home cards.
 * Only the next 36 hours; never invent a meeting or change its reminder setting.
 * No business events or private family calendar are exposed on Home. */
function upcomingEvents(now=new Date()){
 const start=now.getTime(),end=start+36*60*60*1000;
 return readRows(EVENT_KEY,300).flatMap(r=>{
  if(!r||typeof r.id!=='string'||r.kind==='business'||!validDate(r.date)||!cleanTitle(r.title))return [];
  const time=clock(r.time);
  if(!time)return [];
  const at=new Date(r.date+'T'+time+':00').getTime();
  if(!Number.isFinite(at)||at<start-15*60*1000||at>end)return [];
  return [{id:r.id,title:cleanTitle(r.title),date:r.date,time,startsAt:at,kind:'event'}];
 }).sort((a,b)=>a.startsAt-b.startsAt).slice(0,3);
}
/* A quiet, grounded evening heads-up for unfinished tasks due tomorrow.
 * Date-only task records have no hour, so we do not invent one.
 * No auto-created task, push alert, or unsolicited personal-data transmission. */
function upcomingTasks(now=new Date()){
 if(now.getHours()<18)return [];
 const tomorrow=key(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1));
 return readRows(TASK_KEY,150)
  .filter(r=>r&&typeof r.id==='string'&&r.done!==true&&r.due===tomorrow&&cleanTitle(r.title))
  .sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')))
  .slice(0,3).map(r=>({id:r.id,title:cleanTitle(r.title),date:tomorrow,kind:'task'}));
}
/* Only confirmed personal task deadlines are pushed onto Home.
 * Calendar reminders keep their existing separate opt-in alert UI. */
function attentionTasks(now=new Date()){
 const today=key(now);
 return readRows(TASK_KEY,150)
  .filter(r=>r&&typeof r.id==='string'&&r.done!==true&&
    validDate(r.due)&&r.due<=today&&cleanTitle(r.title))
  .sort((a,b)=>a.due.localeCompare(b.due))
  .map(r=>({id:r.id,title:cleanTitle(r.title),date:r.due,kind:'task'}));
}
/* Read-only relationship hint. A title match is only a possible connection:
 * Sayvi never claims a task belongs to a meeting without confirmation. */
function relatedPreparation(now=new Date()){
 const events=upcomingEvents(now).filter(e=>e.startsAt>=now.getTime()&&e.startsAt-now.getTime()<=24*60*60*1000);
 if(!events.length)return null;
 const cutoff=key(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1));
 const pending=readRows(TASK_KEY,150).filter(t=>t&&t.done!==true&&
  t.kind!=='business'&&validDate(t.due)&&t.due<=cutoff&&cleanTitle(t.title));
 const common=new Set(['сегодня','завтра','проверить','подготовить','сделать','встреча','встречу','задача','документ','документы','дело','работа','план','важное','нужно','перед','после','для']);
 const tokens=title=>new Set(String(title).toLocaleLowerCase('ru-RU').replace(/ё/g,'е')
  .match(/[а-яa-z0-9]{5,}/gu)?.filter(w=>!common.has(w))||[]);
 for(const event of events){
  const words=tokens(event.title);
  if(!words.size)continue;
  for(const task of pending){
   const shared=[...tokens(task.title)].filter(w=>words.has(w));
   // Require a distinctive shared term; no speculative semantic inference.
   if(!shared.some(w=>w.length>=7))continue;
   return {event:{title:event.title,date:event.date,time:event.time},task:{title:cleanTitle(task.title),due:task.due},possible:true};
  }
 }
 return null;
}
function understand(query){
 if(typeof query!=='string'||query.length>220)return null;
 const q=query.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').trim()
  .replace(/^(?:(?:сэйви|сейви|сэй|сей|сейвео|seyveo)[\s,!:.]+)+/u,'')
  .replace(/[?.!]+$/g,'').replace(/\s+/g,' ').trim();
 const match=q.match(/^(?:(?:что у меня(?: запланировано)?|какие(?: у меня)? (?:планы|дела|встречи|события)|что (?:у меня )?в календаре|покажи(?: мне)? (?:мои )?(?:планы|дела|встречи|события)) (?:на )?|(?:мои планы|мои дела) (?:на )?)(сегодня|завтра|послезавтра)$/u);
 return match?({сегодня:0,завтра:1,послезавтра:2})[match[1]]:null;
}
/* An explicit request only: no personal details are broadcast as events,
 * sent to models or written into the persistent assistant history. */
function answer(query,{discreet=false,now=new Date()}={}){
 const shift=understand(query);
 if(shift===null)return null;
 if(discreet)return {private:true,message:'Личные планы скрыты в тихом режиме. Откройте «Мой мир» для просмотра.'};
 const target=new Date(now.getFullYear(),now.getMonth(),now.getDate()+shift);
 const {events,tasks}=day(key(target));
 const label=['сегодня','завтра','послезавтра'][shift];
 if(!events.length&&!tasks.length)
  return {private:true,message:'На '+label+' в личном календаре нет событий и дел со сроком на этот день.'};
 const rows=[
  ...events.map(r=>(r.time?r.time+' · ':'')+r.title),
  ...tasks.map(r=>'Дело · '+r.title)
 ];
 const shown=rows.slice(0,8),extra=rows.length-shown.length;
 return {private:true,message:'Личные планы на '+label+':\n'+shown.map(x=>'• '+x).join('\n')+
  (extra?'\nЕщё записей: '+extra+'. Полный список — в календаре.':'')};
}
let scheduled=false;
function notify(){
 if(scheduled)return;
 scheduled=true;
 queueMicrotask(()=>{
  scheduled=false;
  // Metadata-only update; no personal records in CustomEvent detail.
  window.dispatchEvent(new Event('seyveo:life-events-changed'));
 });
}
for(const eventName of ['seyveo:calendar-changed','seyveo:tasks-changed','seyveo:spaces-changed'])
 window.addEventListener(eventName,notify);
window.addEventListener('storage',event=>{if(!event.key||KEYS.has(event.key))notify()});
window.SEYVEO_LIFE_EVENTS=Object.freeze({day,attentionTasks,upcomingTasks,upcomingEvents,relatedPreparation,answer});
})();