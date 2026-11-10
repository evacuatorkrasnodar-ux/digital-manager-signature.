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
 // Use the existing Management → Connections page, not a fake inbox.
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
let mailScope='all',mailComposeScope=null;
let mailDrafts=[],mailSearch='',mailShowExamples=true;
const mailAccountName=account=>account==='business'?'Рабочая':'Личная';
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
const mailIcons=Object.freeze({
 inbox:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
 sent:'<path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/>',
 drafts:'<path d="M7 3h8l5 5v13H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/><path d="M14 3v6h6M8 14h8M8 18h6"/>',
 starred:'<path d="m12 2 3 6.4 7 .9-5.1 5 .9 7-5.8-3.2-5.8 3.2.9-7-5.1-5 7-.9L12 2Z"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 10v7m4-7v7"/>',
 archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v12h14V9M10 14h4"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 pencil:'<path d="M12 20h9M3 17l12-12 4 4L7 21H3v-4ZM14 6l4 4"/>',
 back:'<path d="m15 5-7 7 7 7"/>',
 paperclip:'<path d="m8 12 6-6a4 4 0 0 1 6 6l-8 8a6 6 0 0 1-9-9l8-8"/>',
 settings:'<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>'
});
function mailIcon(name){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
 svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');
 svg.setAttribute('stroke-linejoin','round');
 svg.innerHTML=mailIcons[name]||mailIcons.inbox;return svg;
}
function mailView(){
 mailEditorExitHandler=null;
 const section=shelf();section.classList.add('sv-mail-workspace');
 const top=create('div','sv-mail-top-actions');
 const topButtons=create('div','sv-mail-top-buttons');
 const searchToggle=create('button','sv-mail-icon-button sv-mail-search-toggle');searchToggle.type='button';
 searchToggle.setAttribute('aria-label','Поиск по почте');searchToggle.append(mailIcon('search'));
 searchToggle.addEventListener('click',()=>{mailSearchOpen=!mailSearchOpen;paint();if(mailSearchOpen)searchInput.focus()});
 const connect=create('button','sv-mail-icon-button sv-mail-connect');connect.type='button';
 connect.setAttribute('aria-label','Подключить почтовый ящик');connect.append(mailIcon('settings'));
 connect.addEventListener('click',openConnect);
 const compose=create('button','sv-mail-icon-button sv-mail-compose');compose.type='button';
 compose.setAttribute('aria-label','Написать письмо');compose.append(mailIcon('pencil'));
 compose.addEventListener('click',()=>openEditor());
 // Show only Search and Compose in the Mail titlebar.
 // The existing connection action is available inside the expanded Search.
 // Approved Mail header: Compose first, Search at the far-right edge.
 topButtons.append(compose,searchToggle);
 const introCopy=create('div','sv-mail-introduction-text');
 introCopy.append(create('h2','sv-mail-introduction-title','Почта'));
 // Reuse the original navigation button inside the visible Mail titlebar.
 // The legacy .sv-deep-top is hidden for Mail; leaving Back outside it
 // made navigation disappear or float independently of the title.
 top.append(back,introCopy,topButtons);
 const searchLabel=create('div','sv-mail-search');searchLabel.id='svMailQuickSearch';
 searchLabel.append(mailIcon('search'));
 const searchInput=create('input','sv-mail-search-input');
 searchInput.type='search';searchInput.placeholder='Поиск по письмам';
 searchInput.setAttribute('aria-label','Поиск по письмам и черновикам');
 searchInput.autocomplete='off';searchInput.value=mailSearch;
 searchInput.addEventListener('input',()=>{mailSearch=searchInput.value.trim().toLocaleLowerCase('ru');paintList()});
 connect.title='Подключения почты';
 connect.classList.add('sv-mail-search-connect');
 searchLabel.append(searchInput,connect);
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
 section.append(top,searchLabel,scopeNav,nav,extraNav,info,content);body.append(section);
 const tabs=[['inbox','Входящие'],['sent','Отправленные'],['drafts','Черновики'],['starred','Важные'],['archive','Архив'],['trash','Корзина']];
 function folderCount(key){
  if(key==='drafts')return mailDrafts.filter(d=>mailVisible(d.account)).length;
  if(key==='inbox'&&mailShowExamples)return mailExamples.filter(m=>mailVisible(m.account)&&!m.trashed&&!m.archived&&m.unread).length;
  return 0;
 }
 function openEditor(id=null,reply=null){
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
  mailFolder=folder;mailCurrent=null;mailEditorOpen=false;mailEditingId=null;paint();
 }
 function selectScope(account){
  if(!['all','personal','business'].includes(account)||account===mailScope)return;
  mailScope=account;mailCurrent=null;mailEditorOpen=false;mailEditingId=null;
  mailSearch='';searchInput.value='';paint();
 }
 function editDraft(id){
  if(!mailDrafts.some(d=>d.id===id))return;
  openEditor(id);
 }
 function removeDraft(id){
  mailDrafts=mailDrafts.filter(d=>d.id!==id);
  mailEditingId=null;mailEditorOpen=false;mailFolder='drafts';paint();
 }
 function viewExample(item){
  item.unread=false;mailCurrent=item.id;mailEditorOpen=false;paint();
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
   button.addEventListener('click',()=>{if(button.disabled)return;accountValue=value;mailComposeScope=value;refreshAccount()});
   senderButtons.push(button);senderOptions.append(button);
  }
  accountField.append(senderCaption,senderOptions);form.append(accountField);refreshAccount();
  const accountHelp=create('p','sv-mail-account-help','Адрес отправителя появится после подключения почты.');
  form.append(accountHelp);
  const makeField=(labelText,name,tag,value,type)=>{
   const label=create('label','sv-mail-field');
   label.append(create('span','sv-mail-field-label',labelText));
   const input=create(tag,'sv-mail-input');input.dataset.mailField=name;
   if(type)input.type=type;
   if(tag==='textarea')input.rows=6;
   input.maxLength=name==='body'?10000:name==='to'?254:240;input.value=value||'';
   label.append(input);form.append(label);return input;
  };
  const to=makeField('Кому','to','input',original?.to,'email');
  const subj=makeField('Тема','subject','input',original?.subject,'text');
  const message=makeField('Сообщение','body','textarea',original?.body);
  const status=create('p','sv-mail-feedback');status.setAttribute('role','status');
  const before={to:original?.to||'',subject:original?.subject||'',body:original?.body||'',account:original?.account||mailComposeScope||''};
  const leaveSheet=create('dialog','sv-mail-account-sheet sv-mail-leave-sheet');
  leaveSheet.setAttribute('aria-label','Выйти из письма');
  const leaveHandle=create('div','sv-mail-sheet-handle');leaveHandle.setAttribute('aria-hidden','true');
  const leaveHead=create('div','sv-mail-sheet-head');
  const stay=create('button','sv-mail-sheet-cancel','Остаться');stay.type='button';stay.addEventListener('click',()=>leaveSheet.close());
  leaveHead.append(create('h3','sv-mail-sheet-title','Сохранить письмо?'),stay);
  const leaveChoices=create('div','sv-mail-sheet-options');
  const exitWithoutSave=create('button','sv-mail-sheet-option','Выйти без сохранения');exitWithoutSave.type='button';
  const saveBeforeExit=create('button','sv-mail-sheet-option','Сохранить черновик');saveBeforeExit.type='button';
  const leaveEditor=()=>{mailEditorOpen=false;mailEditingId=null;mailCurrent=mailEditorReturnId;mailEditorReturnId=null;mailEditorExitHandler=null;paint()};
  exitWithoutSave.addEventListener('click',()=>{leaveSheet.close();leaveEditor()});
  saveBeforeExit.addEventListener('click',()=>{leaveSheet.close();form.requestSubmit()});
  leaveChoices.append(saveBeforeExit,exitWithoutSave);leaveSheet.append(leaveHandle,leaveHead,leaveChoices);
  leaveSheet.addEventListener('click',event=>{if(event.target===leaveSheet)leaveSheet.close()});
  form.append(leaveSheet);
  mailEditorExitHandler=()=>{
   const changed=to.value!==before.to||subj.value!==before.subject||message.value!==before.body||accountValue!==before.account;
   if(!changed){leaveEditor();return}
   if(!leaveSheet.open)leaveSheet.showModal();
  };
  form.addEventListener('submit',event=>{
   event.preventDefault();
   const recipient=to.value.trim(),subjectText=subj.value.trim(),bodyText=message.value.trim();
   if(!['personal','business'].includes(accountValue)){
    status.textContent='Сначала выберите личную или рабочую почту.';senderButtons[0]?.focus();return;
   }
   if(!recipient&&!subjectText&&!bodyText){status.textContent='Напишите письмо или укажите тему.';return}
   const item={id:original?.id||'mail-draft-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
    account:original?.account||accountValue,
    to:recipient.slice(0,254),subject:subjectText.slice(0,240),body:bodyText.slice(0,10000)};
   if(original)mailDrafts=mailDrafts.map(d=>d.id===item.id?item:d);
   else mailDrafts.unshift(item);
   mailFolder='drafts';mailEditorOpen=false;mailEditingId=null;mailEditorReturnId=null;mailEditorExitHandler=null;paint();
   info.textContent='Черновик сохранён в текущем сеансе. Ничего не отправлено.';
  });
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
  message.addEventListener('input',()=>{preview.hidden=true});
  const save=create('button','sv-deep-intent','Сохранить черновик');save.type='submit';
  save.classList.add('sv-mail-save-trigger');
  const send=create('button','sv-deep-intent sv-deep-intent--lead','Отправить');
  send.type='button';send.classList.add('sv-mail-send-trigger');
  send.setAttribute('aria-describedby','svMailSendUnavailable');
  send.addEventListener('click',()=>{
   status.textContent='Для отправки нужно подключить почтовый ящик. Письмо не отправлено. Можно сохранить его как черновик.';
   status.scrollIntoView({block:'nearest',behavior:'smooth'});
  });
  const primaryActions=create('div','sv-mail-primary-actions');
  primaryActions.append(save,send);
  actions.append(polish,primaryActions);
  const mailDisclaimer=create('p','sv-mail-disclaimer','Отправка пока недоступна: почтовый сервис не подключён.');
  mailDisclaimer.id='svMailSendUnavailable';
  form.append(actions,preview,status,mailDisclaimer);
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
  opts.append(iconButton('starred',item.starred?'Убрать из важных':'Важное',()=>{
   item.starred=!item.starred;paint();
  }),iconButton('archive',item.archived?'Вернуть во входящие':'В архив · демо',()=>{
   item.archived=!item.archived;mailCurrent=null;paint();
  }),iconButton('trash',item.trashed?'Восстановить из корзины':'Удалить пример',()=>{
   item.trashed=!item.trashed;mailCurrent=null;paint();
  }));
  heading.append(backButton,opts);
  panel.append(heading,create('span','sv-mail-account-tag',mailAccountName(item.account)),create('h2','sv-mail-detail-title',item.subject));
  const person=create('div','sv-mail-detail-person');
  person.append(create('span','sv-mail-avatar',item.initial));
  const who=create('div','sv-mail-detail-who');
  who.append(create('strong','',item.from),create('span','',item.when+' · пример, не получено из почты'));
  person.append(who);panel.append(person);
  const message=create('p','sv-mail-detail-text',item.body);panel.append(message);
  if(item.attachment){
   const example=create('div','sv-mail-attachment');
   example.append(mailIcon('paperclip'),create('span','','Пример вложения · файла нет'));
   panel.append(example);
  }
  const actions=create('div','sv-mail-detail-actions');
  const reply=intent('Ответить',()=>openEditor(null,item),true);
  reply.classList.add('sv-mail-reply-action');
  // Respect the approved capsule shape even if a legacy button reset has !important.
  reply.style.setProperty('border-radius','999px','important');
  const help=intent('Сэйви',()=>{
   note.hidden=!note.hidden;
   help.setAttribute('aria-expanded',String(!note.hidden));

  });
  help.classList.add('sv-mail-assist-action');
  help.style.setProperty('border-radius','999px','important');
  help.prepend(create('span','sv-mail-assist-symbol sv-sayvi-symbol',''));
  help.setAttribute('aria-expanded','false');
  help.setAttribute('aria-controls','svMailSayviAssist');
  actions.append(reply,help);panel.append(actions);
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
 function drawExamples(limit=0){

  if(!mailShowExamples){content.append(create('p','sv-mail-empty','Почтовый ящик ещё не подключён. Подключите его, чтобы видеть настоящие письма.'));return}
  const inFolder=mailExamples.filter(m=>{
   if(!mailVisible(m.account))return false;
   if(mailFolder==='trash')return m.trashed;
   if(mailFolder==='archive')return m.archived&&!m.trashed;
   if(m.trashed)return false;
   if(mailFolder==='starred')return m.starred&&!m.archived;
   return !m.archived;
  });
  const q=mailSearch.trim();
  const matched=inFolder.filter(m=>!q||[m.from,m.subject,m.preview,m.body].join(' ').toLocaleLowerCase('ru').includes(q));
  if(!matched.length){content.append(create('p','sv-mail-empty',q?'По этому запросу примеров нет.':'Здесь пока нет учебных писем.'));return}
  const group=create('div','sv-mail-letter-group');content.append(group);
  const shown=limit?matched.slice(0,limit):matched;
  const showAccountTags=mailScope==='all'&&new Set(shown.map(m=>m.account)).size>1;
  for(const item of shown){
   const row=create('button','sv-mail-letter');
   row.type='button';row.classList.toggle('is-unread',item.unread);
   const avatar=create('span','sv-mail-avatar',item.initial);
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
   row.setAttribute('aria-label',item.from+', '+item.subject+', пример');
   row.addEventListener('click',()=>viewExample(item));group.append(row);
  }
 }
 function drawDrafts(){
  const list=mailDrafts.filter(d=>mailVisible(d.account)&&(!mailSearch||[d.to,d.subject,d.body].join(' ').toLocaleLowerCase('ru').includes(mailSearch)));
  if(!list.length){content.append(create('p','sv-mail-empty',mailSearch?'Черновики не найдены.':'Пока нет черновиков. Нажмите «Написать», чтобы создать первый.'));return}
  for(const draft of list){
   const row=create('div','sv-mail-draft-row');
   const edit=create('button','sv-mail-draft-content');
   edit.type='button';edit.append(create('strong','',draft.subject||'Без темы'));
   edit.append(create('small','',draft.to?'Кому: '+draft.to:'Адресат не указан'));
   edit.append(create('small','sv-mail-account-tag',mailAccountName(draft.account)));
   edit.addEventListener('click',()=>editDraft(draft.id));
   const remove=iconButton('trash','Удалить черновик',()=>removeDraft(draft.id));
   row.append(edit,remove);content.append(row);
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
  if(mailFolder==='inbox'||mailFolder==='starred'||mailFolder==='archive'||mailFolder==='trash'){drawExamples();return}
  content.append(create('p','sv-mail-empty','Отправленные письма появятся после подключения почтового сервиса. Учебные примеры ничего не отправляют.'));
 }
 function paint(){
  page.dataset.svMailMode=mailEditorOpen?'editor':mailCurrent?'detail':'overview';
  section.dataset.mailFolder=mailFolder;
  section.classList.toggle('sv-mail-composing',mailEditorOpen);
  introCopy.hidden=mailEditorOpen||!!mailCurrent;
  top.hidden=mailEditorOpen||!!mailCurrent;
  searchToggle.hidden=mailEditorOpen||!!mailCurrent;
  connect.hidden=mailEditorOpen||!!mailCurrent;
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
   const button=intent(label,()=>selectFolder(key));button.classList.add('sv-mail-extra-link');
   if(mailFolder===key)button.setAttribute('aria-current','page');
   extraNav.append(button);
  }
  extraNav.hidden=mailEditorOpen||!!mailCurrent||mailFolder==='overview';
  nav.hidden=mailEditorOpen||!!mailCurrent;
  searchLabel.hidden=mailEditorOpen||!!mailCurrent||!mailSearchOpen;
  searchToggle.setAttribute('aria-expanded',String(!searchLabel.hidden));
  searchToggle.setAttribute('aria-controls','svMailQuickSearch');
  compose.hidden=mailEditorOpen||!!mailCurrent;
  info.textContent=mailEditorOpen?'':
   mailCurrent?'Просмотр учебного письма':
   mailFolder==='overview'?'':
   mailFolder==='drafts'?'Ваши черновики · '+mailDrafts.filter(d=>mailVisible(d.account)).length:
   mailFolder==='sent'?'Отправка пока недоступна':
   mailFolder==='inbox'?'Входящие · предварительный просмотр':
   mailFolder==='starred'?'Важные · предварительный просмотр':
   mailFolder==='archive'?'Архив · предварительный просмотр':'Корзина · предварительный просмотр';
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