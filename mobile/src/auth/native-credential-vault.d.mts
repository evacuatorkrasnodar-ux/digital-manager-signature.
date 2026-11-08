import type {VerifiedNativeSession} from './native-code-exchange.mjs';

/** Internal auth/network-layer credentials. Never expose to screens. */
export interface NativeAccessCredential {
  token:string;
  issuer:string;
  clientId:string;
  subject:string;
  expiresAt:number;
}
export interface NativeRefreshCredential {
  refreshToken:string;
  issuer:string;
  clientId:string;
  subject:string;
}
export interface NativeCredentialVault {
  saveVerifiedSession(input:VerifiedNativeSession):Promise<{status:'stored'}>;
  getAccessCredential():Promise<NativeAccessCredential|null>;
  getRefreshCredential():Promise<NativeRefreshCredential|null>;
  signOut():Promise<{status:'signed-out'}>;
}
export interface NativeSecureStorePort {
  get(key:string):Promise<string|null>;
  set(key:string,value:string):Promise<void>;
  delete(key:string):Promise<void>;
}
export function createNativeCredentialVault(config:{
  issuer:string;
  clientId:string;
  secureStore:NativeSecureStorePort;
  now?:()=>number;
}):NativeCredentialVault;
