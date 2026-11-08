import type {
  NativeAccessCredential
} from './native-credential-vault.mjs';
import type {
  VerifiedWorkspaceClient,NativePersonalSession
} from '../business/verified-workspace-client.mjs';

export interface VerifiedAccountBridge {
  /** Native network layer only; never hand bearer to a React component. */
  getPersonalSession():Promise<NativePersonalSession|null>;
  workspaces:VerifiedWorkspaceClient;
}
export interface VerifiedAccountBridgeConfig {
  apiOrigin:string;
  issuer:string;
  clientId?:string;
  credentialVault:{
    getAccessCredential():Promise<NativeAccessCredential|null>;
  };
  fetchImpl:(url:string,options:{
    method:'GET'|'POST';
    headers:Record<string,string>;
    body?:string;
    redirect:'manual';credentials:'omit';cache:'no-store';
    referrerPolicy:'no-referrer';
  })=>Promise<{
    status:number;type?:string;
    headers?:{get:(name:string)=>string|null};
    text:()=>Promise<string>;
  }>;
  now?:()=>number;
}
export function createVerifiedAccountBridge(
  config:VerifiedAccountBridgeConfig
):VerifiedAccountBridge;
