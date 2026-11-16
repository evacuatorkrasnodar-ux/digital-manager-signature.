/* Run live smoke with SEYVEO_BROADCAST_BROWSER=1 and a local server at :8799. */
'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const source=readFileSync(join(root,'assets/seyveo-my-broadcast.js'),'utf8');
const style=readFileSync(join(root,'assets/seyveo-my-broadcast.css'),'utf8');
const cinema=readFileSync(join(root,'assets/seyveo-sayvi-handoff-demo.js'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');
assert.match(index,/seyveo-my-broadcast\.js\?v=4[\s\S]*seyveo-sayvi-handoff-demo\.js\?v=93/,
 'The preference flag must initialize before the original cinematic');
assert.match(source,/root\.classList\.add\('sv-broadcast-onboarding'\)/,
 'First meeting is a deliberate one-time state');
assert.match(cinema,/return root\.classList\.contains\('sv-broadcast-onboarding'\);/,
 'Initial travel to the dock is requested by the onboarding');
assert.match(cinema,/!alreadySeen\|\|\s*\(typeof document!=='undefined'&&\s*document\.documentElement\.classList\.contains\('sv-broadcast-onboarding'\)/,
 'An already-used installation still plays the one-time introduction');
assert.match(cinema,/!root\.classList\.contains\('sv-broadcast-onboarding'\)/,
 'The Home sphere waits until the introduction ends');
assert.match(source,/window\.dispatchEvent\(new Event\('seyveo:broadcast-setup-complete'\)\)/,
 'Finishing preferences resumes the original Home sphere controller');
assert.match(source,/root\.classList\.add\('sv-broadcast-first-return'\)/,
 'The original sphere returns once even if demonstration cards are waiting');
assert.match(cinema,/function syncHomeCardPresence\(\)/,
 'The original sphere stays clickable alongside one featured Home card');
assert.match(source,/const PROFILE_KEY='seyveo-first-acquaintance-v1'/,
 'The first meeting and existing profile editor share one data record');
assert.match(source,/introStep==='name'\?'Привет! Давай знакомиться'/,
 'First introduction includes a short personal-name step');
assert.match(source,/read\(SEEN_KEY\)!=='1'/,
 'The menu never becomes a recurring interruption');
assert.match(source,/localStorage\.setItem\(key,value\)/,
 'Interests stay local to the device');
assert.match(source,/navigator\.wakeLock\?\.request/,
 'The optional keep-awake feature is guarded by capability support');
assert.match(source,/!navigator\.wakeLock\?\.request/,
 'Unsupported mobile wake locks are not treated as success');
assert.match(source,/SEYVEO_MUSIC\?\.state/,
 'The broadcast reuses local music instead of claiming a streaming catalog');
assert.match(source,/Проверенные новости пока не подключены/,
 'Live news cannot be invented without a trusted feed');
assert.match(style,/#svBroadcastPreferences\[hidden\]/,
 'The optional sheet can be completely removed from the visible Home');

async function browserSmoke(){
 const {chromium}=require('playwright');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',
  headless:true,args:['--no-sandbox','--disable-gpu']});
 const context=await browser.newContext({viewport:{width:390,height:844},
  reducedMotion:'reduce',colorScheme:'light'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 try{
  await page.goto('http://127.0.0.1:8799/index.html?sayvi-intro=1',
   {waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#svBroadcastPreferences:not([hidden])').waitFor({timeout:35000});
  assert.equal(await page.locator('.sv-broadcast-topic').count(),10);
  assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('sv-broadcast-onboarding')),true);
  await page.locator('#svBroadcastName').fill('Роман');
  await page.locator('#svBroadcastSave').click();
  await page.locator('input[value="animals"]').uncheck();
  await page.locator('input[value="science"]').check();
  await page.locator('#svBroadcastSave').click();
  await page.locator('[data-sv-business="later"]').click();
  await page.locator('#svBroadcastSave').click();
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#svBroadcastPreferences').isHidden(),true);
  assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('sv-broadcast-onboarding')),false);
  const prefs=await page.evaluate(()=>window.SEYVEO_BROADCAST?.getPreferences());
  assert.ok(prefs?.topics.includes('science'),'New topic is stored');
  assert.ok(!prefs?.topics.includes('animals'),'Deselected topic is removed');
  assert.equal(await page.evaluate(()=>localStorage.getItem('seyveo.my-broadcast.onboarding-seen.v2')),'1');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('seyveo-first-acquaintance-v1')).name),'Роман');
  await page.waitForTimeout(2700);
  const canShow=await page.evaluate(()=>document.documentElement.classList.contains('sv-home-empty-sphere'));
  if(canShow){
   assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('sv-home-empty-arrived')),true,
    'The sphere returns from the dock after the menu');
   await page.evaluate(()=>window.SEYVEO_BROADCAST.start());
   assert.equal(await page.locator('#svBroadcastStage').isVisible(),true);
   await page.locator('#svBroadcastNext').click();
   await page.locator('#svBroadcastSettings').click();
   assert.equal(await page.locator('#svBroadcastPreferences').isVisible(),true);
   await page.locator('#svBroadcastLater').click();
   assert.equal(await page.locator('#svBroadcastStage').isHidden(),true);
  }
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForTimeout(900);
  assert.equal(await page.locator('#svBroadcastPreferences').isHidden(),true,
   'Onboarding does not repeat after refresh');
  assert.equal(errors.length,0,'No uncaught errors: '+errors.join('; '));
  console.log('PASS: real Chromium first-run topic selection, persistence and broadcast controls.');
 }finally{await browser.close()}
}
if(process.env.SEYVEO_BROADCAST_BROWSER==='1')browserSmoke().catch(error=>{
 console.error(error);process.exitCode=1;
});
else console.log('PASS: intro handoff, local preferences, honest news and opt-in morning show.');
