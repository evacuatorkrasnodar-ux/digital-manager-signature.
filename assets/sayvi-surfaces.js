/* SEYVEO · Sayvi Surfaces v2 — realistic test-drive without fake service actions — a living object opens a real destination.
 * Mail is a connection gateway until a provider is connected.
 * Documents use only user-selected files for this session; no upload/storage.
 * Health delegates to the existing local records, never fabricates readings. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const page=$('sayviSurfacePage'),subject=$('sayviSurfaceSubject'),
  title=$('sayviSurfaceTitle'),intro=$('sayviSurfaceIntro'),
  body=$('sayviSurfaceBody'),footer=$('sayviSurfaceFootnote'),
  back=$('sayviSurfaceBack'),symbol=$('sayviSurfaceSymbol');
if(!page||!subject||!title||!intro||!body||!back||!symbol)return;
const routes=Object.freeze({mail:'#sayvi-mail',contract:'#sayvi-documents',task:'#tasks',health:'#sayvi-health'});
const subjects=Object.freeze({
 mail:{label:'SEYVEO / ПОЧТА',title:'Почта',intro:'Письма и черновики внутри SEYVEO. Подключение ящика — отдельно.',symbol:'mail'},
 contract:{label:'ДОКУМЕНТЫ · SEYVEO',title:'Документы',intro:'Защищённый архив и работа с документами через чат Сэйви.',symbol:'contract'},
 health:{label:'ЗАБОТА',title:'Ваше здоровье',intro:'Ваши показатели и спокойная забота о себе.',symbol:'health'}
});
let fileUrl=null;
let returnDestination=null;
function updateBackDestination(){
 const label=returnDestination?.label||'Главная';
 const caption=back.querySelector('span:last-child');
 if(caption)caption.textContent=label;
 back.setAttribute('aria-label','Вернуться: '+label);
}
function rememberOrigin(context){
 if(context==='business')returnDestination={hash:'#tasks',label:'Пульт руководителя'};
 else if(location.hash==='#life')returnDestination={hash:'#life',label:'Мой мир'};
 else if(location.hash==='#manage')returnDestination={hash:'#manage',label:'Управление'};
 else if(location.hash==='#tasks')returnDestination={hash:'#tasks',label:'Дела'};
 else returnDestination=null;
 updateBackDestination();
}
const localOnly='Сведения хранятся только на вашем устройстве. Внешний ИИ здесь пока не подключён.';
function create(tag,cls,words){
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(words!==undefined)e.textContent=words;
 return e;
}
function intent(label,callback,principal=false){
 const b=create('button',principal?'sv-deep-intent sv-deep-intent--lead':'sv-deep-intent',label);
 b.type='button';b.addEventListener('click',callback);
 return b;
}
function paragraph(words,cls='sv-deep-copy'){return create('p',cls,words)}
function hint(words){return create('small','sv-deep-note',words)}
function shelf(){
 const section=create('section','sv-deep-content');
 return section;
}
function actions(...items){
 const row=create('div','sv-deep-actions');row.append(...items);return row;
}
function releaseFile(){
 if(fileUrl){URL.revokeObjectURL(fileUrl);fileUrl=null}
}
function setArt(kind){
 // The same hand-drawn art is used in the Home object, with no duplicate orb.
 const glyph={
  mail:'<rect x="11.5" y="23" width="73" height="52" rx="10"/><path d="M15 31 43.5 54a7 7 0 0 0 9 0L81 31"/><path d="m16 68 22-18m42 18L58 50"/>',
  contract:'<path d="M29 11h29l15 15v53c0 4-3 7-7 7H30c-4 0-7-3-7-7V18c0-4 3-7 6-7Z"/><path d="M58 12v15h15"/><path d="M35 43h25M35 53h22M35 63h12"/>',
  health:'<path d="M48 81 20.2 54.5C1.1 36.2 15 14.3 32.1 19.3 39 21.3 44 26.8 48 33c4-6.2 9-11.7 15.9-13.7 17.1-5 31 16.9 11.9 35.2Z"/><path d="M23 48h14l6-11 10 22 6-11h14"/>'
 };
 const s=document.createElementNS('http://www.w3.org/2000/svg','svg');
 s.setAttribute('viewBox','0 0 96 96');s.setAttribute('aria-hidden','true');
 s.setAttribute('focusable','false');s.classList.add('sv-deep-icon');s.innerHTML=glyph[kind]||glyph.contract;
 symbol.replaceChildren(s);
}
function openConnect(){
 // Reuse the common Settings > Connections route, with Mail preselected.
 if(window.SEYVEO_CONNECTION_PROMPTS?.open){
  window.SEYVEO_CONNECTION_PROMPTS.open('mail');return;
 }
 location.hash='#manage';
 const row=document.querySelector('#seyveoCleanManageMenu [data-clean-section="connections"]');
 if(row)row.click();
 else $('openManageConnections')?.click();
}
/* First-owner test drive. All examples are explicitly fictional.
 * The only persisted demo state is a small count/mute preference in
 * sessionStorage, never actual mail or document contents. */
const DEMO_KEY='seyveo-sayvi-testdrive-later-v2';
const demoScenes=Object.freeze({
 mail:{
  headline:'Письмо от клиента Андрея · пример',
  message:'«Здравствуйте! Подскажите, сколько будет стоить доставка?»',
  why:'Сэйви подготовила учебный ответ: «Здравствуйте, Андрей! Спасибо за обращение. Уточните, пожалуйста, адрес доставки, чтобы мы могли рассчитать стоимость». Настоящая почта не подключена.',
  done:'Черновик проверен — только в демонстрации. Письмо НЕ отправлено и НЕ доставлено.'
 },
 contract:{
  headline:'Договор требует внимания · пример',
  message:'Сэйви обратила внимание на условие, которое стоит проверить до подписания.',
  why:'В рабочем режиме я отмечу спорные места, покажу оригинал и попрошу вашего решения.',
  done:'Проверка показана на примере. Настоящий документ НЕ подписан и НЕ изменён.'
 },
 health:{
  headline:'Время для себя · пример',
  message:'Сэйви предлагает небольшую спокойную паузу.',
  why:'Это добровольное напоминание, а не медицинское заключение или анализ ваших показателей.',
  done:'Демонстрация завершена. Реальные показатели НЕ изменены.'
 }
});
function readDemoChoices(){
 try{
  const s=JSON.parse(sessionStorage.getItem(DEMO_KEY)||'{}');
  return s&&typeof s==='object'&&!Array.isArray(s)?s:{};
 }catch{return {}}
}
function demoChoice(kind,patch){
 const all=readDemoChoices();
 all[kind]={...all[kind],...patch};
 try{sessionStorage.setItem(DEMO_KEY,JSON.stringify(all))}catch{}
 return all[kind];
}
function demoScenario(kind){
 const cfg=demoScenes[kind];if(!cfg)return;
 const section=create('section','sv-deep-demo');
 section.dataset.demoSubject=kind;
 const status=create('p','sv-deep-demo-status');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 section.append(create('small','sv-deep-demo-label','ТРЕНИРОВОЧНАЯ СЦЕНА · НЕ РЕАЛЬНОЕ СОБЫТИЕ'));
 section.append(create('h2','sv-deep-demo-title',cfg.headline));
 section.append(paragraph(cfg.message,'sv-deep-demo-message'));
 const row=actions(),details=paragraph(cfg.why,'sv-deep-expand'),choice=create('div','sv-deep-demo-choice');
 details.hidden=true;choice.hidden=true;
 const state=readDemoChoices()[kind]||{};
 if(state.muted){
  status.textContent='Этот тренировочный сюжет скрыт по вашему выбору.';
  const restore=intent('Вернуть пример',()=>{
   demoChoice(kind,{muted:false,count:0});
   render(kind);
  });
  section.append(actions(restore),status);
  body.append(section);return;
 }
 let completed=false;
 const explain=intent('Подробнее',()=>{
  details.hidden=false;
  explain.hidden=true;
  execute.hidden=false;
  later.hidden=false;
  status.textContent='Сэйви: я показала главное. Решение за вами.';
 });
 const execute=intent('Исполнить',()=>{
  if(completed)return;
  completed=true;
  execute.textContent='✓ Готово · демо';
  execute.classList.add('sv-deep-intent--done');
  execute.disabled=true;
  // Only the completion marker turns soft green; the report stays quiet ink.
  status.replaceChildren(
   create('span','sv-deep-success-mark','✓ Готово · демо. '),
   create('span','sv-deep-success-copy',cfg.done)
  );
  status.classList.add('sv-deep-demo-success');
  later.hidden=true;explain.hidden=true;
  choice.hidden=true;
 },true);
 const later=intent('Позже',()=>{
  const count=Math.max(0,Math.min(20,Number(readDemoChoices()[kind]?.count)||0))+1;
  demoChoice(kind,{count});
  status.textContent=count<3?'Сэйви: хорошо, вернёмся к этому примеру, когда вы захотите.':'Сэйви: мы уже несколько раз откладывали это. Может, больше не напоминать?';
  status.classList.remove('sv-deep-demo-success');
  choice.replaceChildren();
  if(count>=3){
   choice.hidden=false;
   const forget=intent('Больше не предлагать',()=>{
    demoChoice(kind,{count:0,muted:true});
    status.textContent='Сэйви: хорошо, этот пример больше не предлагаю.';
    choice.hidden=true;later.hidden=true;execute.hidden=true;explain.hidden=true;
   });
   const remind=intent('Оставить на потом',()=>{
    demoChoice(kind,{count:0});
    status.textContent='Сэйви: оставлю этот пример доступным здесь. Автоматическое напоминание не настроено.';
    choice.hidden=true;
   });
   choice.append(forget,remind);
  }
 });
 execute.hidden=true;
 later.hidden=true;
 row.append(explain,execute,later);
 section.append(row,details,choice,status);
 section.append(hint('Это режим проверки будущего поведения Сэйви. Ни писем, ни подписей, ни медицинских действий он не выполняет.'));
 body.append(section);
}
/* SEYVEO Mail — iPhone-first, private-by-default working prototype.
 * Real delivery and retrieval are disabled without an authorized provider.
 * Example messages are clearly marked and never saved or sent externally. */
let mailFolder='overview',mailEditorOpen=false,mailEditingId=null,mailCurrent=null;
let mailEditorReturnId=null,mailEditorExitHandler=null;
let mailSearchOpen=false;
let mailGuardExitHandler=null;
let mailContactsExitHandler=null;
let mailGuardListenerAbort=null;
let mailScope='all',mailComposeScope=null;
// Mail drafts are local to this browser tab session. No external delivery.
const MAIL_SESSION_DRAFTS_KEY='seyveo-mail-session-drafts-v1';
function readMailSessionDrafts(){
 try{
  const data=JSON.parse(sessionStorage.getItem(MAIL_SESSION_DRAFTS_KEY)||'[]');
  if(!Array.isArray(data))return [];
  return data.filter(d=>d&&typeof d==='object'&&typeof d.id==='string')
   .slice(0,60).map(d=>({
    id:d.id.slice(0,100),account:['personal','business'].includes(d.account)?d.account:'',
    to:String(d.to||'').slice(0,254),subject:String(d.subject||'').slice(0,240),
    body:String(d.body||'').slice(0,10000),
    attachments:Array.isArray(d.attachments)?d.attachments.filter(a=>a&&typeof a.id==='string'&&typeof a.name==='string')
     .slice(0,5).map(a=>({id:a.id.slice(0,90),name:a.name.slice(0,150),
      size:Math.max(0,Number(a.size)||0),type:String(a.type||'').slice(0,110)})):[]
   }));
 }catch{return []}
}
let mailDrafts=readMailSessionDrafts(),mailSearch='',mailShowExamples=true;
function persistMailDrafts(){
 try{
  if(mailDrafts.length)sessionStorage.setItem(MAIL_SESSION_DRAFTS_KEY,JSON.stringify(mailDrafts.slice(0,60)));
  else sessionStorage.removeItem(MAIL_SESSION_DRAFTS_KEY);
 }catch{} // The live editor remains usable if storage is unavailable.
}
/* Attachments are real user-selected blobs, stored only in this browser.
   IndexedDB keeps them with the local draft; nothing is transmitted. */
