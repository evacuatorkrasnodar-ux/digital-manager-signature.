/* SEYVEO · Pulse v1 · developer-only model preview.
   Every number, chart and insight derives from ONE fixture ledger.
   Never merges with local records or presents CRM/bank data as connected. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const dialog=$('seyveoPulseDialog');
if(!dialog)return;
const periods=['today','week','month','year'];
let period='today';
const ledger=[
 // days ago, local hour, client inquiries, sales, modeled revenue, modeled costs
 [0,9,3,1,18500,7800],[0,12,4,2,59000,27000],[0,16,3,1,39000,16000],[0,20,2,1,42000,18500],
 [1,10,6,2,55000,19000],[1,17,3,1,28500,12400],
 [2,11,7,3,87000,36000],[3,14,5,2,48000,24200],
 [4,9,4,2,37000,16400],[5,16,6,2,65000,29100],[6,12,5,1,22500,10300],
 [8,11,7,3,90500,41200],[10,15,4,2,46000,19400],
 [12,9,5,2,59000,26300],[14,16,8,3,92000,37900],
 [18,10,6,2,62000,26800],[21,13,9,4,124000,49300],[25,16,6,2,49000,20200],
 [32,11,8,3,105000,41700],[46,13,11,5,149000,63900],
 [61,9,7,3,84000,35200],[79,12,9,4,119000,51000],
 [101,16,10,4,131000,59400],[130,12,13,6,174000,73200],
 [155,10,9,3,81000,36200],[181,14,12,5,165000,67500],
 [208,11,8,4,106000,43300],[241,15,11,5,151000,62600],
 [278,13,7,3,83000,35500],[306,12,10,4,122000,50200],
 [343,16,8,3,98000,41100]
].map(([age,hour,leads,sales,revenue,cost])=>({age,hour,leads,sales,revenue,cost}));
const num=new Intl.NumberFormat('ru-RU');
const rub=n=>num.format(n)+' ₽';
function range(){
  return period==='today'?1:period==='week'?7:period==='month'?30:365;
}
function sum(rows){
  return rows.reduce((a,r)=>({leads:a.leads+r.leads,sales:a.sales+r.sales,revenue:a.revenue+r.revenue,cost:a.cost+r.cost}),{leads:0,sales:0,revenue:0,cost:0});
}
function periodLabels(n){
  if(period==='today')return ['00','04','08','12','16','20'];
  if(period==='week')return ['−6','−5','−4','−3','−2','−1','Сег.'];
  if(period==='month')return ['30д','24д','18д','12д','6д'];
  return ['12м','11м','10м','9м','8м','7м','6м','5м','4м','3м','2м','1м'];
}
function chartRows(){
  const days=range(),count=period==='today'?6:period==='week'?7:period==='month'?5:12;
  const buckets=Array.from({length:count},()=>[]);
  for(const row of ledger){
    if(row.age>=days)continue;
    let idx;
    if(period==='today')idx=Math.min(5,Math.floor(row.hour/4));
    else idx=Math.min(count-1,Math.floor((days-1-row.age)*count/days));
    buckets[idx].push(row);
  }
  return buckets.map(sum);
}
function render(){
  document.querySelectorAll('[data-pulse-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pulsePeriod===period)));
  const days=range(),rows=ledger.filter(r=>r.age<days),total=sum(rows);
  $('pulseLeads').textContent=num.format(total.leads);
  $('pulseSales').textContent=num.format(total.sales);
  $('pulseRevenue').textContent=rub(total.revenue);
  $('pulseCosts').textContent=rub(total.cost);
  $('pulseProfit').textContent=rub(total.revenue-total.cost);
  $('pulseConversion').textContent=(total.leads?Math.round(total.sales*1000/total.leads)/10:0).toLocaleString('ru-RU')+'%';
  $('pulseIncomeLabel').textContent='Выручка · ДЕМО';
  const bins=chartRows(),max=Math.max(1,...bins.map(x=>x.revenue)),labels=periodLabels();
  const graph=$('pulseChart');
  graph.replaceChildren();
  graph.style.setProperty('--pulse-columns',String(bins.length));
  graph.setAttribute('aria-label','Демонстрационная выручка за выбранный период: '+rub(total.revenue));
  bins.forEach((entry,i)=>{
    const col=document.createElement('div');col.className='pulse-chart-col';
    const track=document.createElement('div');track.className='pulse-chart-track';
    const bar=document.createElement('span');bar.className='pulse-chart-bar';
    bar.style.setProperty('--pulse-height',String(entry.revenue?Math.max(5,Math.round(100*entry.revenue/max)):3)+'%');
    bar.title=labels[i]+': '+rub(entry.revenue);
    track.append(bar);
    const label=document.createElement('small');label.textContent=labels[i];
    col.append(track,label);graph.append(col);
  });
  const unconverted=Math.max(0,total.leads-total.sales);
  $('pulseInsight').textContent=unconverted
    ?'В учебном сценарии из '+num.format(total.leads)+' обращений отмечено '+num.format(total.sales)+' продаж. '+num.format(unconverted)+' обращений пока без отмеченной продажи — SEYVEO предложил бы проверить их статус.'
    :'Все отмеченные обращения в выбранном периоде связаны с продажами. Это учебная модель.';
  let local=0;
  try{const tasks=JSON.parse(localStorage.getItem('seyveo-personal-tasks-v1')||'[]');if(Array.isArray(tasks))local=tasks.filter(t=>t&&typeof t.title==='string'&&!t.done).length}catch{}
  let completed=0;
  try{const state=JSON.parse(localStorage.getItem('dm-signature-living-v2')||'null');if(Array.isArray(state?.history))completed=state.history.filter(h=>h&&['done','approved'].includes(h.status)).length}catch{}
  $('pulseLocalSummary').textContent='Реальные личные дела на устройстве: '+local+' · завершённые демопоручения: '+completed+'. Эти записи не включены в бизнес-цифры.';
}
document.querySelectorAll('[data-pulse-period]').forEach(button=>button.addEventListener('click',()=>{
  if(!periods.includes(button.dataset.pulsePeriod)||period===button.dataset.pulsePeriod)return;
  period=button.dataset.pulsePeriod;
  document.dispatchEvent(new Event('seyveo:silk-touch'));
  render();
}));
window.addEventListener('seyveo:pulse-open',()=>{
  period='today';render();
  if(!dialog.open)dialog.showModal();
});
dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
});
})();