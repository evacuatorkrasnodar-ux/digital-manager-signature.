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
 cards:'<path d="M19 9h27a6 6 0 0 1 6 6v32a6 6 0 0 1-6 6H19a6 6 0 0 1-6-6V15a6 6 0 0 1 6-6Z" fill="rgba(255,255,255,.065)"/><path d="M11 17H9a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h2" opacity=".55"/><path d="m32 22 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#d6dbe0" stroke-width="1.8"/><circle cx="45" cy="19" r="2" fill="#d6dbe0" stroke="none"/>',
 music:'<path d="m27 20 23-6v28M27 20v26M27 26l23-6" stroke-width="2.2"/><path d="M26.8 46.5c0 4.3-4.2 7.4-9.5 7.4-5.2 0-8.2-2.7-7-6.1 1-3.3 4.5-5.5 9.5-5.5 4.2 0 7 1.6 7 4.2ZM49.8 42.5c0 4.3-4.2 7.4-9.5 7.4-5.2 0-8.2-2.7-7-6.1 1-3.3 4.5-5.5 9.5-5.5 4.2 0 7 1.6 7 4.2Z" fill="rgba(213,219,224,.45)" stroke-width="2"/><path d="m29 21 20-5v3l-20 5Z" fill="#dce1e5" stroke="none" opacity=".55"/>',
 documents:'<path d="M17 7h24l10 10v32a6 6 0 0 1-6 6H17a6 6 0 0 1-6-6V13a6 6 0 0 1 6-6Z" fill="rgba(255,255,255,.065)"/><path d="M41 7v8a3 3 0 0 0 3 3h7" stroke-width="1.9"/><path d="M20 28h23M20 35h18" stroke-width="2.1" opacity=".85"/><path d="M20 46c4-5 5 3 9-1 3-3 4-3 6 0 2 2 5-1 8-1" stroke-width="2.5"/><circle cx="46" cy="44" r="3.2" fill="#d6dbe0" stroke-width="1.7"/>',
 wallet:'<path d="M14 17v-5a6 6 0 0 1 6-6h28M11 17h39a6 6 0 0 1 6 6v24a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7V24a7 7 0 0 1 7-7Z" fill="rgba(255,255,255,.065)"/><path d="M42 30h14v14H42a7 7 0 0 1 0-14Z" fill="#e4e7eb" stroke-width="1.9"/><circle cx="44" cy="37" r="2.5" fill="#aeb7c0" stroke="none"/><path d="M14 23h20" opacity=".45" stroke-width="1.8"/>',
 notebook:'<path d="M16 8h28l8 8v33a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6Z" fill="rgba(255,255,255,.065)"/><path d="M44 8v6a2 2 0 0 0 2 2h6" stroke-width="1.9"/><path d="M17 42c5-8 7-14 10-12 3 2-4 12 1 11 4-1 6-10 9-10 3 0-1 8 2 8 2 0 4-2 6-4" stroke-width="2.6"/><path d="m40 23 10-10a3.4 3.4 0 0 1 5 5L45 28l-7 2Z" fill="#c9ced3" stroke-width="1.7"/><path d="m48 15 5 5M19 49h14" stroke-width="1.8" opacity=".7"/>',
 calendar:'<rect x="9" y="12" width="46" height="44" rx="6" fill="rgba(255,255,255,.065)"/><path d="M9 24h46M21 7v12M43 7v12" stroke-width="2.2"/><path d="M18 32h8M39 32h8M18 42h8M39 42h8" opacity=".56" stroke-width="2.2"/><circle cx="43" cy="43" r="9" fill="#e1e5e9" stroke-width="1.8"/><path d="m39 43 3 3 6-7" stroke-width="2.1"/>',
 health:'<path d="M32 55S8 41 8 24c0-8 5.7-14 13-14 5.2 0 8.7 2.5 11 6.3 2.3-3.8 5.8-6.3 11-6.3 7.3 0 13 6 13 14 0 17-24 31-24 31Z" fill="rgba(255,255,255,.065)"/><path d="M16 32h9l5-9 8 19 5-10h7" stroke-width="2.35"/><path d="M24 16c-3 0-6 2-7 6" opacity=".38" stroke-width="1.8"/><circle cx="44" cy="17" r="2.2" fill="#d6dbe0" stroke="none"/>',
 browser:'<circle cx="32" cy="32" r="24" fill="rgba(255,255,255,.045)"/><path d="M8 32h48M32 8c-8 7-12 16-12 24s4 17 12 24M32 8c8 7 12 16 12 24s-4 17-12 24" stroke-width="2"/><path d="M13 20c11 5 27 5 38 0M13 44c11-5 27-5 38 0" opacity=".68" stroke-width="1.8"/><circle cx="46.2" cy="14.5" r="3.6" fill="#cbd2d8" stroke="none"/>',
 mail:'<path d="M14 15V9a5 5 0 0 1 5-5h26a5 5 0 0 1 5 5v6" opacity=".53"/><rect x="7" y="15" width="50" height="37" rx="6" fill="rgba(255,255,255,.065)"/><path d="m9 19 20 16a5 5 0 0 0 6 0l20-16M10 48l16-14M54 48 38 34" stroke-width="2"/><path d="M21 10h22" stroke-width="1.8" opacity=".48"/><circle cx="48" cy="22" r="2.3" fill="#d6dbe0" stroke="none"/>',
 contacts:'<rect x="11" y="6" width="42" height="51" rx="6" fill="rgba(255,255,255,.065)"/><path d="M24 6v7h16V6" stroke-width="1.8"/><circle cx="32" cy="27" r="7" fill="#e0e4e8" stroke-width="1.9"/><path d="M19 45c1-9 6-13 13-13s12 4 13 13M21 50h22" stroke-width="2"/><circle cx="47" cy="17" r="2.2" fill="#cbd2d8" stroke="none"/>',
 care:'<path d="M32 27C25 22 23 18 24 13c1-5 5-7 8-3 3-4 7-2 8 3 1 5-1 9-8 14Z" fill="#dce1e5" stroke-width="1.9"/><path d="M7 37c5-4 9-3 14 0l7 5h8l7-5c5-3 9-4 14 0M7 42c3 9 10 14 19 15h12c9-1 16-6 19-15" stroke-width="2.3"/><path d="M17 43c5-2 8 0 11 2M47 43c-5-2-8 0-11 2" opacity=".64" stroke-width="1.8"/>',
 family:'<circle cx="23" cy="24" r="7" fill="#e0e4e8" stroke-width="1.9"/><circle cx="43" cy="28" r="5.7" fill="rgba(255,255,255,.065)" stroke-width="1.9"/><path d="M7 54v-6c0-10 6-16 16-16s16 6 16 16v6M38 39c10-1 17 5 17 14v1" stroke-width="2.2"/><path d="M15 12c4-4 10-5 15-2" opacity=".43" stroke-width="1.7"/>',
 'smart-home':'<path d="M7 27 32 7l25 20M13 23v30h38V23" fill="rgba(255,255,255,.065)" stroke-width="2.2"/><path d="M20 36c7-7 17-7 24 0M25 42c4-4 10-4 14 0" stroke-width="1.9"/><circle cx="32" cy="48" r="3" fill="#c9ced3" stroke-width="1.7"/><path d="M53 8v9M48.5 12.5h9" stroke-width="1.7" opacity=".58"/>',
 'business-pulse':'<rect x="10" y="10" width="44" height="44" rx="7" fill="rgba(255,255,255,.065)" stroke-width="2"/><path d="M5 33h14l7-16 11 29 8-18 5 5h9" stroke-width="2.5"/><circle cx="49" cy="33" r="3" fill="#d6dbe0" stroke-width="1.8"/><path d="M17 50h30" stroke-width="1.7" opacity=".4"/>',
 'business-chats':'<path d="M13 10h33a7 7 0 0 1 7 7v22a7 7 0 0 1-7 7H26L12 55V17a7 7 0 0 1 7-7Z" fill="rgba(255,255,255,.065)"/><path d="M22 24h21M22 32h15" stroke-width="2.1"/><path d="M53 21h2a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4h-8" opacity=".5" stroke-width="1.8"/><circle cx="44" cy="32" r="2.2" fill="#d2d8dd" stroke="none"/>',
 'business-mail':'<rect x="7" y="16" width="50" height="37" rx="6" fill="rgba(255,255,255,.065)"/><path d="m9 20 20 16a5 5 0 0 0 6 0l20-16" stroke-width="2.1"/><path d="M24 16v-5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5" stroke-width="1.9"/><circle cx="32" cy="44" r="4" fill="#d3d9de" stroke-width="1.7"/><path d="M32 42v4" stroke-width="1.7"/>',
 'business-documents':'<path d="M17 7h24l10 10v32a6 6 0 0 1-6 6H17a6 6 0 0 1-6-6V13a6 6 0 0 1 6-6Z" fill="rgba(255,255,255,.065)"/><path d="M41 7v8a3 3 0 0 0 3 3h7M20 27h23M20 34h19" stroke-width="2"/><circle cx="40" cy="44" r="9" fill="#e3e7ea" stroke-width="1.7"/><path d="m35 44 4 4 7-8" stroke-width="2.2"/>',
 'business-company':'<path d="M13 56V17a6 6 0 0 1 6-6h26a6 6 0 0 1 6 6v39M7 56h50" fill="rgba(255,255,255,.065)" stroke-width="2.2"/><path d="M24 11V6h16v5M21 23h9v9h-9zM35 23h9v9h-9zM21 38h9v9h-9z" stroke-width="1.8"/><path d="M35 56V38h9v18" fill="#d7dce1" stroke-width="1.8"/><circle cx="41" cy="48" r="1.3" fill="#9ba6af" stroke="none"/>',
 'business-people':'<circle cx="26" cy="22" r="9" fill="#e2e6e9" stroke-width="2"/><path d="M9 54v-5c0-12 6-19 17-19s17 7 17 19v5H9Z" stroke-width="2.2"/><path d="M45 13c7 0 11 4 11 10 0 5-3 8-7 10M47 39c7 2 11 7 11 15" opacity=".7" stroke-width="2"/><path d="M51 7v8M47 11h8" stroke-width="1.9"/>',
 management:'<rect x="8" y="8" width="21" height="21" rx="5" fill="rgba(255,255,255,.065)"/><rect x="35" y="8" width="21" height="21" rx="5" fill="#e7eaed"/><rect x="8" y="35" width="21" height="21" rx="5" fill="#e7eaed"/><rect x="35" y="35" width="21" height="21" rx="5" fill="rgba(255,255,255,.065)"/><path d="M14 19h9M45 14v9M40.5 18.5h9M14 45h9M18.5 40.5v9" opacity=".6" stroke-width="1.8"/><circle cx="45.5" cy="45.5" r="4" fill="#b9c3cb" stroke="none"/>',
 generic:'<rect x="10" y="10" width="44" height="44" rx="7" fill="rgba(255,255,255,.065)"/><path d="M22 32h20M32 22v20" stroke-width="2.3"/><circle cx="47" cy="17" r="3" fill="#cdd4da" stroke="none"/>'
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
 {id:'business-pulse',name:'Пульс бизнеса',shortName:'Пульс',hub:'pulse'},
 {id:'business-chats',name:'Чаты команды',shortName:'Чаты',hub:'chats'},
 {id:'business-mail',name:'Рабочая почта',shortName:'Почта',hub:'mail'},
 {id:'business-documents',name:'Документы бизнеса',shortName:'Документы',hub:'documents'},
 {id:'business-company',name:'Моя компания',shortName:'Компания',hub:'company'},
 {id:'business-people',name:'Сотрудники и кадры',shortName:'Команда',hub:'people'}
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
 if(typeof access?.business==='boolean')return access.business;
 if(access?.plan)return ['business','business-start','business-pro','business-max','business-empire','start','pro','max','empire','rise','autonom','enterprise'].includes(String(access.plan).toLowerCase());
 // Demo mode is a preview only, not an entitlement or authorization.
 return ['rise','autonom','large','employee'].includes(window.SEYVEO_PREVIEW?.getMode?.()||document.getElementById('seyveoDemoModeSelect')?.value||'');
}
const byId=Object.fromEntries(allApps.map(a=>[a.id,a]));
const defaultIds=['music','documents','wallet'];
const AUTO_COUNT=3,MAX_COUNT=4,MAX_TOTAL=8;
const ROW_HEIGHT=66,ROW_GAP=10;
const RESERVED_HEIGHT=ROW_HEIGHT*2+ROW_GAP;
function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
let preference=stored(STORAGE);
if(!preference||!Array.isArray(preference.items))preference={items:defaultIds.slice(),custom:false,showSmart:true};
if(typeof preference.showSmart!=='boolean')preference.showSmart=true;
if(typeof preference.autoSelect!=='boolean')preference.autoSelect=false;
if(!preference.custom&&preference.items.join(',')==='music,documents,notebook,wallet,calendar')preference.items=defaultIds.slice();
// Migrate the previous mixed row without losing either category.
const isBusiness=id=>typeof id==='string'&&id.startsWith('business-')&&!!byId[id];
const uniqueIds=(ids,predicate)=>[...new Set(Array.isArray(ids)?ids:[])].filter(predicate);
preference.businessItems=uniqueIds([...(Array.isArray(preference.businessItems)?preference.businessItems:[]),...preference.items],isBusiness).slice(0,MAX_COUNT);
preference.businessAutoSelect=preference.businessAutoSelect===true;
function normalize(ids){
 const unique=uniqueIds(ids,id=>!!byId[id]&&!isBusiness(id));
 const selected=preference.custom?unique:[...unique,...defaultIds.filter(id=>!unique.includes(id))];
 return selected.slice(0,MAX_TOTAL-(preference.showSmart?1:0));
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
function autoFavorites(smartEnabled=preference.showSmart,businessCount=businessEnabled()?preference.businessItems.length:0){
 const ranked=apps.filter(a=>Number(usage[a.id])>0).sort((a,b)=>(Number(usage[b.id])||0)-(Number(usage[a.id])||0));
 const existing=preference.items.length+(smartEnabled?1:0);
 const target=Math.min(MAX_TOTAL,Math.max(existing,Math.min(MAX_COUNT,MAX_TOTAL-businessCount)));
 return uniqueIds([...ranked.map(a=>a.id),...preference.items,...defaultIds,...apps.map(a=>a.id)],id=>!!byId[id]&&!isBusiness(id)).slice(0,Math.max(0,target-(smartEnabled?1:0)));
}
function autoBusinessFavorites(personalCount=preference.items.length+(preference.showSmart?1:0)){
 const ranked=businessApps.filter(a=>Number(usage[a.id])>0).sort((a,b)=>(Number(usage[b.id])||0)-(Number(usage[a.id])||0));
 return uniqueIds([...ranked.map(a=>a.id),...preference.businessItems,...businessApps.map(a=>a.id)],isBusiness).slice(0,Math.max(0,Math.min(MAX_COUNT,MAX_TOTAL-personalCount)));
}
if(preference.autoSelect)preference.items=autoFavorites();
if(businessEnabled()&&preference.businessAutoSelect)preference.businessItems=autoBusinessFavorites();
save(STORAGE,preference);
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
const personalRow=document.createElement('div');personalRow.className='sv-home-favorites-row';personalRow.setAttribute('role','group');personalRow.setAttribute('aria-label','Личные приложения');rail.append(personalRow);
const smartTile=document.createElement('div');smartTile.className='sv-home-favorite-tile';smartTile.dataset.favoriteId='smart';
const card=document.createElement('button');card.type='button';card.className='sv-home-favorite sv-home-review-entry';
card.setAttribute('aria-label','Открыть дела Сэйви');card.setAttribute('title','Дела для разбора');card.dataset.icon='cards';
const symbol=document.createElement('span');symbol.className='sv-home-favorite-icon';
symbol.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true">'+favoriteGlyphs.cards+'</svg>';
const badge=document.createElement('span');badge.className='sv-home-review-badge';badge.hidden=true;badge.setAttribute('aria-hidden','true');
const caption=document.createElement('span');caption.className='sv-home-favorite-label';caption.textContent='Дела';
symbol.append(badge);card.append(symbol,caption);smartTile.append(card);personalRow.append(smartTile);
const list=document.createElement('div');list.className='sv-home-favorite-items';personalRow.append(list);
const add=document.createElement('button');add.type='button';add.className='sv-home-favorite sv-home-add-entry';add.hidden=true;
add.setAttribute('aria-label','Добавить приложение на главную');
// A plain plus by design: no tile surface or visible caption, even with older CSS.
add.innerHTML='<svg class="sv-home-plain-plus" style="width:27px;height:27px;flex:none;margin-top:11.5px;fill:none;stroke:#141417;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
personalRow.append(add);
const businessRow=document.createElement('div');businessRow.className='sv-home-favorites-row sv-home-favorites-business-row';businessRow.setAttribute('role','group');businessRow.setAttribute('aria-label','Кабинет');businessRow.hidden=true;
const businessList=document.createElement('div');businessList.className='sv-home-favorite-items';businessRow.append(businessList);rail.append(businessRow);
stage.append(rail);
card.addEventListener('click',e=>{
 if(editing||suppressClick){e.preventDefault();suppressClick=false;return}
 if(cardCount>0)window.dispatchEvent(new Event('seyveo:open-card-review'));
 else launch(fallbackId);
});
function icon(id){return '<svg viewBox="0 0 64 64" aria-hidden="true">'+(favoriteGlyphs[id]||favoriteGlyphs.generic)+'</svg>'}
function launch(id){
 const item=byId[id];if(!item||(id.startsWith('business-')&&!businessEnabled()))return;
 const result=item.action?.();
 if(!item.action){
  const source=document.querySelector(item.selector);
  if(source)source.click();else return;
 }else if(result===false)return;
 if(item.action){usage[id]=Math.min(10000,(Number(usage[id])||0)+1);save(USAGE,usage);}
 refreshAutomaticFavorites();
}
function refreshAutomaticFavorites(){
 let changed=false;
 if(preference.autoSelect){const next=autoFavorites();if(next.join(',')!==preference.items.join(',')){preference.items=next;changed=true;}}
 if(businessEnabled()&&preference.businessAutoSelect){const next=autoBusinessFavorites();if(next.join(',')!==preference.businessItems.join(',')){preference.businessItems=next;changed=true;}}
 if(changed){save(STORAGE,preference);renderItems();show();}
}
let longTimer=0,suppressClick=false,holding=false,editing=false,ignoreOutsideUntil=0;
function persist(){
 preference.custom=true;save(STORAGE,preference);
}
function totalSlots(){return preference.items.length+(preference.showSmart?1:0)}
function visibleBusiness(){return businessEnabled()?preference.businessItems.slice(0,Math.max(0,MAX_TOTAL-totalSlots())):[];}
function syncEditControls(){
 smartTile.hidden=!preference.showSmart;
 rail.classList.toggle('is-editing',editing);
 add.hidden=!editing||totalSlots()+visibleBusiness().length>=MAX_TOTAL;
 // Keep the add button within the remaining row, never create a fifth slot.
 (totalSlots()>=MAX_COUNT?businessRow:personalRow).append(add);
 personalRow.hidden=totalSlots()===0&&(add.hidden||add.parentElement!==personalRow);
 businessRow.hidden=businessList.childElementCount===0&&(add.hidden||add.parentElement!==businessRow);
 rail.dataset.twoRows=String(!businessRow.hidden&&!personalRow.hidden);
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
 else if(isBusiness(id))preference.businessItems=preference.businessItems.filter(x=>x!==id);
 else preference.items=preference.items.filter(x=>x!==id);
 persist();
 if(totalSlots()===0&&(!businessEnabled()||!preference.businessItems.length)){exitEdit();updateCount();return;}
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
  if(isBusiness(id)!==isBusiness(to))return;
  const key=isBusiness(id)?'businessItems':'items';
  const a=preference[key].slice(),from=a.indexOf(id),where=a.indexOf(to);
  if(from<0||where<0)return;
  a.splice(from,1);a.splice(where,0,id);
  preference[key]=a;persist();renderItems();show();
 });
 button.addEventListener('pointercancel',()=>{dragged=null;tile.classList.remove('is-dragging')});
}
function renderItems(){
 const oldHeight=rail.hidden?0:rail.getBoundingClientRect().height;
 list.replaceChildren();businessList.replaceChildren();
 const firstPersonal=MAX_COUNT-(preference.showSmart?1:0);
 const firstIds=preference.items.slice(0,firstPersonal);
 const secondIds=[...preference.items.slice(firstPersonal),...visibleBusiness()];
 for(const id of [...firstIds,...secondIds]){
  const app=byId[id];if(!app)continue;
  const tile=document.createElement('div');tile.className='sv-home-favorite-tile';tile.dataset.favoriteId=id;
  const button=document.createElement('button');button.className='sv-home-favorite';button.type='button';
  button.setAttribute('aria-label','Открыть '+app.name);
  button.title=app.name+' · удерживай, чтобы изменить главную';
  const surface=document.createElement('span');surface.className='sv-home-favorite-icon';surface.innerHTML=icon(id);
  const label=document.createElement('span');label.className='sv-home-favorite-label';label.textContent=app.shortName||app.name;
  button.append(surface,label);button.addEventListener('click',e=>{
   if(editing||suppressClick){suppressClick=false;e.preventDefault();return}
   launch(id);
  });
  tile.append(button,minusButton(id,app.name));bindHold(button);bindReorder(button,tile,id);(firstIds.includes(id)?list:businessList).append(tile);
 }
 syncEditControls();
 if(!rail.hidden&&Math.abs(rail.getBoundingClientRect().height-oldHeight)>1){
  homeShortcutTopLocked=false;
 }
}
let activeCurtainPosition=null;
function openCustomize(){
 if(document.getElementById('svHomeFavoritesEditor'))return;
 const before={...preference,items:preference.items.slice(),businessItems:preference.businessItems.slice()};
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
 let selection=preference.items.slice(),businessSelection=preference.businessItems.slice(),smart=preference.showSmart,auto=preference.autoSelect,businessAuto=preference.businessAutoSelect,activeTab='personal';
 const tabbar=document.createElement('div');tabbar.className='sv-home-favorites-tabs';tabbar.setAttribute('role','tablist');tabbar.setAttribute('aria-label','Разделы главной');
 const personalTab=document.createElement('button'),cabinetTab=document.createElement('button');
 for(const [button,name,mode] of [[personalTab,'Личное','personal'],[cabinetTab,'Кабинет','business']]){
  button.type='button';button.textContent=name;button.setAttribute('role','tab');
  button.addEventListener('click',()=>{activeTab=mode;redraw();});tabbar.append(button);
 }
 let curtainBottom=null;
 const positionCurtain=(force=false)=>{
  if(curtainBottom!==null&&!force)return;
  const dock=document.getElementById('navHome')?.getBoundingClientRect();
  // Always reserve two rows in the editor, even before a second row exists.
  // Selection changes cannot resize the curtain; only viewport resizing can.
  const safeRowTop=(dock?.top||window.innerHeight-70)-32-RESERVED_HEIGHT;
  const bottom=Math.max(78,Math.min(window.innerHeight-180,
   Math.round(window.innerHeight-safeRowTop+20)));
  curtainBottom=bottom;
  dialog.style.setProperty('--sv-home-editor-bottom',bottom+'px');
 };
 activeCurtainPosition=positionCurtain;
 const preview=()=>{
  preference={...preference,items:selection.slice(),businessItems:businessSelection.slice(),showSmart:smart,autoSelect:auto,businessAutoSelect:businessAuto,custom:true};
  renderItems();updateCount();show();
 };
 const redraw=()=>{
  const enabled=businessEnabled();
  tabbar.hidden=!enabled;
  if(!enabled)activeTab='personal';
  for(const [button,mode] of [[personalTab,'personal'],[cabinetTab,'business']]){
   button.setAttribute('aria-selected',String(activeTab===mode));button.tabIndex=activeTab===mode?0:-1;
  }
  const cabinet=activeTab==='business';
  const personalCount=selection.length+(smart?1:0);
  const businessLimit=Math.min(MAX_COUNT,Math.max(0,MAX_TOTAL-personalCount));
  const personalLimit=Math.max(personalCount,MAX_TOTAL-(enabled?businessSelection.length:0));
  const effectiveBusinessLimit=Math.max(businessLimit,businessSelection.length);
  const picked=cabinet?businessSelection:selection;
  const autoActive=cabinet?businessAuto:auto;
  help.textContent=autoActive?'Сэйви выбирает часто используемые кнопки':'Выбрано '+(picked.length+(!cabinet&&smart?1:0))+' из '+(cabinet?effectiveBusinessLimit:personalLimit)+(cabinet&&businessSelection.length>businessLimit?' · освободите место':'');
  autoButton.setAttribute('aria-pressed',String(autoActive));
  autoButton.title=autoActive?'Автовыбор включён':'Автовыбор: Сэйви подбирает частые кнопки';
  grid.dataset.section=activeTab;
  grid.replaceChildren();
  const options=cabinet?businessApps:[{id:'smart',name:'Умная кнопка'},...apps];
  for(const app of options){
   const b=document.createElement('button');b.type='button';
   const chosen=app.id==='smart'?smart:picked.includes(app.id);
   b.setAttribute('aria-pressed',String(chosen));
   b.innerHTML=app.id==='smart'?'<svg viewBox="0 0 64 64" aria-hidden="true">'+favoriteGlyphs.cards+'</svg>':icon(app.id);
   const t=document.createElement('span');t.textContent=app.name;
   const mark=document.createElement('small');mark.textContent=chosen?'✓':'';
   b.append(t,mark);
   b.addEventListener('click',()=>{
    if(cabinet){
     businessAuto=false;
     if(chosen)businessSelection=businessSelection.filter(x=>x!==app.id);
     else if(businessSelection.length<businessLimit)businessSelection.push(app.id);
    }else{
     auto=false;
     if(app.id==='smart'){
      if(smart)smart=false;else if(selection.length<personalLimit)smart=true;
     }else if(chosen)selection=selection.filter(x=>x!==app.id);
     else if(selection.length+(smart?1:0)<personalLimit)selection.push(app.id);
    }
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
  if(activeTab==='business'){
   businessAuto=!businessAuto;
   if(businessAuto)businessSelection=autoBusinessFavorites(selection.length+(smart?1:0));
  }else{
   auto=!auto;
   if(auto)selection=autoFavorites(smart,businessEnabled()?businessSelection.length:0);
  }
  redraw();preview();
 });
 head.insertBefore(autoButton,title);
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
  const finish=()=>{dialog.close();dialog.remove();homeShortcutTopLocked=false;show();};
  if(animate){
   dialog.classList.add('is-leaving');
   window.setTimeout(finish,300);
  }else finish();
 }
 const onDockNavigation=e=>{
  if(e.target.closest?.('#navTasks,#navPicture,#navManage'))close(true,true);
 };
 const onRouteChange=()=>close(true,true);
 done.addEventListener('click',()=>close(true,true));
 dialog.addEventListener('cancel',e=>{e.preventDefault();close(false,true)});
 positionCurtain(); // establish final geometry before the opening animation
 dialog.show();
 homeShortcutTopLocked=false;
 const onCurtainResize=()=>{positionCurtain(true);homeShortcutTopLocked=false;show();};
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
let homeShortcutTopLocked=false;
renderItems();
function place(force=false){
 if(rail.hidden||homeShortcutTopLocked&&!force)return;
 const weather=document.getElementById('svSayviHomeWeather');
 const r=rail.getBoundingClientRect();
 if(!r.height)return;
 const dock=document.getElementById('navHome')?.getBoundingClientRect();
 const editorOpen=!!document.getElementById('svHomeFavoritesEditor')?.open;
 const reserved=editorOpen?Math.max(RESERVED_HEIGHT,r.height):r.height;
 const maximum=(dock?.top||window.innerHeight-64)-reserved-32;
 let wanted=null;
 if(weather&&!weather.hidden&&getComputedStyle(weather).display!=='none'&&getComputedStyle(weather).visibility!=='hidden'){
  const w=weather.getBoundingClientRect();if(w.height)wanted=w.bottom+24;
 }
 // Always resolve the fallback before first paint. The row must not start at
 // the CSS placeholder position and jump when the weather finishes loading.
 if(wanted===null||editorOpen||rail.dataset.twoRows==='true')wanted=maximum;
 const next=Math.min(wanted,maximum);
 rail.style.top=Math.round(next-stage.getBoundingClientRect().top)+'px';
 if(activeCurtainPosition)activeCurtainPosition();
 window.dispatchEvent(new Event('seyveo:home-shortcuts-layout'));
}
let firstHomeEntrancePlayed=false;
let launchPreviewActive=false;
const show=()=>{
 const curtainOpen=!!document.getElementById('svHomeFavoritesEditor')?.open;
 const homeUsable=!home.hidden&&!document.hidden&&(!location.hash||location.hash==='#home');
 // During first launch the full-size sphere shows its brand logo before
 // the ordinary "arrived" state. Let shortcuts gently enter at that moment.
 const launchLogoVisible=!root.classList.contains('sv-home-launch-pending')&&root.classList.contains('sv-home-launch-logo-visible')&&
  !root.classList.contains('sv-cinema-boot')&&
  !root.classList.contains('sv-home-prelayout');
 if(!firstHomeEntrancePlayed&&launchLogoVisible)launchPreviewActive=true;
 if(root.classList.contains('sv-home-empty-arrived')&&
    !root.classList.contains('sv-home-empty-arriving'))launchPreviewActive=false;
 const visible=curtainOpen?homeUsable:homeUsable&&
 !root.classList.contains('sv-home-launch-pending')&&
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
 const shouldShow=visible&&(editing||totalSlots()>0||(businessEnabled()&&preference.businessItems.length>0));
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
     // One sequence across both rows, starting only after the sphere lands.
     // Hidden smart/Business slots never consume a beat.
     const tiles=Array.from(rail.querySelectorAll('.sv-home-favorite-tile')).filter(tile=>!tile.closest('[hidden]'));
     tiles.forEach((tile,index)=>tile.style.setProperty('--sv-shortcut-enter-delay',index*420+'ms'));
     rail.classList.add('sv-home-favorites-enter');
     const duration=1200+Math.max(0,tiles.length-1)*420;
     setTimeout(()=>{
      rail.classList.remove('sv-home-favorites-enter');
      tiles.forEach(tile=>tile.style.removeProperty('--sv-shortcut-enter-delay'));
     },duration+80);
    }
    rail.style.visibility='';
   });
  }else if(!homeShortcutTopLocked){
   place(true);homeShortcutTopLocked=true;
  }
 }else{
  homeShortcutTopLocked=false;
  if(!visible&&rail.dataset.twoRows==='true')window.dispatchEvent(new Event('seyveo:home-shortcuts-layout'));
 }
};
function updateCount(){
 const pending=cardCount>0;
 badge.hidden=!pending;
 badge.textContent=cardCount>99?'99+':String(cardCount);
 card.classList.toggle('sv-home-review-entry',pending);
 if(pending){
  if(card.dataset.icon!=='cards'){
   symbol.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true">'+favoriteGlyphs.cards+'</svg>';
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
window.addEventListener('seyveo:preview-role-changed',()=>{renderItems();show();});
window.addEventListener('seyveo:entitlements-changed',()=>{renderItems();show();});
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
  refreshAutomaticFavorites();
 }
},{capture:true,passive:true});
updateCount();show();
window.SEYVEO_HOME_FAVORITES=Object.freeze({openCustomize,enterEdit,getItems:()=>[...preference.items,...visibleBusiness()],getPersonalItems:()=>preference.items.slice(),getBusinessItems:()=>visibleBusiness(),isEditing:()=>editing});
})();
