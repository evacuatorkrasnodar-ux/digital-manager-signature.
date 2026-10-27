/* SEYVEO · One fixed, readable navigation.
 * Four permanent destinations around the original Sayvi center.
 * The same DOM IDs, saved content, routes and Music Dock are preserved.
 * No carousel, swipe pages, second dock or simulated interactions.
 */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock');
 const center=document.getElementById('assistantButton');
 const buttonIds=['navHome','navTasks','navPicture','navManage'];
 const buttons=buttonIds.map(id=>document.getElementById(id));
 if(!dock||!center||buttons.some(b=>!b)||window.SEYVEO_MAGNETIC_INK)return;
 // Provide 1.6s tactile acknowledgement without a permanent active frame.
 let feedbackTimer=0;
 function showSelectionFeedback(button){
  window.clearTimeout(feedbackTimer);
  buttons.forEach(b=>b.classList.remove('sv-nav-feedback'));
  button.classList.add('sv-nav-feedback');
  feedbackTimer=window.setTimeout(()=>{
   button.classList.remove('sv-nav-feedback');
   feedbackTimer=0;
  },1600);
 }
 // The old upper favorites rail is not another navigation system.
 const rail=document.getElementById('assistantQuickrail');
 const track=document.getElementById('assistantQuickTrack');
 if(rail){rail.setAttribute('aria-hidden','true');rail.inert=true;}
 if(track)track.tabIndex=-1;
 const items=[
  {id:'home',title:'Главная',description:'Вернуться на Главную',
   icon:'<path d="M3.5 10.5 12 3.5l8.5 7V20h-6.5v-6h-4v6H3.5z"/>'},
  {id:'tasks',title:'Дела',description:'Открыть дела',
   icon:'<path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1"/>'},
  {id:'life',title:'Мой мир',description:'Открыть Мой мир',
   icon:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c-5 5.2-5 11.8 0 17M12 3.5c5 5.2 5 11.8 0 17"/>'},
  {id:'manage',title:'Управление',description:'Открыть управление',
   icon:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'}
 ];
 const musicMode=()=>dock.classList.contains('seyveo-music-dock')||
  window.SEYVEO_MUSIC_DOCK?.isActive?.()===true;
 function activeDestination(){
  const hash=location.hash;
  if(!hash||hash==='#home')return 'home';
  if(hash==='#tasks')return 'tasks';
  if(hash==='#life')return 'life';
  if(hash==='#manage'||hash==='#manage-theme')return 'manage';
  return '';
 }
 function paint(){
  if(musicMode())return; // The existing Music Dock owns the buttons during playback.
  const active=activeDestination();
  items.forEach((item,index)=>{
   const button=buttons[index];
   button.hidden=false;
   // Do not recreate SVG/labels on every hashchange: avoids label flashes.
   if(button.dataset.svFixedAction!==item.id){
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+item.icon+'</svg><span>'+item.title+'</span>';
    button.dataset.svFixedAction=item.id;
    button.setAttribute('aria-label',item.description);
    button.title=item.title;
   }
   const selected=item.id===active;
   button.classList.toggle('active',selected);
   if(selected)button.setAttribute('aria-current','page');
   else button.removeAttribute('aria-current');
  });
  dock.setAttribute('aria-label','Разделы SEYVEO. Центр — Сэйви: общение и голос.');
 }
 // Visual acknowledgement only. The ORIGINAL button's click listener owns routing.
 // Never stop propagation or call button.click() during its own click dispatch:
 // that can cancel the user's tap and the synthetic repeat may be suppressed.
 buttons.forEach(button=>{
  button.addEventListener('click',event=>{
   if(!event.isTrusted||musicMode())return;
   showSelectionFeedback(button);
  },{capture:true});
 });
 window.addEventListener('hashchange',paint);
 window.addEventListener('seyveo:route-changed',paint);
 document.addEventListener('seyveo:music-dock-exit',()=>{
  // The music controls restore the same buttons, never create a second dock.
  window.clearTimeout(feedbackTimer);
  feedbackTimer=0;
  buttons.forEach(button=>{
   button.classList.remove('sv-nav-feedback');
   delete button.dataset.svFixedAction;
  });
  paint();
 });
 paint();
 // Keep the old public hook harmless for callers which only inspect its state.
 window.SEYVEO_MAGNETIC_INK=Object.freeze({
  page:()=>0,
  groups:()=>[items.map(item=>item.id)],
  next:()=>false,
  previous:()=>false,
  refresh:paint
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();