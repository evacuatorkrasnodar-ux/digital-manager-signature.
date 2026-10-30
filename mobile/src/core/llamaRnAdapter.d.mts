export interface NativeRuntime { load(path:string):Promise<void>; complete(prompt:string,options?:{maxTokens?:number}):Promise<string>; unload():Promise<void> }
export function createLlamaRnRuntime(initLlama:Function,options?:{contextSize?:number;gpuLayers?:number}):NativeRuntime;
