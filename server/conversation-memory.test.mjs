import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryCommand,memoryResultText} from './conversation-memory.mjs';
test('explicit Sayvi memory command only',()=>{
 assert.deepEqual(memoryCommand('Сэй, запомни: SEYVEO произносится Сэйвео.'),{action:'add',text:'SEYVEO произносится Сэйвео.'});
 assert.deepEqual(memoryCommand('Запомни: я люблю краткие ответы'),{action:'add',text:'я люблю краткие ответы'});
 assert.equal(memoryCommand('Я люблю краткие ответы'),null);
 assert.equal(memoryCommand('Что ты запомнила?'),null);
});
test('saved confirmation never implies neural retraining',()=>{
 assert.match(memoryResultText(),/на твоём компьютере/);
 assert.match(memoryResultText({duplicate:true}),/уже сохранила/);
});
