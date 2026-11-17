/* SEYVEO · Home favourites / review badge. Does not move Sayvi or the dock. */
(()=>{'use strict';
const home=document.getElementById('homePage'),stage=document.getElementById('stage');
if(!home||!stage||document.getElementById('svHomeFavorites'))return;
const root=document.documentElement;
const STORAGE='seyveo.home.favorites.v1',USAGE='seyveo.home.favorite-usage.v1';
/* SEYVEO Home symbol family · unified 24-unit optical grid.
   Every selectable app uses the same 1.6px rounded stroke and 23px drawing box.
   No icon fonts, emoji or external sprite sheets. */
const favoriteGlyphs={
 cards:'<rect x="6.5" y="6" width="13" height="14.5" rx="2.3"/><path d="M4 16.5V5.7c0-1.3 1-2.3 2.3-2.3H16"/><path d="M9.7 10.3h6.7M9.7 13.8h5.2"/>',
 music:'<path d="M9 17.5V6l10-2v11.7M9 8.8l10-2"/><ellipse cx="6.3" cy="17.9" rx="2.7" ry="1.95" transform="rotate(-17 6.3 17.9)" fill="currentColor" stroke="none"/><ellipse cx="16.3" cy="16.1" rx="2.7" ry="1.95" transform="rotate(-17 16.3 16.1)" fill="currentColor" stroke="none"/>',
 documents:'<path d="M7 3.5h7.5L19 8v11c0 1.1-.9 2-2 2H7a2 2 0 0 1-2-2V5.5c0-1.1.9-2 2-2Z"/><path d="M14.5 3.5V8H19M8.8 12h6.8M8.8 15.4h6.8M8.8 18.8h4.4"/>',
 wallet:'<rect x="3.5" y="6.4" width="17" height="13.7" rx="2.5"/><path d="M5.1 6.4V5.6c0-1.4 1.1-2.5 2.5-2.5H18"/><path d="M14.9 11.3H20.5v5H14.9a2.5 2.5 0 0 1 0-5Z"/><circle cx="16.5" cy="13.8" r=".75" fill="currentColor" stroke="none"/>',
 notebook:'<rect x="5" y="3.5" width="14" height="17" rx="2.2"/><path d="M8.5 3.5v17M11.7 8h4.1M11.7 11.8h4.1M11.7 15.6h3.2"/>',
 calendar:'<rect x="4" y="5.4" width="16" height="15" rx="2.3"/><path d="M4 9.8h16M8 3.5v4M16 3.5v4M8.2 13.4h2.2M13.5 13.4h2.2M8.2 17.2h2.2M13.5 17.2h2.2"/>',
 health:'<path d="M12 20S3.5 14.3 3.5 9.2c0-2.7 1.9-4.6 4.4-4.6 1.8 0 3.2.9 4.1 2.3.9-1.4 2.3-2.3 4.1-2.3 2.5 0 4.4 1.9 4.4 4.6C20.5 14.3 12 20 12 20Z"/><path d="M7.3 11.8h2.1l1.2-2.3 2.4 4.7 1.2-2.4h2.5"/>',
 browser:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.9 2.8 4.3 5.6 4.3 8.5s-1.4 5.7-4.3 8.5M12 3.5c-2.9 2.8-4.3 5.6-4.3 8.5s1.4 5.7 4.3 8.5"/>',
 mail:'<rect x="3.5" y="5.8" width="17" height="12.7" rx="2.3"/><path d="m4.2 7.3 7.1 5.7a1.2 1.2 0 0 0 1.4 0l7.1-5.7"/>',
 contacts:'<rect x="4.2" y="3.5" width="15.6" height="17" rx="2.3"/><circle cx="12" cy="9.3" r="2.3"/><path d="M7.5 17c.5-2.3 2.2-3.4 4.5-3.4s4 1.1 4.5 3.4"/>',
 care:'<path d="M12 11.2S8.7 9.1 8.7 7a2.1 2.1 0 0 1 3.3-1.6A2.1 2.1 0 0 1 15.3 7c0 2.1-3.3 4.2-3.3 4.2Z"/><path d="M4 15.2 7.9 13l3 1.7h2.2l3-1.7 3.9 2.2M3.5 15.5v2.2c0 .6.3 1.1.8 1.4l3.8 2h7.8l3.8-2c.5-.3.8-.8.8-1.4v-2.2"/>',
 family:'<circle cx="8.7" cy="8.7" r="2.4"/><circle cx="16.6" cy="9.7" r="1.9"/><path d="M3.9 19.3v-2.2c0-2.6 2-4.3 4.8-4.3s4.8 1.7 4.8 4.3v2.2M15.2 14.5c2.9-.2 4.9 1.4 4.9 4.1v.7"/>',
 'smart-home':'<path d="m3.4 11.2 8.6-7.4 8.6 7.4M6.1 10.3v9.9h11.8v-9.9"/><path d="M8.7 13.6a5 5 0 0 1 6.6 0M10.2 15.6a2.7 2.7 0 0 1 3.6 0"/><circle cx="12" cy="17.9" r=".7" fill="currentColor" stroke="none"/>',
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
 {id:'smart-home',name:'Умный дом',selector:'[data-calendar-space="smart-home"]'}
];
const byId=Object.fromEntries(apps.map(a=>[a.id,a]));
const defaultIds=['music','documents','wallet'];
const LIMIT=3;
function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
let preference=stored(STORAGE);
if(!preference||!Array.isArray(preference.items))preference={items:defaultIds.slice(),custom:false};
if(!preference.custom&&preference.items.join(',')==='music,documents,notebook,wallet,calendar')preference.items=defaultIds.slice();
function normalize(ids){const unique=[...new Set(ids)].filter(id=>byId[id]);return [...unique,...defaultIds.filter(id=>!unique.includes(id))].slice(0,LIMIT)}
preference.items=normalize(preference.items);
let usage=stored(USAGE)||{},cardCount=Number(window.SEYVEO_REVIEW_CARDS?.count?.())||0;
if(!preference.custom){
 const candidates=apps.slice().sort((a,b)=>(usage[b.id]||0)-(usage[a.id]||0));
 if(candidates.filter(a=>(usage[a.id]||0)>0).length>=LIMIT&&
  candidates[LIMIT-1]&&((usage[candidates[LIMIT-1].id]||0)>=3)){
  preference.items=normalize(candidates.slice(0,LIMIT).map(a=>a.id));
  save(STORAGE,preference);
 }
}
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
const card=document.createElement('button');card.type='button';card.className='sv-home-favorite sv-home-review-entry';
card.setAttribute('aria-label','Открыть дела Сэйви');card.setAttribute('title','Дела для разбора');card.dataset.icon='cards';
const symbol=document.createElement('span');symbol.className='sv-home-favorite-icon';
symbol.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+favoriteGlyphs.cards+'</svg>';
const badge=document.createElement('span');badge.className='sv-home-review-badge';badge.hidden=true;badge.setAttribute('aria-hidden','true');
const caption=document.createElement('span');caption.className='sv-home-favorite-label';caption.textContent='Дела';
symbol.append(badge);card.append(symbol,caption);rail.append(card);
const list=document.createElement('div');list.className='sv-home-favorite-items';rail.append(list);
stage.append(rail);
card.addEventListener('click',()=>{
 if(cardCount>0)window.dispatchEvent(new Event('seyveo:open-card-review'));
 else launch(fallbackId);
});
function icon(id){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(favoriteGlyphs[id]||favoriteGlyphs.generic)+'</svg>'}
function launch(id){
 const item=byId[id];if(!item)return;
 const result=item.action?.();
 if(!item.action){
  const source=document.querySelector(item.selector);
  if(source)source.click();else return;
 }else if(result===false)return;
 if(item.action){usage[id]=Math.min(10000,(Number(usage[id])||0)+1);save(USAGE,usage);}
}
let longTimer=0,suppressClick=false,holding=false;
function bindHold(button){
 button.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  holding=true;clearTimeout(longTimer);
  longTimer=setTimeout(()=>{if(!holding)return;suppressClick=true;openCustomize();},650);
 });
 for(const type of ['pointerup','pointercancel','pointerleave'])button.addEventListener(type,()=>{
  holding=false;clearTimeout(longTimer);
 });
 button.addEventListener('contextmenu',e=>{e.preventDefault();suppressClick=true;openCustomize()});
}
function renderItems(){
 list.replaceChildren();
 for(const id of preference.items){
  const app=byId[id];if(!app)continue;
  const button=document.createElement('button');button.className='sv-home-favorite';button.type='button';
  button.setAttribute('aria-label','Открыть '+app.name);
  button.title=app.name+' · удерживай, чтобы настроить';
  const surface=document.createElement('span');surface.className='sv-home-favorite-icon';surface.innerHTML=icon(id);
  const label=document.createElement('span');label.className='sv-home-favorite-label';label.textContent=app.name;
  button.append(surface,label);button.addEventListener('click',e=>{
   if(suppressClick){suppressClick=false;e.preventDefault();return}
   launch(id);
  });
  bindHold(button);list.append(button);
 }
}
function openCustomize(){
 if(document.getElementById('svHomeFavoritesEditor'))return;
 const dialog=document.createElement('dialog');dialog.id='svHomeFavoritesEditor';dialog.className='sv-home-favorites-editor';
 const shell=document.createElement('div');shell.className='sv-home-favorites-editor-shell';
 const head=document.createElement('div');head.className='sv-home-favorites-editor-head';
 const title=document.createElement('strong');title.textContent='Любимые приложения';
 const done=document.createElement('button');done.type='button';done.textContent='Готово';
 head.append(title,done);
 const help=document.createElement('p');help.textContent='Выбери три приложения. Их порядок останется таким, как ты выбрал.';
 const grid=document.createElement('div');grid.className='sv-home-favorites-editor-grid';
 let selection=preference.items.slice();
 const redraw=()=>{
  grid.replaceChildren();
  for(const app of apps){
   const b=document.createElement('button');b.type='button';
   const chosen=selection.indexOf(app.id);
   b.setAttribute('aria-pressed',String(chosen>=0));
   b.innerHTML=icon(app.id);
   const t=document.createElement('span');t.textContent=app.name;
   const number=document.createElement('small');number.textContent=chosen>=0?String(chosen+1):'+';
   b.append(t,number);
   b.addEventListener('click',()=>{
    if(chosen>=0)selection=selection.filter(x=>x!==app.id);
    else if(selection.length<LIMIT)selection.push(app.id);
    else return;
    redraw();
   });grid.append(b);
  }
 };
 redraw();shell.append(head,help,grid);dialog.append(shell);document.body.append(dialog);
 function close(){dialog.close();dialog.remove();setTimeout(()=>{suppressClick=false},60)}
 done.addEventListener('click',()=>{if(selection.length===LIMIT){preference={items:selection,custom:true};save(STORAGE,preference);renderItems();updateCount();close()}else{help.textContent='Выбери ровно три приложения.'}});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
 dialog.showModal();
}
renderItems();
function place(){
 if(rail.hidden)return;
 rail.style.removeProperty('top');
 const weather=document.getElementById('svSayviHomeWeather');
 if(!weather||weather.hidden||getComputedStyle(weather).display==='none'||getComputedStyle(weather).visibility==='hidden')return;
 const w=weather.getBoundingClientRect(),r=rail.getBoundingClientRect();
 if(!w.height||!r.height)return;
 const dock=document.getElementById('navHome')?.getBoundingClientRect();
 // Protect actual finger-sized hit rectangles, not only visible glyphs.
 // Keep 24px between weather and shortcuts and at least 32px above the dock.
 const maximum=(dock?.top||window.innerHeight-64)-r.height-32;
 const wanted=w.bottom+24;
 const next=Math.min(wanted,maximum);
 rail.style.top=Math.round(next-stage.getBoundingClientRect().top)+'px';
}
const show=()=>{
 const visible=!home.hidden&&!document.hidden&&(!location.hash||location.hash==='#home')&&
 !root.classList.contains('seyveo-conversation')&&
 root.classList.contains('sv-home-empty-arrived')&&
 !root.classList.contains('sv-home-empty-arriving')&&
 !root.classList.contains('sv-home-empty-sphere-leaving')&&
 !root.classList.contains('sv-review-open')&&
 !document.querySelector('dialog[open]')&&
 !(document.getElementById('svSmartStartHome')?.hidden===false);
 rail.hidden=!visible;
 if(visible)requestAnimationFrame(place);
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
window.addEventListener('resize',show);
const weather=document.getElementById('svSayviHomeWeather');
if(weather){new ResizeObserver(show).observe(weather);new MutationObserver(show).observe(weather,{attributes:true,attributeFilter:['hidden','class','style']});}
new MutationObserver(show).observe(root,{attributes:true,attributeFilter:['class']});
new MutationObserver(show).observe(home,{attributes:true,attributeFilter:['hidden']});
document.addEventListener('click',e=>{
 const target=e.target.closest?.('[data-world-space],[data-calendar-space]');if(!target)return;
 const key=target.getAttribute('data-world-space')||target.getAttribute('data-calendar-space');
 const entry=byId[key]?key:null;
 if(entry){usage[entry]=Math.min(10000,(Number(usage[entry])||0)+1);save(USAGE,usage)}
},{capture:true,passive:true});
updateCount();show();
window.SEYVEO_HOME_FAVORITES=Object.freeze({openCustomize,getItems:()=>preference.items.slice()});
})();
