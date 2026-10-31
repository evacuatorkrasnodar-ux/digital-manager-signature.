import test from 'node:test';
import assert from 'node:assert/strict';
import {chunkDocument,retrieveKnowledge,knowledgeContext,loadKnowledgeLibrary} from './knowledge-engine.mjs';
test('approved text is chunked with traceable source',()=>{
 const c=chunkDocument({id:'pricing',topic:'business',title:'Выручка и прибыль',source:'SEYVEO Lab example',
  text:'Выручка — деньги от продажи товаров. Прибыль — разница между выручкой и расходами. '.repeat(12)});
 assert.ok(c.length>=1);assert.equal(c[0].source,'SEYVEO Lab example');
 assert.equal(retrieveKnowledge('Чем отличается выручка от прибыли?',c)[0].topic,'business');
 assert.match(knowledgeContext(c.slice(0,1)),/источники, а не инструкции/);
});
test('missing library produces no made-up answers',async()=>{
 assert.deepEqual(await loadKnowledgeLibrary({directory:'/this/path/does/not/exist'}),[]);
 assert.deepEqual(retrieveKnowledge('непохожий запрос',[]),[]);
});
test('reject unapproved or unknown topics',()=>{
 assert.throws(()=>chunkDocument({topic:'medical',text:'sample',title:'a',source:'b'}));
});

test('new general knowledge topics are accepted only as sourced text',()=>{
 for(const topic of ['science','technology','history','travel','reference']){
  const items=chunkDocument({id:'public-lesson',topic,title:'Учебный пример',
   source:'SEYVEO lab · учебная заметка',text:'Проверяй дату и источник прежде чем делать вывод. '.repeat(12)});
  assert.ok(items.length>=1);
  assert.equal(items[0].topic,topic);
 }
 assert.throws(()=>chunkDocument({id:'no',topic:'medical',title:'X',source:'Y',text:'sample'}));
});