const MAIL_ATTACHMENT_DB='seyveo-mail-attachments-v1';
let mailAttachmentDbPromise=null;
const mailOpenFiles=new Map();
function mailAttachmentKey(draftId,fileId){return draftId+'::'+fileId}
function mailAttachmentDb(){
 if(!mailAttachmentDbPromise)mailAttachmentDbPromise=new Promise(resolve=>{
  if(typeof indexedDB==='undefined'){resolve(null);return}
  let request;
  try{request=indexedDB.open(MAIL_ATTACHMENT_DB,1)}catch{resolve(null);return}
  request.onupgradeneeded=()=>{
   if(!request.result.objectStoreNames.contains('files'))request.result.createObjectStore('files');
  };
  request.onsuccess=()=>{
   const db=request.result;
   // Remove abandoned local file blobs after one week of inactivity.
   try{
    const tx=db.transaction('files','readwrite'),store=tx.objectStore('files');
    const cursor=store.openCursor();
    cursor.onsuccess=()=>{
     const current=cursor.result;if(!current)return;
     if(Date.now()-Number(current.value?.savedAt||0)>7*86400000)current.delete();
     current.continue();
    };
   }catch{}
   resolve(db);
  };
  request.onerror=()=>resolve(null);
  request.onblocked=()=>resolve(null);
 });
 return mailAttachmentDbPromise;
}
async function saveMailAttachment(draftId,fileId,file){
 const key=mailAttachmentKey(draftId,fileId);
 const db=await mailAttachmentDb();if(!db)return false;
 return new Promise(resolve=>{
  try{
   const tx=db.transaction('files','readwrite');
   tx.objectStore('files').put({blob:file,savedAt:Date.now()},key);
   tx.oncomplete=()=>{mailOpenFiles.set(key,file);resolve(true)};
   tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false);
  }catch{resolve(false)}
 });
}
async function readMailAttachment(draftId,fileId){
 const key=mailAttachmentKey(draftId,fileId);
 if(mailOpenFiles.has(key))return mailOpenFiles.get(key);
 const db=await mailAttachmentDb();if(!db)return null;
 return new Promise(resolve=>{
  try{
   const req=db.transaction('files','readonly').objectStore('files').get(key);
   req.onsuccess=()=>{
    const file=req.result?.blob||null;
    if(file)mailOpenFiles.set(key,file);
    resolve(file);
   };
   req.onerror=()=>resolve(null);
  }catch{resolve(null)}
 });
}
async function deleteMailAttachment(draftId,fileId){
 const key=mailAttachmentKey(draftId,fileId);
 mailOpenFiles.delete(key);
 const db=await mailAttachmentDb();if(!db)return;
 try{
  db.transaction('files','readwrite').objectStore('files').delete(key);
 }catch{}
}
const mailAccountName=account=>account==='business'?'Рабочая':account==='personal'?'Личная':'Не выбрана';
const mailVisible=account=>mailScope==='all'||account===mailScope;
const mailExamples=[
 {account:'business',id:'example-andrey',initial:'А',from:'Андрей · клиент',subject:'Стоимость доставки',preview:'Здравствуйте! Подскажите, сколько будет стоить доставка?',body:'Здравствуйте!\n\nПодскажите, пожалуйста, сколько будет стоить доставка и какие сроки возможны?\n\nСпасибо!\nАндрей',when:'10:24',unread:true,starred:false,attachment:false,archived:false,trashed:false},
 {account:'business',id:'example-project',initial:'П',from:'Проектный отдел',subject:'Согласование плана работ',preview:'Подготовили обновлённый план. Посмотрите, пожалуйста.',body:'Добрый день!\n\nПодготовили обновлённый план работ. Будем рады вашим замечаниям.\n\nС уважением,\nПроектный отдел',when:'09:17',unread:true,starred:false,attachment:false,archived:false,trashed:false},
 {account:'business',id:'example-finance',initial:'Ф',from:'Финансовый отдел',subject:'Отчёт за месяц',preview:'Пример отчёта и сводных показателей за месяц.',body:'Добрый день!\n\nНаправляем пример ежемесячного отчёта. В рабочей версии здесь можно будет просматривать настоящие вложения.\n\nФинансовый отдел',when:'Вчера',unread:false,starred:false,attachment:true,archived:false,trashed:false},
 {account:'business',id:'example-team',initial:'Р',from:'Руководство',subject:'Совещание в пятницу',preview:'Подтвердите, пожалуйста, удобное время встречи.',body:'Коллеги, добрый день!\n\nПредлагаем провести совещание в пятницу. Подтвердите удобное время.\n\nСпасибо!',when:'Вчера',unread:false,starred:true,attachment:false,archived:false,trashed:false},
 {account:'business',id:'example-delivery',initial:'С',from:'Снабжение',subject:'Поставка оборудования',preview:'Условия поставки согласованы. Подробности внутри.',body:'Здравствуйте!\n\nСроки и основные условия поставки оборудования согласованы.\n\nС уважением,\nОтдел снабжения',when:'29 окт',unread:false,starred:false,attachment:false,archived:false,trashed:false}
,
 {account:'personal',id:'example-family',initial:'М',from:'Мария',subject:'Встреча на выходных',preview:'В субботу в 16:00 всё в силе?',body:'Привет!\n\nВстреча в субботу в 16:00 в силе? Напиши, когда будет удобно.\n\nОбнимаю!',when:'11:32',unread:true,starred:false,attachment:false,archived:false,trashed:false},
 {account:'personal',id:'example-tickets',initial:'Б',from:'Билеты · пример',subject:'Подтверждение бронирования',preview:'Ваше бронирование подтверждено — учебное письмо.',body:'Здравствуйте!\n\nЭто демонстрационное подтверждение бронирования. Настоящих билетов здесь нет.\n\nХорошего дня!',when:'Вчера',unread:false,starred:true,attachment:false,archived:false,trashed:false},
 {account:'personal',id:'example-family-photo',initial:'А',from:'Алексей',subject:'Фотографии из поездки',preview:'Собрал фотографии и хотел поделиться.',body:'Привет!\n\nСобрал фотографии из нашей поездки. Вложения в этой демонстрации отсутствуют.\n\nДо встречи!',when:'28 окт',unread:false,starred:false,attachment:true,archived:false,trashed:false}
];
// Local sample-mail operations only; never assert provider-side delivery,
// deletion, spam classification or sender blocking without mail authorization.

mailExamples.push(
 {account:'business',id:'example-promo',initial:'Р',from:'Рассылка · пример',subject:'Предложения для бизнеса',preview:'Новая подборка предложений. Учебная рассылка.',body:'Это учебная рекламная рассылка без активных ссылок и вложений.',when:'Вчера',unread:true,starred:false,attachment:false,archived:false,trashed:false},
 {account:'personal',id:'example-suspicious',initial:'?',from:'Неизвестный · пример',subject:'Проверьте учётную запись',preview:'Письмо с неизвестного адреса. Не переходите по ссылкам.',body:'Это учебный пример подозрительного письма. Никаких ссылок или реальных проверок здесь нет.',when:'Сегодня',unread:true,starred:false,attachment:false,archived:false,trashed:false}
);
const MAIL_SAMPLE_ACTIONS_KEY='seyveo-mail-sample-actions-v1';
const sampleSenderKey=item=>item.account+'|'+item.from.toLocaleLowerCase('ru').trim();
let sampleBlockedSenders=new Set();
let mailNotice='';
function restoreSampleActions(){
 try{
  const raw=JSON.parse(sessionStorage.getItem(MAIL_SAMPLE_ACTIONS_KEY)||'{}');
  if(!raw||typeof raw!=='object')return;
  const allowed=new Set(mailExamples.map(sampleSenderKey));
  if(Array.isArray(raw.blocked))sampleBlockedSenders=new Set(raw.blocked.filter(k=>typeof k==='string'&&allowed.has(k)));
  for(const m of mailExamples){
   const s=raw.items?.[m.id];
   m.spam=s?.spam===true;m.removed=s?.removed===true;
   if(!s||typeof s!=='object')continue;
   for(const flag of ['archived','trashed','starred']){
    if(typeof s[flag]==='boolean')m[flag]=s[flag];
   }
   if(typeof s.unread==='boolean')m.unread=s.unread;
  }
 }catch{}
}
restoreSampleActions();
function sampleBlocked(item){return sampleBlockedSenders.has(sampleSenderKey(item))}
function saveSampleActions(){
 try{
  const items={};
  for(const m of mailExamples){
   items[m.id]={spam:!!m.spam,removed:!!m.removed,archived:!!m.archived,
    trashed:!!m.trashed,starred:!!m.starred,unread:!!m.unread};
  }
  sessionStorage.setItem(MAIL_SAMPLE_ACTIONS_KEY,JSON.stringify({
   items,blocked:[...sampleBlockedSenders]
  }));
 }catch{} // No account, network or secret is touched.
}
const mailIcons=Object.freeze({
 inbox:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
 sent:'<path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/>',
 drafts:'<path d="M7 3h8l5 5v13H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/><path d="M14 3v6h6M8 14h8M8 18h6"/>',
 starred:'<path d="m12 2 3 6.4 7 .9-5.1 5 .9 7-5.8-3.2-5.8 3.2.9-7-5.1-5 7-.9L12 2Z"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 10v7m4-7v7"/>',
 spam:'<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8Z"/><path d="M12 7v7m0 3v.1"/>',
 shield:'<path d="M12 2 20 6v5c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V6Z"/><path d="m9 12 2 2 4-4"/>',
 contacts:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/>',
 restore:'<path d="M9 4 4 9l5 5"/><path d="M4 9h10a6 6 0 1 1-5.5 8.3"/>',
 more:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
 archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v12h14V9M10 14h4"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 pencil:'<path d="M12 20h9M3 17l12-12 4 4L7 21H3v-4ZM14 6l4 4"/>',
 back:'<path d="m15 5-7 7 7 7"/>',
 reply:'<path d="m9 7-5 5 5 5"/><path d="M4 12h11a5 5 0 0 1 5 5v2"/>',
 paperclip:'<path d="m8 12 6-6a4 4 0 0 1 6 6l-8 8a6 6 0 0 1-9-9l8-8"/>',
 settings:'<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
 save:'<path d="M5 3h12l4 4v14H3V3h2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
 send:'<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>'
});
function mailIcon(name){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
 svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');
 svg.setAttribute('stroke-linejoin','round');
 svg.innerHTML=mailIcons[name]||mailIcons.inbox;return svg;
}

/* SEYVEO Mail · local gate policy preview.
   Never reject, classify or inspect real provider messages without an authorized adapter.
   Trusted addresses are user preferences, not proof of sender identity. */
const MAIL_GATE_KEY='seyveo-mail-gate-v1';
const MAIL_GATE_MODES=Object.freeze({
 smart:{title:'Умная защита',hint:'Подозрительные примеры — на проверку, рассылки — отдельно.'},
 contacts:{title:'Только свои',hint:'Во входящих — знакомые и разрешённые адреса. Остальные ждут решения.'},
 strict:{title:'Строгий допуск',hint:'Во входящих только явно разрешённые адреса.'}
});
const MAIL_SAMPLE_ADDRESSES=Object.freeze({
 'example-andrey':'andrey@example.com',
 'example-project':'projects@example.com',
 'example-finance':'finance@example.com',
 'example-team':'office@example.com',
 'example-delivery':'supply@example.com',
 'example-family':'maria@example.com',
 'example-tickets':'tickets@example.com',
 'example-family-photo':'alex@example.com',
 'example-promo':'offers@example.com',
 'example-suspicious':'notice@example.com'
});
const MAIL_SAMPLE_CONTACTS=new Set(['example-family','example-team','example-project']);
const MAIL_SAMPLE_PROMOTIONS=new Set(['example-promo']);
const MAIL_SAMPLE_SUSPICIOUS=new Set(['example-suspicious']);
const emptyMailGate=()=>({mode:'smart',trusted:[]});
function validMailGateAddress(value){
 const address=String(value||'').trim().toLowerCase();
 if(address.length>254)return '';
 const email=/^[^\s@]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(address);
 const domain=/^@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(address);
 return email||domain?address:'';
}
function readMailGate(){
 const defaults={personal:emptyMailGate(),business:emptyMailGate()};
 try{
  const value=JSON.parse(localStorage.getItem(MAIL_GATE_KEY)||'{}');
  for(const account of ['personal','business']){
   const source=value?.[account];
   if(source && Object.hasOwn(MAIL_GATE_MODES,source.mode))defaults[account].mode=source.mode;
   if(Array.isArray(source?.trusted))defaults[account].trusted=[...new Set(source.trusted.map(validMailGateAddress).filter(Boolean))].slice(0,60);
  }
 }catch{}
 return defaults;
}
let mailGate=readMailGate();
function saveMailGate(){
 try{localStorage.setItem(MAIL_GATE_KEY,JSON.stringify(mailGate))}catch{}
}
function sampleMailAddress(item){return MAIL_SAMPLE_ADDRESSES[item?.id]||''}
function gateTrusted(account,address){
 if(!address)return false;
 const allow=mailGate[account].trusted;
 const at=address.lastIndexOf('@');
 return allow.includes(address)||(at>=0&&allow.includes(address.slice(at)));
}
function addGateTrusted(account,address){
 const verified=validMailGateAddress(address);
 if(!verified||!mailGate[account]||mailGate[account].trusted.length>=60)return false;
 if(!gateTrusted(account,verified))mailGate[account].trusted.push(verified);
 saveMailGate();return true;
}
function gateCategory(item){
 if(item.spam||sampleBlocked(item))return 'spam';
 const trusted=gateTrusted(item.account,sampleMailAddress(item));
 if(MAIL_SAMPLE_SUSPICIOUS.has(item.id)&&!trusted)return 'review';
 if(MAIL_SAMPLE_PROMOTIONS.has(item.id)&&!trusted)return 'promotions';
 const settings=mailGate[item.account];
 if(!settings||settings.mode==='smart')return 'inbox';
 if(gateTrusted(item.account,sampleMailAddress(item)))return 'inbox';
 if(settings.mode==='contacts'&&MAIL_SAMPLE_CONTACTS.has(item.id))return 'inbox';
 return 'review';
}

