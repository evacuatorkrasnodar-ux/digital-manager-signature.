import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const file=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const [html,css,js]=await Promise.all([
 file('index.html'),file('assets/seyveo-music.css'),file('assets/seyveo-music.js')
]);

test('lyrics empty state uses one familiar local LRC panel with clear labels',()=>{
 const panel=html.split('<section id="sayviMusicLyricsPanel"')[1]?.split('</section>')[0];
 assert.ok(panel);
 assert.match(panel,/>Слова песни<\/span>/);
 assert.match(panel,/id="sayviMusicLyricsImport"/);
 assert.match(panel,/aria-label="Загрузить свой файл LRC со словами песни"/);
 assert.match(panel,/Добавьте файл \.LRC/);
 assert.match(panel,/в такт музыке/);
 assert.match(panel,/только в текущем сеансе/);
 assert.match(html,/seyveo-music\.css\?v=48/);
 assert.match(html,/seyveo-music\.js\?v=31/);
 assert.equal((html.match(/id="sayviMusicLyricsPanel"/g)||[]).length,1);
});

test('lyrics panel follows Black Velvet CSS theme tokens, never pink/purple hardcoding',()=>{
 const panel=css.split('#sayviMusicPage .sv-music-lyrics{')[1]?.split('}')[0];
 assert.ok(panel);
 assert.match(panel,/background:linear-gradient\(160deg,var\(--card\),var\(--bg\)\)/);
 assert.match(panel,/border:1px solid var\(--seyveo-hdr-outline,var\(--soft-line\)\)/);
 assert.doesNotMatch(panel,/rgba\(94,74,84/);
 assert.doesNotMatch(css,/\[data-palette=plum\] #sayviMusicPage \.sv-music-lyrics\{/);
 assert.doesNotMatch(css,/\[data-theme=light\] #sayviMusicPage \.sv-music-lyrics\{/);
 assert.match(css,/#sayviMusicPage \.sv-music-lyrics-lines:has\(\.sv-music-lyrics-empty\)/);
 assert.match(css,/#sayviMusicPage \.sv-music-lyrics-empty\{[^}]*max-width:280px/);
 assert.match(css,/#sayviMusicPage \.sv-music-lyrics-foot\{[^}]*color:var\(--secondary\)/);
 assert.match(css,/#sayviMusicPage \.sv-music-lyrics-heading button\{[^}]*var\(--seyveo-hdr-active/);
});

test('favorite star is smaller, optically centered and touch target preserved',()=>{
 assert.match(html,/id="sayviMusicFavorite"[^>]*aria-pressed="false"/);
 assert.match(html,/class="sv-music-favorite-star" viewBox="0 0 64 64"/);
 assert.match(css,/#sayviMusicPage \.sv-music-favorite\{[^}]*width:46px;height:46px/);
 assert.match(css,/#sayviMusicPage \.sv-music-favorite-star\{[^}]*width:32px;height:32px[^}]*translateY\(2px\)/);
 assert.match(css,/@media\(max-width:375px\)\{[\s\S]*?\.sv-music-favorite-star\{width:30px;height:30px/);
 assert.match(css,/:root\[data-theme=light\] #sayviMusicPage \.sv-music-favorite\{[^}]*background:#28333b/);
 assert.match(css,/#sayviMusicPage \.sv-music-favorite-shape\{[^}]*stroke:#ffffff/);
 assert.match(js,/favoriteButton\?\.addEventListener\('click',toggleFavorite\)/);
 assert.match(js,/const initial=favoriteButton\.querySelector\('#svMusicStarInitial'\)/);
});

test('existing synchronized LRC parser, translation, audio seek and controls remain intact',()=>{
 assert.match(js,/function parseLRC\(input\)/);
 assert.match(js,/function updateLyrics\(\)/);
 assert.match(js,/function renderLyrics\(\)/);
 assert.match(js,/function toggleLyrics\(force\)/);
 assert.match(js,/lyricsImport\?\.addEventListener\('click'/);
 assert.match(js,/lyricsInput\?\.addEventListener\('change',async\(\)=>/);
 assert.match(js,/lyricsForTrack\.set\(selected,parsed\)/);
 assert.match(js,/row\.addEventListener\('click',\(\)=>/);
 assert.match(js,/audio\.currentTime=Math\.min\(line\.time,audio\.duration\)/);
 assert.match(js,/function updateTranslationControl\(\)/);
 assert.match(html,/id="sayviMusicLyricsTranslation"/);
 assert.match(html,/id="sayviMusicPrevious"/);
 assert.match(html,/id="sayviMusicPlay"/);
 assert.match(html,/id="sayviMusicSeek"/);
 assert.match(html,/id="sayviMusicMinimize"/);
 assert.match(js,/WeakMap\(\)/);
});
