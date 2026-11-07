/* SEYVEO · one permanent work navigation DOM node.
   Legacy pages keep their nodes and handlers; their old visual bars are hidden.
   The shared shell is not rebuilt when route or work mode changes. */
(()=>{
 'use strict';
 const tasks=document.getElementById('tasksPage');
 const calendar=document.getElementById('calendarPage');
 const oldTasks=document.getElementById('unifiedTasksTabs');
 const oldCalendar=document.getElementById('managerCalendarTabs');
 if(!tasks||!calendar||!oldTasks||!oldCalendar||document.getElementById('svWorkShell'))return;
 const app=calendar.parentElement;
 if(!app||tasks.parentElement!==app)return;
 const shell=document.createElement('section');
 shell.id='svWorkShell';
 shell.setAttribute('aria-label','Дела и календарь');
 app.insertBefore(shell,calendar);
 shell.append(calendar,tasks);
 const nav=document.createElement('nav');
 nav.id='svWorkTabs';
 nav.setAttribute('aria-label','Мои дела, календарь и кабинет');
 const choices=[['personal','Мои дела'],['calendar','Календарь'],['business','Кабинет']];
 for(const [id,label] of choices){
  const button=document.createElement('button');
  button.type='button';
  button.dataset.svWorkTab=id;
  button.textContent=label;
  button.setAttribute('aria-pressed','false');
  nav.append(button);
 }
 shell.prepend(nav);
 const oldTab=(parent,attribute,name)=>parent.querySelector('['+attribute+'="'+name+'"]');
 function activeSection(){
  if(!calendar.hidden)return 'calendar';
  return tasks.dataset.workView==='business'?'business':'personal';
 }
 function sync(){
  const active=activeSection();
  const managerTasks=!tasks.hidden&&oldTasks.dataset.manager==='true';
  const managerCal=!calendar.hidden&&!oldCalendar.hidden;
  const visible=managerTasks||managerCal;
  nav.hidden=!visible;
  shell.dataset.active=active;
  for(const button of nav.querySelectorAll('button')){
   button.setAttribute('aria-pressed',String(button.dataset.svWorkTab===active));
  }
 }
 nav.addEventListener('click',event=>{
  const button=event.target.closest('[data-sv-work-tab]');
  if(!button||nav.hidden)return;
  const target=button.dataset.svWorkTab;
  if(target===activeSection())return;
  const fromCalendar=!calendar.hidden;
  const original=fromCalendar
   ?oldTab(oldCalendar,'data-manager-calendar-tab',target)
   :oldTab(oldTasks,'data-unified-tasks-tab',target);
  if(original&&!original.disabled)original.click();
  requestAnimationFrame(sync);
 });
 const observer=new MutationObserver(sync);
 observer.observe(tasks,{attributes:true,attributeFilter:['hidden','data-work-view']});
 observer.observe(calendar,{attributes:true,attributeFilter:['hidden']});
 observer.observe(oldTasks,{attributes:true,attributeFilter:['data-manager']});
 observer.observe(oldCalendar,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('hashchange',()=>requestAnimationFrame(sync));
 window.addEventListener('seyveo:route-changed',()=>requestAnimationFrame(sync));
 sync();
 window.SEYVEO_WORK_SHELL=Object.freeze({version:1,sync});
})();