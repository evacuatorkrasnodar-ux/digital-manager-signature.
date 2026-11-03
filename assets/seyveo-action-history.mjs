import './seyveo-history-recovery.mjs';
/* History belongs in Дела > Мои дела. No floating launch control. */
const personal=document.getElementById('unifiedPersonalTasksView');
const head=personal?.querySelector('.personal-tasks-head');
if(personal&&head){
 const style=document.createElement('style');
 style.textContent=`
/* History is a continuation of the Tasks list, never a raised second card. */
.sah-inline-toggle{
 display:inline-flex;align-items:center;justify-content:center;
 margin-left:auto;min-height:44px;padding:8px 12px;
 border:0;border-radius:12px;background:transparent;
 color:var(--secondary);font:inherit;font-size:12.5px;font-weight:500;
 cursor:pointer;touch-action:manipulation;
}
.sah-inline-toggle[aria-expanded="true"]{color:var(--text)}
.sah-inline-toggle:focus-visible,
.sah-inline-head button:focus-visible,.sah-search:focus-visible{
 outline:2px solid var(--text);outline-offset:2px
}
.sah-inline-panel{
 margin:17px 0 4px;padding:15px 4px 0;
 border:0;border-top:1px solid var(--soft-line);
 border-radius:0;background:transparent;color:var(--text);
 box-shadow:none;min-width:0;
}
.sah-inline-panel[hidden],.sah-search[hidden],.sah-inline-toggle[hidden]{display:none!important}
.sah-inline-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.sah-inline-head h3{
 margin:0;font-size:17px;font-weight:570;line-height:1.3;
 letter-spacing:-.02em
}
.sah-inline-head button{
 display:grid;place-items:center;flex:none;width:44px;height:44px;
 padding:0;border:0;border-radius:50%;background:transparent;
 color:var(--secondary);cursor:pointer
}
.sah-inline-head button:active{background:var(--seyveo-hdr-active)}
.sah-inline-head button svg{
 display:block;width:18px;height:18px;fill:none;stroke:currentColor;
 stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round
}
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
.sah-row small{display:inline-block;color:var(--secondary);font-size:12px;margin:6px 0 0 10px}
.sah-state{display:inline-block;margin-top:6px;font-size:12px;font-weight:530;color:var(--secondary)}
.sah-state[data-state=failed]{color:#e8a18d}
.sah-state[data-state=pending]{color:var(--secondary)}
.sah-state[data-state=done]{color:var(--secondary)}
.sah-studio{display:block!important;margin:6px 0 0!important;font-size:11px;opacity:.75;overflow-wrap:anywhere}
.sah-inline-panel>.sah-inline-toggle{margin:11px 0 2px;padding-inline:0;color:var(--text)}
`;
 document.head.append(style);
 const open=document.createElement('button');open.type='button';open.className='sah-inline-toggle';open.textContent='История';open.setAttribute('aria-expanded','false');
 const panel=document.createElement('section');panel.className='sah-inline-panel';panel.id='seyveoActionHistoryPanel';panel.hidden=true;panel.setAttribute('aria-label','История действий Сэйви');
 open.setAttribute('aria-controls',panel.id);
 const heading=document.createElement('div');heading.className='sah-inline-head';
 const title=document.createElement('h3');title.textContent='История действий';title.id='seyveoActionHistoryTitle';
 panel.setAttribute('aria-labelledby',title.id);
 const close=document.createElement('button');close.type='button';close.setAttribute('aria-label','Закрыть историю');close.title='Закрыть';
 const closeSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');closeSvg.setAttribute('viewBox','0 0 24 24');closeSvg.setAttribute('aria-hidden','true');
 const closePath=document.createElementNS('http://www.w3.org/2000/svg','path');closePath.setAttribute('d','M18 6 6 18M6 6l12 12');closeSvg.append(closePath);close.append(closeSvg);
 heading.append(title,close);
 const search=document.createElement('input');search.type='search';search.className='sah-search';search.placeholder='Поиск по имени, делу или дате';search.setAttribute('aria-label','Поиск в истории действий');
 search.hidden=true;
 const list=document.createElement('div');panel.append(heading,search,list);
 head.append(open);
 personal.append(panel);
 const studio=new URLSearchParams(location.search).has('seyveoStudio');
 let visibleCount=4;
 const more=document.createElement('button');more.type='button';more.className='sah-inline-toggle';more.style.marginTop='10px';more.hidden=true;more.textContent='Показать ещё';panel.append(more);
 const stateOf=v=>v==='failed'?'failed':['shown','deferred','action_pending','executing'].includes(v)?'pending':['succeeded','archived'].includes(v)?'done':'other';
 const statuses={shown:'Не завершено',deferred:'Отложено',action_pending:'Ожидает действия',executing:'Выполняется',succeeded:'Выполнено',archived:'В архиве',failed:'Ошибка',canceled:'Отменено',expired:'Истекло'};
 function render(){
  list.replaceChildren();
  const api=window.SEYVEO_CARD_LIFECYCLE;
  const events=api?.history?.()||[];
  more.hidden=true;
  search.hidden=events.length<5&&!search.value.trim();
  if(!events.length){
   const p=document.createElement('p');p.className='sah-inline-note';
   p.textContent='Пока нет записанных событий карточек. После подтверждённого действия оно появится здесь.';
   list.append(p);return;
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
   item.append(name,status,line);
   if(studio){const tech=document.createElement('small');tech.className='sah-studio';tech.textContent=(e.from||'—')+' → '+(e.to||'—')+' · '+e.eventId+(e.reason?' · '+e.reason:'');item.append(tech);}
   list.append(item);
  }
  more.hidden=selected.length<=visibleCount;
  if(!more.hidden)more.textContent='Показать ещё · '+Math.min(4,selected.length-visibleCount);
 }
 search.addEventListener('input',()=>{visibleCount=4;render();});
 more.addEventListener('click',()=>{visibleCount=Math.min(visibleCount+4,40);render();});
 const toggle=show=>{panel.hidden=!show;open.setAttribute('aria-expanded',String(show));if(show){visibleCount=4;render();}};
 open.addEventListener('click',()=>toggle(panel.hidden));
 close.addEventListener('click',()=>{toggle(false);open.focus({preventScroll:true})});
 panel.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();toggle(false);open.focus({preventScroll:true})}
 });
 window.addEventListener('seyveo:cards-changed',()=>{if(!panel.hidden)render()});
}
