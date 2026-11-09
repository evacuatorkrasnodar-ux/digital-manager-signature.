(()=>{
'use strict';
// The Studio contains NO independent card catalog or renderer. Every new
// registered event type appears here automatically from the Card Engine.
const engine=window.SEYVEO_CARD_ENGINE;
if(!engine)return;
const entries=Object.entries(engine.eventType).map(([eventKey,family])=>{
 const config=engine.catalog[family],example=config.example;
 return [config.family,example[0],example[1],example[2],
  config.accent,config.icon,eventKey];
});
// Keep the developer tools off production hosts; no query parameter is needed locally.
const localDeveloper=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const studioRequested=new URLSearchParams(location.search).get('studio')==='1';
const githubPreview=location.hostname==='evacuatorkrasnodar-ux.github.io';
if(!localDeveloper&&!(githubPreview&&studioRequested))return;
const button=document.createElement('button');button.id='seyveoCardStudioLaunch';button.type='button';button.textContent='✧ Студия карточек';
const management=document.querySelector('#manageOverview #seyveoCleanManageMenu')||document.querySelector('#manageOverview');
if(management){
 const section=document.createElement('section');section.className='manage-group';section.setAttribute('aria-label','Инструменты разработчика');
 const heading=document.createElement('h2');heading.textContent='Разработчик';
 const note=document.createElement('p');note.textContent='Учебные карточки, проверка сценариев и журнал действий. Только на этом компьютере.';
 section.append(heading,note,button);management.append(section);
 button.style.cssText='display:block;position:static;inset:auto;margin:12px 0;min-height:44px;padding:10px 14px;border:1px solid var(--soft-line);border-radius:16px;background:var(--card2);color:var(--text);font:inherit;';
}else{document.body.append(button);}
const page=document.createElement('section');page.id='seyveoCardStudio';page.hidden=true;
page.innerHTML='<div class="scs-wrap"><header><h2>Студия карточек Сэйви</h2><button type="button" data-close>Закрыть</button></header><p class="scs-note">Только учебные события. Ничего не отправляется.</p><div class="scs-grid"><div class="scs-panel"><label for="scsFamily">Семейство карточки</label><select id="scsFamily"></select><div class="scs-states"></div></div><div class="scs-panel" id="scsPreview"></div></div></div>';
document.body.append(page);
const select=page.querySelector('select'),states=page.querySelector('.scs-states'),preview=page.querySelector('#scsPreview');
entries.forEach((e,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=e[0];select.append(opt)});
const editor=document.createElement('div');editor.className='scs-editor';
editor.innerHTML='<label>Заголовок события<input data-edit="title" maxlength="140"></label><label>Что произошло<textarea data-edit="fact" maxlength="1200" rows="3"></textarea></label><label>Предложение Сэйви<textarea data-edit="suggestion" maxlength="1200" rows="3"></textarea></label><label>Приоритет<select data-edit="priority"><option value="normal">Обычный</option><option value="important">Важный</option><option value="urgent">Срочный</option></select></label>';
select.insertAdjacentElement('afterend',editor);
const fields=Object.fromEntries([...editor.querySelectorAll('[data-edit]')].map(x=>[x.dataset.edit,x]));
function fillEditor(){const e=entries[Number(select.value)];fields.title.value=e[1];fields.fact.value=e[2];fields.suggestion.value=e[3];fields.priority.value='normal'}
fillEditor();
editor.addEventListener('input',render);editor.addEventListener('change',render);
const queuePanel=document.createElement('div');queuePanel.className='scs-panel scs-queue';
queuePanel.innerHTML='<h3>Автоматическая очередь · демо</h3><p class="scs-note">Несколько событий → карточки по важности, без дублей.</p><button type="button" data-generate>Создать учебные события</button><div data-queue-result aria-live="polite"></div>';
page.querySelector('.scs-wrap').append(queuePanel);
// The canonical catalog is rendered together so designers see ALL card families,
// rather than approving a single example and accidentally leaving others behind.
let stage=0,previewTheme='dark';
const gallery=document.createElement('section');
gallery.className='scs-panel scs-gallery';
gallery.innerHTML='<div class="scs-gallery-head"><h3>Все карточки SEYVEO</h3><p class="scs-note">Silver Flat · '+entries.length+' типов · графит #38383A · обе темы</p></div><div class="scs-gallery-grid" data-card-gallery></div>';
page.querySelector('.scs-wrap').append(gallery);
const galleryGrid=gallery.querySelector('[data-card-gallery]');
const policyGuide=document.createElement('p');
policyGuide.className='scs-note';
policyGuide.textContent='Единый язык символов SEYVEO: Сэйви — фирменный знак со сферой, Исправить — карандаш, Перейти — стрелка; затем самолётик «Отправить» либо значок «Сохранить». Значки тонкие, с небольшими подписями и крупной областью касания. Материал #38383A. Свайпы листают очередь, удержание открывает управление карточкой.';
galleryGrid.insertAdjacentElement('beforebegin',policyGuide);
const policyAudit=document.createElement('p');
policyAudit.className='scs-note';
policyAudit.setAttribute('role','status');
policyAudit.setAttribute('aria-live','polite');
galleryGrid.insertAdjacentElement('afterend',policyAudit);
function renderGallery(){
 galleryGrid.replaceChildren();
 let tested=0;
 const errors=[];
 for(const [index,event] of entries.entries()){
  const card=engine.buildCard({id:'studio-gallery-'+index,type:event[6],
   title:event[1],fact:event[2],suggestion:event[3],source:'Мастерская карточек',
   priority:'normal',demo:true});
  if(!card)continue;
  tested++;
  const view=engine.presentation(card);
  const ids=(view?.actions||[]).map(action=>action.id);
  const primaries=(view?.actions||[]).filter(action=>action.role==='primary').length;
  const repeats=ids.length!==new Set(ids).size;
  const adviceDuplicate=!!card.suggestion&&ids.some(id=>engine.cardPolicy.redundantAdviceActions.includes(id));
  const laterButton=ids.includes('later');
  if(primaries>engine.cardPolicy.primaryActionsMax||ids.length>engine.cardPolicy.visibleActionLimit||repeats||adviceDuplicate||laterButton)errors.push(event[0]);
  const sample=document.createElement('div');
  sample.className='scs-gallery-item';
  sample.dataset.cardState='new';
  sample.dataset.previewTheme=previewTheme;
  const surface=engine.renderCard(card,{onAction:id=>{
   const note=sample.querySelector('.scs-gallery-feedback');
   if(id==='hide'||id==='mute-family'){
    sample.dataset.cardState='removed';
    if(note)note.textContent=id==='hide'?'Карточка убрана. Источник сохранён.':'Похожие карточки скрыты. Вернуть можно в Управлении.';
    return;
   }
   if(id==='cycle'){
    galleryGrid.append(sample);
    if(note)note.textContent='Карточка перемещена в конец очереди. Источник сохранён.';
    return;
   }
   if(note)note.textContent=id==='confirm-preview'?'Финальное подтверждение показано · в демо реальной отправки нет.':
      id==='sayvi'?'Предложение Сэйви открыто. Проверьте и нажмите Отправить/Сохранить.':
      id==='edit'?'Редактор открыт. После правки нажмите Отправить/Сохранить.':
      id==='navigate'?'Показан переход к исходному разделу.':'Только демонстрация.';
  }});
  const label=document.createElement('p');label.className='scs-gallery-name';
  label.textContent=(index+1)+' / '+entries.length+' · '+event[0];
  const feedback=document.createElement('p');feedback.className='scs-gallery-feedback';
  feedback.setAttribute('aria-live','polite');
  sample.append(label,surface,feedback);galleryGrid.append(sample);
 }
 policyAudit.textContent=errors.length
  ?'Проверка стандарта: исправить '+errors.join(', ')
  :'Стандарт проверен: '+tested+' типов · Сэйви / Исправить / Перейти → Отправить или Сохранить · #38383A';
}
renderGallery();
const queueResult=queuePanel.querySelector('[data-queue-result]');
function demoQueue(){
 const engine=window.SEYVEO_CARD_ENGINE;
 if(!engine){queueResult.textContent='Движок недоступен';return}
 const importance=['normal','urgent','important'];
 const events=engine.demoEvents().map((item,i)=>({
  ...item,priority:importance[i%importance.length]
 }));
 events.push({...events[0]});
 const cards=engine.fromEvents(events);
 queueResult.replaceChildren();
 const summary=document.createElement('p');summary.className='scs-note';summary.textContent='Событий: '+events.length+' · Уникальных карточек: '+cards.length+' · Срочные показаны первыми';queueResult.append(summary);
 const list=document.createElement('ol');list.className='scs-queue-list';
 cards.forEach(card=>{const item=document.createElement('li');const title=document.createElement('strong');title.textContent=card.title;const meta=document.createElement('span');meta.textContent=card.family+' · '+({urgent:'Срочно',important:'Важно',normal:'Обычно'})[card.priority];item.append(title,meta);list.append(item)});
 queueResult.append(list);
}
queuePanel.querySelector('[data-generate]').addEventListener('click',demoQueue);
const labels=['Новая','В работе','Позже','Завершена','Ошибка'];const statesMap=['new','in-progress','deferred','done','failed'];
labels.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{stage=i;render()});states.append(b)});
function render(){
 const e=entries[Number(select.value)];
 const engine=window.SEYVEO_CARD_ENGINE;
 const eventKey=e[6];
 const card=engine.buildCard({
  id:'studio-'+select.value,type:eventKey,title:fields.title.value,
  fact:fields.fact.value,suggestion:fields.suggestion.value,
  priority:fields.priority.value,source:'Студия разработчика',demo:true
 });
 preview.replaceChildren();
 const toolbar=document.createElement('div');
 toolbar.className='scs-preview-toolbar';
 const caption=document.createElement('strong');caption.textContent='Эталон SEYVEO · Silver Flat · iPhone';
 const toggles=document.createElement('div');toggles.className='scs-theme-switch';toggles.setAttribute('role','group');toggles.setAttribute('aria-label','Тема эталонной карточки');
 for(const [theme,label] of [['dark','Black Velvet'],['light','Белая тема']]){
  const choice=document.createElement('button');choice.type='button';choice.textContent=label;
  choice.setAttribute('aria-pressed',String(previewTheme===theme));
  choice.addEventListener('click',()=>{previewTheme=theme;renderGallery();render()});
  toggles.append(choice);
 }
 toolbar.append(caption,toggles);preview.append(toolbar);
 const phone=document.createElement('div');
 phone.className='scs-phone';phone.dataset.previewTheme=previewTheme;
 phone.setAttribute('aria-label','Карточка на экране iPhone, '+(previewTheme==='light'?'светлая':'тёмная')+' тема');
 const phoneTitle=document.createElement('p');
 phoneTitle.className='scs-phone-label';phoneTitle.textContent='SEYVEO · СЭЙВИ';
 phone.append(phoneTitle);preview.append(phone);
 if(card){
  const surface=engine.renderCard(card,{onAction:id=>{
   // Studio actions only preview the intended action. No real send/payment/
   // signature/task resolution, even if a developer taps "Подтвердить".
   if(id==='hide'||id==='mute-family'){
    surface.dataset.cardState='removed';
    studioAction.textContent=id==='hide'?'Карточка убрана, но исходное событие сохранено.':'Похожие карточки скрыты. Вернуть можно в Управлении.';
    return;
   }
   if(id==='cycle'){
    surface.hidden=true;
    studioAction.textContent='Одна карточка · пауза на час. Источник не удалён. Выберите другое семейство для нового предпросмотра.';
    return;
   }
   studioAction.textContent=id==='confirm-preview'?'Финальное подтверждение нажато · реальные отправка и сохранение отключены.':
      id==='sayvi'?'Сэйви готовит предложение. Для проверки видна финальная кнопка.':
      id==='edit'?'Человек исправляет текст. Для проверки видна финальная кнопка.':
      id==='navigate'?'Показан переход, реальные данные Мастерская не открывает.':
      'Выбрано '+(engine.actionLabels[id]||id)+' · только демо.';
  }});
  surface.dataset.cardState=statesMap[stage];
  const stateInfo=document.createElement('div');
  stateInfo.className='scs-state-line';
  const stateName=document.createElement('span');
  stateName.className='scs-state-name';
  stateName.textContent=labels[stage];
  const stateDetail=document.createElement('span');
  stateDetail.className='scs-state-detail';
  stateDetail.textContent=[
   'Карточка ожидает решения',
   'Сэйви помогает выполнить действие',
   'Не требует внимания прямо сейчас',
   'Действие завершено в учебном сценарии',
   'Действие не выполнено, нужен повтор'
  ][stage];
  stateInfo.append(stateName,stateDetail);
  phone.append(stateInfo,surface);
 }else{
  const missing=document.createElement('p');missing.className='scs-note';
  missing.textContent='Заполните заголовок и описание события.';
  phone.append(missing);
 }
 const studioAction=document.createElement('p');studioAction.className='scs-note';
 studioAction.setAttribute('aria-live','polite');
 preview.append(studioAction);
 [...states.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===stage)));
}
function openStudio(){page.hidden=false;render()}
button.addEventListener('click',openStudio);
if(githubPreview&&studioRequested){openStudio();}
page.querySelector('[data-close]').addEventListener('click',()=>{page.hidden=true});
select.addEventListener('change',()=>{stage=0;fillEditor();render()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')page.hidden=true});
// Developer-only live Home walkthrough: never sends messages or changes real tasks.
const home=document.getElementById('homePage');
const dock=document.getElementById('seyveoLivingMoment');
if(home&&dock){
 const history=[];
 const live=document.createElement('section');
 live.id='seyveoStudioHomeDemo';live.hidden=true;
 live.setAttribute('aria-label','Учебная карточка разработчика');
 live.className='sv-card-studio-home-preview';
 dock.insertAdjacentElement('afterend',live);
 const launch=document.createElement('button');launch.type='button';launch.textContent='Показать событие на Главной · демо';launch.style.cssText='min-height:44px;margin:12px 0;padding:6px 12px;border:1px solid var(--soft-line);border-radius:99px;background:transparent;color:var(--text);font:inherit;cursor:pointer;';
 page.querySelector('.scs-wrap').append(launch);
 const audit=document.createElement('p');audit.className='scs-note';audit.setAttribute('aria-live','polite');audit.textContent='Журнал действий пока пуст. Отправка и подпись отключены.';page.querySelector('.scs-wrap').append(audit);
 let counter=0;
 function record(type,card){history.unshift(type+' · '+card.title+' · '+new Date().toLocaleTimeString('ru-RU'));audit.textContent=history.slice(0,7).join(' | ');}
 function show(card){
  live.replaceChildren();live.hidden=false;
  const surface=engine.renderCard(card,{onAction:id=>{
   record('Нажато '+(engine.actionLabels[id]||id)+' · демо без выполнения',card);
   if(id==='cycle'||id==='hide'||id==='mute-family'){live.hidden=true;live.replaceChildren();}
   else{
    const status=live.querySelector('[data-studio-action-status]');
    if(status)status.textContent='Действие показано как пример. Реальное выполнение не подключено.';
   }
  }});
  if(!surface)return;
  live.append(surface);
  const status=document.createElement('p');
  status.className='scs-note';status.dataset.studioActionStatus='true';
  status.setAttribute('role','status');live.append(status);
  const reopen=document.createElement('button');reopen.type='button';
  reopen.className='sv-card-studio-back';
  reopen.textContent='В мастерскую';
  reopen.addEventListener('click',()=>{
   page.hidden=false;record('Открыта мастерская',card);
  });
  live.append(reopen);
  record('Показано на Главной',card);
 }
 launch.addEventListener('click',()=>{
  const engine=window.SEYVEO_CARD_ENGINE;
  const eventKey=entries[Number(select.value)][6];
  const card=engine.buildCard({
   id:'studio-home-'+(++counter),type:eventKey,title:fields.title.value,
   fact:fields.fact.value,suggestion:fields.suggestion.value,
   priority:fields.priority.value,source:'Студия разработчика',demo:true
  });
  if(!card){audit.textContent='Заполни заголовок и описание события.';return;}
  page.hidden=true;
  const main=document.getElementById('homePage');if(main)main.hidden=false;
  window.dispatchEvent(new CustomEvent('seyveo:studio-home-preview',{detail:{id:card.id,type:card.eventType}}));
  show(card);
  live.scrollIntoView({behavior:'smooth',block:'nearest'});
 });
}
// Local AI coaching: store only examples the developer explicitly approves.
const learning=document.createElement('section');learning.className='scs-panel';
const heading=document.createElement('h3');heading.textContent='Память Сэйви · обучение на примерах';
const note=document.createElement('p');note.className='scs-note';
note.textContent='Сэйви будет учитывать только одобренные ответы. Не вводите сюда пароли или личные данные.';
const question=document.createElement('textarea');question.rows=2;question.maxLength=600;question.placeholder='Пример вопроса пользователя';
const answer=document.createElement('textarea');answer.rows=4;answer.maxLength=1800;answer.placeholder='Правильный ответ Сэйви';
const save=document.createElement('button');save.type='button';save.textContent='Обучить Сэйви на этом примере';
const status=document.createElement('p');status.className='scs-note';status.setAttribute('aria-live','polite');
const loadStats=async()=>{try{const r=await fetch('/api/seyveo-learning-stats');const v=await r.json();status.textContent='Одобрено примеров: '+v.count+' · веса Qwen3 не меняются';}catch{status.textContent='Локальный модуль памяти пока недоступен';}};
save.addEventListener('click',async()=>{
 if(!question.value.trim()||!answer.value.trim()){status.textContent='Заполни вопрос и правильный ответ.';return;}
 save.disabled=true;
 try{const r=await fetch('/api/seyveo-learning-approve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question:question.value,answer:answer.value})});
  if(!r.ok)throw Error('Не удалось сохранить');question.value='';answer.value='';await loadStats();
 }catch{status.textContent='Не удалось сохранить. Проверь локальный сервер.';}
 finally{save.disabled=false;}
});
for(const el of [heading,note,question,answer,save,status])learning.append(el);
page.querySelector('.scs-wrap').append(learning);
button.addEventListener('click',loadStats);
render();
})();