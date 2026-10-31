/* SEYVEO Web: public reference lookup without commercial search credentials.
 * This is a small source-backed lookup, NOT a full web search engine.
 * Only explicit public questions after consent reach Wikipedia.
 */
const clean=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
export function createSeyveoWebProvider({fetcher=fetch}={}){
 if(typeof fetcher!=='function')throw Error('invalid-fetcher');
 return async function lookup(question){
  const query=String(question||'').trim().slice(0,300);
  if(!query)return [];
  const endpoint=new URL('https://ru.wikipedia.org/w/api.php');
  endpoint.searchParams.set('action','query');
  endpoint.searchParams.set('list','search');
  endpoint.searchParams.set('srsearch',query);
  endpoint.searchParams.set('srlimit','6');
  endpoint.searchParams.set('srprop','snippet|timestamp');
  endpoint.searchParams.set('format','json');
  const response=await fetcher(endpoint.href,{
   headers:{accept:'application/json','user-agent':'SEYVEO-Search/0.1 (public-reference-lookup)'},
   redirect:'error',signal:AbortSignal.timeout(12000)
  });
  if(!response.ok)throw Error('seyveo-source-unavailable');
  const payload=await response.json();
  if(!Array.isArray(payload?.query?.search))throw Error('invalid-reference-results');
  return payload.query.search.slice(0,6).flatMap(item=>{
   const title=clean(item.title).slice(0,180);
   const snippet=clean(item.snippet).slice(0,600);
   if(!title||!snippet)return [];
   const url='https://ru.wikipedia.org/wiki/'+encodeURIComponent(item.title.replace(/ /g,'_'));
   // Search timestamp is an edit time, not publication date. Never label it as published.
   const publishedAt=null;
   return [{title,snippet,url,publishedAt}];
  });
 };
}
