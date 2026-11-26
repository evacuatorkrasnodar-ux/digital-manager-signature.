import './seyveo-history-recovery.mjs';
/* History belongs in Дела > Мои дела. No floating launch control. */
const personal=document.getElementById('unifiedPersonalTasksView');
const head=personal?.querySelector('.personal-tasks-head');
if(personal&&head){
 const style=document.createElement('style');
 style.textContent=`
/* History is a dedicated Tasks subview, not content appended beneath active work. */
/* Nested History has no main dock; exiting it restores the dock automatically. */
html.sah-history-no-dock body footer.dock.sv-shared-dock{
 display:none!important;
}
html.sah-history-no-dock #seyveoActionHistoryPanel{
 padding-bottom:calc(26px + env(safe-area-inset-bottom,0px))!important;
}

.sah-inline-toggle{
 display:inline-flex;align-items:center;justify-content:center;gap:7px;
 margin-left:auto;min-height:44px;padding:8px 9px;
 border:0;border-radius:12px;background:transparent;
 color:var(--secondary);font:inherit;font-size:12.5px;font-weight:520;
 cursor:pointer;touch-action:manipulation;
}
.sah-inline-toggle[aria-expanded="true"]{color:var(--text)}
/* Keep the History entry visible beside Add on the ordinary My Tasks header. */
#unifiedPersonalTasksView .personal-tasks-head{display:flex;align-items:center;gap:8px;min-width:0}
#unifiedPersonalTasksView .personal-tasks-head .sah-inline-toggle{
 display:grid!important;place-items:center!important;
 visibility:visible!important;opacity:1!important;
 box-sizing:border-box!important;
 flex:0 0 44px!important;margin-left:auto!important;
 width:44px!important;min-width:44px!important;max-width:44px!important;
 height:44px!important;min-height:44px!important;max-height:44px!important;
 padding:0!important;border:0!important;border-radius:50%!important;
 background:transparent!important;background-image:none!important;
 color:var(--text)!important;box-shadow:none!important;
 -webkit-backdrop-filter:none!important;backdrop-filter:none!important;
}
#unifiedPersonalTasksView .personal-tasks-head .sah-inline-toggle svg{
 display:block!important;width:20px!important;height:20px!important;
 fill:none!important;stroke:currentColor!important;stroke-width:1.65!important;
 stroke-linecap:round!important;stroke-linejoin:round!important;
}
#unifiedPersonalTasksView .personal-tasks-head .sah-inline-toggle:active{
 opacity:.6!important;
}
/* Only the persistent Work titlebar is visible in the History subview.
   Keeping this second header mounted preserves its existing back/search listeners. */
#svWorkShell #tasksPage.sah-history-open #seyveoActionHistoryPanel .sah-inline-head{
 display:none!important;
}
#seyveoActionHistoryPanel .sah-restore-task{
 display:inline-flex!important;visibility:visible!important;opacity:1!important;
 flex-shrink:0!important;position:relative!important;z-index:1!important;
}
#seyveoActionHistoryPanel .sah-restore-task:active{background:#38383A!important}
#seyveoActionHistoryPanel .sah-history-search[aria-expanded="true"]{
 background:#49494B!important;
}
.sah-inline-toggle svg{
 display:block;flex:none;width:16px;height:16px;fill:none;
 stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;
}
.sah-inline-toggle:focus-visible,
.sah-inline-head button:focus-visible,.sah-search:focus-visible{
 outline:2px solid var(--text);outline-offset:2px
}
/* When history is open, only its dedicated view occupies Tasks.
   The original task list stays mounted, preserving its data and handlers. */
#tasksPage.sah-history-open > :not(#unifiedPersonalTasksView){display:none!important}
#tasksPage.sah-history-open > #unifiedPersonalTasksView > :not(#seyveoActionHistoryPanel){display:none!important}
#tasksPage.sah-history-open > #unifiedPersonalTasksView{display:block!important}
.sah-inline-panel{
 margin:0;padding:3px 5px calc(90px + env(safe-area-inset-bottom,0px));
 border:0;border-radius:0;background:transparent;color:var(--text);
 box-shadow:none;min-width:0;
}
.sah-inline-panel[hidden],.sah-search[hidden],.sah-inline-toggle[hidden]{display:none!important}
.sah-inline-head{display:flex;align-items:center;justify-content:flex-start;gap:3px;min-height:48px;margin:0 0 6px}
.sah-inline-head button{
 display:inline-flex;align-items:center;justify-content:flex-start;gap:5px;
 min-height:44px;padding:8px 1px;border:0;border-radius:10px;
 background:transparent;color:var(--secondary);font:inherit;
 font-size:12.5px;font-weight:530;cursor:pointer
}
.sah-inline-head button:active{background:var(--sv-ui-quiet-surface)}
.sah-inline-head button svg{
 display:block;width:var(--sv-ui-icon,19px);height:var(--sv-ui-icon,19px);
 flex:none;fill:none;stroke:currentColor;
 stroke-width:var(--sv-ui-stroke,1.55);stroke-linecap:round;stroke-linejoin:round
}
#seyveoActionHistoryPanel .sah-history-back{
 display:inline-flex!important;align-items:center!important;justify-content:center!important;
 box-sizing:border-box!important;flex:0 0 44px!important;
 width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;
 padding:0!important;margin:0!important;border:0!important;
 background:transparent!important;box-shadow:none!important;
 -webkit-backdrop-filter:none!important;backdrop-filter:none!important;
 color:var(--text)!important;
}
.sah-history-title{margin:0!important;font-size:clamp(22px,5.6vw,26px);font-weight:600;line-height:1.18;letter-spacing:-.038em;color:var(--text)}
.sah-history-intro{margin:0 0 17px;color:var(--secondary);font-size:13px;line-height:1.45}
.sah-inline-panel.is-empty-history .sah-history-intro{display:none}
.sah-inline-panel.is-empty-history .sah-inline-head{margin-bottom:12px}
.sah-inline-panel.is-empty-history .sah-inline-note{
 display:flex;flex-direction:column;align-items:center;justify-content:center;
 width:100%;max-width:330px;min-height:0;
 margin:clamp(150px,28dvh,250px) auto 0;padding:0 16px 12px;box-sizing:border-box;
 background:transparent;border:0;text-align:center;
 color:var(--secondary);font-size:13.5px;line-height:1.55;
}
.sah-empty-icon{width:42px;height:42px;display:block;margin:0 0 15px;fill:none;
 stroke:var(--secondary);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;opacity:.8}
.sah-empty-title{display:block;margin:0 0 7px;color:var(--text);
 font-size:17px;font-weight:600;line-height:1.25;letter-spacing:-.025em}
.sah-empty-copy{display:block;max-width:265px;font-size:12.5px;line-height:1.5}
.sah-search{
 display:block;box-sizing:border-box;width:100%;min-height:44px;
 margin:9px 0 11px;padding:10px 12px;
 border:0;border-radius:12px;
 background:color-mix(in srgb,var(--card2) 46%,transparent);
 color:var(--text);font:inherit;font-size:14px;
}
.sah-search::placeholder{color:var(--secondary);opacity:.83}
.sah-inline-note{margin:13px 0 0;color:var(--secondary);font-size:13px;line-height:1.5}
.sah-date-heading{margin:15px 0 5px;font-size:12px;font-weight:530;letter-spacing:.015em;color:var(--secondary)}
.sah-row{
 padding:12px 0;border-top:1px solid var(--soft-line);
 font-size:13px;line-height:1.45;overflow-wrap:anywhere
}
.sah-row strong{display:block;font-size:14px;font-weight:540;line-height:1.4}
.sah-restore-task{display:inline-flex;align-items:center;min-height:44px;margin:4px 0 0 12px;padding:8px 4px;border:0;background:transparent;color:var(--text);font:inherit;font-size:12px;font-weight:530;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
.sah-restore-task:focus-visible{outline:2px solid var(--text);outline-offset:2px}
.sah-row small{display:inline-block;color:var(--secondary);font-size:12px;margin:6px 0 0 10px}
.sah-state{display:inline-block;margin-top:6px;font-size:12px;font-weight:530;color:var(--secondary)}
.sah-state[data-state=failed]{color:#e8a18d}
.sah-state[data-state=pending]{color:var(--secondary)}
.sah-state[data-state=done]{color:var(--secondary)}
.sah-studio{display:block!important;margin:6px 0 0!important;font-size:11px;opacity:.75;overflow-wrap:anywhere}
.sah-inline-panel>.sah-inline-toggle{margin:11px 0 2px;padding-inline:0;color:var(--text)}

/* SEYVEO History / Premium Dark Graphite: one quiet content surface. */
#seyveoActionHistoryPanel .sah-history-intro{display:none!important}
#seyveoActionHistoryPanel .sah-inline-head{
 display:flex!important;align-items:center!important;gap:8px!important;min-height:54px!important;
}
#seyveoActionHistoryPanel .sah-inline-head .sah-history-title{
 flex:1!important;min-width:0!important;
 font-size:clamp(22px,6vw,26px)!important;
 overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;
}
#seyveoActionHistoryPanel .sah-inline-head :is(.sah-history-back,.sah-history-search){
 display:inline-flex!important;align-items:center!important;justify-content:center!important;
 box-sizing:border-box!important;flex:0 0 44px!important;
 width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;
 margin:0!important;padding:0!important;border:0!important;
 border-radius:50%!important;background:#38383A!important;color:#F6F7F8!important;
 box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;
}
#seyveoActionHistoryPanel .sah-inline-head :is(.sah-history-back,.sah-history-search) svg{
 width:19px!important;height:19px!important;fill:none!important;
 stroke:currentColor!important;stroke-width:1.55!important;
 stroke-linecap:round!important;stroke-linejoin:round!important;
}
#seyveoActionHistoryPanel .sah-search{
 display:block;box-sizing:border-box;
 width:100%;height:44px!important;min-height:44px!important;
 margin:0 0 12px!important;padding:10px 13px!important;
 background:#38383A!important;color:#F6F7F8!important;
 border:0!important;border-radius:13px!important;box-shadow:none!important;
 -webkit-backdrop-filter:none!important;backdrop-filter:none!important;
 font-size:14px!important;line-height:1.3!important;
}
#seyveoActionHistoryPanel .sah-search::placeholder{color:rgba(246,247,248,.66)!important}
#seyveoActionHistoryPanel .sah-date-heading{
 margin:14px 0 5px!important;padding:0!important;
 font-size:11.5px!important;font-weight:560!important;color:var(--secondary)!important;
}
#seyveoActionHistoryPanel .sah-row{
 display:grid!important;box-sizing:border-box!important;
 grid-template-columns:minmax(0,1fr) 44px!important;grid-template-rows:auto auto!important;
 gap:3px 8px!important;align-items:center!important;min-height:67px!important;
 margin:0!important;padding:9px 0!important;
 background:transparent!important;border-top:1px solid var(--soft-line)!important;
 box-shadow:none!important;
}
#seyveoActionHistoryPanel .sah-row > strong{
 grid-column:1!important;grid-row:1!important;
 min-width:0!important;margin:0!important;
 font-size:13.5px!important;font-weight:550!important;letter-spacing:-.012em!important;
 line-height:1.4!important;
}
#seyveoActionHistoryPanel .sah-row-meta{
 grid-column:1!important;grid-row:2!important;
 display:flex!important;align-items:center!important;flex-wrap:wrap!important;
 gap:4px 10px!important;min-width:0!important;
}
#seyveoActionHistoryPanel .sah-row-meta .sah-state,
#seyveoActionHistoryPanel .sah-row-meta small{
 display:inline!important;margin:0!important;font-size:11.5px!important;
 font-weight:450!important;line-height:1.3!important;color:var(--secondary)!important;
}
#seyveoActionHistoryPanel .sah-restore-task{
 grid-column:2!important;grid-row:1 / span 2!important;
 justify-self:end!important;
 display:inline-flex!important;align-items:center!important;justify-content:center!important;
 box-sizing:border-box!important;width:44px!important;height:44px!important;
 min-width:44px!important;min-height:44px!important;
 padding:0!important;margin:0!important;
 border:0!important;border-radius:13px!important;
 background:rgba(161,169,177,.10)!important;
 box-shadow:none!important;text-decoration:none!important;color:var(--text)!important;
}
#seyveoActionHistoryPanel .sah-restore-task svg{
 display:block!important;width:19px!important;height:19px!important;
 fill:none!important;stroke:currentColor!important;stroke-width:1.6!important;
 stroke-linecap:round!important;stroke-linejoin:round!important;
}
#seyveoActionHistoryPanel .sah-empty-icon{width:42px!important;height:42px!important;margin-bottom:14px!important}
#seyveoActionHistoryPanel .sah-empty-title{font-size:17px!important;font-weight:600!important}
@media(max-width:365px){
 #seyveoActionHistoryPanel .sah-row > strong{font-size:13px!important}
}

`;
 document.head.append(style);
 const open=document.createElement('button');open.type='button';open.className='sah-inline-toggle';open.setAttribute('aria-label','Открыть историю действий');open.setAttribute('aria-expanded','false');
 const openSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 openSvg.setAttribute('viewBox','0 0 24 24');openSvg.setAttribute('aria-hidden','true');openSvg.setAttribute('focusable','false');
 const outline=document.createElementNS('http://www.w3.org/2000/svg','path');
 outline.setAttribute('d','M12 3.5a8.5 8.5 0 1 1-8.5 8.5M3.5 4v5h5M12 7.5V12l3 2');
 openSvg.append(outline);open.append(openSvg);open.title='История';
 const panel=document.createElement('section');panel.className='sah-inline-panel';panel.id='seyveoActionHistoryPanel';panel.hidden=true;panel.setAttribute('aria-label','История действий Сэйви');
 open.setAttribute('aria-controls',panel.id);
 const heading=document.createElement('div');heading.className='sah-inline-head';
 const title=document.createElement('h2');title.className='sah-history-title';title.textContent='История';title.id='seyveoActionHistoryTitle';
 panel.setAttribute('aria-labelledby',title.id);
 const back=document.createElement('button');back.type='button';back.setAttribute('aria-label','Вернуться к моим делам');back.title='Назад к делам';
 const backSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');backSvg.setAttribute('viewBox','0 0 24 24');backSvg.setAttribute('aria-hidden','true');
 const backPath=document.createElementNS('http://www.w3.org/2000/svg','path');backPath.setAttribute('d','m14 5-7 7 7 7');backSvg.append(backPath);back.classList.add('sv-nav-back','sah-history-back');
 back.append(backSvg);
 const fallbackSearch=document.createElement('button');
 fallbackSearch.type='button';fallbackSearch.className='sah-history-search';
 fallbackSearch.setAttribute('aria-label','Меню истории');
 fallbackSearch.title='Действия';
 fallbackSearch.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></g></svg>';
 heading.append(back,title,fallbackSearch);
 const intro=document.createElement('p');intro.className='sah-history-intro';intro.textContent='Сохранённые события и результаты действий';
 const filters=document.createElement('div');filters.className='sah-history-filters';filters.setAttribute('role','tablist');filters.setAttribute('aria-label','Разделы истории');
 let historyView='all';
 for(const [mode,label] of [['all','Все'],['done','Выполненные'],['deleted','Удалённые']]){
  const button=document.createElement('button');button.type='button';button.textContent=label;
  button.dataset.historyView=mode;button.setAttribute('role','tab');
  button.setAttribute('aria-selected',String(mode===historyView));
  button.addEventListener('click',()=>{
   if(historyView===mode)return;
   historyView=mode;selecting=false;chosen.clear();visibleCount=4;render();
  });
  filters.append(button);
 }
 const retention=document.createElement('p');retention.className='sah-history-retention';
 retention.textContent='Удалённые дела можно восстановить в течение 30 дней.';retention.hidden=true;
 const search=document.createElement('input');search.type='search';search.className='sah-search';search.placeholder='Поиск по имени, делу или дате';search.setAttribute('aria-label','Поиск в истории действий');
 search.hidden=true;search.id='sahHistorySearch';
 const list=document.createElement('div');panel.append(heading,intro,filters,retention,search,list);
 head.append(open);
 personal.append(panel);
 const studio=new URLSearchParams(location.search).has('seyveoStudio');
 const hiddenKey='seyveo-personal-history-hidden-v1';
 const readHidden=()=>{try{const a=JSON.parse(localStorage.getItem(hiddenKey)||'[]');return new Set(Array.isArray(a)?a:[])}catch{return new Set()}};
 const eventKey=e=>e.deleted?'deleted:'+e.taskId:e.taskId?'task:'+e.taskId:'card:'+String(e.eventId||'')+':'+String(e.at||'');
 const hideEvents=items=>{const keys=readHidden();items.filter(e=>!e.taskId).forEach(e=>keys.add(eventKey(e)));try{localStorage.setItem(hiddenKey,JSON.stringify([...keys].slice(-4000)));return true}catch{return false}};
 const cleanTitle=e=>{const t=String(e.title||'').trim();if(t&&!/^(?:[a-z]{1,4}[0-9a-f]{5,}|[0-9a-f]{7,}|[a-z0-9_-]{7,})$/i.test(t))return t;const type=({'personal-task':'дело',mail:'письмо',contract:'документ',work:'сообщение'}[e.cardType]||'действие Сэйви');return e.to==='canceled'?'Отменено: '+type:'История: '+type};
 let selecting=false;
 const chosen=new Set();
 let selectableEntries=[];
 const workHeader=document.getElementById('svWorkHeader'),headerSearch=document.getElementById('svWorkAdd');
 const menu=document.createElement('button');menu.type='button';menu.id='sahHistoryMore';menu.hidden=true;menu.setAttribute('aria-label','Меню истории');menu.textContent='···';
 const popup=document.createElement('div');popup.id='sahHistoryPopup';popup.hidden=true;
 // Same graphite icon menu as Sayvi chat history: search only appears on request.
 const option=(label,icon,action)=>{
  const b=document.createElement('button');b.type='button';
  const icons={
   search:'<circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 4.2 4.2"/>',
   select:'<rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="m7.7 12 2.8 2.8 5.8-5.8"/>',
   trash:'<path d="M4 6.5h16M9 6.5V4h6v2.5M6.6 6.5l.9 13h9l.9-13M10 10.5v5.5M14 10.5v5.5"/>'
  };
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[icon]+'</svg><span></span>';
  b.querySelector('span').textContent=label;
  b.addEventListener('click',()=>{popup.hidden=true;action()});
  popup.append(b);
 };
 option('Найти','search',()=>{if(!searchOpen)toggleSearch();else search.focus({preventScroll:true})});
 option('Выбрать','select',()=>{selecting=true;chosen.clear();render()});
 option('Очистить действия','trash',()=>{
  if(!confirm('Очистить историю действий Сэйви на этом устройстве? Выполненные и удалённые дела останутся на месте.'))return;
  if(!window.SEYVEO_CARD_LIFECYCLE?.clearPersonalHistory?.()){alert('Не удалось очистить историю действий');return}
  selecting=false;chosen.clear();render();
 });
 const selection=document.createElement('div');selection.id='sahHistorySelection';selection.hidden=true;
 const selectAll=document.createElement('button');selectAll.type='button';selectAll.id='sahSelectAll';selectAll.textContent='Выбрать все';
 const count=document.createElement('span');count.className='sah-bulk-count';count.textContent='Выбрано: 0';count.setAttribute('aria-live','polite');
 const restoreChosen=document.createElement('button');restoreChosen.type='button';restoreChosen.className='sah-bulk-restore';restoreChosen.textContent='Вернуть';restoreChosen.hidden=true;
 const removeChosen=document.createElement('button');removeChosen.type='button';removeChosen.textContent='Удалить';
 const cancelChosen=document.createElement('button');cancelChosen.type='button';cancelChosen.className='sah-bulk-cancel';cancelChosen.textContent='Отмена';
 const selectionHead=document.createElement('div');selectionHead.className='sv-bulk-selection-head';selectionHead.hidden=true;
 cancelChosen.textContent='Готово';selectionHead.append(selectAll,cancelChosen);panel.insertBefore(selectionHead,list);
 selection.classList.add('sv-bulk-selection-capsule');
 count.dataset.svBulkRole='count';restoreChosen.dataset.svBulkRole='action';removeChosen.dataset.svBulkRole='delete';
 selection.append(restoreChosen,count,removeChosen);document.body.append(selection);
 popup.setAttribute('role','group');popup.setAttribute('aria-label','Действия с историей');
 const broadcastSelection=()=>window.dispatchEvent(new CustomEvent('seyveo:history-selection-changed',{detail:{active:selecting}}));
 const leaveSelection=()=>{selecting=false;chosen.clear();popup.hidden=true;render()};
 const showCount=()=>{
  selection.dataset.view=historyView;
  const keys=selectableEntries.map(eventKey);
  const all=keys.length>0&&keys.every(key=>chosen.has(key));
  count.textContent='Выбрано: '+chosen.size;
  removeChosen.disabled=!chosen.size;
  restoreChosen.hidden=historyView!=='deleted';
  restoreChosen.disabled=!chosen.size;
  removeChosen.textContent=historyView==='deleted'?'Навсегда':'Удалить';
  removeChosen.setAttribute('aria-label',historyView==='deleted'?'Удалить выбранные дела навсегда':'Удалить выбранные записи');
  selectAll.disabled=!keys.length;
  selectAll.textContent=all?'Снять выбор':'Выбрать все';
  selectAll.setAttribute('aria-pressed',String(all));
 };
 cancelChosen.addEventListener('click',leaveSelection);
 restoreChosen.addEventListener('click',()=>{
  const ids=[...chosen].filter(key=>key.startsWith('deleted:')).map(key=>key.slice(8));
  if(!ids.length)return;
  if(!window.SEYVEO_PERSONAL_TASK_TRASH?.restore?.(ids)){
   alert('Не удалось восстановить выбранные дела. Проверьте доступное место.');return;
  }
  chosen.clear();selecting=false;render();
 });
 selectAll.addEventListener('click',()=>{
  const keys=selectableEntries.map(eventKey);
  if(!keys.length)return;
  if(keys.every(key=>chosen.has(key)))keys.forEach(key=>chosen.delete(key));
  else keys.forEach(key=>chosen.add(key));
  render();
 });
 removeChosen.addEventListener('click',()=>{
  if(!chosen.size)return;
  if(historyView==='deleted'){
   const ids=[...chosen].filter(key=>key.startsWith('deleted:')).map(key=>key.slice(8));
   if(!ids.length||!confirm('Удалить навсегда '+ids.length+' дел? Восстановить их больше не получится.'))return;
   if(!window.SEYVEO_PERSONAL_TASK_TRASH?.removePermanently?.(ids)){
    alert('Не удалось удалить выбранные дела');return;
   }
   chosen.clear();selecting=false;render();return;
  }
  if(!confirm('Удалить выбранные записи? Выполненные дела попадут в «Недавно удалённые» на 30 дней.'))return;
  const events=window.SEYVEO_CARD_LIFECYCLE?.history?.()||[];
  for(const e of events.filter(e=>chosen.has(eventKey(e)))){
   if(!window.SEYVEO_CARD_LIFECYCLE?.removeHistoryEntry?.(e.eventId)){alert('Не удалось удалить запись');return}
  }
  const tasks=window.SEYVEO_PERSONAL_TASK_HISTORY?.completed?.()||[];
  for(const task of tasks)if(chosen.has('task:'+task.id))window.SEYVEO_PERSONAL_TASK_HISTORY?.removeCompleted?.(task.id);
  chosen.clear();selecting=false;render();
 });
 document.body.append(popup);
 const closePopup=()=>{popup.hidden=true};
 const showPopup=anchor=>{
  if(panel.hidden)return;
  if(!popup.hidden){closePopup();return}
  const rect=anchor?.getBoundingClientRect?.();if(!rect)return;
  popup.hidden=false;
  const w=popup.getBoundingClientRect().width;
  popup.style.left=Math.max(12,Math.min(rect.right-w,window.innerWidth-w-12))+'px';
  popup.style.top=Math.max(12,rect.bottom+6)+'px';
 };
 window.addEventListener('seyveo:history-menu-toggle',e=>showPopup(e.detail?.anchor));
 document.addEventListener('pointerdown',e=>{if(!popup.contains(e.target)&&!e.composedPath().some(n=>n?.dataset?.svHeaderIcon==='history-menu'))closePopup()});
 window.addEventListener('resize',closePopup,{passive:true});
 const css=document.createElement('style');css.textContent=`
 #svWorkHeader[data-sah-history="true"] #svWorkAdd{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
 #sahHistoryMore{width:44px;height:44px;flex:none;border:0;border-radius:0;background:transparent;color:var(--text,#fff);font-size:24px;letter-spacing:2px}
 #sahHistoryMore[hidden],#sahHistoryPopup[hidden],#sahHistorySelection[hidden]{display:none!important}
 #svWorkHeader{position:relative}
 #sahHistoryPopup{position:absolute;right:5px;top:100%;z-index:80;width:min(234px,calc(100vw - 36px));padding:7px 0;background:#38383A;border-radius:13px;box-shadow:0 10px 30px rgba(0,0,0,.2)}
 #sahHistoryPopup button{display:flex;align-items:center;gap:12px;width:100%;min-height:44px;background:transparent;border:0;color:#F5F5F7;text-align:left;padding:10px 15px;font:500 13px/1.4 -apple-system,BlinkMacSystemFont,system-ui,sans-serif}
 #sahHistoryPopup button svg{display:block;flex:0 0 19px;width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}
 #sahHistoryPopup button span{min-width:0;line-height:1.3}
 #sahHistoryPopup button:active{background:#49494B}
 #sahHistorySelection{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:10px 0;font-size:12px}
 #sahHistorySelection span{white-space:nowrap;color:var(--secondary,#b8b8ba);font-size:11px}
 #sahHistorySelection button{min-height:38px;border:0;background:#38383A;color:#fff;border-radius:10px;padding:8px 11px;font:500 12px/1.2 -apple-system,BlinkMacSystemFont,system-ui,sans-serif}
 #sahHistorySelection #sahSelectAll{justify-self:start;white-space:nowrap}
 #sahHistorySelection button:disabled{opacity:.4}
 #seyveoActionHistoryPanel .sah-row.sah-selecting{cursor:pointer;touch-action:manipulation}
 #seyveoActionHistoryPanel .sah-row.sah-selecting .sah-restore-task{display:none!important}
 #seyveoActionHistoryPanel .sah-row.sah-selecting .sah-pick{width:21px;height:21px;cursor:pointer}
 @media(max-width:360px){#sahHistorySelection{gap:5px}#sahHistorySelection button{padding:7px 8px;font-size:11px}#sahHistorySelection span{font-size:10px}}
 #seyveoActionHistoryPanel .sah-row.sah-selecting{grid-template-columns:26px minmax(0,1fr) 44px!important}
 #seyveoActionHistoryPanel .sah-row.sah-selecting strong,#seyveoActionHistoryPanel .sah-row.sah-selecting .sah-row-meta{grid-column:2!important}
 #seyveoActionHistoryPanel .sah-row.sah-selecting .sah-restore-task{grid-column:3!important}
 .sah-pick{grid-column:1;grid-row:1/span 2;accent-color:#999}
 #seyveoActionHistoryPanel .sah-row:not(.sah-selecting) .sah-delete{
  grid-column:2!important;grid-row:1 / span 2!important;justify-self:end!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
  width:44px!important;height:44px!important;min-height:44px!important;
  padding:0!important;margin:0!important;border:0!important;border-radius:10px!important;
  background:transparent!important;color:var(--secondary,#b8b8ba)!important;
  box-shadow:none!important;cursor:pointer!important;
 }
 #seyveoActionHistoryPanel .sah-row:not(.sah-selecting) .sah-delete svg{
  width:19px!important;height:19px!important;display:block!important;
  fill:none!important;stroke:currentColor!important;stroke-width:1.6!important;
  stroke-linecap:round!important;stroke-linejoin:round!important;
 }
 #seyveoActionHistoryPanel .sah-row:not(.sah-selecting) .sah-delete:active{
  background:#38383A!important;color:#fff!important;
 }

 `;document.head.append(css);

 /* Apple-like information hierarchy, with our approved pearl material and
    a clear distinction between outcomes, completed work, and recoverable loss. */
 const iosHistoryStyle=document.createElement('style');
 iosHistoryStyle.textContent=`
 #seyveoActionHistoryPanel.sah-inline-panel{
  box-sizing:border-box!important;width:100%!important;
  padding:4px 13px calc(104px + env(safe-area-inset-bottom,0px))!important;
  background:#FFF!important;color:#17191E!important;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif!important;
 }
 #seyveoActionHistoryPanel .sah-history-filters{
  box-sizing:border-box;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
  gap:3px;width:100%;height:37px;margin:3px 0 15px;padding:3px;
  border:1px solid #ECEEF1;border-radius:999px;background:#F5F6F8;
 }
 #seyveoActionHistoryPanel .sah-history-filters button{
  display:grid;place-items:center;min-width:0;padding:0 3px;
  border:0;border-radius:999px;background:transparent;box-shadow:none;
  color:#454950;font:550 12px/1.1 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  cursor:pointer;white-space:nowrap;
 }
 #seyveoActionHistoryPanel .sah-history-filters button[aria-selected="true"]{
  background:#FFF;color:#2871BE;
  box-shadow:0 .6px 2px rgba(35,42,56,.055);
 }
 #seyveoActionHistoryPanel .sah-history-retention{
  margin:1px 4px 15px;color:#7A818C;
  font:450 12px/1.4 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
 }
 #seyveoActionHistoryPanel .sah-history-retention[hidden]{display:none!important}
 #seyveoActionHistoryPanel .sah-date-heading{
  margin:18px 4px 7px!important;color:#777F89!important;
  font-size:12px!important;font-weight:580!important;
 }
 #seyveoActionHistoryPanel .sah-row{
  min-height:72px!important;padding:12px 4px!important;
  border-top:1px solid #E9EBEF!important;color:#17191E!important;
 }
 #seyveoActionHistoryPanel .sah-row > strong{
  color:#191C21!important;font-size:15px!important;font-weight:560!important;
 }
 #seyveoActionHistoryPanel .sah-row.sah-has-restore:not(.sah-selecting){
  grid-template-columns:minmax(0,1fr) 42px 42px!important;gap:3px 4px!important;
 }
 #seyveoActionHistoryPanel .sah-row.sah-has-restore:not(.sah-selecting) .sah-restore-task{
  grid-column:2!important;grid-row:1 / span 2!important;
  width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;
  border-radius:50%!important;background:rgba(190,193,202,.13)!important;
  color:#2476BC!important;
 }
 #seyveoActionHistoryPanel .sah-row.sah-has-restore:not(.sah-selecting) .sah-delete{
  grid-column:3!important;grid-row:1 / span 2!important;
  width:42px!important;height:42px!important;border-radius:50%!important;
  color:#9B6464!important;
 }
 #seyveoActionHistoryPanel .sah-row.sah-trash-row .sah-state{
  color:#A16B45!important;
 }
 #sahHistoryPopup{
  box-sizing:border-box!important;border:1px solid #ECEEF1!important;border-radius:17px!important;
  background:rgba(255,255,255,.96)!important;color:#1C1C1E!important;
  box-shadow:0 12px 35px rgba(31,40,53,.13)!important;
  -webkit-backdrop-filter:blur(18px) saturate(110%);backdrop-filter:blur(18px) saturate(110%);
 }
 #sahHistoryPopup button{color:#202329!important;font-size:13.5px!important}
 #sahHistoryPopup button:active{background:#F3F4F6!important}
 #sahHistorySelection{
  position:fixed!important;z-index:120!important;left:50%!important;
  bottom:max(12px,env(safe-area-inset-bottom,0px))!important;
  transform:translateX(-50%)!important;box-sizing:border-box!important;
  display:flex!important;align-items:center!important;justify-content:space-between!important;
  gap:2px!important;width:min(354px,calc(100% - 28px))!important;min-height:58px!important;
  padding:5px!important;border:var(--sv-dock-pearl-border,.7px solid rgba(255,255,255,.38))!important;
  border-radius:999px!important;background:var(--sv-dock-pearl-bg,rgba(190,193,202,.16))!important;
  box-shadow:var(--sv-dock-pearl-shadow,0 0 0 .6px rgba(164,170,184,.18))!important;
  -webkit-backdrop-filter:blur(12px) saturate(108%)!important;
  backdrop-filter:blur(12px) saturate(108%)!important;
 }
 #sahHistorySelection[hidden],#sahHistorySelection .sah-bulk-restore[hidden]{display:none!important}
 #sahHistorySelection button{
  flex:1 1 0!important;display:grid!important;place-items:center!important;
  box-sizing:border-box!important;min-width:0!important;min-height:46px!important;
  padding:0 4px!important;border:0!important;border-radius:999px!important;
  background:transparent!important;color:#252A32!important;
  font:550 11.3px/1.15 -apple-system,BlinkMacSystemFont,system-ui,sans-serif!important;
  white-space:nowrap!important;
 }
 #sahHistorySelection #sahSelectAll{flex:1.18 1 0!important;background:rgba(255,255,255,.72)!important}
 #sahHistorySelection .sah-bulk-count{flex:1 1 0!important;min-width:0!important;text-align:center!important;
  font-size:11px!important;color:#757C86!important;white-space:nowrap!important}
 /* V119: selection count remains visible in every history tab. */
 #sahHistorySelection .sah-bulk-restore{color:#2A72B9!important}
 #sahHistorySelection .sah-bulk-cancel{color:#606773!important}
 #sahHistorySelection button:disabled{opacity:.34!important}
 #sahHistorySelection button:last-of-type:not(.sah-bulk-cancel){color:#BB4754!important}
 #sahHistorySelection button:nth-last-of-type(2){color:#BB4754!important}
 :root[data-theme="dark"] #seyveoActionHistoryPanel.sah-inline-panel{background:#191A1E!important;color:#F3F4F6!important}
 :root[data-theme="dark"] #seyveoActionHistoryPanel .sah-history-filters{background:#303138;border-color:#41434A}
 :root[data-theme="dark"] #seyveoActionHistoryPanel .sah-history-filters button{color:#D1D3DA}
 :root[data-theme="dark"] #seyveoActionHistoryPanel .sah-history-filters button[aria-selected="true"]{background:#4B4D56;color:#FFF}
 :root[data-theme="dark"] #seyveoActionHistoryPanel .sah-row{border-top-color:#3A3C42!important}
 :root[data-theme="dark"] #seyveoActionHistoryPanel .sah-row > strong{color:#F3F4F6!important}
 `;
 document.head.append(iosHistoryStyle);
 const standardStyle=document.createElement('style');
 standardStyle.textContent=`
 #sahHistoryPopup{position:fixed!important;right:auto!important;bottom:auto!important;z-index:2147482000!important;width:190px!important;max-width:calc(100% - 24px)!important;padding:4px!important;border:var(--sv-menu-border)!important;border-radius:var(--sv-menu-compact-radius,18px)!important;background:var(--sv-menu-bg)!important;box-shadow:var(--sv-menu-shadow)!important;-webkit-backdrop-filter:var(--sv-menu-blur)!important;backdrop-filter:var(--sv-menu-blur)!important}
 #sahHistoryPopup button{border-radius:var(--sv-menu-row-radius,11px)!important;color:var(--sv-menu-text,var(--text))!important}
 #sahHistoryPopup button:last-child{color:#d93238!important}
 #sahHistorySelection{position:fixed!important;bottom:calc(12px + env(safe-area-inset-bottom,0px))!important;z-index:120!important;margin:0!important}
 #seyveoActionHistoryPanel .sah-pick{appearance:none;-webkit-appearance:none;border:1.4px solid #9ca5b0;border-radius:50%;background:transparent;margin:0;display:grid;place-items:center}
 #seyveoActionHistoryPanel .sah-pick:checked{border-color:#007aff;background:#007aff}
 #seyveoActionHistoryPanel .sah-pick:checked::after{content:"";width:8px;height:4px;border-left:2px solid white;border-bottom:2px solid white;transform:rotate(-45deg) translateY(-1px)}
 #seyveoActionHistoryPanel .sv-bulk-selection-head[hidden]{display:none!important}
 html:root.sah-history-no-dock #seyveoActionHistoryPanel:has(.sv-bulk-selection-head:not([hidden])){padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}
 `;document.head.append(standardStyle);

 let visibleCount=4;
 let searchOpen=false;
 const more=document.createElement('button');more.type='button';more.className='sah-inline-toggle';more.style.marginTop='10px';more.hidden=true;more.textContent='Показать ещё';panel.append(more);
 const stateOf=v=>v==='failed'?'failed':['shown','deferred','action_pending','executing'].includes(v)?'pending':['succeeded','archived'].includes(v)?'done':'other';
 const statuses={shown:'Не завершено',deferred:'Отложено',action_pending:'Ожидает действия',executing:'Выполняется',succeeded:'Выполнено',archived:'В архиве',failed:'Ошибка',canceled:'Отменено',expired:'Истекло',deleted:'Удалено'};
 function render(){
  broadcastSelection();
  list.replaceChildren();
  for(const button of filters.children)button.setAttribute('aria-selected',String(button.dataset.historyView===historyView));
  retention.hidden=historyView!=='deleted';
  const api=window.SEYVEO_CARD_LIFECYCLE;
  const cardEvents=api?.history?.()||[];
  const tasks=window.SEYVEO_PERSONAL_TASK_HISTORY?.completed?.()||[];
  const taskEvents=tasks.map(task=>({eventId:task.id,title:task.title,cardType:'personal-task',to:'succeeded',at:task.doneAt||task.createdAt,taskId:task.id}));
  const trashEvents=(window.SEYVEO_PERSONAL_TASK_TRASH?.list?.()||[]).map(task=>({
   eventId:task.id,title:task.title,cardType:'personal-task',to:'deleted',
   at:task.deletedAt,taskId:task.id,deleted:true,expiresAt:task.expiresAt
  }));
  const collection=historyView==='deleted'?trashEvents:historyView==='done'?taskEvents:[...cardEvents,...taskEvents];
  const events=collection.filter(e=>!readHidden().has(eventKey(e)))
   .sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
  selection.hidden=selectionHead.hidden=!selecting;
  panel.classList.toggle('is-empty-history',events.length===0);
  more.hidden=true;
  search.hidden=!searchOpen;
  if(!events.length){selectableEntries=[];showCount();
   const empty=document.createElement('div');empty.className='sah-inline-note';
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
   svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('class','sah-empty-icon');svg.setAttribute('aria-hidden','true');
   const ring=document.createElementNS('http://www.w3.org/2000/svg','circle');
   ring.setAttribute('cx','32');ring.setAttribute('cy','32');ring.setAttribute('r','22');svg.append(ring);
   const hands=document.createElementNS('http://www.w3.org/2000/svg','path');
   hands.setAttribute('d','M32 18v15l10 6');svg.append(hands);
   const heading=document.createElement('strong');heading.className='sah-empty-title';
   heading.textContent=historyView==='deleted'?'Корзина пуста':historyView==='done'?'Выполненных дел пока нет':'Пока нет действий';
   const copy=document.createElement('span');copy.className='sah-empty-copy';
   copy.textContent=historyView==='deleted'?'Удалённые дела появятся здесь. Их можно вернуть в течение 30 дней.':
    historyView==='done'?'Завершённые дела сохраняются и при необходимости возвращаются в активные.':
    'Здесь появится история дел и действий Сэйви.';
   empty.append(svg,heading,copy);list.append(empty);return;
  }
  // Ordinary users see one latest outcome per card; developer mode shows its full trace.
  const base=studio?events:events.filter((e,i,all)=>all.findIndex(x=>(x.taskId?'task:'+x.taskId:'card:'+x.eventId)===(e.taskId?'task:'+e.taskId:'card:'+e.eventId))===i);
  const q=search.value.trim().toLocaleLowerCase('ru-RU');
  const selected=q?base.filter(e=>{
   const d=e.at?new Date(e.at):null;
   const date=d&&!Number.isNaN(d.getTime())?d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
   const parts=[e.title,e.cardType,e.reason,e.eventId,statuses[e.to],date,d?d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}):''];
   return parts.some(value=>String(value||'').toLocaleLowerCase('ru-RU').includes(q));
  }):base;
  selectableEntries=selected;showCount();
  if(!selected.length){const empty=document.createElement('p');empty.className='sah-inline-note';empty.textContent=q?'Совпадений не найдено':'Пока нет записанных действий';list.append(empty);more.hidden=true;return;}
  const dateKey=d=>[d.getFullYear(),d.getMonth(),d.getDate()].join('-');
  const today=new Date(),yesterday=new Date(today.getFullYear(),today.getMonth(),today.getDate()-1);
  let lastDay='';
  for(const e of selected.slice(0,visibleCount)){
   const date=e.at?new Date(e.at):null;
   const valid=date&&!Number.isNaN(date.getTime());
   const day=valid?dateKey(date):'unknown';
   if(day!==lastDay){
    const group=document.createElement('p');group.className='sah-date-heading';
    group.textContent=!valid?'Без даты':day===dateKey(today)?'Сегодня':day===dateKey(yesterday)?'Вчера':date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
    list.append(group);lastDay=day;
   }
   const item=document.createElement('div');item.className='sah-row';item.dataset.state=stateOf(e.to);
   if(e.taskId)item.classList.add('sah-has-restore');
   if(e.deleted)item.classList.add('sah-trash-row');
   const name=document.createElement('strong');name.textContent=cleanTitle(e);
   const line=document.createElement('small');line.textContent=(statuses[e.to]||e.to||'Событие')+' · '+(valid?date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'время не указано');
   const status=document.createElement('span');status.className='sah-state';status.dataset.state=stateOf(e.to);status.textContent=statuses[e.to]||e.to||'Событие';
   const daysLeft=e.deleted?Math.max(0,Math.ceil((Date.parse(e.expiresAt)-Date.now())/86400000)):0;
   line.textContent=e.deleted?'Можно восстановить · ещё '+daysLeft+' дн.':
    valid?date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'время не указано';
   const meta=document.createElement('div');
   meta.className='sah-row-meta';
   meta.append(status,line);
   item.append(name,meta);
    if(selecting){
     item.classList.add('sah-selecting');
     const check=document.createElement('input');check.type='checkbox';check.className='sah-pick';check.checked=chosen.has(eventKey(e));
     check.setAttribute('aria-label','Выбрать '+cleanTitle(e));
     check.addEventListener('change',()=>{if(check.checked)chosen.add(eventKey(e));else chosen.delete(eventKey(e));showCount()});
     item.prepend(check);
     item.addEventListener('click',event=>{
      if(event.target===check||event.target.closest('button'))return;
      check.checked=!check.checked;
      check.dispatchEvent(new Event('change',{bubbles:true}));
     });
    }else{
     const del=document.createElement('button');del.type='button';del.className='sah-delete';
     del.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7"/></svg>';
     del.title='Удалить запись';
     del.setAttribute('aria-label',(e.deleted?'Удалить навсегда: ':'Удалить запись: ')+cleanTitle(e));
     del.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      if(!confirm(e.deleted?'Удалить дело «'+e.title+'» навсегда? Восстановить его больше не получится.':'Удалить запись «'+cleanTitle(e)+'»?'))return;
      const ok=e.deleted?window.SEYVEO_PERSONAL_TASK_TRASH?.removePermanently?.(e.taskId):
       e.taskId?window.SEYVEO_PERSONAL_TASK_HISTORY?.removeCompleted?.(e.taskId):
       window.SEYVEO_CARD_LIFECYCLE?.removeHistoryEntry?.(e.eventId);
      if(ok)render();else alert('Не удалось удалить запись. Проверьте хранилище браузера.');
     });
     item.append(del);
    }
   if(e.taskId&&!selecting){
    const recover=document.createElement('button');recover.type='button';recover.className='sah-restore-task';
    recover.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 4 12l5 5M4 12h10a6 6 0 0 1 6 6"/></svg>';
    recover.title=e.deleted?'Восстановить удалённое дело':'Вернуть в активные дела';
    recover.setAttribute('aria-label',(e.deleted?'Восстановить удалённое дело: ':'Вернуть в активные дела: ')+e.title);
    recover.addEventListener('click',()=>{
     const ok=e.deleted?window.SEYVEO_PERSONAL_TASK_TRASH?.restore?.(e.taskId):
      window.SEYVEO_PERSONAL_TASK_HISTORY?.restore?.(e.taskId);
     if(ok)render();else {recover.setAttribute('aria-label','Не удалось восстановить дело');recover.title='Не удалось восстановить';}
    });
    item.append(recover);
   }
   if(studio){const tech=document.createElement('small');tech.className='sah-studio';tech.textContent=(e.from||'—')+' → '+(e.to||'—')+' · '+e.eventId+(e.reason?' · '+e.reason:'');item.append(tech);}
   list.append(item);
  }
  more.hidden=selected.length<=visibleCount;
  if(!more.hidden)more.textContent='Показать ещё · '+Math.min(8,selected.length-visibleCount);
 }
 const toggleSearch=()=>{
  if(panel.hidden)return;
  searchOpen=!searchOpen;
  if(!searchOpen)search.value='';
  visibleCount=4;render();
  fallbackSearch.setAttribute('aria-expanded',String(searchOpen));
  const shared=document.getElementById('svWorkAdd');
  if(shared&&shared.dataset.svHeaderIcon==='search')shared.setAttribute('aria-expanded',String(searchOpen));
  if(searchOpen)requestAnimationFrame(()=>search.focus({preventScroll:true}));
 };
 fallbackSearch.setAttribute('aria-controls',search.id);
 fallbackSearch.setAttribute('aria-expanded','false');
 fallbackSearch.addEventListener('click',()=>showPopup(fallbackSearch));
 window.addEventListener('seyveo:history-search-toggle',toggleSearch);
 window.addEventListener('seyveo:history-select-toggle',()=>{
  if(panel.hidden)return;
  selecting=!selecting;
  chosen.clear();
  popup.hidden=true;
  render();
 });
 search.addEventListener('input',()=>{visibleCount=4;render();});
 more.addEventListener('click',()=>{visibleCount+=8;render();});
 const page=document.getElementById('tasksPage');
 const scroller=document.querySelector('.app');
 // Long histories load naturally as the user approaches the bottom;
 // the "Показать ещё" control remains as an accessible fallback.
 if('IntersectionObserver'in window){
  const historyLoader=new IntersectionObserver(entries=>{
   if(!entries[0]?.isIntersecting||panel.hidden||more.hidden)return;
   visibleCount+=8;render();
  },{root:scroller||null,rootMargin:'0px 0px 220px 0px'});
  historyLoader.observe(more);
 }
 // The shared dock is the same DOM node on every page. The existing
 // CSS-only history suppression can lose against later !important rules.
 // Preserve the original inline display state and lock it only while the
 // nested History view is shown; never alter the dock itself.
 const sharedDock=document.querySelector('footer.dock.sv-shared-dock');
 let dockDisplayBefore=null,dockDisplayPriorityBefore='';
 const setHistoryDockVisibility=show=>{
  if(!sharedDock)return;
  if(show){
   if(dockDisplayBefore===null){
    dockDisplayBefore=sharedDock.style.getPropertyValue('display');
    dockDisplayPriorityBefore=sharedDock.style.getPropertyPriority('display');
   }
   sharedDock.style.setProperty('display','none','important');
  }else if(dockDisplayBefore!==null){
   if(dockDisplayBefore)sharedDock.style.setProperty('display',dockDisplayBefore,dockDisplayPriorityBefore);
   else sharedDock.style.removeProperty('display');
   dockDisplayBefore=null;dockDisplayPriorityBefore='';
  }
 };
 let previousScroll=0;
 const toggle=(show,{restoreFocus=true,restoreScroll=true}={})=>{
  if(show===!panel.hidden)return;
  if(show&&(page?.hidden||location.hash!=='#tasks'))return;
  if(show)previousScroll=scroller?.scrollTop||0;
  panel.hidden=!show;
  document.documentElement.classList.toggle('sah-history-no-dock',show);
  setHistoryDockVisibility(show);
 popup.hidden=true;if(!show){selecting=false;chosen.clear();selection.hidden=selectionHead.hidden=true}
  page?.classList.toggle('sah-history-open',show);
  open.setAttribute('aria-expanded',String(show));
  if(show){
   searchOpen=false;search.value='';visibleCount=4;render();
   if(scroller)scroller.scrollTop=0;
   requestAnimationFrame(()=>(document.getElementById('svWorkBack')||back).focus({preventScroll:true}));
  }else{
   selecting=false;chosen.clear();broadcastSelection();
   searchOpen=false;search.value='';search.hidden=true;
   fallbackSearch.setAttribute('aria-expanded','false');
   requestAnimationFrame(()=>{
    if(restoreScroll&&scroller)scroller.scrollTop=previousScroll;
    if(restoreFocus&&open.isConnected&&!open.closest('[hidden]'))open.focus({preventScroll:true});
   });
  }
 };
 window.SEYVEO_ACTION_HISTORY_OPEN=(view='all')=>{
  historyView=['all','done','deleted'].includes(view)?view:'all';
  if(!panel.hidden){selecting=false;chosen.clear();render();return;}
  toggle(true);
 };
 open.addEventListener('click',()=>toggle(true));
 back.addEventListener('click',()=>{if(selecting)leaveSelection();else toggle(false)});
 panel.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();if(selecting)leaveSelection();else toggle(false)}
 });
 // Routing away must never leave the Tasks screen stuck in History mode.
 window.addEventListener('hashchange',()=>{
  if(location.hash!=='#tasks'&&!panel.hidden)toggle(false,{restoreFocus:false,restoreScroll:false});
 });
 if(page)new MutationObserver(()=>{
  if(page.hidden&&!panel.hidden)toggle(false,{restoreFocus:false,restoreScroll:false});
 }).observe(page,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('seyveo:cards-changed',()=>{if(!panel.hidden)render()});
 window.addEventListener('seyveo:personal-tasks-changed',()=>{if(!panel.hidden)render()});
}
