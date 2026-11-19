/* SEYVEO Paper · read-only model readiness on the local machine.
 * A configured flag is NOT proof that Ollama or the selected model is ready.
 * Probe only fixed loopback; never download, start a model or send user data.
 */
const ENDPOINT='http://127.0.0.1:11434/api/tags';
const DEFAULT_MODEL='qwen2.5vl:3b';
const MAX_RESPONSE_BYTES=120_000;

export async function inspectLocalPaperModel({
  enabled=process.env.SEYVEO_ENABLE_PAPER_AI==='1',
  model=process.env.SEYVEO_PAPER_MODEL||DEFAULT_MODEL,
  fetcher=fetch
}={}){
 const chosen=typeof model==='string'&&/^[a-zA-Z0-9._:-]{1,64}$/.test(model)
  ?model:DEFAULT_MODEL;
 const base={localOnly:true,configured:enabled===true,model:chosen};
 if(enabled!==true)return {...base,enabled:false,status:'disabled'};
 if(model!==chosen||typeof fetcher!=='function')
  return {...base,enabled:false,status:'invalid-configuration'};
 try{
  const response=await fetcher(ENDPOINT,{
   method:'GET',cache:'no-store',redirect:'error',
   signal:AbortSignal.timeout(1800)
  });
  if(!response?.ok)return {...base,enabled:false,status:'ollama-offline'};
  const declared=response.headers?.get?.('content-length');
  if(declared!==null&&declared!==undefined&&
   (!/^\d+$/.test(declared)||Number(declared)>MAX_RESPONSE_BYTES))
   return {...base,enabled:false,status:'ollama-offline'};
  const text=await response.text();
  if(typeof text!=='string'||text.length>MAX_RESPONSE_BYTES||
    new TextEncoder().encode(text).byteLength>MAX_RESPONSE_BYTES)
   return {...base,enabled:false,status:'ollama-offline'};
  const data=JSON.parse(text);
  if(!Array.isArray(data?.models)||data.models.length>500)
   return {...base,enabled:false,status:'ollama-offline'};
  if(!data.models.some(m=>m?.name===chosen))
   return {...base,enabled:false,status:'model-not-installed'};
  return {...base,enabled:true,status:'ready'};
 }catch{return {...base,enabled:false,status:'ollama-offline'};}
}
