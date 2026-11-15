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
  const html=await read('index.html');
  assert.match(html,/seyveo:cinema-opening/);
  assert.match(html,/seyveo:cinema-finished/);
  assert.match(html,/homeLaunchLogoShown=showBrandSignature\('launch'\)/);
  const adapted=adaptOriginalHome(html);
  assert.match(adapted,/window\.SEYVEO_LOCAL_VOICE_BRIDGE=phrase/);
  for(const [,code] of adapted.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)){
    if(code.trim())new Script(code);
  }
});
