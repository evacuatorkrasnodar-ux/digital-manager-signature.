/* SEYVEO · iPhone private connector (owner-only development preview).
 * Tailscale Serve (NOT Funnel) terminates HTTPS and adds an identity header.
 * This gateway and the Ollama-enabled main-app server are loopback-only.
 * Not a public multi-user backend; never configure router port forwarding.
 */
import {createServer,request as httpRequest} from 'node:http';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const LOOPBACK='127.0.0.1';
const LOCAL_ORIGIN='http://127.0.0.1:8790';
const MAX_BODY=20480;
const METHODS=Object.freeze({
 GET:new Set(['/','/index.html','/manifest.webmanifest','/api/seyveo-status','/api/seyveo-memory','/api/seyveo-intelligence-catalog']),
 POST:new Set(['/api/seyveo-stream','/api/seyveo-ask','/api/seyveo-memory','/api/seyveo-agent-plan','/api/seyveo-agent-review','/api/seyveo-intelligence-preview'])
});

export function gatewayConfig(env=process.env){
 const host=String(env.SEYVEO_TAILNET_HOST||'').trim().toLowerCase();
 const owner=String(env.SEYVEO_TAILNET_OWNER||'').trim().toLowerCase();
 const port=Number(env.SEYVEO_IPHONE_GATEWAY_PORT||8791);
 if(!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net$/.test(host)||host.length>253)
  throw Error('SEYVEO_TAILNET_HOST must be your exact device.tailnet.ts.net host.');
 if(!owner||owner.length>254||/[\s\r\n]/.test(owner))
  throw Error('Set SEYVEO_TAILNET_OWNER to your Tailscale account login.');
 if(!Number.isInteger(port)||port<1024||port>65535)
  throw Error('Invalid SEYVEO_IPHONE_GATEWAY_PORT.');
 return Object.freeze({host,owner,port,origin:'https://'+host});
}

function pathAllowed(method,path){
 if(method==='GET')
  return METHODS.GET.has(path)||
    (/^\/assets\/[a-zA-Z0-9._/-]+$/.test(path)&&!path.split('/').includes('..'));
 return method==='POST'&&METHODS.POST.has(path);
}

/* A missing Tailscale-User-Login is an immediate denial, including
 * accidentally using public Funnel. Do not trust this header from an
 * internet-facing server or a non-loopback listener. */
export function authorizeGatewayRequest(req,config){
 const remote=req.socket?.remoteAddress;
 if(remote&&!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote))return 403;
 if(req.headers.host!==config.host&&req.headers.host!==config.host+':443')return 403;
 if(String(req.headers['tailscale-user-login']||'').trim().toLowerCase()!==config.owner)return 403;
 if(req.headers.origin&&req.headers.origin!==config.origin)return 403;
 const site=req.headers['sec-fetch-site'];
 if(site&&!['same-origin','none'].includes(site)){
  // Opening a direct link is safe. Cross-site scripts and API calls are not.
  if(!(req.method==='GET'&&req.headers['sec-fetch-mode']==='navigate'&&
       req.headers['sec-fetch-dest']==='document'))return 403;
 }
 return 200;
}
function send(res,status,error){
 if(res.headersSent){res.destroy();return}
 res.writeHead(status,{'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store','x-content-type-options':'nosniff'});
 res.end(JSON.stringify({error}));
}
async function readBody(req){
 const parts=[];let size=0,tooLarge=false;
 for await(const chunk of req){
  size+=chunk.length;
  if(size>MAX_BODY){tooLarge=true;continue}
  parts.push(chunk);
 }
 if(tooLarge)throw Error('body-too-large');
 return Buffer.concat(parts);
}

/* Public-route allowlist prevents access to localhost files or admin ports.
 * Only read-only Home assets and explicit app chat/memory routes are proxied.
 * Upstream Host/Origin are rewritten ONLY after authenticating the caller. */
export function createIphoneGateway({config=gatewayConfig(),upstreamPort=8790}={}){
 if(!Number.isInteger(upstreamPort)||upstreamPort<1024||upstreamPort>65535)
  throw Error('Invalid upstreamPort.');
 const counters=new Map();
 return createServer(async(req,res)=>{
  const auth=authorizeGatewayRequest(req,config);
  if(auth!==200){send(res,auth,'private-access-required');return}
  const path=(req.url||'').split('?')[0];
  if(!pathAllowed(req.method,path)){send(res,404,'not-found');return}
  if(req.method==='POST'&&!/^application\/json(?:\s*;|$)/i.test(String(req.headers['content-type']||''))){
   send(res,415,'json-required');return;
  }
  // The only owner is allowed, but accidental runaway queries are capped.
  const now=Math.floor(Date.now()/60000),entry=counters.get(config.owner);
  if(!entry||entry.minute!==now)counters.set(config.owner,{minute:now,count:1});
  else if(entry.count>=30){send(res,429,'rate-limit');return}
  else entry.count++;
  let body=Buffer.alloc(0);
  if(req.method==='POST'){
   try{body=await readBody(req)}
   catch(error){send(res,error.message==='body-too-large'?413:400,'invalid-body');return}
  }
  const upstream=httpRequest({
   hostname:LOOPBACK,port:upstreamPort,path:req.url,method:req.method,
   headers:{
    host:'127.0.0.1:8790',origin:LOCAL_ORIGIN,'sec-fetch-site':'same-origin',
    ...(req.method==='POST'?{'content-type':'application/json','content-length':body.length}:{})
   },
   timeout:130000
  },upres=>{
   if(res.destroyed){upres.destroy();return}
   const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
   for(const key of ['content-type','content-security-policy','referrer-policy',
                      'x-frame-options','cross-origin-resource-policy','x-accel-buffering'])
    if(upres.headers[key])headers[key]=upres.headers[key];
   res.writeHead(upres.statusCode||502,headers);
   upres.pipe(res);
  });
  upstream.on('timeout',()=>upstream.destroy(Error('timeout')));
  upstream.on('error',()=>{if(!res.headersSent)send(res,502,'local-felix-unavailable');else res.destroy()});
  res.on('close',()=>{if(!res.writableEnded)upstream.destroy()});
  upstream.end(body.length?body:undefined);
 });
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const settings=gatewayConfig();
 const server=createIphoneGateway({config:settings});
 server.requestTimeout=135000;
 server.headersTimeout=10000;
 server.listen(settings.port,LOOPBACK,()=>{
  console.log('SEYVEO iPhone private gateway: '+LOOPBACK+':'+settings.port);
  console.log('Only owner '+settings.owner+' via Tailscale Serve (not Funnel).');
  console.log('No public hosting. Stop with Ctrl+C.');
 });
}