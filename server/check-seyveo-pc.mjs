/* SEYVEO · read-only local PC preflight. No server startup, credentials or cloud calls.
 * We inspect only Node.js and the installed Ollama model registry on 127.0.0.1.
 */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const REQUIRED_MODEL='qwen3:4b-instruct';
export const OLLAMA_LOCAL='http://127.0.0.1:11434/api/tags';

export function installedModelNames(payload){
 if(!payload||typeof payload!=='object'||!Array.isArray(payload.models))return [];
 return payload.models
  .map(entry=>typeof entry?.name==='string'?entry.name.trim():'')
  .filter(name=>name.length>0&&name.length<128)
  .slice(0,30);
}
export function checkModelInventory(names,preferred=REQUIRED_MODEL){
 const found=names.includes(preferred);
 return Object.freeze({ready:found,preferred,installed:[...names]});
}
export async function inspectPc({fetchFn=globalThis.fetch,report=console.log}={}){
 const node=process.versions.node;
 report('SEYVEO | read-only Windows AI readiness check');
 report('Node.js: '+node);
 report('Ollama: checking LOCAL port 127.0.0.1:11434 (no external network).');
 let response;
 try{
  response=await fetchFn(OLLAMA_LOCAL,{
   method:'GET',redirect:'error',signal:AbortSignal.timeout(3500)
  });
 }catch{
  report('Ollama is not responding on localhost. Start Ollama and repeat this check.');
  return {node,ollamaOnline:false,modelReady:false};
 }
 if(!response?.ok){
  report('Ollama responded with an error. Verify that the local Ollama app is running.');
  return {node,ollamaOnline:false,modelReady:false};
 }
 let data;
 try{data=await response.json()}catch{
  report('Ollama returned an unexpected response.');
  return {node,ollamaOnline:false,modelReady:false};
 }
 const inventory=checkModelInventory(installedModelNames(data));
 if(inventory.ready){
  report('Local AI model is available: '+inventory.preferred);
  report('Ready for the NEXT step: privately starting the SEYVEO test server.');
 }else{
  report('Preferred model is not in the local Ollama list: '+inventory.preferred);
  report('Available locally: '+(inventory.installed.join(', ')||'(none)'));
  report('No model was downloaded or changed. We can choose an installed model next.');
 }
 report('Security: the check did NOT open any port, send a prompt, or contact a cloud API.');
 return {node,ollamaOnline:true,modelReady:inventory.ready,modelNames:inventory.installed};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 inspectPc().catch(()=>{
  console.error('Local preflight failed. No changes were made to the computer.');
  process.exitCode=1;
 });
}
