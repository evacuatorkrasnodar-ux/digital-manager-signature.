/* SEYVEO Silk Touch: four real orb shortcuts.
   Shares the app's Velvet Touch sound + haptic engine, never duplicates it. */
(()=>{
  'use strict';
  const cluster=document.getElementById('orbShortcuts');
  if(!cluster)return;
  const actions=Object.freeze({
    calendar:'personalAddHome', // local task with due-date field
    notes:'viewNotes'           // locally saved notes
  });

  /* Local sound preference; also honors immediate changes in private mode. */
  const SOUND_KEY='seyveo-silk-touch-sound-v1';
  const root=document.documentElement;
  const toggle=document.getElementById('seyveoSilkSoundToggle');
  const label=document.getElementById('seyveoSilkSoundState');
  let soundEnabled=true;
  try{soundEnabled=localStorage.getItem(SOUND_KEY)!=='off'}catch{}
  function renderSound(){
    root.dataset.silkSound=soundEnabled?'on':'off';
    if(toggle){
      toggle.setAttribute('aria-pressed',String(soundEnabled));
      toggle.setAttribute('aria-label','Звук касаний: '+(soundEnabled?'включён':'выключен'));
    }
    if(label)label.textContent=soundEnabled?'Вкл.':'Выкл.';
  }
  renderSound();
  toggle?.addEventListener('click',()=>{
    soundEnabled=!soundEnabled;
    try{localStorage.setItem(SOUND_KEY,soundEnabled?'on':'off')}catch{}
    renderSound();
    // User explicitly enabling sound gets one soft test click.
    if(soundEnabled)document.dispatchEvent(new Event('seyveo:silk-touch'));
  });

  const timers=new WeakMap();
  function press(button){
    const old=timers.get(button);
    if(old)clearTimeout(old);
    button.classList.add('is-silk-touched');
    timers.set(button,setTimeout(()=>{
      button.classList.remove('is-silk-touched');
      timers.delete(button);
    },160));
  }
  function findButton(event){
    const button=event.target.closest('button[data-orb-action]');
    return button&&cluster.contains(button)?button:null;
  }
  cluster.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const button=findButton(event);
    if(button)press(button);
  });
  cluster.addEventListener('pointercancel',event=>{
    const button=findButton(event);
    if(!button)return;
    const old=timers.get(button);
    if(old)clearTimeout(old);
    timers.delete(button);
    button.classList.remove('is-silk-touched');
  });
  cluster.addEventListener('click',event=>{
    const button=findButton(event);
    if(!button||button.disabled)return;
    const action=button.dataset.orbAction;
    const id=actions[action];
    const target=id?document.getElementById(id):null;
    if(!target&&!['tasks','activity'].includes(action))return;
    if(target?.disabled)return;
    press(button);
    // Fires synchronously from the user's click; no duplicate audio engine.
    document.dispatchEvent(new Event('seyveo:silk-touch'));
    if(action==='tasks')window.dispatchEvent(new Event('seyveo:results-shortcut'));
    else if(action==='activity')window.dispatchEvent(new Event('seyveo:pulse-open'));
    else target.click();
  });
})();
