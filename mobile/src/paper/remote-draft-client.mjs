/**
 * SEYVEO Paper — native-only HTTPS preview client (integration, not a deployment).
 *
 * The caller supplies a freshly server-verified native personal session via
 * getPersonalSession(), plus a per-request UI consent dialog. Neither a token
 * nor handwriting or page contents are cached, logged or returned to the UI.
 * A successful result is ONLY an inert, validated draft; applying it to a
 * document requires a separate user confirmation and existing Undo machinery.
 */
const ID=/^[A-Za-z0-9_-]{1,128}$/;
const TOKEN=/^(?:[A-Za-z0-9_-]{40,512}|[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;
const COLOR=/^#[0-9a-f]{6}$/i;
const MAX_RESPONSE_BYTES=280_000;

function pinnedHttpsOrigin(value){
  let url;
  try{url=new URL(value);}catch{throw new TypeError('Pinned HTTPS origin required.');}
  if(typeof value!=='string'||value.length>512||value!==url.origin||
     url.protocol!=='https:'||url.username||url.password||
     !url.hostname.includes('.')||url.hostname==='localhost'||
     url.hostname.endsWith('.local')||/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname))
    throw new TypeError('Exact trusted HTTPS origin required.');
  return value;
}
function sessionValid(s,now){
  return !!s&&typeof s==='object'&&typeof s.token==='string'&&
    s.token.length<=8192&&TOKEN.test(s.token)&&
    typeof s.userId==='string'&&ID.test(s.userId)&&
    typeof s.sessionId==='string'&&ID.test(s.sessionId)&&
    Number.isSafeInteger(s.expiresAt)&&s.expiresAt>now;
}
function unchanged(a,b,now){
  return sessionValid(a,now)&&sessionValid(b,now)&&
    a.token===b.token&&a.userId===b.userId&&
    a.sessionId===b.sessionId&&a.expiresAt===b.expiresAt;
}
function verifyPreview(raw,{width,height}){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||
     raw.kind!=='paper-preview'||raw.requiresConfirmation!==true||
     raw.originalUntouched!==true||!Array.isArray(raw.strokes)||
     raw.strokes.length<1||raw.strokes.length>60||
     Object.keys(raw).some(k=>!['kind','title','strokes','requiresConfirmation','originalUntouched'].includes(k)))
    return null;
  if(typeof raw.title!=='string'||raw.title.length>100||
     /[\u0000-\u001f\u007f<>]/.test(raw.title))return null;
  let count=0;
  const strokes=[];
  for(const s of raw.strokes){
    if(!s||typeof s!=='object'||Array.isArray(s)||s.tool!=='pen'||
       typeof s.color!=='string'||!COLOR.test(s.color)||
       !Number.isFinite(s.width)||s.width<1||s.width>20||
       !Array.isArray(s.points)||s.points.length<2||s.points.length>700||
       Object.keys(s).some(k=>!['tool','color','width','points'].includes(k)))return null;
    count+=s.points.length;
    if(count>5000)return null;
    const points=[];
    for(const p of s.points){
      if(!Array.isArray(p)||p.length!==3||
         !p.every(Number.isFinite)||p[0]<0||p[0]>width||
         p[1]<0||p[1]>height||p[2]<0||p[2]>100)return null;
      points.push(Object.freeze([...p]));
    }
    strokes.push(Object.freeze({tool:'pen',color:s.color.toLowerCase(),
      width:s.width,points:Object.freeze(points)}));
  }
  return Object.freeze({title:raw.title||'Рисунок Сэйви',
    strokes:Object.freeze(strokes),requiresConfirmation:true,
    originalUntouched:true});
}

export function createRemotePaperDraftClient({
  apiOrigin,appOrigin,getPersonalSession,fetchImpl,now=Date.now,
  timeoutMs=68_000
}={}){
  const api=pinnedHttpsOrigin(apiOrigin);
  // Required by the current server contract. On native, Origin is a routing
  // allowlist value, NEVER an authentication proof; verified Bearer is required.
  const app=pinnedHttpsOrigin(appOrigin);
  if(typeof getPersonalSession!=='function'||typeof fetchImpl!=='function'||
     typeof now!=='function'||!Number.isInteger(timeoutMs)||
     timeoutMs<1000||timeoutMs>70_000)
    throw new TypeError('Verified session, transport and timeout required.');
  const endpoint=api+'/v1/paper/draft';
  let busy=false;

  async function current(){
    try{const session=await getPersonalSession();
      return sessionValid(session,now())?session:null;
    }catch{return null;}
  }
  async function requestDraft({request,width,height,confirmTextSend}={}){
    if(typeof request!=='string'||!request.trim()||request.length>500||
       !Number.isInteger(width)||width<100||width>2000||
       !Number.isInteger(height)||height<100||height>4000)
      return {status:'invalid-request'};
    const text=request.trim();
    const body=JSON.stringify({mode:'draw',request:text,width,height});
    // Match the server's streaming request limit, including JSON escaping.
    if(new TextEncoder().encode(body).byteLength>1800)
      return {status:'invalid-request'};
    if(busy)return {status:'busy'};
    if(typeof confirmTextSend!=='function')return {status:'consent-required'};
    busy=true;
    let timeout;
    try{
      // Call the actual UI confirmation for EACH request, never reuse consent.
      let allowed=false;
      try{allowed=(await confirmTextSend(Object.freeze({request:text,
        recipient:api,purpose:'paper-preview'})))===true;}
      catch{return {status:'consent-required'};}
      if(!allowed)return {status:'consent-required'};
      const before=await current();
      if(!before)return {status:'sign-in-required'};
      const controller=new AbortController();
      timeout=setTimeout(()=>controller.abort(),timeoutMs);
      let response;
      try{
        response=await fetchImpl(endpoint,{
          method:'POST',headers:{
            Origin:app,Authorization:'Bearer '+before.token,
            Accept:'application/json','Content-Type':'application/json',
            'x-seyveo-paper-consent':'yes'
          },body,
          redirect:'manual',credentials:'omit',cache:'no-store',
          referrerPolicy:'no-referrer',signal:controller.signal
        });
      }catch{return {status:'unavailable'};}
      const after=await current();
      if(!unchanged(before,after,now()))return {status:'sign-in-required'};
      if(response?.status===401||response?.status===403)
        return {status:'sign-in-required'};
      if(response?.status!==200||response?.type==='opaqueredirect')
        return {status:'unavailable'};
      if(!/^application\/json(?:\s*;|$)/i.test(response.headers?.get?.('content-type')||''))
        return {status:'invalid-preview'};
      const size=response.headers?.get?.('content-length');
      if(size!==null&&size!==undefined&&
         (!/^\d+$/.test(size)||Number(size)>MAX_RESPONSE_BYTES))
        return {status:'invalid-preview'};
      let raw;
      try{
        const body=await response.text();
        if(typeof body!=='string'||body.length>MAX_RESPONSE_BYTES||
           new TextEncoder().encode(body).byteLength>MAX_RESPONSE_BYTES)
          return {status:'invalid-preview'};
        raw=JSON.parse(body);
      }catch{return {status:'invalid-preview'};}
      const final=await current();
      if(!unchanged(before,final,now()))return {status:'sign-in-required'};
      const preview=verifyPreview(raw,{width,height});
      return preview?{status:'ready',preview}:{status:'invalid-preview'};
    }finally{clearTimeout(timeout);busy=false;}
  }
  return Object.freeze({requestDraft});
}
