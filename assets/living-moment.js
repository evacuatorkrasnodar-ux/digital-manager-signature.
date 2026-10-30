/* SEYVEO Signature · Home Quiet Cinema v3
 * One living plane, sculpted editorial symbols and restrained kinetic rhythm.
 * Never writes fictional tasks, messages or business data. The approved
 * plasma, its effects, bottom dock and input controller remain untouched. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const home=$('homePage'),stage=$('stage'),dynamic=$('dynamic'),space=$('seyveoLivingMoment');
const tiles=$('seyveoLivingTiles'),tip=$('seyveoLivingCaption');
if(!home||!stage||!dynamic||!space||!tiles)return;
const MOTION=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const reduced=()=>!!MOTION?.matches;
const TIMING=Object.freeze({open:reduced()?0:960,beat:6100,quiet:4800,close:reduced()?0:920});
let mode='idle',key='',quiet=new Set(),timers=[],readingUntil=0;
let pendingUpdate=false;
// A missed startup presentation can start when Home becomes visible again.
let previewArmed=false,previewSeen=false;
function later(callback,ms){
 const id=window.setTimeout(callback,ms);
 timers.push(id);return id;
}
function cancel(){for(const id of timers)clearTimeout(id);timers=[]}
function available(){return !home.hidden&&!document.hidden&&(!location.hash||location.hash==='#home')&&!document.documentElement.classList.contains('seyveo-conversation')&&!(document.querySelector('dialog[open]'))}
function editing(){
 const composer=$('ask');
 const node=document.activeElement;
 return !!(composer&&!composer.hidden)
   ||!!(node&&/^(INPUT|TEXTAREA)$/.test(node.tagName||''));
}
function engaged(){
 const node=document.activeElement;
 const keyboardFocus=!!(node?.matches?.(':focus-visible')&&(space.contains(node)||dynamic.contains(node)));
 const mouse=!!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
 return editing()||keyboardFocus||Date.now()<readingUntil||(mouse&&(space.matches(':hover')||dynamic.matches(':hover')))
   ||document.querySelector('dialog[open]')!==null;
}
function focus(on){
 if(home.classList.contains('lm-focus')!==on)home.classList.toggle('lm-focus',on);
}
function resetSpace(){
 space.classList.remove('lm-reveal','lm-gather','lm-condense','lm-disappear','lm-preview','lm-real');
 space.hidden=true;tiles.replaceChildren();previewScene=null;
 tip.textContent='';
}
function rest(){
 cancel();mode='idle';key='';readingUntil=0;
 resetSpace();focus(false);
 clearRecommendation();
 scheduleRefresh();
}
function scheduleRefresh(){
 if(pendingUpdate)return;
 pendingUpdate=true;
 queueMicrotask(()=>{pendingUpdate=false;refresh()});
}
function create(tag,klass,words){
 const el=document.createElement(tag);if(klass)el.className=klass;
 if(words!==undefined)el.textContent=words;
 return el;
}
/* One hand-drawn monochrome symbol language, shared by the hero and its
 * quiet secondary rail. No emoji, picture files, WebGL or animated filters. */
const glyph=Object.freeze({
 contract: [
  '<path d="M29 11h29l15 15v53c0 4-3 7-7 7H30c-4 0-7-3-7-7V18c0-4 3-7 6-7Z"/>',
  '<path d="M58 12v15h15"/>',
  '<path d="M35 43h25M35 53h22M35 63h12"/>',
  '<path d="m54 70 5 5 11-12" class="lm-glyph-accent"/>'
 ].join(''),
 work: [
  '<circle cx="48" cy="47" r="36"/>',
  '<path d="M22 72 15 82l19-5" class="lm-glyph-accent"/>',
  '<text x="48" y="58" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui,sans-serif" font-size="33" font-weight="500">Е</text>'
 ].join(''),
 mail: [
  '<rect x="11.5" y="23" width="73" height="52" rx="10"/>',
  '<path d="M15 31 43.5 54a7 7 0 0 0 9 0L81 31"/>',
  '<path d="m16 68 22-18m42 18L58 50" class="lm-glyph-accent"/>'
 ].join(''),
 health: [
  '<path d="M48 81 20.2 54.5C1.1 36.2 15 14.3 32.1 19.3 39 21.3 44 26.8 48 33c4-6.2 9-11.7 15.9-13.7 17.1-5 31 16.9 11.9 35.2Z"/>',
  '<path d="M23 48h14l6-11 10 22 6-11h14" class="lm-glyph-accent"/>'
 ].join(''),
 breath: [
  '<path d="M13 35c12-16 21 11 33-1 12-12 20-8 37-3"/>',
  '<path d="M10 49c13-12 24 8 38-2 15-12 22-4 37-1"/>',
  '<path d="M18 64c13-11 24 4 37-3 10-6 18-5 24-2"/>'
 ].join(''),
 task: [
  '<rect x="16" y="14" width="64" height="69" rx="11"/>',
  '<path d="M32 31h33M32 44h24M32 57h12"/>',
  '<path d="m49 67 9 8 15-18" class="lm-glyph-accent"/>'
 ].join('')
});
function icon(kind){
 const s=document.createElementNS('http://www.w3.org/2000/svg','svg');
 const type=Object.hasOwn(glyph,kind)?kind:'task';
 s.setAttribute('viewBox','0 0 96 96');
 s.setAttribute('aria-hidden','true');
 s.setAttribute('focusable','false');
 s.setAttribute('class','lm-art-svg lm-art-svg--'+type);
 s.innerHTML=glyph[type];
 return s;
}

