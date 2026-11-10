/* SEYVEO · premium date and time picker inside the existing calendar editor.
   Native input values and calendar saving remain the single source of truth. */
(()=>{
'use strict';
// Phone navigation is device-specific, never based on a narrow Windows window.
const ua=navigator.userAgent||'';
const phoneNavigation=Boolean(navigator.userAgentData?.mobile)
 || /iPhone|iPod|Windows Phone/i.test(ua)
 || /Android[^)]*Mobile/i.test(ua)
 || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1
     && Math.min(screen.width,screen.height)<700);
document.documentElement.classList.toggle('sv-phone-navigation',phoneNavigation);
const $=id=>document.getElementById(id);
const dialog=$('calendarEventDialog'),date=$('calendarEventDate'),time=$('calendarEventTime');
const dateControl=date?.closest('.cal-date-control'),timeControl=time?.closest('.cal-time-control');
const row=dialog?.querySelector('.cal-form-columns');
if(!dialog||!date||!time||!dateControl||!timeControl||!row)return;
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=value=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const [y,m,d]=value.split('-').map(Number),x=new Date(y,m-1,d);
 return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d?x:null;
};
function makeButton(el,aria,id){
 const b=document.createElement('button');
 b.id=id;b.type='button';b.className='cal-picker-trigger';b.hidden=true;
 b.setAttribute('aria-label',aria);b.setAttribute('aria-expanded','false');
 b.setAttribute('aria-controls','seyveoEventPicker');
 el.append(b);return b;
}
const dateButton=makeButton(dateControl,'Открыть календарь','seyveoEventDateTrigger');
const timeButton=makeButton(timeControl,'Выбрать часы и минуты','seyveoEventTimeTrigger');
const panel=document.createElement('section');
panel.id='seyveoEventPicker';panel.className='cal-premium-picker';panel.hidden=true;
panel.setAttribute('aria-label','Выбор даты и времени');
panel.innerHTML=[
 '<section id="seyveoPickDate" class="cal-pick-date" aria-label="Календарь" hidden>',
 '<div class="cal-pick-head"><strong id="seyveoPickMonth"></strong>',
 '<div class="cal-pick-arrows"><button type="button" id="seyveoPickPrev" aria-label="Предыдущий месяц">‹</button>',
 '<button type="button" id="seyveoPickNext" aria-label="Следующий месяц">›</button></div></div>',
 '<div class="cal-pick-week" aria-hidden="true"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>',
 '<div id="seyveoPickDays" class="cal-pick-days" role="group" aria-label="Числа месяца"></div>',
 '<div class="cal-pick-date-actions"><button type="button" class="cal-pick-today" id="seyveoPickToday">Сегодня</button>',
 '<button type="button" class="cal-pick-date-close" id="seyveoPickDateClose" aria-label="Свернуть календарь"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5.5 9 6.5 6.5L18.5 9"/></svg></button></div></section>',
 '<section id="seyveoPickTime" class="cal-pick-time" aria-label="Выбор времени" hidden>',
 '<div class="cal-pick-time-head"><strong>Время</strong><small>Часы и минуты</small></div>',
 '<div class="cal-pick-wheels">',
 '<div class="cal-pick-wheel-column"><span class="cal-pick-wheel-title">Часы</span><div class="cal-pick-wheel" id="seyveoPickHours" role="group" aria-label="Часы"></div></div>',
 '<span class="cal-pick-colon" aria-hidden="true">:</span>',
 '<div class="cal-pick-wheel-column"><span class="cal-pick-wheel-title">Минуты</span><div class="cal-pick-wheel" id="seyveoPickMinutes" role="group" aria-label="Минуты"></div></div></div>',
 '<div class="cal-pick-time-actions"><button type="button" class="cal-pick-time-clear" id="seyveoPickNoTime">Без времени</button>',
 '<button type="button" class="cal-pick-time-done" id="seyveoPickDone">Выбрать время</button></div></section>'
].join('');
row.insertAdjacentElement('afterend',panel);
const datePanel=$('seyveoPickDate'),timePanel=$('seyveoPickTime'),days=$('seyveoPickDays');
const hourWheel=$('seyveoPickHours'),minuteWheel=$('seyveoPickMinutes');
const monthLabel=$('seyveoPickMonth');
const monthFormatter=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'});
const dayFormatter=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'});
let month=new Date(),hour=12,minute=0;
const isOpen=()=>!panel.hidden;
function close(){
 panel.hidden=true;datePanel.hidden=true;timePanel.hidden=true;panel.dataset.mode='';
 dateButton.setAttribute('aria-expanded','false');
 timeButton.setAttribute('aria-expanded','false');
}
function commitDate(d){
 date.value=iso(d);
 date.dispatchEvent(new Event('input',{bubbles:true}));
 date.dispatchEvent(new Event('change',{bubbles:true}));
 close();dateButton.focus({preventScroll:true});
}
/* One calendar renderer for all SEYVEO task/event date inputs. */
function renderDateCalendar(forMonth,input,heading,grid){
 const y=forMonth.getFullYear(),m=forMonth.getMonth();
 const label=monthFormatter.format(forMonth);
 heading.textContent=label.charAt(0).toUpperCase()+label.slice(1);
 const start=(new Date(y,m,1).getDay()+6)%7;
 const monthDays=new Date(y,m+1,0).getDate();
 const count=Math.ceil((start+monthDays)/7)*7;
 const now=iso(new Date()),selected=input.value;
 const fragment=document.createDocumentFragment();
 for(let i=0;i<count;i++){
  const n=i-start+1;
  if(n<1||n>monthDays){
   const blank=document.createElement('span');blank.className='cal-pick-empty';
   blank.setAttribute('aria-hidden','true');fragment.append(blank);continue;
  }
  const d=new Date(y,m,n),key=iso(d),b=document.createElement('button');
  b.type='button';b.className='cal-pick-day';b.textContent=String(n);
  b.dataset.calPickDay=key;b.setAttribute('aria-label',dayFormatter.format(d));
  if(key===selected){b.classList.add('is-selected');b.setAttribute('aria-pressed','true')}
  if(key===now)b.classList.add('is-today');
  fragment.append(b);
 }
 grid.replaceChildren(fragment);
}
function renderMonth(){renderDateCalendar(month,date,monthLabel,days)}
function renderWheel(wheel,total,kind){
 const fragment=document.createDocumentFragment();
 for(let i=0;i<total;i++){
  const b=document.createElement('button');b.type='button';
  b.className='cal-pick-wheel-option';b.textContent=pad(i);
  b.dataset.wheelIndex=String(i);b.dataset.wheelKind=kind;
  b.setAttribute('aria-label',(kind==='hour'?'Час ':'Минута ')+pad(i));
  fragment.append(b);
 }
 wheel.replaceChildren(fragment);
}
renderWheel(hourWheel,24,'hour');renderWheel(minuteWheel,60,'minute');
function wheelPaint(wheel,index){
 for(const b of wheel.children){
  const active=Number(b.dataset.wheelIndex)===index;
  b.classList.toggle('is-selected',active);
  b.setAttribute('aria-pressed',String(active));
 }
}
function wheelMove(wheel,index){
 const n=Math.max(0,Math.min(wheel.children.length-1,index));
 wheel.scrollTop=n*44;wheelPaint(wheel,n);
}
for(const [wheel,kind] of [[hourWheel,'hour'],[minuteWheel,'minute']]){
 let timer;
 wheel.addEventListener('scroll',()=>{
  clearTimeout(timer);
  timer=setTimeout(()=>{
   if(!isOpen()||panel.dataset.mode!=='time')return;
   const n=Math.max(0,Math.min(wheel.children.length-1,Math.round(wheel.scrollTop/44)));
   if(kind==='hour')hour=n;else minute=n;
   wheelPaint(wheel,n);
  },90);
 },{passive:true});
 wheel.addEventListener('click',event=>{
  const b=event.target.closest('[data-wheel-index]');if(!b)return;
  const n=Number(b.dataset.wheelIndex);
  if(kind==='hour')hour=n;else minute=n;
  wheelMove(wheel,n);
 });
}
function open(which){
 if(!dialog.open)return;
 if(isOpen()&&panel.dataset.mode===which){close();return}
 // A date/time picker must not compete with the software keyboard on iPhone.
 const focused=document.activeElement;
 if(focused&&dialog.contains(focused)&&focused.matches('input,textarea'))focused.blur();
 panel.hidden=false;panel.dataset.mode=which;
 datePanel.hidden=which!=='date';timePanel.hidden=which!=='time';
 dateButton.setAttribute('aria-expanded',String(which==='date'));
 timeButton.setAttribute('aria-expanded',String(which==='time'));
 if(which==='date'){
  const d=parse(date.value)||new Date();
  month=new Date(d.getFullYear(),d.getMonth(),1);renderMonth();
 }else{
  const valid=/^([01]\d|2[0-3]):[0-5]\d$/.test(time.value),now=new Date();
  hour=valid?Number(time.value.slice(0,2)):now.getHours();
  minute=valid?Number(time.value.slice(3,5)):Math.round(now.getMinutes()/5)*5%60;
  requestAnimationFrame(()=>{
   if(!isOpen()||panel.dataset.mode!=='time')return;
   wheelMove(hourWheel,hour);wheelMove(minuteWheel,minute);
  });
 }
 const sheet=dialog.querySelector('.cal-event-sheet');
 requestAnimationFrame(()=>{
  if(!isOpen()||!sheet)return;
  const extra=panel.getBoundingClientRect().bottom-sheet.getBoundingClientRect().bottom+8;
  if(extra>0)sheet.scrollTop+=extra;
 });
}
dateButton.addEventListener('click',()=>open('date'));
timeButton.addEventListener('click',()=>open('time'));
$('seyveoPickPrev').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);renderMonth()});
$('seyveoPickNext').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);renderMonth()});
$('seyveoPickToday').addEventListener('click',()=>commitDate(new Date()));
$('seyveoPickDateClose').addEventListener('click',()=>{
 close();dateButton.focus({preventScroll:true});
});
days.addEventListener('click',event=>{
 const b=event.target.closest('[data-cal-pick-day]');
 const d=b?parse(b.dataset.calPickDay):null;
 if(d)commitDate(d);
});
$('seyveoPickDone').addEventListener('click',()=>{
 time.value=pad(hour)+':'+pad(minute);
 time.dispatchEvent(new Event('input',{bubbles:true}));
 time.dispatchEvent(new Event('change',{bubbles:true}));
 close();timeButton.focus({preventScroll:true});
});
$('seyveoPickNoTime').addEventListener('click',()=>{
 $('calendarClearTime').click();close();timeButton.focus({preventScroll:true});
});
dialog.addEventListener('click',event=>{
 if(!isOpen())return;
 if(panel.contains(event.target)||dateControl.contains(event.target)||timeControl.contains(event.target))return;
 if(event.target.closest?.('.cal-event-sheet'))close();
});
dialog.addEventListener('cancel',event=>{
 if(!isOpen())return;
 event.preventDefault();event.stopImmediatePropagation();close();
},true);
dialog.addEventListener('close',close);
date.tabIndex=-1;time.tabIndex=-1;
dateButton.hidden=false;timeButton.hidden=false;
dialog.classList.add('sv-custom-pickers-ready');

