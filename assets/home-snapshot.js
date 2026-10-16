/* SEYVEO · Home Snapshot v1. Truthful local state, no business metrics simulation. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const direction=$('homeDirection'),count=$('homeTaskCount'),hint=$('homeDirectionHint');
  if(!direction||!count||!hint)return;
  const pathButton=$('homePathStatus'),taskButton=$('homeTaskStatus'),servicesButton=$('homeServicesStatus');
  const profileKey='seyveo-first-acquaintance-v1',tasksKey='seyveo-personal-tasks-v1';
  const labels=Object.freeze({life:'Life',start:'Business Start',pro:'Business Pro',max:'Business Max'});
  function getJSON(key){
    try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}
    catch{return null}
  }
  function render(){
    const profile=getJSON(profileKey);
    const choice=profile&&labels[profile.focus]?profile.focus:null;
    direction.textContent=choice?labels[choice]:'Выбрать';
    hint.textContent=choice?'Мой SEYVEO':'Личное · бизнес';
    const all=getJSON(tasksKey);
    const pending=Array.isArray(all)?all.filter(x=>x&&typeof x.title==='string'&&x.done!==true).length:0;
    count.textContent=String(pending);
    count.setAttribute('aria-label',pending+' незавершённых личных дел');
  }
  pathButton.addEventListener('click',()=>{
    const open=$('openOnboarding');
    if(open)open.click();else location.hash='manage';
  });
  taskButton.addEventListener('click',()=>{location.hash='tasks'});
  servicesButton.addEventListener('click',()=>{
    const open=$('openManageConnections');
    if(open)open.click();else location.hash='manage';
  });
  window.addEventListener('seyveo:profile-changed',render);
  window.addEventListener('seyveo:tasks-changed',render);
  window.addEventListener('storage',e=>{if([profileKey,tasksKey].includes(e.key))render()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
  render();
})();