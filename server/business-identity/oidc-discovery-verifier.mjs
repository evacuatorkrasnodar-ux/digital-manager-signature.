/**
 * SEYVEO OAuth resource-server OIDC discovery bridge (Node 22+).
 *
 * Consults an EXPLICITLY TRUSTED HTTPS issuer's public OIDC metadata and
 * JWKS, then delegates cryptographic verification to verified-access-token.
 * Not an identity provider, account registration, native sign-in, token
 * exchange, session directory, HTTPS listener or production deployment.
 *
 * Designed for RFC 9068 access JWTs with RS256 and typ=at+jwt. Many OIDC
 * providers require separate setup to issue those rather than opaque access
 * tokens or provider-specific JWTs. ID tokens are NEVER API credentials.
 */
import {createVerifiedJwtAccessSession} from './verified-access-token.mjs';

const MAX_METADATA=16_384;
const MAX_JWKS=32_768;
const MAX_CACHE_MS=300_000;
const ROTATION_THROTTLE_MS=60_000;
const KID=/^[A-Za-z0-9_-]{1,80}$/;
const COMPACT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function pinnedHttps(value,{origin}={}){
  if(typeof value!=='string'||!value.startsWith('https://')||value.length>1024)
    throw new TypeError('Pinned HTTPS issuer and endpoints required.');
  let url;
  try{url=new URL(value);}
  catch{throw new TypeError('Invalid HTTPS endpoint.');}
  if(url.protocol!=='https:'||url.username||url.password||
     url.search||url.hash||url.hostname==='localhost'||
     !url.hostname.includes('.')||url.hostname.endsWith('.local')||
     url.hostname.endsWith('.internal')||
     (url.href!==value&&url.origin!==value)||
     (origin&&url.origin!==origin))
    throw new TypeError('Noncanonical or cross-origin endpoint refused.');
  return url;
}

async function limitedJson(url,limit,fetchImpl){
  // Caller-supplied adapter must use OS/native trustworthy TLS validation
  // and not follow redirects. Do not rely on DNS-based source URLs or
  // untrusted request headers to choose these endpoints.
  const response=await fetchImpl(url,{
    method:'GET',
    headers:{Accept:'application/json'},
    redirect:'manual',
    credentials:'omit',
    cache:'no-store',
    referrerPolicy:'no-referrer',
    signal:AbortSignal.timeout(5000)
  });
  if(response?.status!==200||response?.type==='opaqueredirect')
    throw new Error('OIDC provider unavailable.');
  const type=response.headers?.get?.('content-type');
  if(typeof type!=='string'||!/^application\/json(?:\s*;|$)/i.test(type))
    throw new Error('Provider metadata content type refused.');
  const length=response.headers?.get?.('content-length');
  if(length!==null&&length!==undefined&&
     (!/^\d+$/.test(length)||Number(length)>limit))
    throw new Error('Oversized provider metadata.');
  const stream=response.body;
  if(!stream||typeof stream.getReader!=='function')
    throw new Error('No bounded metadata stream.');
  const reader=stream.getReader();let total=0;
  const bytes=[];
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      if(!(value instanceof Uint8Array))throw new Error('Invalid metadata stream.');
      total+=value.byteLength;
      if(total>limit){
        await reader.cancel().catch(()=>{});
        throw new Error('Oversized provider metadata.');
      }
      bytes.push(value);
    }
  }finally{reader.releaseLock();}
  const full=new Uint8Array(total);let start=0;
  for(const value of bytes){full.set(value,start);start+=value.byteLength;}
  const document=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(full));
  if(!document||typeof document!=='object'||Array.isArray(document))
    throw new Error('Invalid provider JSON.');
  return document;
}

function advertisedKid(token){
  try{
    if(typeof token!=='string'||token.length>8192||!COMPACT.test(token))
      return null;
    const part=token.split('.')[0];
    const data=Buffer.from(part,'base64url');
    if(data.length>1024||data.toString('base64url')!==part)return null;
    const h=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));
    return h?.alg==='RS256'&&['at+jwt','application/at+jwt'].includes(h?.typ)&&
      typeof h.kid==='string'&&KID.test(h.kid)?h.kid:null;
  }catch{return null;}
}

