import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';
import {adaptOriginalHome} from '../real-app-local.mjs';

const read=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');

test('Home reserves the async weather row before rendering Sayvi',async()=>{
  const [home,weather,styles]=await Promise.all([
    read('assets/seyveo-sayvi-handoff-demo.js'),
    read('assets/seyveo-weather-brief.js'),
    read('assets/seyveo-sayvi-handoff-demo.css')
  ]);
  assert.match(home,/cluster\.insertAdjacentElement\('afterend',slot\)/);
  assert.match(weather,/if\(slot\)slot\.appendChild\(button\)/);
  assert.match(styles,/\.sv-home-weather-slot\{[\s\S]*?height:40px/);
  assert.doesNotMatch(styles,/transition:width 1\.2s/);
  new Script(home);
  new Script(weather);
});

test('Launch logo waits for Home scene, and local voice bridge survives',async()=>{
  const [html,brand,homeCss,homeJs]=await Promise.all([
    read('index.html'),read('assets/brand-signature.css'),
    read('assets/seyveo-sayvi-handoff-demo.css'),
    read('assets/seyveo-sayvi-handoff-demo.js')
  ]);
  assert.match(html,/seyveo:cinema-opening/);
  assert.match(html,/seyveo:cinema-finished/);
  assert.match(html,/homeLaunchLogoShown=showBrandSignature\('launch'\)/);
  assert.match(html,/sv-home-launch-logo-visible/);
  assert.match(brand,/sv-sayvi-home-cards:not\(\.sv-home-launch-logo-visible\)/);
  assert.match(brand,/#homePage #signal\.is-pearl \.brand-lockup\{\s*transform:scale\(1\)/);
  assert.match(brand,/\.brand-mark\{\s*animation:cinema-mark 5\.4s/);
  assert.match(brand,/\.brand-word\{\s*animation:cinema-word 5\.4s/);
  assert.match(brand,/\.brand-specialty\{\s*animation:cinema-specialty 5\.4s/);
  assert.match(homeCss,/sv-home-cinema-orb \.78s/);
  assert.match(homeCss,/sv-home-cinema-card-rise 1\.4s \.72s/);
  assert.match(homeCss,/sv-home-queue-preview\{[\s\S]*?animation-delay:calc\(1\.15s/);
  assert.match(homeJs,/root\.classList\.add\('sv-home-cinematic-intro'\)/);
  assert.match(homeJs,/remove\('sv-home-cinematic-intro'\),3100/);
  const adapted=adaptOriginalHome(html);
  assert.match(adapted,/window\.SEYVEO_LOCAL_VOICE_BRIDGE=phrase/);
  for(const [,code] of adapted.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)){
    if(code.trim())new Script(code);
  }
});
