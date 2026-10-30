/* SEYVEO offline inference contract.
 * The native runtime is injected, not silently downloaded or simulated.
 * A successful probe is required before ordinary chat becomes available.
 */
export function createLocalInference({runtime,modelPath,integrityVerified=false}={}){
 if(integrityVerified!==true)throw Error('model-integrity-unverified');
 if(typeof modelPath!=='string'||!modelPath.trim())throw Error('model-path-required');
 if(!runtime||typeof runtime.load!=='function'||typeof runtime.complete!=='function'||typeof runtime.unload!=='function')
  throw Error('native-runtime-required');
 let state='unloaded';
 let busy=false;
 async function unload(){
  if(state!=='unloaded'){
   state='unloaded';
   await runtime.unload();
  }
 }
 return Object.freeze({
  status:()=>state,
  async initialize(){
   if(state!=='unloaded'||busy)throw Error('model-session-already-active');
   busy=true;
   try{
    // The caller must verify downloaded file integrity before this point.
    state='loading';
    await runtime.load(modelPath);
    state='probing';
    const probe=await runtime.complete('Ответь одним словом: готова.',{maxTokens:20});
    if(typeof probe!=='string'||!probe.trim())throw Error('native-probe-failed');
    state='ready';
    return true;
   }catch(e){
    try{await unload()}catch{}
    throw Error('local-model-unavailable');
   }finally{busy=false}
  },
  async reply(prompt){
   if(state!=='ready'||busy)throw Error('local-model-not-ready');
   if(typeof prompt!=='string'||!prompt.trim()||prompt.length>4000)throw Error('invalid-local-prompt');
   busy=true;
   try{
    const output=await runtime.complete(prompt,{maxTokens:400});
    if(typeof output!=='string'||!output.trim())throw Error('native-empty-answer');
    return output.trim();
   }finally{busy=false}
  },
  unload
 });
}
