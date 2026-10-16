/* SEYVEO · Power saving: explicit local choice, no device assumptions.
   Loaded before the inline app so even the startup brand respects it. */
(()=>{
  'use strict';
  const key='seyveo-power-saving-v1';
  const root=document.documentElement;
  const toggle=document.getElementById('seyveoBatterySaverToggle');
  const label=document.getElementById('seyveoBatterySaverState');
  let saveBattery=false;
  try{saveBattery=localStorage.getItem(key)==='on'}catch{}
  function render(){
    root.dataset.seyveoEffects=saveBattery?'off':'on';
    if(toggle){
      toggle.setAttribute('aria-pressed',String(saveBattery));
      toggle.setAttribute('aria-label','Экономия батареи: '+(saveBattery?'включена':'выключена'));
    }
    if(label)label.textContent=saveBattery?'Вкл.':'Выкл.';
  }
  render();
  toggle?.addEventListener('click',()=>{
    saveBattery=!saveBattery;
    try{localStorage.setItem(key,saveBattery?'on':'off')}catch{}
    render();
    // App stops active decorative timers if the setting is switched on.
    document.dispatchEvent(new CustomEvent('seyveo:effects-change',{detail:{enabled:!saveBattery}}));
  });
})();
