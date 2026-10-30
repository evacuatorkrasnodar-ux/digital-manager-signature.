/* Native bridge for the verified llama.rn package.
 * This is not automatically run on app startup.
 * Caller must first validate the exact GGUF file checksum on the device.
 */
import {initLlama} from 'llama.rn';
import {createLlamaRnRuntime} from './llamaRnAdapter.mjs';
import {createLocalInference} from './localInference.mjs';

export function createVerifiedNativeSession(modelPath:string, integrityVerified:boolean){
 if(integrityVerified!==true)throw new Error('model-integrity-unverified');
 if(!modelPath.startsWith('file://')||!modelPath.endsWith('.gguf'))
  throw new Error('verified-local-gguf-required');
 const runtime=createLlamaRnRuntime(initLlama,{contextSize:1024,gpuLayers:0});
 return createLocalInference({runtime,modelPath,integrityVerified:true});
}
