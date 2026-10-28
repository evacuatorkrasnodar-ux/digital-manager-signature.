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
  tasks=$('svcpTasks'),chats=$('svcpChats'),overview=$('tasksOverview'),
  people=$('svcpTeam'),peopleHost=$('unifiedPeopleHost'),staffReveal=$('svcpManagerPeople');
 if(!page||!personal||!business||!board||!taskHost||!chatHost||!tasks||!chats)return;
 taskHost.appendChild(tasks);
 tasks.hidden=false;
 chatHost.appendChild(chats);
 chats.hidden=false;
 if(people&&peopleHost){peopleHost.appendChild(people);people.hidden=false}
 let exitTarget='home',pending=null,lastWorkView='personal',employeePreview=false;
 const businessTab=page.querySelector('[data-unified-tasks-tab="business"]');
 function updatePulseAccess(){
  // Only demo perspective, not a security or role authorization system.
  if(businessTab)businessTab.hidden=employeePreview;
  if(employeePreview&&location.hash==='#picture')navigate('personal');
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
 function returnFromPulse(){navigate('team')}
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
  updateManagerSummary();
  window.SEYVEO_BUSINESS_COMMAND?.showChat?.();
 }
 function select(view){
  if(view==='pulse'){openPulse();return}
  if(view==='business'&&employeePreview)return;
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
 const businessActions=page.querySelector('.svcp-manager-actions');
 businessActions?.addEventListener('click',event=>{
  const button=event.target.closest('[data-business-hub]');
  if(!button||employeePreview)return;
  const kind=button.dataset.businessHub;
  if(kind==='pulse')openPulse();
  if(kind==='mail')window.SEYVEO_SAYVI_SURFACES?.open?.('mail','business');
  if(kind==='documents')window.SEYVEO_SAYVI_SURFACES?.open?.('contract','business');
  if(kind==='company')window.SEYVEO_COMPANY_PASSPORT?.open?.();
 });
 function openPeople(kind='team'){
  if(employeePreview)return;
  openBusiness('preserve');
  if(staffReveal)staffReveal.open=true;
  window.SEYVEO_BUSINESS_COMMAND?.openPeopleView?.(kind);
 }
 const TASK_KEY='seyveo-business-command-tasks-demo-v1';
 function updateManagerSummary(){
  const summary=$('svcpManagerStatus');if(!summary)return;
  try{
   const rows=JSON.parse(localStorage.getItem(TASK_KEY)||'[]');
   const count=Array.isArray(rows)?rows.filter(r=>r&&typeof r.text==='string'&&!r.done).length:0;
   summary.textContent=count?('Активных поручений: '+count+' · локальные данные'):'Новых поручений нет · данные на устройстве';
  }catch{summary.textContent='Поручения · данные только на устройстве'}
 }
 staffReveal?.addEventListener('toggle',()=>{
  if(staffReveal.open)window.SEYVEO_BUSINESS_COMMAND?.openPeopleView?.('team');
 });
 window.addEventListener('seyveo:manager-tasks-updated',updateManagerSummary);
 window.addEventListener('storage',event=>{if(event.key===TASK_KEY)updateManagerSummary()});
 window.addEventListener('pageshow',updateManagerSummary);
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
 window.SEYVEO_UNIFIED_TASKS=Object.freeze({openBusiness,openPersonal,openChat,openPulse,returnFromPulse,openPeople});
 syncBack();select('personal');updatePulseAccess();
})();
