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
