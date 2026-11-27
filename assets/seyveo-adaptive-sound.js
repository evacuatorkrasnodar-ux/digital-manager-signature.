/* SEYVEO Adaptive Sound v1: local, attenuation-only loudness matching.
 * No equalizer, compression, audio upload, Web Audio media routing or radio changes.
 * The first stage uses a sampled RMS estimate, not BS.1770 / LUFS. */
(function(host,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(host)api.install(host);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const clamp=(n,lo=0,hi=1)=>Math.min(hi,Math.max(lo,n));
 const MAX_BYTES=12*1024*1024,MAX_SECONDS=600,TARGET=-18,MIN_DB=-9;
 function estimate(buffer){
  if(!buffer||!Number.isFinite(buffer.duration)||buffer.duration<=0||buffer.duration>MAX_SECONDS||buffer.numberOfChannels<1||buffer.numberOfChannels>2)return null;
  let sum=0,count=0;
  for(let c=0;c<buffer.numberOfChannels;c++){
   const data=buffer.getChannelData(c),stride=Math.max(1,Math.floor(data.length/180000));
   for(let i=0;i<data.length;i+=stride){const x=data[i];if(Number.isFinite(x)){sum+=x*x;count++}}
  }
  if(!count||sum<=0)return null;
  const rmsDb=10*Math.log10(sum/count);
  // Never amplify quiet tracks or introduce clipping. Preserve musical dynamics.
  return {rmsDb,gain:10**(clamp(TARGET-rmsDb,MIN_DB,0)/20)};
 }
 function install(w){
  const d=w.document,audio=d.getElementById('sayviMusicAudio');
  if(!audio||w.SEYVEO_ADAPTIVE_SOUND)return;
  const key='seyveo-adaptive-sound-v1';
  const ios=/iPhone|iPad|iPod/i.test(w.navigator.userAgent||'')||(w.navigator.platform==='MacIntel'&&w.navigator.maxTouchPoints>1);
  const Offline=w.OfflineAudioContext||w.webkitOfflineAudioContext;
  let pure=false;try{pure=w.localStorage.getItem(key)==='pure'}catch{}
  let base=audio.volume,fade=1,factor=1,expected=audio.volume,lastFile=null,phase='idle',result=null,generation=0,busy=false,pending=false,ramp=0;
  let transport=1,transportRamp=0,transportEpoch=0,pausing=false,startPending=false;
  const cache=new WeakMap();
  const file=()=>w.SEYVEO_MUSIC?.rhythmFile?.()||null;
  const emit=()=>d.dispatchEvent(new w.CustomEvent('seyveo:adaptive-sound'));
  const state=()=>({pure,phase,gain:factor,attenuationDb:result?Math.round(20*Math.log10(result.gain)*10)/10:null,supported:!ios&&!!Offline});
  function apply(){
   if(ios)return false;
   const target=clamp(base*factor*fade*transport);
   expected=target;
   try{audio.volume=target}catch{return false}
   if(Math.abs(audio.volume-target)>.025){expected=audio.volume;return false}return true;
  }
  function stopRamp(){if(ramp){w.clearInterval(ramp);ramp=0}}
  function changeGain(target,smooth=false){
   stopRamp();
   if(!smooth||audio.paused||Math.abs(target-factor)<.001){factor=target;return apply()}
   const start=factor,at=Date.now();
   ramp=w.setInterval(()=>{
    const progress=clamp((Date.now()-at)/450);factor=start+(target-start)*progress;
    if(!apply()||progress===1){stopRamp();if(progress!==1){phase='unsupported';factor=1;apply();emit()}}
   },50);return true;
  }
  function setBaseVolume(v){if(!Number.isFinite(v)||ios)return false;base=clamp(v);return apply()}
  function setFade(v){if(!Number.isFinite(v)||ios)return false;fade=clamp(v);return apply()}
  // Independent transport envelope: never overwrite the sleep fade or base volume.
  function cancelTransport(){
   ++transportEpoch;if(transportRamp){w.clearInterval(transportRamp);transportRamp=0}
   pausing=false;startPending=false;
  }
  function rampTransport(target,ms,done){
   if(transportRamp){w.clearInterval(transportRamp);transportRamp=0}
   const version=++transportEpoch,from=transport,at=Date.now();
   if(ios||!apply()){transport=1;apply();done?.();return}
   transportRamp=w.setInterval(()=>{
    if(version!==transportEpoch)return;
    const t=clamp((Date.now()-at)/ms),ease=t*t*(3-2*t);
    transport=from+(target-from)*ease;
    const ok=apply();
    if(t===1||!ok){w.clearInterval(transportRamp);transportRamp=0;if(!ok){transport=1;apply()}done?.()}
   },25);
  }
  function playSmooth(){
   if(ios)return audio.play();
   const reversing=pausing&&!audio.paused;
   cancelTransport();
   if(reversing){rampTransport(1,280);return Promise.resolve()}
   if(!audio.paused&&!audio.ended){transport=1;apply();return Promise.resolve()}
   transport=0;
   if(!apply()){transport=1;apply();return audio.play()}
   startPending=true;
   const version=transportEpoch;
   try{
    const p=audio.play();
    if(p?.catch)return p.catch(error=>{if(version===transportEpoch){cancelTransport();transport=1;apply()}throw error});
    return p;
   }catch(error){cancelTransport();transport=1;apply();throw error}
  }
  function pauseSmooth(){
   if(audio.paused||audio.ended){cancelTransport();transport=1;apply();return}
   if(ios||w.document.hidden){cancelTransport();audio.pause();transport=1;apply();return}
   cancelTransport();pausing=true;
   rampTransport(0,220,()=>{pausing=false;audio.pause();transport=1;apply()});
  }
  audio.addEventListener('playing',()=>{
   if(ios||pausing||!startPending)return;
   startPending=false;rampTransport(1,380);
  });
  const resetTransport=()=>{if(!audio.paused&&!audio.ended&&!audio.error)return;cancelTransport();transport=1;apply()};
  for(const name of ['pause','ended','error'])audio.addEventListener(name,resetTransport);
  d.addEventListener('visibilitychange',()=>{
   if(!d.hidden)return;
   const stop=pausing;cancelTransport();if(stop)audio.pause();transport=1;apply();
  });
  audio.addEventListener('volumechange',()=>{
   if(ios||Math.abs(audio.volume-expected)<.00001)return;
   base=audio.volume;apply();
  });
  async function analyse(){
   if(busy){pending=true;return}
   const selected=file(),version=generation;
   if(pure||ios||!Offline||!selected||selected!==lastFile)return;
   if(!Number.isFinite(audio.duration)||audio.duration<=0)return;
   if(audio.duration>MAX_SECONDS||selected.size>MAX_BYTES){phase='limited';emit();return}
   const cached=cache.get(selected);
   if(cached!==undefined){finish(cached,selected,version);return}
   busy=true;phase='analysing';emit();
   let data=null;
   try{
    const context=new Offline(1,1,16000);
    const bytes=await selected.arrayBuffer();
    if(version===generation&&!pure&&file()===selected){
     const decoded=await new Promise((resolve,reject)=>{
      try{const p=context.decodeAudioData(bytes,resolve,reject);if(p?.then)p.then(resolve,reject)}catch(e){reject(e)}
     });
     data=estimate(decoded);cache.set(selected,data);
    }
   }catch{if(version===generation)cache.set(selected,null)}
   finally{busy=false;finish(data,selected,version);if(pending){pending=false;analyse()}}
  }
  function finish(data,selected,version){
   if(version!==generation||pure||file()!==selected)return;
   result=data;phase=data?'active':'limited';
   if(!changeGain(data?.gain??1,true)){phase='unsupported';factor=1;apply()}
   emit();
  }
  function sync(force=false){
   const selected=file();
   if(force||selected!==lastFile){
    lastFile=selected;generation++;result=null;changeGain(1);
    phase=pure?'pure':!selected?'idle':ios||!Offline?'unsupported':'waiting';emit();
   }
   if(phase==='waiting'&&Number.isFinite(audio.duration)&&audio.duration>0)analyse();
  }
  function setPure(value){
   pure=!!value;try{w.localStorage.setItem(key,pure?'pure':'adaptive')}catch{}
   sync(true);return state();
  }
  d.addEventListener('seyveo:music-state',()=>sync());
  audio.addEventListener('loadedmetadata',()=>sync());
  audio.addEventListener('playing',()=>sync());
  w.SEYVEO_ADAPTIVE_SOUND=Object.freeze({state,setPure,baseVolume:()=>base,setBaseVolume,setFade,playSmooth,pauseSmooth,isPausing:()=>pausing});
  sync(true);
 }
 return {estimate,install};
});
