import test from 'node:test';
import assert from 'node:assert/strict';
import {planPublicResearch,reviewPublicSources} from './research-planner.mjs';
test('fact-checking claims becomes targeted public search with a verification plan',()=>{
 const plan=planPublicResearch('А что правда Маск сделал летающую машину?',{today:'2026-10-31'});
 assert.equal(plan.allowed,true);
 assert.equal(plan.category,'fact-check');
 assert.equal(plan.searchQuery,'Маск сделал летающую машину');
 assert.equal(plan.needsFreshness,true);
 assert.equal(plan.searchedOn,'2026-10-31');
 assert.ok(plan.reviewRules.some(x=>x.includes('демонстрацию')));
});
test('legislation needs official effective-date checks even when question says today',()=>{
 const plan=planPublicResearch('Что нового в законах сегодня?');
 assert.equal(plan.category,'legal');
 assert.ok(plan.reviewRules.some(x=>x.includes('официальном')));
});
test('price research checks region and manufacturer-vs-independent claims',()=>{
 const plan=planPublicResearch('Сколько сейчас стоит новый Roadster?');
 assert.equal(plan.category,'shopping');
 assert.ok(plan.reviewRules.some(x=>x.includes('регион')));
});
test('private documents must not be sent to an external search service',()=>{
 const plan=planPublicResearch('Сэйви, найди мой паспорт');
 assert.equal(plan.allowed,false);
 assert.equal(plan.searchQuery,null);
});
test('diversifies websites and never claims snippets are verified facts',()=>{
 const plan=planPublicResearch('Правда ли Маск сделал летающую машину?',{today:'2026-10-31'});
 const result=reviewPublicSources(plan,[
  {url:'https://one.example/1',title:'one',publishedAt:'2026-10-15'},
  {url:'https://one.example/2',title:'two',publishedAt:null},
  {url:'https://one.example/3',title:'three',publishedAt:'2026-10-16'},
  {url:'https://two.example/4',title:'four',publishedAt:'2026-10-17'}
 ]);
 assert.equal(result.factChecked,false);
 assert.equal(result.distinctDomains,2);
 assert.equal(result.sourceCount,3);
 assert.equal(result.results[1].title,'four');
 assert.ok(result.notes.some(note=>note.includes('даты')));
});
test('no sources means no fabricated conclusion',()=>{
 const plan=planPublicResearch('Последние новости');
 const result=reviewPublicSources(plan,[]);
 assert.equal(result.sourceCount,0);
 assert.equal(result.distinctDomains,0);
 assert.equal(result.factChecked,false);
});

test('unshared personal questions do not become internet search queries',()=>{
 for(const question of ['Найди мой номер телефона','Какие у нас личные заметки?','Поищи мою переписку']){
  const plan=planPublicResearch(question);
  assert.equal(plan.allowed,false,question);
  assert.equal(plan.searchQuery,null,question);
 }
});
