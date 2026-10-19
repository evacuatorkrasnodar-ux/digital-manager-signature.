/* SEYVEO Intelligence · loopback-only DEV transport.
 * This server is NOT a public backend: no accounts, persistence or HTTPS.
 * Start manually with SEYVEO_DEV_TOKEN (24+ chars).
 * Never expose it to the internet or use the token from a public web page.
 */
import {createServer} from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {respond} from './brain.mjs';
import {planAgentTask} from './agent/planner.mjs';
const hostname='127.0.0.1';
const port=Number(process.env.SEYVEO_DEV_PORT||8787);
const token=process.env.SEYVEO_DEV_TOKEN||'';
if(token.length<24)throw Error('Set a private SEYVEO_DEV_TOKEN (24+ chars) in your server environment.');
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid SEYVEO_DEV_PORT.');
const validToken=value=>{
 const text=typeof value==='string'?value:'';
 const received=text.startsWith('Bearer ')?text.slice(7):'';
 const a=Buffer.from(received),b=Buffer.from(token);
 return a.length===b.length&&timingSafeEqual(a,b);
};
const counts=new Map();
function withinLimit(ip){
 const now=Date.now(),minute=Math.floor(now/60000),entry=counts.get(ip);
 if(!entry||entry.minute!==minute){counts.set(ip,{minute,count:1});return true}
 if(entry.count>=20)return false;
 entry.count++;return true;
}
function reply(res,status,value){
 const body=JSON.stringify(value);
 res.writeHead(status,{
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer'
 });
 res.end(body);
}
function validOrigin(value){
 if(!value)return true; // Scripts/CLI can omit Origin, but still need token.
 try{
  const url=new URL(value);
  return url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)&&
   [String(port)].includes(url.port||'80');
 }catch{return false}
}
async function readJson(req){
 let length=0,data='';
 for await(const chunk of req){
  length+=chunk.length;
  if(length>12288)throw Error('too-large');
  data+=chunk.toString('utf8');
 }
 try{return JSON.parse(data)}catch{throw Error('bad-json')}
}
const app=createServer(async (req,res)=>{
 if(!withinLimit(req.socket.remoteAddress||'local')){
  reply(res,429,{error:'rate-limit'});return;
 }
 if(req.url==='/health'&&req.method==='GET'){
  reply(res,200,{service:'seyveo-intelligence',mode:'local-development',ready:true});return;
 }
 if(!['/v1/brain','/v1/plan'].includes(req.url)||req.method!=='POST'){
  reply(res,404,{error:'not-found'});return;
 }
 if(!validOrigin(req.headers.origin)||req.headers['sec-fetch-site']==='cross-site'){
  reply(res,403,{error:'origin-not-allowed'});return;
 }
 if(!validToken(req.headers.authorization)){
  reply(res,401,{error:'authorization-required'});return;
 }
 if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')){
  reply(res,415,{error:'json-required'});return;
 }
 try{
  const body=await readJson(req);
  if(typeof body!=='object'||body===null||Array.isArray(body))throw Error('bad-json');
  const result=req.url==='/v1/plan'?planAgentTask(body.message):await respond(body);
  reply(res,200,result);
 }catch(error){
  reply(res,error?.message==='too-large'?413:400,{error:'invalid-request'});
 }
});
app.requestTimeout=15000;
app.headersTimeout=12000;
app.listen(port,hostname,()=>{
 console.log('SEYVEO Intelligence DEV at http://'+hostname+':'+port+' (private loopback only)');
});
