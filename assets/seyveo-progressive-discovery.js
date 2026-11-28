/* SEYVEO · Step-by-step acquaintance. Each screen asks only when first opened.
   Local choices; no auto-subscriptions, CRM access, notifications or streaming. */
(()=>{
 'use strict';
 const KEY='seyveo.section-intros.v1';
 const GENRES_KEY='seyveo.music.preferences.v1';
 const root=document.documentElement;
 const routeFor=()=>location.hash==='#sayvi-music'?'music':
  location.hash==='#sayvi-documents'?'documents':
  location.hash==='#manage'?'business':null;
 // A manager demo or a visible business tab is not a paid subscription.
 // Only a verified entitlement may trigger business questions automatically.
 const hasBusinessSubscription=()=>
  window.SEYVEO_SUBSCRIPTION?.hasBusinessAccess?.()===true;
 const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
 const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
 let seen=read(KEY)||{},active=null,previousFocus=null,routeTimer=0;
 const genres=[['rock','Рок'],['pop','Поп'],['electronic','Электроника'],
  ['jazz','Джаз'],['classical','Классика'],['hiphop','Хип-хоп'],
  ['indie','Инди'],['russianrock','Русский рок'],['russianpop','Русский поп'],['chanson','Шансон'],['other','Другое']];
 const sheet=document.createElement('div');
 sheet.id='svSectionDiscovery';sheet.hidden=true;
 sheet.innerHTML=`
  <section class="sv-section-discovery-sheet" role="dialog" aria-modal="true" aria-labelledby="svSectionDiscoveryTitle">
   <p class="sv-section-discovery-eyebrow" id="svSectionDiscoveryEyebrow">СЭЙВИ · ПЕРВЫЙ ВИЗИТ</p>
   <h2 id="svSectionDiscoveryTitle" tabindex="-1"></h2>
   <p class="sv-section-discovery-copy" id="svSectionDiscoveryCopy"></p>
   <div class="sv-section-discovery-content" id="svSectionDiscoveryContent"></div>
   <div class="sv-section-discovery-actions">
    <button type="button" id="svSectionDiscoveryLater">Позже</button>
    <button type="button" id="svSectionDiscoveryDone">Готово</button>
   </div>
  </section>`;
 document.body.append(sheet);
 const title=sheet.querySelector('#svSectionDiscoveryTitle');
 const copy=sheet.querySelector('#svSectionDiscoveryCopy');
 const content=sheet.querySelector('#svSectionDiscoveryContent');
 const later=sheet.querySelector('#svSectionDiscoveryLater');
 const done=sheet.querySelector('#svSectionDiscoveryDone');
 function close({remember=true}={}){
  if(!active)return;
  const former=active;active=null;
  sheet.hidden=true;root.classList.remove('sv-section-discovery-open');
  if(remember){seen={...seen,[former]:true};save(KEY,seen)}
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  previousFocus=null;
 }
 function open(type,{force=false}={}){
  if(active||sheet.hidden===false||!type||(!force&&seen[type])||
   (type==='business'&&!force&&!hasBusinessSubscription())||
   root.classList.contains('sv-broadcast-onboarding')||
   root.classList.contains('sv-broadcast-sheet-open')||
   root.classList.contains('seyveo-conversation')||
   document.querySelector('dialog[open]'))return;
  previousFocus=document.activeElement;active=type;
  content.replaceChildren();
  if(type==='music'){
   title.textContent='Какая музыка твоя?';
   copy.textContent='Отметь любимые жанры. Я запомню их, чтобы со временем предлагать музыку, которая нравится именно тебе.';
   const current=new Set(read(GENRES_KEY)?.genres||[]);
   const grid=document.createElement('div');grid.className='sv-section-genre-grid';
   for(const [id,label] of genres){
    const item=document.createElement('label');item.className='sv-section-genre';
    const input=document.createElement('input');input.type='checkbox';input.value=id;input.checked=current.has(id);
    const name=document.createElement('span');name.textContent=label;
    const check=document.createElement('span');check.className='sv-section-genre-check';check.textContent='✓';
    check.setAttribute('aria-hidden','true');item.append(input,name,check);grid.append(item);
   }
   content.append(grid);
   const info=document.createElement('p');info.className='sv-section-discovery-note';
   info.textContent='Жанры сохраняются на этом устройстве. Новинки и внешние музыкальные сервисы без разрешения не подключаются.';
   content.append(info);
   done.textContent='Запомнить';
  }else if(type==='documents'){
   title.textContent='Разберёмся с документами?';
   copy.textContent='Я покажу, что уже можно сделать с файлами в SEYVEO.';
   const list=document.createElement('div');list.className='sv-section-feature-list';
   for(const [icon,label,desc] of [
    ['📄','Хранить и находить','Папки, документы и поиск по ним'],
    ['✍️','Подготовить и исправить','Помощь Сэйви с текстом документа'],
    ['📤','Поделиться','Предпросмотр и отправка файла']]){
    const row=document.createElement('div');row.className='sv-section-feature';
    const image=document.createElement('span');image.textContent=icon;image.setAttribute('aria-hidden','true');
    const text=document.createElement('div');const strong=document.createElement('strong');strong.textContent=label;
    const small=document.createElement('small');small.textContent=desc;
    text.append(strong,small);row.append(image,text);list.append(row);
   }
   content.append(list);
   const info=document.createElement('p');info.className='sv-section-discovery-note';
   info.textContent='Юридически значимая подпись и внешние подключения появятся после отдельной настройки.';
   content.append(info);
   done.textContent='Посмотреть документы';
  }else if(type==='business'){
   title.textContent='Помогу с твоим делом';
   copy.textContent='Расскажи мне немного о своём бизнесе. Вместе подберём разделы, команду и документы. Сейчас можно просто посмотреть кабинет.';
   const info=document.createElement('p');info.className='sv-section-discovery-note';
   info.textContent='Никакие подписки, сотрудники и внешние системы не подключатся автоматически.';
   content.append(info);
   done.textContent='Настроить с Сэйви';
  }
  later.textContent=type==='business'?'Посмотреть позже':'Позже';
  sheet.hidden=false;root.classList.add('sv-section-discovery-open');
  title.focus({preventScroll:true});
 }
 function finish(){
  const type=active;if(!type)return;
  if(type==='business'&&!window.SEYVEO_PREVIEW?.isManager?.()){
   if(content.querySelector('[data-requires-business]')){close();return}
   const hint=document.createElement('p');hint.className='sv-section-discovery-note';
   hint.dataset.requiresBusiness='true';
   hint.textContent='Бизнес-кабинет откроется после подключения Business. В деморежиме можно посмотреть RISE или AUTONOM, но это не подписка.';
   content.append(hint);done.textContent='Понятно';later.textContent='Закрыть';return;
  }
  if(type==='music'){
   const values=[...content.querySelectorAll('input:checked')].map(item=>item.value);
   save(GENRES_KEY,{genres:values,updatedAt:new Date().toISOString()});
   window.dispatchEvent(new CustomEvent('seyveo:music-preferences-changed',{detail:{genres:values}}));
  }
  close();
  if(type==='business'){
   // The old inline-chat wizard was retired when Sayvi got her standalone
   // chat. Use the active, goal-first cabinet constructor instead.
   if(window.SEYVEO_PREVIEW?.isManager?.()){
    window.SEYVEO_UNIFIED_TASKS?.openBusiness?.('manage');
    window.setTimeout(()=>window.SEYVEO_SMART_CABINET?.open?.(),380);
   }
  }
 }
 later.addEventListener('click',()=>close());
 done.addEventListener('click',finish);
 sheet.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();close();return}
  if(event.key!=='Tab')return;
  const focusable=[...sheet.querySelectorAll('button,input')].filter(el=>el.getClientRects().length);
  const first=focusable[0],last=focusable.at(-1);
  if(!first)return;
  if(event.shiftKey&&(document.activeElement===first||document.activeElement===title)){
   event.preventDefault();last.focus();
  }else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 });
 function schedule(){
  clearTimeout(routeTimer);routeTimer=setTimeout(()=>{
   const route=routeFor();
   if(active&&active!==route)close({remember:false});
   if(route&&!seen[route]&&!document.hidden)open(route);
  },500);
 }
 window.addEventListener('hashchange',schedule);
 window.addEventListener('seyveo:route-changed',schedule);
 window.addEventListener('seyveo:broadcast-setup-complete',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
 schedule();
 window.SEYVEO_DISCOVERY=Object.freeze({
  ...window.SEYVEO_DISCOVERY,
  open(type){if(['music','documents','business'].includes(type)){
   open(type,{force:true});return !sheet.hidden;
  }return false},
  genres:()=>[...(read(GENRES_KEY)?.genres||[])]
 });
})();
