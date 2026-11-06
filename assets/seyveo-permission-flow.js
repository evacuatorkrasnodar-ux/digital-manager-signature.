/* SEYVEO · Permission bridge. The app never impersonates iOS permissions.
   Offer benefit, open Management, request OS permission only on user's tap,
   then return to the route from which the user arrived. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const panel=$('svPermissionPanel'),link=$('svPermissionsEntry'),description=$('svPermissionDescription');
const action=$('svPermissionAllow'),done=$('svPermissionDone'),status=$('svPermissionStatus');
const cityInput=$('svWeatherCityInput'),citySave=$('svWeatherCitySave'),weatherOff=$('svWeatherOff');
const gpsSection=$('svGpsSection'),gpsLocate=$('svGpsLocate'),gpsCopy=$('svGpsCopy'),gpsResult=$('svGpsResult');
if(!panel||!link||!action||!done||!status)return;
let returnRoute='',activeKind='',pending=false;
let lastPosition=null,gpsBusy=false,gpsRevision=0;
function navigate(route){
 if((location.hash||'')===route){window.dispatchEvent(new Event('hashchange'));return}
 if(!route){history.pushState(null,'',location.pathname+location.search);window.dispatchEvent(new Event('hashchange'))}
 else location.hash=route;
}
function present(kind,from){
 activeKind=kind;returnRoute=from??location.hash;
 panel.hidden=false;
 const weather=kind==='weather';
 description.textContent=weather
  ?'Сэйви показывает погоду по примерному городу из интернет-соединения, без GPS-разрешения. Через VPN город может определяться неверно. Можешь указать свой город или выключить погоду.'
  :kind==='gps'?'Для определения координат SEYVEO один раз запросит разрешение через систему телефона. Местоположение не сохраняется и не отправляется на сервер.'
  :'Погода работает без GPS. Точное местоположение можно запросить отдельно только при необходимости.';
 action.hidden=!weather;action.disabled=false;
 action.textContent=window.SEYVEO_HOME_WEATHER?.status?.().enabled?'Обновить прогноз':'Включить погоду';
 if(cityInput){cityInput.hidden=!weather;cityInput.value=window.SEYVEO_HOME_WEATHER?.city?.()||''}
 if(citySave)citySave.hidden=!weather;
 if(weatherOff)weatherOff.hidden=!weather;
 if(gpsSection)gpsSection.hidden=weather;
 if(gpsResult)gpsResult.textContent='';
 if(gpsCopy)gpsCopy.hidden=true;
 lastPosition=null;
 status.textContent='';
 navigate('#manage');
 requestAnimationFrame(()=>{panel.scrollIntoView({block:'start',behavior:'instant'});});
}
function close(){
 panel.hidden=true;pending=false;
 gpsRevision++;lastPosition=null;gpsBusy=false;
 if(gpsLocate)gpsLocate.disabled=false;
 if(gpsResult)gpsResult.textContent='';
 if(gpsCopy)gpsCopy.hidden=true;
 const target=returnRoute;
 activeKind='';returnRoute='';
 navigate(target||'');
}
link.addEventListener('click',()=>present('overview',location.hash));
done.addEventListener('click',close);
action.addEventListener('click',async()=>{
 if(pending||activeKind!=='weather')return;
 pending=true;action.disabled=true;status.textContent='Проверяю разрешение…';
 try{
  await window.SEYVEO_HOME_WEATHER?.enable?.();
  const result=window.SEYVEO_HOME_WEATHER?.today?.();
  status.textContent=result?'Прогноз обновлён.':'Не удалось получить прогноз. Укажи город вручную или проверь интернет.';
 }catch{status.textContent='Не удалось получить погоду. Можно попробовать позже.'}
 finally{pending=false;action.disabled=false}
});
if(citySave)citySave.addEventListener('click',async()=>{
 if(pending)return;
 pending=true;citySave.disabled=true;status.textContent='Ищу город…';
 try{
  const result=await window.SEYVEO_HOME_WEATHER?.chooseCity?.(cityInput?.value||'');
  status.textContent=result?.message||'Не удалось выбрать город.';
 }finally{pending=false;citySave.disabled=false}
});
if(gpsLocate)gpsLocate.addEventListener('click',()=>{
 if(gpsBusy)return;
 if(!window.isSecureContext||!navigator.geolocation){gpsResult.textContent='Точное определение недоступно в этом браузере или без HTTPS.';return}
 gpsBusy=true;gpsLocate.disabled=true;lastPosition=null;gpsCopy.hidden=true;
 const revision=++gpsRevision;
 gpsResult.textContent='Запрашиваю местоположение у телефона…';
 const done=(message)=>{if(revision!==gpsRevision)return;gpsBusy=false;gpsLocate.disabled=false;gpsResult.textContent=message};
 navigator.geolocation.getCurrentPosition(position=>{
  if(revision!==gpsRevision)return;
  const {latitude,longitude,accuracy}=position.coords;
  if(![latitude,longitude,accuracy].every(Number.isFinite)){done('Не удалось получить достоверные координаты.');return}
  lastPosition={latitude,longitude};
  gpsCopy.hidden=false;
  done('Координаты: '+latitude.toFixed(5)+', '+longitude.toFixed(5)+' · точность примерно '+Math.round(accuracy)+' м. Не отправлены в SEYVEO.');
 },error=>{
  const message=error.code===1?'Доступ запрещён. Его можно разрешить в настройках браузера.':error.code===2?'Телефон не смог определить местоположение. Проверь GPS и сигнал.':'Время ожидания истекло. Попробуй ещё раз на открытом месте.';
  done(message);
 },{enableHighAccuracy:true,timeout:12000,maximumAge:0});
});
if(gpsCopy)gpsCopy.addEventListener('click',async()=>{
 if(!lastPosition)return;
 const value=lastPosition.latitude.toFixed(5)+', '+lastPosition.longitude.toFixed(5);
 try{await navigator.clipboard.writeText(value);gpsResult.textContent='Координаты скопированы. Они не отправлены в SEYVEO.'}
 catch{gpsResult.textContent='Скопируй координаты вручную: '+value}
});
if(weatherOff)weatherOff.addEventListener('click',()=>{
 window.SEYVEO_HOME_WEATHER?.disable?.();
 status.textContent='Погода выключена. Другие функции Сэйви продолжат работать.';
});
window.SEYVEO_PERMISSION_FLOW=Object.freeze({open:kind=>present(kind||'overview',location.hash)});
})();