/**
 * SEYVEO ONE -> verified company membership, in the SAME native app.
 *
 * Integration-only HTTPS client. Not a login provider or a permission engine.
 * getPersonalSession() MUST read an OIDC-verified, currently valid native
 * session from an approved secure-store/session manager, never local preview
 * flags, a QR, text fields, cookies or the SEYVEO ONE notes database.
 *
 * Server MUST authenticate this account again, re-check active membership
 * in a trusted database and atomically redeem the one-use invitation.
 * No real endpoint/credentials are supplied here. Never call a loopback
 * training backend through a public proxy.
 */
import {deriveWorkspaceNavigation} from './workspace-navigation.mjs';

const ID=/^[A-Za-z0-9_-]{1,128}$/;
const TOKEN=/^(?:[A-Za-z0-9_-]{40,512}|[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;
const CODE=/^[A-Za-z0-9_-]{43}$/;
const MAX_BYTES=16_384;
const PERSONAL=()=>deriveWorkspaceNavigation(null);
const unauthorized=()=>({status:'sign-in-required',navigation:PERSONAL()});
const unavailable=()=>({status:'unavailable',navigation:PERSONAL()});
const isId=x=>typeof x==='string'&&ID.test(x);

function trustedOrigin(value){
  let url;
  try{url=new URL(value);}catch{throw new TypeError('Trusted HTTPS origin required.');}
  if(typeof value!=='string'||value.length>512||
     !value.startsWith('https://')||url.protocol!=='https:'||
     url.username||url.password||url.pathname!=='/'||url.search||
     url.hash||!url.hostname.includes('.')||url.hostname==='localhost'||
     url.hostname.endsWith('.local')||
     (url.href!==value&&url.origin!==value))
    throw new TypeError('Exact approved HTTPS API origin required.');
  return url.origin;
}
function validSession(s,now){
  return !!s&&typeof s==='object'&&
    typeof s.token==='string'&&s.token.length<=8192&&TOKEN.test(s.token)&&
    isId(s.sessionId)&&isId(s.userId)&&
    Number.isSafeInteger(s.expiresAt)&&s.expiresAt>now;
}
const sameSession=(a,b,now)=>validSession(a,now)&&validSession(b,now)&&
  a.token===b.token&&a.sessionId===b.sessionId&&a.userId===b.userId;

function trustedManifest(payload){
  if(!payload||payload.kind!=='verified-workspace-manifest'||
     payload.version!==1||payload.activeWorkspaceId!==null||
     payload.personal?.id!=='personal'||payload.personal?.kind!=='personal'||
     !Number.isSafeInteger(payload.issuedAt)||
     !Array.isArray(payload.workspaces)||payload.workspaces.length>32)
    return false;
  // The existing navigation parser fails closed on malformed workspaces.
  const nav=deriveWorkspaceNavigation(payload);
  return nav.workspaces.length===payload.workspaces.length &&
    (payload.workspaces.length===0||nav.showWorkSwitch===true);
}
async function jsonPayload(response){
  if(!response||response.type==='opaqueredirect')return null;
  const mime=response.headers?.get?.('content-type');
  if(typeof mime!=='string'||!/^application\/json(?:\s*;|$)/i.test(mime))
    return null;
  const declared=response.headers?.get?.('content-length');
  if(declared!==null&&declared!==undefined&&
     (!/^\d+$/.test(declared)||Number(declared)>MAX_BYTES))
    return null;
  const raw=await response.text();
  // Limit output size. The real transport should additionally cap streamed
  // bytes before buffering in its native networking layer.
  if(typeof raw!=='string'||raw.length>MAX_BYTES||
     new TextEncoder().encode(raw).length>MAX_BYTES)return null;
  const value=JSON.parse(raw);
  return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
}

/**
 * load(): never returns a workspace from an expired or changed session.
 * acceptCode(): code is never put in a URL, log, event, cache or local storage.
 * Even 201 from POST is NOT enough to show "joined": a new membership must
 * appear on the fresh, authenticated GET /v1/me/workspaces response.
 */
export function createVerifiedWorkspaceClient({
  apiOrigin,getPersonalSession,fetchImpl,now=Date.now
}={}){
  const origin=trustedOrigin(apiOrigin);
  if([getPersonalSession,fetchImpl,now].some(x=>typeof x!=='function'))
    throw new TypeError('Native secure session and HTTPS adapters required.');
  const endpoint=origin+'/v1/me/workspaces';
  const acceptEndpoint=origin+'/v1/invitations/accept';
  let accepting=false;

  async function current(){
    try{
      const s=await getPersonalSession();
      return validSession(s,now())?s:null;
    }catch{return null;}
  }
  async function invoke(session,method,url,body){
    return fetchImpl(url,{
      method,
      headers:{
        Authorization:'Bearer '+session.token,
        Accept:'application/json',
        ...(body?{'Content-Type':'application/json'}:{})
      },
      ...(body?{body:JSON.stringify(body)}:{}),
      redirect:'manual',credentials:'omit',cache:'no-store',
      referrerPolicy:'no-referrer'
    });
  }
  async function loadFor(session){
    if(!session)return unauthorized();
    try{
      const response=await invoke(session,'GET',endpoint);
      // Session transition takes priority over the network status.
      const after=await current();
      if(!sameSession(session,after,now()))return unauthorized();
      if(response?.status===401||response?.status===403)return unauthorized();
      if(response?.status!==200||response?.type==='opaqueredirect')
        return unavailable();
      const manifest=await jsonPayload(response);
      if(!trustedManifest(manifest))return unavailable();
      const final=await current();
      if(!sameSession(session,final,now()))return unauthorized();
      return {
        status:'ready',manifest,
        navigation:deriveWorkspaceNavigation(manifest)
      };
    }catch{return unavailable();}
  }
  async function load(){
    return loadFor(await current());
  }
  async function acceptCode({code}={}){
    if(typeof code!=='string'||!CODE.test(code))
      return {status:'invalid-code'};
    if(accepting)return {status:'busy'};
    accepting=true;
    try{
      const session=await current();
      if(!session)return unauthorized();
      // Read the baseline before consuming a one-use secret. This lets us
      // distinguish newly authorized spaces from stale or forged UI state.
      const before=await loadFor(session);
      if(before.status!=='ready')return before;
      if(!sameSession(session,await current(),now()))return unauthorized();
      const response=await invoke(session,'POST',acceptEndpoint,{code});
      if(!sameSession(session,await current(),now()))return unauthorized();
      if(response?.status===401||response?.status===403)return unauthorized();
      if(response?.status===409)
        return {status:'invalid-or-expired'};
      if(response?.status!==201||response?.type==='opaqueredirect')
        return unavailable();
      const proof=await jsonPayload(response);
      if(!proof||proof.ok!==true)return unavailable();
      if(!sameSession(session,await current(),now()))return unauthorized();
      const after=await loadFor(session);
      if(after.status!=='ready')return {
        status:after.status==='sign-in-required'
          ?'sign-in-required':'verification-pending',
        navigation:PERSONAL()
      };
      const existing=new Set(before.manifest.workspaces.map(w=>w.organizationId));
      const joined=after.manifest.workspaces.find(w=>!existing.has(w.organizationId));
      if(!joined)return {status:'verification-pending',navigation:after.navigation};
      const navigation=deriveWorkspaceNavigation(after.manifest,joined.id);
      if(navigation.activeWorkspaceId!==joined.id)
        return {status:'verification-pending',navigation:after.navigation};
      return {
        status:'joined',navigation,
        workspace:{id:joined.id,name:joined.name,kind:'business'}
      };
    }catch{return unavailable();}
    finally{accepting=false;}
  }
  return Object.freeze({load,acceptCode});
}
