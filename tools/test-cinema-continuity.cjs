/* SEYVEO cinema handoff: empty Home, dock-first departure, weather reveal.
 * Static control-flow checks. Real iPhone Safari motion still needs device QA.
 */
'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const source=readFileSync(join(__dirname,'../assets/seyveo-sayvi-handoff-demo.js'),'utf8');
const css=readFileSync(join(__dirname,'../assets/seyveo-sayvi-handoff-demo.css'),'utf8');
const brief=readFileSync(join(__dirname,'../assets/seyveo-weather-brief.js'),'utf8');
const feed=readFileSync(join(__dirname,'../assets/seyveo-agenda-weather.js'),'utf8');
const dockCss=readFileSync(join(__dirname,'../assets/seyveo-dock-active-glass.css'),'utf8');
const homeDockCss=readFileSync(join(__dirname,'../assets/seyveo-home-dock-preview.css'),'utf8');
const section=(begin,end)=>{
 const a=source.indexOf(begin),b=source.indexOf(end,a+begin.length);
 assert.ok(a>=0&&b>a,'Cinema stage exists: '+begin);
 return source.slice(a,b);
};

const flight=section('  function begin(){','  function runOpening(');
assert.match(flight,/if\(!shouldDockHome\(\)\)\{finish\(\{stayHome:true\}\);return;\}/,
 'Empty Home retains the full-size original Sayvi');
assert.match(flight,/growDock\(180\*speed,3650\*speed\)/,
 'Pearl dock opens before the miniature lands');
assert.match(flight,/duration:4200\*speed/,'Full sphere has a continuous dock flight');

const finish=section('  function finish(','  function begin(){');
assert.match(finish,/root\.classList\.add\('sv-home-empty-at-launch','sv-home-empty-sphere','sv-home-empty-arrived'\)/,
 'No-card launch retains the three-slot dock without a full-to-short flash');
assert.match(finish,/if\(spark\)root\.classList\.add\('sv-sayvi-handoff-arrived'\)/,
 'Dock landing waits for the end of its flight');

const emptyReturn=section('  function enterEmptySphere(){','  function leaveEmptySphere(');
assert.match(emptyReturn,/duration:1540/,'Original Sayvi rises from the miniature');
assert.match(emptyReturn,/motion\.finished\.then\(complete\)/,
 'Home arrival is tied to completion of the actual animation');
assert.match(emptyReturn,/emptyArrivalGuardTimer=setTimeout\(complete,1900\)/,
 'Interrupted Safari animation cannot strand weather behind arrival gate');
assert.match(emptyReturn,/if\(reduceMotion\(\)\|\|!from\.width\|\|!to\.width\|\|typeof orb\.animate!=='function'\)\{\s*complete\(\);return;/,
 'Reduced motion or unavailable animation still completes weather reveal');
assert.match(emptyReturn,/root\.classList\.add\('sv-home-empty-arrived'\)/,
 'Weather gate opens only after the large sphere arrives');
assert.match(emptyReturn,/dispatchEvent\(new Event\('seyveo:home-sayvi-arrived'\)\)/,
 'Landing invites the weather feed to recover if needed');
assert.match(css,/:root\.sv-home-empty-sphere\.sv-home-empty-arriving #homePage #svSayviHomeWeather\{\s*opacity:0!important/,
 'Weather remains invisible during the flight');
assert.match(css,/:root\.sv-home-empty-sphere\.sv-home-empty-arrived:not\(\.sv-music-ambient\) #homePage #svSayviHomeWeather:not\(\[hidden\]\)\{\s*display:inline-flex!important;\s*visibility:visible!important/,
 'Weather appears in the completed-arrival state');
assert.match(brief,/button\.hidden=false;/,
 'Missing weather feed shows an honest fallback instead of a blank Home');
assert.match(brief,/window\.addEventListener\('seyveo:home-sayvi-arrived'/,
 'Weather retries when Sayvi returns to an empty Home');
assert.match(brief,/Number\(source\.getUpdatedAt\?\.\(\)\)\|\|0/,
 'Weather reads live feed freshness without depending on Safari localStorage');
assert.match(feed,/getUpdatedAt:\(\)=>updatedAt/,
 'Source exposes validated refresh timestamp to the Home weather line');
assert.match(dockCss,/--sv-indicator-depth:0px;\s*--sv-indicator-scale:1;\s*box-shadow:none!important/,
 'Dock selection does not sink on a tap');
assert.match(dockCss,/> #navManage#navManage:active\{\s*transform:none!important;\s*box-shadow:none!important/,
 'Search button does not compress on a tap');
assert.match(homeDockCss,/background:radial-gradient\(ellipse 100% 90% at 50% 50%,rgba\(10,132,255,\.09\)/,
 'Active search receives a subtle glow, not a deep inset');
assert.match(css,/:root\.sv-home-empty-sphere\.sv-home-empty-route-exit[\s\S]*?animation:sv-music-ambient-dock-expand 460ms/,
 'Route departure expands the original dock promptly');

assert.match(source,/\{text:'Привет!',kind:'welcome'/,'Welcome remains handwritten');
assert.match(source,/No automatic spoken welcome/,'No unsolicited voice playback');
console.log('PASS: empty Home, dock-first flight, returned sphere, delayed weather, route exit.');
