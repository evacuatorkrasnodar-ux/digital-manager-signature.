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
      if(!menu.hidden)menu.hidden=true;
      if(trigger.getAttribute('aria-expanded')!=='false')trigger.setAttribute('aria-expanded','false');
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


/* SEYVEO Notebook · accessible SVG actions and clean list previews | 2026-11-10 */
(()=>{
  'use strict';
  if(window.SEYVEO_NOTE_LIST_ICONS)return;
  const list=document.getElementById('notesList');
  if(!list)return;
  const icons={
    share:'<path d="M12 15V3m0 0-4 4m4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    print:'<path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6zM17.5 11.7h.01"/>',
    delete:'<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-9 4v4m-2-2h4"/>'
  };
  const svg=kind=>'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icons[kind]+'</svg>';
  function upgrade(){
    for(const row of list.querySelectorAll('.note-item')){
      // The source note retains its text, including checklist characters.
      // Only the 2-line summary in the list hides stray square glyphs.
      const summary=row.querySelector('.note-row-copy > p');
      if(summary&&!summary.dataset.svCleanSummary){
        const before=summary.textContent||'';
        const after=before.replace(/^[\s]*[☐☑☒□■][\s]*/gm,'').trim();
        if(after!==before)summary.textContent=after||'Список';
        summary.dataset.svCleanSummary='true';
      }
      for(const button of row.querySelectorAll('.note-more-options button')){
        if(button.dataset.svNoteIcon)continue;
        const label=(button.textContent||'').trim();
        const kind=button.classList.contains('note-delete')?'delete':
          /Поделиться/i.test(label)?'share':
          /Распечатать/i.test(label)?'print':
          /календарь|^На .+\?$/i.test(label)?'calendar':null;
        if(!kind)continue;
        button.setAttribute('aria-label',label);
        button.title=label;
        button.dataset.svNoteIcon=kind;
        // Update only the button's children. Its original click listeners,
        // confirmation dialog, sharing and printing logic remain untouched.
        button.innerHTML=svg(kind);
      }
    }
  }
  const observer=new MutationObserver(upgrade);
  observer.observe(list,{childList:true});
  window.addEventListener('seyveo:notes-open',upgrade);
  window.SEYVEO_NOTE_LIST_ICONS=Object.freeze({refresh:upgrade});
  upgrade();
})();
