/* SEYVEO Home · quiet daily weather intelligence.
   No location access before explicit opt-in. Never fabricates weather data.
   Forecast text is cached per local date, not precise coordinates. */
(()=>{
'use strict';
const PREF='seyveo-home-weather-optin-v1';
const CACHE='seyveo-home-weather-daily-v1';
const $=id=>document.getElementById(id);
const button=$('svHomeWeatherToggle');
const day=()=>{const now=new Date();return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')};
let enabled=false,forecast=null,loading=false;
try{enabled=localStorage.getItem(PREF)==='yes'}catch{}
function readCache(){
 try{
  const value=JSON.parse(localStorage.getItem(CACHE)||'null');
  return value?.day===day()&&typeof value.message==='string'&&typeof value.headline==='string'&&
   typeof value.kind==='string'?value:null;
 }catch{return null}
}
function announce(){
 window.dispatchEvent(new Event('seyveo:home-weather-updated'));
 updateButton();
}
function updateButton(){
 if(!button)return;
 button.hidden=false;
 button.textContent=enabled?'Погода · выключить':'Добавить погоду';
 button.setAttribute('aria-label',enabled?'Отключить подсказки о погоде':'Включить подсказку о погоде на главной');
}
function currentWeather(response){
 const current=response?.current,daily=response?.daily;
 if(!current||!Number.isFinite(current.temperature_2m))return null;
 const temp=Math.round(current.temperature_2m),code=Number(current.weather_code);
 const rainChance=Number(daily?.precipitation_probability_max?.[0]);
 const rainy=[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code);
 const snowy=[71,73,75,77,85,86].includes(code);
 let headline='Погода на сегодня',message='',kind='clear';
 if(snowy){message='На улице снег, сейчас '+temp+'°. Одевайся теплее и будь осторожнее на дороге.';kind='snow'}
 else if(rainy||(Number.isFinite(rainChance)&&rainChance>=60)){
  message=(rainy?'На улице дождь.':'Сегодня возможен дождь.')+' Не забудь зонт. Сейчас '+temp+'°.';kind='rain';
 }else if(temp<=2){message='Сейчас '+temp+'°. На улице холодно, оденься теплее.';kind='cold'}
 else if(temp>=29){message='Сейчас '+temp+'°. Сегодня жарко, не забудь воду.';kind='warm'}
 else if(Number.isFinite(rainChance)&&rainChance>=35){
  message='Возможен дождь, лучше взять зонт. Сейчас '+temp+'°.';kind='rain';
 }else{message='Сейчас '+temp+'°. '+(temp<12?'На улице прохладно.':'Хорошего тебе дня!')}
 return {day:day(),headline,message,kind};
}
async function refresh(){
 if(!enabled||loading||document.hidden)return;
 const cached=readCache();
 if(cached){forecast=cached;announce();return}
 if(!navigator.geolocation){forecast=null;announce();return}
 loading=true;updateButton();
 try{
  const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{
   enableHighAccuracy:false,maximumAge:3600000,timeout:12000
  }));
  if(!enabled)return;
  // Coarse coordinates are used only for this weather request; never stored.
  const lat=Number(position.coords.latitude.toFixed(1));
  const lon=Number(position.coords.longitude.toFixed(1));
  const params=new URLSearchParams({
   latitude:String(lat),longitude:String(lon),
   current:'temperature_2m,weather_code',
   daily:'precipitation_probability_max',
   timezone:'auto',forecast_days:'1'
  });
  const controller=new AbortController();
  const stop=setTimeout(()=>controller.abort(),9500);
  let response;
  try{response=await fetch('https://api.open-meteo.com/v1/forecast?'+params,{signal:controller.signal,cache:'no-store'})}
  finally{clearTimeout(stop)}
  if(!response.ok)throw Error('forecast service unavailable');
  const result=currentWeather(await response.json());
  if(!result)throw Error('invalid weather');
  if(!enabled)return;
  forecast=result;
  try{localStorage.setItem(CACHE,JSON.stringify(result))}catch{}
 }catch(error){
  forecast=null;
  // Silent failure: the calm Home is always usable without weather.
  console.info('SEYVEO weather unavailable',error?.name||'offline');
 }finally{loading=false;announce()}
}
if(button)button.addEventListener('click',()=>{
 if(enabled){
  enabled=false;forecast=null;
  try{localStorage.removeItem(PREF);localStorage.removeItem(CACHE)}catch{}
  announce();return;
 }
 const consent=window.confirm('Сэйви может раз в день показывать погоду и полезный совет. Для этого нужно разрешить примерное местоположение. Оно будет использовано для запроса прогноза, но не сохранится. Включить?');
 if(!consent)return;
 enabled=true;
 try{localStorage.setItem(PREF,'yes')}catch{}
 refresh();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled)refresh()});
window.addEventListener('storage',e=>{
 if(e.key!==PREF&&e.key!==CACHE)return;
 try{enabled=localStorage.getItem(PREF)==='yes'}catch{}
 forecast=enabled?readCache():null;
 announce();
 if(enabled&&!forecast)refresh();
});
forecast=enabled?readCache():null;
window.SEYVEO_HOME_WEATHER=Object.freeze({today:()=>enabled?forecast:null,hasConsent:()=>enabled});
updateButton();
if(enabled&&!forecast)refresh();
else if(forecast)announce();
})();