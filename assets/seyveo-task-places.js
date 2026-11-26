/* SEYVEO · Place enrichment for Sayvi's task composer.
 * Only a committed venue/address is searched, never the whole private task.
 * The public Nominatim endpoint is a low-volume prototype fallback; configure
 * SEYVEO_PLACE_SEARCH_ENDPOINT for a dedicated service before scaling. */
((root)=>{
 'use strict';
 const CITY_FORMS={краснодар:'Краснодар',краснодаре:'Краснодар',москва:'Москва',москве:'Москва',сочи:'Сочи',казань:'Казань',казани:'Казань',новосибирск:'Новосибирск',новосибирске:'Новосибирск',екатеринбург:'Екатеринбург',екатеринбурге:'Екатеринбург',петербург:'Санкт-Петербург',петербурге:'Санкт-Петербург'};
 const KIND_FORMS={кафе:'кафе',кофейне:'кофейня',ресторане:'ресторан',баре:'бар',пабе:'паб',пиццерии:'пиццерия',бистро:'бистро',пекарне:'пекарня',отеле:'отель',гостинице:'гостиница',коворкинге:'коворкинг',музее:'музей',кинотеатре:'кинотеатр'};
 // Known restaurant address: the chain's public list confirms the address;
 // the first floor is an owner correction. The marker locates the *mall*,
 // not the restaurant entrance. Never present it as a precise doorway.
 const VERIFIED_VENUES=[Object.freeze({
  venue:'вкусно и точка',city:'Краснодар',
  name:'Вкусно — и точка · ТРЦ «Красная Площадь»',
  address:'ул. Дзержинского, 100 · Краснодар · 1-й этаж',
  lat:45.102210,lon:38.983892,precision:'building',
  source:'known-address',sourceUrl:'',
  // Real photograph of the shopping centre entrance, NOT the cafe doorway.
  // Andrew Butko · CC BY-SA 4.0 · Wikimedia Commons (11 July 2024).
  photo:'2024-07-11. Краснодар DSC 2268.jpg',
  // Opening hours are from a public directory for THIS first-floor branch,
  // not a live confirmation by the restaurant. Never mix in floor 3 (10–22).
  openingHours:'06:00–04:00',
  hoursSourceURL:'https://tastyandpoint.com/restaurants/krasnodar/',
  // Chain-wide official menu; prices are region-dependent and NOT a quote
  // for the restaurant on the first floor. A small labelled preview only.
  menuURL:'https://vkusnoitochka.ru/menu',
  menuPreview:Object.freeze([
   Object.freeze({name:'Особый Супер Бокс',price:'от 539 ₽'}),
   Object.freeze({name:'Биг Спешиал Три сыра',price:'от 369 ₽'}),
   Object.freeze({name:'Корн-доги мини',price:'от 199 ₽'})
  ]),
  keywords:['красная площадь','дзержинского','100']
 }),Object.freeze({
  venue:'красная площадь',city:'Краснодар',name:'ТРЦ «Красная Площадь»',
  address:'ул. Дзержинского, 100 · Краснодар',
  lat:45.102210,lon:38.983892,precision:'building',source:'known-address',
  photo:'2024-07-11. Краснодар DSC 2268.jpg',
  keywords:['красная площадь','дзержинского','100']
 })];
 const meeting=/(?:^|[\s,.!?])(?:встреч[а-яё]*|встрет[а-яё]*|переговор[а-яё]*|пообед[а-яё]*|поужин[а-яё]*|позавтрак[а-яё]*|обед|ужин|завтрак|кофе|посид[а-яё]*)(?=$|[\s,.!?])/iu;
 function normalize(value){return String(value||'').replace(/[«»"“”]/g,'').replace(/\s+/g,' ').trim()}
 function searchText(value){return normalize(value).toLocaleLowerCase('ru-RU').replace(/[—–-]/gu,' ').replace(/\s+/gu,' ').trim()}
 function validCity(value){return typeof value==='string'&&/^[\p{L} -]{2,60}$/u.test(value.trim())?value.trim():''}
 // Location is used only in memory for ordering search results. Never ask
 // the OS for a fresh permission as a side effect of typing a task.
 async function grantedLocation(){
  const navigator=root?.navigator;
  if(!navigator?.permissions?.query||!navigator?.geolocation?.getCurrentPosition)return null;
  try{
   const permission=await navigator.permissions.query({name:'geolocation'});
   if(permission?.state!=='granted')return null;
   return await new Promise(resolve=>{
    let complete=false;
    const finish=value=>{if(!complete){complete=true;resolve(value)}};
    const timer=setTimeout(()=>finish(null),5500);
    try{
     navigator.geolocation.getCurrentPosition(position=>{
      clearTimeout(timer);
      const lat=Number(position?.coords?.latitude),lon=Number(position?.coords?.longitude),accuracy=Number(position?.coords?.accuracy);
      finish(Number.isFinite(lat)&&Math.abs(lat)<=90&&Number.isFinite(lon)&&Math.abs(lon)<=180&&
       Number.isFinite(accuracy)&&accuracy>=0&&accuracy<=20000?{lat,lon}:null);
     },()=>{clearTimeout(timer);finish(null)},
     {enableHighAccuracy:false,maximumAge:300000,timeout:5000});
    }catch{clearTimeout(timer);finish(null)}
   });
  }catch{return null}
 }
 function suggestedCity(){
  // Explicit place preference wins; then a saved business city; then the city
  // the person sees in SEYVEO's weather. Never infer GPS without consent.
  try{
   const saved=validCity(root?.localStorage?.getItem('seyveo-place-city-v1'));
   if(saved)return saved;
   // A voluntarily saved home/work city also works when GPS is disabled.
   const personal=validCity(root?.SEYVEO_SAVED_PLACES?.city?.());
   if(personal)return personal;
   const company=JSON.parse(root?.localStorage?.getItem('seyveo-company-passport-v1')||'null');
   const city=validCity(company?.city);if(city)return city;
  }catch{}
  return validCity(root?.SAYVI_WEATHER?.getLocation?.()?.name);
 }
 function setPreferredCity(value){
  const city=validCity(value);
  if(!city)return false;
  try{root?.localStorage?.setItem('seyveo-place-city-v1',city)}catch{}
  return true;
 }
 function extract(input,options={}){
  let phrase=String(input||'').slice(0,500);
  if(!meeting.test(phrase))return null;
  // A natural landmark-first phrase is equivalent to a venue-first phrase.
  // Normalize only the known branch pair, never an arbitrary address.
  phrase=phrase.replace(/(?:на|в)\s+(?:трц\s+|тц\s+)?[«"]?красн(?:ой|ая)\s+площад(?:и|ь)[»"]?\s*,?\s+(?:в\s+)?кафе\s+[«"]?вкусно\s+(?:[—–-]\s*)?и\s+точка[»"]?/iu,
   'в кафе «Вкусно — и точка», ТРЦ Красная Площадь');
  const cityMatch=phrase.match(/(?:^|[\s,.!?])(?:в\s+городе\s+|г\.\s*)([А-ЯЁ][А-ЯЁа-яё-]{2,}(?:\s+[А-ЯЁ][А-ЯЁа-яё-]+)?)/u)
   ||phrase.match(/(?:^|[\s,.!?])в\s+(Краснодаре|Москве|Сочи|Казани|Новосибирске|Екатеринбурге|Петербурге)(?=$|[\s,.!?])/iu);
  let city=cityMatch?(CITY_FORMS[cityMatch[1]?.toLocaleLowerCase('ru-RU')]||cityMatch[1]):'';
  const address=phrase.match(/(?:^|[\s,.!?])(?:по\s+адресу|это\s+адрес|адрес\s*[:—]?)\s*([^!?\n]{6,110})/iu);
  let addressDetail='';
  if(address){
   addressDetail=normalize(address[1].replace(/\s+(?:сегодня|завтра|послезавтра|в\s+\d{1,2}(?::\d{2})?)(?=$|[\s,.!?]).*$/iu,'')
    .replace(/^((?:улица|ул\.?\s*)?\s*[А-ЯЁа-яё][А-ЯЁа-яё\s.-]{2,55}?\s+\d+[А-ЯЁа-яё]?(?:\/\d+)?)(?:\s+.*)?$/iu,'$1'));
  }
  const venue=phrase.match(/(?:^|[\s,.!?])(?:в|во|у)\s+(кафе|кофейне|ресторане|баре|пабе|пиццерии|бистро|пекарне|отеле|гостинице|коворкинге|музее|кинотеатре)\s+(«[^»]{2,70}»|"[^"]{2,70}"|[^,.!?\n]{2,100})/iu);
  if(!venue){
   // Named shopping centres are explicit destinations, not cafe categories.
   const mall=phrase.match(/(?:^|[\s,.!?])(?:в|во|на|у)\s+(?:трц|тц|торговом\s+центре|торгово-развлекательном\s+центре|мегацентре)\s+(«[^»]{2,70}»|"[^"]{2,70}"|[^,.!?\n]{2,90})/iu);
   if(mall){
    let name=normalize(mall[1]);
    const after=phrase.slice(mall.index+mall[0].length);
    const trailingCity=after.match(/^\s*,?\s*(краснодаре?|москв[ае]|сочи|казан[ьи]|новосибирск(?:е)?|екатеринбург(?:е)?|петербург(?:е)?)(?=$|[\s,.!?;])/iu);
    const embeddedCity=name.match(/\s+(краснодаре?|москв[ае]|сочи|казан[ьи]|новосибирск(?:е)?|екатеринбург(?:е)?|петербург(?:е)?)$/iu);
    if(embeddedCity)name=name.slice(0,embeddedCity.index).trim();
    const explicit=trailingCity||embeddedCity;
    city=city||(explicit?CITY_FORMS[explicit[1].toLocaleLowerCase('ru-RU')]:null)||validCity(options.city)||suggestedCity();
    name=name.replace(/\s+(?:напомни(?:те)?|сегодня|завтра|послезавтра|в\s+\d{1,2}(?::\d{2})?).*$/iu,'').trim();
    if(name.length>=2)return {label:'ТРЦ «'+name+'»',query:['ТРЦ '+name,addressDetail,city].filter(Boolean).join(', ').slice(0,140),
     explicitAddress:false,city,explicitCity:Boolean(cityMatch||explicit),citySelected:Boolean(options.city),
     venueName:name,kind:'трц',locationHint:addressDetail};
   }
   if(addressDetail.length<6)return null;
   city=city||validCity(options.city)||suggestedCity();
   return {label:'Место встречи',query:[addressDetail,city].filter(Boolean).join(', '),
    explicitAddress:true,city,explicitCity:Boolean(cityMatch),citySelected:Boolean(options.city)};
  }
  const kind=KIND_FORMS[venue[1].toLocaleLowerCase('ru-RU')];
  let name=normalize(venue[2]);
  const qualifier=name.match(/\s+(?=(?:(?:в|во)\s+)?(?:тц|трц|торговый\s+центр|торговом\s+центре|мегацентр|ул\.?|улица|на\s+(?:улице|ул\.?|дзержинского)|это\s+адрес|по\s+адресу)(?:\s|$))/iu);
  let locationHint=qualifier?name.slice(qualifier.index).trim():'';
  if(qualifier)name=name.slice(0,qualifier.index).trim();
  if(!locationHint&&/[»"]$/.test(venue[2])){
   const tail=phrase.slice(venue.index+venue[0].length).match(/^\s*,?\s*((?:(?:в|во)\s+)?(?:тц|трц|торговый\s+центр|торговом\s+центре|мегацентр|на\s+улице|на\s+ул\.?|улица|ул\.?)\s+[^,.!?\n]{3,90})/iu);
   if(tail)locationHint=normalize(tail[1]);
  }
  if(!locationHint){
   // "кафе Вкусно и точка, Красная Площадь" is a common short form.
   // Only accept a known branch landmark here; a comma can also separate
   // unrelated tasks, which must never become part of the location.
   const suffix=phrase.slice(venue.index+venue[0].length).match(/^\s*,\s*([^,.!?\n]{4,75})/u);
   if(suffix&&VERIFIED_VENUES.some(row=>row.keywords.some(word=>
    searchText(suffix[1]).includes(searchText(word)))))locationHint=normalize(suffix[1]);
  }
  // People frequently finish a venue phrase with an unmarked city, e.g.
  // "кафе вкусно и точка краснодар". Never send "краснодар" as a brand word.
  const atEnd=name.match(/(?:\s+|,\s*)(краснодаре?|москв[ае]|сочи|казан[ьи]|новосибирск(?:е)?|екатеринбург(?:е)?|петербург(?:е)?)(?:[»"])?$/iu);
  if(atEnd){
   city=city||CITY_FORMS[atEnd[1].toLocaleLowerCase('ru-RU')]||'';
   name=normalize(name.slice(0,atEnd.index));
  }
  if(!/^[«"]/.test(venue[2])){
   name=name.split(/\s+(?:сегодня|завтра|послезавтра|в\s+(?:понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье|\d{1,2}(?::\d{2})?|городе|Краснодаре|Москве|Сочи|Казани)|на\s+\d|по\s+адресу|с\s+[А-ЯЁ])(?=$|[\s,.!?])/iu)[0].trim();
  }
  // The person may write a branch landmark directly after the chain name:
  // "Вкусно и точка Красная Площадь", without saying "ТРЦ". A known exact
  // business/landmark pair is a location hint, not part of the brand.
  // We do not guess unknown brands or new addresses from arbitrary words.
  const chain=name.match(/^(вкусно\s+(?:[—–-]\s*)?и\s+точка)(?:\s+(.+))?$/iu);
  if(chain){
   const addition=normalize(String(chain[2]||'').replace(/^(?:(?:добавил[аи]?|уточн[ьи]л[аи]?|это|в|во|на)\s+)+/iu,''));
   const venueKey=searchText(chain[1]);
   const branchHint=[locationHint,addition].filter(Boolean).join(' ');
   const exactBranch=branchHint&&VERIFIED_VENUES.find(row=>row.venue===venueKey&&
    row.keywords.some(word=>searchText(branchHint).includes(searchText(word))));
   if(exactBranch){
    locationHint=locationHint||addition;
    name=chain[1];
    if(!city)city=exactBranch.city;
   }
  }
  if(name.length<2||/^(?:кем|ним|ней|другом|подругой|коллегой|анн[а-яё]*|лен[а-яё]*|друг[а-яё]*)$/iu.test(name))return null;
  // Explicit city and landmark after a quoted venue are separate from its name.
  if(!locationHint&&/^вкусно\s+(?:[—–-]\s*)?и\s+точка$/iu.test(name)){
   const tail=phrase.slice(venue.index+venue[0].length);
   const knownTail=tail.match(/^\s*,\s*(Краснодар)\s*,\s*((?:трц|тц)\s+[«"]?Красная площадь[»"]?(?:\s*,\s*(?:ул\.?\s*)?Дзержинского\s*,?\s*\d+[а-яё]?)?)/iu);
   if(knownTail){city=city||'Краснодар';locationHint=normalize(knownTail[2]);}
  }
  const searchName=name;
  if(/^вкусно\s+(?:[—–-]\s*)?и\s+точка$/iu.test(name))name='Вкусно — и точка';
  const contextCity=typeof options.city==='string'?options.city:suggestedCity();
  city=city||contextCity;
  const label=kind+' «'+name+'»';
  const detail=addressDetail||locationHint;
  return {label,query:[kind+' '+searchName,detail,city].filter(Boolean).join(', ').slice(0,140),
   explicitAddress:false,city,explicitCity:Boolean(cityMatch||atEnd),citySelected:Boolean(options.city),
   venueName:name,kind,locationHint:detail};
 }
 function cleanPlace(value){
  if(!value||typeof value!=='object')return null;
  const lat=Number(value.lat),lon=Number(value.lon);
  if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180)return null;
  const name=String(value.name||'').slice(0,110).trim(),address=String(value.address||'').slice(0,250).trim();
  if(!name||!address)return null;
  const fromYandex=value.source==='yandex';
  const wikidata=/^Q[1-9]\d{0,11}$/.test(String(value.wikidata||''))?value.wikidata:'';
  const verified=value.source==='known-address';
  const sourceUrl=verified&&/^https:\/\/vkusnoitochka\.ru\//.test(value.sourceUrl||'')?value.sourceUrl:'';
  // Older saved tasks/cache entries predate the entrance photo. Enrich only
  // this exact curated mall, never a nearby restaurant or unrelated address.
  const known=verified?VERIFIED_VENUES.find(row=>
   Math.abs(lat-row.lat)<.00001&&Math.abs(lon-row.lon)<.00001&&
   searchText(name).includes(row.venue)&&searchText(address).includes('дзержинского')):null;
  const photo=cleanPhoto(value.photo)||known?.photo||'';
  const photoAuthor=photo&&typeof value.photoAuthor==='string'?value.photoAuthor.replace(/\s+/gu,' ').trim().slice(0,120):'';
  const photoLicense=photo&&typeof value.photoLicense==='string'?value.photoLicense.replace(/\s+/gu,' ').trim().slice(0,80):'';
  const photoLicenseURL=photo?safeLicenseURL(value.photoLicenseURL):'';
  const openingHours=typeof value.openingHours==='string'&&/^[\p{L}\p{N}\s:;,+\-/—–().]+$/u.test(value.openingHours.trim())?
   value.openingHours.trim().slice(0,120):'';
  const websiteURL=fromYandex&&typeof value.websiteURL==='string'&&
   /^https?:\/\/[^\s<>]{4,230}$/iu.test(value.websiteURL)?value.websiteURL:'';
  return {name,address,lat,lon,source:verified?'known-address':fromYandex?'yandex':'openstreetmap',
   sourceUrl,precision:verified?'building':'point',photo,wikidata,photoAuthor,photoLicense,photoLicenseURL,
   openingHours,websiteURL};
 }
 function cleanPhoto(value){
  if(typeof value!=='string')return '';
  let file=value.trim();
  // OSM may link directly to a Commons file page. Never hotlink arbitrary
  // commercial pages, photos or image URLs with unknown permissions.
  if(/^https:\/\/commons\.wikimedia\.org\/wiki\/(?:File:|Special:FilePath\/)/iu.test(file)){
   file=file.replace(/^https:\/\/commons\.wikimedia\.org\/wiki\/(?:File:|Special:FilePath\/)/iu,'').split(/[?#]/u)[0];
   try{file=decodeURIComponent(file)}catch{return ''}
  }else if(/^[a-z]+:\/\//iu.test(file))return '';
  file=file.replace(/^File:/iu,'').replace(/_/gu,' ').trim();
  return /^[\p{L}\p{N} _().,+-]{4,160}\.(?:jpg|jpeg|png|webp)$/iu.test(file)?file:'';
 }
 function safeLicenseURL(value){
  if(typeof value!=='string')return '';
  try{
   const url=new URL(value);
   if(url.hostname==='creativecommons.org'&&/^\/(?:licenses|publicdomain)\/[a-z0-9/.-]+\/?$/iu.test(url.pathname)){
    url.protocol='https:';url.search='';url.hash='';return url.toString();
   }
  }catch{}
  return '';
 }
 function locationLabel(result){
  const a=result?.address||{};
  const street=[a.road||a.pedestrian||a.street||a.place,a.house_number].filter(Boolean).join(', ');
  const city=a.city||a.town||a.village||a.municipality||a.county||'';
  const parts=[street,city,a.state].filter((value,index,array)=>value&&!array.slice(0,index).includes(value));
  return normalize(parts.join(' · ')||result.display_name||'');
 }
 function sameVenue(candidate,proposal){
  if(proposal.explicitAddress)return true;
  const type=String(candidate.type||'').toLocaleLowerCase('en-US');
  const accepted={
   кафе:['cafe','restaurant','coffee_shop','bakery','confectionery','fast_food'],
   кофейня:['cafe','coffee_shop','bakery'],ресторан:['restaurant','cafe'],
   бар:['bar','pub'],паб:['pub','bar'],пиццерия:['restaurant','fast_food'],
   бистро:['restaurant','cafe','fast_food'],пекарня:['bakery','cafe'],
   отель:['hotel','guest_house'],гостиница:['hotel','guest_house'],
   коворкинг:['coworking_space','office'],музей:['museum'],кинотеатр:['cinema'],трц:['mall','shopping_centre','shopping_center']
  };
  if(!accepted[proposal.kind]?.includes(type))return false;
  const requested=searchText(proposal.venueName);
  if(!requested)return true; // An explicitly requested category, not a fabricated brand.
  const found=searchText([candidate.name,candidate.namedetails?.name,candidate.display_name?.split(',')[0]].filter(Boolean).join(' '));
  return found.includes(requested)||requested.includes(found)&&found.length>=4;
 }
 const HINT_SKIP=new Set(['в','во','на','по','это','адрес','адресу','дом','дома','д','ул','улица','улице',
  'пр','проспект','проспекте','пер','переулок','переулке','тц','трц','торговый','центр','мегацентр',
  'город','г']);
 function words(value){return searchText(value).match(/[\p{L}\p{N}]+(?:\/[\p{N}]+)?/gu)||[]}
 function wordBase(value){return value.replace(/(?:ая|ой|ую|ого|его)$/u,'')}
 function addressTokens(proposal){
  const text=proposal?.locationHint||(proposal?.explicitAddress?proposal.query:'');
  return words(text).filter(word=>!HINT_SKIP.has(word)&&
   (word.length>=3||/^\d/u.test(word))&&wordBase(word)!==wordBase(searchText(proposal?.city)));
 }
 function matchesTokens(value,tokens){
  if(!tokens.length)return true;
  const present=words(value).map(wordBase);
  return tokens.every(word=>present.includes(wordBase(word)));
 }
 function verifiedCandidates(proposal){
  if(!proposal?.venueName)return [];
  const request=searchText(proposal.venueName),city=searchText(proposal.city);
  const tokens=addressTokens(proposal);
  return VERIFIED_VENUES.filter(row=>{
   if(request!==row.venue||city&&searchText(row.city)!==city)return false;
   if(proposal.kind==='трц'&&!row.name.startsWith('ТРЦ'))return false;
   if(proposal.kind!=='трц'&&row.name.startsWith('ТРЦ'))return false;
   return matchesTokens(row.address+' '+row.name,tokens);
  }).map(cleanPlace).filter(Boolean);
 }
 function matchesAddressHint(candidate,proposal){
  const tokens=addressTokens(proposal);
  // A requested house 10 must never match house 100. The whole street name
  // must also match; do not quietly move a task to another branch.
  return matchesTokens([candidate.display_name,candidate.name,...Object.values(candidate.address||{})].join(' '),tokens);
 }
 function distanceKm(a,b){
  const radians=n=>n*Math.PI/180,latDelta=radians(a.lat-b.lat),lonDelta=radians(a.lon-b.lon);
  const h=Math.sin(latDelta/2)**2+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(lonDelta/2)**2;
  return 12742*Math.asin(Math.min(1,Math.sqrt(h)));
 }
 function orderByLocation(value,location){
  if(!location||!value||value.cityRequired)return value;
  if(value.ambiguous){
   return {...value,nearby:true,candidates:[...value.candidates].sort((a,b)=>distanceKm(a,location)-distanceKm(b,location))};
  }
  return value;
 }
 const cache=new Map();let earliest=0;
 function cacheGet(key){
  const local=cache.get(key);if(local&&Date.now()-local.at<30*86400000)return local.value;
  try{
   const stored=JSON.parse(root.localStorage.getItem('seyveo-place:v8:'+key)||'null');
   if(stored&&Date.now()-stored.at<30*86400000){cache.set(key,stored);return stored.value;}
  }catch{}
  return undefined;
 }
 function cacheSet(key,value){
  const record={at:Date.now(),value};cache.set(key,record);
  try{root.localStorage.setItem('seyveo-place:v8:'+key,JSON.stringify(record))}catch{}
 }
 async function lookup(proposal){
  if(!proposal||!proposal.query||proposal.query.length>140)return null;
  const hasHouse=addressTokens(proposal).some(word=>/^\d/u.test(word));
  // Start GPS and the public place lookup concurrently when a city is known,
  // so slow device positioning does not delay the request to the map service.
  const locationPromise=proposal.explicitAddress||hasHouse||proposal.explicitCity||proposal.citySelected?
   Promise.resolve(null):grantedLocation();
  let origin=null;
  if(!proposal.city&&!proposal.explicitAddress)origin=await locationPromise;
  if(!proposal.city&&!proposal.explicitAddress&&!origin)return {cityRequired:true};
  const localMatches=verifiedCandidates(proposal);
  // A chain name without a branch, street or landmark is a request for
  // options, not permission to assign our one curated branch automatically.
  // When Yandex is available, search its wider city directory first; retain
  // the curated branch as a selectable fallback while the API is unavailable.
  const needsChoice=Boolean(localMatches.length&&proposal.kind!=='трц'&&proposal.venueName&&!proposal.explicitAddress&&!addressTokens(proposal).length);
  if(proposal.kind==='трц'&&localMatches.length===1&&proposal.city)return localMatches[0];
  // Prefer named, address-aware Yandex organizations when the owner has an
  // active business-search key. An exact curated location remains usable even
  // during key activation or a temporary API outage.
  if((!localMatches.length||needsChoice)&&!proposal.explicitAddress&&root?.SEYVEO_YANDEX_PLACES?.lookup){
   const yandex=await root.SEYVEO_YANDEX_PLACES.lookup(proposal);
   if(yandex){
    const candidates=yandex.ambiguous?yandex.candidates:[yandex];
    const safe=candidates.map(cleanPlace).filter(Boolean);
    if(safe.length&&proposal.kind!=='трц')return orderByLocation(needsChoice||safe.length>1?{ambiguous:true,candidates:safe}:safe[0],await locationPromise);
   }
  }
  const key=encodeURIComponent(proposal.query.toLocaleLowerCase('ru-RU'));
  const cacheable=Boolean(proposal.city||proposal.explicitAddress);
  const cached=cacheable?cacheGet(key):undefined;
  if(cached!==undefined)return orderByLocation(cached,await locationPromise);
  const now=Date.now();const pause=Math.max(0,earliest-now);
  earliest=now+pause+1250;
  if(pause)await new Promise(resolve=>setTimeout(resolve,pause));
  const configured=String(root?.SEYVEO_PLACE_SEARCH_ENDPOINT||'').trim();
  const host=String(root?.location?.hostname||'').toLocaleLowerCase('en-US');
  const loopback=host==='127.0.0.1'||host==='localhost';
  let results=null;
  // A same-origin local bridge works even when a secure browser policy blocks
  // outgoing requests. Public static hosting has no such backend.
  if(!configured&&!/github\.io$/iu.test(host)){
   try{
    const response=await root.fetch('/api/seyveo-place-lookup',{
     method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},
     body:JSON.stringify({query:proposal.query})
    });
    if(response.ok){const payload=await response.json();results=payload?.results}
    else if((response.status===404||response.status===405)&&loopback){
     // A reloaded HTML file does not restart the already running Node server.
     throw Error('seyveo-place-server-restart-needed');
    }else if(response.status!==404&&response.status!==405)throw Error('Local place search unavailable');
   }catch(error){
    if(!localMatches.length||error?.message==='seyveo-place-server-restart-needed')throw error;
    results=[];
   }
  }
  if(results===null){
   const endpoint=configured||'https://nominatim.openstreetmap.org/search';
   const url=new URL(endpoint,root?.location?.href||'https://seyveo.com');
   if(url.protocol!=='https:')throw Error('Insecure map search endpoint');
   url.searchParams.set('q',proposal.query);url.searchParams.set('format','jsonv2');
   url.searchParams.set('addressdetails','1');url.searchParams.set('extratags','1');
   url.searchParams.set('namedetails','1');url.searchParams.set('limit','15');url.searchParams.set('accept-language','ru');
   try{
    const response=await root.fetch(url.toString(),{method:'GET',mode:'cors',credentials:'omit',referrerPolicy:'strict-origin-when-cross-origin'});
    if(!response.ok)throw Error('Place search unavailable');
    results=await response.json();
   }catch(error){if(!localMatches.length)throw error;results=[]}
  }
  if(!Array.isArray(results))throw Error('Invalid place response');
  origin=await locationPromise;
  const found=results.filter(row=>sameVenue(row,proposal)&&matchesAddressHint(row,proposal)&&Number.isFinite(Number(row.lat))&&Number.isFinite(Number(row.lon))&&
   (!proposal.city||searchText(row.address?.city||row.address?.town||row.address?.village||row.display_name).includes(searchText(proposal.city))));
  // With GPS but no identified city, never suggest unrelated results from
  // another region. The user's coordinates never leave the device.
  const local=origin&&!proposal.city?localMatches.filter(row=>distanceKm(row,origin)<=50):localMatches;
  const candidates=[...local];
  for(const match of found){
   const candidate=cleanPlace({
    name:proposal.explicitAddress?(match.name||'Место встречи'):(match.name||proposal.label),
    address:locationLabel(match),lat:match.lat,lon:match.lon,
    photo:cleanPhoto(match.extratags?.wikimedia_commons)||cleanPhoto(match.extratags?.image)||'',
    wikidata:match.extratags?.wikidata||'',openingHours:match.extratags?.opening_hours||''
   });
   if(candidate&&(!origin||proposal.city||distanceKm(candidate,origin)<=50)&&
    !candidates.some(item=>item.name===candidate.name&&item.address===candidate.address))candidates.push(candidate);
  }
  const value=candidates.length?(needsChoice||candidates.length>1?
   {ambiguous:true,candidates:candidates.slice(0,16)}:candidates[0]):null;
  if(cacheable)cacheSet(key,value);
  return orderByLocation(value,origin)||(!proposal.city&&origin?{cityRequired:true}:null);
 }
 function mapURL(place){
  const p=cleanPlace(place);if(!p)return '';
  const lat=p.lat,lon=p.lon,delta=.0016;
  const url=new URL('https://www.openstreetmap.org/export/embed.html');
  url.searchParams.set('bbox',[lon-delta,lat-delta,lon+delta,lat+delta].map(x=>x.toFixed(6)).join(','));
  url.searchParams.set('layer','mapnik');url.searchParams.set('marker',lat.toFixed(6)+','+lon.toFixed(6));
  return url.toString();
 }
 // A user-initiated handoff to Yandex's own place directory. This is not a
 // Geocoder request: the existing Geocoder key cannot search organizations.
 // Only the location query (never the complete private task) is passed over.
 function yandexSearchURL(query){
  const location=normalize(String(query||'').slice(0,180));
  if(!location)return '';
  const url=new URL('https://yandex.ru/maps/');
  url.searchParams.set('text',location);
  return url.toString();
 }
 // The thumbnail is only 112 × 96 px. A close zoom shows one roof instead of
 // a usable map; keep enough surrounding streets visible at this size.
 function mapTiles(place,width=127,height=96,zoom=14){
  const p=cleanPlace(place);if(!p)return [];
  const z=Math.max(1,Math.min(18,Math.floor(zoom))),size=2**z;
  const latitude=Math.max(-85.0511,Math.min(85.0511,p.lat))*Math.PI/180;
  const centerX=(p.lon+180)/360*size*256;
  const centerY=(1-Math.log(Math.tan(latitude)+1/Math.cos(latitude))/Math.PI)/2*size*256;
  const originX=Math.floor((centerX-width/2)/256),originY=Math.floor((centerY-height/2)/256);
  const tiles=[];
  const base=String(root?.SEYVEO_MAP_TILE_ENDPOINT||'https://tile.openstreetmap.org').replace(/\/$/,'');
  if(!/^https:\/\//.test(base))return [];
  for(let y=originY;y<=Math.floor((centerY+height/2)/256);y++){
   for(let x=originX;x<=Math.floor((centerX+width/2)/256);x++){
    if(y<0||y>=size)continue;
    tiles.push({url:base+'/'+z+'/'+((x%size+size)%size)+'/'+y+'.png',
     left:Math.round(x*256-centerX+width/2),top:Math.round(y*256-centerY+height/2)});
   }
  }
  // Thumbnails normally need four tiles. An expanded, user-opened map needs
  // enough tiles for the viewport; never prefetch beyond the visible area.
  return tiles.slice(0,36);
 }
 function navigatorRouteURL(place){
  const p=cleanPlace(place);
  // Yandex Navigator accepts a destination alone and uses the person's
  // current location as the start; no device coordinates enter this link.
  return p?'yandexnavi://build_route_on_map?lat_to='+p.lat+'&lon_to='+p.lon:'';
 }
 function yandexRouteURL(place){
  const p=cleanPlace(place);if(!p)return '';
  const url=new URL('https://yandex.ru/maps/');
  url.searchParams.set('mode','routes');
  url.searchParams.set('rtext','~'+p.lat+','+p.lon);
  url.searchParams.set('rtt','auto');
  return url.toString();
 }
 function fullMapURL(place){
  const p=cleanPlace(place);return p?'https://www.openstreetmap.org/?mlat='+p.lat+'&mlon='+p.lon+'#map=17/'+p.lat+'/'+p.lon:'';
 }
 function streetViewURL(place){
  const p=cleanPlace(place);if(!p)return '';
  const url=new URL('https://www.google.com/maps/@');
  url.searchParams.set('api','1');url.searchParams.set('map_action','pano');
  url.searchParams.set('viewpoint',p.lat.toFixed(6)+','+p.lon.toFixed(6));
  return url.toString();
 }
 function isCuratedMallPhoto(place,file=cleanPhoto(place?.photo)){
  const known=VERIFIED_VENUES[0];
  return file===known.photo&&place?.source==='known-address'&&
   Math.abs(Number(place.lat)-known.lat)<.00001&&Math.abs(Number(place.lon)-known.lon)<.00001;
 }
 function photoURL(place,width=500){
  // Wikimedia's 2026 thumbnail CDN accepts predefined steps. An arbitrary
  // width (the former 240px) can fail on Safari and silently hide the photo.
  const file=cleanPhoto(place?.photo);
  // This explicitly verified photo is bundled with SEYVEO. It must remain
  // visible on local installations even if Wikimedia's image CDN is blocked.
  if(isCuratedMallPhoto(place,file))return 'assets/seyveo-krasnaya-ploshchad-entrance-2024.jpg';
  const requested=Math.max(120,Math.min(960,Math.round(Number(width)||500)));
  const size=[120,250,330,500,960].find(step=>step>=requested)||960;
  return file?'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(file)+'?width='+size:'';
 }
 function photoInfo(value){
  const place=cleanPlace(value);if(!place?.photo)return null;
  const mall=isCuratedMallPhoto(place);
  return {
   label:mall?'Вход в ТРЦ «Красная Площадь»':'Фото места',
   author:mall?'Andrew Butko':place.photoAuthor,
   license:mall?'CC BY-SA 4.0':place.photoLicense,
   licenseURL:mall?'https://creativecommons.org/licenses/by-sa/4.0/':place.photoLicenseURL,
   sourceURL:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(place.photo)
  };
 }
 function venueInfo(value){
  const place=cleanPlace(value);if(!place)return null;
  // Venue details are keyed to the address, never to the presence of a photo.
  const curated=place.source==='known-address'?VERIFIED_VENUES.find(row=>
   Math.abs(place.lat-row.lat)<.00001&&Math.abs(place.lon-row.lon)<.00001&&
   searchText(place.name).includes(row.venue)&&searchText(place.address).includes('дзержинского')):null;
  if(curated?.name.startsWith('ТРЦ'))return null;
  const hours=curated?'10:00–22:00':place.openingHours||'';
  if(!hours&&!curated)return null;
  return {hours,hoursSourceURL:curated?'https://krasnodar.red-square.ru/visitors/kafe_i_restorany/vkusno_-_i_tochka_1_etazh-171408/':'',
   hoursNote:curated?'График зала на 1-м этаже — по сайту ТРЦ. Для «Авто» в справочниках указан другой график: 06:00–04:00. Уточни перед визитом.':'По данным открытой карты; график может измениться.',
   menuURL:curated?.menuURL||'',menuPreview:[],
   menuNote:curated?'Цены зависят от ресторана. Актуальное меню — на сайте сети.':''};
 }
 const photoCache=new Map();
 const metadataCache=new Map();
 function plainMetadata(value){
  if(typeof value!=='string')return '';
  return value.replace(/<[^>]*>/gu,' ').replace(/&(?:amp|nbsp|quot|lt|gt);/giu,entity=>({
   '&amp;':'&','&nbsp;':' ','&quot;':'"','&lt;':'<','&gt;':'>'
  })[entity.toLowerCase()]||' ').replace(/&#(\d+);/gu,(_,number)=>{
   const code=Number(number);return code>=32&&code<=0x10ffff?String.fromCodePoint(code):' ';
  }).replace(/\s+/gu,' ').trim();
 }
 async function photoMetadata(file){
  if(metadataCache.has(file))return metadataCache.get(file);
  const url=new URL('https://commons.wikimedia.org/w/api.php');
  for(const [key,value] of Object.entries({action:'query',format:'json',origin:'*',prop:'imageinfo',
   titles:'File:'+file,iiprop:'extmetadata',iiextmetadatalanguage:'en',iiextmetadatafilter:'Artist|LicenseShortName|LicenseUrl'}))url.searchParams.set(key,value);
  try{
   const response=await root.fetch(url.toString(),{credentials:'omit',referrerPolicy:'strict-origin-when-cross-origin'});
   if(!response.ok)return null;
   const data=await response.json();
   const pages=Object.values(data?.query?.pages||{});
   const metadata=pages[0]?.imageinfo?.[0]?.extmetadata;
   if(!metadata)return null;
   const value={photoAuthor:plainMetadata(metadata.Artist?.value).slice(0,120),
    photoLicense:plainMetadata(metadata.LicenseShortName?.value).slice(0,80),
    photoLicenseURL:safeLicenseURL(metadata.LicenseUrl?.value)};
   metadataCache.set(file,value);return value;
  }catch{return null}
 }
 async function resolvePhoto(value){
  const place=cleanPlace(value);if(!place)return place;
  let file=place.photo;
  if(!file&&place.wikidata){
   file=photoCache.get(place.wikidata);
   if(file===undefined){
    const url=new URL('https://www.wikidata.org/w/api.php');
    url.searchParams.set('action','wbgetentities');url.searchParams.set('ids',place.wikidata);
    url.searchParams.set('props','claims');url.searchParams.set('format','json');url.searchParams.set('origin','*');
    try{
     const response=await root.fetch(url.toString(),{credentials:'omit',referrerPolicy:'strict-origin-when-cross-origin'});
     if(!response.ok)return place;
     const data=await response.json();
     file=cleanPhoto(data?.entities?.[place.wikidata]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value);
     photoCache.set(place.wikidata,file);
    }catch{return place}
   }
  }
  if(!file)return place;
  const updated={...place,photo:file};
  if(place.source==='known-address'||place.photoAuthor&&place.photoLicense)return updated;
  const metadata=await photoMetadata(file);
  return metadata?{...updated,...metadata}:updated;
 }
 const api=Object.freeze({extract,lookup,cleanPlace,mapURL,mapTiles,fullMapURL,streetViewURL,yandexSearchURL,navigatorRouteURL,yandexRouteURL,
  photoURL,photoInfo,venueInfo,resolvePhoto,suggestedCity,setPreferredCity});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SEYVEO_TASK_PLACES=api;
})(typeof window!=='undefined'?window:null);
