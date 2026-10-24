/* SEYVA MUSIC · test real container headers, not names or UI claims. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const quality=require('../assets/music-source-quality.js');
const base=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const player=fs.readFileSync(path.join(base,'assets/seyveo-music.js'),'utf8');
const css=fs.readFileSync(path.join(base,'assets/seyveo-music.css'),'utf8');
assert.match(html,/SEYVA MUSIC<\/h1><p class="sv-music-technology">SOUND <span class="sv-music-ai">ai<\/span> TECHNOLOGY/,'User-approved brand signature');
assert.match(html,/id="sayviMusicQuality"[^>]*\bhidden\b/,'Label starts hidden');
assert.match(css,/\.sv-music-quality\[hidden\]\{display:none!important\}/,'No false static quality title');
assert.ok(html.indexOf('assets/music-source-quality.js')<html.indexOf('assets/seyveo-music.js'),'Analyzer loads before audio controller');
assert.match(player,/const playing=!!audio\.src&&!audio\.paused&&!audio\.ended&&index>=0/,'Quality details only while genuinely playing');
assert.match(player,/if\(info\.hiRes\)/,'Hi-Res label only when source-verified');
assert.match(player,/info\.format==='MP3'/,'MP3 format and first-frame bitrate can be shown');
assert.match(player,/КАЧЕСТВО ФАЙЛА НЕ ОПРЕДЕЛЕНО/,'Unknown formats never get invented parameters');
assert.match(player,/if\(version!==selectVersion\|\|tracks\[index\]!==file\)return/,'Old scans cannot repaint new track');
assert.match(player,/Проверенные параметры исходного файла/,'Quality shown refers to source, not certified iPhone output');
assert.doesNotMatch(player,/AudioContext|decodeAudioData|createMediaElementSource/,'No fake upscaling or resampling');
assert.equal((html.match(/id="sayviMusicAudio"/g)||[]).length,1,'One actual playback path');
function media(buffer,name){
 const out=new Blob([buffer],{type:'audio/x-custom'});
 Object.defineProperty(out,'name',{value:name});
 return out;
}
function makeFlac(bits,rate){
 const b=Buffer.alloc(3000,0);
 b.write('fLaC',0,'ascii');
 b[4]=0x80;b[7]=34; // last metadata block, STREAMINFO size 34
 const off=8;
 b[off+10]=(rate>>>12)&255;
 b[off+11]=(rate>>>4)&255;
 b[off+12]=((rate&15)<<4)|((1)<<1)|(((bits-1)>>>4)&1); // 2 channels
 b[off+13]=(((bits-1)&15)<<4)|0; // upper sample count nibble = 0
 b[off+17]=1; // total samples=1: conservative positive
 return media(b,'Real Track.flac');
}
function makeWav(bits,rate){
 const size=960;
 const b=Buffer.alloc(44+size);
 b.write('RIFF',0,'ascii');b.writeUInt32LE(b.length-8,4);
 b.write('WAVEfmt ',8,'ascii');b.writeUInt32LE(16,16);
 b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);
 b.writeUInt32LE(rate,24);
 b.writeUInt32LE(rate*2*bits/8,28);
 b.writeUInt16LE(2*bits/8,32);
 b.writeUInt16LE(bits,34);
 b.write('data',36,'ascii');b.writeUInt32LE(size,40);
 return media(b,'Actual Recording.wav');
}
(async()=>{
 const hiFlac=await quality.detect(makeFlac(24,96000));
 assert.equal(hiFlac?.hiRes,true,'FLAC 24/96 is verified Hi-Res');
 assert.equal(hiFlac?.detail,'24-bit / 96 kHz');
 assert.equal((await quality.detect(makeFlac(24,48000)))?.hiRes,false,'24/48 below strict source threshold');
 assert.equal((await quality.detect(makeFlac(16,192000)))?.hiRes,false,'16/192 lacks 24-bit depth');
 assert.equal((await quality.detect(makeFlac(24,192000)))?.hiRes,true);
 assert.equal((await quality.detect(makeWav(24,96000)))?.hiRes,true,'PCM WAV 24/96 qualifies');
 assert.equal((await quality.detect(makeWav(16,44100)))?.hiRes,false,'CD-quality never earns badge');
 assert.equal((await quality.detect(makeWav(32,96000)))?.hiRes,true,'Integer PCM WAV 32/96');

 const mp3Bytes=Buffer.alloc(3000);
 for(const offset of [0,417]){mp3Bytes[offset]=0xff;mp3Bytes[offset+1]=0xfb;mp3Bytes[offset+2]=0x90;mp3Bytes[offset+3]=0;}
 const honestMP3=await quality.detect(media(mp3Bytes,'Artist - Track.mp3'));
 assert.equal(honestMP3?.format,'MP3','Actual consecutive MPEG1 Layer III frames recognized');
 assert.equal(honestMP3?.sampleRate,44100,'Real header rate not filename');
 assert.equal(honestMP3?.bitrateKbps,128,'First frame bitrate is 128 kbps');
 assert.equal(honestMP3?.bitrateScope,'first-frame','VBR caveat preserved');
 assert.equal(honestMP3?.hiRes,false,'MP3 is not mislabeled lossless Hi-Res');

 const fake=Buffer.alloc(3000,0);fake.write('not a real file',0);
 assert.equal(await quality.detect(media(fake,'Hi-Res_24bit_192khz.flac')),null,'Filename must never imply Hi-Res');
 assert.equal(await quality.detect(media(fake,'HI-RES 24-96.mp3')),null,'Lossy fake filename is never certified');
 const corrupt=Buffer.from(await makeWav(24,96000).arrayBuffer());
 corrupt.writeUInt16LE(3,20); // float WAV, not linear PCM
 assert.equal(await quality.detect(media(corrupt,'floating.wav')),null,'Float/unknown PCM handling is conservative');
 const cut=Buffer.from(await makeWav(24,96000).arrayBuffer());
 cut.writeUInt32LE(1000000,40);
 assert.equal(await quality.detect(media(cut,'truncated.wav')),null,'Truncated WAV is rejected');
 console.log('PASS SEYVA MUSIC: source FLAC/WAV and genuine MP3 frames, correct playback labels, truthful Hi-Res, accessible stage.');
})().catch(err=>{console.error(err);process.exitCode=1});
