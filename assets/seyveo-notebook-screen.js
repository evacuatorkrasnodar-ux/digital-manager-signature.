/* SEYVEO Notebook: native, non-modal page controller.
 * One page, one nav, no duplicate header, no dock reparenting, no DOM rebuild.
 * Existing note storage and editor APIs remain the sole data owners. */
(()=>{
 'use strict';
 const page=document.getElementById('notesDialog');
 if(!page||page.tagName!=='SECTION')return;
 const nav=page.querySelector('#svNotebookWorkTabs');
 const back=page.querySelector('#svNotebookBack');
 const add=page.querySelector('#svNotebookAdd');
 const dock=document.querySelector('footer.dock');
 const topLevelRoutes=new Set(['navHome','navTasks','navPicture','navManage','assistantButton']);

 // Drop-in surface compatibility for the old notebook API. Existing callers
 // can continue using .open/.show()/.close() without invoking Safari's dialog
 // top layer, autofocus or scroll-restoration machinery.
 Object.defineProperty(page,'open',{configurable:true,get(){return page.hasAttribute('open')}});
 page.show=function(){
  if(page.open)return;
  page.hidden=false;
  page.setAttribute('open','');
 };
 page.showModal=page.show;
 page.close=function(){
  if(!page.open)return;
  page.removeAttribute('open');
  page.hidden=true;
  page.dispatchEvent(new Event('close'));
 };
 page.hidden=true;
 page.removeAttribute('open');
 back?.addEventListener('click',()=>page.close());
 add?.addEventListener('click',()=>window.SEYVEO_NOTE_LAUNCH?.launch?.('noteModeText'));

 nav?.addEventListener('click',event=>{
  const button=event.target.closest('button[data-sv-work-tab]');
  if(!button||!nav.contains(button)||!page.open)return;
  const target=button.dataset.svWorkTab;
  if(target==='notes')return;
  const workTabs=document.getElementById('svWorkTabs');
  const delegate=workTabs?.querySelector('button[data-sv-work-tab="'+target+'"]');
  // Keep the underlying Work destination ready before revealing it.
  if(delegate&&!delegate.hidden&&!workTabs.hidden)delegate.click();
  else if(target==='personal'){
   window.SEYVEO_UNIFIED_TASKS?.openPersonal?.();
  }else if(target==='calendar'){
   location.hash='#calendar';
  }else if(target==='business'){
   window.SEYVEO_UNIFIED_TASKS?.openBusiness?.('preserve');
  }
  page.close();
 });
 dock?.addEventListener('click',event=>{
  if(!page.open)return;
  const target=event.target.closest?.('button');
  if(target&&topLevelRoutes.has(target.id))page.close();
 },true);
 window.SEYVEO_NOTEBOOK_SCREEN=Object.freeze({version:2,show:()=>page.show(),close:()=>page.close()});
})();
