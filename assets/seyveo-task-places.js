/* SEYVEO · Place enrichment for Sayvi's task composer.
 * Only a committed venue/address is searched, never the whole private task.
 * The public Nominatim endpoint is a low-volume prototype fallback; configure
 * SEYVEO_PLACE_SEARCH_ENDPOINT for a dedicated service before scaling. */
((root)=>{
 'use strict';
 const CITY_FORMS={краснодаре:'Краснодар',москве:'Москва',сочи:'Сочи',казани:'Казань',новосибирске:'Новосибирск',екатеринбурге:'Екатеринбург',петербурге:'Санкт-Петербург'};
 const KIND_FORMS={кафе:'кафе',кофейне:'кофейня',ресторане:'ресторан',баре:'бар',пабе:'паб',пиццерии:'пиццерия',бистро:'бистро',пекарне:'пекарня',отеле:'отель',гостинице:'гостиница',коворкинге:'коворкинг',музее:'музей',кинотеатре:'кинотеатр'};
 const meeting=/(?:^|[\s,.!?])(?:встреч[а-яё]*|встрет[а-яё]*|переговор[а-яё]*|пообед[а-яё]*|поужин[а-яё]*|позавтрак[а-яё]*|обед|ужин|завтрак|кофе|посид[а-яё]*)(?=$|[\s,.!?])/iu;
 function normalize(value){return String(value||'').replace(/[«»"“”]/g,'').replace(/\s+/g,' ').trim()}
 function extract(input){
  const phrase=String(input||'').slice(0,500);
  if(!meeting.test(phrase))return null;
  const cityMatch=phrase.match(/(?:^|[\s,.!?])(?:в\s+городе\s+|г\.\s*)([А-ЯЁ][А-ЯЁа-яё-]{2,}(?:\s+[А-ЯЁ][А-ЯЁа-яё-]+)?)/u)
   ||phrase.match(/(?:^|[\s,.!?])в\s+(Краснодаре|Москве|Сочи|Казани|Новосибирске|Екатеринбурге|Петербурге)(?=$|[\s,.!?])/iu);
  const city=cityMatch?(CITY_FORMS[cityMatch[1]?.toLocaleLowerCase('ru-RU')]||cityMatch[1]):'';
  const address=phrase.match(/(?:^|[\s,.!?])(?:по\s+адресу|адрес\s*[:—])\s*([^!?\n]{6,110})/iu);
  if(address){
   const detail=normalize(address[1].replace(/\s+(?:сегодня|завтра|послезавтра|в\s+\d{1,2}(?::\d{2})?)(?=$|[\s,.!?]).*$/iu,''));
   if(detail.length>=6)return {label:'Место встречи',query:detail,explicitAddress:true,city};
  }
  const venue=phrase.match(/(?:^|[\s,.!?])(?:в|во|у)\s+(кафе|кофейне|ресторане|баре|пабе|пиццерии|бистро|пекарне|отеле|гостинице|коворкинге|музее|кинотеатре)\s+(«[^»]{2,70}»|"[^"]{2,70}"|[^,.!?\n]{2,100})/iu);
  if(!venue)return null;
  const kind=KIND_FORMS[venue[1].toLocaleLowerCase('ru-RU')];
  let name=normalize(venue[2]);
  if(!/^[«"]/.test(venue[2])){
   name=name.split(/\s+(?:сегодня|завтра|послезавтра|в\s+(?:понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье|\d{1,2}(?::\d{2})?|городе|Краснодаре|Москве|Сочи|Казани)|на\s+\d|по\s+адресу|с\s+[А-ЯЁ])(?=$|[\s,.!?])/iu)[0].trim();
  }
  if(name.length<2||/^(?:кем|ним|ней|другом|подругой|коллегой|анн[а-яё]*|лен[а-яё]*|друг[а-яё]*)$/iu.test(name))return null;
  const label=kind+' «'+name+'»';
  return {label,query:kind+' '+name+(city?', '+city:''),explicitAddress:false,city,venueName:name,kind};
 }
 function cleanPlace(value){
  if(!value||typeof value!=='object')return null;
  const lat=Number(value.lat),lon=Number(value.lon);
  if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180)return null;
  const name=String(value.name||'').slice(0,110).trim(),address=String(value.address||'').slice(0,250).trim();
  if(!name||!address)return null;
  const wikidata=/^Q[1-9]\d{0,11}$/.test(String(value.wikidata||''))?value.wikidata:'';
  return {name,address,lat,lon,source:'openstreetmap',photo:cleanPhoto(value.photo),wikidata};
 }
 function cleanPhoto(value){
  if(typeof value!=='string')return '';
  const file=value.replace(/^File:/i,'').trim();
  return /^[\p{L}\p{N} _().,+-]{4,160}\.(?:jpg|jpeg|png|webp)$/iu.test(file)?file:'';
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
   кафе:['cafe','restaurant','coffee_shop','bakery','confectionery'],
   кофейня:['cafe','coffee_shop','bakery'],ресторан:['restaurant','cafe'],
   бар:['bar','pub'],паб:['pub','bar'],пиццерия:['restaurant','fast_food'],
   бистро:['restaurant','cafe','fast_food'],пекарня:['bakery','cafe'],
   отель:['hotel','guest_house'],гостиница:['hotel','guest_house'],
   коворкинг:['coworking_space','office'],музей:['museum'],кинотеатр:['cinema']
  };
  if(!accepted[proposal.kind]?.includes(type))return false;
  const requested=normalize(proposal.venueName).toLocaleLowerCase('ru-RU');
  const found=normalize([candidate.name,candidate.namedetails?.name,candidate.display_name?.split(',')[0]].filter(Boolean).join(' ')).toLocaleLowerCase('ru-RU');
  return found.includes(requested)||requested.includes(found)&&found.length>=4;
 }
 const cache=new Map();let earliest=0;
 function cacheGet(key){
  const local=cache.get(key);if(local&&Date.now()-local.at<30*86400000)return local.value;
  try{
   const stored=JSON.parse(root.localStorage.getItem('seyveo-place:v3:'+key)||'null');
   if(stored&&Date.now()-stored.at<30*86400000){cache.set(key,stored);return stored.value;}
  }catch{}
  return undefined;
 }
 function cacheSet(key,value){
  const record={at:Date.now(),value};cache.set(key,record);
  try{root.localStorage.setItem('seyveo-place:v3:'+key,JSON.stringify(record))}catch{}
 }
 async function lookup(proposal){
  if(!proposal||!proposal.query||proposal.query.length>140)return null;
  const key=encodeURIComponent(proposal.query.toLocaleLowerCase('ru-RU'));
  const cached=cacheGet(key);if(cached!==undefined)return cached;
  const now=Date.now();const pause=Math.max(0,earliest-now);
  earliest=now+pause+1250;
  if(pause)await new Promise(resolve=>setTimeout(resolve,pause));
  const configured=String(root?.SEYVEO_PLACE_SEARCH_ENDPOINT||'').trim();
  const endpoint=configured||'https://nominatim.openstreetmap.org/search';
  const url=new URL(endpoint,root?.location?.href||'https://seyveo.com');
  if(url.protocol!=='https:')throw Error('Insecure map search endpoint');
  url.searchParams.set('q',proposal.query);url.searchParams.set('format','jsonv2');
  url.searchParams.set('addressdetails','1');url.searchParams.set('extratags','1');
  url.searchParams.set('namedetails','1');url.searchParams.set('limit','5');url.searchParams.set('accept-language','ru');
  const response=await root.fetch(url.toString(),{method:'GET',mode:'cors',credentials:'omit',referrerPolicy:'strict-origin-when-cross-origin'});
  if(!response.ok)throw Error('Place search unavailable');
  const results=await response.json();if(!Array.isArray(results))throw Error('Invalid place response');
  const found=results.filter(row=>sameVenue(row,proposal)&&Number.isFinite(Number(row.lat))&&Number.isFinite(Number(row.lon)));
  const candidates=[];
  for(const match of found){
   const candidate=cleanPlace({
    name:proposal.explicitAddress?(match.name||'Место встречи'):(match.name||proposal.label),
    address:locationLabel(match),lat:match.lat,lon:match.lon,
    photo:match.extratags?.wikimedia_commons||'',wikidata:match.extratags?.wikidata||''
   });
   if(candidate&&!candidates.some(item=>item.name===candidate.name&&item.address===candidate.address))candidates.push(candidate);
  }
  const value=candidates.length>1?{ambiguous:true,candidates:candidates.slice(0,4)}:candidates[0]||null;
  cacheSet(key,value);return value;
 }
 function mapURL(place){
  const p=cleanPlace(place);if(!p)return '';
  const lat=p.lat,lon=p.lon,delta=.0016;
  const url=new URL('https://www.openstreetmap.org/export/embed.html');
  url.searchParams.set('bbox',[lon-delta,lat-delta,lon+delta,lat+delta].map(x=>x.toFixed(6)).join(','));
  url.searchParams.set('layer','mapnik');url.searchParams.set('marker',lat.toFixed(6)+','+lon.toFixed(6));
  return url.toString();
 }
 function mapTiles(place,width=127,height=96,zoom=16){
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
  return tiles.slice(0,4);
 }
 function fullMapURL(place){
  const p=cleanPlace(place);return p?'https://www.openstreetmap.org/?mlat='+p.lat+'&mlon='+p.lon+'#map=17/'+p.lat+'/'+p.lon:'';
 }
 function photoURL(place){
  const file=cleanPhoto(place?.photo);return file?'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(file)+'?width=240':'';
 }
 const photoCache=new Map();
 async function resolvePhoto(value){
  const place=cleanPlace(value);if(!place||place.photo||!place.wikidata)return place;
  let file=photoCache.get(place.wikidata);
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
  return {...place,photo:file||''};
 }
 const api=Object.freeze({extract,lookup,cleanPlace,mapURL,mapTiles,fullMapURL,photoURL,resolvePhoto});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SEYVEO_TASK_PLACES=api;
})(typeof window!=='undefined'?window:null);
