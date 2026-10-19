/* SEYVEO model adapters · development only.
 * Secrets are server-side environment variables. Never embed in PWA.
 * Requests are single-turn only and never receive local business records.
 */
import {CLOUD_MODELS,MAX_OUTPUT_TOKENS,safeInstruction} from './hybrid-core.mjs';
const CLOUD_TIMEOUT_MS=20000;
const LOCAL_TIMEOUT_MS=120000;
const readText=value=>String(value||'').trim().slice(0,14000);
const configuredLocal=()=>process.env.SEYVEO_ENABLE_LOCAL==='1';
const configuredCloud=()=>process.env.SEYVEO_ENABLE_CLOUD==='1'&&Boolean(process.env.OPENAI_API_KEY);
export function availableModels(){
 return Object.freeze({local:configuredLocal(),cloud:configuredCloud()});
}
export async function askLocal(message,{name='Феликс'}={}){
 if(!configuredLocal())throw Error('local-not-configured');
 // Fixed loopback endpoint: no caller-controlled URL, prevents arbitrary SSRF.
 const model=(process.env.SEYVEO_LOCAL_MODEL||'qwen3:4b-instruct').trim();
 if(!/^[a-zA-Z0-9._:-]{1,64}$/.test(model))throw Error('invalid-local-model');
 const response=await fetch('http://127.0.0.1:11434/api/chat',{
  method:'POST',
  headers:{'content-type':'application/json'},
  body:JSON.stringify({
   model,stream:false,
   messages:[
    {role:'system',content:safeInstruction(name)},
    {role:'user',content:message}
   ],
   options:{num_predict:MAX_OUTPUT_TOKENS}
  }),
  signal:AbortSignal.timeout(LOCAL_TIMEOUT_MS)
 });
 if(!response.ok)throw Error('local-model-error');
 const data=await response.json();
 const text=readText(data?.message?.content);
 if(!text)throw Error('empty-local-response');
 return Object.freeze({text,provider:'local',model});
}
const CLOUD_ALLOWED=new Set(Object.values(CLOUD_MODELS));
export async function askCloud(message,{name='Феликс',model=CLOUD_MODELS.economical}={}){
 if(!configuredCloud())throw Error('cloud-not-configured');
 if(!CLOUD_ALLOWED.has(model))throw Error('model-not-allowed');
 const response=await fetch('https://api.openai.com/v1/responses',{
  method:'POST',
  headers:{
   'authorization':'Bearer '+process.env.OPENAI_API_KEY,
   'content-type':'application/json'
  },
  body:JSON.stringify({
   model,
   max_output_tokens:MAX_OUTPUT_TOKENS,
   store:false,
   input:[
    {role:'system',content:[{type:'input_text',text:safeInstruction(name)}]},
    {role:'user',content:[{type:'input_text',text:message}]}
   ]
  }),
  signal:AbortSignal.timeout(CLOUD_TIMEOUT_MS)
 });
 // Never echo the remote response body: it may contain private metadata.
 if(!response.ok)throw Error('cloud-model-error-'+response.status);
 const data=await response.json();
 const pieces=(Array.isArray(data?.output)?data.output:[])
  .filter(item=>item?.type==='message')
  .flatMap(item=>Array.isArray(item.content)?item.content:[])
  .filter(item=>item?.type==='output_text'&&typeof item.text==='string')
  .map(item=>item.text);
 const text=readText(pieces.join('\n'));
 if(!text)throw Error('empty-cloud-response');
 return Object.freeze({text,provider:'openai',model});
}
