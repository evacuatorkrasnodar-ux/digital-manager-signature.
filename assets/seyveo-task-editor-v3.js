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
 const mainSection=title.closest('.sv-new-task-main');
 const extraFields=()=>[...form.querySelectorAll('.sv-task-extra-field')];
 const titleCapsule=title.closest('.sv-task-title-capsule');
 // The real textarea remains the input, including iOS keyboard, selection,
 // dictation and undo. A noninteractive mirror paints only recognized ranges.
 const phraseMirror=document.createElement('div');
 phraseMirror.className='sv-task-phrase-mirror';phraseMirror.setAttribute('aria-hidden','true');phraseMirror.hidden=true;
 titleCapsule?.prepend(phraseMirror);
 const clearPhrase=document.createElement('button');clearPhrase.type='button';clearPhrase.className='sv-task-phrase-clear';
 clearPhrase.setAttribute('aria-label','Очистить текст дела');clearPhrase.hidden=true;
 clearPhrase.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="m9 9 6 6m0-6-6 6" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
 titleCapsule?.after(clearPhrase);
 let mirrorFrame=0,composing=false;
 function refreshPhraseChrome(){
  if(!titleCapsule||!dialog.open)return;
  const active=Boolean(title.value)&&!(titleCapsule.classList.contains('is-grouped')&&!titleCapsule.classList.contains('is-editing'));
  clearPhrase.hidden=!active;
  titleCapsule.classList.toggle('sv-task-has-clear',active);
  if(mirrorFrame)return;
  mirrorFrame=requestAnimationFrame(()=>{
   mirrorFrame=0;
   const value=title.value;
   const grouped=titleCapsule.classList.contains('is-grouped')&&!titleCapsule.classList.contains('is-editing');
   const ranges=!grouped&&!composing&&value?window.SEYVEO_TASK_SMART_RANGES?.(value,new Date(),window.SEYVEO_TASK_PLACES?.extract?.(value))||[]:[];
   phraseMirror.hidden=!ranges.length;
   titleCapsule.classList.toggle('sv-task-phrase-colored',Boolean(ranges.length));
   if(!ranges.length)return;
   const rect=title.getBoundingClientRect(),parent=titleCapsule.getBoundingClientRect(),style=getComputedStyle(title);
   if(rect.width<2||rect.height<2){phraseMirror.hidden=true;titleCapsule.classList.remove('sv-task-phrase-colored');return}
   Object.assign(phraseMirror.style,{
    left:(rect.left-parent.left-titleCapsule.clientLeft)+'px',top:(rect.top-parent.top-titleCapsule.clientTop)+'px',
    width:title.clientWidth+'px',height:title.clientHeight+'px',
    font:style.font,letterSpacing:style.letterSpacing,lineHeight:style.lineHeight,
    textAlign:style.textAlign,padding:style.padding,wordSpacing:style.wordSpacing,
    textIndent:style.textIndent,direction:style.direction
   });
   const fragment=document.createDocumentFragment();let cursor=0;
   for(const range of ranges){
    fragment.append(document.createTextNode(value.slice(cursor,range.start)));
    const mark=document.createElement('span');mark.dataset.kind=range.kind;mark.textContent=value.slice(range.start,range.end);fragment.append(mark);
    cursor=range.end;
   }
   fragment.append(document.createTextNode(value.slice(cursor)+'\u200b'));
   phraseMirror.replaceChildren(fragment);phraseMirror.scrollTop=title.scrollTop;phraseMirror.scrollLeft=title.scrollLeft;
  });
 }
 title.addEventListener('scroll',()=>{phraseMirror.scrollTop=title.scrollTop;phraseMirror.scrollLeft=title.scrollLeft},{passive:true});
 title.addEventListener('compositionstart',()=>{composing=true;phraseMirror.hidden=true;titleCapsule?.classList.remove('sv-task-phrase-colored')});
 title.addEventListener('compositionend',()=>{composing=false;refreshPhraseChrome()});
 clearPhrase.addEventListener('click',()=>{
  title.value='';manualDate=false;manualTime=false;manualPriority=false;manualRepeat=false;quickDateOpen=false;
  window.SEYVEO_TASK_PLACE_EDITOR?.reset?.();
  title.dispatchEvent(new Event('input',{bubbles:true}));title.focus({preventScroll:true});
 });
 if(typeof ResizeObserver==='function')new ResizeObserver(refreshPhraseChrome).observe(title);
 const groupedPreview=document.createElement('div');
 groupedPreview.className='sv-task-one-field-summary';
 groupedPreview.hidden=true;
 groupedPreview.setAttribute('aria-label','Распознанные дела в одном поле');
 title.insertAdjacentElement('afterend',groupedPreview);
 const groupedHint=document.createElement('div');
 groupedHint.className='sv-task-one-field-hint';
 groupedHint.hidden=true;
 title.insertAdjacentElement('afterend',groupedHint);
 const taskCountText=n=>n===1?'дело':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'дела':'дел';
 function refreshOneField(){
  const values=title.value.trim();
  const items=!isEditing()&&values?draftsForSave():[];
  const multiple=items.length>1;
  const focused=document.activeElement===title;
  titleCapsule?.classList.toggle('is-grouped',multiple);
  titleCapsule?.classList.toggle('is-editing',focused);
  groupedHint.hidden=!multiple||!focused;
  groupedPreview.hidden=!multiple||focused;
  refreshPhraseChrome();
  if(!multiple){groupedPreview.replaceChildren();groupedHint.replaceChildren();return}
  groupedHint.replaceChildren();
  const badge=document.createElement('span');badge.className='sv-task-one-field-hint-dot';
  groupedHint.append(badge,document.createTextNode('Сэйви распознала '+items.length+' '+taskCountText(items.length)));
  if(focused)return;
  groupedPreview.replaceChildren();
  for(const item of items){
   const row=document.createElement('div');row.className='sv-task-one-field-item';
   const dot=document.createElement('span');dot.className='sv-task-one-field-dot is-'+(item.category==='work'?'work':'personal');
   dot.setAttribute('aria-hidden','true');
   const name=document.createElement('span');name.className='sv-task-one-field-name';name.textContent=item.title;
   row.append(dot,name);groupedPreview.append(row);
  }
 }
 groupedPreview.addEventListener('click',()=>title.focus({preventScroll:true}));
 title.addEventListener('focus',()=>{refreshOneField();sizePhrase()});
 title.addEventListener('blur',()=>queueMicrotask(()=>{refreshOneField();sizePhrase();queueKeyboardPosition()}));
 const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const iso=(y,m,d)=>[y,String(m+1).padStart(2,'0'),String(d).padStart(2,'0')].join('-');
 let shownYear=new Date().getFullYear(),shownMonth=new Date().getMonth();
 let previewDate='';
 const dayAgenda=document.createElement('div');
 dayAgenda.className='sv-task-day-agenda';
 dayAgenda.hidden=true;dayAgenda.setAttribute('role','region');
 dayAgenda.setAttribute('aria-label','Дела выбранного дня');
 dayAgenda.setAttribute('aria-live','polite');
 calendarPopover?.append(dayAgenda);

 /* The dots come from the user's actual saved tasks and calendar events.
    Never fabricate busy days to imitate the Apple reference. */
 function monthMarkers(){
  const result=new Map();
  const add=(key,tone)=>{
   if(!/^\d{4}-\d{2}-\d{2}$/.test(key||'')||!key.startsWith(iso(shownYear,shownMonth,1).slice(0,7)))return;
   const list=result.get(key)||[];
   if(list.length>=3)return;
   list.push(tone);result.set(key,list);
  };
  const read=key=>{
   try{const rows=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows:[]}
   catch{return []}
  };
  for(const item of read('seyveo-calendar-events-v1')){
   if(!item||typeof item.title!=='string')continue;
   add(item.date,item.kind==='business'?'blue':'orange');
  }
  const tones=new Set(['blue','purple','orange','green','red','yellow']);
  for(const item of read('seyveo-personal-tasks-v1')){
   if(!item||typeof item.title!=='string'||item.done===true)continue;
   add(item.due,tones.has(item.tone)?item.tone:item.category==='work'?'blue':'purple');
  }
  return result;
 }
 function savedDayEntries(day){
  const read=key=>{
   try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data:[]}
   catch{return []}
  };
  const entries=[];
  for(const entry of read('seyveo-calendar-events-v1')){
   if(entry?.date!==day||typeof entry.title!=='string')continue;
   entries.push({title:entry.title,time:entry.time||entry.startTime||'',category:entry.kind==='business'?'work':'personal'});
  }
  for(const entry of read('seyveo-personal-tasks-v1')){
   if(entry?.due!==day||entry.done===true||typeof entry.title!=='string')continue;
   entries.push({title:entry.title,time:entry.time||'',category:entry.category==='work'?'work':'personal'});
  }
  return entries.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
 }
 function chooseCalendarDate(value){
  manualDate=true;
  date.value=value;date.dispatchEvent(new Event('change',{bubbles:true}));
  setCalendarOpen(false);
 }
 function renderDayAgenda(value){
  previewDate=value;
  dayAgenda.replaceChildren();
  const items=savedDayEntries(value);
  dayAgenda.hidden=false;
  const [y,m,d]=value.split('-').map(Number);
  const heading=document.createElement('div');heading.className='sv-task-day-agenda-heading';
  const label=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(new Date(y,m-1,d));
  heading.textContent=label+' · '+items.length+' '+(items.length===1?'дело':items.length<5?'дела':'дел');
  dayAgenda.append(heading);
  if(!items.length){heading.textContent=label+' · дел нет';}
  const list=document.createElement('div');list.className='sv-task-day-agenda-list';
  for(const entry of items){
   const row=document.createElement('div');
   row.className='sv-task-day-agenda-item '+(entry.category==='work'?'is-work':'is-personal');
   const dot=document.createElement('span');dot.className='sv-task-day-agenda-dot';dot.setAttribute('aria-hidden','true');
   const titleText=document.createElement('span');titleText.className='sv-task-day-agenda-title';titleText.textContent=entry.title;
   row.append(dot,titleText);
   if(/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.time)){
    const timeText=document.createElement('time');timeText.textContent=entry.time;row.append(timeText);
   }
   list.append(row);
  }
  dayAgenda.append(list);
 }
 function moveCalendarMonth(direction){
  const next=new Date(shownYear,shownMonth+direction,1);
  shownYear=next.getFullYear();shownMonth=next.getMonth();
  previewDate='';dayAgenda.hidden=true;dayAgenda.replaceChildren();draw();
 }
 function setCalendarOpen(open){
  if(!calendarButton||!calendarPopover)return;
  calendarPopover.hidden=!open;
  calendarButton.setAttribute('aria-expanded',String(open));
  previewDate='';dayAgenda.hidden=true;dayAgenda.replaceChildren();
  if(open){
   const [year,month]=(date.value||today()).split('-').map(Number);
   shownYear=year;shownMonth=month-1;renderDayAgenda(date.value||today());draw();
  }
 }
 function draw(){
  const heading=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(new Date(shownYear,shownMonth,1)).replace(/\s*г\.$/u,'');
  monthLabel.textContent=heading.charAt(0).toLocaleUpperCase('ru-RU')+heading.slice(1);
  days.replaceChildren();
  const markers=monthMarkers();
  const first=(new Date(shownYear,shownMonth,1).getDay()+6)%7;
  const count=new Date(shownYear,shownMonth+1,0).getDate();
  for(let i=0;i<first;i++){const empty=document.createElement('span');empty.className='sv-new-task-empty-day';days.append(empty)}
  for(let d=1;d<=count;d++){
   const button=document.createElement('button');button.type='button';
   const value=iso(shownYear,shownMonth,d);
   button.dataset.iso=value;
   button.setAttribute('aria-label',new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(shownYear,shownMonth,d)));
   if(value===(date.value||today())){button.classList.add('is-selected');button.setAttribute('aria-current','date')}
   if(value===today())button.classList.add('is-today');
   if(value===previewDate)button.classList.add('is-agenda-preview');
   const number=document.createElement('span');number.className='sv-task-cal-number';number.textContent=String(d);
   const marks=document.createElement('span');marks.className='sv-task-cal-marks';marks.setAttribute('aria-hidden','true');
   const dayMarks=markers.get(value)||[];
   if(dayMarks.length)button.setAttribute('aria-label',button.getAttribute('aria-label')+' · есть дела, нажми для просмотра');
   for(const tone of dayMarks){
    const mark=document.createElement('i');mark.className='sv-task-cal-mark sv-task-cal-'+tone;
    marks.append(mark);
   }
   button.append(number,marks);
   button.addEventListener('click',()=>{
    manualDate=true;
    date.value=value;
    date.dispatchEvent(new Event('change',{bubbles:true}));
    renderDayAgenda(value);
    draw();
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
  // On iOS Safari, innerHeight may shrink with the keyboard while the
  // full-screen dialog keeps its old size. Measure the actual sheet edge
  // against the visible viewport edge, in the SAME coordinate system.
  const viewportBottom=viewport?viewport.offsetTop+viewport.height:window.innerHeight;
  const sheetBottom=sheet.getBoundingClientRect().bottom;
  const remaining=Math.max(0,sheetBottom-viewportBottom);
  const inset=remaining>2?Math.ceil(remaining):0;
  if(Math.abs(inset-lastKeyboardInset)<3)return;
  lastKeyboardInset=inset;
  sheet.style.setProperty('--sv-task-keyboard-inset',inset+'px');
  sheet.classList.toggle('sv-task-keyboard-visible',inset>110);
 }
 function queueKeyboardPosition(){
  if(keyboardFrame)return;
  keyboardFrame=requestAnimationFrame(()=>{keyboardFrame=0;updateKeyboardPosition()});
 }
 window.visualViewport?.addEventListener('resize',queueKeyboardPosition);
 window.visualViewport?.addEventListener('scroll',queueKeyboardPosition);
 window.addEventListener('resize',queueKeyboardPosition);
 window.addEventListener('resize',sizePhrase);
 dialog.addEventListener('focusin',queueKeyboardPosition);
 dialog.addEventListener('focusout',queueKeyboardPosition);
 window.addEventListener('pageshow',queueKeyboardPosition);
 const isEditing=()=>document.getElementById('personalTaskDialogTitle')?.textContent?.startsWith('Изменить');
 function createText(kind,text){
  const node=document.createElement('span');node.className='sv-task-smart-'+kind;
  node.textContent=text;return node;
 }
 function selectedCategory(){return form.querySelector('input[name="personalTaskCategory"]:checked')?.value==='work'?'work':'personal';}
 function selectedType(){return form.querySelector('input[name="personalTaskType"]:checked')?.value==='event'?'event':'task';}
 function proposedPlan(){
  if(isEditing())return null;
  return window.SEYVEO_TASK_AI?.plan(title.value.trim())||(typeof readPlan==='function'?readPlan(title.value):null);
 }
 const categoryOverrides=new Map();
 let categorySource='';
 function draftsForSave(){
  const source=[title.value,...extraFields().map(field=>field.value)].join('\u001f');
  if(source!==categorySource){categorySource=source;categoryOverrides.clear()}
  const plan=proposedPlan();
  const separate=extraFields().map(field=>field.value.trim()).filter(Boolean);
  if(!plan?.items?.length&&!separate.length)return [];
  const classifier=window.SEYVEO_TASK_CLASSIFY;
  const candidates=plan?.items?.length?plan.items.map(item=>({...item,leadMinutes:plan.leadMinutes||0})):[{
   title:effectiveTitle(),date:date.value||'',time:timeInput?.value||'',leadMinutes:0
  }];
  for(const raw of separate){
   const extraPlan=window.SEYVEO_TASK_SMART_PLAN?.(raw);
   const parsed=extraPlan?.items?.length?extraPlan.items:[{title:raw,date:'',time:''}];
   candidates.push(...parsed.map(item=>({...item,leadMinutes:extraPlan?.leadMinutes||0})));
  }
  return candidates.map((item,index)=>({
   title:item.title,
   date:manualDate?date.value:item.date||'',time:manualTime?(timeInput?.value||''):item.time||'',
   category:categoryOverrides.get(index)||classifier?.category?.(item.title)||selectedCategory(),
   entryType:classifier?.type?.(item.title)||selectedType(),
   tone:['orange','green','purple','yellow','red','blue'][index%6],
   remindBefore:item.leadMinutes||0
  }));
 }
 function batchNeedsReview(){
  const plan=proposedPlan();
  if(plan?.needsReview)return true;
  const parse=window.SEYVEO_TASK_SMART_PLAN;
  if(extraFields().some(field=>parse?.(field.value.trim())?.needsReview))return true;
  return draftsForSave().length>12;
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
  if(!dialog.open||!title.getClientRects().length||
   (titleCapsule?.classList.contains('is-grouped')&&!titleCapsule.classList.contains('is-editing')))return;
  const minimum=window.matchMedia('(max-width:649px)').matches?24:56;
  // Reserve the clear button before measuring: it changes line wrapping.
  refreshPhraseChrome();
  const focused=document.activeElement===title;
  const line=parseFloat(getComputedStyle(title).lineHeight)||24;
  const limit=focused?Math.max(6*line,Math.min(220,window.innerHeight*.32)):Infinity;
  const previousScroll=title.scrollTop;
  title.style.overflowY='hidden';
  title.style.height='0px';
  const measured=title.scrollHeight;
  const height=Math.ceil(Math.max(minimum,Math.min(limit,measured))+2);
  title.style.height=height+'px';
  title.style.overflowY=measured>limit?'auto':'hidden';
  title.scrollTop=focused&&measured>limit?previousScroll:0;
  refreshPhraseChrome();
 }
 const wheelMonths=Array.from({length:12},(_,i)=>new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(new Date(2020,i,1)));
 const padWheel=n=>String(n).padStart(2,'0');
 function makeWheelColumn(label,choices,value,change){
  const column=document.createElement('div');column.className='sv-task-wheel-column';column.setAttribute('aria-label',label);
  return window.SEYVEO_WHEEL.mount(column,choices,value,change);
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
  actions.append(clear,done);editor.append(actions,window.SEYVEO_WHEEL.feedbackButton());
  return editor;
 }
 function updateSmartPreview(){
  if(!smartPreview||!smartDetails)return;
  refreshOneField();
  const raw=title.value.trim().replace(/\s+/g,' ');
  const empty=!raw;
  const recognized=Boolean((typeof readPhrase==='function'&&readPhrase(raw))||date.value||timeInput?.value||proposedPlan()?.items?.length>1||extraFields().some(field=>field.value.trim())||Boolean(window.SEYVEO_TASK_PLACES?.extract?.(raw))||/(?:встреч|встрет|свидан|переговор|совещан|пообед|поужин)/iu.test(raw));
  // Show structured cards only when Sayvi has something useful to extract.
  // A plain phrase remains a simple input; manual details are then available.
  smartPreview.hidden=empty||!recognized;
  dialog.classList.toggle('sv-task-needs-manual',!empty&&!recognized);
  smartPreview.classList.toggle('is-empty',empty);
  smartDetails.replaceChildren();
  if(empty||!recognized)return;
  const drafts=empty?[]:draftsForSave();
  const multi=drafts.length>1;
  const displayed=drafts.length?drafts:[{title:effectiveTitle(),category:selectedCategory(),entryType:selectedType(),tone:'orange'}];
  const category=displayed[0].category,kind=displayed[0].entryType;
  smartPreview.classList.toggle('is-work',category==='work');
  smartPreview.classList.toggle('is-multi',multi);
  const summaryGroup=document.createElement('div');summaryGroup.className='sv-task-smart-summary';
  if(!multi)smartDetails.append(summaryGroup);
  for(const [index,item] of displayed.entries()){
   const main=document.createElement('button');main.type='button';main.className='sv-task-smart-main';
   main.setAttribute('aria-label',empty?'Ввести название дела':'Изменить название дела');
   main.addEventListener('click',()=>title.focus({preventScroll:true}));
   const copy=document.createElement('div');copy.className='sv-task-smart-item-copy';
   copy.append(createText('name',window.SEYVEO_TASK_PLACE_EDITOR?.compactTitle?.(item.title)||item.title));
   if(multi){
    const whenText=item.date?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(new Date(item.date+'T12:00:00')):'';
    if(whenText||item.time)copy.append(createText('item-detail',[whenText,item.time].filter(Boolean).join(' · ')));
   }
   if(!empty&&multi){
    const dot=document.createElement('span');dot.className='sv-task-smart-dot is-'+item.category;

    dot.setAttribute('aria-hidden','true');main.append(dot);
   }
   main.append(copy);
   if(multi){
    const row=document.createElement('div');row.className='sv-task-smart-row';
    const badge=document.createElement('span');
    badge.className='sv-task-smart-category-label is-'+(item.category==='work'?'work':'personal');
    badge.textContent=item.category==='work'?'Работа':'Личное';
    badge.setAttribute('aria-label','Тип дела: '+badge.textContent);
    row.append(main,badge);smartDetails.append(row);
   }else summaryGroup.append(main);
  }
  if(!multi){
  const when=document.createElement('button');when.type='button';when.className='sv-task-smart-when';
  when.setAttribute('aria-label',multi?'Изменить дату и время обоих дел':'Изменить дату и время дела');
  when.setAttribute('aria-expanded',String(quickDateOpen));
  const whenDate=document.createElement('span');whenDate.className='sv-task-smart-when-date';
  const whenTime=document.createElement('span');whenTime.className='sv-task-smart-when-time';
  const differingDates=multi&&new Set(displayed.map(item=>(item.date||'')+' '+(item.time||''))).size>1;
  if(differingDates){
   whenDate.textContent='Разные даты';whenTime.textContent='По карточкам';
  }else if(date.value){
   const [year,month,day]=date.value.split('-').map(Number);
   whenDate.textContent=new Intl.DateTimeFormat('ru-RU',{weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(new Date(year,month-1,day));
  }else whenDate.textContent='Добавить дату';
  if(!differingDates)whenTime.textContent=timeInput?.value||'Время';
  const arrow=document.createElement('span');arrow.className='sv-task-smart-when-arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
  when.append(whenDate,whenTime,arrow);
  when.addEventListener('click',()=>{quickDateOpen=!quickDateOpen;if(quickDateOpen)quickWheelMode='date';updateSmartPreview()});
  summaryGroup.append(when);
  if(quickDateOpen)smartDetails.append(makeWheelEditor(whenDate,whenTime));
  }
  const meta=document.createElement('div');meta.className='sv-task-smart-meta';
  if(!multi&&!empty){
   if(category==='work')meta.append(createText('category','Работа'));
   if(kind==='event')meta.append(createText('kind','Событие'));
  }
  const plan=proposedPlan();
  if(plan?.fromLocalAI)meta.append(createText('category','Сэйви уточнила · проверь'));
  if(batchNeedsReview())smartDetails.append(createText('notice','Больше 12 дел за один раз. Сохрани часть списка отдельно, чтобы ничего не потерять.'));
  const lead=plan?.leadMinutes||0;
  if(lead)meta.append(createText('lead',`За ${lead===60?'1 час':lead+' мин.'} до начала`));
  const priority=document.getElementById('personalTaskPriority')?.value;
  if(priority&&priority!=='none')meta.append(createText('priority',({low:'Без спешки',medium:'Важно',high:'Срочно'})[priority]||'Приоритет'));
  const repeat=document.getElementById('personalTaskRepeat')?.value;
  if(repeat&&repeat!=='none')meta.append(createText('repeat',({daily:'Каждый день',weekly:'Каждую неделю',monthly:'Каждый месяц'})[repeat]||'Повтор'));
  if(meta.childElementCount)smartDetails.append(meta);
  if(lead)smartDetails.append(createText('notice','Время напоминания распознано. Уведомления пока не подключены.'));
  if(timeInput?.value&&!date.value)smartDetails.append(createText('notice','Укажи дату для напоминания по времени.'));
 }
 function applyPhrase(){
  const parsed=typeof readPhrase==='function'?readPhrase(title.value):null;
  const combined=proposedPlan();
  const signals=typeof readSignals==='function'?readSignals(title.value):{priority:'none',repeat:'none'};
  if(!manualDate&&(!isEditing()||parsed?.date)){
   const next=parsed?.date||combined?.date||'';
   if(date.value!==next){date.value=next;date.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  if(timeInput&&!manualTime&&(!isEditing()||parsed?.time)){
   const next=parsed?.time||combined?.time||'';
   if(timeInput.value!==next){timeInput.value=next;timeInput.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  const priority=document.getElementById('personalTaskPriority');
  if(priority&&!manualPriority&&(!isEditing()||signals.priority!=='none'))priority.value=signals.priority;
  const repeat=document.getElementById('personalTaskRepeat');
  if(repeat&&!manualRepeat&&(!isEditing()||signals.repeat!=='none'))repeat.value=signals.repeat;
  updateSmartPreview();
 }
 title.addEventListener('input',()=>{sizePhrase();applyPhrase()});
 dialog.addEventListener('sv-task-ai-updated',()=>{applyPhrase();sizePhrase()});
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
    title.value=[title.value.trim(),transcript].filter(Boolean).join(' ').slice(0,500);
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
  moveCalendarMonth(-1);
 });
 document.getElementById('svNewTaskNextMonth')?.addEventListener('click',()=>{
  moveCalendarMonth(1);
 });
 /* On phones the month is navigated by a horizontal finger swipe.
    Vertical gestures still scroll the task editor normally. */
 const calendarSurface=dialog.querySelector('.sv-new-task-calendar');
 let calendarTouch=null,lastCalendarSwipe=0;
 calendarSurface?.addEventListener('touchstart',event=>{
  if(calendarPopover?.hidden||event.touches.length!==1){calendarTouch=null;return}
  const point=event.touches[0];
  calendarTouch={id:point.identifier,x:point.clientX,y:point.clientY,time:Date.now()};
 },{passive:true});
 calendarSurface?.addEventListener('touchend',event=>{
  if(!calendarTouch)return;
  const start=calendarTouch;calendarTouch=null;
  if(calendarPopover?.hidden)return;
  const point=Array.from(event.changedTouches).find(p=>p.identifier===start.id);
  if(!point)return;
  const dx=point.clientX-start.x,dy=point.clientY-start.y;
  if(Math.abs(dx)<42||Math.abs(dx)<Math.abs(dy)*1.4||Date.now()-start.time>1400)return;
  lastCalendarSwipe=Date.now();moveCalendarMonth(dx<0?1:-1);
  event.preventDefault();
 },{passive:false});
 calendarSurface?.addEventListener('click',event=>{
  if(Date.now()-lastCalendarSwipe<450){event.preventDefault();event.stopPropagation()}
 },true);
 calendarSurface?.addEventListener('touchcancel',()=>{calendarTouch=null},{passive:true});
 for(const name of ['seyveo:tasks-changed','seyveo:personal-tasks-changed','seyveo:calendar-changed']){
  window.addEventListener(name,()=>{if(dialog.open&&!calendarPopover?.hidden)draw()});
 }
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
 window.addEventListener('seyveo:task-place-updated',()=>{if(dialog.open)updateSmartPreview()});
 dialog.addEventListener('sv-task-editor-sync',()=>{sync();updateSmartPreview();sizePhrase()});
 dialog.addEventListener('close',()=>{
  if(recognition){try{recognition.stop()}catch{}recognition=null;voiceButton?.setAttribute('aria-pressed','false')}
  setCalendarOpen(false);
  if(keyboardFrame){cancelAnimationFrame(keyboardFrame);keyboardFrame=0}
  lastKeyboardInset=-1;
  sheet?.style.removeProperty('--sv-task-keyboard-inset');
  sheet?.classList.remove('sv-task-keyboard-visible');
  quickDateOpen=false;
  title.style.height='';title.style.overflowY='';
  if(mirrorFrame){cancelAnimationFrame(mirrorFrame);mirrorFrame=0}
  phraseMirror.hidden=true;clearPhrase.hidden=true;composing=false;
  titleCapsule?.classList.remove('sv-task-phrase-colored','sv-task-has-clear');
  mainSection?.querySelectorAll('.sv-task-manual-extra-row').forEach(row=>row.remove());
  categoryOverrides.clear();categorySource='';
  form.scrollTop=0;
 });
 window.SEYVEO_TASK_SCREEN=Object.freeze({version:7,sync,titleForSave:()=>window.SEYVEO_TASK_PLACE_EDITOR?.compactTitle?.(effectiveTitle(),true)||effectiveTitle(),draftsForSave,needsReview:batchNeedsReview});
})();
