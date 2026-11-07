import {validateBrowserWebViewUrl} from './native-webview-policy.mjs';

/**
 * Stateless first-stage native browser tabs. Pages in this prototype have
 * ephemeral, device-local metadata only, never cloud synced.
 *
 * Active WebView history is managed by the native engine; switching tabs
 * currently reloads their last known URL. Persistent tab sessions follow.
 */
export const MAX_BROWSER_TABS = 8;
const defaultTitle='Новая вкладка';
const record=(id,url)=>Object.freeze({
  id,url,title:url?new URL(url).hostname:defaultTitle
});
const snapshot=(tabs,activeId,nextId)=>Object.freeze({
  tabs:Object.freeze(tabs),activeId,nextId
});
export function initialBrowserTabs(){
  return snapshot([record(1,null)],1,2);
}
export function activeBrowserTab(state){
  return state.tabs.find(t=>t.id===state.activeId)||state.tabs[0];
}
export function addBrowserTab(state,url=null){
  if(state.tabs.length>=MAX_BROWSER_TABS)return state;
  const safe=url===null?null:validateBrowserWebViewUrl(url);
  const newTab=record(state.nextId,safe);
  return snapshot([...state.tabs,newTab],newTab.id,state.nextId+1);
}
export function selectBrowserTab(state,id){
  if(!state.tabs.some(t=>t.id===id))return state;
  return snapshot(state.tabs,id,state.nextId);
}
export function setBrowserTabUrl(state,id,url){
  if(!state.tabs.some(t=>t.id===id))return state;
  const safe=validateBrowserWebViewUrl(url);
  return snapshot(state.tabs.map(tab=>tab.id===id?
    record(tab.id,safe):tab),state.activeId,state.nextId);
}
export function observeBrowserTab(state,id,url,title){
  if(!state.tabs.some(t=>t.id===id))return state;
  let safe;
  try{safe=validateBrowserWebViewUrl(url)}catch{return state;}
  const label=typeof title==='string'&&title.trim()
    ?title.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,48):new URL(safe).hostname;
  const tabs=state.tabs.map(tab=>tab.id===id?
    Object.freeze({id,url:safe,title:label}):tab);
  return snapshot(tabs,state.activeId,state.nextId);
}
export function closeBrowserTab(state,id){
  if(!state.tabs.some(t=>t.id===id))return state;
  const index=state.tabs.findIndex(t=>t.id===id);
  const tabs=state.tabs.filter(t=>t.id!==id);
  if(!tabs.length) {
    const fresh=record(state.nextId,null);
    return snapshot([fresh],fresh.id,state.nextId+1);
  }
  const activeId=state.activeId===id?tabs[Math.min(index,tabs.length-1)].id:state.activeId;
  return snapshot(tabs,activeId,state.nextId);
}
