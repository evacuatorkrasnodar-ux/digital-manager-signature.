import * as SecureStore from 'expo-secure-store';
const KEY='seyveo-browser-session-v1';
const valid=(s:unknown):s is string=>{
 if(typeof s!=='string'||s.length>160)return false;
 try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password}catch{return false}
};
export type SavedBrowserTab={id:number;url:string};
export type SavedBrowserSession={tabs:SavedBrowserTab[];active:number};
export async function loadBrowserSession():Promise<SavedBrowserSession|null>{
 try{
  const raw=await SecureStore.getItemAsync(KEY);
  if(!raw)return null;
  const data=JSON.parse(raw);
  if(!Array.isArray(data.tabs))return null;
  const tabs=data.tabs.filter((t:SavedBrowserTab)=>Number.isSafeInteger(t?.id)&&t.id>0&&valid(t.url)).slice(0,10);
  return tabs.length?{tabs,active:tabs.some((t:SavedBrowserTab)=>t.id===data.active)?data.active:tabs[0].id}:null;
 }catch{return null}
}
export async function saveBrowserSession(tabs:SavedBrowserTab[],active:number){
 try{
  const safe=tabs.filter(t=>Number.isSafeInteger(t.id)&&valid(t.url)).slice(-10);
  await SecureStore.setItemAsync(KEY,JSON.stringify({tabs:safe,active}));
  return true;
 }catch{return false}
}
