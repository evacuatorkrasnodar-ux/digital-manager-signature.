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
 mail:{label:'ПОЧТА',title:'Письма и сообщения',intro:'Здесь будут письма, которым стоит уделить внимание.',symbol:'mail'},
 contract:{label:'ДОКУМЕНТЫ',title:'Ваши документы',intro:'Откройте документ. Сэйви сохранит внимание на главном.',symbol:'contract'},
 health:{label:'ЗАБОТА',title:'Ваше здоровье',intro:'Ваши показатели и спокойная забота о себе.',symbol:'health'}
});
let fileUrl=null;
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
  headline:'Письмо от клиента · пример',
  message:'Клиент спрашивает, можно ли перенести встречу. Сэйви предлагает подготовить ответ.',
  why:'В настоящей почте я покажу исходное письмо, объясню приоритет и дам проверить черновик.',
  done:'✓ Черновик ответа подготовлен — только в демонстрации. Письмо НЕ отправлено и НЕ доставлено.'
 },
 contract:{
  headline:'Договор требует внимания · пример',
  message:'Сэйви обратила внимание на условие, которое стоит проверить до подписания.',
  why:'В рабочем режиме я отмечу спорные места, покажу оригинал и попрошу вашего решения.',
  done:'✓ Проверка показана на примере. Настоящий документ НЕ подписан и НЕ изменён.'
 },
 health:{
  headline:'Время для себя · пример',
  message:'Сэйви предлагает небольшую спокойную паузу.',
  why:'Это добровольное напоминание, а не медицинское заключение или анализ ваших показателей.',
  done:'✓ Демонстрация завершена. Реальные показатели НЕ изменены.'
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
  execute.textContent='✓ Выполнено в демо';
  execute.classList.add('sv-deep-intent--done');
  execute.disabled=true;
  status.textContent=cfg.done;
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
function mailView(){
 demoScenario('mail');
 const section=shelf();
 section.append(create('p','sv-deep-lead','Пока почта не подключена.'));
 section.append(paragraph('Я не вижу входящие письма и не могу выбирать важные или отвечать клиентам без вашего разрешения.'));
 const note=paragraph('Когда подключение станет доступным, я смогу показывать источник, причину важности и готовить ответ для вашей проверки.','sv-deep-expand');
 note.hidden=true;
 const why=intent('Что я смогу делать',()=>{note.hidden=!note.hidden;why.setAttribute('aria-expanded',String(!note.hidden))});
 why.setAttribute('aria-expanded','false');
 section.append(actions(intent('Перейти к подключениям',openConnect,true),why),note);
 section.append(hint('Ни одного письма не загружено. Подключение почтового сервиса пока не является действующим доступом.'));
 body.append(section);
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
 demoScenario('contract');
 const section=shelf();
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
 footer.textContent=localOnly;setArt(kind);body.replaceChildren();
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
 if(kind)render(kind);
 else releaseFile();
}
function open(kind){
 const target=routes[kind];
 if(!target)return false;
 if(location.hash===target){sync();return true}
 location.hash=target;
 return true;
}
function openPersonal(kind){
 const choice=document.querySelector('#calendarSpaces [data-calendar-space="'+kind+'"]');
 if(choice){choice.click();return true}
 return false;
}
back.addEventListener('click',()=>{$('navHome')?.click()});
window.addEventListener('hashchange',sync);
window.addEventListener('pagehide',releaseFile);
window.SEYVEO_SAYVI_SURFACES=Object.freeze({open,render,sync,openPersonal});
sync();
})();