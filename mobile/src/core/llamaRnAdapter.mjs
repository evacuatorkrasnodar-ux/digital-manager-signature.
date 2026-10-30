/* Adapter for llama.rn. No model downloads and no private-data transfer.
 * Pass initLlama from a separately installed and verified native build.
 */
export function createLlamaRnRuntime(initLlama,{contextSize=1024,gpuLayers=0}={}){
 if(typeof initLlama!=='function')throw Error('native-llama-library-required');
 if(!Number.isInteger(contextSize)||contextSize<512||contextSize>4096)throw Error('invalid-context-size');
 if(!Number.isInteger(gpuLayers)||gpuLayers<0||gpuLayers>99)throw Error('invalid-gpu-layers');
 let context=null;
 return Object.freeze({
  async load(modelPath){
   if(context)throw Error('llama-session-already-loaded');
   if(typeof modelPath!=='string'||!modelPath.endsWith('.gguf'))throw Error('invalid-gguf-path');
   const loaded=await initLlama({model:modelPath,n_ctx:contextSize,n_gpu_layers:gpuLayers});
   if(!loaded||typeof loaded.completion!=='function'||typeof loaded.release!=='function'){
    if(typeof loaded?.release==='function')await loaded.release();
    throw Error('invalid-native-context');
   }
   context=loaded;
  },
  async complete(prompt,{maxTokens=256}={}){
   if(!context)throw Error('llama-not-loaded');
   if(typeof prompt!=='string'||!prompt.trim())throw Error('invalid-prompt');
   const result=await context.completion({
    messages:[
     {role:'system',content:'Ты Сэйви, личный помощник SEYVEO. Отвечай по-русски кратко и понятно. Не выдумывай выполненных действий или свежих данных. Не сохраняй личные сведения самостоятельно.'},
     {role:'user',content:prompt}
    ],
    n_predict:Math.min(512,Math.max(16,maxTokens)),
    temperature:0.5
   });
   return typeof result?.text==='string'?result.text:'';
  },
  async unload(){
   const old=context;context=null;
   if(old)await old.release();
  }
 });
}
