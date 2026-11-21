/* SEYVEO / Sayvi weather peek · 21 Nov 2026.
   One temporary, in-page forecast card, shared by Today's agenda weather
   and the EXISTING Home weather row. No new task, Home card, or chat turn.
   All temperatures come from the current validated SAYVI_WEATHER feed. */
(()=>{
 'use strict';
 const MAX_AGE=36*60*60*1000;
 const HIDE_AFTER=7000;
 const getSource=()=>window.SAYVI_WEATHER;
 let panel=null,activeAnchor=null,activeDate='',timer=0,requestedRefresh=false;
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
  const topSafe=Math.max(12,Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)'))||12);
  const dock=document.querySelector('body > footer.dock.sv-shared-dock');
  const dockTop=dock&&!dock.hidden?dock.getBoundingClientRect().top:window.innerHeight-75;
  const maxBottom=Math.min(window.innerHeight-14,dockTop-13);
  const below=rect.bottom+11;
  const above=rect.top-bounds.height-11;
  const y=(below+bounds.height<=maxBottom)?below:
   (above>=topSafe?above:Math.max(topSafe,maxBottom-bounds.height));
  const x=Math.max(12,Math.min(window.innerWidth-bounds.width-12,
   rect.left+rect.width/2-bounds.width/2));
  panel.style.top=Math.round(y)+'px';
  panel.style.left=Math.round(x)+'px';
 }
 function add(className,textValue,parent,tag='span'){
  const el=document.createElement(tag);
  el.className=className;el.textContent=textValue;
  parent.append(el);
  return el;
 }
 function open({anchor,date,origin}={}){
  if(!(anchor instanceof Element)||!anchor.isConnected||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date||''))return;
  if(origin==='agenda'&&!anchor.closest('.sv-agenda-section-heading[data-today="true"]'))return;
  if(panel&&activeAnchor===anchor&&activeDate===date){close();return;}
  close(true);
  activeAnchor=anchor;activeDate=date;
  anchor.setAttribute('aria-expanded','true');
  const src=getSource();
  const day=getDay(date),city=src?.getLocation?.()?.name||'Ваш город';
  panel=document.createElement('aside');
  panel.className='sv-weather-peek';
  panel.setAttribute('role','status');
  panel.setAttribute('aria-live','polite');
  panel.setAttribute('aria-label','Сэйви: прогноз погоды');
  const head=document.createElement('div');head.className='sv-weather-peek-head';
  const avatar=add('sv-weather-peek-avatar','S',head);
  avatar.setAttribute('aria-hidden','true');
  const titles=document.createElement('div');titles.className='sv-weather-peek-titles';
  add('sv-weather-peek-eyebrow','СЭЙВИ · ПОГОДА',titles);
  add('sv-weather-peek-city',city,titles,'strong');
  head.append(titles);panel.append(head);
  if(day){
   const main=document.createElement('div');main.className='sv-weather-peek-main';
   const glyph=document.createElement('span');glyph.className='sv-weather-peek-glyph';
   glyph.innerHTML=icon(day.code);
   main.append(glyph);
   const stats=document.createElement('div');stats.className='sv-weather-peek-stats';
   add('sv-weather-peek-condition',condition(day.code),stats);
   add('sv-weather-peek-high',temp(day.max),stats);
   add('sv-weather-peek-low','минимум '+temp(day.min),stats);
   main.append(stats);panel.append(main);
   const forecast=document.createElement('div');forecast.className='sv-weather-peek-next';
   for(let offset=1;offset<=2;offset++){
    const key=nextDate(date,offset),value=getDay(key);
    if(!value)continue;
    const cell=document.createElement('div');cell.className='sv-weather-peek-day';
    add('sv-weather-peek-day-name',weekday(key),cell);
    const symbol=add('sv-weather-peek-day-icon','',cell);symbol.innerHTML=icon(value.code);
    add('sv-weather-peek-day-value',temp(value.max)+' / '+temp(value.min),cell);
    forecast.append(cell);
   }
   if(forecast.childElementCount){panel.append(forecast);}
   const updated=Number(src?.getUpdatedAt?.())||0;
   add('sv-weather-peek-source','Прогноз по дням · Open-Meteo'+(updated?' · '+stamp(updated)+' МСК':''),panel,'p');
  }else{
   const blank=document.createElement('div');blank.className='sv-weather-peek-empty';
   add('sv-weather-peek-condition','Прогноз обновляется',blank,'strong');
   add('sv-weather-peek-empty-copy','Сэйви покажет погоду, когда поступят свежие данные.',blank,'p');
   panel.append(blank);
  }
  document.body.append(panel);
  position();
  timer=setTimeout(()=>close(),HIDE_AFTER);
  if(!day&&!requestedRefresh){
   requestedRefresh=true;
   src?.refresh?.();
  }
 }
 window.SEYVEO_WEATHER_PEEK=Object.freeze({open,close:()=>close()});
 document.addEventListener('pointerdown',event=>{
  if(panel&&!panel.contains(event.target)&&!activeAnchor?.contains(event.target))close();
 },true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
 document.addEventListener('scroll',()=>{if(panel)close();},{capture:true,passive:true});
 window.addEventListener('resize',()=>{if(panel)position();},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close(true);});
 window.addEventListener('seyveo:route-changed',()=>close(true));
 window.addEventListener('seyveo:weather-updated',()=>{
  if(panel&&activeAnchor&&activeDate&&!panel.querySelector('.sv-weather-peek-stats')){
   const anchor=activeAnchor,date=activeDate;
   if(getDay(date))open({anchor,date,origin:'refresh'});
  }
 });
})();
