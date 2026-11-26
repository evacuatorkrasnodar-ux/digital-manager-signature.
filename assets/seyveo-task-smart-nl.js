/* SEYVEO · conservative local phrase reader for manual task creation.
 * No network call, silent save or guessed address: a proposal requires approval. */
((root)=>{
 'use strict';
 const pad=n=>String(n).padStart(2,'0');
 const iso=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
 const shift=(now,days)=>new Date(now.getFullYear(),now.getMonth(),now.getDate()+days);
 const months={января:0,февраля:1,марта:2,апреля:3,мая:4,июня:5,июля:6,августа:7,сентября:8,октября:9,ноября:10,декабря:11};
 const weekdays={понедельник:1,вторник:2,среду:3,четверг:4,пятницу:5,субботу:6,воскресенье:0};
 // Conservative fixes only: an unknown proper name is never autocorrected.
 const commonTypos={сегдня:'сегодня',севодня:'сегодня',зафтра:'завтра',завтро:'завтра',
  пазвонить:'позвонить',позванить:'позвонить',встретится:'встретиться',
  напесать:'написать',адресс:'адрес',улитса:'улица'};
 const correctKnownTypos=value=>String(value||'').replace(/\p{L}+/gu,word=>{
  const replacement=commonTypos[word.toLocaleLowerCase('ru-RU')];
  return replacement?(word[0]===word[0].toLocaleUpperCase('ru-RU')?replacement[0].toLocaleUpperCase('ru-RU')+replacement.slice(1):replacement):word;
 });
 // Copying a quoted example from a chat must not turn "завтра" into part
 // of the task title. Only unwrap quotes enclosing the entire utterance;
 // internal venue names like кафе «Вкусно — и точка» must stay intact.
 function unwrapOuterQuotes(input){
  let value=String(input||'').trim();
  for(let n=0;n<2;n++){
   const start=value[0],end=value.at(-1);
   if(!((start==='«'&&end==='»')||(start==='“'&&end==='”')||(start==='"'&&end==='"')||(start==="'"&&end==="'")))break;
   value=value.slice(1,-1).trim();
  }
  return value;
 }
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
 // A trailing reminder is an instruction, not the name or address of a task.
 function trailingReminder(value){
  const match=value.match(/(?:^|[\s,.!?;])(?:и\s+)?напомни(?:те)?(?:\s+мне)?\s+за\s+(?:(\d{1,3}|один|одну)\s+)?(полчаса|час(?:а|ов)?|минут(?:у|ы)?)(?:\s+до\s+(?:начала|встречи|события))?\s*[.!?;]*$/iu);
  if(!match)return {body:value,leadMinutes:0};
  const amount=Number(match[1])||1,unit=match[2].toLocaleLowerCase('ru-RU');
  const leadMinutes=unit==='полчаса'?30:unit.startsWith('час')?amount*60:amount;
  if(leadMinutes<1||leadMinutes>1440)return {body:value,leadMinutes:0};
  return {body:value.slice(0,match.index).replace(/[\s,.!?;]+$/u,'').trim(),leadMinutes};
 }
 function parse(input,now=new Date()){
  if(typeof input!=='string'||input.length>700||!Number.isFinite(now?.getTime?.()))return null;
  let body=unwrapOuterQuotes(correctKnownTypos(input).replace(/\r?\n+/g,'; ').replace(/\s+/g,' ').replace(/(^|[\s,;])в(?=\d{1,2}(?=$|[\s,.!?]))/giu,'$1в '));
  if(!body)return null;
  body=body.replace(/^(?:(?:сэйви|сейви|сэй|сей|сейвео|seyveo)[,!:.\s]+)?(?:пожалуйста[,]?\s+)?/iu,'');
  body=body.replace(/^(?:напомни(?:те)?(?:\s+мне)?|запланируй|запиши|назначь|создай|добавь)\s+(?:(?:(?:мне|в\s+(?:календарь|дела)|дело|задачу|событие)\s+){0,2})/iu,'');
  body=body.replace(/^[:—–,\s]+/u,'').trim();
  if(!body||/\b(?:через\s+\d+|на\s+следующ\w+\s+недел\w+)\b/iu.test(body))return null;
  const reminder=trailingReminder(body);body=reminder.body;
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
  return {title:body.charAt(0).toLocaleUpperCase('ru-RU')+body.slice(1),date:date?iso(date):'',time,...(reminder.leadMinutes?{leadMinutes:reminder.leadMinutes}:{})};
 }
 /* Multi-action review. Split only at an explicit conjunction followed by a
    second actionable verb; do not split 'чай и кофе' or a person's full name. */
 const ACTIONS='позвонить|созвониться|встретиться|купить|забрать|отправить|написать|подготовить|проверить|оплатить|сделать|заказать|сходить|поехать|отвезти|привезти|обсудить|согласовать|записаться|получить|передать|пригласить|провести|организовать|навестить|заехать|поговорить';
 const EVENTS='встреча|совещание|приём|прием|тренировка|занятие|конференция|собрание|осмотр|поездка';
 const TASK_HEADS='(?:'+ACTIONS+'|'+EVENTS+')';
 const TASK_PREFIX='(?:(?:сегодня|завтра|послезавтра)\\s+)?(?:(?:в|к)\\s+\\d{1,2}(?::\\d{2})?\\s+)?';
 // Split on explicit semicolons or a clearly new action. Ordinary lists,
 // personal names and brands such as "Вкусно — и точка" remain one task.
 const actionSeparator=new RegExp('(?:\\s*;\\s*|,\\s+(?='+TASK_PREFIX+TASK_HEADS+'(?=$|[\\s,.!?]))|\\s+(?:и|а\\s+потом|затем|потом|после\\s+этого)\\s+(?='+TASK_PREFIX+TASK_HEADS+'(?=$|[\\s,.!?])))','iu');
 const datedActionSeparator=new RegExp('\\s+(?=(?:сегодня|завтра|послезавтра)\\s+(?:(?:в|к)\\s+\\d{1,2}(?::\\d{2})?\\s+)?'+TASK_HEADS+'(?=$|[\\s,.!?]))','giu');
 // A new actionable verb can begin another request even without punctuation.
 const nextActionHead=new RegExp('(?:'+TASK_HEADS+')(?=$|[\\s,.!?])','giu');
 function splitLooseActions(fragment){
  const positions=[...fragment.matchAll(nextActionHead)].map(match=>match.index);
  if(positions.length<2)return [fragment];
  const cut=positions.slice(1).filter(at=>at>0&&/\s/u.test(fragment.charAt(at-1)));
  if(!cut.length)return [fragment];
  const parts=[];let start=0;
  for(const at of cut){parts.push(fragment.slice(start,at).trim());start=at}
  parts.push(fragment.slice(start).trim());return parts.filter(Boolean);
 }
 const names=new Set(('мирон мирону мирона мироном анна анне анну анной анны елена елене елену еленой елены андрей андрею андрея андреем ' +
  'алексей алексею алексея алексеем роман роману романа романом игорь игорю игоря игорем мария марии марию марией ' +
  'михаил михаилу михаила михаилом дмитрий дмитрию дмитрия дмитрием сергей сергею сергея сергеем ' +
  'павел павлу павла павлом иван ивану ивана иваном пётр петру петра петром николай николаю николая николаем ' +
  'ольга ольге ольгу ольгой ольги наталья наталье наталью натальей натальи татьяна татьяне татьяну татьяной ' +
  'юлия юлии юлию юлией светлана светлане светлану светланой екатерина екатерине екатерину екатериной ' +
  'максим максиму максима максимом артём артёму артёма артёмом наташа наташей наташу наташе наташи ' +
  'миша мише мишу миши мишей вася васе васю васи васей катя кате катю кати катей ' +
  'романе романов романы ' +
  'краснодар краснодаре москва москве сочи петербург петербурге').split(' '));
 const cap=value=>value.charAt(0).toLocaleUpperCase('ru-RU')+value.slice(1);
 const commonPeople={маме:1,мамой:1,маму:1,папе:1,папой:1,папу:1,другу:1,другом:1,друзьям:1,коллеге:1,коллегой:1,
  сотруднику:1,сотрудником:1,начальнику:1,начальником:1,клиенту:1,клиентом:1,оператору:1,оператором:1,
  врачу:1,врачом:1,мастеру:1,мастером:1,курьеру:1,курьером:1,человеком:1,девушкой:1,парнем:1,соседом:1};
 function contactWords(){
  try{
   const list=JSON.parse(root?.localStorage?.getItem('seyveo-private-contacts-v1')||'[]');
   if(!Array.isArray(list))return new Set();
   return new Set(list.slice(0,500).flatMap(person=>typeof person?.name==='string'?person.name.toLocaleLowerCase('ru-RU').split(/[\s-]+/u):[])
    .filter(word=>/^[а-яё]{3,30}$/u.test(word)));
  }catch{return new Set()}
 }
 function polishTitle(input){
  let value=correctKnownTypos(input).replace(/\s+/g,' ').trim().replace(/^[\s,;.!?:—–-]+|[\s,;.!?:—–-]+$/gu,'');
  value=value.replace(/^(?:срочно|немедленно|очень\s+важно|важно)\s*[:,!—–-]?\s*/iu,'');
  value=value.replace(/(?:^|[\s,])(?:на|по|адрес|улице|ул\.?)\s+([а-яё][а-яё-]{2,})\s*,?\s*(\d+[а-яё]?(?:\/\d+)?)(?=$|[\s,.!?])/giu,(match,street,num)=>{
   const before=match.slice(0,match.toLocaleLowerCase('ru-RU').indexOf(street.toLocaleLowerCase('ru-RU')));
   return before+cap(street)+', '+num;
  });
  const contacts=contactWords();
  value=value.replace(/\p{L}+/gu,(word,index,source)=>{
   const lower=word.toLocaleLowerCase('ru-RU');
   if(!names.has(lower)&&!contacts.has(lower))return word;
   const before=source.slice(Math.max(0,index-28),index).toLocaleLowerCase('ru-RU');
   // "роман" is also a book; keep ordinary nouns lowercase.
   if(/^роман(?:а|е|ов|ы)?$/u.test(lower)&&/(?:купить|прочитать|читать|дочитать|перечитать|книг[ауе]|в)\s+$/u.test(before))return word;
   return cap(word);
  });
  // For unfamiliar names, capitalize in an unambiguous person-directed
  // construction. Never replace spelling or guess a different person's name.
  value=value.replace(/(^|[\s,])(позвонить|созвониться|списаться|написать)\s+([а-яё]{3,30})(?=$|[\s,.!?])/giu,(match,prefix,verb,person)=>
   commonPeople[person.toLocaleLowerCase('ru-RU')]||/^(?:письмо|сообщение|смс|всем|кому|ещё)$/iu.test(person)?match:prefix+verb+' '+cap(person));
  value=value.replace(/(^|[\s,])(встретиться|встреча|поговорить|увидеться|созвониться)\s+с\s+([а-яё]{3,30})(?=$|[\s,.!?])/giu,(match,prefix,verb,person)=>
   (commonPeople[person.toLocaleLowerCase('ru-RU')]||/^(?:поставщик(?:ом)?|подрядчик(?:ом)?|заказчик(?:ом)?|партн[её]р(?:ом)?|представител[ье]м|директор(?:ом)?|руководител[ье]м|менеджер(?:ом)?)$/iu.test(person))?match:prefix+verb+' с '+cap(person));
  // A casually typed city belongs to the location, not inside the venue name.
  // Handle a stray closing quote as in "кафе вкусно и точка краснодар»".
  const cities={краснодар:'Краснодар',краснодаре:'Краснодар',москва:'Москва',москве:'Москва',сочи:'Сочи',казань:'Казань',казани:'Казань'};
  value=value.replace(/(кафе|ресторане|ресторана|ресторан|кофейне|магазин)\s+(?:«|")?(вкусно\s+и\s+точка)(?:»|")?\s*,?\s+(краснодаре?|москв[ае]|сочи|казан[ьи])(?:»|")?/giu,
   (_,kind,brand,city)=>kind+' «Вкусно — и точка», '+cities[city.toLocaleLowerCase('ru-RU')]);
  value=value.replace(/(кафе|ресторане|ресторана|ресторан|кофейне|магазин)\s+(?:«|")?(вкусно\s+и\s+точка)(?:»|")?/giu,(_,kind)=>kind+' «Вкусно — и точка»');
  value=value.replace(/\s+([,;:!?])/g,'$1').replace(/([,;:!?])(?=\p{L})/gu,'$1 ');
  return cap(value).slice(0,140);
 }
 function plan(input,now=new Date()){
  if(typeof input!=='string'||!input.trim()||input.length>700)return null;
  let body=unwrapOuterQuotes(correctKnownTypos(input).replace(/\r?\n+/g,'; ').replace(/\s+/g,' '))
   .replace(/^(?:(?:сэйви|сейви|сэй|сей)[,!:.,\s]+)?(?:пожалуйста[,]?\s+)?/iu,'')
   .replace(/^(?:напомни(?:те)?(?:\s+мне)?|запланируй|запиши|назначь|создай|добавь)\s+/iu,'');
  body=body.replace(/^(?:срочно|немедленно|очень\s+важно|важно)\s*[:,!—–-]?\s*/iu,'');
  const trailing=trailingReminder(body);body=trailing.body;
  let leadMinutes=trailing.leadMinutes;
  const lead=body.match(/^за\s+(час|один\s+час|1\s+час|полчаса|30\s+минут|15\s+минут)(?=$|[\s,.!?])/iu);
  if(lead){leadMinutes=/15/u.test(lead[1])?15:/полчаса|30/u.test(lead[1])?30:60;body=body.slice(lead[0].length).trim()}
  const parts=body.split(actionSeparator).flatMap(fragment=>fragment.split(datedActionSeparator)).flatMap(fragment=>splitLooseActions(fragment)).map(part=>part.trim()).filter(Boolean);
  if(!parts.length)return null;
  let inheritedDate='';
  const candidates=parts.map(part=>{
   const parsed=parse(part,now);
   const date=parsed?.date||inheritedDate;
   if(parsed?.date)inheritedDate=parsed.date;
   return {title:polishTitle(parsed?.title||part),date,time:parsed?.time||''};
  }).filter(item=>item.title);
  const unique=[...new Map(candidates.map(item=>[item.title.toLocaleLowerCase('ru-RU')+'|'+item.date+'|'+item.time,item])).values()];
  // Never silently combine five separate requests into one misleading task.
  const needsReview=unique.length>12;
  const items=unique.slice(0,12);
  return {items,date:items[0]?.date||'',time:items[0]?.time||'',leadMinutes,needsReview};
 }
 // Display-only ranges. Never rewrite the input.
 function recognizedRanges(value,now=new Date(),place=null){
  const raw=String(value||''), result=plan(raw,now);
  if(!result)return [];
  const ranges=[];
  function add(start,end,kind){
   if(end<=start||ranges.some(r=>start<r.end&&end>r.start))return;
   ranges.push({start,end,kind});
  }
  const escape=value=>Array.from(value).map(c=>'\\^$.*+?()[]{}|'.includes(c)?'\\'+c:c).join('');
  if(place?.venueName){
   const name=String(place.venueName).trim();
   if(name){
    const match=new RegExp(escape(name),'iu').exec(raw);
    if(match){
     const prefix=raw.slice(0,match.index).match(/(?:в|во|на|у)\s+(?:трц|тц|торговом\s+центре|торгово-развлекательном\s+центре|кафе|кофейне|ресторане|баре|пиццерии|отеле|гостинице|музее|кинотеатре)\s+[«"“]?$/iu);
     let end=match.index+match[0].length;
     if(/[»"”]/u.test(raw[end]||''))end++;
     add(prefix?match.index-prefix[0].length:match.index,end,'place');
    }
   }
  }
  if(place?.explicitCity&&place.city){
   const city=new RegExp(escape(place.city)+'(?:е)?(?=$|[\\s,.!?;])','giu');
   for(const m of raw.matchAll(city))add(m.index,m.index+m[0].length,'place');
  }
  const reminder=trailingReminder(raw);
  if(reminder.leadMinutes&&result.leadMinutes){
   const m=raw.match(/(?:и\s+)?напомни(?:те)?(?:\s+мне)?\s+за\s+[^.!?;]+[.!?;]*$/iu);
   if(m)add(m.index,m.index+m[0].length,'reminder');
  }
  const dates=/(?:^|[\s,;])((?:(?:на|в|во|к)\s+)?(?:сегодня|завтра|послезавтра|понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье|\d{1,2}[./-]\d{1,2}(?:[./-]\d{4})?|\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+\d{4})?))(?=$|[\s,.!?;])/giu;
  const times=/(?:^|[\s,;])((?:(?:в|к|на)\s+\d{1,2}(?::\d{1,2})?(?:\s*час(?:а|ов)?)?|\d{1,2}:\d{1,2})(?:\s+(?:утра|дня|вечера|ночи))?)(?=$|[\s,.!?;])/giu;
  for(const [regex,kind] of [[dates,'date'],[times,'time']]){
   for(const m of raw.matchAll(regex)){
    const parsed=parse('Дело '+m[1],now);
    if(parsed?.[kind]&&result.items.some(item=>item[kind]===parsed[kind])){
     const start=m.index+m[0].length-m[1].length;
     add(start,start+m[1].length,kind);
    }
   }
  }
  const contacts=contactWords();
  const roles=/^(?:поставщиком|заказчиком|подрядчиком|клиентом|партн[её]ром|руководителем|директором)$/iu;
  for(const m of raw.matchAll(/(?:встреча|встретиться|поговорить|увидеться|созвониться)\s+с\s+([\p{L}-]{3,30})/giu)){
   const word=m[1],lower=word.toLocaleLowerCase('ru-RU');
   if(names.has(lower)||contacts.has(lower)||commonPeople[lower]||roles.test(word)){
    const start=m.index+m[0].length-word.length;add(start,start+word.length,'person');
   }
  }
  return ranges.sort((a,b)=>a.start-b.start);
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={parse,signals,plan,polishTitle,recognizedRanges};
 if(root){root.SEYVEO_TASK_SMART_NL=parse;root.SEYVEO_TASK_SMART_SIGNALS=signals;root.SEYVEO_TASK_SMART_PLAN=plan;root.SEYVEO_TASK_SMART_RANGES=recognizedRanges;}
})(typeof window!=='undefined'?window:null);
