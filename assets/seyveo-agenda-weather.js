/* SEYVEO / Sayvi Weather for the compact agenda.
   Same-origin weather feed works inside previews with connect-src 'self'.
   Weather data is refreshed upstream; the browser never fabricates temperatures. */
(()=>{
 'use strict';
 const CACHE_KEY='seyveo.agenda-weather.cache.v2';
 const LOCATION_KEY='seyveo.agenda-weather.location.v1';
 const FEED_URL='assets/seyveo-weather-krasnodar.json';
 const REFRESH_MS=75*60*1000;
 // Keep a verified forecast available through a short scheduled-feed outage.
 const STALE_MS=36*60*60*1000;
 const DEFAULT_LOCATION=Object.freeze({name:'Краснодар',latitude:45.0355,longitude:38.9753});
 let location=readLocation();
 let days=new Map();
 let station=null;
 let updatedAt=0;
 let lastAttemptAt=0;
 let inFlight=null;
 let sourcePopover=null;
 const touchWeather=window.matchMedia?.('(hover: none) and (pointer: coarse)');

 function closeSourcePopover(){
  if(!sourcePopover)return;
  sourcePopover.badge.setAttribute('aria-expanded','false');
  sourcePopover.node.remove();
  sourcePopover=null;
 }
 function toggleSourcePopover(badge){
  if(sourcePopover?.badge===badge){closeSourcePopover();return;}
  closeSourcePopover();
  const bubble=document.createElement('div');
  bubble.className='sv-agenda-weather-popover';
  bubble.setAttribute('role','dialog');
  bubble.setAttribute('aria-label','Источник прогноза погоды');
  const label=document.createElement('span');
  label.className='sv-agenda-weather-popover-label';
  label.textContent='Источник прогноза';
  const links=document.createElement('div');
  links.className='sv-agenda-weather-popover-links';
  const provider=document.createElement('a');
  provider.href='https://open-meteo.com/';
  provider.target='_blank';provider.rel='noopener noreferrer';
  provider.textContent='Open-Meteo ↗';
  const license=document.createElement('a');
  license.href='https://creativecommons.org/licenses/by/4.0/';
  license.target='_blank';license.rel='noopener noreferrer';
  license.textContent='CC BY 4.0';
  links.append(provider,license);bubble.append(label,links);
  document.body.append(bubble);
  const rect=badge.getBoundingClientRect();
  const edge=Math.max(10,window.innerWidth-rect.right);
  bubble.style.right=edge+'px';
  bubble.style.top=(rect.bottom+bubble.offsetHeight+8>window.innerHeight?
   Math.max(8,rect.top-bubble.offsetHeight-7):rect.bottom+7)+'px';
  badge.setAttribute('aria-expanded','true');
  sourcePopover={badge,node:bubble};
 }
 function enableMobileSource(badge){
  if(!touchWeather?.matches||badge.dataset.weatherSourceReady)return;
  badge.dataset.weatherSourceReady='true';
  badge.setAttribute('role','button');
  badge.setAttribute('tabindex','0');
  badge.setAttribute('aria-haspopup','dialog');
  badge.setAttribute('aria-expanded','false');
  badge.addEventListener('click',event=>{
   event.preventDefault();event.stopPropagation();toggleSourcePopover(badge);
  });
  badge.addEventListener('keydown',event=>{
   if(event.key==='Enter'||event.key===' '){
    event.preventDefault();event.stopPropagation();toggleSourcePopover(badge);
   }
  });
 }

 function enableTodayPeek(badge,heading){
  if(badge.dataset.svTodayWeatherReady)return;
  badge.dataset.svTodayWeatherReady='1';
  badge.setAttribute('role','button');
  badge.setAttribute('tabindex','0');
  badge.setAttribute('aria-haspopup','dialog');
  badge.setAttribute('aria-expanded','false');
  const activate=()=>{
   if(heading.dataset.today!=='true')return;
   window.SEYVEO_WEATHER_PEEK?.open?.({
    anchor:badge,date:heading.dataset.weatherDate,origin:'agenda'
   });
  };
  badge.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();activate();});
  badge.addEventListener('keydown',event=>{
   if(event.key==='Enter'||event.key===' '){
    event.preventDefault();event.stopPropagation();activate();
   }
  });
 }
 function validLocation(input){
  if(!input||typeof input.name!=='string'||!input.name.trim()||
    !Number.isFinite(input.latitude)||!Number.isFinite(input.longitude)||
    Math.abs(input.latitude)>90||Math.abs(input.longitude)>180)return null;
  return {name:input.name.trim().slice(0,80),latitude:input.latitude,longitude:input.longitude};
 }
 function readLocation(){
  try{return validLocation(JSON.parse(localStorage.getItem(LOCATION_KEY)))||DEFAULT_LOCATION;}
  catch(_){return DEFAULT_LOCATION;}
 }
 function locationId(loc){return loc.latitude.toFixed(4)+','+loc.longitude.toFixed(4);}
 function validStation(value){
  const current=value?.current,hourly=value?.hourly;
  return current&&Number.isFinite(current.temperature_2m)&&
   typeof current.time==='string'&&
   Array.isArray(hourly?.time)&&hourly.time.length>=24&&
   Array.isArray(hourly.temperature_2m)&&
   hourly.temperature_2m.length===hourly.time.length&&
   Array.isArray(hourly.weather_code)&&
   hourly.weather_code.length===hourly.time.length&&
   typeof hourly.time[0]==='string';
 }
 function readCache(){
  try{
   const cached=JSON.parse(localStorage.getItem(CACHE_KEY));
   if(!cached||cached.location!==locationId(location)||!Array.isArray(cached.days)||
      !Number.isFinite(cached.updatedAt)||Date.now()-cached.updatedAt>STALE_MS)return;
   days=new Map(cached.days.filter(pair=>Array.isArray(pair)&&/^\d{4}-\d{2}-\d{2}$/.test(pair[0])&&
    Number.isFinite(pair[1]?.max)&&Number.isFinite(pair[1]?.min)&&Number.isFinite(pair[1]?.code)));
   station=validStation(cached.station)?cached.station:null;
   updatedAt=cached.updatedAt;
  }catch(_){/* storage disabled or outdated */}
 }
 function saveCache(){
  try{localStorage.setItem(CACHE_KEY,JSON.stringify({location:locationId(location),updatedAt,days:[...days],station}));}
  catch(_){/* weather still works without storage */}
 }
 function condition(code){
  if(code===0)return ['sun','ясно'];
  if(code===1||code===2)return ['partly','переменная облачность'];
  if(code===3)return ['cloud','облачно'];
  if(code===45||code===48)return ['fog','туман'];
  if(code>=51&&code<=67||code>=80&&code<=82)return ['rain','дождь'];
  if(code>=71&&code<=77||code>=85&&code<=86)return ['snow','снег'];
  if(code>=95)return ['storm','гроза'];
  return ['partly','переменная облачность'];
 }
 function iconSVG(kind){
  const sun='<circle cx="8.5" cy="8.5" r="3.7" fill="#FFD34E" stroke="#EAB42A" stroke-width="1"/>'+
   '<path d="M8.5 1.6v2M8.5 13.5v2M1.6 8.5h2M13.5 8.5h2M3.6 3.6l1.5 1.5M11.9 11.9l1.5 1.5M13.4 3.6l-1.5 1.5M5.1 11.9l-1.5 1.5" stroke="#F2C13A" stroke-width="1.55" stroke-linecap="round"/>';
  const cloud='<path d="M6.7 19.1h11a4.1 4.1 0 0 0 .3-8.2 6 6 0 0 0-11.4-1.2 4.8 4.8 0 0 0 .1 9.4Z" fill="#F5F7FA" stroke="#8798A8" stroke-width="1.35" stroke-linejoin="round"/>';
  const pieces={
   sun:'<g transform="translate(3.4 3.4)">'+sun+'</g>',
   partly:sun+cloud,
   cloud:cloud,
   fog:cloud+'<path d="M4 21h15M7 23h11" stroke="#A8B4C0" stroke-width="1.4" stroke-linecap="round"/>',
   rain:cloud+'<path d="m8 21-1 2m5-2-1 2m5-2-1 2" stroke="#4D9ED8" stroke-width="1.7" stroke-linecap="round"/>',
   snow:cloud+'<path d="M8 21v2m-1-1h2m5-1v2m-1-1h2" stroke="#6EBBE9" stroke-width="1.35" stroke-linecap="round"/>',
   storm:cloud+'<path d="m13 19-2.3 3.5h2l-1 2" fill="none" stroke="#E0B42C" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  return '<svg viewBox="0 0 26 26" width="23" height="23" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">'+pieces[kind]+'</svg>';
 }
 function temperature(value){return Math.round(value)+'°';}
 /* One very small weather sign for each of the next ten calendar dates.
    These are actual day buttons in the existing 105-day horizontal rail:
    never duplicate cards, displace dates, or replace the task dots. */
 function paintDayRail(){
  const rail=document.querySelector('#tasksPage #svTasksDateNav .sv-agenda-week');
  if(!rail)return;
  const now=new Date(),wanted=new Set();
  for(let i=0;i<10;i++){
   const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,12);
   wanted.add([date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),
    String(date.getDate()).padStart(2,'0')].join('-'));
  }
  rail.querySelectorAll('.sv-agenda-day[data-day]').forEach(button=>{
   const key=button.dataset.day;
   const item=wanted.has(key)?days.get(key):null;
   let badge=button.querySelector('.sv-agenda-day-weather');
   if(!item||!Number.isFinite(item.max)||!Number.isFinite(item.code)){
    badge?.remove();
    if(button.dataset.svWeatherBaseLabel){
     button.setAttribute('aria-label',button.dataset.svWeatherBaseLabel);
     delete button.dataset.svWeatherBaseLabel;
    }
    return;
   }
   const [kind,label]=condition(item.code);
   if(!badge){
    badge=document.createElement('span');
    badge.className='sv-agenda-day-weather';
    badge.setAttribute('aria-hidden','true');
    button.append(badge);
   }
   const symbol=document.createElement('span');
   symbol.className='sv-agenda-day-weather-icon';
   symbol.innerHTML=iconSVG(kind);
   const degrees=document.createElement('small');
   degrees.className='sv-agenda-day-weather-temp';
   degrees.textContent=temperature(item.max);
   badge.replaceChildren(symbol,degrees);
   if(!button.dataset.svWeatherBaseLabel)
    button.dataset.svWeatherBaseLabel=button.getAttribute('aria-label')||'';
   button.setAttribute('aria-label',button.dataset.svWeatherBaseLabel+
    (document.documentElement.dataset.svWeatherMode==='true'?
     '. Погода: '+label+', максимум '+temperature(item.max)+', минимум '+temperature(item.min):''));
  });
 }
 function paint(){
  const list=document.querySelector('#tasksPage #personalTaskList');
  if(!list)return;
  closeSourcePopover();
  const lastUpdate=updatedAt?new Date(updatedAt).toLocaleString('ru-RU',{
   day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'
  }):'';
  list.querySelectorAll('.sv-agenda-section-heading[data-weather-date]').forEach(heading=>{
   const badge=heading.querySelector('.sv-agenda-weather');
   if(!badge)return;
   const item=days.get(heading.dataset.weatherDate);
   if(!item){badge.hidden=true;badge.replaceChildren();return;}
   const [kind,description]=condition(item.code);
   const high=document.createElement('span');high.className='sv-agenda-weather-high';high.textContent=temperature(item.max);
   const low=document.createElement('span');low.className='sv-agenda-weather-low';low.textContent='/'+temperature(item.min);
   const icon=document.createElement('span');icon.className='sv-agenda-weather-icon';icon.innerHTML=iconSVG(kind);
   badge.replaceChildren(high,low,icon);
   badge.hidden=false;
   const tooltip='Прогноз для '+location.name+': '+description+', '+temperature(item.max)+' / '+temperature(item.min)+
    (lastUpdate?' · обновлено '+lastUpdate:'')+' · данные: Open-Meteo (CC BY 4.0)';
   if(heading.dataset.today==='true'){
    badge.removeAttribute('title');
    enableTodayPeek(badge,heading);
    badge.setAttribute('aria-label','Показать карточку погоды от Сэйви. '+tooltip);
   }else{
    badge.title=tooltip;
    badge.setAttribute('aria-label',tooltip);
    badge.removeAttribute('role');
    badge.removeAttribute('tabindex');
    badge.removeAttribute('aria-haspopup');
    badge.removeAttribute('aria-expanded');
   }
  });
  list.querySelectorAll('.sv-agenda-weather-source').forEach(credit=>credit.remove());
  paintDayRail();
 }
 function parseForecast(json){
  const data=json?.daily;
  if(!Array.isArray(data?.time)||!Array.isArray(data?.temperature_2m_max)||
     !Array.isArray(data?.temperature_2m_min)||!Array.isArray(data?.weather_code))throw Error('Missing daily forecast');
  const next=new Map();
  for(let i=0;i<data.time.length;i++){
   const date=data.time[i],max=data.temperature_2m_max[i],min=data.temperature_2m_min[i],code=data.weather_code[i];
   if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(max)&&Number.isFinite(min)&&Number.isFinite(code))
    next.set(date,{max,min,code});
  }
  if(!next.size)throw Error('Empty daily forecast');
  const details={current:json?.current||null,hourly:json?.hourly||null,daily:json?.daily||null};
  return {days:next,station:validStation(details)?details:null};
 }
 async function refresh(force=false){
  if(inFlight)return inFlight;
  if(!force&&updatedAt&&Date.now()-updatedAt<REFRESH_MS){
   paint();
   // A cached forecast is still a fresh update for late-mounted Home widgets.
   window.dispatchEvent(new Event('seyveo:weather-updated'));
   return;
  }
  if(!force&&Date.now()-lastAttemptAt<60*1000){paint();return;}
  lastAttemptAt=Date.now();
  const activeLocation=location;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),9000);
  /* All browser requests remain on our origin. GitHub Actions refreshes the feed.
     A location-aware backend can replace this path once profiles are connected. */
  const configured=window.SEYVEO_WEATHER_FEED_URL;
  const feedPath=typeof configured==='string'&&configured.trim()?configured:FEED_URL;
  const url=new URL(feedPath,document.baseURI);
  inFlight=(async()=>{
   try{
    if(url.origin!==window.location.origin)throw Error('Weather feed must be same-origin');
    if(locationId(activeLocation)!==locationId(DEFAULT_LOCATION)&&!configured)
     throw Error('Weather feed is not yet configured for this city');
    const response=await fetch(url.toString(),{signal:controller.signal,credentials:'same-origin',cache:'no-store'});
    if(!response.ok)throw Error('Weather HTTP '+response.status);
    const payload=await response.json();
    const fetchedAt=Date.parse(payload.fetched_at);
    if(!Number.isFinite(fetchedAt)||Date.now()-fetchedAt>STALE_MS)
     throw Error('Weather feed is out of date');
    const fresh=parseForecast(payload);
    if(locationId(activeLocation)!==locationId(location))return;
    days=fresh.days;station=fresh.station;updatedAt=fetchedAt;saveCache();paint();
    window.dispatchEvent(new Event('seyveo:weather-updated'));
   }catch(error){
    if(!updatedAt||Date.now()-updatedAt>STALE_MS){days.clear();station=null;updatedAt=0;}
    paint();
    window.dispatchEvent(new Event('seyveo:weather-updated'));
    console.debug('SEYVEO weather refresh pending:',error?.message||String(error));
   }finally{clearTimeout(timer);inFlight=null;}
  })();
  return inFlight;
 }
 function setLocation(input){
  const next=validLocation(input);
  if(!next)return Promise.reject(new TypeError('Use a city name, latitude and longitude'));
  location=next;days.clear();station=null;updatedAt=0;lastAttemptAt=0;
  try{localStorage.setItem(LOCATION_KEY,JSON.stringify(next));}catch(_){}
  paint();
  return inFlight?inFlight.then(()=>refresh(true)):refresh(true);
 }
 function init(){
  readCache();paint();
  // Home's weather row subscribes before DOMContentLoaded, while the feed
  // cache is hydrated here. Notify it even when refresh() can return early
  // because the cached forecast is still fresh.
  window.dispatchEvent(new Event('seyveo:weather-updated'));
  refresh();
  document.addEventListener('seyveo:agenda-rendered',()=>{paint();refresh();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  document.addEventListener('pointerdown',event=>{
   if(sourcePopover&&!sourcePopover.node.contains(event.target)&&
      !sourcePopover.badge.contains(event.target))closeSourcePopover();
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSourcePopover();});
  window.addEventListener('scroll',closeSourcePopover,{capture:true,passive:true});
  window.addEventListener('resize',closeSourcePopover,{passive:true});
 }
 window.SAYVI_WEATHER=Object.freeze({
  refresh:()=>refresh(true),setLocation,
  getLocation:()=>({...location}),
  getUpdatedAt:()=>updatedAt,
  getForecast:date=>days.has(date)?{...days.get(date)}:null,
  syncRail:paintDayRail,
  getStationData:()=>station&&updatedAt&&Date.now()-updatedAt<STALE_MS?JSON.parse(JSON.stringify(station)):null
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
