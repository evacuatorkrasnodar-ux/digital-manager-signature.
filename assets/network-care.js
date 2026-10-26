/* SEYVEO · Network Care. One real preference; no mock VPN actions.
 * navigator.onLine is only a local OS signal, never proof of web access. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=$('seyveoNetworkPage'),toggle=$('seyveoNetworkMode');
const status=$('seyveoNetworkStatus'),device=$('seyveoNetworkDevice');
if(!root||!toggle||!status||!device)return;
const KEY='seyveo-network-care-preference-v1';
const ua=navigator.userAgent||'';
const platform=/android/i.test(ua)?'android':
 (/iphone|ipad|ipod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))?'ios':'desktop';
const names={ios:'iPhone / iPad',android:'Android',desktop:'Компьютер'};
let preference='ask';
try{preference=localStorage.getItem(KEY)==='off'?'off':'ask'}catch{}
function refresh(){
 device.textContent=names[platform];
 status.textContent=navigator.onLine?'Сигнал сети есть':'Нет сигнала сети';
 status.dataset.networkState=navigator.onLine?'online':'offline';
 toggle.checked=preference==='ask';
}
toggle.addEventListener('change',()=>{
 preference=toggle.checked?'ask':'off';
 try{localStorage.setItem(KEY,preference)}catch{}
 refresh();
});
window.addEventListener('online',refresh);
window.addEventListener('offline',refresh);
window.SEYVEO_NETWORK_CARE=Object.freeze({
 refresh,
 state:()=>Object.freeze({platform,preference,canStartVPN:false,localConnectionSignal:navigator.onLine})
});
refresh();
})();