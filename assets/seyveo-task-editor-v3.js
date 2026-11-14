/* SEYVEO · Manual task editor v3. A single screen, no shadow header or dock.
   The validated Personal Tasks store owns create, update and persistence. */
(()=>{
 'use strict';
 const dialog=document.getElementById('personalTaskDialog');
 const form=document.getElementById('personalTaskForm');
 const date=document.getElementById('personalTaskDue');
 const days=document.getElementById('svNewTaskCalendarDays');
 const title=document.getElementById('personalTaskTitle');
 const hasDate=document.getElementById('svNewTaskHasDate');
 const settings=document.getElementById('svNewTaskDateSettings');
 const monthLabel=document.getElementById('svNewTaskMonthLabel');
 if(!dialog||!form||!date||!days||!title||!hasDate)return;
 const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const iso=(y,m,d)=>[y,String(m+1).padStart(2,'0'),String(d).padStart(2,'0')].join('-');
 let shownYear=new Date().getFullYear(),shownMonth=new Date().getMonth();
 function draw(){
  monthLabel.textContent=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(new Date(shownYear,shownMonth,1));
  days.replaceChildren();
  const first=(new Date(shownYear,shownMonth,1).getDay()+6)%7;
  const count=new Date(shownYear,shownMonth+1,0).getDate();
  for(let i=0;i<first;i++){const empty=document.createElement('span');empty.className='sv-new-task-empty-day';days.append(empty)}
  for(let d=1;d<=count;d++){
   const button=document.createElement('button');button.type='button';button.textContent=String(d);
   const value=iso(shownYear,shownMonth,d);
   button.dataset.iso=value;
   button.setAttribute('aria-label',new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(shownYear,shownMonth,d)));
   if(value===date.value){button.classList.add('is-selected');button.setAttribute('aria-current','date')}
   if(value===today())button.classList.add('is-today');
   button.addEventListener('click',()=>{
    date.value=value;date.dispatchEvent(new Event('change',{bubbles:true}));
   });
   days.append(button);
  }
 }
 function sync(){
  const valid=/^\d{4}-\d{2}-\d{2}$/.test(date.value);
  hasDate.checked=valid;
  settings.hidden=!valid;
  if(valid){const [year,month]=date.value.split('-').map(Number);shownYear=year;shownMonth=month-1}
  draw();
 }
 date.addEventListener('change',sync);
 hasDate.addEventListener('change',()=>{
  if(!hasDate.checked)date.value='';
  else date.value=today();
  date.dispatchEvent(new Event('change',{bubbles:true}));
 });
 document.getElementById('svNewTaskPrevMonth')?.addEventListener('click',()=>{
  const d=new Date(shownYear,shownMonth-1,1);shownYear=d.getFullYear();shownMonth=d.getMonth();draw();
 });
 document.getElementById('svNewTaskNextMonth')?.addEventListener('click',()=>{
  const d=new Date(shownYear,shownMonth+1,1);shownYear=d.getFullYear();shownMonth=d.getMonth();draw();
 });
 const jump={
  date:()=>document.querySelector('.sv-new-task-calendar'),
  time:()=>document.getElementById('personalTaskTime'),
  notes:()=>document.getElementById('personalTaskNotes'),
  category:()=>document.querySelector('.sv-new-task-list-setting'),
  priority:()=>document.getElementById('personalTaskPriority')
 };
 dialog.querySelectorAll('[data-sv-task-focus]').forEach(button=>button.addEventListener('click',()=>{
  const target=jump[button.dataset.svTaskFocus]?.();if(!target)return;
  if((button.dataset.svTaskFocus==='date'||button.dataset.svTaskFocus==='time')&&!hasDate.checked){
   hasDate.checked=true;hasDate.dispatchEvent(new Event('change',{bubbles:true}));
  }
  target.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
  if(target.matches('input,textarea,select'))target.focus({preventScroll:true});
 }));
 const observer=new MutationObserver(()=>{
  if(!dialog.open)return;
  date.dispatchEvent(new Event('change',{bubbles:true}));
 });
 observer.observe(dialog,{attributes:true,attributeFilter:['open']});
 dialog.addEventListener('sv-task-editor-sync',sync);
 dialog.addEventListener('close',()=>{dialog.querySelector('.personal-task-sheet')?.scrollTo(0,0)});
 window.SEYVEO_TASK_SCREEN=Object.freeze({version:3,sync});
})();
