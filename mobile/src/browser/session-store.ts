import * as SecureStore from 'expo-secure-store';
const KEY='seyveo-browser-session-v1';
let saveQueue:Promise<void>=Promise.resolve();
const valid=(s:unknown):s is string=>{
 if(typeof s!=='string'||s.length>2048)return false;
 try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password}catch{return false}
};
export type SavedBrowserTab={id:number;url:string;scrollY?:number};
export type SavedBrowserSession={tabs:SavedBrowserTab[];active:number};
export async function loadBrowserSession():Promise<SavedBrowserSession|null>{
 try{
  const raw=await SecureStore.getItemAsync(KEY);
  if(!raw)return null;
  const data=JSON.parse(raw);
  if(!Array.isArray(data.tabs))return null;
  const seen=new Set<number>();
  const tabs:SavedBrowserTab[]=data.tabs.filter((t:SavedBrowserTab)=>{
   if(!t||!Number.isSafeInteger(t.id)||t.id<=0||!valid(t.url)||seen.has(t.id))return false;
   seen.add(t.id);return true;
  }).slice(-10).map((t:SavedBrowserTab)=>({...t,scrollY:Number.isSafeInteger(t.scrollY)&&t.scrollY!>=0&&t.scrollY!<=2000000?t.scrollY:0}));
  return tabs.length?{tabs,active:tabs.some((t:SavedBrowserTab)=>t.id===data.active)?data.active:tabs[0].id}:null;
 }catch{return null}
}
export async function saveBrowserSession(tabs:SavedBrowserTab[],active:number){
 try{
  const seen=new Set<number>();
  const safe=tabs.filter(t=>{
   if(!t||!Number.isSafeInteger(t.id)||t.id<=0||!valid(t.url)||seen.has(t.id))return false;
   seen.add(t.id);return true;
  }).slice(-10);
  if(!safe.length)return false;
  const data=JSON.stringify({tabs:safe.map(t=>({...t,scrollY:Number.isSafeInteger(t.scrollY)&&t.scrollY!>=0&&t.scrollY!<=2000000?t.scrollY:0})),active:safe.some(t=>t.id===active)?active:safe[0].id});
  const next=saveQueue.then(()=>SecureStore.setItemAsync(KEY,data));
  saveQueue=next.catch(()=>{});
  await next;
  return true;
 }catch{return false}
}
