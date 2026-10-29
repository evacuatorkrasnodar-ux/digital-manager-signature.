import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const [html,css,js]=await Promise.all([
 read('index.html'),read('assets/seyveo-music.css'),read('assets/seyveo-music.js')
]);
test('remove complex manual lyrics imports and leave simple main music actions',()=>{
 const page=html.slice(html.indexOf('<main id="sayviMusicPage"'),html.indexOf('</main>',html.indexOf('<main id="sayviMusicPage"')));
 assert.ok(page);
 assert.doesNotMatch(page,/sayviMusicLyrics(?:Panel|Toggle|Import|File|Translation|Lines)/);
 assert.doesNotMatch(js,/parseLRC|lyricsForTrack|toggleLyrics|renderLyrics|updateLyrics|lyricsInput/);
 assert.match(page,/id="sayviMusicImport"/);
 assert.match(page,/id="sayviMusicSourcesToggle"/);
 assert.match(page,/id="sayviMusicFavorite"/);
 assert.match(html,/seyveo-music\.css\?v=49/);
 assert.match(html,/seyveo-music\.js\?v=32/);
});
test('whole favorite button is compact, star centered without SVG transform',()=>{
 assert.match(css,/#sayviMusicPage .sv-music-favorite\{[^}]*width:38px;height:38px;min-width:38px;min-height:38px/);
 assert.match(css,/#sayviMusicPage .sv-music-favorite-star\{[^}]*width:26px;height:26px;overflow:visible;transform:none/);
 assert.match(css,/#sayviMusicPage>header\.sv-music-head\{[^}]*grid-template-columns:minmax\(0,1fr\) 40px auto!important/);
 assert.match(css,/:root\[data-theme=light\] #sayviMusicPage \.sv-music-favorite\{[^}]*background:#28333b/);
 assert.match(css,/#sayviMusicPage \.sv-music-favorite-shape\{[^}]*stroke:#ffffff/);
 assert.match(html,/id="sayviMusicFavorite"[^>]*aria-pressed="false"/);
});
test('original music playback, favorites, dock and track choices stay wired',()=>{
 assert.match(js,/favoriteButton\?\.addEventListener\('click',toggleFavorite\)/);
 assert.match(js,/function updateFavorite\(\)/);
 assert.match(js,/function switchTrack\(/);
 assert.match(js,/function updatePlay\(\)/);
 assert.match(js,/function updateTime\(\)/);
 assert.match(html,/id="sayviMusicAudio"/);
 assert.match(html,/id="sayviMusicPlay"/);
 assert.match(html,/id="sayviMusicSeek"/);
 assert.match(html,/id="sayviMusicCollection"/);
 assert.match(html,/id="sayviMusicMinimize"/);
});
