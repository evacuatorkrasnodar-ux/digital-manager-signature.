/* SEYVEO push readiness (v1).
 * Registers a network-only service worker. No subscriptions, permissions, or
 * personal calendar uploads until an authenticated push backend is deployed. */
(function(){
'use strict';
const check=document.getElementById('calendarPushCheck');
const result=document.getElementById('calendarPushCheckResult');
if(!check||!result)return;
const isIos=/iPhone|iPad|iPod/i.test(navigator.userAgent)||
 (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let registration=null,registrationError=null;
const canRegister='serviceWorker' in navigator&&window.isSecureContext;
async function ensureWorker(){
 if(!canRegister)throw new Error('unsupported');
 if(registration)return registration;
 registration=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
 return registration;
}
if(canRegister){
 window.addEventListener('load',()=>{
  ensureWorker().catch(error=>{registrationError=error});
 },{once:true});
}
function show(message){
 result.textContent=message;
 result.hidden=false;
}
async function checkSupport(){
 check.disabled=true;
 try{
  if(!window.isSecureContext){show('Для Web Push требуется защищённое HTTPS-соединение.');return}
  if(!('serviceWorker' in navigator)){show('Этот браузер не поддерживает необходимый сервис уведомлений.');return}
  try{await ensureWorker()}
  catch{show('Не удалось подготовить сервис уведомлений. Проверьте подключение к интернету и обновите SEYVEO.');return}
  if(isIos&&!standalone()){
   show('Для фоновых уведомлений на iPhone открой SEYVEO с экрана «Домой», а не из вкладки браузера.');
   return;
  }
  if(!('PushManager' in window)||!('Notification' in window)){
   show('На этом устройстве Web Push недоступен. Обычные напоминания внутри открытого календаря работают.');
   return;
  }
  if(Notification.permission==='denied'){
   show('Уведомления запрещены в настройках устройства. Сервер доставки SEYVEO пока не подключён.');
   return;
  }
  // Permission stays unchanged: users should not grant it before actual delivery exists.
  show('Устройство готово к Web Push. Для фоновых напоминаний осталось подключить защищённый сервер доставки SEYVEO. Пока они не приходят.');
 }finally{
  check.disabled=false;
 }
}
check.addEventListener('click',()=>{checkSupport().catch(()=>{
 check.disabled=false;show('Не получилось проверить уведомления. Попробуйте обновить приложение.');
})});
})();