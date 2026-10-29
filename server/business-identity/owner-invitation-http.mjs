/**
 * SEYVEO Business future HTTPS invitation API POLICY.
 *
 * No network listener, deployed TLS, registration service, customer identity,
 * persistent database or production authorization is supplied here.
 * This module is ONLY for integration into a future trusted server.
 *
 * A QR/link is a bearer INVITE SECRET, never an authentication token.
 * Creation/revocation require independently verified owner authorization,
 * an already verified personal account for the recipient, AND transactional
 * membership/session rechecks by the TRUSTED persistence adapter.
 */
import {randomBytes,randomUUID,createHash} from 'node:crypto';

const ORG=/^[A-Za-z0-9_-]{1,96}$/;
const LOGIN=/^[a-z][a-z0-9_-]{2,31}$/;
const ID=/^[A-Za-z0-9_-]{1,96}$/;
const TOKEN=/^(?:[A-Za-z0-9_-]{40,512}|[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;
const INVITE_LIFETIME_MS=15*60*1000;
const MAX_BODY_BYTES=2048;
const headerJson=Object.freeze({
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store, max-age=0',
  'Pragma':'no-cache',
  'Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff'
});
const result=(status,body)=>new Response(JSON.stringify(body),{
  status,headers:headerJson
});
const forbidden=()=>result(403,{error:'not-authorized'});
const conflict=()=>result(409,{error:'unavailable'});
const invalid=()=>result(400,{error:'invalid-request'});
const methodNotAllowed=()=>result(405,{error:'method-not-allowed'});
const validId=value=>typeof value==='string'&&ID.test(value);

/** Reads a Request body with a strict limit *during* streaming, not after. */
async function boundedBody(request,field='employeeLogin',pattern=LOGIN){
  const stream=request.body;
  if(!stream)return null;
  const reader=stream.getReader();
  const chunks=[];let total=0;
  try{
    for(;;){
      const part=await reader.read();
      if(part.done)break;
      total+=part.value.byteLength;
      if(total>MAX_BODY_BYTES)throw new Error('Oversized JSON');
      chunks.push(part.value);
    }
  }finally{reader.releaseLock();}
  const bytes=new Uint8Array(total);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  const source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  const data=JSON.parse(source);
  if(!data||typeof data!=='object'||Array.isArray(data)||
     Object.keys(data).length!==1||!Object.hasOwn(data,field)||
     typeof data[field]!=='string'||!pattern.test(data[field]))
    return null;
  return data;
}
/**
 * Dependencies must be backed by a real verified identity provider and DB:
 * identity.canAccessBusiness({token,organizationId,operation}) -> boolean
 * resolveVerifiedRecipient({employeeLogin}) -> {userId,verified:true,active:true}
 * issueInvitationAtomic({...,assertOwnerActive}) -> true only if created
 * revokeInvitationAtomic({...,assertOwnerActive}) -> true only if removed
 *
 * Atomic adapters MUST invoke assertOwnerActive while holding the same DB
 * transaction lock as current tenant membership, account-active checks,
 * uniqueness checks, limits and invite mutations. Callbacks are not DB
 * implementations; test fixtures cannot be used as a production store.
 *
 * No owner or employee role is ever taken from the HTTP request or token
 * payload without server-side identity and membership verification.
 */
export function createOwnerInvitationHttpContract({
  identity,resolveVerifiedRecipient,issueInvitationAtomic,
  revokeInvitationAtomic,now=Date.now,random=()=>randomBytes(32),
  makeId=randomUUID,apiOrigin
}={}){
  let origin;
  try{
    const url=new URL(apiOrigin);
    if(typeof apiOrigin!=='string'||!apiOrigin.startsWith('https://')||
       url.protocol!=='https:'||url.origin!==apiOrigin||
       url.username||url.password||url.hostname==='localhost'||
       url.hostname.endsWith('.local')||!url.hostname.includes('.'))
      throw new Error('Bad host');
    origin=url.origin;
  }catch{throw new TypeError('A trusted exact HTTPS API origin is required.');}
  if(typeof identity?.canAccessBusiness!=='function'||
     [resolveVerifiedRecipient,issueInvitationAtomic,
      revokeInvitationAtomic,now,random,makeId]
       .some(fn=>typeof fn!=='function'))
    throw new TypeError('Trusted server invitation dependencies are required.');

  const assertOwnerActive=async(token,organizationId)=>(
    await identity.canAccessBusiness({
      token,organizationId,operation:'invite-employee'
    })===true
  );

  async function handle(request){
    try{
      if(!(request instanceof Request))return invalid();
      const url=new URL(request.url);
      if(url.origin!==origin||url.protocol!=='https:'||url.search||url.hash||
         url.username||url.password||request.headers.has('origin'))
        return forbidden();
      // Person-side acceptance: a scanned code never grants membership until
      // the trusted identity boundary verifies the signed-in recipient and
      // the DB atomically consumes the invitation under that same identity.
      if(url.pathname==='/v1/invitations/accept'){
        if(request.method!=='POST')return methodNotAllowed();
        const mime=request.headers.get('content-type');
        if(!mime||!/^application\/json(?:\s*;|$)/i.test(mime))
          return invalid();
        const length=request.headers.get('content-length');
        if(length!==null&&(!/^\d+$/.test(length)||Number(length)>MAX_BODY_BYTES))
          return invalid();
        const auth=request.headers.get('authorization');
        const token=typeof auth==='string'&&auth.startsWith('Bearer ')?auth.slice(7):'';
        if(token.length>8192||!TOKEN.test(token))return forbidden();
        if(typeof identity.acceptVerifiedInvitation!=='function')
          return result(503,{error:'unavailable'});
        const data=await boundedBody(request,'code',/^[A-Za-z0-9_-]{43}$/);
        if(!data)return invalid();
        const accepted=await identity.acceptVerifiedInvitation({token,code:data.code});
        return accepted===true?result(201,{ok:true}):conflict();
      }
      const match=/^\/v1\/organizations\/([A-Za-z0-9_-]{1,96})\/invitations(?:\/([A-Za-z0-9_-]{1,96}))?$/.exec(url.pathname);
      if(!match)return result(404,{error:'not-found'});
      const [,organizationId,invitationId]=match;
      if(!ORG.test(organizationId))return invalid();
      const auth=request.headers.get('authorization');
      const token=typeof auth==='string'&&auth.startsWith('Bearer ')?auth.slice(7):'';
      if(token.length>8192||!TOKEN.test(token))return forbidden();
      if(!(await assertOwnerActive(token,organizationId)))return forbidden();
      if(!invitationId&&request.method==='POST'){
        const mime=request.headers.get('content-type');
        if(!mime||!/^application\/json(?:\s*;|$)/i.test(mime))
          return invalid();
        const length=request.headers.get('content-length');
        if(length!==null&&(!/^\d+$/.test(length)||Number(length)>MAX_BODY_BYTES))
          return invalid();
        const data=await boundedBody(request);
        if(!data)return invalid();
        const recipient=await resolveVerifiedRecipient({
          employeeLogin:data.employeeLogin
        });
        if(!recipient||recipient.verified!==true||
           recipient.active!==true||!validId(recipient.userId))
          return conflict();
        if(!(await assertOwnerActive(token,organizationId)))return forbidden();
        const secret=await random();
        if(!(secret instanceof Uint8Array)||secret.byteLength!==32)
          return result(503,{error:'unavailable'});
        const code=Buffer.from(secret).toString('base64url');
        const id=await makeId();
        const time=now();
        if(!validId(id)||!Number.isSafeInteger(time))
          return result(503,{error:'unavailable'});
        const expiresAt=time+INVITE_LIFETIME_MS;
        // Storage must atomically check the verified recipient identity,
        // owner membership/session, duplicate invites, expiry and quota.
        // No secret, only SHA256 digest, belongs in persistent storage.
        const created=await issueInvitationAtomic({
          invitationId:id,codeDigest:createHash('sha256').update(code).digest('hex'),
          organizationId,employeeLogin:data.employeeLogin,
          recipientUserId:recipient.userId,role:'employee',
          issuedAt:time,expiresAt,
          assertOwnerActive:()=>assertOwnerActive(token,organizationId)
        });
        if(created!==true)return conflict();
        // Recheck principal after DB await before releasing bearer secret.
        if(!(await assertOwnerActive(token,organizationId)))return forbidden();
        return result(201,{
          code,invitation:{
            id,employeeLogin:data.employeeLogin,
            expiresAt:new Date(expiresAt).toISOString()
          }
        });
      }
      if(invitationId&&request.method==='DELETE'){
        const revoked=await revokeInvitationAtomic({
          organizationId,invitationId,
          assertOwnerActive:()=>assertOwnerActive(token,organizationId)
        });
        if(revoked!==true)return conflict();
        if(!(await assertOwnerActive(token,organizationId)))return forbidden();
        return result(200,{ok:true});
      }
      return methodNotAllowed();
    }catch{
      // Generic error: never reveal secrets, accounts, tenants, DB reasons.
      return result(503,{error:'unavailable'});
    }
  }
  return Object.freeze({handle});
}
