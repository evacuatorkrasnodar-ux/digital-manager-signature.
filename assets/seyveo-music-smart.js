/* SEYVEO Music · quiet smart actions. No uploads, new player or equalizer. */
(function(host,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(host)api.install(host);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const syncsafe=(b,i)=>((b[i]&127)<<21)|((b[i+1]&127)<<14)|((b[i+2]&127)<<7)|(b[i+3]&127);
 const ascii=(b,i,n)=>String.fromCharCode(...b.subarray(i,i+n));
 const uint=(b,i)=>new DataView(b.buffer,b.byteOffset,b.byteLength).getUint32(i);
 function takeText(b,pos,enc){
  const step=enc===1||enc===2?2:1;
  let end=pos;
  while(end+step<=b.length){
   if(b[end]===0&&(step===1||b[end+1]===0))break;
   end+=step;
  }
  let bytes=b.subarray(pos,end),label=enc===0?'windows-1252':enc===3?'utf-8':enc===2?'utf-16be':'utf-16le';
  if(enc===1&&bytes[0]===0xfe&&bytes[1]===0xff)label='utf-16be';
  let text='';try{text=new TextDecoder(label).decode(bytes).replace(/\u0000/g,'').trim()}catch{}
  return {text,next:Math.min(b.length,end+step)};
 }
 function embeddedLyrics(b){
  if(b.length<10||ascii(b,0,3)!=='ID3'||![3,4].includes(b[3])||(b[5]&0xc0))return null;
  const version=b[3],end=Math.min(b.length,10+syncsafe(b,6));let plain=null;
  for(let pos=10;pos+10<=end;){
   const id=ascii(b,pos,4),size=version===4?syncsafe(b,pos+4):uint(b,pos+4);
   if(!/^[A-Z0-9]{4}$/.test(id)||!size||pos+10+size>end)break;
   const flags=b[pos+9],f=b.subarray(pos+10,pos+10+size);pos+=10+size;
   if(flags||f.length<6||f[0]>3)continue;
   const enc=f[0];
   if(id==='SYLT'&&f[4]===2){
    let at=takeText(f,6,enc).next;const lines=[];
    while(at+4<f.length&&lines.length<3000){
     const t=takeText(f,at,enc);at=t.next;if(at+4>f.length)break;
     const time=uint(f,at)/1000;at+=4;
     if(t.text)lines.push({time,text:t.text});
    }
    if(lines.length)return {timed:true,lines:lines.sort((a,b)=>a.time-b.time)};
   }
   if(id==='USLT'){
    const start=takeText(f,4,enc).next;
    const t=takeText(f,start,enc).text;
    if(t)plain={timed:false,lines:t.split(/\r?\n/).map(text=>({text})).filter(x=>x.text.trim())};
   }
  }
  return plain;
 }
 async function readEmbedded(file){
  if(!file?.slice||!/\.mp3$/i.test(file.name))return null;
  const h=new Uint8Array(await file.slice(0,10).arrayBuffer());
  if(h.length!==10||ascii(h,0,3)!=='ID3')return null;
  const size=10+syncsafe(h,6);if(size>2000000||size>file.size)return null;
  return embeddedLyrics(new Uint8Array(await file.slice(0,size).arrayBuffer()));
 }
 function activeLine(lines,time){
  let low=0,high=lines.length-1,answer=-1;
  while(low<=high){const mid=(low+high)>>1;if(lines[mid].time<=time){answer=mid;low=mid+1}else high=mid-1}
  return answer;
 }
 function sleepMinutes(q){
  const m=q.match(/^(?:выключи|останови|поставь на паузу)\s+музыку\s+через\s+(\d{1,3})\s*(?:минут[уы]?|мин\.?)$/i);
  if(!m)return null;const n=Number(m[1]);return n>=1&&n<=180?n:null;
 }
 function install(w){
  const d=w.document,$=id=>d.getElementById(id),audio=$('sayviMusicAudio'),page=$('sayviMusicPage');
  if(!audio||!page||w.SEYVEO_MUSIC_SMART)return;
  const music=()=>w.SEYVEO_MUSIC;
  const loaded=()=>!!music()?.state?.().loaded&&music().state().trackIndex>=0;
  const notify=t=>{const el=$('sayviMusicStatus');if(el){el.textContent=t;el.hidden=false}};
  const dialog=$('svSmartMusicSheet'),body=$('svSmartMusicBody'),title=$('svSmartMusicTitle');
  const close=()=>{if(dialog?.open)dialog.close();++generation;mode='';lyricData=null;current=-2};
  let generation=0,mode='',lyricData=null,current=-2,deadline=0,timer=0,originalVolume=null;
  function show(label,kind){
   if(!dialog||!body)return false;
   ++generation;mode=kind;lyricData=null;current=-2;title.textContent=label;body.replaceChildren();
   if(!dialog.open){try{dialog.showModal()}catch{return false}}return true;
  }
  function message(t){const p=d.createElement('p');p.className='sv-smart-music-message';p.textContent=t;body.append(p);return p}
  function action(label,fn){const b=d.createElement('button');b.type='button';b.className='sv-smart-music-choice';b.textContent=label;b.addEventListener('click',fn);body.append(b);return b}
  $('svSmartMusicClose')?.addEventListener('click',close);
  dialog?.addEventListener('close',()=>{++generation;mode='';lyricData=null;current=-2});
  dialog?.addEventListener('click',e=>{if(e.target===dialog)close()});
  d.addEventListener('seyveo:music-view',e=>{if(e.detail?.view!=='player'&&dialog?.open)close()});
  function shareData(){
   if(!loaded())return null;
   const name=$('sayviMusicTrack')?.textContent?.trim()||'Музыка';
   const artist=$('sayviMusicArtist')?.textContent?.trim()||'';
   return {title:name,text:[name,artist==='Моя музыка'?'':artist].filter(Boolean).join(' — ')+'\nSEYVEO Music'};
  }
  async function share(){
   const data=shareData();if(!data){notify('Сначала включите песню или радио.');return}
   // Do not pretend a local blob or filename is a publicly playable link.
   if(w.navigator.share){try{await w.navigator.share(data);return}catch(e){if(e.name==='AbortError')return}}
   if(!show('Поделиться музыкой','share'))return;
   message(data.text);
   message('Название и исполнитель. Локальный аудиофайл не отправляется.');
   action('Копировать',async()=>{try{await w.navigator.clipboard.writeText(data.text);close();notify('Название скопировано.')}catch{message('Не удалось скопировать. Выделите текст вручную.')}});
  }
  function restoreVolume(){if(originalVolume!==null){try{audio.volume=originalVolume}catch{}originalVolume=null}}
  function cancelSleep(){deadline=0;w.clearInterval(timer);timer=0;restoreVolume();syncSleep()}
  function syncSleep(){
   const b=$('svSmartSleepLabel');if(b)b.textContent=deadline?'Таймер сна · '+Math.max(1,Math.ceil((deadline-Date.now())/60000))+' мин':'Таймер сна';
  }
  function tick(){
   if(!deadline)return;
   const left=deadline-Date.now();
   if(left<=0){audio.pause();cancelSleep();notify('Таймер сна: музыка остановлена.');return}
   // Safari may ignore software volume changes; pause still occurs.
   if(left<=5000&&!audio.paused){
    if(originalVolume===null)originalVolume=audio.volume;
    try{audio.volume=Math.max(0,originalVolume*left/5000)}catch{}
   }
   syncSleep();
  }
  function setSleep(minutes){
   if(!Number.isFinite(minutes)||minutes<1||minutes>180)return false;
   cancelSleep();deadline=Date.now()+minutes*60000;timer=w.setInterval(tick,250);syncSleep();return true;
  }
  function sleepSheet(){
   if(!show('Таймер сна','sleep'))return;
   message(deadline?'Осталось '+Math.max(1,Math.ceil((deadline-Date.now())/60000))+' мин.':'Музыка остановится автоматически. В фоне работа зависит от браузера.');
   for(const n of [15,30,45,60,90])action(n+' мин',()=>{setSleep(n);close();notify('Музыка остановится через '+n+' мин.')});
   if(deadline)action('Отменить таймер',()=>{cancelSleep();close();notify('Таймер сна отключён.')});
  }
  d.addEventListener('visibilitychange',tick);w.addEventListener('pageshow',tick);
  $('sayviMusicStopAndHide')?.addEventListener('click',cancelSleep);
  async function karaoke(){
   const file=music()?.rhythmFile?.();
   if(!show('Караоке','lyrics'))return;
   if(!file){message('Текст доступен для песен из медиатеки, если он встроен в файл.');return}
   const version=generation;message('Ищем текст в аудиофайле…');
   let result=null;try{result=await readEmbedded(file)}catch{}
   if(version!==generation||!dialog.open||mode!=='lyrics')return;
   if(music()?.rhythmFile?.()!==file){close();return}
   body.replaceChildren();
   if(!result){message('В этой песне нет встроенного текста. Подключение каталога текстов потребуется отдельно.');return}
   lyricData={...result,file};
   if(!result.timed)message('Текст без временных меток — синхронизация недоступна.');
   for(const line of result.lines){
    const el=d.createElement(result.timed?'button':'p');el.className='sv-smart-lyric';el.textContent=line.text;
    if(result.timed){el.type='button';el.addEventListener('click',()=>{if(Number.isFinite(audio.duration))audio.currentTime=Math.min(line.time,audio.duration)})}
    body.append(el);
   }
   updateLine();
  }
  function updateLine(){
   if(mode!=='lyrics'||!lyricData||!dialog.open)return;
   if(music()?.rhythmFile?.()!==lyricData.file){close();return}
   if(!lyricData.timed)return;
   const next=activeLine(lyricData.lines,audio.currentTime);if(next===current)return;current=next;
   const rows=body.querySelectorAll('.sv-smart-lyric');
   rows.forEach((row,i)=>row.classList.toggle('is-current',i===next));
   const row=rows[next];if(row)body.scrollTop=Math.max(0,row.offsetTop-body.offsetTop-body.clientHeight*.35);
  }
  audio.addEventListener('timeupdate',updateLine);audio.addEventListener('seeking',updateLine);
  d.addEventListener('seyveo:music-state',updateLine);
  $('svSmartShare')?.addEventListener('click',share);
  $('svSmartSleep')?.addEventListener('click',sleepSheet);
  $('svSmartKaraoke')?.addEventListener('click',karaoke);
  function handle(q){
   const minutes=sleepMinutes(q);
   if(minutes!==null){setSleep(minutes);return {status:'scheduled',message:'Музыка остановится через '+minutes+' мин. Если браузер не приостановит работу приложения.'}}
   if(/^(?:отмени|отключи)\s+таймер сна$/.test(q)){cancelSleep();return {status:'changed',message:'Таймер сна отключён.'}}
   if(/^(?:что (?:сейчас )?играет|какая песня играет)$/.test(q)){const data=shareData();return {status:data?'found':'missing',message:data?data.text.split('\n')[0]:'Сейчас песня не выбрана.'}}
   return null;
  }
  w.SEYVEO_MUSIC_SMART=Object.freeze({handle,share,sleepSheet,karaoke});
 }
 return {embeddedLyrics,activeLine,sleepMinutes,install};
});
