/* Shared SEYVEO document selectors; no native select/date popups. */
(()=>{
'use strict';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const glyph=(paths)=>{const n=el('span','sv-doc-picker-icon');n.setAttribute('aria-hidden','true');n.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';return n;};
const arrow='<path d="m9 5 7 7-7 7"/>';
const cal='<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 10h16M8 14h1m3 0h1m3 0h1M8 17h1m3 0h1"/>';
function btn(text,cls,fn){const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n;}
function backButton(fn){const n=btn('','sv-doc-picker-round',fn);n.setAttribute('aria-label','Назад');n.append(glyph('<path d="m14 5-7 7 7 7"/>'));return n;}
function sheet(trigger,title,{bottom=true}={}){
 const d=el('dialog','sv-doc-picker-sheet'),h=el('header','sv-doc-picker-head'),body=el('div','sv-doc-picker-body');
 h.append(backButton(()=>d.close()),el('strong','',title));
 if(bottom){
  d.classList.add('sv-doc-picker-bottom');
  const grip=el('div','sv-doc-picker-grip');grip.setAttribute('aria-hidden','true');
  h.prepend(grip);
  window.SEYVEO_SHEET_NAVIGATION?.attach(h,null,()=>d.close());
 }
 d.append(h,body);
 (trigger.closest('dialog')||trigger.parentElement).append(d);
 trigger.setAttribute('aria-expanded','true');
 d.addEventListener('close',()=>{d.remove();trigger.setAttribute('aria-expanded','false');if(trigger.isConnected&&trigger.closest('dialog')?.open)trigger.focus({preventScroll:true});},{once:true});
 d.showModal();return {d,body};
}
function control(label,placeholder,icon,open){
 let value='',display='';
 const b=btn('','sv-doc-picker-trigger',()=>open(b));
 const text=el('span','sv-doc-picker-value');b.append(text,glyph(icon));b.setAttribute('aria-label',label);b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');
 function sync(){text.textContent=display||placeholder;b.classList.toggle('is-empty',!value);b.setAttribute('aria-label',label+': '+(display||placeholder));}
 b.setValue=(v,t,notify=false)=>{value=String(v??'');display=t===undefined?value:String(t);sync();if(notify)b.dispatchEvent(new Event('change',{bubbles:true}));};
 Object.defineProperty(b,'value',{get:()=>value,set:v=>b.setValue(v)});
 sync();return b;
}
function choice(label,values,initial='',placeholder='Выбрать'){
 let options=values.map(([v,t])=>[String(v),String(t)]);
 const b=control(label,placeholder,arrow,trigger=>{
  const {d,body}=sheet(trigger,label);
  if(window.SEYVEO_WHEEL&&/^(Год|Месяц|Квартал)$/i.test(label)&&options.length){
   d.classList.add('sv-wheel-sheet');
   const node=el('div','');node.setAttribute('aria-label',label);body.append(node);
   const wheel=window.SEYVEO_WHEEL.mount(node,options.map(([value,label])=>({value,label})),trigger.value);
   const done=btn('','sv-doc-picker-round sv-wheel-done',()=>{const entry=options.find(x=>x[0]===wheel.value);if(entry)trigger.setValue(entry[0],entry[1],true);d.close();});
   done.setAttribute('aria-label','Готово');done.append(glyph('<path d="m5 12 4 4 10-10"/>'));d.querySelector('header').append(done);
   body.append(window.SEYVEO_WHEEL.feedbackButton());return;
  }
  for(const [v,t] of options){
   const item=btn('','sv-doc-picker-option',()=>{trigger.setValue(v,t,true);d.close();});
   item.append(el('span','',t));
   if(v===trigger.value){item.classList.add('is-current');item.append(glyph('<path d="m5 12 4 4 10-10"/>'));}
   body.append(item);
  }
 });
 b.setChoices=(next,v='')=>{options=next.map(([id,t])=>[String(id),String(t)]);const entry=options.find(x=>x[0]===String(v))||options[0];b.setValue(entry?.[0]||'',entry?.[1]||'');};
 b.setChoices(values,initial);return b;
}
const pad=n=>String(n).padStart(2,'0');
const iso=(y,m,d)=>String(y).padStart(4,'0')+'-'+pad(m+1)+'-'+pad(d);
const today=()=>{const n=new Date();return iso(n.getFullYear(),n.getMonth(),n.getDate());};
function dateLabel(v){return /^\d{4}-\d{2}-\d{2}$/.test(v)?v.split('-').reverse().join('.'):'';}
function date(label,initial='',placeholder='Выбрать дату',scope='personal'){
 const b=control(label,placeholder,cal,trigger=>{
  const {d,body}=sheet(trigger,label,{bottom:true});d.classList.add('sv-date-only-sheet');
  const now=new Date(),chosen=trigger.value||today(),parts=chosen.split('-').map(Number);
  let year=parts[0],month=parts[1]-1,selection=trigger.value||'',agendaDate=chosen;
  const nav=el('div','sv-doc-picker-cal-nav sv-month-nav'),grid=el('div','sv-doc-picker-cal-grid'),title=el('button','sv-doc-picker-month sv-month-name');title.type='button';
  const move=delta=>{const next=new Date(year,month+delta,1);year=next.getFullYear();month=next.getMonth();paint();};
  const prev=btn('','sv-doc-picker-round',()=>move(-1)),next=btn('','sv-doc-picker-round',()=>move(1));prev.append(glyph('<path d="m14 5-7 7 7 7"/>'));next.append(glyph(arrow));prev.setAttribute('aria-label','Предыдущий месяц');next.setAttribute('aria-label','Следующий месяц');
  const week=el('div','sv-doc-picker-cal-grid');
  for(const name of ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'])week.append(el('span','sv-doc-picker-weekday',name));
  const agenda=el('div','sv-doc-picker-agenda');
  const controls=el('div','sv-month-controls');controls.setAttribute('role','group');controls.setAttribute('aria-label','Переключение месяца');controls.append(prev,next);
   nav.append(title,controls);body.append(nav,week,grid,agenda);
  function paint(){
   window.SEYVEO_SHARED_DATE_CALENDAR.render(new Date(year,month,1),{value:selection},title,grid,{scope,dayClass:'sv-doc-picker-day',selectedClass:'is-current',onSelect:value=>{selection=value;agendaDate=value;paint();}});
   const entries=window.SEYVEO_CALENDAR_PICKER_DATA?.day(agendaDate,scope)||[];
   agenda.replaceChildren(el('strong','',dateLabel(agendaDate)));
   if(!entries.length){agenda.append(el('small','','На этот день нет запланированных дел.'));return;}
   const list=el('div','sv-doc-picker-agenda-list');list.tabIndex=0;list.setAttribute('role','region');list.setAttribute('aria-label','Дела выбранного дня');
   for(const item of entries){
    const row=el('div','sv-doc-picker-agenda-row'),dot=el('i','');dot.style.backgroundColor=item.color;
    row.append(dot,el('span','',item.title),el('small','',item.time));list.append(row);
   }
   agenda.append(list);
  }
  title.addEventListener('click',()=>{
   const years=choice('Год',Array.from({length:131},(_,i)=>[String(now.getFullYear()+20-i),String(now.getFullYear()+20-i)]),String(year));
   const months=choice('Месяц',Array.from({length:12},(_,i)=>[String(i),new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(new Date(2026,i,1))]),String(month));
   const pane=el('div','sv-doc-picker-period');pane.append(years,months,btn('Выбрать месяц','sv-doc-picker-option',()=>{year=Number(years.value);month=Number(months.value);pane.remove();nav.hidden=false;grid.hidden=false;week.hidden=false;agenda.hidden=false;d.querySelector('.sv-doc-picker-date-footer').hidden=false;paint();}));nav.hidden=true;grid.hidden=true;week.hidden=true;agenda.hidden=true;d.querySelector('.sv-doc-picker-date-footer').hidden=true;body.prepend(pane);
  });
  const actions=el('div','sv-doc-picker-date-actions');actions.append(btn('Сегодня','sv-doc-picker-link',()=>{selection=today();agendaDate=selection;const n=new Date();year=n.getFullYear();month=n.getMonth();paint();}),btn('Очистить','sv-doc-picker-link',()=>{trigger.setValue('','',true);d.close();}));
  const footer=el('footer','sv-doc-picker-date-footer');footer.append(actions,btn('Готово','sv-doc-picker-option sv-doc-picker-done',()=>{const value=selection||agendaDate;trigger.setValue(value,dateLabel(value),true);d.close();}));d.append(footer);paint();
 });
 b.setValue(initial,dateLabel(initial));return b;
}
function period(label,kind,scope='personal'){
 if(kind==='date')return date(label,'','Выбрать дату',scope);
 const b=control(label,'Выбрать период',arrow,trigger=>{
  const {d,body}=sheet(trigger,label),y=new Date().getFullYear(),years=Array.from({length:31},(_,i)=>[String(y+5-i),String(y+5-i)]);
  if(window.SEYVEO_WHEEL){
   d.classList.add('sv-wheel-sheet');
   const old=trigger.value,initialYear=old.match(/\b\d{4}\b/)?.[0]||String(kind==='year'?y-1:y);
   const names=Array.from({length:12},(_,i)=>new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(new Date(2026,i,1)));
   const initialType=/квартал/.test(old)?'quarter':names.some(n=>old.startsWith(n+' '))?'month':'year';
   const mode=kind==='report'?choice('Вид периода',[['year','Год'],['quarter','Квартал'],['month','Месяц']],initialType):null;
   if(mode)body.append(mode);
   const group=el('div','sv-wheel-group'),yearNode=el('div',''),quarterNode=el('div',''),monthNode=el('div','');
   yearNode.setAttribute('aria-label','Год');quarterNode.setAttribute('aria-label','Квартал');monthNode.setAttribute('aria-label','Месяц');
   group.append(quarterNode,monthNode,yearNode);body.append(group);
   const year=window.SEYVEO_WHEEL.mount(yearNode,years.slice().reverse().map(([value,label])=>({value,label})),initialYear);
   const quarter=window.SEYVEO_WHEEL.mount(quarterNode,[1,2,3,4].map(value=>({value,label:value+' квартал'})),Number(old.match(/^(\d) квартал/)?.[1]||1));
   const month=window.SEYVEO_WHEEL.mount(monthNode,names.map((label,value)=>({value,label})),Math.max(0,names.findIndex(n=>old.startsWith(n+' '))));
   const sync=()=>{const type=mode?.value||kind;quarterNode.hidden=type!=='quarter';monthNode.hidden=type!=='month';requestAnimationFrame(()=>{if(d.open){year.center();quarter.center();month.center();}});};
   mode?.addEventListener('change',sync);sync();
   const done=btn('','sv-doc-picker-round sv-wheel-done',()=>{const type=mode?.value||kind,v=type==='quarter'?quarter.value+' квартал '+year.value:type==='month'?names[month.value]+' '+year.value:year.value;trigger.setValue(v,v,true);d.close();});
   done.setAttribute('aria-label','Готово');done.append(glyph('<path d="m5 12 4 4 10-10"/>'));d.querySelector('header').append(done);
   body.append(window.SEYVEO_WHEEL.feedbackButton());return;
  }
  const old=trigger.value.match(/\b\d{4}\b/)?.[0]||String(kind==='year'?y-1:y);
  const year=choice('Год',years,old),mode=kind==='report'?choice('Вид периода',[['year','Год'],['quarter','Квартал'],['month','Месяц']],'year'):null;
  const q=choice('Квартал',[1,2,3,4].map(n=>[String(n),n+' квартал']),'1');
  const months=Array.from({length:12},(_,i)=>[String(i),new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(new Date(2026,i,1))]);
  const m=choice('Месяц',months,'0');
  function sync(){q.hidden=(mode?.value||kind)!=='quarter';m.hidden=(mode?.value||kind)!=='month';}
  if(mode){body.append(mode);mode.addEventListener('change',sync);}
  body.append(year,q,m,btn('Готово','sv-doc-picker-option sv-doc-picker-done',()=>{const type=mode?.value||kind,v=type==='quarter'?q.value+' квартал '+year.value:type==='month'?months[Number(m.value)][1]+' '+year.value:year.value;trigger.setValue(v,v,true);d.close();}));sync();
 });return b;
}
window.SEYVEO_DOCUMENT_PICKERS=Object.freeze({choice,date,period,backButton});
})();