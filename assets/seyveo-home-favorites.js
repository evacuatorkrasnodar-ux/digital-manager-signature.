/* SEYVEO · Home favourites / review badge. Does not move Sayvi or the dock. */
(()=>{'use strict';
const home=document.getElementById('homePage'),stage=document.getElementById('stage');
if(!home||!stage||document.getElementById('svHomeFavorites'))return;
const root=document.documentElement;
const STORAGE='seyveo.home.favorites.v1',USAGE='seyveo.home.favorite-usage.v1';
const paths={
 notebook:'M6 4h13v16H6z M9 4v16 M12 9h4 M12 13h4 M12 17h3',
 calendar:'M5 5h14v15H5z M5 9h14 M9 3v4 M15 3v4 M9 13h2 M14 13h2 M9 17h2',
 health:'M3 12h4l3-6 4 12 3-6h4',
 browser:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M3 12h18 M12 3c5 5 5 13 0 18 M12 3c-5 5-5 13 0 18',
 home:'M4 11l8-7 8 7 M6 10v10h12V10 M10 20v-6h4v6',
 mail:'M3.5 6h17v12h-17z M3.5 7l8.5 7 8.5-7',
 tasks:'M8 7h12 M8 12h12 M8 17h12 M3.5 7l1 1 2-2 M3.5 12l1 1 2-2 M3.5 17l1 1 2-2'
};
/* Four custom optical glyphs use the same stroke and rounded geometry.
   Inline SVG stays crisp on retina phones; no image sprites or icon fonts. */
const favoriteGlyphs={
 cards:'<rect x="6.5" y="6" width="13" height="14.5" rx="2.3"/><path d="M4 16.5V5.7c0-1.3 1-2.3 2.3-2.3H16"/><path d="M9.7 10.3h6.7M9.7 13.8h5.2"/>',
 music:'<path d="M9 17.5V6l10-2v11.7M9 8.8l10-2"/><ellipse cx="6.3" cy="17.9" rx="2.7" ry="1.95" transform="rotate(-17 6.3 17.9)" fill="currentColor" stroke="none"/><ellipse cx="16.3" cy="16.1" rx="2.7" ry="1.95" transform="rotate(-17 16.3 16.1)" fill="currentColor" stroke="none"/>',
 documents:'<path d="M7 3.5h7.5L19 8v11c0 1.1-.9 2-2 2H7a2 2 0 0 1-2-2V5.5c0-1.1.9-2 2-2Z"/><path d="M14.5 3.5V8H19M8.8 12h6.8M8.8 15.4h6.8M8.8 18.8h4.4"/>',
 wallet:'<rect x="3.5" y="6.4" width="17" height="13.7" rx="2.5"/><path d="M5.1 6.4V5.6c0-1.4 1.1-2.5 2.5-2.5H18"/><path d="M14.9 11.3H20.5v5H14.9a2.5 2.5 0 0 1 0-5Z"/><circle cx="16.5" cy="13.8" r=".75" fill="currentColor" stroke="none"/>'
};
const apps=[
 {id:'music',name:'Музыка',selector:'[data-calendar-space="music"]'},
 {id:'documents',name:'Документы',selector:'[data-calendar-space="documents"]'},
 {id:'notebook',name:'Блокнот',action:()=>window.SEYVEO_NOTES_API?.openNotes?.()},
 {id:'wallet',name:'Кошелёк',selector:'[data-calendar-space="wallet"]'},
 {id:'calendar',name:'Календарь',action:()=>{location.hash='#calendar'}},
 {id:'health',name:'Здоровье',selector:'[data-calendar-space="health"]'},
 {id:'browser',name:'Браузер',selector:'[data-calendar-space="browser"]'},
 {id:'mail',name:'Почта',selector:'[data-calendar-space="mail"]'}
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
const fallbackOrder=['browser','music','notebook','calendar','health','mail','documents','wallet'];
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
function icon(id){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(favoriteGlyphs[id]||'<path d="'+paths[id]+'"/>')+'</svg>'}
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
 const entry=key==='music'?'music':key==='documents'?'documents':key==='wallet'?'wallet':key==='browser'?'browser':key==='health'?'health':key==='mail'?'mail':null;
 if(entry){usage[entry]=Math.min(10000,(Number(usage[entry])||0)+1);save(USAGE,usage)}
},{capture:true,passive:true});
updateCount();show();
window.SEYVEO_HOME_FAVORITES=Object.freeze({openCustomize,getItems:()=>preference.items.slice()});
})();
