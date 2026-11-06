/* The standalone Sayvi chat writes to the EXISTING SEYVEO Calendar store.
   Main Home keeps its own authoritative Calendar event listener. This fallback
   runs only when that listener is not present (standalone chat page).
   No second calendar, no push/background notification claims. */
(()=>{
'use strict';
const STORE='seyveo-calendar-events-v1',MAX=300;
const DATE=/^(\d{4})-(\d{2})-(\d{2})$/;
const TIME=/^([01]\d|2[0-3]):([0-5]\d)$/;
const validDate=text=>{
 const m=DATE.exec(String(text||''));if(!m)return false;
 const y=+m[1],mo=+m[2],d=+m[3],value=new Date(y,mo-1,d);
 return value.getFullYear()===y&&value.getMonth()+1===mo&&value.getDate()===d;
};
const cleanTitle=text=>String(text||'').trim().replace(/\s+/g,' ').slice(0,140);
const normalized=text=>cleanTitle(text).toLocaleLowerCase('ru-RU');
const read=()=>{
 try{
  const raw=JSON.parse(localStorage.getItem(STORE)||'[]');
  return Array.isArray(raw)?raw.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&validDate(x.date)).slice(-MAX):[];
 }catch{return []}
};
const write=rows=>{
 try{localStorage.setItem(STORE,JSON.stringify(rows));return true}catch{return false}
};
function fallback(plan){
 if(!plan||plan.status!=='ready')return {status:'invalid',message:'Недостаточно данных.'};
 const title=cleanTitle(plan.title),date=String(plan.date||''),time=String(plan.time||'');
 if(!title||!validDate(date)||!TIME.test(time))
  return {status:'clarify',message:'Уточни название, день и время напоминания.'};
 const due=new Date(date+'T'+time+':00');
 if(!Number.isFinite(due.getTime())||due.getTime()<=Date.now())
  return {status:'clarify',message:'Это время уже прошло. Уточни будущие дату и время.'};
 const rows=read(),existing=rows.find(x=>x.date===date&&x.time===time&&normalized(x.title)===normalized(title));
 if(existing){
  if(plan.remindAtStart===true&&existing.remind!==-1){
   const updated=rows.map(x=>x.id===existing.id?{...x,remind:-1,updatedAt:new Date().toISOString()}:x);
   if(!write(updated))return {status:'error',message:'Не удалось обновить запись.'};
   window.dispatchEvent(new Event('seyveo:calendar-changed'));
   return {status:'saved',message:'Включено напоминание для существующего события.'};
  }
  return {status:'already',message:'Такое событие уже есть в календаре.'};
 }
 if(rows.length>=MAX)return {status:'full',message:'В календаре уже 300 событий. Сначала освободи место.'};
 const near=rows.find(x=>{
  if(x.date!==date||!TIME.test(x.time||''))return false;
  const a=Number(x.time.slice(0,2))*60+Number(x.time.slice(3));
  const b=Number(time.slice(0,2))*60+Number(time.slice(3));
  return Math.abs(a-b)<60;
 });
 if(near)return {status:'clarify',message:'Рядом по времени уже стоит «'+cleanTitle(near.title)+'». Уточни другое время или проверь календарь.'};
 const now=new Date().toISOString();
 const entry={id:'calendar-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
  title,date,time,kind:'personal',duration:0,travel:0,
  remind:plan.remindAtStart===true?-1:0,note:'',createdAt:now,updatedAt:now};
 if(!write([...rows,entry]))return {status:'error',message:'Не удалось сохранить. Проверь память браузера.'};
 window.dispatchEvent(new Event('seyveo:calendar-changed'));
 return {status:'saved',message:'Событие добавлено в календарь.'};
}
window.addEventListener('seyveo:calendar-save-from-ask',e=>{
 const plan=e.detail;
 if(!plan||plan.result)return;
 plan.result=fallback(plan);
});
window.SEYVEO_CHAT_CALENDAR_BRIDGE=Object.freeze({read});
})();