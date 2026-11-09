import './seyveo-history-recovery.mjs';
/* History belongs in Дела > Мои дела. No floating launch control. */
const personal=document.getElementById('unifiedPersonalTasksView');
const head=personal?.querySelector('.personal-tasks-head');
if(personal&&head){
 const style=document.createElement('style');
 style.textContent=`
/* History is a dedicated Tasks subview, not content appended beneath active work. */
.sah-inline-toggle{
 display:inline-flex;align-items:center;justify-content:center;gap:7px;
 margin-left:auto;min-height:44px;padding:8px 9px;
 border:0;border-radius:12px;background:transparent;
 color:var(--secondary);font:inherit;font-size:12.5px;font-weight:520;
 cursor:pointer;touch-action:manipulation;
}
.sah-inline-toggle[aria-expanded="true"]{color:var(--text)}
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
 margin:clamp(48px,9dvh,90px) auto 0;padding:0 16px 12px;box-sizing:border-box;
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
 openSvg.append(outline);open.append(openSvg,document.createTextNode('История'));
 const panel=document.createElement('section');panel.className='sah-inline-panel';panel.id='seyveoActionHistoryPanel';panel.hidden=true;panel.setAttribute('aria-label','История действий Сэйви');
 open.setAttribute('aria-controls',panel.id);
 const heading=document.createElement('div');heading.className='sah-inline-head';
 const title=document.createElement('h2');title.className='sah-history-title';title.textContent='История действий';title.id='seyveoActionHistoryTitle';
 panel.setAttribute('aria-labelledby',title.id);
 const back=document.createElement('button');back.type='button';back.setAttribute('aria-label','Вернуться к моим делам');back.title='Назад к делам';
 const backSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');backSvg.setAttribute('viewBox','0 0 24 24');backSvg.setAttribute('aria-hidden','true');
 const backPath=document.createElementNS('http://www.w3.org/2000/svg','path');backPath.setAttribute('d','m14 5-7 7 7 7');backSvg.append(backPath);back.classList.add('sv-nav-back','sah-history-back');
 back.append(backSvg);
 const fallbackSearch=document.createElement('button');
 fallbackSearch.type='button';fallbackSearch.className='sah-history-search';
 fallbackSearch.setAttribute('aria-label','Поиск в истории действий');
 fallbackSearch.title='Поиск';
 fallbackSearch.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 5 5"/></svg>';
 heading.append(back,title,fallbackSearch);
 const intro=document.createElement('p');intro.className='sah-history-intro';intro.textContent='Сохранённые события и результаты действий';
 const search=document.createElement('input');search.type='search';search.className='sah-search';search.placeholder='Поиск по имени, делу или дате';search.setAttribute('aria-label','Поиск в истории действий');
 search.hidden=true;search.id='sahHistorySearch';
 const list=document.createElement('div');panel.append(heading,intro,search,list);
 head.append(open);
 personal.append(panel);
 const studio=new URLSearchParams(location.search).has('seyveoStudio');
 let visibleCount=4;
 let searchOpen=false;
 const more=document.createElement('button');more.type='button';more.className='sah-inline-toggle';more.style.marginTop='10px';more.hidden=true;more.textContent='Показать ещё';panel.append(more);
 const stateOf=v=>v==='failed'?'failed':['shown','deferred','action_pending','executing'].includes(v)?'pending':['succeeded','archived'].includes(v)?'done':'other';
 const statuses={shown:'Не завершено',deferred:'Отложено',action_pending:'Ожидает действия',executing:'Выполняется',succeeded:'Выполнено',archived:'В архиве',failed:'Ошибка',canceled:'Отменено',expired:'Истекло'};
 function render(){
  list.replaceChildren();
  const api=window.SEYVEO_CARD_LIFECYCLE;
  const cardEvents=api?.history?.()||[];
  const tasks=window.SEYVEO_PERSONAL_TASK_HISTORY?.completed?.()||[];
  const taskEvents=tasks.map(task=>({eventId:task.id,title:task.title,cardType:'personal-task',to:'succeeded',at:task.doneAt||task.createdAt,taskId:task.id}));
  const events=[...cardEvents,...taskEvents].sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
  panel.classList.toggle('is-empty-history',events.length===0);
  more.hidden=true;
  search.hidden=!searchOpen;
  if(!events.length){
   const empty=document.createElement('div');empty.className='sah-inline-note';
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
   svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('class','sah-empty-icon');svg.setAttribute('aria-hidden','true');
   const ring=document.createElementNS('http://www.w3.org/2000/svg','circle');
   ring.setAttribute('cx','32');ring.setAttribute('cy','32');ring.setAttribute('r','22');svg.append(ring);
   const hands=document.createElementNS('http://www.w3.org/2000/svg','path');
   hands.setAttribute('d','M32 18v15l10 6');svg.append(hands);
   const heading=document.createElement('strong');heading.className='sah-empty-title';heading.textContent='Пока нет действий';
   const copy=document.createElement('span');copy.className='sah-empty-copy';copy.textContent='Здесь появятся сохранённые события карточек и результаты действий.';
   empty.append(svg,heading,copy);list.append(empty);return;
  }
  // Ordinary users see one latest outcome per card; developer mode shows its full trace.
  const base=studio?events:events.filter((e,i,all)=>all.findIndex(x=>x.eventId===e.eventId)===i);
  const q=search.value.trim().toLocaleLowerCase('ru-RU');
  const selected=q?base.filter(e=>{
   const d=e.at?new Date(e.at):null;
   const date=d&&!Number.isNaN(d.getTime())?d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
   const parts=[e.title,e.cardType,e.reason,e.eventId,statuses[e.to],date,d?d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}):''];
   return parts.some(value=>String(value||'').toLocaleLowerCase('ru-RU').includes(q));
  }):base;
  if(!selected.length){const empty=document.createElement('p');empty.className='sah-inline-note';empty.textContent=q?'Совпадений не найдено':'Пока нет записанных действий';list.append(empty);more.hidden=true;return;}
  const dateKey=d=>[d.getFullYear(),d.getMonth(),d.getDate()].join('-');
  const today=new Date(),yesterday=new Date(today.getFullYear(),today.getMonth(),today.getDate()-1);
  let lastDay='';
  for(const e of selected.slice(0,Math.min(visibleCount,40))){
   const date=e.at?new Date(e.at):null;
   const valid=date&&!Number.isNaN(date.getTime());
   const day=valid?dateKey(date):'unknown';
   if(day!==lastDay){
    const group=document.createElement('p');group.className='sah-date-heading';
    group.textContent=!valid?'Без даты':day===dateKey(today)?'Сегодня':day===dateKey(yesterday)?'Вчера':date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
    list.append(group);lastDay=day;
   }
   const item=document.createElement('div');item.className='sah-row';item.dataset.state=stateOf(e.to);
   const name=document.createElement('strong');name.textContent=e.title||({mail:'Письмо',work:'Рабочее сообщение',contract:'Документ'}[e.cardType]||'Действие Сэйви');
   const line=document.createElement('small');line.textContent=(statuses[e.to]||e.to||'Событие')+' · '+(valid?date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'время не указано');
   const status=document.createElement('span');status.className='sah-state';status.dataset.state=stateOf(e.to);status.textContent=statuses[e.to]||e.to||'Событие';
   line.textContent=valid?date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'время не указано';
   const meta=document.createElement('div');
   meta.className='sah-row-meta';
   meta.append(status,line);
   item.append(name,meta);
   if(e.taskId){
    const recover=document.createElement('button');recover.type='button';recover.className='sah-restore-task';
    recover.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 4 12l5 5M4 12h10a6 6 0 0 1 6 6"/></svg>';
    recover.title='Вернуть в дела';
    recover.setAttribute('aria-label','Вернуть в дела: '+e.title);
    recover.addEventListener('click',()=>{
     const ok=window.SEYVEO_PERSONAL_TASK_HISTORY?.restore?.(e.taskId);
     if(ok)render();else {recover.setAttribute('aria-label','Не удалось восстановить дело');recover.title='Не удалось восстановить';}
    });
    item.append(recover);
   }
   if(studio){const tech=document.createElement('small');tech.className='sah-studio';tech.textContent=(e.from||'—')+' → '+(e.to||'—')+' · '+e.eventId+(e.reason?' · '+e.reason:'');item.append(tech);}
   list.append(item);
  }
  more.hidden=selected.length<=visibleCount;
  if(!more.hidden)more.textContent='Показать ещё · '+Math.min(4,selected.length-visibleCount);
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
 fallbackSearch.addEventListener('click',toggleSearch);
 window.addEventListener('seyveo:history-search-toggle',toggleSearch);
 search.addEventListener('input',()=>{visibleCount=4;render();});
 more.addEventListener('click',()=>{visibleCount=Math.min(visibleCount+4,40);render();});
 const page=document.getElementById('tasksPage');
 const scroller=document.querySelector('.app');
 let previousScroll=0;
 const toggle=(show,{restoreFocus=true,restoreScroll=true}={})=>{
  if(show===!panel.hidden)return;
  if(show&&(page?.hidden||location.hash!=='#tasks'))return;
  if(show)previousScroll=scroller?.scrollTop||0;
  panel.hidden=!show;
  page?.classList.toggle('sah-history-open',show);
  open.setAttribute('aria-expanded',String(show));
  if(show){
   searchOpen=false;search.value='';visibleCount=4;render();
   if(scroller)scroller.scrollTop=0;
   requestAnimationFrame(()=>back.focus({preventScroll:true}));
  }else{
   searchOpen=false;search.value='';search.hidden=true;
   fallbackSearch.setAttribute('aria-expanded','false');
   requestAnimationFrame(()=>{
    if(restoreScroll&&scroller)scroller.scrollTop=previousScroll;
    if(restoreFocus&&open.isConnected&&!open.closest('[hidden]'))open.focus({preventScroll:true});
   });
  }
 };
 open.addEventListener('click',()=>toggle(true));
 back.addEventListener('click',()=>toggle(false));
 panel.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();toggle(false)}
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
