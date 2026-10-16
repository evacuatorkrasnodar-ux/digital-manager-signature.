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
function row(root,label,value,total){
 const r=clean('div','picture-split-row');
 const head=clean('div','picture-split-label');
 head.append(clean('span','',label),clean('strong','',value));
 const track=clean('div','picture-split-track');
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
 $('pictureLifeNote').hidden=!life;
 if(life)return;
 const result=businessData();
 if(!result)return;
 const {total,trend,sources,costs}=result;
 document.querySelectorAll('[data-picture-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.picturePeriod===period)));
 $('pictureRevenue').textContent=rub(total.revenue);
 $('pictureTrendNote').textContent='Продажи на сумму · демо';
 const plot=$('pictureBars');plot.replaceChildren();plot.style.setProperty('--picture-bars',trend.length);
 const max=Math.max(1,...trend.map(x=>x.revenue));
 for(const bin of trend){
  const col=clean('div','picture-bin'),track=clean('div','picture-bin-track'),bar=clean('span','picture-bin-bar');
  bar.style.setProperty('--bar-height',String(bin.revenue?Math.max(4,Math.round(bin.revenue*100/max)):3)+'%');
  bar.title=bin.label+': '+rub(bin.revenue);
  const label=clean('small','',bin.label);
  track.append(bar);col.append(track,label);plot.append(col);
 }
 plot.setAttribute('role','img');
 plot.setAttribute('aria-label','Учебные продажи за выбранный период: '+rub(total.revenue));
 const sourceList=$('pictureSources');sourceList.replaceChildren();
 for(const source of sources)row(sourceList,source.name,source.leads+' обращений',total.leads?source.leads*100/total.leads:0);
 const expenses=$('pictureExpenses');expenses.replaceChildren();
 for(const cost of costs)row(expenses,cost.name,rub(cost.value),total.cost?cost.value*100/total.cost:0);
 const incomplete=Math.max(0,total.leads-total.sales);
 $('pictureSummary').textContent=total.leads
   ?'За выбранный период обратилось '+num.format(total.leads)+' человек, '+num.format(total.sales)+' обращений стали заказами. '+(incomplete?'По '+num.format(incomplete)+' обращениям пока нет отмеченного заказа. ':'')+'Продажи на '+rub(total.revenue)+', примерные расходы '+rub(total.cost)+'.'
   :'В выбранный период учебных обращений не было.';
 $('pictureMoneyDifference').textContent='Разница между продажами и расходами: '+rub(total.revenue-total.cost)+'. Это не сумма поступлений на счёт.';
}
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