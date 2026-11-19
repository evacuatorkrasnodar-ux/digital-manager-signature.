/* SEYVEO Paper · opt-in local Ollama draft proposal.
 * Not reachable by the public PWA. A validated draft is NOT an applied edit.
 */
import {paperSketchInstruction,validatePaperSketchDraft} from './paper-sketch-contract.mjs';

const ENDPOINT='http://127.0.0.1:11434/api/chat';
const DEFAULT_MODEL='qwen2.5vl:3b';
const MAX_MODEL_REPLY_BYTES=420_000;

async function readBoundedOllamaReply(response){
 const size=response.headers?.get?.('content-length');
 if(size!==null&&size!==undefined&&
  (!/^\d+$/.test(size)||Number(size)>MAX_MODEL_REPLY_BYTES))
  throw Error('model-response-too-large');
 if(response.body?.getReader){
  const reader=response.body.getReader();
  const decoder=new TextDecoder('utf-8',{fatal:true});
  let bytes=0,text='';
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   bytes+=value.byteLength;
   if(bytes>MAX_MODEL_REPLY_BYTES){await reader.cancel();throw Error('model-response-too-large')}
   text+=decoder.decode(value,{stream:true});
  }
  text+=decoder.decode();
  return JSON.parse(text);
 }
 // Test adapters may provide the nonstreaming fetch subset. Real Node fetch
 // always uses the bounded streaming path above.
 if(typeof response.text==='function'){
  const raw=await response.text();
  if(new TextEncoder().encode(raw).byteLength>MAX_MODEL_REPLY_BYTES)
   throw Error('model-response-too-large');
  return JSON.parse(raw);
 }
 if(typeof response.json==='function')return response.json();
 throw Error('invalid-model-response');
}

/**
 * Model-provider adapter for the verified HTTPS Paper contract. The model is
 * called with an open-ended description, never with per-object templates.
 * It returns JSON source DATA, not executable code or document mutations.
 */
export async function generateLocalPaperSketchJson(input,{
 fetcher=fetch,model=process.env.SEYVEO_PAPER_MODEL||DEFAULT_MODEL,
 signal
}={}){
 if(process.env.SEYVEO_ENABLE_PAPER_AI!=='1')throw Error('paper-ai-not-configured');
 if(typeof fetcher!=='function')throw Error('invalid-fetcher');
 if(typeof model!=='string'||!/^[a-zA-Z0-9._:-]{1,64}$/.test(model))throw Error('invalid-model');
 if(!input||typeof input!=='object'||Array.isArray(input)||input.mode!=='draw')
  throw Error('unsupported-paper-mode');
 const request=String(input.request||'').trim();
 const instruction=paperSketchInstruction({mode:'draw',request});
 const width=input.width===undefined?840:input.width;
 const height=input.height===undefined?1188:input.height;
 // Validate geometry before spending model time; never let the client pick a URL.
 if(!Number.isInteger(width)||width<100||width>2000||!Number.isInteger(height)||height<100||height>4000)
  throw Error('invalid-paper-size');
 if(signal!==undefined&&(!signal||typeof signal.aborted!=='boolean'||
   typeof signal.addEventListener!=='function'))throw Error('invalid-signal');
 const response=await fetcher(ENDPOINT,{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({model,stream:false,format:'json',keep_alive:'5m',
   options:{temperature:0,num_predict:2500},
   messages:[{role:'user',content:instruction}]}),
  signal:signal??AbortSignal.timeout(65000)
 });
 if(!response?.ok)throw Error('local-paper-model-unavailable');
 const data=await readBoundedOllamaReply(response);
 const raw=data?.message?.content;
 if(typeof raw!=='string'||raw.length>280_000)throw Error('invalid-model-output');
 return raw;
}

export async function proposeLocalPaperDraft(input,options={}){
 const raw=await generateLocalPaperSketchJson(input,options);
 const width=input.width===undefined?840:input.width;
 const height=input.height===undefined?1188:input.height;
 const preview=validatePaperSketchDraft(raw,{width,height});
 const model=options.model??process.env.SEYVEO_PAPER_MODEL??DEFAULT_MODEL;
 return Object.freeze({...preview,provider:'local',model,source:'model-proposal'});
}
