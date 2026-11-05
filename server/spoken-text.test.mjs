import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const source=await readFile(new URL('../assets/seyveo-private-voice.js',import.meta.url),'utf8');
const start=source.indexOf(' const splitPhrases=value=>{');
const end=source.indexOf('\n const stop=()=>',start);
assert.ok(start>=0&&end>start,'splitPhrases exists in actual playback script');
const splitter=runInNewContext('(()=>{'+source.slice(start,end)+';return splitPhrases})()');
const speech=text=>Array.from(splitter(text)).join(' ');

test('Markdown formatting and emoji are not spoken',()=>{
 assert.equal(speech('🔹 **Рынок в России динамичен**'),'Рынок в России динамичен');
 assert.equal(speech('### **Роман** — привет!'),'Роман — привет!');
});

test('remove linked addresses but preserve readable words',()=>{
 assert.equal(speech('Открой [каталог товаров](https://example.com/list).'),'Открой каталог товаров.');
 assert.equal(speech('Смотри https://example.com/test'),'Смотри');
});

test('list markers and quotes are ignored',()=>{
 assert.equal(speech('- Первый замок.\n- Второй замок.'),'Первый замок. Второй замок.');
 assert.equal(speech('> У нас всё хорошо.'),'У нас всё хорошо.');
});

test('natural Russian spelling stays intact',()=>{
 assert.equal(speech('Дверной замок сломался. Роман, открой каталог.'),'Дверной замок сломался. Роман, открой каталог.');
 assert.equal(speech('Санкт-Петербург и 1С-Битрикс.'),'Санкт-Петербург и 1С-Битрикс.');
});

test('bounded parts retain every word without duplication at splits',()=>{
 const text='Дверной замок сломался. '.repeat(19).trim();
 const parts=Array.from(splitter(text));
 assert.ok(parts.length>1);
 assert.ok(parts.every(x=>x.length<=170));
 assert.equal(parts.join(' '),text);
});
