/* SEYVEO WEATHER · pure input validation, weather text and cautious health context.
 * No browser permissions, DOM, networking or personal health records here.
 * Never predict a person's blood pressure from weather or offer drug advice. */
(function(host,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(host)host.SEYVEO_WEATHER_CORE=Object.freeze(api);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const within=(x,lo,hi)=>finite(x)&&x>=lo&&x<=hi?x:null;
 const round=x=>Math.round(x);
 function label(code){
  if(code===0)return 'ясно';
  if([1,2].includes(code))return 'переменная облачность';
  if(code===3)return 'облачно';
  if([45,48].includes(code))return 'туман';
  if([51,53,55,56,57].includes(code))return 'морось';
  if([61,63,65,66,67,80,81,82].includes(code))return 'дождь';
  if([71,73,75,77,85,86].includes(code))return 'снег';
  if([95,96,99].includes(code))return 'гроза';
  return 'условия уточняются';
 }
 function parse(payload){
  const c=payload&&typeof payload==='object'?payload.current:null;
  if(!c||!finite(c.temperature_2m)||typeof c.time!=='string')return null;
  const temp=within(c.temperature_2m,-95,65);
  if(temp===null)return null;
  const apparent=within(c.apparent_temperature,-105,75);
  const humidity=within(c.relative_humidity_2m,0,100);
  const pressure=within(c.pressure_msl,850,1100);
  const wind=within(c.wind_speed_10m,0,240);
  const code=Number.isInteger(c.weather_code)?c.weather_code:null;
  const hourly=payload.hourly&&typeof payload.hourly==='object'?payload.hourly:null;
  let rainChance=null;
  if(Array.isArray(hourly?.time)&&Array.isArray(hourly?.precipitation_probability)){
   const probs=hourly.time.flatMap((time,i)=>
    typeof time==='string'&&time>=c.time.slice(0,13)&&time.slice(0,10)===c.time.slice(0,10)
    &&time<=c.time.slice(0,13)+':59'
     ?[hourly.precipitation_probability[i]]:[]);
   // If the forecast grid starts at a whole hour, include the next 4 h instead.
   const start=hourly.time.findIndex(time=>typeof time==='string'&&time>=c.time.slice(0,13));
   const candidates=start>=0?hourly.precipitation_probability.slice(start,start+4):probs;
   const valid=candidates.filter(x=>within(x,0,100)!==null);
   if(valid.length)rainChance=Math.max(...valid);
  }
  return Object.freeze({
   temp:round(temp),apparent:apparent===null?null:round(apparent),
   pressure:pressure===null?null:round(pressure),
   humidity:humidity===null?null:round(humidity),
   wind:wind===null?null:round(wind),
   code,conditions:label(code),rainChance,
   observedAt:c.time, // provider-local time, not a real-world measurement claim
   units:'°C · гПа · км/ч',
   source:'Open-Meteo · Best Match',sourceId:'open-meteo-demo'
  });
 }
 function signal(weather){
  if(!weather)return null;
  const feel=weather.apparent??weather.temp;
  // Conservative informational thresholds, not individual medical predictions.
  if(weather.temp>=32||feel>=36){
   return Object.freeze({kind:'heat',severity:'attention',
    title:'Сильная жара',
    home:'Жара может влиять на самочувствие. Берегите себя и избегайте перегрева.',
    health:'Жара может сопровождаться снижением давления или слабостью. Ориентируйтесь на самочувствие и фактические измерения; не меняйте лечение самостоятельно.'});
  }
  if(weather.temp<=-10||feel<=-15){
   return Object.freeze({kind:'cold',severity:'attention',
    title:'Сильный холод',
    home:'Сильный холод увеличивает нагрузку на организм. Одевайтесь тепло.',
    health:'Холод может повышать артериальное давление у некоторых людей. Измеряйте давление, если это рекомендовано врачом; по погоде его значение определить нельзя.'});
  }
  if(weather.wind!==null&&weather.wind>=65){
   return Object.freeze({kind:'wind',severity:'attention',
    title:'Сильный ветер',home:'На улице сильный ветер. Будьте осторожны.',
    health:'При сильном ветре и холоде важно избегать переохлаждения. Показатели давления определяются только измерением.'});
  }
  return null;
 }
 const detail=w=>{
  if(!w)return '';
  const pieces=[w.temp+'°',w.conditions];
  if(w.pressure!==null)pieces.push('атм. давление '+w.pressure+' гПа');
  if(w.rainChance!==null&&w.rainChance>=70)pieces.push('осадки до '+w.rainChance+'%');
  return pieces.join(' · ');
 };
 return {parse,signal,detail,label};
});