// One source of truth for the current Home session's deferrals.
// Preview entries never enter the real user's stored personal tasks.
let mailDeferred=false,documentDeferred=false;
const postponedTaskIds=new Set();
function notifyDeferred(){
 window.dispatchEvent(new Event('seyveo:home-deferred-changed'));
}
function setMailDeferred(value){mailDeferred=!!value;notifyDeferred()}
function setDocumentDeferred(value){documentDeferred=!!value;notifyDeferred()}
function deferredPreview(){
 const result=[];
 if(mailDeferred)result.push({
  kind:'mail',title:'Андрей · стоимость доставки',
  note:'Учебное письмо отложено. Настоящее сообщение не отправлялось.',
  route:'mail'
 });
 if(documentDeferred)result.push({
  kind:'contract',title:'Учебный договор · проверить условия',
  note:'Учебный документ отложен. Настоящие файлы не изменены.',
  route:'contract'
 });
 return result;
}
function restorePreview(kind){
 if(kind==='mail'&&!mailDeferred||kind==='contract'&&!documentDeferred)return false;
 if(kind==='mail')setMailDeferred(false);
 else if(kind==='contract')setDocumentDeferred(false);
 else return false;
 $('navHome')?.click();
 window.setTimeout(()=>window.SEYVEO_LIVING_MOMENT?.preview?.(),180);
 return true;
}
function restoreTask(id){
 if(typeof id!=='string'||!postponedTaskIds.has(id))return false;
 postponedTaskIds.delete(id);
 for(const eventId of Array.from(quiet)){
  if(eventId.startsWith('task:'+id+'|'))quiet.delete(eventId);
 }
 notifyDeferred();
 scheduleRefresh();
 return true;
}
const sample=[
 {kind:'contract',title:'Проверить документ',category:'ВАЖНОЕ',body:'Есть договор, который нужно посмотреть.',
  reason:'Это вымышленный договор для предпросмотра. Настоящий появляется только из ваших документов или разрешённого источника.',
  detail:'В рабочем режиме Сэйви поможет проверить договор, но ничего не подпишет без вашего подтверждения.'},
 {kind:'work',title:'Елена · рабочий чат',category:'СООБЩЕНИЯ',body:'Я закончила выкладку товаров. Можете проверить?',reason:'Учебное сообщение от Елены, не из реального рабочего чата.',detail:'Сэйви может предложить черновик. Отправка не подключена.'},
 {kind:'mail',title:'Почта',category:'СООБЩЕНИЯ',body:'Есть письмо, которому нужен ответ.',
  reason:'Почта не подключена, настоящих писем Сэйви пока не читала.',
  detail:'После разрешённого подключения почты Сэйви сможет помогать готовить черновики ответов.'},
 {kind:'health',title:'Пора передохнуть',category:'ЗАБОТА',body:'Две спокойные минуты для себя.',
  reason:'Учебный пример заботы о себе, не основан на данных Apple Health или медицинских измерениях.',
  detail:'Можно сделать короткую передышку. Это демонстрация будущей персональной заботы, а не медицинский совет.'}
];
function polymer(label,callback,kind='quiet'){
 const b=create('button','lm-polymer lm-polymer--'+kind,label);
 b.type='button';b.addEventListener('click',event=>{event.stopPropagation();readingUntil=Date.now()+15000;callback(b)});
 return b;
}
function explain(field,message,button){
 const panel=field.querySelector('.lm-explanation');
 if(!panel)return;
 const collapse=!panel.hidden&&panel.textContent===message;
 panel.textContent=message;panel.hidden=collapse;
 field.classList.toggle('lm-has-reason',!collapse);
 if(button)button.setAttribute('aria-expanded',String(!collapse));
}
// Sayvi's Home voice follows the CURRENT highlighted item, not generic "all quiet".
function announceRecommendation(item){
 if(!item)return;
 const isDemo=mode==='preview';
 const speech=isDemo
  ?item.kind==='contract'
   ?'Это учебный договор. Я покажу, где не хватает срока поставки, и предложу исправление.'
   :item.kind==='mail'
    ?'Это пример письма. Я подготовила черновик ответа, а отправку оставляю тебе.'
    :'Это пример заботы о себе. Можно сделать короткую передышку.'
  :'Это сохранённое поручение. Я напомнила о сроке и помогу открыть детали.';
 window.dispatchEvent(new CustomEvent('seyveo:home-recommendation-changed',{
  detail:{kind:item.kind,title:item.title,isDemo,message:speech}
 }));
}
function clearRecommendation(){
 window.dispatchEvent(new CustomEvent('seyveo:home-recommendation-changed',{detail:null}));
}
function createSurface(primary,other=[],real=false,taskId=''){
 tiles.replaceChildren();
 const field=create('div','lm-field');
 field.dataset.lmMode=real?'real':'preview';
 const scene=create('div','lm-scene');
 const top=create('div','lm-field-top');
 const label=create('span','lm-field-eyebrow',primary.category);
 const measure=create('span','lm-field-measure',real?'ВАШИ ДАННЫЕ':'ПРЕДПРОСМОТР');
 top.append(label,measure);
 const main=create('section','lm-primary');
 const hero=create('div','lm-hero');
 const artwork=create('div','lm-hero-art lm-hero-art--'+primary.kind);
 artwork.append(icon(primary.kind));
 const copy=create('div','lm-primary-copy');
 const headline=create('strong','lm-primary-title',primary.title);
 const description=create('p','lm-primary-subtitle',primary.body);
 copy.append(headline,description);
 hero.append(artwork,copy);
 const controls=create('div','lm-actions');
 let remaining=[primary,...other],shown=primary,morphLocked=false;
 const seenQueueRows=new Set(real&&primary.eventId?[primary.eventId]:[]);
 let queueRendered=false;
 // Only the ORIGINAL Quiet Cinema Mail item gains actions; no new card.
 // The message is invented. No API, actual outgoing email or AI is used.
 const mailDefault='Здравствуйте, Андрей! Спасибо за обращение. Уточните, пожалуйста, адрес доставки, чтобы мы могли рассчитать стоимость.';
 let mailDraft=mailDefault,mailStep='draft';
 let workDraft='',workMode='choose';
 const workDetails=create('div','lm-mail-content');workDetails.hidden=true;
 function workActive(){return !real&&shown.kind==='work'}
 function updateWork(){
  const active=workActive();workDetails.hidden=!active;
  sayviAction.hidden=active;
  workSayvi.hidden=!active||workMode!=='choose';
  workOwn.hidden=!active||workMode!=='choose';
  workBack.hidden=!active||workMode==='choose';
  workSend.hidden=!active||workMode==='choose'||workMode==='done';
  workBack.textContent=workMode==='done'?'Новый ответ':'Назад';
  execute.hidden=active;
  workDetails.replaceChildren();
  if(!active)return;
  workDetails.append(create('p','lm-mail-intro','РАБОЧИЙ ЧАТ · ЕЛЕНА · ДЕМО'));
  workDetails.append(create('p','lm-section-label','СООБЩЕНИЕ ЕЛЕНЫ'));
  workDetails.append(create('p','lm-mail-draft','Я закончила выкладку товаров. Можете проверить?'));
  if(workMode!=='choose'&&workMode!=='done'){
   workDetails.append(create('p','lm-section-label',workMode==='sayvi'?'✧ СЭЙВИ ПРЕДЛАГАЕТ':'ВАШ ОТВЕТ'));
   const label=create('label','lm-mail-edit-label',workMode==='sayvi'?'✧ Черновик Сэйви':'Ваш ответ');
   const input=create('textarea','lm-mail-edit-input');input.rows=3;input.maxLength=1200;input.value=workDraft;
   input.addEventListener('input',()=>{workDraft=input.value});
   label.append(input);workDetails.append(label);
  }
  workDetails.append(create('p','lm-mail-note',workMode==='done'?'✓ ДЕМО · Ответ показан, но Елене ничего не отправлено.':'Учебное сообщение. Отправка в настоящий чат не подключена.'));
  if(workMode==='done')workDetails.append(create('p','lm-mail-draft','Ваш ответ: '+workDraft));
 }

 const mailDetails=create('div','lm-mail-content');
 mailDetails.hidden=true;
 // The original document scene uses the SAME field, artwork, actions and motion.
 let documentStep='summary';
 const documentDefault='Уточнить конкретный срок поставки и порядок уведомления о задержке.';
 let documentNote=documentDefault;
 const documentDetails=create('div','lm-document-content');
 documentDetails.hidden=true;
 function documentActive(){return !real&&shown.kind==='contract'}
 function updateDocument(){
  const active=documentActive();
  documentDetails.hidden=!active;
  documentEdit.hidden=!active||documentStep!=='review';
  documentLater.hidden=!active||documentStep==='edit'||documentStep==='done';
  documentSave.hidden=!active||documentStep!=='edit';
  documentCancel.hidden=!active||documentStep!=='edit';
  if(active){
   execute.hidden=documentStep==='edit'||documentStep==='summary';
   open.hidden=documentStep==='edit';
   execute.textContent=documentStep==='done'?'Дальше'
    :documentStep==='review'?'Ознакомлен · демо':'Проверить';
  }
  documentDetails.replaceChildren();
  if(!active)return;
  documentDetails.append(create('p','lm-mail-intro','ДОКУМЕНТ · УЧЕБНЫЙ ДОГОВОР · ДЕМО'));
  documentDetails.append(create('p','lm-section-label','✧ СЭЙВИ ЗАМЕТИЛА'));
  if(documentStep!=='summary'){
   documentDetails.append(create('p','lm-document-excerpt',
    'Пункт «Срок поставки»: конкретный срок в учебном договоре не указан.'));
  }
  if(documentStep==='edit'){
   const label=create('label','lm-mail-edit-label','Предложение к исправлению');
   const input=create('textarea','lm-mail-edit-input');
   input.rows=3;input.maxLength=1200;input.value=documentNote;
   label.append(input);documentDetails.append(label);
  }else{
   const sayviText=documentStep==='done'
    ?'Это только учебный пример. Настоящий договор не изменён.'
    :documentStep==='summary'
     ?'Я заметила: срок поставки не указан. Предлагаю уточнить его.'
     :'Предлагаю: '+documentNote;
   documentDetails.append(create('p','lm-document-note',
    'Сэйви · '+sayviText));
   if(documentStep==='review')documentDetails.append(create('p','lm-mail-note',
    'ДЕМО · Согласование не подписывает и не изменяет договор.'));
  }
 }

 function mailActive(){return !real&&shown.kind==='mail'}
 function updateMail(){
  const active=mailActive();
  mailDetails.hidden=!active;
  realLater.hidden=!real;
  mailEdit.hidden=!active||mailStep!=='confirm';
  mailLater.hidden=!active||mailStep==='edit'||mailStep==='done';
  mailSave.hidden=!active||mailStep!=='edit';
  mailCancel.hidden=!active||mailStep!=='edit';
  open.hidden=active&&mailStep==='edit';
  execute.hidden=active&&(mailStep==='edit'||mailStep==='draft');
  execute.textContent=real?'Продолжить дело':active
    ?(mailStep==='done'?'✓ Завершено · демо':mailStep==='confirm'?'Завершить пример · демо':'Продолжить')
    :'Исполнить';
  mailDetails.replaceChildren();
  if(!active)return;
  mailDetails.append(create('p','lm-mail-intro','ПИСЬМО · АНДРЕЙ · ДЕМО'),create('p','lm-source-line','Вопрос клиента: сколько стоит доставка?'),create('p','lm-section-label','✧ ОТВЕТ СЭЙВИ'));
  if(mailStep==='edit'){
   const field=create('label','lm-mail-edit-label','Исправить черновик');
   const input=create('textarea','lm-mail-edit-input');
   input.rows=3;input.maxLength=1200;input.value=mailDraft;
   field.append(input);mailDetails.append(field);
  }else{
   if(mailStep==='confirm'){
    mailDetails.append(create('p','lm-mail-address','Кому: Андрей · адрес не подключён'),
      create('p','lm-mail-address','Тема: Стоимость доставки'));
   }
   mailDetails.append(create('p','lm-mail-draft',mailDraft));
   // The Home draft is fully readable, not buried beneath duplicate status text.
   // A real sending confirmation remains explicit and cannot transmit a message.
   if(mailStep!=='draft'){
    mailDetails.append(create('p','lm-mail-note',mailStep==='done'
     ?'✓ ДЕМО · Ничего не отправлено.'
     :'ДЕМО · Подтверждение не отправляет письмо.'));
   }
  }
 }
 const open=polymer('Подробнее',()=>{
  if(mailActive()){
   const api=window.SEYVEO_SAYVI_SURFACES;
   if(api?.open)api.open('mail');
   else location.hash='#sayvi-mail';
   return;
  }
  if(workActive()){
   const opened=window.SEYVEO_BUSINESS_COMMAND?.openPrivateChat?.('elena','manager');
   if(!opened)explain(field,'Рабочий чат сейчас недоступен. Черновик ответа можно подготовить здесь.',open);
   return;
  }
  if(documentActive()){
   const api=window.SEYVEO_SAYVI_SURFACES;
   if(api?.open)api.open('contract');
   else location.hash='#sayvi-documents';
   return;
  }
  // Explain why Sayvi surfaced the stored task; never mark it done.
  explain(field,shown.reason+' '+shown.detail,open);
 });
 const execute=polymer(real?'Продолжить дело':'Исполнить',()=>{
  if(workActive()){updateWork();return}
  if(mailActive()){
   if(mailStep==='draft'){mailStep='confirm';updateMail();return}
   if(mailStep==='confirm'){
    // This is only a local scripted demo: there is no external mail acknowledgement.
    // Close the preview after the simulated confirmation, never claim a real send.
    mailStep='done';updateMail();finishPreviewItem();return;
   }
   if(mailStep==='done'){finishPreviewItem();return}
  }
  if(documentActive()){
   if(documentStep==='summary'){documentStep='review';updateDocument();return}
   if(documentStep==='review'){documentStep='done';updateDocument();return}
   if(documentStep==='done'){finishPreviewItem();return}
  }
  if(real){
   // Opening an ongoing plan or task is NOT evidence of completion.
   // Only the owner's completion action in Tasks may finish a real item.
   const actualId=shown.taskId||taskId;
   if(!actualId){
    explain(field,'Не удалось найти сохранённое поручение.',execute);
    return;
   }
   window.dispatchEvent(new CustomEvent('seyveo:home-task-open',{detail:{id:actualId}}));
   return;
  }
  finishPreviewItem();
 },'main');
 open.textContent=workActive()?'В чат':'Подробнее';
 open.setAttribute('aria-label',workActive()?'Открыть рабочий чат Елены':'Подробнее: '+shown.title);
 open.setAttribute('aria-expanded','false');
 execute.setAttribute('aria-label',(real?'Продолжить дело: ':'Исполнить: ')+shown.title);
 const sayviAction=polymer('✧ Сэйви',()=>{
  if(mailActive()){mailStep='confirm';updateMail();return}
  if(documentActive()){documentStep='review';updateDocument();return}
  explain(field,(shown.reason||'')+' '+(shown.detail||'Сэйви поможет разобраться с этой карточкой.'),sayviAction);
 });
 const workSayvi=polymer('✧ Ответит Сэйви',()=>{workMode='sayvi';workDraft='Спасибо, Елена! Пришли, пожалуйста, фото выкладки — я проверю.';updateWork()});
 const workOwn=polymer('Ответить самому',()=>{workMode='own';workDraft='';updateWork()});
 const workBack=polymer('Назад',()=>{workMode='choose';updateWork()});
 const workSend=polymer('Отправить · демо',()=>{if(!workDraft.trim()){explain(field,'Сначала напишите ответ.',workSend);return}workMode='done';updateWork();finishPreviewItem()});
 const mailEdit=polymer('Исправить',()=>{mailStep='edit';updateMail()});
 const mailSave=polymer('Сохранить',()=>{
  const value=mailDetails.querySelector('textarea')?.value?.trim();
  if(!value){explain(field,'Напишите текст ответа, чтобы сохранить учебный черновик.',mailSave);return}
  mailDraft=value.slice(0,1200);mailStep='confirm';updateMail();
 });
 const mailCancel=polymer('Отмена',()=>{mailStep='draft';updateMail()});
 const mailLater=polymer('Позже',()=>{
  if(!mailActive())return;
  setMailDeferred(true);
  // Removing a fictitious message from the preview never completes a real task.
  finishPreviewItem();
 });
 const documentEdit=polymer('Исправить',()=>{documentStep='edit';updateDocument()});
 const documentSave=polymer('Сохранить',()=>{
  const value=documentDetails.querySelector('textarea')?.value?.trim();
  if(!value){explain(field,'Добавьте предложение к исправлению.',documentSave);return}
  documentNote=value.slice(0,1200);documentStep='review';updateDocument();
 });
 const documentCancel=polymer('Отмена',()=>{documentStep='review';updateDocument()});
 const documentLater=polymer('Позже',()=>{
  if(!documentActive())return;
  setDocumentDeferred(true);
  finishPreviewItem();
 });
 const realLater=polymer('Позже',()=>{
  if(!real||!shown.eventId||morphLocked)return;
  // Snooze only this Home session. The real item remains in its original Tasks list.
  quiet.add(shown.eventId);
  if(shown.taskId)postponedTaskIds.add(shown.taskId);
  finishRealItem();
 });
 controls.append(sayviAction,workSayvi,workOwn,workSend,workBack,execute,mailEdit,documentEdit,open,mailLater,documentLater,realLater,mailSave,mailCancel,documentSave,documentCancel);
 main.append(hero,workDetails,mailDetails,documentDetails,controls);
 const secondary=create('div','lm-secondary');
 function updateCount(){
  if(real){
   measure.textContent=Math.min(3,remaining.length)+' ИЗ '+remaining.length+' · ВАШИ ДЕЛА';
   return;
  }
  measure.textContent=remaining.length+' '+(remaining.length===1?'ДЕЛО':'ДЕЛА')+' · ПРЕДПРОСМОТР';
 }
 function renderSecondary(){
  secondary.replaceChildren();
  for(const item of remaining.filter(value=>value!==shown).slice(0,2)){
   // This is a selectable task row, not another visible action button.
   const row=create('button','lm-inline-item');
   row.type='button';
   row.dataset.lmKind=item.kind;
   if(real&&queueRendered&&!seenQueueRows.has(item.eventId))row.classList.add('lm-next-arrive');
   if(real)seenQueueRows.add(item.eventId);
   row.setAttribute('aria-label','Выбрать дело: '+item.title);
   const mark=create('span','lm-inline-art');
   mark.append(icon(item.kind));
   const words=create('span','lm-inline-copy');
   words.append(create('span','lm-inline-title',item.title),create('span','lm-inline-note',item.body));
   row.append(mark,words);
   row.addEventListener('click',()=>{
    readingUntil=Date.now()+12000;
    changeFeatured(item);
   });
   secondary.append(row);
  }
  if(real)queueRendered=true;
 }
 function setFeatured(item){
  shown=item;
  if(real)key=item.eventId;
  field.dataset.lmSubject=item.kind;
  artwork.className='lm-hero-art lm-hero-art--'+item.kind;
  artwork.replaceChildren(icon(item.kind));
  label.textContent=space.classList.contains('lm-gather')?'ГЛАВНОЕ':item.category;
  headline.textContent=item.title;
  description.textContent=item.body;
  description.hidden=!real&&(item.kind==='contract'||item.kind==='mail');
  open.textContent=!real&&item.kind==='work'?'В чат':'Подробнее';
  open.setAttribute('aria-label',item.kind==='work'?'Открыть рабочий чат Елены':'Подробнее: '+item.title);
  execute.setAttribute('aria-label',(real?'Продолжить дело: ':'Исполнить: ')+item.title);
  const reason=field.querySelector('.lm-explanation');
  if(reason){reason.hidden=true;field.classList.remove('lm-has-reason')}
  open.setAttribute('aria-expanded','false');
  execute.setAttribute('aria-expanded','false');
  mailStep='draft';
  documentStep='summary';workMode='choose';workDraft='';
  updateMail();
  updateDocument();updateWork();
  updateCount();
  renderSecondary();
  announceRecommendation(item);
 }
 function changeFeatured(item){
  if(item===shown||morphLocked||!remaining.includes(item)||space.classList.contains('lm-condense'))return;
  morphLocked=true;
  scene.classList.add('lm-scene--changing');
  later(()=>{
   if(!tiles.contains(field)||mode==='idle')return;
   setFeatured(item);
   scene.classList.remove('lm-scene--changing');
   later(()=>{morphLocked=false},reduced()?0:500);
  },reduced()?0:400);
 }
 function finishPreviewItem(){
  if(real||morphLocked||mode!=='preview'||!remaining.includes(shown))return;
  morphLocked=true;
  open.disabled=true;execute.disabled=true;
  scene.classList.add('lm-scene--changing');
  later(()=>{
   if(!tiles.contains(field)||mode!=='preview')return;
   remaining=remaining.filter(item=>item!==shown);
   if(!remaining.length){
    tip.textContent='ПРИМЕРЫ РАЗОБРАНЫ · ДАННЫЕ НЕ ИЗМЕНЕНЫ';
    space.classList.add('lm-disappear');
    later(()=>rest(),reduced()?0:TIMING.close);
    return;
   }
   setFeatured(remaining[0]);
   tip.textContent='QUIET CINEMA · ОСТАЛОСЬ '+remaining.length;
   scene.classList.remove('lm-scene--changing');
   later(()=>{morphLocked=false;open.disabled=false;execute.disabled=false},reduced()?0:430);
  },reduced()?0:420);
 }
 function finishRealItem(){
  if(!real||mode!=='task'||morphLocked)return;
  morphLocked=true;open.disabled=true;execute.disabled=true;realLater.disabled=true;
  scene.classList.add('lm-scene--changing');
  later(()=>{
   if(!tiles.contains(field)||mode!=='task')return;
   remaining=dueTasks();
   if(!remaining.length){
    tip.textContent='НА ГЛАВНОЙ НЕТ ОЖИДАЮЩИХ ДЕЛ';
    space.classList.add('lm-disappear');
    later(()=>{rest();notifyDeferred()},reduced()?0:TIMING.close);
    return;
   }
   setFeatured(remaining[0]);
   notifyDeferred();
   tip.textContent='ВАШИ ДЕЛА · ОЖИДАЮТ '+remaining.length;
   scene.classList.remove('lm-scene--changing');
   later(()=>{morphLocked=false;open.disabled=false;execute.disabled=false;realLater.disabled=false},reduced()?0:430);
  },reduced()?0:420);
 }
 field.dataset.lmSubject=primary.kind;
 description.hidden=!real&&(primary.kind==='contract'||primary.kind==='mail');
 updateMail();
 updateDocument();updateWork();
 updateCount();
 renderSecondary();
 const explanation=create('p','lm-explanation');
 explanation.id='seyveoSurfaceReason';
 explanation.hidden=true;
 open.setAttribute('aria-controls',explanation.id);
 execute.setAttribute('aria-controls',explanation.id);
 scene.append(top,main,secondary,explanation);
 field.append(scene);
 tiles.append(field);
 announceRecommendation(primary);
 return {field,changeFeatured,updateCount};
}
let previewScene=null,previewCount=0;
function buildExamples(){
 // A deferred training example cannot return Home until explicitly restored.
 const present=sample.filter(item=>
  !(item.kind==='mail'&&mailDeferred) &&
  !(item.kind==='contract'&&documentDeferred));
 // Unified ordering is opt-in; the original Quiet Cinema layout remains unchanged.
 const ordered=window.SEYVEO_CARD_LIFECYCLE?.orderPreview?.(present)||present;
 previewCount=ordered.length;
 previewScene=ordered.length?createSurface(ordered[0],ordered.slice(1)):null;
 return present.length;
}
function gatherPreview(){
 if(mode!=='preview'&&mode!=='task')return;
 if(mode==='task'){
  space.classList.add('lm-gather');
  tip.textContent='ВАШИ ДЕЛА · ОДНА ЖИВАЯ ОЧЕРЕДЬ';
  return;
 }
 const field=tiles.querySelector('.lm-field');
 if(field){
  const label=field.querySelector('.lm-field-eyebrow');
  const measure=field.querySelector('.lm-field-measure');
  if(label)label.textContent='ГЛАВНОЕ';
  if(measure)measure.textContent=previewCount+' '+(previewCount===1?'ДЕЛО':'ДЕЛА')+' · ПРЕДПРОСМОТР';
 }
 // All three original tasks stay visible in one parent, never cloned.
 space.classList.add('lm-gather');
 tip.textContent='QUIET CINEMA · ВСЁ В ОДНОЙ КАРТОЧКЕ';
}
function shrink(){
 if(mode==='idle')return;
 if(mode==='preview'&&tiles.querySelector('.lm-field[data-lm-subject="work"] .lm-mail-content:not([hidden]) textarea'))return;
 space.classList.add('lm-condense');
 const reason=tiles.querySelector('.lm-explanation');
 if(reason)reason.hidden=true;
 const field=tiles.querySelector('.lm-field');
 if(field)field.classList.remove('lm-has-reason');
 tip.textContent=mode==='task'?'СОХРАНЕНО В «ДЕЛАХ»':
  'ПРИМЕР · ВАЖНОЕ СОХРАНЯЕТСЯ';
}
function disappear(){
 if(mode==='idle')return;
 if(mode==='preview'&&tiles.querySelector('.lm-field[data-lm-subject="work"] .lm-mail-content:not([hidden]) textarea'))return;
 if(mode==='advice'){
  quiet.add(key);dynamic.classList.add('lm-real-out');
  later(()=>{if(mode==='advice'){dynamic.hidden=true;rest()}},TIMING.close);
  return;
 }
 if(mode==='task')quiet.add(key);
 space.classList.add('lm-disappear');
 later(()=>{if(mode==='preview'||mode==='task')rest()},TIMING.close);
}
function closeEarly(){
 if(mode==='idle')return;
 cancel();
 if(mode==='task'||mode==='advice')quiet.add(key);
 space.classList.add('lm-condense','lm-disappear');
 later(()=>rest(),TIMING.close);
}
function hold(callback,delay){
 const check=()=>{
  if(mode==='idle'||!available()){if(!available())return rest();return}
  if(engaged()){later(check,1800);return}
  callback();
 };
 later(check,delay);
}
function startPreview(){
 // When the stylesheet cannot load, do not show huge unstyled SVGs and default gray buttons.
 if(typeof window.getComputedStyle==='function' &&
    window.getComputedStyle(space).getPropertyValue('--lm-design-ready').trim()!=='1'){
  console.warn('SEYVEO Quiet Cinema: CSS missing; preserving normal Home.');
  return false;
 }
 if(!available()||editing()||dueTasks().length||dynamic.querySelector('[data-owner-advice]'))return false;
 if(mode!=='idle')rest();
 mode='preview';key='preview';previewSeen=true;
 dynamic.hidden=true;
 if(!buildExamples()){rest();return false}
 tip.textContent='QUIET CINEMA · ПРИМЕРЫ ДЛЯ ПРОСМОТРА';
 space.hidden=false;space.classList.add('lm-preview');
 focus(true);
 // Determine the actual entry distance for each screen, including iPhone X.
 // Only transforms move during the sequence: no absolute overlays or clones.
 const targetBottom=window.visualViewport?.height||window.innerHeight;
 const relativeTop=space.getBoundingClientRect().top;
 const distance=Math.max(320,Math.min(1100,targetBottom-relativeTop+100));
 space.style.setProperty('--lm-rise-distance',distance+'px');
 later(()=>{if(mode==='preview')space.classList.add('lm-reveal')},TIMING.open);
 // Each of the three independent cards rises from below the screen.
 // After their arrival, they join a SINGLE card that remains readable.
 hold(()=>gatherPreview(),(reduced()?0:4700)+TIMING.open);
 return true;
}
function dueTasks(){
 let tasks=[];
 try{const data=JSON.parse(localStorage.getItem('seyveo-personal-tasks-v1')||'[]');if(Array.isArray(data))tasks=data}catch{}
 const d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 return tasks.filter(t=>t&&t.done!==true&&typeof t.title==='string'&&t.title.trim()
  &&typeof t.due==='string'&&/^\d{4}-\d\d-\d\d$/.test(t.due)&&t.due<=today)
  .sort((a,b)=>a.due.localeCompare(b.due))
  .map(item=>{
   const eventId='task:'+(item.id||item.title)+'|'+item.due;
   const when=new Date(item.due+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
   return {
    eventId,taskId:item.id||'',kind:'task',title:item.title,
    body:'Срок наступил · '+when+'. Дело сохранено в вашем списке.',
    category:'ВАШЕ ДЕЛО · ТРЕБУЕТ ВНИМАНИЯ',
    reason:'Вы сами добавили это дело. Сэйви показывает его, потому что наступил указанный срок.',
    detail:'Откройте «Дела», чтобы увидеть детали и завершить поручение.'
   };
  }).filter(item=>!quiet.has(item.eventId));
}
function showTasks(items){
 if(!items.length)return false;
 mode='task';key=items[0].eventId;
 dynamic.hidden=true;
 createSurface(items[0],items.slice(1),true);
 tip.textContent='НА ОСНОВЕ ВАШИХ ЗАПИСЕЙ · НЕ ПРИМЕР';
 space.hidden=false;space.classList.add('lm-preview','lm-real');
 focus(true);
 const targetBottom=window.visualViewport?.height||window.innerHeight;
 const relativeTop=space.getBoundingClientRect().top;
 const distance=Math.max(320,Math.min(1100,targetBottom-relativeTop+100));
 space.style.setProperty('--lm-rise-distance',distance+'px');
 later(()=>{if(mode==='task')space.classList.add('lm-reveal')},TIMING.open);
 if(items.length>1)hold(()=>gatherPreview(),(reduced()?0:4700)+TIMING.open);
 // Up to three current tasks rise together; the rest stay in the existing Tasks store.
 // Opening or snoozing is never treated as proof that the task is completed.
 return true;
}
function adviceIdentity(card){
 if(!card)return '';
 const title=card.querySelector('.event-copy strong')?.textContent||'';
 const basis=card.querySelector('.card-tag')?.textContent||'';
 return 'advice:'+(title+'|'+basis).trim().slice(0,300);
}
function showExistingAdvice(){
 const card=dynamic.querySelector('[data-owner-advice]');
 if(!card)return false;
 // Bring existing permission-based recommendations into the same editorial
 // symbol system. Remove their obsolete small icon instead of stacking art.
 const heading=card.querySelector('.event-copy strong')?.textContent||'';
 const kind=/почт|письм|e-mail|email/i.test(heading)?'mail':
  /здоров|сердц|пульс/i.test(heading)?'health':'task';
 const row=card.querySelector('.card-main');
 if(row&&!row.querySelector('.lm-owner-art')){
  const art=create('span','lm-owner-art');
  art.setAttribute('aria-hidden','true');
  art.append(icon(kind));
  row.querySelector('.event-icon')?.remove();
  row.prepend(art);
 }
 const id=adviceIdentity(card);
 if(quiet.has(id))return false;
 mode='advice';key=id;
 space.hidden=true;
 dynamic.hidden=false;
 dynamic.classList.remove('lm-real-dim','lm-real-out');
 focus(true);
 // A real recommendation is not dismissed just because time passed.
 return true;
}
function refresh(){
 if(document.hidden||home.hidden||document.documentElement.classList.contains('seyveo-conversation'))return;
 const pending=dynamic.querySelector('[data-owner-advice]');
 const pendingKey=adviceIdentity(pending);
 if(mode==='preview'){if(!dynamic.hidden)dynamic.hidden=true;return}
 if(mode==='task'){
  if(!dynamic.hidden)dynamic.hidden=true;
  if(!dueTasks().some(item=>item.eventId===key))rest();
  return;
 }
 if(mode==='advice'){
  if(key!==pendingKey){rest();return}
  if(quiet.has(key)&&!dynamic.hidden)dynamic.hidden=true;
  return;
 }
 // Do not resize the sphere beneath a working mobile keyboard.
 if(editing())return;
 const tasks=dueTasks();
 if(tasks.length&&showTasks(tasks))return;
 if(pending&&showExistingAdvice())return;
 if(pending&&quiet.has(pendingKey)&&!dynamic.hidden)dynamic.hidden=true;
 if(mode==='idle'){
  focus(false);
  if(previewArmed&&!previewSeen&&!tasks.length&&!pending&&available())startPreview();
 }
}
const observer=new MutationObserver(scheduleRefresh);
observer.observe(dynamic,{childList:true,attributes:true,attributeFilter:['hidden']});
const viewObserver=new MutationObserver(()=>{
 if(document.documentElement.classList.contains('seyveo-conversation')){
  if(mode!=='idle')rest();
 }else scheduleRefresh();
});
viewObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
window.addEventListener('seyveo:tasks-changed',scheduleRefresh);
window.addEventListener('seyveo:business-map-changed',scheduleRefresh);
window.addEventListener('seyveo:connection-followup-changed',scheduleRefresh);
window.addEventListener('hashchange',()=>{
 // Revisiting Home may replay the approved scene, never an actual task.
 if(!location.hash||location.hash==='#home')previewSeen=false;
 if(mode!=='idle')rest();
 else focus(false);
 // Sync after the main router updates Home visibility.
 later(scheduleRefresh,160);
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&mode!=='idle')rest();
 else if(!document.hidden)scheduleRefresh();
});
document.addEventListener('close',()=>later(scheduleRefresh,130),true);
window.addEventListener('pagehide',()=>{cancel();resetSpace();focus(false)});
/* Real business recommendations remain actionable. Explain in place without
 * launching a second modal and without overwriting their original approval logic. */
