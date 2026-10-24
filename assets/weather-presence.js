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
 let saved=null,latest=null,lastFetch=0,working=false,requestSerial=0,weatherError='';
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
 const cityButton=el('button','swx-weather-city-button','Выбрать город');
 cityButton.type='button';cityButton.title='Без доступа к местоположению телефона';
 const cityPanel=el('form','swx-weather-city-panel');cityPanel.hidden=true;
 cityPanel.setAttribute('aria-label','Поиск погоды по городу');
 const cityInput=el('input','swx-weather-city-input');
 cityInput.type='search';cityInput.maxLength=90;cityInput.required=true;
 cityInput.autocomplete='off';cityInput.placeholder='Например, Ереван';
 cityInput.setAttribute('aria-label','Название города');
 const citySubmit=el('button','swx-weather-city-submit','Найти');
 citySubmit.type='submit';
 const cityResults=el('div','swx-weather-city-results');
 const cityStatus=el('p','swx-weather-city-status');
 cityStatus.setAttribute('role','status');cityStatus.setAttribute('aria-live','polite');
 cityPanel.append(cityInput,citySubmit,cityResults,cityStatus);
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
 const place=el('button','swx-weather-place','Изменить город');place.type='button';
 const off=el('button','swx-weather-off','Отключить');off.type='button';
 // Attribution is always visible whenever provider data is shown.
 body.append(attribution);
 tail.append(place,off);
 const options=el('button','swx-weather-options','Настройки погоды');
 options.type='button';options.hidden=true;
 line.append(enable,cityButton,cityPanel,body,note,options,tail);
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
    return {lat:obj.lat,lon:obj.lon,label:typeof obj.label==='string'?obj.label.slice(0,160):''};
  }catch{}
  return null;
 }
 function save(place){
  if(!place){try{localStorage.removeItem(KEY)}catch{}return true}
  try{localStorage.setItem(KEY,JSON.stringify({enabled:true,lat:place.lat,lon:place.lon,label:String(place.label||'').slice(0,160)}));return true}
  catch{return false}
 }
 function layout(){
  const active=!!saved;
  enable.hidden=active;cityButton.hidden=active;body.hidden=!active;options.hidden=!active;
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
   const clock=/T(\d{2}:\d{2})/.exec(latest.observedAt)?.[1];
   main.textContent=(saved.label?saved.label+' · ':'')+core.detail(latest)+(clock?' · '+clock:'');
   symbol.textContent=latest.code===0?'☼':[61,63,65,80,81,82].includes(latest.code)?'◌':'☁';
  }else{
   main.textContent=(saved.label?saved.label+' · ':'')+
    (weatherError||'Прогноз пока недоступен');
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
   latest=data;lastFetch=Date.now();weatherError='';
   render();
  }catch(error){
   if(version!==requestSerial||!saved)return;
   // Never present stale weather as current, and explain a network failure.
   weatherError=error?.name==='AbortError'?'Превышено время ожидания погоды':
    'Нет связи с погодным сервисом. Попробуйте обновить.';
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
   saved=rounded;weatherError='';latest=null;lastFetch=0;cityPanel.hidden=true;layout();render();update(true);
  },()=>{
   enable.disabled=false;
   enable.textContent='Геолокация недоступна — выберите город';
   cityPanel.hidden=false;cityInput.focus({preventScroll:true});
  },{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
 }
 function openCityPicker(){
  cityPanel.hidden=!cityPanel.hidden;
  if(!cityPanel.hidden){cityStatus.textContent='';cityInput.focus({preventScroll:true})}
 }
 cityButton.addEventListener('click',openCityPicker);
 cityPanel.addEventListener('submit',async event=>{
  event.preventDefault();
  cityResults.replaceChildren();
  cityStatus.textContent='Ищу город…';
  citySubmit.disabled=true;
  const controller=new AbortController();
  const kill=setTimeout(()=>controller.abort(),9000);
  try{
   const places=await provider.findCities(cityInput.value,{signal:controller.signal});
   if(!places.length){cityStatus.textContent='Город не найден. Уточните название или страну.';return}
   cityStatus.textContent='Выберите город из списка:';
   for(const candidate of places){
    const button=el('button','swx-weather-city-result',candidate.label);
    button.type='button';
    button.addEventListener('click',()=>{
     const next={lat:candidate.lat,lon:candidate.lon,label:candidate.label};
     if(!save(next)){cityStatus.textContent='Не удалось сохранить выбор на устройстве';return}
     requestSerial++;saved=next;latest=null;lastFetch=0;weatherError='';
     cityPanel.hidden=true;cityResults.replaceChildren();
     layout();render();update(true);
    });
    cityResults.append(button);
   }
  }catch(error){
   cityStatus.textContent=error?.name==='AbortError'
    ?'Поиск города не отвечает. Попробуйте ещё раз.'
    :'Не получилось найти город через интернет. Проверьте соединение.';
  }finally{clearTimeout(kill);citySubmit.disabled=false}
 });
 enable.addEventListener('click',requestLocation);
 refresh.addEventListener('click',()=>update(true));
 place.addEventListener('click',()=>{tail.hidden=true;cityPanel.hidden=false;cityInput.focus({preventScroll:true})});
 off.addEventListener('click',()=>{
  requestSerial++;saved=null;latest=null;lastFetch=0;weatherError='';save(null);
  cityPanel.hidden=true;cityResults.replaceChildren();
  enable.textContent='Показать погоду';layout();showHealth();
 });
 options.addEventListener('click',()=>{tail.hidden=!tail.hidden});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});
 window.addEventListener('online',()=>update());
 window.setInterval(()=>{if(!document.hidden)update()},INTERVAL);
 window.addEventListener('storage',event=>{
  if(event.key!==KEY)return;
  requestSerial++;saved=read();latest=null;lastFetch=0;weatherError='';
  cityPanel.hidden=true;layout();showHealth();if(saved)update(true);
 });
 saved=read();layout();
 if(saved){render();update(true)}
 // Expose read-only state for integration tests and future native adapters.
 window.SEYVEO_WEATHER=Object.freeze({
  refresh:()=>update(true),snapshot:()=>latest,
  enabled:()=>!!saved
 });
})();
