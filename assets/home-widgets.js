/* SEYVEO Picture Widgets · saved selection and one demo ledger.
   Quiet metrics inside Picture; clean Home remains reserved for decisions. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const home=$('pictureWidgetArea'),grid=$('homeWidgetGrid'),config=$('homeWidgetsManageDialog');
const catalog=$('homeWidgetsCatalog'),details=$('homeWidgetDetails');
if(!home||!grid||!config||!catalog||!details)return;
// Keep saved settings when migrating from Home to Picture.
const KEY='seyveo-home-widgets-v1';
const PROFILE='seyveo-first-acquaintance-v1';
const CATALOG=Object.freeze([
 {id:'clients',label:'Клиенты',desc:'Сколько человек обратилось'},
 {id:'orders',label:'Заказы',desc:'Сколько договорённостей о покупке'},
 {id:'money',label:'Деньги',desc:'На какую сумму продажи и расходы'},
 {id:'plan',label:'Ближайшие дела',desc:'Ваши личные дела и сроки'},
 {id:'notes',label:'Записи',desc:'Блокнот и сохранённые мысли'}
]);
const BY_ID=Object.fromEntries(CATALOG.map(x=>[x.id,x]));
const num=new Intl.NumberFormat('ru-RU');
const rub=value=>num.format(value)+' ₽';
const create=(tag,klass,text)=>{
 const el=document.createElement(tag);
 if(klass)el.className=klass;
 if(text!==undefined)el.textContent=text;
 return el;
};
const readable=raw=>{try{return JSON.parse(raw)}catch{return null}};
const safeRead=key=>{try{return localStorage.getItem(key)}catch{return null}};
const pref=()=>{
 const raw=readable(safeRead(PROFILE));
 return raw?.focus==='life'?'life':'business';
};
const defaults=()=>pref()==='life'?['plan','notes']:['clients','orders','money'];
function selection(){
 const data=readable(safeRead(KEY));
 if(data&&data.version===1&&Array.isArray(data.ids)){
  const ids=[...new Set(data.ids)].filter(id=>typeof id==='string'&&BY_ID[id]);
  return ids.slice(0,CATALOG.length);
 }
 return defaults();
}
let selected=selection();
function persist(){
 try{
  localStorage.setItem(KEY,JSON.stringify({version:1,ids:[...selected]}));
  $('homeWidgetsSaved').textContent='Сохранено на этом устройстве';
  return true;
 }catch{
  $('homeWidgetsSaved').textContent='Не удалось сохранить. Проверьте память браузера.';
  return false;
 }
}
function update(next){
 const previous=[...selected];
 selected=[...new Set(next)].filter(id=>BY_ID[id]).slice(0,CATALOG.length);
 if(!persist()){selected=previous;return}
 renderHome();renderCatalog();
}
let picturePeriod='today';
function demo(){
 const source=window.SEYVEO_PULSE_DEMO;
 return source&&typeof source.snapshot==='function'
  ?source.snapshot(picturePeriod)
  :{leads:0,sales:0,revenue:0,cost:0};
}
function tasks(){
 const data=readable(safeRead('seyveo-personal-tasks-v1'));
 return Array.isArray(data)?data.filter(x=>x&&typeof x.title==='string'&&!x.done):[];
}
function notes(){
 const data=readable(safeRead('seyveo-notes-v1'));
 return Array.isArray(data)?data.length:0;
}
function info(id){
 const item=BY_ID[id];
 const data=demo(),count=tasks().length;
 if(id==='clients')return {label:item.label,value:num.format(data.leads),hint:'Обращений за период · демо'};
 if(id==='orders')return {label:item.label,value:num.format(data.sales),hint:'Заказов за период · демо'};
 if(id==='money')return {label:item.label,value:rub(data.revenue),hint:'Продажи за период · демо'};
 if(id==='plan')return {label:item.label,value:String(count),hint:count?'Нужно сделать · на устройстве':'Пока всё спокойно'};
 return {label:item.label,value:String(notes()),hint:'Сохранено на устройстве'};
}
const moneyCompact=value=>{
 if(value>=1000000)return (value/1000000).toLocaleString('ru-RU',{maximumFractionDigits:2})+' млн ₽';
 if(value>=1000)return (value/1000).toLocaleString('ru-RU',{maximumFractionDigits:1})+' тыс. ₽';
 return rub(value);
};
function renderHome(){
 grid.replaceChildren();
 home.hidden=selected.length===0;
 for(const id of selected){
  const data=info(id),button=create('button','home-widget-card picture-metric'+(id==='money'?' picture-metric--money':''));
  button.type='button';button.dataset.homeWidget=id;
  button.setAttribute('aria-label',data.label+'. '+data.value+'. '+data.hint+'. Открыть подробности');
  const label=create('span','home-widget-label',id==='money'?'Продано':data.label);
  const value=create('strong','home-widget-value',id==='money'?moneyCompact(demo().revenue):data.value);
  const arrow=create('span','home-widget-arrow');
  arrow.setAttribute('aria-hidden','true');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.innerHTML='<path d="m9 6 6 6-6 6"/>';
  arrow.append(svg);button.append(label,value,arrow);grid.append(button);
 }
}
function renderCatalog(){
 catalog.replaceChildren();
 const choices=[...selected,...CATALOG.map(x=>x.id).filter(x=>!selected.includes(x))];
 for(const id of choices){
  const item=BY_ID[id],on=selected.includes(id),idx=selected.indexOf(id);
  const row=create('div','home-widget-option');
  row.dataset.widgetRow=id;row.dataset.selected=String(on);
  const copy=create('span','home-widget-option-copy');
  copy.append(create('strong','',item.label),create('small','',item.desc));
  const buttons=create('span','home-widget-option-actions');
  const toggle=create('button','home-widget-option-toggle',on?'Убрать':'Добавить');
  toggle.type='button';toggle.dataset.widgetToggle=id;
  toggle.setAttribute('aria-label',(on?'Убрать с главной: ':'Добавить на главную: ')+item.label);
  toggle.setAttribute('aria-pressed',String(on));
  buttons.append(toggle);
  if(on){
   for(const [dir,text]of [['up','↑'],['down','↓']]){
    const b=create('button','home-widget-option-order',text);
    b.type='button';b.dataset.widgetMove=id;b.dataset.move=dir;
    b.setAttribute('aria-label',(dir==='up'?'Выше: ':'Ниже: ')+item.label);
    b.disabled=dir==='up'?idx===0:idx===selected.length-1;
    buttons.append(b);
   }
   const drag=create('button','home-widget-drag','⠿');
   drag.type='button';drag.dataset.widgetDrag=id;
   drag.setAttribute('aria-label','Удерживайте и переместите: '+item.label);
   drag.title='Удерживайте и перетащите';
   buttons.append(drag);
  }
  row.append(copy,buttons);catalog.append(row);
 }
 $('homeWidgetsManageCount').textContent=String(selected.length);
}
function rowsFor(id,datum){
 const unconverted=Math.max(0,datum.leads-datum.sales);
 if(id==='clients')return [
  ['Обращения за период',num.format(datum.leads)],
  ['Стали заказами',num.format(datum.sales)],
  ['Пока без отмеченного заказа',num.format(unconverted)]
 ];
 if(id==='orders')return [
  ['Заказов за период',num.format(datum.sales)],
  ['На сумму',rub(datum.revenue)],
  ['Обращений',num.format(datum.leads)]
 ];
 return [
  ['Продажи на сумму',rub(datum.revenue)],
  ['Учебные расходы',rub(datum.cost)],
  ['Разница',rub(datum.revenue-datum.cost)]
 ];
}
function detail(id){
 if(!['clients','orders','money'].includes(id))return;
 const datum=demo(),copy={
  clients:['Клиенты','Кто обращается и сколько заказов получилось','Это пример того, как SEYVEO сможет замечать обращения и помогать не терять клиентов. Пока живых подключений нет.'],
  orders:['Заказы','Что удалось продать за период','Суммы взяты из того же учебного набора, что показывает «Пульс». Это не сведения из кассы или CRM.'],
  money:['Деньги','Как идут продажи и расходы','Разница между учебными продажами и расходами — не банковский баланс и не подтверждённая бухгалтерская прибыль.']
 }[id];
 $('homeWidgetDetailTitle').textContent=copy[0];
 $('homeWidgetDetailSub').textContent=copy[1];
 $('homeWidgetDetailCopy').textContent=copy[2];
 const root=$('homeWidgetDetailRows');root.replaceChildren();
 for(const [name,value] of rowsFor(id,datum)){
  const row=create('div','home-widget-detail-row');
  row.append(create('span','',name),create('strong','',value));root.append(row);
 }
 if(!details.open)details.showModal();
}
function cardAction(id){
 if(id==='plan'){$('navTasks')?.click();return}
 if(id==='notes'){$('viewNotes')?.click();return}
 detail(id);
}
grid.addEventListener('click',event=>{
 const button=event.target.closest('[data-home-widget]');
 if(button)cardAction(button.dataset.homeWidget);
});
$('openHomeWidgetsManage').addEventListener('click',()=>{
 renderCatalog();$('homeWidgetsSaved').textContent='';
 if(!config.open)config.showModal();
});
$('homeWidgetsClose').addEventListener('click',()=>config.close());
$('homeWidgetDetailClose').addEventListener('click',()=>details.close());
for(const modal of [config,details])modal.addEventListener('click',event=>{
 if(event.target!==modal)return;
 const rect=modal.getBoundingClientRect();
 if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)modal.close();
});
catalog.addEventListener('click',event=>{
 const toggle=event.target.closest('[data-widget-toggle]');
 if(toggle){
  const id=toggle.dataset.widgetToggle;
  update(selected.includes(id)?selected.filter(x=>x!==id):[...selected,id]);
  return;
 }
 const move=event.target.closest('[data-widget-move]');
 if(move){
  const idx=selected.indexOf(move.dataset.widgetMove),delta=move.dataset.move==='up'?-1:1;
  if(idx<0||idx+delta<0||idx+delta>=selected.length)return;
  const next=[...selected];[next[idx],next[idx+delta]]=[next[idx+delta],next[idx]];
  update(next);
 }
});
// Pointer-press-and-move works on touch as well as mouse. Up/down is the
// non-gesture alternative; only the small dedicated handle disables scrolling.
let drag=null;
function clearDrag(){
 if(drag?.timer)clearTimeout(drag.timer);
 catalog.querySelectorAll('.is-dragging,.is-drag-target').forEach(x=>x.classList.remove('is-dragging','is-drag-target'));
 drag=null;
}
catalog.addEventListener('pointerdown',event=>{
 const handle=event.target.closest('[data-widget-drag]');
 if(!handle||event.button>0)return;
 clearDrag();
 const id=handle.dataset.widgetDrag;
 drag={id,pointerId:event.pointerId,started:false,target:id,timer:null,startX:event.clientX,startY:event.clientY};
 drag.timer=setTimeout(()=>{
  if(!drag||drag.id!==id)return;
  drag.started=true;
  catalog.querySelector('[data-widget-row="'+id+'"]')?.classList.add('is-dragging');
 },420);
 try{handle.setPointerCapture(event.pointerId)}catch{}
});
catalog.addEventListener('pointermove',event=>{
 if(!drag||event.pointerId!==drag.pointerId)return;
 if(!drag.started){
  if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>14)clearDrag();
  return;
 }
 const element=document.elementFromPoint(event.clientX,event.clientY);
 const target=element?.closest('[data-widget-row]');
 catalog.querySelectorAll('.is-drag-target').forEach(x=>x.classList.remove('is-drag-target'));
 if(target&&selected.includes(target.dataset.widgetRow)){
  drag.target=target.dataset.widgetRow;
  if(drag.target!==drag.id)target.classList.add('is-drag-target');
 }
});
catalog.addEventListener('pointerup',event=>{
 if(!drag||event.pointerId!==drag.pointerId)return;
 const {started,id,target}=drag;
 clearDrag();
 if(started&&target!==id){
  const moved=selected.filter(x=>x!==id),at=moved.indexOf(target);
  if(at>=0){moved.splice(at,0,id);update(moved)}
 }
});
catalog.addEventListener('pointercancel',clearDrag);
window.addEventListener('seyveo:picture-period',event=>{picturePeriod=event.detail?.period||'today';renderHome()});
window.addEventListener('seyveo:tasks-changed',renderHome);
window.addEventListener('seyveo:notes-changed',renderHome);
window.addEventListener('seyveo:profile-changed',()=>{
 if(safeRead(KEY)===null)selected=defaults();
 renderHome();renderCatalog();
});
window.addEventListener('storage',event=>{
 if(event.key===KEY){selected=selection();renderHome();renderCatalog()}
 if(event.key==='seyveo-personal-tasks-v1'||event.key==='seyveo-notes-v1')renderHome();
 if(event.key===PROFILE&&safeRead(KEY)===null){selected=defaults();renderHome();renderCatalog()}
});
renderHome();
})();