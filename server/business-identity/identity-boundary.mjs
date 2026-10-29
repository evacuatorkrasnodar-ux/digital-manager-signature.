/**
 * SEYVEO identity boundary for a FUTURE native iOS/Android backend.
 *
 * Policy-only: no HTTP listener, account registration, OAuth provider, TLS,
 * database, personal-data reader, email delivery, or production deployment.
 *
 * Every dependency must be supplied by a trusted server implementation.
 * NEVER use client-supplied session claims, user IDs, roles or memberships as
 * substitutes for verifySession(), loadMembership(), or loadDocument().
 * Mutations require re-authorization INSIDE their database transaction.
 */
import {createHash} from 'node:crypto';
import {
  canCreateDocument,canReadDocument,canReadDocumentAudit,canTransitionDocument
} from '../document-authorization.mjs';

const ID=/^[A-Za-z0-9_-]{1,96}$/;
// Accept either a previously verified opaque session token or a compact
// signed JWT access token. A well-formed JWT is NOT trusted on its own:
// verifySession MUST perform cryptographic validation and revocation checks.
const OPAQUE_TOKEN=/^[A-Za-z0-9_-]{40,512}$/;
const SIGNED_JWT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const tokenShaped=value=>typeof value==='string'&&
  (OPAQUE_TOKEN.test(value)||(value.length<=8192&&SIGNED_JWT.test(value)));
const INVITE_CODE=/^[A-Za-z0-9_-]{43}$/;
const ROLES=new Set(['owner','admin','manager','employee']);
const OPERATIONS=new Set([
  'view-workspace','list-members','invite-employee','revoke-employee',
  'create-document','read-document','read-audit','act-on-document'
]);
const validId=value=>typeof value==='string'&&ID.test(value);
const sha256=value=>createHash('sha256').update(value).digest('hex');

/**
 * Inject TRUSTED interfaces:
 * - verifySession(token) -> verified personal identity with audience, expiry,
 *   status, session ID; it MUST verify signature/issuer/device revocation.
 * - loadMembership({organizationId,userId}) -> current DB row.
 * - loadDocument({organizationId,documentId}) -> current tenant DB row.
 * - loadInvitation({codeDigest}) -> invite bound to an existing verified user.
 * - redeemInvitation({invitationId,codeDigest,userId,organizationId,role})
 *   MUST atomically re-check and consume the invitation and add membership.
 *
 * This module checks policy, not the authenticity of those dependencies.
 */
export function createBusinessIdentityBoundary({
  verifySession,loadMembership,loadDocument,loadInvitation,redeemInvitation,
  now=Date.now
}={}){
  if([verifySession,loadMembership,loadDocument,loadInvitation,redeemInvitation,now]
    .some(fn=>typeof fn!=='function'))
    throw new TypeError('Trusted identity boundary dependencies are required.');

  async function verified(token){
    if(!tokenShaped(token))return null;
    try{
      const principal=await verifySession(token);
      if(!principal||!validId(principal.userId)||!validId(principal.sessionId)||
         principal.audience!=='seyveo-native'||principal.subjectType!=='person'||
         principal.revoked!==false||!Number.isSafeInteger(principal.expiresAt)||
         principal.expiresAt<=now())return null;
      // Only these independently verified properties ever leave this helper.
      return {userId:principal.userId,sessionId:principal.sessionId};
    }catch{return null;}
  }
  async function unchanged(token,original){
    const current=await verified(token);
    return !!current&&current.userId===original.userId&&
      current.sessionId===original.sessionId;
  }

  // A company membership is not ownership of an employee's personal account.
  // The only identity allowed for the personal side is the account holder.
  async function canAccessPersonal({token,accountUserId}={}){
    if(!validId(accountUserId))return false;
    const principal=await verified(token);
    return !!principal&&principal.userId===accountUserId&&
      await unchanged(token,principal);
  }

  async function canAccessBusiness({
    token,organizationId,operation,documentId,action
  }={}){
    if(!validId(organizationId)||!OPERATIONS.has(operation))return false;
    const principal=await verified(token);
    if(!principal)return false;
    try{
      const membership=await loadMembership({
        organizationId,userId:principal.userId
      });
      if(!membership||membership.userId!==principal.userId||
         membership.organizationId!==organizationId||
         membership.status!=='active'||!ROLES.has(membership.role))
        return false;
      const context={actor:{userId:principal.userId},membership,organizationId};
      let allow=false;
      switch(operation){
        case 'view-workspace':
          allow=true;break;
        case 'list-members':
        case 'invite-employee':
        case 'revoke-employee':
          allow=membership.role==='owner';break;
        case 'create-document':
          allow=canCreateDocument(context);break;
        case 'read-document':
        case 'read-audit':
        case 'act-on-document':{
          if(!validId(documentId))return false;
          const document=await loadDocument({organizationId,documentId});
          if(!document||document.id!==documentId||
             document.organizationId!==organizationId)return false;
          const details={...context,document};
          if(operation==='read-document')allow=canReadDocument(details);
          if(operation==='read-audit')allow=canReadDocumentAudit(details);
          if(operation==='act-on-document')
            allow=canTransitionDocument({...details,action});
          break;
        }
      }
      // Revocation/logout while waiting on a database lookup invalidates the
      // decision. Callers MUST still repeat this check in an atomic mutation.
      return allow&&await unchanged(token,principal);
    }catch{return false;}
  }

  async function acceptVerifiedInvitation({token,code}={}){
    if(typeof code!=='string'||!INVITE_CODE.test(code))return false;
    const principal=await verified(token);
    if(!principal)return false;
    const codeDigest=sha256(code);
    try{
      const invite=await loadInvitation({codeDigest});
      if(!invite||!validId(invite.id)||!validId(invite.organizationId)||
         invite.userId!==principal.userId||invite.role!=='employee'||
         invite.consumed!==false||!Number.isSafeInteger(invite.expiresAt)||
         invite.expiresAt<=now()||!await unchanged(token,principal))
        return false;
      // The database adapter must lock the invitation row, check unconsumed
      // state, expiry and recipient identity, and commit membership+consume
      // together. A role or organization from an HTTP body is never used.
      const result=await redeemInvitation({
        invitationId:invite.id,codeDigest,userId:principal.userId,
        organizationId:invite.organizationId,role:'employee'
      });
      return result===true;
    }catch{return false;}
  }

  return Object.freeze({
    canAccessPersonal,canAccessBusiness,acceptVerifiedInvitation
  });
}
