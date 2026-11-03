/* SEYVEO · one source for the Business Pulse and its detailed report.
   Preview data is deterministic and explicitly marked. It never becomes a
   ledger, CRM record, transaction, or real report. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const dialog=$('seyveoPulseDialog');
if(!dialog)return;
const periods=['today','week','month','year'];
let period='today';
const num=new Intl.NumberFormat('ru-RU');
const money=n=>num.format(n)+' ₽';
const example=Object.freeze({
 today:[12,20,16,27,23,34],
 week:[18,22,28,24,33,40,36],
 month:[18,25,22,31,28,37],
 year:[16,20,23,27,32,35]
});
function sampleData(selected){
 const p=periods.includes(selected)?selected:'today';
 const sequence=example[p],multiplier={today:1,week:5,month:22,year:240}[p];
 const names=p==='today'?['09','10','11','12','13','14']:
  p==='week'?['Пн','Вт','Ср','Чт','Пт','Сб','Вс']:
  p==='month'?['1 нед','2 нед','3 нед','4 нед','5 нед','6 нед']:
  ['Янв','Мар','Май','Июл','Сен','Ноя'];
 const trend=sequence.map((value,i)=>({
  label:names[i],leads:Math.round(value*.8*multiplier/8),
  sales:Math.round(value*.46*multiplier/8),
  revenue:value*1450*multiplier,cost:Math.round(value*480*multiplier)
 }));
 const total=trend.reduce((a,x)=>({
  leads:a.leads+x.leads,sales:a.sales+x.sales,
  revenue:a.revenue+x.revenue,cost:a.cost+x.cost
 }),{leads:0,sales:0,revenue:0,cost:0});
 const sources=[
  {name:'Рекомендации',leads:Math.round(total.leads*.47)},
  {name:'Сайт',leads:Math.round(total.leads*.34)},
  {name:'Социальные сети',leads:0}
 ];
 sources[2].leads=total.leads-sources[0].leads-sources[1].leads;
 let accounted=0;
 sources.forEach((x,i)=>{
  x.sales=i===2?total.sales-accounted:Math.round(total.sales*x.leads/Math.max(1,total.leads));
  accounted+=x.sales;x.revenue=Math.round(total.revenue*x.sales/Math.max(1,total.sales));
 });
 const costs=[
  {name:'Операционные',value:Math.round(total.cost*.55)},
  {name:'Реклама',value:Math.round(total.cost*.27)},
  {name:'Прочее',value:0}
 ];
 costs[2].value=total.cost-costs[0].value-costs[1].value;
 return {total,trend,sources,costs,demo:true};
}
// Legacy null interface remains intact for connected-source consumers that
// must never mistake illustrative records for actual customer data.
const EMPTY=Object.freeze({leads:null,sales:null,revenue:null,cost:null});
window.SEYVEO_PULSE_DEMO=Object.freeze({
 snapshot(){return EMPTY},
 picture(){return null}
});
/* Read only the single canonical owner-entered ledger. */
function ledgerRead(){return (window.SEYVEO_PULSE_LEDGER?.list?.()||[]).slice().reverse()}
function groupData(p){
 const now=new Date(),dayOf=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 if(p==='week')start.setDate(start.getDate()-6);
 if(p==='month')start.setDate(start.getDate()-29);
 if(p==='year')start.setMonth(start.getMonth()-11,1);
 const from=dayOf(start),to=dayOf(now),rows=ledgerRead().filter(x=>x.day>=from&&x.day<=to);
 const totals={leads:0,sales:0,revenue:0,cost:0},bySource=new Map(),byCost=new Map(),byBucket=new Map();
 const bucket=d=>p==='year'?d.slice(0,7):p==='today'?d:d;
 for(const item of rows){
  if(item.kind==='lead'){totals.leads++;bySource.set(item.label,(bySource.get(item.label)||0)+1)}
  if(item.kind==='order')totals.sales++;
  if(item.kind==='sale')totals.revenue+=item.amount;
  if(item.kind==='expense'){totals.cost+=item.amount;byCost.set(item.label,(byCost.get(item.label)||0)+item.amount)}
  const key=bucket(item.day),entry=byBucket.get(key)||{leads:0,sales:0,revenue:0,cost:0};
  if(item.kind==='lead')entry.leads++;
  if(item.kind==='order')entry.sales++;
  if(item.kind==='sale')entry.revenue+=item.amount;
  if(item.kind==='expense')entry.cost+=item.amount;
  byBucket.set(key,entry);
 }
 const trend=[...byBucket].sort((a,b)=>a[0].localeCompare(b[0])).map(([key,x])=>({label:p==='year'?key.slice(5):key.slice(5).replace('-','.'),...x}));
 const sources=[...bySource].map(([name,leads])=>({name,leads,sales:0,revenue:0}));
 const costs=[...byCost].map(([name,value])=>({name,value}));
 return {total:totals,trend,sources,costs,demo:false,local:true,hasRecords:rows.length>0};
}

