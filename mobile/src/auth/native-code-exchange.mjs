/**
 * SEYVEO native OAuth code exchange — dependency-injected SECURITY CONTRACT.
 *
 * NO real OAuth provider, system browser, HTTPS transport attestation, JOSE
 * verifier, secure-store adapter, or customer login is configured here.
 *
 * Call ONLY after native-pkce-core.mjs returns "exchange-required".
 * A trusted OIDC verifier must verify the ID token's signature / kid / issuer /
 * audience / expiry; this module additionally checks the verified nonce.
 * Never store tokens until that proof has passed.
 */
const ID=/^[A-Za-z0-9._~-]{3,128}$/;
const PKCE=/^[A-Za-z0-9_-]{43,128}$/;
const PRINTABLE=/^[\x21-\x7e]{8,2048}$/;
const TOKEN=/^[\x21-\x7e]{16,8192}$/;
const MAX_RESPONSE_BYTES=24_576;

function trustedUrl(value){
  if(typeof value!=='string'||value.length>1024||!value.startsWith('https://'))
    throw new TypeError('Trusted HTTPS OAuth configuration required.');
  let url;
  try{url=new URL(value);}
  catch{throw new TypeError('Trusted HTTPS OAuth configuration required.');}
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||
     !url.hostname.includes('.')||url.hostname==='localhost'||
     url.hostname.endsWith('.local')||
     (url.href!==value&&url.origin!==value))
    throw new TypeError('Canonical HTTPS OAuth configuration required.');
  return url;
}
const validToken=value=>typeof value==='string'&&TOKEN.test(value);
const validText=value=>typeof value==='string'&&
  value.length>0&&value.length<=256&&!/[\x00-\x1f\x7f]/.test(value);
const validTime=value=>Number.isSafeInteger(value)&&value>0;

/**
 * - fetchImpl MUST be backed by a native TLS-validating HTTP implementation
 *   that honors redirect:'manual', never forwards credentials on redirects,
 *   and never logs OAuth bodies.
 * - verifyIdToken MUST independently verify JOSE signature, trusted issuer,
 *   registered audience, expiration and nonce using provider-approved keys.
 *   Its returned claims MUST be signature-verified, not just parsed.
 * - saveVerifiedSession MUST be implemented with platform-secure storage,
 *   never AsyncStorage, logs or the SEYVEO One personal SQLCipher database.
 *
 * This instance performs ONE exchange at most, including failed attempts.
 * Reauthenticate rather than retrying a possibly consumed authorization code.
 */
export function createNativeCodeExchange({
  issuer,tokenEndpoint,redirectUri,clientId,
  fetchImpl,verifyIdToken,saveVerifiedSession,now=Date.now
}={}){
  const iss=trustedUrl(issuer);
  const endpoint=trustedUrl(tokenEndpoint);
  const redirect=trustedUrl(redirectUri);
  if(iss.origin!==endpoint.origin||endpoint.pathname==='/'||
     redirect.pathname==='/'||typeof clientId!=='string'||
     !ID.test(clientId)||[fetchImpl,verifyIdToken,saveVerifiedSession,now]
      .some(fn=>typeof fn!=='function'))
    throw new TypeError('Trusted native token exchange dependencies required.');
  let used=false;

  async function redeem(grant){
    if(used)return {status:'used'};
    if(!grant||grant.status!=='exchange-required'||
       grant.issuer!==issuer||grant.clientId!==clientId||
       grant.redirectUri!==redirectUri||
       typeof grant.authorizationCode!=='string'||
       !PRINTABLE.test(grant.authorizationCode)||
       typeof grant.codeVerifier!=='string'||!PKCE.test(grant.codeVerifier)||
       typeof grant.nonce!=='string'||!PKCE.test(grant.nonce))
      return {status:'rejected'};
    used=true;
    try{
      const body=new URLSearchParams({
        grant_type:'authorization_code',
        code:grant.authorizationCode,
        redirect_uri:redirectUri,
        client_id:clientId,
        code_verifier:grant.codeVerifier
      }).toString();
      const response=await fetchImpl(tokenEndpoint,{
        method:'POST',
        headers:{
          'Content-Type':'application/x-www-form-urlencoded',
          'Accept':'application/json'
        },
        body,
        redirect:'manual',
        credentials:'omit',
        cache:'no-store',
        referrerPolicy:'no-referrer'
      });
      if(!response||response.status!==200||response.type==='opaqueredirect')
        return {status:'unavailable'};
      const type=response.headers?.get?.('content-type');
      if(typeof type!=='string'||!/^application\/json(?:\s*;|$)/i.test(type))
        return {status:'unavailable'};
      const length=response.headers?.get?.('content-length');
      if(length!==null&&length!==undefined&&
         (!/^\d+$/.test(length)||Number(length)>MAX_RESPONSE_BYTES))
        return {status:'unavailable'};
      const raw=await response.text();
      if(typeof raw!=='string'||
         new TextEncoder().encode(raw).length>MAX_RESPONSE_BYTES)
        return {status:'unavailable'};
      const tokens=JSON.parse(raw);
      if(!tokens||typeof tokens!=='object'||Array.isArray(tokens)||
         !validToken(tokens.access_token)||
         !validToken(tokens.id_token)||
         typeof tokens.token_type!=='string'||
         !/^bearer$/i.test(tokens.token_type)||
         !Number.isSafeInteger(tokens.expires_in)||
         tokens.expires_in<1||tokens.expires_in>3600||
         (tokens.refresh_token!==undefined&&!validToken(tokens.refresh_token)))
        return {status:'verification-failed'};

      // Callback must return VERIFIED claims. Mere base64-decoding the ID token
      // is never enough; the real provider adapter must prove the signature.
      const claims=await verifyIdToken({
        idToken:tokens.id_token,
        expectedIssuer:issuer,
        expectedAudience:clientId,
        expectedNonce:grant.nonce
      });
      const current=Math.floor(now()/1000);
      if(!claims||claims.verified!==true||
         claims.iss!==issuer||claims.aud!==clientId||
         claims.nonce!==grant.nonce||!validText(claims.sub)||
         !validTime(claims.exp)||claims.exp<=current||
         !Number.isSafeInteger(current))
        return {status:'verification-failed'};
      // Only the approved native secure storage adapter receives tokens.
      // This module returns a status, never raw credentials.
      await saveVerifiedSession({
        issuer,subject:claims.sub,clientId,
        accessToken:tokens.access_token,
        idToken:tokens.id_token,
        refreshToken:tokens.refresh_token??null,
        accessTokenExpiresIn:tokens.expires_in,
        idTokenExpiresAt:claims.exp*1000
      });
      return {status:'stored'};
    }catch{
      // Never echo remote OAuth error bodies or access tokens to logs/UI.
      return {status:'unavailable'};
    }
  }
  return Object.freeze({redeem});
}
