/* SEYVEO / Sayvi Weather for the compact agenda.
   Live forecast only; no invented temperatures or browser location prompts.
   Open-Meteo free endpoint is for evaluation/prototyping only. */
(()=>{
 'use strict';
 const CACHE_KEY='seyveo.agenda-weather.cache.v1';
 const LOCATION_KEY='seyveo.agenda-weather.location.v1';
 const REFRESH_MS=75*60*1000;
 const STALE_MS=18*60*60*1000;
 const DEFAULT_LOCATION=Object.freeze({name:'Краснодар',latitude:45.0355,longitude:38.9753});
 let location=readLocation();
 let days=new Map();
 let updatedAt=0;
 let lastAttemptAt=0;
 let inFlight=null;

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
 function readCache(){
  try{
   const cached=JSON.parse(localStorage.getItem(CACHE_KEY));
   if(!cached||cached.location!==locationId(location)||!Array.isArray(cached.days)||
      !Number.isFinite(cached.updatedAt)||Date.now()-cached.updatedAt>STALE_MS)return;
   days=new Map(cached.days.filter(pair=>Array.isArray(pair)&&/^\d{4}-\d{2}-\d{2}$/.test(pair[0])&&
    Number.isFinite(pair[1]?.max)&&Number.isFinite(pair[1]?.min)&&Number.isFinite(pair[1]?.code)));
   updatedAt=cached.updatedAt;
  }catch(_){/* storage disabled or outdated */}
 }
 function saveCache(){
  try{localStorage.setItem(CACHE_KEY,JSON.stringify({location:locationId(location),updatedAt,days:[...days]}));}
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
 function paint(){
  const list=document.querySelector('#tasksPage #personalTaskList');
  if(!list)return;
  let visible=0;
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
   badge.title='Прогноз для '+location.name+': '+description+', '+temperature(item.max)+' / '+temperature(item.min);
   badge.setAttribute('aria-label',badge.title);
   visible++;
  });
  let credit=list.querySelector('.sv-agenda-weather-source');
  if(visible&&!credit){
   credit=document.createElement('a');
   credit.className='sv-agenda-weather-source';
   credit.href='https://open-meteo.com/';
   credit.target='_blank';credit.rel='noopener noreferrer';
   credit.textContent='Погода: Open-Meteo';
   list.append(credit);
  }else if(!visible&&credit)credit.remove();
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
  return next;
 }
 async function refresh(force=false){
  if(inFlight)return inFlight;
  if(!force&&updatedAt&&Date.now()-updatedAt<REFRESH_MS){paint();return;}
  if(!force&&Date.now()-lastAttemptAt<60*1000){paint();return;}
  lastAttemptAt=Date.now();
  const activeLocation=location;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),9000);
  const url=new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude',String(activeLocation.latitude));
  url.searchParams.set('longitude',String(activeLocation.longitude));
  url.searchParams.set('daily','weather_code,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('timezone','auto');
  url.searchParams.set('forecast_days','7');
  inFlight=(async()=>{
   try{
    const response=await fetch(url.toString(),{signal:controller.signal,mode:'cors',credentials:'omit',cache:'no-store'});
    if(!response.ok)throw Error('Weather HTTP '+response.status);
    const fresh=parseForecast(await response.json());
    if(locationId(activeLocation)!==locationId(location))return;
    days=fresh;updatedAt=Date.now();saveCache();paint();
   }catch(error){
    if(!updatedAt||Date.now()-updatedAt>STALE_MS){days.clear();updatedAt=0;}
    paint();
    console.info('SEYVEO weather temporarily unavailable:',error?.message||String(error));
   }finally{clearTimeout(timer);inFlight=null;}
  })();
  return inFlight;
 }
 function setLocation(input){
  const next=validLocation(input);
  if(!next)return Promise.reject(new TypeError('Use a city name, latitude and longitude'));
  location=next;days.clear();updatedAt=0;lastAttemptAt=0;
  try{localStorage.setItem(LOCATION_KEY,JSON.stringify(next));}catch(_){}
  paint();
  return inFlight?inFlight.then(()=>refresh(true)):refresh(true);
 }
 function init(){
  readCache();paint();refresh();
  document.addEventListener('seyveo:agenda-rendered',()=>{paint();refresh();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 }
 window.SAYVI_WEATHER=Object.freeze({
  refresh:()=>refresh(true),setLocation,
  getLocation:()=>({...location}),
  getForecast:date=>days.has(date)?{...days.get(date)}:null
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
