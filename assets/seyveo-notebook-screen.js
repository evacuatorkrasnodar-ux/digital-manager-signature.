/* SEYVEO Notebook · one in-flow Work tab, November 2026.
 * Legacy note APIs expect #notesDialog.open / show() / close().
 * Keep their storage, autosave and editors; never create a modal, duplicate
 * navigation/header, detached overlay, focus jump or moving dock. */
(()=>{
 'use strict';
 const page=document.getElementById('notesDialog');
 if(!page||page.tagName!=='SECTION')return;
 const tasks=document.getElementById('tasksPage');
 const calendar=document.getElementById('calendarPage');

 Object.defineProperty(page,'open',{
  configurable:true,
  get(){return page.hasAttribute('open');}
 });
 page.show=function(){
  if(page.open)return;
  // Notebook belongs to Work. If launched from another area, enter Work
  // first; the shared Work header/tabs remain the only navigation surface.
  if(tasks?.hidden&&calendar?.hidden){
   if(typeof window.SEYVEO_UNIFIED_TASKS?.openPersonal==='function')
    window.SEYVEO_UNIFIED_TASKS.openPersonal();
   else if(location.hash!=='#tasks')location.hash='#tasks';
  }
  page.hidden=false;
  page.setAttribute('open','');
  window.SEYVEO_WORK_SHELL?.sync?.();
 };
 page.showModal=page.show;
 page.close=function(){
  if(!page.open)return;
  page.removeAttribute('open');
  page.hidden=true;
  window.SEYVEO_WORK_SHELL?.sync?.();
  page.dispatchEvent(new Event('close'));
 };
 page.hidden=true;
 page.removeAttribute('open');

 // Shared dock has its own original handlers; these only hide the Notebook,
 // never move, resize or reconstruct the dock.
 const dock=document.querySelector('footer.dock');
 const routes=new Set(['navHome','navTasks','navPicture','navManage','assistantButton']);
 dock?.addEventListener('click',event=>{
  if(!page.open)return;
  const button=event.target.closest?.('button');
  if(button&&routes.has(button.id))page.close();
 },true);
 window.SEYVEO_NOTEBOOK_SCREEN=Object.freeze({
  version:3,show:()=>page.show(),close:()=>page.close()
 });
})();
