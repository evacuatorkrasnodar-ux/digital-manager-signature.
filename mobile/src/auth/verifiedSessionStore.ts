/**
 * Device-local OIDC session storage for SEYVEO mobile, separate from Personal Core.
 *
 * Only the *already verified* native-code-exchange's saveVerifiedSession
 * callback should write this store. No test login, hardcoded token or provider.
 * Browser/AI never receive refresh tokens or ID tokens.
 */
import * as SecureStore from 'expo-secure-store';
import type {VerifiedNativeSession} from './native-code-exchange.mjs';

const KEY='seyveo.auth.verified-session.v1';
type StoredSession={
 version:1;issuer:string;subject:string;clientId:string;
 accessToken:string;expiresAt:number;idTokenExpiresAt:number;
 refreshToken:string|null;
};
const URL_RE=/^https:\/\/[^\s/?#]+(?:\/[^\s?#]*)?$/;
const subject=/^[^\x00-\x1f\x7f]{1,256}$/;
const isSafeToken=(s:unknown):s is string=>
 typeof s==='string'&&s.length>=16&&s.length<=8192&&
 /^[\x21-\x7e]+$/.test(s);
const keychainOptions={
 keychainAccessible:SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
};
function valid(session:unknown):session is StoredSession {
 if(!session||typeof session!=='object')return false;
 const s=session as Record<string,unknown>;
 return s.version===1 && typeof s.issuer==='string'&&URL_RE.test(s.issuer)&&
  typeof s.clientId==='string'&&/^[A-Za-z0-9._~-]{3,128}$/.test(s.clientId)&&
  typeof s.subject==='string'&&subject.test(s.subject)&&
  isSafeToken(s.accessToken)&&
  (s.refreshToken===null||isSafeToken(s.refreshToken))&&
  typeof s.expiresAt==='number'&&Number.isSafeInteger(s.expiresAt)&&
  typeof s.idTokenExpiresAt==='number'&&Number.isSafeInteger(s.idTokenExpiresAt);
}

/** To be passed ONLY as the trusted callback to createNativeCodeExchange. */
export async function saveVerifiedNativeSession(session:VerifiedNativeSession){
 const now=Date.now();
 const expiresAt=now+session.accessTokenExpiresIn*1000;
 const value:StoredSession={
  version:1,issuer:session.issuer,subject:session.subject,clientId:session.clientId,
  accessToken:session.accessToken,refreshToken:session.refreshToken,
  expiresAt,idTokenExpiresAt:session.idTokenExpiresAt
 };
 if(!valid(value)||session.idTokenExpiresAt<=now||expiresAt<=now||
   session.accessTokenExpiresIn>3600)throw Error('verified-session-invalid');
 await SecureStore.setItemAsync(KEY,JSON.stringify(value),keychainOptions);
}

async function readSession():Promise<StoredSession|null>{
 const raw=await SecureStore.getItemAsync(KEY);
 if(raw===null)return null;
 let value:unknown;
 try{value=JSON.parse(raw)}catch{throw Error('verified-session-invalid')}
 if(!valid(value))throw Error('verified-session-invalid');
 return value;
}

/** Never return expired credentials. Reauthentication is required to continue. */
export async function getVerifiedNativeAccessToken():Promise<string>{
 const value=await readSession();
 const now=Date.now();
 if(!value||value.expiresAt<=now+30_000||value.idTokenExpiresAt<=now)
   throw Error('document-login-required');
 return value.accessToken;
}

export async function hasVerifiedNativeSession():Promise<boolean>{
 try{await getVerifiedNativeAccessToken();return true}
 catch{return false}
}

export async function clearVerifiedNativeSession(){
 await SecureStore.deleteItemAsync(KEY);
}
