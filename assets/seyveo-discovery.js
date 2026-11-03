/* SEYVEO Discovery v1 · explicit opt-in, on-device music interests.
 * A qualified play is reported by the ONE existing audio player.
 * Only artist names are stored; no files, full listening logs or browser history.
 * Once enabled, a bounded daily catalog check can create verified cards.
 * No push/background promises and no playback of unavailable catalog music.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const showSettings=$('sayviMusicDiscoveryToggle'),panel=$('sayviDiscoveryPanel');
const consent=$('sayviDiscoveryToggle'),checkButton=$('sayviDiscoveryCheck'),
 clearButton=$('sayviDiscoveryForget'),info=$('sayviDiscoveryStatus');
if(!showSettings||!panel||!consent||!checkButton||!clearButton||!info)return;
const STORE='seyveo-discovery-music-v1';
const DAY=24*3600*1000,LOOKBACK=21*DAY,MAX_ARTISTS=30;
const normalize=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('ru-RU')
 .replace(/\s+/g,' ').trim();
const clean=s=>typeof s==='string'?s.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,100):'';
function fresh(){return {enabled:false,artists:[],releases:[],ignored:[],snoozed:{},checks:{}}}
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
  checks:x.checks&&typeof x.checks==='object'&&!Array.isArray(x.checks)?x.checks:{}
 };
}
let state=read(),checking=false,runId=0;
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{status('Недостаточно места для сохранения настроек на этом устройстве.')}}
function status(message=''){
 info.textContent=message||'';
 info.hidden=!message;
}
function signal(){
 // Metadata-only event. Never attach artist interests or music history.
 window.dispatchEvent(new Event('seyveo:discovery-updated'));
}
function update(){
 consent.setAttribute('aria-pressed',String(state.enabled));
 consent.textContent=state.enabled?'Музыкальные открытия включены':'Включить музыкальные открытия';
 checkButton.hidden=!state.enabled;
 clearButton.hidden=!state.enabled&&!state.artists.length&&!state.releases.length;
 checkButton.disabled=checking;
 const qualified=state.artists.filter(a=>a.plays>=3).length;
 if(!state.enabled)status(state.artists.length?'Поиск новинок выключен. Сохранённые интересы можно очистить.':
  'Выключено. Сэйви не запоминает прослушивания и не обращается к каталогу.');
 else status(checking?'Сэйви проверяет доступные новинки…':
  qualified?'Любимых исполнителей: '+qualified+'. Проверка — не чаще раза в сутки при открытом SEYVEO.':
  'Сэйви заметит исполнителя после трёх прослушиваний от 30 секунд. Пока интересов недостаточно.');
}
function enable(value){
 runId++;
 state.enabled=value===true;
 persist();update();signal();
 if(state.enabled)maybeCheck();
}
function clear(){
 runId++;
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
   date,url:safeUrl(r.collectionViewUrl),at
  };
 }).filter(r=>r.at<=now&&r.at>=now-LOOKBACK)
 .sort((a,b)=>b.at-a.at);
}
async function lookup(artist,signal){
 const endpoint=new URL('https://itunes.apple.com/search');
 endpoint.searchParams.set('term',artist);
 endpoint.searchParams.set('country','US');
 endpoint.searchParams.set('media','music');
 endpoint.searchParams.set('entity','album');
 endpoint.searchParams.set('attribute','artistTerm');
 endpoint.searchParams.set('limit','60');
 const response=await fetch(endpoint.href,{method:'GET',credentials:'omit',
  redirect:'follow',signal,headers:{accept:'application/json'}});
 if(!response.ok)throw Error('Catalog '+response.status);
 const result=await response.json();
 return chooseReleases(result,artist);
}
async function check({force=false}={}){
 if(!state.enabled||checking||document.hidden)return false;
 const now=Date.now();
 // Only two qualified artists per check; no full browsing history leaves device.
 const eligible=state.artists.filter(a=>a.plays>=3&&a.last>now-120*DAY)
  .sort((a,b)=>b.plays-a.plays)
  .filter(a=>force||now-Number(state.checks[a.key]||0)>=DAY)
  .slice(0,2);
 if(!eligible.length){if(force)status('Новинок пока не ищем: сначала послушайте любимого исполнителя три раза.');return false}
 checking=true;const current=++runId;update();
 let success=0,found=0;
 for(const artist of eligible){
  if(!state.enabled||current!==runId)break;
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
     date:release.date,url:release.url
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
 if(current!==runId)return false;
 checking=false;persist();update();
 status(success?
  (found?'Найдено подтверждённых релизов: '+found+'. Показываю на Главной.':
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
showSettings.addEventListener('click',()=>{
 const next=!panel.hidden;
 panel.hidden=next;
 showSettings.setAttribute('aria-expanded',String(!next));
});
consent.addEventListener('click',()=>enable(!state.enabled));
checkButton.addEventListener('click',()=>{if(state.enabled)void check({force:true})});
clearButton.addEventListener('click',clear);
window.addEventListener('seyveo:music-qualified-listen',event=>listen(event.detail));
window.addEventListener('focus',maybeCheck);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)maybeCheck()});
window.addEventListener('storage',event=>{
 if(event.key===STORE||!event.key){runId++;state=read();update();signal()}
});
window.SEYVEO_DISCOVERY=Object.freeze({
 enabled:()=>state.enabled,artists:()=>state.artists.map(a=>({...a})),
 current,postpone,dismiss,check,listen,chooseReleases
});
update();maybeCheck();
})();
