import test from 'node:test';
import assert from 'node:assert/strict';
import {plan,sumBudget} from '../src/rise/plan.mjs';
test('RISE has startup steps',()=>assert.equal(plan.length,5));
test('draft sums and invalid amounts',()=>{assert.equal(sumBudget([100,250]),350);assert.throws(()=>sumBudget([-1]));assert.throws(()=>sumBudget([1.25]));});
