/**
 * SEYVEO native OAuth/OIDC authorization-code + PKCE S256 preflight.
 *
 * Portable state-machine / contract tests only. No external browser,
 * token endpoint, identity provider, credential storage, or actual login.
 *
 * The native integration MUST open the authorize URL with a system
 * authentication browser, use a VERIFIED universal/app link redirect,
 * and exchange the code over trusted HTTPS with the PKCE verifier.
 * Never put a client secret into the app or return tokens in a URL.
 */
const ID=/^[A-Za-z0-9._~-]{3,128}$/;
const STATE=/^[A-Za-z0-9_-]{43}$/;
const CODE=/^[\x21-\x7e]{8,2048}$/;
const TTL_MS=5*60*1000;
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function validHttps(value){
  if(typeof value!=='string'||value.length>1024||
     !value.startsWith('https://'))throw new TypeError('Explicit HTTPS URL required.');
  let url;
  try{url=new URL(value);}
  catch{throw new TypeError('Invalid HTTPS URL.');}
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||
     !url.hostname.includes('.')||url.hostname==='localhost'||
     url.hostname.endsWith('.local')||
     url.href!==value)
    throw new TypeError('Canonical, uncredentialed HTTPS URL required.');
  return url;
}
function base64url(bytes){
  if(!(bytes instanceof Uint8Array)||bytes.length<1)
    throw new TypeError('CSPRNG bytes required.');
  let out='';
  for(let i=0;i<bytes.length;i+=3){
    const x=bytes[i],y=bytes[i+1],z=bytes[i+2];
    out+=ALPHABET[x>>2]+ALPHABET[((x&3)<<4)|((y??0)>>4)];
    if(i+1<bytes.length)
      out+=ALPHABET[((y&15)<<2)|((z??0)>>6)];
    if(i+2<bytes.length)out+=ALPHABET[z&63];
  }
  return out;
}
const asciiBytes=text=>Uint8Array.from(text,ch=>ch.charCodeAt(0));

/**
 * This policy requires an OAuth provider that supports RFC 9207 issuer
 * identification in the authorization response to reduce mix-up attacks.
 * All endpoints must come from a trusted deployment config, not client input.
 */
export function createNativePkceFlow({
  issuer,authorizationEndpoint,redirectUri,clientId,
  randomBytes,sha256,now=Date.now
}={}){
  const iss=validHttps(issuer);
  const authorize=validHttps(authorizationEndpoint);
  const redirect=validHttps(redirectUri);
  if(iss.origin!==authorize.origin||
     typeof clientId!=='string'||!ID.test(clientId)||
     typeof randomBytes!=='function'||typeof sha256!=='function'||
     typeof now!=='function')
    throw new TypeError('Trusted native OAuth configuration is required.');
  // Exact native application-claimed HTTPS callback. No wildcard or query.
  if(redirect.pathname==='/'||authorize.pathname==='/')
    throw new TypeError('Registered authorization and redirect paths required.');
  let generation=0, pending=null;

  async function begin(){
    // Every new attempt cancels the prior one, including pending async RNG.
    const epoch=++generation;
    pending=null;
    let bytes;
    try{bytes=await randomBytes(96);}
    catch{throw new Error('Secure native authorization unavailable.');}
    if(epoch!==generation)return {status:'superseded'};
    if(!(bytes instanceof Uint8Array)||bytes.length!==96)
      throw new Error('Secure native authorization unavailable.');
    const state=base64url(bytes.subarray(0,32));
    const codeVerifier=base64url(bytes.subarray(32,64));
    const nonce=base64url(bytes.subarray(64,96));
    let hash;
    try{hash=await sha256(asciiBytes(codeVerifier));}
    catch{throw new Error('Secure native authorization unavailable.');}
    if(epoch!==generation)return {status:'superseded'};
    if(!(hash instanceof Uint8Array)||hash.length!==32)
      throw new Error('Secure native authorization unavailable.');
    const codeChallenge=base64url(hash);
    const startedAt=now();
    if(!Number.isSafeInteger(startedAt))
      throw new Error('Trusted clock required.');
    // State and verifier stay private until a matching callback is consumed.
    pending={state,codeVerifier,nonce,expiresAt:startedAt+TTL_MS};
    const url=new URL(authorize.href);
    url.searchParams.set('response_type','code');
    url.searchParams.set('client_id',clientId);
    url.searchParams.set('redirect_uri',redirect.href);
    url.searchParams.set('scope','openid');
    url.searchParams.set('state',state);
    url.searchParams.set('nonce',nonce);
    url.searchParams.set('code_challenge',codeChallenge);
    url.searchParams.set('code_challenge_method','S256');
    return {status:'browser-required',authorizationUrl:url.href,
      expiresAt:new Date(pending.expiresAt).toISOString()};
  }

  function acceptCallback(callbackUrl){
    if(!pending)return {status:'no-pending-authentication'};
    const original=pending;
    if(!Number.isSafeInteger(now())||now()>=original.expiresAt){
      pending=null;generation++;return {status:'expired'};
    }
    // Raw prefix plus parsed exact URI avoid URL normalization tricks.
    if(typeof callbackUrl!=='string'||callbackUrl.length>4096||
       !callbackUrl.startsWith(redirect.href+'?'))
      return {status:'rejected'};
    let url;
    try{url=new URL(callbackUrl);}
    catch{return {status:'rejected'};}
    if(url.origin!==redirect.origin||url.pathname!==redirect.pathname||
       url.hash||url.username||url.password)return {status:'rejected'};
    const query=url.searchParams;
    if(query.getAll('state').length!==1||
       query.get('state')!==original.state)
      return {status:'rejected'};
    // Matching state consumes the attempt even when other validation fails.
    pending=null;generation++;
    const allowed=new Set(['state','code','iss','error','error_description']);
    if([...query.keys()].some(k=>!allowed.has(k))||
       query.getAll('iss').length!==1||query.get('iss')!==issuer)
      return {status:'rejected'};
    if(query.has('error')){
      if(query.getAll('error').length!==1||query.has('code'))
        return {status:'rejected'};
      return {status:'authorization-denied'};
    }
    if(query.has('error_description')||
       query.getAll('code').length!==1||
       !CODE.test(query.get('code')||''))
      return {status:'rejected'};
    // This one-use grant must only be handed to trusted native application
    // code. It is not a logged-in user or a validated access/ID token.
    return {
      status:'exchange-required',authorizationCode:query.get('code'),
      codeVerifier:original.codeVerifier,nonce:original.nonce,
      clientId,redirectUri:redirect.href,issuer
    };
  }
  function cancel(){
    generation++;pending=null;
  }
  return Object.freeze({begin,acceptCallback,cancel});
}
