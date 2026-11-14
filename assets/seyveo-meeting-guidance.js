/* SEYVEO · Honest situational advice in the New Task composer.
 * Weather comes only from the existing dated Open-Meteo feed. There is no
 * traffic feed yet, so a Friday-evening warning is clearly a precaution. */
(()=>{
 'use strict';
 const dialog=document.getElementById('personalTaskDialog');
 const advice=document.getElementById('svTaskMeetingAdvice');
 const title=document.getElementById('personalTaskTitle');
 const due=document.getElementById('personalTaskDue');
 const time=document.getElementById('personalTaskTime');
 if(!dialog||!advice||!title||!due||!time)return;
 function validDay(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;
  const [y,m,d]=value.split('-').map(Number),day=new Date(y,m-1,d);
  return day.getFullYear()===y&&day.getMonth()+1===m&&day.getDate()===d?day:null;
 }
 const rainy=code=>(code>=51&&code<=67)||(code>=80&&code<=82)||(code>=95&&code<=99);
 const snowy=code=>(code>=71&&code<=77)||(code>=85&&code<=86);
 function weatherText(forecast,city){
  const max=Math.round(forecast.max),code=forecast.code;
  const cold=max<=12,cool=max>12&&max<=17;
  const conditions=[];
  if(code>=95)conditions.push('возможна гроза');
  else if(rainy(code))conditions.push('ожидается дождь');
  else if(snowy(code))conditions.push('ожидается снег');
  else if(code===3)conditions.push('будет пасмурно');
  else if(code===45||code===48)conditions.push('возможен туман');
  else if(code===0)conditions.push('ожидается ясная погода');
  else conditions.push('ожидается переменная облачность');
  conditions.push('до '+max+'°');
  const advice=[];
  if(rainy(code))advice.push('прихвати зонт');
  if(snowy(code)||cold)advice.push('оденься теплее');
  else if(cool)advice.push('может пригодиться куртка');
  const friendly=advice.join(' и ');
  return 'Прогноз на день встречи · '+city+': '+conditions.join(', ')+'.'+
   (friendly?' '+friendly.charAt(0).toLocaleUpperCase('ru-RU')+friendly.slice(1)+'.':'');
 }
 function localDistanceKm(latA,lonA,latB,lonB){
  const radians=n=>n*Math.PI/180;
  const dy=radians(latB-latA),dx=radians(lonB-lonA);
  const s=Math.sin(dy/2)**2+Math.cos(radians(latA))*Math.cos(radians(latB))*Math.sin(dx/2)**2;
  return 12742*Math.asin(Math.min(1,Math.sqrt(s)));
 }
 function untilText(target){
  const minutes=Math.ceil((target.getTime()-Date.now())/60000);
  if(minutes<=0||minutes>72*60)return '';
  const word=(count,one,few,many)=>{
   const mod100=count%100,mod10=count%10;
   return mod100>=11&&mod100<=14?many:mod10===1?one:mod10>=2&&mod10<=4?few:many;
  };
  if(minutes<60)return 'До встречи около '+minutes+' '+word(minutes,'минуты','минут','минут')+'.';
  if(minutes<24*60){
   const hours=Math.ceil(minutes/60);
   return 'До встречи около '+hours+' '+word(hours,'часа','часов','часов')+'.';
  }
  const days=Math.floor(minutes/1440);
  if(days===1)return 'До встречи около суток.';
  return 'До встречи около '+days+' '+word(days,'дня','дней','дней')+'.';
 }
 let frame=0;
 function update(){
  frame=0;
  advice.hidden=true;advice.replaceChildren();
  if(!dialog.open||!title.value.trim()||!validDay(due.value))return;
  const raw=title.value.toLocaleLowerCase('ru-RU');
  const meeting=/(?:встреч|встрет|переговор|поужин|пообед|(?:ужин|обед|завтрак)\s+с\b)/iu.test(raw);
  if(!meeting)return;
  const day=validDay(due.value),parts=[];
  if(/^([01]\d|2[0-3]):[0-5]\d$/.test(time.value)){
   const [hour,minute]=time.value.split(':').map(Number);
   const target=new Date(day.getFullYear(),day.getMonth(),day.getDate(),hour,minute);
   const remaining=untilText(target);
   if(remaining)parts.push(remaining);
   if(day.getDay()===5&&hour>=16&&hour<=21&&target.getTime()>Date.now())
    parts.push('В пятницу вечером движение может быть плотнее — проверь пробки перед выездом.');
  }
  const weather=window.SAYVI_WEATHER;
  const forecast=weather?.getForecast?.(due.value),location=weather?.getLocation?.();
  const place=window.SEYVEO_TASK_PLACE_EDITOR?.placeForSave?.();
  const separateCity=place&&location&&Number.isFinite(place.lat)&&Number.isFinite(place.lon)&&
   localDistanceKm(place.lat,place.lon,location.latitude,location.longitude)>45;
  if(forecast&&location&&!separateCity)parts.unshift(weatherText(forecast,location.name));
  if(!parts.length)return;
  const mark=document.createElement('span');mark.className='sv-task-meeting-advice-mark';
  mark.textContent='✦';mark.setAttribute('aria-hidden','true');
  const copy=document.createElement('p');copy.textContent=parts.join(' ');
  advice.append(mark,copy);advice.hidden=false;
 }
 function queue(){if(frame)return;frame=requestAnimationFrame(update)}
 for(const control of [title,due,time]){
  control.addEventListener('input',queue);control.addEventListener('change',queue);
 }
 dialog.addEventListener('sv-task-editor-sync',queue);
 dialog.addEventListener('close',()=>{advice.hidden=true;advice.replaceChildren()});
 window.addEventListener('seyveo:weather-updated',queue);
 window.addEventListener('seyveo:task-place-updated',queue);
 new MutationObserver(()=>{if(dialog.open)queue()}).observe(dialog,{attributes:true,attributeFilter:['open']});
})();
