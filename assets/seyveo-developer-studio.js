/* Internal demo diagnostics. Not an authorization mechanism; never enable in production. */
(()=>{
'use strict';
const enabled=new URLSearchParams(location.search).get('devstudio')==='1';
if(!enabled)return;
const $=id=>document.getElementById(id);
const dialog=document.createElement('dialog');
dialog.id='svDevStudio';
dialog.setAttribute('aria-label','SEYVEO Developer Studio — учебная диагностика');
dialog.innerHTML=`<div class="sv-dev-head"><div><small>SEYVEO · INTERNAL PREVIEW</small><h2>Developer Studio</h2></div><button id="svDevClose" type="button" aria-label="Закрыть">×</button></div>
<p class="sv-dev-warning">Только локальная диагностика демо. Параметр devstudio=1 не защищён авторизацией и не даёт специальных прав.</p>
<div class="sv-dev-actions"><button id="svDevRefresh" type="button">Обновить состояние</button><button id="svDevManager" type="button">Роль: руководитель</button><button id="svDevEmployee" type="button">Роль: Елена</button></div>
<h3>Готовность</h3><div id="svDevReadiness"></div>
<h3>Контрольные элементы</h3><div id="svDevChecks"></div><p id="svDevMessage" aria-live="polite"></p>`;
document.body.append(dialog);
const launch=document.createElement('button');launch.id='svDevLaunch';launch.type='button';launch.textContent='DEV';launch.setAttribute('aria-label','Открыть Developer Studio');document.body.append(launch);
const modules=[
 ['Главная','stage','Демонстрационный интерфейс'],
 ['Рабочие чаты','svcpChats','Локальная демонстрация, нет транспорта'],
 ['Поручения','svcpTasks','Локальная демонстрация, нет межтелефонной доставки'],
 ['Сотрудники','svcpTeam','Демонстрационные роли'],
 ['Документы','seyveoDocumentPage','Наличие экрана не подтверждает сервер'],
 ['Знакомство с компанией','svCompanyIntroOpen','Локальный черновик'],
 ['Структура компании','svOrgBranches','Локальный черновик']
];
function render(){
 const readiness=$('svDevReadiness'),checks=$('svDevChecks');readiness.replaceChildren();checks.replaceChildren();
 modules.forEach(([name,id,note])=>{
  const row=document.createElement('div');row.className='sv-dev-row';
  const title=document.createElement('strong');title.textContent=name;
  const status=document.createElement('span');status.textContent=document.getElementById(id)?'Элемент найден · демо':'Не обнаружен';
  const detail=document.createElement('small');detail.textContent=note;
  row.append(title,status,detail);readiness.append(row);
 });
 const values=[
 ['Режим предпросмотра',$('seyveoDemoModeSelect')?.value||'не найден'],
 ['Компания: черновик',localStorage.getItem('seyveo-company-acquaintance-draft-v1')?'Есть на этом устройстве':'Нет'],
 ['Структура: черновик',localStorage.getItem('seyveo-company-structure-draft-v1')?'Есть на этом устройстве':'Нет'],
 ['Текущая страница',location.pathname]
 ];
 values.forEach(([label,value])=>{const row=document.createElement('div');row.className='sv-dev-row';const a=document.createElement('strong');a.textContent=label;const b=document.createElement('span');b.textContent=value;row.append(a,b);checks.append(row)});
}
function switchRole(role){
 const button=document.querySelector('[data-preview-role="'+role+'"]');
 if(!button){$('svDevMessage').textContent='Кнопка тестовой роли не обнаружена.';return}
 button.click();
 $('svDevMessage').textContent='Запрошено переключение на '+(role==='manager'?'руководителя':'сотрудника')+'. Проверьте результат в приложении.';
 render();
}
$('svDevManager').addEventListener('click',()=>switchRole('manager'));
$('svDevEmployee').addEventListener('click',()=>switchRole('employee'));
$('svDevRefresh').addEventListener('click',render);
$('svDevClose').addEventListener('click',()=>dialog.close());
launch.addEventListener('click',()=>{render();dialog.showModal()});
})();
