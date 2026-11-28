/* SEYVEO Podcasts — public RSS, local subscriptions and playback positions. */
(()=>{
'use strict';
const init=()=>{
const panel=document.getElementById('svMusicPodcasts');if(!panel)return;
const get=id=>document.getElementById(id),audio=get('svPodcastAudio'),form=get('svPodcastForm'),input=get('svPodcastUrl'),list=get('svPodcastFeeds'),episodes=get('svPodcastEpisodes'),status=get('svPodcastStatus'),player=get('svPodcastPlayer'),file=get('svPodcastXml');
const KEY='seyveo-podcasts-v1';
let state={feeds:[],progress:{},favorites:{},last:null,speed:1},selected=null,current=null,loadToken=0,lastSave=0,sleepTimer=null;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&Array.isArray(saved.feeds)){state={...state,...saved};state.progress=state.progress||{};state.favorites=state.favorites||{}}}catch{}
const say=t=>{status.textContent=t||'';status.hidden=!t};
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{say('Не удалось сохранить изменения на устройстве.');return false}};
const el=(tag,cls,t)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(t!=null)n.textContent=t;return n};
const button=(t,fn)=>{const b=el('button','sv-podcast-button',t);b.type='button';b.addEventListener('click',fn);return b};
const https=(v,base)=>{try{const u=new URL(v,base);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}};
const direct=(node,name)=>Array.from(node?.children||[]).find(x=>x.localName===name);
const value=(node,name)=>direct(node,name)?.textContent?.trim()||'';
function parse(xml,base){
const d=new DOMParser().parseFromString(xml,'application/xml');if(d.querySelector('parsererror'))throw Error('Не удалось прочитать RSS.');
const channel=d.getElementsByTagName('channel')[0];if(!channel)throw Error('Это не RSS-лента подкаста.');
const title=value(channel,'title')||'Подкаст',items=[];
for(const item of Array.from(channel.children).filter(n=>n.localName==='item').slice(0,100)){
const enc=direct(item,'enclosure'),url=enc?.getAttribute('url');if(!url)continue;const type=enc.getAttribute('type')||'',src=https(url,base);
if(!src||type&&!/^(audio\/|application\/ogg)/i.test(type))continue;
const id=src;if(items.some(x=>x.id===id))continue;
items.push({id,src,title:(value(item,'title')||'Выпуск').slice(0,250),date:value(item,'pubDate').slice(0,100)});
}
if(!items.length)throw Error('В этой ленте нет доступных аудиовыпусков.');
const author=value(channel,'author')||value(channel,'managingEditor');const art=direct(channel,'image');const artwork=https(art?.getAttribute('href')||value(art,'url'),base);return {title:title.slice(0,160),author:author.slice(0,160),artwork,items};
}
function storeFeed(id,data){
const existing=state.feeds.find(f=>f.id===id);
if(existing){const merged=new Map(existing.items.map(e=>[e.id,e]));for(const e of data.items)merged.set(e.id,e);existing.items=[...data.items,...[...merged.values()].filter(e=>!data.items.some(x=>x.id===e.id))].slice(0,150);existing.title=data.title;existing.author=data.author||existing.author||'';existing.artwork=data.artwork||existing.artwork||'';existing.directoryId=data.directoryId||existing.directoryId||null;existing.country=data.country||existing.country||'RU';existing.updated=Date.now()}
else{if(state.feeds.length>=30)throw Error('Достигнут предел подписок.');state.feeds.unshift({id,...data,updated:Date.now()})}
selected=id;persist();render();
}
async function load(url,meta=null){
const id=https(url);if(!id){say('Вставь HTTPS-ссылку на RSS подкаста.');return}
const token=++loadToken;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
say('Загружаю выпуски…');get('svPodcastAdd').disabled=true;
try{const res=await fetch(id,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!res.ok)throw Error('Лента недоступна.');const xml=await res.text();if(xml.length>3000000)throw Error('Лента слишком большая.');if(token!==loadToken)return;const data=parse(xml,res.url||id);if(meta){data.author=data.author||meta.author||'';data.directoryId=meta.directoryId||null;data.country=meta.country||'RU'}storeFeed(id,data);input.value='';say('');return true}
catch(e){if(token===loadToken){if(meta?.directoryId){try{const data=await directoryEpisodes(meta);if(token!==loadToken)return false;storeFeed(id,data);say('');return true}catch{}}say(e.message==='Failed to fetch'||e.name==='AbortError'||e instanceof TypeError?'Сайт не разрешает загрузить ленту из приложения. Можно добавить скачанный RSS-файл.':e.message||'Не удалось загрузить ленту.');return false}}
finally{clearTimeout(timeout);if(token===loadToken)get('svPodcastAdd').disabled=false}
}
form.addEventListener('submit',e=>{e.preventDefault();load(input.value.trim())});
file.addEventListener('change',async()=>{const f=file.files?.[0];if(!f)return;try{if(f.size>3000000)throw Error('Файл слишком большой.');const xml=typeof f.text==='function'?await f.text():await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(f)});const data=parse(xml);storeFeed('file:'+data.title,data);say('')}catch(e){say(e.message||'Не удалось прочитать файл.')}finally{file.value=''}});
const duration=s=>{const n=Math.max(0,Math.floor(s||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
function savePosition(force=false){if(!current||audio.readyState<1||!Number.isFinite(audio.currentTime))return;if(!force&&Date.now()-lastSave<5000)return;lastSave=Date.now();state.progress[current.id]={position:audio.currentTime,duration:Number.isFinite(audio.duration)?audio.duration:0,finished:audio.ended,updated:Date.now()};state.last={feed:current.feed,id:current.id};persist()}
function play(feed,ep){
savePosition(true);audio.pause();current=null;const pos=state.progress[ep.id];current={...ep,feed:feed.id};player.hidden=false;get('svPodcastPlaying').textContent=ep.title;get('svPodcastPlayingFeed').textContent=feed.title;
const main=document.getElementById('sayviMusicAudio');main?.pause();
audio.src=ep.src;audio.playbackRate=state.speed||1;get('svPodcastSpeed').value=String(audio.playbackRate);
const expected=ep.src;
const resume=()=>{if(current?.src!==expected)return;if(pos&&!pos.finished&&pos.position>0&&(!Number.isFinite(audio.duration)||pos.position<audio.duration-2))try{audio.currentTime=pos.position}catch{}};
audio.addEventListener('loadedmetadata',resume,{once:true});audio.play().catch(()=>say('Нажми воспроизведение, чтобы начать слушать.'));state.last={feed:feed.id,id:ep.id};persist();renderEpisodes();
}
audio.addEventListener('play',()=>{document.getElementById('sayviMusicAudio')?.pause();say('')});
document.getElementById('sayviMusicAudio')?.addEventListener('play',()=>audio.pause());
audio.addEventListener('timeupdate',()=>savePosition());audio.addEventListener('pause',()=>{savePosition(true);renderEpisodes();renderHighlights()});audio.addEventListener('ended',()=>{savePosition(true);renderEpisodes();renderHighlights()});audio.addEventListener('error',()=>say('Выпуск сейчас недоступен.'));
get('svPodcastSpeed').addEventListener('change',e=>{state.speed=Number(e.target.value)||1;audio.playbackRate=state.speed;persist()});
get('svPodcastSleep').addEventListener('change',e=>{clearTimeout(sleepTimer);const minutes=Number(e.target.value);if(minutes>0)sleepTimer=setTimeout(()=>{audio.pause();get('svPodcastSleep').value='0';say('Таймер сна завершён.')},minutes*60000)});
window.addEventListener('pagehide',()=>savePosition(true));
function renderEpisodes(){
episodes.replaceChildren();const feed=state.feeds.find(f=>f.id===selected);if(!feed)return;
episodes.append(el('h3','sv-podcast-heading',feed.title));
for(const ep of feed.items){
const row=el('div','sv-podcast-episode'),copy=button(ep.title,()=>play(feed,ep));copy.className='sv-podcast-episode-title';
const pos=state.progress[ep.id],date=Date.parse(ep.date),meta=el('small','',[(Number.isFinite(date)?new Date(date).toLocaleDateString('ru-RU'):''),pos?.finished?'Прослушано':pos?.position>0?'Продолжить · '+duration(pos.position):''].filter(Boolean).join(' · '));
const heart=button(state.favorites[ep.id]?'♥':'♡',()=>{if(state.favorites[ep.id])delete state.favorites[ep.id];else state.favorites[ep.id]=true;persist();renderEpisodes();renderHighlights()});heart.className='sv-podcast-heart';heart.setAttribute('aria-label',state.favorites[ep.id]?'Убрать из избранного':'В избранное');heart.setAttribute('aria-pressed',String(!!state.favorites[ep.id]));
const body=el('div','sv-podcast-episode-copy');body.append(copy,meta);row.append(body,heart);episodes.append(row);
}
}

const searchOpen=get('svPodcastSearchOpen'),searchForm=get('svPodcastSearchBar'),searchInput=get('svPodcastSearchInput'),results=get('svPodcastSearchResults'),manage=get('svPodcastManage'),manual=get('svPodcastManual');
let searchSerial=0,manageOpen=false;
function openSearch(value=true){
 searchForm.hidden=!value;searchOpen.setAttribute('aria-expanded',String(value));
 if(value){searchInput.focus()}else{searchSerial++;results.hidden=true;results.replaceChildren();searchInput.value=''}
}
searchOpen.addEventListener('click',()=>openSearch(searchForm.hidden));
manage.addEventListener('click',()=>{manageOpen=!manageOpen;manual.hidden=!manageOpen;manage.setAttribute('aria-expanded',String(manageOpen));render()});
function artwork(feed){
 const a=el('span','sv-podcast-art');a.setAttribute('aria-hidden','true');
 const fallback=()=>{a.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"><circle cx="12" cy="10" r="2"/><path d="M7.5 16a7 7 0 1 1 9 0M5 19a11 11 0 1 1 14 0M11 14h2l1 7h-4z"/></svg>'};
 fallback();const url=https(feed.artwork);if(url){const img=el('img');img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.addEventListener('error',fallback,{once:true});img.src=url;a.replaceChildren(img)}return a
}
function copyOf(title,sub,fn){const c=fn?button('',fn):el('div');c.className='sv-podcast-row-copy';c.append(el('strong','',title));if(sub)c.append(el('small','',sub));return c}
function action(t,fn){const b=button(t,fn);b.classList.add('sv-podcast-flat-action');return b}
function episodeCard(feed,ep,sub){
 const go=()=>{selected=feed.id;play(feed,ep);render()};const row=el('div','sv-podcast-episode-card');const p=action('▶',go);p.setAttribute('aria-label','Слушать '+ep.title);row.append(artwork(feed),copyOf(ep.title,sub||feed.title,go),p);return row
}
function renderHighlights(){
 const resume=get('svPodcastResume'),news=get('svPodcastNew'),recs=get('svPodcastForYou');resume.replaceChildren();news.replaceChildren();recs.replaceChildren();
 const all=[];for(const feed of state.feeds)for(const ep of feed.items)all.push({feed,ep,pos:state.progress[ep.id]});
 const unfinished=all.filter(x=>x.pos?.position>0&&!x.pos.finished).sort((a,b)=>b.pos.updated-a.pos.updated);
 if(unfinished.length){resume.append(el('h3','sv-podcast-heading','Продолжить слушать'));for(const x of unfinished.slice(0,3))resume.append(episodeCard(x.feed,x.ep,x.feed.title+' · '+duration(x.pos.position)))}
 const fresh=all.filter(x=>!x.pos?.position&&!x.pos?.finished&&Number.isFinite(Date.parse(x.ep.date))).sort((a,b)=>Date.parse(b.ep.date)-Date.parse(a.ep.date));news.hidden=!fresh.length;
 if(fresh.length){news.append(el('h3','sv-podcast-heading','Новые выпуски'));for(const x of fresh.slice(0,4))news.append(episodeCard(x.feed,x.ep,x.feed.title+' · '+new Date(x.ep.date).toLocaleDateString('ru-RU')))}
 const weights=new Map();for(const x of all)if(x.pos?.position>0||state.favorites[x.ep.id])weights.set(x.feed.id,(weights.get(x.feed.id)||0)+Math.min(60,(x.pos?.position||0)/60)+(state.favorites[x.ep.id]?10:0));
 const featured=new Set(fresh.slice(0,4).map(x=>x.ep.id));const picks=all.filter(x=>weights.has(x.feed.id)&&!x.pos?.position&&!x.pos?.finished&&!featured.has(x.ep.id)).sort((a,b)=>weights.get(b.feed.id)-weights.get(a.feed.id)||((Date.parse(b.ep.date)||0)-(Date.parse(a.ep.date)||0)));
 recs.hidden=!picks.length;if(picks.length){recs.append(el('h3','sv-podcast-heading','Для тебя'),el('p','sv-podcast-muted','На основе твоих прослушиваний и избранного.'));for(const x of picks.slice(0,3))recs.append(episodeCard(x.feed,x.ep))}
}
function render(){
 list.replaceChildren();if(!state.feeds.some(f=>f.id===selected))selected=state.feeds[0]?.id||null;
 get('svPodcastIntro').hidden=!!state.feeds.length;
 get('svPodcastTopics').hidden=!!state.feeds.length;
 for(const feed of state.feeds){
  const go=()=>{selected=feed.id;render();episodes.scrollIntoView({block:'start',behavior:'smooth'})};
  const row=el('div','sv-podcast-feed'),title=copyOf(feed.title,feed.author||feed.items.length+' выпусков',go);title.setAttribute('aria-pressed',String(feed.id===selected));row.append(artwork(feed),title);
  if(manageOpen){if(https(feed.id)){const refresh=action('↻',()=>load(feed.id,feed));refresh.setAttribute('aria-label','Обновить выпуски');row.append(refresh)}const remove=action('Удалить',()=>{if(!confirm('Убрать подписку «'+feed.title+'»?'))return;if(current?.feed===feed.id){audio.pause();current=null;audio.removeAttribute('src');audio.load();player.hidden=true}state.feeds=state.feeds.filter(f=>f.id!==feed.id);persist();render()});remove.classList.add('is-remove');row.append(remove)}
  else{const chevron=action('›',go);chevron.setAttribute('aria-label','Открыть '+feed.title);row.append(chevron)}list.append(row)
 }
 if(!state.feeds.length){list.append(el('p','sv-podcast-muted','Найди любимого автора, чтобы не пропускать выпуски.'));const find=button('Найти подкаст',()=>openSearch());find.className='sv-podcast-empty-search';list.append(find)}
 renderHighlights();renderEpisodes();
}
// Cross-site callback runs in an opaque sandbox, not in the app origin.
async function directoryRequest(path,params){
 const url=new URL('https://itunes.apple.com/'+path);for(const [k,v] of Object.entries(params))url.searchParams.set(k,String(v));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
 try{const response=await fetch(url.href,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error('directory');return await response.json()}catch{}finally{clearTimeout(timer)}
 return new Promise((resolve,reject)=>{
  const frame=document.createElement('iframe');frame.hidden=true;frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('aria-hidden','true');
  url.searchParams.set('callback','svPodcastDirectoryCallback');const nonce=String(Date.now())+Math.random().toString(36).slice(2);
  let timeout;const cleanup=()=>{clearTimeout(timeout);window.removeEventListener('message',onMessage);frame.remove()};
  const onMessage=e=>{if(e.source!==frame.contentWindow||e.data?.nonce!==nonce)return;const data=e.data.data;cleanup();if(data&&Array.isArray(data.results))resolve(data);else reject(Error('Каталог временно недоступен.'))};
  window.addEventListener('message',onMessage);timeout=setTimeout(()=>{cleanup();reject(Error('Каталог временно недоступен.'))},10000);
  const source=JSON.stringify(url.href).replace(/</g,'\\u003c'),key=JSON.stringify(nonce);
  frame.srcdoc='<script>function svPodcastDirectoryCallback(data){parent.postMessage({nonce:'+key+',data:data},"*")}var s=document.createElement("script");s.src='+source+';s.onerror=function(){parent.postMessage({nonce:'+key+',data:null},"*")};document.head.appendChild(s);<\/script>';
  document.body.append(frame)
 })
}
function countryFor(term){if(/[а-яё]/i.test(term))return 'RU';const region=(navigator.language||'').split('-')[1];return /^[A-Z]{2}$/.test(region||'')?region:'US'}
async function directoryEpisodes(meta){
 const data=await directoryRequest('lookup',{id:meta.directoryId,entity:'podcastEpisode',limit:50,country:meta.country||'RU'});
 const items=[];for(const x of (data.results||[])){const src=https(x.episodeUrl);if(x.kind!=='podcast-episode'||!src||items.some(e=>e.id===src))continue;items.push({id:src,src,title:String(x.trackName||'Выпуск').slice(0,250),date:String(x.releaseDate||'').slice(0,100)})}
 if(!items.length)throw Error('Выпуски недоступны');
 return {title:meta.title,author:meta.author||'',directoryId:meta.directoryId,country:meta.country||'RU',artwork:'',items}
}
let following=false;
async function search(term){
 term=String(term||'').trim();if(!term)return;
 const token=++searchSerial;results.hidden=false;results.replaceChildren(el('p','sv-podcast-muted','Ищу подкасты…'));
 try{
  const country=countryFor(term);const data=await directoryRequest('search',{term,media:'podcast',entity:'podcast',limit:24,country});if(token!==searchSerial)return;
  results.replaceChildren(el('h3','sv-podcast-heading','Результаты поиска'));
  const found=[];for(const x of (data.results||[])){const id=https(x.feedUrl);if(!id||found.some(f=>f.id===id))continue;found.push({id,title:String(x.collectionName||x.trackName||'Подкаст').slice(0,160),author:String(x.artistName||'').slice(0,160),directoryId:Number(x.collectionId||x.trackId)||null,country})}
  if(!found.length)results.append(el('p','sv-podcast-muted','Ничего не найдено. Попробуй другое название или тему.'));
  for(const feed of found){const row=el('div','sv-podcast-result');const subscribed=state.feeds.some(f=>f.id===feed.id);const follow=action(subscribed?'Подписан':'＋',async()=>{if(following||state.feeds.some(f=>f.id===feed.id))return;following=true;follow.disabled=true;follow.textContent='…';try{const ok=await load(feed.id,feed);follow.textContent=ok?'Подписан':'＋';follow.disabled=!!ok;if(!ok&&status.textContent&&token===searchSerial)results.append(el('p','sv-podcast-muted',status.textContent))}finally{following=false}});follow.disabled=subscribed;follow.setAttribute('aria-label',subscribed?'Уже в подписках':'Подписаться на '+feed.title);row.append(artwork(feed),copyOf(feed.title,feed.author),follow);results.append(row)}
  if(found.length)results.append(el('small','sv-podcast-directory-credit','Каталог: Apple Podcasts. Аудио — из открытых лент издателей.'));
 }catch{if(token===searchSerial)results.replaceChildren(el('p','sv-podcast-muted','Каталог временно недоступен. Попробуй ещё раз.'))}
}
searchForm.addEventListener('submit',e=>{e.preventDefault();search(searchInput.value)});
get('svPodcastTopics').addEventListener('click',e=>{const b=e.target.closest('[data-podcast-topic]');if(!b)return;openSearch();searchInput.value=b.dataset.podcastTopic;search(searchInput.value)});
document.addEventListener('seyveo:music-view',e=>{if(e.detail?.view==='podcasts')render();else{openSearch(false);if(current){audio.pause();savePosition(true)}}});
render();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();