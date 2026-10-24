/* SEYVEO Weather transport v1 · PWA evaluation adapter, no keys or trackers.
 * Open-Meteo FREE API is for non-commercial evaluation/prototyping only.
 * Production SEYVEO must use a licensed commercial endpoint or another
 * contract-backed provider. Do not silently ship this as a paid service. */
(function(host,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(host)host.SEYVEO_WEATHER_PROVIDER=Object.freeze(api);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const base='https://api.open-meteo.com/v1/forecast';
 const qualified=x=>typeof x==='number'&&Number.isFinite(x);
 function urlFor(lat,lon){
  if(!qualified(lat)||!qualified(lon)||Math.abs(lat)>90||Math.abs(lon)>180)
   throw new RangeError('Weather location must be valid latitude and longitude');
  const query=new URLSearchParams({
   latitude:String(Math.round(lat*10)/10),
   longitude:String(Math.round(lon*10)/10),
   current:'temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,weather_code,wind_speed_10m',
   hourly:'precipitation_probability',
   timezone:'auto',wind_speed_unit:'kmh',forecast_days:'1'
  });
  return base+'?'+query.toString();
 }
 async function forecast(lat,lon,{fetchImpl,signal}={}){
  const request=fetchImpl||(typeof fetch==='function'?fetch:null);
  if(typeof request!=='function')throw new Error('В этом устройстве нет доступа к погодной сети');
  const res=await request(urlFor(lat,lon),{method:'GET',cache:'no-store',signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!res||!res.ok)throw new Error('Не удалось получить проверенный прогноз');
  const data=await res.json();
  if(!data||typeof data!=='object'||data.error)throw new Error('Погодный сервис не ответил');
  return data;
 }
 return {urlFor,forecast,
  attribution:'Weather data by Open-Meteo.com (CC BY 4.0)',
  attributionUrl:'https://open-meteo.com/'
 };
});
