/* Regression: public Safari/PWA startup must not be delayed by a splash.
   The Home sphere and Work's independent first-paint guard remain intact. */
'use strict';
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const home=readFileSync(join(root,'assets/seyveo-sayvi-handoff-demo.js'),'utf8');
assert.doesNotMatch(html,/svLaunchClean|sv-cinema-boot|seyveo-launch-clean|seyveo-clean-launch-day/,'no startup overlay, concealment, scripts or daily delay');
assert.equal(existsSync(join(root,'assets/seyveo-launch-clean.js')),false,'retired splash script removed');
assert.equal(existsSync(join(root,'assets/seyveo-launch-clean.css')),false,'retired splash style removed');
assert.match(html,/id="homePage"/,'real Home remains');
assert.match(html,/id="plasmaVisual"/,'real Home sphere remains');
assert.match(html,/seyveo-sayvi-handoff-demo\.js/,'Home sphere/dock state controller remains');
assert.match(home,/const showCinema=atHome&&!noIntro&&voiceRequested/,'automatic public cinematic disabled; private voice preview is opt-in');
assert.match(home,/function beginHomeGreetingLifetime\(\)/,'Home greeting lifetime retained');
assert.match(home,/function scheduleEmptySphereSync\(/,'empty Home orb/dock behavior retained');
assert.doesNotMatch(home,/seyveo-sayvi-cinema-last-day-v4|sv-cinema-boot/,'old startup gate cleaned');
process.stdout.write('PASS: no public splash on Safari/PWA reload, Home and Work retained.\n');
