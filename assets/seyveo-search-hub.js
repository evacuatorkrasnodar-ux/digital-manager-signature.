/* SEYVEO Search Hub · one verified search contract for Sayvi and her screens.
 * Place lookup sends only a venue/address query (never the task itself).
 * Public answers reuse SEYVEO's existing same-origin live-search backend.
 * No third-party image is displayed without a verified source. */
((root)=>{
 'use strict';
 const places=root?.SEYVEO_TASK_PLACES;
 const PLACE_CONSENT='seyveo-place-search-consent-v1';
 const LIVE_CONSENT='seyveo-public-web-search-consent-v1';
 function readConsent(key){try{return root.localStorage.getItem(key)==='yes'}catch{return false}}
 function approvePlaceSearch(){
  if(readConsent(PLACE_CONSENT))return true;
  if(typeof root.confirm!=='function'||!root.confirm('Разрешить Сэйви искать упомянутые заведения и адреса на карте? Отправляется только запрос о месте, без текста дела или личных записей.'))return false;
  try{root.localStorage.setItem(PLACE_CONSENT,'yes')}catch{}
  return true;
 }
 async function findPlace(proposal){
  if(!places||!proposal?.query)return null;
  if(!approvePlaceSearch())return {consentRequired:true};
  return places.lookup(proposal);
 }
 async function findPlacePhoto(place){
  if(!places)return null;
  return places.resolvePhoto(place);
 }
 async function searchPublic(query,{signal}={}){
  const text=String(query||'').trim();
  if(!text||text.length>600)throw Error('invalid-search-query');
  if(!readConsent(LIVE_CONSENT))return {status:'consent-required',results:[]};
  const check=await root.fetch('/api/seyveo-live-search-status',{credentials:'same-origin',signal});
  if(!check.ok||!(await check.json()).configured)return {status:'unavailable',results:[]};
  const response=await root.fetch('/api/seyveo-live-search',{
   method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},
   body:JSON.stringify({message:text}),signal
  });
  if(!response.ok)return {status:'unavailable',results:[]};
  const payload=await response.json();
  return {status:String(payload.status||'unavailable'),
   message:String(payload.message||'').slice(0,240),
   results:Array.isArray(payload.results)?payload.results.filter(x=>x&&typeof x.url==='string').slice(0,6):[]};
 }
 const hub=Object.freeze({findPlace,findPlacePhoto,searchPublic,approvePlaceSearch,
  hasPlaceConsent:()=>readConsent(PLACE_CONSENT)});
 if(typeof module!=='undefined'&&module.exports)module.exports=hub;
 if(root)root.SEYVEO_SEARCH_HUB=hub;
})(typeof window!=='undefined'?window:null);