/* Reuse the exact same month grid, cells and calendar renderer for New Task.
   The form still owns its native date input and existing save/edit handlers.
   No extra task database, full-screen dialog, or dock is created. */
const taskDialog=$('personalTaskDialog'),taskDate=$('personalTaskDue');
const taskControl=taskDate?.closest('.personal-task-date-control');
if(taskDialog&&taskDate&&taskControl){
 const dueField=taskControl.closest('.personal-task-field');
 const picker=document.createElement('section');
 picker.id='seyveoTaskDuePicker';picker.className='cal-premium-picker';
 picker.hidden=true;picker.setAttribute('aria-label','Календарь срока дела');
 const grid=datePanel.cloneNode(true);
 grid.removeAttribute('id');grid.removeAttribute('hidden');
 grid.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
 picker.append(grid);
 if(dueField){
  // The date selection is a second stage of the SAME editor, not a panel
  // stacked beneath the Save/Cancel buttons. The form remains mounted.
  const taskSheet=taskDialog.querySelector('.personal-task-sheet');
  if(!taskSheet)return;
  const back=document.createElement('button');
  back.type='button';back.className='sv-task-date-back';
  back.setAttribute('aria-label','Вернуться к редактированию дела');
  const chevron=document.createElementNS('http://www.w3.org/2000/svg','svg');
  chevron.setAttribute('viewBox','0 0 24 24');chevron.setAttribute('aria-hidden','true');
  const arrow=document.createElementNS('http://www.w3.org/2000/svg','path');
  arrow.setAttribute('d','m14 5-7 7 7 7');chevron.append(arrow);
  back.append(chevron);
  const stageTitle=document.createElement('h2');
  stageTitle.className='sv-task-date-title';stageTitle.textContent='Выбрать срок';
  stageTitle.id='svTaskDateHeading';
  picker.setAttribute('aria-labelledby',stageTitle.id);
  // The date stage and the editor use the same one-line 54px header.
  const stageHeader=document.createElement('header');
  stageHeader.className='sv-task-page-header sv-task-date-header';
  const headerSpacer=document.createElement('span');
  headerSpacer.className='sv-task-header-spacer';
  headerSpacer.setAttribute('aria-hidden','true');
  stageHeader.append(back,stageTitle,headerSpacer);
  picker.prepend(stageHeader);
  taskSheet.append(picker);
  const heading=grid.querySelector('.cal-pick-head strong');
  const gridDays=grid.querySelector('.cal-pick-days');
  const arrows=grid.querySelectorAll('.cal-pick-arrows button');
  // The task editor uses the same thin navigation icon language as the dock.
  for(const [button,d] of [[arrows[0],'m14 5-7 7 7 7'],[arrows[1],'m10 5 7 7-7 7']]){
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
   svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
   const line=document.createElementNS('http://www.w3.org/2000/svg','path');
   line.setAttribute('d',d);svg.append(line);button.replaceChildren(svg);
  }
  // Task date is a nested stage: the single top chevron returns to the editor.
  // Drop the Event picker's duplicate "Закрыть" control from this clone.
  grid.querySelector('.cal-pick-date-close')?.remove();
  const today=grid.querySelector('.cal-pick-today');
  const clear=document.createElement('button');
  clear.type='button';clear.className='sv-task-date-clear';clear.textContent='Без даты';
  const quick=document.createElement('div');quick.className='sv-task-date-quick';
  today.replaceWith(quick);quick.append(today,clear);
  const taskTrigger=makeButton(taskControl,'Выбрать срок дела','seyveoTaskDueTrigger');
  taskTrigger.setAttribute('aria-controls',picker.id);
  let taskMonth=new Date();
  const closeTask=()=>{
   picker.hidden=true;
   taskDialog.classList.remove('sv-task-date-open');
   taskTrigger.setAttribute('aria-expanded','false');
   back.replaceChildren(chevron);
  };
  const openTask=()=>{
   if(!taskDialog.open)return;
   if(!picker.hidden){closeTask();return}
   const chosen=parse(taskDate.value)||new Date();
   taskMonth=new Date(chosen.getFullYear(),chosen.getMonth(),1);
   renderDateCalendar(taskMonth,taskDate,heading,gridDays);
   // Dismiss the keyboard before entering the date stage.
   if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
   back.replaceChildren(chevron);
   picker.hidden=false;
   taskDialog.classList.add('sv-task-date-open');
   taskTrigger.setAttribute('aria-expanded','true');
   const sheet=taskDialog.querySelector('.personal-task-sheet');
   if(sheet)sheet.scrollTop=0;
   requestAnimationFrame(()=>{if(!picker.hidden)back.focus({preventScroll:true})});
  };
  const pickTask=(d)=>{
   taskDate.value=iso(d);
   taskDate.dispatchEvent(new Event('input',{bubbles:true}));
   taskDate.dispatchEvent(new Event('change',{bubbles:true}));
   closeTask();
   taskTrigger.focus({preventScroll:true});
  };
  taskTrigger.addEventListener('click',openTask);
  const taskDateClose=grid.querySelector('.cal-pick-date-close');
  const returnToTask=()=>{
   closeTask();
   taskTrigger.focus({preventScroll:true});
  };
  back.addEventListener('click',returnToTask);
  // The date grid is cloned from Event: its Close button needs the Task handler.
  if(taskDateClose)taskDateClose.addEventListener('click',returnToTask);
  clear.addEventListener('click',()=>{
   taskDate.value='';
   taskDate.dispatchEvent(new Event('input',{bubbles:true}));
   taskDate.dispatchEvent(new Event('change',{bubbles:true}));
   closeTask();taskTrigger.focus({preventScroll:true});
  });
  taskDialog.addEventListener('seyveo:task-date-back',()=>{
   if(picker.hidden)return;
   closeTask();taskTrigger.focus({preventScroll:true});
  });
  arrows[0].addEventListener('click',()=>{
   taskMonth=new Date(taskMonth.getFullYear(),taskMonth.getMonth()-1,1);
   renderDateCalendar(taskMonth,taskDate,heading,gridDays);
  });
  arrows[1].addEventListener('click',()=>{
   taskMonth=new Date(taskMonth.getFullYear(),taskMonth.getMonth()+1,1);
   renderDateCalendar(taskMonth,taskDate,heading,gridDays);
  });
  today.addEventListener('click',()=>pickTask(new Date()));
  // Swipe months on touch phones, with click suppression after a swipe.
  // Fine-pointer desktop keeps the visible month arrows even in narrow windows.
  let touchStart=null,lastTaskSwipe=0;
  gridDays.addEventListener('touchstart',event=>{
   if(event.touches.length!==1){touchStart=null;return}
   const touch=event.touches[0];
   touchStart={x:touch.clientX,y:touch.clientY};
  },{passive:true});
  gridDays.addEventListener('touchcancel',()=>{touchStart=null},{passive:true});
  gridDays.addEventListener('touchend',event=>{
   if(!touchStart||!event.changedTouches.length)return;
   const touch=event.changedTouches[0],dx=touch.clientX-touchStart.x,dy=touch.clientY-touchStart.y;
   touchStart=null;
   if(Math.abs(dx)<42||Math.abs(dx)<Math.abs(dy)*1.35)return;
   lastTaskSwipe=Date.now();
   taskMonth=new Date(taskMonth.getFullYear(),taskMonth.getMonth()+(dx<0?1:-1),1);
   renderDateCalendar(taskMonth,taskDate,heading,gridDays);
  },{passive:true});
  gridDays.addEventListener('click',event=>{
   if(Date.now()-lastTaskSwipe<450)return;
   const button=event.target.closest('[data-cal-pick-day]');
   const selected=button?parse(button.dataset.calPickDay):null;
   if(selected)pickTask(selected);
  });
  taskDialog.addEventListener('click',event=>{
   if(picker.hidden||picker.contains(event.target)||taskControl.contains(event.target))return;
   if(event.target.closest?.('.personal-task-sheet'))closeTask();
  });
  taskDialog.addEventListener('cancel',event=>{
   if(picker.hidden)return;
   event.preventDefault();event.stopImmediatePropagation();closeTask();
  },true);
  taskDialog.addEventListener('close',closeTask);
  taskDate.tabIndex=-1;
  taskTrigger.hidden=false;
  taskDialog.classList.add('sv-custom-pickers-ready');
 }
}
})();

