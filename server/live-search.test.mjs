import test from 'node:test';
import assert from 'node:assert/strict';
import {searchWithSources,validateLiveSearchResults,makeBraveSearchProvider} from '../server/live-search.mjs';
test('offline state is honest without a connected search provider',async()=>{
 const result=await searchWithSources('Новости компании');
 assert.equal(result.status,'unavailable');assert.deepEqual(result.results,[]);
});
test('rejects unsafe sources and never invents content',async()=>{
 const result=await searchWithSources('Летающие машины',{search:async()=>[
  {title:'Подделка',snippet:'Недостоверный адрес',url:'javascript:alert(1)'},
  {title:'Публикация',snippet:'Проверяемая информация',url:'https://example.org/news',imageUrl:'http://example.org/photo.png'}
 ]});
 assert.equal(result.results.length,1);
 assert.equal(result.results[0].imageUrl,null);
 assert.equal(result.results[0].url,'https://example.org/news');
});
test('requires nonempty source title and excerpt',()=>{
 assert.deepEqual(validateLiveSearchResults([{title:'',snippet:'X',url:'https://example.org'}]),[]);
});

test('photos require explicit approval and a visible credit',()=>{
 const base={title:'Материал',snippet:'Текст источника',url:'https://example.org/story',
  imageUrl:'https://images.example.org/photo.jpg'};
 const unapproved=validateLiveSearchResults([base])[0];
 assert.equal(unapproved.imageUrl,null);
 const withoutCredit=validateLiveSearchResults([{...base,imageApproved:true}])[0];
 assert.equal(withoutCredit.imageUrl,null);
 const approved=validateLiveSearchResults([{...base,imageApproved:true,imageCredit:'Фото: издатель'}])[0];
 assert.equal(approved.imageUrl,'https://images.example.org/photo.jpg');
 assert.equal(approved.imageCredit,'Фото: издатель');
});

test('Brave provider sends only the public query and keeps key in server header',async()=>{
 let invoked=0;
 const provider=makeBraveSearchProvider({apiKey:'server-test-token',fetcher:async(url,options)=>{
  invoked++;
  const target=new URL(url);
  assert.equal(target.hostname,'api.search.brave.com');
  assert.equal(target.pathname,'/res/v1/web/search');
  assert.equal(target.searchParams.get('q'),'правда ли Tesla Roadster летает');
  assert.equal(options.headers['x-subscription-token'],'server-test-token');
  assert.equal(options.method,'GET');
  assert.doesNotMatch(url,/server-test-token/);
  assert.equal(options.redirect,'error');
  return {ok:true,json:async()=>({web:{results:[{
   title:'Roadster',url:'https://example.org/roadster',description:'Обзор демонстрации',page_age:'2026-10-15'}]}})};
 }});
 const response=await searchWithSources('правда ли Tesla Roadster летает',{search:provider});
 assert.equal(invoked,1);
 assert.equal(response.status,'results');
 assert.equal(response.results[0].title,'Roadster');
 assert.equal(response.results[0].publishedAt,'2026-10-15');
 assert.equal(response.results[0].imageUrl,null);
});
test('provider is unavailable without a server credential',()=>{
 assert.equal(makeBraveSearchProvider({apiKey:''}),null);
});