function mailView(){
 mailGuardListenerAbort?.abort();
 mailGuardListenerAbort=new AbortController();
 mailEditorExitHandler=null;
 mailContactsExitHandler=null;
 const section=shelf();section.classList.add('sv-mail-workspace');
 const top=create('div','sv-mail-top-actions');
 const topButtons=create('div','sv-mail-top-buttons');
 const searchToggle=create('button','sv-mail-icon-button sv-mail-search-toggle');searchToggle.type='button';
 searchToggle.setAttribute('aria-label','Поиск по почте');searchToggle.append(mailIcon('search'));
 searchToggle.addEventListener('click',()=>{mailSearchOpen=!mailSearchOpen;paint();if(mailSearchOpen)searchInput.focus()});
 // An account connection is a primary mailbox action, NEVER a Search filter.
 // The prototype points to the existing Connections information page.
 const connect=create('button','sv-mail-connect');connect.type='button';
 connect.setAttribute('aria-label','Подключить почту. Открыть раздел подключений');
 const connectGlyph=create('span','sv-mail-connect-glyph');connectGlyph.setAttribute('aria-hidden','true');
 connectGlyph.append(mailIcon('inbox'));
 const connectLabel=create('span','sv-mail-connect-label','Подключить почту');
 const connectChevron=create('span','sv-mail-connect-chevron');
 connectChevron.setAttribute('aria-hidden','true');
 // Match the navigation-chevron geometry; no font-dependent "›" baseline.
 const connectArrow=document.createElementNS('http://www.w3.org/2000/svg','svg');
 connectArrow.setAttribute('viewBox','0 0 24 24');
 connectArrow.setAttribute('focusable','false');
 connectArrow.setAttribute('aria-hidden','true');
 connectArrow.innerHTML='<path d="m9 5 7 7-7 7"/>';
 connectChevron.append(connectArrow);
 connect.append(connectGlyph,connectLabel,connectChevron);
 connect.addEventListener('click',openConnect);
 // The reusable component replaces the temporary one-line design.
 // It hides only when a real provider reports verified authorization.
 window.SEYVEO_CONNECTION_PROMPTS?.register(connect,'mail',{
  scope:()=>mailScope,
  addClick:false
 });
 const compose=create('button','sv-mail-icon-button sv-mail-compose');compose.type='button';
 compose.setAttribute('aria-label','Написать письмо');compose.append(mailIcon('pencil'));
 compose.addEventListener('click',()=>openEditor());
 // Shield opens the compact protection popover beside Compose; Search remains right-aligned.
 // Connection prompt stays below the Personal / Work account switch.
 topButtons.append(compose,searchToggle);
 const introCopy=create('div','sv-mail-introduction-text');
 introCopy.append(create('h2','sv-mail-introduction-title','Почта'));
 // Reuse the original navigation button inside the visible Mail titlebar.
 // The legacy .sv-deep-top is hidden for Mail; leaving Back outside it
 // made navigation disappear or float independently of the title.
 top.append(back,introCopy,topButtons);
 // The existing shared Back button inherits conflicting late styles on iPhone.
 // Pin the approved matte graphite face only while it belongs to Mail.
 back.style.setProperty('background','#38383A','important');
 back.style.setProperty('background-image','none','important');
 back.style.setProperty('border-radius','50%','important');
 back.style.setProperty('box-shadow','none','important');
 back.style.setProperty('color','#EEF2F4','important');
 const searchLabel=create('div','sv-mail-search');searchLabel.id='svMailQuickSearch';
 searchLabel.append(mailIcon('search'));
 const searchInput=create('input','sv-mail-search-input');
 searchInput.type='search';searchInput.placeholder='Поиск по письмам';
 searchInput.setAttribute('aria-label','Поиск по письмам и черновикам');
 searchInput.autocomplete='off';searchInput.value=mailSearch;
 searchInput.addEventListener('input',()=>{
  mailBulkSelecting=false;selectedMailIds.clear();mailDraftSelecting=false;selectedDraftIds.clear();
  mailSearch=searchInput.value.trim().toLocaleLowerCase('ru');paintList();
 });
 searchLabel.append(searchInput);
 searchInput.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   mailSearchOpen=false;mailSearch='';searchInput.value='';paint();searchToggle.focus();
  }
 });
 searchLabel.addEventListener('click',event=>event.stopPropagation());
 searchLabel.setAttribute('role','search');
 const scopeNav=create('nav','sv-mail-accounts');scopeNav.setAttribute('aria-label','Выбор почты');
 const nav=create('nav','sv-mail-toolbar');nav.setAttribute('aria-label','Папки почты');
 const extraNav=create('div','sv-mail-extra-folders');
 const info=create('div','sv-mail-info');info.setAttribute('role','status');info.setAttribute('aria-live','polite');
 const content=create('div','sv-mail-list');
 // Search lives in its own row between the titlebar and account switch.
 // It pushes content down instead of obscuring the selected mail scope.


 const guardTrigger=create('button','sv-mail-icon-button sv-mail-shield-toggle');guardTrigger.type='button';
 guardTrigger.append(mailIcon('shield'));
 guardTrigger.setAttribute('aria-label','Защита почты · Умный допуск');
 guardTrigger.setAttribute('aria-haspopup','true');
 guardTrigger.setAttribute('aria-expanded','false');
 guardTrigger.setAttribute('aria-controls','svMailProtectionMenu');
 // Compose, Protection, Search: three identical, centered header actions.
 topButtons.replaceChildren(compose,guardTrigger,searchToggle);
 const guardPanel=create('section','sv-mail-gate-panel');guardPanel.hidden=true;
 guardPanel.id='svMailProtectionMenu';
 guardPanel.setAttribute('aria-label','Умный допуск · защита почты');
 let guardOpen=false,guardAccount='personal';
 const closeGate=()=>{if(!guardOpen)return;guardOpen=false;renderGate()};
 mailGuardExitHandler=()=>{if(!guardOpen)return false;closeGate();return true};
 guardTrigger.addEventListener('click',event=>{
  event.stopPropagation();
  guardAccount=mailScope==='all'?guardAccount:mailScope;
  guardOpen=!guardOpen;renderGate();
 });
 // Close like native iOS popovers, without covering the Inbox with a modal.
 document.addEventListener('pointerdown',event=>{
  if(!guardOpen||guardPanel.contains(event.target)||guardTrigger.contains(event.target))return;
  closeGate();
 },{signal:mailGuardListenerAbort.signal});
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&guardOpen){event.preventDefault();closeGate();guardTrigger.focus()}
 },{signal:mailGuardListenerAbort.signal});
 function renderGate(){
  const account=guardAccount;
  guardTrigger.setAttribute('aria-expanded',String(guardOpen));
  guardBackdrop.hidden=!guardOpen||mailEditorOpen||!!mailCurrent;
  guardPanel.hidden=!guardOpen||mailEditorOpen||!!mailCurrent;
  guardPanel.replaceChildren();
  if(!guardOpen)return;
  const title=create('div','sv-mail-gate-menu-heading');
  title.append(create('strong','','Защита почты'));
  guardPanel.append(title);
  const chooser=create('div','sv-mail-gate-accounts');
  for(const [key,label] of [['personal','Личная'],['business','Рабочая']]){
   const button=create('button','sv-mail-gate-account',label);
   button.type='button';button.setAttribute('aria-pressed',String(account===key));
   button.addEventListener('click',()=>{guardAccount=key;renderGate()});
   chooser.append(button);
  }
  guardPanel.append(chooser);
  const modes=create('div','sv-mail-gate-modes');modes.setAttribute('role','group');
  modes.setAttribute('aria-label','Режим защиты '+(account==='business'?'рабочей':'личной')+' почты');
  const hints={smart:'Сэйви сортирует письма',contacts:'Контакты и доверенные',strict:'Только разрешённые'};
  for(const [key,entry] of Object.entries(MAIL_GATE_MODES)){
   const button=create('button','sv-mail-gate-mode');button.type='button';
   button.setAttribute('aria-pressed',String(mailGate[account].mode===key));
   const marker=create('span','sv-mail-gate-radio');
   const body=create('span','sv-mail-gate-mode-body');
   body.append(create('strong','',entry.title));
   if(mailGate[account].mode===key)body.append(create('small','',hints[key]));
   button.append(marker,body);
   button.addEventListener('click',()=>{
    mailGate[account].mode=key;saveMailGate();
    // Preserve this menu while the mailbox counts are recalculated.
    renderGate();refreshMailGateView();
   });
   modes.append(button);
  }
  guardPanel.append(modes);
  const trustedDetails=create('details','sv-mail-gate-trusted-details');
  trustedDetails.append(create('summary','','Доверенные адреса · '+mailGate[account].trusted.length));
  const form=create('form','sv-mail-gate-form');
  const input=create('input','');input.type='text';input.required=true;input.maxLength=254;
  input.autocapitalize='off';input.autocomplete='off';input.spellcheck=false;
  input.placeholder='name@site.ru или @site.ru';
  input.setAttribute('aria-label','Доверенный адрес или домен');
  const add=create('button','','Добавить');add.type='submit';
  form.append(input,add);
  const status=create('small','sv-mail-gate-status');status.setAttribute('role','status');
  const trusted=create('div','sv-mail-gate-trusted');
  function paintTrusted(){
   trusted.replaceChildren();
   for(const address of mailGate[account].trusted){
    const chip=create('span','sv-mail-gate-chip');
    chip.append(create('span','',address));
    const remove=create('button','','×');remove.type='button';
    remove.setAttribute('aria-label','Убрать из доверенных: '+address);
    remove.addEventListener('click',()=>{
     mailGate[account].trusted=mailGate[account].trusted.filter(v=>v!==address);
     saveMailGate();paintTrusted();refreshMailGateView();
    });
    chip.append(remove);trusted.append(chip);
   }
   trustedDetails.querySelector('summary').textContent='Доверенные адреса · '+mailGate[account].trusted.length;
  }
  form.addEventListener('submit',event=>{
   event.preventDefault();
   if(!addGateTrusted(account,input.value)){status.textContent='Проверьте адрес или лимит 60 записей.';return}
   input.value='';status.textContent='Добавлено в доверенные';
   paintTrusted();refreshMailGateView();
  });
  trustedDetails.append(form,status,trusted);
  paintTrusted();guardPanel.append(trustedDetails);
  // A single entry in Shield keeps the title bar at the approved three icons.
  const contactsEntry=create('button','sv-mail-gate-menu-contacts');
  contactsEntry.type='button';
  contactsEntry.append(mailIcon('contacts'),create('span','','Умные контакты'),mailIcon('back'));
  // Flip only this navigation glyph, not the approved global Back design.
  contactsEntry.lastChild.style.transform='rotate(180deg)';
  contactsEntry.addEventListener('click',()=>{
   guardOpen=false;
   smartContacts?.open(account);
   paint();
  });
  guardPanel.append(contactsEntry);
  const pending=folderCount('review');
  if(pending&&mailShowExamples){
   const review=create('button','sv-mail-gate-menu-review');
   review.type='button';review.append(mailIcon('shield'),create('span','','На проверке · '+pending));
   review.addEventListener('click',()=>selectFolder('review'));
   guardPanel.append(review);
  }
  guardPanel.append(create('small','sv-mail-gate-caution','Пока на примерах. Реальная защита — после подключения почты.'));
 }
 function refreshMailGateView(){
  if(mailEditorOpen||mailCurrent)return;
  // Refresh counts and lists without re-creating the popover or its focused inputs.
  for(const control of nav.querySelectorAll('[data-mail-folder]')){
   const count=folderCount(control.dataset.mailFolder);
   const old=control.querySelector('.sv-mail-folder-count');
   if(old)old.remove();
   if(count)control.append(create('small','sv-mail-folder-count',String(count)));
  }
  paintList();
 }
 top.append(guardPanel);
 const contactsInvite=create('button','sv-mail-contacts-invite');
 contactsInvite.type='button';contactsInvite.hidden=true;
 contactsInvite.append(mailIcon('contacts'));
 const inviteText=create('span','sv-mail-contacts-invite-text');
 inviteText.append(create('strong','','Умные контакты'),create('small','','Настройте адресную книгу с помощью Сэйви'));
 contactsInvite.append(inviteText,mailIcon('back'));
 contactsInvite.lastChild.style.transform='rotate(180deg)';
 // Contacts onboarding is optional and displayed only after VERIFIED mail connection.
 function inviteScope(){
  const allowed=mailScope==='all'?['personal','business']:[mailScope];
  return allowed.find(scope=>
   smartContacts?.isMailConnected(scope)&&!smartContacts?.hasSaved(scope))||null;
 }
 contactsInvite.addEventListener('click',()=>{
  const scope=inviteScope();
  if(!scope)return;
  guardOpen=false;smartContacts?.open(scope);paint();
 });
 const guardBackdrop=create('button','sv-mail-gate-backdrop');
 guardBackdrop.type='button';guardBackdrop.hidden=true;
 guardBackdrop.setAttribute('aria-label','Закрыть меню защиты');
 guardBackdrop.addEventListener('click',closeGate);
 section.append(guardBackdrop,top,searchLabel,scopeNav,connect,contactsInvite,nav,extraNav,info,content);
 body.append(section);
 const smartContacts=window.SEYVEO_SMART_CONTACTS?.mount({
  host:section,
  onConnect:openConnect,
  onBack:()=>{smartContacts.close();paint()},
  onSaved:()=>{const scope=inviteScope();contactsInvite.hidden=!scope; }
 });
 mailContactsExitHandler=()=>{
  if(!smartContacts?.isOpen())return false;
  smartContacts.close();paint();return true;
 };
 window.addEventListener('seyveo:verified-connection-changed',()=>{
  smartContacts?.refresh();paint();
 },{signal:mailGuardListenerAbort.signal});
 const tabs=[['inbox','Входящие'],['sent','Отправленные'],['drafts','Черновики'],['starred','Важные'],['archive','Архив'],['review','На проверке'],['promotions','Рассылки'],['spam','Спам'],['trash','Корзина']];
 function folderCount(key){
  if(key==='drafts')return mailDrafts.filter(d=>mailVisible(d.account)).length;
  if(key==='inbox'&&mailShowExamples)return mailExamples.filter(m=>
   mailVisible(m.account)&&!m.trashed&&!m.archived&&!m.removed&&gateCategory(m)==='inbox'&&m.unread).length;
  if((key==='review'||key==='promotions')&&mailShowExamples)return mailExamples.filter(m=>
   mailVisible(m.account)&&!m.trashed&&!m.archived&&!m.removed&&gateCategory(m)===key).length;
  if(key==='spam')return mailExamples.filter(m=>
   mailVisible(m.account)&&!m.trashed&&!m.removed&&(m.spam||sampleBlocked(m))).length;
  return 0;
 }
 function openEditor(id=null,reply=null){
  mailDraftSelecting=false;selectedDraftIds.clear();
  mailBulkSelecting=false;selectedMailIds.clear();
  guardOpen=false;
  mailEditorReturnId=reply?.id||mailCurrent||null;
  mailEditingId=id;mailEditorOpen=true;mailCurrent=null;
  mailComposeScope=reply?.account||(id?mailDrafts.find(d=>d.id===id)?.account:null)||(mailScope==='all'?null:mailScope);
  if(reply)mailEditingId=null;
  paint();
  if(reply){
   const subjectField=content.querySelector('[data-mail-field="subject"]');
   if(subjectField)subjectField.value='Re: '+reply.subject;
   info.textContent='Черновик ответа на учебный пример — не отправляется.';
  }
  // Generated replies should open as a readable draft, without forcing the
  // iOS keyboard over the suggested text and bottom actions.
  // A real recipient address is not present in example mail, so leave it blank.
  if(!reply)content.querySelector('[data-mail-field="to"]')?.focus();
 }
 function selectFolder(folder){
  mailDraftSelecting=false;selectedDraftIds.clear();
  mailBulkSelecting=false;selectedMailIds.clear();
  guardOpen=false;
  mailNotice='';mailFolder=folder;mailCurrent=null;mailEditorOpen=false;mailEditingId=null;paint();
 }
 function selectScope(account){
  if(!['all','personal','business'].includes(account)||account===mailScope)return;
  guardOpen=false;
  mailDraftSelecting=false;selectedDraftIds.clear();
  mailBulkSelecting=false;selectedMailIds.clear();
  mailScope=account;mailCurrent=null;mailEditorOpen=false;mailEditingId=null;
  mailNotice='';mailSearch='';searchInput.value='';paint();
 }
 function editDraft(id){
  if(!mailDrafts.some(d=>d.id===id))return;
  openEditor(id);
 }
 function removeDraft(id){
  const old=mailDrafts.find(d=>d.id===id);
  for(const item of old?.attachments||[])void deleteMailAttachment(id,item.id);
  mailDrafts=mailDrafts.filter(d=>d.id!==id);persistMailDrafts();
  mailEditingId=null;mailEditorOpen=false;mailFolder='drafts';paint();
 }
 function updateSampleMail(item,action){
  if(!item||!mailExamples.includes(item))return;
  const sender=sampleSenderKey(item);
  if(action==='spam'){
   item.spam=true;item.trashed=false;item.archived=false;
   mailNotice='Письмо перемещено в спам · только учебный список.';
  }else if(action==='notspam'){
   if(sampleBlocked(item))return;
   item.spam=false;item.trashed=false;
   mailNotice='Письмо возвращено во входящие · учебный список.';
  }else if(action==='trash'){
   item.trashed=true;item.spam=false;
   mailNotice='Письмо в Корзине · только учебный список.';
  }else if(action==='restore'){
   item.trashed=false;item.spam=sampleBlocked(item);
   mailNotice='Письмо восстановлено · только учебный список.';
  }else if(action==='block'){
   sampleBlockedSenders.add(sender);
   for(const m of mailExamples.filter(v=>sampleSenderKey(v)===sender)){
    m.spam=true;m.archived=false;m.trashed=false;
   }
   mailNotice='Отправитель заблокирован в учебном списке. На почтовом сервере изменений нет.';
  }else if(action==='unblock'){
   sampleBlockedSenders.delete(sender);
   mailNotice='Отправитель разблокирован в учебном списке. Письма остаются в Спаме до восстановления.';
  }else if(action==='trust'){
   if(!addGateTrusted(item.account,sampleMailAddress(item)))return;
   mailFolder='inbox';
   mailNotice='Адрес добавлен в доверенные · только учебная почта.';
  }else if(action==='remove'){
   item.removed=true;mailNotice='Учебное письмо удалено из локального списка.';
  }else return;
  saveSampleActions();mailCurrent=null;paint();
 }
 function viewExample(item){
  item.unread=false;saveSampleActions();mailCurrent=item.id;mailEditorOpen=false;paint();
 }
 function iconButton(name,label,callback){
  const button=create('button','sv-mail-icon-button');button.type='button';
  button.setAttribute('aria-label',label);button.title=label;
  button.append(mailIcon(name));button.addEventListener('click',callback);return button;
 }
 function drawEditor(){
  const original=mailDrafts.find(d=>d.id===mailEditingId);
  const form=create('form','sv-mail-editor');
  form.setAttribute('aria-label','Черновик письма SEYVEO');
  const heading=create('header','sv-mail-editor-header');
  const editorBack=iconButton('back','Назад к письмам',()=>mailEditorExitHandler?.());
  editorBack.classList.add('sv-mail-editor-back');
  heading.append(editorBack,create('h2','sv-mail-editor-title',original?'Изменить черновик':'Новое письмо'));
  form.append(heading);
  // One inline sender selection, no duplicate bottom dialog.
  let accountValue=original?.account||mailComposeScope||'';
  const accountField=create('div','sv-mail-sender-switch');
  accountField.setAttribute('role','group');accountField.setAttribute('aria-label','От имени');
  const senderCaption=create('span','sv-mail-sender-caption','От имени');
  const senderOptions=create('div','sv-mail-sender-options');
  const senderButtons=[];
  const refreshAccount=()=>senderButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mailAccount===accountValue)));
  for(const [value,label] of [['personal','Личная'],['business','Рабочая']]){
   const button=create('button','sv-mail-sender-option',label);
   button.type='button';button.dataset.mailAccount=value;button.disabled=!!original;
   button.addEventListener('click',()=>{if(button.disabled)return;accountValue=value;mailComposeScope=value;refreshAccount();autosaveDraft()});
   senderButtons.push(button);senderOptions.append(button);
  }
  accountField.append(senderCaption,senderOptions);form.append(accountField);refreshAccount();
  const makeField=(labelText,name,tag,value,type)=>{
   const label=create(tag==='textarea'?'div':'label','sv-mail-field');
   label.append(create('span','sv-mail-field-label',labelText));
   const input=create(tag,'sv-mail-input');input.dataset.mailField=name;
   if(type)input.type=type;
   if(tag==='textarea'){input.rows=6;input.setAttribute('aria-label',labelText)}
   input.maxLength=name==='body'?10000:name==='to'?254:240;input.value=value||'';
   label.append(input);form.append(label);return input;
  };
  const to=makeField('Кому','to','input',original?.to,'email');
  const subj=makeField('Тема','subject','input',original?.subject,'text');
  const message=makeField('Сообщение','body','textarea',original?.body);
  const attachmentPicker=create('input','sv-mail-attachment-picker');
  attachmentPicker.type='file';attachmentPicker.hidden=true;attachmentPicker.multiple=true;
  attachmentPicker.accept='.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp';
  attachmentPicker.setAttribute('aria-label','Выбрать вложения из файлов телефона');
  form.append(attachmentPicker);
  const attachButton=iconButton('paperclip','Прикрепить файл',()=>attachmentPicker.click());
  attachButton.classList.add('sv-mail-attach-trigger');
  // Keep "Сообщение" as a clean heading; the paperclip lives beside Send below.
  attachButton.title='Добавить файлы';
  const attachmentCount=create('span','sv-mail-attach-count');
  attachmentCount.setAttribute('aria-hidden','true');
  attachmentCount.hidden=true;
  attachButton.append(attachmentCount);
  const attachmentList=create('div','sv-mail-attached-list');
  attachmentList.setAttribute('role','list');
  attachmentList.setAttribute('aria-label','Прикреплённые файлы. Проведите в сторону, чтобы увидеть остальные.');
  const attachmentShelf=create('section','sv-mail-attachment-shelf');
  attachmentShelf.setAttribute('aria-label','Вложения в черновике');
  attachmentShelf.hidden=true;
  attachmentShelf.append(attachmentList);
  const filePreview=create('dialog','sv-mail-file-preview');
  filePreview.setAttribute('aria-label','Просмотр вложения');
  const filePreviewHead=create('div','sv-mail-file-preview-head');
  const filePreviewTitle=create('strong','sv-mail-file-preview-name');
  const filePreviewClose=iconButton('back','Закрыть просмотр',()=>filePreview.close());
  filePreviewHead.append(filePreviewClose,filePreviewTitle);
  const filePreviewContent=create('div','sv-mail-file-preview-content');
  filePreview.append(filePreviewHead,filePreviewContent);
  form.append(filePreview);
  let filePreviewUrl=null;
  filePreview.addEventListener('close',()=>{
   filePreviewContent.replaceChildren();
   if(filePreviewUrl){URL.revokeObjectURL(filePreviewUrl);filePreviewUrl=null}
  });
  const status=create('p','sv-mail-feedback');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  // One stable draft ID: every keystroke updates the same local draft.
  const draftId=original?.id||'mail-draft-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
  let attachments=[...(original?.attachments||[])];
  const attachmentSize=n=>n>=1048576?(n/1048576).toFixed(1)+' МБ':Math.max(1,Math.round(n/1024))+' КБ';
  const attachmentType=name=>{
   const extension=String(name||'').split('.').pop().toLowerCase();
   if(extension==='pdf')return {code:'PDF',name:'PDF-документ',kind:'pdf'};
   if(['doc','docx'].includes(extension))return {code:'DOC',name:'Документ Word',kind:'word'};
   if(['xls','xlsx','csv'].includes(extension))return {code:'XLS',name:'Таблица Excel',kind:'sheet'};
   if(['png','jpg','jpeg','webp'].includes(extension))return {code:'IMG',name:'Изображение',kind:'image'};
   return {code:'TXT',name:'Текстовый файл',kind:'text'};
  };
  const showFile=async entry=>{
   const file=await readMailAttachment(draftId,entry.id);
   if(!file){status.textContent='Файл больше не доступен на устройстве. Прикрепите его снова.';return}
   filePreviewTitle.textContent=entry.name;
   filePreviewContent.replaceChildren();
   const extension=entry.name.split('.').pop().toLowerCase();
   filePreviewUrl=URL.createObjectURL(file);
   if(['jpg','jpeg','png','webp'].includes(extension)){
    const img=create('img','sv-mail-file-image');img.alt=entry.name;img.src=filePreviewUrl;
    filePreviewContent.append(img);
   }else if(extension==='pdf'){
    const frame=create('iframe','sv-mail-file-frame');frame.title=entry.name;
    // Never grant active scripts or same-origin privileges to a user-supplied file.
    frame.setAttribute('sandbox','');frame.referrerPolicy='no-referrer';
    frame.src=filePreviewUrl;filePreviewContent.append(frame);
   }else{
    filePreviewContent.append(create('p','sv-mail-file-preview-note','Для этого формата доступно скачивание.'));
   }
   const download=create('a','sv-mail-file-download','Сохранить файл');
   download.href=filePreviewUrl;download.download=entry.name;
   filePreviewContent.append(download);
   if(typeof filePreview.showModal==='function')filePreview.showModal();
   else filePreview.setAttribute('open','');
  };
  function renderAttachments(){
   attachmentList.replaceChildren();
   attachmentShelf.hidden=!attachments.length;
   attachmentList.hidden=!attachments.length;
   attachmentCount.hidden=!attachments.length;
   attachmentCount.textContent=String(attachments.length);
   attachButton.setAttribute('aria-label',attachments.length
    ?'Добавить файл. Уже прикреплено: '+attachments.length+' из 5'
    :'Прикрепить файлы');
   for(const entry of attachments){
    const kind=attachmentType(entry.name);
    const row=create('div','sv-mail-attached-item');
    row.dataset.fileKind=kind.kind;
    row.setAttribute('role','listitem');
    const view=create('button','sv-mail-attached-preview');
    view.type='button';
    view.title=kind.name+' · '+entry.name;
    view.setAttribute('aria-label','Открыть '+kind.name+': '+entry.name);
    const badge=create('span','sv-mail-kind-mark',kind.code);
    badge.setAttribute('aria-hidden','true');
    const meta=create('span','sv-mail-attached-meta');
    const name=create('span','sv-mail-attached-name',entry.name);
    name.title=entry.name;
    meta.append(name,create('small','sv-mail-attached-size',attachmentSize(entry.size)));
    view.append(badge,meta);
    view.addEventListener('click',()=>{void showFile(entry)});
    const remove=iconButton('trash','Убрать вложение '+entry.name,()=>{
     attachments=attachments.filter(a=>a.id!==entry.id);
     void deleteMailAttachment(draftId,entry.id);
     autosaveDraft();renderAttachments();
     status.textContent='';
    });
    remove.classList.add('sv-mail-attached-remove');
    remove.title='Убрать вложение';
    row.append(view,remove);attachmentList.append(row);
   }
   // Always start at the first file. Auto-scrolling to the last attachment
   // previously left the first card visibly cut off on iPhone.
   attachmentList.scrollLeft=0;
  }
  attachmentPicker.addEventListener('change',async()=>{
   const chosen=Array.from(attachmentPicker.files||[]);
   attachmentPicker.value='';
   // File pickers return focus to their trigger on iOS. Do not leave a
   // large white keyboard-focus ring after the user closes Files.
   if(document.activeElement===attachButton)attachButton.blur();
   for(const file of chosen){
    const extension=file.name.split('.').pop().toLowerCase();
    if(!['pdf','doc','docx','xls','xlsx','txt','csv','png','jpg','jpeg','webp'].includes(extension)){
     status.textContent='Этот формат пока не поддерживается. Выберите документ, PDF или изображение.';continue;
    }
    if(file.size>10*1048576){status.textContent='Размер одного вложения — не более 10 МБ.';continue}
    if(attachments.length>=5||attachments.reduce((sum,a)=>sum+a.size,0)+file.size>20*1048576){
     status.textContent='Можно добавить до 5 файлов общим размером до 20 МБ.';continue;
    }
    const id='mf-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);
    const stored=await saveMailAttachment(draftId,id,file);
    if(!stored){status.textContent='Не удалось сохранить файл в браузере. Проверьте свободное место.';continue}
    attachments.push({id,name:file.name.slice(0,150),size:file.size,type:file.type||''});
    autosaveDraft();renderAttachments();
    status.textContent=''; // The file card itself confirms successful attachment.
   }
  });
  renderAttachments();
  function autosaveDraft(){
   const recipient=to.value.trim(),subjectText=subj.value.trim(),bodyText=message.value.trim();
   if(!recipient&&!subjectText&&!bodyText&&!attachments.length&&!original)return false;
   const item={id:draftId,account:original?.account||accountValue||'',
    to:recipient.slice(0,254),subject:subjectText.slice(0,240),body:bodyText.slice(0,10000),attachments:attachments.map(a=>({...a}))};
   const index=mailDrafts.findIndex(d=>d.id===draftId);
   if(index<0)mailDrafts.unshift(item);else mailDrafts[index]=item;
   persistMailDrafts();
   mailEditingId=draftId;
   return true;
  }
  for(const field of [to,subj,message])field.addEventListener('input',autosaveDraft);
  const leaveEditor=()=>{
   const saved=autosaveDraft();
   mailEditorOpen=false;mailEditingId=null;
   mailCurrent=mailEditorReturnId;mailEditorReturnId=null;mailEditorExitHandler=null;
   if(saved&&!mailCurrent)mailFolder='drafts';
   paint();
  };
  // Back saves automatically, without the obsolete Save/Discard sheet.
  mailEditorExitHandler=leaveEditor;
  form.addEventListener('submit',event=>{event.preventDefault();autosaveDraft()});
  const actions=create('div','sv-mail-editor-actions');
  // Developer prototype: keep Sayvi available and preview its local formatting before approval.
  const preview=create('section','sv-mail-polish-preview');
  preview.hidden=true;preview.setAttribute('aria-label','Предложение Сэйви');
  const previewTitle=create('strong','','Сэйви предлагает оформление');
  const previewText=create('p','sv-mail-polish-text');
  const previewActions=create('div','sv-mail-polish-actions');
  const apply=intent('Применить',()=>{
   if(preview.hidden)return;
   message.value=previewText.textContent;
   message.dispatchEvent(new Event('input',{bubbles:true}));
   preview.hidden=true;
   status.textContent='Оформление применено. Проверьте текст перед сохранением.';
  });
  const decline=intent('Оставить как было',()=>{preview.hidden=true});
  previewActions.append(apply,decline);
  preview.append(previewTitle,previewText,previewActions);
  const polish=intent('Сэйви · улучшить текст',()=>{
   const cleaned=polishMailLocally(message.value);
   if(!cleaned){status.textContent='Сначала напишите текст письма.';return}
   if(cleaned===message.value){preview.hidden=true;status.textContent='Оформление уже в порядке. Для полноценной редакции нужен подключённый ИИ.';return}
   previewText.textContent=cleaned;
   preview.hidden=false;
   status.textContent='Локальная правка пробелов и оформления. Смысл и факты не проверены.';
  });
  polish.classList.add('sv-mail-polish-trigger');
  polish.textContent='';
  polish.append(create('span','sv-mail-assist-symbol sv-sayvi-symbol',''));
  polish.setAttribute('aria-label','Сэйви: улучшить текст письма');
  polish.title='Сэйви · улучшить текст';
  message.addEventListener('input',()=>{preview.hidden=true});
  const send=create('button','sv-deep-intent sv-deep-intent--lead');
  send.type='button';send.classList.add('sv-mail-send-trigger');
  send.append(mailIcon('send'));
  send.setAttribute('aria-label','Отправить письмо');
  send.title='Отправить письмо';
  send.addEventListener('click',()=>{
   const saved=autosaveDraft();
   status.textContent=saved?'Для отправки подключите почту. Черновик сохранён, письмо не отправлено.':'Для отправки подключите почтовый ящик. Письмо не отправлено.';
  });
  const primaryActions=create('div','sv-mail-primary-actions');
  primaryActions.append(send);
  actions.append(polish,primaryActions);
  // Files have their own swipeable full-width row ABOVE the controls.
  // Below: the paperclip stays at left; Sayvi and Send stay at right.
  const composerFooter=create('div','sv-mail-compose-footer');
  const filesArea=create('div','sv-mail-footer-files');
  filesArea.append(attachButton);
  composerFooter.append(filesArea,actions);
  form.append(attachmentShelf,composerFooter,preview,status);
  content.append(form);
 }
 /* Local, explainable mail assistance for the development prototype.
    No remote AI, no sending, no invented prices or commitments. */
 function mailLocalAnalysis(item){
  const body=String(item.body||'');
  const topic=/достав|срок|стоим|цен/i.test(body)?'Стоимость и сроки доставки':
   /план|согласован|совещан|встреч/i.test(body)?'Согласование и планирование':
   /отч[её]т|сч[её]т|оплат|договор/i.test(body)?'Документы и отчётность':'Обращение по теме письма';
  const question=body.split(/[\n.!?]+/).map(x=>x.trim()).find(x=>x.length>12&&/подскаж|просим|можно|сколько|когда|какие|подтверд|соглас/i.test(x));
  return 'Тема: '+topic+'.\n'+(question?'Запрос: '+question.slice(0,180)+'.\n':'')+
   'Перед ответом проверьте факты и доступные условия. Это локальный разбор по правилам, без подключения ИИ.';
 }
 function mailLocalReply(item){
  const body=String(item.body||'');
  if(/достав|срок|стоим|цен/i.test(body))
   return 'Здравствуйте!\n\nСпасибо за обращение. Уточним стоимость и возможные сроки доставки и вернёмся к вам с подтверждённой информацией.\n\nС уважением,';
  if(/согласован|план|совещан|встреч/i.test(body))
   return 'Здравствуйте!\n\nСпасибо за письмо. Ознакомимся с предложением и сообщим о согласовании после проверки деталей.\n\nС уважением,';
  return 'Здравствуйте!\n\nСпасибо за ваше письмо. Мы рассмотрим вопрос и подготовим ответ после уточнения необходимых деталей.\n\nС уважением,';
 }
 function polishMailLocally(text){
  const value=String(text||'').replace(/\r\n?/g,'\n').trim();
  if(!value)return '';
  return value.split(/\n{2,}/).map(block=>block.split('\n').map(line=>{
   const normalized=line.trim().replace(/ {2,}/g,' ').replace(/\s+([,.!?;:])/g,'$1');
   return normalized.replace(/^([а-яёa-z])/i,c=>c.toLocaleUpperCase('ru-RU'));
  }).join('\n')).join('\n\n');
 }
 function drawDetails(item){
  const panel=create('article','sv-mail-detail');
  const heading=create('div','sv-mail-detail-bar');
  const backButton=iconButton('back','Вернуться к списку',()=>{mailCurrent=null;paint()});
  const opts=create('div','sv-mail-detail-tools');
  const favorite=iconButton('starred',item.starred?'Убрать из важных':'Отметить важным',()=>{
   item.starred=!item.starred;saveSampleActions();paint();
  });
  favorite.setAttribute('aria-pressed',String(item.starred));
  const moreMenu=create('div','sv-mail-message-menu');
  moreMenu.hidden=true;moreMenu.setAttribute('role','group');
  moreMenu.setAttribute('aria-label','Другие действия с письмом');
  const more=iconButton('more','Другие действия',()=>{
   moreMenu.hidden=!moreMenu.hidden;
   more.setAttribute('aria-expanded',String(!moreMenu.hidden));
   blockConfirm.hidden=true;
  });
  more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls','svMailMoreActions');
  moreMenu.id='svMailMoreActions';
  if(item.trashed){
   // Trash is a destination, not a place for Star, Archive, Reply or Spam.
   // Restoration is immediate; permanent deletion always asks permission.
   opts.append(
    iconButton('restore','Восстановить письмо',()=>updateSampleMail(item,'restore')),
    iconButton('trash','Удалить навсегда',()=>{
     if(window.confirm('Удалить это учебное письмо навсегда? Отменить нельзя.'))
      updateSampleMail(item,'remove');
    })
   );
  }else{
   opts.append(favorite,iconButton('archive',item.archived?'Вернуть во входящие':'В архив · образец',()=>{
    item.archived=!item.archived;saveSampleActions();mailCurrent=null;paint();
   }),iconButton('trash','Переместить в Корзину',()=>{
    updateSampleMail(item,'trash');
   }),more);
  }
  heading.append(backButton,opts);
  panel.append(heading,create('span','sv-mail-account-tag',mailAccountName(item.account)),create('h2','sv-mail-detail-title',item.subject));
  const addMenuAction=(icon,label,callback)=>{
   const control=create('button','sv-mail-message-menu-item');control.type='button';
   control.append(mailIcon(icon),create('span','',label));
   control.addEventListener('click',callback);moreMenu.append(control);
  };
  if(!item.trashed&&!sampleBlocked(item)){
   addMenuAction(item.spam?'restore':'spam',item.spam?'Не спам':'В спам',()=>{
    updateSampleMail(item,item.spam?'notspam':'spam');
   });
  }
  const blockConfirm=create('section','sv-mail-block-confirm');
  blockConfirm.hidden=true;blockConfirm.setAttribute('aria-label','Подтверждение блокировки');
  if(item.trashed){
   // No sender-management actions from trash.
  }else if(sampleBlocked(item)){
   addMenuAction('shield','Разблокировать отправителя',()=>updateSampleMail(item,'unblock'));
  }else{
   addMenuAction('shield','Блокировать отправителя',()=>{
    moreMenu.hidden=true;more.setAttribute('aria-expanded','false');
    blockConfirm.hidden=false;
   });
   blockConfirm.append(
    create('strong','','Блокировать отправителя?'),
    create('p','','Письма этого отправителя уйдут в Спам в учебном списке. Почтовый сервис не подключён.')
   );
   const choices=create('div','sv-mail-block-confirm-actions');
   const cancel=create('button','','Отмена');cancel.type='button';
   cancel.addEventListener('click',()=>{blockConfirm.hidden=true;more.focus()});
   const accept=create('button','','Блокировать');accept.type='button';
   accept.addEventListener('click',()=>updateSampleMail(item,'block'));
   choices.append(cancel,accept);blockConfirm.append(choices);
  }
  if(!item.trashed&&!sampleBlocked(item)&&!gateTrusted(item.account,sampleMailAddress(item))){
   addMenuAction('shield','Доверять отправителю',()=>updateSampleMail(item,'trust'));
  }
  panel.append(moreMenu,blockConfirm);
  const person=create('div','sv-mail-detail-person');
  person.append(create('span','sv-mail-avatar',item.initial));
  const who=create('div','sv-mail-detail-who');
  who.append(create('strong','',item.from),create('span','',item.when+' · образец письма'));
  person.append(who);panel.append(person);

  const inspectButton=create('button','sv-mail-inspect-trigger');
  inspectButton.type='button';
  inspectButton.append(mailIcon('shield'),create('span','','Проверить отправителя'));
  inspectButton.setAttribute('aria-expanded','false');
  const inspectPanel=create('section','sv-mail-inspect-panel');inspectPanel.hidden=true;
  const sampleAddress=sampleMailAddress(item);
  const trusted=gateTrusted(item.account,sampleAddress);
  const inspectionRows=[
   ['Адрес',sampleAddress+' · учебный'],
   ['Доверие',sampleBlocked(item)?'Заблокирован в примере':trusted?'В доверенных':MAIL_SAMPLE_CONTACTS.has(item.id)?'Знакомый в примере':'Не в доверенных'],
   ['Подлинность SPF / DKIM / DMARC','Нет технических данных'],
   ['Открытые источники','Поиск не проводился']
  ];
  for(const [key,value] of inspectionRows){
   const line=create('div','sv-mail-inspect-line');
   line.append(create('span','',key),create('strong','',value));
   inspectPanel.append(line);
  }
  inspectPanel.append(create('p','','Это демонстрационный адрес example.com, не результат интернет-проверки. При подключении настоящей почты потребуется отдельное разрешение для внешнего поиска.'));
  inspectButton.addEventListener('click',()=>{
   inspectPanel.hidden=!inspectPanel.hidden;
   inspectButton.setAttribute('aria-expanded',String(!inspectPanel.hidden));
  });
  panel.append(inspectButton,inspectPanel);
  const message=create('p','sv-mail-detail-text',item.body);panel.append(message);
  if(item.attachment){
   const example=create('div','sv-mail-attachment');
   example.append(mailIcon('paperclip'),create('span','','Образец письма · настоящее вложение отсутствует'));
   panel.append(example);
  }
  const actions=create('div','sv-mail-detail-actions');
  const reply=intent('Ответить',()=>openEditor(null,item),true);
  reply.classList.add('sv-mail-reply-action');
  reply.replaceChildren(mailIcon('reply'));
  reply.setAttribute('aria-label','Ответить на письмо');
  reply.title='Ответить';
  const help=intent('Сэйви',()=>{
   note.hidden=!note.hidden;
   help.setAttribute('aria-expanded',String(!note.hidden));

  });
  help.classList.add('sv-mail-assist-action');
  help.replaceChildren(create('span','sv-mail-assist-symbol sv-sayvi-symbol',''));
  help.setAttribute('aria-label','Сэйви: помочь с письмом');
  help.title='Сэйви · помощь с письмом';
  help.setAttribute('aria-expanded','false');
  help.setAttribute('aria-controls','svMailSayviAssist');
  if(!item.trashed){actions.append(reply,help);panel.append(actions)}
  const note=create('section','sv-mail-sayvi-note');
  note.id='svMailSayviAssist';
  note.hidden=true;note.setAttribute('aria-label','Помощь Сэйви с письмом');
  const caption=create('p','sv-mail-assist-caption','Сэйви · локальные подсказки без ИИ');
  const quick=create('div','sv-mail-assist-quick');
  const result=create('p','sv-mail-assist-result');
  result.setAttribute('role','status');
  const makeDraft=()=>{
   openEditor(null,item);
   const field=content.querySelector('[data-mail-field="body"]');
   if(field){field.value=mailLocalReply(item);field.dispatchEvent(new Event('input',{bubbles:true}))}
  };
  quick.append(
   intent('Разобрать письмо',()=>{result.textContent=mailLocalAnalysis(item)}),
   intent('Подготовить ответ',makeDraft)
  );
  note.append(caption,quick,result);
  panel.append(note);
  content.append(panel);
 }

 // Multi-select is scoped to the displayed folder, current mailbox and active search.
 let mailBulkSelecting=false;
 const selectedMailIds=new Set();
 function visibleSampleMail(){
  if(!mailShowExamples)return [];
  const inFolder=mailExamples.filter(m=>{
   if(!mailVisible(m.account)||m.removed)return false;
   if(mailFolder==='trash')return m.trashed;
   const category=gateCategory(m);
   if(mailFolder==='spam')return !m.trashed&&category==='spam';
   if(m.trashed||category==='spam')return false;
   if(mailFolder==='review')return !m.archived&&category==='review';
   if(mailFolder==='promotions')return !m.archived&&category==='promotions';
   if(category!=='inbox')return false;
   if(mailFolder==='archive')return m.archived;
   if(mailFolder==='starred')return m.starred&&!m.archived;
   return !m.archived;
  });
  const q=mailSearch.trim();
  return inFolder.filter(m=>!q||[m.from,m.subject,m.preview,m.body].join(' ').toLocaleLowerCase('ru').includes(q));
 }
 function cleanSelectedSampleMail(){
  const allowed=visibleSampleMail().filter(m=>selectedMailIds.has(m.id));
  if(!mailBulkSelecting||!allowed.length||mailFolder==='overview')return false;
  const count=allowed.length,permanent=mailFolder==='trash';
  const question=permanent
   ?'Удалить навсегда '+count+' писем из Корзины? Действие нельзя отменить.'
   :'Переместить '+count+' писем в Корзину? Их можно будет восстановить.';
  if(!window.confirm(question))return false;
  for(const item of allowed){
   if(permanent)item.removed=true;
   else {item.trashed=true;item.spam=false}
  }
  saveSampleActions();
  selectedMailIds.clear();mailBulkSelecting=false;
  mailNotice=permanent?'Удалено навсегда: '+count+' · учебные письма.':
   'В Корзине: '+count+' · учебные письма.';
  paint();return true;
 }
 function renderMailBulkBar(visible){
  if(mailFolder==='overview'||!visible.length)return;
  const chosen=visible.filter(m=>selectedMailIds.has(m.id)).length;
  const bar=create('div','sv-mail-bulk-toolbar');
  bar.append(create('span','sv-mail-bulk-counter',mailBulkSelecting
   ?'Выбрано: '+chosen+' из '+visible.length
   :'Писем: '+visible.length));
  if(mailBulkSelecting){
   const allChosen=visible.every(m=>selectedMailIds.has(m.id));
   const all=create('button','sv-mail-bulk-all',allChosen?'Снять всё':'Выбрать все');
   all.type='button';
   all.addEventListener('click',()=>{
    if(allChosen)for(const m of visible)selectedMailIds.delete(m.id);
    else for(const m of visible)selectedMailIds.add(m.id);
    paintList();
   });
   bar.append(all);
  }
  const select=create('button','sv-mail-bulk-select',mailBulkSelecting?'Готово':'Выбрать');
  select.type='button';select.setAttribute('aria-pressed',String(mailBulkSelecting));
  select.addEventListener('click',()=>{
   mailBulkSelecting=!mailBulkSelecting;selectedMailIds.clear();paintList();
  });
  bar.append(select);content.append(bar);
 }
 function renderMailBulkAction(){
  if(!mailBulkSelecting)return;
  const selected=visibleSampleMail().filter(m=>selectedMailIds.has(m.id));
  const actions=create('div','sv-mail-bulk-actions');
  const permanent=mailFolder==='trash';
  const button=create('button','sv-mail-bulk-clean',
   !selected.length?'Выберите письма':
   permanent?'Удалить навсегда · '+selected.length:'Очистить · '+selected.length);
  button.type='button';button.disabled=!selected.length;
  button.setAttribute('aria-label',permanent
   ?'Окончательно удалить выбранные письма после подтверждения'
   :'Переместить выбранные письма в Корзину после подтверждения');
  button.addEventListener('click',cleanSelectedSampleMail);
  actions.append(button);content.append(actions);
 }
 function drawExamples(limit=0){

  if(!mailShowExamples){content.append(create('p','sv-mail-empty','Почтовый ящик ещё не подключён. Подключите его, чтобы видеть настоящие письма.'));return}
  const matched=visibleSampleMail();
  if(!matched.length){content.append(create('p','sv-mail-empty',q?'По этому запросу примеров нет.':'Здесь пока нет учебных писем.'));return}
  renderMailBulkBar(matched);
  const group=create('div','sv-mail-letter-group');content.append(group);
  const shown=limit?matched.slice(0,limit):matched;
  const showAccountTags=mailScope==='all'&&new Set(shown.map(m=>m.account)).size>1;
  for(const item of shown){
   const shell=create('div','sv-mail-swipe-shell');
   const swipeActions=create('div','sv-mail-swipe-actions');
   swipeActions.setAttribute('role','group');
   swipeActions.setAttribute('aria-label','Быстрые действия с письмом');
   const row=create('button','sv-mail-letter');
   row.type='button';row.classList.toggle('is-unread',item.unread);
   if(mailBulkSelecting){
    shell.classList.add('is-bulk-selecting');
    row.classList.toggle('is-selected',selectedMailIds.has(item.id));
    row.setAttribute('aria-pressed',String(selectedMailIds.has(item.id)));
   }
   const avatar=create('span','sv-mail-avatar',item.initial);
   if(mailBulkSelecting){avatar.classList.add('sv-mail-bulk-avatar');avatar.textContent='';}
   const detail=create('span','sv-mail-letter-details');
   const sender=create('span','sv-mail-letter-sender',item.from);
   const titleText=create('strong','sv-mail-letter-subject',item.subject);
   const preview=create('span','sv-mail-letter-preview',item.preview);
   detail.append(sender,titleText,preview);
   if(showAccountTags)detail.append(create('small','sv-mail-account-tag',mailAccountName(item.account)));
   const meta=create('span','sv-mail-letter-meta');
   meta.append(create('time','',item.when));
   if(item.attachment)meta.append(mailIcon('paperclip'));
   if(item.starred)meta.append(mailIcon('starred'));
   if(item.unread)row.append(create('span','sv-mail-unread-dot'));
   row.append(avatar,detail,meta);
   row.setAttribute('aria-label',mailBulkSelecting
    ?(selectedMailIds.has(item.id)?'Снять выбор: ':'Выбрать письмо: ')+item.from+', '+item.subject
    :item.from+', '+item.subject+', учебное письмо. Свайп влево — действия.');
   const choices=(mailFolder==='review'||mailFolder==='promotions')
    ?[['shield','Доверять',()=>updateSampleMail(item,'trust')],['trash','Удалить',()=>updateSampleMail(item,'trash')]]
    :mailFolder==='spam'
    ?[sampleBlocked(item)
       ?['shield','Разблок.',()=>updateSampleMail(item,'unblock')]
       :['restore','Не спам',()=>updateSampleMail(item,'notspam')],
      ['trash','Удалить',()=>updateSampleMail(item,'trash')]]
    :mailFolder==='trash'
     ?[['restore','Вернуть',()=>updateSampleMail(item,'restore')],['trash','Удалить',()=>{
       const yes=window.confirm('Окончательно удалить это учебное письмо из списка?');
       if(yes)updateSampleMail(item,'remove');
      }]]
     :[['spam','Спам',()=>updateSampleMail(item,'spam')],['trash','Удалить',()=>updateSampleMail(item,'trash')]];
   function setActionsOpen(open){
    if(open){
     for(const other of group.querySelectorAll('.sv-mail-swipe-shell.is-actions-open')){
      if(other!==shell){
       other.classList.remove('is-actions-open');
       other.querySelectorAll('.sv-mail-swipe-action').forEach(b=>b.tabIndex=-1);
      }
     }
    }
    shell.classList.toggle('is-actions-open',open);
    swipeActions.querySelectorAll('.sv-mail-swipe-action').forEach(b=>b.tabIndex=open?0:-1);
    swipeActions.setAttribute('aria-hidden',String(!open));
   }
   for(const [icon,label,fn] of choices){
    const action=create('button','sv-mail-swipe-action');
    action.type='button';action.tabIndex=-1;
    action.setAttribute('aria-label',label+': '+item.subject);
    action.append(mailIcon(icon),create('span','',label));
    action.addEventListener('click',()=>{setActionsOpen(false);fn()});
    swipeActions.append(action);
   }
   setActionsOpen(false);
   let touchStart=null;
   shell.addEventListener('touchstart',e=>{
    if(mailBulkSelecting)return;
    const touch=e.touches[0];if(!touch)return;
    touchStart={x:touch.clientX,y:touch.clientY};
   },{passive:true});
   shell.addEventListener('touchend',e=>{
    if(mailBulkSelecting)return;
    if(!touchStart)return;
    const end=e.changedTouches[0];if(!end)return;
    const dx=end.clientX-touchStart.x,dy=end.clientY-touchStart.y;touchStart=null;
    if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.25)return;
    if(e.cancelable)e.preventDefault();
    setActionsOpen(dx<0);
   },{passive:false});
   shell.addEventListener('touchcancel',()=>{touchStart=null},{passive:true});
   row.addEventListener('click',()=>{
    if(mailBulkSelecting){
     if(selectedMailIds.has(item.id))selectedMailIds.delete(item.id);
     else selectedMailIds.add(item.id);
     paintList();return;
    }
    if(shell.classList.contains('is-actions-open')){setActionsOpen(false);return}
    viewExample(item);
   });
   // Desktop and assistive users can open the same actions via context menu.
   row.addEventListener('contextmenu',event=>{
    if(mailBulkSelecting)return;
    event.preventDefault();setActionsOpen(true);
   });
   shell.append(swipeActions,row);group.append(shell);
  }
  renderMailBulkAction();
 }

 let mailDraftSelecting=false;
 const selectedDraftIds=new Set();
 function draftDisplayName(draft){
  const explicit=String(draft.subject||'').trim().replace(/\s+/g,' ');
  if(explicit)return explicit;
  const body=String(draft.body||'').split(/\r?\n/).map(s=>s.trim().replace(/\s+/g,' ')).find(Boolean);
  if(body)return body.slice(0,105);
  if(draft.attachments?.length){
   // Display the actual first saved file name, not five indistinguishable drafts.
   // File names are text only and are never interpreted as HTML.
   const first=String(draft.attachments[0]?.name||'').split(/[\\/]/).pop().trim().replace(/\s+/g,' ');
   return first?first.slice(0,105):'Файл без названия';
  }
  return 'Письмо без темы';
 }
 function removeSelectedDrafts(ids){
  const actual=[...new Set(ids)].filter(id=>mailDrafts.some(d=>d.id===id));
  if(!actual.length)return false;
  const count=actual.length;
  const question=count===1
   ?'Удалить этот черновик? Все его вложения также будут удалены с устройства. Отменить удаление нельзя.'
   :'Удалить выбранные черновики ('+count+')? Их вложения также будут удалены с устройства. Отменить удаление нельзя.';
  if(!window.confirm(question))return false;
  const marked=new Set(actual);
  for(const draft of mailDrafts.filter(d=>marked.has(d.id))){
   for(const file of draft.attachments||[])void deleteMailAttachment(draft.id,file.id);
  }
  mailDrafts=mailDrafts.filter(d=>!marked.has(d.id));
  persistMailDrafts();
  selectedDraftIds.clear();mailDraftSelecting=false;
  mailNotice=count===1?'Черновик удалён с устройства.':'Удалено черновиков: '+count+'.';
  paint();return true;
 }
 function drawDrafts(){
  const list=mailDrafts.filter(d=>mailVisible(d.account)&&(!mailSearch||
   [d.to,d.subject,d.body].join(' ').toLocaleLowerCase('ru').includes(mailSearch)));
  // A single selection control replaces repetitive trash cans on every line.
  const toolbar=create('div','sv-mail-drafts-bar');
  const chosenVisible=list.filter(d=>selectedDraftIds.has(d.id)).length;
  const countLabel=create('strong','sv-mail-drafts-count',mailDraftSelecting
   ?'Выбрано: '+chosenVisible+' из '+list.length
   :mailSearch?'Найдено: '+list.length:'Черновиков: '+list.length);
  const change=create('button','sv-mail-drafts-select',mailDraftSelecting?'Готово':'Выбрать');
  change.type='button';change.setAttribute('aria-pressed',String(mailDraftSelecting));
  change.addEventListener('click',()=>{
   mailDraftSelecting=!mailDraftSelecting;
   if(!mailDraftSelecting)selectedDraftIds.clear();
   paintList();
  });
  toolbar.append(countLabel);
  if(mailDraftSelecting&&list.length){
   const allChosen=list.every(d=>selectedDraftIds.has(d.id));
   const all=create('button','sv-mail-drafts-all',allChosen?'Снять всё':'Выбрать все');
   all.type='button';
   all.addEventListener('click',()=>{
    if(allChosen)for(const item of list)selectedDraftIds.delete(item.id);
    else for(const item of list)selectedDraftIds.add(item.id);
    paintList();
   });
   toolbar.append(all);
  }
  if(list.length)toolbar.append(change);
  content.append(toolbar);
  if(!list.length){
   mailDraftSelecting=false;selectedDraftIds.clear();
   content.append(create('p','sv-mail-empty',mailSearch?'Черновики не найдены.':'Черновиков пока нет. Нажмите карандаш, чтобы написать письмо.'));
   return;
  }
  const group=create('div','sv-mail-drafts-group');content.append(group);
  for(const draft of list){
   const row=create('div','sv-mail-draft-row');
   if(mailDraftSelecting){
    row.classList.add('is-selecting');
    if(selectedDraftIds.has(draft.id))row.classList.add('is-selected');
   }
   const edit=create('button','sv-mail-draft-content');edit.type='button';
   const display=draftDisplayName(draft);
   edit.setAttribute('aria-label',mailDraftSelecting
    ?(selectedDraftIds.has(draft.id)?'Снять выбор: ':'Выбрать: ')+display
    :'Открыть черновик: '+display+'. Смахните влево для удаления.');
   if(mailDraftSelecting)edit.setAttribute('aria-pressed',String(selectedDraftIds.has(draft.id)));
   const title=create('strong','sv-mail-draft-title',display);title.title=display;
   if(!draft.subject)title.classList.add('is-untitled');
   if(!draft.subject?.trim()&&!draft.body?.trim()&&draft.attachments?.length)title.classList.add('is-file-title');
   const details=create('span','sv-mail-draft-details');
   details.append(create('span','sv-mail-account-tag sv-mail-draft-account',mailAccountName(draft.account)));
   if(draft.attachments?.length){
    const count=create('span','sv-mail-draft-attachment-count');
    count.setAttribute('aria-label','Вложений: '+draft.attachments.length);
    count.append(mailIcon('paperclip'),create('span','',String(draft.attachments.length)));
    details.append(count);
   }
   if(draft.to.trim()){
    const recipient=create('small','sv-mail-draft-recipient','Кому: '+draft.to.trim());
    recipient.title=draft.to.trim();details.append(recipient);
   }
   edit.append(title,details);
   if(draft.subject?.trim()&&draft.body?.trim()){
    const preview=create('small','sv-mail-draft-body-preview',String(draft.body).replace(/\s+/g,' ').trim().slice(0,125));
    edit.append(preview);
   }
   let swipe=null;
   const setActionsOpen=(visible)=>{
    if(mailDraftSelecting)return;
    for(const other of group.querySelectorAll('.sv-mail-draft-row.is-actions-open')){
     if(other!==row){
      other.classList.remove('is-actions-open');
      const action=other.querySelector('.sv-mail-draft-swipe-delete');
      if(action)action.tabIndex=-1;
     }
    }
    row.classList.toggle('is-actions-open',visible);
    if(swipe){swipe.tabIndex=visible?0:-1;swipe.setAttribute('aria-hidden',String(!visible))}
   };
   const selectDraft=()=>{
    if(selectedDraftIds.has(draft.id))selectedDraftIds.delete(draft.id);
    else selectedDraftIds.add(draft.id);
    paintList();
   };
   edit.addEventListener('click',()=>{
    if(mailDraftSelecting){selectDraft();return}
    if(row.classList.contains('is-actions-open')){setActionsOpen(false);return}
    editDraft(draft.id);
   });
   if(mailDraftSelecting){
    const circle=create('span','sv-mail-draft-select-mark');
    circle.setAttribute('aria-hidden','true');
    if(selectedDraftIds.has(draft.id))circle.classList.add('is-checked');
    row.append(circle,edit);
   }else{
    swipe=create('button','sv-mail-draft-swipe-delete');
    swipe.type='button';swipe.tabIndex=-1;
    swipe.setAttribute('aria-label','Удалить черновик: '+display);
    swipe.setAttribute('aria-hidden','true');
    swipe.append(mailIcon('trash'),create('span','','Удалить'));
    swipe.addEventListener('click',()=>removeSelectedDrafts([draft.id]));
    let startTouch=null;
    row.addEventListener('touchstart',event=>{
     const t=event.touches[0];
     if(t)startTouch={x:t.clientX,y:t.clientY};
    },{passive:true});
    row.addEventListener('touchend',event=>{
     if(!startTouch)return;
     const t=event.changedTouches[0];if(!t)return;
     const dx=t.clientX-startTouch.x,dy=t.clientY-startTouch.y;
     startTouch=null;
     if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.25)return;
     if(event.cancelable)event.preventDefault();
     setActionsOpen(dx<0);
    },{passive:false});
    row.addEventListener('touchcancel',()=>{startTouch=null},{passive:true});
    edit.addEventListener('contextmenu',event=>{
     event.preventDefault();setActionsOpen(true);
    });
    edit.addEventListener('keydown',event=>{
     if(event.key==='Delete'||event.key==='Backspace'){
      event.preventDefault();removeSelectedDrafts([draft.id]);
     }
     if(event.key==='Escape'&&row.classList.contains('is-actions-open')){
      event.preventDefault();setActionsOpen(false);
     }
    });
    row.append(edit,swipe);
   }
   group.append(row);
  }
  if(mailDraftSelecting){
   const bottom=create('div','sv-mail-drafts-selection-actions');
   const chosen=selectedDraftIds.size;
   const remove=create('button','sv-mail-drafts-remove-selected',
    chosen?'Удалить · '+chosen:'Выберите черновики');
   remove.type='button';remove.disabled=!chosen;
   remove.addEventListener('click',()=>{if(chosen)removeSelectedDrafts([...selectedDraftIds])});
   bottom.append(remove);content.append(bottom);
  }
 }
 function paintList(){
  content.replaceChildren();
  if(mailEditorOpen){drawEditor();return}
  mailEditorExitHandler=null;
  if(mailCurrent){
   const item=mailExamples.find(m=>m.id===mailCurrent);
   if(item&&mailVisible(item.account)){drawDetails(item);return}
   mailCurrent=null;
  }
  if(mailFolder==='overview'){
   const recent=create('div','sv-mail-recent-head');
   recent.append(create('h3','','Последние письма'));
   recent.append(intent('См. все ›',()=>selectFolder('inbox')));
   content.append(recent);drawExamples(3);return;
  }
  if(mailFolder==='drafts'){drawDrafts();return}
  if(['inbox','starred','archive','review','promotions','spam','trash'].includes(mailFolder)){drawExamples();return}
  content.append(create('p','sv-mail-empty','Отправленные письма появятся после подключения почтового сервиса. Учебные примеры ничего не отправляют.'));
 }
 function paint(){
  const contactsActive=smartContacts?.isOpen()===true;
  page.dataset.svMailMode=contactsActive?'contacts':mailEditorOpen?'editor':mailCurrent?'detail':'overview';
  section.classList.toggle('sv-mail-contacts-active',contactsActive);
  section.dataset.mailFolder=mailFolder;
  section.classList.toggle('sv-mail-composing',mailEditorOpen);
  introCopy.hidden=mailEditorOpen||!!mailCurrent;
  top.hidden=mailEditorOpen||!!mailCurrent;
  searchToggle.hidden=mailEditorOpen||!!mailCurrent;
  connect.hidden=mailEditorOpen||!!mailCurrent||contactsActive;
  const setupScope=inviteScope();
  contactsInvite.hidden=mailEditorOpen||!!mailCurrent||contactsActive||!setupScope;
  guardTrigger.hidden=mailEditorOpen||!!mailCurrent||contactsActive;
  if(mailEditorOpen||mailCurrent){guardOpen=false;guardPanel.hidden=true;}
  scopeNav.replaceChildren();
  for(const [key,label] of [['all','Все'],['personal','Личная'],['business','Рабочая']]){
   const button=create('button','sv-mail-account-switch',label);
   button.type='button';
   button.dataset.mailAccount=key;
   button.setAttribute('aria-pressed',String(mailScope===key));
   button.addEventListener('click',()=>selectScope(key));
   scopeNav.append(button);
  }
  scopeNav.hidden=mailEditorOpen||!!mailCurrent;
  nav.replaceChildren();extraNav.replaceChildren();
  for(const [key,label] of tabs.slice(0,4)){
   const button=create('button','sv-mail-folder');
   button.type='button';button.dataset.mailFolder=key;
   button.setAttribute('aria-current',mailFolder===key?'page':'false');
   button.append(mailIcon(key),create('span','',label));
   const count=folderCount(key);
   if(count)button.append(create('small','sv-mail-folder-count',String(count)));
   button.addEventListener('click',()=>selectFolder(key));nav.append(button);
  }
  // A single Back in the stable titlebar replaces the extra folder arrow.
  for(const [key,label] of tabs.slice(4)){
   // The pending review badge already opens this folder. Do not repeat it in the overflow row.
   if(key==='review')continue;
   const button=intent(label,()=>selectFolder(key));button.classList.add('sv-mail-extra-link');
   if(mailFolder===key)button.setAttribute('aria-current','page');
   if(key==='spam'){
    const total=folderCount('spam');if(total)button.append(create('small','sv-mail-spam-count',String(total)));
   }
   extraNav.append(button);
  }
  extraNav.hidden=mailEditorOpen||!!mailCurrent||mailFolder==='overview';
  nav.hidden=mailEditorOpen||!!mailCurrent;
  searchLabel.hidden=mailEditorOpen||!!mailCurrent||!mailSearchOpen;
  searchToggle.setAttribute('aria-expanded',String(!searchLabel.hidden));
  searchToggle.setAttribute('aria-controls','svMailQuickSearch');
  // Scope switches between personal and work mailbox authorization.
  renderGate();
  window.SEYVEO_CONNECTION_PROMPTS?.refresh();
  compose.hidden=mailEditorOpen||!!mailCurrent;
  info.textContent=mailEditorOpen?'':
   mailCurrent?'Просмотр учебного письма':
   mailFolder==='overview'?'':
   mailFolder==='drafts'?'': // Draft count already belongs to the selected folder tab.
   mailFolder==='sent'?'Отправка пока недоступна':
   mailFolder==='inbox'?'Входящие · предварительный просмотр':
   mailFolder==='starred'?'Важные · предварительный просмотр':
   mailFolder==='archive'?'Архив · предварительный просмотр':
   mailFolder==='review'?'Ожидают вашего решения · учебные письма':
   mailFolder==='promotions'?'Рассылки · учебные письма':
   mailFolder==='spam'?'Спам · учебные письма':'';
  if(mailNotice&&!mailCurrent&&!mailEditorOpen)info.textContent=mailNotice;
  info.hidden=!!mailCurrent||!info.textContent;
  paintList();
 }
 paint();
}
const extensions=new Set(['pdf','txt','md','png','jpg','jpeg','webp']);
function renderFile(file,status,preview,link){
 releaseFile();preview.replaceChildren();link.replaceChildren();
 const extension=String(file.name.split('.').pop()||'').toLowerCase();
 if(!extensions.has(extension)||file.size>20*1024*1024){
  status.textContent='Можно выбрать PDF, TXT, MD, JPG, PNG или WebP до 20 МБ.';
  return;
 }
 status.textContent='Открыт файл: '+file.name;
 const url=URL.createObjectURL(file);fileUrl=url;
 const openLink=create('a','sv-deep-file-link','Открыть оригинал ↗');
 openLink.href=url;openLink.target='_blank';openLink.rel='noopener noreferrer';
 link.append(openLink);
 if(['png','jpg','jpeg','webp'].includes(extension)){
  const img=document.createElement('img');img.src=url;img.alt='Просмотр выбранного документа';
  img.className='sv-deep-file-image';preview.append(img);
 }else if(extension==='pdf'){
  const pdf=document.createElement('iframe');
  pdf.className='sv-deep-file-frame';pdf.title='Предпросмотр выбранного PDF';
  pdf.src=url;preview.append(pdf);
  preview.append(hint('Если просмотр PDF не появился, нажмите «Открыть оригинал».'));
 }else{
  file.text().then(content=>{
   if(fileUrl!==url)return;
   preview.replaceChildren();
   preview.append(create('pre','sv-deep-file-text',content.slice(0,120000)));
   if(content.length>120000)preview.append(hint('Показано начало документа (до 120 000 знаков).'));
  }).catch(()=>{status.textContent='Не удалось прочитать файл. Попробуйте открыть оригинал.'});
 }
}
function documentsView(){
 const section=shelf();
 if(window.SEYVEO_DOCUMENT_CENTER?.mount?.(section)){
  body.append(section);
  return;
 }
 section.append(create('p','sv-deep-lead','Ваши документы — под вашим контролем.'));
 section.append(paragraph('Выберите файл на телефоне. Он раскроется прямо здесь — без отправки на сервер.'));
 const picker=document.createElement('input');picker.type='file';picker.hidden=true;
 picker.accept='.pdf,.txt,.md,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,image/jpeg,image/png,image/webp';
 picker.id='sayviDocumentFile';
 const status=paragraph('Документ пока не выбран.','sv-deep-status');
 status.setAttribute('role','status');
 const preview=create('div','sv-deep-file-preview');
 const link=create('div','sv-deep-file-actions');
 picker.addEventListener('change',()=>{
  const file=picker.files?.[0];if(file)renderFile(file,status,preview,link);
  picker.value='';
 });
 section.append(actions(intent('Выбрать документ',()=>picker.click(),true),
  intent('Мои записи',()=>{
   // The existing Notebook remains authoritative for saved text and scans.
   $('navHome')?.click();
   window.SEYVEO_SAYVI_SURFACES?.openPersonal?.('notes');
  })),
  picker,status,link,preview,
  hint('Файл открыт только в этом сеансе. Он не загружается и не сохраняется автоматически. Для постоянного архива потребуется отдельное защищённое хранилище.'));
 body.append(section);
}
function openExistingHealth(){
 const existing=document.querySelector('#calendarSpaces [data-calendar-space="health"]');
 if(existing){existing.click();return true}
 return false;
}
function healthView(){
 demoScenario('health');
 const section=shelf();
 section.append(create('p','sv-deep-lead','Здесь важны только ваши настоящие данные.'));
 section.append(paragraph('Откройте давление и пульс из личного пространства. Я не придумываю показатели и не ставлю диагнозы.'));
 const p=paragraph('В этом разделе будут ваши записи, если вы сами их добавили.','sv-deep-expand');p.hidden=true;
 const why=intent('Как это устроено',()=>{p.hidden=!p.hidden;why.setAttribute('aria-expanded',String(!p.hidden))});
 why.setAttribute('aria-expanded','false');
 section.append(actions(intent('Мои показатели',openExistingHealth,true),why),p);
 section.append(hint('Показатели здоровья остаются в существующем локальном разделе SEYVEO. Подключения Apple Health пока нет.'));
 body.append(section);
}
/* Documents local search: one header action reuses the existing encrypted-shelf filter. */
function installDocumentsSearch(){
 const header=title.closest('.sv-deep-top');
 if(!header)return;
 header.querySelector('.sv-doc-head-tools')?.remove();
 if(page.dataset.svSubject!=='contract')return;
 const tools=create('div','sv-doc-head-tools');
 const toggle=create('button','sv-doc-head-icon sv-doc-search-toggle');
 toggle.type='button';
 toggle.setAttribute('aria-label','Поиск по документам');
 toggle.setAttribute('aria-expanded','false');
 toggle.setAttribute('aria-controls','svDocQuickSearch');
 toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.4"/><path d="m16 16 5 5"/></svg>';
 tools.append(toggle);
 header.append(tools);
 const row=create('label','sv-doc-search-row');
 row.id='svDocQuickSearch';row.hidden=true;
 const glassIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');
 glassIcon.setAttribute('viewBox','0 0 24 24');glassIcon.setAttribute('aria-hidden','true');
 glassIcon.innerHTML='<circle cx="10.8" cy="10.8" r="6.4"/><path d="m16 16 5 5"/>';
 const field=create('input','sv-doc-search-field');
 field.type='search';field.placeholder='Поиск по названию документа';
 field.autocomplete='off';field.setAttribute('aria-label','Поиск по файлам в выбранном архиве');
 row.append(glassIcon,field);body.prepend(row);
 const setOpen=open=>{
  row.hidden=!open;
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Закрыть поиск документов':'Поиск по документам');
  if(open)field.focus({preventScroll:true});
  else{field.value='';window.SEYVEO_DOCUMENT_SHELF?.search?.('');}
 };
 toggle.addEventListener('click',()=>setOpen(row.hidden));
 field.addEventListener('input',()=>window.SEYVEO_DOCUMENT_SHELF?.search?.(field.value));
 field.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   event.preventDefault();setOpen(false);toggle.focus({preventScroll:true});
  }
 });
}
function render(kind){
 const descriptor=subjects[kind];if(!descriptor)return false;
 releaseFile();page.dataset.svSubject=kind;
 // This Back button is shared; don't leak Mail's graphite inline face
 // onto Documents and Health when switching views.
 if(kind!=='mail'){
  for(const property of ['background','background-image','border-radius','box-shadow','color']){
   back.style.removeProperty(property);
  }
 }
 // Documents use one real navigation row, with Back beside the title.
 // Keep the same Back element and click handler across every surface.
 const header=title.closest('.sv-deep-top');
 if(header){
  if(kind==='contract'&&back.parentElement!==header)header.prepend(back);
  else if(kind!=='contract'&&back.parentElement!==page)page.prepend(back);
 }
 subject.textContent=descriptor.label;title.textContent=kind==='contract'&&returnDestination?.hash==='#life'?'Личные документы':descriptor.title;intro.textContent=descriptor.intro;
 footer.textContent=kind==='contract'?'Архив с локальным шифрованием — экспериментальная функция. Без облачного восстановления, биометрии и подключённого ИИ. Для особо важных документов используйте проверенное хранилище.':kind==='mail'?'':localOnly;
 footer.hidden=kind==='mail';
 setArt(kind);body.replaceChildren();
 if(kind==='mail')mailView();
 else if(kind==='contract')documentsView();
 else healthView();
 installDocumentsSearch();
 page.classList.remove('sv-deep-enter');
 void page.offsetWidth;page.classList.add('sv-deep-enter');
 return true;
}
function currentKind(){
 if(location.hash==='#sayvi-mail')return 'mail';
 if(location.hash==='#sayvi-documents')return 'contract';
 if(location.hash==='#sayvi-health')return 'health';
 return null;
}
function sync(){
 const kind=currentKind();
 if(kind){
  // The document vault must lock even when switching directly to mail or health.
  if(kind!=='contract')window.SEYVEO_DOCUMENT_CENTER?.destroy?.();
  updateBackDestination();
  render(kind);
 }else{
  releaseFile();
  window.SEYVEO_DOCUMENT_CENTER?.destroy?.();
  returnDestination=null;
  updateBackDestination();
 }
}
function open(kind,context){
 const target=routes[kind];
 if(!target)return false;
 // Keep account choice consistent even when mail is already open.
 // An early return here previously preserved the wrong inbox scope.
 if(kind==='mail'){
  if(context==='business')mailScope='business';
  else if(context==='personal')mailScope='personal';
  else if(context==='all')mailScope='all';
  else if(location.hash==='#life')mailScope='personal';
  else if(location.hash==='#tasks')mailScope='business';
  // Opening Mail from the app always starts in the compact overview.
  mailFolder='overview';mailEditorOpen=false;mailCurrent=null;
  mailEditingId=null;mailSearchOpen=false;mailSearch='';
 }
 if(location.hash===target){sync();return true}
 // Capture the calling section before changing the hash.
 if(!currentKind())rememberOrigin(context);
 if(kind==='contract')window.SEYVEO_DOCUMENT_CENTER?.setArea?.(context==='business'?'business':'personal');
 location.hash=target;
 return true;
}
function openPersonal(kind){
 const choice=document.querySelector('#calendarSpaces [data-calendar-space="'+kind+'"]');
 if(choice){choice.click();return true}
 return false;
}
back.addEventListener('click',()=>{
 // One visible Back: inside Business Documents, leave approvals first.
 // Employees cannot enter the owner vault, so their Back exits normally.
 if(currentKind()==='contract'&&
    window.SEYVEO_DOCUMENT_CENTER?.backFromNested?.())return;
 if(currentKind()==='mail'){
  if(typeof mailContactsExitHandler==='function'&&mailContactsExitHandler())return;
  if(typeof mailGuardExitHandler==='function'&&mailGuardExitHandler())return;
  if(typeof mailEditorExitHandler==='function'){mailEditorExitHandler();return}
  if(mailCurrent){mailCurrent=null;sync();return}
  if(mailFolder!=='overview'){mailFolder='overview';sync();return}
 }
 const destination=returnDestination?.hash;
 if(destination)location.hash=destination;
 else $('navHome')?.click();
});
window.addEventListener('hashchange',sync);
window.addEventListener('pagehide',releaseFile);
window.SEYVEO_SAYVI_SURFACES=Object.freeze({open,render,sync,openPersonal});
sync();
})();