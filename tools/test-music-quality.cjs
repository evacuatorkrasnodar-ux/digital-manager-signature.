/* SEYVEO Music · source-quality, local metadata and lock-screen regression.
 * Read-only; fake MP3 header built in memory without user recordings. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const metadata=require('../assets/music-metadata.js');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const player=fs.readFileSync(path.join(base,'assets/seyveo-music.js'),'utf8');
const css=fs.readFileSync(path.join(base,'assets/seyveo-music.css'),'utf8');
const png=fs.readFileSync(path.join(base,'assets/seyveo-music-lockscreen.png'));
assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Native iOS image format is actual PNG');
assert.equal(png.readUInt32BE(16),128);
assert.match(html,/id="sayviMusicDisk"/,'Vinyl artwork stays in the original music screen');
assert.match(css,/sv-music-spin/,'Vinyl animation remains available during playback');
assert.match(css,/SEYVEO SOUND · Living Stage v2/,'Tall-phone composition tuning exists');
assert.match(css,/@media \(max-width:759px\) and \(min-height:900px\) and \(orientation:portrait\)/,'Tall portrait mode uses height-aware layout');
assert.match(css,/@media \(max-width:759px\) and \(max-height:899px\) and \(orientation:portrait\)/,'Compact iPhone mode remains separate');
assert.match(css,/--sv-music-vinyl-size:min\(52vw,26dvh,278px\)/,'Tall screens have larger but bounded vinyl');
assert.match(css,/--sv-music-vinyl-size:min\(44vw,17\.5dvh,126px\)/,'iPhone X size rule has not been removed');

assert.match(html,/<span class="sv-music-brand">SEYVEO<\/span><span class="sv-music-brand-sub">SOUND<\/span>/,'Correct SEYVEO SOUND name');
assert.match(html,/id="sayviMusicMinimize"/,'Explicit unobtrusive minimize control');
assert.match(html,/id="sayviMusicMini"[^>]*hidden/,'One mini remote appears outside the full player when loaded');
assert.match(html,/id="sayviMusicMiniPlay"/,'Mini playback uses the original music audio engine');
assert.match(html,/id="sayviMusicQueue"/,'A music queue replaces the unrelated video button');
assert.doesNotMatch(html,/id="sayviMusicVideoOpen"/,'Video is not an action in the music stage');
assert.doesNotMatch(html,/id="sayviMusicResume"/,'No duplicate Home resume strip');
assert.match(player,/location\.hash='#home'/,'Minimize navigates back without stopping audio');
assert.match(player,/mini\.hidden=!loaded\|\|location\.hash==='#sayvi-music'/,'Remote shows only outside full player');
assert.match(player,/miniPlay\?\.addEventListener\('click',play\)/,'Mini controls one audio element');
assert.match(css,/#sayviMusicPage>header\.sv-music-head/,'Music signature aligns editorially');
assert.doesNotMatch(css,/left:min\(1\.(?:1|2|5)vw/,'Record has no optical offset');
assert.equal((html.match(/id="sayviMusicAudio"/g)||[]).length,1,'One actual audio element');
assert.ok(html.indexOf('assets/music-metadata.js')<html.indexOf('assets/seyveo-music.js'),'Metadata utility loads first');
assert.match(player,/artwork:\[coverObjectURL/,'Embedded artwork or Sayvi');
assert.match(player,/coverFallback=new URL\('assets\/seyveo-music-lockscreen\.png'/);
assert.match(player,/if\(event.persisted\|\|!audio.paused\)return;/,'Never stop playing music on pagehide');
assert.doesNotMatch(player,/window.addEventListener\('pagehide',\(\)=>\{\s*audio\.pause\(\)/,'Old background-killing handler gone');
assert.match(player,/navigator\.mediaSession\.playbackState=playing\?'playing':'paused'/,'Lock-screen playback state');
assert.doesNotMatch(player,/AudioContext|createMediaElementSource|decodeAudioData/,'No unapproved quality-damaging DSP chain');
const name=metadata.filenameParts;
assert.deepEqual({title:name('01_The_Weeknd_-_Blinding_Lights_(Official_Video)_[320kbps]_www.tunes.org.mp3').title,artist:name('01_The_Weeknd_-_Blinding_Lights_(Official_Video)_[320kbps]_www.tunes.org.mp3').artist},
 {title:'Blinding Lights',artist:'The Weeknd'});
assert.equal(name('Miyagi & Andy Panda - Kosandra (Live).flac').title,'Kosandra (Live)','Never delete actual Live edition');
assert.equal(name('Моя любимая песня.wav').title,'Моя любимая песня');
assert.equal(name('Sting - Shape of My Heart.mp3').artist,'Sting');
assert.equal(name('Artist - 1999 (Remix).mp3').title,'1999 (Remix)');
function frame(id,data){
 const header=Buffer.alloc(10);
 header.write(id,0,4,'ascii');header.writeUInt32BE(data.length,4);
 return Buffer.concat([header,data]);
}
function textFrame(id,txt){return frame(id,Buffer.concat([Buffer.from([3]),Buffer.from(txt,'utf8')]));}
const cover=Buffer.concat([Buffer.from([255,216]),Buffer.alloc(70,31)]);
const apic=frame('APIC',Buffer.concat([Buffer.from([0]),Buffer.from('image/jpeg\0','ascii'),Buffer.from([3,0]),cover]));
const body=Buffer.concat([textFrame('TIT2','Чистая песня'),textFrame('TPE1','Настоящий артист'),apic]);
const header=Buffer.alloc(10);header.write('ID3',0,'ascii');header[3]=3;
for(let i=0;i<4;i++)header[9-i]=(body.length>>>(7*i))&127;
const bytes=Buffer.concat([header,body]);
const file=new Blob([bytes],{type:'audio/mpeg'});
Object.defineProperty(file,'name',{value:'02_Site_com_Unknown_320kbps.mp3'});
(async()=>{
 const info=await metadata.describe(file);
 assert.equal(info.title,'Чистая песня');
 assert.equal(info.artist,'Настоящий артист');
 assert.equal(info.artwork.type,'image/jpeg');
 assert.equal(info.source,'id3');
 const malformed=new Blob([Buffer.from('garbage')]);
 Object.defineProperty(malformed,'name',{value:'Band - True Love (Live).mp3'});
 const fallback=await metadata.describe(malformed);
 assert.equal(fallback.title,'True Love (Live)');
 assert.equal(fallback.artist,'Band');
 assert.equal(fallback.artwork,null);
 console.log('PASS Music: titles, safe ID3 art, authentic vinyl, real PNG, background lifecycle, no DSP.');
})().catch(error=>{console.error(error);process.exitCode=1});
