import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';

const read=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');

test('Returning from training cards does not restart Home reconciliation on every visual mutation',async()=>{
  const source=await read('assets/seyveo-sayvi-handoff-demo.js');
  new Script(source);
  assert.match(source,/if\(emptySyncTimer&&!urgent\)return/);
  assert.match(source,/attributeFilter:\['hidden'\]/);
  assert.match(source,/if\(next===lastHomeStateFlags\)return/);
  assert.doesNotMatch(source,/attributeFilter:\['hidden','class'\]/);
});

test('Review indicator does not rewrite unchanged hidden attributes on every tick',async()=>{
  const source=await read('assets/seyveo-review-cards.js');
  new Script(source);
  assert.match(source,/countUnderlay\.hidden!==\(total===0\)/);
  assert.match(source,/greetingSubline\.hidden!==\(total>0\)/);
});
