/* SEYVEO · Пульс бизнеса · интерактивный сценарий в «Наших идеях».
 * Полностью вымышленная история; только память вкладки. Никаких API,
 * localStorage, платежей, настоящих клиентов, ИИ и отправки сообщений.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=$('manageRoadmapDialog');
const toggle=$('managePulseDemoToggle');
const panel=$('managePulseDemoPanel');
const next=$('managePulseDemoNext');
const fold=$('managePulseDemoFold');
const progress=$('managePulseDemoProgress');
const status=$('managePulseDemoStatus');
const title=$('managePulseDemoHeadline');
const text=$('managePulseDemoText');
const draft=$('managePulseDemoDraft');
const history=$('managePulseDemoHistory');
const result=$('managePulseDemoResult');
if(!root||!toggle||!panel||!next||!fold||!progress||!status||!title||!text||!draft||!history||!result)return;

const stages=Object.freeze([
 {status:'Новое · демо',title:'Клиент обратился',
  text:'Марина К. спрашивает, можно ли доставить заказ к пятнице. Источник обращения — вымышленный сайт.',
  event:'Поступило учебное обращение',action:'Создать заявку'},
 {status:'Заявка · демо',title:'Обращение теперь в Пульсе',
  text:'Сэйви связала клиента, источник, вопрос и следующий шаг в одной учебной заявке DEMO-001. Реальная CRM не подключена.',
  event:'Создана учебная заявка DEMO-001',action:'Подготовить предложение'},
 {status:'Черновик · не отправлен',title:'Сэйви предлагает ответ',
  text:'Это заранее подготовленный учебный текст, не результат работы настоящего ИИ. Сначала человек проверяет условия.',
  event:'Подготовлен черновик для проверки',action:'Одобрить черновик'},
 {status:'Одобрено · не отправлено',title:'Руководитель согласовал предложение',
  text:'Текст одобрен только в демо. Клиенту ничего не отправлено: отправку разрешёнными сервисами мы подключим отдельно.',
  event:'Черновик одобрен; отправка не выполнялась',action:'Смоделировать согласие клиента'},
 {status:'Ответ клиента · симуляция',title:'Представим, что клиент согласился',
  text:'Для продолжения сценария используем вымышленный ответ. Настоящего сообщения от клиента нет, деньги не поступали.',
  event:'Согласие клиента смоделировано',action:'Подтвердить учебный результат'},
 {status:'Завершено · только демо',title:'Весь путь собран в Пульсе',
  text:'От первого обращения до подтверждения результата — одна история. В реальном бизнесе завершение должно подтверждаться человеком или системой.',
  event:'Учебная заявка отмечена завершённой',action:'Повторить с начала'}
]);
let step=0;

function render(){
 const item=stages[step];
 progress.textContent='Шаг '+(step+1)+' из '+stages.length;
 status.textContent=item.status;
 title.textContent=item.title;
 text.textContent=item.text;
 next.textContent=item.action;
 draft.hidden=!(step===2||step===3);
 result.hidden=step!==5;
 history.replaceChildren();
 stages.slice(0,step+1).forEach((entry,index)=>{
  const row=document.createElement('li');
  const number=document.createElement('span');
  number.className='sv-pulse-demo-number';number.textContent=String(index+1).padStart(2,'0');
  const message=document.createElement('span');message.textContent=entry.event;
  row.append(number,message);history.append(row);
 });
}
toggle.addEventListener('click',()=>{
 const open=panel.hidden;
 panel.hidden=!open;
 toggle.setAttribute('aria-expanded',String(open));
 toggle.textContent=open?'Свернуть демо':'Открыть демо «Пульс бизнеса»';
 if(open){step=0;render();panel.scrollIntoView?.({block:'nearest',behavior:'auto'});}
});
next.addEventListener('click',()=>{step=(step+1)%stages.length;render()});
fold.addEventListener('click',()=>{panel.hidden=true;toggle.textContent='Открыть демо «Пульс бизнеса»';toggle.setAttribute('aria-expanded','false');toggle.focus()});
root.addEventListener('close',()=>{panel.hidden=true;step=0;toggle.setAttribute('aria-expanded','false');toggle.textContent='Открыть демо «Пульс бизнеса»'});
render();
})();
