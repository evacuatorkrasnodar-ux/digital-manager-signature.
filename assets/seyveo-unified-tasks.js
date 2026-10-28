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
 let exitTarget='home',pending=null;
 const CHAT_KEY='seyveo-business-command-chat-demo-v1';
 const chatNames={general:'Общий чат',team:'Смена и команда',docs:'Обсуждение документов',
  'dm-elena':'Елена · кассир','dm-anna':'Анна · старший продавец',
  'dm-mikhail':'Михаил · продавец','dm-sayvi':'Сэйви'};
 function syncChatPreview(){
  const label=$('svcpTasksChatSummary');if(!label)return;
  let messages=[];
  try{const rows=JSON.parse(localStorage.getItem(CHAT_KEY)||'[]');
   if(Array.isArray(rows))messages=rows;
  }catch{}
  const last=messages.filter(m=>m&&chatNames[m.room]&&typeof m.text==='string'&&m.text.trim()).slice(-1)[0];
  label.textContent=last
   ?chatNames[last.room]+': '+last.text.replace(/\s+/g,' ').slice(0,63)
   :'Общий чат · Лично сотруднику · Сэйви';
 }
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
  board.hidden=false;chatHost.hidden=true;syncChatPreview();
 }
 function select(view){
  const team=view==='business';
  personal.hidden=team;business.hidden=!team;
  if(overview)overview.hidden=team;
  if(team)showBoard();
  page.querySelectorAll('[data-unified-tasks-tab]').forEach(button=>
   button.setAttribute('aria-pressed',String(button.dataset.unifiedTasksTab===(team?'business':'personal'))));
 }
 function showChat(roomId,viewpoint,filter){
  personal.hidden=true;business.hidden=false;
  if(overview)overview.hidden=true;
  board.hidden=true;chatHost.hidden=false;chats.hidden=false;
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
 $('svcpTasksChatShortcut')?.addEventListener('click',()=>openChat('tasks','general'));
 $('svcpTasksPersonalShortcut')?.addEventListener('click',()=>openChat('tasks',null,'manager','personal'));
 $('navTasks')?.addEventListener('click',openPersonal);
 window.addEventListener('hashchange',()=>{
  if(location.hash==='#tasks')routePending();
  else pending=null;
 });
 window.addEventListener('storage',event=>{if(event.key===CHAT_KEY)syncChatPreview()});
 window.addEventListener('pageshow',syncChatPreview);
 window.SEYVEO_UNIFIED_TASKS=Object.freeze({openBusiness,openPersonal,openChat});
 syncChatPreview();syncBack();select('personal');
})();