function resolve(p){
 let actual=null;
 try{actual=window.SEYVEO_PULSE_DEMO?.picture?.(p)}catch{}
 if(actual&&actual.total&&Array.isArray(actual.trend)&&
  Array.isArray(actual.sources)&&Array.isArray(actual.costs))return actual;
 // Fill an empty prototype with sample figures for developer visual inspection.
 // As soon as real local records exist, show only the real ledger, never mix figures.
 if(!ledgerRead().length)return sampleData(p);
 return groupData(p);
}
window.SEYVEO_PULSE_VIEW=Object.freeze({get:resolve});
function readLocalTasks(){
 try{
  const tasks=JSON.parse(localStorage.getItem('seyveo-personal-tasks-v1')||'[]');
  return Array.isArray(tasks)?tasks.filter(t=>t&&typeof t.title==='string'&&!t.done).length:0;
 }catch{return 0}
}
function drawChart(data){
 const chart=$('pulseChart');chart.replaceChildren();
 const trend=Array.isArray(data.trend)?data.trend:[];
 chart.style.setProperty('--pulse-columns',String(Math.max(1,trend.length)));
 chart.setAttribute('role','group');
 chart.setAttribute('aria-label',data.demo?'Тестовый график динамики продаж':'Динамика продаж');
 const peak=Math.max(1,...trend.map(x=>x.revenue||0));
 for(const point of trend){
  const col=document.createElement('div');col.className='pulse-chart-col';
  col.setAttribute('aria-label',point.label+': '+money(point.revenue));
  const track=document.createElement('span');track.className='pulse-chart-track';
  const bar=document.createElement('span');bar.className='pulse-chart-bar';
  const percent=Math.max(3,Math.round((point.revenue||0)/peak*100));
  bar.style.setProperty('--pulse-height',percent+'%');
  track.append(bar);
  const label=document.createElement('small');label.textContent=point.label;
  col.append(track,label);chart.append(col);
 }
}
function render(){
 const data=resolve(period),total=data?.total||{leads:0,sales:0,revenue:0,cost:0};
 document.querySelectorAll('[data-pulse-period]').forEach(b=>
  b.setAttribute('aria-pressed',String(b.dataset.pulsePeriod===period)));
 const vals={
  pulseLeads:num.format(total.leads),
  pulseSales:num.format(total.sales),
  pulseRevenue:money(total.revenue),
  pulseCosts:money(total.cost),
  pulseProfit:money(total.revenue-total.cost),
  pulseConversion:(total.leads?(100*total.sales/total.leads):0).toLocaleString('ru-RU',{maximumFractionDigits:1})+'%'
 };
 for(const [id,value] of Object.entries(vals)){
  const target=$(id);if(target)target.textContent=value;
 }
 const preview=!!data.demo;
 const demoLabel=$('pulseDataStatus');
 if(demoLabel){
  demoLabel.hidden=!preview;
  demoLabel.textContent='ДЕМО · ТЕСТОВЫЕ ЦИФРЫ, НЕ РЕАЛЬНЫЕ ПРОДАЖИ';
 }
 $('pulseIncomeLabel').textContent='Выручка';
 drawChart(data||{trend:[]});
 const difference=total.revenue-total.cost;
 $('pulseInsight').textContent=preview
  ?'Учебный пример: '+num.format(total.leads)+' обращений, '+num.format(total.sales)+
   ' заказов. Разница между выручкой и расходами '+money(difference)+
   '. Реальные источники ещё не подключены.'
  :'Обращений: '+num.format(total.leads)+'. Заказов: '+num.format(total.sales)+
   '. Разница выручки и расходов: '+money(difference)+'.';
 $('pulseLocalSummary').textContent='Незавершённые дела на устройстве: '+num.format(readLocalTasks())+'.';
}
document.querySelectorAll('[data-pulse-period]').forEach(button=>
 button.addEventListener('click',()=>{
  if(!periods.includes(button.dataset.pulsePeriod)||period===button.dataset.pulsePeriod)return;
  period=button.dataset.pulsePeriod;
  document.dispatchEvent(new Event('seyveo:silk-touch'));render();
 }));
window.addEventListener('seyveo:pulse-ledger-changed',()=>{if(dialog.open)render()});
window.addEventListener('seyveo:pulse-open',event=>{
 period=periods.includes(event.detail?.period)?event.detail.period:'today';
 render();
 if(!dialog.open)dialog.showModal();
});
dialog.addEventListener('click',event=>{
 if(event.target!==dialog)return;
 const rect=dialog.getBoundingClientRect();
 if(event.clientX<rect.left||event.clientX>rect.right||
    event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
});
})();
