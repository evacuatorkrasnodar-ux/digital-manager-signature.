/* SEYVEO Account & Subscription · interactive concept demo.
   No authentication, emails, subscriptions, billing, passwords, network requests
   or changes to production account permissions. Demo state stays in memory. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const dialog=$('seyveoAccountDemo'),management=$('openSeyveoAccountDemo'),
      owner=$('openSeyveoAccountFromOwner');
if(!dialog||!management)return;
const companyPicker=$('seyveoAccountCompany'),tierHost=$('seyveoAccountTierCards');
const plans=Object.freeze([
 {id:'start',title:'Business Start',short:'START',detail:'От идеи к первым клиентам',
  features:'Бизнес-идея · задачи запуска · первые обращения'},
 {id:'pro',title:'Business Pro',short:'PRO',detail:'Для действующего бизнеса',
  features:'Клиенты · процессы · продажи · финансы'},
 {id:'max',title:'Business Max',short:'MAX',detail:'Для команд и нескольких направлений',
  features:'Роли · команды · филиалы · согласования'}
]);
const demoState={
 company:'sample',
 companies:{
  sample:{plan:'max',selected:'max',renew:true,period:'month',activated:true},
  second:{plan:'start',selected:'start',renew:false,period:'year',activated:false}
 }
};
const safeText=(s,max=80)=>typeof s==='string'?s.trim().slice(0,max):'';
const letterOf=(value)=>{
 const letter=safeText(value).match(/\p{L}/u);
 return letter?letter[0].toLocaleUpperCase('ru-RU'):'•';
};
function current(){return demoState.companies[demoState.company]}
/* The home owner card always represents the primary saved business.
   Viewing a hypothetical second company must not change its status. */
