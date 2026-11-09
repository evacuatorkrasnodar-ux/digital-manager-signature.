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

/* One SEYVEO date picker for manual Pulse operations.
   Keep the existing date input as the submitted value; never summon the
   browser's rectangular native date popup on the visible control. */
let syncOperationDate=()=>{};
function installOperationDatePicker(){
 const input=$('pictureOperationDay'),oldLabel=input?.closest('label');
 if(!input||!oldLabel)return;
 const pad=n=>String(n).padStart(2,'0');
 const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
 const parse=value=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(year,month-1,day);
  return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
 };
 const dateLong=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'});
 const monthLong=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'});
 const field=clean('div','picture-operation-day-field');
 const heading=clean('span','picture-operation-field-label','Дата');
 const trigger=clean('button','picture-operation-date-trigger');
 trigger.type='button';trigger.id='pictureOperationDateTrigger';
 trigger.setAttribute('aria-label','Выбрать дату операции');
 trigger.setAttribute('aria-haspopup','dialog');
 trigger.setAttribute('aria-controls','pictureOperationDateDialog');
 const triggerValue=clean('span','picture-operation-date-value');
 const triggerIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');
 triggerIcon.setAttribute('viewBox','0 0 24 24');triggerIcon.setAttribute('aria-hidden','true');
 triggerIcon.innerHTML='<rect x="3.5" y="5" width="17" height="15.5" rx="2.8"/><path d="M7.5 3.5v3.5M16.5 3.5v3.5M3.5 10h17M7.5 13.5h.01M12 13.5h.01M16.5 13.5h.01M7.5 17h.01M12 17h.01"/>';
 trigger.append(triggerValue,triggerIcon);
 input.classList.add('picture-operation-native-date');
 input.tabIndex=-1;
 input.setAttribute('aria-label','Дата операции');
 oldLabel.replaceWith(field);
 field.append(heading,input,trigger);
 const dialog=document.createElement('dialog');
 dialog.id='pictureOperationDateDialog';
 dialog.className='picture-date-dialog';
 dialog.setAttribute('aria-labelledby','pictureDateTitle');
 dialog.innerHTML=[
  '<div class="picture-date-head"><div><span class="picture-date-eyebrow">Дата операции</span><h2 id="pictureDateTitle">Выбрать дату</h2></div><button type="button" class="picture-date-close" aria-label="Закрыть календарь"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>',
  '<div class="picture-date-month"><button type="button" data-move="-1" aria-label="Предыдущий месяц"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button><strong id="pictureDateMonth" aria-live="polite"></strong><button type="button" data-move="1" aria-label="Следующий месяц"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5 7 7-7 7"/></svg></button></div>',
  '<div class="picture-date-week" aria-hidden="true"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>',
  '<div class="picture-date-days" role="group" aria-label="Дни месяца"></div>',
  '<div class="picture-date-footer"><button type="button" data-today>Сегодня</button><button type="button" data-cancel>Отмена</button></div>'
 ].join('');
 document.body.append(dialog);
 const days=dialog.querySelector('.picture-date-days');
 const title=dialog.querySelector('#pictureDateMonth');
 let viewed=new Date();
 const sync=()=>{
  const date=parse(input.value);
  triggerValue.textContent=date?dateLong.format(date):'Выбрать дату';
 };
 syncOperationDate=sync;
 function draw(){
  const y=viewed.getFullYear(),m=viewed.getMonth();
  const monthTitle=monthLong.format(viewed);
  title.textContent=monthTitle.charAt(0).toUpperCase()+monthTitle.slice(1);
  const start=(new Date(y,m,1).getDay()+6)%7;
  const last=new Date(y,m+1,0).getDate();
  const cells=Math.ceil((start+last)/7)*7;
  const selected=input.value,today=iso(new Date());
  const frag=document.createDocumentFragment();
  for(let cell=0;cell<cells;cell++){
   const day=cell-start+1;
   if(day<1||day>last){const blank=clean('span','picture-date-blank');blank.setAttribute('aria-hidden','true');frag.append(blank);continue;}
   const date=new Date(y,m,day),key=iso(date);
   const button=clean('button','picture-date-day',String(day));
   button.type='button';button.dataset.date=key;
   button.setAttribute('aria-label',dateLong.format(date));
   button.setAttribute('aria-pressed',String(key===selected));
   if(key===selected)button.classList.add('is-selected');
   if(key===today)button.classList.add('is-today');
   frag.append(button);
  }
  days.replaceChildren(frag);
 }
 function choose(date){
  input.value=iso(date);
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
  dialog.close();
 }
 trigger.addEventListener('click',()=>{
  const chosen=parse(input.value)||new Date();
  viewed=new Date(chosen.getFullYear(),chosen.getMonth(),1);
  draw();
  if(typeof dialog.showModal==='function')dialog.showModal();
 });
 dialog.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>{
  viewed=new Date(viewed.getFullYear(),viewed.getMonth()+Number(button.dataset.move),1);
  draw();
 }));
 days.addEventListener('click',event=>{
  const button=event.target.closest('[data-date]');if(!button)return;
  const date=parse(button.dataset.date);if(date)choose(date);
 });
 dialog.querySelector('[data-today]').addEventListener('click',()=>choose(new Date()));
 dialog.querySelectorAll('.picture-date-close,[data-cancel]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const box=dialog.getBoundingClientRect();
  if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
 });
 dialog.addEventListener('close',()=>{if(!operationForm.hidden)trigger.focus({preventScroll:true})});
 input.addEventListener('input',sync);
 input.addEventListener('change',sync);
 operationForm.addEventListener('reset',()=>requestAnimationFrame(sync));
 sync();
}
installOperationDatePicker();
function setOperationForm(open){
 operationForm.hidden=!open;
 operationOpen.setAttribute('aria-expanded',String(open));
 // Edit mode has a single primary action (Save). The list's add icon and
 // redundant empty message return when editing ends.
 operationForm.closest('.picture-operations')?.classList.toggle('is-editing',open);
 if(open){
  const day=$('pictureOperationDay');
  if(!day.value){
   const d=new Date();
   day.value=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  }
  syncOperationDate();
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
$('pictureOperationCancel').addEventListener('click',()=>{
 setOperationForm(false);
 operationOpen.focus({preventScroll:true});
});
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
 r.setAttribute('aria-label',label+': '+value+'. Показать подробности');
 r.setAttribute('aria-expanded','false');
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
// SEYVEO advisory layer: transparent, deterministic explanations derived
// exclusively from the same period totals shown in the Pulse. This is not a
// claim to external AI processing or connected CRM access.
let sayviDraft='';
const advicePeriod={today:'сегодня',week:'за неделю',month:'за месяц',year:'за год'};
function renderSayviAdvice(result){
 const card=$('pictureQuickInsight'),title=$('pictureSummary'),details=$('pictureSayviDetails');
 if(!card||!title||!details)return;
 card.hidden=false;
 details.hidden=true;
 $('pictureSayviWhy')?.setAttribute('aria-expanded','false');
 details.replaceChildren();
 const rows=[];
 if(!result){
  title.textContent='Чтобы анализировать работу компании, нужны показатели продаж, расходов и обращений.';
  rows.push('Подключите источник данных. После этого Сэйви сможет подсвечивать изменения в показателях.');
  sayviDraft='Сэйви, помоги настроить получение показателей бизнеса для Пульса.';
 }else{
  const t=result.total||{},leads=Number(t.leads)||0,sales=Number(t.sales)||0;
  const revenue=Number(t.revenue)||0,cost=Number(t.cost)||0,diff=revenue-cost;
  const pending=Math.max(0,leads-sales);
  const costs=Array.isArray(result.costs)?result.costs:[];
  const sources=Array.isArray(result.sources)?result.sources:[];
  const highest=costs.filter(x=>Number(x.value)>0).sort((a,b)=>b.value-a.value)[0];
  const popular=sources.filter(x=>Number(x.leads)>0).sort((a,b)=>b.leads-a.leads)[0];
  if(leads>0&&pending>0){
   title.textContent=num.format(pending)+' из '+num.format(leads)+' обращений пока не стали заказами. Стоит проверить, на каком этапе они остановились.';
  }else if(cost>revenue&&cost>0){
   title.textContent='Расходы выше продаж на '+rub(cost-revenue)+'. Сначала проверьте крупные статьи расходов.';
  }else if(revenue>0){
   title.textContent='Продажи выше расходов на '+rub(diff)+'. Посмотрим, где можно усилить результат.';
  }else{
   title.textContent='Показателей пока недостаточно для вывода. Сэйви поможет определить, что следует подключить.';
  }
  if(leads>0)rows.push('Из '+num.format(leads)+' обращений '+num.format(sales)+' стали заказами. Осталось '+num.format(pending)+'.');
  if(revenue||cost)rows.push('Продажи '+rub(revenue)+', расходы '+rub(cost)+', разница '+rub(diff)+'. Это разница показателей, не расчёт чистой прибыли.');
  if(highest&&cost>0){
   const share=Math.round(Number(highest.value)/cost*100);
   rows.push('Самая крупная статья расходов — '+highest.name+': '+rub(highest.value)+' ('+share+'%).');
  }
  if(popular)rows.push('Наибольшее число обращений пришло через «'+popular.name+'»: '+num.format(popular.leads)+'.');
  if(!rows.length)rows.push('При появлении записей Сэйви покажет, как меняются продажи, обращения и расходы.');
  sayviDraft='Сэйви, разберём Пульс бизнеса '+advicePeriod[period]+'. '+title.textContent+
   ' Продажи '+rub(revenue)+', расходы '+rub(cost)+', обращений '+num.format(leads)+', заказов '+num.format(sales)+
   '. Какие три действия стоит проверить в первую очередь?';
 }
 for(const sentence of rows){
  const paragraph=clean('p','picture-sayvi-detail',sentence);
  details.append(paragraph);
 }
}
$('pictureSayviWhy')?.addEventListener('click',()=>{
 const panel=$('pictureSayviDetails'),button=$('pictureSayviWhy');
 const show=panel.hidden;panel.hidden=!show;
 button.setAttribute('aria-expanded',String(show));
 button.textContent=show?'Свернуть':'Пояснить';
});
$('pictureSayviDiscuss')?.addEventListener('click',()=>{
 const draft=sayviDraft||'Сэйви, помоги разобраться с показателями Пульса бизнеса.';
 const field=$('question');
 // Do not automatically submit, act, or invent an assistant response.
 if(field){field.value=draft;field.dispatchEvent(new Event('input',{bubbles:true}));}
 if(typeof window.SEYVEO_CONVERSATION?.open==='function'){
  window.SEYVEO_CONVERSATION.open();
 }else{
  location.hash='#home';
 }
});
$('pictureConnectSources')?.addEventListener('click',()=>{
 location.hash='#manage';
 requestAnimationFrame(()=>document.getElementById('openManageConnections')?.click());
});
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
  note.textContent='Пока не получены показатели. Подключите рабочий источник в разделе «Источники и проверка».';
  if($('pictureDemoLabel'))$('pictureDemoLabel').hidden=true;
  $('pictureBusinessCharts').hidden=true;
  $('pictureQuickInsight').hidden=true;
  $('pictureBars').replaceChildren();
  $('pictureSources').replaceChildren();
  $('pictureExpenses').replaceChildren();
  renderSayviAdvice(null);
  $('pictureMoneyDifference').textContent='Данные о продажах и расходах не подключены.';
  return;
 }
 $('pictureBusinessCharts').hidden=false;
 $('pictureQuickInsight').hidden=false;
 const {total,trend,sources,costs}=result;
 // Presentation mode keeps filled figures visible without developer banners.
 // The data provider still carries its internal provenance flag.
 if($('pictureDemoLabel'))$('pictureDemoLabel').hidden=true;
 if($('pictureDataStatus'))$('pictureDataStatus').hidden=true;
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
 renderSayviAdvice(result);
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
// Six short source/expense breakdowns belong INSIDE the Pulse, not in six
// modal "pages". Keep the graph's separate detailed period view intact.
function toggleInlineBreakdown(button,group,index,picture){
 const root=button.closest('.picture-breakdown');
 if(!root)return;
 const wasExpanded=button.getAttribute('aria-expanded')==='true';
 page.querySelectorAll('.picture-split-row[aria-expanded="true"]').forEach(row=>{
  row.setAttribute('aria-expanded','false');
  row.setAttribute('aria-label',row.getAttribute('aria-label')?.replace('Скрыть подробности','Показать подробности')||'Показать подробности');
 });
 page.querySelectorAll('.picture-split-inline').forEach(panel=>panel.remove());
 if(wasExpanded)return;
 let title='',values=[];
 if(group==='source'){
  const item=picture.sources[index];if(!item)return;
  title=item.name;
  values=[['Обращений',num.format(item.leads)],['Стали заказами',num.format(item.sales)],['Продано на сумму',rub(item.revenue)]];
 }else{
  const item=picture.costs[index];if(!item)return;
  title=item.name;
  const percent=picture.total.cost?Math.round(item.value*100/picture.total.cost):0;
  values=[['Расходы',rub(item.value)],['Доля всех расходов',percent+'%']];
 }
 const panel=clean('div','picture-split-inline');
 panel.id='pictureInline-'+group+'-'+index;
 panel.setAttribute('role','region');
 panel.setAttribute('aria-label','Подробности: '+title);
 for(const [label,value] of values){
  const row=clean('div','picture-split-inline-row');
  row.append(clean('span','',label),clean('strong','',value));
  panel.append(row);
 }
 button.insertAdjacentElement('afterend',panel);
 button.setAttribute('aria-expanded','true');
 button.setAttribute('aria-controls',panel.id);
 button.setAttribute('aria-label',title+'. Скрыть подробности');
}
for(const [group,id] of [['source','pictureSources'],['cost','pictureExpenses']]){
 $(id).addEventListener('click',event=>{
  const button=event.target.closest('[data-picture-group]');
  if(!button||button.dataset.pictureGroup!==group)return;
  const picture=businessData();if(!picture)return;
  toggleInlineBreakdown(button,group,Number(button.dataset.pictureIndex),picture);
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