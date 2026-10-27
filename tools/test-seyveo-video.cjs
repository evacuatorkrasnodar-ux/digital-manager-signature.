/* SEYVEO PLAY · official YouTube user-initiated embed, resource and routing tests.
 * No external YouTube request occurs during these tests. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const api=require('../assets/seyveo-video-core.js');
const html=read('index.html'),source=read('assets/seyveo-video.js'),
 lifeNav=read('assets/calendar-spaces.js'),
 style=read('assets/seyveo-video.css'),music=read('assets/seyveo-music.js'),
 living=read('assets/living-space.js'),director=read('assets/living-screen-core.js');
const id='M7lc1UVf-VE';
for(const url of [
 'https://youtu.be/'+id,'https://www.youtube.com/watch?v='+id+'&t=17',
 'https://m.youtube.com/watch?v='+id,'https://music.youtube.com/watch?v='+id,
 'https://www.youtube.com/shorts/'+id,'https://www.youtube.com/live/'+id,
 'https://www.youtube-nocookie.com/embed/'+id,id
])assert.equal(api.videoId(url),id,'Supported YouTube public video URL '+url);
for(const url of [
 'https://bad.youtube.com/watch?v='+id,'https://youtu.be.evil.com/'+id,
 'https://www.youtube.com@bad.example/watch?v='+id,
 'javascript:alert(1)','https://www.youtube.com/watch?v=<svg>',
 'https://www.youtube.com/watch?v=aaa','https://www.youtube.com/playlist?list=PL123',
 'https://www.youtube.com/embed/'+id+'/extra','https://youtube.com.evil.net/watch?v='+id
])assert.equal(api.videoId(url),null,'Unsafe/unsupported URL '+url);
assert.equal(api.understand('Сэйва, покажи видео про космос'),true);
assert.equal(api.understand('открой YouTube'),true);
assert.equal(api.understand('поставь мне музыку'),false);
assert.equal(api.understand('как дела'),false);
const official=api.embed(id);
assert.match(official,/^https:\/\/www\.youtube-nocookie\.com\/embed\/M7lc1UVf-VE\?/);
assert.equal(new URL(official).searchParams.get('autoplay'),'0');
assert.equal(new URL(official).searchParams.get('controls'),'1');
assert.equal(new URL(official).searchParams.get('playsinline'),'1');
assert.equal(api.embed('unsafe'),null);
assert.ok(html.indexOf('seyveo-video-core.js')<html.indexOf('seyveo-video.js'));
assert.match(html,/id="sayviVideoPage"[^>]*hidden/,'Video scene starts closed');
assert.match(html,/assets\/calendar-spaces\.js\?v=14/,'My World routes updated');
assert.match(html,/assets\/seyveo-video\.js\?v=5/,'PLAY returns to the right screen');
const worldGrid=html.match(/<div id="calendarSpaces"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'';
assert.equal((worldGrid.match(/data-calendar-space="play"/g)||[]).length,1,
 'Only one SEYVEO PLAY choice in My World');
assert.doesNotMatch(worldGrid,/data-calendar-space="(?:documents|mail)"/,
 'Documents and Mail are not duplicated in My World');
assert.match(html,/data-world-space="play"/,'Home My World shortcuts include PLAY');
assert.doesNotMatch(html,/data-world-space="mail"/,'Home My World shortcuts do not duplicate Mail');
assert.match(html,/<h1>SEYVEO PLAY<\/h1>/,'Brand stays SEYVEO');
assert.match(lifeNav,/if\(name==='play'\)/,'My World tile opens PLAY');
assert.match(lifeNav,/SEYVEO_VIDEO\?\.open\?\.\(\{from\}\)/,
 'My World reuses the existing video module');
assert.doesNotMatch(lifeNav,/if\(name==='(?:documents|mail)'\)/,
 'Old duplicated My World routes are gone');
assert.match(html,/placeholder="Что посмотрим\?"/,'One obvious type-by-name field');
assert.match(html,/<details id="sayviVideoMore"/,'Rare YouTube links are collapsed by default');
assert.match(html,/<summary>Ещё<\/summary>/,'One optional advanced action area');
assert.match(html,/id="sayviVideoWatch" type="submit">Найти</,'Search starts from one action');
assert.equal((html.match(/id="sayviVideoMore"/g)||[]).length,1,'No duplicate advanced panel');
assert.equal((html.match(/<footer class="dock"/g)||[]).length,1,'No second dock');
assert.equal((html.match(/id="orbCluster"/g)||[]).length,1,'Original orb kept');
assert.equal((html.match(/id="sayviMusicAudio"/g)||[]).length,1,'Original music player remains single');
assert.match(html,/\$\('sayviVideoPage'\)\.hidden=!video;/,'Router owns video scene');
assert.match(html,/window\.SEYVEO_VIDEO\?\.understand\(q\)/,'Sayvi voice/text routes video intent');
assert.match(living,/#sayvi-video/,'One orb follows the new screen');
assert.match(director,/case 'video':/,'Video companion captions are real');
assert.doesNotMatch(music,/sayviMusicVideoOpen/,'Video remains a separate screen, not an unrelated music action');
assert.match(style,/min-height:200px/,'YouTube required minimum 200px player size');
assert.match(style,/width:100%;height:100%;min-height:200px/,'Iframe viewport never collapses');
assert.doesNotMatch(style,/\.sv-video-iframe[\s\S]{0,100}pointer-events:none/,'Native YouTube buttons remain clickable');
assert.match(source,/if\(document\.hidden&&playingFrame\)/,'Background video is released');
assert.match(source,/playingFrame\.removeAttribute\('src'\)/,'Playback iframe unloads');
assert.match(source,/music\.pause\(\)/,'Video pauses original local audio; not two streams');
assert.doesNotMatch(source,/autoplay=1|enablejsapi=1|iframe_api|\/youtube\/v3\/search/,'No surprise autoplay, external API or hidden search');

// Simulate a single user-operated video without opening YouTube's network.
const handlers={},store=new Map(),nodes={},createdAnchors=[];
function node(id){
 const listeners={};return {
  id,hidden:false,disabled:false,value:'',textContent:'',href:'',
  children:[],attributes:new Map(),
  listeners,
  addEventListener(name,fn){(listeners[name]??=[]).push(fn)},
  setAttribute(k,v){this.attributes.set(k,v)},
  removeAttribute(k){this.attributes.delete(k);if(k==='src')this.src=''},
  append(...els){this.children.push(...els);for(const el of els)el.parentNode=this},
  replaceChildren(){this.children=[]},
  remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(x=>x!==this)}},
  click(){for(const fn of listeners.click||[])fn({preventDefault(){}})}
 };
}
const ids=['sayviVideoPage','sayviVideoForm','sayviVideoUrl','sayviVideoWatch','sayviVideoExample',
 'sayviVideoBack','sayviVideoPlayer','sayviVideoStatus','sayviVideoSave','sayviVideoSaved',
 'sayviVideoForget','sayviVideoExternal','sayviMusicAudio','navHome'];
for(const k of ids)nodes[k]=node(k);
nodes.sayviVideoPage.hidden=true;
nodes.sayviMusicAudio.paused=false;
nodes.sayviMusicAudio.pause=()=>{nodes.sayviMusicAudio.paused=true};
const loc={hash:''};
const documentMock={
 hidden:false, getElementById:id=>nodes[id]||null,
 createElement:tag=>{const el=node(tag);if(tag==='a')createdAnchors.push(el);return el},
 addEventListener:(ev,fn)=>{(handlers['document:'+ev]??=[]).push(fn)},
 documentElement:{classList:{toggle(){}}}
};
const win={SEYVEO_VIDEO_CORE:api,
 addEventListener:(ev,fn)=>{(handlers[ev]??=[]).push(fn)}};
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
const ctx={window:win,document:documentMock,location:loc,localStorage:storage,URL,Date};
vm.runInNewContext(source,ctx,{filename:'seyveo-video.js'});
assert.ok(win.SEYVEO_VIDEO,'Video controller registered');
assert.equal(nodes.sayviVideoPlayer.children.length,0,'No iframe before explicit play');
win.SEYVEO_VIDEO.open({from:'music'});
nodes.sayviVideoPage.hidden=false;
for(const fn of handlers.hashchange||[])fn();
assert.equal(loc.hash,'#sayvi-video');
assert.equal(nodes.sayviVideoPlayer.children.length,0,'Even navigation does not load YouTube');
nodes.sayviVideoUrl.value='космос документальный фильм';
for(const fn of nodes.sayviVideoForm.listeners.submit||[])fn({preventDefault(){}});
assert.equal(nodes.sayviVideoPlayer.children.length,0,'Text search never pretends to be a video');
assert.equal(createdAnchors.length,1,'Title opens one explicit official search handoff');
assert.equal(createdAnchors[0].href,'https://www.youtube.com/results?search_query='+encodeURIComponent('космос документальный фильм'));
assert.equal(createdAnchors[0].target,'_blank','The PWA screen is preserved');
assert.equal(createdAnchors[0].rel,'noopener noreferrer');
nodes.sayviVideoUrl.value='https://youtu.be/'+id;
for(const fn of nodes.sayviVideoForm.listeners.submit||[])fn({preventDefault(){}});
assert.equal(nodes.sayviVideoPlayer.children.length,1,'Only one iframe after Play');
assert.equal(nodes.sayviMusicAudio.paused,true,'Local SEYVA MUSIC pauses to avoid double audio');
const frame=nodes.sayviVideoPlayer.children[0];
assert.equal(frame.src,official,'User-controlled URL converted to strict official embed');
assert.equal(frame.attributes.get('referrerpolicy'),'strict-origin-when-cross-origin');
assert.equal(win.SEYVEO_VIDEO.hasPlayer(),true);
nodes.sayviVideoSave.click();
assert.equal(store.get('seyveo-video-saved-link-v1'),id,'Explicitly saved only the ID, no video bytes');
documentMock.hidden=true;
for(const fn of handlers['document:visibilitychange']||[])fn();
assert.equal(win.SEYVEO_VIDEO.hasPlayer(),false,'Background releases decoding');
assert.equal(nodes.sayviVideoPlayer.children.length,0,'Player DOM cleared while hidden');
documentMock.hidden=false;
for(const fn of nodes.sayviVideoForm.listeners.submit||[])fn({preventDefault(){}});
assert.equal(nodes.sayviVideoPlayer.children.length,1,'Can restart only by gesture');
nodes.sayviVideoBack.click();
assert.equal(loc.hash,'#sayvi-music','Return to existing Music from Music source');
for(const fn of handlers.hashchange||[])fn();
assert.equal(win.SEYVEO_VIDEO.hasPlayer(),false,'Video stops on return to Music');
win.SEYVEO_VIDEO.open({from:'life'});
assert.equal(loc.hash,'#sayvi-video','My World launches existing PLAY screen');
assert.equal(nodes.sayviVideoPlayer.children.length,0,'No autoplay when opening from My World');
nodes.sayviVideoBack.click();
assert.equal(loc.hash,'#life','PLAY Back returns to My World');
nodes.sayviVideoForget.click();
assert.equal(store.size,0,'Forget the only saved link');
console.log('PASS SEYVEO PLAY: one player, My World entry and Back, no duplicate mail/documents, official embed.');
