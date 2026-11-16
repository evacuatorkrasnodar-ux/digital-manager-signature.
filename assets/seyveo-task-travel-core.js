/* SEYVEO · verified travel arithmetic and links. No estimated durations fabricated. */
((root)=>{
 'use strict';
 const modes=new Set(['driving','transit','walking','taxi']);
 function point(value){
  const lat=Number(value?.lat),lon=Number(value?.lon);
  return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180?{lat,lon}:null;
 }
 function clean(value){
  if(!value||!modes.has(value.mode)||!Number.isInteger(value.minutes)||value.minutes<1||value.minutes>600)return null;
  const buffer=Number(value.bufferMinutes);
  if(!Number.isInteger(buffer)||buffer<0||buffer>90)return null;
  const source=['yandex','2gis','manual'].includes(value.source)?value.source:'manual';
  return {mode:value.mode,minutes:value.minutes,bufferMinutes:buffer,source};
 }
 function departure(due,time,travel){
  const safe=clean(travel);
  if(!safe||!/^\d{4}-\d{2}-\d{2}$/.test(due||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time||''))return null;
  const target=new Date(due+'T'+time+':00');
  if(!Number.isFinite(target.getTime())||target.getFullYear()!==Number(due.slice(0,4))||target.getMonth()+1!==Number(due.slice(5,7))||target.getDate()!==Number(due.slice(8,10)))return null;
  const leave=new Date(target.getTime()-(safe.minutes+safe.bufferMinutes)*60000);
  return {at:leave.getTime(),time:leave.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',hour12:false}),minutes:safe.minutes+safe.bufferMinutes};
 }
 function directionsURL(destination,origin,mode='driving'){
  const to=point(destination),from=point(origin);
  if(!to)return '';
  const u=new URL('https://www.google.com/maps/dir/');
  u.searchParams.set('api','1');
  u.searchParams.set('destination',to.lat+','+to.lon);
  if(from)u.searchParams.set('origin',from.lat+','+from.lon);
  u.searchParams.set('travelmode',mode==='transit'?'transit':mode==='walking'?'walking':'driving');
  return u.toString();
 }
 function taxiURL(destination,origin){
  const to=point(destination),from=point(origin);
  if(!to)return '';
  const u=new URL('https://3.redirect.appmetrica.yandex.com/route');
  u.searchParams.set('end-lat',String(to.lat));u.searchParams.set('end-lon',String(to.lon));
  if(from){u.searchParams.set('start-lat',String(from.lat));u.searchParams.set('start-lon',String(from.lon))}
  u.searchParams.set('ref','seyveo');u.searchParams.set('appmetrica_tracking_id','25395763362139037');
  u.searchParams.set('lang','ru');
  return u.toString();
 }
 const api=Object.freeze({point,clean,departure,directionsURL,taxiURL});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SEYVEO_TASK_TRAVEL_CORE=api;
})(typeof window!=='undefined'?window:null);
