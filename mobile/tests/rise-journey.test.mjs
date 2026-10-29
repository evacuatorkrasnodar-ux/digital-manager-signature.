import test from 'node:test';
import assert from 'node:assert/strict';
import {nextStep,questions} from '../src/rise/journey.mjs';
test('rise begins with the idea',()=>assert.equal(nextStep().key,'idea'));
test('rise advances through the business questions',()=>{
 const answers={};
 for(const [key] of questions){assert.equal(nextStep(answers).key,key);answers[key]='test'}
 assert.equal(nextStep(answers).key,'plan');
});
