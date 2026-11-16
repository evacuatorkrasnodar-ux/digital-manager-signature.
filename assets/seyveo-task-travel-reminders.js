/* SEYVEO · departure prompts while the app runs; no fake background push. */
(()=>{
 'use strict';
 const core=window.SEYVEO_TASK_TRAVEL_CORE;
 if(!core)return;
 const ENABLED='seyveo-travel-notify-enabled-v1';
 const tasksKey='seyveo-personal-tasks-v1';
 const firedPrefix='seyveo-travel-notified-v1:';
 const pending=new Set();
 function enabled(){try{return localStorage.getItem(ENABLED)==='yes'}catch{return false}}
 async function enable(){
  if(typeof Notification==='undefined'||!('requestPermission'in Notification))return {ok:false,reason:'unsupported'};
  const granted=Notification.permission==='granted'||(await Notification.requestPermission())==='granted';
  if(!granted)return {ok:false,reason:'denied'};
  try{localStorage.setItem(ENABLED,'yes')}catch{}
  check();return {ok:true};
 }
 function check(){
  if(!enabled()||typeof Notification==='undefined'||Notification.permission!=='granted')return;
  let entries=[];
  try{entries=JSON.parse(localStorage.getItem(tasksKey)||'[]');if(!Array.isArray(entries))return}catch{return}
  const now=Date.now();
  for(const task of entries.slice(-150)){
   if(!task||task.done||typeof task.title!=='string')continue;
   const plan=core.departure(task.due,task.time,task.travel);
   if(!plan||now<plan.at||now-plan.at>120000)continue;
   const token=firedPrefix+String(task.id||'').slice(0,80)+':'+plan.at;
   try{if(localStorage.getItem(token)==='yes'||pending.has(token))continue}catch{}
   pending.add(token);
   void(async()=>{
    try{
     const title='Сэйви · пора выходить';
     const options={body:task.title.slice(0,110)+' · дорога около '+task.travel.minutes+' мин',tag:'seyveo-travel-'+String(task.id||'').slice(0,80)};
     const reg=await navigator.serviceWorker?.getRegistration?.();
     if(reg?.showNotification)await reg.showNotification(title,options);
     else new Notification(title,options);
     localStorage.setItem(token,'yes');
    }catch{/* iOS may require a separately installed PWA and service-worker notifications. */}
    finally{pending.delete(token)}
   })();
  }
 }
 setInterval(check,60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
 window.addEventListener('focus',check);
 window.addEventListener('seyveo:future-committed',check);
 window.SEYVEO_TASK_TRAVEL_REMINDERS=Object.freeze({enable,enabled,check});
})();
