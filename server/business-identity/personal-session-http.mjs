/**
 * SEYVEO personal identity check for the SAME ONE + Business native account.
 *
 * No account creation, HTTP listener, token issuance, user profile data or
 * server deployment. This handler must be wired to a cryptographically
 * verified AND revocation-checked identity boundary.
 *
 * /v1/me/session returns a 30-second CLIENT RECHECK DEADLINE, not an OAuth
 * token expiration or membership grant. Every business action separately
 * verifies the signed access token and the current organization membership.
 */
const ID=/^[A-Za-z0-9_-]{1,96}$/;
const TOKEN=/^(?:[A-Za-z0-9_-]{40,512}|[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;
const HEADERS=Object.freeze({
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store, max-age=0',
  'Pragma':'no-cache',
  'Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff',
  'Vary':'Authorization'
});
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
const validId=x=>typeof x==='string'&&ID.test(x);
const unchanged=(a,b)=>!!a&&!!b&&
  validId(a.userId)&&validId(a.sessionId)&&
  a.userId===b.userId&&a.sessionId===b.sessionId;

export function createPersonalSessionHttpContract({
  apiOrigin,identity,now=Date.now
}={}){
  if(typeof identity?.identifyVerifiedPerson!=='function'||typeof now!=='function')
    throw new TypeError('Trusted verified personal identity boundary required.');
  let origin;
  try{
    const u=new URL(apiOrigin);
    if(typeof apiOrigin!=='string'||!apiOrigin.startsWith('https://')||
       apiOrigin!==u.origin||u.protocol!=='https:'||u.username||
       u.password||!u.hostname.includes('.')||
       u.hostname==='localhost'||u.hostname.endsWith('.local'))
      throw new Error('Invalid HTTPS origin.');
    origin=u.origin;
  }catch{throw new TypeError('Exact HTTPS server origin required.');}

  async function handle(request){
    try{
      if(!(request instanceof Request))
        return reply(400,{error:'invalid-request'});
      const url=new URL(request.url);
      if(url.origin!==origin||url.search||url.hash||
         url.username||url.password||request.headers.has('origin'))
        return reply(403,{error:'forbidden'});
      if(url.pathname!=='/v1/me/session')
        return reply(404,{error:'not-found'});
      if(request.method!=='GET')
        return reply(405,{error:'method-not-allowed'});
      const auth=request.headers.get('authorization');
      const token=auth?.startsWith('Bearer ')?auth.slice(7):'';
      if(token.length>8192||!TOKEN.test(token))
        return reply(401,{error:'unauthorized'});
      // Never derive userId/sessionId from the HTTP body, unsigned JWT
      // payload, active UI role, QR secret, or the owner's subscription.
      const before=await identity.identifyVerifiedPerson({token});
      if(!before||!validId(before.userId)||!validId(before.sessionId))
        return reply(401,{error:'unauthorized'});
      const after=await identity.identifyVerifiedPerson({token});
      if(!unchanged(before,after))
        return reply(401,{error:'unauthorized'});
      const time=now();
      if(!Number.isSafeInteger(time)||time<=0||
         time>Number.MAX_SAFE_INTEGER-30_000)
        return reply(503,{error:'unavailable'});
      return reply(200,{
        kind:'verified-person-session',
        userId:after.userId,sessionId:after.sessionId,
        // Strictly a time to ask the server again. NOT token expiry.
        expiresAt:time+30_000
      });
    }catch{
      return reply(503,{error:'unavailable'});
    }
  }
  return Object.freeze({handle});
}
