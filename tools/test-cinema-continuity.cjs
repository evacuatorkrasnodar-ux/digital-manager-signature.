/* The Home opening must wait for the written greeting and approved voice. */
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const source=readFileSync(join(__dirname,'../assets/seyveo-sayvi-handoff-demo.js'),'utf8');
const begin=source.indexOf('  function scheduleFlightWhenReady(){');
const end=source.indexOf('  // The Home greeting is a welcome',begin);
assert.ok(begin>=0&&end>begin,'the handoff readiness gate exists');
const gate=source.slice(begin,end);
assert.match(source,/\{text:'Привет!',kind:'welcome'/,'opening never says a saved personal name');
assert.doesNotMatch(source,/10400/,'a hard-coded 10.4-second wait cannot cut off letters');
assert.match(source,/writtenGreetingComplete=true;\s*scheduleFlightWhenReady\(\)/);
assert.match(source,/voiceMedia\.onended=\(\)=>\{\s*if\(done\)return;\s*narrationComplete=true;/);

function check({written,narration,finished=false,started=100}={}){
  const timers=[];
  let flights=0;
  const context={
    done:finished,openingStartedAt:started,introTimer:0,
    writtenGreetingComplete:written,narrationComplete:narration,
    setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},
    begin:()=>{flights++;}
  };
  vm.runInNewContext(gate+'\nscheduleFlightWhenReady();scheduleFlightWhenReady();',context);
  if(timers.length)timers[0].fn();
  return {timers,flights};
}
assert.equal(check({written:false,narration:true}).flights,0,'writing still in progress');
assert.equal(check({written:true,narration:false}).flights,0,'voice still speaking');
assert.equal(check({written:true,narration:true,finished:true}).flights,0,'already dismissed');
assert.equal(check({written:true,narration:true,started:0}).flights,0,'opening not started');
const ready=check({written:true,narration:true});
assert.equal(ready.timers.length,1,'flight scheduled exactly once');
assert.equal(ready.timers[0].ms,1250,'final sentence receives a calm pause');
assert.equal(ready.flights,1);
process.stdout.write('PASS: no name; flight waits for all letters and narration, with one calm pause.\n');
