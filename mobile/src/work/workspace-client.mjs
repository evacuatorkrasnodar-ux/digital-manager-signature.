import {workspaceResponse} from './workspace-response.mjs';

// Network adapter for a future audited HTTPS corporate API.
// This does not create sessions or grant server permissions.
export function createWorkspaceClient({origin,getSession,fetchImpl,now=Date.now}={}){
 const u=new URL(origin);
 if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash||u.hostname==='localhost'||!u.hostname.includes('.'))
  throw new TypeError('HTTPS API origin required');
 if(typeof getSession!=='function'||typeof fetchImpl!=='function')throw new TypeError('Missing dependencies');
 const closed=()=>({status:'unavailable',workspace:null});
 return Object.freeze({refresh:async()=>{
  try{
   const before=await getSession();
   if(!before||typeof before.token!=='string'||before.token.length<20||
     typeof before.sessionId!=='string'||!Number.isSafeInteger(before.expiresAt)||
     before.expiresAt<=now()||!before.userId||!before.organizationId)return closed();
   const response=await fetchImpl(u.origin+'/v1/workspace',{
    method:'GET',headers:{Authorization:'Bearer '+before.token,Accept:'application/json'},
    redirect:'manual',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'
   });
   if(response?.status!==200||response.type==='opaqueredirect')return closed();
   const body=await response.text();
   if(typeof body!=='string'||body.length>4096)return closed();
   const after=await getSession();
   if(!after||after.token!==before.token||after.sessionId!==before.sessionId||after.expiresAt<=now())return closed();
   const workspace=workspaceResponse(JSON.parse(body),before.userId,before.organizationId);
   return workspace?{status:'ready',workspace}:{status:'unavailable',workspace:null};
  }catch{return closed()}
 }});
}
