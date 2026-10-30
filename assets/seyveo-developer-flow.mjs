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
 const verify=button('4 · Проверить результат',()=>{const task=get().find(t=>t.id===id);status.textContent=task?.done?'Принято. Карточка должна исчезнуть с Главной.':task?.reviewStatus==='rework'?'Возвращено на доработку.':'Пока ожидает решения руководителя.';});
 box.append(title,status,create,submit,inspect,verify);document.body.append(box);
}
