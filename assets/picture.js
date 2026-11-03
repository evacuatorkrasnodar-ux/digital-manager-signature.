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
const operationForm=$('pictureOperationForm'),operationKind=$('pictureOperationKind'),operationAmount=$('pictureOperationAmount');
const operationNote=$('pictureOperationStatus'),operationOpen=$('pictureOperationOpen'),operationsList=$('pictureOperationsList');
const operationTypes={sale:'Продажа',expense:'Расход',order:'Заказ',lead:'Обращение'};
function setOperationForm(open){
 operationForm.hidden=!open;
 operationOpen.setAttribute('aria-expanded',String(open));
 if(open){
  const day=$('pictureOperationDay');
  if(!day.value){
   const d=new Date();
   day.value=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  }
  kindGroup.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
 }
}
const kindGroup=$('pictureOperationForm').querySelector('.picture-operation-kind-options');
function syncKindButtons(){
 kindGroup.querySelectorAll('[data-picture-operation-kind]').forEach(button=>
  button.setAttribute('aria-pressed',String(button.dataset.pictureOperationKind===operationKind.value)));
}
kindGroup.addEventListener('click',event=>{
 const button=event.target.closest('[data-picture-operation-kind]');
 if(!button)return;
 operationKind.value=button.dataset.pictureOperationKind;
 operationKind.dispatchEvent(new Event('change',{bubbles:true}));
});
operationOpen.addEventListener('click',()=>setOperationForm(operationForm.hidden));
$('pictureOperationCancel').addEventListener('click',()=>setOperationForm(false));
operationKind.addEventListener('change',()=>{
 syncKindButtons();
 const money=['sale','expense'].includes(operationKind.value);
 $('pictureOperationAmountRow').hidden=!money;
 operationAmount.required=money;
 if(!money)operationAmount.value='';
});
function renderOperations(){
 operationsList.replaceChildren();
 const rows=window.SEYVEO_PULSE_LEDGER?.list?.()||[];
 if(!rows.length){
  operationsList.append(clean('p','picture-operation-empty','Операций пока нет. Добавь первую запись.'));
  return;
 }
 for(const item of rows.slice(0,20)){
  const record=clean('div','picture-operation-row');
  const detail=clean('span','picture-operation-detail');
  detail.append(clean('strong','',item.label),clean('small','',(operationTypes[item.kind]||item.kind)+' · '+item.day.split('-').reverse().join('.')));
  const number=clean('span','picture-operation-value',['sale','expense'].includes(item.kind)?rub(item.amount):'1');
  const remove=clean('button','picture-operation-remove','×');
  remove.type='button';remove.setAttribute('aria-label','Удалить запись: '+item.label);
  remove.addEventListener('click',()=>{
   if(!window.confirm('Удалить запись «'+item.label+'»?'))return;
   const ok=window.SEYVEO_PULSE_LEDGER?.remove?.(item.id);
   if(!ok){operationNote.hidden=false;operationNote.textContent='Не удалось удалить запись.';}
  });
  record.append(detail,number,remove);operationsList.append(record);
 }
 if(rows.length>20)operationsList.append(clean('p','picture-operation-empty','Показаны последние 20 из '+rows.length+' записей.'));
}
operationForm.addEventListener('submit',event=>{
 event.preventDefault();
 const kind=operationKind.value,money=['sale','expense'].includes(kind);
 const result=window.SEYVEO_PULSE_LEDGER?.add?.({
  kind,label:$('pictureOperationLabel').value,
  amount:money?Number(operationAmount.value):0,
  day:$('pictureOperationDay').value
 });
 if(!result?.ok){
  operationNote.textContent=result?.error||'Журнал операций не загрузился. Обновите страницу.';
  operationNote.hidden=false;return;
 }
 operationForm.reset();operationKind.dispatchEvent(new Event('change'));
 operationNote.hidden=true;setOperationForm(false);
});
window.addEventListener('seyveo:pulse-ledger-changed',()=>{
 renderOperations();
 if(location.hash==='#picture')render();
});
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
/* Explicitly marked developer presentation figures. The project is a preview:
   use connected figures first, otherwise show illustrative analytics that
   are NEVER labeled as real sales, payments, or accounting. */
/* Detailed Pulse and Business Pulse share one audited provider in pulse.js.
   Each view must resolve the same period to the same data and demo label. */
function businessData(){
 return window.SEYVEO_PULSE_VIEW?.get?.(period)||null;
}
function updateKeyNumbers(total){
 const values={
  pictureKpiRevenue:rub(total.revenue),
  pictureKpiCost:rub(total.cost),
  pictureKpiBalance:rub(total.revenue-total.cost),
  pictureKpiOrders:num.format(total.sales)
 };
 for(const [id,value] of Object.entries(values)){
  const el=$(id);if(el)el.textContent=value;
 }
}
function render(){
 // This route is explicitly "Pulse of Business", including for life-first profiles.
 // Never hide its opt-in demonstration based on the onboarding preference.
 $('pictureTitle').textContent='Пульс бизнеса';
 renderOperations();
 $('pictureLead').textContent='Продажи, расходы и обращения · за выбранный период.';
 body.hidden=false;
 $('pictureBusinessCharts').hidden=false;
 $('pictureLifeNote').hidden=true;
 $('pictureQuickInsight').hidden=false;
 $('pictureWidgetArea').querySelector('.home-widgets-caption').textContent='ВАШ ВЫБОР';
 window.dispatchEvent(new CustomEvent('seyveo:picture-period',{detail:{period}}));
 // Keep the selected period visible even before external business data is connected.
 document.querySelectorAll('[data-picture-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.picturePeriod===period)));
 const result=businessData();
 if(!result){
  const note=$('pictureLifeNote');
  note.hidden=false;
  note.textContent='Операций пока нет. Добавь продажу, расход, заказ или обращение выше.';
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
 const isSample=result.demo===true;
 const demoLabel=$('pictureDemoLabel');
 if(demoLabel){
  demoLabel.hidden=!isSample;
  demoLabel.textContent='ПРИМЕР ДАННЫХ';
 }
 const dataStatus=$('pictureDataStatus');
 if(dataStatus){
  dataStatus.hidden=!isSample;
  dataStatus.textContent='Примерные цифры для проверки интерфейса. После первой записи показываем только ваши операции.';
 }
 updateKeyNumbers(total);
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
document.querySelectorAll('[data-picture-period]').forEach(button=>button.addEventListener('click',()=>{
 if(period===button.dataset.picturePeriod)return;
 period=button.dataset.picturePeriod;render();
 document.dispatchEvent(new Event('seyveo:silk-touch'));
}));
window.addEventListener('seyveo:profile-changed',render);
window.addEventListener('seyveo:demo-mode-changed',render);
window.addEventListener('hashchange',()=>{if(location.hash==='#picture')render()});
window.addEventListener('storage',event=>{if(event.key==='seyveo-first-acquaintance-v1')render()});
window.addEventListener('seyveo:picture-open',()=>{if(location.hash==='#picture')render()});
render();
})();