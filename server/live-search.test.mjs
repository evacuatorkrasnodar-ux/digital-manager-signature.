import test from 'node:test';
import assert from 'node:assert/strict';
import {searchWithSources,validateLiveSearchResults} from '../server/live-search.mjs';
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
