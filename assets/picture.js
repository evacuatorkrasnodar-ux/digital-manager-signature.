/* SEYVEO Picture v1 · full data context instead of charts on Home. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const page=$('picturePage'),body=$('pictureBusiness');
if(!page||!body)return;
let period='today';
const num=new Intl.NumberFormat('ru-RU');
const rub=n=>num.format(n)+' ₽';
const clean=(tag,klass,value)=>{
 const el=document.createElement(tag);if(klass)el.className=klass;
 if(value!==undefined)el.textContent=value;
 return el;
};
function row(root,label,value,total,group,index){
 const r=clean('button','picture-split-row');
 r.type='button';r.dataset.pictureGroup=group;r.dataset.pictureIndex=String(index);
 r.setAttribute('aria-label',label+': '+value+'. Подробнее');
 const head=clean('span','picture-split-label');
 head.append(clean('span','',label),clean('strong','',value));
 const track=clean('span','picture-split-track');
 const fill=clean('span','picture-split-fill');
 fill.style.setProperty('--split-width',Math.max(0,Math.min(100,total||0))+'%');
 track.append(fill);r.append(head,track);root.append(r);
}
/* Explicit training data, never a business ledger; kept local to this screen. */
const sampleBase=Object.freeze({today:[12,20,16,27,23,34],week:[18,22,28,24,33,40,36],month:[18,25,22,31,28,37],year:[16,20,23,27,32,35]});
function sampleData(){
 const sequence=sampleBase[period];
 const multiplier={today:1,week:5,month:22,year:240}[period];
 const names=period==='today'?['09','10','11','12','13','14']:
  period==='week'?['Пн','Вт','Ср','Чт','Пт','Сб','Вс']:
  period==='month'?['1 нед','2 нед','3 нед','4 нед','5 нед','6 нед']:
  ['Янв','Мар','Май','Июл','Сен','Ноя'];
 const trend=sequence.map((value,i)=>({
  label:names[i],leads:Math.round(value*.8*multiplier/8),
  sales:Math.round(value*.46*multiplier/8),
  revenue:value*1450*multiplier,cost:Math.round(value*480*multiplier)
 }));
 const leads=trend.reduce((a,x)=>a+x.leads,0);
 const sales=trend.reduce((a,x)=>a+x.sales,0);
 const revenue=trend.reduce((a,x)=>a+x.revenue,0);
 const cost=trend.reduce((a,x)=>a+x.cost,0);
 const sources=[
  {name:'Рекомендации',leads:Math.round(leads*.47)},
  {name:'Сайт',leads:Math.round(leads*.34)},
  {name:'Социальные сети',leads:0}
 ];
 sources[2].leads=leads-sources[0].leads-sources[1].leads;
 let accounted=0;
 sources.forEach((x,i)=>{
  x.sales=i===2?sales-accounted:Math.round(sales*x.leads/Math.max(1,leads));
  accounted+=x.sales;x.revenue=Math.round(revenue*x.sales/Math.max(1,sales));
 });
 const costs=[
  {name:'Операционные',value:Math.round(cost*.55)},
  {name:'Реклама',value:Math.round(cost*.27)},
  {name:'Прочее',value:0}
 ];
 costs[2].value=cost-costs[0].value-costs[1].value;
 return {total:{leads,sales,revenue,cost},trend,sources,costs,demo:true};
}
function businessData(){
 const actual=window.SEYVEO_PULSE_DEMO?.picture?.(period);
 return actual||sampleData();
}
function render(){
 // This route is explicitly "Pulse of Business", including for life-first profiles.
 // Never hide its opt-in demonstration based on the onboarding preference.
 $('pictureTitle').textContent='Пульс бизнеса';
 $('pictureLead').textContent='Клиенты, продажи и расходы — пример работы Сэйви.';
 body.hidden=false;
 $('pictureBusinessCharts').hidden=false;
 $('pictureLifeNote').hidden=true;
 $('pictureQuickInsight').hidden=false;
 $('pictureWidgetArea').querySelector('.home-widgets-caption').textContent='ВАШ ВЫБОР';
 window.dispatchEvent(new CustomEvent('seyveo:picture-period',{detail:{period}}));
 const result=businessData();
 if(!result){
  const note=$('pictureLifeNote');
  note.hidden=false;
  note.textContent='Показатели появятся здесь после подключения ваших рабочих источников. Пока данные о продажах и расходах не получены.';
  if($('pictureDemoLabel'))$('pictureDemoLabel').hidden=true;
  $('pictureBusinessCharts').hidden=true;
  $('pictureQuickInsight').hidden=true;
  $('pictureBars').replaceChildren();
  $('pictureSources').replaceChildren();
  $('pictureExpenses').replaceChildren();
  $('pictureSummary').textContent='Пока нет подтверждённых показателей.';
  $('pictureMoneyDifference').textContent='Данные о продажах и расходах не подключены.';
  return;
 }
 $('pictureBusinessCharts').hidden=false;
 $('pictureQuickInsight').hidden=false;
 const {total,trend,sources,costs}=result;
 const demoLabel=$('pictureDemoLabel');
 if(demoLabel){demoLabel.hidden=!result.demo;demoLabel.textContent='ДЕМОНСТРАЦИЯ · ПРИМЕРНЫЕ ДАННЫЕ';}
 document.querySelectorAll('[data-picture-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.picturePeriod===period)));
 const plot=$('pictureBars');plot.replaceChildren();plot.style.setProperty('--picture-bars',trend.length);
 const max=Math.max(1,...trend.map(x=>x.revenue));
 for(const bin of trend){
  const col=clean('button','picture-bin'),track=clean('span','picture-bin-track'),bar=clean('span','picture-bin-bar');
  col.type='button';col.dataset.pictureIndex=String(plot.childElementCount);
  col.setAttribute('aria-label',bin.label+': продажи '+rub(bin.revenue)+'. Подробности');
  bar.style.setProperty('--bar-height',String(bin.revenue?Math.max(4,Math.round(100*bin.revenue/max)):3)+'%');
  const label=clean('small','',bin.label);
  track.append(bar);col.append(track,label);plot.append(col);
 }
 plot.setAttribute('role','group');
 plot.setAttribute('aria-label','Продажи за период: нажмите на столбец для подробностей');
 const sourceList=$('pictureSources');sourceList.replaceChildren();
 sources.forEach((source,index)=>row(sourceList,source.name,source.leads+' обращений',total.leads?source.leads*100/total.leads:0,'source',index));
 const expenses=$('pictureExpenses');expenses.replaceChildren();
 costs.forEach((cost,index)=>row(expenses,cost.name,rub(cost.value),total.cost?cost.value*100/total.cost:0,'cost',index));
 const incomplete=Math.max(0,total.leads-total.sales);
 $('pictureSummary').textContent=total.leads
   ?'Из '+num.format(total.leads)+' обращений '+num.format(total.sales)+' стали заказами. '+(incomplete?'Стоит проверить оставшиеся '+num.format(incomplete)+'.':'Все обращения отмечены как заказы.')
   :'В выбранный период обращений нет.';
 $('pictureMoneyDifference').textContent='Разница продаж и расходов: '+rub(total.revenue-total.cost);
}
// Drill down from a number, a source, an expense, or one chart column.
function openBreakdown(title,subtitle,values,explanation){
 const dialog=$('pictureBreakdownDialog'),list=$('pictureBreakdownRows');
 $('pictureBreakdownTitle').textContent=title;
 $('pictureBreakdownSub').textContent=subtitle;
 $('pictureBreakdownExplain').textContent=explanation||'';
 $('pictureBreakdownExplain').hidden=!explanation;
 list.replaceChildren();
 for(const [label,value] of values){
  const r=clean('div','home-widget-detail-row');
  r.append(clean('span','',label),clean('strong','',value));
  list.append(r);
 }
 if(!dialog.open)dialog.showModal();
}
$('pictureBars').addEventListener('click',event=>{
 const button=event.target.closest('[data-picture-index]');
 if(!button)return;
 const item=businessData()?.trend?.[Number(button.dataset.pictureIndex)];
 if(!item)return;
 openBreakdown('Продажи · '+item.label,'За выбранный отрезок времени',[
  ['Обращения',num.format(item.leads)],
  ['Заказы',num.format(item.sales)],
  ['Продажи на сумму',rub(item.revenue)],
  ['Расходы',rub(item.cost)]
 ],'');
});
for(const [group,id] of [['source','pictureSources'],['cost','pictureExpenses']]){
 $(id).addEventListener('click',event=>{
  const button=event.target.closest('[data-picture-group]');
  if(!button||button.dataset.pictureGroup!==group)return;
  const picture=businessData();if(!picture)return;
  const index=Number(button.dataset.pictureIndex);
  if(group==='source'){
   const item=picture.sources[index];if(!item)return;
   openBreakdown(item.name,'Как клиенты нашли компанию',[
    ['Обращений',num.format(item.leads)],
    ['Стали заказами',num.format(item.sales)],
    ['Продано на сумму',rub(item.revenue)]
   ],'');
  }else{
   const item=picture.costs[index];if(!item)return;
   const percent=picture.total.cost?Math.round(item.value*100/picture.total.cost):0;
   openBreakdown(item.name,'Категория расходов',[
    ['Расходы',rub(item.value)],
    ['Доля всех расходов',percent+'%']
   ],'');
  }
 });
}
$('pictureBreakdownClose').addEventListener('click',()=>$('pictureBreakdownDialog').close());
$('pictureBreakdownDialog').addEventListener('click',event=>{
 const dialog=$('pictureBreakdownDialog');
 if(event.target!==dialog)return;
 const rect=dialog.getBoundingClientRect();
 if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
});
$('pictureFullReport')?.addEventListener('click',()=>{
 window.dispatchEvent(new CustomEvent('seyveo:pulse-open',{detail:{period}}));
});
document.querySelectorAll('[data-picture-period]').forEach(button=>button.addEventListener('click',()=>{
 if(period===button.dataset.picturePeriod)return;
 period=button.dataset.picturePeriod;render();
 document.dispatchEvent(new Event('seyveo:silk-touch'));
}));
window.addEventListener('seyveo:profile-changed',render);
window.addEventListener('hashchange',()=>{if(location.hash==='#picture')render()});
window.addEventListener('storage',event=>{if(event.key==='seyveo-first-acquaintance-v1')render()});
window.addEventListener('seyveo:picture-open',()=>{if(location.hash==='#picture')render()});
render();
})();