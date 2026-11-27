/* SEYVEO local recognition v1. No network, no API key.
 * Versioned spectral landmarks; not an identity guarantee or a global catalog. */
(function(host,factory){
 const api=factory(host);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(host)host.SEYVEO_MUSIC_FINGERPRINT=api;
})(typeof window!=='undefined'?window:null,function(w){
 'use strict';
 const RATE=11025,N=1024,HOP=256,VERSION=1,MAX_TRACKS=150,MAX_BYTES=20*1024*1024,MAX_SECONDS=600,MAX_HASHES=22000;
 const wait=()=>new Promise(resolve=>setTimeout(resolve,0));
 const win=Float32Array.from({length:N},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/(N-1)));
 function spectrum(pcm,offset,re,im){
  for(let i=0,j=0;i<N;i++){
   re[j]=(pcm[offset+i]||0)*win[i];im[j]=0;
   let bit=N>>1;while(bit&&(j&bit)){j^=bit;bit>>=1}j^=bit;
  }
  for(let len=2;len<=N;len*=2){
   const angle=-2*Math.PI/len,cr=Math.cos(angle),ci=Math.sin(angle);
   for(let start=0;start<N;start+=len){
    let wr=1,wi=0;
    for(let k=0;k<len/2;k++){
     const a=start+k,b=a+len/2,tr=wr*re[b]-wi*im[b],ti=wr*im[b]+wi*re[b];
     re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;
     const next=wr*cr-wi*ci;wi=wr*ci+wi*cr;wr=next;
    }
   }
  }
  const out=new Float32Array(400);
  for(let k=5;k<out.length;k++)out[k]=Math.log1p(re[k]*re[k]+im[k]*im[k]);
  return out;
 }
 async function fingerprint(pcm,{yieldWork=false,signal}={}){
  const frames=Math.floor((pcm.length-N)/HOP)+1;
  if(frames<10)return new Uint32Array(0);
  const re=new Float64Array(N),im=new Float64Array(N),peaks=[],ring=[];
  for(let t=0;t<frames;t++){
   if(signal?.aborted)throw Error('cancelled');
   ring.push(spectrum(pcm,t*HOP,re,im));
   if(ring.length===5){
    const mid=ring[2],list=[];
    for(const [lo,hi] of [[6,24],[24,48],[48,96],[96,192],[192,398]]){
     let best=0;
     for(let k=lo;k<hi;k++){
      const v=mid[k];
      if(v<1.6||v<=mid[k-1]||v<=mid[k+1])continue;
      if(ring[0][k]>v||ring[1][k]>=v||ring[3][k]>v||ring[4][k]>v)continue;
      if(!best||v>mid[best])best=k;
     }
     if(best)list.push(best);
    }
    for(const k of list)peaks.push({t:t-2,k});
    ring.shift();
   }
   if(yieldWork&&t%48===0)await wait();
  }
  const pairs=[];
  for(let i=0;i<peaks.length&&pairs.length<MAX_HASHES*2;i++){
   const a=peaks[i];let count=0,last=-1;
   for(let j=i+1;j<peaks.length;j++){
    const b=peaks[j],dt=b.t-a.t;
    if(dt<4)continue;if(dt>38)break;
    if(b.t===last)continue;last=b.t;
    // Landmark frequency pair and time delta, followed by anchor frame.
    pairs.push((a.k<<15)|(b.k<<6)|dt,a.t);
    if(++count>=6||pairs.length>=MAX_HASHES*2)break;
   }
   if(yieldWork&&i%256===0)await wait();
  }
  return Uint32Array.from(pairs);
 }
 function queryMap(query){
  const map=new Map();
  for(let i=0;i<query.length;i+=2){
   const h=query[i],t=query[i+1];let times=map.get(h);
   if(!times)map.set(h,times=[]);
   if(times.length<8)times.push(t);
  }
  return map;
 }
 function score(query,reference){
  const votes=new Map();
  for(let i=0;i<reference.length;i+=2){
   const h=reference[i],times=query.get(h);if(!times)continue;
   for(const t of times){
    const offset=reference[i+1]-t;
    for(let d=-1;d<=1;d++){
     const key=offset+d;let v=votes.get(key);
     if(!v)votes.set(key,v={hashes:new Set(),times:new Set()});
     v.hashes.add(h);v.times.add(t);
    }
   }
  }
  let best={count:0,span:0};
  for(const v of votes.values()){
   const count=v.hashes.size;if(count<=best.count||v.times.size<7)continue;
   let lo=Infinity,hi=-Infinity;for(const t of v.times){lo=Math.min(lo,t);hi=Math.max(hi,t)}
   best={count,span:hi-lo};
  }
  return best;
 }
 async function match(query,records,{yieldWork=false,signal}={}){
  const map=queryMap(query);if(map.size<12)return null;
  let best=null,second=0;
  for(const record of records){
   if(signal?.aborted)throw Error('cancelled');
   const s=score(map,record.hashes);
   if(!best||s.count>best.count){second=best?.count||0;best={...s,record}}
   else second=Math.max(second,s.count);
   if(yieldWork)await wait();
  }
  if(!best||best.count<16||best.span<45||best.count<second*1.35||best.count-second<6)return null;
  return {id:best.record.id,title:best.record.title,artist:best.record.artist,album:best.record.album||'',matches:best.count};
 }
 const Context=()=>w&&(w.OfflineAudioContext||w.webkitOfflineAudioContext);
 async function decode(blob){
  const C=Context();if(!C)throw Error('unsupported');
  if(!blob?.size||blob.size>MAX_BYTES)throw Error('size');
  const bytes=typeof blob.arrayBuffer==='function'?await blob.arrayBuffer():await new Promise((ok,no)=>{const reader=new w.FileReader();reader.onload=()=>ok(reader.result);reader.onerror=no;reader.readAsArrayBuffer(blob)});
  const ctx=new C(1,1,RATE);
  const buf=await new Promise((ok,no)=>{try{const p=ctx.decodeAudioData(bytes,ok,no);p?.then(ok,no)}catch(e){no(e)}});
  if(buf.duration>MAX_SECONDS||buf.sampleRate!==RATE)throw Error('duration');
  const mono=new Float32Array(buf.length);
  for(let c=0;c<buf.numberOfChannels;c++){const a=buf.getChannelData(c);for(let i=0;i<a.length;i++)mono[i]+=a[i]/buf.numberOfChannels}
  return mono;
 }
 let dbPromise=null,records=new Map(),failed=new Set(),busy=false,ready=false,storage=true,scheduled=0,controller=null;
 const library=()=>w?.SEYVEO_MUSIC?.recognitionLibrary?.()||[];
 function openDB(){
  if(!w?.indexedDB)return Promise.reject(Error('storage'));
  if(!dbPromise)dbPromise=new Promise((ok,no)=>{
   const r=w.indexedDB.open('seyveo-music-fingerprint-v1',1);
   r.onupgradeneeded=()=>r.result.createObjectStore('tracks',{keyPath:'id'});
   r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();dbPromise=null};ok(r.result)};
   r.onerror=r.onblocked=()=>no(Error('storage'));
  }).catch(e=>{dbPromise=null;throw e});
  return dbPromise;
 }
 async function transaction(mode,fn){
  const db=await openDB();
  return new Promise((ok,no)=>{const tx=db.transaction('tracks',mode);const req=fn(tx.objectStore('tracks'));tx.oncomplete=()=>ok(req.result);tx.onerror=tx.onabort=()=>no(Error('storage'))});
 }
 function state(){const items=library();return {supported:!!Context(),indexed:items.filter(i=>records.has(i.id)).length,total:items.length,failed:items.filter(i=>failed.has(i.id)).length,busy,ready,storage,limit:MAX_TRACKS}}
 function emit(){w?.document.dispatchEvent(new CustomEvent('seyveo:music-fingerprint',{detail:state()}))}
 async function init(){
  if(ready)return;
  try{const rows=await transaction('readonly',s=>s.getAll());for(const r of rows.slice(0,MAX_TRACKS)){if(r.version===VERSION&&r.hashes instanceof Uint32Array)records.set(r.id,r);else if(r.version===VERSION&&r.unsupported)failed.add(r.id)}}catch{storage=false}
  ready=true;
 }
 let initPromise;
 async function run(){
  if(busy||!Context()||w.document.hidden||w.SEYVEO_MUSIC?.state?.().playing)return;
  busy=true;emit();
  try{
   await (initPromise??=init());
   const items=library(),ids=new Set(items.map(x=>x.id));
   for(const id of [...records.keys(),...failed]){
    if(!ids.has(id)){records.delete(id);failed.delete(id);if(storage)try{await transaction('readwrite',s=>s.delete(id))}catch{storage=false}}
   }
   if(records.size+failed.size>=MAX_TRACKS)return;
   const item=items.find(i=>!records.has(i.id)&&!failed.has(i.id));
   if(!item)return;
   controller=new AbortController();
   try{
    const pcm=await decode(item.file);
    const hashes=await fingerprint(pcm,{yieldWork:true,signal:controller.signal});
    if(controller.signal.aborted)return;
    if(hashes.length<32)throw Error('too-few-landmarks');
    const record={id:item.id,title:item.title,artist:item.artist,album:item.album,version:VERSION,hashes};
    records.set(item.id,record);
    if(storage)try{await transaction('readwrite',s=>s.put(record))}catch{storage=false}
   }catch{if(!controller.signal.aborted){failed.add(item.id);if(storage)try{await transaction('readwrite',s=>s.put({id:item.id,version:VERSION,unsupported:true}))}catch{storage=false}}}
  }finally{controller=null;busy=false;emit();if(library().some(i=>!records.has(i.id)&&!failed.has(i.id))&&records.size+failed.size<MAX_TRACKS)schedule()}
 }
 function schedule(){
  if(!w||scheduled||busy||w.document.hidden||w.SEYVEO_MUSIC?.state?.().playing)return;
  scheduled=w.setTimeout(()=>{scheduled=0;run().catch(()=>{})},1000);
 }
 function stop(){controller?.abort();if(scheduled){w.clearTimeout(scheduled);scheduled=0}}
 async function recognize(blob,{signal}={}){
  await (initPromise??=init());
  const ids=new Set(library().map(x=>x.id));
  const query=await fingerprint(await decode(blob),{yieldWork:true,signal});
  return match(query,[...records.values()].filter(r=>ids.has(r.id)),{yieldWork:true,signal});
 }
 if(w){w.document.addEventListener('seyveo:music-library',schedule);w.document.addEventListener('seyveo:music-state',()=>{if(w.SEYVEO_MUSIC?.state?.().playing)stop();else schedule()});w.document.addEventListener('visibilitychange',()=>{if(w.document.hidden)stop();else schedule()});w.addEventListener('pagehide',stop);schedule()}
 return Object.freeze({fingerprint,match,state,schedule,stop,recognize,VERSION,RATE});
});
