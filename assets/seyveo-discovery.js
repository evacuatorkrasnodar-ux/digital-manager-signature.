/* SEYVEO Discovery · default local music personalization, with an off switch.
 * A qualified play is reported by the ONE existing audio player.
 * Artist interests and explicit likes stay on-device; no files, full listening logs or browser history are sent.
 * When personalization is on, a bounded daily catalog check can create verified cards.
 * No push/background promises and no playback of unavailable catalog music.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const panel=$('sayviDiscoveryPanel');
const consent=$('sayviDiscoveryToggle'),checkButton=$('sayviDiscoveryCheck'),
 clearButton=$('sayviDiscoveryForget'),info=$('sayviDiscoveryStatus'),
 releasesList=$('svMusicDiscoveryReleases'),empty=$('svMusicDiscoveryEmpty'),emptyTitle=$('svMusicDiscoveryEmptyTitle');
if(!panel||!consent||!checkButton||!clearButton||!info)return;
const STORE='seyveo-discovery-music-v1';
const CHOICE='seyveo-discovery-choice-v1';
const GENRES_KEY='seyveo.music.preferences.v1';
const GENRE_TAGS=Object.freeze({rock:'rock',pop:'pop',electronic:'electronic',jazz:'jazz',classical:'classical',hiphop:'hip hop',indie:'indie',russianrock:'russian rock',russianpop:'russian pop',chanson:'russian chanson'});
function tasteTags(){
 if(!state.enabled)return [];
 try{const values=JSON.parse(localStorage.getItem(GENRES_KEY)||'null')?.genres;return Array.isArray(values)?[...new Set(values.filter(x=>Object.hasOwn(GENRE_TAGS,x)).map(x=>GENRE_TAGS[x]))].sort().slice(0,10):[]}catch{return []}
}
const offer=$('svDiscoveryOffer'),offerYes=$('svDiscoveryOfferYes'),offerNo=$('svDiscoveryOfferNo'),settings=$('svDiscoverySettings'),settingsButton=$('svDiscoverySettingsButton');
let answered=false,settingsOpen=false;
try{answered=localStorage.getItem(CHOICE)==='1'||localStorage.getItem(STORE)!==null}catch{}
function rememberChoice(){answered=true;try{localStorage.setItem(CHOICE,'1')}catch{}}
function syncChoice(){
 if(offer)offer.hidden=true;
 if(settings)settings.hidden=!settingsOpen;
 if(settingsButton)settingsButton.setAttribute('aria-expanded',String(settingsOpen));
}
const DAY=24*3600*1000,LOOKBACK=21*DAY,MAX_ARTISTS=30;
const normalize=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('ru-RU')
 .replace(/\s+/g,' ').trim();
const clean=s=>typeof s==='string'?s.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,100):'';
function fresh(enabled=true){return {enabled,artists:[],releases:[],ignored:[],snoozed:{},checks:{},attempts:{}}}
function read(){
 let x;try{x=JSON.parse(localStorage.getItem(STORE)||'null')}catch{}
 if(!x||typeof x!=='object'){let declined=false;try{declined=localStorage.getItem(CHOICE)==='1'}catch{}return fresh(!declined)}
 return {
  enabled:x.enabled===true,
  artists:Array.isArray(x.artists)?x.artists.slice(-MAX_ARTISTS).filter(a=>
   a&&typeof a.name==='string'&&typeof a.key==='string'&&
   Number.isSafeInteger(a.plays)&&a.plays>=0&&a.plays<=100000):[],
  releases:Array.isArray(x.releases)?x.releases.slice(-20).filter(r=>
   r&&typeof r.id==='string'&&typeof r.artist==='string'&&
   typeof r.title==='string'&&typeof r.url==='string'&&typeof r.date==='string'):[],
  ignored:Array.isArray(x.ignored)?x.ignored.slice(-100).filter(x=>typeof x==='string'):[],
  snoozed:x.snoozed&&typeof x.snoozed==='object'&&!Array.isArray(x.snoozed)?x.snoozed:{},
  checks:x.checks&&typeof x.checks==='object'&&!Array.isArray(x.checks)?x.checks:{},
  attempts:x.attempts&&typeof x.attempts==='object'&&!Array.isArray(x.attempts)?x.attempts:{}
 };
}
let state=read(),checking=false,runId=0;
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{status('Недостаточно места для сохранения настроек на этом устройстве.')}}
function status(message=''){
 info.textContent=message||'';
 info.hidden=mode!=='for-you'||!message;
}
function signal(){
 renderReleases();
 // Metadata-only event. Never attach artist interests or music history.
 window.dispatchEvent(new Event('seyveo:discovery-updated'));
}
function update(){
 syncChoice();
 consent.setAttribute('aria-pressed',String(state.enabled));
 consent.setAttribute('aria-label',state.enabled?'Выключить музыкальные открытия':'Включить музыкальные открытия');
 checkButton.hidden=!state.enabled;
 clearButton.hidden=!state.enabled&&!state.artists.length&&!state.releases.length&&!likes.length;
 checkButton.disabled=checking;
 const qualified=qualifiedArtists().length;
 if(!state.enabled)status(state.artists.length?'Поиск новинок выключен. Сохранённые интересы можно очистить.':
  'Открытия можно включить в настройках.');
 else status(checking?'Сэйви проверяет новинки…':
  qualified?'':
  '');
 renderReleases();
}
function enable(value){
 rememberChoice();
 runId++;
 checking=false;
 state.enabled=value===true;
 persist();update();signal();
 if(state.enabled)maybeCheck();
 if(!state.enabled&&mode==='genres'){mode='for-you';syncFilters();syncPersonal()}
 if(feedVisible())void loadPublic();
}
function clear(){
 rememberChoice();
 runId++;
 checking=false;
 state=fresh(false);likes=[];saveLikes();if(mode==='genres'){mode='for-you';syncFilters();syncPersonal()}
 try{localStorage.removeItem(GENRES_KEY);for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key?.startsWith('seyveo-music-editorial-v3-')&&key!=='seyveo-music-editorial-v3-general')localStorage.removeItem(key)}}catch{}
 persist();update();signal();if(feedVisible())void loadPublic();
}
function listen(payload){
 if(!state.enabled)return false;
 const name=clean(payload?.artist),title=clean(payload?.title);
 const key=normalize(name);
 if(!name||!key||!title||key==='моя музыка'||key==='unknown artist')return false;
 const at=state.artists.findIndex(a=>a.key===key);
 const prior=at<0?{name,key,plays:0,last:0}:state.artists[at];
 const next={name,key,plays:Math.min(100000,prior.plays+1),last:Date.now()};
 if(at>=0)state.artists.splice(at,1);
 state.artists.push(next);
 state.artists=state.artists.slice(-MAX_ARTISTS);
 persist();update();
 if(next.plays===3){maybeCheck();if(feedVisible()&&mode==='for-you'&&!previewBox.open&&!publicController)void loadPublic()}
 return true;
}
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s);
const safeUrl=s=>{
 try{
  const u=new URL(s);
  return u.protocol==='https:'&&
   (u.hostname==='music.apple.com'||u.hostname==='itunes.apple.com')?u.href:'';
 }catch{return ''}
};
function safeArtwork(s){
 try{const u=new URL(s);return u.protocol==='https:'&&u.hostname.endsWith('.mzstatic.com')?u.href:''}catch{return ''}
}
function personalItems(){
 return state.enabled?state.releases.filter(r=>!state.ignored.includes(r.id)&&validDate(r.date)&&safeUrl(r.url)&&Date.now()>=Number(state.snoozed[r.id]||0)).slice(0,20).map(r=>({...r,type:'Album'})):[];
}
function releaseKey(r){
 return normalize(r.artist)+'|'+normalize(r.title).replace(/(?:\s*[-–—]\s*|\s+)(?:ep|single)$/i,'').trim();
}
function mergePersonal(items){
 const merged=new Map(items.map(r=>[releaseKey(r),r]));
 for(const r of personalItems()){
  const key=releaseKey(r),prior=merged.get(key);
  merged.set(key,prior?{...prior,url:r.url,artwork:r.artwork}:r);
 }
 return [...merged.values()];
}
function renderReleases(){
 if(!releasesList||!empty||!emptyTitle)return;
 syncPersonal();
 const signature=JSON.stringify(personalItems().map(r=>[r.id,r.date,r.artwork,r.url]));
 if(mode==='for-you'&&lastFeedMode==='for-you'&&!panel.hidden&&!previewBox.open&&signature!==lastPersonalSignature){
  showPublic(lastItems,lastStale);
 }
}
function chooseReleases(data,artist,now=Date.now()){
 if(!data||!Array.isArray(data.results))return [];
 const matching=data.results.filter(item=>
  item&&item.wrapperType==='collection'&&
  item.collectionType==='Album'&&
  normalize(item.artistName)===normalize(artist)&&
  Number.isSafeInteger(item.collectionId)&&
  typeof item.collectionName==='string'&&clean(item.collectionName)&&
  safeUrl(item.collectionViewUrl)&&
  validDate(String(item.releaseDate||'').slice(0,10))
 );
 const artistIds=new Set(matching.map(r=>r.artistId).filter(Number.isSafeInteger));
 // Identical stage names may represent different artists. Do not guess.
 if(artistIds.size!==1)return [];
 return matching.map(r=>{
  const date=String(r.releaseDate).slice(0,10),at=Date.parse(date+'T00:00:00Z');
  return {
   id:'itunes:'+r.collectionId,
   artist:clean(r.artistName),title:clean(r.collectionName),
   date,url:safeUrl(r.collectionViewUrl),artwork:safeArtwork(r.artworkUrl100),at
  };
 }).filter(r=>r.at<=now&&r.at>=now-LOOKBACK)
 .sort((a,b)=>b.at-a.at);
}
// Use the protected same-origin server rather than a browser cross-origin request.
const catalogAvailable=()=>['localhost','127.0.0.1'].includes(location.hostname)||location.hostname.endsWith('.ts.net');
async function lookup(artist,signal){
 const endpoint=new URL('/api/seyveo-music-discovery',location.origin);
 endpoint.searchParams.set('artist',artist);
 const response=await fetch(endpoint.href,{method:'GET',credentials:'same-origin',
  redirect:'error',signal,headers:{accept:'application/json'}});
 if(!response.ok)throw Error('Catalog '+response.status);
 return chooseReleases(await response.json(),artist);
}
async function check({force=false}={}){
 if(!state.enabled||checking||document.hidden)return false;
 if(!catalogAvailable()){if(force)status('Для проверки новинок откройте SEYVEO через локальный сервер.');return false}
 const now=Date.now();
 // Only two qualified artists per check; no full browsing history leaves device.
 const eligible=qualifiedArtists().filter(a=>a.last>now-120*DAY)
  .sort((a,b)=>b.plays-a.plays)
  .filter(a=>(force||now-Number(state.checks[a.key]||0)>=DAY)&&
   now-Number(state.attempts[a.key]||0)>=3600*1000)
  .slice(0,2);
 if(!eligible.length){if(force)status(qualifiedArtists().length?
  'Проверка уже выполнялась недавно. Попробуйте позже.':
  '');return false}
 checking=true;const current=++runId;update();
 let success=0,found=0;
 for(const artist of eligible){
  if(!state.enabled||current!==runId)break;
  state.attempts[artist.key]=Date.now();persist();
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8500);
  try{
   // Send only the catalog artist query while personalization is enabled. No song titles or files sent.
   const releases=await lookup(artist.name,controller.signal);
   if(current!==runId||!state.enabled)break;
   state.checks[artist.key]=Date.now();
   success++;
   for(const release of releases){
    if(state.ignored.includes(release.id)||state.releases.some(r=>r.id===release.id))continue;
    state.releases.unshift({
     id:release.id,artist:release.artist,title:release.title,
     date:release.date,url:release.url,artwork:release.artwork
    });
    found++;
   }
   state.releases=state.releases.slice(0,20);
   persist();signal();
  }catch{
   // No false "new album" messages on CORS/offline/rate-limited catalogs.
   if(current===runId)state.checks[artist.key]=Date.now()-DAY+2*3600*1000;
  }finally{clearTimeout(timeout)}
 }
 if(current!==runId){checking=false;update();return false;}
 checking=false;persist();update();
 status(success?
  (found?'Найдено подтверждённых релизов: '+found+'.':
   'Каталог проверен. Подтверждённых новых альбомов пока нет.'):
  'Проверка каталога сейчас недоступна. Сэйви ничего не придумывает.');
 return true;
}
function maybeCheck(){if(state.enabled&&!checking&&
 qualifiedArtists().length)void check()}
function asCard(release){
 const engine=window.SEYVEO_CARD_ENGINE;
 const event=engine?.buildCard?.({
  id:'discovery-'+release.id,type:'music.release_verified',
  title:release.artist+' · '+release.title,
  fact:'В музыкальном каталоге iTunes указан релиз от '+new Date(release.date+'T00:00:00Z')
    .toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})+'.',
  suggestion:'Возможно, тебе понравится этот релиз. Хочешь посмотреть новинки?',
  priority:'normal',source:'Каталог iTunes · дата релиза',demo:false
 });
 return event?Object.freeze({...event,releaseId:release.id,releaseUrl:release.url}):null;
}
function current(){
 if(!state.enabled)return null;
 const top=state.releases.find(r=>!state.ignored.includes(r.id)&&
  Date.now()>=Number(state.snoozed[r.id]||0)&&safeUrl(r.url)&&Date.parse(r.date+'T00:00:00Z')>=Date.now()-LOOKBACK);
 return top?asCard(top):null;
}
function postpone(id){
 if(typeof id!=='string'||!id)return;
 state.snoozed[id]=Date.now()+DAY;
 persist();signal();
}
function dismiss(id){
 if(typeof id!=='string'||!id)return;
 state.ignored.push(id);
 state.ignored=state.ignored.slice(-100);
 state.releases=state.releases.filter(r=>r.id!==id);
 persist();update();signal();
}
// Public editorial shelf. No playback, outbound buttons or fabricated news.
// MusicBrainz catalog dates are community-maintained, not independent press confirmation.
const publicList=$('svDiscoveryPublicList'),publicStatus=$('svDiscoveryPublicStatus'),publicTitle=$('svDiscoveryPublicTitle'),publicSource=$('svDiscoveryPublicSource');
const PUBLIC_KEY='seyveo-music-editorial-v3-',PUBLIC_TTL=6*3600000;
const upcomingList=$('svDiscoveryUpcomingList'),upcomingStatus=$('svDiscoveryUpcomingStatus'),newsList=$('svDiscoveryNewsList');
let publicRun=0,publicController=null,lastPublicRequest=0;
const uuid=s=>typeof s==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(s);
const dayISO=ms=>new Date(ms).toISOString().slice(0,10);
const today=()=>dayISO(Date.now());
const dateLabel=date=>new Date(date+'T00:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
function publicItems(raw){
 if(!Array.isArray(raw))return [];
 const seen=new Set();
 return raw.flatMap(r=>{
  if(!r||!uuid(r.id)||!validDate(r.date)||!Number.isFinite(Date.parse(r.date+'T00:00:00Z'))||!clean(r.title)||!clean(r.artist)||seen.has(r.id))return [];
  seen.add(r.id);
  return [{id:r.id,title:clean(r.title),artist:clean(r.artist),date:r.date,type:r.type==='Single'?'Single':r.type==='EP'?'EP':'Album',tasteMatch:r.tasteMatch===true}];
 }).slice(0,100);
}
function catalogItems(data,country){
 const entries=country==='ru'?data?.releases:data?.['release-groups'];
 if(!Array.isArray(entries))return [];
 return publicItems(entries.map(r=>{
  const g=country==='ru'?r['release-group']:r;
  const artist=(g?.['artist-credit']||r['artist-credit']||[]).map(x=>(x.name||x.artist?.name||'')+(x.joinphrase||'')).join('');
  return {id:g?.id,title:g?.title||r.title,artist,date:country==='ru'?r.date:g?.['first-release-date'],type:g?.['primary-type']};
 }));
}

/* Unified New feed: one catalogue, local favourites and lazy official previews. */
const LIKES='seyveo.music.discovery.likes.v1';
function readLikes(){
 try{
  const raw=JSON.parse(localStorage.getItem(LIKES)||'[]');if(!Array.isArray(raw))return [];
  return raw.slice(0,100).flatMap(r=>{
   const saved=r?.saved&&typeof r.saved==='object'?{at:Number(r.saved.at)||0,waiting:r.saved.waiting===true,confirmed:r.saved.confirmed===true,heard:Number(r.saved.heard)||0,checked:Number(r.saved.checked)||0,snooze:Number(r.saved.snooze)||0}:{at:0,waiting:validDate(r?.date)&&r.date>today(),confirmed:false,heard:0,checked:0,snooze:0};
   if(r&&/^itunes:\d+$/.test(r.id)&&safeUrl(r.url)&&validDate(r.date)&&clean(r.title)&&clean(r.artist))return [{id:r.id,title:clean(r.title),artist:clean(r.artist),date:r.date,type:'Album',url:safeUrl(r.url),artwork:safeArtwork(r.artwork),saved}];
   return publicItems([r]).map(x=>({...x,saved}));
  });
 }catch{return []}
}
let likes=readLikes();
let mode='for-you', lastItems=[], lastStale=false, lastFeedMode='', lastPersonalSignature='', previewRun=0, previewController=null;
const feedHead=panel.querySelector('.sv-discovery-feed-head');
if(feedHead)feedHead.classList.add('sv-new-personal-head');
const favButton=$('svDiscoveryEditTaste');
const publicHead=$('svDiscoveryPublic')?.querySelector('.sv-discovery-feed-head');
if(favButton&&publicHead)publicHead.append(favButton);
if(settings){settings.append(info,checkButton);checkButton.textContent='Обновить рекомендации';}
const emptyCaption=empty?.querySelector('.sv-discovery-empty-caption');if(emptyCaption)emptyCaption.hidden=true;
function button(label,cls,svg){
 const b=document.createElement('button');b.type='button';b.className=cls;b.setAttribute('aria-label',label);b.title=label;
 if(svg)b.innerHTML=svg;else b.textContent=label;return b;
}
const heartIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 5.5a5 5 0 0 0-7 0L12 7l-1.5-1.5a5 5 0 0 0-7 7L12 21l8.5-8.5a5 5 0 0 0 0-7Z"/></svg>';
const playIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none"/></svg>';
const savedRelease=r=>likes.find(x=>x.id===r.id||releaseKey(x)===releaseKey(r));
const liked=r=>!!savedRelease(r);
function saveLikes(){try{localStorage.setItem(LIKES,JSON.stringify(likes))}catch{}}
function like(r,b){
 if(liked(r))likes=likes.filter(x=>x.id!==r.id&&releaseKey(x)!==releaseKey(r));else likes=[{...r,saved:{at:Date.now(),waiting:r.date>today(),confirmed:r.date<=today(),heard:0,checked:0,snooze:0}},...likes].slice(0,100);
 saveLikes();signal();for(const other of panel.querySelectorAll('[data-discovery-like]'))if(other.dataset.discoveryLike===r.id){other.setAttribute('aria-pressed',String(liked(r)));other.title=liked(r)?'Убрать из понравившегося':'Нравится';other.setAttribute('aria-label',other.title)}
 if(state.enabled&&liked(r))maybeCheck();
 clearButton.hidden=!state.enabled&&!state.artists.length&&!state.releases.length&&!likes.length;
 if(mode==='liked'||feedVisible())showPublic(lastItems,lastStale);
}
function markHeard(r){
 const item=savedRelease(r);if(!item||item.saved?.heard)return;
 item.saved={...item.saved,heard:Date.now()};saveLikes();signal();
 if(feedVisible()&&!previewBox.open)showPublic(lastItems,lastStale);
}
function observeSavedListen(payload){
 const artist=normalize(payload?.artist),title=normalize(payload?.title),album=normalize(payload?.album);
 if(!artist||!title)return;
 for(const r of likes){if(normalize(r.artist)!==artist||r.saved?.heard||r.date>today())continue;
  const name=normalize(r.title).replace(/(?:\s*[-–—]\s*|\s+)(?:ep|single)$/i,'').trim();
  if(name&&(name===title||name===album))markHeard(r);
 }
}
function pendingReminders(){
 if(!state.enabled)return [];
 const now=Date.now();
 return likes.filter(r=>r.saved?.confirmed&&!r.saved.heard&&r.date<=today()&&now>=Number(r.saved.snooze||0)&&(r.saved.waiting||r.saved.at>0&&now-r.saved.at>=3*DAY)).slice(0,3);
}
let savedCheckRunning=false;
async function checkSavedReleases(){
 if(savedCheckRunning||document.hidden||!state.enabled)return;
 const now=Date.now();
 const due=likes.filter(r=>uuid(r.id)&&r.saved?.waiting&&!r.saved.confirmed&&r.date<=today()&&now-Number(r.saved.checked||0)>=6*3600000).slice(0,2);
 if(!due.length)return;savedCheckRunning=true;
 try{
  for(const entry of due){
   if(document.hidden||!state.enabled)break;
   const item=likes.find(r=>r.id===entry.id);if(!item)continue;
   item.saved.checked=Date.now();saveLikes();
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
   try{
    const wait=Math.max(0,1200-(Date.now()-lastPublicRequest));if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
    if(!state.enabled||document.hidden)break;lastPublicRequest=Date.now();
    const url=new URL('https://musicbrainz.org/ws/2/release-group/'+item.id);url.searchParams.set('inc','releases');url.searchParams.set('fmt','json');
    const res=await fetch(url.href,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',headers:{accept:'application/json'}});
    if(!res.ok)continue;const data=await res.json();
    const live=likes.find(r=>r.id===entry.id);if(!live||!state.enabled||data.id!==entry.id)continue;
    const dates=(Array.isArray(data.releases)?data.releases:[]).filter(r=>r.status==='Official'&&validDate(r.date)).map(r=>r.date).sort();
    if(dates.length){live.date=dates[0];live.saved.confirmed=dates[0]<=today();saveLikes();signal();if(feedVisible()&&!previewBox.open)showPublic(lastItems,lastStale)}
   }catch{}finally{clearTimeout(timeout)}
  }
 }finally{savedCheckRunning=false}
}
function reminderCard(r){
 const card=document.createElement('article');card.className='sv-new-story sv-new-reminder';
 const label=document.createElement('small');label.textContent='Сэйви · '+(r.saved.waiting?'Релиз по данным каталога':'Из понравившегося');
 const title=document.createElement('strong');title.textContent=r.artist+' — '+r.title;
 const body=document.createElement('p');body.textContent=r.saved.waiting?'Ты ждал этот релиз. Хочешь послушать?':'Ты сохранил этот релиз, но я ещё не отмечала прослушивание.';
 const actions=document.createElement('div');actions.className='sv-new-reminder-actions';
 const play=button('Послушать','sv-new-reminder-play');play.addEventListener('click',()=>void preview(r,card));
 const later=button('Позже','sv-new-reminder-later');later.addEventListener('click',()=>{r.saved.snooze=Date.now()+3*DAY;saveLikes();signal();showPublic(lastItems,lastStale)});
 actions.append(play,later);card.append(label,title,body,actions);return card;
}
function qualifiedArtists(){
 const list=state.artists.filter(a=>a.plays>=3).map(a=>({...a}));
 if(state.enabled)for(const r of likes){
  const key=normalize(r.artist);if(!key||list.some(a=>a.key===key))continue;
  list.push({name:r.artist,key,plays:0,last:Date.now(),liked:true});
 }
 return list;
}

function selectedTags(){return tasteTags()}
function syncPersonal(){if(feedHead)feedHead.hidden=true;releasesList.hidden=true;empty.hidden=true;info.hidden=!info.textContent}
function syncFilters(){if(!favButton)return;const saved=mode==='liked';favButton.setAttribute('aria-pressed',String(saved));favButton.removeAttribute('aria-haspopup');favButton.title=saved?'Вернуться к новинкам':'Понравилось';favButton.setAttribute('aria-label',favButton.title);favButton.innerHTML=saved?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>':heartIcon}
function feedVisible(){return location.hash==='#sayvi-music'&&$('sayviMusicPage')?.dataset.musicView==='new'&&!panel.hidden&&!document.hidden}
function favoriteArtists(){if(!state.enabled)return [];return qualifiedArtists().filter(a=>a.last>Date.now()-120*DAY).sort((a,b)=>Number(!!b.liked)-Number(!!a.liked)||b.plays-a.plays||b.last-a.last).slice(0,3).map(a=>a.name)}
function setMode(next){mode=next==='liked'?'liked':'for-you';syncFilters();closePreview();if(mode==='liked'){++publicRun;publicController?.abort();publicController=null;showPublic(lastItems,lastStale);return}void loadPublic()}
const previewBox=document.createElement('dialog');previewBox.className='sv-new-preview';previewBox.setAttribute('aria-label','Предпрослушивание');document.body.append(previewBox);
let previewAnchor=null;
function closePreview(){previewRun++;previewController?.abort();previewController=null;previewAnchor=null;if(previewBox.open)previewBox.close();previewBox.replaceChildren()}
previewBox.addEventListener('cancel',e=>{e.preventDefault();closePreview()});
previewBox.addEventListener('click',e=>{if(e.target!==previewBox)return;const rect=previewBox.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closePreview()});
previewBox.addEventListener('close',()=>{if(!previewBox.open&&previewAnchor)closePreview()});
function appleAlbumURL(value){
 try{const u=new URL(value);if(!['music.apple.com','itunes.apple.com'].includes(u.hostname)||u.protocol!=='https:'||!/^\/[a-z]{2}\/album\/(?:[^/]+\/)?\d+\/?$/i.test(u.pathname))return '';return 'https://music.apple.com'+u.pathname}catch{return ''}
}
async function preview(r,anchor){
 closePreview();const run=previewRun;previewAnchor=anchor;
 const top=document.createElement('div');top.className='sv-new-preview-head';
 const title=document.createElement('strong');title.textContent=r.artist+' · '+r.title;
 const close=button('Закрыть','sv-new-close');close.textContent='×';close.addEventListener('click',closePreview);top.append(title,close);
 const message=document.createElement('p');message.textContent='Ищу этот релиз в Apple Music…';previewBox.append(top,message);previewBox.showModal();
 if(savedRelease(r)&&!savedRelease(r).saved?.heard){const heard=button('Уже послушал','sv-new-heard');heard.addEventListener('click',()=>{markHeard(r);heard.textContent='Прослушано';heard.disabled=true});previewBox.append(heard)}
 const controller=new AbortController();previewController=controller;const timer=setTimeout(()=>controller.abort(),9000);
 try{
  let album=appleAlbumURL(r.url);
  if(!album){
   const q=new URL('https://itunes.apple.com/search');q.searchParams.set('term',r.artist+' '+r.title);q.searchParams.set('entity','album');q.searchParams.set('country','US');q.searchParams.set('limit','15');
   const res=await fetch(q.href,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
   if(!res.ok)throw Error('catalog');
   const data=await res.json();
   const matches=(data.results||[]).filter(x=>normalize(x.artistName)===normalize(r.artist)&&normalize(x.collectionName)===normalize(r.title)&&appleAlbumURL(x.collectionViewUrl));
   const unique=[...new Set(matches.map(x=>appleAlbumURL(x.collectionViewUrl)))];if(unique.length===1)album=unique[0];
  }
  if(run!==previewRun)return;
  if(!album){message.textContent='Для этого релиза пока не найден точный предпросмотр.';return}
  // Apple hosts and controls its promotional player; never store the audio.
  const link=document.createElement('a');link.href=album;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Открыть в Apple Music';
  const frame=document.createElement('iframe');frame.title='Предпрослушивание Apple Music: '+r.title;
  frame.src=album.replace('https://music.apple.com','https://embed.music.apple.com');frame.allow='autoplay; encrypted-media';frame.referrerPolicy='no-referrer';frame.loading='lazy';
  message.textContent='Предпрослушивание предоставлено Apple Music. Доступность зависит от каталога.';
  for(const a of document.querySelectorAll('audio'))if(!a.paused)a.pause();
  previewBox.append(frame,link);const download=button('Открыть в iTunes Store','sv-new-store');download.addEventListener('click',()=>{const store=new URL(album);store.hostname='itunes.apple.com';window.open(store.href,'_blank','noopener,noreferrer')});previewBox.append(download);
 }catch{if(run===previewRun)message.textContent='Предпрослушивание сейчас недоступно.'}
 finally{clearTimeout(timer);if(run===previewRun)previewController=null}
}
document.addEventListener('play',e=>{if(e.target instanceof HTMLMediaElement&&previewBox.open)closePreview()},true);
window.addEventListener('hashchange',()=>{if(location.hash!=='#sayvi-music'){closePreview()}});
const style=document.createElement('style');style.textContent=`
html:root body #sayviMusicPage #sayviDiscoveryPanel .sv-new-filterbar{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;overscroll-behavior-x:contain;margin:0 -4px 10px;padding:4px 4px 10px;align-items:center}
#sayviDiscoveryPanel .sv-new-filterbar::-webkit-scrollbar{display:none}
html:root body #sayviMusicPage #sayviDiscoveryPanel .sv-new-chip{flex:none;min-height:36px;padding:0 15px!important;border:1px solid rgba(127,140,155,.17)!important;border-radius:999px!important;box-shadow:none!important;background:rgba(127,140,155,.07)!important;color:var(--text);font:500 13px/1.2 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;white-space:nowrap;transform:none!important}
html:root body #sayviMusicPage #sayviDiscoveryPanel .sv-new-chip[aria-pressed=true]{background:var(--text)!important;color:var(--card,#fff)!important;border-color:transparent!important}
html:root body #sayviMusicPage #sayviDiscoveryPanel .sv-new-tile{min-width:0;display:grid;align-content:start;gap:5px}
html:root body #sayviMusicPage #sayviDiscoveryPanel .sv-new-tile .sv-discovery-release-art{position:relative;display:grid;place-items:center;aspect-ratio:1;border-radius:15px!important;overflow:hidden;background:linear-gradient(145deg,rgba(137,157,179,.16),rgba(137,157,179,.045))!important}
#sayviDiscoveryPanel .sv-new-tile .sv-discovery-release-art img{width:100%;height:100%;object-fit:cover}
#sayviDiscoveryPanel .sv-new-tile .sv-discovery-release-art>svg{width:32px;height:32px;color:var(--secondary)}
#sayviDiscoveryPanel .sv-new-meta{font-size:11px;color:var(--secondary);line-height:1.35}
#sayviDiscoveryPanel .sv-new-actions{display:flex;justify-content:space-between;align-items:center;gap:4px}
html:root body #sayviMusicPage #sayviDiscoveryPanel .sv-new-icon{width:44px!important;height:44px!important;min-height:44px!important;display:grid;place-items:center;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;transform:none!important;color:var(--secondary)}
#sayviDiscoveryPanel .sv-new-icon svg{width:22px;height:22px}
#sayviDiscoveryPanel .sv-new-icon[aria-pressed=true]{color:#ce4167!important}
#sayviDiscoveryPanel .sv-new-icon[aria-pressed=true] svg{fill:currentColor}
html:root body #sayviMusicPage #sayviDiscoveryPanel .sv-new-story{grid-column:1/-1;display:grid;grid-template-columns:1fr 44px;gap:5px 12px;align-items:center;padding:16px 0;border-top:1px solid rgba(127,140,155,.15);border-bottom:1px solid rgba(127,140,155,.15);margin:7px 0}
#sayviDiscoveryPanel .sv-new-story small{grid-column:1;color:var(--secondary);font-size:11px}
#sayviDiscoveryPanel .sv-new-story strong{grid-column:1;font-size:16px;line-height:1.25;white-space:normal!important}
#sayviDiscoveryPanel .sv-new-story p{grid-column:1;margin:0;color:var(--secondary);font-size:13px;line-height:1.45}
#sayviDiscoveryPanel .sv-new-story button{grid-column:2;grid-row:1/4}
#sayviDiscoveryPanel .sv-new-preview{grid-column:1/-1;padding:13px;border:1px solid rgba(127,140,155,.16);border-radius:16px;margin:6px 0}
#sayviDiscoveryPanel .sv-new-preview[hidden]{display:none!important}
#sayviDiscoveryPanel .sv-new-preview-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
#sayviDiscoveryPanel .sv-new-preview-head strong{white-space:normal!important}
#sayviDiscoveryPanel .sv-new-close{border:0;background:transparent;color:var(--text);width:44px;height:44px;font-size:24px}
#sayviDiscoveryPanel .sv-new-preview iframe{width:100%;height:380px;border:0;border-radius:12px}
#sayviDiscoveryPanel .sv-new-preview p,#sayviDiscoveryPanel .sv-new-preview a{font-size:12px;line-height:1.45}
#sayviDiscoveryPanel .sv-new-preview a{color:inherit;text-decoration:underline}
#sayviDiscoveryPanel #svDiscoveryUpcoming[hidden],#sayviDiscoveryPanel #svDiscoveryNews[hidden],#sayviDiscoveryPanel .sv-discovery-feed-head[hidden],#sayviDiscoveryPanel #svMusicDiscoveryEmpty[hidden]{display:none!important}

/* Compact editorial rhythm, only the New screen. */
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel:not([hidden]){gap:10px!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-filterbar{margin:0 -4px 0!important;padding:2px 4px 5px!important;gap:7px!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-chip{min-height:34px!important;padding:0 12px!important;font-size:12px!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-personal-head{min-height:44px!important;margin:0!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-personal-head h3{font-size:15px!important;font-weight:550!important;color:var(--secondary)}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel #svDiscoveryEditTaste{display:grid!important;place-items:center;width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;box-shadow:none!important;color:var(--secondary)}
#sayviDiscoveryPanel #svDiscoveryEditTaste svg{width:21px;height:21px}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel #svMusicDiscoveryEmpty:not([hidden]){padding:0!important;align-items:flex-start!important;text-align:left!important;gap:3px!important;margin:0!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel #svMusicDiscoveryEmpty>svg,html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-discovery-empty-caption[hidden]{display:none!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel #svMusicDiscoveryEmptyTitle{font-size:15px!important;font-weight:550!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel #sayviDiscoveryStatus{max-width:none!important;margin:0!important;text-align:left!important;font-size:12px!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-discovery-public{margin-top:5px!important;gap:6px!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-discovery-releases:not([hidden]){gap:12px 12px!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-tile{gap:3px!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-tile .sv-discovery-release-art{border-radius:13px!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-no-art{align-content:center;justify-items:center;gap:8px;background:radial-gradient(ellipse at 30% 15%,rgba(155,179,210,.17),transparent 65%),linear-gradient(150deg,rgba(138,155,172,.09),rgba(138,155,172,.18))!important}
#sayviDiscoveryPanel .sv-new-art-caption{font-size:10px;line-height:1.2;color:var(--secondary)}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-story{padding:10px 0!important;margin:1px 0!important;gap:4px 8px!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-story strong{font-weight:550!important;font-size:15px!important}
#sayviDiscoveryPanel .sv-new-actions{margin-top:-2px;gap:0}


/* Three compact square covers per row; the original feed and dock stay intact. */
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-discovery-releases:not([hidden]){grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:15px 9px!important;align-items:start}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-tile{display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-content:start!important;gap:5px!important;min-height:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
#sayviDiscoveryPanel .sv-new-cover{position:relative;width:100%;aspect-ratio:1;min-width:0}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-tile .sv-discovery-release-art{width:100%!important;height:100%!important;aspect-ratio:1!important;border-radius:12px!important;position:relative}
#sayviDiscoveryPanel .sv-new-cover .sv-new-art-caption{display:none!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-cover .sv-new-no-art>svg{width:26px!important;height:26px!important;opacity:.55}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-cover :is(.sv-new-cover-play,.sv-new-cover-heart){position:absolute;display:grid;place-items:center;width:44px!important;height:44px!important;min-height:44px!important;background:transparent!important;color:#fff!important;z-index:1;padding:0!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-cover .sv-new-cover-play{right:0;bottom:0}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-cover .sv-new-cover-heart{right:0;top:0}
#sayviDiscoveryPanel .sv-new-cover :is(.sv-new-cover-play,.sv-new-cover-heart):before{content:'';position:absolute;inset:7px;border-radius:50%;background:rgba(27,34,43,.62);border:1px solid rgba(255,255,255,.25);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
#sayviDiscoveryPanel .sv-new-cover :is(.sv-new-cover-play,.sv-new-cover-heart) svg{position:relative;width:17px!important;height:17px!important;z-index:1}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-cover .sv-new-cover-heart[aria-pressed=true]{color:#ff7998!important}
#sayviDiscoveryPanel .sv-new-cover-heart[aria-pressed=true] svg{fill:currentColor}
#sayviDiscoveryPanel .sv-new-cover-soon{position:absolute;bottom:6px;left:6px;right:auto;font-size:10px;color:#fff;background:rgba(27,34,43,.65);border-radius:8px;padding:4px 7px}
#sayviDiscoveryPanel .sv-new-copy{display:grid;gap:3px;min-width:0}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-copy>strong{font-size:13px!important;font-weight:550!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-copy>small{font-size:11px!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-copy>time{font-size:10px!important;line-height:1.35;white-space:normal!important}
#sayviDiscoveryPanel .sv-new-story{margin:4px 0!important}
html:root body dialog.sv-new-preview{position:fixed!important;inset:auto 0 0!important;margin:0 auto!important;width:min(100%,520px)!important;max-width:100%!important;max-height:85vh!important;box-sizing:border-box;overflow-y:auto;padding:16px 16px calc(18px + env(safe-area-inset-bottom))!important;border:1px solid rgba(127,140,155,.25)!important;border-bottom:0!important;border-radius:24px 24px 0 0!important;background:var(--card,#fff)!important;color:var(--text,#141619)!important;box-shadow:0 -8px 40px rgba(0,0,0,.12)!important}
dialog.sv-new-preview:not([open]){display:none!important}
dialog.sv-new-preview::backdrop{background:rgba(19,24,32,.24)}
dialog.sv-new-preview .sv-new-preview-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
dialog.sv-new-preview .sv-new-preview-head strong{font-size:16px;line-height:1.35;min-width:0;overflow-wrap:anywhere}
dialog.sv-new-preview .sv-new-close{flex:0 0 44px;width:44px;height:44px;border:0;background:transparent!important;box-shadow:none!important;color:inherit;font-size:23px}
dialog.sv-new-preview p,dialog.sv-new-preview a{font-size:12px;line-height:1.45;color:var(--secondary,#555)}
dialog.sv-new-preview iframe{display:block;width:100%;height:min(380px,52vh);border:0;border-radius:13px;margin:10px 0}

/* All discovery controls in a single settings sheet, no filter strip. */
html:root body dialog.sv-new-filter-sheet{position:fixed!important;inset:auto 0 0!important;margin:0 auto!important;width:min(100%,520px)!important;max-width:100%!important;max-height:85vh!important;box-sizing:border-box;overflow-y:auto;padding:14px 18px calc(18px + env(safe-area-inset-bottom))!important;border:1px solid rgba(127,140,155,.22)!important;border-bottom:0!important;border-radius:24px 24px 0 0!important;background:var(--card,#fff)!important;color:var(--text,#141619)!important;box-shadow:none!important}
dialog.sv-new-filter-sheet:not([open]){display:none!important}
dialog.sv-new-filter-sheet::backdrop{background:rgba(19,24,32,.24)}
.sv-new-filter-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.sv-new-filter-head h2{font-size:19px!important;font-weight:600;margin:0}
.sv-new-filter-close{width:44px;height:44px;min-height:44px;border:0;background:transparent!important;box-shadow:none!important;color:inherit;font-size:23px}
.sv-new-filter-options{display:grid;gap:12px}
.sv-new-filter-group h3{margin:8px 0 4px;color:var(--secondary,#666);font-size:12px;font-weight:550}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-option,html:root body dialog.sv-new-filter-sheet .sv-new-filter-edit{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:44px;padding:0 6px!important;border:0!important;border-bottom:1px solid rgba(127,140,155,.13)!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;color:inherit;font-size:14px;text-align:left;transform:none!important}
.sv-new-filter-tick{visibility:hidden;color:#3879bb;font-size:17px}
.sv-new-filter-option[aria-pressed=true] .sv-new-filter-tick{visibility:visible}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-edit{margin-top:8px;color:#3879bb!important}

/* One discovery feed: preferences and consent live in settings, not above releases. */
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-personal-head,
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel #svMusicDiscoveryReleases,
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel #svMusicDiscoveryEmpty{display:none!important}
dialog.sv-new-filter-sheet #svDiscoveryOffer[hidden],dialog.sv-new-filter-sheet #sayviDiscoveryStatus[hidden],dialog.sv-new-filter-sheet #sayviDiscoveryCheck[hidden]{display:none!important}
dialog.sv-new-filter-sheet #svDiscoveryOffer{padding:10px 0 14px;border-bottom:1px solid rgba(127,140,155,.13)}
dialog.sv-new-filter-sheet #svDiscoveryOffer h2{font-size:16px!important;margin:0 0 6px}
dialog.sv-new-filter-sheet #svDiscoveryOffer p,dialog.sv-new-filter-sheet #sayviDiscoveryStatus{font-size:12px;line-height:1.45;color:var(--secondary,#666)}
dialog.sv-new-filter-sheet .sv-discovery-offer-actions{display:flex;gap:8px}
dialog.sv-new-filter-sheet .sv-discovery-offer-actions button{flex:1;min-height:44px;border-radius:12px;border:1px solid rgba(127,140,155,.18);box-shadow:none;background:transparent;color:inherit}
dialog.sv-new-filter-sheet #svDiscoveryOfferYes{background:#426b78;color:#fff}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-refresh{display:flex;align-items:center;width:100%;min-height:44px;padding:0 6px;border:0;border-bottom:1px solid rgba(127,140,155,.13);background:transparent!important;box-shadow:none!important;color:inherit;font-size:14px;text-align:left}

/* Refined overlay buttons: visual 25px, touch area remains 44px. */
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-cover :is(.sv-new-cover-play,.sv-new-cover-heart):before{inset:10px!important;background:rgba(22,29,39,.33)!important;border:1px solid rgba(255,255,255,.42)!important;box-shadow:none!important;-webkit-backdrop-filter:blur(6px)!important;backdrop-filter:blur(6px)!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-cover :is(.sv-new-cover-play,.sv-new-cover-heart) svg{width:15px!important;height:15px!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-cover:has(.sv-new-no-art) :is(.sv-new-cover-play,.sv-new-cover-heart){color:#53606e!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-cover:has(.sv-new-no-art) :is(.sv-new-cover-play,.sv-new-cover-heart):before{background:rgba(255,255,255,.54)!important;border-color:rgba(127,140,155,.18)!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel .sv-new-cover .sv-new-cover-heart[aria-pressed=true]{color:#ce4167!important}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel #svDiscoveryPublicSource{font-size:10px!important;opacity:.72;margin-top:8px!important;line-height:1.35!important}

/* Compact filter sheet; keep full 44px targets even on small iPhones. */
html:root body dialog.sv-new-filter-sheet{padding:10px 16px calc(10px + env(safe-area-inset-bottom))!important;max-height:88vh!important;max-height:88dvh!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-head{margin:0 0 5px!important;gap:8px;min-height:44px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-head h2{font-size:17px!important;font-weight:600;letter-spacing:-.025em}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-close{display:grid;place-items:center;min-height:44px;min-width:44px;padding:0!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-close svg{width:20px;height:20px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-options{display:grid;gap:10px!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-group{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:12px;row-gap:0}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-group h3{grid-column:1/-1;font-size:12px!important;font-weight:500;line-height:1.35;margin:0 0 1px!important;color:var(--secondary,#666)}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-option{min-height:44px!important;height:44px!important;padding:0 3px!important;font-size:13px!important;gap:4px;line-height:1.2}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-tick{display:grid;place-items:center;flex:0 0 19px;width:19px;height:19px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-tick svg{width:17px;height:17px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-option[aria-pressed=false] .sv-new-filter-tick{visibility:hidden}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-option[aria-pressed=true] .sv-new-filter-tick{visibility:visible;color:#3879bb}
html:root body dialog.sv-new-filter-sheet :is(.sv-new-filter-edit,.sv-new-filter-refresh){min-height:44px!important;font-size:13px!important;padding:0 3px!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-edit{margin-top:5px!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-refresh{border-bottom:0!important}

/* SEYVEO grouped sheet: translucent material, calm selection, no table rules. */
html:root body dialog.sv-new-filter-sheet{width:min(calc(100% - 12px),460px)!important;bottom:max(6px,env(safe-area-inset-bottom))!important;border-radius:26px!important;border:1px solid rgba(145,155,168,.23)!important;padding:7px 16px 12px!important;background:var(--card,#fff)!important;overscroll-behavior:contain}
@supports ((-webkit-backdrop-filter:blur(18px)) or (backdrop-filter:blur(18px))){html:root[data-theme="light"] body dialog.sv-new-filter-sheet{background:rgba(249,250,252,.91)!important;-webkit-backdrop-filter:blur(20px) saturate(1.15);backdrop-filter:blur(20px) saturate(1.15)}}
dialog.sv-new-filter-sheet::backdrop{background:rgba(19,24,32,.18)}
.sv-new-filter-grab{display:block;width:34px;height:4px;border-radius:4px;background:rgba(127,140,155,.32);margin:0 auto 3px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-head{margin-bottom:7px!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-close{position:relative;isolation:isolate;border-radius:50%!important;transform:none!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-close:before{content:'';position:absolute;inset:7px;border-radius:50%;background:rgba(127,140,155,.10);z-index:-1}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-options{gap:12px!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-group{column-gap:5px;row-gap:4px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-group h3{margin:0 0 2px 3px!important;font-size:12px!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-option{border:1px solid transparent!important;border-radius:12px!important;background:rgba(127,140,155,.075)!important;padding:0 9px!important;min-width:0;font-size:13px!important;font-weight:450}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-option[aria-pressed=true]{background:rgba(75,125,185,.10)!important;border-color:rgba(75,125,185,.20)!important;color:var(--text,#141619)!important;font-weight:550}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-group[data-section="rock"] .sv-new-filter-option{border-radius:22px!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-tick{flex-basis:16px;width:16px;height:16px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-tick svg{width:16px;height:16px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-actions{display:grid;margin-top:12px;border-radius:14px;background:rgba(127,140,155,.075);padding:0 9px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-actions :is(.sv-new-filter-edit,.sv-new-filter-refresh){display:flex;justify-content:flex-start;align-items:center;gap:9px;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;color:inherit!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-actions .sv-new-filter-refresh:not([hidden]){border-top:1px solid rgba(127,140,155,.12)!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-actions svg{width:19px;height:19px;flex:0 0 19px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-actions .sv-filter-chevron{margin-left:auto;width:15px;height:15px;flex-basis:15px;color:var(--secondary,#666)}
@media(max-width:350px){html:root body dialog.sv-new-filter-sheet{padding-inline:10px!important}html:root body dialog.sv-new-filter-sheet .sv-new-filter-option{padding-inline:6px!important;font-size:12px!important}}

/* Native-style single list. No tiled cards, no decorative capsules. */
html:root body dialog.sv-new-filter-sheet{width:min(calc(100% - 24px),400px)!important;bottom:max(10px,env(safe-area-inset-bottom))!important;border-radius:22px!important;padding:8px 18px 10px!important;max-height:88vh!important;max-height:88dvh!important;background:var(--card,#fff)!important}
@supports ((-webkit-backdrop-filter:blur(18px)) or (backdrop-filter:blur(18px))){html:root[data-theme="light"] body dialog.sv-new-filter-sheet{background:rgba(255,255,255,.96)!important;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-head{display:flex;align-items:center;gap:4px;margin:0 0 5px!important;position:sticky;top:0;z-index:1}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-head h2{flex:1;font-size:17px!important;font-weight:600;letter-spacing:-.02em}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-close:before{display:none!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-back{display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;border:0!important;background:transparent!important;box-shadow:none!important;color:inherit;padding:0!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-back[hidden]{display:none!important}
.sv-new-filter-back svg{width:20px;height:20px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-options{display:grid;gap:0!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-group{display:block}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-group h3{display:none!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-option{display:flex!important;align-items:center;justify-content:space-between;gap:8px;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;padding:0 2px!important;font-size:15px!important;font-weight:400!important;min-height:44px!important;height:44px!important;color:inherit!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-option[aria-pressed=true]{background:transparent!important;font-weight:500!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-genre-nav{border-top:1px solid rgba(127,140,155,.16)!important;border-bottom:1px solid rgba(127,140,155,.16)!important;margin:4px 0!important;justify-content:flex-start}
.sv-new-filter-genre-nav .sv-filter-current{margin-left:auto;color:var(--secondary,#666);font-size:12px}
.sv-new-filter-genre-nav svg{width:17px;height:17px;flex:none;color:var(--secondary,#666)}
html:root body dialog.sv-new-filter-sheet[data-page="main"] .sv-new-filter-group[data-section="genres"],
html:root body dialog.sv-new-filter-sheet[data-page="main"] .sv-new-filter-edit,
html:root body dialog.sv-new-filter-sheet[data-page="genres"] .sv-new-filter-group:not([data-section="genres"]),
html:root body dialog.sv-new-filter-sheet[data-page="genres"] .sv-new-filter-genre-nav,
html:root body dialog.sv-new-filter-sheet[data-page="genres"] .sv-new-filter-refresh{display:none!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-actions{background:transparent!important;border-radius:0!important;border-top:1px solid rgba(127,140,155,.16);margin-top:4px!important;padding:0!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-actions :is(.sv-new-filter-edit,.sv-new-filter-refresh){border:0!important;min-height:44px!important;font-size:14px!important;padding:0 2px!important;background:transparent!important}
html:root body dialog.sv-new-filter-sheet #sayviDiscoveryStatus{display:none!important}

/* Quiet premium list: bare outline glyphs, precise alignment and optical grouping. */
html:root body dialog.sv-new-filter-sheet{width:min(calc(100% - 24px),380px)!important;border-radius:25px!important;padding:5px 18px 7px!important;border:1px solid rgba(190,200,212,.30)!important}
@supports ((-webkit-backdrop-filter:blur(18px)) or (backdrop-filter:blur(18px))){html:root[data-theme="light"] body dialog.sv-new-filter-sheet{background:rgba(255,255,255,.97)!important;-webkit-backdrop-filter:blur(18px) saturate(1.08);backdrop-filter:blur(18px) saturate(1.08)}}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-head{position:relative;min-height:44px;margin:0 0 2px!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-head h2{font-size:17px!important;font-weight:600;letter-spacing:-.025em}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-close{flex:0 0 44px;color:var(--text,#141619)}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-close svg{width:18px;height:18px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-group h3{display:none!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-option{justify-content:flex-start;gap:11px;padding:0 3px!important;font-size:14px!important;font-weight:400!important;letter-spacing:-.012em}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-option[aria-pressed=true]{font-weight:550!important}
html:root body dialog.sv-new-filter-sheet .sv-filter-glyph{display:grid;place-items:center;flex:0 0 24px;width:24px;height:24px;background:transparent!important;border:0!important}
html:root body dialog.sv-new-filter-sheet .sv-filter-glyph svg{width:21px;height:21px}
html:root body dialog.sv-new-filter-sheet .sv-filter-label{flex:1;min-width:0;text-align:left}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-tick{margin-left:auto;flex:0 0 19px;width:19px;height:19px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-tick svg{width:18px;height:18px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-genre-nav{margin:2px 0!important;min-height:44px!important;height:44px!important;border-top:1px solid rgba(127,140,155,.13)!important;border-bottom:1px solid rgba(127,140,155,.13)!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-genre-nav .sv-filter-current{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:39%}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-genre-nav>svg{width:15px;height:15px}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-actions{border-color:rgba(127,140,155,.13);margin-top:2px!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-actions :is(.sv-new-filter-edit,.sv-new-filter-refresh){gap:11px;padding:0 3px!important;font-size:14px!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-actions :is(.sv-new-filter-edit,.sv-new-filter-refresh)>svg:first-child{width:21px;height:21px;flex:0 0 24px;color:#6388ae}
html:root body dialog.sv-new-filter-sheet[data-page="genres"] .sv-new-filter-option{border-bottom:1px solid rgba(127,140,155,.09)!important}
html:root body dialog.sv-new-filter-sheet[data-page="genres"] .sv-new-filter-option:last-child{border-bottom:0!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-genre-nav .sv-filter-glyph svg{color:#8d80ab!important}
html:root body dialog.sv-new-filter-sheet .sv-new-filter-group[data-section="for-you"] .sv-new-filter-option{margin:0!important}
html:root body dialog.sv-new-filter-sheet{background-clip:padding-box}

/* Automatic discovery: one feed, one optional saved-releases shortcut. */
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel #svDiscoveryEditTaste{display:grid!important;place-items:center;min-width:44px;width:44px;min-height:44px;height:44px;border:0!important;background:transparent!important;box-shadow:none!important;transform:none!important;color:var(--text,#141619)}
html:root body #sayviMusicPage[data-music-view="new"] #sayviDiscoveryPanel #svDiscoveryEditTaste svg{width:21px;height:21px}
#manageDataDialog #sayviDiscoveryStatus{font-size:12px;color:var(--secondary,#666);line-height:1.4}
#manageDataDialog #sayviDiscoveryCheck:not([hidden]){display:flex;align-items:center;min-height:44px;border:0;background:transparent;box-shadow:none;color:var(--text,#141619);padding:0;text-align:left}

#sayviDiscoveryPanel .sv-new-reminder{grid-column:1/-1!important;margin:0 0 7px!important;padding:12px 0!important;border-top:0!important;border-bottom:1px solid rgba(127,140,155,.15)!important;display:grid;gap:4px}
#sayviDiscoveryPanel .sv-new-reminder-actions{display:flex;gap:18px;align-items:center}
#sayviDiscoveryPanel .sv-new-reminder-actions button,dialog.sv-new-preview :is(.sv-new-heard,.sv-new-store){border:0!important;background:transparent!important;box-shadow:none!important;min-height:44px!important;padding:0 2px!important;color:#3879bb;font-size:13px;font-weight:500;transform:none!important}
#sayviDiscoveryPanel .sv-new-reminder-actions .sv-new-reminder-later{color:var(--secondary,#666)}
`;document.head.append(style);

function publicMessage(s){if(publicStatus){publicStatus.textContent=s;publicStatus.hidden=!s}}

function kind(r){return r.type==='Single'?'Сингл':r.type==='EP'?'EP':'Альбом'}
function heart(r){const b=button(liked(r)?'Убрать из понравившегося':'Нравится','sv-new-icon',heartIcon);b.dataset.discoveryLike=r.id;b.setAttribute('aria-pressed',String(liked(r)));b.addEventListener('click',()=>like(r,b));return b}
function artTile(r){
 const tile=document.createElement('article');tile.className='sv-discovery-tile sv-new-tile';
 const art=document.createElement('span');art.className='sv-discovery-release-art';art.setAttribute('aria-hidden','true');
 const fallback='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17V6l11-3v11"/><ellipse cx="6" cy="17.5" rx="3" ry="2.3"/><ellipse cx="17" cy="14.5" rx="3" ry="2.3"/></svg>';art.innerHTML=fallback;
 const showFallback=()=>{art.innerHTML=fallback;art.classList.add('sv-new-no-art');const mark=document.createElement('span');mark.className='sv-new-art-caption';mark.textContent='Без обложки';art.append(mark)};showFallback();
 const img=document.createElement('img');img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
 img.addEventListener('error',()=>{const backup=safeArtwork(r.artwork);if(backup&&img.src!==backup){img.addEventListener('error',showFallback,{once:true});img.src=backup}else showFallback()},{once:true});img.addEventListener('load',()=>art.classList.remove('sv-new-no-art'),{once:true});
 const imageURL=uuid(r.id)?'https://coverartarchive.org/release-group/'+r.id+'/front-250':safeArtwork(r.artwork);if(imageURL){img.src=imageURL;art.replaceChildren(img)}
 const title=document.createElement('strong');title.textContent=r.title;title.title=r.title;
 const artist=document.createElement('small');artist.textContent=r.artist;artist.title=r.artist;
 const date=document.createElement('time');date.className='sv-new-meta';date.dateTime=r.date;date.textContent=kind(r)+' · '+new Date(r.date+'T00:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'short',timeZone:'UTC'});date.title=dateLabel(r.date);
 const cover=document.createElement('div');cover.className='sv-new-cover';cover.append(art);
 const copy=document.createElement('div');copy.className='sv-new-copy';copy.append(title,artist,date);
 if(r.date<=today()&&!(r.saved?.waiting&&!r.saved.confirmed)){
  const play=button('Предпрослушивание: '+r.title,'sv-new-icon sv-new-cover-play','<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 5.5v13l10-6.5z"/></svg>');
  play.addEventListener('click',()=>{if(previewBox.open&&previewAnchor===tile){closePreview();return}void preview(r,tile)});cover.append(play);
 }else{const soon=document.createElement('span');soon.className='sv-new-cover-soon';soon.textContent=r.date>today()?'Скоро':'Уточняем';cover.append(soon)}
 const favourite=heart(r);favourite.classList.add('sv-new-cover-heart');cover.append(favourite);
 tile.append(cover,copy);return tile;
}
function story(r,future){
 const card=document.createElement('article');card.className='sv-new-story';
 const date=document.createElement('small');date.textContent=(future?'Анонс релиза':'Событие в каталоге')+' · '+dateLabel(r.date);
 const title=document.createElement('strong');title.textContent=r.artist+' — '+r.title;
 const body=document.createElement('p');body.textContent=future?'Ожидается релиз. Дата может измениться.':'Релиз появился в музыкальном каталоге.';
 card.append(date,title,body,heart(r));return card;
}
function showPublic(items,stale=false){
 if(!publicList||!publicTitle)return;
 closePreview();if(mode!=='liked'){lastItems=items;lastStale=stale}
 lastFeedMode=mode;lastPersonalSignature=JSON.stringify(personalItems().map(r=>[r.id,r.date,r.artwork,r.url]));
 const mergedItems=mode==='for-you'?mergePersonal(items):items;
 const day=today(),from=dayISO(Date.now()-21*DAY),until=dayISO(Date.now()+60*DAY);
 const recent=mergedItems.filter(r=>r.date>=from&&r.date<=day).sort((a,b)=>b.date.localeCompare(a.date));
 const upcoming=mergedItems.filter(r=>r.date>day&&r.date<=until).sort((a,b)=>a.date.localeCompare(b.date));
 if(mode==='for-you'&&state.enabled){
  const fav=new Set(likes.map(r=>normalize(r.artist)));const score=r=>Number(fav.has(normalize(r.artist)))*1000+Number(r.tasteMatch===true)*100+(state.artists.find(a=>a.key===normalize(r.artist))?.plays||0);
  recent.sort((a,b)=>score(b)-score(a));upcoming.sort((a,b)=>score(b)-score(a));
 }
 syncPersonal();
 $('svDiscoveryUpcoming').hidden=true;$('svDiscoveryNews').hidden=true;
 publicTitle.textContent=mode==='liked'?'Понравилось':state.enabled&&(favoriteArtists().length||tasteTags().length)?'Для тебя':'Свежие релизы';
 let cards=[];
 if(mode==='liked')cards=[...likes].sort((a,b)=>Number(!!b.saved?.confirmed&&!b.saved?.heard)-Number(!!a.saved?.confirmed&&!a.saved?.heard)).map(artTile);
 else if(mode==='upcoming')cards=upcoming.slice(0,12).map(artTile);
 else if(mode==='news')cards=[...upcoming.slice(0,6).map(r=>story(r,true)),...recent.slice(0,8).map(r=>story(r,false))];
 else{
  for(const [i,r] of recent.slice(0,12).entries()){
   cards.push(artTile(r));if(i===2&&upcoming[0])cards.push(story(upcoming[0],true));
   if(i===5&&upcoming[1])cards.push(story(upcoming[1],true));
  }
  if(recent.length<3&&upcoming[0])cards.push(story(upcoming[0],true));
  const remaining=upcoming.slice(recent.length>=6?2:1,5);if(remaining.length){const heading=document.createElement('h3');heading.textContent='Скоро выйдут';heading.style.gridColumn='1/-1';cards.push(heading,...remaining.map(artTile))}
 }
 if(mode==='for-you')cards.unshift(...pendingReminders().slice(0,1).map(reminderCard));
 publicList.replaceChildren(...cards);
 publicMessage(mode==='liked'?(cards.length?'':'Нажмите сердечко на релизе или анонсе — он останется здесь.'):stale?'Сохранённая подборка · обновление пока недоступно.':cards.length?'':'В каталоге пока нет подходящих релизов.');
 if(publicSource){publicSource.textContent='MusicBrainz · Cover Art Archive · даты могут уточняться';publicSource.hidden=false;$('svDiscoveryPublic').append(publicSource)}
}
async function requestCatalog(tags,future,signal,artists=[]){
 // Serialize public requests, respecting the catalog's one-request-per-second limit.
 const wait=Math.max(0,1200-(Date.now()-lastPublicRequest));
 if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
 if(signal.aborted)throw Error('aborted');
 lastPublicRequest=Date.now();
 const start=future?dayISO(Date.now()+DAY):dayISO(Date.now()-21*DAY);
 const end=future||artists.length?dayISO(Date.now()+60*DAY):today();
 const country=mode==='ru'?'ru':'world';
 const quoteArtist=x=>String(x).replace(/[^\p{L}\p{N}\s.'’-]/gu,' ').trim();
 const artistTerms=artists.map(quoteArtist).filter(Boolean);
 const filter=artistTerms.length?' AND ('+artistTerms.map(t=>'artist:"'+t+'"').join(' OR ')+')':tags.length?' AND ('+tags.map(t=>'tag:"'+t+'"').join(' OR ')+')':'';
 const query=(country==='ru'?'date:[':'firstreleasedate:[')+start+' TO '+end+'] AND (primarytype:album OR primarytype:single OR primarytype:ep)'+(country==='ru'?' AND status:official AND country:RU':'')+filter;
 const endpoint=new URL('https://musicbrainz.org/ws/2/'+(country==='ru'?'release/':'release-group/'));
 endpoint.searchParams.set('query',query);endpoint.searchParams.set('fmt','json');endpoint.searchParams.set('limit','50');
 const response=await fetch(endpoint.href,{signal,credentials:'omit',referrerPolicy:'no-referrer',headers:{accept:'application/json'}});
 if(!response.ok)throw Error('catalog '+response.status);
 return catalogItems(await response.json(),country);
}
async function loadPublic(force=false){
 if(!publicList)return;
 if(mode==='liked'){showPublic(lastItems,lastStale);return}
 if(mode==='genres'&&!state.enabled){mode='for-you';syncFilters();syncChoice();syncPersonal()}
 const tags=selectedTags(),artists=favoriteArtists();const signature=JSON.stringify([tags,artists.map(normalize).sort()]);let hash=2166136261;for(const c of signature)hash=Math.imul(hash^c.charCodeAt(0),16777619);const key=PUBLIC_KEY+'auto26-'+(hash>>>0).toString(36);
 const run=++publicRun;publicController?.abort();publicController=null;
 let cache=null;try{cache=JSON.parse(localStorage.getItem(key)||'null')}catch{}
 const cached=publicItems(cache?.items);
 if(cached.length){showPublic(cached,Date.now()-Number(cache.at)>PUBLIC_TTL);if(!force&&Date.now()-Number(cache.at)<PUBLIC_TTL)return} else if(!force&&cache&&Array.isArray(cache.items)&&Date.now()-Number(cache.at)<PUBLIC_TTL){showPublic([]);return}
 else{
  lastFeedMode='';lastItems=[];publicList.replaceChildren();upcomingList?.replaceChildren();newsList?.replaceChildren();$('svDiscoveryUpcoming').hidden=true;$('svDiscoveryNews').hidden=true;
  publicTitle.textContent='Свежие релизы';publicMessage('Сэйви проверяет новинки…');
  if(publicSource)publicSource.hidden=true;
  if(upcomingStatus){upcomingStatus.hidden=false;upcomingStatus.textContent='Проверяем календарь релизов…'}
 }
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),28000);publicController=controller;
 try{
  let fresh=[],future=[],ok=0;
  try{fresh=await requestCatalog(tags,false,controller.signal);ok++}catch{}
  try{future=await requestCatalog(tags,true,controller.signal);ok++}catch{}
  if(run!==publicRun)return;
  if(mode==='for-you'&&tags.length){
   fresh=fresh.map(r=>({...r,tasteMatch:true}));future=future.map(r=>({...r,tasteMatch:true}));
   if(fresh.length<9){try{fresh=publicItems([...fresh,...await requestCatalog([],false,controller.signal)])}catch{}}
   if(future.length<3){try{future=publicItems([...future,...await requestCatalog([],true,controller.signal)])}catch{}}
  }
  if(run!==publicRun)return;
  let personal=[];if(artists.length&&state.enabled){try{const keys=new Set(artists.map(normalize));personal=(await requestCatalog([],false,controller.signal,artists)).filter(r=>keys.has(normalize(r.artist))).map(r=>({...r,tasteMatch:true}));ok=Math.max(ok,1)}catch{}}
  if(run!==publicRun)return;
  if(!ok)throw Error('unavailable');
  const items=publicItems([...personal,...fresh,...future,...(ok<2?cached:[])]);
  if(ok===2)try{localStorage.setItem(key,JSON.stringify({at:Date.now(),items}))}catch{}
  showPublic(items,ok<2);
  if(ok<2){publicMessage('Часть каталога временно недоступна.');if(upcomingStatus&&!upcomingList?.childElementCount){upcomingStatus.hidden=false;upcomingStatus.textContent='Не удалось полностью проверить календарь релизов.'}}
 }catch{
  if(run!==publicRun)return;
  if(cached.length)showPublic(cached,true);
  else if(mode==='for-you'&&personalItems().length)showPublic([],true);
  else{
   publicMessage('Не удалось обновить каталог. Попробуйте открыть раздел позже.');
   if(upcomingStatus){upcomingStatus.hidden=false;upcomingStatus.textContent='Календарь релизов пока недоступен.'}
  }
 }finally{clearTimeout(timer);if(run===publicRun)publicController=null}
}
// Navigation to the New tab is owned by the music dock.
settingsButton?.addEventListener('click',()=>{settingsOpen=!settingsOpen;syncChoice()});
favButton?.addEventListener('click',()=>setMode(mode==='liked'?'for-you':'liked'));syncFilters();
window.addEventListener('seyveo:music-preferences-changed',()=>{if(feedVisible()&&!previewBox.open)void loadPublic()});
offerYes?.addEventListener('click',()=>enable(true));
offerNo?.addEventListener('click',()=>{rememberChoice();syncChoice()});
document.addEventListener('seyveo:music-view',event=>{if(event.detail?.view!=='new'){settingsOpen=false;syncChoice();closePreview();++publicRun;publicController?.abort();publicController=null;mode='for-you';syncFilters()}else{syncChoice();void loadPublic();void checkSavedReleases()}});
consent.addEventListener('click',()=>enable(!state.enabled));
checkButton.addEventListener('click',()=>{if(state.enabled)void check({force:true});if(feedVisible())void loadPublic(true)});
clearButton.addEventListener('click',clear);
window.addEventListener('seyveo:music-qualified-listen',event=>{observeSavedListen(event.detail);listen(event.detail)});
window.addEventListener('seyveo:music-saved-listen',event=>observeSavedListen(event.detail));
function refreshVisible(){maybeCheck();void checkSavedReleases();if(feedVisible()&&mode==='for-you'&&!previewBox.open&&!publicController)void loadPublic()}
window.addEventListener('focus',refreshVisible);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshVisible()});
window.addEventListener('storage',event=>{
 if(event.key===LIKES){likes=readLikes();if(mode==='liked')showPublic(lastItems,lastStale);else{renderReleases();if(lastItems.length)showPublic(lastItems,lastStale)}}
 if(event.key===CHOICE){try{answered=localStorage.getItem(CHOICE)==='1'||state.enabled}catch{}syncChoice()}
 if(event.key===STORE||!event.key){runId++;state=read();if(state.enabled)answered=true;update();signal()}
});
window.SEYVEO_DISCOVERY=Object.freeze({
 ...window.SEYVEO_DISCOVERY,
 enabled:()=>state.enabled,artists:()=>state.artists.map(a=>({...a})),
 current,postpone,dismiss,check,listen,chooseReleases
});
update();signal();maybeCheck();void checkSavedReleases();
if($('sayviMusicPage')?.dataset.musicView==='new'&&!panel.hidden)void loadPublic();
})();
