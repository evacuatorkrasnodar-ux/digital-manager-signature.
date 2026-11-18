/* SEYVEO · Home favourites / review badge. Does not move Sayvi or the dock. */
(()=>{'use strict';
const home=document.getElementById('homePage'),stage=document.getElementById('stage');
if(!home||!stage||document.getElementById('svHomeFavorites'))return;
const root=document.documentElement;
const STORAGE='seyveo.home.favorites.v1',USAGE='seyveo.home.favorite-usage.v1';
/* SEYVEO Atelier: bespoke, gentle ink drawings, made for 24x24 Retina marks.
   A little illustrated detail makes each symbol memorable without adding noise.
   All glyphs are pure vector and share the Notebook's fine graphite stroke. */
const favoriteGlyphs={
 cards:'<path d="M8.1 3.3H17a1.9 1.9 0 0 1 1.9 1.9v1.5M6 6.1h11.2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2Z"/><path d="m11.6 9.3.85 2.7 2.7.85-2.7.85-.85 2.7-.85-2.7-2.7-.85 2.7-.85Z"/><circle cx="16.5" cy="8.8" r=".6" fill="currentColor" stroke="none"/>',
 music:'<path d="M9.4 6.9 18.1 4.8v11M9.4 6.9v11M9.4 9.1l8.7-2.1"/><path d="M9.2 17.8c0 1.5-1.3 2.6-3.1 2.8-1.7.2-3-.4-3-1.6 0-1.4 1.5-2.5 3.2-2.7 1.7-.2 2.9.3 2.9 1.5ZM18 15.8c0 1.5-1.4 2.6-3.1 2.8-1.8.2-3-.4-3-1.6 0-1.4 1.4-2.5 3.2-2.7 1.7-.2 2.9.3 2.9 1.5Z"/><path d="M4.8 11.4c.8-.5 1.7-.8 2.8-.9" opacity=".48"/>',
 documents:'<path d="M6.9 3.1h7l4.4 4.5v11.2c0 1.1-.9 2-2 2H6.9c-1.1 0-2-.9-2-2V5.1c0-1.1.9-2 2-2Z"/><path d="M13.9 3.2v4.7h4.4M8.2 10.9h7.1M8.2 13.6h5.2"/><path d="M8.3 17.4c1.1-1.5 1.2 1.6 2.3.1.6-.8.9-.4 1.2.2.35.75 1.3.35 2.2-.15" opacity=".75"/>',
 wallet:'<path d="M5.2 6.2V5a2 2 0 0 1 2-2h9.5M4.9 6.1h13.7a2 2 0 0 1 2 2v10.1a2 2 0 0 1-2 2H4.9a2 2 0 0 1-2-2V8.1a2 2 0 0 1 2-2Z"/><path d="M14.8 11.1h5.8v5.6h-5.8a2.8 2.8 0 0 1 0-5.6Z"/><circle cx="16" cy="13.9" r=".8" fill="currentColor" stroke="none"/><path d="M6.4 8.2h4.2" opacity=".4"/>',
 notebook:'<path d="M7 3.6h9.8c.9 0 1.6.7 1.6 1.6v13.5c0 .9-.7 1.6-1.6 1.6H7c-.9 0-1.6-.7-1.6-1.6V5.2c0-.9.7-1.6 1.6-1.6Z"/><path d="M8.1 3.7v16.5M4.2 7.5h3M4.2 12h3M4.2 16.5h3" opacity=".75"/><path d="M10.3 14.8c.6-.9.9-2.7 1.5-2.7.7 0 .1 2.9.9 2.9.6 0 1-1.6 1.6-1.6.5 0 .5 1.3 1.2 1.3"/><path d="m16.4 10.8 3.5-4.6 1.4 1.1-3.5 4.6-1.7.7Z"/>',
 calendar:'<rect x="3.7" y="5.2" width="16.6" height="15.2" rx="2.1"/><path d="M3.7 9.7h16.6M8 3.5v3.7M16 3.5v3.7"/><path d="m8.4 15.3 2.2 2.1 4.8-5.1"/><path d="M17.3 12.9h.1" opacity=".5"/>',
 health:'<path d="M12 20.5S3.3 15 3.3 9.4c0-2.8 1.9-4.8 4.4-4.8 1.9 0 3.3 1 4.3 2.5 1-1.5 2.4-2.5 4.3-2.5 2.5 0 4.4 2 4.4 4.8 0 5.6-8.7 11.1-8.7 11.1Z"/><path d="M6.6 12.2h2.9l1.4-2.7 2.2 5.1 1.2-2.4h3"/><circle cx="17.8" cy="8.1" r=".65" fill="currentColor" stroke="none" opacity=".55"/>',
 browser:'<circle cx="12" cy="12" r="8.9"/><path d="M3.3 12h17.4M12 3.1c-2.7 2.7-4.3 5.7-4.3 8.9s1.6 6.1 4.3 8.9M12 3.1c2.7 2.7 4.3 5.7 4.3 8.9s-1.6 6.1-4.3 8.9"/><path d="M5.3 7.6c3.8 1.4 9.6 1.4 13.4 0M5.3 16.4c3.8-1.4 9.6-1.4 13.4 0" opacity=".75"/><circle cx="17.8" cy="6.1" r=".7" fill="currentColor" stroke="none"/>',
 mail:'<path d="M4.1 8V6.5c0-1.2 1-2.1 2.2-2.1h9.4c1.2 0 2.2.9 2.2 2.1V8" opacity=".6"/><rect x="3.5" y="8" width="17" height="11.5" rx="2"/><path d="m4.3 9.1 7 5.3c.4.3 1 .3 1.4 0l7-5.3M4.7 18l5.4-4.6M19.3 18l-5.4-4.6"/>',
 contacts:'<rect x="4.6" y="3.1" width="14.8" height="17.8" rx="2.1"/><path d="M8.7 3.1v2.2h6.6V3.1"/><circle cx="12" cy="10" r="2.3"/><path d="M7.9 17.2c.3-2.3 1.8-3.4 4.1-3.4 2.3 0 3.8 1.1 4.1 3.4M8.4 18.8h7.2"/>',
 care:'<path d="M12 11.2c-2.6-1.8-3.6-3.3-3.1-5.1.4-1.9 2.1-2.2 3.1-.6 1-1.6 2.7-1.3 3.1.6.5 1.8-.5 3.3-3.1 5.1Z"/><path d="M3.1 14.2c1.5-1.1 2.9-1.1 4.5 0l2.5 1.8h3.8l2.5-1.8c1.6-1.1 3-1.1 4.5 0M3.7 16.3c.8 2 2.5 3.5 4.7 4.2h7.2c2.2-.7 3.9-2.2 4.7-4.2"/><path d="M10.1 16.1c-1.1-.2-1.8.2-2.3.7M13.9 16.1c1.1-.2 1.8.2 2.3.7" opacity=".55"/>',
 family:'<circle cx="9.1" cy="8.3" r="2.25"/><circle cx="16.8" cy="9.6" r="1.75"/><path d="M3.4 19.7v-2.2c0-2.8 2.3-4.5 5.7-4.5s5.7 1.7 5.7 4.5v2.2M15.8 14.3c3.1 0 4.8 1.5 4.8 4.1v1.3"/><path d="M6.5 4.4c1.2-1.1 3.7-1.5 5.2-.5" opacity=".48"/>',
 'smart-home':'<path d="m3.5 10.9 8.5-7.2 8.5 7.2M5.8 9.8v9.9h12.4V9.8"/><path d="M8.2 13.5a5.7 5.7 0 0 1 7.6 0M10 15.6a2.8 2.8 0 0 1 4 0"/><circle cx="12" cy="17.8" r=".85" fill="currentColor" stroke="none"/><path d="M19.8 4.4v3M18.3 5.9h3" opacity=".7"/>',
 'business-pulse':'<path d="M4.5 6.7a2.2 2.2 0 0 1 2.2-2.2h10.6a2.2 2.2 0 0 1 2.2 2.2v10.6a2.2 2.2 0 0 1-2.2 2.2H6.7a2.2 2.2 0 0 1-2.2-2.2" opacity=".5"/><path d="M2.1 12.5h4.7l2.1-4.7 3.4 9 2.9-6.6 1.5 2.3h5.2"/><circle cx="19.7" cy="12.5" r=".6" fill="currentColor" stroke="none"/>',
 'business-chats':'<path d="M5 4.5h12.7a2 2 0 0 1 2 2v8.2a2 2 0 0 1-2 2H10l-5 3v-13a2 2 0 0 1 2-2Z"/><path d="M9 9h6.8M9 12.1h4.9"/><path d="M19.7 8.3h.6c1 0 1.7.8 1.7 1.8v7.5c0 1-.8 1.7-1.8 1.7h-2.5" opacity=".55"/>',
 'business-mail':'<rect x="3.4" y="6.3" width="17.2" height="13" rx="2.2"/><path d="m4.2 7.9 7.1 5.8a1.2 1.2 0 0 0 1.5 0l7-5.8"/><path d="M9 6.3V4.5h6v1.8"/><circle cx="12" cy="16.9" r=".9" fill="currentColor" stroke="none" opacity=".62"/>',
 'business-documents':'<path d="M7 3.1h7.4l4.4 4.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.1a2 2 0 0 1 2-2Z"/><path d="M14.4 3.2v4.5h4.4M8.4 11h6.8M8.4 13.8h7.2"/><path d="m9.4 17.4 1.5 1.5 3-3.1"/><circle cx="15.3" cy="17.4" r="2.6" opacity=".45"/>',
 'business-company':'<path d="M5 20.4V7.2c0-1 .8-1.8 1.8-1.8h10.4c1 0 1.8.8 1.8 1.8v13.2M3.2 20.4h17.6"/><path d="M9.1 5.4v-2h5.8v2M8.2 9.2h2.6v2.6H8.2zM13.2 9.2h2.6v2.6h-2.6zM8.2 14h2.6v2.6H8.2zM13.2 14h2.6v6.4h-2.6z"/>',
 'business-people':'<circle cx="10.2" cy="7.9" r="2.7"/><path d="M4.8 19.5V18c0-3.5 2.1-5.3 5.4-5.3s5.4 1.8 5.4 5.3v1.5H4.8Z"/><path d="M16.7 5.6a2.5 2.5 0 0 1 .1 4.6M17.6 13.3c2.2.5 3.5 2 3.5 4.6v1.6M3.2 9.3h2.1"/><path d="M4.2 8.3v2" opacity=".5"/>',
 management:'<rect x="3.4" y="3.4" width="7.3" height="7.3" rx="1.5"/><rect x="13.3" y="3.4" width="7.3" height="7.3" rx="1.5"/><rect x="3.4" y="13.3" width="7.3" height="7.3" rx="1.5"/><rect x="13.3" y="13.3" width="7.3" height="7.3" rx="1.5"/><path d="M5.3 8.5h3.5M17 5.4v3.4M15.3 7.1h3.4M5.3 17h3.5M7.1 15.3v3.4" opacity=".5"/><circle cx="17" cy="17" r="1.1" fill="currentColor" stroke="none"/>',
 generic:'<rect x="4.1" y="4.1" width="15.8" height="15.8" rx="3"/><path d="M8 12h8M12 8v8"/><circle cx="18" cy="6" r=".8" fill="currentColor" stroke="none"/>'
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
