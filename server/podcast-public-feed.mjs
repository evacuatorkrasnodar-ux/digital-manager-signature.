/* Local podcast RSS adapter: bounded public HTTPS only, pinned IPv4 DNS,
   no cookies, credentials, private addresses or unchecked redirects. */
import {get} from 'node:https';
import {resolve4} from 'node:dns/promises';
const LIMIT=3_000_000;
export function publicIPv4(ip){
 const p=String(ip).split('.').map(Number);
 if(p.length!==4||p.some(x=>!Number.isInteger(x)||x<0||x>255))return false;
 const [a,b,c]=p;
 return a>0&&a<224&&a!==10&&a!==127&&!(a===100&&b>=64&&b<=127)&&!(a===169&&b===254)&&!(a===172&&b>=16&&b<=31)&&!(a===192&&(b===168||b===0||b===88&&c===99))&&!(a===198&&(b===18||b===19||b===51&&c===100))&&!(a===203&&b===0&&c===113);
}
function validated(value){
 const u=new URL(value);
 if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||u.href.length>2500||!/^([a-z0-9-]+\.)+[a-z][a-z0-9-]*$/i.test(u.hostname)||/\.(local|localhost|internal|lan|home|test|invalid|onion)$/i.test(u.hostname))throw Error('invalid URL');
 u.hash='';return u;
}
async function withDeadline(promise,ms){
 let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),ms)})])}finally{clearTimeout(timer)}
}
async function request(value,remaining=3,deadline=Date.now()+15000){
 const u=validated(value),ms=deadline-Date.now();if(ms<=0)throw Error('timeout');
 const ips=await withDeadline(resolve4(u.hostname),ms);
 if(!ips.length||!ips.every(publicIPv4))throw Error('non-public address');
 const ip=ips[0];
 const response=await new Promise((resolve,reject)=>{
  const req=get(u,{agent:false,family:4,autoSelectFamily:false,lookup:(_host,opts,cb)=>opts?.all?cb(null,[{address:ip,family:4}]):cb(null,ip,4),headers:{accept:'application/rss+xml, application/xml, text/xml, application/json, */*;q=0.1','accept-encoding':'identity','user-agent':'SEYVEO Podcast Reader'}},res=>{
   if([301,302,303,307,308].includes(res.statusCode)){const loc=res.headers.location;res.destroy();if(!loc||remaining<=0){reject(Error('redirect'));return}resolve({redirect:new URL(loc,u).href});return}
   if(res.statusCode!==200||Number(res.headers['content-length']||0)>LIMIT){res.destroy();reject(Error('unavailable'));return}
   const chunks=[];let size=0;res.on('data',chunk=>{size+=chunk.length;if(size>LIMIT){req.destroy(Error('too large'));return}chunks.push(chunk)});
   res.once('end',()=>resolve({body:Buffer.concat(chunks).toString('utf8'),url:u.href}));res.once('error',reject);res.once('aborted',()=>reject(Error('aborted')));
  });const timer=setTimeout(()=>req.destroy(Error('timeout')),Math.max(1,deadline-Date.now()));req.once('close',()=>clearTimeout(timer));req.once('error',reject);
 });
 if(response.redirect)return request(response.redirect,remaining-1,deadline);return response;
}
export async function readPublicPodcastFeed(url){
 const r=await request(url);
 if(!/<(?:rss|rdf:RDF)(?:\s|>)/i.test(r.body)||/<!DOCTYPE|<!ENTITY/i.test(r.body))throw Error('not RSS');
 return {xml:r.body,url:r.url};
}
export async function lookupPodcastEpisodes(id,country='RU'){
 if(!/^[1-9]\d{0,14}$/.test(String(id))||!/^[A-Z]{2}$/.test(country))throw Error('invalid lookup');
 const u=new URL('https://itunes.apple.com/lookup');u.search=new URLSearchParams({id:String(id),country,entity:'podcastEpisode',limit:'50'});
 const r=await request(u.href);const data=JSON.parse(r.body);if(!Array.isArray(data.results))throw Error('invalid directory');return {results:data.results.slice(0,60)};
}
