import test from 'node:test';
import assert from 'node:assert/strict';
import {financeSummary} from '../src/rise/finance.mjs';
test('RISE calculates startup and three-month safety reserve',()=>{
 assert.deepEqual(financeSummary([{amount:1000,kind:'startup'},{amount:200,kind:'monthly'}]),{startup:1000,monthly:200,reserve:600,months:3,total:1600});
});
test('RISE rejects unsafe money values',()=>{
 assert.throws(()=>financeSummary([{amount:-5,kind:'monthly'}]));
 assert.throws(()=>financeSummary([{amount:1.5,kind:'startup'}]));
 assert.throws(()=>financeSummary([],25));
});
