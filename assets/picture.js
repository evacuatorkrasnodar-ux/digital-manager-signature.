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
function businessData(){
 const source=window.SEYVEO_PULSE_DEMO;
 return source?.picture?.(period)||null;
}
function render(){
 const profile=(()=>{try{return JSON.parse(localStorage.getItem('seyveo-first-acquaintance-v1')||'null')}catch{return null}})();
 const life=profile?.focus==='life';
 $('pictureTitle').textContent=life?'Картина дня':'Картина бизнеса';
 $('pictureLead').textContent=life?'Ваши записи, дела и выбранные инструменты в одном месте.':'Понятно о клиентах, заказах и деньгах.';
 body.hidden=life;
 $('pictureBusinessCharts').hidden=life;
 $('pictureLifeNote').hidden=!life;
 $('pictureQuickInsight').hidden=life;
 $('pictureWidgetArea').querySelector('.home-widgets-caption').textContent=life?'ВАШИ ИНСТРУМЕНТЫ':'ДЕМО · ВАШ ВЫБОР';
 if(life)return;
 window.dispatchEvent(new CustomEvent('seyveo:picture-period',{detail:{period}}));
 const result=businessData();
 if(!result)return;
 const {total,trend,sources,costs}=result;
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
 plot.setAttribute('aria-label','Учебные продажи за период: нажмите на столбец для подробностей');
 const sourceList=$('pictureSources');sourceList.replaceChildren();
 sources.forEach((source,index)=>row(sourceList,source.name,source.leads+' обращений',total.leads?source.leads*100/total.leads:0,'source',index));
 const expenses=$('pictureExpenses');expenses.replaceChildren();
 costs.forEach((cost,index)=>row(expenses,cost.name,rub(cost.value),total.cost?cost.value*100/total.cost:0,'cost',index));
 const incomplete=Math.max(0,total.leads-total.sales);
 $('pictureSummary').textContent=total.leads
   ?'Из '+num.format(total.leads)+' обращений '+num.format(total.sales)+' стали заказами. '+(incomplete?'Стоит проверить оставшиеся '+num.format(incomplete)+'.':'Все обращения отмечены как заказы.')
   :'В выбранный период обращений нет.';
 $('pictureMoneyDifference').textContent='Разница между продажами и расходами: '+rub(total.revenue-total.cost)+'. Это не сумма поступлений на счёт.';
}
// Drill down from a number, a source, an expense, or one chart column.
function openBreakdown(title,subtitle,values,explanation){
 const dialog=$('pictureBreakdownDialog'),list=$('pictureBreakdownRows');
 $('pictureBreakdownTitle').textContent=title;
 $('pictureBreakdownSub').textContent=subtitle;
 $('pictureBreakdownExplain').textContent=explanation;
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
  ['Учебные расходы',rub(item.cost)]
 ],'Все показатели взяты из одного учебного набора событий. Это не реальные платежи или кассовые операции.');
});
for(const [group,id] of [['source','pictureSources'],['cost','pictureExpenses']]){
 $(id).addEventListener('click',event=>{
  const button=event.target.closest('[data-picture-group]');
  if(!button||button.dataset.pictureGroup!==group)return;
  const picture=businessData();if(!picture)return;
  const index=Number(button.dataset.pictureIndex);
  if(group==='source'){
   const item=picture.sources[index];if(!item)return;
   openBreakdown(item.name,'Как клиенты нашли компанию · демо',[
    ['Обращений',num.format(item.leads)],
    ['Стали заказами',num.format(item.sales)],
    ['Продано на сумму',rub(item.revenue)]
   ],'Распределение по источникам смоделировано для демонстрации. Рекламные кабинеты и CRM не подключены.');
  }else{
   const item=picture.costs[index];if(!item)return;
   const percent=picture.total.cost?Math.round(item.value*100/picture.total.cost):0;
   openBreakdown(item.name,'Категория расходов · демо',[
    ['Расходы',rub(item.value)],
    ['Доля всех расходов',percent+'%']
   ],'Это примерная категория расходов, а не список проведённых банковских платежей. Детализация по реальным операциям появится после подключения источника.');
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