/**
 * SEYVEO native ONE identity -> verified worker workspace bridge.
 *
 * This DOES NOT authenticate through OIDC itself. Feed it a credential
 * vault whose save callback is used ONLY after signature-verified OAuth
 * sign-in. A locally stored token NEVER grants a userId, sessionId, role
 * or organization: every read asks the separately trusted HTTPS API to
 * verify current identity and revocation at GET /v1/me/session.
 *
 * The resulting short-lived identity is consumed by the existing
 * createVerifiedWorkspaceClient, which independently re-checks membership
 * on GET /v1/me/workspaces after every invitation acceptance.
 */
import {createVerifiedWorkspaceClient}
  from '../business/verified-workspace-client.mjs';
const ID=/^[A-Za-z0-9_-]{1,128}$/;
const MAX_BYTES=2048;
const TOKEN=/^(?:[A-Za-z0-9_-]{40,512}|[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;
function exactOrigin(value){
  let u;
  try{u=new URL(value);}catch{throw new TypeError('Pinned HTTPS API required.');}
  if(typeof value!=='string'||value!==u.origin||
     u.protocol!=='https:'||!u.hostname.includes('.')||
     u.hostname==='localhost'||u.hostname.endsWith('.local')||
     u.username||u.password)
    throw new TypeError('Pinned HTTPS API required.');
  return value;
}
function trustedCredential(value,issuer,clientId,now){
  return value&&typeof value==='object'&&
    value.issuer===issuer&&value.clientId===clientId&&
    typeof value.subject==='string'&&value.subject.length>0&&
    typeof value.token==='string'&&value.token.length<=8192&&
    TOKEN.test(value.token)&&Number.isSafeInteger(value.expiresAt)&&
    value.expiresAt>now;
}
const sameCredential=(a,b,issuer,clientId,now)=>
  trustedCredential(a,issuer,clientId,now)&&
  trustedCredential(b,issuer,clientId,now)&&
  a.token===b.token&&a.subject===b.subject&&
  a.expiresAt===b.expiresAt;

export function createVerifiedAccountBridge({
  apiOrigin,issuer,clientId='seyveo-native',
  credentialVault,fetchImpl,now=Date.now
}={}){
  const origin=exactOrigin(apiOrigin);
  if(typeof issuer!=='string'||!issuer.startsWith('https://')||
     !ID.test(clientId)||typeof credentialVault?.getAccessCredential!=='function'||
     typeof fetchImpl!=='function'||typeof now!=='function')
    throw new TypeError('Verified native identity dependencies required.');
  const endpoint=origin+'/v1/me/session';

  async function getPersonalSession(){
    let before;
    try{before=await credentialVault.getAccessCredential();}
    catch{return null;}
    if(!trustedCredential(before,issuer,clientId,now()))return null;
    try{
      const response=await fetchImpl(endpoint,{
        method:'GET',headers:{
          Authorization:'Bearer '+before.token,Accept:'application/json'
        },
        redirect:'manual',credentials:'omit',cache:'no-store',
        referrerPolicy:'no-referrer'
      });
      if(response?.status!==200||response?.type==='opaqueredirect')
        return null;
      const mime=response.headers?.get?.('content-type');
      if(typeof mime!=='string'||!/^application\/json(?:\s*;|$)/i.test(mime))
        return null;
      const length=response.headers?.get?.('content-length');
      if(length!==null&&length!==undefined&&
         (!/^\d+$/.test(length)||Number(length)>MAX_BYTES))
        return null;
      const body=await response.text();
      if(typeof body!=='string'||body.length>MAX_BYTES||
         new TextEncoder().encode(body).length>MAX_BYTES)return null;
      const data=JSON.parse(body);
      if(!data||data.kind!=='verified-person-session'||
         typeof data.userId!=='string'||!ID.test(data.userId)||
         typeof data.sessionId!=='string'||!ID.test(data.sessionId)||
         !Number.isSafeInteger(data.expiresAt)||
         data.expiresAt<=now()||data.expiresAt>now()+60_000)
        return null;
      const after=await credentialVault.getAccessCredential();
      if(!sameCredential(before,after,issuer,clientId,now()))return null;
      const expiresAt=Math.min(after.expiresAt,data.expiresAt);
      if(expiresAt<=now())return null;
      return Object.freeze({
        token:after.token,userId:data.userId,
        sessionId:data.sessionId,expiresAt
      });
    }catch{return null;}
  }

  const workspaces=createVerifiedWorkspaceClient({
    apiOrigin:origin,getPersonalSession,fetchImpl,now
  });
  return Object.freeze({getPersonalSession,workspaces});
}
