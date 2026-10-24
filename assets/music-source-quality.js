/* SEYVA MUSIC · factual source parameters (not a certificate / output-chain test).
 * Inspect at most 128 KiB of the user-picked FILE, never sample output, upload
 * or reconstruct sound. A false negative is preferable to a false Hi-Res claim.
 * Recognizes FLAC STREAMINFO, uncompressed integer PCM WAV, and MP3 frame
 * sample rate / bitrate (first frame; may vary with VBR).
 */
(function(host,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(host)host.SEYVA_MUSIC_SOURCE_QUALITY=Object.freeze(api);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const LIMIT=128*1024;
 const text=(b,pos,length)=>String.fromCharCode(...b.subarray(pos,pos+length));
 const u16=(b,p)=>b[p]|b[p+1]<<8;
 const u32=(b,p)=>(b[p]|b[p+1]<<8|b[p+2]<<16|(b[p+3]<<24))>>>0;
 const result=(format,bits,sampleRate,channels)=>{
  if(!Number.isInteger(bits)||!Number.isInteger(sampleRate)||!Number.isInteger(channels)
   ||bits<8||bits>32||sampleRate<8000||sampleRate>384000||channels<1||channels>8)return null;
  const hiRes=bits>=24&&sampleRate>=96000;
  return Object.freeze({format,bits,sampleRate,channels,hiRes,
   detail:bits+'-bit / '+(sampleRate/1000).toLocaleString('en-US',{maximumFractionDigits:2})+' kHz'});
 };
 function flac(b,size){
  if(b.length<42||text(b,0,4)!=='fLaC'||(b[4]&127)!==0)return null;
  const length=(b[5]<<16)|(b[6]<<8)|b[7];
  if(length!==34||size<=42||b.length<42)return null;
  const offset=8;
  const sampleRate=b[offset+10]<<12|b[offset+11]<<4|b[offset+12]>>4;
  const channels=((b[offset+12]&14)>>1)+1;
  const bits=(((b[offset+12]&1)<<4)|(b[offset+13]>>4))+1;
  // STREAMINFO total samples must be nonzero for a conservative claim.
  const sampleCount=((b[offset+13]&15)*0x100000000)+u32be(b,offset+14);
  if(sampleCount<=0)return null;
  return result('FLAC',bits,sampleRate,channels);
 }
 function u32be(b,p){return (b[p]*16777216)+(b[p+1]<<16)+(b[p+2]<<8)+b[p+3]}
 function wav(b,size){
  if(b.length<44||text(b,0,4)!=='RIFF'||text(b,8,4)!=='WAVE')return null;
  if(u32(b,4)+8>size||u32(b,4)<36)return null;
  let pos=12,fmt=null,hasData=false;
  // WAV may contain non-audio chunks before fmt/data. No unbounded reads.
  while(pos+8<=b.length){
   const id=text(b,pos,4),length=u32(b,pos+4),start=pos+8;
   if(length>size-start)break;
   if(id==='fmt '&&length>=16&&start+length<=b.length){
    const kind=u16(b,start),channels=u16(b,start+2),sampleRate=u32(b,start+4);
    const byteRate=u32(b,start+8),blockAlign=u16(b,start+12),bits=u16(b,start+14);
    // Conservative: linear PCM only, never accept float, codec or extensible
    // headers without validating the actual subformat / valid-bit depth.
    if(kind!==1||bits%8||!blockAlign||byteRate!==sampleRate*blockAlign
     ||blockAlign!==channels*(bits/8))return null;
    fmt=result('WAV',bits,sampleRate,channels);
   }
   if(id==='data'&&length>0){
    hasData=true;
    // Reject declared data outside physical file, even on a truncated upload.
    if(start+length>size)return null;
   }
   const step=8+length+(length&1);
   if(step<=8&&length===0){pos+=8;continue;}
   if(pos+step<=pos)break;
   pos+=step;
   if(fmt&&hasData)break;
  }
  return fmt&&hasData?fmt:null;
 }

 function mp3(b,size){
  if(b.length<200)return null;
  let offset=0;
  // Skip a genuine ID3v2 tag only if all four length bytes are sync-safe.
  if(text(b,0,3)==='ID3'){
   if(b.length<10||b[6]>127||b[7]>127||b[8]>127||b[9]>127)return null;
   const tagSize=(b[6]<<21)|(b[7]<<14)|(b[8]<<7)|b[9];
   offset=10+tagSize+((b[5]&16)?10:0);
   if(offset+8>=b.length||offset>=size)return null;
  }
  const versionRates={3:[44100,48000,32000],2:[22050,24000,16000],0:[11025,12000,8000]};
  const mpeg1Rates=[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0];
  const mpeg2Rates=[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0];
  function frame(p){
   if(p+4>b.length||b[p]!==255||(b[p+1]&0xe0)!==0xe0)return null;
   const version=(b[p+1]>>3)&3,layer=(b[p+1]>>1)&3;
   if(version===1||layer!==1)return null; // MPEG Layer III only.
   const ix=(b[p+2]>>4)&15,rateIndex=(b[p+2]>>2)&3;
   if(!ix||ix===15||rateIndex===3)return null;
   const rate=versionRates[version][rateIndex];
   const bitrate=(version===3?mpeg1Rates:mpeg2Rates)[ix];
   const frameSize=Math.floor((version===3?144000:72000)*bitrate/rate)+((b[p+2]>>1)&1);
   if(!rate||frameSize<24||p+frameSize>size)return null;
   return {version,rate,bitrate,frameSize,channels:((b[p+3]>>6)&3)===3?1:2};
  }
  // Require consecutive plausible frames to avoid claiming random bytes are MP3.
  for(let p=offset;p+8<b.length&&p<offset+32768;p++){
   const first=frame(p);
   if(!first||p+first.frameSize+4>b.length)continue;
   const second=frame(p+first.frameSize);
   if(!second||first.rate!==second.rate||first.version!==second.version)continue;
   const kHz=(first.rate/1000).toLocaleString('en-US',{maximumFractionDigits:2});
   return Object.freeze({
    format:'MP3',bits:null,sampleRate:first.rate,channels:first.channels,
    bitrateKbps:first.bitrate,bitrateScope:'first-frame',hiRes:false,
    detail:first.bitrate+' kbps (first frame) / '+kHz+' kHz'
   });
  }
  return null;
 }
 async function detect(file){
  if(!file||typeof file.slice!=='function'||!Number.isSafeInteger(file.size)||file.size<44)return null;
  try{
   const b=new Uint8Array(await file.slice(0,Math.min(LIMIT,file.size)).arrayBuffer());
   if(text(b,0,4)==='fLaC')return flac(b,file.size);
   if(text(b,0,4)==='RIFF')return wav(b,file.size);
   return mp3(b,file.size);
  }catch{}
  return null;
 }
 return {detect};
});
