/* SEYVEO · Smart Contacts, local onboarding only.
 * This UI stores preferences, not provider consent or imported contacts.
 * Real provider and phone address book access require separate verified authorization. */
(()=>{
 'use strict';
 const KEY='seyveo-mail-contacts-preferences-v1';
 const SPACES=['personal','business'];
 const make=(tag,cls,value)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(value!==undefined)node.textContent=value;
  return node;
 };
 const pict=(paths)=>{
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
  svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');
  svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');
  svg.innerHTML=paths;return svg;
 };
 const ICON={
  back:'<path d="m15 5-7 7 7 7"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><path d="M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/>',
  book:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 3v18M12 8h5M12 12h5"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
  spark:'<path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2ZM19 17l.6 2.4L22 20l-2.4.6L19 23l-.6-2.4L16 20l2.4-.6L19 17Z"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  arrow:'<path d="m9 5 7 7-7 7"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
 };
 const defaults=()=>({book:false,correspondents:false,groups:false,configured:false});
 const load=()=>{
  const result={personal:defaults(),business:defaults()};
  try{
   const json=JSON.parse(localStorage.getItem(KEY)||'{}');
   for(const scope of SPACES){
    if(json&&typeof json[scope]==='object'){
     for(const prop of ['book','correspondents','groups','configured']){
      result[scope][prop]=json[scope][prop]===true;
     }
    }
   }
  }catch{}
  return result;
 };
 let preferences=load();
 function save(){
  try{localStorage.setItem(KEY,JSON.stringify(preferences));return true}
  catch{return false}
 }
 function hasSaved(scope){return !!preferences[scope]?.configured}
 function connected(service,scope){
  const provider=window.SEYVEO_VERIFIED_CONNECTIONS;
  if(typeof provider?.isConnected!=='function')return false;
  try{return provider.isConnected(service,scope)===true}catch{return false}
 }
 const SAMPLES={
  personal:[
   {initial:'М',name:'Мария',category:'Семья',note:'Пример контакта'},
   {initial:'А',name:'Алексей',category:'Друзья',note:'Пример контакта'}
  ],
  business:[
   {initial:'А',name:'Андрей',category:'Клиенты',note:'Пример контакта'},
   {initial:'П',name:'Проектный отдел',category:'Коллеги',note:'Пример контакта'}
  ]
 };
 function mount({host,onBack,onConnect,onSaved}={}){
  if(!host)throw new Error('Mail Smart Contacts needs an existing workspace');
  const page=make('section','sv-mail-contacts-page');page.hidden=true;
  page.setAttribute('aria-label','Умные контакты SEYVEO');
  host.append(page);
  let selected='personal',open=false;
  const staged={personal:{...preferences.personal},business:{...preferences.business}};
  const infoText={
   book:{icon:'book',label:'Адресная книга',hint:'Запросить отдельный доступ к контактам почтового сервиса'},
   correspondents:{icon:'mail',label:'Люди из переписки',hint:'Предлагать адреса, с которыми вы переписываетесь'},
   groups:{icon:'spark',label:'Категории Сэйви',hint:'Предлагать группы и объединение возможных дубликатов'}
  };
  function render(){
   page.replaceChildren();
   if(!open){page.hidden=true;return}
   page.hidden=false;
   const head=make('div','svmc-head');
   const back=make('button','svmc-back');back.type='button';
   back.append(pict(ICON.back));back.setAttribute('aria-label','Назад к почте');
   back.addEventListener('click',()=>{if(typeof onBack==='function')onBack()});
   const titles=make('div','svmc-titles');
   titles.append(make('small','','SEYVEO · КОНТАКТЫ'),make('h2','','Умные контакты'));
   head.append(back,titles);page.append(head);
   const subtitle=make('p','svmc-subtitle','Одна аккуратная адресная книга. Личное и рабочее — отдельно.');
   page.append(subtitle);
   const tabs=make('nav','svmc-tabs');tabs.setAttribute('aria-label','Выбор адресной книги');
   for(const [scope,label] of [['personal','Личная'],['business','Рабочая']]){
    const b=make('button','svmc-tab',label);b.type='button';
    b.setAttribute('aria-pressed',String(selected===scope));
    b.addEventListener('click',()=>{selected=scope;render()});
    tabs.append(b);
   }
   page.append(tabs);
   const mailConnected=connected('mail',selected);
   const bookConnected=connected('contacts',selected);
   const connection=make('section','svmc-connection');
   connection.append(pict(mailConnected?ICON.check:ICON.lock));
   const connectionText=make('div','svmc-connection-text');
   connectionText.append(make('strong','',mailConnected?'Почта подключена':'Сначала подключите почту'));
   connectionText.append(make('small','',mailConnected
    ?bookConnected?'Доступ к контактам подтверждён провайдером':'Для импорта потребуется отдельное разрешение на контакты'
    :'После подключения Сэйви предложит собрать адресную книгу'));
   connection.append(connectionText);
   if(!mailConnected){
    const link=make('button','svmc-connection-action','Подключить');link.type='button';
    link.addEventListener('click',()=>{if(typeof onConnect==='function')onConnect()});
    connection.append(link);
   }
   page.append(connection);
   const legend=make('div','svmc-section-label');
   legend.append(make('strong','','Что разрешить Сэйви'),make('small','','Ваш выбор сохраняется отдельно для каждой почты'));
   page.append(legend);
   const choices=make('div','svmc-choices');
   for(const [key,data] of Object.entries(infoText)){
    const label=make('label','svmc-option');
    label.append(pict(ICON[data.icon]));
    const copy=make('span','svmc-option-copy');
    copy.append(make('strong','',data.label),make('small','',data.hint));
    const input=make('input','svmc-checkbox');input.type='checkbox';
    input.checked=staged[selected][key]===true;
    input.setAttribute('aria-label',data.label);
    input.addEventListener('change',()=>{staged[selected][key]=input.checked});
    label.append(copy,input);choices.append(label);
   }
   page.append(choices);
   const actions=make('div','svmc-actions');
   const saveButton=make('button','svmc-save','Сохранить выбор');saveButton.type='button';
   const status=make('p','svmc-status');status.setAttribute('role','status');
   saveButton.addEventListener('click',()=>{
    preferences[selected]={...staged[selected],configured:true};
    const stored=save();
    if(!stored){status.textContent='Настройки действуют только до закрытия страницы: браузер не разрешил сохранение.'}
    else if(!mailConnected){status.textContent='Выбор сохранён. Подключите почту, чтобы перейти к выдаче разрешений.'}
    else if(staged[selected].book&&!bookConnected){
     status.textContent='Выбор сохранён. Для адресной книги необходимо отдельно разрешить доступ у провайдера.'}
    else {status.textContent='Настройки сохранены. Импорт и анализ реальных контактов пока недоступны.'}
    if(typeof onSaved==='function')onSaved(selected);
   });
   actions.append(saveButton);page.append(actions,status);
   const preview=make('section','svmc-preview');
   const previewHead=make('div','svmc-preview-head');
   previewHead.append(make('strong','','Как будет выглядеть список'),make('small','','Примеры · не импортировано'));
   preview.append(previewHead);
   for(const item of SAMPLES[selected]){
    const row=make('div','svmc-person');
    row.append(make('span','svmc-avatar',item.initial));
    const main=make('div','svmc-person-main');
    main.append(make('strong','',item.name),make('small','',item.note));
    row.append(main,make('span','svmc-group',item.category));
    preview.append(row);
   }
   page.append(preview);
   const note=make('p','svmc-note','Сэйви не копирует контакты автоматически. Сначала — подключение почты, затем отдельные разрешения и проверка предложенных объединений. Оригиналы остаются у владельца.');
   page.append(note);
  }
  return Object.freeze({
   open(scope){selected=SPACES.includes(scope)?scope:'personal';open=true;for(const s of SPACES)staged[s]={...preferences[s]};render()},
   close(){open=false;page.hidden=true},
   isOpen(){return open},
   refresh(){if(open)render()},
   hasSaved,
   isMailConnected(scope){return connected('mail',scope)},
   node:page
  });
 }
 window.SEYVEO_SMART_CONTACTS=Object.freeze({mount,hasSaved});
})();
