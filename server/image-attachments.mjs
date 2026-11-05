/* SEYVEO local-only image attachments. Memory only, 10-minute lifetime. */
import {randomUUID} from 'node:crypto';
const MAX=8*1024*1024, TTL=10*60*1000;
export function createImageAttachments(){
 const store=new Map();
 const purge=()=>{for(const [id,item] of store)if(Date.now()-item.at>TTL)store.delete(id)};
 async function visionReady(){
  const name=(process.env.SEYVEO_VISION_MODEL||'qwen2.5vl:3b').trim();
  if(!/^[\w.:-]{1,64}$/.test(name))return false;
  try{
   const res=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(2200)});
   if(!res.ok)return false;
   const tags=await res.json();
   return Array.isArray(tags.models)&&tags.models.some(m=>m?.name===name||m?.name===name+':latest');
  }catch{return false}
 }
 async function upload(req){
  purge();
  if(store.size>=12)throw Error('limit');
  if(!await visionReady())throw Error('vision-offline');
  const match=/^multipart\/form-data;\s*boundary=(?:"([^"]{1,120})"|([^;\s]{1,120}))/i.exec(String(req.headers['content-type']||''));
  const boundary=match&&(match[1]||match[2]);
  if(!boundary||!/^[\x21-\x7e]+$/.test(boundary))throw Error('format');
  let size=0;const parts=[];
  for await(const chunk of req){size+=chunk.length;if(size>MAX+16384)throw Error('large');parts.push(chunk)}
  const body=Buffer.concat(parts),prefix=Buffer.from('--'+boundary+'\r\n');
  if(!body.subarray(0,prefix.length).equals(prefix))throw Error('format');
  const start=body.indexOf('\r\n\r\n',prefix.length);
  if(start<0||start>8192)throw Error('format');
  const end=body.indexOf(Buffer.from('\r\n--'+boundary+'--'),start+4);
  if(end<0)throw Error('format');
  const headers=body.toString('latin1',prefix.length,start),image=body.subarray(start+4,end);
  if(!/content-disposition:\s*form-data;\s*name="file"/i.test(headers))throw Error('format');
  if(!image.length||image.length>MAX)throw Error('large');
  const declared=/^content-type:\s*([^\r\n;]+)/im.exec(headers)?.[1]?.toLowerCase();
  const png=image.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg=image[0]===255&&image[1]===216&&image[2]===255;
  const webp=image.toString('ascii',0,4)==='RIFF'&&image.toString('ascii',8,12)==='WEBP';
  const type=png?'image/png':jpeg?'image/jpeg':webp?'image/webp':null;
  if(!type||type!==declared)throw Error('unsupported');
  const id=randomUUID();
  store.set(id,{at:Date.now(),image:image.toString('base64')});
  return {id,type,size:image.length,temporary:true};
 }
 function resolve(ids){
  purge();
  if(!Array.isArray(ids)||ids.length>6)throw Error('invalid');
  const images=[];
  for(const id of ids){
   if(typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))throw Error('invalid');
   const item=store.get(id);
   if(!item)throw Error('expired');
   images.push(item.image);
  }
  return images;
 }
 return {upload,resolve,visionReady};
}
