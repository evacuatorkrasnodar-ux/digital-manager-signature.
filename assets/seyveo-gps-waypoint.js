/* SEYVEO · GPS waypoint prototype. Local only, explicit user gesture.
   Straight-line bearing, NOT a route or emergency navigation system. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const save=$('svWaypointSave'),check=$('svWaypointCheck'),list=$('svWaypointSaved'),status=$('svWaypointStatus');
if(!save||!check||!list||!status)return;
const KEY='seyveo-gps-waypoints-v1',MAX=8;
let busy=false,revision=0;
const good=p=>p&&typeof p.name==='string'&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lon)&&Math.abs(p.lon)<=180;
function read(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(good).slice(0,MAX):[]}catch{return []}}
let points=read();
function persist(){try{localStorage.setItem(KEY,JSON.stringify(points));return true}catch{return false}}
function render(){
 list.replaceChildren();
 if(!points.length){const p=document.createElement('p');p.className='sv-waypoint-empty';p.textContent='Сохранённых точек пока нет.';list.append(p);return}
 for(const p of points){
  const row=document.createElement('div');row.className='sv-waypoint-row';
  const info=document.createElement('div'),label=document.createElement('strong'),coords=document.createElement('small');
  label.textContent=p.name;
  coords.textContent=p.lat.toFixed(5)+', '+p.lon.toFixed(5);
  info.append(label,coords);
  const del=document.createElement('button');del.type='button';del.textContent='Удалить';del.setAttribute('aria-label','Удалить точку '+p.name);
  del.addEventListener('click',()=>{const next=points.filter(v=>v.id!==p.id);const old=points;points=next;if(!persist()){points=old;status.textContent='Не удалось удалить точку из хранилища.'}else{status.textContent='Точка удалена.';render()}});
  row.append(info,del);list.append(row);
 }
}
const radians=v=>v*Math.PI/180;
function calculate(a,b){
 const dLat=radians(b.lat-a.lat),dLon=radians(b.lon-a.lon),lat1=radians(a.lat),lat2=radians(b.lat);
 const t=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
 const meters=6371000*2*Math.atan2(Math.sqrt(t),Math.sqrt(Math.max(0,1-t)));
 const y=Math.sin(dLon)*Math.cos(lat2);
 const x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
 const bearing=(Math.atan2(y,x)*180/Math.PI+360)%360;
 return {meters,bearing};
}
const cardinal=d=>['север','северо-восток','восток','юго-восток','юг','юго-запад','запад','северо-запад'][Math.round(d/45)%8];
function position(){
 return new Promise((resolve,reject)=>{
  if(!window.isSecureContext||!navigator.geolocation){reject(new Error('Для определения координат нужен HTTPS и поддержка геолокации.'));return}
  navigator.geolocation.getCurrentPosition(p=>{
   const {latitude,longitude,accuracy}=p.coords;
   if(![latitude,longitude,accuracy].every(Number.isFinite)||accuracy<0){reject(new Error('Телефон вернул некорректные координаты.'));return}
   resolve({lat:latitude,lon:longitude,accuracy});
  },error=>{
   reject(new Error(error.code===1?'Доступ к местоположению запрещён. Разреши его в настройках браузера.':error.code===2?'Не удалось определить координаты. Проверь настройки геолокации.':'GPS не ответил вовремя. Попробуй на открытом месте.'));
  },{enableHighAccuracy:true,timeout:15000,maximumAge:0});
 });
}
async function execute(kind){
 if(busy)return;
 if(kind==='save'&&points.length>=MAX){status.textContent='Максимум восемь точек. Сначала удали ненужную.';return}
 if(kind==='check'&&!points.length){status.textContent='Сначала сохрани хотя бы одну точку.';return}
 busy=true;const token=++revision;save.disabled=check.disabled=true;
 status.textContent=kind==='save'?'Определяю место для сохранения…':'Определяю текущее положение…';
 try{
  const here=await position();
  if(token!==revision)return;
  if(here.accuracy>150){status.textContent='Точность сейчас около '+Math.round(here.accuracy)+' м. Слишком мало для надёжного сохранения или возвращения. Попробуй в более открытом месте.';return}
  if(kind==='save'){
   const name=($('svWaypointName')?.value||'Моя точка').trim().slice(0,45)||'Моя точка';
   const next=[{id:String(Date.now())+'-'+Math.random().toString(36).slice(2),name,lat:here.lat,lon:here.lon},...points];
   const old=points;points=next;
   if(!persist()){points=old;status.textContent='Не удалось сохранить точку на этом устройстве.';return}
   if($('svWaypointName'))$('svWaypointName').value='';
   render();status.textContent='«'+name+'» сохранена только в этом браузере. Точность GPS примерно '+Math.round(here.accuracy)+' м.';
  }else{
   const p=points[0];const result=calculate(here,p);
   const distance=result.meters<1000?Math.round(result.meters)+' м':(result.meters/1000).toFixed(2)+' км';
   status.textContent='До последней точки «'+p.name+'» по прямой: '+distance+'. Направление от географического севера: '+Math.round(result.bearing)+'° ('+cardinal(result.bearing)+'). Точность текущего GPS примерно '+Math.round(here.accuracy)+' м. Это НЕ указание безопасного пути.';
  }
 }catch(e){if(token===revision)status.textContent=e?.message||'Ошибка определения местоположения.'}
 finally{if(token===revision){busy=false;save.disabled=check.disabled=false}}
}
save.addEventListener('click',()=>void execute('save'));
check.addEventListener('click',()=>void execute('check'));
window.addEventListener('storage',e=>{if(e.key===KEY){points=read();render()}});
render();
})();
