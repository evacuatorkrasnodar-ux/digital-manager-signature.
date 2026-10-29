/**
 * SEYVEO Business — transport-independent document update synchronizer.
 *
 * Prototype protocol adapter for FUTURE native iOS/Android integration.
 * Does not authenticate a user, send push, open a socket, store a token,
 * or provide any production transport/security guarantee.
 *
 * Inject a transport that validates HTTPS, certificate trust and redirects.
 * Identity must come from a trusted login/session component; never from a
 * chat message or URL parameter. Storage holds ONLY non-secret cursors.
 */
const ID=/^[A-Za-z0-9_-]{1,96}$/;
const ACTIONS=new Set(['assigned','status_changed']);
const goodId=s=>typeof s==='string'&&ID.test(s);
const cursorOk=n=>Number.isSafeInteger(n)&&n>=0;

export function createDocumentUpdateSync({
  getIdentity,readCursor,writeCursor,request,onEvent,onAccessLost=()=>{}
}={}){
  for(const f of [getIdentity,readCursor,writeCursor,request,onEvent,onAccessLost])
    if(typeof f!=='function')throw new TypeError('Document sync dependencies are required.');

  let generation=0, inflight=null;
  const sameIdentity=(a,b)=>a&&b&&
    a.userId===b.userId&&a.organizationId===b.organizationId&&
    a.accessToken===b.accessToken;
  const validIdentity=x=>x&&goodId(x.userId)&&goodId(x.organizationId)&&
    typeof x.accessToken==='string'&&x.accessToken.length>=20;

  async function perform(){
    const stamp=generation,identity=await getIdentity();
    if(!validIdentity(identity))return {state:'sign-in-required'};
    const checkpoint={userId:identity.userId,organizationId:identity.organizationId};
    if(stamp!==generation)return {state:'stopped'};
    const recorded=await readCursor(checkpoint);
    let cursor=cursorOk(recorded)?recorded:0;
    if(stamp!==generation)return {state:'stopped'};

    let result;
    try{
      result=await request({
        method:'GET',
        path:'/v1/organizations/'+encodeURIComponent(identity.organizationId)+'/updates?after='+cursor,
        accessToken:identity.accessToken
      });
    }catch{
      return {state:'offline',cursor};
    }
    if(stamp!==generation)return {state:'stopped'};
    const current=await getIdentity();
    if(!sameIdentity(identity,current))return {state:'session-changed'};
    if(result?.status===401||result?.status===403){
      generation++;
      await onAccessLost({userId:identity.userId,organizationId:identity.organizationId,
        reason:'session-not-authorized'});
      return {state:'sign-in-required'};
    }
    if(result?.status!==200)return {state:'retry',cursor};
    const payload=result.body;
    if(!payload||!Array.isArray(payload.events)||payload.events.length>50||
       !cursorOk(payload.nextCursor)||payload.nextCursor<cursor)
      return {state:'protocol-error',cursor};

    let handled=0;
    for(const event of payload.events){
      if(stamp!==generation)return {state:'stopped',cursor};
      if(!sameIdentity(identity,await getIdentity()))return {state:'session-changed',cursor};
      if(!event||!cursorOk(event.cursor)||event.cursor<=cursor||
         event.cursor>payload.nextCursor||!goodId(event.documentId)||
         !ACTIONS.has(event.kind)||typeof event.at!=='string'||
         event.at.length>48||!Number.isFinite(Date.parse(event.at))||
         Object.hasOwn(event,'body')||Object.hasOwn(event,'title'))
        return {state:'protocol-error',cursor};
      try{
        await onEvent({
          cursor:event.cursor,documentId:event.documentId,
          kind:event.kind,at:event.at
        },checkpoint);
        if(stamp!==generation)return {state:'stopped',cursor};
        if(!sameIdentity(identity,await getIdentity()))
          return {state:'session-changed',cursor};
        await writeCursor(checkpoint,event.cursor);
        cursor=event.cursor;
        handled++;
      }catch{
        // Never claim delivery when event handling / checkpoint failed.
        return {state:'retry',cursor,handled};
      }
    }
    if(payload.nextCursor>cursor){
      // Database can advance past events hidden by current access policy.
      if(stamp!==generation)return {state:'stopped',cursor};
      if(!sameIdentity(identity,await getIdentity()))
        return {state:'session-changed',cursor};
      try{
        await writeCursor(checkpoint,payload.nextCursor);
        cursor=payload.nextCursor;
      }catch{return {state:'retry',cursor,handled};}
    }
    return {state:'synced',cursor,handled,hasMore:payload.events.length===50};
  }
  function poll(){
    if(inflight)return inflight;
    const active=perform();
    inflight=active;
    void active.finally(()=>{if(inflight===active)inflight=null;});
    return active;
  }
  function stop(){generation++;}
  return Object.freeze({poll,stop});
}
