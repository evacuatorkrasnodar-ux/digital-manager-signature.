/* SEYVEO Music Library · local-only titles, embedded ID3 and cover-art.
 * Read bounded file headers; never alter files, contact servers, or invent artist.
 * ID3 v2.3/v2.4 MP3 supported; other formats fall back to cleaned filename. */
(function(host,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(host)host.SEYVEO_MUSIC_METADATA=Object.freeze(api);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const EXT=/\.(?:mp3|m4a|aac|wav|ogg|opus|flac|alac|aiff?|mp4)$/i;
 const BRACKET_JUNK=/^(?:official(?:\s+music)?\s+(?:audio|video|visualizer|lyrics?|clip)|(?:lyrics?|text)\s*(?:video)?|visualizer|audio\s*only|(?:free\s*)?download(?:\s*(?:mp3|audio))?|скачать(?:\s*(?:mp3|бесплатно|песн\w*))?|слушать\s*онлайн|\d{2,4}\s*(?:kbps|кбит\/с|kbs|khz)|(?:mp3|aac|flac|wav)\s*\d{2,4})$/i;
 const DOMAIN=/(?:https?:\/\/|www\.)?\b(?:[a-z0-9-]+\.)+(?:com|net|org|ru|su|me|info|music|site|io|top|cc|fun|pro|kz|fm|by|ua|uz|club|online|xyz)\b/gi;
 const DOMAIN_ONLY=/^(?:https?:\/\/|www\.)?(?:[a-z0-9-]+\.)+(?:com|net|org|ru|su|me|info|music|site|io|top|cc|fun|pro|kz|fm|by|ua|uz|club|online|xyz)$/i;
 const QUALITY=/^(?:\d{2,4}(?:\s*(?:kbps|кбит\/с|kbs|khz))?|(?:mp3|aac|flac|wav)\s*\d{2,4}|(?:audio\s*)?download|free\s*music)$/i;
 const trimPunct=s=>s.replace(/^[\s·_.\-–—|]+|[\s·_.\-–—|]+$/g,'').replace(/\s{2,}/g,' ').trim();
 function cleanLabel(value,filename=false){
  let s=String(value||'').replace(EXT,'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/_+/g,' ').trim();
  s=s.replace(/\s*[\[(]([^\])\r\n]{1,100})[\])]/g,(part,inside)=>BRACKET_JUNK.test(inside.trim())||DOMAIN_ONLY.test(inside.trim())||/^\d{7,}$/.test(inside.trim())?'':part);
  s=s.replace(DOMAIN,' ').replace(/\b(?:https?|downloaded|скачано)[-\s]+(?:from|с)\b/gi,' ');
  s=s.replace(/\s*[\[(]\s*[\])]/g,' ');
  if(filename)s=s.replace(/^\d{1,3}[\s._–-]+(?=[^\d])/,'');
  s=s.replace(/(?:[\s._–—|-]+)\d{7,}\s*$/,'');
  s=s.replace(/\s*(?:[-–—|]\s*)?(?:\d{3}\s*kbps|320k|192k|256k|128k|download\s*mp3|скачать\s*mp3)\s*$/i,'');
  s=trimPunct(s);
  // A lowercase download filename gets a readable initial, not invented metadata.
  if(s&&s===s.toLocaleLowerCase('ru-RU'))s=s.charAt(0).toLocaleUpperCase('ru-RU')+s.slice(1);
  return s;
 }
 function filenameParts(name){
  const cleaned=cleanLabel(String(name||'').split(/[\\/]/).pop(),true);
  const chunks=cleaned.split(/\s+[-–—]\s+/).map(s=>cleanLabel(s)).filter(Boolean);
  const artist=chunks.length>=2&&!QUALITY.test(chunks[0])?chunks[0]:'';
  const song=artist?chunks.slice(1).join(' — '):cleaned;
  const title=song||'Без названия';
  return {title,artist,display:artist?artist+' — '+title:title};
 }
 const decoder=(enc,bytes)=>{
  try{
   if(enc===0)return new TextDecoder('windows-1252').decode(bytes).replace(/\0/g,' ').trim();
   if(enc===3)return new TextDecoder('utf-8',{fatal:false}).decode(bytes).replace(/\0/g,' ').trim();
   if(enc===1||enc===2){
    if(bytes.length<2)return '';
    let big=enc===2;
    let body=bytes;
    if(enc===1){
     if(bytes[0]===0xfe&&bytes[1]===0xff){big=true;body=bytes.subarray(2);}
     else if(bytes[0]===0xff&&bytes[1]===0xfe){big=false;body=bytes.subarray(2);}
    }
    if(big){
     const swapped=new Uint8Array(body.length);
     for(let i=0;i+1<body.length;i+=2){swapped[i]=body[i+1];swapped[i+1]=body[i];}
     return new TextDecoder('utf-16le').decode(swapped).replace(/\0/g,' ').trim();
    }
    return new TextDecoder('utf-16le').decode(body).replace(/\0/g,' ').trim();
   }
  }catch{}
  return '';
 };
 const ascii=(buf,a,b)=>String.fromCharCode(...buf.subarray(a,b));
 const syncsafe=(buf,at)=>((buf[at]&127)<<21)|((buf[at+1]&127)<<14)|((buf[at+2]&127)<<7)|(buf[at+3]&127);
 function parseApic(frame){
  if(frame.length<16)return null;
  const enc=frame[0];let pos=1;
  const end=frame.indexOf(0,pos);
  if(end<0||end-pos>40)return null;
  const mime=ascii(frame,pos,end).toLowerCase();
  if(mime!=='image/jpeg'&&mime!=='image/png')return null;
  pos=end+2; // MIME null + picture type.
  const terminator=enc===1||enc===2?2:1;
  while(pos+terminator<frame.length){
   if(frame[pos]===0&&(terminator===1||frame[pos+1]===0)){pos+=terminator;break;}
   pos+=terminator===2?2:1;
  }
  const bytes=frame.subarray(pos);
  if(bytes.length<50||bytes.length>1800000)return null;
  if(mime==='image/jpeg'&&!(bytes[0]===0xff&&bytes[1]===0xd8))return null;
  if(mime==='image/png'&&ascii(bytes,1,4)!=='PNG')return null;
  return new Blob([bytes],{type:mime});
 }
 async function readId3(file){
  if(!/\.mp3$/i.test(file?.name||'')||!file?.slice)return {};
  try{
   const header=new Uint8Array(await file.slice(0,10).arrayBuffer());
   if(header.length<10||ascii(header,0,3)!=='ID3'||![3,4].includes(header[3]))return {};
   if(header[5]&0x80)return {}; // Avoid broken unsynchronized frame parsing.
   const size=syncsafe(header,6),limit=Math.min(2000000,file.size||0);
   if(size<10||size+10>limit)return {};
   const bytes=new Uint8Array(await file.slice(0,size+10).arrayBuffer());
   const result={};let pos=10;
   while(pos+10<=bytes.length){
    const id=ascii(bytes,pos,pos+4);
    if(!/^[A-Z0-9]{4}$/.test(id))break;
    const len=header[3]===4?syncsafe(bytes,pos+4):((bytes[pos+4]<<24)>>>0)+((bytes[pos+5]<<16)|(bytes[pos+6]<<8)|bytes[pos+7]);
    pos+=10;
    if(!len||len>bytes.length-pos)break;
    const data=bytes.subarray(pos,pos+len);
    if(['TIT2','TPE1','TALB'].includes(id)){
     const value=decoder(data[0],data.subarray(1)).slice(0,300);
     if(value)result[{TIT2:'title',TPE1:'artist',TALB:'album'}[id]]=value;
    }else if(id==='APIC'&&!result.artwork){
     result.artwork=parseApic(data);
    }
    pos+=len;
   }
   return result;
  }catch{return {}}
 }
 async function describe(file){
  const fallback=filenameParts(file?.name);
  const tags=await readId3(file);
  const title=cleanLabel(tags.title)||fallback.title;
  const artist=cleanLabel(tags.artist)||fallback.artist;
  return {
   title,artist,album:tags.album||'',
   display:artist?artist+' — '+title:title,
   artwork:tags.artwork||null,
   source:tags.title||tags.artist?'id3':'filename'
  };
 }
 return {filenameParts,readId3,describe};
});
