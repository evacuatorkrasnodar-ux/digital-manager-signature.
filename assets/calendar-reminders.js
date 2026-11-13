/* SEYVEO · In-app calendar reminders v2.
 * No background/push claims, no permission prompt, no app navigation without a tap.
 * Reminders are checked while open and on return to foreground; a short catch-up
 * window prevents silent loss after the browser throttles timers.
 * The calendar's existing localStorage event schema is read-only here. */
(()=>{
'use strict';
const KEY='seyveo-calendar-events-v1';
const SEEN='seyveo-calendar-reminders-seen-v1';
const TIME=/^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE=/^(\d{4})-(\d{2})-(\d{2})$/;
function reminderTime(item){
 if(!item||typeof item.id!=='string'||typeof item.title!=='string')return null;
 const d=DATE.exec(String(item.date||'')),t=TIME.exec(String(item.time||''));
 const lead=Number(item.remind);
 if(!d||!t||![-1,15,30,60].includes(lead))return null;
 const year=Number(d[1]),month=Number(d[2]),day=Number(d[3]);
 const hour=Number(t[1]),minute=Number(t[2]);
 const start=new Date(year,month-1,day,hour,minute);
 if(start.getFullYear()!==year||start.getMonth()!==month-1||start.getDate()!==day||
  start.getHours()!==hour||start.getMinutes()!==minute)return null;
 return start.getTime();
}
function reminderKey(item){
 return [item.id,item.date,item.time,item.remind,item.updatedAt||''].join('|');
}
function dueReminders(list,now=Date.now(),seen=new Set()){
 const timestamp=now instanceof Date?now.getTime():Number(now);
 if(!Number.isFinite(timestamp)||!Array.isArray(list))return [];
 const ready=[];
 for(const item of list.slice(-300)){
  const when=reminderTime(item);
  if(when===null||seen.has(reminderKey(item)))continue;
  const until=when-timestamp,lead=Number(item.remind);
  // -1 means at the exact event time. A short grace window covers iOS
  // timer throttling when the app becomes visible, not closed-app pushes.
  // On return from a suspended iPhone tab, deliver recently missed reminders.
  // Never flood the person with appointments from long ago.
  const grace=30*60000;
  if(lead===-1?(until>0||until<=-grace):(until<=-grace||until>lead*60000))continue;
  ready.push({item,when,until,key:reminderKey(item)});
 }
 return ready.sort((a,b)=>a.when-b.when||String(a.item.title).localeCompare(String(b.item.title),'ru'));
}
if(typeof module!=='undefined'&&module.exports){
 module.exports={reminderTime,reminderKey,dueReminders};
}
if(typeof document==='undefined'||typeof window==='undefined')return;
const seen=new Set();
// Keep one receipt per reminder across app reloads, but expire old receipts.
try{
 const saved=JSON.parse(localStorage.getItem(SEEN)||'[]');
 const fresh=Date.now()-14*86400000;
 if(Array.isArray(saved))saved.filter(x=>x&&typeof x.key==='string'&&Number(x.at)>=fresh)
  .slice(-250).forEach(x=>seen.add(x.key));
}catch{}
let panel=null,closeTimer=0,current=null;
function persist(){
 try{
  const now=Date.now(),fresh=now-14*86400000;
  const previous=JSON.parse(localStorage.getItem(SEEN)||'[]');
  const rows=Array.isArray(previous)?previous.filter(x=>x&&typeof x.key==='string'&&Number(x.at)>=fresh):[];
  const saved=new Map(rows.map(x=>[x.key,x.at]));
  for(const key of seen)saved.set(key,now);
  localStorage.setItem(SEEN,JSON.stringify([...saved].slice(-250).map(([key,at])=>({key,at}))));
 }catch{}
}
function events(){
 try{
  const source=JSON.parse(localStorage.getItem(KEY)||'[]');
  return Array.isArray(source)?source:[];
 }catch{return []}
}
function discreet(){
 try{return localStorage.getItem('seyveo-discreet-mode-v1')==='on'||window.SEYVEO_DISCREET_MODE===true}
 catch{return window.SEYVEO_DISCREET_MODE===true}
}
function canShow(){
 return !document.hidden&&!document.querySelector('dialog[open]')&&!window.SEYVEO_PREMIERE?.isActive?.();
}
function removePanel(){
 clearTimeout(closeTimer);closeTimer=0;
 if(panel){panel.remove();panel=null}
 current=null;
}
function close(){
 removePanel();
 setTimeout(check,150);
}
function updateText(){
 if(!panel||!current)return;
 const title=panel.querySelector('.seyveo-reminder-title');
 const copy=panel.querySelector('.seyveo-reminder-copy');
 const minutes=Math.max(0,Math.ceil((current.when-Date.now())/60000));
 const privateMode=discreet();
 title.textContent=privateMode?'Скоро запланированное событие':String(current.item.title).trim().slice(0,140);
 copy.textContent=(minutes>0?'Через '+minutes+' мин':'Сейчас')+' · '+(privateMode?'Откройте календарь, чтобы узнать подробности.':'Откройте календарь, если нужно изменить планы.');
}
function show(next){
 current=next;seen.add(next.key);persist();
 const host=document.createElement('section');panel=host;
 host.className='seyveo-reminder';
 host.setAttribute('role','status');host.setAttribute('aria-live','polite');
 const caption=document.createElement('span');caption.className='seyveo-reminder-caption';caption.textContent='SEYVEO · КАЛЕНДАРЬ';
 const title=document.createElement('strong');title.className='seyveo-reminder-title';
 const copy=document.createElement('p');copy.className='seyveo-reminder-copy';
 const controls=document.createElement('div');controls.className='seyveo-reminder-actions';
 const open=document.createElement('button');open.type='button';open.textContent='Календарь';open.setAttribute('aria-label','Открыть календарь');
 const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Понятно';dismiss.setAttribute('aria-label','Закрыть напоминание');
 open.addEventListener('click',()=>{
  const date=current?.item?.date;
  close();if(location.hash!=='#calendar')location.hash='#calendar';
  else window.dispatchEvent(new Event('seyveo:calendar-open'));
  if(date)window.dispatchEvent(new CustomEvent('seyveo:calendar-focus-date',{detail:{date}}));
 });
 dismiss.addEventListener('click',close);
 controls.append(open,dismiss);host.append(caption,title,copy,controls);
 document.body.append(host);updateText();
 // A short-lived toast was too easy to miss, especially for older users.
 closeTimer=setTimeout(close,45000);
}
function check(){
 if(!canShow()){if(panel)removePanel();return}
 if(panel){
  if(!events().some(x=>reminderKey(x)===current?.key)){removePanel();return}
  updateText();return;
 }
 const next=dueReminders(events(),Date.now(),seen)[0];
 if(next)show(next);
}
window.addEventListener('seyveo:calendar-changed',check);
window.addEventListener('storage',event=>{if(event.key===KEY||event.key==='seyveo-discreet-mode-v1')check()});
window.addEventListener('focus',check);
document.addEventListener('visibilitychange',check);
window.setInterval(check,15000);
setTimeout(check,1100);
})();