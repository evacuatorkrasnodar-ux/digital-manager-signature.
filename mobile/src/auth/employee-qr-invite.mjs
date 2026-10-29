/**
 * SEYVEO Business employee invitation QR link contract (NO QR renderer).
 *
 * The source is a backend-issued, short-lived, one-use, recipient-bound
 * invitation secret. A scanned QR never authenticates the person or grants
 * access. The caller must finish personal sign-in, then ask a trusted server
 * to redeem the code for the verified account, inside a DB transaction.
 *
 * URLs and codes must never be written to analytics, logs, crash reports,
 * browser history, or notification text; do not put any personal data inside.
 */
const INVITE_CODE=/^[A-Za-z0-9_-]{43}$/;
const MAX_SCAN_CHARS=2048;
const BASE_SUFFIX='/join/employee/';
const SCHEME='https:';

function canonicalBase(inviteLinkBase){
  if(typeof inviteLinkBase!=='string'||inviteLinkBase.length>1024)
    throw new TypeError('A configured invite link base URL is required.');
  let parsed;
  try{parsed=new URL(inviteLinkBase);}
  catch{throw new TypeError('A configured invite link base URL is required.');}
  // A QR link must point at an exactly registered app-claimed HTTPS host and
  // path. The trust here comes ONLY from deploy-time configuration.
  if(parsed.protocol!==SCHEME||parsed.username||parsed.password||
     parsed.search||parsed.hash||
     !parsed.hostname.includes('.')||
     parsed.hostname==='localhost'||parsed.hostname.endsWith('.local')||
     parsed.port||parsed.pathname!==BASE_SUFFIX||
     parsed.href!==inviteLinkBase)
    throw new TypeError('A canonical app-claimed HTTPS invite URL is required.');
  return parsed;
}

/**
 * Must be called only with a code returned by an authenticated owner-side
 * invitation issuance operation. This function does NOT mint invitations.
 * Output is the URI payload to encode into a QR graphic in a future native UI.
 */
export function createEmployeeQrInviteLink({
  inviteLinkBase,invitationCode
}={}){
  canonicalBase(inviteLinkBase);
  if(typeof invitationCode!=='string'||!INVITE_CODE.test(invitationCode))
    throw new TypeError('A backend-issued invitation code is required.');
  return inviteLinkBase+invitationCode;
}

/**
 * Parse only the exactly registered app link and 256-bit invitation code.
 * Do not trust a scanned host, role, organization ID, username, redirect,
 * fragment, extra query, or parameters as authorization claims.
 */
export function parseEmployeeQrInviteLink({
  inviteLinkBase,scannedValue
}={}){
  const base=canonicalBase(inviteLinkBase).href;
  if(typeof scannedValue!=='string'||scannedValue.length>MAX_SCAN_CHARS||
     !scannedValue.startsWith(base))
    return {status:'invalid-qr'};
  const rawCode=scannedValue.slice(base.length);
  if(!INVITE_CODE.test(rawCode))
    return {status:'invalid-qr'};
  // Restrict raw characters, then prove the parsed URL is canonically
  // equivalent; never normalize paths, percent escapes or lookalike hosts.
  try{
    const parsed=new URL(scannedValue);
    if(parsed.href!==scannedValue||parsed.search||parsed.hash||
       parsed.username||parsed.password||parsed.port||
       parsed.origin!==new URL(base).origin)
      return {status:'invalid-qr'};
  }catch{
    return {status:'invalid-qr'};
  }
  return {status:'invite-present',invitationCode:rawCode};
}
