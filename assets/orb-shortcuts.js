/* SEYVEO Silk Touch preference lives in Management > Application.
   The orb is intentionally solitary; there are no satellite controls. */
(()=>{
'use strict';
const SOUND_KEY='seyveo-silk-touch-sound-v1';
const root=document.documentElement;
const toggle=document.getElementById('seyveoSilkSoundToggle');
const label=document.getElementById('seyveoSilkSoundState');
let enabled=true;
try{enabled=localStorage.getItem(SOUND_KEY)!=='off'}catch{}
function render(){
 root.dataset.silkSound=enabled?'on':'off';
 if(toggle){
  toggle.setAttribute('aria-pressed',String(enabled));
  toggle.setAttribute('aria-label','Звук касаний: '+(enabled?'включён':'выключен'));
 }
 if(label)label.textContent=enabled?'Вкл.':'Выкл.';
}
render();
toggle?.addEventListener('click',()=>{
 enabled=!enabled;
 try{localStorage.setItem(SOUND_KEY,enabled?'on':'off')}catch{}
 render();
 if(enabled)document.dispatchEvent(new Event('seyveo:silk-touch'));
});
})();
