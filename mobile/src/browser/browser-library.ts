import * as SecureStore from 'expo-secure-store';
export type SavedLink={url:string;time:number};
const HISTORY='seyveo-history-v1';
const FAVORITES='seyveo-favorites-v1';
function valid(url:string){try{const u=new URL(url);return url.length<=2048&&['https:','http:'].includes(u.protocol)&&!u.username&&!u.password}catch{return false}}
async function read(key:string):Promise<SavedLink[]>{
 try{const data=JSON.parse((await SecureStore.getItemAsync(key))||'[]');return Array.isArray(data)?data.filter((x:SavedLink)=>x&&typeof x.url==='string'&&valid(x.url)&&Number.isFinite(x.time)).slice(0,50):[]}catch{return []}
}
async function write(key:string,items:SavedLink[]){try{await SecureStore.setItemAsync(key,JSON.stringify(items.slice(0,50)));return true}catch{return false}}
export const browserLibrary={
 history:()=>read(HISTORY),
 favorites:()=>read(FAVORITES),
 async visit(url:string){if(!valid(url))return false;const list=await read(HISTORY);return write(HISTORY,[{url,time:Date.now()},...list.filter(x=>x.url!==url)])},
 async toggleFavorite(url:string){if(!valid(url))return false;const list=await read(FAVORITES);return write(FAVORITES,list.some(x=>x.url===url)?list.filter(x=>x.url!==url):[{url,time:Date.now()},...list])},
 async clearHistory(){return write(HISTORY,[])}
};
