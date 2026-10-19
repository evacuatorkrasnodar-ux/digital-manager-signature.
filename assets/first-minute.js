/* SEYVEO · Первая минута. First useful action after REAL First Awakening.
 * Locally functional task/notes, deterministic BUSINESS outline, no imaginary AI.
 * Existing installs stay undisturbed; management preview never writes user data. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=$('firstMinute'),home=$('homePage'),entry=$('openFirstMinuteDemo');
if(!root||!home)return;
const KEY='seyveo-first-minute-state-v1';
const PROFILE='seyveo-first-acquaintance-v1';
const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
const store=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}};
const choiceBox=$('firstMinuteChoices'),form=$('firstMinuteForm'),input=$('firstMinuteInput');
const results=$('firstMinuteResult'),plan=$('firstMinutePlan');
const btnAction=$('firstMinuteResultAction'),btnDone=$('firstMinuteDone');
let active=false,preview=false,choice='',focus='life',draft='',saved=false,returnToManage=false;
function profile(){
 try{const p=JSON.parse(read(PROFILE)||'null');return p&&typeof p==='object'?p:{}}catch{return {}}
}
function nameFor(profile){
 const n=typeof profile.name==='string'?profile.name.trim().replace(/\s+/g,' ').slice(0,30):'';
 return n||'друг';
}
function showView(view){
 choiceBox.hidden=view!=='choose';
 form.hidden=view!=='form';
 results.hidden=view!=='result';
 $('firstMinuteLater').hidden=view==='result'&&saved;
 $('firstMinuteStatus').textContent='';
}
function setResult(title,description){
 $('firstMinuteResultTitle').textContent=title;
 $('firstMinuteResultText').textContent=description;
}
function close(mark,restorePreview=true){
 if(!active)return;
 const backToManage=restorePreview&&preview&&returnToManage;
 if(!preview&&mark)store(KEY,mark);
 active=false;preview=false;returnToManage=false;choice='';saved=false;draft='';
 home.classList.remove('first-minute-active');
 root.hidden=true;input.value='';
 showView('choose');
 if(backToManage)$('navManage')?.click();
}
function start(isDemo,focusOverride){
 if(active)return;
 if(!isDemo&&read(KEY))return;
 if(!isDemo&&!read(PROFILE))return;
 // Nothing is removed from Home; a short one-off sheet temporarily takes
 // the status area beneath the exact same sphere.
 const p=profile();focus=['life','start','pro','max'].includes(focusOverride)?focusOverride:
  ['life','start','pro','max'].includes(p.focus)?p.focus:'life';
 preview=!!isDemo;
 returnToManage=preview&&!$('managePage')?.hidden;
 active=true;choice='';saved=false;draft='';
 $('navHome')?.click();
 home.classList.add('first-minute-active');
 root.hidden=false;
 $('firstMinuteTitle').textContent=nameFor(p)==='друг'?'Начнём с полезного?':nameFor(p)+', начнём с полезного?';
 $('firstMinuteLead').textContent=focus==='life'
  ?'Выберите одно действие — и SEYVEO поможет сохранить результат.'
  :'Выберите первый шаг. Без анкет и лишних настроек.';
 $('firstMinuteBusinessChoice').textContent=focus==='start'?'Начать бизнес':focus==='life'?'Идея для бизнеса':'Разобрать задачу бизнеса';
 $('firstMinuteDisclaimer').textContent=preview
  ?'ДЕМО · ничего не сохраняется. Реальный ИИ пока не подключён.'
  :'Данные сохраняются только на этом устройстве. ИИ и внешние сервисы пока не подключены.';
 $('firstMinuteLater').textContent=preview?'Закрыть демо':'Пока не сейчас';
 btnDone.textContent=preview?'Закрыть демо':'Готово';
 input.value='';
 plan.replaceChildren();plan.hidden=true;
 showView('choose');
 // Only scroll if the lower edge is obscured by the dock on a small phone;
 // never force a jump when the compact card is already fully visible.
 setTimeout(()=>{
  if(!active)return;
  try{
   const rect=root.getBoundingClientRect();
   const viewport=window.visualViewport;
   const bottom=(viewport?(viewport.offsetTop+viewport.height):window.innerHeight)-95;
   if(rect.bottom>bottom+3)root.scrollIntoView({block:'nearest',behavior:'smooth'});
  }catch{}
 },320);
}
function choose(selected){
 if(!active||!['task','note','business'].includes(selected))return;
 choice=selected;saved=false;draft='';input.value='';
 showView('form');plan.hidden=true;
 const business=choice==='business',startup=focus==='start';
 $('firstMinuteInputLabel').textContent=choice==='task'?'Какое дело запланируем?':
  choice==='note'?'Что хотите запомнить?':
  startup?'Какой бизнес хотите открыть?':'Какую задачу бизнеса хотите решить первой?';
 input.placeholder=choice==='task'?'Например, позвонить маме':
  choice==='note'?'Ваша мысль…':
  startup?'Например, парикмахерская':'Например, увеличить количество заказов';
 input.maxLength=choice==='task'?140:500;
 $('firstMinuteSubmit').textContent=business?'Подготовить первые шаги':choice==='task'?'Сохранить дело':'Сохранить в Блокнот';
 if(input.focus)try{input.focus({preventScroll:true})}catch{}
}
function saveNote(content){
 const api=window.SEYVEO_NOTES_API;
 if(!api||typeof api.getNotes!=='function'||typeof api.putNotes!=='function')
  return {ok:false,message:'Блокнот пока недоступен. Попробуйте ещё раз.'};
 const notes=api.getNotes();
 if(notes.length>=100)return {ok:false,message:'В Блокноте достигнут предел записей. Освободите место и повторите.'};
 const record={id:'first-minute-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),text:content,createdAt:Date.now()};
 if(!api.putNotes([record,...notes]))return {ok:false,message:'Не удалось сохранить запись на устройстве.'};
 return {ok:true};
}
function saveTask(title){
 const detail={items:[{title,due:''}]};
 window.dispatchEvent(new CustomEvent('seyveo:tasks-plan-batch',{detail}));
 return {ok:detail.result?.status==='saved',
  message:detail.result?.message||'Дела пока недоступны. Попробуйте ещё раз.'};
}
function finishSaved(kind){
 saved=true;
 if(!preview)store(KEY,'completed');
 showView('result');
 plan.hidden=true;
 if(kind==='task'){
  setResult(preview?'Дело готово · демо':'Дело сохранено',preview
   ?'Это предварительный просмотр. В настоящие Дела ничего не добавлено.'
   :'Теперь у вас есть первый конкретный шаг. Его можно увидеть в разделе «Дела».');
  btnAction.textContent=preview?'Закрыть демо':'Открыть Дела';
 }else{
  setResult(preview?'Запись готова · демо':'Запись сохранена',preview
   ?'Это предварительный просмотр. Блокнот и другие данные не изменены.'
   :'Ваш первый результат находится в Блокноте и остаётся на этом устройстве.');
  btnAction.textContent=preview?'Закрыть демо':'Открыть Блокнот';
 }
}
function businessPlan(value){
 const startup=focus==='start';
 const caption=startup?'Идея':'Задача';
 return [caption+': '+value,
 startup?'Определите, кому и какую проблему решает ваш продукт.':'Определите измеримый результат и текущую точку.',
 startup?'Спросите у пяти потенциальных клиентов, нужен ли им такой продукт.':'Выберите одну гипотезу и самый быстрый способ её проверить.',
 startup?'Запишите необходимые стартовые расходы и примерную цену.':'Назначьте ответственного и срок первой проверки.'];
}
function submit(event){
 event.preventDefault();
 if(!active)return;
 const value=input.value.trim().replace(/\s+/g,' ').slice(0,choice==='task'?140:500);
 if(!value){$('firstMinuteStatus').textContent='Напишите коротко своими словами — этого достаточно.';return;}
 $('firstMinuteStatus').textContent='';
 draft=value;
 if(choice==='business'){
  const steps=businessPlan(draft);
  plan.replaceChildren();
  for(const line of steps.slice(1)){
   const item=document.createElement('li');item.textContent=line;plan.append(item);
  }
  plan.hidden=false;saved=false;
  setResult('Первый ориентир готов',steps[0]+'. Это черновой список вопросов для самостоятельной проверки, не результат анализа рынка.');
  btnAction.textContent='Сохранить план в Блокнот';
  showView('result');plan.hidden=false;
  return;
 }
 const result=preview?{ok:true}:
  choice==='task'?saveTask(value):saveNote(value);
 if(!result.ok){$('firstMinuteStatus').textContent=result.message||'Не удалось сохранить. Повторите попытку.';return;}
 finishSaved(choice);
}
function resultAction(){
 if(!active)return;
 if(choice==='business'&&!saved){
  const text=['Первый шаг с SEYVEO','',...businessPlan(draft)].join('\n');
  const result=preview?{ok:true}:saveNote(text);
  if(!result.ok){$('firstMinuteStatus').textContent=result.message||'Не удалось сохранить план.';return;}
  finishSaved('note');
  return;
 }
 const savedChoice=choice,wasPreview=preview;
 close(wasPreview?null:'completed');
 if(wasPreview)return;
 if(savedChoice==='task')$('navTasks')?.click();
 else window.SEYVEO_NOTES_API?.openNotes?.();
}
choiceBox.addEventListener('click',event=>{
 const target=event.target.closest?.('[data-first-minute-choice]');
 if(target)choose(target.dataset.firstMinuteChoice);
});
form.addEventListener('submit',submit);
$('firstMinuteBack').addEventListener('click',()=>{if(!active)return;choice='';draft='';input.value='';showView('choose')});
btnAction.addEventListener('click',resultAction);
btnDone.addEventListener('click',()=>close(preview?null:(saved?'completed':'later')));
$('firstMinuteLater').addEventListener('click',()=>close(preview?null:'later'));
entry?.addEventListener('click',()=>{
 // Always let developers preview BOTH business scenarios without touching data.
 // Existing personal first-step fallback remains available if the map fails to load.
 if(window.SEYVEO_BUSINESS_MAP){
  window.SEYVEO_BUSINESS_MAP.open({preview:true,trigger:entry});
  return;
 }
 const p=profile();start(true,p.focus);
});
window.addEventListener('seyveo:first-minute-ready',event=>{
 if(event.detail?.source!=='first-launch')return;
 if(read(KEY))return;
 // Let the plasma finish its signature before the first question.
 setTimeout(()=>{
  if(active||document.hidden)return;
  const owner=profile();
  if(['start','pro','max'].includes(owner.focus)&&window.SEYVEO_BUSINESS_MAP){
   window.SEYVEO_BUSINESS_MAP.open({firstLaunch:true,fromStart:true});return;
  }
  start(false);
 },650);
});
window.addEventListener('pagehide',()=>{if(active)close(null,false)});
})();
