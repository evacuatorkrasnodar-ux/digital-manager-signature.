/* SEYVEO · premium date and time picker inside the existing calendar editor.
   Native input values and calendar saving remain the single source of truth. */
(()=>{
'use strict';
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
 '<button type="button" class="cal-pick-today" id="seyveoPickToday">Сегодня</button></section>',
 '<section id="seyveoPickTime" class="cal-pick-time" aria-label="Выбор времени" hidden>',
 '<div class="cal-pick-time-head"><strong>Время</strong><small>Часы и минуты</small></div>',
 '<div class="cal-pick-wheels">',
 '<div class="cal-pick-wheel-column"><span class="cal-pick-wheel-title">Часы</span><div class="cal-pick-wheel" id="seyveoPickHours" role="group" aria-label="Часы"></div></div>',
 '<span class="cal-pick-colon" aria-hidden="true">:</span>',
 '<div class="cal-pick-wheel-column"><span class="cal-pick-wheel-title">Минуты</span><div class="cal-pick-wheel" id="seyveoPickMinutes" role="group" aria-label="Минуты"></div></div></div>',
 '<div class="cal-pick-time-actions"><button type="button" class="cal-pick-time-clear" id="seyveoPickNoTime">Без времени</button>',
 '<button type="button" class="cal-pick-time-done" id="seyveoPickDone">Готово</button></div></section>'
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
  back.append(chevron,document.createTextNode('Новое дело'));
  const stageTitle=document.createElement('h2');
  stageTitle.className='sv-task-date-title';stageTitle.textContent='Выбрать срок';
  stageTitle.id='svTaskDateHeading';
  picker.setAttribute('aria-labelledby',stageTitle.id);
  picker.prepend(back,stageTitle);
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
   back.textContent='';back.append(chevron,document.createTextNode('Новое дело'));
  };
  const openTask=()=>{
   if(!taskDialog.open)return;
   if(!picker.hidden){closeTask();return}
   const chosen=parse(taskDate.value)||new Date();
   taskMonth=new Date(chosen.getFullYear(),chosen.getMonth(),1);
   renderDateCalendar(taskMonth,taskDate,heading,gridDays);
   // Dismiss the keyboard before entering the date stage.
   if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
   const editorTitle=$('personalTaskDialogTitle')?.textContent?.trim()||'Новое дело';
   back.textContent='';back.append(chevron,document.createTextNode(editorTitle));
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
  back.addEventListener('click',()=>{
   closeTask();taskTrigger.focus({preventScroll:true});
  });
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
  gridDays.addEventListener('click',event=>{
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