/**
 * Strict trust source is server config, not an unauthenticated JWT header:
 * issuer/audience/clientId and trusted app's person lookup + token
 * revocation MUST be supplied before any request is handled.
 *
 * fetchImpl must implement fetch Response with TLS verification. Successful
 * discovery is cached at most five minutes. After TTL any outage fails
 * closed (no stale keys). Unknown-kid JWKS rotation is throttled.
 */
export function createDiscoveredOidcAccessVerifier({
  issuer,audience,clientId,resolvePerson,isRevoked,
  fetchImpl=fetch,now=Date.now,cacheMs=MAX_CACHE_MS
}={}){
  const trusted=pinnedHttps(issuer);
  if(typeof audience!=='string'||!audience.trim()||
     typeof clientId!=='string'||!clientId.trim()||
     [resolvePerson,isRevoked,fetchImpl,now].some(x=>typeof x!=='function')||
     !Number.isSafeInteger(cacheMs)||cacheMs<10_000||cacheMs>MAX_CACHE_MS)
    throw new TypeError('Trusted OIDC verifier dependencies required.');
  const discoveryUrl=(issuer.endsWith('/')?issuer.slice(0,-1):issuer)+
    '/.well-known/openid-configuration';
  pinnedHttps(discoveryUrl,{origin:trusted.origin});
  let cached=null,inflight=null,lastForcedRefresh=0;

  async function discover(){
    const metadata=await limitedJson(discoveryUrl,MAX_METADATA,fetchImpl);
    if(metadata.issuer!==issuer||
       !Array.isArray(metadata.response_types_supported)||
       !metadata.response_types_supported.includes('code')||
       !Array.isArray(metadata.code_challenge_methods_supported)||
       !metadata.code_challenge_methods_supported.includes('S256'))
      throw new Error('OIDC provider does not match trusted configuration.');
    const authorization=pinnedHttps(metadata.authorization_endpoint,
      {origin:trusted.origin});
    const token=pinnedHttps(metadata.token_endpoint,{origin:trusted.origin});
    const keysUrl=pinnedHttps(metadata.jwks_uri,{origin:trusted.origin});
    if(authorization.pathname==='/'||token.pathname==='/'||
       keysUrl.pathname==='/')throw new Error('Provider endpoints missing.');
    const jwks=await limitedJson(keysUrl.href,MAX_JWKS,fetchImpl);
    if(!Array.isArray(jwks.keys)||jwks.keys.length<1||jwks.keys.length>10)
      throw new Error('Untrusted provider keys.');
    // Every advertised key must satisfy the pre-existing strict RSA
    // signature validator; malformed or private keys fail the whole load.
    const verify=createVerifiedJwtAccessSession({
      issuer,audience,clientId,jwks:jwks.keys,
      resolvePerson,isRevoked,now
    });
    const loaded=now();
    if(!Number.isSafeInteger(loaded)||loaded<0)
      throw new Error('Trusted clock required.');
    return Object.freeze({
      verify,expiresAt:loaded+cacheMs,
      keyIds:Object.freeze(jwks.keys.map(k=>k.kid)),
      metadata:Object.freeze({
        issuer,authorizationEndpoint:authorization.href,
        tokenEndpoint:token.href,jwksUri:keysUrl.href
      })
    });
  }

  async function refresh(){
    if(!inflight){
      inflight=discover().then(value=>{cached=value;return value},
        ()=>{cached=null;return null}).finally(()=>{inflight=null});
    }
    return await inflight;
  }

  async function live(){
    const current=now();
    if(!Number.isSafeInteger(current)||current<0)return null;
    if(cached&&cached.expiresAt>current)return cached;
    return await refresh();
  }
  async function verifySession(jwt){
    const kid=advertisedKid(jwt);
    if(!kid)return null;
    let state=await live();
    if(!state)return null;
    const current=now();
    if(!state.keyIds.includes(kid)&&
       Number.isSafeInteger(current)&&current-lastForcedRefresh>=ROTATION_THROTTLE_MS){
      lastForcedRefresh=current;
      state=await refresh();
      if(!state)return null;
    }
    if(!state.keyIds.includes(kid))return null;
    // Session lookup and per-JTI revocation are always re-checked by
    // verified-access-token, including while public keys are cached.
    return await state.verify(jwt);
  }
  async function getTrustedProviderConfig(){
    const state=await live();
    return state?.metadata??null;
  }
  return Object.freeze({verifySession,getTrustedProviderConfig});
}
