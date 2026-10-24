/* SEYVEO Magnetic Ink · the SAME physical five-button dock.
 * The center stays the original voice/home control; four outer slots show
 * magnetic pages of real actions. No clone, overlay, synthetic media player,
 * secret writes, forced vibration or AI-autonomy pretense.
 */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock');
 const center=document.getElementById('assistantButton');
 const ids=['navHome','navTasks','navPicture','navManage'];
 const buttons=ids.map(id=>document.getElementById(id));
 if(!dock||!center||buttons.some(b=>!b)||window.SEYVEO_MAGNETIC_INK)return;
 const rail=document.getElementById('assistantQuickrail');
 const track=document.getElementById('assistantQuickTrack');
 if(rail){rail.setAttribute('aria-hidden','true');rail.inert=true;}
 if(track)track.tabIndex=-1; // Favorited actions now live in the dock.
 const BASIC=['tasks','calendar','world','manage'];
 const FALLBACK=['health','care','history','notes','music','note','event','picture'];
 const ICONS={
  tasks:'<path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1"/>',
  calendar:'<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16M8 14h2M13 14h2"/>',
  world:'<circle cx="12" cy="12" r="8.3"/><path d="M3.7 12h16.6M12 3.7c-4.5 4.5-4.5 12.1 0 16.6M12 3.7c4.5 4.5 4.5 12.1 0 16.6"/>',
  manage:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  picture:'<path d="M4.5 19.5V14M9.5 19.5V9.5M14.5 19.5v-6M19.5 19.5V5"/>'
 };
 const LABELS={tasks:'Дела',calendar:'Календарь',world:'Мой мир',manage:'Управление',picture:'Картина'};
 const DESCRIPTIONS={tasks:'Открыть дела',calendar:'Открыть календарь',world:'Открыть Мой мир',manage:'Открыть управление',picture:'Открыть картину бизнеса'};
 const quick=()=>window.SEYVEO_QUICK_ACTIONS;
 const original=buttons.map(b=>({html:b.innerHTML,aria:b.getAttribute('aria-label')}));
 let pages=[],page=0,pointer=null,ignoreClickUntil=0;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const status=document.createElement('span');
 status.className='sv-magnetic-announcement';
 status.setAttribute('role','status');
 status.setAttribute('aria-live','polite');
 dock.append(status);
 dock.classList.add('sv-magnetic-dock');
 function metadata(id){
  const fromQuick=quick()?.details(id);
  if(!LABELS[id]&&!fromQuick)return null;
  return {name:LABELS[id]||fromQuick.name,description:DESCRIPTIONS[id]||fromQuick.description,icon:ICONS[id]||fromQuick.icon};
 }
 function buildPages(){
  const favorite=quick()?.selected()||['event','note','music','history','world','notes'];
  const extra=['picture',...favorite].filter((id,i,all)=>
   !BASIC.includes(id)&&all.indexOf(id)===i&&!!metadata(id));
  // Avoid a half-empty final page: fill from available genuine actions only.
  if(extra.length%4){
   for(const id of FALLBACK){
    if(extra.length%4===0)break;
    if(!extra.includes(id)&&!BASIC.includes(id)&&metadata(id))extra.push(id);
   }
  }
  const next=[BASIC.slice()];
  for(let i=0;i<extra.length;i+=4)next.push(extra.slice(i,i+4));
  return next;
 }
 function currentAction(){
  const hash=location.hash;
  if(hash==='#tasks')return 'tasks';
  if(hash==='#calendar')return 'calendar';
  if(hash==='#life')return 'world';
  if(hash==='#picture')return 'picture';
  if(hash==='#manage'||hash==='#manage-theme')return 'manage';
  if(hash==='#sayvi-music')return 'music';
  return '';
 }
 function musicMode(){
  return dock.classList.contains('seyveo-music-dock')||window.SEYVEO_MUSIC_DOCK?.isActive?.()===true;
 }
 function announce(){
  status.textContent='Действия '+(page+1)+' из '+pages.length;
  dock.setAttribute('aria-label','Действия Сэйвы, набор '+(page+1)+' из '+pages.length+'. Проведите по боковым значкам, чтобы переключить набор. Центр — Сэйва.');
 }
 function paint(animate){
  if(musicMode())return; // Music owns these very same four buttons.
  const items=pages[page]||pages[0];
  dock.dataset.svMagneticPage=String(page);
  buttons.forEach((button,index)=>{
   const id=items[index],info=metadata(id);
   if(!info){button.hidden=true;return;}
   button.hidden=false;
   button.dataset.svMagneticAction=id;
   button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+info.icon+'</svg><span>'+info.name+'</span>';
   button.setAttribute('aria-label',info.description);
   button.title=info.name;
   const active=id===currentAction();
   button.classList.toggle('active',active);
   if(active)button.setAttribute('aria-current','page');
   else button.removeAttribute('aria-current');
  });
  if(animate&&!reduce.matches){
   dock.classList.remove('sv-magnetic-reveal');
   // Restart one short reveal, not an infinite motion.
   void dock.offsetWidth;
   dock.classList.add('sv-magnetic-reveal');
  }
  announce();
 }
 function rebuild(){
  const previous=pages[page]?.[0];
  pages=buildPages();
  const same=pages.findIndex(p=>p[0]===previous);
  page=same>=0?same:Math.min(page,pages.length-1);
  paint(false);
 }
 function switchPage(delta){
  if(musicMode()||pages.length<2)return false;
  const next=Math.max(0,Math.min(pages.length-1,page+delta));
  if(next===page)return false;
  page=next;
  ignoreClickUntil=Date.now()+420;
  paint(true);
  return true;
 }
 function goHome(){
  // Internal programmatic navigation still invokes the original route.
  document.getElementById('navHome')?.click();
 }
 function invoke(id){
  if(id==='manage'){document.getElementById('navManage')?.click();return;}
  if(id==='tasks'){document.getElementById('navTasks')?.click();return;}
  if(id==='picture'){document.getElementById('navPicture')?.click();return;}
  if(id==='calendar'){location.hash='calendar';return;}
  if(id==='world'){location.hash='life';return;}
  if(id==='note'){
   // The existing local note flow lives in the ONE composer on Home.
   if(location.hash)goHome();
   if(document.getElementById('ask')?.hidden)center.click();
  }
  quick()?.run(id);
 }
 buttons.forEach(button=>button.addEventListener('click',event=>{
  if(!event.isTrusted||musicMode())return; // Original handlers remain for app code.
  event.preventDefault();
  event.stopImmediatePropagation();
  if(Date.now()<ignoreClickUntil)return;
  const id=button.dataset.svMagneticAction;
  if(id&&metadata(id))invoke(id);
 },true));
 // Swipes begin only over a SIDE button, never over the voice/home center.
 dock.addEventListener('pointerdown',event=>{
  if(musicMode()||event.isPrimary===false)return;
  if(!event.target.closest('.dock>.nav-item'))return;
  pointer={x:event.clientX,y:event.clientY,id:event.pointerId};
 },true);
 dock.addEventListener('pointerup',event=>{
  if(!pointer||event.pointerId!==pointer.id)return;
  const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
  pointer=null;
  if(Math.abs(dx)>34&&Math.abs(dx)>Math.abs(dy)*1.35){
   ignoreClickUntil=Date.now()+420; // Prevent iOS post-swipe click.
   switchPage(dx<0?1:-1);
  }
 },true);
 dock.addEventListener('pointercancel',()=>{pointer=null},true);
 dock.addEventListener('keydown',event=>{
  if(musicMode()||!event.target.closest('.dock>.nav-item'))return;
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  event.preventDefault();
  switchPage(event.key==='ArrowLeft'?-1:1);
 },true);
 window.addEventListener('seyveo:quick-actions-changed',rebuild);
 window.addEventListener('hashchange',()=>{
  // After leaving Music, its controller restores the original nav markup.
  // Rewrite only after music releases ownership of the SAME dock.
  if(!musicMode())paint(false);
 });
 center.addEventListener('click',()=>{
  if(!location.hash){
   page=0; // Home via the center always resets to the essential actions.
   if(!musicMode())paint(false); // pushState(Home) does not fire hashchange.
  }
 },false);
 rebuild();
 window.SEYVEO_MAGNETIC_INK=Object.freeze({
  page:()=>page,
  groups:()=>pages.map(items=>items.slice()),
  next:()=>switchPage(1),
  previous:()=>switchPage(-1),
  refresh:rebuild
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
