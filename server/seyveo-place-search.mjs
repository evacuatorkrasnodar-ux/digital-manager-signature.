/* One deliberately rate-limited, user-initiated place lookup for local SEYVEO.
 * The public OSM service is a small-prototype fallback, not production search.
 * See https://operations.osmfoundation.org/policies/nominatim/ */
export function safePlaceQuery(input){
 if(typeof input!=='string')return '';
 const value=input.replace(/\s+/gu,' ').trim();
 if(value.length<3||value.length>140||/[\x00-\x1f<>]/u.test(value))return '';
 return value;
}
export async function searchPlace(query,{fetcher=fetch}={}){
 const cleaned=safePlaceQuery(query);
 if(!cleaned)throw Error('invalid-place-query');
 const url=new URL('https://nominatim.openstreetmap.org/search');
 for(const [name,value] of Object.entries({q:cleaned,format:'jsonv2',addressdetails:'1',extratags:'1',namedetails:'1',limit:'5','accept-language':'ru'}))url.searchParams.set(name,value);
 const response=await fetcher(url.toString(),{
  method:'GET',redirect:'error',signal:AbortSignal.timeout(10000),
  headers:{'User-Agent':'SEYVEO-Local-PlaceSearch/1.0 (https://seyveo.com)',Accept:'application/json'}
 });
 if(!response.ok)throw Error('place-provider-unavailable');
 const data=await response.json();
 if(!Array.isArray(data))throw Error('invalid-place-provider-response');
 return data.slice(0,5).map(row=>({
  name:String(row?.name||'').slice(0,100),
  display_name:String(row?.display_name||'').slice(0,500),
  type:String(row?.type||'').slice(0,70),
  lat:String(row?.lat||'').slice(0,30),lon:String(row?.lon||'').slice(0,30),
  address:row?.address&&typeof row.address==='object'?Object.fromEntries(
   ['road','pedestrian','street','place','house_number','city','town','village','municipality','county','state']
    .filter(key=>typeof row.address[key]==='string').map(key=>[key,row.address[key].slice(0,110)])): {},
  namedetails:{name:String(row?.namedetails?.name||'').slice(0,100)},
  extratags:{wikidata:String(row?.extratags?.wikidata||'').slice(0,20),
   wikimedia_commons:String(row?.extratags?.wikimedia_commons||'').slice(0,160),
   image:String(row?.extratags?.image||'').slice(0,240)}
 }));
}
