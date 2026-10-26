/* SEYVEO · Business Conversation v1
 * One shared assistant input. Local knowledge from the confirmed Business Map.
 * Deterministic, transparent guidance: NOT an LLM, web analysis or CRM access.
 * Actions open EXISTING screens; no silent writes, credentials or permissions.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const cta=$('orbInlineBusinessAction');
if(!cta)return;
let pending=null; // one immediate follow-up, no writes until owner confirms
const INDUSTRIES=Object.freeze({
 auto:'автоуслуги',beauty:'красота и уход',retail:'розничная торговля',
 ecommerce:'интернет-магазин',construction:'строительство и ремонт',
 food:'кафе или ресторан',services:'профессиональные услуги',other:'другая сфера'
});
const SOURCES=Object.freeze({
 site:'сайт',marketplace:'маркетплейс',crm:'CRM',yandex:'Яндекс Бизнес',
 gis:'2ГИС',avito:'Авито',vk:'ВКонтакте',telegram:'Telegram',
 ads:'реклама',accounting:'бухгалтерия',bank:'банк',mail:'почта'
});
const clean=(text,n)=>String(text||'').replace(/\s+/g,' ').trim().slice(0,n);
function publicLink(text){
 const m=String(text||'').match(/https:\/\/[^\s<>"'`]+/i);
 if(!m)return null;
 const raw=m[0].replace(/[),.!?;]+$/g,'');
 try{
  const url=new URL(raw);
  const host=url.hostname.toLowerCase();
  if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443'))return null;
  if(!host||!host.includes('.')||host==='localhost'||host.endsWith('.local')||
     host.endsWith('.internal')||host.endsWith('.localhost')||/^[\d.:\[\]]+$/.test(host)||
     /^(?:10|127|192\.168|169\.254|0)\./.test(host))return null;
  if(/[?&](?:token|auth|password|secret|key|api[_-]?key|access[_-]?token|session|code|signature)=/i.test(url.search))return null;
  url.search='';url.hash='';
  if(url.href.length>180)return null;
  let type='site';
  if(/(?:^|\.)(?:ozon\.ru|wildberries\.ru|wb\.ru)$/.test(host))type='marketplace';
  else if(/(?:^|\.)avito\.ru$/.test(host))type='avito';
  else if(/(?:^|\.)vk\.com$/.test(host))type='vk';
  return {url:url.href,type,host};
 }catch{return null}
}
function getMap(){
 const state=window.SEYVEO_BUSINESS_MAP?.getState?.();
 return state&&typeof state==='object'&&Array.isArray(state.resources)?state:null;
}
function shortFacts(map){
 if(!map)return 'Я пока не знаю, чем занимается ваш бизнес.';
 const facts=[];
 const industry=INDUSTRIES[map.industry];
 if(industry)facts.push('сфера — '+industry);
 if(map.description)facts.push('описание бизнеса вы уже предоставили');
 if(map.goal)facts.push('цель — '+clean(map.goal,115));
 const resources=map.resources.filter(x=>x&&x.type&&x.value).slice(0,4);
 if(resources.length){
  const types=[...new Set(resources.map(x=>SOURCES[x.type]||'другой сервис'))];
  facts.push('указаны ресурсы: '+types.join(', ')+(map.resources.length>4?' и другие':''));
 }
 return facts.length?'Мне известно: '+facts.join('; ')+'.':'Сведений о компании пока немного.';
}
function mainSource(map){
 if(!map)return '';
 const types=new Set(map.resources.map(x=>x.type));
 const preferred=['crm','site','marketplace','avito','vk','yandex'];
 return preferred.find(t=>types.has(t))||'';
}
function confirmedStorefront(map){
 if(!map||!Array.isArray(map.storefronts))return null;
 const links=new Set(map.resources.map(x=>clean(x.value,180)));
 const observations=map.storefronts.filter(x=>x&&links.has(x.url));
 return observations.length?observations[observations.length-1]:null;
}
function resourceType(q){
 if(/crm|црм|битрикс/i.test(q))return 'crm';
 if(/ozon|озон|wildberries|вайлдбер|маркетплейс|(?:^|\s)вб(?:$|[\s.,!?])/.test(q))return 'marketplace';
 if(/вконтакт|(?:^|\s)вк(?:$|[\s.,!?])|\bvk\b|соцсет/.test(q))return 'vk';
 if(/telegram|телеграм|(?:^|\s)тг(?:$|[\s.,!?])/.test(q))return 'telegram';
 if(/2гис|яндекс\s*(?:бизнес|карт)|на картах|в картах/.test(q))return 'maps';
 if(/авито|avito/.test(q))return 'avito';
 if(/почт|email|e-mail/.test(q))return 'mail';
 if(/1с|бухгалтер/.test(q))return 'accounting';
 if(/банков|банк/.test(q))return 'bank';
 if(/реклам|объявлен/.test(q))return 'ads';
 if(/сайт|интернет-магазин|веб-страниц/.test(q))return 'site';
 return '';
}
const explanations={
 crm:'CRM — электронная тетрадь для клиентов и заявок: помогает помнить, кто позвонил, о чём договорились и кому перезвонить. Под стопкой бумаг не потеряется.',
 site:'Сайт — ваша вывеска и приёмная в интернете: здесь люди узнают об услугах и способе заказать.',
 vk:'ВКонтакте — место, где можно показывать услуги, отвечать людям и принимать вопросы.',
 telegram:'Telegram — канал для новостей или рабочий чат. Канал и бот — разные инструменты.',
 marketplace:'Ozon и Wildberries — торговые площадки. Чтобы найти покупателей, важны карточки товаров и реальные условия доставки.',
 maps:'Карты помогают местным клиентам найти адрес, часы работы и номер телефона.',
 avito:'Авито — площадка объявлений: люди уже ищут услуги и товары, важно ясно описать предложение.',
 ads:'Реклама — приглашение познакомиться с вашим делом. Главное — реальные обращения, а не красивые цифры просмотров.',
 mail:'Почта — цифровой рабочий ящик для писем, заявок и документов.',
 accounting:'Бухгалтерия помогает учитывать деньги, расходы и документы, не путая выручку с прибылью.',
 bank:'Банк показывает движение денег. Счета и операции SEYVEO пока не видит.'
};
function oneAction(kind,label,extra){
 return Object.freeze({kind,label,...(extra||{})});
}
function help(question){
 if(typeof question!=='string'||question.length>900)return null;
 const raw=question.trim();
 if(!raw||/[\u0000-\u0008]/.test(raw))return null;
 const q=raw.toLocaleLowerCase('ru-RU').replace(/ё/g,'е');
 const link=publicLink(raw);
 const hasUrl=/https:\/\//i.test(raw);
 const isLinkContext=/(?:сайт|ссылк|магазин|витрин|ozon|озон|wildberries|вайлдбер|вб\b|авито|каталог|товар|продаю|наш ресурс|мой ресурс|наш бизнес|мой бизнес|посмотри|изучи)/i.test(q)||!!raw.match(/^https:\/\//i);
 if(hasUrl&&isLinkContext){
  if(!link)return {answer:'Я вижу ссылку, но не могу безопасно подготовить её. Пришлите общедоступный адрес HTTPS без паролей, кодов доступа и секретных параметров.',action:null,kind:'link-invalid'};
  const label=link.type==='marketplace'?'витрину маркетплейса':link.type==='avito'?'страницу Авито':link.type==='vk'?'страницу ВКонтакте':'сайт компании';
  return {kind:'link',answer:'Получил ссылку на '+label+': '+link.host+'.\n\nМогу предложить добавить её в «Подключения». Адрес сохранится только после вашего подтверждения. Доступ к самому сервису отдельно не подключается.',
   action:oneAction('source','Проверить и добавить ссылку',{url:link.url,type:link.type})};
 }
 const isKnowledge=/(?:что (?:ты )?знаеш|что тебе известно|что известно|расскажи.*(?:о моем|о нашем|про мой|про наш)|сведения о|память о|карта бизнеса|знакомство с бизнесом)/i.test(q)&&/(?:бизнес|компан|магазин|дело|ресурс|мне|меня|нас)/i.test(q);
 const resource=resourceType(q);
 const explain=/(?:что такое|что значит|объясни|поясни|что за|для чего|зачем нужен|зачем мне|простыми словами|как работает|crm это что|црм это что)/.test(q)&&
  /(?:crm|црм|битрикс|api|апи|интеграц|соцсет|маркетплейс|вконтакт|vk|телеграм|telegram|сайт|авито)/.test(q);
 const specialist=/(?:программист|разработчик|специалист|техзадани|техническое задание|(?:^|\s)тз(?:$|[\s.,!?]))/.test(q)&&
  /(?:подключ|сервис|интеграц|соцсет|сайт|crm|црм|озон|маркетплейс|авито|передать|поручить|настроить|задани)/.test(q);
 const promote=/(?:продвига|продвигать|продвижен|раскрут|рекламир|запустить рекламу|привлечь клиентов|больше клиентов из)/.test(q)&&
  /(?:бизнес|компан|сайт|магазин|соцсет|вконтакт|вк(?:$|[\s.,!?])|vk\b|телеграм|telegram|озон|ozon|wildberries|(?:^|\s)вб(?:$|[\s.,!?])|карточк|авито|товар|услуг|реклам|клиент|продаж|маркетплейс)/.test(q);
 const connect=/(?:подключ|интегрир|синхронизир|дать доступ|разреши доступ)/.test(q)&&
  /(?:сервис|источник|crm|црм|битрикс|1с|авито|озон|ozon|wildberries|вб\b|маркетплейс|банк|почт|яндекс|сайт|телеграм|вконтакте|vk|данные|кабинет|соцсет|2гис|(?:^|\s)вк(?:$|[\s.,!?])|(?:^|\s)тг(?:$|[\s.,!?]))/.test(q);
  const sales=/(?:увелич|повыс|подним|рост|выраст|больше|привлеч|прибав|улучш|мало|падает|просел|подраст)/i.test(q)&&/(?:продаж|выручк|заказ|заяв|клиент|покупател|оборот|лид)/i.test(q);
 const costs=/(?:сниз|сократ|уменьш|эконом|разобрат|оптимизир|как|контролир|проанализир|проверь)/i.test(q)&&/(?:расход|затрат|бюджет|налог|прибыл|финанс|денег)/i.test(q);
 const catalog=/(?:изучи|изучить|проверь|посмотри|улучш|проанализир|как|анализ|покажи)/i.test(q)&&/(?:витрин|каталог|ассортимент|товар|карточк|интернет-магазин|маркетплейс|ozon|озон|wildberries)/i.test(q);
 const metrics=/(?:сколько|какая|какой|посчитай|покажи|статистик|показател|аналитик)/i.test(q)&&/(?:заказ|заяв|продаж|выручк|прибыл|расход|конверси|клиент)/i.test(q);
 const askBusiness=/^(?:(?:сейвео|seyveo)[,: ]+)?(?:помоги|хочу|нужно|давай|как)\s+(?:мне\s+)?(?:разобрать|организовать|управлять|наладить)\s+(?:мой|моим|нашим|мой\s+)?\s*бизнес/i.test(q);
 if(!(isKnowledge||connect||sales||costs||catalog||metrics||askBusiness||explain||specialist||promote)){
  // Only the immediately requested answer is treated as a business draft.
  // Unrelated messages clear this temporary state.
  const expected=pending;pending=null;
  const reply=raw.replace(/[.!?]+$/,'').trim();
  if(expected==='description'&&reply.length>=8&&reply.length<=1000&&
     !/(?:парол[ья]|password|access[_ -]?token|api[_ -]?key|client[_ -]?secret|bearer\s|otp|код\s+доступа|секретн)/i.test(reply)){
   return {kind:'description-draft',
    answer:'Понял ваше описание бизнеса:\n«'+clean(reply,260)+'».\n\nЭто пока только наш разговор. В сведения о бизнесе я его не записываю без вашего подтверждения.',
    action:null};
  }
  if(expected==='weekly'){
   const match=reply.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').match(/^(?:(?:примерно|около|порядка|у нас|было|получили)\s+)*(\d{1,6})(?:\s+(?:заявок|заявки|заявка|обращений|обращения|обращение|лидов|лида|лид))?(?:\s+(?:в|за)\s+(?:последнюю\s+)?недел[юеи])?$/);
   if(match){
    const value=Number(match[1]);
    return {kind:'weekly-draft',
     answer:'Вы указали около '+value+' новых обращений за неделю.\n\nЭто ваш ориентир, а не подтверждённая статистика CRM. Хотите сохранить этот ориентир в локальных сведениях?',
     action:oneAction('weekly','Сохранить '+value+' обращений в неделю',{value})};
   }
  }
  return null;
 }
 const map=getMap();
 if(isKnowledge){
  const overview=shortFacts(map);
  const storefront=confirmedStorefront(map);
  const observed=storefront?(storefront.method==='owner'?'Вы описали ассортимент одной витрины.':'Сохранены подтверждённые вами сведения одной публичной страницы.'):'Данных о товарах из витрин пока нет.';
  const next=window.SEYVEO_BUSINESS_MAP?.getAdvice?.()?.[0];
  return {kind:'knowledge',answer:overview+'\n\n'+observed+'\nПодключённых внешних сервисов пока нет.\n\n'+(next?'Следующий полезный вопрос: '+next.title:'Можно продолжить знакомство и проверить, что ещё важно.'),action:null};
 }
 if(explain){
  const text=/\bapi\b|апи/.test(q)
   ?'API — это официальная дверца, через которую программы могут обмениваться нужными данными. Открывать её можно только с разрешения владельца. Пароли для этого в чат не нужны.'
   :/интеграц/.test(q)
    ?'Интеграция — это когда две программы умеют передавать друг другу нужные сведения. Сначала договариваются, кому и что разрешено видеть.'
    :(explanations[resource]||'Разберёмся, что это за инструмент и нужен ли он именно вашему бизнесу.');
  return {kind:'explain',answer:text+'\n\nПокажу простые шаги. Если инструмент не нужен, подключать его не станем. Сейчас SEYVEO только объясняет, внешние сервисы не подключены.',
   action:oneAction('connections','Показать шаги',{type:resource||'site'})};
 }
 if(specialist){
  return {kind:'specialist',answer:'Если есть программист, отлично. Вы говорите, чего хотите добиться, а я подготовлю понятное задание: какие сведения нужны, какие права согласовать и как проверить результат.\n\nНи пароли, ни секретные ключи мне присылать не нужно.',
   action:oneAction('connections','Задание специалисту',{type:resource||'site',specialist:true})};
 }
 if(promote){
  return {kind:'promotion',answer:'Продвижение — это не соревнование по количеству лайков. Нам нужны реальные обращения.\n\nНачнём с понятного предложения клиенту, проверим, где его увидят, и как вы узнаете, что он обратился. Денег SEYVEO не тратит и рекламу не запускает без согласования.',
   action:oneAction('connections','План привлечения клиентов',{type:resource||'ads',goal:'promote'})};
 }
 if(connect){
  return {kind:'connect',answer:(explanations[resource]||'Сначала разберёмся, зачем нужен этот сервис.')+
   '\n\nПодключение — отдельное разрешение на необходимые сведения. SEYVEO пока не читает внешние сервисы и не попросит пароль, SMS-код или секретный ключ. Можем пройти шаги сами либо передать их специалисту.',
   action:oneAction('connections','Как подключить',{type:resource||'site'})};
 }
  if(!map||!map.description){
  return {kind:'business-start',answer:'Хочу помочь, но сначала важно понять ваше дело.\n\nРасскажите одним предложением, чем занимаетесь, в каком городе работаете и кто ваши клиенты. Пока я могу обсудить это с вами, но не записываю сведения бизнеса без отдельного подтверждения.\n\nПока реальные аналитика и ИИ не подключены.',
   action:null};
 }
 const facts=shortFacts(map),knownSource=mainSource(map);
 const linkKnown=confirmedStorefront(map);
 if(sales){
  const weekly=map.weeklyRequests;
  const knownCount=weekly&&Number.isSafeInteger(weekly.value)&&weekly.value>=0;
  const question=knownCount
   ?'Следующий вопрос: сколько из этих обращений стало оплаченными заказами? Пока этих данных нет.'
   :'Сколько новых заявок или обращений было за последние 7 дней? Можно ответить одним числом.';
  return {kind:'sales',awaitingWeekly:!knownCount,answer:facts+'\n\n'+
   (knownCount?'Вы сообщили ориентир: около '+weekly.value+' обращений за неделю (не данные CRM).\n\n':'')+
   'Для роста продаж нужна исходная точка. '+question+'\n\n'+
   (linkKnown?'Сведения об одной витрине сохранены, но это не статистика продаж. ':'')+
   'Сейчас SEYVEO не читает реальные заявки или выручку — сервисы ещё не подключены.',
   action:null};
 }
 if(costs){
  return {kind:'finance',answer:facts+'\n\nПредлагаю начать с одного вопроса: какие три статьи расходов сейчас самые крупные?\n\nБез подтверждённых сумм и доступа к учёту я не могу назвать ваши потери или обещать экономию. Сначала соберём структуру затрат и только затем будем выбирать решения.',
   action:null};
 }
 if(catalog){
  if(linkKnown){
   const subject=linkKnown.method==='owner'?'со слов владельца':'из открытой страницы';
   const productInfo=linkKnown.products?.length?'Названия товаров: '+linkKnown.products.slice(0,3).map(x=>clean(x,65)).join(', ')+'. ':'';
   return {kind:'catalog',answer:'По указанной витрине сохранены сведения '+subject+'. '+productInfo+
    '\n\nЯ могу предложить проверить названия, описания и карточки товаров, но не могу оценить весь каталог, спрос или продажи по одной странице. Если захотите продолжить проверку, добавьте публичную ссылку в «Подключениях».',
    action:null};
  }
  return {kind:'catalog',answer:facts+'\n\nДля предметной проверки понадобится публичная ссылка на сайт или витрину Ozon, Wildberries, Авито. Если магазин запрещает чтение, вы сможете описать ассортимент сами.\n\nБез реальных данных я не буду придумывать товары.',
    action:null};
 }
 if(metrics){
  const weekly=map.weeklyRequests;
  const known=weekly&&Number.isSafeInteger(weekly.value)&&weekly.value>=0
   ?'Со слов владельца сохранён ориентир: около '+weekly.value+' обращений за неделю. Это не онлайн-статистика.\n\n':'';
  return {kind:'metrics',answer:facts+'\n\n'+known+
   'Пока я не могу достоверно назвать число заказов, прибыль или конверсию: доступ к статистике и финансам не подключён.\n\nМожно уточнить другие показатели и затем выбрать подходящий источник данных.',
   action:null};
 }
 return {kind:'business',answer:facts+'\n\nДавайте сначала обозначим вашу ближайшую цель. Тогда я смогу предложить нужный следующий вопрос и источник данных. Я пока работаю с локально указанными сведениями, не с настоящей бизнес-аналитикой.',
   action:null};
}
let currentAction=null;
function reset(){
 currentAction=null;
 cta.hidden=true;
 cta.textContent='';
}
function show(result){
 reset();
 pending=result?.kind==='business-start'?'description':
  result?.kind==='sales'&&result.awaitingWeekly?'weekly':null;
 if(!result?.action)return;
 const action=result.action;
 if(!['source','connections','weekly'].includes(action.kind))return;
 currentAction=action;
 cta.textContent=clean(action.label,54);
 cta.hidden=false;
}
cta.addEventListener('click',()=>{
 const action=currentAction;if(!action)return;
 let done=false;
 if(action.kind==='source'){
  // One destination only: the existing service editor under Connections.
  const page=$('navManage');
  if(page){
   page.click();
   window.dispatchEvent(new CustomEvent('seyveo:connection-help',{
    detail:{type:action.type||'site',sourcePrefill:action.url||''}
   }));
   done=true;
  }
 }else if(action.kind==='weekly'){
  const result=window.SEYVEO_BUSINESS_MAP?.saveWeeklyRequests?.(action.value);
  if(result?.ok){
   $('orbInlineReplyText').textContent=result.message+
    '\n\nЭто введённый вами ориентир, а не данные из внешних сервисов.';
   done=true;
  }else{
   $('orbInlineReplyText').textContent=result?.message||'Не удалось сохранить показатель. Попробуйте ещё раз.';
  }
 }else if(action.kind==='connections'){
  const page=$('navManage');
  if(page){page.click();
   window.dispatchEvent(new CustomEvent('seyveo:connection-help',{detail:{type:action.type||'',goal:action.goal||'learn',specialist:action.specialist===true}}));
   done=true;
  }
 }
 if(done){
  if(action.kind==='weekly'){reset();return}
  const close=$('orbInlineReplyClose');if(close)close.click();
  reset();
 }
});
window.SEYVEO_BUSINESS_DIALOG=Object.freeze({understand:help,show,reset});
})();
