import test from 'node:test';
import assert from 'node:assert/strict';
import {planSeyveoAction} from '../src/core/seyveoActionRouter.mjs';
test('live data is not generated offline',()=>{
 assert.equal(planSeyveoAction('Какая погода сегодня').route,'network-required');
});
test('local fallback stays available',()=>{
 assert.equal(planSeyveoAction('Расскажи историю').route,'local-help');
});
