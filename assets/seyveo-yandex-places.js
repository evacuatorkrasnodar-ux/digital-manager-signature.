/* SEYVEO · Optional Yandex organization search for the public demo.
 * The demo key was explicitly provided by the owner; rotate before release.
 * This is a business-search key, not a Geocoder/JavaScript Maps key.
 * Only a committed venue or category query is transmitted, never a task.
 * A 403 / network failure gracefully falls back to the existing provider. */
((root)=>{
 'use strict';
 const demoKey='d20cd060-d7d6-4508-9789-1b9d2894f72b';
 let disabledUntil=0;
 const recent=new Map();
 const tidy=value=>String(value||'').replace(/\s+/gu,' ').trim();
 const compare=value=>tidy(value).toLocaleLowerCase('ru-RU').replace(/[—–-]/gu,' ').replace(/[«»"“”]/gu,'').replace(/\s+/gu,' ');
 const skip=new Set(['на','в','во','по','тц','трц','торговый','центр','торговом','центре','ул','улица','улице','дом','адрес','кафе','ресторан']);
 function tokens(value){return (compare(value).match(/[\p{L}\p{N}]+/gu)||[]).filter(word=>!skip.has(word)&&word.length>1)
  .map(word=>word.replace(/(?:ая|ой|ую|ого|его|им|ым|ом|ем)$/u,''))}
 function matchesPlace(record,proposal){
  const text=compare([record.name,record.address,record.description].join(' '));
  if(proposal.city&&!text.includes(compare(proposal.city)))return false;
  if(proposal.venueName){
   const requested=compare(proposal.venueName),actual=compare(record.name);
   if(!actual.includes(requested)&&!requested.includes(actual))return false;
  }
  // A house number is a hard constraint. Landmarks and street names are
  // checked against the provider's own text; never silently change an address.
  return tokens(proposal.locationHint||'').every(word=>tokens(text).includes(word));
 }
 function parse(payload,proposal){
  if(payload?.type!=='FeatureCollection'||!Array.isArray(payload.features))return [];
  const result=[];
  for(const item of payload.features.slice(0,20)){
   const props=item?.properties||{},company=props.CompanyMetaData;
   if(!company||!Array.isArray(item?.geometry?.coordinates))continue;
   const [lon,lat]=item.geometry.coordinates.map(Number);
   if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180)continue;
   const name=tidy(company.name||props.name).slice(0,110);
   const address=tidy(company.Address?.formatted||company.address||props.description).slice(0,230);
   if(!name||!address)continue;
   const value={name,address,lat,lon,source:'yandex',
    description:tidy([props.description,company.Address?.additional_info,
     ...(company.Address?.Components||[]).map(x=>x?.name||'')].join(' ')).slice(0,240),
    openingHours:tidy(company.Hours?.text).slice(0,120),
    websiteURL:/^https?:\/\/[^\s<>]{4,230}$/iu.test(company.url||'')?company.url:''};
   if(matchesPlace(value,proposal)&&!result.some(x=>x.name===name&&x.address===address))result.push(value);
  }
  return result.slice(0,15);
 }
 async function lookup(proposal,{fetcher}={}){
  const query=tidy(proposal?.query);
  if(!demoKey||query.length<3||query.length>140||Date.now()<disabledUntil)return null;
  // Avoid a country-wide business search without enough geographic context.
  if(!proposal.city&&!proposal.explicitAddress)return null;
  const cached=recent.get(query);
  if(cached&&Date.now()-cached.at<300000)return cached.value;
  const url=new URL('https://search-maps.yandex.ru/v1/');
  for(const [key,value] of Object.entries({text:query,type:proposal.explicitAddress?'geo':'biz',
   lang:'ru_RU',results:'15',apikey:demoKey}))url.searchParams.set(key,value);
  try{
   const response=await (fetcher||root.fetch.bind(root))(url.toString(),{
    method:'GET',mode:'cors',credentials:'omit',referrerPolicy:'strict-origin-when-cross-origin'});
   if(response.status===403){disabledUntil=Date.now()+900000;return null}
   if(response.status===429){disabledUntil=Date.now()+60000;return null}
   if(!response.ok)return null;
   const found=parse(await response.json(),proposal);
   const value=found.length>1?{ambiguous:true,candidates:found}:found[0]||null;
   recent.set(query,{at:Date.now(),value});return value;
  }catch{return null}
 }
 const api=Object.freeze({lookup,parse});
 if(root)root.SEYVEO_YANDEX_PLACES=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
