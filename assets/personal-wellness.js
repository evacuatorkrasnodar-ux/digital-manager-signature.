/* SEYVEO Signature · one local, opt-in personal health and care extension.
   Existing space records remain the source of truth for pressure, pulse and steps.
   No medical decisions, cloud sync, automatic sensors or background reminders. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),host=$('calendarPersonalTools');
if(!host||!window.SEYVEO_SPACES)return;
const KEY='seyveo-private-health-care-v1';
const pad=n=>String(n).padStart(2,'0');
const dateKey=(d=new Date())=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
const dateOk=value=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+'T12:00:00');return Number.isFinite(d.getTime())&&dateKey(d)===value;
};
const text=(tag,value,cls)=>{
 const el=document.createElement(tag);if(cls)el.className=cls;
 el.textContent=String(value);return el;
};
const stamp=value=>dateOk(value)?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(new Date(value+'T12:00:00')):'—';
const format=n=>new Intl.NumberFormat('ru-RU').format(n);
const def=()=>({water:{},waterGoal:0,sessions:{},medications:[],medLogs:{},sleep:[],cycleEnabled:false,cycleLength:28,cycles:[]});
function load(){
 try{
  const value=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!value||typeof value!=='object'||Array.isArray(value))return def();
  const base=def();
  for(const name of ['water','sessions','medLogs'])if(value[name]&&typeof value[name]==='object'&&!Array.isArray(value[name]))base[name]=value[name];
  for(const name of ['medications','sleep','cycles'])if(Array.isArray(value[name]))base[name]=value[name].slice(-250);
  base.waterGoal=Number.isInteger(value.waterGoal)&&value.waterGoal>=0&&value.waterGoal<=6000?value.waterGoal:0;
  base.cycleEnabled=value.cycleEnabled===true;
  base.cycleLength=Number.isInteger(value.cycleLength)&&value.cycleLength>=21&&value.cycleLength<=45?value.cycleLength:28;
  return base;
 }catch{return def()}
}
let state=load(),space='',careTool='',healthTool='',session=null,timer=0,lastWater=0,lastWaterDate='';
const icon=(name)=>({
 breath:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 12c5-6 10-5 11 0s-3 7-6 4M3 22c8-6 13-4 15 0s-3 6-6 4M17 7c5-4 10-3 11 2s-3 6-6 5"/></svg>',
 water:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C12 9 8 15 8 20a8 8 0 0 0 16 0c0-5-4-11-8-17Z"/><path d="M12 21c0 2 2 4 4 4"/></svg>',
 eyes:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16Z"/><circle cx="16" cy="16" r="4"/></svg>',
 steps:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 28c-3-2-4-6-2-9l4-5c2-2 5-1 5 2v5c0 4-3 8-7 7Z"/><path d="M20 11c-2-2-2-5 0-7s5-1 6 2-2 5-6 5Z"/></svg>',
 meds:'<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="11" width="22" height="11" rx="5.5" transform="rotate(-45 16 16)"/><path d="m12 12 8 8"/></svg>',
 sleep:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M23 5a12 12 0 1 0 4 20A12 12 0 0 1 23 5Z"/></svg>'
})[name];
const btn=(key,label,sub)=>'<button type="button" class="pw-card" data-pw-tool="'+key+'" aria-pressed="false">'+icon(key)+'<strong>'+label+'</strong><small id="pwCard'+key+'">'+sub+'</small></button>';
host.innerHTML=`
 <section id="pwCare">
  <button type="button" class="pw-tool-back" id="pwCareBack" hidden aria-label="Вернуться к инструментам заботы">
   <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg>
   <span>Все инструменты</span>
  </button>
  <div class="pw-tiles">${btn('breath','Дыхание','1–5 минут')}${btn('water','Вода','Мой баланс')}${btn('eyes','Глаза','Минута отдыха')}${btn('steps','Шаги','Сегодня')}</div>
  <section id="pwCareDetail" class="pw-detail" hidden>
   <div data-pw-panel="breath" hidden>
    <header class="pw-panel-head"><h3>Минута спокойствия</h3><p>Дышите в комфортном ритме. Без задержек.</p></header>
    <div class="pw-segment-field"><span class="pw-control-label">Длительность</span><div class="pw-segments" role="group" aria-label="Длительность практики">
     <button type="button" data-pw-duration="1" aria-pressed="true">1 мин</button><button type="button" data-pw-duration="3" aria-pressed="false">3 мин</button><button type="button" data-pw-duration="5" aria-pressed="false">5 мин</button>
    </div><input id="pwBreathDuration" type="hidden" value="1"></div>
    <div class="pw-center"><div id="pwBreathRing" class="pw-breath-ring is-preview" aria-hidden="true"><span class="pw-breath-aura"></span><span class="pw-breath-orbit"></span><div class="pw-breath-disc"><span class="pw-breath-core"></span></div></div><strong id="pwBreathStage">Вдох — 4 сек. · выдох — 6 сек.</strong><output id="pwBreathClock" class="pw-clock">01:00</output><div class="pw-actions"><button type="button" id="pwBreathStart" class="pw-primary">Начать</button><button type="button" id="pwBreathStop" hidden>Завершить</button></div></div>
    <p class="pw-caption">При головокружении или дискомфорте остановитесь и дышите как обычно.</p>
   </div>
   <div data-pw-panel="water" hidden>
    <header class="pw-panel-head"><h3>Водный баланс</h3><p>Отмечайте только то, что действительно выпили.</p></header>
    <div class="pw-water-scene" aria-hidden="true"><svg class="pw-water-figure" viewBox="0 0 120 150" focusable="false"><defs><clipPath id="pwWaterClip"><path d="M60 8C51 24 23 62 23 88a37 37 0 0 0 74 0C97 62 69 24 60 8Z"/></clipPath></defs><g clip-path="url(#pwWaterClip)"><rect id="pwWaterFill" x="0" y="150" width="120" height="150" class="pw-water-liquid"/><path class="pw-water-shine" d="M40 95c-1 15 7 24 16 29"/></g><path class="pw-water-outline" d="M60 8C51 24 23 62 23 88a37 37 0 0 0 74 0C97 62 69 24 60 8Z"/></svg><small id="pwWaterFigureCaption">Задайте цель для индикатора</small></div>
    <div class="pw-number"><strong id="pwWaterValue">0 мл</strong><small id="pwWaterGoalText">Цель не задана</small></div>
    <div class="pw-progress" role="progressbar" aria-label="Выполнено от личной цели" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="pwWaterProgress"></span></div>
    <div class="pw-actions"><button type="button" class="pw-primary" data-pw-water="250">+ 250 мл</button><button type="button" data-pw-water="150">+ 150 мл</button><button type="button" data-pw-water="500">+ 500 мл</button><button type="button" id="pwWaterUndo" disabled>Отменить</button></div>
    <div class="pw-inline"><label>Моя цель, мл / день<input id="pwWaterGoalInput" type="number" inputmode="numeric" min="250" max="6000" step="50" placeholder="Необязательно"></label><button type="button" id="pwWaterSaveGoal">Сохранить</button></div>
    <section class="pw-water-insight" aria-labelledby="pwWaterInsightHeading">
     <div class="pw-insight-head"><span class="pw-insight-mark" aria-hidden="true">✧</span><h4 id="pwWaterInsightHeading">SEYVEO · Умная забота</h4><small>По вашим записям</small></div>
     <p id="pwWaterAdvice" class="pw-insight-advice" aria-live="polite"></p>
     <p id="pwWaterWeek" class="pw-insight-week"></p>
     <details class="pw-insight-explain"><summary>Почему такая подсказка?</summary>
      <p>Я вижу только вручную внесённые миллилитры. Неотмеченные напитки не учитываются, пропуски не означают, что вы ничего не пили. Личная цель — ориентир, не медицинская норма. Если врач назначил ограничение жидкости, следуйте его плану.</p>
      <p>Общие рекомендации: NHS — 6–8 стаканов <em>жидкости</em> как ориентир, с поправкой на обстоятельства; Национальные академии США — данные о <em>всей</em> воде, включая пищу. Эти величины не являются автоматической целью для вашего счётчика.</p>
      <div class="pw-insight-sources"><a href="https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/" target="_blank" rel="noopener noreferrer">NHS · питьевой режим ↗</a><a href="https://www.nationalacademies.org/read/10925/chapter/2" target="_blank" rel="noopener noreferrer">Национальные академии ↗</a></div>
     </details>
    </section>
    <p class="pw-caption">Это общая справочная информация, не медицинская оценка. Не пейте через силу; если врач ограничил жидкость, следуйте назначению.</p>
   </div>
   <div data-pw-panel="eyes" hidden>
    <header class="pw-panel-head"><h3>Отдых для глаз</h3><p>Короткий перерыв по правилу 20–20–20.</p></header>
    <div class="pw-center"><div id="pwEye" class="pw-eye" aria-hidden="true">${icon('eyes')}</div><strong id="pwEyeStage">Посмотрите вдаль</strong><p id="pwEyeTip">На предмет примерно в шести метрах или дальше.</p><output id="pwEyeClock" class="pw-clock">01:00</output><div class="pw-actions"><button type="button" id="pwEyeStart" class="pw-primary">Начать</button><button type="button" id="pwEyeStop" hidden>Завершить</button></div></div>
    <p class="pw-caption">Перерывы помогают снизить зрительное напряжение, но не исправляют зрение.</p>
   </div>
   <div data-pw-panel="steps" hidden>
    <header class="pw-panel-head"><h3>Мои шаги</h3><p>Без автоматического считывания с телефона.</p></header>
    <div class="pw-number"><strong id="pwStepsValue">—</strong><small id="pwStepsSource">Сегодня нет записи</small></div>
    <form id="pwStepsForm" class="pw-inline pw-date-fields"><label>Дата<input id="pwStepsDate" type="date" required></label><label>Шагов<input id="pwStepsInput" type="number" min="0" max="200000" step="1" inputmode="numeric" required placeholder="Например, 6500"></label><button type="submit" class="pw-primary">Сохранить</button></form>
    <div id="pwStepsWeek" class="pw-week"></div>
    <p class="pw-caption">Прежние записи шагов сохранены. Одна текущая запись на выбранный день.</p>
   </div>
  </section>
  <button id="pwCycleOpen" class="pw-wide-row" type="button" aria-expanded="false"><span class="pw-symbol">♡</span><span><strong>Женский цикл</strong><small>Личный календарь · только по желанию</small></span><span class="pw-arrow">›</span></button>
  <section id="pwCycleDetail" class="pw-detail" hidden>
   <div id="pwCycleConsent"><h3>Личный календарь</h3><p>Даты цикла — чувствительные данные. Они хранятся без шифрования только в этом браузере. На общем устройстве их могут увидеть другие люди.</p><label class="pw-consent"><input id="pwCycleCheck" type="checkbox"> Я понимаю и хочу включить календарь</label><button id="pwCycleEnable" type="button" class="pw-primary" disabled>Включить</button></div>
   <div id="pwCycleBody" hidden>
    <div class="pw-number"><strong id="pwCycleNext">—</strong><small>Ориентировочное следующее начало</small></div>
    <form id="pwCycleForm"><div class="pw-inline pw-date-fields"><label>Начало<input id="pwCycleDate" type="date" required></label><label>Обычно дней<input id="pwCycleLength" type="number" min="21" max="45" step="1" inputmode="numeric" required value="28"></label><button type="submit" class="pw-primary">Записать</button></div></form>
    <div id="pwCycleList" class="pw-list"></div><p class="pw-caption">Прогноз приблизительный: не использовать для контрацепции или диагноза.</p><details class="pw-cycle-privacy"><summary>Данные календаря</summary><p>Можно отключить календарь без удаления истории или удалить все его даты с этого устройства.</p><div class="pw-actions"><button type="button" id="pwCycleDisable">Отключить</button><button type="button" id="pwCycleErase">Удалить историю</button></div></details>
   </div>
  </section>
 </section>
 <section id="pwHealth" hidden>
  <button id="pwHealthBack" type="button" class="pw-tool-back" hidden aria-label="Вернуться к показателям здоровья"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg><span>Все показатели</span></button>
  <div class="pw-tiles pw-health-tiles">${btn('meds','Лекарства','По назначению')}${btn('sleep','Сон','Личный дневник')}</div>
  <section id="pwHealthDetail" class="pw-detail" hidden>
   <div data-pw-panel="meds" hidden>
    <header class="pw-panel-head"><h3>Приём лекарств</h3><p>Только по вашему расписанию, без рекомендаций по дозировкам.</p></header>
    <form id="pwMedForm" class="pw-form"><label>Название<input id="pwMedName" type="text" maxlength="90" required placeholder="Из назначения"></label><div class="pw-inline"><label>Доза по назначению<input id="pwMedDose" maxlength="80" required placeholder="Как назначено"></label><label class="pw-time-field"><span class="pw-control-label">Время</span><input id="pwMedTime" type="time" value="09:00" required step="60" aria-label="Время приёма лекарства"></label></div>
    <button type="submit" class="pw-primary">Добавить</button></form>
    <div id="pwMedList" class="pw-list"></div>
    <p class="pw-caption">Отметки сохраняются вручную. Push-напоминаний при закрытом приложении нет. Пропуск не означает, что дозу нужно удваивать.</p>
   </div>
   <div data-pw-panel="sleep" hidden>
    <header class="pw-panel-head"><h3>Дневник сна</h3><p>Личные записи, не медицинский анализ.</p></header>
    <form id="pwSleepForm" class="pw-form"><div class="pw-inline pw-date-fields"><label>Дата пробуждения<input id="pwSleepDate" type="date" required></label><label>Часов<input id="pwSleepHours" type="number" min=".5" max="24" step=".5" inputmode="decimal" required placeholder="7.5"></label></div><div class="pw-segment-field"><span class="pw-control-label">Как спалось</span><div class="pw-segments" role="group" aria-label="Качество сна">
     <button type="button" data-pw-sleep-quality="good" aria-pressed="false">Хорошо</button><button type="button" data-pw-sleep-quality="normal" aria-pressed="true">Обычно</button><button type="button" data-pw-sleep-quality="poor" aria-pressed="false">Беспокойно</button>
    </div><input type="hidden" id="pwSleepQuality" value="normal"></div><button type="submit" class="pw-primary">Сохранить</button></form>
    <div id="pwSleepList" class="pw-list"></div>
   </div>
  </section>
 </section>
 <p id="pwStatus" class="pw-status" role="status" aria-live="polite"></p>
`;
function notice(message){$('pwStatus').textContent=message||'';}
function save(mutator){
 const next=JSON.parse(JSON.stringify(state));
 try{
  mutator(next);
  localStorage.setItem(KEY,JSON.stringify(next));
  state=next;
  window.dispatchEvent(new Event('seyveo:wellness-changed'));
  return true;
 }catch(error){console.error('SEYVEO private journal:',error);notice('Не удалось сохранить запись. Проверьте настройки браузера.');return false;}
}
/* Local Black Velvet date picker for the three wellness dates.
   Keep original native input values, constraints and all saved records. */
