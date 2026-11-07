/**
 * SEYVEO Browser → Sэйви transport for a trusted, authenticated backend.
 * The UI calls this ONLY after a separate document-sharing confirmation.
 * No secrets, server URLs or credentials are bundled with the application.
 */
export const SAYVI_DOCUMENT_ENDPOINT_PATH='/api/browser/document-explain';
const VALID_EXT=new Set(['txt','csv','pdf']);

export function validateSayviDocumentEndpoint(endpoint,{development=false}={}){
  if(typeof endpoint!=='string'||endpoint.length>2048)throw Error('review-endpoint-unavailable');
  let uri;
  try{uri=new URL(endpoint)}catch{throw Error('review-endpoint-unavailable')}
  const devLoopback=development===true&&
    uri.hostname==='127.0.0.1'&&uri.protocol==='http:';
  if(!devLoopback&&uri.protocol!=='https:')throw Error('review-endpoint-unavailable');
  if(uri.pathname!==SAYVI_DOCUMENT_ENDPOINT_PATH||uri.username||uri.password||
     uri.search||uri.hash||uri.hostname==='localhost' ||
     (!devLoopback&&(!uri.hostname.includes('.')||!/^[-a-z0-9.]+$/i.test(uri.hostname))) ||
     (!devLoopback&&uri.port&&uri.port!=='443')) {
    throw Error('review-endpoint-unavailable');
  }
  return uri.href;
}

export function validateSayviExplanationResponse(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||
     typeof raw.summary!=='string'||!raw.summary.trim()||raw.summary.length>1000 ||
     !Array.isArray(raw.keyPoints)||raw.keyPoints.length>5||
     !Array.isArray(raw.cautions)||raw.cautions.length>4||
     raw.keyPoints.some(t=>typeof t!=='string'||t.length>280)||
     raw.cautions.some(t=>typeof t!=='string'||t.length>350)||
     typeof raw.incomplete!=='boolean'||raw.advisory!==true||
     raw.executed!==false)throw Error('review-response-invalid');
  return Object.freeze({
    summary:raw.summary,
    keyPoints:Object.freeze([...raw.keyPoints]),
    cautions:Object.freeze([...raw.cautions]),
    incomplete:raw.incomplete,
    advisory:true,executed:false
  });
}

function validHandoff(doc){
  if(!doc||typeof doc!=='object'||doc.source!=='user-selected-local-document'||
     typeof doc.fileName!=='string'||doc.fileName.length>120||
     typeof doc.excerpt!=='string'||!doc.excerpt.trim()||
     doc.excerpt.length>6000||typeof doc.truncated!=='boolean'){
    throw Error('document-review-not-authorized');
  }
  const ext=doc.fileName.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase();
  if(!VALID_EXT.has(ext))throw Error('document-review-not-authorized');
  return {source:'user-selected-local-document',fileName:doc.fileName,
    excerpt:doc.excerpt,truncated:doc.truncated};
}

/**
 * getAccessToken must be supplied by the authenticated app shell (never
 * a hardcoded string in this file). The token is not persisted here.
 */
export function createSayviDocumentClient({
  endpoint,getAccessToken,fetchImpl=fetch,development=false
}={}){
  const url=validateSayviDocumentEndpoint(endpoint,{development});
  if(typeof getAccessToken!=='function'||typeof fetchImpl!=='function'){
    throw Error('authenticated-document-transport-required');
  }
  return Object.freeze({
    async explain(handoff){
      const doc=validHandoff(handoff);
      const token=await getAccessToken();
      if(typeof token!=='string'||token.length<16||token.length>4096||
         /[\s\r\n]/.test(token))throw Error('document-login-required');
      const response=await fetchImpl(url,{
        method:'POST',redirect:'error',
        headers:{'authorization':'Bearer '+token,'content-type':'application/json'},
        body:JSON.stringify({
          workspace:'browser',purpose:'document-explanation',
          // Only a direct callback from the UI consent action may reach here.
          approved:true,cloudConsent:true,document:doc
        })
      });
      if(!response||!response.ok)throw Error('document-review-unavailable');
      if(response.headers && typeof response.headers.get==='function'){
        const type=response.headers.get('content-type');
        if(type && !/^application\/json(?:;|$)/i.test(type))throw Error('review-response-invalid');
      }
      const raw=await response.json();
      return validateSayviExplanationResponse(raw);
    }
  });
}
