import test from 'node:test';
import assert from 'node:assert/strict';
import {compareSalesMonths} from '../src/rise/sales-progress.mjs';
test('detect increased costs outpacing revenue',()=>{
 const result=compareSalesMonths({orders:4,revenue:500,cost:400},{orders:3,revenue:400,cost:200});
 assert.equal(result.change,-100);
 assert.match(result.advice,/затраты/);
});
test('do not infer trend without sales in both months',()=>{
 const result=compareSalesMonths({orders:0,revenue:0,cost:0},{orders:3,revenue:300,cost:100});
 assert.match(result.advice,/данные/);
});
