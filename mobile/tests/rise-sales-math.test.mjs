import test from 'node:test';
import assert from 'node:assert/strict';
import {breakEvenOrders} from '../src/rise/sales-math.mjs';
test('orders needed for fixed costs',()=>assert.deepEqual(breakEvenOrders(120000,300,100),{possible:true,margin:200,orders:600,revenue:180000}));
test('no break even at nonpositive contribution',()=>assert.equal(breakEvenOrders(120000,100,100).possible,false));
test('reject invalid amounts',()=>assert.throws(()=>breakEvenOrders(-1,200,100)));
