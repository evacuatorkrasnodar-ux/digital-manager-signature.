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
let phase=0;let history=[];
const steps=['Поручение создано','Сотрудник принял поручение','Результат передан на проверку','Руководитель принял результат'];
function render(){
 const box=$('svSimTimeline');box.replaceChildren();
 history.forEach((text,i)=>{const row=document.createElement('div');row.className='sv-sim-event';const number=document.createElement('small');number.textContent=String(i+1).padStart(2,'0');const body=document.createElement('span');body.textContent=text;row.append(number,body);box.append(row)});
 $('svSimState').textContent=phase===0?'Выберите филиал и сотрудника, затем создайте поручение.':phase===4?'Поручение завершено · учебный сценарий':steps[phase-1]+' · следующий шаг: '+steps[phase];
 const branch=$('svSimBranch').value,person=$('svSimStaff').value;
 $('svSimBossBranch').textContent=branch;
 $('svSimBossPerson').textContent='Исполнитель: '+person;
 $('svSimWorkerName').textContent=person;
 $('svSimWorkerBranch').textContent=branch;
 $('svSimBossStatus').textContent=['Задание ещё не создано','Ожидает принятия','В работе','Результат ожидает проверки','Выполнено ✓'][phase];
 $('svSimWorkerStatus').textContent=['Нет активного поручения','Новое поручение · принять','Принято · выполнить','Результат отправлен','Руководитель принял ✓'][phase];
 for(const [id,allowed] of [['svSimCreate',phase===0],['svSimAccept',phase===1],['svSimSubmit',phase===2],['svSimApprove',phase===3]])$(id).disabled=!allowed;
}
const action=(next)=>{if(phase!==next-1)return;phase=next;const branch=$('svSimBranch').value,person=$('svSimStaff').value;history.push(steps[next-1]+' · '+person+' · '+branch);render()};
$('svSimCreate').onclick=()=>action(1);$('svSimAccept').onclick=()=>action(2);$('svSimSubmit').onclick=()=>action(3);$('svSimApprove').onclick=()=>action(4);
$('svSimReset').onclick=()=>{phase=0;history=[];render()};
for(const id of ['svSimBranch','svSimStaff'])$(id).addEventListener('change',()=>{phase=0;history=[];render()});
render();
})();
