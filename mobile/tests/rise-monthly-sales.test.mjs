import test from 'node:test';
import assert from 'node:assert/strict';
import {salesProgress} from '../src/rise/sales-progress.mjs';
test('monthly contribution and remaining fixed costs',()=>{
 const rows=[{soldOn:'2026-10-02',revenue:100,cost:20},{soldOn:'2026-09-30',revenue:400,cost:50}];
 const month='2026-10';
 const selected=rows.filter(row=>row.soldOn?.startsWith(month+'-'));
 const total=selected.reduce((a,row)=>({revenue:a.revenue+row.revenue,cost:a.cost+row.cost}),{revenue:0,cost:0});
 assert.deepEqual(salesProgress(total.revenue,total.cost,100),{contribution:80,remaining:20});
});
