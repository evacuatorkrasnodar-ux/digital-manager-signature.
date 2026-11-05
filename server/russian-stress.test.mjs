import test from 'node:test';
import assert from 'node:assert/strict';
import {previewRussianStress,russianStressPreviewEnabled} from './russian-stress.mjs';

test('different meanings get different stress marks',()=>{
 assert.match(previewRussianStress('Старинный замок.'),/за́мок/);
 assert.match(previewRussianStress('Дверной замок.'),/замо́к/);
 assert.match(previewRussianStress('Пшеничная мука.'),/мука́/);
 assert.match(previewRussianStress('Сильная мука.'),/му́ка/);
 assert.match(previewRussianStress('Географический атлас.'),/а́тлас/);
 assert.match(previewRussianStress('Шёлковый атлас.'),/атла́с/);
});
test('unknown context remains exactly unchanged',()=>{
 assert.equal(previewRussianStress('Замок закрыт.'),'Замок закрыт.');
 assert.equal(previewRussianStress('Открой замок.'),'Открой замок.');
});
test('pronunciation preview cannot silently alter approved voice path',()=>{
 assert.equal(russianStressPreviewEnabled({}),false);
 assert.equal(russianStressPreviewEnabled({SEYVEO_RU_STRESS_PREVIEW:'0'}),false);
 assert.equal(russianStressPreviewEnabled({SEYVEO_RU_STRESS_PREVIEW:'1'}),true);
});
