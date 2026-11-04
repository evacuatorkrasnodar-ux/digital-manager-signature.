/* SEYVEO Smart Start preserved as a standalone onboarding flow.
   Existing private draft logic is kept intact during the Sayvi chat rebuild. */
/* SEYVEO Smart Start · guided steps in the original conversation.
 * All controls are local DOM elements inside existing Sayvi turns.
 * Explicit consent before saving. No artificial chat history, integrations
 * or server roles are created by this walkthrough.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const chat=window.SEYVEO_CONVERSATION,composer=$('ask'),thread=$('orbInlineReplyText');
 const home=$('svSmartStartHome'),homeForm=$('svSmartStartHomeForm');
 if(!chat||!composer||!thread)return;
 const PLAN_KEY='seyveo-smart-start-v1',DRAFT_KEY='seyveo-smart-start-draft-v1',SKIP_KEY='seyveo-smart-start-home-later-v1',OPT_OUT_KEY='seyveo-smart-start-opt-out-v1';
 const ROLES=['Управляющий','Кассир','Продавец','Кладовщик','Завхоз','Водитель','Грузчик','Бухгалтер','Кадровик','Директор магазина','Администратор','Повар','Официант','Бариста','Курьер','Прораб','Строитель','Мастер','Менеджер','Другая должность'];
 const roleSuggestions=business=>/магазин|торгов|продукт/i.test(business)?['Директор магазина','Управляющий','Кассир','Продавец','Кладовщик','Завхоз','Водитель','Грузчик','Бухгалтер','Другая должность']:/ресторан|кафе|общепит/i.test(business)?['Управляющий','Администратор','Повар','Официант','Бариста','Кассир','Курьер','Бухгалтер','Другая должность']:/строит|ремонт|монтаж/i.test(business)?['Прораб','Строитель','Мастер','Водитель','Менеджер','Бухгалтер','Другая должность']:['Управляющий','Менеджер','Администратор','Кассир','Водитель','Бухгалтер','Кадровик','Другая должность'];
 const SOURCES=['1С','Битрикс24','Кассовая система','Excel / CSV','Другая программа','Пока ничем'];
 const FEATURES=[
  {id:'team',title:'Команда и поручения',detail:'Личные и групповые чаты, задачи и контроль после подключения защищённых аккаунтов'},
  {id:'docs',title:'Документы',detail:'Рабочие файлы и согласования с ограничением доступа'},
  {id:'sales',title:'Продажи и товары',detail:'Реальные показатели после подключения 1С, CRM или кассовой системы'},
  {id:'finance',title:'Финансы',detail:'Данные из банка после разрешения; переводы подтверждаются отдельно'}
 ];
 let session=null,cabinetHandoffTimer=null,greetingDismissedInSession=false;
 function get(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
 function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
 function el(tag,cls,value){
  const e=document.createElement(tag);
  if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;
 }
 function btn(label,fn,cls=''){
  const b=el('button','sv-smart-start-btn'+(cls?' '+cls:''),label);
  b.type='button';b.addEventListener('click',fn);return b;
 }
 function prompt(){
  if(!session)return '';
  switch(session.step){
   case 'name':return 'Как к вам обращаться? Для знакомства достаточно имени.';
   case 'business':return 'Для чего тебе SEYVEO? Выбери сферу бизнеса или вариант «Для себя». Можно просто посмотреть приложение.';
   case 'employees':return 'Сколько человек работает в компании, включая вас? Это поможет предложить подходящие возможности для команды.';
   case 'roles':return 'Какие должности есть в команде? Отметьте нужные. В будущем вы сможете назначать поручения прямо из защищённого чата и обмениваться рабочими документами.';
   case 'systems':return 'Какими программами вы пользуетесь? Подключённые 1С, Битрикс24 или касса помогут показывать реальные показатели — когда соответствующие интеграции заработают.';
   case 'features':return 'Что вам хотелось бы настроить? Выберите нужные направления.';
   case 'confirm':return 'Посмотрите план. Ничего не подключится автоматически. Сохранить ответы на этом устройстве?';
   default:return '';
  }
 }
 function choices(container,property,entries,notes={}){
  const list=el('div','sv-smart-start-checklist');
  for(const [id,label] of entries){
   const row=el('label','sv-smart-start-checkrow'),check=el('input'),body=el('span');
   check.type='checkbox';check.value=id;check.checked=session[property].includes(id);
   body.append(el('strong',null,label));
   if(notes[id])body.append(el('small',null,notes[id]));
   check.addEventListener('change',()=>{
    const next=new Set(session[property]);
    if(property==='sources'&&check.checked){
     if(id==='Пока ничем')next.clear();else next.delete('Пока ничем');
    }
    if(check.checked)next.add(id);else next.delete(id);
    session[property]=[...next];
    if(property==='sources')list.querySelectorAll('input').forEach(input=>{input.checked=next.has(input.value)});
   });
   row.append(check,body);list.append(row);
  }
  container.append(list);
 }
 function draw(){
  if(!session)return;
  chat.open();
  chat.renderTurns([...(window.SEYVEO_DEMO_CHAT_TURNS||[]),...session.turns]);
  const bubbles=thread.querySelectorAll('.seyveo-conversation-turn--sayvi');
  const last=bubbles[bubbles.length-1];if(!last)return;
  const wrap=el('div','sv-smart-start-controls'),step=session.step;
  if(step==='name'||step==='employees'){
   const row=el('div','sv-smart-start-answer'),input=el('input');
   input.type=step==='employees'?'number':'text';input.inputMode=step==='employees'?'numeric':'text';
   input.placeholder=step==='name'?'Например, Роман':'Например, 12';
   if(step==='employees'){input.min='1';input.max='100000'}else input.maxLength=60;
   input.setAttribute('aria-label',step==='name'?'Имя':'Количество сотрудников');
   input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();advance(input.value)}});
   row.append(input,btn('Продолжить',()=>advance(input.value),'is-primary'));wrap.append(row);
  }else if(step==='business'){
   const chips=el('div','sv-smart-start-chips');
   for(const option of ['Продуктовые магазины','Ресторан или кафе','Строительство','Услуги','Для себя','Просто посмотреть'])
    chips.append(btn(option,()=>option==='Просто посмотреть'?exploreApp():advance(option),'is-chip'));
   wrap.append(chips,el('small','sv-smart-start-note','Свой вариант можно написать в обычном поле чата.'));
  }else if(['roles','sources','features'].includes(step)){
   const suggested=roleSuggestions(session.business);
   const data=step==='roles'?[...new Set([...suggested,...session.roles].filter(x=>x!=='Другая должность'))].map(x=>[x,x]):
    step==='sources'?[...new Set([...SOURCES,...session.sources])].map(x=>[x,x]):FEATURES.map(x=>[x.id,x.title]);
   const notes=step==='features'?Object.fromEntries(FEATURES.map(x=>[x.id,x.detail])):{};
   choices(wrap,step,data,notes);
   if(step==='sources')wrap.append(el('small','sv-smart-start-note',
    'Сейчас это выбор для плана, а не вход в 1С или Битрикс24. Пароли и токены не нужны.'));
   if(step==='roles')wrap.append(el('small','sv-smart-start-note',
    'Нет нужной должности? Напишите её название в поле чата — я добавлю в план.'));
   if(step==='sources')wrap.append(el('small','sv-smart-start-note',
    'Можно написать название другой программы прямо в чате.'));
   wrap.append(btn('Продолжить',()=>advance('__selected__'),'is-primary'));
  }else if(step==='confirm'){
   const summary=el('div','sv-smart-start-summary');
   for(const [label,value] of [
    ['Имя',session.name||'Не указано'],['Деятельность',session.business||'Не указана'],
    ['Сотрудников',String(session.employees||'—')],['Должности',session.roles.join(', ')||'Позже'],
    ['Программы',session.sources.join(', ')||'Позже'],
    ['Направления',session.features.map(id=>FEATURES.find(x=>x.id===id)?.title).filter(Boolean).join(', ')||'Позже']
   ]){
    const p=el('p');p.append(el('strong',null,label+': '),document.createTextNode(value));summary.append(p);
   }
   wrap.append(summary,btn('Сохранить план',finish,'is-primary'));
  }else if(step==='done'){
   wrap.append(btn('Посмотреть мой кабинет',revealCabinet,'is-primary'));
   wrap.append(btn('Пока останусь в чате',()=>{
    if(cabinetHandoffTimer)clearTimeout(cabinetHandoffTimer);
    cabinetHandoffTimer=null;
    chat.status('Конечно. Кабинет готов, когда захочешь его посмотреть.',3400);
   }));
  }
  if(step!=='done'){
   const foot=el('div','sv-smart-start-footer');
   if(step!=='name')foot.append(btn('Назад',back));
   foot.append(btn('Продолжить позже',()=>pause(false)));
   wrap.append(foot);
  }
  last.append(wrap);
  chat.status('Знакомство · настройка SEYVEO');
  requestAnimationFrame(()=>{thread.scrollTop=thread.scrollHeight});
 }
 // Make free-text answers equivalent to the same checkboxes. Never discard them
 // while moving to the next step. Unknown professions are allowed as labels,
 // NOT as permission templates. They grant no access.
 function acceptFreeText(step,value){
  if(value==='__selected__')return true;
  if(/^(?:позже|пропустить|пока не знаю)$/i.test(value)){
   session[step]=[];return true;
  }
  if(step==='roles'){
   const normalizeRole=raw=>{
    const label=raw.trim().replace(/\s+/g,' ').slice(0,60);
    if(/^кассир[ыа-я]*$/iu.test(label))return 'Кассир';
    if(/^водител[ьиуяе]*$/iu.test(label))return 'Водитель';
    if(/^продавц[ыа-я]*|^продавец$/iu.test(label))return 'Продавец';
    if(/^кладовщик[иа-я]*$/iu.test(label))return 'Кладовщик';
    if(/^бухгалтер[ыа-я]*$/iu.test(label))return 'Бухгалтер';
    if(/^грузчик[иа-я]*$/iu.test(label))return 'Грузчик';
    return label;
   };
   const parts=value.split(/[,;\n]+|\s+и\s+(?=[А-ЯЁа-яё])/i)
    .map(normalizeRole).filter(Boolean);
   if(!parts.length)return false;
   session.roles=[...new Set([...session.roles,...parts])].slice(0,30);
   return true;
  }
  if(step==='sources'){
   const names=[];
   if(/(?:^|\W)1\s*[cс](?:$|\W)/iu.test(value))names.push('1С');
   if(/битр[ие]кс|bitrix/iu.test(value))names.push('Битрикс24');
   if(/касс|эвотор|атол|штрих[- ]?м/iu.test(value))names.push('Кассовая система');
   if(/excel|эксел|csv|таблиц/iu.test(value))names.push('Excel / CSV');
   if(/^(?:нет|ничего|не пользуюсь|пока ничем)$/iu.test(value))names.push('Пока ничем');
   if(!names.length){
    const typed=value.slice(0,65);
    names.push('Другая программа: '+typed);
   }
   if(names.includes('Пока ничем'))session.sources=['Пока ничем'];
   else session.sources=[...new Set([...session.sources.filter(x=>x!=='Пока ничем'),...names])].slice(0,15);
   return true;
  }
  if(step==='features'){
   const found=[];
   if(/сотрудник|поручени|команд|чат|смен|персонал|кадр/i.test(value))found.push('team');
   if(/документ|договор|акт|согласован|письм|эдо/i.test(value))found.push('docs');
   if(/продаж|выручк|товар|склад|остатк|клиент|заказ/i.test(value))found.push('sales');
   if(/банк|ден[ье]г|финанс|плат[её]ж|сч[её]т/i.test(value))found.push('finance');
   if(!found.length)return false;
   session.features=[...new Set([...session.features,...found])];
   return true;
  }
  return false;
 }
 function choiceSummary(step){
  const entries=session[step]||[];
  if(!entries.length)return 'Выберу позже';
  return step==='features'?entries.map(id=>FEATURES.find(x=>x.id===id)?.title||id).join(', '):entries.join(', ');
 }
 function advance(value){
  if(!session)return;
  const raw=String(value||'').trim().slice(0,400);
  if(!raw){chat.status('Укажите ответ',2500);return}
  if(/^(отмена|выйти)$/i.test(raw)){pause(false);return}
  if(/парол[ья]|api[_ -]?key|access[_ -]?token|client[_ -]?secret|bearer\s|банковск.{0,8}код/i.test(raw)){
   chat.status('Пароли, коды и ключи доступа здесь вводить не нужно',4200);return;
  }
  const oldStep=session.step;
  let shown=raw;
  if(oldStep==='name'){session.name=raw.slice(0,60);session.step='business'}
  else if(oldStep==='business'){
   if(/^(?:просто посмотреть|посмотреть|пока без настройки)$/i.test(raw)){exploreApp();return}
   const personal=/^для себя$|^личн(?:ое|ый|ая)(?:\s|$)/i.test(raw);
   session.business=personal?'Для себя':raw.slice(0,160);
   session.step=personal?'confirm':'employees';
   if(personal)session.employees=1;
  }else if(oldStep==='employees'){
   const n=Number(raw.replace(/\s/g,''));
   if(!Number.isInteger(n)||n<1||n>100000){chat.status('Укажите целое число от 1 до 100000',2900);return}
   session.employees=n;session.step='roles';
  }else if(oldStep==='roles'||oldStep==='sources'||oldStep==='features'){
   if(!acceptFreeText(oldStep,raw)){
    chat.status('Отметьте нужные пункты или напишите, что хотите настроить',3600);
    return;
   }
   shown=choiceSummary(oldStep);
   session.step=oldStep==='roles'?'sources':oldStep==='sources'?'features':'confirm';
  }else if(oldStep==='confirm'){
   if(/^(сохранить|готово)$/i.test(raw)){finish();return}
   chat.status('Подтвердите кнопкой «Сохранить план»',2400);return;
  }else return;
  session.turns.push({question:shown,answer:prompt(),smartStart:true});
  draw();
 }
 function back(){
  if(!session)return;
  const steps=['name','business','employees','roles','sources','features','confirm'];
  const n=steps.indexOf(session.step);
  if(n<1)return;
  session.step=steps[n-1];
  if(session.business==='Для себя'&&session.step==='features')session.step='business';
  session.turns.push({question:'Вернуться',answer:prompt(),smartStart:true});
  draw();
 }
 function pause(silent){
  if(cabinetHandoffTimer)clearTimeout(cabinetHandoffTimer);
  cabinetHandoffTimer=null;
  if(!session)return;
  if(session.step!=='done'){
   const {name,business,employees,roles,sources,features,step}=session;
   if(!save(DRAFT_KEY,{name,business,employees,roles,sources,features,step})){
    if(!silent){chat.status('Не удалось сохранить черновик',2800);return}
   }
  }
  session=null;chat.renderTurns(window.SEYVEO_DEMO_CHAT_TURNS||[]);
  syncHome();
  if(!silent)chat.status('Сохранила ответы. Продолжим, когда удобно.',3000);
 }
 function revealCabinet(){
  if(!session||session.step!=='done')return;
  if(cabinetHandoffTimer)clearTimeout(cabinetHandoffTimer);
  cabinetHandoffTimer=null;
  const plan=get(PLAN_KEY);
  if(!plan)return;
  const result=session.cabinetLayoutResult;
  // Leave the private setup and navigate through existing destinations only.
  session=null;
  chat.close();
  if(plan.business==='Для себя'){
   $('navPicture')?.click();
   return;
  }
  const work=window.SEYVEO_UNIFIED_TASKS;
  if(typeof work?.openBusiness!=='function')return;
  if(!window.SEYVEO_PREVIEW?.isManager?.()){
   // An intentional Business VIEW switch in the local prototype, not server access.
   work.previewRole?.('manager');
  }
  work.openBusiness('home');
  window.SEYVEO_SMART_CABINET?.showArrival?.(plan,result);
 }
 function finish(){
  if(!session)return;
  const {name,business,employees,roles,sources,features}=session;
  const record={version:1,name,business,employees,roles:roles.slice(),sources:sources.slice(),
   features:features.slice(),connected:false,updatedAt:new Date().toISOString()};
  if(!save(PLAN_KEY,record)){chat.status('Не удалось сохранить на устройстве',3000);return}
  const layoutResult=window.SEYVEO_SMART_CABINET?.prepareFromPlan?.(record);
  session.cabinetLayoutResult=layoutResult;
  try{localStorage.removeItem(DRAFT_KEY)}catch{}
  if(name){
   try{
    const key='seyveo-first-acquaintance-v1',prev=get(key)||{};
    const focus=['life','start','pro','max'].includes(prev.focus)?prev.focus:(business==='Для себя'?'life':'pro');
    save(key,{...prev,schemaVersion:1,name,focus,assistantName:'Сэйви',
     assistantVoice:'female',assistantAliases:['Сэйви','Сэй','SEYVEO'],lifeIncluded:true,
     createdAt:prev.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
    window.dispatchEvent(new Event('seyveo:profile-changed'));
   }catch{}
  }
  session.step='done';
  const note=business==='Для себя'?
   'Готово! Я сохранила твои пожелания. Сейчас покажу «Мой мир» — там есть музыка, браузер, личная почта и другие возможности.':
   (layoutResult?.reason==='existing-layout'?
    'Готово! Я учла твои ответы, а прежний порядок кабинета сохранила. Сейчас покажу его — вместе сможем изменить всё, что захочешь.':
    'Готово! Я подготовила тебе кабинет из доступных инструментов для твоей работы. Сейчас покажу его — можем добавить нужное, убрать лишнее и передвинуть карточки пальцем.')+
   '\nА ещё в «Моём мире» есть музыка, собственный браузер и личная почта.';
  session.turns.push({question:'Сохранить мой план',answer:note+
   '\nУчётные программы, банки и защищённые аккаунты сотрудников ещё не подключены — их настроим отдельно, когда функции станут доступны.',smartStart:true});
  draw();
  syncHome();
  window.dispatchEvent(new Event('seyveo:smart-start-complete'));
  // A short reading pause, or tap "Посмотреть мой кабинет" to go immediately.
  // Do not navigate away while writing or while app is hidden.
  if(cabinetHandoffTimer)clearTimeout(cabinetHandoffTimer);
  cabinetHandoffTimer=setTimeout(()=>{
   if(session?.step==='done'&&document.visibilityState==='visible'&&
    document.documentElement.classList.contains('seyveo-conversation')&&
    !String($('question')?.value||'').trim())revealCabinet();
  },6000);
 }
 function begin(opts={}){
  if(cabinetHandoffTimer)clearTimeout(cabinetHandoffTimer);
  cabinetHandoffTimer=null;
  const draft=opts.resume?get(DRAFT_KEY):null,old=get(PLAN_KEY);
  // Revisiting the setup must show previous answers instead of restarting.
  const seed=draft||old||{};
  let name=String(opts.name||seed.name||get('seyveo-first-acquaintance-v1')?.name||'').trim().slice(0,60);
  session={
   name,business:String(seed.business||'').slice(0,160),employees:Number(seed.employees)||null,
   roles:Array.isArray(seed.roles)?seed.roles.filter(v=>typeof v==='string'&&v.length<=60).slice(0,30):[],
   sources:Array.isArray(seed.sources)?seed.sources.filter(v=>typeof v==='string'&&v.length<=85).slice(0,15):[],
   features:Array.isArray(seed.features)?seed.features.filter(v=>FEATURES.some(x=>x.id===v)):[],
   step:['name','business','employees','roles','sources','features','confirm'].includes(draft?.step)?draft.step:old?'confirm':name?'business':'name',
   turns:[]
  };
  if(!session.name)session.step='name';
  session.turns.push({question:old&&!draft?'Вернуться к настройкам SEYVEO':'Начнём знакомство с SEYVEO',answer:
   (name?'Рада видеть тебя, '+name+'! ':'Привет! Я Сэйви. Меня создала команда SEYVEO. Друзья зовут меня просто Сэй. ')+
   (old&&!draft?'Вот твои сохранённые ответы. Можешь вернуться назад и изменить любой шаг. ':'Давай настроим SEYVEO под твои задачи. ')+prompt()+
   '\nМожно отвечать вручную или отмечать галочки. Подключения и приглашения не запускаются автоматически.',smartStart:true});
  draw();syncHome();
  return true;
 }
 composer.addEventListener('submit',event=>{
  const input=$('question'),value=String(input?.value||'').trim();
  if(!session){
   // An explicit request should start setup from ordinary Sayvi chat.
   const wantsSetup=/^(?:с[эе]йви[!,\s]*)?(?:помоги\s+(?:мне\s+)?настроить\s+(?:seyveo|сейвео|мой\s+бизнес|кабинет|приложение)|давай\s+познакомимся|начн[её]м\s+настройку|настроим\s+(?:мой\s+)?бизнес)/iu.test(value);
   if(!wantsSetup)return;
   event.preventDefault();event.stopImmediatePropagation();
   if(input){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}))}
   begin({resume:!!get(DRAFT_KEY)});
   return;
  }
  if(session.step==='done')return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!value)return;
  input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
  advance(value);
 },true);
 function isHomeRoute(){
  const route=location.hash;
  return !route||route==='#'||route==='#home';
 }
 function syncHome(){
  if(!home)return;
  let skipped=false,optedOut=false;
  try{
   skipped=localStorage.getItem(SKIP_KEY)==='1';
   optedOut=localStorage.getItem(OPT_OUT_KEY)==='1';
  }catch{}
  const visible=isHomeRoute()&&!greetingDismissedInSession&&!skipped&&!optedOut&&
   !session&&!get('seyveo-first-acquaintance-v1')&&!get(PLAN_KEY)&&!get(DRAFT_KEY);
  home.hidden=!visible;
  if(!visible)home.classList.remove('is-greeting');
  document.documentElement.classList.toggle('sv-smart-start-home-active',visible);
  const entry=$('svCabinetStartWithSayvi')?.querySelector('span');
  if(entry)entry.textContent=get(DRAFT_KEY)?'Продолжить настройку с Сэйви':'Настроить компанию с Сэйви';
  if(visible)$('seyveoNameTip')?.setAttribute('hidden','');
 }
 function dismissHome(mode='later'){
  clearNameIdle();
  greetingDismissedInSession=true;
  try{localStorage.setItem(mode==='opt-out'?OPT_OUT_KEY:SKIP_KEY,'1')}catch{}
  if(home){home.hidden=true;home.classList.remove('is-greeting')}
  document.documentElement.classList.remove('sv-smart-start-home-active');
 }
 function exploreApp(){
  if(session){
   const started=Boolean(session.business||session.employees||session.roles.length||
    session.sources.length||session.features.length);
   if(started)pause(true);
   else{
    session=null;
    chat.renderTurns(window.SEYVEO_DEMO_CHAT_TURNS||[]);
   }
  }
  dismissHome('later');
  chat.close();
 }
 // First acquaintance should flow into the existing large chat as soon
 // as the person finishes typing, without another "Continue" button.
 // A short idle interval prevents navigating in the middle of keystrokes.
 const homeNameInput=$('svSmartStartHomeName');
 let nameIdleTimer=null,nameComposing=false;
 const homeTitle=$('svSmartStartHomeTitle');
 const homeMessage=$('svSmartStartHomeMessage');
 const homeHint=$('svSmartStartHomeHint');
 function clearNameIdle(){
  if(nameIdleTimer!==null)clearTimeout(nameIdleTimer);
  nameIdleTimer=null;
 }
 function resetNameGreeting(){
  home?.classList.remove('is-greeting');
  if(homeTitle)homeTitle.textContent='Привет! Я Сэйви';
  if(homeMessage)homeMessage.textContent='SEYVEO — команда, которая меня создала. Друзья зовут меня просто Сэй. А как мне обращаться к тебе?';
  if(homeHint)homeHint.textContent='Напиши своё имя — и продолжим знакомство.';
 }
 function enterChatAfterName(){
  clearNameIdle();
  if(!home||home.hidden||session||document.visibilityState==='hidden'||!isHomeRoute())return;
  const name=String(homeNameInput?.value||'').trim().replace(/\s+/g,' ').slice(0,60);
  if(!name)return;
  home.hidden=true;
  document.documentElement.classList.remove('sv-smart-start-home-active');
  begin({name,resume:!!get(DRAFT_KEY)});
 }
 function greetBeforeChat(){
  clearNameIdle();
  if(!home||home.hidden||session||document.visibilityState==='hidden'||nameComposing||!isHomeRoute())return;
  const name=String(homeNameInput?.value||'').trim().replace(/\s+/g,' ').slice(0,60);
  if(name.length<2)return;
  homeNameInput?.blur(); // Close the iPhone keyboard so Sayvi's greeting is visible.
  home.classList.add('is-greeting');
  if(homeTitle)homeTitle.textContent='Рада знакомству, '+name+'!';
  if(homeMessage)homeMessage.textContent='Ну что, настроим SEYVEO под тебя? Для бизнеса или для себя — решим вместе.';
  if(homeHint)homeHint.textContent='Открываю чат Сэйви…';
  // Give the greeting a moment to be read. No "Continue" control.
  nameIdleTimer=setTimeout(enterChatAfterName,1450);
 }
 function scheduleNameTransition(){
  clearNameIdle();resetNameGreeting();
  if(nameComposing||!home||home.hidden||session||!isHomeRoute())return;
  if(String(homeNameInput?.value||'').trim().length<2)return;
  // Avoid navigating in the middle of typing a name.
  nameIdleTimer=setTimeout(greetBeforeChat,1600);
 }
 homeNameInput?.addEventListener('input',scheduleNameTransition);
 homeNameInput?.addEventListener('compositionstart',()=>{nameComposing=true;clearNameIdle()});
 homeNameInput?.addEventListener('compositionend',()=>{nameComposing=false;scheduleNameTransition()});
 homeNameInput?.addEventListener('keydown',event=>{
  if(event.key!=='Enter'||event.isComposing||nameComposing)return;
  event.preventDefault();greetBeforeChat();
 });
 homeForm?.addEventListener('submit',event=>{event.preventDefault();greetBeforeChat()});
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){
   clearNameIdle();
  }else if(home&&!home.hidden&&!session){
   // Returning from another app must not trigger an unexpected redirect.
   resetNameGreeting();
  }
 });
 $('svSmartStartHomeLater')?.addEventListener('click',()=>dismissHome('later'));
 $('svSmartStartHomeOptOut')?.addEventListener('click',()=>dismissHome('opt-out'));
 // Give normal app navigation precedence over the onboarding timer.
 // Capturing the click BEFORE route handlers prevents a late automatic jump.
 document.addEventListener('click',event=>{
  if(!home||home.hidden)return;
  const target=event.target;
  if(!(target instanceof Element)||home.contains(target))return;
  if(!target.closest('button,a,summary,[role="button"]'))return;
  dismissHome('exploring');
 },true);
 $('svCabinetStartWithSayvi')?.addEventListener('click',()=>{
  $('svCabinetDialog')?.close?.();
  begin({resume:!!get(DRAFT_KEY)});
 });
 // Reuse the existing "Tell Sayvi about my business" entry. Capture before
 // the legacy handler so it does not open two competing introductions.
 $('openSayviBusinessIntro')?.addEventListener('click',event=>{
  event.preventDefault();event.stopImmediatePropagation();
  begin({resume:!!get(DRAFT_KEY)});
 },true);
 $('seyveoConversationBack')?.addEventListener('click',()=>pause(true),true);
 window.addEventListener('seyveo:conversation-closed',()=>{if(session)pause(true)});
 window.addEventListener('hashchange',()=>{
  if(home&&!home.hidden&&!isHomeRoute())dismissHome('exploring');
  if(session&&location.hash&&!['#home','#'].includes(location.hash))pause(true);
 });
 window.addEventListener('seyveo:profile-changed',syncHome);
 window.addEventListener('storage',event=>{
  if([PLAN_KEY,DRAFT_KEY,'seyveo-first-acquaintance-v1',SKIP_KEY,OPT_OUT_KEY].includes(event.key))syncHome();
 });
 syncHome();
 window.SEYVEO_SMART_START=Object.freeze({begin,resume:()=>begin({resume:true}),getPlan:()=>get(PLAN_KEY)});
})();
