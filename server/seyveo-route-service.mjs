/* SEYVEO Travel · small, credential-safe real routing adapter.
 * No invented buses, durations, traffic or taxi prices. */
export function point(value){
 const lat=Number(value?.lat),lon=Number(value?.lon);
 return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180?{lat,lon}:null;
}
export function readYandexRoute(data,mode){
 const legs=data?.route?.legs;
 if(!Array.isArray(legs)||!legs.length||legs.some(leg=>leg?.status!=='OK'||!Array.isArray(leg.steps)))return null;
 const seconds=legs.flatMap(leg=>leg.steps).reduce((n,step)=>n+Number(step?.duration||0),0);
 if(!Number.isFinite(seconds)||seconds<30||seconds>36000)return null;
 const minutes=Math.ceil(seconds/60);
 return {mode,minutes,source:'yandex',
  traffic:mode==='driving'&&['realtime','forecast'].includes(data.traffic_type)?data.traffic_type:'unknown'};
}
export function read2GISTransit(payload){
 const rows=Array.isArray(payload)?payload:Array.isArray(payload?.routes)?payload.routes:[];
 const first=rows.find(x=>Number.isFinite(x?.total_duration)&&x.total_duration>0&&x.total_duration<=36000&&x.pedestrian!==true&&Array.isArray(x.movements)&&x.movements.some(m=>Array.isArray(m?.routes)&&m.routes.length));
 if(!first)return null;
 const lines=[];
 for(const movement of first.movements){
  for(const route of Array.isArray(movement?.routes)?movement.routes:[]){
   const subtype=String(route.subtype_name||'').slice(0,35).trim();
   for(const name of Array.isArray(route.names)?route.names:[]){
    const number=String(name).slice(0,12).trim();
    const label=number?[subtype,number].filter(Boolean).join(' №'):'';
    if(label.length<=45&&!lines.includes(label))lines.push(label);
   }
  }
 }
 return {mode:'transit',minutes:Math.ceil(first.total_duration/60),source:'2gis',traffic:'unknown',lines:lines.slice(0,5)};
}
export async function routeOptions(origin,destination,{key=process.env.SEYVEO_YANDEX_ROUTING_KEY,
 key2gis=process.env.SEYVEO_2GIS_ROUTING_KEY,fetcher=fetch}={}){
 const from=point(origin),to=point(destination);
 if(!from||!to)throw Error('invalid-points');
 if((typeof key!=='string'||!key.trim())&&(typeof key2gis!=='string'||!key2gis.trim()))return {status:'not-configured',routes:[]};
 const route=async mode=>{
  const url=new URL('https://api.routing.yandex.net/v2/route');
  url.searchParams.set('apikey',key.trim());
  url.searchParams.set('waypoints',from.lat+','+from.lon+'|'+to.lat+','+to.lon);
  url.searchParams.set('mode',mode);
  const response=await fetcher(url.toString(),{redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!response.ok)return null;
  return readYandexRoute(await response.json(),mode);
 };
 const modes=typeof key==='string'&&key.trim()?['driving','transit','walking']:[];
 const routes=await Promise.all(modes.map(async mode=>{
  try{return await route(mode)}catch{return null}
 }));
 const usable=routes.filter(Boolean);
 if(typeof key2gis==='string'&&key2gis.trim()){
  try{
   const url=new URL('https://routing.api.2gis.com/public_transport/2.0');
   url.searchParams.set('key',key2gis.trim());
   const response=await fetcher(url.toString(),{
    method:'POST',headers:{'content-type':'application/json'},redirect:'error',
    signal:AbortSignal.timeout(12000),body:JSON.stringify({source:{point:from},target:{point:to},locale:'ru'})
   });
   const transit=response.ok?read2GISTransit(await response.json()):null;
   if(transit){const old=usable.findIndex(x=>x.mode==='transit');if(old!==-1)usable.splice(old,1);usable.push(transit)}
  }catch{/* Yandex transit or browser route remains available. */}
 }
 return {status:usable.length?'ready':'unavailable',routes:usable};
}
