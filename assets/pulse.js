/* SEYVEO · business indicators: no simulated ledger or fabricated metrics.
 * Until a real, authorized source is available, show an honest empty state. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const dialog=$('seyveoPulseDialog');
if(!dialog)return;
const periods=['today','week','month','year'];
let period='today';
const EMPTY=Object.freeze({leads:null,sales:null,revenue:null,cost:null});
window.SEYVEO_PULSE_DEMO=Object.freeze({
  snapshot(){return EMPTY},
  picture(){return null}
});
function render(){
 document.querySelectorAll('[data-pulse-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pulsePeriod===period)));
 for(const id of ['pulseLeads','pulseSales','pulseRevenue','pulseCosts','pulseProfit','pulseConversion']){
  const target=$(id);if(target)target.textContent='—';
 }
 $('pulseIncomeLabel').textContent='Выручка · источник не подключён';
 const chart=$('pulseChart');
 chart.replaceChildren();
 chart.setAttribute('aria-label','Нет подтверждённых данных о выручке');
 $('pulseInsight').textContent='Пока нет подключённых источников продаж и финансов. Сэйви не показывает вымышленные показатели.';
 let local=0;
 try{
  const tasks=JSON.parse(localStorage.getItem('seyveo-personal-tasks-v1')||'[]');
  if(Array.isArray(tasks))local=tasks.filter(t=>t&&typeof t.title==='string'&&!t.done).length;
 }catch{}
 $('pulseLocalSummary').textContent='Ваши незавершённые дела на этом устройстве: '+local+'.';
}
document.querySelectorAll('[data-pulse-period]').forEach(button=>button.addEventListener('click',()=>{
 if(!periods.includes(button.dataset.pulsePeriod)||period===button.dataset.pulsePeriod)return;
 period=button.dataset.pulsePeriod;
 document.dispatchEvent(new Event('seyveo:silk-touch'));
 render();
}));
window.addEventListener('seyveo:pulse-open',event=>{
 period=periods.includes(event.detail?.period)?event.detail.period:'today';
 render();
 if(!dialog.open)dialog.showModal();
});
dialog.addEventListener('click',event=>{
 if(event.target!==dialog)return;
 const rect=dialog.getBoundingClientRect();
 if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
});
})();