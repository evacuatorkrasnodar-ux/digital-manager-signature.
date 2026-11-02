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
function renderMonth(){
 const y=month.getFullYear(),m=month.getMonth(),label=monthFormatter.format(month);
 monthLabel.textContent=label.charAt(0).toUpperCase()+label.slice(1);
 const start=(new Date(y,m,1).getDay()+6)%7;
 const count=Math.ceil((start+new Date(y,m+1,0).getDate())/7)*7;
 const now=iso(new Date()),selected=date.value;
 const fragment=document.createDocumentFragment();
 for(let i=0;i<count;i++){
  const n=i-start+1;
  if(n<1||n>new Date(y,m+1,0).getDate()){
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
 days.replaceChildren(fragment);
}
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
})();