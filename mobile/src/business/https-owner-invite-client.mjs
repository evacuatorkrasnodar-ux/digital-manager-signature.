/**
 * SEYVEO Business — HTTPS-only native invite issuer and revoker adapter.
 *
 * No real identity provider, director account, trusted backend, or real
 * mobile transport is configured here. Never point this at the loopback
 * Secure Documents training server, even through a reverse proxy.
 *
 * The server MUST authenticate the bearer, require ACTIVE membership with
 * owner role for the requested organization and recheck inside mutations.
 * Client-side owner navigation is only UX, never an authorization decision.
 */
import {prepareEmployeeInviteDelivery} from './employee-invite-delivery.mjs';
import {createEmployeeQrInviteLink} from '../auth/employee-qr-invite.mjs';

const ORG=/^[A-Za-z0-9_-]{1,96}$/;
const LOGIN=/^[a-z][a-z0-9_-]{2,31}$/;
const TOKEN=/^[A-Za-z0-9._~-]{20,8192}$/;
const SESSION=/^[A-Za-z0-9_-]{1,128}$/;
const INVITE_ID=/^[A-Za-z0-9_-]{1,96}$/;
const MAX_BYTES=8192;

function requireOrigin(value){
  let url;
  try{url=new URL(value);}
  catch{throw new TypeError('Trusted HTTPS API origin required.');}
  if(typeof value!=='string'||!value.startsWith('https://')||
     value.length>512||url.protocol!=='https:'||
     url.username||url.password||url.pathname!=='/'||
     url.search||url.hash||url.hostname==='localhost'||
     !url.hostname.includes('.')||url.hostname.endsWith('.local')||
     (url.href!==value&&url.origin!==value))
    throw new TypeError('Canonical HTTPS API origin required.');
  return url.origin;
}
function validSession(session,organizationId,now){
  return session&&typeof session==='object'&&
    typeof session.token==='string'&&TOKEN.test(session.token)&&
    typeof session.sessionId==='string'&&SESSION.test(session.sessionId)&&
    session.organizationId===organizationId&&
    Number.isSafeInteger(session.expiresAt)&&session.expiresAt>now;
}
function sameSession(a,b,organizationId,now){
  return validSession(b,organizationId,now)&&
    a.token===b.token&&a.sessionId===b.sessionId;
}
const unavailable=()=>({status:'unavailable'});
const statusFromResponse=response=>{
  if(response?.status===401||response?.status===403)return {status:'not-authorized'};
  if(response?.status===409)return {status:'conflict'};
  return unavailable();
};
/**
 * getSession() must use trusted in-memory native session state.
 * It must never read an access token from a textbox, QR code, URL or from
 * developer login data. The server independently verifies bearer and role.
 *
 * All responses (including errors) are deliberately generic: do not reflect
 * tokens, invitation code, API errors or usernames into logs and UI.
 */
export function createHttpsOwnerInviteClient({
  apiOrigin,organizationId,inviteLinkBase,getSession,fetchImpl,now=Date.now
}={}){
  const origin=requireOrigin(apiOrigin);
  if(typeof organizationId!=='string'||!ORG.test(organizationId)||
     typeof getSession!=='function'||typeof fetchImpl!=='function'||
     typeof now!=='function')
    throw new TypeError('Trusted owner invite client dependencies required.');
  // Validate the exact future verified App Link before fetching secrets.
  createEmployeeQrInviteLink({
    inviteLinkBase,invitationCode:'A'.repeat(43)
  });

  const endpoint=origin+'/v1/organizations/'+organizationId+'/invitations';

  async function current(){
    try{
      const session=await getSession();
      return validSession(session,organizationId,now())?session:null;
    }catch{return null;}
  }

  async function create({employeeLogin}={}){
    if(typeof employeeLogin!=='string'||!LOGIN.test(employeeLogin))
      return {status:'invalid-login'};
    const before=await current();
    if(!before)return {status:'not-authorized'};
    try{
      const response=await fetchImpl(endpoint,{
        method:'POST',
        headers:{
          Authorization:'Bearer '+before.token,
          Accept:'application/json',
          'Content-Type':'application/json'
        },
        body:JSON.stringify({employeeLogin}),
        redirect:'manual',credentials:'omit',cache:'no-store',
        referrerPolicy:'no-referrer'
      });
      if(response?.status!==201||response?.type==='opaqueredirect')
        return statusFromResponse(response);
      const mime=response.headers?.get?.('content-type');
      if(typeof mime!=='string'||!/^application\/json(?:;|$)/i.test(mime))
        return unavailable();
      const length=response.headers?.get?.('content-length');
      if(length!==null&&length!==undefined&&
         (!/^\d+$/.test(length)||Number(length)>MAX_BYTES))
        return unavailable();
      const raw=await response.text();
      if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_BYTES)
        return unavailable();
      const payload=JSON.parse(raw);
      if(payload?.invitation?.employeeLogin!==employeeLogin||
         prepareEmployeeInviteDelivery({
           inviteLinkBase,serverResponse:payload,now
         }).status!=='ready')
        return unavailable();
      const after=await current();
      if(!sameSession(before,after,organizationId,now()))
        return {status:'not-authorized'};
      return {status:'issued',serverResponse:payload};
    }catch{return unavailable();}
  }

  async function cancel({invitationId}={}){
    if(typeof invitationId!=='string'||!INVITE_ID.test(invitationId))
      return {status:'invalid-invitation'};
    const before=await current();
    if(!before)return {status:'not-authorized'};
    try{
      const response=await fetchImpl(endpoint+'/'+invitationId,{
        method:'DELETE',
        headers:{
          Authorization:'Bearer '+before.token,
          Accept:'application/json'
        },
        redirect:'manual',credentials:'omit',cache:'no-store',
        referrerPolicy:'no-referrer'
      });
      if(![200,204].includes(response?.status)||
         response?.type==='opaqueredirect')
        return statusFromResponse(response);
      const after=await current();
      return sameSession(before,after,organizationId,now())
        ?{status:'cancelled'}:{status:'not-authorized'};
    }catch{return unavailable();}
  }
  return Object.freeze({create,cancel});
}
