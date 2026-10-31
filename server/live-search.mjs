/* SEYVEO Live Search: provider-neutral, source-grounded response contract.
   No API keys in the browser; the server supplies a licensed search provider. */
const MAX_RESULTS=6;
function safeUrl(value){
 try{const u=new URL(value);return u.protocol==='https:'&&u.username===''&&u.password===''?u.href:null}catch{return null}
}
export function validateLiveSearchResults(raw){
 if(!Array.isArray(raw))throw Error('invalid-search-results');
 return raw.slice(0,MAX_RESULTS).flatMap(item=>{
  if(!item||typeof item!=='object')return [];
  const url=safeUrl(item.url);
  if(!url)return [];
  const title=String(item.title||'').trim().slice(0,180);
  const snippet=String(item.snippet||'').trim().slice(0,600);
  if(!title||!snippet)return [];
  // Do not display third-party images unless the provider confirms permitted use and attribution.
  const imageCredit=typeof item.imageCredit==='string'?item.imageCredit.trim().slice(0,110):'';
  const imageUrl=item.imageApproved===true&&imageCredit?safeUrl(item.imageUrl):null;
  const publishedAt=typeof item.publishedAt==='string'&&/^\d{4}-\d{2}-\d{2}/.test(item.publishedAt)?item.publishedAt.slice(0,10):null;
  return [{title,snippet,url,imageUrl,imageApproved:!!imageUrl,imageCredit:imageUrl?imageCredit:'',publishedAt}];
 });
}
export async function searchWithSources(question,{search}={}){
 const query=String(question??'').trim();
 if(!query||query.length>1000)throw Error('invalid-query');
 if(typeof search!=='function')return {status:'unavailable',query,results:[],message:'Интернет-поиск пока не подключён.'};
 const results=validateLiveSearchResults(await search(query));
 return {status:results.length?'results':'empty',query,results,
  message:results.length?'Найдены источники для проверки.':'Не удалось найти проверяемые источники.'};
}

/* Actual web provider. The credential stays on the server, never in a browser.
   Uses Brave Web Search API's documented GET endpoint.
   Only the explicit search question is sent; no memory or conversation history. */
export function makeBraveSearchProvider({apiKey=process.env.SEYVEO_BRAVE_SEARCH_API_KEY,fetcher=fetch}={}){
 if(typeof apiKey!=='string'||!apiKey.trim())return null;
 if(typeof fetcher!=='function')throw Error('invalid-fetcher');
 return async function braveSearch(question){
  const query=String(question||'').trim().slice(0,600);
  const endpoint=new URL('https://api.search.brave.com/res/v1/web/search');
  endpoint.searchParams.set('q',query);
  endpoint.searchParams.set('count','6');
  endpoint.searchParams.set('search_lang','ru');
  endpoint.searchParams.set('ui_lang','ru-RU');
  endpoint.searchParams.set('safesearch','moderate');
  endpoint.searchParams.set('text_decorations','false');
  endpoint.searchParams.set('result_filter','web');
  const response=await fetcher(endpoint.href,{
   method:'GET',
   headers:{'accept':'application/json','x-subscription-token':apiKey.trim()},
   signal:AbortSignal.timeout(12000),
   redirect:'error'
  });
  if(!response.ok)throw Error(response.status===429?'search-rate-limited':'search-provider-error');
  const payload=await response.json();
  if(!Array.isArray(payload?.web?.results))throw Error('invalid-search-response');
  return payload.web.results.map(item=>({
   title:item.title,
   url:item.url,
   snippet:item.description,
   publishedAt:typeof item.page_age==='string'&&/^\d{4}-\d{2}-\d{2}/.test(item.page_age)?item.page_age.slice(0,10):null
  }));
 };
}

/* Brave LLM Context returns real extracted passages and source metadata.
   No automatic training, no persistence, no secrets sent to the browser. */
export function createBraveContextProvider({apiKey=process.env.SEYVEO_BRAVE_SEARCH_API_KEY,fetcher=fetch}={}){
 if(typeof apiKey!=='string'||!apiKey.trim())return null;
 return async query=>{
  const endpoint=new URL('https://api.search.brave.com/res/v1/llm/context');
  endpoint.searchParams.set('q',String(query).slice(0,600));
  endpoint.searchParams.set('search_lang','ru');
  endpoint.searchParams.set('maximum_number_of_tokens','4096');
  endpoint.searchParams.set('maximum_number_of_urls','6');
  endpoint.searchParams.set('context_threshold_mode','strict');
  endpoint.searchParams.set('enable_local','false');
  const res=await fetcher(endpoint.href,{
   headers:{accept:'application/json','x-subscription-token':apiKey.trim()},
   redirect:'error',signal:AbortSignal.timeout(30000)
  });
  if(!res.ok)throw Error('brave-context-unavailable');
  const data=await res.json();
  if(!Array.isArray(data?.grounding?.generic))throw Error('invalid-context-response');
  return data.grounding.generic.slice(0,6).flatMap(item=>{
   const url=safeUrl(item?.url);
   if(!url)return [];
   const title=String(item.title||data.sources?.[url]?.title||'').slice(0,180);
   const snippets=Array.isArray(item.snippets)?item.snippets.filter(v=>typeof v==='string').slice(0,3):[];
   if(!title||!snippets.length)return [];
   const date=data.sources?.[url]?.age?.[1];
   return [{url,title,snippet:snippets.join(' ').slice(0,600),
    context:snippets.join('\n').slice(0,3000),
    publishedAt:typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)?date:null}];
  });
 };
}