const pwDateInputs=['pwStepsDate','pwCycleDate','pwSleepDate'];
const pwDateButtons={};
let pwSelectedDateInput=null,pwVisibleYear=0,pwVisibleMonth=0;
const pwDatePopup=document.createElement('div');
pwDatePopup.id='pwDatePopup';
pwDatePopup.className='pw-date-popup';
pwDatePopup.hidden=true;
pwDatePopup.setAttribute('role','dialog');
pwDatePopup.setAttribute('aria-label','Выбрать дату');
pwDatePopup.innerHTML='<div class="pw-date-popup-header"><button type="button" data-pw-month="-1" aria-label="Предыдущий месяц">‹</button><strong id="pwDateMonthName"></strong><button type="button" data-pw-month="1" aria-label="Следующий месяц">›</button></div><div class="pw-date-weekdays" aria-hidden="true"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div><div class="pw-date-days" id="pwDateDays" role="group" aria-label="Дни месяца"></div><div class="pw-date-popup-footer"><button type="button" data-pw-pick-today>Сегодня</button><button type="button" data-pw-picker-close>Готово</button></div>';
const pwDialog=$('calendarSpaceDialog');
pwDialog.append(pwDatePopup);
function pwSyncDateButtons(){
 for(const id of pwDateInputs){
  const input=$(id),button=pwDateButtons[id];if(!input||!button)continue;
  button.textContent=dateOk(input.value)?new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(input.value+'T12:00:00')):'Выбрать дату';
 }
}
function pwCloseDatePopup(restoreFocus=true){
 const target=pwSelectedDateInput;
 pwDatePopup.hidden=true;
 pwSelectedDateInput=null;
 for(const button of Object.values(pwDateButtons))button.setAttribute('aria-expanded','false');
 if(restoreFocus&&target)pwDateButtons[target.id]?.focus({preventScroll:true});
}
function pwDrawDatePopup(){
 if(!pwSelectedDateInput)return;
 const displayed=new Date(pwVisibleYear,pwVisibleMonth,1,12);
 $('pwDateMonthName').textContent=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(displayed);
 const todayParts=today().split('-').map(Number),lastMonth=new Date(todayParts[0],todayParts[1]-1,1,12);
 pwDatePopup.querySelector('[data-pw-month="1"]').disabled=displayed>=lastMonth;
 pwDatePopup.querySelector('[data-pw-month="-1"]').disabled=pwVisibleYear<=1900&&pwVisibleMonth===0;
 const days=$('pwDateDays');days.replaceChildren();
 const offset=(displayed.getDay()+6)%7;
 for(let i=0;i<offset;i++){const blank=document.createElement('span');blank.setAttribute('aria-hidden','true');days.append(blank);}
 const total=new Date(pwVisibleYear,pwVisibleMonth+1,0).getDate();
 for(let i=1;i<=total;i++){
  const value=[pwVisibleYear,pad(pwVisibleMonth+1),pad(i)].join('-');
  const b=document.createElement('button');b.type='button';b.dataset.pwPickDate=value;b.textContent=String(i);
  b.disabled=value>today();b.setAttribute('aria-label',new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T12:00:00')));
  if(value===pwSelectedDateInput.value)b.setAttribute('aria-selected','true');
  if(value===today())b.classList.add('is-today');
  days.append(b);
 }
}
for(const id of pwDateInputs){
 const input=$(id);if(!input)continue;
 input.classList.add('pw-date-native');
 input.tabIndex=-1;
 const button=document.createElement('button');button.type='button';button.className='pw-date-open';
 button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.setAttribute('aria-label','Выбрать дату: '+input.parentElement.firstChild.textContent.trim());
 input.insertAdjacentElement('afterend',button);
 pwDateButtons[id]=button;
 button.addEventListener('click',()=>{
  if(pwSelectedDateInput===input&&!pwDatePopup.hidden){pwCloseDatePopup();return;}
  pwSelectedDateInput=input;
  const value=dateOk(input.value)?input.value:today();
  const parts=value.split('-').map(Number);pwVisibleYear=parts[0];pwVisibleMonth=parts[1]-1;
  pwDatePopup.hidden=false;
  for(const b of Object.values(pwDateButtons))b.setAttribute('aria-expanded',String(b===button));
  pwDrawDatePopup();
  pwDatePopup.querySelector('[data-pw-picker-close]').focus({preventScroll:true});
 });
 input.addEventListener('change',pwSyncDateButtons);
}
pwDatePopup.addEventListener('click',event=>{
 const target=event.target.closest('button');if(!target||!pwSelectedDateInput)return;
 if(target.hasAttribute('data-pw-picker-close')){pwCloseDatePopup();return;}
 if(target.dataset.pwMonth){
  const delta=Number(target.dataset.pwMonth);const d=new Date(pwVisibleYear,pwVisibleMonth+delta,1,12);
  pwVisibleYear=d.getFullYear();pwVisibleMonth=d.getMonth();pwDrawDatePopup();return;
 }
 const value=target.hasAttribute('data-pw-pick-today')?today():target.dataset.pwPickDate;
 if(!dateOk(value)||value>today())return;
 pwSelectedDateInput.value=value;
 pwSelectedDateInput.dispatchEvent(new Event('input',{bubbles:true}));
 pwSelectedDateInput.dispatchEvent(new Event('change',{bubbles:true}));
 pwSyncDateButtons();pwCloseDatePopup();
});
pwDialog.addEventListener('click',event=>{
 if(pwDatePopup.hidden||event.target.closest('#pwDatePopup,.pw-date-open'))return;
 pwCloseDatePopup(false);
});
pwDialog.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!pwDatePopup.hidden){event.stopPropagation();event.preventDefault();pwCloseDatePopup();}
});
function today(){return dateKey()}
function setInputDefaults(){
 for(const id of ['pwStepsDate','pwCycleDate','pwSleepDate']){
  const el=$(id);el.max=today();if(!el.value||el.value>today())el.value=today();
 }
 pwSyncDateButtons();
 if(!$('pwMedTime').value)$('pwMedTime').value='09:00';
 pwSyncTime();
}
/* Medication times: same Black Velvet controls, preserve native HH:MM storage. */
const pwTimeInput=$('pwMedTime'),pwTimeButton=document.createElement('button');
pwTimeInput.classList.add('pw-time-native');pwTimeInput.tabIndex=-1;
pwTimeButton.type='button';pwTimeButton.className='pw-time-open';
pwTimeButton.setAttribute('aria-haspopup','dialog');pwTimeButton.setAttribute('aria-expanded','false');
pwTimeButton.setAttribute('aria-label','Выбрать время приёма');
pwTimeInput.insertAdjacentElement('afterend',pwTimeButton);
const pwTimePopup=document.createElement('div');pwTimePopup.className='pw-time-popup';pwTimePopup.hidden=true;
pwTimePopup.id='pwTimePopup';pwTimePopup.setAttribute('role','dialog');pwTimePopup.setAttribute('aria-label','Время приёма лекарства');
pwTimePopup.innerHTML='<strong>Время приёма</strong><p>Укажите часы и минуты</p><div class="pw-time-fields"><label>Часы<input id="pwTimeHours" type="number" min="0" max="23" inputmode="numeric" maxlength="2"></label><label>Минуты<input id="pwTimeMinutes" type="number" min="0" max="59" inputmode="numeric" maxlength="2"></label></div><div class="pw-time-actions"><button type="button" data-pw-time-cancel>Отмена</button><button type="button" data-pw-time-confirm>Готово</button></div>';
$('calendarSpaceDialog').append(pwTimePopup);
const pwSyncTime=()=>{pwTimeButton.textContent=pwTimeInput.value||'Выбрать время'};
const pwCloseTime=(focus=true)=>{
 pwTimePopup.hidden=true;pwTimeButton.setAttribute('aria-expanded','false');
 if(focus)pwTimeButton.focus({preventScroll:true});
};
pwTimeButton.addEventListener('click',()=>{
 if(!pwTimePopup.hidden){pwCloseTime();return;}
 if(!pwDatePopup.hidden)pwCloseDatePopup(false);
 const [h,m]=(pwTimeInput.value||'09:00').split(':');
 $('pwTimeHours').value=String(Number(h));$('pwTimeMinutes').value=String(Number(m));
 pwTimePopup.hidden=false;pwTimeButton.setAttribute('aria-expanded','true');
 $('pwTimeHours').focus({preventScroll:true});
});
pwTimePopup.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.hasAttribute('data-pw-time-cancel')){pwCloseTime();return;}
 if(button.hasAttribute('data-pw-time-confirm')){
  const h=Number($('pwTimeHours').value),m=Number($('pwTimeMinutes').value);
  if(!$('pwTimeHours').value||!$('pwTimeMinutes').value||!Number.isInteger(h)||!Number.isInteger(m)||h<0||h>23||m<0||m>59){
   $('pwTimeHours').focus({preventScroll:true});return;
  }
  pwTimeInput.value=pad(h)+':'+pad(m);
  pwTimeInput.dispatchEvent(new Event('change',{bubbles:true}));
  pwSyncTime();pwCloseTime();
 }
});
$('calendarSpaceDialog').addEventListener('click',event=>{
 if(!pwTimePopup.hidden&&!event.target.closest('#pwTimePopup,.pw-time-open'))pwCloseTime(false);
});
$('calendarSpaceDialog').addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!pwTimePopup.hidden){event.preventDefault();event.stopPropagation();pwCloseTime();}
});
pwTimeInput.addEventListener('change',pwSyncTime);
pwSyncTime();

