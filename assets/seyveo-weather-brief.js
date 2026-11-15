/* SEYVEO · quiet Home weather and Sayvi's drawn forecast.
   Uses the existing vetted same-origin forecast; no made-up temperatures. */
(() => {
  'use strict';
  const HANDOFF_KEY='seyveo.sayvi.weather-handoff.v1';
  const PREFIX='⟦SEYVEO-WEATHER-1⟧';
  const MAX_AGE=18*60*60*1000;
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
    item.days.length<=7&&item.days.every(validDay)&&Number.isFinite(item.updatedAt)&&
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
    return Array.from({length:7},(_,index)=>new Date(epoch+index*86400000).toISOString().slice(0,10));
  };
  const getBrief=()=>{
    const source=window.SAYVI_WEATHER;
    if(!source?.getForecast||!source?.getLocation)return null;
    const city=source.getLocation()?.name||'';
    let updatedAt=0;
    try{
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
  const home=document.getElementById('homePage');
  if(home){
    const cluster=home.querySelector('#orbCluster');
    if(cluster){
      const button=document.createElement('button');
      button.type='button';
      button.id='svSayviHomeWeather';
      button.className='sv-sayvi-home-weather';
      button.hidden=true;
      button.setAttribute('aria-label','Спросить Сэйви подробный прогноз погоды');
      const mark=document.createElement('span');
      mark.className='sv-sayvi-home-weather-mark';
      mark.setAttribute('aria-hidden','true');
      mark.textContent='✳';
      const label=document.createElement('span');
      button.append(mark,label);
      cluster.insertAdjacentElement('afterend',button);
      let current=null;
      const sync=()=>{
        current=getBrief();
        const today=current?.days[0];
        button.hidden=!today;
        if(!today)return;
        label.textContent=current.city+' · '+temperature(today.max)+' / '+temperature(today.min)+' · '+condition(today.code);
        button.title='Открыть прогноз Сэйви';
      };
      sync();
      window.addEventListener('seyveo:weather-updated',sync);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
      button.addEventListener('click',()=>{
        current=getBrief();
        if(!current){sync();return;}
        try{sessionStorage.setItem(HANDOFF_KEY,JSON.stringify({...current,at:Date.now()}));}
        catch{return;}
        if(window.SEYVEO_CONVERSATION?.open)window.SEYVEO_CONVERSATION.open();
        else window.location.assign('sayvi-chat-new.html');
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
    eyebrow.textContent='МОЙ ПРОГНОЗ';
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
    low.textContent='макс. / мин. '+temperature(first.min);
    main.append(high,low);
    container.append(eyebrow,heading,lead,main);
    if(data.days.length>1){
      const chart=document.createElement('div');
      chart.className='sv-sayvi-weather-chart';
      const svg=svgElement('svg',{viewBox:'0 0 360 176',role:'img',
        'aria-label':'Максимальная и минимальная температура на семь дней'});
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
      const {city,days,updatedAt}=handoff;
      append(PREFIX+JSON.stringify({city,days,updatedAt}));
    }
  });
})();
