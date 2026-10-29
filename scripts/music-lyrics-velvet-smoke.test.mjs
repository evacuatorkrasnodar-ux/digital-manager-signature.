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
 assert.match(html,/seyveo-music\.css\?v=54/);
 assert.match(html,/seyveo-music\.js\?v=34/);
});
test('Walk of Fame jewel sits before the artist, not in the header',()=>{
 assert.match(css,/#sayviMusicPage \.sv-music-favorite\{[^}]*width:44px;height:44px;min-width:44px;min-height:44px/);
 assert.match(css,/#sayviMusicPage \.sv-music-favorite::before\{[^}]*width:34px;height:34px/);
 assert.match(css,/#sayviMusicPage \.sv-music-artist-row\{[^}]*gap:3px/);
 assert.match(css,/#sayviMusicPage \.sv-music-favorite-star\{[^}]*width:26px;height:26px;[\s\S]*?overflow:visible;transform:none/);
 assert.match(css,/#sayviMusicPage>header\.sv-music-head\{[^}]*grid-template-columns:minmax\(0,1fr\) auto!important/);
 const page=html.slice(html.indexOf('<main id="sayviMusicPage"'),html.indexOf('</main>',html.indexOf('<main id="sayviMusicPage"')));
 assert.match(page,/<div class="sv-music-artist-row"[^>]*>[\s\S]*?id="sayviMusicFavorite"[\s\S]*?id="sayviMusicArtist"/);
 assert.ok(page.indexOf('id="sayviMusicTrack"')<page.indexOf('id="sayviMusicFavorite"'));
 assert.ok(page.indexOf('</header>')<page.indexOf('id="sayviMusicFavorite"'));
 assert.match(css,/html\.sv-music-screen #sayviMusicPage \.sv-music-artist-row\{[^}]*grid-column:1;grid-row:3/);
 assert.match(css,/:root\[data-theme=light\] #sayviMusicPage \.sv-music-favorite::before\{[^}]*background:#253039/);
 assert.match(css,/#sayviMusicPage \.sv-music-favorite-shape\{[^}]*stroke:url\(#svMusicHallGold\)/);
 assert.match(html,/id="sayviMusicFavorite"[^>]*aria-pressed="false"/);
 assert.match(html,/id="svMusicHallGold"/);
 assert.match(html,/id="svMusicHallRose"/);
 assert.match(css,/\.sv-music-favorite-shape\{[^}]*fill:url\(#svMusicHallRose\)/);
 assert.match(css,/\.sv-music-star-initial\{[^}]*fill:url\(#svMusicHallGold\)/);
 assert.doesNotMatch(html,/id="svcpHallMedal"/,'Staff recognition is not repurposed for Music');
});
test('original music playback, favorites, dock and track choices stay wired',()=>{
 assert.match(js,/favoriteButton\?\.addEventListener\('click',toggleFavorite\)/);
 assert.match(js,/function updateFavorite\(\)/);
 assert.match(js,/function switchTrack\(/);
 assert.match(js,/function updatePlay\(\)/);
 assert.match(js,/function updateTime\(\)/);
 assert.match(js,/favoriteButton\.classList\.add\('sv-music-favorite--spark'\)/);
 assert.match(css,/@keyframes sv-music-star-glint/);
 assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
 assert.match(html,/id="sayviMusicAudio"/);
 assert.match(html,/id="sayviMusicPlay"/);
 assert.match(html,/id="sayviMusicSeek"/);
 assert.match(html,/id="sayviMusicCollection"/);
 assert.match(html,/id="sayviMusicMinimize"/);
});

test('Music Hall of Fame shows starred tracks without creating audio copies',()=>{
 assert.match(html,/id="sayviMusicHallToggle"[^>]*>Аллея славы<\/button>/);
 assert.match(js,/const FAVORITES_KEY='seyveo-music-favorites-v1'/);
 assert.match(js,/function toggleHall\(\)/);
 assert.match(js,/hallToggle\?\.addEventListener\('click',toggleHall\)/);
 assert.match(js,/function showCollection\(mode\)/);
 assert.match(js,/collectionMode==='hall'/);
 assert.match(js,/АЛЛЕЯ СЛАВЫ · /);
 assert.match(js,/fileInput\.click\(\)/);
 assert.match(js,/entries\.some\(entry=>!entry\.match\)/);
 assert.match(css,/#sayviMusicPage \.sv-music-favorite::before\{[^}]*width:34px;height:34px/);
 assert.match(css,/#sayviMusicPage \.sv-music-favorite\{[^}]*aspect-ratio:1\/1/);
 assert.match(css,/#sayviMusicPage \.sv-music-hall-row \.sv-music-row-num\{/);
});
