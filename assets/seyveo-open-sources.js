/* SEYVEO · Free, attributable public-reference lookup for the actual Sayvi chat.
 * Wikipedia is an encyclopedia, NOT a general live web or news search.
 * Anonymous Wikimedia Action API requests require origin=* for browser CORS.
 * Never send personal messages, memory, attachments or conversation history. */
((root)=>{
 'use strict';
 const PRIVATE=/(?:^|[^а-яё])(?:мо(?:й|я|ё|и|их|его|ей|ю|ему|им|ими|ём)|наш(?:а|е|и|у|его|ей|их|ему|им|ими))(?=$|[^а-яё])|(?:парол|паспорт|переписк|зарплат|договор|сотрудник|клиент|банковск|медицинск|здоровь|диагноз|личн(?:ый|ые|ая)|секретн|персональн)/iu;
 const tidy=value=>String(value??'').replace(/<[^>]*>/gu,' ').replace(/&(?:amp|quot|lt|gt|nbsp);/giu,x=>({'&amp;':'&','&quot;':'"','&lt;':'<','&gt;':'>','&nbsp;':' '})[x.toLowerCase()]||' ').replace(/&#(\d+);/gu,(_,n)=>{const c=Number(n);return c>=32&&c<=0x10ffff?String.fromCodePoint(c):''}).replace(/\s+/gu,' ').trim();
 const https=value=>{try{const url=new URL(String(value));return url.protocol==='https:'&&!url.username&&!url.password?url:null}catch{return null}};
 const allowedImage=url=>{const parsed=https(url);return parsed?.hostname==='upload.wikimedia.org'?parsed.href:''};
 const publicQuery=value=>{
  const text=tidy(value).slice(0,300);
  if(text.length<3||PRIVATE.test(text))return '';
  const stripped=text.replace(/^(?:(?:сэй|сэйви)[,! ]+)?(?:найди|поищи|покажи|расскажи|проверь|что нового|правда ли|какие (?:последние|свежие) новости)\s+(?:в интернете\s+|в сети\s+)?(?:мне\s+)?(?:фото|фотографии|картинки|изображения|информацию|сведения|статьи|про|о том[,]?)?\s*/iu,'').trim();
  const subject=stripped.replace(/^(?:в интернете|в сети)\s+/iu,'')
   .replace(/^(?:фото|фотографии|картинки|изображения|информацию|сведения|статьи|про)\s+/iu,'')
   .replace(/^о\s+/iu,'').trim();
  return subject.length>=3?subject:text;
 };
 function api(host,params){const url=new URL('https://'+host+'/w/api.php');
  for(const [key,value] of Object.entries({...params,format:'json',formatversion:'2',origin:'*'}))url.searchParams.set(key,value);
  return url.href;
 }
 async function request(fetcher,url,signal){
  const response=await fetcher(url,{method:'GET',mode:'cors',credentials:'omit',
   referrerPolicy:'strict-origin-when-cross-origin',signal});
  if(!response.ok)throw Error('public-reference-unavailable');
  return response.json();
 }
 function license(value){
  const l=tidy(value).replace(/\s+/gu,' ').toLowerCase();
  return /^(?:cc\s*by(?:-sa)?(?:\s*\d(?:\.\d)?)?|cc0(?:\s*\d(?:\.\d)?)?|public\s*domain|pd-old|pd-self)$/iu.test(l);
 }
 async function photoCredits(pages,{fetcher,signal}){
  const filenames=[...new Set(pages.map(p=>p.pageimage).filter(x=>typeof x==='string'&&x.length<180))].slice(0,3);
  if(!filenames.length)return new Map();
  const result=new Map();
  const data=await request(fetcher,api('commons.wikimedia.org',{
   action:'query',prop:'imageinfo',titles:filenames.map(x=>'File:'+x).join('|'),
   iiprop:'extmetadata',iiextmetadatafilter:'Artist|LicenseShortName|LicenseUrl',
   iiextmetadatalanguage:'ru'
  }),signal);
  for(const file of data?.query?.pages||[]){
   const meta=file?.imageinfo?.[0]?.extmetadata;
   const name=String(file?.title||'').replace(/^File:/iu,'').replace(/_/gu,' ');
   const lic=tidy(meta?.LicenseShortName?.value).slice(0,50);
   const artist=tidy(meta?.Artist?.value).slice(0,90);
   const licenseURL=https(meta?.LicenseUrl?.value);
   if(!name||!license(lic)||!artist||!licenseURL)continue;
   result.set(name,{credit:artist+' · '+lic,sourceURL:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(name.replace(/ /gu,'_')),
    licenseURL:licenseURL.href});
  }
  return result;
 }
 async function lookup(input,{fetcher=root?.fetch?.bind(root),signal}={}){
  const query=publicQuery(input);
  if(!query)return {status:'unavailable',message:'Личные сведения не отправляю во внешний поиск.',results:[]};
  if(typeof fetcher!=='function')return {status:'unavailable',message:'Нет доступа к открытым источникам.',results:[]};
  const searchUrl=api('ru.wikipedia.org',{
   action:'query',generator:'search',gsrsearch:query,gsrlimit:'5',
   prop:'extracts|pageimages',exintro:'1',explaintext:'1',exsentences:'2',
   piprop:'thumbnail|name',pilicense:'free',pithumbsize:'320'
  });
  const data=await request(fetcher,searchUrl,signal);
  const pages=Array.isArray(data?.query?.pages)?data.query.pages.slice(0,5).sort((a,b)=>(a.index||0)-(b.index||0)):[];
  let credits=new Map();
  // Attribution is mandatory. If Commons metadata is unavailable, omit the photo.
  try{credits=await photoCredits(pages,{fetcher,signal})}catch(error){if(signal?.aborted)throw error}
  const results=pages.flatMap(page=>{
   const title=tidy(page?.title).slice(0,180),snippet=tidy(page?.extract).slice(0,450);
   if(!title||!snippet)return [];
   const url='https://ru.wikipedia.org/wiki/'+encodeURIComponent(title.replace(/ /gu,'_'));
   const entry={title,snippet,url,publishedAt:null};
   const img=allowedImage(page?.thumbnail?.source),photo=credits.get(String(page?.pageimage||'').replace(/_/gu,' '));
   if(img&&photo){entry.imageUrl=img;entry.imageApproved=true;entry.imageCredit=photo.credit;
    entry.imageSourceUrl=photo.sourceURL;entry.imageLicenseUrl=photo.licenseURL}
   return [entry];
  });
  return {status:results.length?'results':'empty',sourceType:'wikipedia',results,
   message:results.length?'Нашла материалы в открытой энциклопедии. Это справка, не свежие новости и не весь интернет.':'В открытой энциклопедии точных совпадений нет. Это не означает, что информации нет в интернете.'};
 }
 const apiObject=Object.freeze({lookup,publicQuery,license});
 if(typeof module!=='undefined'&&module.exports)module.exports=apiObject;
 if(root)root.SEYVEO_OPEN_SOURCES=apiObject;
})(typeof window!=='undefined'?window:null);
