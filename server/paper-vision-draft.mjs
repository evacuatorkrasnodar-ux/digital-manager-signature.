/* SEYVEO Paper · opt-in local Ollama draft proposal.
 * Not reachable by the public PWA. A validated draft is NOT an applied edit.
 */
import {paperSketchInstruction,validatePaperSketchDraft} from './paper-sketch-contract.mjs';

const ENDPOINT='http://127.0.0.1:11434/api/chat';
const DEFAULT_MODEL='qwen2.5vl:3b';

export async function proposeLocalPaperDraft(input,{fetcher=fetch,model=process.env.SEYVEO_PAPER_MODEL||DEFAULT_MODEL}={}){
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
 const response=await fetcher(ENDPOINT,{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({model,stream:false,format:'json',keep_alive:'5m',
   options:{temperature:0,num_predict:2500},
   messages:[{role:'user',content:instruction}]}),
  signal:AbortSignal.timeout(65000)
 });
 if(!response?.ok)throw Error('local-paper-model-unavailable');
 const data=await response.json();
 const raw=data?.message?.content;
 if(typeof raw!=='string')throw Error('invalid-model-output');
 const preview=validatePaperSketchDraft(raw,{width,height});
 return Object.freeze({...preview,provider:'local',model,source:'model-proposal'});
}