/* iOS / browser native time wheel; pwMedTime remains saved as HH:MM. */
const CARE_TOOLS=new Set(['water','breath','eyes','steps']);
function setToolFocus(section,focused){
 const care=section==='care',active=Boolean(focused&&space===section);
 const element=document.activeElement;
 // A field must release the keyboard before the sheet changes height.
 if(element&&host.contains(element)&&element.matches('input,textarea,select'))element.blur();
 $(care?'pwCare':'pwHealth').classList.toggle('is-focused',active);
 $(care?'pwCareBack':'pwHealthBack').hidden=!active;
 const dialog=$('calendarSpaceDialog');
 dialog.dataset[care?'careFocus':'healthFocus']=String(active);
 if(active)dialog.scrollTop=0;
}
function resetTools(){
 stopSession(false);careTool='';healthTool='';notice('');
 $('pwCareDetail').hidden=true;$('pwHealthDetail').hidden=true;
 host.querySelectorAll('[data-pw-panel]').forEach(el=>el.hidden=true);
 host.querySelectorAll('[data-pw-tool]').forEach(el=>el.setAttribute('aria-pressed','false'));
 $('pwCycleDetail').hidden=true;$('pwCycleOpen').setAttribute('aria-expanded','false');
 setToolFocus('care',false);setToolFocus('health',false);
}
function openSpace(view){
 if(view!=='care'&&view!=='health'){host.hidden=true;resetTools();space='';return;}
 if(space!==view){resetTools();lastWater=0;lastWaterDate='';}
 space=view;host.hidden=false;
 $('pwCare').hidden=view!=='care';$('pwHealth').hidden=view!=='health';
 setInputDefaults();state=load();render();
}
function resetSectionTools(section){
 const care=section==='care';
 if(care)careTool='';else healthTool='';
 $(care?'pwCareDetail':'pwHealthDetail').hidden=true;
 setToolFocus(section,false);
 host.querySelectorAll('[data-pw-panel]').forEach(p=>{
  if(CARE_TOOLS.has(p.dataset.pwPanel)===care)p.hidden=true;
 });
 host.querySelectorAll('[data-pw-tool]').forEach(p=>{
  if(CARE_TOOLS.has(p.dataset.pwTool)===care)p.setAttribute('aria-pressed','false');
 });
}
function openTool(key){
 if(session)stopSession(false);
 const care=CARE_TOOLS.has(key),section=care?'care':'health';
 if(care){
  $('pwCycleDetail').hidden=true;
  $('pwCycleOpen').setAttribute('aria-expanded','false');
 }
 const holder=$(care?'pwCareDetail':'pwHealthDetail');
 const active=(care?careTool:healthTool)===key;
 if(care)careTool=active?'':key;else healthTool=active?'':key;
 holder.hidden=active;
 host.querySelectorAll('[data-pw-panel]').forEach(p=>{
  if(CARE_TOOLS.has(p.dataset.pwPanel)===care)p.hidden=active||p.dataset.pwPanel!==key;
 });
 host.querySelectorAll('[data-pw-tool]').forEach(p=>{
  if(CARE_TOOLS.has(p.dataset.pwTool)===care)
   p.setAttribute('aria-pressed',String(!active&&p.dataset.pwTool===key));
 });
 setToolFocus(section,!active);
 if(!active)$(care?'pwCareBack':'pwHealthBack').focus({preventScroll:true});
 if(!active&&care&&key==='steps')fillSteps();
 if(!active)notice('');
}
const eyeStages=[
 {seconds:20,name:'Посмотрите вдаль',tip:'На предмет примерно в шести метрах или дальше.'},
 {seconds:15,name:'Поморгайте спокойно',tip:'Несколько мягких морганий, без усилий.'},
 {seconds:25,name:'Близко и далеко',tip:'Неспешно переведите взгляд с близкого предмета вдаль.'}
];
const clock=n=>{const sec=Math.max(0,Math.ceil(n));return pad(Math.floor(sec/60))+':'+pad(sec%60)};
function stopSession(done=false){
 clearInterval(timer);timer=0;
 const old=session;session=null;
 if(!old)return;
 if(old.kind==='breath'){
  $('pwBreathRing').className='pw-breath-ring is-preview';
  $('pwBreathDuration').disabled=false;
  host.querySelectorAll('[data-pw-duration]').forEach(button=>button.disabled=false);
  $('pwBreathStart').textContent='Начать';$('pwBreathStop').hidden=true;
  $('pwBreathStage').textContent=done?'Пауза завершена':'Вдох — 4 сек. · выдох — 6 сек.';
  $('pwBreathClock').textContent=done?'00:00':clock(Number($('pwBreathDuration').value)*60);
 }else{
  $('pwEye').classList.remove('is-running');
  $('pwEyeStart').textContent='Начать';$('pwEyeStop').hidden=true;
  $('pwEyeClock').textContent=done?'00:00':'01:00';
  $('pwEyeStage').textContent=done?'Пауза завершена':eyeStages[0].name;
  $('pwEyeTip').textContent=done?'Можно возвращаться к делам.':eyeStages[0].tip;
 }
 if(done){
  if(save(d=>{
   const day=today(),prev=d.sessions[day]||{breath:0,eyes:0};
   d.sessions[day]={...prev,[old.kind]:(Number(prev[old.kind])||0)+1};
  }))notice('Готово. Пауза отмечена на сегодня.');
 }
}
function startSession(kind){
 if(session&&session.kind!==kind)stopSession();
 const isBreath=kind==='breath',button=$(isBreath?'pwBreathStart':'pwEyeStart');
 if(session){
  session.paused=!session.paused;session.last=performance.now();
  button.textContent=session.paused?'Продолжить':'Пауза';
  clearInterval(timer);timer=0;
  if(session.paused){
   // Keep the current breathing animation frame instead of shrinking the pearl.
   if(isBreath)$('pwBreathRing').classList.add('is-paused');
   else $('pwEye').classList.remove('is-running');
  }else{
   if(isBreath)$('pwBreathRing').classList.remove('is-paused');
   else $('pwEye').classList.add('is-running');
   tick();timer=setInterval(tick,250);
  }
  return;
 }
 session={kind,elapsed:0,total:isBreath?Number($('pwBreathDuration').value)*60:60,paused:false,last:performance.now()};
 button.textContent='Пауза';$(isBreath?'pwBreathStop':'pwEyeStop').hidden=false;
 if(isBreath){
  $('pwBreathDuration').disabled=true;
  host.querySelectorAll('[data-pw-duration]').forEach(button=>button.disabled=true);
 }
 else $('pwEye').classList.add('is-running');
 tick();
 timer=setInterval(tick,250);
}
function tick(){
 if(!session||session.paused)return;
 const now=performance.now();
 session.elapsed+=Math.max(0,Math.min(1,(now-session.last)/1000));session.last=now;
 if(session.elapsed>=session.total){stopSession(true);return;}
 const remain=clock(session.total-session.elapsed);
 if(session.kind==='breath'){
  const inhale=session.elapsed%10<4,ring=$('pwBreathRing');
  // CSS owns the whole 4s/6s cycle; the timer only labels the current phase.
  if(!ring.classList.contains('is-active'))ring.className='pw-breath-ring is-active';
  const stage=inhale?'Плавный вдох':'Спокойный выдох';
  if($('pwBreathStage').textContent!==stage)$('pwBreathStage').textContent=stage;
  if($('pwBreathClock').textContent!==remain)$('pwBreathClock').textContent=remain;
 }else{
  let elapsed=session.elapsed,index=0;
  while(index<eyeStages.length-1&&elapsed>=eyeStages[index].seconds){elapsed-=eyeStages[index].seconds;index++;}
  if($('pwEyeStage').textContent!==eyeStages[index].name)
   $('pwEyeStage').textContent=eyeStages[index].name;
  if($('pwEyeTip').textContent!==eyeStages[index].tip)
   $('pwEyeTip').textContent=eyeStages[index].tip;
  if($('pwEyeClock').textContent!==remain)$('pwEyeClock').textContent=remain;
 }
}
function renderWater(){
 const ml=Math.max(0,Number(state.water[today()])||0);
 $('pwWaterValue').textContent=format(ml)+' мл';
 $('pwCardwater').textContent=ml?format(ml)+' мл сегодня':'Мой баланс';
 $('pwWaterGoalText').textContent=state.waterGoal?'Цель: '+format(state.waterGoal)+' мл':'Цель не задана';
 const pct=state.waterGoal?Math.min(100,Math.round(ml/state.waterGoal*100)):0;
 // Animate the fill only on a real water/goal change; no continuous repaint.
 $('pwWaterFill').setAttribute('y',String(Math.round(150-150*pct/100)));
 $('pwWaterFigureCaption').textContent=state.waterGoal?pct+'% от личной цели':'Задайте цель для индикатора';
 $('pwWaterProgress').style.width=pct+'%';
 $('pwWaterProgress').parentElement.setAttribute('aria-valuenow',String(pct));
 if(document.activeElement!==$('pwWaterGoalInput'))$('pwWaterGoalInput').value=state.waterGoal||'';
 $('pwWaterUndo').disabled=lastWater<=0||lastWaterDate!==today();
 renderWaterInsights(ml);
}
/* Explain only the user's own entries. No assumed drinking amount, diagnosis
   or invented 2L target; absent days are missing observations, not zero intake. */
