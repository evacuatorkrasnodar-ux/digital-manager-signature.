/* SEYVEO / Sayvi weather peek · 21 Nov 2026.
   One temporary, in-page forecast card, shared by Today's agenda weather
   and the EXISTING Home weather row. No new task, Home card, or chat turn.
   All temperatures come from the current validated SAYVI_WEATHER feed. */
(()=>{
 'use strict';
 const MAX_AGE=36*60*60*1000;
 const HIDE_AFTER=30000;
 const getSource=()=>window.SAYVI_WEATHER;
 let panel=null,activeAnchor=null,activeDate='',timer=0,requestedRefresh=false,agendaMode=false,homeMode=false;
 function resetTimer(){clearTimeout(timer);if(panel)timer=setTimeout(()=>close(),HIDE_AFTER);}
 function setCalendarWeatherMode(on){
  agendaMode=!!on;
  if(agendaMode)document.documentElement.dataset.svWeatherMode='true';
  else delete document.documentElement.dataset.svWeatherMode;
  window.SAYVI_WEATHER?.syncRail?.();
 }
 const condition=code=>{
  if(code===0)return 'Ясно';
  if(code===1||code===2)return 'Переменная облачность';
  if(code===3)return 'Облачно';
  if(code===45||code===48)return 'Туман';
  if(code>=51&&code<=57)return 'Морось';
  if(code>=61&&code<=67||code>=80&&code<=82)return 'Дождь';
  if(code>=71&&code<=77||code>=85&&code<=86)return 'Снег';
  if(code>=95)return 'Гроза';
  return 'Переменная облачность';
 };
 const icon=code=>{
  const sun='<circle cx="12" cy="12" r="3.7"/><path d="M12 2.5v2.1M12 19.4v2.1M2.5 12h2.1M19.4 12h2.1M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5"/>';
  const cloud='<path d="M5.4 17.1h12.1a3.6 3.6 0 0 0 .2-7.2 5.8 5.8 0 0 0-11.1-.5 4 4 0 0 0-1.2 7.7Z"/>';
  const rain='<path d="m8 19.5-.8 1.5m4.8-1.5-.8 1.5m4.8-1.5-.8 1.5"/>';
  const snow='<path d="M8 19v2m4-2v2m4-2v2"/>';
  const wet=(code>=51&&code<=67)||(code>=80&&code<=82);
  const snowy=(code>=71&&code<=77)||(code>=85&&code<=86);
  const body=code===0?sun:cloud+(wet?rain:snowy?snow:'');
  return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';
 };
 const temp=n=>(Math.round(n)>0?'+':'')+Math.round(n)+'°';
 const validate=day=>day&&Number.isFinite(day.max)&&Number.isFinite(day.min)&&
  Number.isFinite(day.code)&&day.max>=day.min&&day.max<70&&day.min>-90;
 const getDay=date=>{
  const src=getSource();
  const updated=Number(src?.getUpdatedAt?.())||0;
  if(!updated||Date.now()-updated>MAX_AGE||updated>Date.now()+300000)return null;
  const day=src?.getForecast?.(date);
  return validate(day)?day:null;
 };
 const nextDate=(date,offset)=>{
  const epoch=Date.parse(date+'T12:00:00Z');
  return Number.isFinite(epoch)?new Date(epoch+offset*86400000).toISOString().slice(0,10):'';
 };
 const weekday=date=>new Intl.DateTimeFormat('ru-RU',{weekday:'short',timeZone:'Europe/Moscow'})
  .format(new Date(date+'T12:00:00Z')).replace('.','');
 const stamp=ms=>new Intl.DateTimeFormat('ru-RU',{
  day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'
 }).format(new Date(ms));
 function close(immediate=false){
  clearTimeout(timer);timer=0;
  if(activeAnchor)activeAnchor.setAttribute('aria-expanded','false');
  activeAnchor=null;activeDate='';requestedRefresh=false;
  setCalendarWeatherMode(false);
  if(homeMode){
   homeMode=false;
   window.SEYVEO_WEATHER_BRIEF?.stopHomeWeek?.();
   document.documentElement.classList.remove('sv-home-weather-preview');
  }
  if(!panel)return;
  const old=panel;panel=null;
  if(immediate){old.remove();return;}
  old.classList.add('sv-weather-peek-leaving');
  setTimeout(()=>old.remove(),210);
 }
 function position(){
  if(!panel||!activeAnchor||!activeAnchor.isConnected){close(true);return;}
  const rect=activeAnchor.getBoundingClientRect();
  const bounds=panel.getBoundingClientRect();
  const viewport=window.visualViewport;
  const viewTop=viewport?.offsetTop||0;
  const viewHeight=viewport?.height||window.innerHeight;
  const viewWidth=viewport?.width||window.innerWidth;
  const viewLeft=viewport?.offsetLeft||0;
  const topSafe=Math.max(viewTop+12,viewTop+(agendaMode?rect.bottom-viewTop+12:12));
  const dock=document.querySelector('body > footer.dock.sv-shared-dock');
  const dockTop=dock&&!dock.hidden?dock.getBoundingClientRect().top:viewTop+viewHeight-72;
  const maxBottom=Math.min(viewTop+viewHeight-12,dockTop-12);
  /* Home is a different placement from Agenda. Align the compact card
     with the centre of the actual Sayvi sphere, never below or over the
     shortcuts. The sphere itself fades, but its geometry stays reserved. */
  let y;
  if(homeMode){
   const sphere=document.querySelector('#homePage #orb');
   const sphereRect=sphere?.getBoundingClientRect();
   const stageRect=document.querySelector('#homePage #stage')?.getBoundingClientRect();
   const sphereMiddle=sphereRect?.height>36?
    sphereRect.top+sphereRect.height/2:
    (stageRect?.top||viewTop)+Math.min(210,viewHeight*.31);
   const favorites=document.querySelector('#svHomeFavorites');
   const favoritesRect=favorites&&!favorites.hidden?favorites.getBoundingClientRect():null;
   const bottomLimit=Math.min(maxBottom,favoritesRect?.top?favoritesRect.top-14:maxBottom);
   const allowedTop=viewTop+Math.max(42,Math.min(68,viewHeight*.09));
   const upper=Math.max(allowedTop,bottomLimit-bounds.height);
   y=Math.max(allowedTop,Math.min(sphereMiddle-bounds.height/2,upper));
  }else{
   /* Agenda keeps its own central placement below the date rail. */
   const desiredTop=viewTop+(viewHeight-bounds.height)/2;
   y=Math.max(topSafe,Math.min(desiredTop,Math.max(topSafe,maxBottom-bounds.height)));
  }
  const x=viewLeft+Math.max(12,(viewWidth-bounds.width)/2);
  panel.style.top=Math.round(y)+'px';
  panel.style.left=Math.round(x)+'px';
 }
 function add(className,textValue,parent,tag='span'){
  const el=document.createElement(tag);
  el.className=className;el.textContent=textValue;
  parent.append(el);
  return el;
 }
 const actionSvg=kind=>{
  const paths={
   heart:'<path d="M20.8 4.6a5.4 5.4 0 0 0-7.7 0L12 5.7l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 21l8.8-8.7a5.4 5.4 0 0 0 0-7.7Z"/>',
   station:'<path d="M4 19V12m5 7V8m5 11v-5m5 5V4"/><path d="M2.5 21h19M3.5 8.5l5-3.2 5 5 6-6"/>',
   chat:'<path d="M20 11.5a8 8 0 0 1-8.5 8L5 21l1.7-5.3a8 8 0 1 1 13.3-4.2Z"/><path d="M8 11.5h8m-8 3h5"/>'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+(paths[kind]||'')+'</svg>';
 };
 function open({anchor,date,origin}={}){
  if(!(anchor instanceof Element)||!anchor.isConnected||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date||''))return;
  if(origin==='agenda'&&!anchor.closest('.sv-agenda-section-heading[data-today="true"]'))return;
  if(panel&&activeAnchor===anchor&&activeDate===date){close();return;}
  close(true);
  activeAnchor=anchor;activeDate=date;
  homeMode=origin==='home'&&!!anchor.closest('#homePage');
  setCalendarWeatherMode(origin==='agenda');
  if(homeMode){
   document.documentElement.classList.add('sv-home-weather-preview');
   window.SEYVEO_WEATHER_BRIEF?.startHomeWeek?.();
  }
  anchor.setAttribute('aria-expanded','true');
  const src=getSource(),day=getDay(date),city=src?.getLocation?.()?.name||'Ваш город';
  panel=document.createElement('aside');
  panel.className='sv-weather-peek';
  panel.dataset.origin=homeMode?'home':'agenda';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','false');
  panel.setAttribute('aria-label','Краткий прогноз Сэйви');
  panel.dataset.weatherReady=day?'true':'false';
  const eyebrow=add('sv-weather-peek-eyebrow','СЭЙВИ · ПОГОДА',panel);
  eyebrow.setAttribute('aria-hidden','true');
  const main=document.createElement('div');main.className='sv-weather-peek-main';
  let healthToggle=null,healthPanel=null;
  if(day){
   const glyph=add('sv-weather-peek-glyph','',main);glyph.innerHTML=icon(day.code);
   const tempLine=add('sv-weather-peek-high',temp(day.max),main,'strong');
   tempLine.title='Максимальная температура за день';
   const info=document.createElement('div');info.className='sv-weather-peek-info';
   add('sv-weather-peek-city',city,info,'strong');
   add('sv-weather-peek-condition',condition(day.code),info);
   add('sv-weather-peek-low','↑ '+temp(day.max)+'   ↓ '+temp(day.min),info);
   main.append(info);
   panel.append(main);
   /* Three circular actions are the default resting interface.
      Wellness text is opt-in and never expands until the heart is tapped. */
   healthPanel=document.createElement('section');
   healthPanel.id='svWeatherPeekWellness';
   healthPanel.className='sv-weather-peek-health';
   healthPanel.hidden=true;
   const more=document.createElement('div');more.className='sv-weather-peek-health-more';
   const title=document.createElement('h3');
   title.className='sv-weather-peek-health-title';
   title.textContent='Самочувствие и погода';
   more.append(title);
   const station=src?.getStationData?.();
   const pressure=station?.current?.pressure_msl;
   add('sv-weather-peek-health-detail',
    'Атмосферное давление · '+(Number.isFinite(pressure)?Math.round(pressure)+' гПа':'нет данных'),more,'p');
   for(let index=0;index<3;index++){
    const key=nextDate(date,index),geo=src?.getGeomagnetic?.(key);
    const label=index===0?'Сегодня':weekday(key);
    const textValue=geo?('Kp '+geo.kp.toFixed(1)+'/9 · '+(geo.kp>=5?'буря':geo.kp>=4?'повышена':'спокойно')):'нет прогноза';
    add('sv-weather-peek-health-detail',label+' · '+textValue,more,'p');
   }
   add('sv-weather-peek-health-caption',
    'Kp (NOAA) — индекс геомагнитной активности, а не риск для здоровья. Прогноз обычно до 3 дней.',more,'p');
   add('sv-weather-peek-health-caption',
    'Атмосферное давление не равно артериальному. По погоде нельзя предсказать симптомы.',more,'p');
   healthPanel.append(more);
   healthToggle=document.createElement('button');
   healthToggle.type='button';
   healthToggle.className='sv-weather-peek-health-toggle sv-weather-peek-round';
   healthToggle.innerHTML=actionSvg('heart');
   healthToggle.setAttribute('aria-label','Самочувствие: давление и магнитные бури');
   healthToggle.setAttribute('title','Самочувствие');
   healthToggle.setAttribute('aria-controls',healthPanel.id);
   healthToggle.setAttribute('aria-expanded','false');
   healthToggle.addEventListener('click',()=>{
    healthPanel.hidden=!healthPanel.hidden;
    healthToggle.setAttribute('aria-expanded',String(!healthPanel.hidden));
    requestAnimationFrame(position);
    resetTimer();
   });
  }else{
   add('sv-weather-peek-city',city,main,'strong');
   add('sv-weather-peek-condition','Прогноз обновляется',main);
   panel.append(main);
   add('sv-weather-peek-empty-copy','Сэйви покажет данные после обновления прогноза.',panel,'p');
  }
  const actions=document.createElement('div');actions.className='sv-weather-peek-actions';
  actions.setAttribute('role','group');
  actions.setAttribute('aria-label','Действия с прогнозом');
  if(healthToggle)actions.append(healthToggle);
  const details=document.createElement('button');
  details.type='button';
  details.className='sv-weather-peek-details sv-weather-peek-round';
  details.innerHTML=actionSvg('station');
  details.title='Метеостанция';
  details.setAttribute('aria-label','Открыть подробную метеостанцию в чате Сэйви');
  details.addEventListener('click',event=>{
   event.preventDefault();event.stopPropagation();
   const didOpen=window.SEYVEO_WEATHER_BRIEF?.openStation?.();
   if(!didOpen&&window.SEYVEO_CONVERSATION?.open)window.SEYVEO_CONVERSATION.open();
   else if(!didOpen)window.location.assign('sayvi-chat-new.html');
   close(true);
  });
  actions.append(details);
  const discuss=document.createElement('button');
  discuss.type='button';discuss.className='sv-weather-peek-discuss sv-weather-peek-round';
  discuss.innerHTML=actionSvg('chat');
  discuss.title='Обсудить с Сэйви';
  discuss.setAttribute('aria-label','Обсудить погоду с Сэйви в чате');
  discuss.addEventListener('click',event=>{
   event.preventDefault();event.stopPropagation();
   if(!window.SEYVEO_WEATHER_BRIEF?.openDiscussion?.())window.SEYVEO_WEATHER_BRIEF?.openStation?.();
   close(true);
  });
  actions.append(discuss);panel.append(actions);
  if(healthPanel)panel.append(healthPanel);
  const updated=Number(src?.getUpdatedAt?.())||0;
  if(day)add('sv-weather-peek-source','Open-Meteo'+(updated?' · '+stamp(updated)+' МСК':''),panel,'p');
  document.body.append(panel);
  position();
  resetTimer();
  panel.addEventListener('pointerdown',resetTimer,{passive:true});
  if(!day&&!requestedRefresh){requestedRefresh=true;src?.refresh?.();}
 }
 window.SEYVEO_WEATHER_PEEK=Object.freeze({open,close:()=>close()});
 document.addEventListener('pointerdown',event=>{
  if(!panel||panel.contains(event.target)||activeAnchor?.contains(event.target))return;
  if(agendaMode&&event.target?.closest?.('#svTasksDateNav')){resetTimer();return;}
  close();
 },true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
 document.addEventListener('scroll',event=>{
  if(!panel)return;
  if(panel.contains(event.target)){resetTimer();return;}
  if(agendaMode&&event.target?.closest?.('#svTasksDateNav')){resetTimer();return;}
  close();
 },{capture:true,passive:true});
 document.addEventListener('pointerdown',event=>{
  if(agendaMode&&event.target?.closest?.('#svTasksDateNav'))resetTimer();
 },{capture:true,passive:true});
 window.addEventListener('resize',()=>{if(panel)position();},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close(true);});
 window.addEventListener('seyveo:route-changed',()=>close(true));
 window.addEventListener('seyveo:weather-updated',()=>{
  if(panel&&activeAnchor&&activeDate&&panel.dataset.weatherReady!=='true'){
   const anchor=activeAnchor,date=activeDate;
   if(getDay(date))open({anchor,date,origin:agendaMode?'agenda':homeMode?'home':'agenda'});
  }
 });
})();
