/**
 * SEYVEO ONE + Business: one verified person's workspace MANIFEST.
 *
 * Integration contract, NOT a deployed identity service or a source of
 * authorization for individual actions. The trusted server must inject:
 *  - identity.identifyVerifiedPerson(): current verified person/session
 *  - identity.canAccessBusiness(): fresh membership authorization
 *  - listCurrentMemberships(): authoritative DB rows for that person
 *
 * Never use local preview flags, client role claims, QR codes or tariffs to
 * construct a real workspace list. Every business API still authorizes its
 * own operation and tenant independently of this presentation manifest.
 */
const ID=/^[A-Za-z0-9_-]{1,96}$/;
const TOKEN=/^(?:[A-Za-z0-9_-]{40,512}|[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;
const ROLES=new Set(['owner','admin','manager','employee']);
const MAX_MEMBERSHIPS=32;
const headers={
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store, max-age=0',
  'Pragma':'no-cache',
  'Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff',
  'Vary':'Authorization'
};
const response=(status,payload)=>new Response(JSON.stringify(payload),{status,headers});
const validId=value=>typeof value==='string'&&ID.test(value);
const samePerson=(a,b)=>!!a&&!!b&&a.userId===b.userId&&
  a.sessionId===b.sessionId&&validId(a.userId)&&validId(a.sessionId);
const cleanName=value=>typeof value==='string'&&value.trim().length>0&&
  value.trim().length<=80&&!/[\u0000-\u001f\u007f]/.test(value)
    ?value.trim():null;

export function createWorkspaceManifestContract({
  identity,listCurrentMemberships,apiOrigin,now=Date.now
}={}){
  if(typeof identity?.identifyVerifiedPerson!=='function'||
     typeof identity?.canAccessBusiness!=='function'||
     typeof listCurrentMemberships!=='function'||typeof now!=='function')
    throw new TypeError('Trusted workspace identity adapters required.');
  let origin;
  try{
    const u=new URL(apiOrigin);
    if(typeof apiOrigin!=='string'||!apiOrigin.startsWith('https://')||
       u.protocol!=='https:'||u.origin!==apiOrigin||u.username||
       u.password||!u.hostname.includes('.')||u.hostname.endsWith('.local'))
      throw new Error('Invalid origin');
    origin=u.origin;
  }catch{throw new TypeError('A configured exact HTTPS API origin is required.');}

  async function getVerifiedManifest(token){
    // Distinguish no account from an empty list of organizations.
    const principal=await identity.identifyVerifiedPerson({token});
    if(!principal||!validId(principal.userId)||!validId(principal.sessionId))
      return null;
    const rows=await listCurrentMemberships({userId:principal.userId});
    if(!Array.isArray(rows)||rows.length>MAX_MEMBERSHIPS)
      throw new Error('Untrusted workspace list');
    const seen=new Set();
    const workspaces=[];
    for(const row of rows){
      // The member list is read on the server, never from the phone.
      if(!row||row.userId!==principal.userId)
        throw new Error('Membership crossed personal account boundary');
      if(row.status!=='active')continue;
      if(!validId(row.organizationId)||!validId(row.membershipId)||
         !ROLES.has(row.role)||seen.has(row.organizationId))
        throw new Error('Invalid or ambiguous active membership');
      seen.add(row.organizationId);
      if(await identity.canAccessBusiness({
        token,organizationId:row.organizationId,operation:'view-workspace'
      })!==true)continue; // revoked while reading -> do not show
      const label=cleanName(row.organizationName);
      if(!label)throw new Error('Missing authoritative organization name');
      workspaces.push({
        id:row.membershipId,organizationId:row.organizationId,
        name:label,kind:'business',role:row.role,
        navigation:row.role==='employee'?'work':'cabinet'
      });
    }
    // A logout, account switch or token revocation during DB calls
    // invalidates the entire response, including previously read rows.
    const after=await identity.identifyVerifiedPerson({token});
    if(!samePerson(principal,after))return null;
    const issuedAt=now();
    if(!Number.isSafeInteger(issuedAt)||issuedAt<=0)
      throw new Error('Invalid server clock');
    return {
      kind:'verified-workspace-manifest',version:1,
      personal:{id:'personal',kind:'personal'},
      workspaces,
      activeWorkspaceId:null, // a new device starts in private ONE
      issuedAt
    };
  }

  async function handle(request){
    try{
      if(!(request instanceof Request))return response(400,{error:'invalid-request'});
      const url=new URL(request.url);
      if(url.origin!==origin||url.search||url.hash||
         url.username||url.password||request.headers.has('origin'))
        return response(403,{error:'forbidden'});
      if(url.pathname!=='/v1/me/workspaces')
        return response(404,{error:'not-found'});
      if(request.method!=='GET')
        return response(405,{error:'method-not-allowed'});
      const auth=request.headers.get('authorization');
      const token=auth?.startsWith('Bearer ')?auth.slice(7):'';
      if(!TOKEN.test(token)||token.length>8192)
        return response(401,{error:'unauthorized'});
      const manifest=await getVerifiedManifest(token);
      return manifest?response(200,manifest):response(401,{error:'unauthorized'});
    }catch{
      // Never expose member names, tenant IDs, tokens or backend failures.
      return response(503,{error:'unavailable'});
    }
  }
  return Object.freeze({handle,getVerifiedManifest});
}
