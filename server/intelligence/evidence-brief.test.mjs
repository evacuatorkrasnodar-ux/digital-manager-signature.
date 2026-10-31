import test from 'node:test';
import assert from 'node:assert/strict';
import {composeEvidenceBrief} from './evidence-brief.mjs';
test('empty findings never produce invented facts',()=>{
 const result=composeEvidenceBrief({results:[],distinctDomains:0,category:'fact-check'});
 assert.equal(result.confidence,'insufficient');
 assert.deepEqual(result.cited,[]);
});
test('contrasting sources are presented as excerpts not confirmed truth',()=>{
 const result=composeEvidenceBrief({results:[
  {title:'Источник A',snippet:'Производитель сообщил о тестах.',url:'https://a.example/',publishedAt:'2026-10-15'},
  {title:'Источник B',snippet:'Журналисты описали демонстрацию.',url:'https://b.example/',publishedAt:'2026-10-16'}
 ],distinctDomains:2,category:'fact-check'});
 assert.equal(result.confidence,'unverified');
 assert.match(result.answer,/нескольких источников/);
 assert.match(result.answer,/недостаточно, чтобы подтвердить/);
 assert.match(result.answer,/\[1\]/);
 assert.match(result.answer,/\[2\]/);
 assert.equal(result.cited.length,2);
});
test('legal queries disclaim official effective-date check',()=>{
 const out=composeEvidenceBrief({results:[{title:'Тема',snippet:'Текст',url:'https://source.example'}],distinctDomains:1,category:'legal'});
 assert.match(out.answer,/официальными документами/);
});
