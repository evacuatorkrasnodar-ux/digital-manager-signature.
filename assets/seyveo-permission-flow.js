/* SEYVEO · Permission bridge. The app never impersonates iOS permissions.
   Offer benefit, open Management, request OS permission only on user's tap,
   then return to the route from which the user arrived. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const panel=$('svPermissionPanel'),link=$('svPermissionsEntry'),description=$('svPermissionDescription');
const done=$('svPermissionDone'),status=$('svPermissionStatus');
const gpsSection=$('svGpsSection'),gpsLocate=$('svGpsLocate'),gpsCopy=$('svGpsCopy'),gpsResult=$('svGpsResult');
if(!panel||!link||!done||!status)return;
let returnRoute='',activeKind='';
let lastPosition=null,gpsBusy=false,gpsRevision=0;
function navigate(route){
 if((location.hash||'')===route){window.dispatchEvent(new Event('hashchange'));return}
 if(!route){history.pushState(null,'',location.pathname+location.search);window.dispatchEvent(new Event('hashchange'))}
 else location.hash=route;
}
function present(kind,from){
 activeKind=kind==='gps'?'gps':'overview';returnRoute=from??location.hash;
 panel.hidden=false;
 description.textContent=activeKind==='gps'
  ?'Для определения координат SEYVEO запросит разрешение через систему телефона. Местоположение не сохраняется и не отправляется на сервер.'
  :'Разрешения выдаются только по вашему запросу. Ниже можно управлять точным местоположением.';
 if(gpsSection)gpsSection.hidden=false;
 if(gpsResult)gpsResult.textContent='';
 if(gpsCopy)gpsCopy.hidden=true;
 lastPosition=null;
 status.textContent='';
 navigate('#manage');
 requestAnimationFrame(()=>{panel.scrollIntoView({block:'start',behavior:'instant'});});
}
function close(){
 panel.hidden=true;
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
window.SEYVEO_PERMISSION_FLOW=Object.freeze({open:kind=>present(kind||'overview',location.hash)});
})();