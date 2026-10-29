/**
 * Experimental RFC 9068 JWT access-token validation adapter.
 *
 * Node 22+, offline validation against trusted, explicitly configured
 * public RSA keys. No login, OAuth flow, HTTPS server, token minting,
 * identity storage, key discovery, JWKS retrieval or production guarantee.
 *
 * A future production backend should use a reviewed JOSE/OIDC library,
 * pinned issuer metadata, managed key rotation and a reliable revocation
 * service. In particular, never feed tokens from a client to an unverified
 * identity-boundary callback or trust a role embedded in a JWT.
 */
import {createPublicKey,verify as verifySignature} from 'node:crypto';

const ID=/^[A-Za-z0-9_-]{1,96}$/;
const KID=/^[A-Za-z0-9_-]{1,80}$/;
const COMPACT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const MAX_JWT_CHARS=8192;
const MAX_AGE_SECONDS=3600;
const CLOCK_SKEW_SECONDS=30;
const isId=value=>typeof value==='string'&&ID.test(value);
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
const seconds=value=>Number.isSafeInteger(value)&&value>0;

function decode(part,maxBytes){
  if(typeof part!=='string'||part.length>maxBytes*2)
    throw new Error('Invalid token encoding.');
  const buf=Buffer.from(part,'base64url');
  if(buf.length>maxBytes||part!==buf.toString('base64url'))
    throw new Error('Non-canonical token encoding.');
  return buf;
}
function claimsPart(part,maxBytes){
  const text=new TextDecoder('utf-8',{fatal:true}).decode(decode(part,maxBytes));
  const result=JSON.parse(text);
  if(!object(result))throw new Error('Invalid token object.');
  return result;
}

/**
 * Config must originate in the trusted backend, never a client request.
 *
 * issuer: exact registered HTTPS issuer identifier (not token-discovered)
 * audience: exact resource-server audience
 * clientId: exact authorized native client
 * jwks: static array of trusted RSA PUBLIC verification JWKs
 * resolvePerson({issuer,subject,clientId}) -> {userId,active:true,subjectType:'person'}
 * isRevoked({issuer,subject,jti,userId}) -> false only when known active
 * now: trusted clock in milliseconds
 *
 * RFC 9068 access tokens have typ='at+jwt', not OpenID ID token typ='JWT'.
 * This factory will not accept a token merely because its signature is good.
 */
export function createVerifiedJwtAccessSession({
  issuer,audience,clientId,jwks,resolvePerson,isRevoked,now=Date.now
}={}){
  let source;
  try{source=new URL(issuer);}
  catch{throw new TypeError('An explicitly configured HTTPS issuer is required.');}
  if(source.protocol!=='https:'||source.username||source.password||
     source.search||source.hash||source.href!==issuer||
     typeof audience!=='string'||!audience.trim()||
     typeof clientId!=='string'||!clientId.trim()||
     !Array.isArray(jwks)||jwks.length<1||jwks.length>10||
     typeof resolvePerson!=='function'||typeof isRevoked!=='function'||
     typeof now!=='function')
    throw new TypeError('Trusted access-token verification configuration required.');

  const keys=new Map();
  for(const jwk of jwks){
    if(!object(jwk)||jwk.kty!=='RSA'||!KID.test(jwk.kid||'')||
       jwk.alg!=='RS256'||jwk.use!=='sig'||keys.has(jwk.kid)||
       Object.hasOwn(jwk,'d')||Object.hasOwn(jwk,'p')||
       Object.hasOwn(jwk,'q')||Object.hasOwn(jwk,'dp')||
       Object.hasOwn(jwk,'dq')||Object.hasOwn(jwk,'qi')||
       Object.hasOwn(jwk,'oth')||
       (jwk.key_ops!==undefined&&
        (!Array.isArray(jwk.key_ops)||jwk.key_ops.length!==1||
         jwk.key_ops[0]!=='verify')))
      throw new TypeError('Only unique, approved RSA public verification keys are allowed.');
    let publicKey;
    try{
      publicKey=createPublicKey({key:jwk,format:'jwk'});
      if(publicKey.asymmetricKeyType!=='rsa'||
         (publicKey.asymmetricKeyDetails?.modulusLength??0)<2048)
        throw new Error('Weak RSA key.');
    }catch{
      throw new TypeError('Invalid or weak RSA public key.');
    }
    keys.set(jwk.kid,publicKey);
  }

  return async function verifySession(token){
    try{
      if(typeof token!=='string'||token.length>MAX_JWT_CHARS||
         !COMPACT.test(token))return null;
      const [h,p,s]=token.split('.');
      const header=claimsPart(h,1024);
      // No attacker-controlled JWK, jku, x5u, critical headers, or algorithms.
      if(header.alg!=='RS256'||
         !['at+jwt','application/at+jwt'].includes(header.typ)||
         !KID.test(header.kid||'')||
         Object.keys(header).some(k=>!['alg','typ','kid'].includes(k)))
        return null;
      const publicKey=keys.get(header.kid);
      if(!publicKey)return null;
      const signature=decode(s,1024);
      if(!verifySignature('RSA-SHA256',Buffer.from(h+'.'+p,'ascii'),publicKey,signature))
        return null;
      const claims=claimsPart(p,4096);
      const current=Math.floor(now()/1000);
      if(!Number.isSafeInteger(current)||claims.iss!==issuer||
         claims.client_id!==clientId||!isId(claims.sub)||
         !isId(claims.jti)||!seconds(claims.iat)||
         !seconds(claims.exp)||claims.exp<=current||
         claims.iat>current+CLOCK_SKEW_SECONDS||
         claims.exp<=claims.iat||
         claims.exp-claims.iat>MAX_AGE_SECONDS||
         (claims.nbf!==undefined&&
          (!seconds(claims.nbf)||claims.nbf>current+CLOCK_SKEW_SECONDS)))
        return null;
      const aud=claims.aud;
      if(!(aud===audience||
           (Array.isArray(aud)&&aud.length>0&&aud.length<=8&&
            aud.every(v=>typeof v==='string'&&v.length>0)&&
            new Set(aud).size===aud.length&&aud.includes(audience))))
        return null;
      // Do not use JWT roles or arbitrary subject text to decide identity.
      // Only a current, issuer-scoped, trusted person directory can map it.
      const person=await resolvePerson({
        issuer,subject:claims.sub,clientId
      });
      if(!object(person)||person.active!==true||
         person.subjectType!=='person'||!isId(person.userId))
        return null;
      const revoked=await isRevoked({
        issuer,subject:claims.sub,jti:claims.jti,userId:person.userId
      });
      if(revoked!==false)return null;
      return Object.freeze({
        userId:person.userId,
        sessionId:claims.jti,
        subjectType:'person',
        audience:'seyveo-native',
        revoked:false,
        expiresAt:claims.exp*1000
      });
    }catch{
      // Fail closed; never surface untrusted tokens or issuer error bodies.
      return null;
    }
  };
}
