/* SEYVEO · Permission bridge. The app never impersonates iOS permissions.
   Offer benefit, open Management, request OS permission only on user's tap,
   then return to the route from which the user arrived. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const panel=$('svPermissionPanel'),link=$('svPermissionsEntry'),description=$('svPermissionDescription');
const action=$('svPermissionAllow'),done=$('svPermissionDone'),status=$('svPermissionStatus');
if(!panel||!link||!action||!done||!status)return;
let returnRoute='',activeKind='',pending=false;
function navigate(route){
 if((location.hash||'')===route){window.dispatchEvent(new Event('hashchange'));return}
 if(!route){history.pushState(null,'',location.pathname+location.search);window.dispatchEvent(new Event('popstate'))}
 else location.hash=route;
}
function present(kind,from){
 activeKind=kind;returnRoute=from??location.hash;
 panel.hidden=false;
 const weather=kind==='weather';
 description.textContent=weather
  ?'Погода поможет Сэйви предупредить о дожде, холоде или жаре. Для прогноза нужен доступ к местоположению.'
  :'SEYVEO будет запрашивать системные разрешения только для выбранной функции.';
 action.hidden=!weather;action.disabled=false;
 action.textContent='Разрешить погоду';
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
  status.textContent=result?'Готово! Погода включена.':'Прогноз пока недоступен. Проверь разрешение геолокации в настройках iPhone или соединение с интернетом.';
 }catch{status.textContent='Не удалось получить погоду. Можно попробовать позже.'}
 finally{pending=false;action.disabled=false}
});
window.SEYVEO_PERMISSION_FLOW=Object.freeze({open:kind=>present(kind||'overview',location.hash)});
})();