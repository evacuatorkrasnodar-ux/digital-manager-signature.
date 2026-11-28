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
return {title:title.slice(0,160),items};
}
function storeFeed(id,data){
const existing=state.feeds.find(f=>f.id===id);
if(existing){const merged=new Map(existing.items.map(e=>[e.id,e]));for(const e of data.items)merged.set(e.id,e);existing.items=[...data.items,...[...merged.values()].filter(e=>!data.items.some(x=>x.id===e.id))].slice(0,150);existing.title=data.title;existing.updated=Date.now()}
else{if(state.feeds.length>=30)throw Error('Достигнут предел подписок.');state.feeds.unshift({id,...data,updated:Date.now()})}
selected=id;persist();render();
}
async function load(url){
const id=https(url);if(!id){say('Вставь HTTPS-ссылку на RSS подкаста.');return}
const token=++loadToken;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
say('Загружаю выпуски…');get('svPodcastAdd').disabled=true;
try{const res=await fetch(id,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!res.ok)throw Error('Лента недоступна.');const xml=await res.text();if(xml.length>3000000)throw Error('Лента слишком большая.');if(token!==loadToken)return;storeFeed(id,parse(xml,res.url||id));input.value='';say('')}
catch(e){if(token===loadToken)say(e.message==='Failed to fetch'||e.name==='AbortError'||e instanceof TypeError?'Сайт не разрешает загрузить ленту из приложения. Можно добавить скачанный RSS-файл.':e.message||'Не удалось загрузить ленту.')}
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
audio.addEventListener('timeupdate',()=>savePosition());audio.addEventListener('pause',()=>{savePosition(true);renderEpisodes()});audio.addEventListener('ended',()=>{savePosition(true);renderEpisodes()});audio.addEventListener('error',()=>say('Выпуск сейчас недоступен.'));
get('svPodcastSpeed').addEventListener('change',e=>{state.speed=Number(e.target.value)||1;audio.playbackRate=state.speed;persist()});
get('svPodcastSleep').addEventListener('change',e=>{clearTimeout(sleepTimer);const minutes=Number(e.target.value);if(minutes>0)sleepTimer=setTimeout(()=>{audio.pause();get('svPodcastSleep').value='0';say('Таймер сна завершён.')},minutes*60000)});
window.addEventListener('pagehide',()=>savePosition(true));
function renderEpisodes(){
episodes.replaceChildren();const feed=state.feeds.find(f=>f.id===selected);if(!feed)return;
episodes.append(el('h3','sv-podcast-heading',feed.title));
for(const ep of feed.items){
const row=el('div','sv-podcast-episode'),copy=button(ep.title,()=>play(feed,ep));copy.className='sv-podcast-episode-title';
const pos=state.progress[ep.id],date=Date.parse(ep.date),meta=el('small','',[(Number.isFinite(date)?new Date(date).toLocaleDateString('ru-RU'):''),pos?.finished?'Прослушано':pos?.position>0?'Продолжить · '+duration(pos.position):''].filter(Boolean).join(' · '));
const heart=button(state.favorites[ep.id]?'♥':'♡',()=>{if(state.favorites[ep.id])delete state.favorites[ep.id];else state.favorites[ep.id]=true;persist();renderEpisodes()});heart.className='sv-podcast-heart';heart.setAttribute('aria-label',state.favorites[ep.id]?'Убрать из избранного':'В избранное');heart.setAttribute('aria-pressed',String(!!state.favorites[ep.id]));
const body=el('div','sv-podcast-episode-copy');body.append(copy,meta);row.append(body,heart);episodes.append(row);
}
}
function render(){
list.replaceChildren();if(!state.feeds.some(f=>f.id===selected))selected=state.feeds[0]?.id||null;
const resume=get('svPodcastResume');resume.replaceChildren();const lastFeed=state.feeds.find(f=>f.id===state.last?.feed),lastEp=lastFeed?.items.find(e=>e.id===state.last?.id),pos=lastEp&&state.progress[lastEp.id];
if(lastEp&&pos?.position>0&&!pos.finished){const b=button('Продолжить · '+lastEp.title,()=>{selected=lastFeed.id;render();play(lastFeed,lastEp)});b.classList.add('sv-podcast-resume');resume.append(b)}
for(const feed of state.feeds){const row=el('div','sv-podcast-feed');const title=button(feed.title,()=>{selected=feed.id;render()});title.classList.toggle('is-selected',feed.id===selected);title.setAttribute('aria-pressed',String(feed.id===selected));row.append(title);if(https(feed.id)){const refresh=button('↻',()=>load(feed.id));refresh.setAttribute('aria-label','Обновить выпуски');row.append(refresh)}const remove=button('×',()=>{if(!confirm('Убрать подписку «'+feed.title+'»?'))return;if(current?.feed===feed.id){audio.pause();audio.removeAttribute('src');audio.load();current=null;player.hidden=true}state.feeds=state.feeds.filter(f=>f.id!==feed.id);persist();render()});remove.setAttribute('aria-label','Удалить подписку');row.append(remove);list.append(row)}
if(!state.feeds.length)list.append(el('p','sv-podcast-muted','Добавь любимый подкаст — новые выпуски будут здесь.'));
renderEpisodes();
}
document.addEventListener('seyveo:music-view',e=>{if(e.detail?.view==='podcasts')render();else if(current){audio.pause();savePosition(true)}});
render();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();