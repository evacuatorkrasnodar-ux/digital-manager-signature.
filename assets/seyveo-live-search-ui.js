/* SEYVEO Live Search: restrained, source-first presentation in Feather Chat.
   Accepts verified server results; never fabricates results or images. */
(()=>{
'use strict';
function secureUrl(value){
 try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}
 catch{return null}
}
function element(tag,cls,label){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(label!==undefined)el.textContent=label;
 return el;
}
function render(payload){
 if(!payload||payload.status!=='results'||!Array.isArray(payload.results))return null;
 const results=payload.results.slice(0,6).filter(row=>row&&secureUrl(row.url)&&String(row.title||'').trim());
 if(!results.length)return null;
 const section=element('section','seyveo-live-search');
 section.setAttribute('aria-label','Источники интернет-поиска');
 const heading=element('div','seyveo-live-search-heading');
 heading.append(
  element('span','seyveo-live-search-mark','✧'),
  element('span','', 'Источники в интернете'),
  element('small','',String(results.length))
 );
 section.append(heading);
 const pictures=results.filter(row=>row.imageApproved===true&&secureUrl(row.imageUrl)&&String(row.imageCredit||'').trim()).slice(0,3);
 if(pictures.length){
  const gallery=element('div','seyveo-live-search-gallery');
  gallery.setAttribute('aria-label','Иллюстрации из источников');
  for(const row of pictures){
   const imageLink=element('a','seyveo-live-search-photo');
   imageLink.href=secureUrl(row.url);imageLink.target='_blank';imageLink.rel='noopener noreferrer';
   const img=document.createElement('img');
   img.src=secureUrl(row.imageUrl);img.loading='lazy';img.decoding='async';
   img.referrerPolicy='no-referrer';img.alt=String(row.title).slice(0,160);
   const caption=element('small','',String(row.imageCredit).slice(0,110));
   imageLink.append(img,caption);gallery.append(imageLink);
  }
  section.append(gallery);
 }
 const items=element('div','seyveo-live-search-sources');
 for(const row of results){
  const url=secureUrl(row.url);
  const link=element('a','seyveo-live-search-source');
  link.href=url;link.target='_blank';link.rel='noopener noreferrer';
  const info=element('div','seyveo-live-search-source-content');
  info.append(element('strong','',String(row.title).slice(0,180)));
  if(row.snippet)info.append(element('p','',String(row.snippet).slice(0,330)));
  const domain=new URL(url).hostname.replace(/^www\./,'');
  const date=/^\d{4}-\d{2}-\d{2}$/.test(row.publishedAt||'')?' · '+row.publishedAt:'';
  info.append(element('small','',domain+date));
  link.append(info,element('span','seyveo-live-search-arrow','↗'));
  items.append(link);
 }
 section.append(items);
 section.append(element('p','seyveo-live-search-disclaimer',
  'Сведения из внешних источников. Для важных решений проверь дату и оригинал.'));
 return section;
}
window.SEYVEO_LIVE_SEARCH_UI=Object.freeze({render});
})();
