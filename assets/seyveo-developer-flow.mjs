import {checkReviewStateRules,shouldShowManagerReview} from './seyveo-review-rules.mjs';
window.SEYVEO_REVIEW_RULES=Object.freeze({shouldShowManagerReview});
window.dispatchEvent(new Event('seyveo:review-rules-ready'));
/* Developer-only local flow tester. Enable explicitly with ?seyveo_dev=1.
   No production notifications, mail sending or authentication implied. */
const enabled=new URLSearchParams(location.search).get('seyveo_dev')==='1';
if(enabled){
 const box=document.createElement('aside');
 box.setAttribute('aria-label','SEYVEO · тест поручения');
 box.style.cssText='position:fixed;right:12px;top:70px;z-index:9999;max-width:260px;padding:12px;border:1px solid #638f76;border-radius:14px;background:#12211b;color:#e8f5ee;font:12px system-ui;box-shadow:0 8px 22px #0005';
 const title=document.createElement('strong');title.textContent='SEYVEO · DEV FLOW';
 const status=document.createElement('p');status.textContent='Учебный тест · только на этом устройстве';
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='display:block;margin:8px 0;color:#b7e8cd;background:transparent;border:1px solid #638f76;border-radius:10px;padding:8px';b.addEventListener('click',fn);return b;};
 let id='';
 const key='seyveo-business-command-tasks-demo-v1';
 const get=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}};
 const create=button('1 · Поручить Елене',()=>{const res=window.SEYVEO_BUSINESS_TASK_DEMO?.assignFromMail({text:'DEV: проверить учебный отчёт',assigneeId:'elena',mailDraftId:'developer-flow'});if(res?.ok){id=res.id;status.textContent='Создано: '+id}else status.textContent=res?.reason||'Система задач недоступна';});
 const submit=button('2 · Передать отчёт',()=>{if(!id){status.textContent='Сначала создайте поручение';return;}const tasks=get();const task=tasks.find(t=>t.id===id);if(!task){status.textContent='Поручение не найдено';return;}task.reviewStatus='review';task.reportText='Учебный отчёт Елены: проверка завершена';task.mailHistory=[...(task.mailHistory||[]),{event:'review',at:Date.now(),actor:'elena',report:task.reportText}];localStorage.setItem(key,JSON.stringify(tasks));window.dispatchEvent(new Event('seyveo:employee-task-updated'));window.dispatchEvent(new Event('seyveo:manager-tasks-updated'));status.textContent='На проверке. Откройте Главную.';});
 const inspect=button('3 · Открыть проверку',()=>{if(!id||!window.SEYVEO_BUSINESS_TASK_DEMO?.openTask(id))status.textContent='Поручение недоступно';else status.textContent='Выберите Принять или Доработать в Делах';});
 const verify=button('4 · Диагностика карточки',()=>{const task=get().find(t=>t.id===id);const card=window.SEYVEO_LIVING_MOMENT?.inspectReview?.(id);if(!task||!card){status.textContent='Нет задания или диагностика Главной недоступна';return;}const expected=task.reviewStatus==='review'&&!task.done;status.textContent=(expected===card.queued?'✓':'!')+' Очередь: '+(card.queued?'есть':'нет')+'; карточка на экране: '+(card.visible?'да':'нет')+'; статус: '+(task.reviewStatus||'неизвестен')+'. '+(expected===card.queued?'Условие показа верно.':'Несоответствие очереди — проверь Главную.');});
 const audit=button('Итог · проверить весь цикл',()=>{
  const task=get().find(t=>t.id===id);
  if(!task){status.textContent='Не найдено учебное поручение. Начни с шага 1.';return;}
  const events=Array.isArray(task.mailHistory)?task.mailHistory:[];
  const created=events.some(e=>e.event==='assigned');
  const submitted=events.some(e=>e.event==='review');
  const resolved=events.some(e=>e.event==='approved'||e.event==='rework');
  const card=window.SEYVEO_LIVING_MOMENT?.inspectReview?.(id);
  const expected=task.reviewStatus==='review'&&!task.done;
  const queue=card?card.queued===expected:false;
  const checks=[['Создано',created],['Отчёт',submitted],['Решение',resolved],['Очередь',queue]];
  status.textContent=checks.map(([name,ok])=>(ok?'✓ ':'○ ')+name).join(' · ')+(checks.every(x=>x[1])?' · Цикл пройден в локальных данных.':' · Не все этапы завершены.');
 });
 const rules=button('Автотест · правила карточек',()=>{const results=checkReviewStateRules();const failed=results.filter(x=>!x.passed);status.textContent=failed.length?'Проверка не пройдена: '+failed.map(x=>x.name).join(', '):'Все 6 сценариев состояний прошли проверку. Это тест правил, не анимаций.';});
 const visual=button('Диагностика · мобильная карточка',()=>{
  const card=window.SEYVEO_LIVING_MOMENT?.inspectReview?.(id);
  if(!card?.visible){status.textContent='Карточка сейчас не видна. Открой Главную после сдачи отчёта и повтори проверку.';return;}
  const home=document.getElementById('homePage');
  const field=home?.querySelector('.lm-field');
  const action=field&&[...field.querySelectorAll('button')].find(b=>b.textContent.trim()==='Проверить');
  if(!action){status.textContent='Ошибка: у карточки нет видимой кнопки «Проверить».';return;}
  const rect=action.getBoundingClientRect();
  const viewportHeight=window.visualViewport?.height||window.innerHeight;
  const onScreen=rect.width>0&&rect.height>0&&rect.top>=0&&rect.bottom<=viewportHeight;
  const center=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);
  const uncovered=!!center&&(center===action||action.contains(center));
  status.textContent='Кнопка: '+(onScreen?'в пределах экрана':'за пределами экрана')+' · '+(uncovered?'доступна':'перекрыта или ещё анимируется')+'. Проверяй после завершения анимации.';
 });
 box.append(title,status,create,submit,inspect,verify,audit,rules,visual);document.body.append(box);
}
