/* SEYVEO · Unified Tasks.
 * Both entry points (dock and Business / Assignments) lead to ONE screen.
 * Existing personal and corporate-demo storage/handlers remain untouched.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const page=$('tasksPage');
 const personal=$('unifiedPersonalTasksView');
 const business=$('unifiedBusinessTasksView');
 const host=$('unifiedBusinessTasksHost');
 const existing=$('svcpTasks');
 const overview=$('tasksOverview');
 if(!page||!personal||!business||!host||!existing)return;

 // Move the original Business tasks DOM, not a copy. Its local task records
 // and input, completion and delete listeners continue working unchanged.
 host.appendChild(existing);
 existing.hidden=false;

 let nextBusinessRoute=false,exitTarget='home';
 function syncBack(){
  const label=$('unifiedTasksBackLabel');
  if(label)label.textContent=exitTarget==='manage'?'В бизнес':'На Главную';
 }
 $('unifiedTasksBack')?.addEventListener('click',()=>{
  if(exitTarget==='manage'){
   window.SEYVEO_BUSINESS_NAV?.returnToMenu?.();
   if(location.hash!=='#manage')location.hash='#manage';
  }else $('navHome')?.click();
 });
 function select(view){
  const team=view==='business';
  personal.hidden=team;
  business.hidden=!team;
  if(overview)overview.hidden=team;
  page.querySelectorAll('[data-unified-tasks-tab]').forEach(button=>{
   const active=button.dataset.unifiedTasksTab===(team?'business':'personal');
   button.setAttribute('aria-pressed',String(active));
  });
 }
 function openBusiness(source='manage'){
  exitTarget=source==='home'?'home':'manage';
  syncBack();
  nextBusinessRoute=true;
  select('business');
  if(location.hash!=='#tasks')location.hash='#tasks';
  else nextBusinessRoute=false;
 }
 function openPersonal(){
  exitTarget='home';
  syncBack();
  nextBusinessRoute=false;
  select('personal');
  if(location.hash!=='#tasks')location.hash='#tasks';
 }
 page.querySelectorAll('[data-unified-tasks-tab]').forEach(button=>
  button.addEventListener('click',()=>select(button.dataset.unifiedTasksTab)));
 $('navTasks')?.addEventListener('click',openPersonal);
 window.addEventListener('hashchange',()=>{
  if(location.hash==='#tasks'){
   if(nextBusinessRoute){nextBusinessRoute=false;select('business');}
   else select('personal');
  }else{
   nextBusinessRoute=false;
  }
 });
 window.SEYVEO_UNIFIED_TASKS=Object.freeze({openBusiness,openPersonal});
 syncBack();
 select('personal');
})();