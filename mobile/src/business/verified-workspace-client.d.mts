import type {
  WorkspaceNavigation,VerifiedWorkspaceManifest
} from './workspace-navigation.mjs';

export type NativePersonalSession = {
  /** Validated in the trusted native session manager; not QR/local demo. */
  token:string;
  userId:string;
  sessionId:string;
  expiresAt:number;
};
export type WorkspaceLoad =
  | {status:'ready';manifest:VerifiedWorkspaceManifest;navigation:WorkspaceNavigation}
  | {status:'sign-in-required'|'unavailable';navigation:WorkspaceNavigation};
export type WorkspaceAccept =
  | {status:'joined';navigation:WorkspaceNavigation;
     workspace:{id:string;name:string;kind:'business'}}
  | {status:'verification-pending'|'sign-in-required'|'unavailable';
     navigation:WorkspaceNavigation}
  | {status:'invalid-code'|'busy'|'invalid-or-expired'};
export interface VerifiedWorkspaceClient {
  load():Promise<WorkspaceLoad>;
  acceptCode(args:{code:string}):Promise<WorkspaceAccept>;
}
export interface VerifiedWorkspaceClientConfig {
  apiOrigin:string;
  getPersonalSession:()=>Promise<NativePersonalSession|null>;
  fetchImpl:(url:string,request:{
    method:'GET'|'POST';
    headers:Record<string,string>;
    body?:string;
    redirect:'manual';
    credentials:'omit';
    cache:'no-store';
    referrerPolicy:'no-referrer';
  })=>Promise<{
    status:number;type?:string;
    headers?:{get:(name:string)=>string|null};
    text:()=>Promise<string>;
  }>;
  now?:()=>number;
}
export function createVerifiedWorkspaceClient(
  config:VerifiedWorkspaceClientConfig
):VerifiedWorkspaceClient;