dynamic.addEventListener('click',event=>{
 const button=event.target.closest?.('#inspect');
 if(!button||!dynamic.querySelector('[data-owner-advice]'))return;
 event.preventDefault();event.stopImmediatePropagation();
 const card=dynamic.querySelector('[data-owner-advice]');
 let reason=card.querySelector('.lm-real-reason');
 if(!reason){
  reason=create('p','lm-real-reason',
   'Основание: '+(card.querySelector('.card-tag')?.textContent||
   'сведения, которые вы внесли в приложение.')+
   ' Это предложение, а не действие, выполненное без вашего согласия.');
  reason.hidden=true;card.append(reason);
 }
 reason.hidden=!reason.hidden;
 button.textContent=reason.hidden?'Почему':'Скрыть';
},true);
window.SEYVEO_LIVING_MOMENT=Object.freeze({
 preview:()=>startPreview(),state:()=>mode,
 deferred:()=>deferredPreview(),
 deferredTaskIds:()=>Array.from(postponedTaskIds),
 restoreDeferred:kind=>restorePreview(kind),
 restoreTask:id=>restoreTask(id)
});
scheduleRefresh();
// Bring back the original rising three-card introduction after opening.
// If a dialog/navigation blocks it, refreshing Home retries instead of
// silently discarding the animation forever.
window.setTimeout(()=>{previewArmed=true;scheduleRefresh()},7800);
})();