const test=require('node:test');
const assert=require('node:assert/strict');
const sources=require('../assets/seyveo-open-sources.js');

const input='найди фото Краснодара';
const article={index:1,title:'Краснодар',extract:'Краснодар — город России.',
 pageimage:'Krasnodar_view.jpg',thumbnail:{source:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Krasnodar_view.jpg/320px-Krasnodar_view.jpg'}};
function provider(credits={}){
 const requests=[];
 const fetcher=async url=>{
  const target=new URL(url);requests.push(target);
  assert.equal(target.searchParams.get('origin'),'*');
  if(target.hostname==='ru.wikipedia.org')return {ok:true,json:async()=>({query:{pages:[article]}})};
  assert.equal(target.hostname,'commons.wikimedia.org');
  return {ok:true,json:async()=>({query:{pages:[{title:'File:Krasnodar_view.jpg',
   imageinfo:[{extmetadata:{Artist:{value:credits.artist||''},
    LicenseShortName:{value:credits.license||''},LicenseUrl:{value:credits.licenseURL||''}}}] }]}})};
 };
 return {fetcher,requests};
}
test('searches Wikimedia only by explicit public topic, with source links',async()=>{
 const mock=provider();const result=await sources.lookup(input,{fetcher:mock.fetcher});
 assert.equal(mock.requests[0].searchParams.get('gsrsearch'),'Краснодара');
 assert.equal(mock.requests[0].searchParams.get('generator'),'search');
 assert.equal(result.sourceType,'wikipedia');
 assert.equal(result.results[0].url,'https://ru.wikipedia.org/wiki/'+encodeURIComponent('Краснодар'));
 assert.equal(result.results[0].publishedAt,null);
 assert(!result.results[0].imageApproved,'never show a photo without its license and author');
});
test('licenses and credits a freely licensed Wikimedia photograph',async()=>{
 const mock=provider({artist:'Иван Петров',license:'CC BY-SA 4.0',
  licenseURL:'https://creativecommons.org/licenses/by-sa/4.0/'});
 const result=await sources.lookup(input,{fetcher:mock.fetcher});
 assert.equal(result.results[0].imageApproved,true);
 assert.match(result.results[0].imageCredit,/Иван Петров · CC BY-SA 4\.0/);
 assert.match(result.results[0].imageSourceUrl,/commons\.wikimedia\.org\/wiki\/File:/);
});
test('rejects private questions before any network contact',async()=>{
 let calls=0;
 const result=await sources.lookup('найди мой паспорт',{fetcher:async()=>{calls++;throw Error('privacy failure')}});
 assert.equal(calls,0);assert.equal(result.status,'unavailable');
 assert.equal(sources.publicQuery('проверь личные переписки'), '');
 assert.equal(sources.publicQuery('найди фото моей мамы'), '');
 assert.equal(sources.publicQuery('найди сведения о нашем сотруднике'), '');
});
test('removes search commands without dropping the subject',()=>{
 assert.equal(sources.publicQuery('найди информацию о Краснодаре'),'Краснодаре');
 assert.equal(sources.publicQuery('в интернете фото Краснодара'),'Краснодара');
});
test('unsafe license and unavailable Commons metadata never approve photos',async()=>{
 for(const license of ['All rights reserved','CC BY-NC 4.0','']){
  const mock=provider({artist:'Автор',license,licenseURL:'https://creativecommons.org/licenses/by-nc/4.0/'});
  const result=await sources.lookup(input,{fetcher:mock.fetcher});
  assert(!result.results[0].imageApproved);
 }
});
