/**
 * SEYVEO Business: one server-issued invitation -> QR OR native share.
 *
 * Pure presentation adapter. NOT an invitation issuer, authentication system,
 * permission grant, QR encoder or network client. Do not persist or log the
 * invitation code or link; it is a short-lived sensitive bearer secret.
 */
import {createEmployeeQrInviteLink} from '../auth/employee-qr-invite.mjs';

const ID=/^[A-Za-z0-9_-]{1,96}$/;
const CODE=/^[A-Za-z0-9_-]{43}$/;
const MAX_TTL_MS=15*60*1000;
const ISO_UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * Expected response from trusted, owner-authenticated invitation endpoint:
 *   {code, invitation:{id,employeeLogin,expiresAt}}
 *
 * Both UI actions consume the SAME link. No extra issuance or role selection.
 * Server verification of the owner/recipient, invite status and identity is
 * essential and is intentionally outside this presentation-only function.
 */
export function prepareEmployeeInviteDelivery({
  inviteLinkBase,serverResponse,now=Date.now
}={}){
  try{
    if(typeof now!=='function')return {status:'unavailable'};
    const time=now(),entry=serverResponse?.invitation;
    if(!Number.isSafeInteger(time)||!entry||
       typeof entry.id!=='string'||!ID.test(entry.id)||
       typeof entry.employeeLogin!=='string'||!ID.test(entry.employeeLogin)||
       typeof serverResponse.code!=='string'||!CODE.test(serverResponse.code)||
       typeof entry.expiresAt!=='string'||!ISO_UTC.test(entry.expiresAt))
      return {status:'unavailable'};
    const expiry=Date.parse(entry.expiresAt);
    if(!Number.isSafeInteger(expiry)||new Date(expiry).toISOString()!==entry.expiresAt||
       expiry<=time||expiry-time>MAX_TTL_MS)
      return {status:'unavailable'};
    const link=createEmployeeQrInviteLink({
      inviteLinkBase,invitationCode:serverResponse.code
    });
    return Object.freeze({
      status:'ready',url:link,expiresAt:expiry,invitationId:entry.id
    });
  }catch{
    // Never put the secret, API response or arbitrary error messages in UI.
    return {status:'unavailable'};
  }
}
