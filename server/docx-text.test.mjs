import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocx} from './document-export.mjs';
import {extractDocxText} from './docx-text.mjs';

test('SEYVEO exported DOCX opens locally without Python',()=>{
 const file=createDocx('Заявление\nПрошу предоставить отпуск с 16 декабря.\nФИО: [ФИО]');
 const result=extractDocxText(file);
 assert.equal(result.format,'docx');
 assert.equal(result.truncated,false);
 assert.match(result.text,/Заявление/);
 assert.match(result.text,/16 декабря/);
 assert.match(result.text,/ФИО: \[ФИО\]/);
});

test('decodes escaped XML from Word text',()=>{
 const file=createDocx('Заявление\nФИО & <проверка> "текст"');
 const result=extractDocxText(file);
 assert.match(result.text,/ФИО & <проверка> "текст"/);
});

test('limits long document preview',()=>{
 const file=createDocx('Заявление\n'+('Длинный текст документа. '.repeat(490)));
 const result=extractDocxText(file);
 assert.equal(result.truncated,true);
 assert.equal(result.text.length,5200);
});

test('rejects invalid ZIP data without executing files',()=>{
 assert.throws(()=>extractDocxText(Buffer.from('не документ')));
});
