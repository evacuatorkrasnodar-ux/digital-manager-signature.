/**
 * Native system-browser OAuth orchestration, not a login screen.
 *
 * A future real provider must be configured by a trusted deployment and
 * the caller MUST give a cryptographic ID-token verifier + secure store via
 * exchangeGrant. No test account, provider secret, fake login or networking
 * is embedded here. Only the result status is returned to the UI.
 *
 * System browser receives a PKCE authorization URL. The strict native
 * PKCE state machine checks exact redirect, state, issuer and one-use code.
 * This module never returns any authorization code or token to the UI.
 */
const PRIVATE_REDIRECT='com.seyveo.digitalmanager:/oauth2redirect';
const UNAVAILABLE=Object.freeze({status:'unavailable'});
const CANCELLED=Object.freeze({status:'cancelled'});

export function createNativeBrowserLogin({
  flow,redirectUri,redirectMode='private-use',
  openAuthSession,exchangeGrant,platform,
  verifiedHttpsCallbackReady=false
}={}){
  if(!flow||typeof flow.begin!=='function'||
     typeof flow.acceptCallback!=='function'||typeof flow.cancel!=='function'||
     typeof openAuthSession!=='function'||typeof exchangeGrant!=='function'||
     !['ios','android'].includes(platform))
    throw new TypeError('Native system-browser dependencies required.');
  if(redirectMode==='private-use'){
    if(redirectUri!==PRIVATE_REDIRECT)
      throw new TypeError('Exact registered private-use OAuth redirect required.');
  }else if(redirectMode==='claimed-https'){
    // HTTPS callbacks are usable only after *both* native OS app association
    // and a device-level redirect test. JS cannot verify OS association.
    if(verifiedHttpsCallbackReady!==true||
       typeof redirectUri!=='string'||!redirectUri.startsWith('https://'))
      throw new TypeError('Verified OS app links required for HTTPS callback.');
    let url;
    try{url=new URL(redirectUri);}
    catch{throw new TypeError('Invalid app link.');}
    if(url.protocol!=='https:'||!url.hostname.includes('.')||
       url.username||url.password||url.search||url.hash||
       url.pathname==='/'||url.href!==redirectUri)
      throw new TypeError('Untrusted app link.');
  }else{
    throw new TypeError('Native OAuth redirect mode required.');
  }
  let busy=false;
  async function signIn(){
    if(busy)return {status:'busy'};
    busy=true;
    try{
      const started=await flow.begin();
      if(started?.status!=='browser-required')return UNAVAILABLE;
      const res=await openAuthSession(started.authorizationUrl,redirectUri,{
        preferUniversalLinks:redirectMode==='claimed-https',
        preferEphemeralSession:false
      });
      if(res?.type==='cancel'||res?.type==='dismiss'){
        flow.cancel();
        return CANCELLED;
      }
      if(res?.type!=='success'||typeof res.url!=='string'){
        flow.cancel();
        return UNAVAILABLE;
      }
      const callback=flow.acceptCallback(res.url);
      if(callback?.status==='authorization-denied')return {status:'denied'};
      if(callback?.status!=='exchange-required')return UNAVAILABLE;
      // The OAuth grant is only handed to a trusted native verifier/exchange
      // implementation, never sent to a UI, logger, analytics or clipboard.
      const result=await exchangeGrant(callback);
      return result?.status==='stored'
        ?{status:'signed-in'}:UNAVAILABLE;
    }catch{
      return UNAVAILABLE;
    }finally{
      flow.cancel();
      busy=false;
    }
  }
  function cancel(){flow.cancel();}
  return Object.freeze({signIn,cancel});
}