function renderWaterInsights(ml){
 const goal=state.waterGoal;
 let advice;
 if(!goal){
  advice=ml>0
   ?'Вы отметили '+format(ml)+' мл. Это только внесённые напитки, а не вся выпитая за день жидкость. Личную цель можно задать по желанию.'
   :'Начните с записи напитков, когда вам удобно. Личная цель необязательна — универсальной нормы «2 литра для всех» нет.';
 }else if(!ml){
  advice='У вас задан личный ориентир '+format(goal)+' мл. Сегодня записей пока нет — это не означает, что вы ничего не пили.';
 }else if(ml>=goal){
  advice='По вашим записям личная цель достигнута. Не нужно пить сверх желания ради цифры в приложении.';
 }else{
  advice='По записям пока не достигнут ваш личный ориентир. Проверьте, все ли напитки внесены: неполный дневник не показывает обезвоживание.';
 }
 $('pwWaterAdvice').textContent=advice;
 const recorded=[];
 for(let offset=0;offset<7;offset++){
  const day=new Date();day.setHours(12,0,0,0);day.setDate(day.getDate()-offset);
  const amount=Number(state.water[dateKey(day)]);
  if(Number.isFinite(amount)&&amount>0)recorded.push(Math.min(20000,amount));
 }
 $('pwWaterWeek').textContent=recorded.length>=3
  ?'За последние 7 дней есть записи за '+recorded.length+' дн. Среднее по дням с записями — '+format(Math.round(recorded.reduce((sum,n)=>sum+n,0)/recorded.length))+' мл. Пропуски в среднее не включены.'
  :recorded.length
   ?'За последние 7 дней записи есть за '+recorded.length+' дн. Для обзора привычек пока мало данных; пропуски не считаю нулём.'
   :'За последнюю неделю записей нет. Это не означает отсутствие питья.';
}
function updateWater(amount){
 if(!Number.isInteger(amount))return;
 const day=today(),previous=Math.max(0,Math.min(20000,Number(state.water[day])||0));
 // Undo only the amount actually recorded, even near the daily storage limit.
 const next=Math.max(0,Math.min(20000,previous+amount));
 if(next===previous){notice('Значение воды не изменилось.');return;}
 if(save(d=>{d.water[day]=next;})){
  lastWater=amount>0?next-previous:0;
  lastWaterDate=amount>0?day:'';
  renderWater();notice(amount>0?'Вода добавлена.':'Последнее добавление отменено.');
 }
}
function saveGoal(){
 const raw=$('pwWaterGoalInput').value.trim(),goal=raw?Number(raw):0;
 if(!Number.isInteger(goal)||goal<0||(goal>0&&goal<250)||goal>6000){notice('Цель: от 250 до 6000 мл или пустое поле.');return;}
 if(save(d=>d.waterGoal=goal)){renderWater();notice('Личная цель сохранена.');}
}
function getStep(date){return window.SEYVEO_SPACES?.stepsFor?.(date)||null;}
function stepCount(item){if(!item)return null;const digits=String(item.title||'').replace(/\s+/g,'');return /^\d{1,6}$/.test(digits)?Number(digits):null;}
function renderSteps(){
 const entry=getStep(today()),count=stepCount(entry);
 $('pwCardsteps').textContent=entry?(count===null?entry.title:format(count))+' сегодня':'Сегодня нет записи';
 $('pwStepsValue').textContent=count===null?(entry?.title||'—'):format(count);
 $('pwStepsSource').textContent=entry?'Ручная запись':'Сегодня нет записи';
 const days=$('pwStepsWeek');days.replaceChildren();
 for(let age=6;age>=0;age--){
  const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()-age);
  const ymd=dateKey(date),value=stepCount(getStep(ymd));
  const cell=text('span',value===null?'—':value>=1000?(value/1000).toFixed(1).replace('.',',')+'к':String(value),'pw-week-item');
  cell.title=stamp(ymd)+': '+(value===null?'нет числовой записи':format(value)+' шагов');
  cell.append(text('small',new Intl.DateTimeFormat('ru-RU',{weekday:'short'}).format(date)));
  days.append(cell);
 }
}
function fillSteps(){const entry=getStep($('pwStepsDate').value),n=stepCount(entry);$('pwStepsInput').value=n===null?'':String(n);}
function renderMeds(){
 const rows=$('pwMedList');rows.replaceChildren();
 const meds=state.medications.filter(row=>row&&typeof row.name==='string').slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
 const completed=meds.filter(row=>state.medLogs[row.id+'|'+today()]==='taken').length;
 $('pwCardmeds').textContent=meds.length?completed+' из '+meds.length+' отмечено':'Нет назначений';
 if(!meds.length)rows.append(text('p','Пока нет записанных назначений.','pw-empty'));
 for(const row of meds){
  const wrap=document.createElement('article');wrap.className='pw-list-row';
  const info=document.createElement('div');
  info.append(text('strong',(row.time||'—')+' · '+row.name),text('small',row.dose||''));
  const done=state.medLogs[row.id+'|'+today()]==='taken';
  const buttons=document.createElement('div');buttons.className='pw-row-actions';
  const take=text('button',done?'✓ Принято':'Отметить приём');
  take.type='button';take.dataset.pwTaken=row.id;
  take.classList.add('pw-taken');
  take.setAttribute('aria-pressed',String(done));
  take.setAttribute('aria-label',done?'Снять отметку о приёме: '+row.name:'Отметить приём: '+row.name);
  take.title=done?'Нажмите, чтобы исправить ошибочную отметку':'';
  const del=text('button','Удалить');del.type='button';del.dataset.pwDelMed=row.id;
  buttons.append(take,del);wrap.append(info,buttons);rows.append(wrap);
 }
}
function renderSleep(){
 const rows=$('pwSleepList');rows.replaceChildren();
 const data=state.sleep.filter(r=>r&&dateOk(r.date)).slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,50);
 // A quick glance at the last entered night, never a guessed measurement.
 $('pwCardsleep').textContent=data.length?String(data[0].hours).replace('.',',')+' ч · '+stamp(data[0].date):'Нет записей';
 if(!data.length){rows.append(text('p','Добавьте первую запись сна.','pw-empty'));return;}
 const names={good:'Хорошо',normal:'Обычно',poor:'Беспокойно'};
 for(const row of data){
  const wrap=document.createElement('article');wrap.className='pw-list-row';
  const info=document.createElement('div');
  info.append(text('strong',stamp(row.date)+' · '+row.hours+' ч'),text('small',names[row.quality]||'Обычно'));
  const remove=text('button','Удалить');remove.type='button';remove.dataset.pwDelSleep=row.id;
  wrap.append(info,remove);rows.append(wrap);
 }
}
function renderCycle(){
 $('pwCycleConsent').hidden=state.cycleEnabled;
 $('pwCycleBody').hidden=!state.cycleEnabled;
 if(!state.cycleEnabled)return;
 $('pwCycleLength').value=state.cycleLength;
 const dates=state.cycles.filter(r=>r&&dateOk(r.date)).slice().sort((a,b)=>b.date.localeCompare(a.date));
 let next='—';
 if(dates.length){
  const d=new Date(dates[0].date+'T12:00:00');d.setDate(d.getDate()+state.cycleLength);
  next=stamp(dateKey(d));
 }
 $('pwCycleNext').textContent=next;
 const list=$('pwCycleList');list.replaceChildren();
 if(!dates.length)list.append(text('p','Начните с даты последнего цикла.','pw-empty'));
 for(const row of dates.slice(0,40)){
  const item=document.createElement('article');item.className='pw-list-row';
  item.append(text('strong',stamp(row.date)));
  const del=text('button','Удалить');del.type='button';del.dataset.pwDelCycle=row.id;
  item.append(del);list.append(item);
 }
}
function render(){
 if(!host.hidden){renderWater();renderSteps();renderMeds();renderSleep();renderCycle();}
}
function recordMed(e){
 e.preventDefault();
 const name=$('pwMedName').value.trim().slice(0,90),dose=$('pwMedDose').value.trim().slice(0,80),time=$('pwMedTime').value;
 if(!name||!dose||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){notice('Проверьте название, дозировку и время.');return;}
 if(state.medications.length>=60){notice('Лимит назначений — 60 записей.');return;}
 if(save(d=>d.medications.push({id:'med-'+Date.now()+'-'+Math.random().toString(36).slice(2),name,dose,time}))){
  $('pwMedForm').reset();setInputDefaults();renderMeds();notice('Запись сохранена на устройстве.');
 }
}
function recordSleep(e){
 e.preventDefault();
 const date=$('pwSleepDate').value,hours=Number($('pwSleepHours').value),quality=$('pwSleepQuality').value;
 if(!dateOk(date)||date>today()||!Number.isFinite(hours)||hours<.5||hours>24||hours*2%1!==0){notice('Проверьте дату и часы сна.');return;}
 if(save(d=>{
  const existing=d.sleep.find(x=>x.date===date);
  if(existing){existing.hours=hours;existing.quality=quality;}
  else d.sleep.push({id:'sleep-'+Date.now(),date,hours,quality});
  d.sleep=d.sleep.slice(-250);
 })){renderSleep();$('pwSleepHours').value='';notice('Сон записан.');}
}
function recordCycle(e){
 e.preventDefault();
 const date=$('pwCycleDate').value,length=Number($('pwCycleLength').value);
 if(!dateOk(date)||date>today()||!Number.isInteger(length)||length<21||length>45){notice('Проверьте дату и обычную длительность цикла (21–45 дней).');return;}
 if(save(d=>{
  d.cycleLength=length;
  if(!d.cycles.some(r=>r.date===date))d.cycles.push({id:'cycle-'+Date.now(),date});
  d.cycles=d.cycles.slice(-180);
 })){renderCycle();notice('Дата сохранена. Прогноз приблизительный.');}
}
host.addEventListener('click',event=>{
 const btn=event.target.closest('button');if(!btn)return;
 if(btn.id==='pwCareBack'){
  if(session)stopSession(false);
  const previous=careTool;
  const wasCycle=!$('pwCycleDetail').hidden;
  resetSectionTools('care');
  $('pwCycleDetail').hidden=true;
  $('pwCycleOpen').setAttribute('aria-expanded','false');
  $('calendarSpaceDialog').scrollTop=0;
  const target=wasCycle?$('pwCycleOpen'):
    host.querySelector('[data-pw-tool="'+previous+'"]');
  if(target)target.focus({preventScroll:true});
  notice('');
  return;
 }
 if(btn.id==='pwHealthBack'){
  const previous=healthTool;
  resetSectionTools('health');
  $('calendarSpaceDialog').scrollTop=0;
  const target=host.querySelector('[data-pw-tool="'+previous+'"]');
  if(target)target.focus({preventScroll:true});
  notice('');
  return;
 }
 if(btn.dataset.pwDuration){
  if(session)return;
  const duration=Number(btn.dataset.pwDuration);
  if(![1,3,5].includes(duration))return;
  $('pwBreathDuration').value=String(duration);
  host.querySelectorAll('[data-pw-duration]').forEach(button=>
   button.setAttribute('aria-pressed',String(button===btn)));
  $('pwBreathDuration').dispatchEvent(new Event('change',{bubbles:true}));
  return;
 }
 if(btn.dataset.pwSleepQuality){
  const quality=btn.dataset.pwSleepQuality;
  if(!['good','normal','poor'].includes(quality))return;
  $('pwSleepQuality').value=quality;
  host.querySelectorAll('[data-pw-sleep-quality]').forEach(button=>
   button.setAttribute('aria-pressed',String(button===btn)));
  return;
 }
 if(btn.dataset.pwTool){openTool(btn.dataset.pwTool);return;}
 if(btn.dataset.pwWater){updateWater(Number(btn.dataset.pwWater));return;}
 if(btn.id==='pwWaterUndo'){if(lastWater&&lastWaterDate===today())updateWater(-lastWater);return;}
 if(btn.id==='pwWaterSaveGoal'){saveGoal();return;}
 if(btn.id==='pwBreathStart'||btn.id==='pwEyeStart'){startSession(btn.id==='pwBreathStart'?'breath':'eyes');return;}
 if(btn.id==='pwBreathStop'||btn.id==='pwEyeStop'){stopSession(false);return;}
 if(btn.id==='pwCycleOpen'){
  const panel=$('pwCycleDetail'),opening=panel.hidden;
  panel.hidden=!opening;btn.setAttribute('aria-expanded',String(opening));
  if(opening){
   resetSectionTools('care');stopSession(false);setToolFocus('care',true);
   $('pwCareBack').focus({preventScroll:true});
  }else setToolFocus('care',false);
  return;
 }
 if(btn.id==='pwCycleEnable'){
  if(!$('pwCycleCheck').checked)return;
  if(save(d=>d.cycleEnabled=true)){renderCycle();notice('Календарь включён только на этом устройстве.');}return;
 }
 if(btn.id==='pwCycleDisable'){
  if(save(d=>d.cycleEnabled=false)){renderCycle();$('pwCycleCheck').checked=false;$('pwCycleEnable').disabled=true;notice('Календарь отключён. История сохранена на устройстве.');}return;
 }
 if(btn.id==='pwCycleErase'){
  if(!confirm('Удалить все даты женского цикла на этом устройстве? Без резервной копии восстановить не получится.'))return;
  if(save(d=>{d.cycles=[];d.cycleEnabled=false;})){
   renderCycle();$('pwCycleCheck').checked=false;$('pwCycleEnable').disabled=true;notice('Даты цикла удалены.');
  }return;
 }
 if(btn.dataset.pwTaken){
  const key=btn.dataset.pwTaken+'|'+today();
  const wasTaken=state.medLogs[key]==='taken';
  if(save(d=>{
   if(wasTaken)delete d.medLogs[key];
   else d.medLogs[key]='taken';
  })){
   renderMeds();
   // Keep focus in the same row after replacing the button, without scrolling.
   const row=host.querySelector('[data-pw-taken="'+CSS.escape(btn.dataset.pwTaken)+'"]');
   if(row)row.focus({preventScroll:true});
   notice(wasTaken?'Отметка о приёме отменена.':'Приём отмечен.');
  }
  return;
 }
 if(btn.dataset.pwDelMed){
  if(!confirm('Удалить назначение из личного журнала?'))return;
  if(save(d=>{d.medications=d.medications.filter(r=>r.id!==btn.dataset.pwDelMed);
    for(const k of Object.keys(d.medLogs))if(k.startsWith(btn.dataset.pwDelMed+'|'))delete d.medLogs[k];
  })){renderMeds();notice('Назначение удалено.');}return;
 }
 if(btn.dataset.pwDelSleep){
  if(!confirm('Удалить запись сна?'))return;
  if(save(d=>d.sleep=d.sleep.filter(r=>r.id!==btn.dataset.pwDelSleep))){renderSleep();notice('Запись удалена.');}return;
 }
 if(btn.dataset.pwDelCycle){
  if(!confirm('Удалить дату цикла?'))return;
  if(save(d=>d.cycles=d.cycles.filter(r=>r.id!==btn.dataset.pwDelCycle))){renderCycle();notice('Дата удалена.');}
 }
});
$('pwStepsForm').addEventListener('submit',event=>{
 event.preventDefault();
 const value=Number($('pwStepsInput').value),date=$('pwStepsDate').value;
 if(!dateOk(date)||date>today()||!Number.isInteger(value)||value<0||value>200000){notice('Укажите правильную дату и число шагов (0–200 000).');return;}
 const result=window.SEYVEO_SPACES.saveSteps(date,value);
 if(result){renderSteps();notice('Шаги сохранены в прежнем журнале.');}
 else notice('Не удалось сохранить шаги. Проверьте память браузера.');
});
$('pwStepsDate').addEventListener('change',fillSteps);
$('pwBreathDuration').addEventListener('change',()=>{if(!session)$('pwBreathClock').textContent=clock(Number($('pwBreathDuration').value)*60)});
$('pwMedForm').addEventListener('submit',recordMed);
$('pwSleepForm').addEventListener('submit',recordSleep);
$('pwCycleForm').addEventListener('submit',recordCycle);
$('pwCycleCheck').addEventListener('change',()=>$('pwCycleEnable').disabled=!$('pwCycleCheck').checked);
window.addEventListener('seyveo:space-opened',event=>openSpace(event.detail?.space));
window.addEventListener('seyveo:care-steps-open',event=>{
 if(space!=='care')openSpace('care');
 const date=event.detail?.date;
 if(dateOk(date))$('pwStepsDate').value=date;
 pwSyncDateButtons();
 openTool('steps');
});
window.addEventListener('seyveo:spaces-changed',()=>{if(space==='care')renderSteps()});
window.addEventListener('storage',event=>{if(event.key===KEY){state=load();if(!host.hidden)render()}});
$('calendarSpaceDialog').addEventListener('close',()=>{pwCloseDatePopup(false);pwCloseTime(false);stopSession(false);resetTools();space='';host.hidden=true});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&session&&!session.paused){
  session.paused=true;session.last=performance.now();
  clearInterval(timer);timer=0;
  $(session.kind==='breath'?'pwBreathStart':'pwEyeStart').textContent='Продолжить';
  if(session.kind==='breath')$('pwBreathRing').classList.add('is-paused');
  else $('pwEye').classList.remove('is-running');
 }
 if(!document.hidden&&space){state=load();setInputDefaults();render();}
});
})();
