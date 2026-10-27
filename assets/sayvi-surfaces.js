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
 if(context==='business')returnDestination={hash:'#manage',label:'Мой бизнес'};
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
/* SEYVEO Mail — one native inbox shell, with no unconnected fake messages.
   Drafts live only in this open app session until a secure account store exists.
   A real provider connection and sending are intentionally NOT implemented here. */
let mailFolder='inbox',mailEditorOpen=false,mailEditingId=null;
let mailDrafts=[];
function mailView(){
 const section=shelf();
 section.classList.add('sv-mail-workspace');
 const nav=create('div','sv-mail-toolbar');
 nav.setAttribute('role','group');nav.setAttribute('aria-label','Разделы почты');
 const info=create('div','sv-mail-info');
 info.setAttribute('role','status');info.setAttribute('aria-live','polite');
 const content=create('div','sv-mail-list');
 const actionRow=create('div','sv-mail-top-actions');
 const connect=intent('Подключить ящик',openConnect);
 connect.classList.add('sv-mail-connect');
 const compose=intent('Написать',()=>{
  mailEditorOpen=true;mailEditingId=null;paint();
 },true);
 compose.classList.add('sv-mail-compose');
 actionRow.append(compose,connect);
 const tabs=[
  ['inbox','Входящие'],
  ['sent','Отправленные'],
  ['drafts','Черновики']
 ];
 function selectFolder(folder){
  mailFolder=folder;mailEditorOpen=false;mailEditingId=null;paint();
 }
 function editDraft(id){
  if(!mailDrafts.some(d=>d.id===id))return;
  mailEditingId=id;mailEditorOpen=true;paint();
 }
 function removeDraft(id){
  mailDrafts=mailDrafts.filter(d=>d.id!==id);
  mailEditingId=null;mailEditorOpen=false;mailFolder='drafts';paint();
 }
 function drawEditor(){
  const original=mailDrafts.find(d=>d.id===mailEditingId);
  const form=create('form','sv-mail-editor');
  form.setAttribute('aria-label','Черновик письма SEYVEO');
  const title=create('h2','sv-mail-editor-title',original?'Изменить черновик':'Новое письмо');
  form.append(title);
  function field(titleText,tag,value,mode){
   const wrapper=create('label','sv-mail-field');
   wrapper.append(create('span','sv-mail-field-label',titleText));
   const input=create(tag,'sv-mail-input');
   if(tag==='textarea')input.rows=5;
   if(tag==='input'&&mode)input.type=mode;
   input.value=value||'';
   input.maxLength=tag==='textarea'?10000:tag==='input'&&mode==='email'?254:240;
   wrapper.append(input);form.append(wrapper);
   return input;
  }
  const recipient=field('Кому','input',original?.to,'email');
  const subjectInput=field('Тема','input',original?.subject,'text');
  const contentInput=field('Текст письма','textarea',original?.body);
  const status=create('p','sv-mail-feedback');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  form.addEventListener('submit',event=>{
   event.preventDefault();
   const to=recipient.value.trim(),subject=subjectInput.value.trim(),
    bodyText=contentInput.value.trim();
   if(!to&&!subject&&!bodyText){
    status.textContent='Добавьте хотя бы одну строку для черновика.';return;
   }
   const item={id:original?.id||'mail-draft-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
    to:to.slice(0,254),subject:subject.slice(0,240),body:bodyText.slice(0,10000)};
   if(original)mailDrafts=mailDrafts.map(d=>d.id===item.id?item:d);
   else mailDrafts.unshift(item);
   mailEditorOpen=false;mailEditingId=null;mailFolder='drafts';paint();
   info.textContent='Черновик сохранён только на время текущего сеанса SEYVEO. Не отправлен.';
  });
  const controls=create('div','sv-mail-editor-actions');
  const save=create('button','sv-deep-intent sv-deep-intent--lead','Сохранить черновик');
  save.type='submit';
  const cancel=intent('Отмена',()=>{
   mailEditorOpen=false;mailEditingId=null;paint();
  });
  const send=create('button','sv-deep-intent','Отправить · недоступно');
  send.type='button';send.disabled=true;
  send.setAttribute('aria-label','Отправка недоступна до подключения почтового сервиса');
  controls.append(save,cancel,send);
  form.append(controls,status,hint('Черновик хранится только в памяти текущего сеанса. После закрытия приложения он может исчезнуть. Почта не подключена — отправки нет.'));
  content.append(form);
 }
 function paint(){
  nav.replaceChildren();content.replaceChildren();
  for(const [key,label] of tabs){
   const b=create('button','sv-mail-folder',label);
   b.type='button';b.dataset.mailFolder=key;
   b.setAttribute('aria-pressed',String(!mailEditorOpen&&key===mailFolder));
   b.addEventListener('click',()=>selectFolder(key));nav.append(b);
  }
  compose.hidden=mailEditorOpen;
  if(mailEditorOpen){
   info.textContent='Редактор черновика · без реальной отправки';
   drawEditor();return;
  }
  if(mailFolder==='drafts'){
   info.textContent='Черновики · '+mailDrafts.length+' · только текущий сеанс';
   if(!mailDrafts.length){
    content.append(create('p','sv-mail-empty','Черновиков пока нет. Можно написать письмо и сохранить его на время сеанса.'));
   }else{
    for(const draft of mailDrafts){
     const row=create('div','sv-mail-draft-row');
     const headline=create('div','sv-mail-draft-content');
     headline.append(create('strong','',draft.subject||'Без темы'));
     headline.append(create('small','',draft.to?'Кому: '+draft.to:'Адресат не указан'));
     const controls=create('div','sv-mail-draft-actions');
     controls.append(intent('Изменить',()=>editDraft(draft.id)),
      intent('Удалить',()=>removeDraft(draft.id)));
     row.append(headline,controls);content.append(row);
    }
   }
  }else{
   info.textContent=mailFolder==='inbox'?'Входящие · ящик не подключён':'Отправленные · ящик не подключён';
   content.append(create('p','sv-mail-empty',
    mailFolder==='inbox'?'Пока нет подключённого почтового ящика. Здесь будут ваши настоящие входящие письма.':
    'Здесь будут действительно отправленные письма после подключения почты.'));
  }
 }
 section.append(actionRow,nav,info,content);
 section.append(hint('Это почтовый интерфейс внутри SEYVEO. Реальные входящие, синхронизация и отправка заработают только после официального подключения провайдера.'));
 body.append(section);paint();
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
 subject.textContent=descriptor.label;title.textContent=descriptor.title;intro.textContent=descriptor.intro;
 footer.textContent=kind==='contract'?'Архив с локальным шифрованием — экспериментальная функция. Без облачного восстановления, биометрии и подключённого ИИ. Для особо важных документов используйте проверенное хранилище.':localOnly;
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