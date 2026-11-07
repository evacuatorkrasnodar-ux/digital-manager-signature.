/**
 * SEYVEO page-header continuity contract.
 * Static regression checks, not a browser pixel or iPhone Safari test.
 * Run with: node --test scripts/page-header-continuity.smoke.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [html,css,shell]=await Promise.all([
 read('index.html'),
 read('assets/seyveo-work-shell.css'),
 read('assets/seyveo-work-shell.js')
]);

test('primary routes put their title and back arrow on one stable row',()=>{
 const layouts=[
  /<header class="picture-head"><div class="sv-continuity-titlebar">[\s\S]*?<h1 id="pictureTitle"/,
  /<header class="life-heading">\s*<div class="sv-continuity-titlebar">[\s\S]*?<h1 id="lifeTitle"/,
  /<header class="manage-heading"><div class="sv-continuity-titlebar">[\s\S]*?<h1 id="manageTitle"/,
  /<header class="manage-theme-head sv-continuity-titlebar">[\s\S]*?<h2 id="manageThemeTitle"/,
  /<header class="sv-deep-top">\s*<div class="sv-continuity-titlebar">[\s\S]*?<h1 id="sayviSurfaceTitle"/
 ];
 layouts.forEach(re=>assert.match(html,re));
 assert.match(css,/--sv-page-title-height:54px/);
 assert.match(css,/--sv-page-slot:44px/);
 assert.match(css,/\.sv-continuity-titlebar\s*>\s*:is\(h1,h2\)/);
});

test('persistent work header retains a reserved back slot and constant title column',()=>{
 assert.match(shell,/heading\.append\(back,title,add\)/);
 assert.match(css,/#svWorkShell\[data-shared-work="true"\] #svWorkHeader\{\s*grid-template-columns:44px minmax\(0,1fr\) 44px!important/);
 assert.match(css,/#svWorkShell\[data-shared-work="true"\] #svWorkTitle\{\s*grid-column:2!important/);
 assert.match(css,/#svWorkShell\[data-shared-work="true"\] #svWorkAdd:not\(\[hidden\]\)\{\s*grid-column:3/);
 assert.match(css,/#svWorkShell\[data-history="true"\] #svWorkTitle\{\s*grid-column:2!important/);
});

test('Calendar creation choices no longer cover the title bar or work tabs',()=>{
 assert.match(shell,/const destination=inSharedHeader\?shell:menuHome/);
 assert.match(css,/#svWorkShell > #calendarCreateMenu:not\(\[hidden\]\)\{\s*order:0!important;position:relative!important/);
 assert.match(html,/id="calendarCreateEvent"/);
 assert.match(html,/id="calendarCreateTask"/);
 assert.match(shell,/calendarAdd\?\.click\(\)/);
});

test('Safari requests current assets and work shell syntax is valid',()=>{
 assert.match(html,/assets\/seyveo-work-shell\.css\?v=14/);
 assert.match(html,/assets\/seyveo-work-shell\.js\?v=9/);
 assert.doesNotThrow(()=>new Script(shell));
});
