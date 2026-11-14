/* SEYVEO · conservative local phrase reader for manual task creation.
 * No network call, silent save or guessed address: a proposal requires approval. */
((root)=>{
 'use strict';
 const pad=n=>String(n).padStart(2,'0');
 const iso=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
 const shift=(now,days)=>new Date(now.getFullYear(),now.getMonth(),now.getDate()+days);
 const months={января:0,февраля:1,марта:2,апреля:3,мая:4,июня:5,июля:6,августа:7,сентября:8,октября:9,ноября:10,декабря:11};
 const weekdays={понедельник:1,вторник:2,среду:3,четверг:4,пятницу:5,субботу:6,воскресенье:0};
 function validDay(year,month,day){
  if(!Number.isInteger(year)||year<1900||year>2100||month<0||month>11||day<1||day>31)return null;
  const date=new Date(year,month,day);
  return date.getFullYear()===year&&date.getMonth()===month&&date.getDate()===day?date:null;
 }
 function signals(input){
  const words=String(input||'').toLocaleLowerCase('ru-RU');
  let priority='none';
  if(/не\s+срочно|без\s+спешки|когда\s+будет\s+время|по\s+возможности/u.test(words))priority='low';
  else if(/срочно|немедленно|критично|очень\s+важно|первым\s+делом|дедлайн/u.test(words))priority='high';
  else if(/важно|не\s+забыть|приоритет/u.test(words))priority='medium';
  let repeat='none';
  if(/каждый\s+день|ежедневно/u.test(words))repeat='daily';
  else if(/каждую\s+неделю|еженедельно/u.test(words))repeat='weekly';
  else if(/каждый\s+месяц|ежемесячно/u.test(words))repeat='monthly';
  return {priority,repeat};
 }
 function parse(input,now=new Date()){
  if(typeof input!=='string'||input.length>700||!Number.isFinite(now?.getTime?.()))return null;
  let body=input.replace(/\s+/g,' ').trim();
  if(!body)return null;
  body=body.replace(/^(?:(?:сэйви|сейви|сэй|сей|сейвео|seyveo)[,!:.\s]+)?(?:пожалуйста[,]?\s+)?/iu,'');
  body=body.replace(/^(?:напомни(?:те)?(?:\s+мне)?|запланируй|запиши|назначь|создай|добавь)\s+(?:(?:(?:мне|в\s+(?:календарь|дела)|дело|задачу|событие)\s+){0,2})/iu,'');
  body=body.replace(/^[:—–,\s]+/u,'').trim();
  if(!body||/\b(?:через\s+\d+|на\s+следующ\w+\s+недел\w+)\b/iu.test(body))return null;
  let date=null,time='';
  function remove(match){
   body=(body.slice(0,match.index)+' '+body.slice(match.index+match[0].length)).replace(/\s+/g,' ').trim();
  }
  let match=body.match(/(?:^|[\s,])(?:(?:на|в|к)\s+)?(сегодня|завтра|послезавтра)(?=$|[\s,.!?])/iu);
  if(match){
   const offset={сегодня:0,завтра:1,послезавтра:2}[match[1].toLocaleLowerCase('ru-RU')];
   date=shift(now,offset);remove(match);
  }
  if(!date){
   match=body.match(/(?:^|[\s,])(?:(?:на|в)\s+)?(\d{1,2})[./-](\d{1,2})(?:[./-](\d{4}))?(?=$|[\s,.!?])/u);
   if(match){
    const year=match[3]?Number(match[3]):now.getFullYear();
    date=validDay(year,Number(match[2])-1,Number(match[1]));
    if(!date)return null;
    if(!match[3]&&iso(date)<iso(now))date=validDay(year+1,Number(match[2])-1,Number(match[1]));
    if(!date)return null;
    remove(match);
   }
  }
  if(!date){
   match=body.match(/(?:^|[\s,])(?:(?:на|в)\s+)?(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4})(?:\s*г\.)?)?(?=$|[\s,.!?])/iu);
   if(match){
    const year=match[3]?Number(match[3]):now.getFullYear();
    const month=months[match[2].toLocaleLowerCase('ru-RU')];
    date=validDay(year,month,Number(match[1]));
    if(!date)return null;
    if(!match[3]&&iso(date)<iso(now))date=validDay(year+1,month,Number(match[1]));
    if(!date)return null;
    remove(match);
   }
  }
  if(!date){
   match=body.match(/(?:^|[\s,])(?:(?:в|во|на)\s+)?(понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье)(?=$|[\s,.!?])/iu);
   if(match){
    const target=weekdays[match[1].toLocaleLowerCase('ru-RU')];
    const distance=(target-now.getDay()+7)%7;
    date=shift(now,distance||7);remove(match);
   }
  }
  // A bare hour is too ambiguous. Require "в/к/на 10" or explicit "10:30".
  match=body.match(/(?:^|[\s,;])(?:в|к|на)\s+(\d{1,2})(?::(\d{1,2}))?(?:\s*час(?:а|ов)?)?(?:\s*(утра|дня|вечера|ночи))?(?=$|[\s,.!?])/iu);
  if(!match)match=body.match(/(?:^|[\s,;])(\d{1,2}):(\d{1,2})(?:\s*(утра|дня|вечера|ночи))?(?=$|[\s,.!?])/iu);
  if(match){
   let hour=Number(match[1]);const minute=match[2]===undefined?0:Number(match[2]);
   const part=String(match[3]||'').toLocaleLowerCase('ru-RU');
   if(hour>23||minute>59)return null;
   if((part==='вечера'||part==='дня')&&hour>0&&hour<12)hour+=12;
   if(part==='ночи'&&hour===12)hour=0;
   if(part==='утра'&&hour===12)hour=0;
   if(hour>23)return null;
   time=pad(hour)+':'+pad(minute);remove(match);
  }
  // Never offer a suggestion for a plain title or an uncertain second date.
  if(!date&&!time)return null;
  if(/(?:^|\s)(?:сегодня|завтра|послезавтра|понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье)(?=$|\s)/iu.test(body))return null;
  body=body.replace(/^(?:мне|что|пожалуйста)\s+/iu,'').replace(/\s*[,.!?;:]+\s*$/u,'').trim();
  if(!body||body.length>140||!/[\p{L}]/u.test(body))return null;
  return {title:body.charAt(0).toLocaleUpperCase('ru-RU')+body.slice(1),date:date?iso(date):'',time};
 }
 /* Multi-action review. Split only at an explicit conjunction followed by a
    second actionable verb; do not split 'чай и кофе' or a person's full name. */
 const ACTIONS='позвонить|созвониться|встретиться|купить|забрать|отправить|написать|подготовить|проверить|оплатить|сделать|заказать|сходить|поехать|отвезти|привезти|обсудить|согласовать|записаться|получить|передать|пригласить|провести|организовать|навестить|заехать|поговорить';
 const actionSeparator=new RegExp('(?:\\s*;\\s*|\\s+(?:и|а\\s+потом|затем|потом)\\s+)(?=(?:'+ACTIONS+')(?=$|[\\s,.!?]))','iu');
 const names=new Set(('мирон мирону мирона мироном анна анне анну анной анны елена елене елену еленой елены андрей андрею андрея андреем ' +
  'алексей алексею алексея алексеем роман роману романа романом игорь игорю игоря игорем мария марии марию марией ' +
  'михаил михаилу михаила михаилом дмитрий дмитрию дмитрия дмитрием сергей сергею сергея сергеем ' +
  'павел павлу павла павлом иван ивану ивана иваном пётр петру петра петром николай николаю николая николаем ' +
  'ольга ольге ольгу ольгой ольги наталья наталье наталью натальей натальи татьяна татьяне татьяну татьяной ' +
  'юлия юлии юлию юлией светлана светлане светлану светланой екатерина екатерине екатерину екатериной ' +
  'максим максиму максима максимом артём артёму артёма артёмом краснодар краснодаре москва москве сочи').split(' '));
 const cap=value=>value.charAt(0).toLocaleUpperCase('ru-RU')+value.slice(1);
 function polishTitle(input){
  let value=String(input||'').replace(/\s+/g,' ').trim().replace(/^[\s,;.!?:—–-]+|[\s,;.!?:—–-]+$/gu,'');
  value=value.replace(/^(?:срочно|немедленно|очень\s+важно|важно)\s*[:,!—–-]?\s*/iu,'');
  value=value.replace(/(?:^|[\s,])(?:на|по|улице|ул\.?)\s+([а-яё][а-яё-]{2,})\s*,?\s*(\d+[а-яё]?(?:\/\d+)?)(?=$|[\s,.!?])/giu,(match,street,num)=>{
   const before=match.slice(0,match.toLocaleLowerCase('ru-RU').indexOf(street.toLocaleLowerCase('ru-RU')));
   return before+cap(street)+', '+num;
  });
  value=value.replace(/\p{L}+/gu,word=>names.has(word.toLocaleLowerCase('ru-RU'))?cap(word):word);
  value=value.replace(/\s+([,;:!?])/g,'$1').replace(/([,;:!?])(?=\p{L})/gu,'$1 ');
  return cap(value).slice(0,140);
 }
 function plan(input,now=new Date()){
  if(typeof input!=='string'||!input.trim()||input.length>700)return null;
  const parsed=parse(input,now);
  let body=parsed?.title||input.replace(/\s+/g,' ').trim()
   .replace(/^(?:(?:сэйви|сейви|сэй|сей)[,!:.,\s]+)?(?:пожалуйста[,]?\s+)?/iu,'')
   .replace(/^(?:напомни(?:те)?(?:\s+мне)?|запланируй|запиши|назначь|создай|добавь)\s+/iu,'');
  body=body.replace(/^(?:срочно|немедленно|очень\s+важно|важно)\s*[:,!—–-]?\s*/iu,'');
  let leadMinutes=0;
  const lead=body.match(/^за\s+(час|один\s+час|1\s+час|полчаса|30\s+минут|15\s+минут)(?=$|[\s,.!?])/iu);
  if(lead){leadMinutes=/15/u.test(lead[1])?15:/полчаса|30/u.test(lead[1])?30:60;body=body.slice(lead[0].length).trim()}
  const parts=body.split(actionSeparator).map(polishTitle).filter(Boolean);
  if(!parts.length)return null;
  const unique=[...new Map(parts.map(value=>[value.toLocaleLowerCase('ru-RU'),value])).values()];
  const titles=unique.length>4?[polishTitle(body)]:unique;
  return {items:titles.map(title=>({title})),date:parsed?.date||'',time:parsed?.time||'',leadMinutes};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={parse,signals,plan,polishTitle};
 if(root){root.SEYVEO_TASK_SMART_NL=parse;root.SEYVEO_TASK_SMART_SIGNALS=signals;root.SEYVEO_TASK_SMART_PLAN=plan;}
})(typeof window!=='undefined'?window:null);
