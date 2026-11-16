/**
 * Home cleanup regression contract. Run with:
 * node --test scripts/home-cleanup.smoke.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('Sayvi uses one constant size before and after the greeting',async()=>{
 const css=await read('assets/seyveo-sayvi-handoff-demo.css');
 const html=await read('index.html');
 assert.match(css,/--sv-home-orb-size:clamp\(230px,68vw,315px\)/);
 assert.match(css,/@media \(max-width:649px\) and \(pointer:coarse\)/);
 assert.match(css,/--sv-home-orb-size:min\(78vw,325px,42dvh\)/);
 assert.match(css,/--sv-home-orb-half:min\(39vw,162\.5px,21dvh\)/);
 assert.match(css,/--sv-home-cards-offset:80px/);
 assert.match(css,/--sv-home-weather-offset:128px/);
 assert.doesNotMatch(css,/transition:top 1s cubic-bezier/);
 assert.doesNotMatch(css,/transition:top \.9s cubic-bezier/);
 assert.match(css,/:root\.sv-home-info-enter #homePage #stage > \.message/);
 assert.match(css,/:root\.sv-home-info-enter #homePage #svHomeCalmDetails:not\(\[hidden\]\)/);
 assert.match(css,/:root\.sv-cinema-greeting-active\.sv-sayvi-handoff-demo:not\(\.sv-sayvi-handoff-docked\) #homePage #stage > \.message/);
 assert.equal(css.match(/width:var\(--sv-home-orb-size\)/g)?.length,2);
 assert.equal(css.match(/height:var\(--sv-home-orb-size\)/g)?.length,4);
 assert.doesNotMatch(html,/seyveo-home-conversation\.css/);
});

test('An undecided card reminder is available for iPhone screen taps',async()=>{
 const [reminder,review]=await Promise.all([
  read('assets/seyveo-home-calm.js'),
  read('assets/seyveo-review-cards.js')
 ]);
 assert.match(review,/window\.SEYVEO_REVIEW_CARDS=Object\.freeze\(\{count\}\)/);
 assert.match(reminder,/lastCount=Math\.max\(0,Number\(window\.SEYVEO_REVIEW_CARDS\?\.count\?\.\(\)\)/);
 assert.match(reminder,/window\.addEventListener\('pointerdown',wakeOnBlank/);
 assert.match(reminder,/window\.addEventListener\('touchstart',wakeOnBlank/);
 assert.match(reminder,/stage\.append\(notice\)/);
 assert.doesNotMatch(reminder,/stage\.after\(notice\)/);
 assert.match(reminder,/isHome\(\)&&sayviSettled\(\)&&!reviewOpen\(\)/);
 assert.doesNotMatch(reminder,/root\.classList\.contains\('sv-home-greeting-expired'\)/);
 assert.doesNotMatch(review,/svHomeReviewText|greetingAction/);
 assert.doesNotMatch(review,/svReviewEntry|sv-review-entry|positionEntry/);
 new Script(reminder);new Script(review);
});

test('Review page has no obsolete button styles or geometry observers',async()=>{
 const css=await read('assets/seyveo-review-cards.css');
 assert.doesNotMatch(css,/sv-review-entry|svReviewEntry|sv-home-card-sphere/);
 assert.match(css,/\.sv-review-room\{/);
 assert.doesNotMatch(css,/svHomeReviewText/);
 assert.match(css,/:root\.sv-home-empty-arriving #homePage :is\(#svHomeCalmDetails/);
 assert.match(css,/:root\.sv-sayvi-handoff-docked:not\(\.sv-home-empty-arrived\) #homePage #stage > \.message/);
 assert.match(css,/sv-home-empty-arrived:not\(\.sv-home-empty-at-launch\) #homePage #svHomeCalmDetails:not\(\[hidden\]\)/);
});
