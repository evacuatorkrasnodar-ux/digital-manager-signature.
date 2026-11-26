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
 let homeLayoutObserver=null,homeLayoutFrame=0;
 function scheduleHomePosition(){
  if(!panel||!homeMode||homeLayoutFrame)return;
  homeLayoutFrame=requestAnimationFrame(()=>{homeLayoutFrame=0;if(panel&&homeMode)position();});
 }
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
 const temp=n=>Math.round(n)+'°';
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
  homeLayoutObserver?.disconnect();homeLayoutObserver=null;
  if(homeLayoutFrame){cancelAnimationFrame(homeLayoutFrame);homeLayoutFrame=0;}
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
  const dock=document.querySelector('body > footer.dock.sv-shared-dock');
  const dockTop=dock&&!dock.hidden?dock.getBoundingClientRect().top:viewTop+viewHeight-72;
  const maxBottom=Math.min(viewTop+viewHeight-12,dockTop-12);
  /* Home: anchor the full card directly above the weekly weather row.
     Do not move the sphere, shortcuts or dock. */
  let y;
  if(homeMode){
   const favorites=document.querySelector('#svHomeFavorites');
   const favoritesRect=favorites&&!favorites.hidden?favorites.getBoundingClientRect():null;
   // The week row is the hard lower boundary. Text never dictates the
   // card's height: hidden/expired greetings can still have large boxes.
   const face=activeAnchor.querySelector('.sv-home-weather-week-face');
   const faceRect=face?.getBoundingClientRect();
   const rowTop=faceRect?.height>0?faceRect.top:rect.top;
   const weekTop=rect.height>0&&rowTop>viewTop?rowTop-12:maxBottom;
   const bottomLimit=Math.min(maxBottom,weekTop,
    favoritesRect?.top?favoritesRect.top-14:maxBottom);
   const safeTop=viewTop+12;
   const physicalRoom=Math.floor(bottomLimit-safeTop);
   // If the viewport has genuinely become unusable (keyboard/rotation),
   // restore the normal Home rather than drawing a clipped empty pill.
   if(physicalRoom<180){close(true);return;}
   panel.style.setProperty('--sv-home-peek-room',physicalRoom+'px');
   const height=panel.offsetHeight;
   // Anchor directly above the week. Prefer 40px clearance, retaining
   // at least the existing 12px safety gap when the viewport is short.
   y=Math.max(safeTop,bottomLimit-height-28);

  }else{
   /* Agenda: anchor to the tapped weather badge. Prefer below, flip
      above if needed, and constrain the card to the visible viewport. */
   const safeTop=viewTop+12;
   const below=Math.max(0,maxBottom-Math.max(safeTop,rect.bottom+8));
   const above=Math.max(0,Math.min(maxBottom,rect.top-8)-safeTop);
   panel.style.removeProperty('--sv-agenda-peek-room');
   const naturalHeight=panel.offsetHeight;
   const useBelow=below>=naturalHeight||below>=above;
   const room=Math.floor(useBelow?below:above);
   if(room<120){close(true);return;}
   panel.style.setProperty('--sv-agenda-peek-room',room+'px');
   y=useBelow?Math.max(safeTop,rect.bottom+8):Math.max(safeTop,Math.min(maxBottom,rect.top-8)-panel.offsetHeight);
  }
  const width=panel.offsetWidth;
  const x=homeMode?viewLeft+Math.max(12,(viewWidth-bounds.width)/2):
   Math.max(viewLeft+12,Math.min(rect.right-width,viewLeft+viewWidth-width-12));
  const top=Math.round(y)+'px',left=Math.round(x)+'px';
  if(panel.style.top!==top)panel.style.top=top;
  if(panel.style.left!==left)panel.style.left=left;
 }
 function add(className,textValue,parent,tag='span'){
  const el=document.createElement(tag);
  el.className=className;el.textContent=textValue;
  parent.append(el);
  return el;
 }

 // Use only validated Open-Meteo hourly precipitation probabilities.
 // The strip shows forecast chances, not observed rain or a guarantee.
 function moscowDate(){
  const parts=new Intl.DateTimeFormat('en-GB',{
   timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date());
  const part=type=>parts.find(x=>x.type===type)?.value||'';
  return part('year')+'-'+part('month')+'-'+part('day');
 }
 // The existing station feed requests wind in km/h. Display m/s, and
 // use the meteorological direction the wind comes FROM, never a guessed value.
 function addWind(parent,date,source){
  const station=source?.getStationData?.();
  const current=station?.current;
  if(date!==moscowDate()||typeof current?.time!=='string'||!current.time.startsWith(date+'T'))return;
  const speed=current.wind_speed_10m;
  const unit=station.current_units?.wind_speed_10m||'km/h';
  if(!Number.isFinite(speed)||speed<0||!['km/h','m/s'].includes(unit))return;
  const ms=unit==='km/h'?speed/3.6:speed;
  const value=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(ms);
  const direction=current.wind_direction_10m;
  const index=Number.isFinite(direction)&&direction>=0&&direction<=360?Math.round(direction/45)%8:-1;
  const full=['северный','северо-восточный','восточный','юго-восточный','южный','юго-западный','западный','северо-западный'];
  const row=document.createElement('span');row.className='sv-weather-peek-wind';
  const glyph=document.createElement('span');glyph.className='sv-weather-peek-wind-icon';
  glyph.setAttribute('aria-hidden','true');
  glyph.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h12a2.5 2.5 0 1 0-2.5-2.5M3 12h16a2 2 0 1 1-2 2M3 16h9a2.5 2.5 0 1 1-2.5 2.5"/></svg>';
  row.append(glyph);
  const label=value+' м/с'+(index>=0&&ms>=.05?' · '+full[index]:'');
  add('sv-weather-peek-wind-value',label,row);
  row.title='Ветер: '+value+' м/с'+(index>=0&&ms>=.05?', '+full[index]:'');
  row.setAttribute('aria-label',row.title);
  parent.append(row);
 }
 function addRainTimeline(parent,date,source){
  // Compact, human-readable rain forecast. Only real hourly probabilities
  // from our existing verified feed; never infer observed rain or exact onset.
  const section=document.createElement('section');
  section.className='sv-weather-peek-rain';
  const header=document.createElement('div');
  header.className='sv-weather-peek-rain-heading';
  add('sv-weather-peek-rain-title',date===moscowDate()?'Осадки до конца дня':'Осадки · '+weekday(date),header,'h3');
  const state=add('sv-weather-peek-rain-state','',header,'strong');
  section.append(header);
  const hourly=source?.getStationData?.()?.hourly;
  const chances=Array(24).fill(null);
  if(Array.isArray(hourly?.time)&&Array.isArray(hourly?.precipitation_probability)){
   for(let i=0;i<hourly.time.length;i++){
    const time=hourly.time[i],chance=hourly.precipitation_probability[i];
    if(typeof time!=='string'||!time.startsWith(date+'T')||
     !Number.isFinite(chance)||chance<0||chance>100)continue;
    const hour=Number(time.slice(11,13));
    if(Number.isInteger(hour)&&hour>=0&&hour<24)chances[hour]=Math.round(chance);
   }
  }
  const now=new Intl.DateTimeFormat('en-GB',{
   timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit',
   hour:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date());
  const piece=type=>now.find(part=>part.type===type)?.value||'';
  const today=piece('year')+'-'+piece('month')+'-'+piece('day');
  const currentHour=date===today?Math.min(23,Math.max(0,Number(piece('hour'))||0)):0;
  const future=chances.map((chance,hour)=>({chance,hour}))
   .filter(point=>point.hour>=currentHour&&point.chance!==null);
  if(!future.length){
   state.textContent='Нет данных';
   state.dataset.level='unknown';
   section.setAttribute('aria-label','Нет доступного почасового прогноза осадков');
   parent.append(section);return;
  }
  const maximum=Math.max(...future.map(point=>point.chance));
  const isPossible=maximum>=30;
  state.textContent=maximum>=50?'Вероятны':isPossible?'Возможны':'Маловероятны';
  state.dataset.level=maximum>=50?'likely':isPossible?'possible':'quiet';
  const detail=document.createElement('div');
  detail.className='sv-weather-peek-rain-detail';
  const text=document.createElement('span');
  text.className='sv-weather-peek-rain-detail-label';
  const glyph=document.createElement('span');
  glyph.className='sv-weather-peek-rain-detail-icon';
  glyph.setAttribute('aria-hidden','true');
  glyph.innerHTML=icon(isPossible?61:2);
  text.append(glyph);
  const detailLabel=document.createElement('span');
  detailLabel.textContent=isPossible?'Возможное время':'Вероятность осадков';
  text.append(detailLabel);
  detail.append(text);
  const detailValue=add('sv-weather-peek-rain-detail-value','',detail,'strong');
  let timeWindow='';
  if(isPossible){
   const onset=future.find(point=>point.chance>=30);
   if(onset){
    let end=onset.hour+1;
    while(end<24&&chances[end]!==null&&chances[end]>=30)end++;
    const startLabel=String(onset.hour).padStart(2,'0')+':00';
    const endLabel=String(end).padStart(2,'0')+':00';
    timeWindow=startLabel+'–'+endLabel;
   }
   detailValue.textContent=timeWindow;
   // Percentage only when actual rain is forecast, on the same title row.
   state.textContent+=' · до '+maximum+'%';
  }else detailValue.textContent='до '+maximum+'%';
  section.append(detail);
  section.setAttribute('aria-label','Осадки: '+state.textContent+
   (timeWindow?', возможное время '+timeWindow:'')+'.');
  parent.append(section);
 }
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
  // No nested action buttons: the whole minimal forecast card is a
  // single accessible entry point to Sayvi's detailed meteo station.
  panel.setAttribute('role','button');
  panel.setAttribute('tabindex','0');
  panel.setAttribute('aria-label','Открыть подробный прогноз погоды от Сэйви');
  panel.dataset.weatherReady=day?'true':'false';
  {
   const eyebrow=add('sv-weather-peek-eyebrow','',panel);
   const brand=document.createElement('span');brand.className='sv-weather-peek-brand';
   const mark=document.createElement('img');mark.className='sv-weather-peek-brand-mark';
   mark.src='assets/seyveo-circular-interlace-mono.svg';mark.alt='';mark.decoding='async';
   brand.append(mark);add('sv-weather-peek-brand-title','Погода',brand);
   const disclosure=document.createElement('span');disclosure.className='sv-weather-peek-disclosure';
   disclosure.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>';
   eyebrow.append(brand,disclosure);eyebrow.setAttribute('aria-hidden','true');
  }
  const main=document.createElement('div');main.className='sv-weather-peek-main';
  if(day){
   const glyph=add('sv-weather-peek-glyph','',main);glyph.innerHTML=icon(day.code);
   const tempLine=add('sv-weather-peek-high',temp(day.max),main,'strong');
   tempLine.title='Максимальная температура за день';
   const info=document.createElement('div');info.className='sv-weather-peek-info';
   add('sv-weather-peek-city',city,info,'strong');
   add('sv-weather-peek-condition','За день: '+condition(day.code).toLocaleLowerCase('ru-RU'),info);
   add('sv-weather-peek-low','↑ '+temp(day.max)+'   ↓ '+temp(day.min),info);
   addWind(info,date,src);
   main.append(info);
   panel.append(main);
   addRainTimeline(panel,date,src);
   // The Kp rings are readings, NOT controls and NOT a health-risk
   // percentage. Their numbers are the validated NOAA planetary index.
   const geo=document.createElement('section');
   geo.className='sv-weather-peek-geo';
   geo.setAttribute('aria-label','Геомагнитная активность по дням');
   const heading=document.createElement('div');
   heading.className='sv-weather-peek-geo-heading';
   add('sv-weather-peek-geo-title','Магнитная активность',heading,'h3');
   add('sv-weather-peek-geo-scale','Kp · 0–9',heading);
   geo.append(heading);
   const meters=document.createElement('div');meters.className='sv-weather-peek-geo-grid';
   for(let index=0;index<3;index++){
    const key=nextDate(date,index),reading=src?.getGeomagnetic?.(key);
    const kp=Number.isFinite(reading?.kp)?reading.kp:null;
    const level=kp===null?'unknown':kp>=5?'storm':kp>=4?'active':'quiet';
    const name=index===0?'Сегодня':index===1?'Завтра':weekday(key);
    const status=kp===null?'нет прогноза':kp>=5?'геомагнитная буря':
     kp>=4?'повышенная активность':'спокойная активность';
    const item=document.createElement('div');
    item.className='sv-weather-peek-geo-figure';
    item.setAttribute('role','img');
    item.setAttribute('aria-label',name+': '+(kp===null?'нет прогноза Kp':
     'Kp '+kp.toFixed(1)+' из 9, '+status));
    const ring=document.createElement('span');
    ring.className='sv-weather-peek-geo-meter';
    ring.dataset.level=level;
    ring.style.setProperty('--sv-geo-fill',
     (kp===null?0:Math.max(0,Math.min(100,kp/9*100))).toFixed(1)+'%');
    const core=document.createElement('span');core.className='sv-weather-peek-geo-core';
    add('sv-weather-peek-geo-number',kp===null?'—':kp.toFixed(1),core,'strong');
    ring.append(core);
    item.append(ring);
    add('sv-weather-peek-geo-day',name,item);
    // Discreet daily status describes GEOMAGNETIC ACTIVITY, never wellbeing.
    const state=document.createElement('span');
    state.className='sv-weather-peek-geo-status';
    state.dataset.level=level;
    const dot=document.createElement('span');
    dot.className='sv-weather-peek-geo-status-dot';
    dot.setAttribute('aria-hidden','true');
    state.append(dot);
    add('sv-weather-peek-geo-status-label',
     level==='quiet'?'Спокойно':level==='active'?'Повышена':
     level==='storm'?'Буря':'Нет данных',state);
    item.append(state);
    meters.append(item);
   }
   geo.append(meters);
   panel.append(geo);
  }else{
   add('sv-weather-peek-city',city,main,'strong');
   add('sv-weather-peek-condition','Прогноз обновляется',main);
   panel.append(main);
   add('sv-weather-peek-empty-copy','Сэйви покажет данные после обновления прогноза.',panel,'p');
  }
  const openDetails=()=>{
   if(!panel)return;
   // Route to the already implemented full station in Sayvi chat. An
   // unavailable feed opens the chat rather than inventing forecast data.
   const opened=window.SEYVEO_WEATHER_BRIEF?.openStation?.();
   if(!opened){
    if(window.SEYVEO_CONVERSATION?.open)window.SEYVEO_CONVERSATION.open();
    else window.location.assign('sayvi-chat-new.html');
   }
   close(true);
  };
  panel.addEventListener('click',openDetails);
  panel.addEventListener('keydown',event=>{
   if(event.key!=='Enter'&&event.key!==' ')return;
   event.preventDefault();event.stopPropagation();
   openDetails();
  });
  // Keep source credits inside the detailed Sayvi station, not on
  // this small glanceable weather preview.
  if(homeMode){
   // Wait for the weekly row to settle before painting the card. Do not
   // render first at a stale coordinate and then visibly jump.
   const openedPanel=panel;
   panel.style.visibility='hidden';
   document.body.append(panel);
   if(typeof ResizeObserver==='function'){
    homeLayoutObserver=new ResizeObserver(scheduleHomePosition);
    homeLayoutObserver.observe(activeAnchor);
   }
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(panel!==openedPanel||!homeMode)return;
    position();
    if(panel===openedPanel)panel.style.visibility='';
   }));
  }else{
   document.body.append(panel);
   position();
  }
  if(!panel)return;
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
 window.visualViewport?.addEventListener('resize',()=>{if(panel)requestAnimationFrame(()=>{if(panel)position();});},{passive:true});
 window.addEventListener('seyveo:home-shortcuts-layout',scheduleHomePosition);
 window.addEventListener('seyveo:home-weather-position',scheduleHomePosition);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close(true);});
 window.addEventListener('seyveo:route-changed',()=>close(true));
 window.addEventListener('seyveo:weather-updated',()=>{
  if(panel&&activeAnchor&&activeDate&&panel.dataset.weatherReady!=='true'){
   const anchor=activeAnchor,date=activeDate;
   if(getDay(date))open({anchor,date,origin:agendaMode?'agenda':homeMode?'home':'agenda'});
  }
  if(panel&&homeMode)requestAnimationFrame(()=>{if(panel&&homeMode)position();});
 });
})();
