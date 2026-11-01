/* SEYVEO Browser native foundation: pure tab/session model.
 * No WebView or background-work claims. UI/platform adapters come later. */
const MAX_TABS=50, MAX_HISTORY=80;
export function normalizeBrowserUrl(value){
  if(typeof value!=='string'||value.length>4096)return null;
  try {
    const url=new URL(value.trim());
    if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return null;
    if(!url.hostname)return null;
    url.hash='';
    return url.href;
  } catch {return null}
}
export function emptyBrowserSession(){
  return {version:1,tabs:[],activeId:null,closed:[]};
}
export function restoreBrowserSession(raw){
  const result=emptyBrowserSession();
  if(!raw||raw.version!==1||!Array.isArray(raw.tabs))return result;
  const ids=new Set();
  for(const tab of raw.tabs.slice(0,MAX_TABS)){
    if(!tab||typeof tab.id!=='string'||tab.id.length>80||ids.has(tab.id))continue;
    if(!Array.isArray(tab.history))continue;
    const history=tab.history.map(normalizeBrowserUrl).filter(Boolean).slice(-MAX_HISTORY);
    if(!history.length)continue;
    ids.add(tab.id);
    const index=Number.isInteger(tab.index)?Math.max(0,Math.min(history.length-1,tab.index)):history.length-1;
    result.tabs.push({id:tab.id,history,index});
  }
  result.activeId=ids.has(raw.activeId)?raw.activeId:result.tabs[0]?.id||null;
  if(Array.isArray(raw.closed)){
    result.closed=raw.closed.filter(x=>typeof x==='string').map(normalizeBrowserUrl).filter(Boolean).slice(0,20);
  }
  return result;
}
export function openBrowserTab(raw,url,id){
  const session=restoreBrowserSession(raw),safe=normalizeBrowserUrl(url);
  if(!safe||typeof id!=='string'||!id.trim()||id.length>80||session.tabs.some(x=>x.id===id)||session.tabs.length>=MAX_TABS)return session;
  session.tabs.push({id,history:[safe],index:0});session.activeId=id;
  return session;
}
export function navigateBrowserTab(raw,id,url){
  const session=restoreBrowserSession(raw),safe=normalizeBrowserUrl(url);
  const tab=session.tabs.find(x=>x.id===id);
  if(!tab||!safe)return session;
  tab.history=[...tab.history.slice(0,tab.index+1),safe].slice(-MAX_HISTORY);
  tab.index=tab.history.length-1;
  session.activeId=id;
  return session;
}
export function stepBrowserHistory(raw,id,delta){
  const session=restoreBrowserSession(raw),tab=session.tabs.find(x=>x.id===id);
  if(!tab||![-1,1].includes(delta))return session;
  tab.index=Math.max(0,Math.min(tab.history.length-1,tab.index+delta));session.activeId=id;
  return session;
}
export function closeBrowserTab(raw,id){
  const session=restoreBrowserSession(raw),idx=session.tabs.findIndex(x=>x.id===id);
  if(idx<0)return session;
  const [removed]=session.tabs.splice(idx,1);
  session.closed=[removed.history[removed.index],...session.closed].slice(0,20);
  if(session.activeId===id)session.activeId=session.tabs[Math.max(0,idx-1)]?.id||null;
  return session;
}