function ownerSubscriptionPreview(){
 const state=demoState.companies.sample;
 const plan=plans.find(item=>item.id===state.plan);
 return {
  demo:true,
  activated:!!state.activated,
  plan:state.activated?(plan?.title||'Business Max'):null,
  short:state.activated?(plan?.short||'MAX'):null,
  expires:state.activated?(state.period==='month'?'21 ноября 2026':'21 октября 2027'):null,
  expirationShort:state.activated?(state.period==='month'?'21.11':'21.10.2027'):null,
  renewal:!!state.renew
 };
}
window.SEYVEO_GET_ACCOUNT_PREVIEW=ownerSubscriptionPreview;
function notifyOwnerPreview(){
 window.dispatchEvent(new CustomEvent('seyveo:account-preview-changed',{detail:ownerSubscriptionPreview()}));
}
function readIdentity(){
 let name='',company='';
 try{
  const profile=JSON.parse(localStorage.getItem('seyveo-first-acquaintance-v1')||'null');
  name=safeText(profile?.name,60);
 }catch{}
 try{
  const record=JSON.parse(localStorage.getItem('seyveo-company-passport-v1')||'null');
  company=safeText(record?.name,80);
 }catch{}
 // Explicitly labelled examples when user has no saved profile data.
 $('seyveoAccountPerson').textContent=name||'Роман';

 const opt=companyPicker.querySelector('option[value="sample"]');
 if(opt)opt.textContent=company||'Студия SEYVEO · пример';
}
function renderPlans(){
 tierHost.replaceChildren();
 for(const item of plans){
  const button=document.createElement('button');
  button.type='button';
  button.className='seyveo-account-tier';
  button.dataset.accountTier=item.id;
  button.setAttribute('aria-pressed',String(item.id===current().selected));
  const mark=document.createElement('span');
  mark.className='seyveo-account-tier-mark';
  mark.textContent=item.id===current().selected?'✓':'';
  mark.setAttribute('aria-hidden','true');
  const body=document.createElement('span');
  body.className='seyveo-account-tier-main';
  const name=document.createElement('strong');name.textContent=item.title;
  const subtitle=document.createElement('small');subtitle.textContent=item.features;
  body.append(name,subtitle);
  const note=document.createElement('em');
  note.textContent=current().activated&&item.id===current().plan?'Пример':'Вариант';
  button.append(mark,body,note);
  tierHost.append(button);
 }
}
function render(){
 const state=current();
 const plan=plans.find(item=>item.id===state.plan)||plans[1];
 const simulated=state.activated;
 $('seyveoAccountCurrentPlan').textContent=simulated?plan.title:'Нет подписки';
 $('seyveoAccountPlanDesc').textContent=simulated
  ?plan.detail+' · только пример · SEYVEO Life включён'
  :'Демонстрационный доступ · списаний нет';
 $('seyveoAccountExampleStatus').textContent=simulated
  ?'Пример активной подписки':'Подписка не подключена';
 const date=state.period==='month'?'21 ноября 2026':'21 октября 2027';
 $('seyveoAccountSampleExpiry').textContent=simulated?date+' · пример':'—';

 dialog.querySelectorAll('[data-seyveo-period]').forEach(button=>
  button.setAttribute('aria-pressed',String(button.dataset.seyveoPeriod===state.period)));
 const auto=$('seyveoAccountAutoRenew');
 if(auto)auto.setAttribute('aria-checked',String(state.renew));

 $('seyveoAccountRenewValue').textContent=!simulated?'Не настроено':
  state.renew?'Автоматическое · пример':'Ручное · пример';

 const selectedPlan=plans.find(item=>item.id===state.selected)||plans[1];
 $('seyveoAccountTierMessage').textContent=!simulated
  ?'Тарифы в разработке. Выберите вариант и нажмите ниже для просмотра будущего статуса.'
  :state.selected===state.plan
   ?'Показан оплаченный тариф в примере. Реальной подписки нет.'
   :'Выбрано: '+selectedPlan.title+'. Применение изменит только этот пример.';
 const manageLabel=$('seyveoAccountManageBadge');
 if(manageLabel)manageLabel.textContent='Демо';
 renderPlans();
 notifyOwnerPreview();
}
function selectTab(name){
 const valid=new Set(['overview','plans','billing','signin']);
 if(!valid.has(name))return;
 dialog.querySelectorAll('[data-seyveo-account-tab]').forEach(button=>{
  if(button.dataset.seyveoAccountTab===name)button.setAttribute('aria-current','page');
  else button.removeAttribute('aria-current');
 });
 dialog.querySelectorAll('[data-seyveo-account-panel]').forEach(panel=>{
  panel.hidden=panel.dataset.seyveoAccountPanel!==name;
 });
 const shell=dialog.querySelector('.seyveo-account-shell');
 if(shell)shell.scrollTop=0;
}
function open(fromOwner=false){
 if(fromOwner){
  const profileDialog=$('seyveoCompanyDialog');
  if(profileDialog?.open)profileDialog.close();
 }
 readIdentity();
 companyPicker.value=demoState.company;
 render();
 selectTab('overview');

 $('seyveoAccountCodeStage').hidden=true;
 $('seyveoAccountLoginEmail').value='';
 if(!dialog.open)dialog.showModal();
}
function close(){
 if(dialog.open)dialog.close();
}
window.SEYVEO_OPEN_ACCOUNT_DEMO=(tab='overview')=>{
 open(false);
 selectTab(tab);
};
management.addEventListener('click',()=>open(false));
owner?.addEventListener('click',()=>open(true));
$('seyveoAccountClose').addEventListener('click',close);
dialog.addEventListener('click',event=>{
 const target=event.target;
 if(target===dialog){close();return}
 const period=target.closest('[data-seyveo-period]');
 if(period&&['month','year'].includes(period.dataset.seyveoPeriod)){
  current().period=period.dataset.seyveoPeriod;
  render();return;
 }
 const tab=target.closest('[data-seyveo-account-tab]');
 if(tab){selectTab(tab.dataset.seyveoAccountTab);return}
 const goto=target.closest('[data-seyveo-account-go]');
 if(goto){selectTab(goto.dataset.seyveoAccountGo);return}
 const tier=target.closest('[data-account-tier]');
 if(tier&&plans.some(item=>item.id===tier.dataset.accountTier)){
  current().selected=tier.dataset.accountTier;
  render();
 }
});
companyPicker.addEventListener('change',()=>{
 if(!(companyPicker.value in demoState.companies))return;
 demoState.company=companyPicker.value;
 render();
});
$('seyveoAccountApplyPlan').addEventListener('click',()=>{
 const state=current();
 state.plan=state.selected;
 state.activated=true;
 render();
 $('seyveoAccountTierMessage').textContent='Готово: '+(plans.find(item=>item.id===state.plan)?.title||'')+
  ' применён только в демонстрации. Оплаты и изменения реального доступа нет.';
});
$('seyveoAccountSendExampleCode').addEventListener('click',()=>{
 // No real email address is read, stored, validated, or transmitted.
 $('seyveoAccountCodeStage').hidden=false;
});
dialog.addEventListener('close',()=>{
 $('seyveoAccountLoginEmail').value='';
 $('seyveoAccountCodeStage').hidden=true;
});
window.addEventListener('seyveo:profile-changed',()=>{
 if(dialog.open)readIdentity();
});
window.addEventListener('seyveo:company-changed',()=>{
 if(dialog.open)readIdentity();
});
render();
})();
