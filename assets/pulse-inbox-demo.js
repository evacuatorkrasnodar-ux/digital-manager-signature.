/* SEYVEO · Пульс бизнеса / единая учебная очередь обращений.
 * In-memory demonstration on invented cases only. No user/business storage,
 * real inbox integrations, AI, sending, delivery confirmation or billing.
 * Never duplicates the production Pulse database: none is connected yet.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const ids={
 dialog:'manageRoadmapDialog',toggle:'pulseInboxToggle',panel:'pulseInboxPanel',
 list:'pulseInboxList',headline:'pulseInboxHeadline',count:'pulseInboxCount',
 source:'pulseInboxSource',message:'pulseInboxMessage',state:'pulseInboxState',
 draft:'pulseInboxDraft',draftText:'pulseInboxDraftText',
 history:'pulseInboxHistory',action:'pulseInboxAction',reset:'pulseInboxReset',
 close:'pulseInboxClose',feedback:'pulseInboxFeedback'
};
const el=Object.fromEntries(Object.entries(ids).map(([key,id])=>[key,$(id)]));
if(Object.values(el).some(x=>!x))return;
const filterButtons=Array.from(document.querySelectorAll('[data-pulse-inbox-filter]'));
const seed=Object.freeze([
 {id:'DEMO-001',person:'Марина К.',source:'Сайт',topic:'Доставка заказа к пятнице',
  message:'Здравствуйте! Подскажите, возможна ли доставка заказа к пятнице?',
  draft:'Здравствуйте! Спасибо за обращение. Мы уточним возможность доставки к пятнице и подтвердим условия перед оформлением.',
  start:'new'},
 {id:'DEMO-002',person:'Игорь В.',source:'Telegram · условно',
  topic:'Уточнить стоимость обслуживания',
  message:'Добрый день. Подскажите стоимость обслуживания и какие работы входят?',
  draft:'Игорь, добрый день! Уточните, пожалуйста, объём работ, чтобы мы подготовили точное предложение без выдуманных цен.',
  start:'waiting'},
 {id:'DEMO-003',person:'Лидия П.',source:'Почта · условно',
  topic:'Подтверждение получения заказа',
  message:'Спасибо, заказ получила. Всё в порядке.',
  draft:'Лидия, благодарим за подтверждение. Будем рады помочь снова.',
  start:'resolved'}
]);
const names={
 new:'Новое · нужно ответить',
 waiting:'Ожидает ответа',
 draft:'Черновик · не отправлен',
 approved:'Одобрено · не отправлено',
 acknowledged:'Клиент ответил · симуляция',
 resolved:'Завершено · учебное'
};
const actions={
 new:'Подготовить учебный черновик',
 waiting:'Подготовить учебный черновик',
 draft:'Одобрить черновик без отправки',
 approved:'Смоделировать ответ клиента',
 acknowledged:'Закрыть обращение в демо',
 resolved:'Вернуть в работу (демо)'
};
const isUnanswered=item=>!['acknowledged','resolved'].includes(item.stage);
let entries=[],selected='DEMO-001',filter='all';
function resetData(){
 entries=seed.map(item=>({...item,stage:item.start,events:[
   item.start==='resolved'?'Учебное обращение уже закрыто':'Учебное обращение получено'
 ]}));
 selected='DEMO-001';filter='all';
}
function entriesShown(){
 if(filter==='unanswered')return entries.filter(isUnanswered);
 if(filter==='resolved')return entries.filter(x=>x.stage==='resolved');
 return entries;
}
function make(tag,cls,value){
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(value!=null)node.textContent=value;
 return node;
}
function render(){
 const unanswered=entries.filter(isUnanswered).length;
 const resolved=entries.filter(x=>x.stage==='resolved').length;
 el.count.textContent=entries.length+' учебных · '+unanswered+' требуют ответа · '+resolved+' завершено';
 for(const button of filterButtons){
  button.setAttribute('aria-pressed',String(button.dataset.pulseInboxFilter===filter));
 }
 el.list.replaceChildren();
 const shown=entriesShown();
 if(!shown.some(x=>x.id===selected))selected=shown[0]?.id||'';
 for(const item of shown){
  const btn=make('button','sv-pulse-inbox-item');
  btn.type='button';
  btn.setAttribute('aria-pressed',String(item.id===selected));
  btn.setAttribute('aria-label',item.person+' · '+item.topic+' · '+names[item.stage]);
  const head=make('span','sv-pulse-inbox-item-heading');
  head.append(make('strong','',item.person),make('small','',item.source+' · '+item.id));
  btn.append(head,make('span','sv-pulse-inbox-item-topic',item.topic),
   make('span','sv-pulse-inbox-item-state',names[item.stage]));
  btn.addEventListener('click',()=>{selected=item.id;render()});
  el.list.append(btn);
 }
 if(!shown.length)el.list.append(make('p','sv-pulse-inbox-empty','В этой категории пока нет учебных обращений.'));
 const current=entries.find(x=>x.id===selected);
 const empty=!current;
 el.action.hidden=empty;
 el.headline.textContent=empty?'Нет обращений для просмотра':current.person+' · '+current.topic;
 el.source.textContent=empty?'':current.source+' · '+current.id+' · только демо';
 el.message.textContent=empty?'Выберите другую категорию, чтобы посмотреть учебную историю.':current.message;
 el.state.textContent=empty?'':names[current.stage];
 const draftVisible=current&&['draft','approved','acknowledged','resolved'].includes(current.stage);
 el.draft.hidden=!draftVisible;
 el.draftText.textContent=draftVisible?current.draft:'';
 el.history.replaceChildren();
 if(current)current.events.forEach((event,i)=>{
  const row=make('li','sv-pulse-inbox-event');
  row.append(make('span','sv-pulse-inbox-event-index',String(i+1).padStart(2,'0')),
   make('span','',event));
  el.history.append(row);
 });
 el.action.textContent=current?actions[current.stage]:'';
 el.feedback.textContent=current&&current.stage==='approved'
  ?'Черновик одобрен, но не отправлен. Следующий шаг — только симуляция.'
  :current&&current.stage==='acknowledged'
  ?'Ответ клиента вымышленный. Реальных подтверждений нет.'
  :'Учебные данные. Никаких сообщений не отправлено.';
}
function transition(){
 const current=entries.find(x=>x.id===selected);
 if(!current)return;
 switch(current.stage){
 case 'new':case 'waiting':
  current.stage='draft';current.events.push('Подготовлен учебный черновик. Не отправлен.');break;
 case 'draft':
  current.stage='approved';current.events.push('Человек одобрил черновик в демо. Отправки нет.');break;
 case 'approved':
  current.stage='acknowledged';current.events.push('Условный ответ клиента смоделирован.');break;
 case 'acknowledged':
  current.stage='resolved';current.events.push('Человек закрыл учебное обращение.');break;
 case 'resolved':
  current.stage='waiting';current.events.push('Обращение вновь открыто в демо.');break;
 }
 render();
}
resetData();
el.toggle.addEventListener('click',()=>{
 const opening=el.panel.hidden;
 el.panel.hidden=!opening;
 el.toggle.setAttribute('aria-expanded',String(opening));
 el.toggle.textContent=opening?'Свернуть учебную очередь':'Открыть учебную очередь обращений';
 if(opening){render();el.panel.scrollIntoView?.({block:'nearest',behavior:'auto'})}
});
filterButtons.forEach(btn=>btn.addEventListener('click',()=>{
 filter=btn.dataset.pulseInboxFilter;render();
}));
el.action.addEventListener('click',transition);
el.reset.addEventListener('click',()=>{resetData();render()});
el.close.addEventListener('click',()=>{
 el.panel.hidden=true;el.toggle.setAttribute('aria-expanded','false');
 el.toggle.textContent='Открыть учебную очередь обращений';el.toggle.focus();
});
el.dialog.addEventListener('close',()=>{
 el.panel.hidden=true;resetData();
 el.toggle.setAttribute('aria-expanded','false');
 el.toggle.textContent='Открыть учебную очередь обращений';
});
render();
})();
