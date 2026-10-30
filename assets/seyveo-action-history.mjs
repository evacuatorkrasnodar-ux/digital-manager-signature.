/* History belongs in Дела > Мои дела. No floating launch control. */
const personal=document.getElementById('unifiedPersonalTasksView');
const head=personal?.querySelector('.personal-tasks-head');
if(personal&&head){
 const style=document.createElement('style');
 style.textContent=`
.sah-inline-toggle{margin-left:auto;border:1px solid var(--soft-line,#526b60);background:transparent;color:var(--text,#fff);border-radius:99px;padding:6px 11px;font:inherit;font-size:12px;min-height:38px;cursor:pointer}
.sah-inline-panel{margin-top:12px;border:1px solid var(--soft-line,#526b60);border-radius:18px;padding:14px;background:var(--card2,transparent);color:var(--text,#fff)}
.sah-inline-panel[hidden]{display:none!important}.sah-inline-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.sah-inline-head h3{font-size:16px;margin:0}.sah-inline-head button{border:0;background:transparent;color:inherit;font:inherit;padding:8px}
.sah-search{display:block;width:100%;box-sizing:border-box;margin:9px 0 6px;padding:10px 12px;border:1px solid var(--soft-line,#526b60);border-radius:12px;background:transparent;color:var(--text,#fff);font:inherit;font-size:14px;outline-offset:2px}.sah-inline-note{font-size:12px;opacity:.7;line-height:1.5}.sah-date-heading{margin:14px 0 3px;font-size:11px;font-weight:650;letter-spacing:.045em;color:var(--secondary,#a5b3ab)}.sah-row{padding:11px 0;border-top:1px solid var(--soft-line,#526b60);font-size:13px}
.sah-row small{display:block;opacity:.75;margin-top:3px}.sah-studio{font-size:11px;opacity:.75;overflow-wrap:anywhere}
`;
 document.head.append(style);
 const open=document.createElement('button');open.type='button';open.className='sah-inline-toggle';open.textContent='История';open.setAttribute('aria-expanded','false');
 const panel=document.createElement('section');panel.className='sah-inline-panel';panel.hidden=true;panel.setAttribute('aria-label','История действий Сэйви');
 const heading=document.createElement('div');heading.className='sah-inline-head';
 const title=document.createElement('h3');title.textContent='История действий';
 const close=document.createElement('button');close.type='button';close.textContent='Закрыть';
 heading.append(title,close);
 const note=document.createElement('p');note.className='sah-inline-note';note.textContent='Выполненные и отложенные действия. Сейчас доступны только события демонстрационного движка в этой открытой странице.';
 const search=document.createElement('input');search.type='search';search.className='sah-search';search.placeholder='Поиск по имени, делу или дате';search.setAttribute('aria-label','Поиск в истории действий');
 const list=document.createElement('div');panel.append(heading,note,search,list);
 head.append(open);
 personal.append(panel);
 const studio=new URLSearchParams(location.search).has('seyveoStudio');
 let visibleCount=4;
 const more=document.createElement('button');more.type='button';more.className='sah-inline-toggle';more.style.marginTop='10px';more.hidden=true;more.textContent='Показать ещё';panel.append(more);
 const statuses={shown:'Показано',deferred:'Отложено',action_pending:'Ожидает действия',executing:'Выполняется',succeeded:'Выполнено',archived:'В архиве',failed:'Ошибка',canceled:'Отменено',expired:'Истекло'};
 function render(){
  list.replaceChildren();
  const api=window.SEYVEO_CARD_LIFECYCLE;
  const cards=api?.archive?.()||[];
  const events=api?.history?.()||[];
  if(!cards.length&&!events.length){const p=document.createElement('p');p.className='sah-inline-note';p.textContent='Пока нет действий в истории.';list.append(p);return;}
  // Ordinary users see one latest outcome per card; developer mode shows its full trace.
  const base=studio?events:events.filter((e,i,all)=>all.findIndex(x=>x.eventId===e.eventId)===i);
  const q=search.value.trim().toLocaleLowerCase('ru-RU');
  const selected=q?base.filter(e=>{
   const d=e.at?new Date(e.at):null;
   const date=d&&!Number.isNaN(d.getTime())?d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
   const parts=[e.title,e.cardType,e.reason,e.eventId,statuses[e.to],date,d?d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}):''];
   return parts.some(value=>String(value||'').toLocaleLowerCase('ru-RU').includes(q));
  }):base;
  if(!selected.length){const empty=document.createElement('p');empty.className='sah-inline-note';empty.textContent='Ничего не найдено';list.append(empty);more.hidden=true;return;}
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
   const item=document.createElement('div');item.className='sah-row';
   const name=document.createElement('strong');name.textContent=e.title||({mail:'Письмо',work:'Рабочее сообщение',contract:'Документ'}[e.cardType]||'Действие Сэйви');
   const line=document.createElement('small');line.textContent=(statuses[e.to]||e.to||'Событие')+' · '+(valid?date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'время не указано');
   item.append(name,line);
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
 close.addEventListener('click',()=>toggle(false));
 window.addEventListener('seyveo:cards-changed',()=>{if(!panel.hidden)render()});
}
