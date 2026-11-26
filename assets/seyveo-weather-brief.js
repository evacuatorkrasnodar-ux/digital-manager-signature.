/* SEYVEO · quiet Home weather and Sayvi's drawn forecast.
   Uses the existing vetted same-origin forecast; no made-up temperatures. */
(() => {
  'use strict';
  const HANDOFF_KEY='seyveo.sayvi.weather-handoff.v1';
  const DISCUSS_KEY='seyveo.sayvi.weather-discuss.v1';
  const PREFIX='⟦SEYVEO-WEATHER-1⟧';
  const MAX_AGE=36*60*60*1000;
  const MAX_HANDOFF_AGE=3*60*1000;
  const condition=code=>{
    if(code===0)return 'ясно';
    if(code===1||code===2)return 'переменная облачность';
    if(code===3)return 'облачно';
    if(code===45||code===48)return 'туман';
    if(code>=51&&code<=57)return 'морось';
    if(code>=61&&code<=67||code>=80&&code<=82)return 'дождь';
    if(code>=71&&code<=77||code>=85&&code<=86)return 'снег';
    if(code>=95)return 'гроза';
    return 'переменная облачность';
  };
  const temperature=value=>{
    const rounded=Math.round(value);
    return (rounded>0?'+':'')+rounded+'°';
  };
  const validDay=day=>day&&/^\d{4}-\d{2}-\d{2}$/.test(day.date)&&
    Number.isFinite(day.max)&&Number.isFinite(day.min)&&Number.isFinite(day.code)&&
    day.max>=day.min&&day.max<70&&day.min> -90;
  const validBrief=item=>item&&typeof item.city==='string'&&item.city.length>0&&
    item.city.length<=80&&Array.isArray(item.days)&&item.days.length>0&&
    item.days.length<=10&&item.days.every(validDay)&&Number.isFinite(item.updatedAt)&&
    Date.now()-item.updatedAt<MAX_AGE&&Date.now()>=item.updatedAt-5*60*1000;
  const dateKey=()=>{
    const parts=new Intl.DateTimeFormat('en-GB',{
      timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(new Date());
    const piece=type=>parts.find(x=>x.type===type)?.value||'';
    return piece('year')+'-'+piece('month')+'-'+piece('day');
  };
  const nextDays=()=>{
    const first=dateKey();
    const epoch=Date.parse(first+'T12:00:00Z');
    return Array.from({length:10},(_,index)=>new Date(epoch+index*86400000).toISOString().slice(0,10));
  };
  const getBrief=()=>{
    const source=window.SAYVI_WEATHER;
    if(!source?.getForecast||!source?.getLocation)return null;
    const city=source.getLocation()?.name||'';
    // The live feed is authoritative. Safari/PWA can have an empty or blocked
    // localStorage even when the validated forecast is already in memory.
    let updatedAt=Number(source.getUpdatedAt?.())||0;
    if(!updatedAt)try{
      const cache=JSON.parse(localStorage.getItem('seyveo.agenda-weather.cache.v2')||'null');
      updatedAt=Number(cache?.updatedAt)||0;
    }catch{}
    const days=nextDays().map(date=>{
      const day=source.getForecast(date);
      return day?{date,max:day.max,min:day.min,code:day.code}:null;
    }).filter(Boolean);
    const brief={city,days,updatedAt};
    return validBrief(brief)&&days[0]?.date===dateKey()?brief:null;
  };

  /* Snapshot is produced by GitHub Actions from the same-origin Open-Meteo
     feed. Keep only the next 12 sampled two-hour points in chat history:
     no guessed hourly observations and no huge private session payloads. */
  const stationSummary=()=>{
    const raw=window.SAYVI_WEATHER?.getStationData?.();
    if(!raw||!Array.isArray(raw.hourly?.time))return null;
    const hourly=raw.hourly;
    const pieces=new Intl.DateTimeFormat('en-GB',{
      timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date());
    const part=x=>pieces.find(p=>p.type===x)?.value||'';
    const localNow=part('year')+'-'+part('month')+'-'+part('day')+'T'+part('hour')+':'+part('minute');
    const start=Math.max(0,hourly.time.findIndex(t=>t>=localNow));
    const hours=[];
    for(let i=start;i<hourly.time.length&&hours.length<13;i+=2){
      if(typeof hourly.time[i]!=='string'||!Number.isFinite(hourly.temperature_2m?.[i]))continue;
      const point={time:hourly.time[i],temperature:hourly.temperature_2m[i]};
      for(const [property,key] of Object.entries({
        humidity:'relative_humidity_2m',precipitationProbability:'precipitation_probability',
        code:'weather_code',wind:'wind_speed_10m',windDirection:'wind_direction_10m',
        pressure:'pressure_msl',uv:'uv_index'
      }))if(Number.isFinite(hourly[key]?.[i]))point[property]=hourly[key][i];
      hours.push(point);
    }
    const daily=[];
    for(let i=0;i<Math.min(10,raw.daily?.time?.length||0);i++){
      const entry={date:raw.daily.time[i]};
      for(const [property,key] of Object.entries({
        rain:'precipitation_sum',rainChance:'precipitation_probability_max',
        uv:'uv_index_max',wind:'wind_speed_10m_max',
        feelsMax:'apparent_temperature_max',feelsMin:'apparent_temperature_min'
      }))if(Number.isFinite(raw.daily[key]?.[i]))entry[property]=raw.daily[key][i];
      for(const [property,key] of Object.entries({sunrise:'sunrise',sunset:'sunset'}))
        if(typeof raw.daily[key]?.[i]==='string')entry[property]=raw.daily[key][i];
      daily.push(entry);
    }
    return {current:{...raw.current},hours,daily};
  };
  const openStation=()=>{
    const brief=getBrief();
    if(!brief)return false;
    const payload={...brief,station:stationSummary(),
      geomagnetic:window.SAYVI_WEATHER?.getGeomagneticDays?.()||[],at:Date.now()};
    try{sessionStorage.setItem(HANDOFF_KEY,JSON.stringify(payload));}
    catch{return false;}
    if(window.SEYVEO_CONVERSATION?.open)window.SEYVEO_CONVERSATION.open();
    else window.location.assign('sayvi-chat-new.html');
    return true;
  };
  const openDiscussion=()=>{
    try{sessionStorage.setItem(DISCUSS_KEY,JSON.stringify({at:Date.now()}));}
    catch{}
    return openStation();
  };
  const weatherGlyph=code=>{
    const cloud='<path d="M5.4 17.3h12.3a3.5 3.5 0 0 0 .2-7 5.8 5.8 0 0 0-11.2-.7 3.9 3.9 0 0 0-1.3 7.7Z"/>';
    const sun='<circle cx="12" cy="12" r="4.1"/><path d="M12 2.4v2.1M12 19.5v2.1M2.4 12h2.1M19.5 12h2.1M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M18.8 5.2l-1.5 1.5M6.7 17.3l-1.5 1.5"/>';
    const wet=code>=51&&code<=67||code>=80&&code<=82;
    const snow=code>=71&&code<=77||code>=85&&code<=86;
    const fog=code===45||code===48;
    const body=code===0?sun:cloud+
      (wet?'<path d="m8 19.5-.8 1.8m4.8-1.8-.8 1.8m4.8-1.8-.8 1.8"/>':
      snow?'<path d="M8 19.5v2m4-2v2m4-2v2"/>':
      fog?'<path d="M6 20.5h12"/>':'');
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';
  };
  // These callbacks are wired by the temporary Home preview only.
  let startHomeWeek=()=>{};
  let stopHomeWeek=()=>{};
  const home=document.getElementById('homePage');
  if(home){
    const cluster=home.querySelector('#orbCluster');
    if(cluster){
      const button=document.createElement('button');
      button.type='button';
      button.id='svSayviHomeWeather';
      button.className='sv-sayvi-home-weather';
      // Show a useful placeholder immediately, even before the forecast cache
      // hydrates. A hidden initial node could stay invisible after an early
      // Safari/PWA initialization exception.
      button.hidden=false;
      button.setAttribute('aria-label','Показать прогноз погоды');
      const mark=document.createElement('span');
      mark.className='sv-sayvi-home-weather-mark';
      mark.setAttribute('aria-hidden','true');
      mark.dataset.weatherKind='sun';
      mark.innerHTML=weatherGlyph(0);
      const label=document.createElement('span');
      label.textContent='Погода · обновляем прогноз';
      const todayFace=document.createElement('span');
      todayFace.className='sv-home-weather-today-face';
      todayFace.append(mark,label);
      const weekFace=document.createElement('span');
      weekFace.className='sv-home-weather-week-face';
      weekFace.setAttribute('aria-hidden','true');
      button.append(todayFace,weekFace);
      // Weather belongs below the Home greeting, never on the top status
      // line. The restored voice-cinema Home has no old weather slot.
      const message=home.querySelector('#stage > .message');
      if(message)message.insertAdjacentElement('afterend',button);
      else cluster.insertAdjacentElement('afterend',button);
      let current=null;
      let forecastUnavailable=false;
      let homeWeekActive=false;
      let weekShowing=false;
      // Weather sits between the painted globe and the bottom shortcut rail.
      // Coordinates are measured in the actual page, then converted to the
      // positioned stage. A raw 50dvh offset previously pushed this element
      // behind shortcuts or the dock on some iPhone/Safari layouts.
      let placeFrame=0;
      const positionHomeWeather=()=>{
        placeFrame=0;
        if(button.hidden||home.hidden||
           !document.documentElement.classList.contains('sv-home-empty-sphere'))return;
        const orb=document.getElementById('orb');
        const stage=home.querySelector('#stage');
        if(!orb||!stage)return;
        const stageBox=stage.getBoundingClientRect();
        const sphereBox=orb.getBoundingClientRect();
        const dockBox=document.querySelector('body > footer.dock.sv-shared-dock')?.getBoundingClientRect();
        const favorites=document.getElementById('svHomeFavorites');
        const railBox=favorites&&!favorites.hidden?favorites.getBoundingClientRect():null;
        const rowHeight=Math.max(30,button.getBoundingClientRect().height||35);
        const railHeight=Math.max(64,railBox?.height||0);
        const dockTop=dockBox?.top||window.innerHeight-64;
        // 24px before shortcuts and 32px before the dock, as approved.
        const beforeShortcuts=dockTop-32-railHeight-24-rowHeight;
        const visualInset=Math.min(45,sphereBox.height*.135);
        const afterSphere=sphereBox.bottom-visualInset+18;
        const beforeDock=dockTop-rowHeight-12;
        // Keep weather visible even when the mobile browser chrome makes
        // the viewport unusually short. Never place the row under the dock.
        const twoRows=favorites?.dataset.twoRows==='true'&&railBox?.height>0;
        // Reserve the full two-row shortcut rail; weather never covers a
        // business shortcut even on the smaller iPhone viewport.
        const absoluteTop=twoRows
          ?Math.min(beforeDock,railBox.top-24-rowHeight)
          :Math.min(Math.max(afterSphere,beforeShortcuts),beforeDock);
        const relativeTop=Math.round(absoluteTop-stageBox.top)+'px';
        if(button.style.getPropertyValue('--sv-home-weather-top')!==relativeTop){
          button.style.setProperty('--sv-home-weather-top',relativeTop);
          window.dispatchEvent(new Event('seyveo:home-weather-position'));
        }
      };
      const schedulePlace=()=>{
        if(placeFrame)return;
        placeFrame=requestAnimationFrame(positionHomeWeather);
      };
      window.addEventListener('resize',schedulePlace,{passive:true});
      window.addEventListener('seyveo:home-shortcuts-layout',schedulePlace);
      // ResizeObserver can be absent or delayed on old embedded Safari.
      if(typeof ResizeObserver==='function'){
        const resizeObserver=new ResizeObserver(schedulePlace);
        resizeObserver.observe(button);
        const homeOrb=document.getElementById('orb');
        if(homeOrb)resizeObserver.observe(homeOrb);
      }
      const sync=()=>{
        current=getBrief();
        if(homeWeekActive){
          renderWeekFace();
          showFace(true);
          button.hidden=false;
          schedulePlace();
          return;
        }
        const today=current?.days[0];
        // The Home weather row must not vanish when the feed is loading or
        // temporarily offline. Never invent temperatures for this fallback.
        button.hidden=false;
        schedulePlace();
        if(!today){
          const city=window.SAYVI_WEATHER?.getLocation?.()?.name||'Погода';
          mark.dataset.weatherKind='cloud';
          mark.innerHTML=weatherGlyph(2);
          label.textContent=city+' · '+(forecastUnavailable?'Прогноз пока недоступен':'Обновляем прогноз');
          showFace(false);
          button.title='Обновить погоду';
          button.setAttribute('aria-label','Обновить прогноз погоды');
          return;
        }
        mark.dataset.weatherKind=today.code===0?'sun':
          today.code>=51&&today.code<=67||today.code>=80&&today.code<=82?'rain':
          today.code>=71&&today.code<=77||today.code>=85&&today.code<=86?'snow':
          today.code>=95?'storm':today.code===45||today.code===48?'fog':'cloud';
        mark.innerHTML=weatherGlyph(today.code);
        // One clean line on iPhone: the icon carries the condition visually.
        // Full conditions remain available in accessibility text and the chat.
        label.textContent=current.city+' · '+temperature(today.max)+' / '+temperature(today.min);
        button.title='Нажмите для прогноза на неделю';
        button.setAttribute('aria-label',
          'Погода: '+current.city+', '+temperature(today.max)+' / '+temperature(today.min)+
          ', '+condition(today.code)+'. Нажмите для прогноза на неделю');
        renderWeekFace();
        // The seven-day face is explicit-only. Never rotate it in automatically.
        showFace(false);
      };
      // TODAY and WEEK share one fixed Home weather slot. Tapping reveals
      // WEEK right here. The one-day popup in Tasks remains independent.
      const shortWeekDay=date=>new Intl.DateTimeFormat('ru-RU',{
        timeZone:'Europe/Moscow',weekday:'short'
      }).format(new Date(date+'T12:00:00Z')).replace('.','');
      const moonSVG='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">'+
        '<path d="M20 15.5A8.4 8.4 0 0 1 8.5 4 8.6 8.6 0 1 0 20 15.5Z"/></svg>';
      function renderWeekFace(){
        const days=current?.days.slice(0,7)||[];
        if(days.length<2){weekFace.replaceChildren();return;}
        const fragment=document.createDocumentFragment();
        days.forEach(day=>{
          const item=document.createElement('span');
          item.className='sv-home-weather-day';
          const name=document.createElement('span');
          name.className='sv-home-weather-day-name';
          name.textContent=shortWeekDay(day.date);
          const high=document.createElement('span');
          high.className='sv-home-weather-day-pair';
          const picture=document.createElement('span');
          picture.className='sv-home-weather-day-symbol';
          picture.innerHTML=weatherGlyph(day.code);
          picture.dataset.weatherKind=day.code===0?'sun':
            day.code>=51&&day.code<=67||day.code>=80&&day.code<=82?'rain':
            day.code>=71&&day.code<=77||day.code>=85&&day.code<=86?'snow':'cloud';
          const number=document.createElement('span');
          number.textContent=Math.round(day.max)+'°';
          high.append(picture,number);
          const low=document.createElement('span');
          low.className='sv-home-weather-day-pair sv-home-weather-day-night';
          const moon=document.createElement('span');
          moon.className='sv-home-weather-day-symbol';
          moon.innerHTML=moonSVG;
          const lowNumber=document.createElement('span');
          lowNumber.textContent=Math.round(day.min)+'°';
          low.append(moon,lowNumber);
          item.append(name,high,low);
          fragment.append(item);
        });
        weekFace.replaceChildren(fragment);
        weekFace.dataset.voiceLabel='Прогноз на неделю: '+days.map(day=>
          shortWeekDay(day.date)+' '+temperature(day.max)+' / '+temperature(day.min)+
          ', '+condition(day.code)).join('; ');
      }
      function showFace(week){
        weekShowing=!!week&&weekFace.childElementCount>=2;
        button.classList.toggle('sv-home-weather-week-active',weekShowing);
        todayFace.setAttribute('aria-hidden',weekShowing?'true':'false');
        weekFace.setAttribute('aria-hidden',weekShowing?'false':'true');
        if(weekShowing){
          button.setAttribute('aria-label',weekFace.dataset.voiceLabel+
            '. Нажмите для погоды на сегодня');
          button.title='Нажмите для погоды на сегодня';
        }else{
          const today=current?.days[0];
          if(today){
            button.setAttribute('aria-label','Погода: '+current.city+', '+
              temperature(today.max)+' / '+temperature(today.min)+
              ', '+condition(today.code)+'. Нажмите для прогноза на неделю');
            button.title='Нажмите для прогноза на неделю';
          }
        }
        schedulePlace();
      }
      // Do not automatically interrupt the Home screen with a weekly strip.
      // Only an explicit tap on the compact weather row invokes startHomeWeek.
      // Compatibility hooks for the legacy popup; Home tap no longer opens it.
      startHomeWeek=()=>{
        homeWeekActive=true;
        current=getBrief()||current;
        renderWeekFace();
        showFace(true);
      };
      stopHomeWeek=()=>{
        homeWeekActive=false;
        showFace(false);
        sync();
      };
      sync();
      window.addEventListener('seyveo:weather-updated',()=>{
        forecastUnavailable=!getBrief();
        sync();
      });
      window.addEventListener('seyveo:home-sayvi-arrived',()=>{
        forecastUnavailable=false;
        sync();
        if(!current)window.SAYVI_WEATHER?.refresh?.();
      });
      // The weather source can hydrate from cache before this late Home
      // component subscribes. Reconcile again after parsing and navigation.
      if(document.readyState==='loading')
        document.addEventListener('DOMContentLoaded',sync,{once:true});
      window.addEventListener('load',sync,{once:true});
      window.addEventListener('seyveo:route-changed',sync);
      window.addEventListener('seyveo:home-sayvi-arrived',schedulePlace);
      // Home can show the full Sayvi sphere before a legacy handoff class
      // finishes in Safari. After the arrival, permit the forecast line even
      // when that optional flag was missed; never interrupt a live flight.
      const revealWeatherSafely=()=>{
        if(home.hidden||document.documentElement.classList.contains('sv-music-ambient'))return;
        document.documentElement.classList.add('sv-home-weather-available');
        button.hidden=false;
        schedulePlace();
      };
      window.addEventListener('seyveo:home-sayvi-arrived',revealWeatherSafely);
      window.addEventListener('seyveo:route-changed',()=>{
        if(!home.hidden)requestAnimationFrame(revealWeatherSafely);
      });
      setTimeout(revealWeatherSafely,3400);
      // The Home intro changes its root classes independently from the data
      // feed; recalculate the row when the handoff becomes visible.
      let homeRootFrame=0;
      const weatherLayoutFlags=()=>['sv-home-empty-sphere','sv-home-empty-arriving','sv-home-empty-arrived','sv-home-weather-available','sv-home-greeting-expired','sv-home-weather-preview','sv-music-ambient'].map(c=>document.documentElement.classList.contains(c)).join(',');
      let lastWeatherLayoutFlags=weatherLayoutFlags();
      new MutationObserver(()=>{
        const flags=weatherLayoutFlags();
        if(flags===lastWeatherLayoutFlags)return;
        lastWeatherLayoutFlags=flags;
        if(homeRootFrame)return;
        homeRootFrame=requestAnimationFrame(()=>{
          homeRootFrame=0;
          if(home.hidden)return;
          schedulePlace();
        });
      }).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
      button.addEventListener('click',()=>{
        const forecast=getBrief();
        if(!forecast){window.SAYVI_WEATHER?.refresh?.();return;}
        current=forecast;
        // A deliberate tap opens the existing pearl forecast card and
        // its seven-day row; no automatic weather alternation.
        const date=forecast.days[0].date;
        if(window.SEYVEO_WEATHER_PEEK?.open)
          window.SEYVEO_WEATHER_PEEK.open({anchor:button,date,origin:'home'});
        else showFace(!weekShowing);
      });
    }
  }
  const svgNS='http://www.w3.org/2000/svg';
  const svgElement=(tag,attrs={},content)=>{
    const node=document.createElementNS(svgNS,tag);
    for(const [name,value] of Object.entries(attrs))node.setAttribute(name,String(value));
    if(content!==undefined)node.textContent=content;
    return node;
  };
  const fullDay=(date)=>new Intl.DateTimeFormat('ru-RU',{
    weekday:'short',day:'numeric',month:'short',timeZone:'Europe/Moscow'
  }).format(new Date(date+'T12:00:00Z'));
  const shortDay=date=>new Intl.DateTimeFormat('ru-RU',{
    weekday:'short',timeZone:'Europe/Moscow'
  }).format(new Date(date+'T12:00:00Z')).replace('.','');
  const draw= (bubble,raw)=>{
    let data;
    try{data=JSON.parse(raw.slice(PREFIX.length));}catch{return false;}
    if(!data||typeof data.city!=='string'||data.city.length>80||
       !Array.isArray(data.days)||data.days.length<1||
       data.days.length>7||!data.days.every(validDay))return false;
    const container=document.createElement('section');
    container.className='sv-sayvi-weather-drawing';
    container.setAttribute('aria-label','Прогноз погоды от Сэйви');
    const eyebrow=document.createElement('div');
    eyebrow.className='sv-sayvi-weather-kicker';
    eyebrow.textContent='МЕТЕОСТАНЦИЯ СЭЙВИ';
    const heading=document.createElement('h3');
    heading.textContent=data.city;
    const lead=document.createElement('p');
    const first=data.days[0];
    lead.className='sv-sayvi-weather-lead';
    lead.textContent=fullDay(first.date)+' · '+condition(first.code);
    const main=document.createElement('div');
    main.className='sv-sayvi-weather-temperatures';
    const high=document.createElement('span');
    high.textContent=temperature(first.max);
    const low=document.createElement('span');
    low.textContent='минимум '+temperature(first.min);
    main.append(high,low);
    container.append(eyebrow,heading,lead,main);

    /* The advanced panels are grounded in the separately validated hourly
       Open-Meteo snapshot. Old cached daily-only forecasts still show the
       weekly chart below, never invented wind/pressure/humidity figures. */
    const station=data.station;
    const current=station?.current;
    const hours=Array.isArray(station?.hours)?
      station.hours.filter(p=>p&&typeof p.time==='string'&&Number.isFinite(p.temperature)).slice(0,13):[];
    const daysExtra=Array.isArray(station?.daily)?station.daily:[];
    if(current&&Number.isFinite(current.temperature_2m)&&hours.length>=3){
      const now=document.createElement('div');
      now.className='sv-sayvi-station-now';
      const nowHead=document.createElement('div');
      nowHead.className='sv-sayvi-station-row-head';
      const nowTitle=document.createElement('h4');
      nowTitle.textContent='Сейчас';
      const currentTime=document.createElement('span');
      currentTime.textContent=typeof current.time==='string'?current.time.slice(11,16)+' МСК':'';
      nowHead.append(nowTitle,currentTime);
      const nowReading=document.createElement('div');
      nowReading.className='sv-sayvi-station-current';
      const tempNow=document.createElement('strong');
      tempNow.textContent=temperature(current.temperature_2m);
      const caption=document.createElement('span');
      caption.textContent=Number.isFinite(current.apparent_temperature)?
       'Ощущается как '+temperature(current.apparent_temperature):condition(current.weather_code);
      nowReading.append(tempNow,caption);
      now.append(nowHead,nowReading);
      const metrics=document.createElement('div');metrics.className='sv-sayvi-station-metrics';
      const metric=(name,value,unit='')=>{
        if(!Number.isFinite(value))return;
        const tile=document.createElement('div');tile.className='sv-sayvi-station-metric';
        const label=document.createElement('span');label.textContent=name;
        const num=document.createElement('strong');num.textContent=String(Math.round(value))+unit;
        tile.append(label,num);metrics.append(tile);
      };
      metric('Влажность',current.relative_humidity_2m,'%');
      metric('Ветер',current.wind_speed_10m,' км/ч');
      metric('Давление',current.pressure_msl,' гПа');
      metric('Облачность',current.cloud_cover,'%');
      const todayExtra=daysExtra.find(d=>d?.date===first.date);
      metric('Вероятность осадков',todayExtra?.rainChance,'%');
      metric('УФ · максимум',todayExtra?.uv,'');
      if(metrics.childElementCount)now.append(metrics);
      container.append(now);
      const hourly=document.createElement('section');hourly.className='sv-sayvi-station-hourly';
      const hourlyTitle=document.createElement('h4');hourlyTitle.textContent='Ближайшие 24 часа';
      hourly.append(hourlyTitle);
      const hourlyScroll=document.createElement('div');hourlyScroll.className='sv-sayvi-station-hours';
      hours.forEach(point=>{
        const cell=document.createElement('div');cell.className='sv-sayvi-station-hour';
        const time=document.createElement('span');time.textContent=point.time.slice(11,16);
        const temperatureNow=document.createElement('strong');temperatureNow.textContent=temperature(point.temperature);
        const chance=document.createElement('small');
        chance.textContent=Number.isFinite(point.precipitationProbability)?'Осадки '+Math.round(point.precipitationProbability)+'%':'';
        cell.append(time,temperatureNow,chance);hourlyScroll.append(cell);
      });
      hourly.append(hourlyScroll);
      const nums=hours.map(p=>p.temperature);
      const min=Math.min(...nums)-2,max=Math.max(...nums)+2;
      const scale=Math.max(1,max-min);
      const chart=svgElement('svg',{viewBox:'0 0 360 116',role:'img',
       'aria-label':'Температура в течение ближайших суток'});
      const xy=hours.map((p,i)=>[20+i*320/(hours.length-1),86-(p.temperature-min)/scale*59]);
      const line=xy.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
      const shade=line+' L'+xy.at(-1)[0].toFixed(1)+' 95 L20 95 Z';
      chart.append(svgElement('path',{d:shade,class:'sv-sayvi-station-hourly-fill'}));
      chart.append(svgElement('path',{d:line,class:'sv-sayvi-station-hourly-line'}));
      xy.forEach(([x,y],i)=>{if(i%3===0||i===xy.length-1){
        chart.append(svgElement('circle',{cx:x,cy:y,r:2.9,class:'sv-sayvi-station-hourly-dot'}));
        chart.append(svgElement('text',{x,y:111,'text-anchor':'middle',
         class:'sv-sayvi-station-hourly-label'},hours[i].time.slice(11,16)));
      }});
      hourly.append(chart);
      container.append(hourly);
      if(todayExtra){
        const sun=document.createElement('div');sun.className='sv-sayvi-station-sun';
        const sunCell=(label,value)=>{
          if(typeof value!=='string'||value.length<16)return;
          const cell=document.createElement('div');
          const caption=document.createElement('span');caption.textContent=label;
          const time=document.createElement('strong');time.textContent=value.slice(11,16);
          cell.append(caption,time);sun.append(cell);
        };
        sunCell('Восход',todayExtra.sunrise);
        sunCell('Закат',todayExtra.sunset);
        if(sun.childElementCount)container.append(sun);
      }
      const health=document.createElement('section');
      health.className='sv-sayvi-station-health';
      const healthTitle=document.createElement('h4');healthTitle.textContent='Самочувствие и погода';
      const healthText=document.createElement('p');
      const pressureValues=hours.map(p=>p.pressure).filter(Number.isFinite);
      const pressureSpread=pressureValues.length>2?Math.max(...pressureValues)-Math.min(...pressureValues):0;
      if(pressureSpread>=5){
        healthText.textContent='В прогнозе заметны колебания атмосферного давления. Если вы метеочувствительны, обращайте внимание на самочувствие. Прогноз не предсказывает симптомы или артериальное давление.';
      }else{
        healthText.textContent='Погода может влиять на ощущение комфорта, но по прогнозу нельзя предсказать симптомы или артериальное давление конкретного человека.';
      }
      health.append(healthTitle,healthText);
      const geoEntries=(Array.isArray(data.geomagnetic)?data.geomagnetic:[])
       .filter(row=>row&&/^\d{4}-\d{2}-\d{2}$/.test(row.date)&&
        Number.isFinite(row.kp)&&row.kp>=0&&row.kp<=9).slice(0,4);
      if(geoEntries.length){
        const geoTitle=document.createElement('h4');
        geoTitle.textContent='Геомагнитная активность · NOAA';
        geoTitle.className='sv-sayvi-station-geo-title';
        health.append(geoTitle);
        geoEntries.forEach(item=>{
          const row=document.createElement('div');row.className='sv-sayvi-station-geo-row';
          const date=document.createElement('span');date.textContent=fullDay(item.date);
          const index=document.createElement('strong');
          index.textContent='Kp '+item.kp.toFixed(1)+'/9'+(item.kp>=5?' · буря':'');
          row.append(date,index);health.append(row);
        });
        const help=document.createElement('p');
        help.textContent='Kp измеряет активность магнитного поля Земли, не процент риска для здоровья. NOAA обычно прогнозирует лишь около 3 дней.';
        health.append(help);
      }else{
        const wait=document.createElement('p');
        wait.textContent='Прогноз магнитной активности NOAA пока недоступен.';
        health.append(wait);
      }
      container.append(health);
    }else{
      const notice=document.createElement('p');
      notice.className='sv-sayvi-station-pending';
      notice.textContent='Почасовые измерения метеостанции обновляются. Ниже — доступный проверенный прогноз по дням.';
      container.append(notice);
    }
    const weekLabel=document.createElement('h4');weekLabel.className='sv-sayvi-station-week-title';
    weekLabel.textContent='Прогноз на '+data.days.length+' дней';
    container.append(weekLabel);

    if(data.days.length>1){
      const chart=document.createElement('div');
      chart.className='sv-sayvi-weather-chart';
      const svg=svgElement('svg',{viewBox:'0 0 360 176',role:'img',
        'aria-label':'Максимальная и минимальная температура по дням'});
      const nums=data.days.flatMap(day=>[day.max,day.min]);
      const floor=Math.floor(Math.min(...nums)-3);
      const ceiling=Math.ceil(Math.max(...nums)+3);
      const span=Math.max(1,ceiling-floor);
      const y=value=>121-(value-floor)/span*90;
      const x=index=>32+index*(296/Math.max(1,data.days.length-1));
      const highDots=data.days.map((day,index)=>[x(index),y(day.max)]);
      const lowDots=data.days.map((day,index)=>[x(index),y(day.min)]);
      const path=points=>points.map((p,index)=>(index?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
      const shade=svgElement('path',{
        d:path(highDots)+' '+lowDots.slice().reverse().map(p=>'L'+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')+' Z',
        fill:'#dcebf0',opacity:'.46'});
      svg.append(shade);
      svg.append(svgElement('path',{d:path(highDots),stroke:'#262e33','stroke-width':'2.1',
        fill:'none','stroke-linecap':'round','stroke-linejoin':'round'}));
      svg.append(svgElement('path',{d:path(lowDots),stroke:'#80acb9','stroke-width':'2',
        fill:'none','stroke-linecap':'round','stroke-linejoin':'round'}));
      data.days.forEach((day,index)=>{
        const [xh,yh]=highDots[index], [xl,yl]=lowDots[index];
        svg.append(svgElement('circle',{cx:xh,cy:yh,r:3.1,fill:'#262e33'}));
        svg.append(svgElement('circle',{cx:xl,cy:yl,r:3,fill:'#80acb9'}));
        svg.append(svgElement('text',{x:xh,y:Math.max(12,yh-10),
          'text-anchor':'middle','class':'sv-sayvi-weather-graph-high'},temperature(day.max)));
        svg.append(svgElement('text',{x:xl,y:Math.min(146,yl+18),
          'text-anchor':'middle','class':'sv-sayvi-weather-graph-low'},temperature(day.min)));
        svg.append(svgElement('text',{x:xh,y:168,'text-anchor':'middle',
          'class':'sv-sayvi-weather-graph-day'},index===0?'сегодня':shortDay(day.date)));
      });
      chart.append(svg);
      container.append(chart);
      const daily=document.createElement('p');
      daily.className='sv-sayvi-weather-note';
      daily.textContent='Тёмная линия — максимумы, голубая — минимумы. Это прогноз по дням, а не температура прямо сейчас.';
      container.append(daily);
    }
    const source=document.createElement('p');
    source.className='sv-sayvi-weather-source';
    const fresh=Number.isFinite(data.updatedAt)?data.updatedAt:0;
    const update=fresh?new Date(fresh).toLocaleString('ru-RU',{
      timeZone:'Europe/Moscow',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'
    }):'';
    source.textContent='Источник: Open-Meteo'+(update?' · обновлено '+update+' (МСК)':'');
    container.append(source);
    bubble.replaceChildren(container);
    bubble.closest('.turn')?.classList.add('sv-sayvi-weather-turn');
    return true;
  };
  window.SEYVEO_WEATHER_BRIEF=Object.freeze({
    // The existing validated forecast, for Sayvi's occasional Home thought.
    musicHomeText:()=>{
      const brief=getBrief(),day=brief?.days[0];
      if(!day)return null;
      return brief.city+' · сегодня '+temperature(day.min)+'…'+temperature(day.max)+', '+condition(day.code)+'.';
    },
    openStation,openDiscussion,startHomeWeek:()=>startHomeWeek(),stopHomeWeek:()=>stopHomeWeek(),
    isMessage:message=>typeof message==='string'&&message.startsWith(PREFIX),
    render:draw,
    acceptHandoff:append=>{
      let handoff=null;
      try{
        const raw=sessionStorage.getItem(HANDOFF_KEY);
        if(raw){
          sessionStorage.removeItem(HANDOFF_KEY);
          handoff=JSON.parse(raw);
        }
      }catch{return;}
      if(!handoff||!validBrief(handoff)||!Number.isFinite(handoff.at)||
         Date.now()-handoff.at>MAX_HANDOFF_AGE||Date.now()<handoff.at-5000)return;
      const {city,days,updatedAt,station,geomagnetic}=handoff;
      append(PREFIX+JSON.stringify({city,days,updatedAt,station,geomagnetic}));
    }
  });
})();
