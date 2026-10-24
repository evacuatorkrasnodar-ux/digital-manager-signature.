/* SEYVEO Weather · pure forecast, permission and health safeguard tests.
 * No user's location or live weather is accessed by this test. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../assets/weather-core.js');
const provider=require('../assets/weather-provider.js');
const base=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(base,x),'utf8');
const html=read('index.html'),ui=read('assets/weather-presence.js'),style=read('assets/weather-ink.css'),roadmap=read('assets/management.js');
function payload({temp=20,feel=19,pressure=1008,code=3,wind=10,rain=10}={}){
 return {current:{time:'2026-10-24T12:15',temperature_2m:temp,apparent_temperature:feel,
  relative_humidity_2m:50,pressure_msl:pressure,weather_code:code,wind_speed_10m:wind},
  hourly:{time:['2026-10-24T12:00','2026-10-24T13:00','2026-10-24T14:00','2026-10-24T15:00'],
   precipitation_probability:[rain,rain,rain,rain]}};
}
const w=core.parse(payload());
assert.equal(w.temp,20);assert.equal(w.pressure,1008);assert.equal(w.conditions,'облачно');
assert.match(core.detail(w),/атм\. давление 1008 гПа/);
assert.equal(core.signal(w),null,'Do not predict illness from ordinary conditions');
assert.equal(core.signal(core.parse(payload({temp:34})))?.kind,'heat');
assert.equal(core.signal(core.parse(payload({temp:-16})))?.kind,'cold');
assert.equal(core.signal(core.parse(payload({wind:70})))?.kind,'wind');
assert.match(core.signal(core.parse(payload({temp:34}))).health,/не меняйте лечение самостоятельно/);
assert.match(core.signal(core.parse(payload({temp:-16}))).health,/по погоде его значение определить нельзя/);
assert.equal(core.parse({current:{temperature_2m:null,time:'now'}}),null,'Invalid temperature rejected');
assert.equal(core.parse({}),null);
assert.match(core.detail(core.parse(payload({rain:80}))),/осадки до 80%/);
const api=provider.urlFor(50.1234,30.5678);
assert.equal(new URL(api).searchParams.get('latitude'),'50.12');
assert.equal(new URL(api).searchParams.get('longitude'),'30.57');
assert.equal(new URL(api).searchParams.get('timezone'),'auto');
assert.equal(new URL(api).searchParams.get('current').includes('pressure_msl'),true);
assert.throws(()=>provider.urlFor(NaN,20),RangeError);
assert.throws(()=>provider.urlFor(95,20),RangeError);
assert.match(provider.attribution,/Open-Meteo/);
assert.match(ui,/navigator\.geolocation\.getCurrentPosition/,'Only browser permission for geolocation');
assert.match(ui,/enable\.addEventListener\('click',requestLocation\)/,'Never prompt location on page load');
assert.match(ui,/Math\.round\(pos\.coords\.latitude\*100\)\/100/,'Raw GPS location not persisted');
assert.match(ui,/localStorage\.removeItem\(KEY\)/,'The user can revoke stored weather location');
assert.match(ui,/document\.addEventListener\('visibilitychange'/,'Auto-refresh only when visible');
assert.match(ui,/INTERVAL=45\*60\*1000/,'Forecast refresh has reasonable cadence');
assert.match(ui,/document\.getElementById\('pwHealth'\)/,'Health integration uses existing component');
assert.match(ui,/const health=core\.signal\(latest\)/,'Alert from bounded, conservative thresholds');
assert.doesNotMatch(ui,/localStorage\.setItem\([^\n]*pressure|localStorage\.setItem\([^\n]*health/,'No medical values cached');
assert.match(ui,/body\.append\(attribution\)/,'Required source attribution is visible next to forecast');
assert.match(style,/border:0;border-radius:0;box-shadow:none/,'Frameless open ink, no added gray capsule');
assert.equal((html.match(/id="orbCluster"/g)||[]).length,1,'Main orb stays single');
assert.equal((html.match(/<footer class="dock"/g)||[]).length,1,'Main dock stays single');
for(const name of ['weather-core.js','weather-provider.js','weather-presence.js','weather-ink.css']){
 assert.ok(html.includes('assets/'+name+'?v=1'),'Modular asset imported: '+name);
}
assert.ok(html.indexOf('weather-core.js')<html.indexOf('weather-provider.js'));
assert.ok(html.indexOf('weather-provider.js')<html.indexOf('weather-presence.js'));
for(const id of ['sayvi_weather','sayvi_weather_health','weather_precision','modular_architecture']){
 assert.ok(roadmap.includes("['"+id+"'"),'Saved development-roadmap idea: '+id);
}
(async()=>{
 let called='',credentials='';
 const out=await provider.forecast(50.12,30.57,{fetchImpl:async(url,options)=>{
  called=url;credentials=options.credentials;
  return {ok:true,json:async()=>payload()};
 }});
 assert.ok(called.startsWith('https://api.open-meteo.com/v1/forecast?'));
 assert.equal(credentials,'omit');
 assert.equal(out.current.temperature_2m,20);
 await assert.rejects(provider.forecast(50.12,30.57,{fetchImpl:async()=>({ok:false})}));
 console.log('PASS SEYVEO Weather: permission-first, source attribution, timed refresh, genuine data and cautious health context.');
})().catch(e=>{console.error(e);process.exitCode=1});
