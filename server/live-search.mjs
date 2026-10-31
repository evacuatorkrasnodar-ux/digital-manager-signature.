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
