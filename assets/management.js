/* SEYVEO · Management v1. Original local-only functionality.
   No external service connections and no user data uploads. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const connect=$('manageConnectionsDialog'),dataDialog=$('manageDataDialog'),roadmapDialog=$('manageRoadmapDialog');
if(!connect||!dataDialog||!roadmapDialog)return;
const roadmap=[
 {status:'Работает',name:'Уже в SEYVEO',items:[
   ['Black Velvet и темы','Главная сфера и оформление, автоматическая, тёмная и светлая темы.'],
   ['Дела и история','Демонстрационные поручения со статусами и историей; реальные внешние действия пока не выполняются.'],
   ['Заметки и данные','Локальные записи, черновики и экспорт копии.']
 ]},
 {status:'Пробный режим',name:'Проверяем',items:[
   ['Обращение по имени «SEYVEO»','Прототип в открытой PWA после согласия. Надёжную работу на iPhone и беззвучное ожидание ещё нужно проверить.']
 ]},
 {status:'В планах',name:'Следующие этапы',items:[
   ['Три направления SEYVEO','Start — для открытия бизнеса; Business — для действующей компании; Life / Life Light — для повседневной жизни. Один помощник и единый технологический фундамент. Названия рабочие.'],
   ['Переход между жизненными этапами','Постепенно переходить от Life к Start и Business и обратно, не теряя личные данные. Деловые архивы сохранять только с согласия.'],
   ['Настоящий интеллект','Подключить ИИ, который отвечает по контексту, отличает факты от предположений и адаптирует общение.'],
   ['Память управляющего','Предпочтения, личный и рабочий контекст, согласие и возможность контролировать сохранённое.'],
   ['Полноценный голос','Разговор, естественная речь и перебивание; системная активация — по возможностям платформы.'],
   ['Реальные подключения','Почта, календарь, сообщения, CRM и другие источники — с подтверждённой авторизацией и отзывом доступа.'],
   ['Автопилот и разрешения','Самостоятельно замечать события, готовить решения и выполнять только разрешённые шаги с журналом результатов.'],
   ['Мастерская','Создание персональных инструментов и расчётов из разговора с управляющим.'],
   ['Личная жизнь и новые этапы','Календарь, семья, дом, поездки и повседневные дела. Если человек перестаёт вести бизнес, личный помощник остаётся с ним.'],
   ['Семейные пространства','Общие события и поручения только с согласия участников. У каждого своя приватная информация.'],
   ['Знакомство без анкет','SEYVEO узнаёт потребности человека через разговор — личные, рабочие или смешанные.'],
   ['Универсальный бизнес','Поддержка разных отраслей, процессов и ролей без отдельных приложений для каждой сферы.'],
   ['Нативное приложение','Тесты на устройствах, системный тактильный отклик и подготовка публикации в магазинах приложений.']
 ]}
];
function drawRoadmap(){
 const body=$('manageRoadmapBody');body.replaceChildren();
 for(const group of roadmap){
  const section=document.createElement('section');section.className='manage-roadmap-group';
  const head=document.createElement('div');head.className='manage-roadmap-group-head';
  const title=document.createElement('h3');title.textContent=group.name;
  const badge=document.createElement('span');badge.textContent=group.status;
  head.append(title,badge);
  const list=document.createElement('div');list.className='manage-roadmap-list';
  for(const [name,description] of group.items){
   const item=document.createElement('article');item.className='manage-roadmap-item';
   const strong=document.createElement('strong');strong.textContent=name;
   const p=document.createElement('p');p.textContent=description;
   item.append(strong,p);list.append(item);
  }
  section.append(head,list);body.append(section);
 }
}

const KEYS=Object.freeze({
 app:'dm-signature-living-v2',
 previous:'dm-signature-living-v1',
 notes:'seyveo-notes-v1',
 draft:'seyveo-draft-v1'
});
function read(key){
 try{return localStorage.getItem(key)}catch{return null}
}
function parsed(raw,fallback){
 try{return raw===null?fallback:JSON.parse(raw)}catch{return fallback}
}
function snapshot(){
 const state=parsed(read(KEYS.app),{});
 const notes=parsed(read(KEYS.notes),[]);
 const oldState=parsed(read(KEYS.previous),null);
 const draft=read(KEYS.draft);
 return {
  product:'SEYVEO',
  exportedAt:new Date().toISOString(),
  source:'local browser storage on this device',
  state:state&&typeof state==='object'&&!Array.isArray(state)?state:{},
  oldState:oldState&&typeof oldState==='object'&&!Array.isArray(oldState)?oldState:null,
  notes:Array.isArray(notes)?notes:[],
  draft:typeof draft==='string'?draft:''
 };
}
function countOf(list){return Array.isArray(list)?list.length:0}
function drawData(){
 const record=snapshot(),list=$('manageDataSummary');
 list.replaceChildren();
 const parts=[
  ['Мои записи',String(countOf(record.notes))],
  ['Черновик',record.draft.trim()?'Сохранён':'Нет'],
  ['Поручения в истории',String(countOf(record.state.history))],
  ['Данные', 'На этом устройстве']
 ];
 for(const [label,value] of parts){
  const row=document.createElement('div');row.className='manage-data-item';
  const a=document.createElement('span');a.textContent=label;
  const b=document.createElement('strong');b.textContent=value;
  row.append(a,b);list.append(row);
 }
 $('manageExportStatus').textContent='';
}
function saveFile(){
 try{
  const info=snapshot();
  const blob=new Blob([JSON.stringify(info,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='seyveo-local-data-'+new Date().toISOString().slice(0,10)+'.json';
  a.style.display='none';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
  $('manageExportStatus').textContent='Копия подготовлена. Проверьте загрузки или файлы устройства.';
 }catch{
  $('manageExportStatus').textContent='Не удалось создать копию. Проверьте разрешения браузера.';
 }
}
$('openManageRoadmap').addEventListener('click',()=>{drawRoadmap();roadmapDialog.showModal()});
$('manageRoadmapClose').addEventListener('click',()=>roadmapDialog.close());
$('openManageConnections').addEventListener('click',()=>connect.showModal());
$('manageConnectionsClose').addEventListener('click',()=>connect.close());
$('openManageData').addEventListener('click',()=>{drawData();dataDialog.showModal()});
$('manageDataClose').addEventListener('click',()=>dataDialog.close());
$('manageExportData').addEventListener('click',saveFile);
for(const dialog of [connect,dataDialog,roadmapDialog]){
 dialog.addEventListener('click',event=>{
  if(event.target===dialog){dialog.close()}
 });
}
})();
