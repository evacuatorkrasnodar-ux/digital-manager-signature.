/* SEYVEO Maps · domain-restricted Yandex JS API v3 browser integration.
   Only a domain-restricted browser JavaScript API key, never a server key.
   No Yandex geocoding, organization search, caching or persistence here. */
(function(root){
 'use strict';
 const PUBLIC_BROWSER_KEY="fc0f9182-0eee-4e83-bed3-8e561c88c4d5";
 const KEY='seyveo.yandex.maps.testKey';
 let sdkPromise=null,lastStatus='idle';
 function browserKey(){
  try{return String(root.SEYVEO_YANDEX_MAPS_CONFIG?.apiKey||PUBLIC_BROWSER_KEY).trim()}catch{return PUBLIC_BROWSER_KEY}
 }
 const enabled=()=>!!browserKey();
 function customization(premium=false){
  const fill=(tags,color,types)=>({tags:{any:tags},elements:'geometry.fill',...(types?{types}:{}),stylers:[{color}]});
  return [
   fill(['land'],premium?'#F6F7F7':'#F5F5F0',['polygon']),
   fill(['urban_area'],premium?'#EDF0F1':'#F0EFEB',['polygon']),
   fill(['vegetation','park'],premium?'#DCE8DC':'#DCECCF',['polygon']),
   fill(['water'],premium?'#B1CED5':'#94CDEB'),
   fill(['building'],premium?'#E0E5E8':'#DEDAD5',['polygon']),
   fill(['road'],'#FFFFFF',['polyline']),
   fill(['road_1','road_2','road_3'],premium?'#F7F5E9':'#F7D68A',['polyline'])
  ];
 }
 function load(){
  if(!enabled()){lastStatus='no-key';return Promise.reject(new Error('Map preview disabled'))}
  if(sdkPromise)return sdkPromise;
  lastStatus='loading-sdk';
  sdkPromise=new Promise((resolve,reject)=>{
   let script;
   const timer=root.setTimeout(()=>{lastStatus='sdk-timeout';script?.remove();reject(new Error('Map SDK timeout'))},20000);
   const finish=(error,sdk)=>{root.clearTimeout(timer);if(error){script?.remove();reject(error)}else{lastStatus='sdk-ready';resolve(sdk)}};
   const ready=()=>Promise.resolve(root.ymaps3?.ready).then(()=>{
    if(!root.ymaps3?.YMap)throw new Error('Map SDK unavailable');finish(null,root.ymaps3)
   }).catch(()=>{lastStatus='sdk-not-ready';finish(new Error('Map SDK unavailable'))});
   if(root.ymaps3){ready();return}
   script=root.document.createElement('script');
   const url=new URL('https://api-maps.yandex.ru/v3/');
   url.searchParams.set('apikey',browserKey());url.searchParams.set('lang','ru_RU');
   script.src=url.href;script.async=true;script.referrerPolicy='strict-origin-when-cross-origin';
   script.onload=ready;script.onerror=()=>{lastStatus='sdk-network-error';finish(new Error('Map SDK unavailable'))};
   root.document.head.append(script);
  }).catch(error=>{sdkPromise=null;throw error});
  return sdkPromise;
 }
 async function mount(host,target,{isActive=()=>true,onZoom=()=>{},styled=true,premium=false}={}){
  if(!Number.isFinite(target?.lat)||!Number.isFinite(target?.lon))throw new Error('Invalid map coordinates');
  const sdk=await load();
  if(!isActive()||!host.isConnected)return null;
  const center=[target.lon,target.lat];
  let map;
  lastStatus='initializing';
  try{
   map=new sdk.YMap(host,{location:{center,zoom:16},mode:styled?'vector':'auto',theme:'light',zoomRange:{min:3,max:18}});
   map.addChild(new sdk.YMapDefaultSchemeLayer(styled?{customization:customization(premium)}:{}));
   map.addChild(new sdk.YMapDefaultFeaturesLayer());
   const pin=root.document.createElement('div');pin.className='sv-yandex-meeting-pin';pin.setAttribute('aria-label',target.name||'Место встречи');
   if(premium){pin.classList.add('sv-place-jade-pin');}else pin.textContent='●';
   map.addChild(new sdk.YMapMarker({coordinates:center},pin));
   if(sdk.YMapListener)map.addChild(new sdk.YMapListener({onUpdate:()=>onZoom(map.zoom)}));
   onZoom(map.zoom);lastStatus='map-created';
   return {
    zoom(delta){map.setLocation({zoom:Math.max(3,Math.min(18,map.zoom+delta)),duration:200})},
    center(){map.setLocation({center,zoom:16,duration:250})},
    destroy(){map.destroy()}
   };
  }catch(error){lastStatus='map-init-error';try{map?.destroy()}catch{}throw new Error('Map initialization failed')}
 }
 root.SEYVEO_YANDEX_MAPS=Object.freeze({enabled,mount,loadSdk:load,status:()=>lastStatus});
})(window);
