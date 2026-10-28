/* SEYVEO · Work hub. The original team messenger and task list live
 * on the SAME Tasks page. Move DOM nodes (never clone) to preserve listeners,
 * local message history and recognitions. No cross-phone delivery in demo.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const page=$('tasksPage'),personal=$('unifiedPersonalTasksView'),
  business=$('unifiedBusinessTasksView'),board=$('unifiedTasksTeamBoard'),
  taskHost=$('unifiedBusinessTasksHost'),chatHost=$('unifiedTasksChatHost'),
  tasks=$('svcpTasks'),chats=$('svcpChats'),overview=$('tasksOverview');
 if(!page||!personal||!business||!board||!taskHost||!chatHost||!tasks||!chats)return;
 taskHost.appendChild(tasks);
 tasks.hidden=false;
 chatHost.appendChild(chats);
 chats.hidden=false;
 let exitTarget='home',pending=null,lastWorkView='personal',employeePreview=false;
 const pulseTab=page.querySelector('[data-unified-tasks-tab="pulse"]');
 const pictureTabs=$('pulseTasksTabs');
 function updatePulseAccess(){
  if(pulseTab)pulseTab.hidden=employeePreview;
  if(pictureTabs)pictureTabs.hidden=employeePreview;
  if(employeePreview&&location.hash==='#picture')navigate('team');
 }
 function openPulse(options={}){
  if(employeePreview)return;
  if(location.hash==='#tasks'){
   const active=page.querySelector('[data-unified-tasks-tab="business"][aria-pressed="true"]');
   lastWorkView=active?'business':'personal';
  }
  if(options?.efficiency)$('pictureEfficiency')?.setAttribute('open','');
  if(location.hash!=='#picture')location.hash='#picture';
  else window.dispatchEvent(new Event('seyveo:picture-open'));
 }
 function returnFromPulse(){navigate(lastWorkView==='business'?'team':'personal')}
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
 function showBoard(){
  board.hidden=false;chatHost.hidden=false;chats.hidden=false;
  window.SEYVEO_BUSINESS_COMMAND?.showChat?.();
 }
 function select(view){
  if(view==='pulse'){openPulse();return}
  const team=view==='business';
  lastWorkView=team?'business':'personal';
  personal.hidden=team;business.hidden=!team;
  if(overview)overview.hidden=team;
  if(team)showBoard();
  page.querySelectorAll('[data-unified-tasks-tab]').forEach(button=>
   button.setAttribute('aria-pressed',String(button.dataset.unifiedTasksTab===(team?'business':'personal'))));
 }
 function showChat(roomId,viewpoint,filter){
  lastWorkView='business';
  personal.hidden=true;business.hidden=false;
  if(overview)overview.hidden=true;
  board.hidden=false;chatHost.hidden=false;chats.hidden=false;
  page.querySelectorAll('[data-unified-tasks-tab]').forEach(button=>
   button.setAttribute('aria-pressed',String(button.dataset.unifiedTasksTab==='business')));
  window.SEYVEO_BUSINESS_COMMAND?.showChat?.(roomId||null,viewpoint||'manager',filter||'all');
 }
 function routePending(){
  const request=pending;pending=null;
  if(request?.kind==='chat')showChat(request.roomId,request.viewpoint,request.filter);
  else if(request?.kind==='team')select('business');
  else select('personal');
 }
 function navigate(kind,roomId,viewpoint,filter){
  pending={kind,roomId:roomId||null,viewpoint:viewpoint||'manager',filter:filter||'all'};
  if(location.hash!=='#tasks')location.hash='#tasks';
  else routePending();
 }
 function openBusiness(source='manage'){
  if(source!=='preserve')exitTarget=source==='home'?'home':'manage';
  syncBack();navigate('team');
 }
 function openChat(source='tasks',roomId=null,viewpoint='manager',filter='all'){
  if(source==='manage')exitTarget='manage';
  else if(source==='home')exitTarget='home';
  syncBack();navigate('chat',roomId,viewpoint,filter);
 }
 function openPersonal(){
  exitTarget='home';syncBack();navigate('personal');
 }
 page.querySelectorAll('[data-unified-tasks-tab]').forEach(button=>
  button.addEventListener('click',()=>{
   pending=null;select(button.dataset.unifiedTasksTab);
  }));
 pictureTabs?.querySelectorAll('[data-pulse-tasks-tab]').forEach(button=>
  button.addEventListener('click',()=>{
   if(button.dataset.pulseTasksTab==='personal')openPersonal();
   else if(button.dataset.pulseTasksTab==='business')openBusiness('preserve');
  }));
 window.addEventListener('seyveo:work-role-preview',event=>{
  employeePreview=event.detail?.role==='employee';
  updatePulseAccess();
 });
 $('navTasks')?.addEventListener('click',openPersonal);
 window.addEventListener('hashchange',()=>{
  if(location.hash==='#tasks')routePending();
  else{
   pending=null;
   if(location.hash==='#picture'&&employeePreview)navigate('team');
  }
 });
 window.SEYVEO_UNIFIED_TASKS=Object.freeze({openBusiness,openPersonal,openChat,openPulse,returnFromPulse});
 syncBack();select('personal');updatePulseAccess();
})();
