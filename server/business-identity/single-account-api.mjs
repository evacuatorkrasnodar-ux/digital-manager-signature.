/**
 * SEYVEO staging integration boundary: ONE identity -> workspaces -> invitation.
 *
 * This is a COMPOSABLE Fetch Request handler, not a web server, Keycloak
 * installation, account registrar, TLS listener or database implementation.
 * A deployment must wire a real verified identity provider, current session
 * revocation, and transactional organization/recipient adapters.
 *
 * Every request is routed to the existing fail-closed policy contract:
 * no client-selected role, no local demo membership, no second account.
 */
import {createWorkspaceManifestContract} from './workspace-manifest.mjs';
import {createOwnerInvitationHttpContract} from './owner-invitation-http.mjs';
import {createPersonalSessionHttpContract} from './personal-session-http.mjs';
import {createRemotePaperDraftHandler} from '../paper-remote-contract.mjs';

const NOT_FOUND=Object.freeze({
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store, max-age=0',
  'Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff'
});
const INVITATIONS=/^\/v1\/organizations\/[A-Za-z0-9_-]{1,96}\/invitations(?:\/[A-Za-z0-9_-]{1,96})?$/;

export function createSingleAccountApi({
  apiOrigin,identity,listCurrentMemberships,resolveVerifiedRecipient,
  issueInvitationAtomic,revokeInvitationAtomic,now=Date.now,random,makeId,
  paperAI
}={}){
  const spaces=createWorkspaceManifestContract({
    apiOrigin,identity,listCurrentMemberships,now
  });
  const personSession=createPersonalSessionHttpContract({apiOrigin,identity,now});
  const invitations=createOwnerInvitationHttpContract({
    apiOrigin,identity,resolveVerifiedRecipient,
    issueInvitationAtomic,revokeInvitationAtomic,now,
    ...(random?{random}:{}),...(makeId?{makeId}:{})
  });
  // Private opt-in composition only. The deployment must supply a real model
  // adapter and allowed native/web app origins; no model is started here.
  const paper=paperAI===undefined?null:createRemotePaperDraftHandler({
    apiOrigin,appOrigins:paperAI?.appOrigins,identity,
    generateSketchJson:paperAI?.generateSketchJson,now
  });
  async function handle(request){
    // Both handlers enforce their own authorization and origin checks.
    if(!(request instanceof Request))
      return new Response('{"error":"invalid-request"}',{
        status:400,headers:NOT_FOUND
      });
    let url;
    try{url=new URL(request.url);}
    catch{return new Response('{"error":"invalid-request"}',{
      status:400,headers:NOT_FOUND
    });}
    if(url.pathname==='/v1/me/session')return personSession.handle(request);
    if(url.pathname==='/v1/me/workspaces')return spaces.handle(request);
    if(url.pathname==='/v1/paper/draft'&&paper)return paper(request);
    if(url.pathname==='/v1/invitations/accept'||INVITATIONS.test(url.pathname))
      return invitations.handle(request);
    return new Response('{"error":"not-found"}',{
      status:404,headers:NOT_FOUND
    });
  }
  return Object.freeze({handle});
}
