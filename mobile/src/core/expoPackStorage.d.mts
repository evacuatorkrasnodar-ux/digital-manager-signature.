export interface InstalledPack {id:string;kind:string;title:string;bytes:number;sha256:string;version:number;platform:string;downloadUrl:string}
export interface PackStorage {list():Promise<InstalledPack[]>;download(pack:InstalledPack):Promise<void>;verify(pack:InstalledPack):Promise<boolean>;commit(pack:InstalledPack):Promise<void>;discard(id:string):Promise<void>;remove(id:string):Promise<void>}
export function createExpoPackStorage():PackStorage;
