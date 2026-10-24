/* SEYVEO PLAY · pure YouTube address parser and concise spoken-intent grammar.
 * No tracking, network, storage, third-party scripts or media here.
 * Only user-provided public YouTube video IDs can reach the official iframe. */
(function(host,build){
 const api=build();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(host)host.SEYVEO_VIDEO_CORE=Object.freeze(api);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const ID=/^[A-Za-z0-9_-]{11}$/;
 const HOSTS=new Set(['youtube.com','www.youtube.com','m.youtube.com',
  'music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com','youtu.be','www.youtu.be']);
 function videoId(input){
  const raw=String(input??'').trim();
  if(!raw||raw.length>2048)return null;
  if(ID.test(raw))return raw;
  let u;
  try{u=new URL(raw)}catch{return null}
  if(u.protocol!=='https:'&&!((u.protocol==='http:')&&HOSTS.has(u.hostname)))return null;
  if(u.username||u.password||u.port||!HOSTS.has(u.hostname.toLowerCase()))return null;
  const host=u.hostname.toLowerCase(),parts=u.pathname.split('/').filter(Boolean);
  let id=null;
  if(host==='youtu.be'||host==='www.youtu.be')id=parts.length===1?parts[0]:null;
  else if(parts.length===1&&parts[0]==='watch')id=u.searchParams.get('v');
  else if(parts.length===2&&['embed','shorts','live'].includes(parts[0]))id=parts[1];
  return typeof id==='string'&&ID.test(id)?id:null;
 }
 function embed(id){
  if(!ID.test(id))return null;
  const url=new URL('https://www.youtube-nocookie.com/embed/'+id);
  url.searchParams.set('playsinline','1');
  url.searchParams.set('controls','1');
  url.searchParams.set('autoplay','0');
  url.searchParams.set('rel','0');
  return url.href;
 }
 function understand(text){
  if(typeof text!=='string'||text.length>350)return false;
  const q=text.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').trim();
  // Video commands take precedence over the existing local audio intents.
  return /(?:покажи|открой|включи|давай посмотрим|хочу посмотреть|смотреть|посмотреть|запусти)\s+(?:(?:мне|нам|пожалуйста|какое-нибудь|какой-нибудь|это|этот)\s+){0,3}(?:видео|ютуб|youtube|ролик|клип|шортс|shorts)(?=\s|$|[.!?])/i.test(q)
   || /^(?:сейви[,\s]+)?(?:ютуб|youtube|видео|seyva play)[.!?\s]*$/i.test(q);
 }
 return Object.freeze({videoId,embed,understand});
});
