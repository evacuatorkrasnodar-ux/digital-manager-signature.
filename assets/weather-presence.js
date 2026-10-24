/* SEYVEO Weather · ONE open-ink presence on the existing Home + Health hint.
 * Starts only from user permission. Thereafter refreshes itself when visible.
 * No automatic geolocation prompt, hidden background tracking, fake local weather
 * or guesses about the user's individual blood pressure. */
(()=>{
 'use strict';
 const core=window.SEYVEO_WEATHER_CORE;
 const provider=window.SEYVEO_WEATHER_PROVIDER;
 const home=document.getElementById('homePage');
 const stage=document.getElementById('stage');
 if(!core||!provider||!home||!stage||document.getElementById('seyveoWeatherInk'))return;
 const KEY='seyveo-weather-location-v1';
 const INTERVAL=45*60*1000;
 let saved=null,latest=null,lastFetch=0,working=false,requestSerial=0;
 const el=(tag,cls,text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;
  return node;
 };
 const line=el('section','swx-weather');
 line.id='seyveoWeatherInk';line.setAttribute('aria-label','Погода Сэйви');
 const enable=el('button','swx-weather-enable','Показать погоду');
 enable.id='seyveoWeatherEnable';enable.type='button';
 enable.title='Только с разрешения: приблизительное местоположение, затем автоматические обновления';
 const body=el('div','swx-weather-content');body.hidden=true;
 const symbol=el('span','swx-weather-symbol','☼');symbol.setAttribute('aria-hidden','true');
 const main=el('span','swx-weather-main');main.id='seyveoWeatherMain';
 main.setAttribute('role','status');main.setAttribute('aria-live','polite');
 const refresh=el('button','swx-weather-refresh','↻');refresh.type='button';
 refresh.setAttribute('aria-label','Обновить прогноз');refresh.title='Обновить прогноз';
 body.append(symbol,main,refresh);
 const note=el('p','swx-weather-health');note.id='seyveoWeatherHealth';note.hidden=true;
 const tail=el('div','swx-weather-tail');tail.hidden=true;
 const attribution=el('a','swx-weather-source','Open-Meteo · прогноз');
 attribution.href=provider.attributionUrl;attribution.target='_blank';attribution.rel='noopener noreferrer';
 const place=el('button','swx-weather-place','Уточнить место');place.type='button';
 const off=el('button','swx-weather-off','Отключить');off.type='button';
 tail.append(attribution,place,off);
 const options=el('button','swx-weather-options','Настройки погоды');
 options.type='button';options.hidden=true;
 line.append(enable,body,note,options,tail);
 stage.insertAdjacentElement('afterend',line);
 // Health/Care markup exists already, but weather advice must remain distinct
 // from personal readings, prescriptions and any diagnosis.
 const healthHost=document.getElementById('pwHealth');
 const healthLine=healthHost?el('p','swx-weather-in-health'):null;
 if(healthLine){
  healthLine.id='seyveoWeatherHealthContext';
  healthLine.hidden=true;healthHost.prepend(healthLine);
 }
 function read(){
  try{
   const obj=JSON.parse(localStorage.getItem(KEY)||'null');
   if(obj?.enabled===true&&Number.isFinite(obj.lat)&&Number.isFinite(obj.lon)
      &&Math.abs(obj.lat)<=90&&Math.abs(obj.lon)<=180)
    return {lat:obj.lat,lon:obj.lon};
  }catch{}
  return null;
 }
 function save(place){
  if(!place){try{localStorage.removeItem(KEY)}catch{}return true}
  try{localStorage.setItem(KEY,JSON.stringify({enabled:true,lat:place.lat,lon:place.lon}));return true}
  catch{return false}
 }
 function layout(){
  const active=!!saved;
  enable.hidden=active;body.hidden=!active;options.hidden=!active;
  if(!active){note.hidden=true;tail.hidden=true;}
 }
 function showHealth(){
  const health=core.signal(latest);
  note.hidden=!health;
  if(health)note.textContent=health.home;
  if(healthLine){
   healthLine.hidden=!health;
   healthLine.textContent=health?'Погода · '+health.title+'. '+health.health:'';
  }
 }
 function render(){
  if(!saved)return;
  if(latest){
   main.textContent='Сэйви · '+core.detail(latest);
   symbol.textContent=latest.code===0?'☼':[61,63,65,80,81,82].includes(latest.code)?'◌':'☁';
  }else{
   main.textContent='Сэйви · прогноз пока недоступен';
   symbol.textContent='◌';
  }
  showHealth();
 }
 async function update(force=false){
  if(!saved||working||document.hidden)return;
  if(!force&&latest&&Date.now()-lastFetch<INTERVAL)return;
  working=true;const version=++requestSerial;
  refresh.disabled=true;
  if(!latest)main.textContent='Сэйви узнаёт погоду…';
  const controller=new AbortController();
  const kill=setTimeout(()=>controller.abort(),9500);
  try{
   const json=await provider.forecast(saved.lat,saved.lon,{signal:controller.signal});
   if(version!==requestSerial||!saved)return;
   const data=core.parse(json);
   if(!data)throw new Error('Неполные погодные данные');
   latest=data;lastFetch=Date.now();
   render();
  }catch{
   if(version!==requestSerial||!saved)return;
   // Never present stale weather as current.
   latest=null;lastFetch=0;render();
  }finally{
   clearTimeout(kill);working=false;refresh.disabled=false;
  }
 }
 function requestLocation(){
  if(!navigator.geolocation){
   enable.textContent='Геолокация недоступна';return;
  }
  enable.disabled=true;
  const old=enable.textContent;
  enable.textContent='Разрешение на погоду…';
  navigator.geolocation.getCurrentPosition(pos=>{
   enable.disabled=false;enable.textContent=old;
   // Approximately 1 km. Exact GPS coordinates are neither stored nor sent.
   const lat=Math.round(pos.coords.latitude*100)/100;
   const lon=Math.round(pos.coords.longitude*100)/100;
   if(!Number.isFinite(lat)||!Number.isFinite(lon))return;
   const rounded={lat,lon};
   if(!save(rounded)){enable.textContent='Не удалось сохранить выбор';return;}
   saved=rounded;latest=null;lastFetch=0;layout();render();update(true);
  },()=>{
   enable.disabled=false;
   enable.textContent='Погода · нужно разрешение на местоположение';
  },{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
 }
 enable.addEventListener('click',requestLocation);
 refresh.addEventListener('click',()=>update(true));
 place.addEventListener('click',()=>{tail.hidden=true;requestLocation()});
 off.addEventListener('click',()=>{
  requestSerial++;saved=null;latest=null;lastFetch=0;save(null);
  enable.textContent='Показать погоду';layout();showHealth();
 });
 options.addEventListener('click',()=>{tail.hidden=!tail.hidden});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});
 window.addEventListener('online',()=>update());
 window.setInterval(()=>{if(!document.hidden)update()},INTERVAL);
 window.addEventListener('storage',event=>{
  if(event.key!==KEY)return;
  requestSerial++;saved=read();latest=null;lastFetch=0;
  layout();showHealth();if(saved)update(true);
 });
 saved=read();layout();
 if(saved){render();update(true)}
 // Expose read-only state for integration tests and future native adapters.
 window.SEYVEO_WEATHER=Object.freeze({
  refresh:()=>update(true),snapshot:()=>latest,
  enabled:()=>!!saved
 });
})();