/* SEYVEO · shared rounded native-input replacement.
   Keep the existing input/select as the ONLY stored value; route supported
   system-square controls through a consistent accessible graphite dialog.
   Calendar event and task forms already have their own custom pickers. */
(()=>{
 'use strict';
 const CONFIG={
  pictureOperationDay:'Дата операции',
  svcpVacationEnd:'Окончание отпуска',
  svcpManagerDayStart:'Начало смены',
  svcpManagerDayEnd:'Окончание смены',
  svcpBreakAfter:'Начало перерыва',
  svcpBreakMinutes:'Длительность перерыва'
 };
 const fields=Object.entries(CONFIG).map(([id,title])=>({field:document.getElementById(id),title}))
  .filter(({field})=>field&&((field.tagName==='SELECT')||['date','time'].includes(field.type)));
 if(!fields.length||!HTMLDialogElement?.prototype?.showModal)return;
 const pad=n=>String(n).padStart(2,'0');
 const formatDate=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'});
 const monthFmt=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'});
 const toISO=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
 function parseDate(v){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return null;
  const [y,m,d]=v.split('-').map(Number),x=new Date(y,m-1,d);
  return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d?x:null;
 }
 const sheet=document.createElement('dialog');
 sheet.id='svStandardPickerDialog';sheet.className='sv-standard-picker-sheet';
 sheet.setAttribute('aria-labelledby','svStandardPickerTitle');
 sheet.innerHTML=[
  '<header class="sv-standard-picker-head">',
  '<button class="sv-standard-picker-back" type="button" aria-label="Назад"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg></button>',
  '<h2 id="svStandardPickerTitle"></h2></header>',
  '<div id="svStandardPickerBody" class="sv-standard-picker-body"></div>'
 ].join('');
 document.body.append(sheet);
 const title=document.getElementById('svStandardPickerTitle');
 const body=document.getElementById('svStandardPickerBody');
 const back=sheet.querySelector('.sv-standard-picker-back');
 let current=null,trigger=null,year=0,month=0,hour=0,minute=0,kind='';
 const buttons=new Map();
 function label(field){
  if(field.tagName==='SELECT')return field.selectedOptions[0]?.textContent?.trim()||'Выбрать';
  if(field.type==='date'){
   const d=parseDate(field.value);
   return d?formatDate.format(d):'Выбрать дату';
  }
  return /^\d\d:\d\d$/.test(field.value||'')?field.value:'Выбрать время';
 }
 function sync(field){const button=buttons.get(field);if(!button)return;
  button.querySelector('span').textContent=label(field);
  button.dataset.filled=String(Boolean(field.value));
 }
 function make(tag,cls,copy){const x=document.createElement(tag);if(cls)x.className=cls;if(copy!==undefined)x.textContent=copy;return x}
 function button(text,cls,action){
  const x=make('button',cls,text);x.type='button';x.addEventListener('click',action);return x;
 }
 function commit(value){
  if(!current)return;
  current.value=value;
  current.dispatchEvent(new Event('input',{bubbles:true}));
  current.dispatchEvent(new Event('change',{bubbles:true}));
  sync(current);sheet.close();
 }
 function close(){if(sheet.open)sheet.close()}
 back.addEventListener('click',close);
 sheet.addEventListener('click',e=>{if(e.target===sheet)close()});
 sheet.addEventListener('close',()=>{
  if(trigger){trigger.setAttribute('aria-expanded','false');trigger.focus({preventScroll:true})}
  current=null;trigger=null;body.replaceChildren();
 });
 function renderSelect(){
  const list=make('div','sv-standard-picker-choices');
  for(const option of current.options){
   if(option.disabled||option.hidden)continue;
   const row=button(option.textContent.trim(),'sv-standard-picker-option',()=>commit(option.value));
   row.setAttribute('aria-pressed',String(option.value===current.value));
   if(option.value===current.value){
    const mark=make('span','sv-standard-picker-check','✓');mark.setAttribute('aria-hidden','true');row.append(mark);
   }
   list.append(row);
  }
  body.append(list);
 }
 function renderDate(){
  const m=new Date(year,month,1),header=make('div','sv-standard-month');
  const previous=button('‹','sv-standard-month-arrow',()=>{month--;if(month<0){month=11;year--}render()});
  previous.setAttribute('aria-label','Предыдущий месяц');
  const name=make('strong',null,monthFmt.format(m));
  const next=button('›','sv-standard-month-arrow',()=>{month++;if(month>11){month=0;year++}render()});
  next.setAttribute('aria-label','Следующий месяц');
  header.append(previous,name,next);body.append(header);
  const week=make('div','sv-standard-picker-week');
  for(const day of ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'])week.append(make('span',null,day));
  body.append(week);
  const grid=make('div','sv-standard-picker-days');
  const offset=(m.getDay()+6)%7,days=new Date(year,month+1,0).getDate();
  for(let n=0;n<offset;n++)grid.append(make('span','sv-standard-picker-blank'));
  for(let n=1;n<=days;n++){
   const date=new Date(year,month,n),value=toISO(date);
   const inRange=(!current.min||value>=current.min)&&(!current.max||value<=current.max);
   const day=button(String(n),'sv-standard-picker-day',()=>commit(value));
   day.disabled=!inRange;day.setAttribute('aria-label',formatDate.format(date));
   if(value===current.value){day.classList.add('is-selected');day.setAttribute('aria-pressed','true')}
   if(value===toISO(new Date()))day.classList.add('is-today');
   grid.append(day);
  }
  body.append(grid);
  const actions=make('div','sv-standard-picker-actions');
  const today=toISO(new Date());
  if((!current.min||today>=current.min)&&(!current.max||today<=current.max))
   actions.append(button('Сегодня','sv-standard-picker-secondary',()=>commit(today)));
  if(!current.required)actions.append(button('Без даты','sv-standard-picker-secondary',()=>commit('')));
  if(actions.children.length)body.append(actions);
 }
 function paintTime(){
  body.querySelectorAll('[data-sv-picker-hour]').forEach(b=>b.classList.toggle('is-selected',Number(b.dataset.svPickerHour)===hour));
  body.querySelectorAll('[data-sv-picker-minute]').forEach(b=>b.classList.toggle('is-selected',Number(b.dataset.svPickerMinute)===minute));
  const preview=body.querySelector('.sv-standard-time-preview');
  if(preview)preview.textContent=pad(hour)+':'+pad(minute);
 }
 function renderTime(){
  const preview=make('div','sv-standard-time-preview');body.append(preview);
  const columns=make('div','sv-standard-time-columns');
  const hh=make('div','sv-standard-time-wheel'),mm=make('div','sv-standard-time-wheel');
  hh.setAttribute('aria-label','Часы');hh.setAttribute('role','group');
  mm.setAttribute('aria-label','Минуты');mm.setAttribute('role','group');
  for(let n=0;n<24;n++){
   const b=button(pad(n),'sv-standard-time-option',()=>{hour=n;paintTime()});
   b.dataset.svPickerHour=String(n);hh.append(b);
  }
  for(let n=0;n<60;n++){
   const b=button(pad(n),'sv-standard-time-option',()=>{minute=n;paintTime()});
   b.dataset.svPickerMinute=String(n);mm.append(b);
  }
  const hCol=make('section','sv-standard-time-column'),mCol=make('section','sv-standard-time-column');
  hCol.append(make('small',null,'Часы'),hh);mCol.append(make('small',null,'Минуты'),mm);
  columns.append(hCol,make('span','sv-standard-time-colon',':'),mCol);
  body.append(columns);paintTime();
  const done=button('Готово','sv-standard-picker-done',()=>commit(pad(hour)+':'+pad(minute)));
  body.append(done);
  requestAnimationFrame(()=>{
   if(!sheet.open||kind!=='time')return;
   hh.scrollTop=Math.max(0,hour*42-84);mm.scrollTop=Math.max(0,minute*42-84);
  });
 }
 function render(){if(!current)return;body.replaceChildren();
  if(kind==='select')renderSelect();
  else if(kind==='date')renderDate();
  else renderTime();
 }
 function open(field,launch,name){
  if(sheet.open)sheet.close();
  current=field;trigger=launch;title.textContent=name;
  kind=field.tagName==='SELECT'?'select':field.type;
  if(kind==='date'){
   const d=parseDate(field.value)||new Date();year=d.getFullYear();month=d.getMonth();
  }else if(kind==='time'){
   const value=/^\d\d:\d\d$/.test(field.value)?field.value:'09:00';
   hour=Math.min(23,Number(value.slice(0,2)));minute=Math.min(59,Number(value.slice(3,5)));
  }
  render();launch.setAttribute('aria-expanded','true');
  try{sheet.showModal()}catch{current=null;trigger=null;launch.setAttribute('aria-expanded','false')}
 }
 for(const {field,name,title:unused} of []){}
 for(const {field,title:fieldTitle} of fields){
  const launch=button('','sv-standard-picker-launch',()=>open(field,launch,fieldTitle));
  launch.setAttribute('aria-label',fieldTitle);
  launch.setAttribute('aria-expanded','false');
  launch.setAttribute('aria-haspopup','dialog');
  launch.setAttribute('aria-controls',sheet.id);
  const value=make('span','sv-standard-picker-value');
  const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');
  arrow.setAttribute('viewBox','0 0 24 24');arrow.setAttribute('aria-hidden','true');
  arrow.innerHTML='<path d="m7 10 5 5 5-5"/>';
  launch.append(value,arrow);
  field.insertAdjacentElement('afterend',launch);
  field.classList.add('sv-standard-picker-source');field.tabIndex=-1;
  field.setAttribute('aria-hidden','true');
  buttons.set(field,launch);sync(field);
  field.addEventListener('change',()=>sync(field));
  field.addEventListener('input',()=>sync(field));
  const parent=field.closest('label');
  if(parent)parent.addEventListener('click',event=>{
   if(event.target===field||launch.contains(event.target))return;
   if(event.target.closest('input,select,textarea,button'))return;
   event.preventDefault();launch.click();
  });
 }
 // Existing schedule code sets .value directly after restoring its saved state.
 // Keep button labels synchronized after initialization and when tabs are entered.
 [0,250,1200].forEach(delay=>setTimeout(()=>fields.forEach(({field})=>sync(field)),delay));
 document.addEventListener('click',event=>{
  if(event.target.closest('#svcpStaffTabs,[data-svstaff-tab],#svcpManagerPeople>summary'))
   setTimeout(()=>fields.forEach(({field})=>sync(field)),0);
 },true);
 window.addEventListener('pageshow',()=>fields.forEach(({field})=>sync(field)));
})();
