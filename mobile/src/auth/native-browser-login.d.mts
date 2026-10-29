import type {NativePkceFlow,PkceCallback} from './native-pkce-core.mjs';
export type AuthGrant=Extract<PkceCallback,{status:'exchange-required'}>;
export type BrowserLoginStatus='signed-in'|'busy'|'cancelled'|'denied'|'unavailable';
export interface BrowserLogin {
  signIn():Promise<{status:BrowserLoginStatus}>;
  cancel():void;
}
export interface BrowserLoginConfig {
  flow:NativePkceFlow;
  redirectUri:string;
  redirectMode?:'claimed-https'|'private-use';
  platform:'ios'|'android';
  verifiedHttpsCallbackReady?:boolean;
  openAuthSession:(url:string,redirectUri:string,options:{
    preferUniversalLinks:boolean;preferEphemeralSession:boolean;
  })=>Promise<{type:string;url?:string}>;
  exchangeGrant:(grant:AuthGrant)=>Promise<{status:string}>;
}
export function createNativeBrowserLogin(config:BrowserLoginConfig):BrowserLogin;
