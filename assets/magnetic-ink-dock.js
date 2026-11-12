/* SEYVEO · One fixed, readable navigation.
 * Home, Tasks, My World and Search around the original Sayvi center.
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
 // One canonical vector for each main destination. Never restore legacy art.
 const originalOtherMarkup={
  life:document.getElementById('navPicture').innerHTML,
  search:document.getElementById('navManage').innerHTML
 };
 const items=[
  {id:'home',title:'Главная',description:'Вернуться на Главную',
   icon:'<path data-sv-fill-home fill-rule="evenodd" d="M10.68 3.35a2 2 0 0 1 2.64 0l7.24 6.3a1.27 1.27 0 1 1-1.66 1.92l-.68-.59v7.72a2.1 2.1 0 0 1-2.1 2.1H7.88a2.1 2.1 0 0 1-2.1-2.1v-7.72l-.68.59a1.27 1.27 0 1 1-1.66-1.92l7.24-6.3ZM10 20.8v-5.5c0-1.05.85-1.9 1.9-1.9h.2c1.05 0 1.9.85 1.9 1.9v5.5H10Z"/>'},
  {id:'tasks',title:'Дела',description:'Открыть дела',
   icon:'<rect data-sv-task-box x="2.9" y="3.25" width="5.3" height="5.3" rx="1.55"/><rect data-sv-task-box x="2.9" y="10.35" width="5.3" height="5.3" rx="1.55"/><rect data-sv-task-box x="2.9" y="17.45" width="5.3" height="5.3" rx="1.55"/><path data-sv-task-check d="m4.1 5.95 1.15 1.02 1.83-2.08M4.1 13.05l1.15 1.02 1.83-2.08M4.1 20.15l1.15 1.02 1.83-2.08"/><path data-sv-task-lines d="M11.3 5.9h9.2M11.3 13h9.2M11.3 20.1h9.2"/>'},
  {id:'life',title:'Мой мир',description:'Открыть Мой мир'},
  {id:'search',title:'Поиск',description:'Умный поиск SEYVEO'}
 ];
 function canonicalMarkup(item){
  if(item.id==='life'||item.id==='search')return originalOtherMarkup[item.id];
  return '<svg class="sv-canonical-dock-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+item.icon+'</svg><span>'+item.title+'</span>';
 }
 const canonical=items.map(canonicalMarkup);
 const musicMode=()=>dock.classList.contains('seyveo-music-dock')||
  window.SEYVEO_MUSIC_DOCK?.isActive?.()===true;
 function activeDestination(){
  const hash=location.hash;
  if(!hash||hash==='#home')return 'home';
  if(hash==='#tasks')return 'tasks';
  if(hash==='#life')return 'life';
  if(hash==='#manage'||hash==='#manage-theme')return '';
  return '';
 }
 function paint(){
  // The same original dock is contextually owned by Music, Browser or Sayvi Chat.
  if(musicMode()||window.SEYVEO_BROWSER_DOCK?.isActive?.()||
     document.documentElement.classList.contains('seyveo-conversation'))return;
  const active=activeDestination();
  items.forEach((item,index)=>{
   const button=buttons[index];
   button.hidden=false;
   // Repaint only after a contextual mode has replaced an icon, or when
   // obsolete markup is detected. This is the sole runtime artwork source.
   const expected=canonical[index];
   if(button.innerHTML!==expected)button.innerHTML=expected;
   button.dataset.svFixedAction=item.id;
   button.setAttribute('aria-label',item.description);
   button.title=item.title;
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
   if(!event.isTrusted||musicMode()||window.SEYVEO_BROWSER_DOCK?.isActive?.()||
      document.documentElement.classList.contains('seyveo-conversation'))return;
   showSelectionFeedback(button);
  },{capture:true});
 });
 window.addEventListener('hashchange',paint);
 window.addEventListener('seyveo:route-changed',paint);
 document.addEventListener('seyveo:browser-dock-exit',()=>{buttons.forEach(b=>delete b.dataset.svFixedAction);paint()});
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