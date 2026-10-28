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
 const CHAT_KEY='seyveo-business-command-chat-demo-v1';
 const chatNames={general:'Общий чат',team:'Моя команда',docs:'Документы',
  'dm-elena':'Елена','dm-anna':'Анна','dm-mikhail':'Михаил','dm-sayvi':'Сэйви'};
 function syncChatPreview(){
  const label=$('svcpTasksChatSummary');if(!label)return;
  let messages=[];
  try{const value=JSON.parse(localStorage.getItem(CHAT_KEY)||'[]');
   if(Array.isArray(value))messages=value;
  }catch{}
  const latest=messages.filter(m=>m&&chatNames[m.room]&&typeof m.text==='string'&&m.text.trim()).slice(-1)[0];
  label.textContent=latest
   ?chatNames[latest.room]+': '+latest.text.replace(/\s+/g,' ').slice(0,65)
   :'Общий чат, личные сообщения и Сэйви · демо';
 }
 $('svcpTasksChatShortcut')?.addEventListener('click',()=>{
  window.SEYVEO_BUSINESS_NAV?.openChats?.(true);
 });
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
  if(team)syncChatPreview();
  page.querySelectorAll('[data-unified-tasks-tab]').forEach(button=>{
   const active=button.dataset.unifiedTasksTab===(team?'business':'personal');
   button.setAttribute('aria-pressed',String(active));
  });
 }
 function openBusiness(source='manage'){
  if(source!=='preserve')exitTarget=source==='home'?'home':'manage';
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
 window.addEventListener('storage',event=>{
  if(event.key===CHAT_KEY)syncChatPreview();
 });
 window.addEventListener('pageshow',syncChatPreview);
 window.SEYVEO_UNIFIED_TASKS=Object.freeze({openBusiness,openPersonal});
 syncChatPreview();
 syncBack();
 select('personal');
})();