/* SEYVEO Paper · authenticated HTTPS proposal boundary (not a running server).
 * Integration must provide a VERIFIED identity and an explicit model provider.
 * No cookies, user files, image uploads or automatic document mutations.
 */
import {validatePaperSketchDraft} from './paper-sketch-contract.mjs';

const TOKEN=/^[A-Za-z0-9._~-]{16,8192}$/;
const SAME=(a,b)=>a?.userId===b?.userId&&a?.sessionId===b?.sessionId&&
 typeof a?.userId==='string'&&a.userId.length>0&&typeof a.sessionId==='string'&&a.sessionId.length>0;
const reply=(status,data,origin)=>new Response(JSON.stringify(data),{
 status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer',
  'vary':'origin',...(origin?{'access-control-allow-origin':origin}:{} )}
});

export function createRemotePaperDraftHandler({apiOrigin,appOrigins,identity,generateSketchJson,now=()=>Date.now()}={}){
 let canonical;
 try{const u=new URL(apiOrigin);if(u.protocol!=='https:'||u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw Error();canonical=u.origin}
 catch{throw TypeError('exact-https-api-origin-required')}
 if(!Array.isArray(appOrigins)||!appOrigins.length||appOrigins.length>5)throw TypeError('trusted-app-origins-required');
 const trusted=new Set(appOrigins.map(value=>{
  const u=new URL(value);
  if(u.protocol!=='https:'||u.origin!==value||u.username||u.password||u.search||u.hash)throw TypeError('invalid-app-origin');
  return u.origin;
 }));
 if(typeof identity?.identifyVerifiedPerson!=='function'||typeof generateSketchJson!=='function'||typeof now!=='function')
  throw TypeError('verified-identity-and-provider-required');
 const limit=new Map();
 return async function handle(request){
  let url;
  try{url=new URL(request.url)}catch{return reply(404,{error:'not-found'})}
  if(url.origin!==canonical||url.pathname!=='/v1/paper/draft'||url.search||url.hash)
   return reply(404,{error:'not-found'});
  const origin=request.headers.get('origin');
  if(!origin||!trusted.has(origin))return reply(403,{error:'origin-not-allowed'});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
   'access-control-allow-origin':origin,'access-control-allow-methods':'POST',
   'access-control-allow-headers':'authorization,content-type,x-seyveo-paper-consent',
   'access-control-max-age':'300','vary':'origin','cache-control':'no-store'
  }});
  if(request.method!=='POST')return reply(405,{error:'method-not-allowed'},origin);
  if(request.headers.get('x-seyveo-paper-consent')!=='yes')return reply(403,{error:'consent-required'},origin);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return reply(415,{error:'json-required'},origin);
  const authorization=request.headers.get('authorization')||'';
  const token=authorization.startsWith('Bearer ')?authorization.slice(7):'';
  if(!TOKEN.test(token))return reply(401,{error:'unauthorized'},origin);
  let who;
  try{who=await identity.identifyVerifiedPerson({token})}catch{return reply(401,{error:'unauthorized'},origin)}
  if(!who?.userId||!who?.sessionId)return reply(401,{error:'unauthorized'},origin);
  let input;
  try{
   const reader=request.body?.getReader();
   if(!reader)throw Error();
   const decoder=new TextDecoder('utf-8',{fatal:true});
   let bytes=0,text='';
   for(;;){
    const {done,value}=await reader.read();if(done)break;
    bytes+=value.byteLength;
    if(bytes>1800){await reader.cancel();throw Error()}
    text+=decoder.decode(value,{stream:true});
   }
   text+=decoder.decode();
   input=JSON.parse(text);
   if(!input||typeof input!=='object'||Array.isArray(input)||
    Object.keys(input).some(key=>!['mode','request','width','height'].includes(key))||
    input.mode!=='draw'||typeof input.request!=='string'||!input.request.trim()||input.request.length>500||
    !Number.isInteger(input.width)||input.width<100||input.width>2000||
    !Number.isInteger(input.height)||input.height<100||input.height>4000)throw Error();
  }catch{return reply(400,{error:'invalid-paper-request'},origin)}
  const time=Number(now()),slot=Math.floor(time/60000);
  const key=who.userId+'\u0000'+who.sessionId;
  const previous=limit.get(key);
  if(previous?.slot===slot&&previous.count>=3)return reply(429,{error:'rate-limit'},origin);
  limit.set(key,{slot,count:previous?.slot===slot?previous.count+1:1});
  if(limit.size>3000)for(const [id,item] of limit)if(item.slot<slot-2)limit.delete(id);
  try{
   // Never supply identity, token, device logs or the author's handwriting to the model.
   const raw=await generateSketchJson({mode:'draw',request:input.request.trim(),width:input.width,height:input.height,
    signal:AbortSignal.timeout(65000)});
   const after=await identity.identifyVerifiedPerson({token});
   if(!SAME(who,after))return reply(401,{error:'unauthorized'},origin);
   const verified=validatePaperSketchDraft(raw,{width:input.width,height:input.height});
   return reply(200,verified,origin);
  }catch{return reply(503,{error:'paper-model-unavailable'},origin)}
 };
}
