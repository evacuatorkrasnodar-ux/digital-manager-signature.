/* SEYVEO · Sayvi Surfaces v1 — a living object opens a real destination.
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
function mailView(){
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
const mime={
 pdf:'application/pdf',txt:'text/plain',md:'text/markdown',
 png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'
};
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