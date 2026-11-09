/* SEYVEO Notebook · dismissible menus, 2026-11-09.
 * Existing toolbar click actions remain the single owner of opening/toggling.
 * This controller only dismisses open popovers and mirrors ARIA state.
 */
(()=>{
  'use strict';
  if(window.SEYVEO_NOTE_MENU_DISMISS)return;
  const dialog=document.getElementById('noteReviewDialog');
  if(!dialog)return;
  const items=[
    {menu:document.getElementById('svNoteAttachmentMenu'),trigger:dialog.querySelector('[data-note-tool="attachment"]')},
    {menu:document.getElementById('svNoteFormatMenu'),trigger:dialog.querySelector('[data-note-tool="heading"]')}
  ].filter(x=>x.menu&&x.trigger);
  if(!items.length)return;
  const IDLE_MS=6000;
  let timer=null;
  const openItems=()=>items.filter(x=>!x.menu.hidden);
  function clearTimer(){
    if(timer!==null){clearTimeout(timer);timer=null;}
  }
  function closeMenus(){
    clearTimer();
    for(const {menu,trigger} of items){
      menu.hidden=true;
      trigger.setAttribute('aria-expanded','false');
    }
  }
  function synchronize(){
    clearTimer();
    if(!dialog.open){closeMenus();return;}
    for(const {menu,trigger} of items){
      trigger.setAttribute('aria-expanded',String(!menu.hidden));
    }
    if(openItems().length){
      timer=window.setTimeout(closeMenus,IDLE_MS);
    }
  }
  // The original click listeners toggle .hidden. Observe their final state
  // instead of adding competing click handlers to buttons or popover items.
  const observer=new MutationObserver(synchronize);
  for(const {menu} of items){
    observer.observe(menu,{attributes:true,attributeFilter:['hidden']});
  }
  observer.observe(dialog,{attributes:true,attributeFilter:['open']});

  // Touch/click outside closes immediately, without preventing the actual tap.
  document.addEventListener('pointerdown',event=>{
    if(!dialog.open||!openItems().length)return;
    const target=event.target;
    const inside=items.some(({menu,trigger})=>menu.contains(target)||trigger.contains(target));
    if(!inside)closeMenus();
    else{
      clearTimer();
      timer=window.setTimeout(closeMenus,IDLE_MS);
    }
  },true);

  // Keyboard users get the same behavior, without closing the entire editor.
  document.addEventListener('keydown',event=>{
    if(!dialog.open||!openItems().length)return;
    if(event.key==='Escape'){
      closeMenus();
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if(items.some(({menu})=>menu.contains(document.activeElement))){
      clearTimer();
      timer=window.setTimeout(closeMenus,IDLE_MS);
    }
  },true);
  dialog.addEventListener('close',closeMenus);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)closeMenus();
  });
  window.SEYVEO_NOTE_MENU_DISMISS=Object.freeze({close:closeMenus,idleMs:IDLE_MS});
  synchronize();
})();
