/* SEYVEO · Permission bridge. The app never impersonates iOS permissions.
   Offer benefit, open Management, request OS permission only on user's tap,
   then return to the route from which the user arrived. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const panel=$('svPermissionPanel'),link=$('svPermissionsEntry'),description=$('svPermissionDescription');
const action=$('svPermissionAllow'),done=$('svPermissionDone'),status=$('svPermissionStatus');
const cityInput=$('svWeatherCityInput'),citySave=$('svWeatherCitySave'),weatherOff=$('svWeatherOff');
if(!panel||!link||!action||!done||!status)return;
let returnRoute='',activeKind='',pending=false;
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
  :'SEYVEO будет запрашивать системные разрешения только для выбранной функции.';
 action.hidden=!weather;action.disabled=false;
 action.textContent=window.SEYVEO_HOME_WEATHER?.status?.().enabled?'Обновить прогноз':'Включить погоду';
 if(cityInput){cityInput.hidden=!weather;cityInput.value=window.SEYVEO_HOME_WEATHER?.city?.()||''}
 if(citySave)citySave.hidden=!weather;
 if(weatherOff)weatherOff.hidden=!weather;
 status.textContent='';
 navigate('#manage');
 requestAnimationFrame(()=>{panel.scrollIntoView({block:'start',behavior:'instant'});});
}
function close(){
 panel.hidden=true;pending=false;
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
if(weatherOff)weatherOff.addEventListener('click',()=>{
 window.SEYVEO_HOME_WEATHER?.disable?.();
 status.textContent='Погода выключена. Другие функции Сэйви продолжат работать.';
});
window.SEYVEO_PERMISSION_FLOW=Object.freeze({open:kind=>present(kind||'overview',location.hash)});
})();