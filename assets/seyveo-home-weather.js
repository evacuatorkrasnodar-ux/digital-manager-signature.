/* SEYVEO · one useful daily weather note, without GPS permission.
   Approximate city is resolved from public IP by a third-party service;
   the user may override the city or turn off weather at any moment.
   No GPS, background recording, precise coordinates, or made-up forecasts. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const button=$('svHomeWeatherToggle');
const PREF='seyveo-home-weather-optin-v1';
const DISABLED='seyveo-home-weather-disabled-v2';
const CITY='seyveo-home-weather-city-v2';
const CACHE='seyveo-home-weather-daily-v1';
const day=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
let enabled=true,forecast=null,loading=false,lastError='',resolvedCity=null,abort=null;
try{enabled=localStorage.getItem(DISABLED)!=='yes'}catch{}
function savedCity(){
 try{
  const v=JSON.parse(localStorage.getItem(CITY)||'null');
  return v&&typeof v.name==='string'&&v.name.length<100&&
   Number.isFinite(v.lat)&&Math.abs(v.lat)<=90&&
   Number.isFinite(v.lon)&&Math.abs(v.lon)<=180?v:null;
 }catch{return null}
}
function readCache(){
 try{
  const value=JSON.parse(localStorage.getItem(CACHE)||'null');
  const city=savedCity();
  if(value?.day!==day()||typeof value.message!=='string'||typeof value.kind!=='string'||typeof value.city!=='string'||!value.city)return null;
  if(city&&value.city!==city.name)return null;
  return value;
 }catch{return null}
}
function notify(){updateButton();window.dispatchEvent(new Event('seyveo:home-weather-updated'))}
function updateButton(){
 if(!button)return;
 button.hidden=false;button.disabled=loading;
 button.textContent=!enabled?'Погода · включить':loading?'Узнаю погоду…':lastError?lastError:forecast?'Погода · '+forecast.city:'Выбрать город';
 button.setAttribute('aria-label',enabled?'Настроить город для погоды или выключить прогноз':'Включить погодные подсказки');
}
function currentWeather(response,city){
 const current=response?.current,daily=response?.daily;
 if(!current||!Number.isFinite(current.temperature_2m))return null;
 const temp=Math.round(current.temperature_2m),code=Number(current.weather_code);
 const chance=Number(daily?.precipitation_probability_max?.[0]);
 const wet=[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code);
 const snow=[71,73,75,77,85,86].includes(code);
 let message,kind='clear';
 if(snow){message='Сегодня снег, сейчас '+temp+'°. Одевайся теплее.';kind='snow'}
 else if(wet||(Number.isFinite(chance)&&chance>=60)){
  message=(wet?'На улице дождь.':'Сегодня возможен дождь.')+' Не забудь зонт. Сейчас '+temp+'°.';kind='rain';
 }else if(temp<=2){message='Сейчас '+temp+'°. На улице холодно, оденься теплее.';kind='cold'}
 else if(temp>=29){message='Сейчас '+temp+'°. Сегодня жарко, не забудь воду.';kind='warm'}
 else if(Number.isFinite(chance)&&chance>=35){message='Возможен дождь. Лучше взять зонт. Сейчас '+temp+'°.';kind='rain'}
 else message='Сейчас '+temp+'°. '+(temp<12?'На улице прохладно.':'Хорошего дня!');
 return {day:day(),headline:'Погода на сегодня',message,kind,city:city.name,approx:city.approx===true};
}
async function request(url,signal){
 const response=await fetch(url,{signal,cache:'no-store'});
 if(!response.ok)throw Error('weather service unavailable');
 return response.json();
}
async function discoverCity(signal){
 // Public-IP approximation does not need the iOS Location permission.
 // It may be wrong when the person uses a VPN or mobile network.
 const geo=await request('https://ipwho.is/',signal);
 if(geo?.success!==true||!Number.isFinite(geo.latitude)||!Number.isFinite(geo.longitude))throw Error('city unavailable');
 const name=String(geo.city||geo.region||geo.country||'').trim().slice(0,80);
 if(!name)throw Error('city unavailable');
 return {name,lat:Number(geo.latitude.toFixed(1)),lon:Number(geo.longitude.toFixed(1)),approx:true};
}
async function refresh(force=false){
 if(!enabled||loading||document.hidden)return !!forecast;
 if(!force){
  const cached=readCache();
  if(cached){forecast=cached;lastError='';notify();return true}
 }
 loading=true;lastError='';updateButton();
 const controller=new AbortController();abort=controller;
 const timer=setTimeout(()=>controller.abort(),12000);
 try{
  let city=savedCity()||resolvedCity;
  if(!city)city=await discoverCity(controller.signal);
  if(!enabled)return false;
  const params=new URLSearchParams({
   latitude:String(city.lat),longitude:String(city.lon),
   current:'temperature_2m,weather_code',
   daily:'precipitation_probability_max',
   timezone:'auto',forecast_days:'1'
  });
  const result=currentWeather(await request('https://api.open-meteo.com/v1/forecast?'+params,controller.signal),city);
  if(!result)throw Error('weather data unavailable');
  if(!enabled)return false;
  resolvedCity=city;forecast=result;lastError='';
  try{localStorage.setItem(CACHE,JSON.stringify(result))}catch{}
  return true;
 }catch(e){
  if(enabled){forecast=null;lastError='Указать город';}
  console.info('SEYVEO weather unavailable',e?.name||'offline');
  return false;
 }finally{clearTimeout(timer);if(abort===controller)abort=null;loading=false;notify()}
}
async function chooseCity(input){
 const name=String(input||'').trim().slice(0,100);
 if(name.length<2)return {ok:false,message:'Напиши название города.'};
 try{
  const res=await request('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name,count:'1',language:'ru'}),undefined);
  const result=res?.results?.[0];
  if(!result||!Number.isFinite(result.latitude)||!Number.isFinite(result.longitude))
   return {ok:false,message:'Не нашла этот город. Попробуй уточнить название.'};
  const city={name:result.name,lat:result.latitude,lon:result.longitude,approx:false};
  try{localStorage.setItem(CITY,JSON.stringify(city));localStorage.removeItem(CACHE)}catch{}
  resolvedCity=city;forecast=null;lastError='';
  enabled=true;
  try{localStorage.removeItem(DISABLED)}catch{}
  notify();
  const ok=await refresh(true);
  return {ok,message:ok?'Город сохранён: '+city.name:'Город сохранён. Прогноз пока недоступен.'};
 }catch{return {ok:false,message:'Не удалось проверить город. Попробуй позже.'}}
}
function enable(){
 enabled=true;lastError='';
 try{localStorage.removeItem(DISABLED)}catch{}
 notify();
 return refresh();
}
function disable(){
 enabled=false;forecast=null;lastError='';
 abort?.abort();
 try{localStorage.setItem(DISABLED,'yes');localStorage.removeItem(CACHE)}catch{}
 notify();
}
button?.addEventListener('click',()=>{
 if(typeof window.SEYVEO_PERMISSION_FLOW?.open==='function')window.SEYVEO_PERMISSION_FLOW.open('weather');
 else if(!enabled)enable();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled)refresh()});
window.addEventListener('storage',e=>{
 if(![DISABLED,CITY,CACHE].includes(e.key))return;
 try{enabled=localStorage.getItem(DISABLED)!=='yes'}catch{}
 forecast=enabled?readCache():null;resolvedCity=savedCity();notify();
 if(enabled&&!forecast)refresh();
});
resolvedCity=savedCity();
forecast=enabled?readCache():null;
window.SEYVEO_HOME_WEATHER=Object.freeze({
 today:()=>enabled?forecast:null,hasConsent:()=>enabled,enable,disable,chooseCity,
 city:()=>savedCity()?.name||forecast?.city||resolvedCity?.name||'',
 status:()=>({enabled,loading,error:lastError,approx:!!forecast?.approx})
});
notify();
if(enabled&&!forecast)refresh();
})();