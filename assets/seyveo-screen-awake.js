/* SEYVEO · Screen Awake · explicit opt-in, no battery/charging inference.
 * Uses the platform Screen Wake Lock API while this document is visible.
 * Not an iOS background execution or a persistent system-setting override. */
(()=>{
'use strict';
const KEY='seyveo-screen-awake-opt-in-v1';
const $=id=>document.getElementById(id);
let wanted=false,lock=null,inFlight=null,revision=0;
try{wanted=localStorage.getItem(KEY)==='on'}catch{}
const supported=()=>Boolean(window.isSecureContext&&navigator.wakeLock?.request);
const send=(state,message)=>{
 window.dispatchEvent(new CustomEvent('seyveo:screen-awake-state',{detail:{
  wanted,active:!!lock&&!lock.released,supported:supported(),state,message
 }}));
 syncUI();
};
function syncUI(){
 for(const button of document.querySelectorAll('[data-seyveo-screen-awake]')){
  button.setAttribute('aria-pressed',String(wanted));
  button.textContent=wanted?'Экран включён':'Не гасить экран';
  button.title=wanted?'Выключить удержание экрана':'Оставить экран включённым, пока SEYVEO открыт';
 }
 for(const node of document.querySelectorAll('[data-seyveo-screen-awake-status]')){
  node.textContent=!supported()?'В этом браузере удержание экрана недоступно.':
   lock&&!lock.released?'Экран не будет автоматически гаснуть, пока SEYVEO открыт.':
   wanted?'Ожидаю разрешения iOS. Проверь экран или нажми кнопку ещё раз.':
   'Работает только при открытом SEYVEO. Не заменяет зарядку и не запускает фоновые действия.';
 }
}
async function request(){
 if(!wanted)return false;
 if(document.visibilityState!=='visible'){send('paused','Страница скрыта');return false}
 if(!supported()){send('unsupported','Браузер не поддерживает удержание экрана');return false}
 if(lock&&!lock.released)return true;
 if(inFlight)return inFlight;
 const ticket=revision;
 inFlight=(async()=>{
  try{
   const sentinel=await navigator.wakeLock.request('screen');
   if(!wanted||ticket!==revision||document.visibilityState!=='visible'){
    await sentinel.release();
    return false;
   }
   lock=sentinel;
   sentinel.addEventListener('release',()=>{
    if(lock===sentinel)lock=null;
    send('released','iOS могла снять удержание экрана');
   });
   send('active','Экран включён, пока приложение видно');
   return true;
  }catch(error){
   send('denied',String(error?.name||'Отклонено системой'));
   return false;
  }
 })().finally(()=>{inFlight=null});
 return inFlight;
}
async function release(){
 revision++;
 const old=lock;lock=null;
 if(old&&!old.released){try{await old.release()}catch{}}
 send('off','Удержание экрана выключено');
}
function setEnabled(on){
 wanted=Boolean(on);
 try{localStorage.setItem(KEY,wanted?'on':'off')}catch{}
 if(wanted)return request();
 void release();return Promise.resolve(false);
}
function toggle(){return setEnabled(!wanted)}
function handle(raw){
 if(typeof raw!=='string'||raw.length>250)return null;
 const q=raw.toLocaleLowerCase('ru-RU').replace(/ё/g,'е')
  .replace(/^(?:сэйви|сэйва|сейви|сейва|сэй|сей)[,:!.\s]+/,'').trim();
 if(/^(?:не гаси экран|оставь экран включенным|держи экран включенным|включи удержание экрана|не выключай экран)(?:\s+пожалуйста)?[.!?]*$/.test(q)){
  void setEnabled(true);
  return {status:'requested',message:'Пробую удерживать экран включённым, пока SEYVEO открыт. iPhone может отклонить запрос или отключить его при блокировке.'};
 }
 if(/^(?:гаси экран|отключи удержание экрана|выключи удержание экрана|разреши экрану гаснуть)(?:\s+пожалуйста)?[.!?]*$/.test(q)){
  void setEnabled(false);
  return {status:'off',message:'Отключила удержание экрана.'};
 }
 return null;
}
document.addEventListener('click',event=>{
 const btn=event.target.closest?.('[data-seyveo-screen-awake]');
 if(!btn)return;
 event.preventDefault();void toggle();
});
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='visible'){if(wanted)void request()}
 else if(lock){const held=lock;lock=null;void held.release().catch(()=>{});send('paused','SEYVEO свернут')}
});
window.addEventListener('pagehide',()=>{if(lock){const held=lock;lock=null;void held.release().catch(()=>{})}});
window.addEventListener('pageshow',()=>{if(wanted)void request()});
window.SEYVEO_SCREEN_AWAKE=Object.freeze({
 enabled:()=>wanted,active:()=>!!lock&&!lock.released,
 supported,setEnabled,toggle,handle
});
syncUI();
if(wanted&&document.visibilityState==='visible')void request();
})();