import type {NativeRuntime} from './llamaRnAdapter.mjs';
export interface LocalSession { status():string; initialize():Promise<boolean>; reply(prompt:string):Promise<string>; unload():Promise<void> }
export function createLocalInference(options:{runtime:NativeRuntime;modelPath:string;integrityVerified:boolean}):LocalSession;
