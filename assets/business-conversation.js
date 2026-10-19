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
  return {kind:'link',answer:'Получил ссылку на '+label+': '+link.host+'.\n\nМогу подготовить её для Карты бизнеса. Сохранение произойдёт только после вашего подтверждения. Затем предложу проверить публичную страницу; чтение товаров зависит от ограничений сайта.',
   action:oneAction('source','Проверить и добавить ссылку',{url:link.url,type:link.type})};
 }
 const isKnowledge=/(?:что (?:ты )?знаеш|что тебе известно|что известно|расскажи.*(?:о моем|о нашем|про мой|про наш)|сведения о|память о|карта бизнеса|знакомство с бизнесом)/i.test(q)&&/(?:бизнес|компан|магазин|дело|ресурс|мне|меня|нас)/i.test(q);
 const connect=/(?:подключ(?:ить|и|ение|ай|ите)?|интегрир|синхронизир|дать доступ|разреши доступ)/i.test(q)&&/(?:сервис|источник|crm|црм|битрикс|1с|авито|озон|ozon|wildberries|вб\b|маркетплейс|банк|почт|яндекс|сайт|телеграм|вконтакте|vk|данные|кабинет)/i.test(q);
 const sales=/(?:увелич|повыс|подним|рост|выраст|больше|привлеч|прибав|улучш|мало|падает|просел|подраст)/i.test(q)&&/(?:продаж|выручк|заказ|заяв|клиент|покупател|оборот|лид)/i.test(q);
 const costs=/(?:сниз|сократ|уменьш|эконом|разобрат|оптимизир|как|контролир|проанализир|проверь)/i.test(q)&&/(?:расход|затрат|бюджет|налог|прибыл|финанс|денег)/i.test(q);
 const catalog=/(?:изучи|изучить|проверь|посмотри|улучш|проанализир|как|анализ|покажи)/i.test(q)&&/(?:витрин|каталог|ассортимент|товар|карточк|интернет-магазин|маркетплейс|ozon|озон|wildberries)/i.test(q);
 const metrics=/(?:сколько|какая|какой|посчитай|покажи|статистик|показател|аналитик)/i.test(q)&&/(?:заказ|заяв|продаж|выручк|прибыл|расход|конверси|клиент)/i.test(q);
 const askBusiness=/^(?:(?:сейвео|seyveo)[,: ]+)?(?:помоги|хочу|нужно|давай|как)\s+(?:мне\s+)?(?:разобрать|организовать|управлять|наладить)\s+(?:мой|моим|нашим|мой\s+)?\s*бизнес/i.test(q);
 if(!(isKnowledge||connect||sales||costs||catalog||metrics||askBusiness)){
  // Only the immediately requested answer is treated as a business draft.
  // Unrelated messages clear this temporary state.
  const expected=pending;pending=null;
  const reply=raw.replace(/[.!?]+$/,'').trim();
  if(expected==='description'&&reply.length>=8&&reply.length<=1000&&
     !/(?:парол[ья]|password|access[_ -]?token|api[_ -]?key|client[_ -]?secret|bearer\s|otp|код\s+доступа|секретн)/i.test(reply)){
   return {kind:'description-draft',
    answer:'Понял ваше описание бизнеса:\n«'+clean(reply,260)+'».\n\nЯ ещё не сохранил его. Проверьте текст и подтвердите в Карте бизнеса.',
    action:oneAction('description','Проверить и сохранить описание',{value:reply})};
  }
  if(expected==='weekly'){
   const match=reply.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').match(/^(?:(?:примерно|около|порядка|у нас|было|получили)\s+)*(\d{1,6})(?:\s+(?:заявок|заявки|заявка|обращений|обращения|обращение|лидов|лида|лид))?(?:\s+(?:в|за)\s+(?:последнюю\s+)?недел[юеи])?$/);
   if(match){
    const value=Number(match[1]);
    return {kind:'weekly-draft',
     answer:'Вы указали около '+value+' новых обращений за неделю.\n\nЭто ваш ориентир, а не подтверждённая статистика CRM. Сохранить его в Карте бизнеса?',
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
  return {kind:'knowledge',answer:overview+'\n\n'+observed+'\nПодключённых внешних сервисов пока нет.\n\n'+(next?'Следующий полезный вопрос: '+next.title:'Можно продолжить знакомство и проверить, что ещё важно.'),action:oneAction('map','Открыть Карту бизнеса')};
 }
 if(connect){
  const type=/(?:crm|црм|битрикс)/i.test(q)?'crm':/(?:озон|ozon|wildberries|вб\b|маркетплейс)/i.test(q)?'marketplace':/(?:авито)/i.test(q)?'avito':/(?:банк)/i.test(q)?'bank':/(?:почт)/i.test(q)?'mail':/(?:сайт)/i.test(q)?'site':'';
  return {kind:'connect',answer:'Подключение должно быть с вашим явным согласием и только к необходимым данным.\n\nСейчас SEYVEO не имеет доступа к CRM, банковским счетам, маркетплейсам или перепискам. Я могу показать требования к будущему безопасному подключению, но не попрошу пароль, SMS-код или API-ключ.',
  action:oneAction('connections','Как устроено подключение',{type})};
 }
 if(!map||!map.description){
  return {kind:'business-start',answer:'Хочу помочь, но сначала важно понять ваше дело.\n\nРасскажите одним предложением, чем занимаетесь, в каком городе работаете и кто ваши клиенты. SEYVEO сохранит ответ в Карте бизнеса только с вашего подтверждения.\n\nПока реальные аналитика и ИИ не подключены.',
   action:oneAction('map','Рассказать о бизнесе')};
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
   action:oneAction('map','Карта бизнеса')};
 }
 if(costs){
  return {kind:'finance',answer:facts+'\n\nПредлагаю начать с одного вопроса: какие три статьи расходов сейчас самые крупные?\n\nБез подтверждённых сумм и доступа к учёту я не могу назвать ваши потери или обещать экономию. Сначала соберём структуру затрат и только затем будем выбирать решения.',
   action:oneAction('map','Уточнить финансы бизнеса')};
 }
 if(catalog){
  if(linkKnown){
   const subject=linkKnown.method==='owner'?'со слов владельца':'из открытой страницы';
   const productInfo=linkKnown.products?.length?'Названия товаров: '+linkKnown.products.slice(0,3).map(x=>clean(x,65)).join(', ')+'. ':'';
   return {kind:'catalog',answer:'По указанной витрине сохранены сведения '+subject+'. '+productInfo+
    '\n\nЯ могу предложить проверить названия, описания и карточки товаров, но не могу оценить весь каталог, спрос или продажи по одной странице. Откройте Карту бизнеса, чтобы продолжить проверку.',
    action:oneAction('map','Открыть витрину в Карте')};
  }
  return {kind:'catalog',answer:facts+'\n\nДля предметной проверки понадобится публичная ссылка на сайт или витрину Ozon, Wildberries, Авито. Если магазин запрещает чтение, вы сможете описать ассортимент сами.\n\nБез реальных данных я не буду придумывать товары.',
    action:oneAction('map','Добавить ссылку на витрину')};
 }
 if(metrics){
  const weekly=map.weeklyRequests;
  const known=weekly&&Number.isSafeInteger(weekly.value)&&weekly.value>=0
   ?'Со слов владельца сохранён ориентир: около '+weekly.value+' обращений за неделю. Это не онлайн-статистика.\n\n':'';
  return {kind:'metrics',answer:facts+'\n\n'+known+
   'Пока я не могу достоверно назвать число заказов, прибыль или конверсию: доступ к статистике и финансам не подключён.\n\nМожно уточнить другие показатели и затем выбрать подходящий источник данных.',
   action:oneAction('map','Уточнить показатели')};
 }
 return {kind:'business',answer:facts+'\n\nДавайте сначала обозначим вашу ближайшую цель. Тогда я смогу предложить нужный следующий вопрос и источник данных. Я пока работаю с локально указанными сведениями, не с настоящей бизнес-аналитикой.',
   action:oneAction('map','Продолжить знакомство')};
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
 if(!['map','source','connections','description','weekly'].includes(action.kind))return;
 currentAction=action;
 cta.textContent=clean(action.label,54);
 cta.hidden=false;
}
cta.addEventListener('click',()=>{
 const action=currentAction;if(!action)return;
 let done=false;
 if(['map','source','description'].includes(action.kind)){
  const args=action.kind==='source'?{sourcePrefill:{url:action.url,type:action.type}}:
   action.kind==='description'?{aboutPrefill:action.value}:{};
  done=window.SEYVEO_BUSINESS_MAP?.open?.(args)===true;
 }else if(action.kind==='weekly'){
  const result=window.SEYVEO_BUSINESS_MAP?.saveWeeklyRequests?.(action.value);
  if(result?.ok){
   $('orbInlineReplyText').textContent=result.message+
    '\n\nЭто введённый вами ориентир, а не данные из внешних сервисов.';
   done=true;
  }else{
   $('orbInlineReplyText').textContent=result?.message||'Не удалось сохранить показатель. Проверьте Карту бизнеса.';
  }
 }else if(action.kind==='connections'){
  const page=$('navManage');
  if(page){page.click();
   window.dispatchEvent(new CustomEvent('seyveo:connection-help',{detail:{type:action.type||''}}));
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
