/**
 * SEYVEO native personal OAuth credential vault -- storage boundary ONLY.
 *
 * A real OIDC verifier must validate the ID token (signature, nonce, issuer,
 * audience, expiry) BEFORE calling saveVerifiedSession. This vault does NOT
 * authenticate users or grant a business/family workspace. Every API call
 * must separately verify the access token and current membership on server.
 *
 * Never replace SecureStore with AsyncStorage, app localStorage, filesystem,
 * PWA demo state, or the personal SQLCipher notes database.
 *
 * Store access/refresh as separate device-only keychain entries. Avoid keeping
 * the verified ID token (already consumed for sign-in) or user profile data.
 * Never return tokens to React components, navigation or loggers.
 */
const PREFIX='seyveo.identity.oauth.v1';
const META=PREFIX+'.commit';
const ACCESS=PREFIX+'.access';
const REFRESH=PREFIX+'.refresh';
const MAX_TOKEN_CHARS=1900; // conservative for older iPhone Keychain limits
const MAX_META_CHARS=1024;
const TOKEN=/^[\x21-\x7e]{16,1900}$/;
const SUBJECT=/^[A-Za-z0-9._:@~-]{1,256}$/;
const ID=/^[A-Za-z0-9._~-]{3,128}$/;
const TRUSTED_URL=/^https:\/\/[^?#]+$/;
const validTime=value=>Number.isSafeInteger(value)&&value>0;
const safeString=value=>typeof value==='string'&&value.length<=MAX_META_CHARS;
const clone=value=>Object.freeze({...value});

function validIssuer(value){
  if(typeof value!=='string'||!TRUSTED_URL.test(value)||value.length>256)
    return false;
  try{
    const u=new URL(value);
    return u.protocol==='https:'&&!u.username&&!u.password&&
      u.hostname.includes('.')&&u.hostname!=='localhost'&&
      !u.hostname.endsWith('.local')&&!u.search&&!u.hash&&
      (u.href===value||u.origin===value);
  }catch{return false;}
}
function validMetadata(m,issuer,clientId,now,allowExpired=false){
  return m&&typeof m==='object'&&!Array.isArray(m)&&
    Object.keys(m).length===6&&m.version===1&&
    m.issuer===issuer&&m.clientId===clientId&&
    SUBJECT.test(m.subject)&&
    validTime(m.accessExpiresAt)&&validTime(m.idTokenExpiresAt)&&
    (allowExpired||(m.accessExpiresAt>now&&m.idTokenExpiresAt>now));
}
/**
 * Inject an actual device-only secure store (Expo adapter), never web storage.
 * The caller MUST keep credentials inside its trusted auth/network layer.
 */
export function createNativeCredentialVault({
  issuer,clientId,secureStore,now=Date.now
}={}){
  if(!validIssuer(issuer)||typeof clientId!=='string'||!ID.test(clientId)||
     !secureStore||
     ['get','set','delete'].some(key=>typeof secureStore[key]!=='function')||
     typeof now!=='function')
    throw new TypeError('Trusted native SecureStore and pinned issuer required.');

  // All save/logout/read operations in one instance are serialized so a
  // delayed token write cannot resurrect a session after logout.
  let tail=Promise.resolve();
  function run(operation){
    const promise=tail.then(operation);
    tail=promise.then(()=>{},()=>{});
    return promise;
  }
  async function erase(){
    // Commit marker FIRST: any partial deletion fails closed on every read.
    await secureStore.delete(META);
    await secureStore.delete(ACCESS);
    await secureStore.delete(REFRESH);
  }
  async function inspect(allowExpired=false){
    const raw=await secureStore.get(META);
    if(raw===null)return null;
    if(!safeString(raw))return null;
    let meta;
    try{meta=JSON.parse(raw);}catch{return null;}
    if(!validMetadata(meta,issuer,clientId,now(),allowExpired))return null;
    return meta;
  }
  async function saveVerifiedSession(input){
    return run(async()=>{
      const time=now();
      if(!validTime(time)||!input||typeof input!=='object'||
         input.issuer!==issuer||input.clientId!==clientId||
         typeof input.subject!=='string'||!SUBJECT.test(input.subject)||
         typeof input.accessToken!=='string'||!TOKEN.test(input.accessToken)||
         input.accessToken.length>MAX_TOKEN_CHARS||
         (input.refreshToken!==null&&input.refreshToken!==undefined&&
          (typeof input.refreshToken!=='string'||!TOKEN.test(input.refreshToken)))||
         !Number.isSafeInteger(input.accessTokenExpiresIn)||
         input.accessTokenExpiresIn<1||input.accessTokenExpiresIn>3600||
         !validTime(input.idTokenExpiresAt)||input.idTokenExpiresAt<=time)
        throw new Error('Native credential storage refused.');
      // Leave some margin for time drift; never extend ID token lifetime.
      const accessExpiresAt=Math.min(
        time+input.accessTokenExpiresIn*1000,input.idTokenExpiresAt
      );
      if(accessExpiresAt<=time+30_000)
        throw new Error('Native credential storage refused.');
      const meta={
        version:1,issuer,clientId,subject:input.subject,
        accessExpiresAt,idTokenExpiresAt:input.idTokenExpiresAt
      };
      const body=JSON.stringify(meta);
      if(body.length>MAX_META_CHARS)
        throw new Error('Native credential storage refused.');
      try{
        // A failed overwrite leaves no valid commit marker. The new commit
        // only appears AFTER both credentials were successfully written.
        await secureStore.delete(META);
        await secureStore.set(ACCESS,input.accessToken);
        if(input.refreshToken){
          await secureStore.set(REFRESH,input.refreshToken);
        }else{
          await secureStore.delete(REFRESH);
        }
        await secureStore.set(META,body);
      }catch{
        try{await erase();}catch{}
        throw new Error('Native credential storage unavailable.');
      }
      // Never leak the secrets or a "business access granted" state.
      return Object.freeze({status:'stored'});
    });
  }
  async function getAccessCredential(){
    return run(async()=>{
      try{
        const meta=await inspect();
        if(!meta)return null;
        const token=await secureStore.get(ACCESS);
        if(typeof token!=='string'||!TOKEN.test(token))return null;
        // A second metadata read prevents reading across a concurrent
        // external logout or another vault instance's account replacement.
        const after=await inspect();
        if(!after||JSON.stringify(after)!==JSON.stringify(meta))return null;
        return clone({
          token,issuer:meta.issuer,clientId:meta.clientId,
          subject:meta.subject,expiresAt:meta.accessExpiresAt
        });
      }catch{return null;}
    });
  }
  async function getRefreshCredential(){
    return run(async()=>{
      try{
        // An expired access/ID token is never an authenticated session.
        // Its opaque refresh credential can still be sent to the REAL OIDC
        // token endpoint, which must validate and rotate it; it never grants
        // a local role or access without a newly verified login.
        const meta=await inspect(true);
        if(!meta)return null;
        const token=await secureStore.get(REFRESH);
        if(typeof token!=='string'||!TOKEN.test(token))return null;
        const after=await inspect(true);
        if(!after||JSON.stringify(after)!==JSON.stringify(meta))return null;
        return clone({
          refreshToken:token,issuer:meta.issuer,
          clientId:meta.clientId,subject:meta.subject
        });
      }catch{return null;}
    });
  }
  async function signOut(){
    return run(async()=>{
      try{await erase();return Object.freeze({status:'signed-out'});}
      catch{throw new Error('Native credential removal failed.');}
    });
  }
  return Object.freeze({
    saveVerifiedSession,getAccessCredential,getRefreshCredential,signOut
  });
}
