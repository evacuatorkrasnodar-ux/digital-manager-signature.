import * as SecureStore from 'expo-secure-store';
const KEY='seyveo-browser-cookie-exceptions-v1';
const isHost=(value:string)=>value.length<=253&&/^[a-z0-9.-]+$/.test(value)&&!value.includes('..')&&value.includes('.');
export async function loadCookieExceptions():Promise<string[]>{
 try{const data=JSON.parse((await SecureStore.getItemAsync(KEY))||'[]');return Array.isArray(data)?data.filter((v:unknown):v is string=>typeof v==='string'&&isHost(v)).slice(0,30):[]}catch{return []}
}
export async function saveCookieExceptions(hosts:string[]):Promise<boolean>{
 try{await SecureStore.setItemAsync(KEY,JSON.stringify([...new Set(hosts.filter(isHost))].slice(0,30)));return true}catch{return false}
}
export function hostnameForException(url:string){try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.hostname.toLowerCase():null}catch{return null}}

const PREF_KEY='seyveo-cookie-block-v1';
export async function loadCookieBlock(){try{return (await SecureStore.getItemAsync(PREF_KEY))==='yes'}catch{return false}}
export async function saveCookieBlock(value:boolean){try{await SecureStore.setItemAsync(PREF_KEY,value?'yes':'no');return true}catch{return false}}
