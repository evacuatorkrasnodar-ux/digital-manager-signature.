/* Music-only navigation layer inside the existing dock shell.
   Never change the common navigation buttons, SVGs, attributes or handlers.
   Search stays the original standalone control; the main mini-player is reused. */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock.sv-shared-dock'),page=document.getElementById('sayviMusicPage');
 if(!dock||!page||window.SEYVEO_MUSIC_DOCK)return;
 const root=document.documentElement;
 const tabs=[["home","Музыка","<path d=\"M9 17.2V5.6l11-2.3v11.6M9 9l11-2.3\"/><ellipse cx=\"5.9\" cy=\"17.6\" rx=\"3.1\" ry=\"2.35\" transform=\"rotate(-12 5.9 17.6)\"/><ellipse cx=\"16.9\" cy=\"15.3\" rx=\"3.1\" ry=\"2.35\" transform=\"rotate(-12 16.9 15.3)\"/>"],["new","Новинки","<rect x=\"3.7\" y=\"3.7\" width=\"7\" height=\"7\" rx=\"1.8\"/><rect x=\"13.3\" y=\"3.7\" width=\"7\" height=\"7\" rx=\"1.8\"/><rect x=\"3.7\" y=\"13.3\" width=\"7\" height=\"7\" rx=\"1.8\"/><rect x=\"13.3\" y=\"13.3\" width=\"7\" height=\"7\" rx=\"1.8\"/>"],["radio","Радио","<circle cx=\"12\" cy=\"12\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M8.2 8.2a5.4 5.4 0 0 0 0 7.6m7.6-7.6a5.4 5.4 0 0 1 0 7.6M5.2 5.2a9.6 9.6 0 0 0 0 13.6m13.6-13.6a9.6 9.6 0 0 1 0 13.6\"/>"],["library","Медиатека","<path d=\"M5 5v14M9 5v14M13 5v14M16.5 5.5l4 13\"/>"]];
 const nav=document.createElement('nav');nav.className='sv-music-nav-only';nav.hidden=true;nav.setAttribute('aria-label','Разделы SEYVEO Music');
 for(const [key,label,icon] of tabs){const btn=document.createElement('button');btn.type='button';btn.dataset.musicNav=key;btn.setAttribute('aria-label',label);btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icon+'</svg><span>'+label+'</span>';nav.append(btn)}
 dock.append(nav);
 const panels={home:'svMusicHome',new:'svMusicNew',radio:'svMusicRadio',library:'svMusicLibrary',replay:'svMusicReplay',history:'svMusicHistory',podcasts:'svMusicPodcasts'};
 const get=id=>document.getElementById(id);
 let active=false,view='home',last='home',pending=false,libraryLimit=60;
 const inside=()=>location.hash==='#sayvi-music'&&!page.hidden;
 const music=()=>window.SEYVEO_MUSIC;
 // Palette is a stable hash of the local track identity, not a random color.
 const coverPalettes=[['#77969B','#315759'],['#8299B8','#354D73'],['#A091B3','#55446F'],['#BA9A81','#74513D'],['#819D8E','#3C6555'],['#B18F9E','#754C61'],['#8D9FAE','#465A71'],['#A9A17D','#6D633F']];
 const fallbackNote='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17.2V5.6l11-2.3v11.6M9 9l11-2.3"/><ellipse cx="5.9" cy="17.6" rx="3.1" ry="2.35" transform="rotate(-12 5.9 17.6)"/><ellipse cx="16.9" cy="15.3" rx="3.1" ry="2.35" transform="rotate(-12 16.9 15.3)"/></svg>';
 let coverObserver=null,coverGeneration=0;
 function stopCoverObserver(){coverObserver?.disconnect();coverObserver=null;coverGeneration++}
 function paintCover(art,src){
  if(!src)return false;
  art.classList.remove('sv-track-fallback');art.classList.add('sv-track-cover');
  art.replaceChildren();art.style.backgroundImage='url("'+src+'")';return true;
 }
 function fallbackCover(art,item){
  let hash=2166136261;
  for(const char of String(item.artKey||item.id||item.title||'music')){hash=Math.imul(hash^char.charCodeAt(0),16777619)}
  const [light,deep]=coverPalettes[(hash>>>0)%coverPalettes.length];
  art.classList.add('sv-track-fallback');
  art.style.setProperty('--sv-track-light',light);art.style.setProperty('--sv-track-deep',deep);
  art.innerHTML=fallbackNote;
 }
 function watchCover(row,item,art,title,artist,generation){
  if(item.radio||!music()?.prepareTrackPreview)return;
  const load=()=>{if(generation!==coverGeneration||!row.isConnected)return;
   music().prepareTrackPreview(item.index).then(info=>{
    if(!info||generation!==coverGeneration||!row.isConnected)return;
    title.textContent=info.title;artist.textContent=info.artist;
    if(info.artwork)paintCover(art,info.artwork);
   }).catch(()=>{});
  };
  if(typeof IntersectionObserver!=='function'){load();return}
  if(!coverObserver)coverObserver=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){
    coverObserver?.unobserve(entry.target);
    entry.target.svLoadCover?.();delete entry.target.svLoadCover;
   }
  },{root:page,rootMargin:'100px 0px'});
  row.svLoadCover=load;coverObserver.observe(row);
 }
 const historyMore=get('svMusicHistoryMore'),historyMenu=get('svMusicHistoryMenu'),historyClear=get('svMusicHistoryClear');
 function closeHistoryMenu(){if(historyMenu)historyMenu.hidden=true;historyMore?.setAttribute('aria-expanded','false')}
 function historyError(){window.alert('Не удалось сохранить изменение истории на этом устройстве.')}
 historyMore?.addEventListener('click',()=>{if(!historyMenu)return;historyMenu.hidden=!historyMenu.hidden;historyMore.setAttribute('aria-expanded',String(!historyMenu.hidden))});
 historyClear?.addEventListener('click',()=>{
  closeHistoryMenu();
  if(!window.confirm('Очистить историю прослушивания? Музыка и избранное останутся на устройстве.'))return;
  const localOK=music()?.removeRecentHistory?.()===true;
  const radioOK=window.SEYVEO_RADIO?.removeRecentHistory?.()!==false;
  renderTracks();if(!localOK||!radioOK)historyError();
 });
 document.addEventListener('click',e=>{if(historyMenu&&!historyMenu.hidden&&!historyMenu.contains(e.target)&&!historyMore?.contains(e.target))closeHistoryMenu()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&historyMenu&&!historyMenu.hidden){e.preventDefault();closeHistoryMenu();historyMore?.focus()}});
 function historySwipe(button,item,list){
  const row=document.createElement('div');row.className='sv-history-swipe';
  const remove=document.createElement('button');remove.type='button';remove.className='sv-history-remove';remove.hidden=true;remove.tabIndex=-1;
  remove.setAttribute('aria-label','Удалить из истории: '+item.title);
  remove.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14M9 7V4.5h6V7M7 7l.8 12h8.4L17 7M10 10v6m4-6v6"/></svg>';
  const forget=()=>{const ok=item.radio?window.SEYVEO_RADIO?.removeRecentHistory?.(item.id):music()?.removeRecentHistory?.(item.artKey);if(!ok)historyError();renderTracks()};
  remove.addEventListener('click',forget);
  let g=null,blocked=0;
  const isOpen=()=>row.classList.contains('is-open');
  function open(value){row.classList.toggle('is-open',value);remove.hidden=!value;remove.tabIndex=value?0:-1}
  function begin(x,y,id){
   for(const other of list.querySelectorAll('.sv-history-swipe.is-open'))if(other!==row){other.classList.remove('is-open');const action=other.querySelector('.sv-history-remove');action.hidden=true;action.tabIndex=-1}
   g={x,y,id,start:isOpen(),moving:false,vertical:false};
  }
  function move(x,y,e){
   if(!g||g.vertical)return;const dx=x-g.x,dy=y-g.y;
   if(!g.moving){if(Math.abs(dy)>9&&Math.abs(dy)>Math.abs(dx)){g.vertical=true;return}if(Math.abs(dx)<9||Math.abs(dx)<Math.abs(dy)||dx>0&&!g.start)return;g.moving=true;row.classList.add('is-moving');remove.hidden=false}
   if(e.cancelable)e.preventDefault();
   row.style.setProperty('--sv-history-offset',Math.max(-56,Math.min(0,(g.start?-56:0)+dx))+'px');
  }
  function finish(x,y,cancel=false){
   if(!g)return;const dx=x-g.x,dy=y-g.y;
   if(g.moving||!cancel&&!g.vertical&&dx<-35&&Math.abs(dx)>Math.abs(dy)*1.25){blocked=Date.now()+450;open(cancel?g.start:(g.start?-56:0)+dx<-26)}
   else if(cancel)open(g.start);
   g=null;row.classList.remove('is-moving');row.style.removeProperty('--sv-history-offset');
  }
  button.addEventListener('touchstart',e=>{if(e.touches.length===1){const p=e.touches[0];begin(p.clientX,p.clientY,p.identifier)}},{passive:true});
  button.addEventListener('touchmove',e=>{if(g&&e.touches.length===1){const p=e.touches[0];move(p.clientX,p.clientY,e)}},{passive:false});
  button.addEventListener('touchend',e=>{if(!g)return;const p=Array.from(e.changedTouches).find(t=>t.identifier===g.id);if(p){if(g.moving&&e.cancelable)e.preventDefault();finish(p.clientX,p.clientY)}},{passive:false});
  button.addEventListener('touchcancel',()=>{if(g)finish(g.x,g.y,true)},{passive:true});
  button.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0)return;begin(e.clientX,e.clientY,e.pointerId);try{button.setPointerCapture(e.pointerId)}catch{}});
  button.addEventListener('pointermove',e=>{if(g&&e.pointerType!=='touch'&&g.id===e.pointerId)move(e.clientX,e.clientY,e)});
  button.addEventListener('pointerup',e=>{if(g&&e.pointerType!=='touch'&&g.id===e.pointerId)finish(e.clientX,e.clientY)});
  button.addEventListener('pointercancel',e=>{if(g&&e.pointerType!=='touch')finish(g.x,g.y,true)});
  button.addEventListener('click',e=>{if(Date.now()<blocked||isOpen()){e.preventDefault();e.stopImmediatePropagation();if(isOpen()&&Date.now()>=blocked)open(false)}},true);
  button.addEventListener('keydown',e=>{if(e.key==='Delete'){e.preventDefault();forget()}});
  button.setAttribute('aria-keyshortcuts','Delete');row.append(button,remove);return row;
 }
 // Keep up to five complete recent rows, leaving breathing room above the dock.
 let recentFitFrame=0;
 function fitRecentRows(){
  recentFitFrame=0;
  if(!active||view!=='home')return;
  const list=get('svMusicRecent');
  if(!list||!list.getClientRects().length)return;
  const rows=Array.from(list.querySelectorAll('.sv-music-recent-card'));
  if(!rows.length)return;
  for(const row of rows)row.style.removeProperty('display');
  const viewport=window.visualViewport;
  let bottom=Math.min(viewport?viewport.offsetTop+viewport.height:window.innerHeight,page.getBoundingClientRect().bottom);
  for(const control of [dock,get('sayviMusicMini')]){
   if(!control||control.hidden||!control.getClientRects().length)continue;
   const rect=control.getBoundingClientRect();
   if(rect.height>0&&rect.top>list.getBoundingClientRect().top)bottom=Math.min(bottom,rect.top);
  }
  const boundary=bottom-18;
  const ends=rows.map(row=>row.getBoundingClientRect().bottom);
  for(let i=1;i<rows.length;i++)if(ends[i]>boundary)rows[i].style.setProperty('display','none','important');
 }
 function scheduleRecentFit(){
  if(!active||view!=='home'||recentFitFrame)return;
  recentFitFrame=requestAnimationFrame(fitRecentRows);
 }
 function renderTracks(){
  stopCoverObserver();const generation=coverGeneration;
  if(!active)return;
  if(!['home','history','library'].includes(view))return;
  const recentRadio=window.SEYVEO_RADIO?.recent?.()||[];
  const recentLocal=music()?.recentTracks?.()||[];
  const history=[...recentLocal,...recentRadio].sort((a,b)=>(b.playedAt||0)-(a.playedAt||0));
  if(historyMore)historyMore.disabled=!history.length;
  if(!history.length)closeHistoryMenu();
  const library=view==='library'?(music()?.browseTracks?.()||[]):[];
  const lists=view==='home'?[['svMusicRecent',history.slice(0,5),true]]:view==='history'?[['svMusicHistoryTracks',history,false]]:[['svMusicLibraryTracks',library.slice(0,libraryLimit),false]];
  for(const [id,items,recent] of lists){
   const el=get(id);if(!el)continue;el.replaceChildren();
   if(!items.length){const empty=document.createElement('p');empty.className=recent?'sv-music-recent-empty':'sv-music-browse-caption';empty.textContent=recent||view==='history'?'Включите любимую станцию или добавьте музыку. Здесь появится история прослушивания.':'Добавьте аудиофайлы с устройства.';el.append(empty);continue}
   for(const item of items){
    const button=document.createElement('button');button.type='button';button.className=recent?'sv-music-recent-card':'sv-music-library-track';
    const art=document.createElement('span');art.className='sv-music-track-tile';art.setAttribute('aria-hidden','true');
    if(!paintCover(art,item.artwork))fallbackCover(art,item);
    const title=document.createElement('strong');title.textContent=item.title;const artist=document.createElement('small');artist.textContent=item.artist;
    const copy=document.createElement('span');copy.className='sv-music-track-tile-copy';copy.append(title,artist);button.append(art,copy);
    if(recent||view==='library'||view==='history'){const icon=document.createElement('span');icon.className=recent?'sv-music-recent-play':'sv-library-track-play';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24"><path d="M8 5.5v13L19 12z"/></svg>';button.append(icon)}
    button.addEventListener('click',()=>{if(item.radio){if(window.SEYVEO_RADIO?.play?.(item.id))show('player')}else if(music()?.playIndexFromSearch?.(item.index))show('player')});el.append(view==='history'?historySwipe(button,item,el):button);
    watchCover(button,item,art,title,artist,generation);
   }
   if(view==='library'&&library.length>libraryLimit){
    const more=document.createElement('button');more.type='button';more.className='sv-replay-back';more.style.cssText='display:block;width:100%;min-height:44px;text-align:center';more.textContent='Показать ещё · '+Math.min(60,library.length-libraryLimit);more.addEventListener('click',()=>{libraryLimit+=60;renderTracks()});el.append(more);
   }
  }
  scheduleRecentFit();
 }
 document.addEventListener('seyveo:radio-history',renderTracks);
 const periodSelect=get('svMusicReplayPeriod'),periodTrigger=get('svReplayPeriodTrigger'),periodMenu=get('svReplayPeriodMenu'),periodLabel=get('svReplayPeriodLabel');
 function closePeriod(restore=false){
  if(!periodMenu||!periodTrigger)return;
  periodMenu.hidden=true;periodTrigger.setAttribute('aria-expanded','false');
  if(restore)periodTrigger.focus({preventScroll:true});
 }
 function syncPeriod(){
  if(!periodSelect||!periodLabel||!periodMenu)return;
  periodLabel.textContent=periodSelect.selectedOptions[0]?.textContent||'Выбрать период';
  for(const button of periodMenu.querySelectorAll('button[data-period]'))button.setAttribute('aria-checked',String(button.dataset.period===periodSelect.value));
 }
 function openPeriod(){
  if(!periodMenu||!periodSelect||!periodTrigger)return;
  periodMenu.replaceChildren();
  if(window.SEYVEO_WHEEL?.mount&&periodSelect.options.length){
   periodMenu.setAttribute('role','group');periodMenu.classList.add('sv-replay-wheel-menu');
   const wheel=document.createElement('div');wheel.setAttribute('aria-label','Период музыкальной статистики');
   const done=document.createElement('button');done.type='button';done.className='sv-replay-wheel-done';done.textContent='Готово';
   periodMenu.append(wheel,done);periodMenu.hidden=false;periodTrigger.setAttribute('aria-expanded','true');
   const picker=window.SEYVEO_WHEEL.mount(wheel,Array.from(periodSelect.options,o=>({value:o.value,label:o.textContent})),periodSelect.value);
   done.addEventListener('click',()=>{periodSelect.value=picker.value;closePeriod(true);periodSelect.dispatchEvent(new Event('change',{bubbles:true}))});
   wheel.focus({preventScroll:true});return;
  }
  periodMenu.setAttribute('role','menu');periodMenu.classList.remove('sv-replay-wheel-menu');
  for(const option of periodSelect.options){
   const button=document.createElement('button');button.type='button';button.dataset.period=option.value;button.setAttribute('role','menuitemradio');
   const title=document.createElement('span');title.textContent=option.textContent;
   button.innerHTML='<svg class="sv-period-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4m8-4v4M4 10h16"/></svg>';
   button.append(title);
   const check=document.createElement('span');check.className='sv-period-check';check.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>';button.append(check);
   button.addEventListener('click',()=>{periodSelect.value=option.value;closePeriod(true);periodSelect.dispatchEvent(new Event('change',{bubbles:true}))});
   periodMenu.append(button);
  }
  syncPeriod();periodMenu.hidden=false;periodTrigger.setAttribute('aria-expanded','true');
  periodMenu.querySelector('[aria-checked="true"]')?.focus({preventScroll:true});
  periodMenu.querySelector('[aria-checked="true"]')?.scrollIntoView({block:'nearest'});
 }
 periodTrigger?.addEventListener('click',()=>{if(periodMenu?.hidden)openPeriod();else closePeriod(true)});
 document.addEventListener('click',event=>{if(periodMenu&&!periodMenu.hidden&&!periodMenu.contains(event.target)&&!periodTrigger?.contains(event.target))closePeriod()});
 periodMenu?.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closePeriod(true);return}
  if(periodMenu.classList.contains('sv-replay-wheel-menu'))return;
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  event.preventDefault();const buttons=Array.from(periodMenu.querySelectorAll('button'));const i=buttons.indexOf(document.activeElement);
  const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
  buttons[next]?.focus();
 });
 const portraitColors=['#6688bc','#8a81bb','#69a4a4','#be91ad','#a4aabf','#b5a17b'];
 const portraitEl=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el};
 const portraitDuration=seconds=>{const m=Math.floor(Math.max(0,seconds)/60);return m>=60?Math.floor(m/60)+' ч '+m%60+' мин':m?m+' мин':seconds>0?'Меньше минуты':'0 мин'};
 const priorPeriod=p=>{if(/^\d{4}$/.test(p))return String(Number(p)-1);const [y,m]=p.split('-').map(Number),d=new Date(y,m-2,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
 function portraitPanel(title,sub){const el=portraitEl('section','sv-portrait-panel');el.append(portraitEl('h3','sv-portrait-title',title));if(sub)el.append(portraitEl('p','sv-portrait-sub',sub));return el}
 function portraitInsight(p,previous){
  const sufficient=(a,kind)=>a.music>=600&&a[kind+'Known']/a.music>=.6;
  if(sufficient(p,'genre')&&sufficient(previous,'genre')){
   const old=new Map(previous.genres.map(r=>[r.name,r.seconds/previous.genreKnown]));
   const changed=p.genres.map(r=>({name:r.name,delta:r.seconds/p.genreKnown-(old.get(r.name)||0)})).sort((a,b)=>b.delta-a.delta)[0];
   if(changed&&changed.delta>=.05)return 'В твоём музыкальном мире стало больше направления «'+changed.name+'» — на '+Math.round(changed.delta*100)+' п. п. среди музыки с известным жанром.';
  }
  if(p.artists.length&&previous.artists.length&&p.artists[0].name!==previous.artists[0].name)return 'Новый лидер твоего музыкального мира — '+p.artists[0].name+'. За этот период ты слушал этого исполнителя '+portraitDuration(p.artists[0].seconds)+'.';
  if(sufficient(p,'genre')&&p.genres.length)return 'Сейчас в твоём музыкальном мире лидирует '+p.genres[0].name.toLowerCase()+'. Сэйви учтёт любимых исполнителей в подборке новинок.';
  if(p.artists.length)return 'Больше всего твоего времени заняла музыка '+p.artists[0].name+' — '+portraitDuration(p.artists[0].seconds)+'. Сэйви учитывает это при выборе новинок.';
  return 'Твой музыкальный мир постепенно складывается из того, что ты слушаешь.';
 }
 function renderPortrait(out,p,previous,period,total){
  if(!p||!p.total)return;
  const insight=portraitEl('div','sv-portrait-insight');
  const orb=portraitEl('span','sv-portrait-orb sv-sayvi-symbol');orb.setAttribute('aria-hidden','true');
  const copy=portraitEl('div','sv-portrait-insight-copy');copy.append(portraitEl('small','','Сэйви заметила'),portraitEl('p','',portraitInsight(p,previous)));insight.append(orb,copy);total.append(insight);
  const grid=portraitEl('div','sv-portrait-grid');out.append(grid);
  const daily=portraitPanel(/^\d{4}$/.test(period)?'Музыка по месяцам':'Музыка по дням');
  if(p.trackedFrom){
   const year=/^\d{4}$/.test(period);let entries=[];
   if(year){for(let i=1;i<=12;i++){const m=period+'-'+String(i).padStart(2,'0');entries.push({key:m,label:new Date(Number(period),i-1,1).toLocaleDateString('ru-RU',{month:'short'}),seconds:Object.entries(p.days).filter(([d])=>d.startsWith(m)).reduce((a,[,v])=>a+v,0),known:m>=p.trackedFrom.slice(0,7)})}}
   else{const [y,m]=period.split('-').map(Number),count=new Date(y,m,0).getDate();for(let i=1;i<=count;i++){const key=period+'-'+String(i).padStart(2,'0');entries.push({key,label:String(i),seconds:p.days[key]||0,known:key>=p.trackedFrom})}}
   const now=new Date(),today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');entries=entries.filter(e=>e.key<=today.slice(0,e.key.length));
   const max=Math.max(60,...entries.map(e=>e.seconds)),chart=portraitEl('div','sv-portrait-bars'),detail=portraitEl('div','sv-portrait-chart-detail');
   const peak=entries.reduce((a,b)=>b.seconds>(a?.seconds||0)?b:a,null);
   const detailDefault=peak?'Максимум · '+(year?peak.label:peak.label+' число')+' · '+portraitDuration(peak.seconds):'Пока мало данных';
   detail.textContent=detailDefault;detail.setAttribute('aria-live','polite');
   entries.forEach((e,i)=>{const col=portraitEl('button','sv-portrait-bar-col');col.type='button';col.disabled=!e.known;col.setAttribute('aria-label',(year?e.label:e.label+' число')+': '+(e.known?portraitDuration(e.seconds):'нет детализации'));const rail=portraitEl('span','sv-portrait-bar-rail'),bar=portraitEl('i','sv-portrait-bar');bar.style.height=(e.known?Math.max(e.seconds?4:0,100*e.seconds/max):0)+'%';if(peak===e)bar.classList.add('is-peak');rail.append(bar);const label=portraitEl('small','',year||i===0||i===entries.length-1||i%7===6?e.label:'');col.append(rail,label);col.addEventListener('click',()=>{detail.textContent=(year?e.label:e.label+' число')+' · '+portraitDuration(e.seconds)});chart.append(col)});
   daily.append(detail,chart);
   const tracked=Object.values(p.days).reduce((a,b)=>a+b,0);if(tracked<p.total*.99)daily.append(portraitEl('p','sv-portrait-note','Детализация доступна с '+p.trackedFrom.split('-').reverse().join('.')+'. Более раннее время сохранено в общем итоге.'));
  }else{daily.classList.add('is-empty');daily.append(portraitEl('p','sv-portrait-empty','График появится с новыми прослушиваниями.'));}
  grid.append(daily);
  function distribution(title,kind,rows,known,oldRows,oldKnown){
   const panel=portraitPanel(title);
   if(!known){panel.classList.add('is-empty');panel.append(portraitEl('p','sv-portrait-empty',kind==='genre'?'Сэйви ещё знакомится с твоими жанрами.':'Пока недостаточно данных о языках песен.'));return panel}
   const displayed=rows.slice(0,5),rest=known-displayed.reduce((n,r)=>n+r.seconds,0);if(rest>0.5)displayed.push({name:'Другие',seconds:rest});
   const donut=portraitEl('div','sv-portrait-donut'),stops=[];let at=0;
   displayed.forEach((r,i)=>{const end=at+r.seconds/known*100;stops.push(portraitColors[i%portraitColors.length]+' '+at+'% '+end+'%');at=end});
   donut.style.background='conic-gradient('+stops.join(',')+')';
   const center=portraitEl('div','sv-portrait-donut-center');center.append(portraitEl('strong','',Math.round(displayed[0].seconds/known*100)+'%'),portraitEl('small','',displayed[0].name));donut.append(center);donut.setAttribute('aria-hidden','true');
   const body=portraitEl('div','sv-portrait-distribution');body.append(donut);const legend=portraitEl('div','sv-portrait-legend');
   const canCompare=p.music>=600&&previous.music>=600&&known/p.music>=.6&&oldKnown/previous.music>=.6;
   const old=new Map(oldRows.map(r=>[r.name,r.seconds/oldKnown]));
   displayed.forEach((r,i)=>{const row=portraitEl('div','sv-portrait-legend-row'),dot=portraitEl('i','');dot.style.background=portraitColors[i%portraitColors.length];const name=portraitEl('span','',r.name),percent=portraitEl('strong','',Math.round(r.seconds/known*100)+'%');row.append(dot,name,percent);if(canCompare&&r.name!=='Другие'){const change=Math.round((r.seconds/known-(old.get(r.name)||0))*100);if(change)row.append(portraitEl('small','sv-portrait-change '+(change>0?'up':'down'),(change>0?'+':'')+change+' п. п.'))}legend.append(row)});body.append(legend);panel.append(body);
   const coverage=Math.min(100,Math.round(known/Math.max(1,p.music)*100));panel.append(portraitEl('p','sv-portrait-note',(canCompare?'Динамика к прошлому периоду · ':'')+'Известно для '+coverage+'% времени музыки'));return panel;
  }
  grid.append(distribution('Жанры и изменение вкуса','genre',p.genres,p.genreKnown,previous.genres,previous.genreKnown));
  const sourcePanel=portraitPanel('Любимые источники музыки','По времени прослушивания');
  const sourceRows=Array.isArray(p.sources)?p.sources:[],sourceTotal=sourceRows.reduce((n,r)=>n+r.seconds,0);
  const oldSources=Array.isArray(previous.sources)?previous.sources:[],oldSourceTotal=oldSources.reduce((n,r)=>n+r.seconds,0);
  const unknownSource='Медиатека · без источника';
  const knownShare=(rows,total)=>total?1-(rows.find(r=>r.name===unknownSource)?.seconds||0)/total:0;
  const compareSources=sourceTotal>=600&&oldSourceTotal>=600&&sourceTotal>=p.total*.95&&oldSourceTotal>=previous.total*.95&&knownShare(sourceRows,sourceTotal)>=.6&&knownShare(oldSources,oldSourceTotal)>=.6;
  const oldSourceShares=new Map(oldSources.map(r=>[r.name,r.seconds/Math.max(1,oldSourceTotal)*100]));
  if(sourceTotal>0){
   const list=portraitEl('div','sv-portrait-source-list');
   const displayed=sourceRows.slice(0,6),rest=sourceTotal-displayed.reduce((n,r)=>n+r.seconds,0);
   if(rest>.5)displayed.push({name:'Другие источники',seconds:rest});
   displayed.forEach((r,i)=>{
    const row=portraitEl('div','sv-portrait-source-row'),head=portraitEl('div','sv-portrait-source-head');
    const share=r.seconds/sourceTotal*100;
    head.append(portraitEl('span','',r.name===unknownSource?'Моя медиатека':r.name),portraitEl('strong','',Math.round(share)+'%'));
    if(compareSources&&r.name!==unknownSource&&r.name!=='Другие источники'){const change=Math.round(share-(oldSourceShares.get(r.name)||0));if(change)head.append(portraitEl('small','sv-portrait-change '+(change>0?'up':'down'),(change>0?'+':'')+change+' п. п.'));}
    const track=portraitEl('div','sv-portrait-rhythm-track'),fill=portraitEl('i','');
    fill.style.width=share+'%';fill.style.background=portraitColors[i%portraitColors.length];track.append(fill);
    row.append(head,track,portraitEl('small','sv-portrait-source-time',portraitDuration(r.seconds)));list.append(row);
   });
   sourcePanel.append(list);
   if(sourceRows.some(r=>r.name===unknownSource))sourcePanel.append(portraitEl('p','sv-portrait-note','Моя медиатека — треки без указанного источника.'));
   if(compareSources)sourcePanel.append(portraitEl('p','sv-portrait-note','Изменения к прошлому периоду.'));
   if(sourceTotal<p.total*.99)sourcePanel.append(portraitEl('p','sv-portrait-note','Данные доступны не для всей истории прослушиваний.'));
  }else{sourcePanel.classList.add('is-empty');sourcePanel.append(portraitEl('p','sv-portrait-empty','Источники появятся с новыми прослушиваниями.'));}
  grid.append(sourcePanel);
  grid.append(distribution('Языки музыки','language',p.languages,p.languageKnown,previous.languages,previous.languageKnown));
  const times=portraitPanel('Твой музыкальный ритм');
  const bands=[['Утро',6,12],['День',12,18],['Вечер',18,24],['Ночь',0,6]].map(([name,a,b])=>({name,seconds:p.hours.slice(a,b).reduce((n,v)=>n+v,0)})),hourTotal=bands.reduce((a,r)=>a+r.seconds,0);
  if(hourTotal){const leader=[...bands].sort((a,b)=>b.seconds-a.seconds)[0];times.append(portraitEl('p','sv-portrait-rhythm-note',leader.name+' — твоё самое музыкальное время'));const rails=portraitEl('div','sv-portrait-rhythm');bands.forEach((r,i)=>{const row=portraitEl('div','sv-portrait-rhythm-row'),track=portraitEl('span','sv-portrait-rhythm-track'),fill=portraitEl('i','');fill.style.width=r.seconds/hourTotal*100+'%';fill.style.background=portraitColors[i];track.append(fill);row.append(portraitEl('span','',r.name),track,portraitEl('strong','',Math.round(r.seconds/hourTotal*100)+'%'));rails.append(row)});times.append(rails)}else{times.classList.add('is-empty');times.append(portraitEl('p','sv-portrait-empty','Сэйви изучает твой музыкальный ритм.'));}
  grid.append(times);
 }
 function animateReplay(out){
  if(view!=='replay'||document.hidden||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const nodes=[...out.querySelectorAll('.sv-replay-total,.sv-portrait-panel,.sv-music-section-title,.sv-replay-row')].slice(0,12);
  nodes.forEach((node,i)=>{
   if(typeof node.animate!=='function')return;
   node.animate([{opacity:.12,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,delay:Math.min(i,5)*22,easing:'cubic-bezier(.2,.7,.25,1)',fill:'backwards'});
  });
  const chart=out.querySelector('.sv-replay-chart-bar');
  if(typeof chart?.animate==='function')chart.animate([{opacity:.2,transform:'scaleX(.96)'},{opacity:1,transform:'scaleX(1)'}],{duration:220,easing:'ease-out'});
 }
 let replayMotionPeriod='';
 function renderReplay(scan=true,enter=false){
  const select=get('svMusicReplayPeriod'),out=get('svMusicReplayResults');if(!select||!out)return;
  if(!select.options.length){
   const now=new Date(),format=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'});
   for(let i=0;i<24;i++){const d=new Date(now.getFullYear(),now.getMonth()-i,1),option=document.createElement('option');option.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');option.textContent=format.format(d);select.append(option)}
   for(let i=0;i<3;i++){const y=now.getFullYear()-i,option=document.createElement('option');option.value=String(y);option.textContent='Итоги '+y+' года';select.append(option)}
  }
  syncPeriod();
  const data=music()?.replaySummary?.(select.value);out.replaceChildren();if(!data)return;
  const animate=enter||replayMotionPeriod!==select.value;replayMotionPeriod=select.value;
  const total=document.createElement('div');total.className='sv-replay-total';
  const minutes=Math.max(0,Math.floor(data.seconds/60)),hours=Math.floor(minutes/60),value=document.createElement('strong');value.textContent=hours?hours.toLocaleString('ru-RU')+' ч '+(minutes%60)+' мин':minutes+' мин';
  const label=document.createElement('span');label.textContent='Время прослушивания';total.append(value,label);out.append(total);
  const localSeconds=Number(data.musicSeconds)||0,radioSeconds=Number(data.radioSeconds)||0,combined=localSeconds+radioSeconds;
  if(combined>0){
   const chart=document.createElement('div');chart.className='sv-replay-chart';
   const bar=document.createElement('div');bar.className='sv-replay-chart-bar';bar.setAttribute('role','img');
   const legend=document.createElement('div');legend.className='sv-replay-chart-legend';
   const labels=[];
   for(const [name,seconds,kind] of [['Музыка',localSeconds,'music'],['Радио',radioSeconds,'radio']]){
    const percent=Math.round(seconds/combined*100);labels.push(name+' '+percent+'%');
    const part=document.createElement('i');part.className='sv-replay-chart-'+kind;part.style.flexGrow=String(seconds);bar.append(part);
    const item=document.createElement('span');item.className='sv-replay-chart-'+kind;item.textContent=name+' '+percent+'%';legend.append(item);
   }
   bar.setAttribute('aria-label',labels.join(', '));chart.append(bar,legend);total.append(chart);
  }
  const duration=s=>s<60?Math.floor(s)+' сек.':Math.floor(s/60)+' мин.';
  if(!data.seconds){const empty=document.createElement('p');empty.className='sv-music-browse-caption';empty.textContent='Слушайте музыку и радио. Здесь появятся ваши настоящие музыкальные итоги.';out.append(empty);if(animate)animateReplay(out);return}
  const portrait=music()?.replayPortrait?.(select.value),previous=music()?.replayPortrait?.(priorPeriod(select.value));
  if(portrait&&previous)renderPortrait(out,portrait,previous,select.value,total);
  if(scan&&music()?.enrichReplayPortrait){const selected=select.value;music().enrichReplayPortrait().then(changed=>{if(changed&&view==='replay'&&select.value===selected)renderReplay(false)}).catch(()=>{})}
  const libraryByKey=new Map((music()?.browseTracks?.()||[]).map(track=>[track.artKey,track]));
  for(const [title,items] of [['Любимые исполнители',data.artists],['Любимые треки',data.tracks],['Любимые станции',data.stations]]){
   if(!items.length)continue;
   const h=document.createElement('h3');h.textContent=title;h.className='sv-music-section-title';out.append(h);
   for(const [i,item] of items.entries()){
    const key=title==='Любимые треки'?String(item.key||'').replace(/^file:/,''):'';
    const match=key?libraryByKey.get(key):null;
    const row=document.createElement(match?'button':'div');row.className='sv-replay-row';
    if(match){
     row.type='button';row.classList.add('sv-replay-playable');
     row.setAttribute('aria-label','Воспроизвести: '+item.title+(item.artist?' — '+item.artist:''));
     row.addEventListener('click',()=>{
      const current=music()?.browseTracks?.().find(track=>track.artKey===key);
      if(current&&music()?.playIndexFromSearch?.(current.index))show('player');
     });
    }const rank=document.createElement('span');rank.textContent=String(i+1);rank.className='sv-replay-rank';const copy=document.createElement('span');copy.className='sv-replay-copy';const name=document.createElement('strong');name.textContent=item.title;const sub=document.createElement('small');sub.textContent=item.artist||'';copy.append(name,sub);const time=document.createElement('span');time.textContent=duration(item.seconds);time.className='sv-replay-time';row.append(rank);
    if(title==='Любимые треки'){
     const art=document.createElement('span');art.className='sv-music-track-tile sv-replay-art';art.setAttribute('aria-hidden','true');
     if(!paintCover(art,match?.artwork))fallbackCover(art,{artKey:key||item.title});
     row.append(art);
     if(match&&!match.artwork&&music()?.prepareTrackPreview)music().prepareTrackPreview(match.index).then(info=>{if(art.isConnected&&info?.artwork)paintCover(art,info.artwork)}).catch(()=>{});
    }
    if(title==='Любимые исполнители'){
     const art=document.createElement('span');art.className='sv-music-track-tile sv-replay-art sv-replay-artist-art';art.setAttribute('aria-hidden','true');
     fallbackCover(art,{artKey:item.title});art.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.3"/><path d="M5 19c0-3.3 2.8-5.5 7-5.5s7 2.2 7 5.5"/></svg>';row.append(art);
    }
    if(!item.artist)sub.hidden=true;
    row.append(copy,time);out.append(row)}
  }
  if(animate)animateReplay(out);
 }
 get('svMusicReplayPeriod')?.addEventListener('change',()=>renderReplay());
 document.getElementById('sayviMusicAudio')?.addEventListener('pause',()=>{if(view==='replay')renderReplay()});
 const more=get('svNowMore'),menu=get('svNowMenu'),queue=get('svNowQueue');
 function closeNowMenu(restore=false){
  if(!menu)return;menu.hidden=true;more?.setAttribute('aria-expanded','false');
  if(restore)more?.focus({preventScroll:true});
 }
 more?.addEventListener('click',()=>{
  if(!menu)return;
  if(!menu.hidden){closeNowMenu(true);return}
  music()?.closePanels?.();menu.hidden=false;more.setAttribute('aria-expanded','true');
  get('svNowMenuClose')?.focus({preventScroll:true});
 });
 get('svNowMenuClose')?.addEventListener('click',()=>closeNowMenu(true));
 queue?.addEventListener('click',()=>{closeNowMenu();music()?.toggleQueue?.()});
 menu?.addEventListener('click',e=>{if(e.target.closest('.sv-now-menu-row'))closeNowMenu()});
 document.addEventListener('click',e=>{if(menu&&!menu.hidden&&!menu.contains(e.target)&&!more?.contains(e.target))closeNowMenu()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu&&!menu.hidden){e.preventDefault();e.stopImmediatePropagation();closeNowMenu(true)}},true);
 function show(key){
  if(!active||(!Object.hasOwn(panels,key)&&key!=='player'))return false;
  closeHistoryMenu();closePeriod();closeNowMenu();music()?.closePanels?.();
  if(key==='library'&&view!=='player'&&view!=='library')libraryLimit=60;
  const changed=view!==key;view=key;if(key!=='player')last=key;
  page.dataset.musicView=key;root.classList.toggle('sv-music-browse',key!=='player');root.classList.toggle('sv-music-player-open',key==='player');
  for(const [name,id] of Object.entries(panels))get(id).hidden=name!==key;
  const discovery=get('sayviDiscoveryPanel');if(discovery)discovery.hidden=key!=='new';
  get('sayviMusicDiscoveryToggle')?.setAttribute('aria-expanded',String(key==='new'));
  get('svMusicRadioToggle')?.setAttribute('aria-expanded',String(key==='radio'));
  for(const btn of nav.querySelectorAll('button')){const selected=btn.dataset.musicNav===(key==='podcasts'?'library':['replay','history'].includes(key)?'home':key);btn.setAttribute('aria-pressed',String(selected));if(selected)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')}
  page.scrollTop=0;renderTracks();if(key==='replay')renderReplay(true,changed);music()?.refreshMini?.();
  if(changed&&key!=='player'&&key!=='new'&&key!=='replay'&&key!=='radio'&&!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){const target=get(panels[key]);if(typeof target?.animate==='function'){target.getAnimations?.().filter(a=>a.id==='svMusicEnter').forEach(a=>a.cancel());const motion=target.animate([{opacity:.48},{opacity:1}],{duration:170,easing:'ease-out'});motion.id='svMusicEnter';}}
  document.dispatchEvent(new CustomEvent('seyveo:music-view',{detail:{view:key}}));
  return true;
 }
 function enter(){
  if(active)return;active=true;nav.hidden=false;dock.classList.add('seyveo-music-dock','sv-music-navigation-only');
  const key=pending==='new'?'new':pending?'player':'home';pending=false;last='home';show(key);
 }
 function leave(){
  if(!active)return;closeHistoryMenu();closePeriod();closeNowMenu();stopCoverObserver();active=false;nav.hidden=true;dock.classList.remove('seyveo-music-dock','sv-music-navigation-only');
  root.classList.remove('sv-music-browse','sv-music-player-open');delete page.dataset.musicView;
  for(const id of Object.values(panels))get(id).hidden=true;
  const discovery=get('sayviDiscoveryPanel');if(discovery)discovery.hidden=true;
  document.dispatchEvent(new CustomEvent('seyveo:music-view',{detail:{view:null}}));
  document.dispatchEvent(new Event('seyveo:music-dock-exit'));window.SEYVEO_MAGNETIC_INK?.refresh?.();music()?.refreshMini?.();
 }
 function refresh(){if(inside())enter();else leave()}
 function openPlayer(){if(active)return show('player');pending=true;return music()?.open?.()}
 function openNew(){if(active)return show('new');pending='new';const ok=music()?.open?.();if(!ok)pending=false;return !!ok}
 function closePlayer(){
  if(!active||view!=='player')return false;
  const stage=get('sayviMusicStage'),art=get('sayviMusicArtwork'),mini=get('sayviMusicMini');
  let snapshot=null;
  if(stage&&typeof stage.animate==='function'&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   const rect=stage.getBoundingClientRect();
   if(rect.width>40&&rect.height>40&&rect.top>=0&&rect.bottom<=innerHeight+1){
    const real=art&&!art.hidden;
    const ambient=page.querySelector('.sv-now-ambient');
    const palette=ambient?Array.from(ambient.querySelectorAll(':scope > span')).reverse().find(node=>Number(getComputedStyle(node).opacity)>.6):null;
    const source=real?art:(palette||ambient);
    if(source)snapshot={rect,background:getComputedStyle(source).backgroundImage,real};
   }
  }
  const ok=show(last);
  if(!ok||!snapshot||!mini)return ok;
  requestAnimationFrame(()=>{
   if(!active||view==='player'||mini.hidden||document.hidden)return;
   const symbol=mini.querySelector('.sv-music-mini-symbol');if(!symbol)return;
   const end=symbol.getBoundingClientRect(),start=snapshot.rect;
   if(end.width<12||end.height<12||end.bottom>innerHeight+1)return;
   const ghost=document.createElement('span');ghost.setAttribute('aria-hidden','true');
   Object.assign(ghost.style,{position:'fixed',left:start.left+'px',top:start.top+'px',width:start.width+'px',height:start.height+'px',
    borderRadius:'20px',overflow:'hidden',pointerEvents:'none',zIndex:'9999',backgroundColor:'#315759',
    backgroundImage:snapshot.background,backgroundSize:'cover',backgroundPosition:'center',transformOrigin:'top left',display:'grid',placeItems:'center'});
   if(!snapshot.real){
    const glyph=mini.querySelector('.sv-music-mini-placeholder')?.cloneNode(true);
    if(glyph){Object.assign(glyph.style,{width:'30%',height:'30%',stroke:'#F2F9F8',fill:'none'});ghost.append(glyph)}
   }
   document.body.append(ghost);
   const sx=end.width/start.width,sy=end.height/start.height;
   try{
    const animation=ghost.animate([
     {transform:'translate(0px,0px) scale(1)',borderRadius:'20px',opacity:.98},
     {transform:'translate('+(end.left-start.left)+'px,'+(end.top-start.top)+'px) scale('+sx+','+sy+')',borderRadius:'50%',opacity:.92}
    ],{duration:320,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
    animation.onfinish=animation.oncancel=()=>ghost.remove();
   }catch{ghost.remove()}
  });
  return ok;
 }
 nav.addEventListener('click',e=>{const btn=e.target.closest('button[data-music-nav]');if(!btn)return;e.preventDefault();e.stopPropagation();show(btn.dataset.musicNav)});
 page.addEventListener('click',e=>{const btn=e.target.closest('[data-music-view-action]');if(!btn)return;const key=btn.dataset.musicViewAction;if(key==='youtube'){closeNowMenu();music()?.closePanels?.();window.SEYVEO_VIDEO?.open({from:'music'});}else if(key==='import')get('sayviMusicImport')?.click();else if(key==='favorites')get('sayviMusicFavoritesToggle')?.click();else if(key==='sources')get('sayviMusicSourcesToggle')?.click();else if(key==='home'&&view==='podcasts'&&btn.classList.contains('sv-music-inner-back'))show('library');else show(key)});
 window.addEventListener('resize',scheduleRecentFit,{passive:true});
 window.visualViewport?.addEventListener('resize',scheduleRecentFit,{passive:true});
 window.addEventListener('hashchange',refresh);window.addEventListener('seyveo:route-changed',refresh);
 new MutationObserver(refresh).observe(page,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('seyveo:music-state',()=>{refresh();renderTracks()});
 window.SEYVEO_MUSIC_DOCK=Object.freeze({setMode:refresh,isActive:()=>active,show,openPlayer,openNew,closePlayer});
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
/* Curated international radio; direct HTTPS playback uses the shared Music engine. */
(()=>{'use strict';
function initRadio(){
 const page=document.getElementById('sayviMusicPage'),audio=document.getElementById('sayviMusicAudio'),panel=document.getElementById('svMusicRadio'),toggle=document.getElementById('svMusicRadioToggle');
 if(!page||!audio||!panel||!toggle||panel.dataset.ready)return;
 panel.dataset.ready='true';
 const raw=[["Россия","krd998","Радио Краснодар","Поп · хиты · городские новости","99.8 FM","https://icecast-radiokrasnodar.cdnvideo.ru/radiokrasnodar_tpr_01","","","https://tvkrasnodar.ru/radio/","#496e79","#9abeb5"],["Россия","krdpervoe","Первое радио Кубани","Поп · хиты · городские новости","102.7 FM","https://stream.pervoe.fm:8443/","","","https://pervoe.fm/","#566f91","#bbc8d8"],["Россия","krdkazak","Казак FM","Фолк · народная музыка · эстрада","105.2 FM","https://radio.kazak.fm/kazak_fm.mp3","","","https://kazak.fm/","#536f60","#c3b28e"],["Россия","krd107","Радио 107","Поп · танцевальная · хиты","107.7 FM",["127.0.0.1:8790","localhost:8790"].includes(location.host)?"/api/seyveo-radio-107?quality=256":"","128 MP3","/api/seyveo-radio-107?quality=128","https://www.radio107.ru/","#6a5978","#bca9ca"],["Россия","europaplus","Европа Плюс","Поп · танцевальная · хиты","256 MP3","https://ep256.hostingradio.ru:8052/europaplus256.mp3","","","https://europaplus.ru/","#31569a","#6f9dd0"],["Россия","dorognoe","Дорожное радио","Русский поп · хиты · шансон","MP3","https://dorognoe.hostingradio.ru/dorognoe","","","https://dorognoe.ru/","#976544","#e4b480"],["Россия","avtoradio","Авторадио","Поп · рок · хиты","64 AAC","https://srv21.gpmradio.ru:8443/stream/air/aac/64/100","","","https://www.avtoradio.ru/","#31536d","#7aadc5"],["Россия","dfm90","DFM Дискач 90-х","Танцевальная · электронная · ретро","96 AAC","https://dfm-disc90.hostingradio.ru/disc9096.aacp","","","https://dfm.ru/","#735c91","#c0a3ce"],["США","rp","Radio Paradise","Авторская подборка · рок · соул","320 AAC","https://stream.radioparadise.com/aac-320","128 AAC","https://stream.radioparadise.com/aac-128","https://radioparadise.com/listen","#354d60","#bd8f72"],["США","rp2050","Radio 2050","Современная музыка · открытия","128 AAC","https://stream.radioparadise.com/radio2050-128","","","https://radioparadise.com/listen","#38475e","#d6a17b"],["США","rprock","Radio Paradise Rock","Классический и современный рок","320 AAC","https://stream.radioparadise.com/rock-320","128 AAC","https://stream.radioparadise.com/rock-128","https://radioparadise.com/listen","#433e50","#a76c56"],["Швейцария","jazz","Radio Swiss Jazz","Джаз · соул · блюз","192 AAC","https://stream.srg-ssr.ch/srgssr/rsj/aac/192","128 MP3","https://stream.srg-ssr.ch/srgssr/rsj/mp3/128","https://www.radioswissjazz.ch/en/reception/internet","#365750","#a9b9a2"],["Швейцария","classic","Radio Swiss Classic","Классическая музыка","192 AAC","https://stream.srg-ssr.ch/srgssr/rsc_de/aac/192","128 MP3","https://stream.srg-ssr.ch/srgssr/rsc_de/mp3/128","https://www.radioswissclassic.ch/en/reception/internet","#657988","#d5c6b1"],["Швейцария","pop","Radio Swiss Pop","Поп · софт-рок","192 AAC","https://stream.srg-ssr.ch/srgssr/rsp/aac/192","128 MP3","https://stream.srg-ssr.ch/srgssr/rsp/mp3/128","https://www.radioswisspop.ch/en/reception/internet","#60735e","#d6b7a0"],["Германия","kultur","Deutschlandfunk Kultur","Музыка · культура","192 AAC","https://st02.sslstream.dlf.de/dlf/02/high/aac/stream.aac?aggregator=web","128 MP3","https://st02.sslstream.dlf.de/dlf/02/128/mp3/stream.mp3?aggregator=web","https://www.deutschlandfunkkultur.de/","#3d566e","#b8b0d0"],["Германия","nova","Deutschlandfunk Nova","Инди · поп · культура","192 AAC","https://st03.sslstream.dlf.de/dlf/03/high/aac/stream.aac?aggregator=web","128 MP3","https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3?aggregator=web","https://www.deutschlandfunknova.de/","#4c5973","#d7ac80"],["Франция","fip","FIP","Джаз · мировая музыка · эклектика","192 AAC","","","","https://www.radiofrance.fr/fip","#66546b","#d8aaa5"],["Франция","fipjazz","FIP Jazz","Джаз · импровизация","192 AAC","","","","https://www.radiofrance.fr/fip/radio-jazz","#514969","#d2b798"],["Чехия","czjazz","ČRo Jazz","Джаз · соул","FLAC","","","","https://jazz.rozhlas.cz/","#405a6b","#b1c8b7"],["Чехия","czclassic","ČRo D-dur","Классическая музыка","FLAC","","","","https://d-dur.rozhlas.cz/","#53687a","#d9c9ad"],["Великобритания","bbc6","BBC Radio 6 Music","Альтернатива · инди","","","","","https://www.bbc.co.uk/sounds/play/live:bbc_6music","#4e526c","#ba9ca9"],["Великобритания","bbc3","BBC Radio 3","Классика · джаз","","","","","https://www.bbc.co.uk/sounds/play/live:bbc_radio_three","#514b64","#d1bfa0"],["Россия","record","Radio Record","Электронная музыка","","","","","https://www.radiorecord.ru/","#4e5974","#c1a8ca"],["Россия","jazzru","Радио JAZZ","Джаз · блюз · соул","","","","","https://radiojazzfm.ru/","#4c5f58","#d1bda0"]];
 const escArt=v=>String(v||'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[x]));
 const coverColors=[['#31566e','#7cbbb8'],['#535375','#b6a4cd'],['#576d53','#a7bc91'],['#85545e','#dba29e'],['#2d536d','#88afdb'],['#8d6743','#dfb67c']];
 const makeArt=(c,d,i,name='',quality='')=>{
  const label=String(name||'RADIO').trim().replace(/\s+/g,' '),words=label.split(' ');let lines=[''];
  for(const word of words){if(lines[lines.length-1]&&lines[lines.length-1].length+word.length>14&&lines.length<3)lines.push(word);else lines[lines.length-1]+=(lines[lines.length-1]?' ':'')+word}
  lines=lines.map(x=>x.slice(0,22));const size=Math.min(80,Math.floor(455/Math.max(4,...lines.map(x=>x.length)))*1.5);
  const freq=/\d+(?:[.,]\d+)?\s*FM/i.test(quality)?String(quality).replace('.',','):'ON AIR';
  const marks=['<g fill="none" stroke="#fff" opacity=".18" stroke-width="2"><circle cx="300" cy="300" r="205"/><circle cx="300" cy="300" r="250"/></g>','<g stroke="#fff" opacity=".14" stroke-width="3"><path d="M0 430 Q150 310 300 430 T600 430"/><path d="M0 470 Q150 350 300 470 T600 470"/><path d="M0 510 Q150 390 300 510 T600 510"/></g>','<g fill="#fff" opacity=".12"><circle cx="500" cy="90" r="190"/><circle cx="500" cy="90" r="125"/></g>'];
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="'+c+'"/><stop offset="1" stop-color="'+d+'"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/>'+marks[i%3]+'<g text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-weight="700" font-size="'+size+'">'+lines.map((line,j)=>'<text x="300" y="'+(285+(j-(lines.length-1)/2)*(size*1.12))+'">'+escArt(line)+'</text>').join('')+'</g><text x="300" y="426" text-anchor="middle" fill="#fff" opacity=".9" font-family="Arial,sans-serif" font-size="29" font-weight="500" letter-spacing="3">'+escArt(freq)+'</text></svg>');
 };
 const officialLogos={krd107:'https://www.radio107.ru/images/logo.png'};

 const stations=raw.map(([country,id,name,genre,quality,stream,fallbackQuality,fallback,site,c,d],i)=>({radio:true,country,id,name,genre,quality,stream,fallbackQuality,fallback,site,city:id.startsWith('krd')?'Краснодар':'',artwork:makeArt(c,d,i,name,quality),logo:officialLogos[id]||'',color:c}));
 const countryCodes={'США':'US','Швейцария':'CH','Германия':'DE','Франция':'FR','Чехия':'CZ','Великобритания':'GB','Россия':'RU'};
 const norm=v=>String(v||'').toLocaleLowerCase().replace(/ё/g,'е').trim();
 const regionKey='seyveo-radio-region-v1',catalogKey='seyveo-radio-catalog-v1';
 function region(){
  let saved=null,city='';try{saved=JSON.parse(localStorage.getItem(regionKey)||'null');city=String(JSON.parse(localStorage.getItem('seyveo.agenda-weather.location.v1')||'null')?.name||'').trim().slice(0,80)}catch{}
  let code=/^[A-Z]{2}$/.test(saved?.code||'')?saved.code:'';
  const lang=navigator.language||'';const locale=lang.match(/[-_]([A-Z]{2})(?:-|$)/);
  if(!code&&locale)code=locale[1];
  if(!code){const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';const zones={'Europe/Moscow':'RU','Europe/Helsinki':'FI','Europe/Berlin':'DE','Europe/Paris':'FR','Europe/London':'GB','Europe/Zurich':'CH','Europe/Prague':'CZ','Europe/Yerevan':'AM','America/New_York':'US','America/Los_Angeles':'US'};code=zones[tz]||''}
  if(!code&&/^ru\b/i.test(lang))code='RU';
  if(!saved&&code)try{localStorage.setItem(regionKey,JSON.stringify({code}))}catch{}
  // Known explicitly selected cities override the device-region hint.
  const cityCountries={'краснодар':'RU','москва':'RU','санкт-петербург':'RU','сочи':'RU','хельсинки':'FI','ереван':'AM','берлин':'DE','париж':'FR','лондон':'GB'};
  return {code:cityCountries[norm(city)]||code,city};
 }
 const countryName=code=>{try{return new Intl.DisplayNames(['ru'],{type:'region'}).of(code)||code}catch{return Object.keys(countryCodes).find(k=>countryCodes[k]===code)||code}};
 const regionInfo=region();
 const countryOf=s=>s.countrycode||countryCodes[s.country]||'';
 const safeHttps=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}};
 function stationFrom(raw,i){
  const id=String(raw.stationuuid||'');if(!/^[a-f0-9-]{36}$/i.test(id))return null;
  const stream=safeHttps(raw.url_resolved)||safeHttps(raw.url),site=safeHttps(raw.homepage);
  if(!stream||!String(raw.name||'').trim())return null;
  const code=String(raw.countrycode||'').toUpperCase(),city=String(raw.state||'').trim().slice(0,80);
  const [c,d]=coverColors[Array.from(id).reduce((n,x)=>n+x.charCodeAt(0),0)%coverColors.length];
  return {radio:true,id:'rb-'+id,name:String(raw.name).trim().slice(0,120),country:countryName(code)||String(raw.country||''),countrycode:code,city,genre:String(raw.tags||'').slice(0,120),quality:[Number(raw.bitrate)>0?Number(raw.bitrate):'',String(raw.codec||'').slice(0,12)].filter(Boolean).join(' '),stream,site:site||stream,artwork:makeArt(c,d,i,raw.name,''),color:c};
 }
 function register(rows){
  const added=[];
  for(const [i,raw] of rows.entries()){const st=stationFrom(raw,i);if(!st)continue;const old=stations.find(s=>s.id===st.id||s.stream===st.stream);if(old){added.push(old);continue}stations.push(st);added.push(st)}
  return added;
 }
 let cached=[];try{const c=JSON.parse(localStorage.getItem(catalogKey)||'null');if(Array.isArray(c?.rows)&&c.region===regionInfo.code&&Date.now()-c.at<7*86400000)cached=c.rows.slice(0,120)}catch{}
 const regional=register(cached);
 const favoriteKey='seyveo-radio-favorites-v1';let favorites=[];
 // Save discovered stations as well as curated IDs so pins survive catalog refreshes.
 try{
  const saved=JSON.parse(localStorage.getItem(favoriteKey)||'[]');
  if(Array.isArray(saved))for(const item of saved.slice(0,200)){
   if(!item||typeof item.id!=='string')continue;
   let station=stations.find(s=>s.id===item.id);
   if(!station&&item.id.startsWith('rb-')&&item.snapshot){
    const raw=item.snapshot;if('rb-'+raw.stationuuid!==item.id)continue;
    station=register([raw])[0];
   }
   if(station&&!favorites.some(f=>f.id===station.id))favorites.push({id:station.id,snapshot:item.snapshot||null});
  }
 }catch{}
 const hiddenKey='seyveo-radio-hidden-v1';let hiddenStations=new Set();
 try{const saved=JSON.parse(localStorage.getItem(hiddenKey)||'[]');if(Array.isArray(saved))hiddenStations=new Set(saved.filter(id=>typeof id==='string'))}catch{}
 const isHidden=id=>hiddenStations.has(id);
 const isFavorite=id=>!isHidden(id)&&favorites.some(f=>f.id===id);
 const stationSnapshot=station=>station.id.startsWith('rb-')?{stationuuid:station.id.slice(3),name:station.name,countrycode:station.countrycode,country:station.country,state:station.city,tags:station.genre,url_resolved:station.stream,homepage:station.site,codec:station.quality.replace(/^\d+\s*/,''),bitrate:parseInt(station.quality,10)||0}:null;
 function rememberStation(id){const station=stations.find(s=>s.id===id);if(!station?.stream)return false;const next=[{id,snapshot:stationSnapshot(station)},...favorites.filter(f=>f.id!==id)].slice(0,200);try{localStorage.setItem(favoriteKey,JSON.stringify(next))}catch{status.textContent='Не удалось сохранить станцию.';return false}favorites=next;if(isHidden(id)){hiddenStations.delete(id);try{localStorage.setItem(hiddenKey,JSON.stringify([...hiddenStations]))}catch{}}return true;}
 function setHidden(id,hidden){
  const next=new Set(hiddenStations);if(hidden)next.add(id);else next.delete(id);
  try{localStorage.setItem(hiddenKey,JSON.stringify([...next]))}catch{status.textContent='Не удалось сохранить изменение.';return false}
  hiddenStations=next;renderFavoritesMotion(id);return true;
 }
 function toggleFavorite(id){
  const station=stations.find(s=>s.id===id);if(!station?.stream)return false;
  const snapshot=id.startsWith('rb-')?{stationuuid:id.slice(3),name:station.name,countrycode:station.countrycode,country:station.country,state:station.city,tags:station.genre,url_resolved:station.stream,homepage:station.site,codec:station.quality.replace(/^\d+\s*/,''),bitrate:parseInt(station.quality,10)||0}:null;
  const next=isFavorite(id)?favorites.filter(f=>f.id!==id):[{id,snapshot},...favorites.filter(f=>f.id!==id)];
  if(next.length>200){status.textContent='Достигнут предел избранных станций.';return false}
  try{localStorage.setItem(favoriteKey,JSON.stringify(next))}catch{status.textContent='Не удалось сохранить избранное.';return false}
  favorites=next;if(isHidden(id))return setHidden(id,false);renderFavoritesMotion(id);return true;
 }
 const list=document.getElementById('svMusicRadioStations'),status=document.getElementById('svMusicRadioStatus');
 if(!list||!status)return;
 const buttons=new Map();let lastTap=null,pauseTimer=0,heartTimer=0;
 function cancelPause(){clearTimeout(pauseTimer);pauseTimer=0;lastTap=null}
 function favoriteGesture(id){cancelPause();if(!rememberStation(id))return;const cover=buttons.get(id);if(!cover?.isConnected){renderFavoritesMotion(id);return}cover.querySelector('.sv-radio-like-flash')?.remove();const flash=document.createElement('span');flash.className='sv-radio-like-flash';flash.setAttribute('aria-hidden','true');flash.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.4S2.8 15 2.8 8.9A5.2 5.2 0 0 1 12 5.6a5.2 5.2 0 0 1 9.2 3.3c0 6.1-9.2 11.5-9.2 11.5Z"/></svg>';cover.append(flash);clearTimeout(heartTimer);heartTimer=setTimeout(()=>{flash.remove();renderFavoritesMotion(id)},620);}
 function tapStation(id,keyboard=false){const now=performance.now();if(!keyboard&&lastTap?.id===id&&now-lastTap.at<=320){favoriteGesture(id);return}if(pauseTimer)cancelPause();lastTap=keyboard?null:{id,at:now};const state=window.SEYVEO_MUSIC?.state?.();const playing=state?.source==='radio'&&state.stationId===id&&state.playing;const act=()=>{if(!openStation(id))status.textContent='Не удалось открыть эфир. Попробуйте позже.';else drawRadio()};if(playing&&!keyboard){pauseTimer=setTimeout(()=>{pauseTimer=0;lastTap=null;const current=window.SEYVEO_MUSIC?.state?.();if(current?.source==='radio'&&current.stationId===id&&current.playing)act()},330)}else act();}
 const historyKey='seyveo-radio-recent-v1',timeKey='seyveo-radio-recent-time-v1';let history=[],playedAt={};
 try{const saved=JSON.parse(localStorage.getItem(timeKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))playedAt=saved}catch{}
 try{const saved=JSON.parse(localStorage.getItem(historyKey)||'[]');if(Array.isArray(saved))history=saved.filter(id=>typeof id==='string'&&stations.some(station=>station.id===id&&station.stream)).slice(0,6)}catch{}
 const recent=()=>history.map(id=>stations.find(x=>x.id===id)).filter(Boolean).map(station=>({radio:true,id:station.id,title:station.name,artist:station.city||station.country,artwork:station.artwork,playedAt:Number(playedAt[station.id])||0}));
 function removeRecentHistory(id=null){
  const next=id===null?[]:history.filter(key=>key!==id);
  const nextTimes=Object.fromEntries(next.map(key=>[key,playedAt[key]||0]));
  try{localStorage.setItem(historyKey,JSON.stringify(next));localStorage.setItem(timeKey,JSON.stringify(nextTimes))}catch{return false}
  history=next;playedAt=nextTimes;return true;
 }
 function openStation(id){
  const station=stations.find(s=>s.id===id);if(!station)return false;
  if(station.stream)return !!window.SEYVEO_MUSIC?.playRadio?.(stations,id);
  return false;
 }
 function localSearch(q){const terms=norm(q).split(/\s+/).filter(Boolean);return stations.filter(s=>s.stream&&terms.every(t=>norm([s.name,s.country,s.city,s.genre,s.quality].join(' ')).includes(t)))}
 const servers=['https://de1.api.radio-browser.info','https://nl1.api.radio-browser.info'];
 async function fetchStations(params,signal){
  for(const base of servers){try{const u=new URL('/json/stations/search',base);for(const [k,v] of Object.entries({hidebroken:'true',order:'clickcount',reverse:'true',limit:'40',...params}))u.searchParams.set(k,v);
   const res=await fetch(u,{signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!res.ok)continue;const rows=await res.json();if(Array.isArray(rows))return rows.slice(0,100);
  }catch(e){if(signal?.aborted)throw e}}
  throw Error('catalog unavailable');
 }
 async function onlineSearch(q,signal){const term=String(q||'').trim().slice(0,100);if(term.length<2)return localSearch(term);const rows=await fetchStations({name:term},signal);return [...new Map([...localSearch(term),...register(rows)].map(s=>[s.id,s])).values()]}
 window.SEYVEO_RADIO=Object.freeze({recent,removeRecentHistory,play:openStation,search:localSearch,searchOnline:onlineSearch,isFavorite,isHidden,toggleFavorite});
 audio.addEventListener('playing',()=>{const state=window.SEYVEO_MUSIC?.state?.();if(state?.source!=='radio'||!stations.some(x=>x.id===state.stationId))return;history=[state.stationId,...history.filter(id=>id!==state.stationId)].slice(0,6);playedAt[state.stationId]=Date.now();playedAt=Object.fromEntries(history.map(id=>[id,playedAt[id]||0]));try{localStorage.setItem(historyKey,JSON.stringify(history));localStorage.setItem(timeKey,JSON.stringify(playedAt))}catch{}if(isHidden(state.stationId))setHidden(state.stationId,false);document.dispatchEvent(new Event('seyveo:radio-history'))});
 document.dispatchEvent(new Event('seyveo:radio-history'));
 function drawRadio(){
  const state=window.SEYVEO_MUSIC?.state?.();
  for(const [id,btn] of buttons){const selected=state?.source==='radio'&&state.stationId===id,playing=selected&&state.playing;btn.setAttribute('aria-pressed',String(!!playing));btn.closest('.sv-radio-station')?.classList.toggle('sv-radio-current',!!selected);btn.setAttribute('aria-label',(playing?'Пауза: ':'Слушать: ')+stations.find(x=>x.id===id).name);}
  status.textContent=state?.source==='radio'?(state.playing?'В эфире · ':'Выбрана станция · ')+(stations.find(x=>x.id===state.stationId)?.name||''):'';
 }

 function sortedStations(){
  let enabled=true,after='';try{const p=JSON.parse(localStorage.getItem('seyveo-discovery-music-v1')||'null');enabled=p?p.enabled===true:localStorage.getItem('seyveo-discovery-choice-v1')!=='1';after=p?.replayAfterMonth||''}catch{}
  const taste=enabled?(window.SEYVEO_MUSIC?.sharedGenreTaste?.(after)||[]):[];
  const top=Math.max(1,taste[0]?.score||0),weights=new Map(taste.map(t=>[t.tag,t.score/top]));
  const score=s=>{const local=regionInfo.code&&countryOf(s)===regionInfo.code;const city=norm(regionInfo.city);
   const tags=window.SEYVEO_MUSIC?.genreTasteTags?.(s.genre)||[];
   const match=Math.max(0,...tags.map(tag=>weights.get(tag)||0));
   return (local?1000:0)+match*100+(local&&city&&norm(s.name+' '+(s.city||'')).includes(city)?10:0);
  };
  const regionIds=new Set([...regional.map(s=>s.id),...history]),pins=new Map(favorites.map((f,i)=>[f.id,i]));
  return stations.filter(s=>s.stream&&!isHidden(s.id)&&(pins.has(s.id)||!s.id.startsWith('rb-')||regionIds.has(s.id))).sort((a,b)=>{
   const ai=pins.get(a.id),bi=pins.get(b.id);
   if(ai!==undefined||bi!==undefined)return (ai??Infinity)-(bi??Infinity);
   return score(b)-score(a);
  });
 }
 let radioMenu=null;
 function closeRadioMenu(restore=false){
  if(!radioMenu)return;
  const anchor=radioMenu.anchor;radioMenu.node.remove();radioMenu=null;
  if(restore&&anchor.isConnected)anchor.focus({preventScroll:true});
 }
 function openRadioMenu(row,station){
  if(panel.hidden||page.hidden||!row.isConnected)return;
  closeRadioMenu();
  const menu=document.createElement('div');menu.className='sv-radio-context-menu';menu.setAttribute('role','group');menu.setAttribute('aria-label',station.name);
  const title=document.createElement('span');title.className='sv-radio-context-title';title.textContent=station.name;
  const remove=document.createElement('button');remove.type='button';remove.className='sv-radio-context-remove';
  remove.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14M9 7V4.5h6V7M7 7l.8 12h8.4L17 7M10 10v6m4-6v6"/></svg><span>Убрать из радио</span>';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Отмена';
  remove.addEventListener('click',()=>{closeRadioMenu();setHidden(station.id,true)});
  cancel.addEventListener('click',()=>closeRadioMenu(true));
  const save=document.createElement('button');save.type='button';save.textContent='Сохранить в начале';save.addEventListener('click',()=>{closeRadioMenu();favoriteGesture(station.id)});
  menu.append(title,save,remove,cancel);document.body.append(menu);radioMenu={node:menu,anchor:row};
  const rect=row.getBoundingClientRect(),width=menu.offsetWidth,height=menu.offsetHeight;
  const left=Math.max(12,Math.min(rect.left,window.innerWidth-width-12));
  const top=Math.max(12,Math.min(rect.bottom+5,window.innerHeight-height-16));
  menu.style.left=left+'px';menu.style.top=top+'px';
  remove.focus({preventScroll:true});
 }
 function bindRadioHold(row,station){
  row.tabIndex=0;row.setAttribute('aria-label',station.name);row.setAttribute('aria-keyshortcuts','Delete Shift+F10 F');
  let timer=0,start=null;
  const clear=()=>{clearTimeout(timer);timer=0;start=null};
  row.addEventListener('pointerdown',e=>{if(e.button!==0||e.isPrimary===false||e.target.closest('a'))return;clear();start={x:e.clientX,y:e.clientY,id:e.pointerId};timer=setTimeout(()=>{clear();cancelPause();row.dataset.svHeld='1';openRadioMenu(row,station)},500)});
  row.addEventListener('pointermove',e=>{if(start&&start.id===e.pointerId&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>9)clear()});
  for(const name of ['pointerup','pointercancel','pointerleave','lostpointercapture'])row.addEventListener(name,clear);
  row.addEventListener('contextmenu',e=>{if(e.target.closest('a'))return;e.preventDefault();clear();if(radioMenu?.anchor!==row)openRadioMenu(row,station)});
  row.addEventListener('keydown',e=>{if(e.target!==row&&!e.target.closest('.sv-radio-tile-cover'))return;if(e.key.toLowerCase()==='f'){e.preventDefault();favoriteGesture(station.id)}else if(e.key==='Delete'||e.key==='ContextMenu'||e.shiftKey&&e.key==='F10'){e.preventDefault();cancelPause();openRadioMenu(row,station)}});
 }
 document.addEventListener('pointerdown',e=>{if(radioMenu&&!radioMenu.node.contains(e.target))closeRadioMenu()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&radioMenu){e.preventDefault();closeRadioMenu(true)}});
 page.addEventListener('scroll',()=>closeRadioMenu(),{passive:true});
 window.addEventListener('resize',()=>closeRadioMenu(),{passive:true});
 function render(){
  closeRadioMenu();list.replaceChildren();buttons.clear();
  for(const station of sortedStations()){
   const row=document.createElement('article');row.className='sv-radio-station';row.dataset.stationId=station.id;
   const art=document.createElement('span');art.className='sv-radio-art';art.style.backgroundColor=station.color;art.style.backgroundImage='url("'+station.artwork+'")';art.setAttribute('aria-hidden','true');
   const cover=document.createElement('button');cover.type='button';cover.className='sv-radio-tile-cover';cover.append(art);
   if(station.logo){const logo=document.createElement('img');logo.className='sv-radio-logo';logo.alt='';logo.loading='lazy';logo.decoding='async';logo.referrerPolicy='no-referrer';logo.addEventListener('error',()=>logo.remove(),{once:true});logo.src=station.logo;cover.append(logo)}
   cover.addEventListener('pointerdown',()=>{delete row.dataset.svHeld});
   cover.setAttribute('aria-description','Двойное нажатие — сохранить станцию в начале списка');cover.addEventListener('click',e=>{if(row.dataset.svHeld){delete row.dataset.svHeld;return}tapStation(station.id,e.detail===0)});
   buttons.set(station.id,cover);
   const copy=document.createElement('div');copy.className='sv-radio-copy';const title=document.createElement('strong');title.textContent=station.name;title.title=station.name;
   const subtitle=document.createElement('small');subtitle.textContent=station.city||station.country||'';subtitle.hidden=!subtitle.textContent;
   copy.append(title,subtitle);row.append(cover,copy);bindRadioHold(row,station);list.append(row);
  }
  if(!list.children.length){const empty=document.createElement('p');empty.className='sv-radio-empty';empty.textContent='Станции не найдены';list.append(empty)}
  drawRadio();
 }
 function renderFavoritesMotion(id){
  if(panel.hidden||page.hidden){return}
  const focus=document.activeElement?.classList.contains('sv-radio-tile-cover');
  const motion=!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const before=new Map();
  if(motion)for(const node of Array.from(list.children).slice(0,24))before.set(node.dataset.stationId,node.getBoundingClientRect());
  render();
  for(const node of Array.from(list.children).slice(0,24)){
   if(focus&&node.dataset.stationId===id)node.querySelector('.sv-radio-tile-cover')?.focus({preventScroll:true});
   const old=before.get(node.dataset.stationId);if(!old||typeof node.animate!=='function')continue;
   const now=node.getBoundingClientRect(),dx=old.left-now.left,dy=old.top-now.top;
   if(Math.abs(dx)+Math.abs(dy)>0&&Math.abs(dy)<window.innerHeight)node.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'translate(0,0)'}],{duration:240,easing:'cubic-bezier(.2,.7,.25,1)'});
  }
 }
 function animateRadio(){
  if(panel.hidden||page.hidden||document.hidden||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  Array.from(list.children).slice(0,9).forEach((node,i)=>{
   if(typeof node.animate!=='function')return;
   node.getAnimations?.().filter(a=>a.id==='svRadioEnter').forEach(a=>a.cancel());
   const motion=node.animate([{opacity:.18,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:190,delay:Math.min(i,5)*18,easing:'cubic-bezier(.2,.7,.25,1)',fill:'backwards'});motion.id='svRadioEnter';
  });
 }
 render();
 let radioVisible=false,regionalLoaded=false;
 async function loadRegional(){
  if(regionalLoaded||!regionInfo.code)return;regionalLoaded=true;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
  try{
   const jobs=[fetchStations({countrycode:regionInfo.code,limit:'100'},controller.signal)];
   if(regionInfo.city)jobs.push(fetchStations({countrycode:regionInfo.code,name:regionInfo.city,limit:'20'},controller.signal));
   const batches=await Promise.all(jobs.map(p=>p.catch(()=>[])));const rows=[...batches.slice(1).flat(),...batches[0]];
   if(!rows.length){regionalLoaded=false;return}
   const unique=[...new Map(rows.map(x=>[x.stationuuid,x])).values()].slice(0,120);
   regional.splice(0,regional.length,...register(unique));
   try{localStorage.setItem(catalogKey,JSON.stringify({region:regionInfo.code,at:Date.now(),rows:unique}))}catch{}
   if(radioVisible){render();animateRadio()}
  }finally{clearTimeout(timeout)}
 }
 document.addEventListener('seyveo:music-view',e=>{const next=e.detail?.view==='radio';if(next&&!radioVisible){render();animateRadio();void loadRegional()}if(!next){closeRadioMenu();cancelPause()}radioVisible=next});
 document.addEventListener('seyveo:music-state',drawRadio);
 for(const name of ['playing','pause','error','emptied'])audio.addEventListener(name,drawRadio);
 toggle.addEventListener('click',()=>{if(window.SEYVEO_MUSIC_DOCK?.show){window.SEYVEO_MUSIC_DOCK.show('radio');return}panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initRadio,{once:true});else initRadio();
})();
