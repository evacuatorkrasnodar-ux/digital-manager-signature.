/* SEYVEO · Network Care v1
 * Interactive PWA settings only: NO native VPN, network interception, proxy,
 * secrets, background probes or claims of access to blocked destinations.
 * Future native bridge must report VERIFIED operating-system VPN state. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const page=$('seyveoNetworkPage');
if(!page)return;
const modeText=$('seyveoNetworkModeText');
const mode=$('seyveoNetworkMode');
const status=$('seyveoNetworkStatus');
const device=$('seyveoNetworkDevice');
const detail=$('seyveoNetworkDetail');
const check=$('seyveoNetworkCheck');
const demonstration=$('seyveoNetworkDemo');
const sayvi=$('seyveoNetworkSayvi');
if(!mode||!status||!device||!detail||!check||!demonstration||!sayvi)return;
const KEY='seyveo-network-care-preference-v1';
const ALLOWED=new Set(['ask','off']);
const ua=navigator.userAgent||'';
const platform=/android/i.test(ua)?'android':
 (/iphone|ipad|ipod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))?'ios':'desktop';
const labels={
 ios:'iPhone / iPad · веб-приложение',
 android:'Android · веб-приложение',
 desktop:'Компьютер · веб-приложение'
};
const explanations={
 ios:'Для настоящего VPN потребуется нативная версия SEYVEO с разрешением iOS. Запускать системный VPN из этой PWA нельзя.',
 android:'Для настоящего VPN потребуется приложение Android с VpnService и системным согласием. Веб-версия не управляет VPN.',
 desktop:'Сейчас работает PWA. Защищённый туннель потребует отдельного нативного компонента и разрешения пользователя.'
};
function load(){
 try{const stored=localStorage.getItem(KEY);return ALLOWED.has(stored)?stored:'ask'}
 catch{return 'ask'}
}
let preference=load();
function refresh(){
 const online=navigator.onLine;
 device.textContent=labels[platform];
 status.textContent=online?'Сеть устройства: подключена':'Сеть устройства: нет соединения';
 status.dataset.networkState=online?'online':'offline';
 // navigator.onLine tells nothing about any particular website or VPN.
 detail.textContent=online
  ?'Это сигнал устройства, а не проверка YouTube, Telegram или доступности какого-либо сайта.'
  :'Система сообщает об отсутствии соединения. Доступность отдельных сервисов сейчас не проверялась.';
 modeText.textContent=preference==='ask'
  ?'Сэйви предложит помощь, если заметит проблему в будущем нативном приложении.'
  :'Сэйви не будет предлагать помощь с доступом.';
 for(const b of mode.querySelectorAll('[data-network-preference]')){
  const pressed=b.dataset.networkPreference===preference;
  b.setAttribute('aria-pressed',String(pressed));
  b.classList.toggle('sv-network-selected',pressed);
 }
 if(preference==='off')sayvi.hidden=true;
}
function setPreference(p){
 if(!ALLOWED.has(p))return;
 preference=p;
 try{localStorage.setItem(KEY,p)}catch{}
 refresh();
}
mode.addEventListener('click',event=>{
 const b=event.target.closest('[data-network-preference]');
 if(!b||!mode.contains(b))return;
 setPreference(b.dataset.networkPreference);
});
check.addEventListener('click',()=>{
 refresh();
 sayvi.hidden=false;
 sayvi.textContent=navigator.onLine
  ?'Сэйви: устройство подключено к сети. Но я пока не умею определять, открывается ли конкретный видеосервис, и не включаю VPN.'
  :'Сэйви: устройство сообщает, что сети нет. Сначала проверим интернет. VPN сам по себе не исправляет отсутствие связи.';
});
demonstration.addEventListener('click',()=>{
 sayvi.hidden=false;
 sayvi.textContent=preference==='off'
  ?'Сэйви: вы отключили предложения помощи с доступом. Настройки можно изменить в любой момент.'
  :'Сэйви: похоже, нужный сервис недоступен. Когда у меня появится нативный защищённый доступ, я сначала объясню, зачем он нужен, и попрошу разрешение. Сейчас подключить VPN из PWA я не могу.';
});
window.addEventListener('online',refresh);
window.addEventListener('offline',refresh);
window.SEYVEO_NETWORK_CARE=Object.freeze({
 refresh,
 state:()=>Object.freeze({
  platform,preference,canStartVPN:false,
  localConnectionSignal:navigator.onLine
 })
});
refresh();
})();