/* SEYVEO · Home favourites / review badge. Does not move Sayvi or the dock. */
(()=>{'use strict';
const home=document.getElementById('homePage'),stage=document.getElementById('stage');
if(!home||!stage||document.getElementById('svHomeFavorites'))return;
const root=document.documentElement;
const STORAGE='seyveo.home.favorites.v1',USAGE='seyveo.home.favorite-usage.v1';
const paths={
 music:'M9 18V5l11-2v12M9 8l11-2 M9 18a3.5 3.5 0 1 1-3.5-3.5A3.5 3.5 0 0 1 9 18Zm11-3a3.5 3.5 0 1 1-3.5-3.5A3.5 3.5 0 0 1 20 15Z',
 documents:'M7 3.5h8l4.5 4.5v12.5H7z M15 3.5V8h4.5 M10 12h7 M10 16h7',
 notebook:'M6 4h13v16H6z M9 4v16 M12 9h4 M12 13h4 M12 17h3',
 wallet:'M4 7h16v13H4z M4 10h16 M15 15h3 M7 7V4h12',
 calendar:'M5 5h14v15H5z M5 9h14 M9 3v4 M15 3v4 M9 13h2 M14 13h2 M9 17h2',
 health:'M3 12h4l3-6 4 12 3-6h4',
 browser:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M3 12h18 M12 3c5 5 5 13 0 18 M12 3c-5 5-5 13 0 18',
 home:'M4 11l8-7 8 7 M6 10v10h12V10 M10 20v-6h4v6',
 mail:'M3.5 6h17v12h-17z M3.5 7l8.5 7 8.5-7',
 tasks:'M8 7h12 M8 12h12 M8 17h12 M3.5 7l1 1 2-2 M3.5 12l1 1 2-2 M3.5 17l1 1 2-2'
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
const rail=document.createElement('nav');rail.id='svHomeFavorites';rail.className='sv-home-favorites';rail.setAttribute('aria-label','Любимые приложения и карточки Сэйви');rail.hidden=true;
const card=document.createElement('button');card.type='button';card.className='sv-home-favorite sv-home-review-entry';
card.setAttribute('aria-label','Карточки Сэйви');card.setAttribute('title','Карточки для разбора');
const symbol=document.createElement('span');symbol.className='sv-home-favorite-icon';
symbol.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3" width="14" height="15" rx="2"/><path d="M4 7H3v14h13v-2M9 7h8M9 11h6M9 15h4"/></svg>';
const badge=document.createElement('span');badge.className='sv-home-review-badge';badge.hidden=true;badge.setAttribute('aria-hidden','true');
const caption=document.createElement('span');caption.className='sv-home-favorite-label';caption.textContent='Карточки';
symbol.append(badge);card.append(symbol,caption);rail.append(card);
const list=document.createElement('div');list.className='sv-home-favorite-items';rail.append(list);
stage.append(rail);
card.addEventListener('click',()=>{
 if(cardCount>0)window.dispatchEvent(new Event('seyveo:open-card-review'));
 else location.hash='#tasks';
});
function icon(id){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+paths[id]+'"/></svg>'}
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
 done.addEventListener('click',()=>{if(selection.length===LIMIT){preference={items:selection,custom:true};save(STORAGE,preference);renderItems();close()}else{help.textContent='Выбери ровно три приложения.'}});
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
 if(!w.height||!r.height||r.top>=w.bottom+12)return;
 const dock=document.getElementById('navHome')?.getBoundingClientRect();
 const maximum=(dock?.top||window.innerHeight-64)-r.height-18;
 const wanted=w.bottom+14;
 // Move below the weather; when a tiny viewport cannot fit both,
 // use the last safe position above the dock instead of covering its buttons.
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
 badge.hidden=cardCount<1;
 caption.textContent=cardCount?'Карточки':'Дела';
 badge.textContent=cardCount>99?'99+':String(cardCount);
 card.setAttribute('aria-label',cardCount?('Открыть карточки Сэйви: '+cardCount):'Открыть Мои дела');
 card.title=cardCount?('Карточек для разбора: '+cardCount):'Мои дела';
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
