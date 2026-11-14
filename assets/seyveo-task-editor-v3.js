/* SEYVEO · Manual task editor v3. A single screen, no shadow header or dock.
   The validated Personal Tasks store owns create, update and persistence. */
(()=>{
 'use strict';
 const dialog=document.getElementById('personalTaskDialog');
 const sheet=dialog?.querySelector('.personal-task-sheet');
 const form=document.getElementById('personalTaskForm');
 const date=document.getElementById('personalTaskDue');
 const days=document.getElementById('svNewTaskCalendarDays');
 const title=document.getElementById('personalTaskTitle');
 const hasDate=document.getElementById('svNewTaskHasDate');
 const settings=document.getElementById('svNewTaskDateSettings');
 const monthLabel=document.getElementById('svNewTaskMonthLabel');
 const smartPreview=document.getElementById('svNewTaskSmartPreview');
 const smartDetails=document.getElementById('svNewTaskSmartDetails');
 const calendarButton=document.getElementById('svNewTaskCalendarButton');
 const calendarPopover=document.getElementById('svNewTaskCalendarPopover');
 const timeInput=document.getElementById('personalTaskTime');
 const voiceButton=document.getElementById('svNewTaskVoice');
 const readPhrase=window.SEYVEO_TASK_SMART_NL;
 const readSignals=window.SEYVEO_TASK_SMART_SIGNALS;
 const readPlan=window.SEYVEO_TASK_SMART_PLAN;
 if(!dialog||!form||!date||!days||!title||!hasDate)return;
 const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const iso=(y,m,d)=>[y,String(m+1).padStart(2,'0'),String(d).padStart(2,'0')].join('-');
 let shownYear=new Date().getFullYear(),shownMonth=new Date().getMonth();
 function setCalendarOpen(open){
  if(!calendarButton||!calendarPopover)return;
  calendarPopover.hidden=!open;
  calendarButton.setAttribute('aria-expanded',String(open));
  if(open){
   const [year,month]=(date.value||today()).split('-').map(Number);
   shownYear=year;shownMonth=month-1;draw();
  }
 }
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
    manualDate=true;
    date.value=value;date.dispatchEvent(new Event('change',{bubbles:true}));
    setCalendarOpen(false);
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
 let manualDate=false,manualTime=false,manualPriority=false,manualRepeat=false;
 let quickDateOpen=false;
 let quickWheelMode='date';
 /* The native keyboard belongs to the phone. Follow its visual viewport so
    the small controls stay immediately above it, without moving the editor. */
 let keyboardFrame=0,lastKeyboardInset=-1;
 function updateKeyboardPosition(){
  if(!dialog.open||!sheet)return;
  const viewport=window.visualViewport;
  const remaining=viewport?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0;
  const inset=remaining>110?Math.round(remaining):0;
  if(Math.abs(inset-lastKeyboardInset)<3)return;
  lastKeyboardInset=inset;
  sheet.style.setProperty('--sv-task-keyboard-inset',inset+'px');
  sheet.classList.toggle('sv-task-keyboard-visible',inset>0);
 }
 function queueKeyboardPosition(){
  if(keyboardFrame)return;
  keyboardFrame=requestAnimationFrame(()=>{keyboardFrame=0;updateKeyboardPosition()});
 }
 window.visualViewport?.addEventListener('resize',queueKeyboardPosition);
 window.visualViewport?.addEventListener('scroll',queueKeyboardPosition);
 window.addEventListener('resize',queueKeyboardPosition);
 dialog.addEventListener('focusin',queueKeyboardPosition);
 const isEditing=()=>document.getElementById('personalTaskDialogTitle')?.textContent?.startsWith('Изменить');
 function createText(kind,text){
  const node=document.createElement('span');node.className='sv-task-smart-'+kind;
  node.textContent=text;return node;
 }
 function selectedCategory(){return form.querySelector('input[name="personalTaskCategory"]:checked')?.value==='work'?'work':'personal';}
 function selectedType(){return form.querySelector('input[name="personalTaskType"]:checked')?.value==='event'?'event':'task';}
 function proposedPlan(){return !isEditing()&&typeof readPlan==='function'?readPlan(title.value):null;}
 function draftsForSave(){
  const plan=proposedPlan();
  if(!plan?.items?.length)return [];
  const classifier=window.SEYVEO_TASK_CLASSIFY;
  return plan.items.map((item,index)=>({
   title:item.title,
   category:classifier?.category?.(item.title)||selectedCategory(),
   entryType:classifier?.type?.(item.title)||selectedType(),
   tone:index===0?'orange':(['green','purple','yellow'][index-1]||'orange'),
   remindBefore:plan.leadMinutes||0
  }));
 }
 function effectiveTitle(){
  const planned=proposedPlan();
  if(planned?.items?.length)return planned.items[0].title;
  const phrase=typeof readPhrase==='function'?readPhrase(title.value):null;
  const raw=(phrase?.title||title.value).trim().replace(/\s+/g,' ');
  const cleaned=raw.replace(/^(?:срочно|немедленно|очень\s+важно|важно)\s*[:,!—–-]?\s*/iu,'').trim();
  const result=cleaned||raw;
  return result.charAt(0).toLocaleUpperCase('ru-RU')+result.slice(1);
 }
 function sizePhrase(){
  if(!dialog.open)return;
  title.style.height='auto';
  title.style.height=Math.max(80,Math.min(174,title.scrollHeight))+'px';
 }
 const wheelRowHeight=40;
 const wheelMonths=Array.from({length:12},(_,i)=>new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(new Date(2020,i,1)));
 const padWheel=n=>String(n).padStart(2,'0');
 function makeWheelColumn(label,choices,value,change){
  const column=document.createElement('div');column.className='sv-task-wheel-column';
  column.tabIndex=0;column.setAttribute('role','listbox');column.setAttribute('aria-label',label);
  const buttons=[];
  let active=Math.max(0,choices.findIndex(item=>item.value===value));
  let scrollTimer=0;
  function select(index,commit=false,force=false){
   const next=Math.min(choices.length-1,Math.max(0,index));
   const changed=next!==active;
   if(changed){
    buttons[active]?.classList.remove('is-selected');buttons[active]?.setAttribute('aria-selected','false');
    active=next;buttons[active]?.classList.add('is-selected');buttons[active]?.setAttribute('aria-selected','true');
   }
   if(commit&&(changed||force))change(choices[active].value);
  }
  choices.forEach((item,index)=>{
   const button=document.createElement('button');button.type='button';button.className='sv-task-wheel-option';
   button.textContent=item.label;button.tabIndex=-1;button.setAttribute('role','option');
   button.setAttribute('aria-selected',String(index===active));
   if(index===active)button.classList.add('is-selected');
   button.addEventListener('click',()=>{
    column.scrollTo({top:index*wheelRowHeight,behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    select(index,true,true);
   });
   buttons.push(button);column.append(button);
  });
  column.addEventListener('scroll',()=>{
   clearTimeout(scrollTimer);
   scrollTimer=setTimeout(()=>{
    if(!column.isConnected)return;
    select(Math.round(column.scrollTop/wheelRowHeight),true);
   },75);
  },{passive:true});
  column.addEventListener('keydown',event=>{
   const direction=event.key==='ArrowUp'?-1:event.key==='ArrowDown'?1:0;
   if(!direction&&event.key!=='Home'&&event.key!=='End')return;
   event.preventDefault();
   const next=event.key==='Home'?0:event.key==='End'?choices.length-1:Math.min(choices.length-1,Math.max(0,active+direction));
   column.scrollTop=next*wheelRowHeight;select(next,true,true);
  });
  requestAnimationFrame(()=>{if(column.isConnected)column.scrollTop=active*wheelRowHeight});
  return {node:column,set(value){const index=choices.findIndex(item=>item.value===value);if(index<0)return;column.scrollTop=index*wheelRowHeight;select(index)}};
 }
 function makeWheelEditor(whenDate,whenTime){
  const editor=document.createElement('div');editor.className='sv-task-smart-wheel-edit';
  const tabs=document.createElement('div');tabs.className='sv-task-wheel-tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Что исправить');
  for(const [mode,label] of [['date','Дата'],['time','Время']]){
   const button=document.createElement('button');button.type='button';button.textContent=label;
   button.classList.toggle('is-active',quickWheelMode===mode);button.setAttribute('aria-pressed',String(quickWheelMode===mode));
   button.addEventListener('click',()=>{quickWheelMode=mode;updateSmartPreview()});
   tabs.append(button);
  }
  editor.append(tabs);
  const body=document.createElement('div');body.className='sv-task-wheel-body';
  body.classList.toggle('is-time',quickWheelMode==='time');
  if(quickWheelMode==='date'){
   const chosen=/^\d{4}-\d{2}-\d{2}$/.test(date.value)?date.value:today();
   const [year,month,day]=chosen.split('-').map(Number);
   const picked={year,month,day};
   let dayWheel=null;
   const dayHost=document.createElement('div');dayHost.className='sv-task-wheel-host';
   function commitDate(){
    picked.day=Math.min(picked.day,new Date(picked.year,picked.month,0).getDate());
    manualDate=true;date.value=[picked.year,padWheel(picked.month),padWheel(picked.day)].join('-');
    whenDate.textContent=new Intl.DateTimeFormat('ru-RU',{weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(new Date(picked.year,picked.month-1,picked.day));
   }
   function drawDayWheel(){
    const daysInMonth=new Date(picked.year,picked.month,0).getDate();
    picked.day=Math.min(picked.day,daysInMonth);
    dayWheel=makeWheelColumn('Число',Array.from({length:daysInMonth},(_,index)=>({value:index+1,label:String(index+1)})),picked.day,day=>{picked.day=day;commitDate()});
    dayHost.replaceChildren(dayWheel.node);
   }
   const months=makeWheelColumn('Месяц',wheelMonths.map((label,i)=>({value:i+1,label:label.charAt(0).toLocaleUpperCase('ru-RU')+label.slice(1)})),picked.month,value=>{picked.month=value;drawDayWheel();commitDate()});
   const years=makeWheelColumn('Год',Array.from({length:201},(_,index)=>({value:1900+index,label:String(1900+index)})),picked.year,value=>{picked.year=value;drawDayWheel();commitDate()});
   drawDayWheel();body.append(months.node,dayHost,years.node);
  }else{
   const [hour,minute]=(timeInput?.value||'09:00').split(':').map(Number);
   const picked={hour,minute};
   function commitTime(){
    manualTime=true;if(timeInput)timeInput.value=padWheel(picked.hour)+':'+padWheel(picked.minute);
    whenTime.textContent=padWheel(picked.hour)+':'+padWheel(picked.minute);
   }
   body.append(
    makeWheelColumn('Часы',Array.from({length:24},(_,value)=>({value,label:padWheel(value)})),picked.hour,value=>{picked.hour=value;commitTime()}).node,
    makeWheelColumn('Минуты',Array.from({length:60},(_,value)=>({value,label:padWheel(value)})),picked.minute,value=>{picked.minute=value;commitTime()}).node
   );
  }
  editor.append(body);
  const actions=document.createElement('div');actions.className='sv-task-wheel-actions';
  const clear=document.createElement('button');clear.type='button';clear.className='sv-task-wheel-clear';
  clear.textContent=quickWheelMode==='date'?'Без даты':'Без времени';
  clear.addEventListener('click',()=>{
   if(quickWheelMode==='date'){manualDate=true;date.value='';whenDate.textContent='Без даты'}
   else{manualTime=true;if(timeInput)timeInput.value='';whenTime.textContent='Время не выбрано'}
   updateSmartPreview();
  });
  const done=document.createElement('button');done.type='button';done.className='sv-task-smart-quick-done';done.textContent='Готово';
  done.addEventListener('click',()=>{
   quickDateOpen=false;date.dispatchEvent(new Event('change',{bubbles:true}));
   timeInput?.dispatchEvent(new Event('change',{bubbles:true}));updateSmartPreview();
  });
  actions.append(clear,done);editor.append(actions);
  return editor;
 }
 function updateSmartPreview(){
  if(!smartPreview||!smartDetails)return;
  const raw=title.value.trim().replace(/\s+/g,' ');
  smartPreview.hidden=!raw;
  smartDetails.replaceChildren();
  if(!raw)return;
  const drafts=draftsForSave();
  const multi=drafts.length>1;
  const displayed=drafts.length?drafts:[{title:effectiveTitle(),category:selectedCategory(),entryType:selectedType(),tone:'orange'}];
  const category=displayed[0].category,kind=displayed[0].entryType;
  smartPreview.classList.toggle('is-work',category==='work');
  smartPreview.classList.toggle('is-multi',multi);
  for(const item of displayed){
   const main=document.createElement('div');main.className='sv-task-smart-main';
   const dot=document.createElement('span');dot.className='sv-task-smart-dot is-'+item.category;
   if(multi&&item.category!=='work')dot.classList.add('is-tone-'+item.tone);
   dot.setAttribute('aria-hidden','true');
   const copy=document.createElement('div');copy.className='sv-task-smart-item-copy';
   copy.append(createText('name',item.title));
   if(multi)copy.append(createText('item-detail',(item.category==='work'?'Работа':'Личное')+' · '+(item.entryType==='event'?'Событие':'Напоминание')));
   main.append(dot,copy);smartDetails.append(main);
  }
  const when=document.createElement('button');when.type='button';when.className='sv-task-smart-when';
  when.setAttribute('aria-label',multi?'Изменить дату и время обоих дел':'Изменить дату и время дела');
  when.setAttribute('aria-expanded',String(quickDateOpen));
  const whenDate=document.createElement('span');whenDate.className='sv-task-smart-when-date';
  const whenTime=document.createElement('span');whenTime.className='sv-task-smart-when-time';
  if(date.value){
   const [year,month,day]=date.value.split('-').map(Number);
   whenDate.textContent=new Intl.DateTimeFormat('ru-RU',{weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(new Date(year,month-1,day));
  }else whenDate.textContent='Без даты';
  whenTime.textContent=timeInput?.value||'Время не выбрано';
  const arrow=document.createElement('span');arrow.className='sv-task-smart-when-arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
  when.append(whenDate,whenTime,arrow);
  when.addEventListener('click',()=>{quickDateOpen=!quickDateOpen;if(quickDateOpen)quickWheelMode='date';updateSmartPreview()});
  smartDetails.append(when);
  if(quickDateOpen)smartDetails.append(makeWheelEditor(whenDate,whenTime));
  const meta=document.createElement('div');meta.className='sv-task-smart-meta';
  if(!multi){
   meta.append(createText('category',category==='work'?'Работа':'Личное'));
   meta.append(createText('kind',kind==='event'?'Событие':'Напоминание'));
  }
  const lead=proposedPlan()?.leadMinutes||0;
  if(lead)meta.append(createText('lead',`За ${lead===60?'1 час':lead+' мин.'} до начала`));
  const priority=document.getElementById('personalTaskPriority')?.value;
  if(priority&&priority!=='none')meta.append(createText('priority',({low:'Без спешки',medium:'Важно',high:'Срочно'})[priority]||'Приоритет'));
  const repeat=document.getElementById('personalTaskRepeat')?.value;
  if(repeat&&repeat!=='none')meta.append(createText('repeat',({daily:'Каждый день',weekly:'Каждую неделю',monthly:'Каждый месяц'})[repeat]||'Повтор'));
  smartDetails.append(meta);
  if(lead)smartDetails.append(createText('notice','Уведомление за час пока недоступно.'));
  if(timeInput?.value&&!date.value)smartDetails.append(createText('notice','Укажи дату для напоминания по времени.'));
 }
 function applyPhrase(){
  const parsed=typeof readPhrase==='function'?readPhrase(title.value):null;
  const signals=typeof readSignals==='function'?readSignals(title.value):{priority:'none',repeat:'none'};
  if(!manualDate&&(!isEditing()||parsed?.date)){
   const next=parsed?.date||'';
   if(date.value!==next){date.value=next;date.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  if(timeInput&&!manualTime&&(!isEditing()||parsed?.time)){
   const next=parsed?.time||'';
   if(timeInput.value!==next){timeInput.value=next;timeInput.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  const priority=document.getElementById('personalTaskPriority');
  if(priority&&!manualPriority&&(!isEditing()||signals.priority!=='none'))priority.value=signals.priority;
  const repeat=document.getElementById('personalTaskRepeat');
  if(repeat&&!manualRepeat&&(!isEditing()||signals.repeat!=='none'))repeat.value=signals.repeat;
  updateSmartPreview();
 }
 title.addEventListener('input',()=>{sizePhrase();applyPhrase()});
 calendarButton?.addEventListener('click',()=>{
  title.blur();setCalendarOpen(Boolean(calendarPopover?.hidden));
 });
 dialog.addEventListener('pointerdown',event=>{
  if(!calendarPopover?.hidden&&!calendarPopover.contains(event.target)&&!calendarButton?.contains(event.target))setCalendarOpen(false);
 },true);
 dialog.addEventListener('cancel',event=>{
  if(!calendarPopover?.hidden){event.preventDefault();setCalendarOpen(false)}
 });
 date.addEventListener('change',event=>{if(event.isTrusted)manualDate=true;updateSmartPreview();});
 timeInput?.addEventListener('change',event=>{if(event.isTrusted)manualTime=true;updateSmartPreview();});
 document.getElementById('personalTaskPriority')?.addEventListener('change',event=>{if(event.isTrusted)manualPriority=true;updateSmartPreview();});
 document.getElementById('personalTaskRepeat')?.addEventListener('change',event=>{if(event.isTrusted)manualRepeat=true;updateSmartPreview();});
 for(const selector of ['input[name="personalTaskType"]','input[name="personalTaskCategory"]','#svNewTaskListChoice']){
  form.querySelectorAll(selector).forEach(control=>control.addEventListener('change',updateSmartPreview));
 }
 /* Voice is strictly user-initiated. Browser recognition fills the same field;
    it never commits a task or launches the global Sayvi conversation. */
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 let recognition=null;
 if(voiceButton){
  if(!Recognition)voiceButton.addEventListener('click',()=>{
   const status=document.getElementById('personalTaskStatus');
   if(status)status.textContent='Для диктовки используй микрофон клавиатуры телефона.';
   title.focus({preventScroll:true});
  });
  else voiceButton.addEventListener('click',()=>{
   if(recognition){try{recognition.stop()}catch{}return}
   const rec=new Recognition();recognition=rec;rec.lang='ru-RU';
   rec.interimResults=false;rec.maxAlternatives=1;
   voiceButton.setAttribute('aria-pressed','true');
   rec.onresult=event=>{
    const transcript=String(event.results?.[0]?.[0]?.transcript||'').trim();
    if(!transcript)return;
    title.value=[title.value.trim(),transcript].filter(Boolean).join(' ').slice(0,140);
    title.dispatchEvent(new Event('input',{bubbles:true}));
   };
   rec.onerror=()=>{const status=document.getElementById('personalTaskStatus');if(status)status.textContent='Не удалось распознать речь. Можно написать или использовать микрофон клавиатуры.'};
   rec.onend=()=>{recognition=null;voiceButton.setAttribute('aria-pressed','false')};
   try{rec.start()}catch{recognition=null;voiceButton.setAttribute('aria-pressed','false')}
  });
 }
 date.addEventListener('change',sync);
 hasDate.addEventListener('change',()=>{
  manualDate=true;
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
 const observer=new MutationObserver(()=>{
  if(!dialog.open)return;
  manualDate=false;manualTime=false;manualPriority=false;manualRepeat=false;quickDateOpen=false;
  setCalendarOpen(false);
  queueKeyboardPosition();
  date.dispatchEvent(new Event('change',{bubbles:true}));
  sizePhrase();
  updateSmartPreview();
 });
 observer.observe(dialog,{attributes:true,attributeFilter:['open']});
 dialog.addEventListener('sv-task-editor-sync',()=>{sync();updateSmartPreview();sizePhrase()});
 dialog.addEventListener('close',()=>{
  if(recognition){try{recognition.stop()}catch{}recognition=null;voiceButton?.setAttribute('aria-pressed','false')}
  setCalendarOpen(false);
  if(keyboardFrame){cancelAnimationFrame(keyboardFrame);keyboardFrame=0}
  lastKeyboardInset=-1;
  sheet?.style.removeProperty('--sv-task-keyboard-inset');
  sheet?.classList.remove('sv-task-keyboard-visible');
  quickDateOpen=false;
  title.style.height='';
  form.scrollTop=0;
 });
 window.SEYVEO_TASK_SCREEN=Object.freeze({version:5,sync,titleForSave:effectiveTitle,draftsForSave});
})();
