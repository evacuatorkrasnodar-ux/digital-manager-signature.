import type {PackStorage,InstalledPack} from './expoPackStorage.mjs';
export interface PackManager {list():Promise<InstalledPack[]>;install(pack:InstalledPack):Promise<{status:string;id:string}>;remove(id:string):Promise<{status:string;id:string}>}
export function createOfflinePackManager(options:{storage:PackStorage;platform:'ios'|'android';getFreeBytes:()=>Promise<number>;activeIds?:()=>string[]|Promise<string[]>}):PackManager;
