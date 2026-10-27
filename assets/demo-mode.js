/* SEYVEO · explicit demonstration switch; opt-in for this browser tab only.
 * This never writes to user business records and never enables an external API.
 * Education state is discarded when switching off or closing the tab.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const toggle=$('openSeyveoDemoMode'),state=$('seyveoDemoModeState');
const exit=$('pictureDemoExit'),label=$('pictureDemoLabel'),workspace=$('pictureDemoWorkspace');
if(!toggle||!state||!exit||!label||!workspace)return;
const KEY='seyveo-demo-session-v1';
let enabled=false;
try{enabled=sessionStorage.getItem(KEY)==='on'}catch{}
function sync(){
 toggle.setAttribute('aria-pressed',String(enabled));
 toggle.setAttribute('aria-label','Демо-режим: '+(enabled?'включён':'выключен'));
 state.textContent=enabled?'Вкл.':'Выкл.';
 workspace.hidden=!enabled;
 exit.hidden=!enabled;
 // The numeric illustration is controlled separately by Picture.
 if(!enabled)label.hidden=true;
 document.documentElement.dataset.seyveoDemo=enabled?'on':'off';
}
function setMode(value){
 const next=!!value;
 if(enabled===next)return;
 enabled=next;
 try{if(enabled)sessionStorage.setItem(KEY,'on');else sessionStorage.removeItem(KEY)}catch{}
 sync();
 if(!enabled)window.dispatchEvent(new Event('seyveo:demo-mode-reset'));
 window.dispatchEvent(new CustomEvent('seyveo:demo-mode-changed',{detail:{enabled}}));
}
toggle.addEventListener('click',()=>{
 const next=!enabled;
 setMode(next);
 if(next){location.hash='#picture'}
});
exit.addEventListener('click',()=>setMode(false));
window.SEYVEO_DEMO_MODE=Object.freeze({
 isEnabled:()=>enabled,
 setEnabled:setMode
});
sync();
})();
