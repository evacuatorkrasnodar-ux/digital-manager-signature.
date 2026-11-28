/* SEYVEO Discovery v1 · explicit opt-in, on-device music interests.
 * A qualified play is reported by the ONE existing audio player.
 * Only artist names are stored; no files, full listening logs or browser history.
 * Once enabled, a bounded daily catalog check can create verified cards.
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
const offer=$('svDiscoveryOffer'),offerYes=$('svDiscoveryOfferYes'),offerNo=$('svDiscoveryOfferNo'),settings=$('svDiscoverySettings'),settingsButton=$('svDiscoverySettingsButton');
let answered=false,settingsOpen=false;
try{answered=localStorage.getItem(CHOICE)==='1'||localStorage.getItem(STORE)!==null}catch{}
function rememberChoice(){answered=true;try{localStorage.setItem(CHOICE,'1')}catch{}}
function syncChoice(){
 if(offer)offer.hidden=answered||state.enabled||settingsOpen;
 if(settings)settings.hidden=!settingsOpen;
 if(settingsButton)settingsButton.setAttribute('aria-expanded',String(settingsOpen));
}
const DAY=24*3600*1000,LOOKBACK=21*DAY,MAX_ARTISTS=30;
const normalize=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('ru-RU')
 .replace(/\s+/g,' ').trim();
const clean=s=>typeof s==='string'?s.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,100):'';
function fresh(){return {enabled:false,artists:[],releases:[],ignored:[],snoozed:{},checks:{},attempts:{}}}
function read(){
 let x;try{x=JSON.parse(localStorage.getItem(STORE)||'null')}catch{}
 if(!x||typeof x!=='object')return fresh();
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
 info.hidden=!message;
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
 clearButton.hidden=!state.enabled&&!state.artists.length&&!state.releases.length;
 checkButton.disabled=checking;
 const qualified=state.artists.filter(a=>a.plays>=3).length;
 if(!state.enabled)status(state.artists.length?'Поиск новинок выключен. Сохранённые интересы можно очистить.':
  'Открытия можно включить в настройках.');
 else status(checking?'Сэйви проверяет новинки…':
  qualified?'Любимых исполнителей: '+qualified+'. Проверка при открытом SEYVEO.':
  'Три прослушивания исполнителя от 30 секунд помогут Сэйви узнать ваш вкус.');
 renderReleases();
}
function enable(value){
 rememberChoice();
 runId++;
 checking=false;
 state.enabled=value===true;
 persist();update();signal();
 if(state.enabled)maybeCheck();
}
function clear(){
 rememberChoice();
 runId++;
 checking=false;
 state=fresh();
 persist();update();signal();
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
 if(next.plays===3)maybeCheck();
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
function renderReleases(){
 if(!releasesList||!empty||!emptyTitle)return;
 const items=state.enabled?state.releases.filter(r=>!state.ignored.includes(r.id)&&validDate(r.date)&&safeUrl(r.url)&&Date.now()>=Number(state.snoozed[r.id]||0)).slice(0,20):[];
 releasesList.replaceChildren();
 for(const r of items){
  const row=document.createElement('article');row.className='sv-discovery-tile';
  const art=document.createElement('span');art.className='sv-discovery-release-art';art.setAttribute('aria-hidden','true');
  art.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17V6l11-3v11"/><ellipse cx="6" cy="17.5" rx="3" ry="2.3"/><ellipse cx="17" cy="14.5" rx="3" ry="2.3"/></svg>';
  const artwork=safeArtwork(r.artwork);
  if(artwork){const img=document.createElement('img');img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
   const fallback=art.innerHTML;img.addEventListener('error',()=>{art.innerHTML=fallback},{once:true});img.src=artwork;art.replaceChildren(img)}
  const copy=document.createElement('span');copy.className='sv-discovery-release-copy';
  const title=document.createElement('strong');title.textContent=r.title;
  const artist=document.createElement('small');artist.textContent=r.artist+' · '+new Date(r.date+'T00:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'short',timeZone:'UTC'});
  copy.append(title,artist);row.append(art,copy);releasesList.append(row);
 }
 releasesList.hidden=!items.length;empty.hidden=!!items.length;
 emptyTitle.textContent=!state.enabled?'Открывайте новое с Сэйви':checking?'Ищу новинки':state.artists.some(a=>a.plays>=3)?'Ждём новые релизы':'Пока изучаю ваш вкус';
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
 const eligible=state.artists.filter(a=>a.plays>=3&&a.last>now-120*DAY)
  .sort((a,b)=>b.plays-a.plays)
  .filter(a=>(force||now-Number(state.checks[a.key]||0)>=DAY)&&
   now-Number(state.attempts[a.key]||0)>=3600*1000)
  .slice(0,2);
 if(!eligible.length){if(force)status(state.artists.some(a=>a.plays>=3)?
  'Проверка уже выполнялась недавно. Попробуйте позже.':
  'Сначала послушайте любимого исполнителя три раза.');return false}
 checking=true;const current=++runId;update();
 let success=0,found=0;
 for(const artist of eligible){
  if(!state.enabled||current!==runId)break;
  state.attempts[artist.key]=Date.now();persist();
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8500);
  try{
   // Sending an artist name is explicit opt-in. No song titles or files sent.
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
 state.artists.some(a=>a.plays>=3))void check()}
function asCard(release){
 const engine=window.SEYVEO_CARD_ENGINE;
 const event=engine?.buildCard?.({
  id:'discovery-'+release.id,type:'music.release_verified',
  title:release.artist+' · '+release.title,
  fact:'В музыкальном каталоге iTunes указан релиз от '+new Date(release.date+'T00:00:00Z')
    .toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})+'.',
  suggestion:'Хочешь посмотреть альбом? Открою его страницу в SEYVEO Browser.',
  priority:'normal',source:'Каталог iTunes · дата релиза',demo:false
 });
 return event?Object.freeze({...event,releaseId:release.id,releaseUrl:release.url}):null;
}
function current(){
 if(!state.enabled)return null;
 const top=state.releases.find(r=>!state.ignored.includes(r.id)&&
  Date.now()>=Number(state.snoozed[r.id]||0)&&safeUrl(r.url));
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
const PUBLIC_KEY='seyveo-music-editorial-v2-',PUBLIC_TTL=6*3600000;
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
  return [{id:r.id,title:clean(r.title),artist:clean(r.artist),date:r.date,type:r.type==='Single'?'Single':r.type==='EP'?'EP':'Album'}];
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
function publicMessage(s){if(publicStatus){publicStatus.textContent=s;publicStatus.hidden=!s}}
function artTile(r){
 const tile=document.createElement('article');tile.className='sv-discovery-tile';
 const art=document.createElement('span');art.className='sv-discovery-release-art';art.setAttribute('aria-hidden','true');art.textContent='♫';
 const img=document.createElement('img');img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
 img.addEventListener('error',()=>{art.textContent='♫'},{once:true});
 img.src='https://coverartarchive.org/release-group/'+r.id+'/front-250';art.replaceChildren(img);
 const title=document.createElement('strong');title.textContent=r.title;title.title=r.title;
 const artist=document.createElement('small');artist.textContent=r.artist;artist.title=r.artist;
 const date=document.createElement('time');date.dateTime=r.date;date.textContent=dateLabel(r.date);
 tile.append(art,title,artist,date);return tile;
}
function renderNews(recent,upcoming){
 if(!newsList)return;
 newsList.replaceChildren();
 const stories=[...upcoming.slice(0,3).map(r=>({r,future:true})),...recent.slice(0,3).map(r=>({r,future:false}))];
 for(const {r,future} of stories){
  const story=document.createElement('article');story.className='sv-discovery-news-card';
  const date=document.createElement('time');date.dateTime=r.date;date.textContent=dateLabel(r.date);
  const title=document.createElement('strong');title.textContent=r.artist+' — '+r.title;
  const body=document.createElement('p');const kind=r.type==='Single'?'сингл':r.type==='EP'?'мини-альбом':'альбом';
  body.textContent=future?'Ожидается новый '+kind+'. Дата указана в каталоге и может измениться.':'Вышел '+kind+' — по данным музыкального каталога.';
  story.append(date,title,body);newsList.append(story);
 }
 if(!stories.length){const p=document.createElement('p');p.className='sv-discovery-public-status';p.textContent='Пока нет свежих сообщений о релизах.';newsList.append(p)}
}
function showPublic(items,stale=false){
 if(!publicList||!publicTitle)return;
 const day=today(),from=dayISO(Date.now()-21*DAY),until=dayISO(Date.now()+60*DAY);
 const recent=items.filter(r=>r.date>=from&&r.date<=day).sort((a,b)=>b.date.localeCompare(a.date));
 const upcoming=items.filter(r=>r.date>day&&r.date<=until).sort((a,b)=>a.date.localeCompare(b.date));
 publicTitle.textContent='Свежие релизы';
 publicList.replaceChildren(...recent.slice(0,8).map(artTile));
 upcomingList?.replaceChildren(...upcoming.slice(0,6).map(artTile));
 if(upcomingStatus){upcomingStatus.hidden=!!upcoming.length;upcomingStatus.textContent='В каталоге пока нет предстоящих релизов.'}
 publicMessage(stale?'Сохранённая подборка · обновление пока недоступно.':recent.length?'':'Свежих релизов в каталоге пока нет.');
 renderNews(recent,upcoming);
 if(publicSource){publicSource.textContent='Данные: MusicBrainz · обложки: Cover Art Archive. Даты могут уточняться.';publicSource.hidden=false}
}
async function requestCatalog(country,future,signal){
 // Serialize public requests, respecting the catalog's one-request-per-second limit.
 const wait=Math.max(0,1200-(Date.now()-lastPublicRequest));
 if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
 if(signal.aborted)throw Error('aborted');
 lastPublicRequest=Date.now();
 const start=future?dayISO(Date.now()+DAY):dayISO(Date.now()-21*DAY);
 const end=future?dayISO(Date.now()+60*DAY):today();
 const field=country==='ru'?'date':'firstreleasedate';
 const query=field+':['+start+' TO '+end+'] AND status:official AND (primarytype:album OR primarytype:single OR primarytype:ep)'+(country==='ru'?' AND country:RU':'');
 const endpoint=new URL('https://musicbrainz.org/ws/2/'+(country==='ru'?'release':'release-group')+'/');
 endpoint.searchParams.set('query',query);endpoint.searchParams.set('fmt','json');endpoint.searchParams.set('limit','35');
 const response=await fetch(endpoint.href,{signal,credentials:'omit',referrerPolicy:'no-referrer',headers:{accept:'application/json'}});
 if(!response.ok)throw Error('catalog '+response.status);
 return catalogItems(await response.json(),country);
}
async function loadPublic(){
 if(!publicList)return;
 const country=panel.dataset.scope==='ru'?'ru':'world',key=PUBLIC_KEY+country;
 const run=++publicRun;publicController?.abort();publicController=null;
 let cache=null;try{cache=JSON.parse(localStorage.getItem(key)||'null')}catch{}
 const cached=publicItems(cache?.items);
 if(cached.length){showPublic(cached,Date.now()-Number(cache.at)>PUBLIC_TTL);if(Date.now()-Number(cache.at)<PUBLIC_TTL)return} else if(cache&&Array.isArray(cache.items)&&Date.now()-Number(cache.at)<PUBLIC_TTL){showPublic([]);return}
 else{
  publicList.replaceChildren();upcomingList?.replaceChildren();newsList?.replaceChildren();
  publicTitle.textContent='Свежие релизы';publicMessage('Сэйви проверяет новинки…');
  if(publicSource)publicSource.hidden=true;
  if(upcomingStatus){upcomingStatus.hidden=false;upcomingStatus.textContent='Проверяем календарь релизов…'}
 }
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);publicController=controller;
 try{
  let fresh=[],future=[],ok=0;
  try{fresh=await requestCatalog(country,false,controller.signal);ok++}catch{}
  try{future=await requestCatalog(country,true,controller.signal);ok++}catch{}
  if(run!==publicRun)return;
  if(!ok)throw Error('unavailable');
  const items=publicItems([...fresh,...future,...(ok<2?cached:[])]);
  if(ok===2)try{localStorage.setItem(key,JSON.stringify({at:Date.now(),items}))}catch{}
  showPublic(items,ok<2);
  if(ok<2){publicMessage('Часть каталога временно недоступна.');if(upcomingStatus&&!upcomingList?.childElementCount){upcomingStatus.hidden=false;upcomingStatus.textContent='Не удалось полностью проверить календарь релизов.'}}
 }catch{
  if(run!==publicRun)return;
  if(cached.length)showPublic(cached,true);
  else{
   publicMessage('Не удалось обновить каталог. Попробуйте открыть раздел позже.');
   if(upcomingStatus){upcomingStatus.hidden=false;upcomingStatus.textContent='Календарь релизов пока недоступен.'}
  }
 }finally{clearTimeout(timer);if(run===publicRun)publicController=null}
}
const scope=$('svDiscoveryScope');
if(scope){
 panel.dataset.scope='personal';
 scope.addEventListener('click',event=>{
  const button=event.target.closest('button[data-discovery-scope]');
  if(!button||!scope.contains(button)||panel.dataset.scope===button.dataset.discoveryScope)return;
  panel.dataset.scope=button.dataset.discoveryScope;
  for(const item of scope.querySelectorAll('button[data-discovery-scope]'))item.setAttribute('aria-pressed',String(item===button));
  void loadPublic();
 });
}
// Navigation to the New tab is owned by the music dock.
settingsButton?.addEventListener('click',()=>{settingsOpen=!settingsOpen;syncChoice()});
offerYes?.addEventListener('click',()=>enable(true));
offerNo?.addEventListener('click',()=>{rememberChoice();syncChoice()});
document.addEventListener('seyveo:music-view',event=>{if(event.detail?.view!=='new'){settingsOpen=false;syncChoice()}else{syncChoice();void loadPublic()}});
consent.addEventListener('click',()=>enable(!state.enabled));
checkButton.addEventListener('click',()=>{if(state.enabled)void check({force:true})});
clearButton.addEventListener('click',clear);
window.addEventListener('seyveo:music-qualified-listen',event=>listen(event.detail));
window.addEventListener('focus',maybeCheck);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)maybeCheck()});
window.addEventListener('storage',event=>{
 if(event.key===CHOICE){try{answered=localStorage.getItem(CHOICE)==='1'||state.enabled}catch{}syncChoice()}
 if(event.key===STORE||!event.key){runId++;state=read();if(state.enabled)answered=true;update();signal()}
});
window.SEYVEO_DISCOVERY=Object.freeze({
 ...window.SEYVEO_DISCOVERY,
 enabled:()=>state.enabled,artists:()=>state.artists.map(a=>({...a})),
 current,postpone,dismiss,check,listen,chooseReleases
});
update();signal();maybeCheck();
if($('sayviMusicPage')?.dataset.musicView==='new'&&!panel.hidden)void loadPublic();
})();
