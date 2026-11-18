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

test('Completing all three examples cannot trap Home in an infinite microtask loop',async()=>{
  const source=await read('assets/living-moment.js');
  new Script(source);
  const part=(begin,end)=>{
    const from=source.indexOf(begin),to=source.indexOf(end,from+begin.length);
    assert.ok(from>=0&&to>from,`missing Home preview section: ${begin}`);
    return source.slice(from,to);
  };
  // Execute the real production functions with an exhausted training queue.
  // In the regression, rest() rearmed the empty preview and scheduled a new
  // microtask forever: three solved cards made the browser unresponsive.
  const harness=new Script(`
    let mode='idle',key='',readingUntil=0,previewSuspended=false;
    let previewSeen=false,previewDecided=false,previewRearmAt=0,pendingUpdate=false;
    const jobs=[];
    const queueMicrotask=fn=>jobs.push(fn);
    const cancel=()=>{},resetSpace=()=>{},focus=()=>{},clearRecommendation=()=>{};
    const window={getComputedStyle:()=>({getPropertyValue:()=> '1'})};
    const space={},dynamic={hidden:false,querySelector:()=>null};
    const available=()=>true,editing=()=>false,dueTasks=()=>[];
    const buildExamples=()=>0;
    const later=()=>{},hold=()=>{},gatherPreview=()=>{},tip={};
    let refreshCalls=0;
    function refresh(){refreshCalls++;if(!previewSeen)startPreview();}
    ${part('function rest(){','// Navigation never completes a card.')}
    ${part('function scheduleRefresh(){','function create(tag,klass,words){')}
    ${part('function startPreview(){','/* The Review Room displays')}
    startPreview();
    let drained=0;
    while(jobs.length&&drained<8){jobs.shift()();drained++;}
    ({drained,remaining:jobs.length,previewSeen,previewDecided,refreshCalls,mode});
  `);
  const result=harness.runInNewContext({});
  assert.equal(result.remaining,0,'refresh must settle, not queue itself forever');
  assert.equal(result.refreshCalls,1);
  assert.equal(result.previewSeen,true);
  assert.equal(result.previewDecided,true);
  assert.equal(result.mode,'idle');
});
