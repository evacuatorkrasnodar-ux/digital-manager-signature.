/* SEYVEO · Meaningful shortcuts around the existing sphere.
   Delegates to existing features. No fake calendar, analytics or external data. */
(()=>{
  'use strict';
  const cluster=document.getElementById('orbShortcuts');
  if(!cluster)return;
  const actions=Object.freeze({
    calendar:'personalAddHome',   // existing local task form with due-date field
    tasks:'navTasks',             // existing task screen
    activity:'showHistory',       // existing history of demo assignments
    notes:'viewNotes'             // existing notes modal; no fabricated documents
  });
  cluster.addEventListener('click',event=>{
    const button=event.target.closest('button[data-orb-action]');
    if(!button||!cluster.contains(button))return;
    const targetId=actions[button.dataset.orbAction];
    if(!targetId)return;
    const target=document.getElementById(targetId);
    if(!target||target.disabled)return;
    target.click();
  });
})();
