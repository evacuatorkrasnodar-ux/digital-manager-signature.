/**
 * SEYVEO Business document events — HTTPS-only transport policy.
 *
 * Experimental shared JavaScript adapter for future native iOS/Android code.
 * Does not establish a server, provision an account, or attest a device.
 * The operating system / native HTTP stack must verify trusted TLS.
 * NEVER configure this against the loopback training HTTP server.
 */
import {createDocumentUpdateSync} from './mobile-sync-core.mjs';

const EVENT_PATH=/^\/v1\/organizations\/[A-Za-z0-9_-]{1,96}\/updates\?after=(?:0|[1-9][0-9]{0,14})$/;
const MAX_EVENT_RESPONSE_CHARS=16_384;
const TOKEN=/^[A-Za-z0-9_-]{20,512}$/;

function trustedOrigin(apiOrigin){
  if(typeof apiOrigin!=='string')throw new TypeError('A trusted HTTPS API origin is required.');
  let url;
  try{url=new URL(apiOrigin);}
  catch{throw new TypeError('A valid HTTPS API origin is required.');}
  // Only a canonical origin. No paths, query strings, fragments or credentials.
  if(url.protocol!=='https:'||url.origin!==apiOrigin||url.username||url.password||
     url.pathname!=='/'||url.search||url.hash)
    throw new TypeError('The API endpoint must be an HTTPS origin without credentials or paths.');
  // Local or numeric hosts are intentionally unsupported: a separate real
  // staging server with a publicly trusted certificate is required.
  const host=url.hostname;
  const labels=host.split('.');
  if(labels.length<2||labels.some(x=>!x||!/^[a-z0-9-]+$/.test(x))||
     labels.every(x=>/^\d+$/.test(x))||
     ['localhost','local','internal','invalid'].includes(labels.at(-1)))
    throw new TypeError('Use a trusted, fully qualified HTTPS API hostname.');
  return url.origin;
}

/**
 * @param {object} config
 * @param {string} config.apiOrigin - approved, exact HTTPS origin
 * @param {Function} config.fetchImpl - platform fetch or isolated mock
 * @returns {Function} an adapter for createDocumentUpdateSync
 */
export function createHttpsDocumentEventRequest({apiOrigin,fetchImpl=globalThis.fetch}={}){
  const origin=trustedOrigin(apiOrigin);
  if(typeof fetchImpl!=='function')throw new TypeError('A secure fetch implementation is required.');

  return async function request({method,path,accessToken}={}){
    if(method!=='GET'||typeof path!=='string'||!EVENT_PATH.test(path)||
       typeof accessToken!=='string'||!TOKEN.test(accessToken))
      throw new TypeError('Invalid document event request.');
    // Never resolve user-provided absolute URLs or redirects, and never send
    // the bearer token to an origin other than the explicitly configured one.
    const url=origin+path;
    let response;
    try{
      response=await fetchImpl(url,{
        method:'GET',
        headers:{'Authorization':'Bearer '+accessToken,'Accept':'application/json'},
        redirect:'manual',
        credentials:'omit',
        cache:'no-store',
        referrerPolicy:'no-referrer'
      });
      if(!response||!Number.isInteger(response.status)||
         response.status<200||response.status>599||
         response.type==='opaqueredirect'||
         (response.status>=300&&response.status<400))
        throw new Error('Invalid response or attempted redirect.');
      // Failed authentication is passed to the synchronizer, which ends its
      // session. Never parse or return an error body that might contain secrets.
      if(response.status!==200)return {status:response.status};
      const type=response.headers?.get?.('content-type');
      if(typeof type!=='string'||!/^application\/json(?:\s*;|\s*$)/i.test(type))
        throw new Error('Unexpected content type.');
      const length=response.headers?.get?.('content-length');
      if(length!==null&&length!==undefined&&
         (!/^\d+$/.test(length)||Number(length)>MAX_EVENT_RESPONSE_CHARS))
        throw new Error('Unexpected response length.');
      const raw=await response.text();
      if(typeof raw!=='string'||raw.length>MAX_EVENT_RESPONSE_CHARS)
        throw new Error('Document event response exceeds the permitted size.');
      return {status:200,body:JSON.parse(raw)};
    }catch{
      // Do not leak a URL, access token or remote error body to app logs.
      throw new Error('SEYVEO document event transport unavailable.');
    }
  };
}

/**
 * Convenience factory tying the existing cursor/identity safety rules to
 * the HTTPS-only adapter. The caller must still supply verified identity,
 * private per-user cursor storage, idempotent event handling and native TLS.
 */
export function createHttpsDocumentUpdateSync({apiOrigin,fetchImpl,
  getIdentity,readCursor,writeCursor,onEvent,onAccessLost}={}){
  const request=createHttpsDocumentEventRequest({apiOrigin,fetchImpl});
  return createDocumentUpdateSync({
    getIdentity,readCursor,writeCursor,onEvent,onAccessLost,request
  });
}
