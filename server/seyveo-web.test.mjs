import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeyveoWebProvider} from './seyveo-web.mjs';
test('keyless public source lookup returns attributable, bounded results',async()=>{
 const provider=createSeyveoWebProvider({fetcher:async(url,options)=>{
  const target=new URL(url);
  assert.equal(target.hostname,'ru.wikipedia.org');
  assert.equal(target.searchParams.get('action'),'query');
  assert.equal(target.searchParams.get('srlimit'),'6');
  assert.equal(options.redirect,'error');
  return {ok:true,json:async()=>({query:{search:[{
   title:'История компьютера',snippet:'Описание <span class="searchmatch">истории</span> компьютера',
   timestamp:'2026-10-01T12:00:00Z'}]}})};
 }});
 const results=await provider('история компьютера');
 assert.equal(results.length,1);
 assert.equal(results[0].url,'https://ru.wikipedia.org/wiki/'+encodeURIComponent('История_компьютера'));
 assert.equal(results[0].snippet,'Описание истории компьютера');
 assert.equal(results[0].publishedAt,'2026-10-01');
});
test('no arbitrary remote host or private conversation details',async()=>{
 let request='';
 const provider=createSeyveoWebProvider({fetcher:async url=>{
  request=url;
  return {ok:true,json:async()=>({query:{search:[]}})};
 }});
 await provider('Машинное обучение');
 assert.equal(new URL(request).hostname,'ru.wikipedia.org');
 assert.equal(new URL(request).searchParams.get('srsearch'),'Машинное обучение');
});
