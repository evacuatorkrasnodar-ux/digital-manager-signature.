/* SEYVEO · Home favourites / review badge. Does not move Sayvi or the dock. */
(()=>{'use strict';
const home=document.getElementById('homePage'),stage=document.getElementById('stage');
if(!home||!stage||document.getElementById('svHomeFavorites'))return;
const root=document.documentElement;
const STORAGE='seyveo.home.favorites.v1',USAGE='seyveo.home.favorite-usage.v1';
/* SEYVEO Home · gentle pen-line icons in the same visual language as Notebook.
   Each symbol is clean, delicate and distinct. The touch area stays generous. */
const favoriteGlyphs={
 cards:'<rect x="6.5" y="6" width="13" height="14.5" rx="2.3"/><path d="M4 16.5V5.7c0-1.3 1-2.3 2.3-2.3H16"/><path d="M9.7 10.3h6.7M9.7 13.8h5.2"/>',
 music:'<path d="M9.3 7.1 18.1 5v10.9M9.3 7.1v10.7M9.3 9.8 18.1 7.7"/><ellipse cx="6.6" cy="18" rx="2.7" ry="1.7" transform="rotate(-17 6.6 18)"/><ellipse cx="15.5" cy="16.5" rx="2.7" ry="1.7" transform="rotate(-17 15.5 16.5)"/>',
 documents:'<path d="M7 3.5h7.5L19 8v11c0 1.1-.9 2-2 2H7a2 2 0 0 1-2-2V5.5c0-1.1.9-2 2-2Z"/><path d="M14.5 3.5V8H19M8.8 12h6.8M8.8 15.4h6.8M8.8 18.8h4.4"/>',
 wallet:'<rect x="3.5" y="6.4" width="17" height="13.7" rx="2.5"/><path d="M5.1 6.4V5.6c0-1.4 1.1-2.5 2.5-2.5H18"/><path d="M14.9 11.3H20.5v5H14.9a2.5 2.5 0 0 1 0-5Z"/><circle cx="16.5" cy="13.8" r=".75" fill="currentColor" stroke="none"/>',
 notebook:'<path d="M6.1 3.9h10.8c.9 0 1.4.6 1.4 1.5v13.3c0 1-.5 1.6-1.5 1.6H6.1c-1 0-1.5-.6-1.5-1.6V5.4c0-1 .5-1.5 1.5-1.5Z"/><path d="M7.8 8.4h5.3M7.8 11.5h5.6M7.8 14.6h4.1M7.8 17.7h7"/><path d="m15.2 12.4 4.3-5.6 1.6 1.3-4.2 5.5-2.3.8Z"/>',
 calendar:'<rect x="4" y="5.4" width="16" height="15" rx="2.3"/><path d="M4 9.8h16M8 3.5v4M16 3.5v4M8.2 13.4h2.2M13.5 13.4h2.2M8.2 17.2h2.2M13.5 17.2h2.2"/>',
 health:'<path d="M12 20S3.5 14.3 3.5 9.2c0-2.7 1.9-4.6 4.4-4.6 1.8 0 3.2.9 4.1 2.3.9-1.4 2.3-2.3 4.1-2.3 2.5 0 4.4 1.9 4.4 4.6C20.5 14.3 12 20 12 20Z"/><path d="M7.3 11.8h2.1l1.2-2.3 2.4 4.7 1.2-2.4h2.5"/>',
 browser:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.8 2.8 4.3 5.7 4.3 8.5s-1.5 5.7-4.3 8.5M12 3.5c-2.8 2.8-4.3 5.7-4.3 8.5s1.5 5.7 4.3 8.5M5.4 8.3h13.2M5.4 15.8h13.2"/>',
 mail:'<rect x="3.5" y="5.8" width="17" height="12.7" rx="2.3"/><path d="m4.2 7.3 7.1 5.7a1.2 1.2 0 0 0 1.4 0l7.1-5.7"/>',
 contacts:'<rect x="4.2" y="3.5" width="15.6" height="17" rx="2.3"/><circle cx="12" cy="9.3" r="2.3"/><path d="M7.5 17c.5-2.3 2.2-3.4 4.5-3.4s4 1.1 4.5 3.4"/>',
 care:'<path d="M12 11.2S8.7 9.1 8.7 7a2.1 2.1 0 0 1 3.3-1.6A2.1 2.1 0 0 1 15.3 7c0 2.1-3.3 4.2-3.3 4.2Z"/><path d="M4 15.2 7.9 13l3 1.7h2.2l3-1.7 3.9 2.2M3.5 15.5v2.2c0 .6.3 1.1.8 1.4l3.8 2h7.8l3.8-2c.5-.3.8-.8.8-1.4v-2.2"/>',
 family:'<circle cx="8.7" cy="8.7" r="2.4"/><circle cx="16.6" cy="9.7" r="1.9"/><path d="M3.9 19.3v-2.2c0-2.6 2-4.3 4.8-4.3s4.8 1.7 4.8 4.3v2.2M15.2 14.5c2.9-.2 4.9 1.4 4.9 4.1v.7"/>',
 'smart-home':'<path d="m3.4 11.2 8.6-7.4 8.6 7.4M6.1 10.3v9.9h11.8v-9.9"/><path d="M8.7 13.6a5 5 0 0 1 6.6 0M10.2 15.6a2.7 2.7 0 0 1 3.6 0"/><circle cx="12" cy="17.9" r=".7" fill="currentColor" stroke="none"/>',
 'business-pulse':'<path d="M2.5 13h4.8l3-7.2 4.1 12 3.2-7h3.9"/>',
 'business-chats':'<path d="M4 5.5h16v11H9l-5 3v-14Z"/><path d="M8 10.5h8"/>',
 'business-mail':'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
 'business-documents':'<path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7"/>',
 'business-company':'<rect x="4" y="7" width="16" height="14" rx="2"/><path d="M8 7V4h8v3M8 12h8M8 16h5"/>',
 'business-people':'<circle cx="9" cy="8" r="2.5"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M15.5 6a3 3 0 0 1 0 5.6M17 14a4.5 4.5 0 0 1 3.5 4.4V20"/>',
 management:'<rect x="3.5" y="3.5" width="7.2" height="7.2" rx="1.6"/><rect x="13.3" y="3.5" width="7.2" height="7.2" rx="1.6"/><rect x="3.5" y="13.3" width="7.2" height="7.2" rx="1.6"/><rect x="13.3" y="13.3" width="7.2" height="7.2" rx="1.6"/>',
 generic:'<rect x="4.2" y="4.2" width="15.6" height="15.6" rx="3"/><path d="M8.2 12h7.6M12 8.2v7.6"/>'
};
const apps=[
 {id:'music',name:'Музыка',selector:'[data-calendar-space="music"]'},
 {id:'documents',name:'Документы',selector:'[data-calendar-space="documents"]'},
 {id:'notebook',name:'Блокнот',action:()=>window.SEYVEO_NOTES_API?.openNotes?.()},
 {id:'wallet',name:'Кошелёк',selector:'[data-calendar-space="wallet"]'},
 {id:'calendar',name:'Календарь',action:()=>{location.hash='#calendar'}},
 {id:'health',name:'Здоровье',selector:'[data-calendar-space="health"]'},
 {id:'browser',name:'Браузер',selector:'[data-calendar-space="browser"]'},
 {id:'mail',name:'Почта',selector:'[data-calendar-space="mail"]'},
 {id:'contacts',name:'Контакты',selector:'[data-calendar-space="contacts"]'},
 {id:'care',name:'Забота',selector:'[data-calendar-space="care"]'},
 {id:'family',name:'Семья',selector:'[data-calendar-space="family"]'},
 {id:'smart-home',name:'Умный дом',selector:'[data-calendar-space="smart-home"]'},
 {id:'management',name:'Управление',action:()=>{location.hash='#manage'}}
];
const businessApps=[
 {id:'business-pulse',name:'Пульс бизнеса',hub:'pulse'},
 {id:'business-chats',name:'Чаты команды',hub:'chats'},
 {id:'business-mail',name:'Рабочая почта',hub:'mail'},
 {id:'business-documents',name:'Документы бизнеса',hub:'documents'},
 {id:'business-company',name:'Моя компания',hub:'company'},
 {id:'business-people',name:'Сотрудники и кадры',hub:'people'}
].map(app=>({...app,action:()=>{
  const api=window.SEYVEO_UNIFIED_TASKS;
  if(!api?.openBusiness)return false;
  api.openBusiness('home');
  const row=document.querySelector('[data-business-hub="'+app.hub+'"]');
  if(row)row.click();
  return !!row;
}}));
const allApps=[...apps,...businessApps];
/* Real entitlement in production, subscription preview only in this prototype. */
function businessEnabled(){
 const access=window.SEYVEO_ENTITLEMENTS;
 if(access?.business===true||['business','rise','autonom','enterprise'].includes(String(access?.plan||'').toLowerCase()))return true;
 return ['rise','autonom','large','employee'].includes(window.SEYVEO_PREVIEW?.getMode?.()||document.getElementById('seyveoDemoModeSelect')?.value||'');
}
const byId=Object.fromEntries(allApps.map(a=>[a.id,a]));
const defaultIds=['music','documents','wallet'];
const AUTO_COUNT=3,MAX_COUNT=4;
function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
let preference=stored(STORAGE);
if(!preference||!Array.isArray(preference.items))preference={items:defaultIds.slice(),custom:false,showSmart:true};
if(typeof preference.showSmart!=='boolean')preference.showSmart=true;
if(typeof preference.autoSelect!=='boolean')preference.autoSelect=false;
if(!preference.custom&&preference.items.join(',')==='music,documents,notebook,wallet,calendar')preference.items=defaultIds.slice();
function normalize(ids){
 const unique=[...new Set(ids)].filter(id=>byId[id]&&(businessEnabled()||!id.startsWith('business-')));
 const selected=preference.custom?unique:[...unique,...defaultIds.filter(id=>!unique.includes(id))];
 return selected.slice(0,preference.showSmart?MAX_COUNT-1:MAX_COUNT);
}
preference.items=normalize(preference.items);
let usage=stored(USAGE)||{},cardCount=Number(window.SEYVEO_REVIEW_CARDS?.count?.())||0;
if(!preference.custom){
 const candidates=apps.slice().sort((a,b)=>(usage[b.id]||0)-(usage[a.id]||0));
 if(candidates.filter(a=>(usage[a.id]||0)>0).length>=AUTO_COUNT&&
  candidates[AUTO_COUNT-1]&&((usage[candidates[AUTO_COUNT-1].id]||0)>=3)){
  preference.items=normalize(candidates.slice(0,AUTO_COUNT).map(a=>a.id));
  save(STORAGE,preference);
 }
}
function autoFavorites(smartEnabled=preference.showSmart){
 const eligible=businessEnabled()?allApps:apps;
 const ranked=eligible.filter(a=>Number(usage[a.id])>0).sort((a,b)=>(Number(usage[b.id])||0)-(Number(usage[a.id])||0));
 const limit=MAX_COUNT-(smartEnabled?1:0);
 const current=preference.items.filter(id=>byId[id]);
 return [...ranked.map(a=>a.id),...current,...defaultIds,...eligible.map(a=>a.id)].filter((id,i,all)=>all.indexOf(id)===i).slice(0,limit);
}
if(preference.autoSelect)preference.items=autoFavorites();
/* One smart slot: pending decisions when present, otherwise a useful Life app.
   Selection is stable during the session and ignores the three pinned apps. */
const fallbackOrder=['browser','music','notebook','calendar','health','mail','documents','wallet','contacts','family','smart-home','care'];
function chooseFallback(){
 const pinned=new Set(preference.items);
 return apps.filter(a=>!pinned.has(a.id))
  .sort((a,b)=>(Number(usage[b.id])||0)-(Number(usage[a.id])||0)||
    fallbackOrder.indexOf(a.id)-fallbackOrder.indexOf(b.id))[0]?.id||'browser';
}
let fallbackId=chooseFallback();
const rail=document.createElement('nav');rail.id='svHomeFavorites';rail.className='sv-home-favorites';rail.setAttribute('aria-label','Быстрый доступ SEYVEO');rail.hidden=true;
const smartTile=document.createElement('div');smartTile.className='sv-home-favorite-tile';smartTile.dataset.favoriteId='smart';
const card=document.createElement('button');card.type='button';card.className='sv-home-favorite sv-home-review-entry';
card.setAttribute('aria-label','Открыть дела Сэйви');card.setAttribute('title','Дела для разбора');card.dataset.icon='cards';
const symbol=document.createElement('span');symbol.className='sv-home-favorite-icon';
symbol.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+favoriteGlyphs.cards+'</svg>';
const badge=document.createElement('span');badge.className='sv-home-review-badge';badge.hidden=true;badge.setAttribute('aria-hidden','true');
const caption=document.createElement('span');caption.className='sv-home-favorite-label';caption.textContent='Дела';
symbol.append(badge);card.append(symbol,caption);smartTile.append(card);rail.append(smartTile);
const list=document.createElement('div');list.className='sv-home-favorite-items';rail.append(list);
const add=document.createElement('button');add.type='button';add.className='sv-home-favorite sv-home-add-entry';add.hidden=true;
add.setAttribute('aria-label','Добавить приложение на главную');
// A plain plus by design: no tile surface or visible caption, even with older CSS.
add.innerHTML='<svg class="sv-home-plain-plus" style="width:27px;height:27px;flex:none;margin-top:11.5px;fill:none;stroke:#141417;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
rail.append(add);
stage.append(rail);
card.addEventListener('click',e=>{
 if(editing||suppressClick){e.preventDefault();suppressClick=false;return}
 if(cardCount>0)window.dispatchEvent(new Event('seyveo:open-card-review'));
 else launch(fallbackId);
});
function icon(id){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(favoriteGlyphs[id]||favoriteGlyphs.generic)+'</svg>'}
function launch(id){
 const item=byId[id];if(!item||(id.startsWith('business-')&&!businessEnabled()))return;
 const result=item.action?.();
 if(!item.action){
  const source=document.querySelector(item.selector);
  if(source)source.click();else return;
 }else if(result===false)return;
 if(item.action){usage[id]=Math.min(10000,(Number(usage[id])||0)+1);save(USAGE,usage);}
 if(preference.autoSelect){const next=autoFavorites();if(next.join(',')!==preference.items.join(',')){preference.items=next;save(STORAGE,preference);renderItems();show();}}
}
let longTimer=0,suppressClick=false,holding=false,editing=false,ignoreOutsideUntil=0;
function persist(){
 preference.custom=true;save(STORAGE,preference);
}
function totalSlots(){return preference.items.length+(preference.showSmart?1:0)}
function syncEditControls(){
 smartTile.hidden=!preference.showSmart;
 rail.classList.toggle('is-editing',editing);
 add.hidden=!editing||totalSlots()>=MAX_COUNT;
}
function enterEdit(openPicker=false){
 if(home.hidden||!root.classList.contains('sv-home-empty-arrived'))return;
 if(!editing){
  editing=true;suppressClick=true;ignoreOutsideUntil=Date.now()+550;
  syncEditControls();renderItems();show();
 }
 // With four selected apps there is no add tile. Holding an icon must
 // still open the chooser, not strand the user in the jiggling state.
 if(openPicker)openCustomize();
}
function exitEdit(){
 if(!editing)return;
 editing=false;suppressClick=false;syncEditControls();renderItems();show();
}
add.addEventListener('click',()=>openCustomize());
function removeSlot(id){
 if(!editing)return;
 if(id==='smart')preference.showSmart=false;
 else preference.items=preference.items.filter(x=>x!==id);
 persist();
 if(totalSlots()===0){exitEdit();updateCount();return;}
 renderItems();updateCount();show();
}
function minusButton(id,label){
 const b=document.createElement('button');b.type='button';b.className='sv-home-edit-minus';
 b.setAttribute('aria-label','Убрать с главной: '+label);
 b.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg>';
 b.addEventListener('click',e=>{e.stopPropagation();removeSlot(id)});
 return b;
}
smartTile.append(minusButton('smart','Умная кнопка'));
function bindHold(button){
 button.addEventListener('pointerdown',e=>{
  if(editing||e.pointerType==='mouse'&&e.button!==0)return;
  holding=true;clearTimeout(longTimer);
  longTimer=setTimeout(()=>{if(holding){suppressClick=true;enterEdit(true)}},620);
 });
 for(const type of ['pointerup','pointercancel','pointerleave'])button.addEventListener(type,()=>{
  holding=false;clearTimeout(longTimer);
 });
 button.addEventListener('contextmenu',e=>{e.preventDefault();suppressClick=true;enterEdit(true)});
}
bindHold(card);
let dragged=null;
function bindReorder(button,tile,id){
 button.addEventListener('pointerdown',e=>{
  if(!editing||e.button!==0)return;
  dragged={id,x:e.clientX,y:e.clientY,moved:false};
  try{button.setPointerCapture(e.pointerId)}catch{}
 });
 button.addEventListener('pointermove',e=>{
  if(!editing||dragged?.id!==id)return;
  if(Math.hypot(e.clientX-dragged.x,e.clientY-dragged.y)>9){
   dragged.moved=true;tile.classList.add('is-dragging');
  }
 });
 button.addEventListener('pointerup',e=>{
  if(!dragged||dragged.id!==id)return;
  const wasMoved=dragged.moved;dragged=null;tile.classList.remove('is-dragging');
  if(!wasMoved)return;
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sv-home-favorite-tile');
  const to=target?.dataset.favoriteId;
  suppressClick=true;
  if(!to||to==='smart'||to===id)return;
  const a=preference.items.slice(),from=a.indexOf(id),where=a.indexOf(to);
  if(from<0||where<0)return;
  a.splice(from,1);a.splice(where,0,id);
  preference.items=a;persist();renderItems();show();
 });
 button.addEventListener('pointercancel',()=>{dragged=null;tile.classList.remove('is-dragging')});
}
function renderItems(){
 list.replaceChildren();
 for(const id of preference.items){
  const app=byId[id];if(!app)continue;
  const tile=document.createElement('div');tile.className='sv-home-favorite-tile';tile.dataset.favoriteId=id;
  const button=document.createElement('button');button.className='sv-home-favorite';button.type='button';
  button.setAttribute('aria-label','Открыть '+app.name);
  button.title=app.name+' · удерживай, чтобы изменить главную';
  const surface=document.createElement('span');surface.className='sv-home-favorite-icon';surface.innerHTML=icon(id);
  const label=document.createElement('span');label.className='sv-home-favorite-label';label.textContent=app.name;
  button.append(surface,label);button.addEventListener('click',e=>{
   if(editing||suppressClick){suppressClick=false;e.preventDefault();return}
   launch(id);
  });
  tile.append(button,minusButton(id,app.name));bindHold(button);bindReorder(button,tile,id);list.append(tile);
 }
 syncEditControls();
}
let activeCurtainPosition=null;
function openCustomize(){
 if(document.getElementById('svHomeFavoritesEditor'))return;
 const before={...preference,items:preference.items.slice()};
 const dialog=document.createElement('dialog');dialog.id='svHomeFavoritesEditor';dialog.className='sv-home-favorites-editor';
 dialog.setAttribute('aria-label','Настроить главную');
 const shell=document.createElement('div');shell.className='sv-home-favorites-editor-shell';
 const head=document.createElement('div');head.className='sv-home-favorites-editor-head';
 const title=document.createElement('strong');title.textContent='Настроить главную';
 const done=document.createElement('button');done.type='button';done.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>';done.setAttribute('aria-label','Готово');done.title='Готово';
 head.append(title,done);
 const help=document.createElement('p');help.className='sv-home-favorites-editor-help';
 const grid=document.createElement('div');grid.className='sv-home-favorites-editor-grid';
 grid.setAttribute('role','group');grid.setAttribute('aria-label','Приложения на главной');
 let selection=preference.items.slice(),smart=preference.showSmart,auto=preference.autoSelect,activeTab='personal';
 const tabbar=document.createElement('div');tabbar.className='sv-home-favorites-tabs';tabbar.setAttribute('role','tablist');tabbar.setAttribute('aria-label','Разделы главной');
 const personalTab=document.createElement('button'),cabinetTab=document.createElement('button');
 for(const [button,name,mode] of [[personalTab,'Личное','personal'],[cabinetTab,'Кабинет','business']]){
  button.type='button';button.textContent=name;button.setAttribute('role','tab');
  button.addEventListener('click',()=>{activeTab=mode;redraw();});tabbar.append(button);
 }
 let curtainBottom=null;
 const positionCurtain=(force=false)=>{
  if(curtainBottom!==null&&!force)return;
  const row=rail.getBoundingClientRect();
  const dock=document.getElementById('navHome')?.getBoundingClientRect();
  const safeRowTop=row.height>0&&row.top>100&&row.top<window.innerHeight-45
   ?row.top:(dock?.top||window.innerHeight-70)-90;
  // End just above the Home shortcuts, including when the user has chosen zero.
  const bottom=Math.max(78,Math.min(window.innerHeight-180,
   Math.round(window.innerHeight-safeRowTop+12)));
  curtainBottom=bottom;
  dialog.style.setProperty('--sv-home-editor-bottom',bottom+'px');
 };
 activeCurtainPosition=positionCurtain;
 const preview=()=>{
  preference={...preference,items:selection.slice(),showSmart:smart,autoSelect:auto,custom:true};
  renderItems();updateCount();show();
 };
 const redraw=()=>{
  const enabled=businessEnabled();
  tabbar.hidden=!enabled;
  if(!enabled)activeTab='personal';
  for(const [button,mode] of [[personalTab,'personal'],[cabinetTab,'business']]){
   button.setAttribute('aria-selected',String(activeTab===mode));button.tabIndex=activeTab===mode?0:-1;
  }
  help.textContent=auto?'Сэйви выбирает часто используемые кнопки':'Выбрано '+(selection.length+(smart?1:0))+' из '+MAX_COUNT+' · меняется сразу';
  autoButton.setAttribute('aria-pressed',String(auto));
  autoButton.title=auto?'Автовыбор включён':'Автовыбор: Сэйви подбирает частые кнопки';
  if(auto){selection=autoFavorites(smart);}
  grid.replaceChildren();
  const options=activeTab==='business'?businessApps:[{id:'smart',name:'Умная кнопка'},...apps];
  for(const app of options){
   const b=document.createElement('button');b.type='button';
   const chosen=app.id==='smart'?smart:selection.includes(app.id);
   b.setAttribute('aria-pressed',String(chosen));
   b.innerHTML=app.id==='smart'?'<svg viewBox="0 0 24 24" aria-hidden="true">'+favoriteGlyphs.cards+'</svg>':icon(app.id);
   const t=document.createElement('span');t.textContent=app.name;
   const mark=document.createElement('small');mark.textContent=chosen?'✓':'';
   b.append(t,mark);
   b.addEventListener('click',()=>{
    if(auto){auto=false;selection=preference.items.slice();}
    if(app.id==='smart'){
     if(smart)smart=false;else if(selection.length<MAX_COUNT)smart=true;
    }else if(chosen)selection=selection.filter(x=>x!==app.id);
    else if(selection.length+(smart?1:0)<MAX_COUNT)selection.push(app.id);
    redraw();preview();
   });
   grid.append(b);
  }
 };
 const autoButton=document.createElement('button');
 autoButton.type='button';autoButton.className='sv-home-favorites-auto';
 autoButton.setAttribute('aria-label','Автовыбор часто используемых кнопок');
 autoButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 8.2A8.8 8.8 0 1 0 20.8 12"/><path d="M19.5 3.7v4.5H15"/><path d="m9.2 15.8 2.8-7 2.8 7M10.2 13.4h3.6"/></svg>';
 autoButton.addEventListener('click',()=>{
  auto=!auto;
  if(auto){selection=autoFavorites(smart);}
  redraw();preview();
 });
 head.insertBefore(autoButton,done);
 redraw();shell.append(head,tabbar,help,grid);dialog.append(shell);document.body.append(dialog);
 let closed=false;
 function close(saveChanges,animate=false){
  if(closed)return;closed=true;
  window.removeEventListener('resize',onCurtainResize);
  document.removeEventListener('click',onDockNavigation,true);
  window.removeEventListener('seyveo:route-changed',onRouteChange);
  window.removeEventListener('hashchange',onRouteChange);
  activeCurtainPosition=null;
  if(saveChanges){
   save(STORAGE,preference);
   editing=false;
  }else{
   preference=before;
  }
  renderItems();updateCount();show();
  suppressClick=false;
  if(animate){
   dialog.classList.add('is-leaving');
   window.setTimeout(()=>{dialog.close();dialog.remove();},300);
  }else{dialog.close();dialog.remove();}
 }
 const onDockNavigation=e=>{
  if(e.target.closest?.('#navTasks,#navPicture,#navManage'))close(true,true);
 };
 const onRouteChange=()=>close(true,true);
 done.addEventListener('click',()=>close(true,true));
 dialog.addEventListener('cancel',e=>{e.preventDefault();close(false,true)});
 positionCurtain(); // establish final geometry before the opening animation
 dialog.show();
 const onCurtainResize=()=>positionCurtain(true);
 window.addEventListener('resize',onCurtainResize);
 document.addEventListener('click',onDockNavigation,true);
 window.addEventListener('seyveo:route-changed',onRouteChange);
 window.addEventListener('hashchange',onRouteChange);
 show();
}
let backgroundTimer=0,backgroundPoint=null;
home.addEventListener('pointerdown',e=>{
 if(editing||e.target.closest('button,a,input,textarea,select,[role="button"]'))return;
 backgroundPoint={x:e.clientX,y:e.clientY};clearTimeout(backgroundTimer);
 backgroundTimer=setTimeout(()=>{backgroundPoint=null;enterEdit()},650);
});
home.addEventListener('pointermove',e=>{
 if(backgroundPoint&&Math.hypot(e.clientX-backgroundPoint.x,e.clientY-backgroundPoint.y)>10){
  clearTimeout(backgroundTimer);backgroundPoint=null;
 }
});
for(const type of ['pointerup','pointercancel','pointerleave']){
 home.addEventListener(type,()=>{clearTimeout(backgroundTimer);backgroundPoint=null});
}
home.addEventListener('click',e=>{
 if(!editing||document.getElementById('svHomeFavoritesEditor')||e.target.closest('#svHomeFavorites'))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(Date.now()>=ignoreOutsideUntil)exitEdit();
},true);
renderItems();
let homeShortcutTopLocked=false;
function place(force=false){
 if(rail.hidden||homeShortcutTopLocked&&!force)return;
 const weather=document.getElementById('svSayviHomeWeather');
 const r=rail.getBoundingClientRect();
 if(!r.height)return;
 const dock=document.getElementById('navHome')?.getBoundingClientRect();
 const maximum=(dock?.top||window.innerHeight-64)-r.height-32;
 let wanted=null;
 if(weather&&!weather.hidden&&getComputedStyle(weather).display!=='none'&&getComputedStyle(weather).visibility!=='hidden'){
  const w=weather.getBoundingClientRect();if(w.height)wanted=w.bottom+24;
 }
 // Always resolve the fallback before first paint. The row must not start at
 // the CSS placeholder position and jump when the weather finishes loading.
 if(wanted===null)wanted=maximum;
 const next=Math.min(wanted,maximum);
 rail.style.top=Math.round(next-stage.getBoundingClientRect().top)+'px';
 if(activeCurtainPosition)activeCurtainPosition();
}
let firstHomeEntrancePlayed=false;
let launchPreviewActive=false;
const show=()=>{
 const curtainOpen=!!document.getElementById('svHomeFavoritesEditor')?.open;
 const homeUsable=!home.hidden&&!document.hidden&&(!location.hash||location.hash==='#home');
 // During first launch the full-size sphere shows its brand logo before
 // the ordinary "arrived" state. Let shortcuts gently enter at that moment.
 const launchLogoVisible=root.classList.contains('sv-home-launch-logo-visible')&&
  !root.classList.contains('sv-cinema-boot')&&
  !root.classList.contains('sv-home-prelayout');
 if(!firstHomeEntrancePlayed&&launchLogoVisible)launchPreviewActive=true;
 if(root.classList.contains('sv-home-empty-arrived')&&
    !root.classList.contains('sv-home-empty-arriving'))launchPreviewActive=false;
 const visible=curtainOpen?homeUsable:homeUsable&&
 !root.classList.contains('seyveo-conversation')&&
 (root.classList.contains('sv-home-empty-arrived')||launchPreviewActive)&&
 (!root.classList.contains('sv-home-empty-arriving')||launchPreviewActive)&&
 !root.classList.contains('sv-home-empty-sphere-leaving')&&
 !root.classList.contains('sv-review-open')&&
 !document.querySelector('dialog[open]:not(#svHomeFavoritesEditor)')&&
 !(document.getElementById('svSmartStartHome')?.hidden===false);
 if(!visible&&editing&&!document.querySelector('dialog[open]')){
  editing=false;syncEditControls();renderItems();
 }
 const shouldShow=visible&&(editing||totalSlots()>0);
 const entering=shouldShow&&rail.hidden;
 if(entering)rail.style.visibility='hidden';
 rail.hidden=!shouldShow;
 if(shouldShow){
  if(entering){
   // Measure while visually hidden, place synchronously, then fade the
   // individual tiles at their FINAL coordinates on the following frame.
   homeShortcutTopLocked=false;
   place(true);
   homeShortcutTopLocked=true;
   requestAnimationFrame(()=>{
    if(rail.hidden)return;
    if(!firstHomeEntrancePlayed&&!editing&&!curtainOpen){
     firstHomeEntrancePlayed=true;
     rail.classList.add('sv-home-favorites-enter');
     setTimeout(()=>rail.classList.remove('sv-home-favorites-enter'),3100);
    }
    rail.style.visibility='';
   });
  }else if(!homeShortcutTopLocked){
   place(true);homeShortcutTopLocked=true;
  }
 }else homeShortcutTopLocked=false;
};
function updateCount(){
 const pending=cardCount>0;
 badge.hidden=!pending;
 badge.textContent=cardCount>99?'99+':String(cardCount);
 card.classList.toggle('sv-home-review-entry',pending);
 if(pending){
  if(card.dataset.icon!=='cards'){
   symbol.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+favoriteGlyphs.cards+'</svg>';
   symbol.append(badge);card.dataset.icon='cards';
  }
  caption.textContent='Дела';
  card.setAttribute('aria-label','Открыть дела Сэйви: '+cardCount);
  card.title='Дел для разбора: '+cardCount;
 }else{
  fallbackId=chooseFallback();
  const item=byId[fallbackId];
  if(card.dataset.icon!==fallbackId){
   symbol.innerHTML=icon(fallbackId);
   symbol.append(badge);card.dataset.icon=fallbackId;
  }
  caption.textContent=item.name;
  card.setAttribute('aria-label','Открыть '+item.name);
  card.title=item.name+' · умный быстрый доступ';
 }
}
window.addEventListener('seyveo:review-count',e=>{cardCount=Math.max(0,Number(e.detail?.count)||0);updateCount();show()});
for(const name of ['seyveo:home-sayvi-arrived','seyveo:route-changed','seyveo:cinema-finished','hashchange','focus'])
 window.addEventListener(name,show);
document.addEventListener('visibilitychange',show);
window.addEventListener('resize',()=>{homeShortcutTopLocked=false;show()});
const weather=document.getElementById('svSayviHomeWeather');
if(weather){new ResizeObserver(show).observe(weather);new MutationObserver(show).observe(weather,{attributes:true,attributeFilter:['hidden','class','style']});}
new MutationObserver(show).observe(root,{attributes:true,attributeFilter:['class']});
new MutationObserver(show).observe(home,{attributes:true,attributeFilter:['hidden']});
document.addEventListener('click',e=>{
 const target=e.target.closest?.('[data-world-space],[data-calendar-space]');if(!target)return;
 const key=target.getAttribute('data-world-space')||target.getAttribute('data-calendar-space');
 const entry=byId[key]?key:null;
 if(entry){usage[entry]=Math.min(10000,(Number(usage[entry])||0)+1);save(USAGE,usage);
  if(preference.autoSelect){const next=autoFavorites();if(next.join(',')!==preference.items.join(',')){preference.items=next;save(STORAGE,preference);renderItems();show();}}
 }
},{capture:true,passive:true});
updateCount();show();
window.SEYVEO_HOME_FAVORITES=Object.freeze({openCustomize,enterEdit,getItems:()=>preference.items.slice(),isEditing:()=>editing});
})();
