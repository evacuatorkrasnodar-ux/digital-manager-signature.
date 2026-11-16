/* Opening another section must preserve the current cards and their actions. */
'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const source=readFileSync(join(__dirname,'../assets/living-moment.js'),'utf8');
const begin=source.indexOf('function suspendPreview(){');
const end=source.indexOf('function scheduleRefresh(){',begin);
assert.ok(begin>=0&&end>begin,'Card suspension and resume logic must remain inspectable');
const functions=source.slice(begin,end);

function scenario({mode='preview',hidden=false,disappearing=false,atHome=false,gathered=true}={}){
 const timers=[],record=[];
 const space={hidden,classList:{contains:name=>name==='lm-disappear'?disappearing:name==='lm-gather'?gathered:false}};
 const context={mode,space,previewSuspended:false,
  cancel:()=>record.push('cancel'),available:()=>atHome,
  later:(fn,delay)=>timers.push({fn,delay}),gatherPreview:()=>record.push('gather')};
 vm.runInNewContext(functions+'\nglobalThis.controls={suspendPreview,resumePreview};',context);
 return Object.assign(context,{record,timers});
}
const card=scenario();
assert.equal(card.controls.suspendPreview(),true,'A visible preview can be suspended');
assert.equal(card.previewSuspended,true,'The card queue is retained');
assert.equal(card.record[0],'cancel','Offscreen entrance timers stop');
assert.equal(card.controls.resumePreview(),true,'Hidden route keeps the pause in place');
assert.equal(card.previewSuspended,true,'No offscreen recreation');
card.available=()=>true;
assert.equal(card.controls.resumePreview(),true);
assert.equal(card.previewSuspended,false,'Home resumes the same card queue');
assert.equal(card.timers.length,0,'Already gathered cards keep their original layout');
assert.equal(scenario({mode:'idle'}).controls.suspendPreview(),false,'Empty view is not invented');
assert.equal(scenario({disappearing:true}).controls.suspendPreview(),false,'Genuine card decision is not reversed');
const entering=scenario({gathered:false,atHome:true});
entering.controls.suspendPreview();entering.controls.resumePreview();
assert.equal(entering.timers.length,1,'Interrupted entrance continues on return');
entering.timers[0].fn();
assert.equal(entering.record.includes('gather'),true,'Original secondary cards become visible');
assert.match(source,/if\(!atHome&&\(previewSuspended\|\|suspendPreview\(\)\)\)return/,
 'Hash navigation suspends without deciding a card');
assert.match(source,/if\(atHome&&previewSuspended\)/,
 'Returning Home resumes the original card instead of creating an empty screen');
console.log('PASS: navigation preserves all current Home cards and their layout.');
