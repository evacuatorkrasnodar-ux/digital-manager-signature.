/* Run: node --test server/russian-language.test.mjs
 * No Ollama, network or voice model required.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {russianLanguageContext,decodeRussianKeyboard,RUSSIAN_GLOSSARY_SIZE} from './russian-language.mjs';
import {russianWritingMode,inspectRussianText} from './russian-writing.mjs';

test('colloquial phrases, inflected slang and ambiguous tone',()=>{
 assert.match(russianLanguageContext('Брат, не вывожу, ну такое'),/не вывожу/);
 assert.match(russianLanguageContext('Это без рофла!'),/не шучу/);
 assert.match(russianLanguageContext('Я чиллю, а он рофлит'),/чиллить/);
 assert.match(russianLanguageContext('Кринжанул и ушёл'),/кринж/);
 assert.ok(RUSSIAN_GLOSSARY_SIZE>=100);
});
test('decode accidental keyboard layout without changing English text',()=>{
 assert.equal(decodeRussianKeyboard('f vj;yj tq pfkj;bnm dtcm heccrbq zpsr'),'а можно ей заложить весь русский язык');
 assert.equal(decodeRussianKeyboard('hello github'),null);
 assert.equal(decodeRussianKeyboard('hi'),null);
 assert.equal(decodeRussianKeyboard('Привет, hi'),null);
});
test('business mode requires writing intention',()=>{
 assert.equal(russianWritingMode('Найди мне клиента, дружище'),'conversation');
 assert.equal(russianWritingMode('Сотрудник сегодня опоздал'),'conversation');
 assert.equal(russianWritingMode('Напиши письмо клиенту'),'business');
 assert.equal(russianWritingMode('Исправь грамматику в тексте'),'editing');
});
test('writing diagnostics do not modify source text',()=>{
 const text='Вообщем это было было неожиданно';
 const report=inspectRussianText(text);
 assert.ok(report.issues.some(x=>x.type==='repeat'));
 assert.ok(report.issues.some(x=>x.type==='possible-typo'));
 assert.equal(text,'Вообщем это было было неожиданно');
});
