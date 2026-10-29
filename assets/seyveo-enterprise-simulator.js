/* SEYVEO Enterprise: safe in-memory training simulator for Developer Studio. */
(()=>{
'use strict';
if(new URLSearchParams(location.search).get('devstudio')!=='1')return;
const dev=document.getElementById('svDevStudio');
if(!dev)return;
const host=document.createElement('section');host.id='svEnterpriseSimulator';
host.innerHTML='<h3>Симулятор компании</h3><p class="sv-sim-muted">Учебная компания. События происходят только на этой странице; ни одно сообщение не отправляется.</p><div class="sv-sim-toolbar"><label>Филиал <select id="svSimBranch"></select></label><label>Сотрудник <select id="svSimStaff"></select></label></div><div id="svSimTimeline" aria-live="polite"></div><div class="sv-sim-toolbar"><button type="button" id="svSimCreate">Выдать поручение</button><button type="button" id="svSimAccept">Принять</button><button type="button" id="svSimSubmit">Отправить результат</button><button type="button" id="svSimApprove">Проверить</button><button type="button" id="svSimReset">Сброс</button></div><p id="svSimState" role="status"></p>';
dev.append(host);
const views=document.createElement('section');
views.className='sv-sim-previews';
views.innerHTML='<h3>Взгляд с двух телефонов</h3><p class="sv-sim-muted">Отдельные учебные макеты. Они не читают переписки и не переключают настоящие аккаунты.</p><div class="sv-sim-phones"><article class="sv-sim-phone"><div class="sv-sim-phone-head"><span>SEYVEO · РУКОВОДИТЕЛЬ</span><strong id="svSimBossBranch"></strong></div><div class="sv-sim-phone-body"><small>ПОРУЧЕНИЕ</small><h4>Проверить выкладку товаров</h4><p id="svSimBossPerson"></p><p id="svSimBossStatus"></p></div></article><article class="sv-sim-phone"><div class="sv-sim-phone-head"><span>SEYVEO · СОТРУДНИК</span><strong id="svSimWorkerName"></strong></div><div class="sv-sim-phone-body"><small>МОИ ДЕЛА</small><h4>Проверить выкладку товаров</h4><p id="svSimWorkerBranch"></p><p id="svSimWorkerStatus"></p></div></article></div>';
host.append(views);
const $=id=>document.getElementById(id);
const sampleBranches=['Магазин №1','Магазин №2','Склад'];
const sampleStaff=['Елена · продавец','Татьяна · старшая смены','Андрей · кладовщик'];
function safeDraft(){try{const data=JSON.parse(localStorage.getItem('seyveo-company-structure-draft-v1')||'null');return Array.isArray(data?.branches)?data.branches.filter(x=>typeof x==='string'&&x.trim()).slice(0,30):[]}catch{return []}}
const branches=safeDraft().length?safeDraft():sampleBranches;
for(const [id,values] of [['svSimBranch',branches],['svSimStaff',sampleStaff]])for(const value of values){const opt=document.createElement('option');opt.value=value;opt.textContent=value;$(id).append(opt)}
const TASK_KEY='seyveo-business-command-tasks-demo-v1';
const SIM_ID='devstudio-enterprise-single-task';
let task=null;
function restore(){const row=getRows().find(x=>x?.id===SIM_ID);if(!row)return;task={id:SIM_ID,branch:row.branch||'Учебный филиал',assignee:'Елена · продавец',phase:0,events:[]};mirror()}
const getPhase=()=>task?.phase||0;
const getHistory=()=>task?.events||[];
const getRows=()=>{try{const rows=JSON.parse(localStorage.getItem(TASK_KEY)||'[]');return Array.isArray(rows)?rows:[]}catch{return []}};
function mirror(){
 const row=getRows().find(x=>x?.id===SIM_ID);
 if(!row||!task)return;
 const phase=row.done||row.reviewStatus==='approved'?4:row.reviewStatus==='review'?3:row.reviewStatus==='accepted'?2:1;
 if(phase!==task.phase){task.phase=phase;task.events.push('Состояние в «Делах» · '+(row.reviewStatus||'assigned'))}
 task.branch=row.branch||task.branch;render()
}
const steps=['Поручение создано','Сотрудник принял поручение','Результат передан на проверку','Руководитель принял результат'];
function render(){
 const phase=getPhase();
 const box=$('svSimTimeline');box.replaceChildren();
 getHistory().forEach((text,i)=>{const row=document.createElement('div');row.className='sv-sim-event';const number=document.createElement('small');number.textContent=String(i+1).padStart(2,'0');const body=document.createElement('span');body.textContent=text;row.append(number,body);box.append(row)});
 $('svSimState').textContent=phase===0?'Выберите филиал и Елену, затем создайте поручение.':phase===4?'Поручение завершено · учебный сценарий':steps[phase-1]+' · следующий шаг: '+steps[phase];
 const branch=task?.branch||$('svSimBranch').value,person=task?.assignee||$('svSimStaff').value;
 $('svSimBossBranch').textContent=branch;$('svSimBossPerson').textContent='Исполнитель: '+person;
 $('svSimWorkerName').textContent=person;$('svSimWorkerBranch').textContent=branch;
 $('svSimBossStatus').textContent=['Задание ещё не создано','Ожидает принятия','В работе','Результат ожидает проверки','Выполнено ✓'][phase];
 $('svSimWorkerStatus').textContent=['Нет активного поручения','Новое поручение','Принято','Результат отправлен','Руководитель принял ✓'][phase];
 for(const [id,allowed] of [['svSimCreate',phase===0],['svSimAccept',phase===1],['svSimSubmit',phase===2],['svSimApprove',phase===3]])$(id).disabled=!allowed;
}
function write(next){
 const previous=getPhase();if(previous!==next-1)return;
 const branch=$('svSimBranch').value,person=$('svSimStaff').value;
 if(person!=='Елена · продавец'){$('svSimState').textContent='Связь с «Делами» доступна для тестовой Елены. Выберите Елену.';return}
 const current=getRows(),existing=current.find(x=>x?.id===SIM_ID);
 if(next===1&&existing){$('svSimState').textContent='Учебная задача уже существует. Сбросьте её перед повторным тестом.';return}
 if(next>1&&!existing){$('svSimState').textContent='Задача отсутствует в «Делах».';return}
 const updated={...(existing||{}),id:SIM_ID,text:'Проверить выкладку товаров',assigneeId:'elena',approvalFlow:true,branch:existing?.branch||branch,description:existing?.description||'Проверить выкладку, ценники и представить результат руководителю.',
 reviewStatus:['','assigned','accepted','review','approved'][next],done:next===4,
 ...(next===3?{reportText:'Выкладка проверена · учебный результат'}:{})};
 const rows=next===1?[...current,updated]:current.map(x=>x?.id===SIM_ID?updated:x);
 try{localStorage.setItem(TASK_KEY,JSON.stringify(rows))}catch{$('svSimState').textContent='Не удалось сохранить учебное поручение.';return}
 if(next===1)task={id:SIM_ID,branch,assignee:person,phase:0,events:[]};
 task.phase=next;task.events.push(steps[next-1]+' · '+person+' · '+branch);
 window.dispatchEvent(new Event('seyveo:employee-task-updated'));
 window.dispatchEvent(new Event('seyveo:manager-tasks-updated'));
 window.dispatchEvent(new CustomEvent('seyveo:demo-task-changed',{detail:structuredClone(task)}));
 render();
}
$('svSimCreate').onclick=()=>write(1);$('svSimAccept').onclick=()=>write(2);
$('svSimSubmit').onclick=()=>write(3);$('svSimApprove').onclick=()=>write(4);
function reset(){
 const rows=getRows();
 if(rows.some(x=>x?.id===SIM_ID)){
  try{localStorage.setItem(TASK_KEY,JSON.stringify(rows.filter(x=>x?.id!==SIM_ID)))}catch{$('svSimState').textContent='Не удалось очистить учебную задачу.';return}
 }
 task=null;
 window.dispatchEvent(new Event('seyveo:employee-task-updated'));
 window.dispatchEvent(new Event('seyveo:manager-tasks-updated'));
 window.dispatchEvent(new CustomEvent('seyveo:demo-task-changed',{detail:null}));
 render();
}
$('svSimReset').onclick=reset;
for(const id of ['svSimBranch','svSimStaff'])$(id).addEventListener('change',()=>{if(task){$('svSimState').textContent='Сначала сбросьте текущую задачу.';return}render()});
window.addEventListener('seyveo:employee-task-updated',mirror);
window.addEventListener('seyveo:manager-tasks-updated',mirror);
window.addEventListener('storage',event=>{if(event.key===TASK_KEY){if(!task)restore();else mirror()}});
restore();
render();
})();
