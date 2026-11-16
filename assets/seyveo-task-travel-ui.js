/* SEYVEO · "Дорога к делу". Only verified routes, never simulated traffic. */
(()=>{
 'use strict';
 const core=window.SEYVEO_TASK_TRAVEL_CORE;
 const dialog=document.getElementById('personalTaskDialog');
 const placePanel=document.getElementById('svNewTaskPlacePanel');
 const date=document.getElementById('personalTaskDue');
 const time=document.getElementById('personalTaskTime');
 if(!core||!dialog||!placePanel||!date||!time)return;
 const section=document.createElement('section');section.className='sv-task-travel';
 section.setAttribute('aria-label','Дорога к делу');section.hidden=true;placePanel.after(section);
 let destination=null,origin=null,routes=[],chosen=null,request=0,loading=false,notice='',expanded=false,manualOpen=false;
 const el=(tag,cls,copy)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(copy!==undefined)x.textContent=copy;return x};
 const label=mode=>({driving:'На машине',transit:'Транспорт',walking:'Пешком',taxi:'Такси'})[mode]||mode;
 function reset(){request++;origin=null;routes=[];chosen=null;destination=null;loading=false;notice='';expanded=false;manualOpen=false;section.hidden=true;section.replaceChildren()}
 function forSave(){return core.clean(chosen)}
 function load(value){sync();chosen=core.clean(value);render()}
 function currentPlace(){return window.SEYVEO_TASK_PLACE_EDITOR?.placeForSave?.()||null}
 function clock(){return core.departure(date.value,time.value,chosen)}
 function button(title,action,cls=''){
  const x=el('button',cls,title);x.type='button';x.addEventListener('click',action);return x;
 }
 function field(labelText,initial,min,max,onChange){
  const wrapper=el('label','sv-travel-field');wrapper.append(el('span','',labelText));
  const input=el('input');input.type='number';input.min=String(min);input.max=String(max);input.step='1';input.value=String(initial);
  input.setAttribute('inputmode','numeric');input.addEventListener('change',()=>{
   const n=Number(input.value);if(!Number.isInteger(n)||n<min||n>max){input.value=String(initial);return}
   onChange(n);
  });wrapper.append(input);return wrapper;
 }
 async function locate(){
  if(!navigator.geolocation){notice='На этом устройстве геолокация недоступна.';render();return}
  notice='Определяю отправную точку…';render();
  navigator.geolocation.getCurrentPosition(position=>{
   origin=core.point({lat:position.coords.latitude,lon:position.coords.longitude});
   notice='';expanded=true;void fetchRoutes();
  },()=>{notice='Геолокация не разрешена. Маршрут можно открыть в картах или задать время вручную.';render()},
   {enableHighAccuracy:false,timeout:12000,maximumAge:120000});
 }
 async function fetchRoutes(){
  if(!origin||!destination)return;
  const token=++request;loading=true;render();
  try{
   const response=await fetch('/api/seyveo-route-options',{
    method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},
    body:JSON.stringify({origin,destination:{lat:destination.lat,lon:destination.lon}})
   });
   if(token!==request||!dialog.open)return;
   if(!response.ok)throw Error('unavailable');
   const data=await response.json();
   routes=Array.isArray(data.routes)?data.routes.map(item=>{
    const clean=core.clean({...item,bufferMinutes:10});
    return clean?{...clean,traffic:['realtime','forecast'].includes(item.traffic)?item.traffic:'unknown',
     lines:Array.isArray(item.lines)?item.lines.filter(x=>typeof x==='string'&&x.length<46).slice(0,5):[]}:null;
   }).filter(Boolean):[];
   notice=routes.length?'':'Сервис расчёта времени в пути ещё не подключён. Можно открыть маршрут в картах.';
  }catch{
   if(token!==request||!dialog.open)return;
   routes=[];notice='Точное время в пути пока недоступно. Можно открыть маршрут в картах или указать его вручную.';
  }
  if(token!==request)return;
  loading=false;render();
 }
 function select(mode,minutes,source){
  chosen=core.clean({mode,minutes,bufferMinutes:chosen?.bufferMinutes??10,source});render();
 }
 function render(){
  if(!dialog.open||!destination){section.hidden=true;return}
  section.hidden=false;section.replaceChildren();
  const heading=el('div','sv-travel-heading');
  heading.append(el('strong','','Дорога к делу'));
  heading.append(button(expanded?'Свернуть':'Маршрут',()=>{expanded=!expanded;render()},'sv-travel-expand'));
  section.append(heading);
  if(!expanded){
   const hint=clock();
   if(hint)section.append(el('p','sv-travel-depart','Лучше выйти в '+hint.time+' · '+label(chosen.mode).toLocaleLowerCase('ru-RU')));
   return;
  }
  const wrap=el('div','sv-travel-body');section.append(wrap);
  wrap.append(el('p','sv-travel-muted','Маршрут можно открыть из дома, с работы или от текущего местоположения. Сохранённый адрес передаётся картам только после нажатия.'));
  if(!origin)wrap.append(button('Определить место отправления',()=>void locate(),'sv-travel-locate'));
  else wrap.append(button('Обновить маршрут',()=>void fetchRoutes(),'sv-travel-locate'));
  const personal=window.SEYVEO_SAVED_PLACES;
  const saved=personal?.read?.()||{};
  const fromSaved=el('div','sv-travel-saved-origins');
  for(const [kind,labelText] of [['home','Из дома ↗'],['work','С работы ↗']]){
   if(!saved[kind])continue;
   fromSaved.append(button(labelText,()=>{
    const url=core.directionsURL(destination,{address:saved[kind]},'driving');
    if(url)window.open(url,'_blank','noopener,noreferrer');
   },'sv-travel-saved-origin'));
  }
  if(personal)fromSaved.append(button(saved.home||saved.work?'Адреса · изменить':'Сохранить дом и работу',
   ()=>personal.openEditor(),'sv-travel-saved-origin'));
  if(fromSaved.childNodes.length)wrap.append(fromSaved);
  if(loading)wrap.append(el('p','sv-travel-muted','Проверяю маршруты…'));
  const modes=el('div','sv-travel-modes');wrap.append(modes);
  for(const mode of ['driving','transit','walking']){
   const found=routes.find(x=>x.mode===mode);
   const chip=button(label(mode)+(found?' · '+found.minutes+' мин':''),()=>{
    if(found)select(mode,found.minutes,found.source);
    else{const url=core.directionsURL(destination,origin,mode);if(url)window.open(url,'_blank','noopener,noreferrer')}
   },'sv-travel-mode'+(chosen?.mode===mode?' is-selected':''));
   chip.title=found?'Выбрать проверенное время в пути':'Посмотреть маршрут в картах';
   modes.append(chip);
  }
  const taxi=button('Такси ↗',()=>{
   const url=core.taxiURL(destination,origin);
   if(url)window.open(url,'_blank','noopener,noreferrer');
   notice='Сэйви передала адрес в Яндекс Go. Заказ, время подачи и оплату подтверждаешь там.';
   render();
  },'sv-travel-taxi');modes.append(taxi);
  const transit=routes.find(x=>x.mode==='transit');
  if(transit?.lines?.length)wrap.append(el('p','sv-travel-route-lines','По маршруту: '+transit.lines.join(' · ')));
  const car=routes.find(x=>x.mode==='driving');
  if(car?.traffic==='realtime')wrap.append(el('p','sv-travel-traffic','На машине · время рассчитано с текущими пробками'));
  else if(car?.traffic==='forecast')wrap.append(el('p','sv-travel-traffic','На машине · использован прогноз пробок'));
  if(chosen){
   const controls=el('div','sv-travel-controls');
   controls.append(field('Время в пути, мин',chosen.minutes,1,600,n=>select(chosen.mode,n,'manual')));
   controls.append(field('Запас, мин',chosen.bufferMinutes,0,90,n=>{chosen=core.clean({...chosen,bufferMinutes:n});render()}));
   wrap.append(controls);
   const leaving=clock();
   if(leaving)wrap.append(el('div','sv-travel-depart','Лучше выйти в '+leaving.time+' · с запасом '+chosen.bufferMinutes+' мин'));
   else wrap.append(el('p','sv-travel-muted','Укажи дату и время дела — Сэйви рассчитает, когда выходить.'));
   if(leaving){
    const reminders=window.SEYVEO_TASK_TRAVEL_REMINDERS;
    if(reminders?.enabled?.())wrap.append(el('p','sv-travel-muted','Напоминания включены, когда SEYVEO работает на устройстве.'));
    else wrap.append(button('Включить напоминание о выходе',async()=>{
     const result=await reminders?.enable?.();
     notice=result?.ok?'Напоминания включены, пока SEYVEO работает.':
      'Системные уведомления недоступны. Время выхода останется видно в списке дел.';
     render();
    },'sv-travel-locate'));
   }
   wrap.append(button('Убрать расчёт',()=>{chosen=null;render()},'sv-travel-clear'));
  }else{
   if(!manualOpen)wrap.append(button('Указать время поездки вручную',()=>{manualOpen=true;render()},'sv-travel-manual'));
   else{
    const row=el('div','sv-travel-manual-entry');
    const input=el('input');input.type='number';input.min='1';input.max='600';input.placeholder='Минуты';
    input.setAttribute('inputmode','numeric');input.setAttribute('aria-label','Твоё время в пути в минутах');
    row.append(input,button('Применить',()=>{
     const n=Number(input.value);
     if(Number.isInteger(n)&&n>=1&&n<=600){manualOpen=false;select('driving',n,'manual')}
     else{notice='Укажи время поездки от 1 до 600 минут.';render()}
    },'sv-travel-manual'));wrap.append(row);
   }
  }
  if(notice)wrap.append(el('p','sv-travel-muted',notice));
 }
 function sync(){
  const next=currentPlace();
  const same=next&&destination&&next.lat===destination.lat&&next.lon===destination.lon;
  if(!next){destination=null;request++;routes=[];origin=null;chosen=null;render();return}
  if(!same){destination=next;request++;routes=[];origin=null;chosen=null;notice=''}
  render();
 }
 window.addEventListener('seyveo:task-place-updated',sync);
 window.addEventListener('seyveo:saved-places-changed',()=>{if(dialog.open)render()});
 dialog.addEventListener('sv-task-editor-sync',sync);
 date.addEventListener('change',render);time.addEventListener('change',render);
 dialog.addEventListener('close',reset);
 new MutationObserver(()=>{if(dialog.open)sync()}).observe(dialog,{attributes:true,attributeFilter:['open']});
 window.SEYVEO_TASK_TRAVEL_EDITOR=Object.freeze({forSave,load,reset,sync});
})();
