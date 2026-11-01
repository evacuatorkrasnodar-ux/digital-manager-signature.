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
 contract:{label:'ДОКУМЕНТЫ · SEYVEO',title:'Центр документов',intro:'Открывайте файлы, создавайте черновики и готовьте их к передаче. Интеллект Сэйви будет подключён отдельно.',symbol:'contract'},
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
 $('navManage')?.click();
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
let mailFolder='inbox',mailEditorOpen=false,mailEditingId=null,mailCurrent=null;
let mailDrafts=[],mailSearch='',mailShowExamples=true;
const mailExamples=[
 {id:'example-andrey',initial:'А',from:'Андрей · клиент',subject:'Стоимость доставки',preview:'Здравствуйте! Подскажите, сколько будет стоить доставка?',body:'Здравствуйте!\n\nПодскажите, пожалуйста, сколько будет стоить доставка и какие сроки возможны?\n\nСпасибо!\nАндрей',when:'10:24',unread:true,starred:false,attachment:false,archived:false,trashed:false},
 {id:'example-project',initial:'П',from:'Проектный отдел',subject:'Согласование плана работ',preview:'Подготовили обновлённый план. Посмотрите, пожалуйста.',body:'Добрый день!\n\nПодготовили обновлённый план работ. Будем рады вашим замечаниям.\n\nС уважением,\nПроектный отдел',when:'09:17',unread:true,starred:false,attachment:false,archived:false,trashed:false},
 {id:'example-finance',initial:'Ф',from:'Финансовый отдел',subject:'Отчёт за месяц',preview:'Пример отчёта и сводных показателей за месяц.',body:'Добрый день!\n\nНаправляем пример ежемесячного отчёта. В рабочей версии здесь можно будет просматривать настоящие вложения.\n\nФинансовый отдел',when:'Вчера',unread:false,starred:false,attachment:true,archived:false,trashed:false},
 {id:'example-team',initial:'Р',from:'Руководство',subject:'Совещание в пятницу',preview:'Подтвердите, пожалуйста, удобное время встречи.',body:'Коллеги, добрый день!\n\nПредлагаем провести совещание в пятницу. Подтвердите удобное время.\n\nСпасибо!',when:'Вчера',unread:false,starred:true,attachment:false,archived:false,trashed:false},
 {id:'example-delivery',initial:'С',from:'Снабжение',subject:'Поставка оборудования',preview:'Условия поставки согласованы. Подробности внутри.',body:'Здравствуйте!\n\nСроки и основные условия поставки оборудования согласованы.\n\nС уважением,\nОтдел снабжения',when:'29 окт',unread:false,starred:false,attachment:false,archived:false,trashed:false}
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
 paperclip:'<path d="m8 12 6-6a4 4 0 0 1 6 6l-8 8a6 6 0 0 1-9-9l8-8"/>'
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
 const section=shelf();section.classList.add('sv-mail-workspace');
 const top=create('div','sv-mail-top-actions');
 const brand=create('div','sv-mail-brand');
 brand.append(create('span','sv-mail-brand-name','SEYVEO'),create('span','sv-mail-brand-sub','Mail'));
 const topButtons=create('div','sv-mail-top-buttons');
 const compose=intent('Написать',()=>openEditor(),true);
 compose.classList.add('sv-mail-compose');compose.prepend(mailIcon('pencil'));
 const connect=intent('Подключить',openConnect);
 connect.classList.add('sv-mail-connect');
 topButtons.append(connect,compose);top.append(brand,topButtons);
 const searchLabel=create('label','sv-mail-search');
 searchLabel.append(mailIcon('search'));
 const searchInput=create('input','sv-mail-search-input');
 searchInput.type='search';searchInput.placeholder='Поиск по письмам';
 searchInput.setAttribute('aria-label','Поиск по письмам и черновикам');
 searchInput.autocomplete='off';searchInput.value=mailSearch;
 searchInput.addEventListener('input',()=>{mailSearch=searchInput.value.trim().toLocaleLowerCase('ru');paintList()});
 searchLabel.append(searchInput);
 const nav=create('nav','sv-mail-toolbar');nav.setAttribute('aria-label','Папки почты');
 const info=create('div','sv-mail-info');info.setAttribute('role','status');info.setAttribute('aria-live','polite');
 const content=create('div','sv-mail-list');
 const foot=create('p','sv-mail-foot');
 foot.textContent='Настоящая отправка и получение писем заработают после подключения почтового сервиса.';
 section.append(top,searchLabel,nav,info,content,foot);body.append(section);
 const tabs=[['inbox','Входящие'],['sent','Отправленные'],['drafts','Черновики'],['starred','Важные'],['trash','Корзина']];
 function folderCount(key){
  if(key==='drafts')return mailDrafts.length;
  if(key==='inbox'&&mailShowExamples)return mailExamples.filter(m=>!m.trashed&&!m.archived&&m.unread).length;
  return 0;
 }
 function openEditor(id=null,reply=null){
  mailEditingId=id;mailEditorOpen=true;mailCurrent=null;
  if(reply)mailEditingId=null;
  paint();
  if(reply){
   const subjectField=content.querySelector('[data-mail-field="subject"]');
   if(subjectField)subjectField.value='Re: '+reply.subject;
   info.textContent='Черновик ответа на учебный пример — не отправляется.';
  }
  content.querySelector('[data-mail-field="to"]')?.focus();
 }
 function selectFolder(folder){
  mailFolder=folder;mailCurrent=null;mailEditorOpen=false;mailEditingId=null;paint();
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
  form.append(create('h2','sv-mail-editor-title',original?'Изменить черновик':'Новое письмо'));
  const makeField=(labelText,name,tag,value,type)=>{
   const label=create('label','sv-mail-field');
   label.append(create('span','sv-mail-field-label',labelText));
   const input=create(tag,'sv-mail-input');input.dataset.mailField=name;
   if(type)input.type=type;
   if(tag==='textarea')input.rows=7;
   input.maxLength=name==='body'?10000:name==='to'?254:240;input.value=value||'';
   label.append(input);form.append(label);return input;
  };
  const to=makeField('Кому','to','input',original?.to,'email');
  const subj=makeField('Тема','subject','input',original?.subject,'text');
  const message=makeField('Сообщение','body','textarea',original?.body);
  const status=create('p','sv-mail-feedback');status.setAttribute('role','status');
  form.addEventListener('submit',event=>{
   event.preventDefault();
   const recipient=to.value.trim(),subjectText=subj.value.trim(),bodyText=message.value.trim();
   if(!recipient&&!subjectText&&!bodyText){status.textContent='Напишите письмо или укажите тему.';return}
   const item={id:original?.id||'mail-draft-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
    to:recipient.slice(0,254),subject:subjectText.slice(0,240),body:bodyText.slice(0,10000)};
   if(original)mailDrafts=mailDrafts.map(d=>d.id===item.id?item:d);
   else mailDrafts.unshift(item);
   mailFolder='drafts';mailEditorOpen=false;mailEditingId=null;paint();
   info.textContent='Черновик сохранён в текущем сеансе. Ничего не отправлено.';
  });
  const actions=create('div','sv-mail-editor-actions');
  const save=create('button','sv-deep-intent sv-deep-intent--lead','Сохранить черновик');save.type='submit';
  const cancel=intent('Отмена',()=>{mailEditorOpen=false;mailEditingId=null;paint()});
  actions.append(save,cancel);
  form.append(actions,status,create('p','sv-mail-disclaimer','Пока нет подключённого ящика, отправка отключена. Черновик остаётся только в памяти этого сеанса.'));
  content.append(form);
 }
 function drawDetails(item){
  const panel=create('article','sv-mail-detail');
  const heading=create('div','sv-mail-detail-bar');
  const backButton=iconButton('back','Вернуться к списку',()=>{mailCurrent=null;paint()});
  const label=create('span','sv-mail-detail-demo','УЧЕБНЫЙ ПРИМЕР');
  const opts=create('div','sv-mail-detail-tools');
  opts.append(iconButton('starred',item.starred?'Убрать из важных':'Важное',()=>{
   item.starred=!item.starred;paint();
  }),iconButton('archive','В архив · демо',()=>{
   item.archived=true;mailCurrent=null;paint();
  }),iconButton('trash','Удалить пример',()=>{
   item.trashed=true;mailCurrent=null;paint();
  }));
  heading.append(backButton,label,opts);
  panel.append(heading,create('h2','sv-mail-detail-title',item.subject));
  const person=create('div','sv-mail-detail-person');
  person.append(create('span','sv-mail-avatar',item.initial));
  const who=create('div','sv-mail-detail-who');
  who.append(create('strong','',item.from),create('span','',item.when+' · учебное письмо, не из почты'));
  person.append(who);panel.append(person);
  const message=create('p','sv-mail-detail-text',item.body);panel.append(message);
  if(item.attachment){
   const example=create('div','sv-mail-attachment');
   example.append(mailIcon('paperclip'),create('span','','Пример вложения · файла нет'));
   panel.append(example);
  }
  const actions=create('div','sv-mail-detail-actions');
  const reply=intent('Ответить',()=>openEditor(null,item),true);reply.prepend(mailIcon('back'));
  const help=intent('✧ Сэйви',()=>{
   note.hidden=!note.hidden;
  });
  actions.append(reply,help);panel.append(actions);
  const note=create('div','sv-mail-sayvi-note','Сэйви поможет подготовить ответ после подключения ИИ. Сейчас вы можете написать и сохранить черновик самостоятельно.');
  note.hidden=true;panel.append(note);
  content.append(panel);
 }
 function drawExamples(){
  const banner=create('div','sv-mail-demo-banner');
  banner.append(create('span','sv-mail-demo-mark','ДЕМО'),create('span','', 'Письма вымышлены — так будет выглядеть ваша почта.'));
  const toggle=intent(mailShowExamples?'Скрыть':'Показать',()=>{mailShowExamples=!mailShowExamples;paint()});
  toggle.classList.add('sv-mail-demo-toggle');banner.append(toggle);content.append(banner);
  if(!mailShowExamples){content.append(create('p','sv-mail-empty','Почтовый ящик ещё не подключён. Подключите его, чтобы видеть настоящие письма.'));return}
  const inFolder=mailExamples.filter(m=>{
   if(mailFolder==='trash')return m.trashed;
   if(m.trashed)return false;
   if(mailFolder==='starred')return m.starred&&!m.archived;
   return !m.archived;
  });
  const q=mailSearch.trim();
  const matched=inFolder.filter(m=>!q||[m.from,m.subject,m.preview,m.body].join(' ').toLocaleLowerCase('ru').includes(q));
  if(!matched.length){content.append(create('p','sv-mail-empty',q?'По этому запросу примеров нет.':'Здесь пока нет учебных писем.'));return}
  for(const item of matched){
   const row=create('button','sv-mail-letter');
   row.type='button';row.classList.toggle('is-unread',item.unread);
   const avatar=create('span','sv-mail-avatar',item.initial);
   const detail=create('span','sv-mail-letter-details');
   const sender=create('span','sv-mail-letter-sender',item.from);
   const titleText=create('strong','sv-mail-letter-subject',item.subject);
   const preview=create('span','sv-mail-letter-preview',item.preview);
   detail.append(sender,titleText,preview);
   const meta=create('span','sv-mail-letter-meta');
   meta.append(create('time','',item.when));
   if(item.attachment)meta.append(mailIcon('paperclip'));
   if(item.starred)meta.append(mailIcon('starred'));
   if(item.unread)row.append(create('span','sv-mail-unread-dot'));
   row.append(avatar,detail,meta);
   row.setAttribute('aria-label',item.from+', '+item.subject+', пример');
   row.addEventListener('click',()=>viewExample(item));content.append(row);
  }
 }
 function drawDrafts(){
  const list=mailDrafts.filter(d=>!mailSearch||[d.to,d.subject,d.body].join(' ').toLocaleLowerCase('ru').includes(mailSearch));
  if(!list.length){content.append(create('p','sv-mail-empty',mailSearch?'Черновики не найдены.':'Пока нет черновиков. Нажмите «Написать», чтобы создать первый.'));return}
  for(const draft of list){
   const row=create('div','sv-mail-draft-row');
   const edit=create('button','sv-mail-draft-content');
   edit.type='button';edit.append(create('strong','',draft.subject||'Без темы'));
   edit.append(create('small','',draft.to?'Кому: '+draft.to:'Адресат не указан'));
   edit.addEventListener('click',()=>editDraft(draft.id));
   const remove=iconButton('trash','Удалить черновик',()=>removeDraft(draft.id));
   row.append(edit,remove);content.append(row);
  }
 }
 function paintList(){
  content.replaceChildren();
  if(mailEditorOpen){drawEditor();return}
  if(mailCurrent){
   const item=mailExamples.find(m=>m.id===mailCurrent);
   if(item&&!item.trashed){drawDetails(item);return}
   mailCurrent=null;
  }
  if(mailFolder==='drafts'){drawDrafts();return}
  if(mailFolder==='inbox'||mailFolder==='starred'||mailFolder==='trash'){drawExamples();return}
  content.append(create('p','sv-mail-empty','Отправленные письма появятся после подключения почтового сервиса. Учебные примеры ничего не отправляют.'));
 }
 function paint(){
  nav.replaceChildren();
  for(const [key,label] of tabs){
   const button=create('button','sv-mail-folder');
   button.type='button';button.dataset.mailFolder=key;
   button.setAttribute('aria-current',mailFolder===key?'page':'false');
   button.append(mailIcon(key),create('span','',label));
   const count=folderCount(key);
   if(count)button.append(create('small','sv-mail-folder-count',String(count)));
   button.addEventListener('click',()=>selectFolder(key));nav.append(button);
  }
  searchLabel.hidden=mailEditorOpen||!!mailCurrent;
  compose.hidden=mailEditorOpen;
  info.textContent=mailEditorOpen?'Черновик · только на этом устройстве':
   mailCurrent?'Просмотр учебного письма':
   mailFolder==='drafts'?'Ваши черновики · '+mailDrafts.length:
   mailFolder==='sent'?'Отправка пока недоступна':
   mailFolder==='inbox'?'Входящие · предварительный просмотр':
   mailFolder==='starred'?'Важные · предварительный просмотр':'Корзина · предварительный просмотр';
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
function render(kind){
 const descriptor=subjects[kind];if(!descriptor)return false;
 releaseFile();page.dataset.svSubject=kind;
 subject.textContent=descriptor.label;title.textContent=kind==='contract'&&returnDestination?.hash==='#life'?'Личные документы':descriptor.title;intro.textContent=descriptor.intro;
 footer.textContent=kind==='contract'?'Архив с локальным шифрованием — экспериментальная функция. Без облачного восстановления, биометрии и подключённого ИИ. Для особо важных документов используйте проверенное хранилище.':kind==='mail'?'Почтовые аккаунты не подключены. Черновики доступны только в текущем сеансе; отправка и синхронизация отключены.':localOnly;
 setArt(kind);body.replaceChildren();
 if(kind==='mail')mailView();
 else if(kind==='contract')documentsView();
 else healthView();
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
 const destination=returnDestination?.hash;
 if(destination)location.hash=destination;
 else $('navHome')?.click();
});
window.addEventListener('hashchange',sync);
window.addEventListener('pagehide',releaseFile);
window.SEYVEO_SAYVI_SURFACES=Object.freeze({open,render,sync,openPersonal});
sync();
})();