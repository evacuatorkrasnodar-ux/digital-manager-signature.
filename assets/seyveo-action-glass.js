/* SEYVEO · semantic glass for explicit text actions.
 * No geometry, click handlers, icons, menus, dock, or segmented controls. */
(()=>{
 'use strict';
 if(window.SEYVEO_ACTION_GLASS)return;
 window.SEYVEO_ACTION_GLASS=true;
 const labels={
  'сохранить':'primary','сохранить график':'primary','сохранить перерыв':'primary',
  'сохранить контакт':'primary','сохранить здесь':'primary','сохранить ссылку':'primary',
  'сохранить изменения':'primary','подтвердить и сохранить сведения':'primary',
  'сбросить':'neutral','сброс':'neutral','сбросить фильтры':'neutral',
  'сбросить настройки':'neutral','отмена':'neutral','отменить':'neutral',
  'удалить':'danger','удалить контакт':'danger','удалить выбранное':'danger',
  'удалить выбранные':'danger','удалить запись':'danger'
 };
 const excluded='footer.dock,.sv-newdock-button,[role="menu"],[role="menuitem"],[role="listbox"],[role="tablist"],.svcp-attach-menu,.svcp-bubble,.sv-editor-capsule,.sv-paper-tools,.sv-note-tool-row,.sv-tool-filters,.sv-mail-account-switch,.sv-nav-back,.sv-nav-arrow,.sv-header-material-circle,.svcp-call-actions,.svcp-clean-surface,[class*="context-menu"],[class*="context-actions"],[class*="dropdown-menu"],[class*="popover"],[class*="action-menu"]';
 function mark(b){
  if(!b||!b.matches('button'))return;
  const name=b.textContent.replace(/\s+/g,' ').trim().toLocaleLowerCase('ru-RU');
  const eligible=!b.closest(excluded)&&!b.hasAttribute('aria-pressed')&&!b.hasAttribute('aria-selected')&&!b.hasAttribute('aria-expanded')&&!b.querySelector('svg,img,canvas')&&!b.matches('[role="tab"],[role="menuitem"]');
  const kind=eligible?(labels[name]||(/^удалить\s*\(\d+\)$/.test(name)?'danger':null)):null;
  if(kind){if(b.dataset.svActionGlass!==kind)b.dataset.svActionGlass=kind}
  else if(b.hasAttribute('data-sv-action-glass'))b.removeAttribute('data-sv-action-glass');
 }
 function scan(root){
  if(root.nodeType===1){mark(root.closest('button'));root.querySelectorAll('button').forEach(mark)}
  else if(root.nodeType===3)mark(root.parentElement?.closest('button'));
 }
 function init(){
  document.querySelectorAll('button').forEach(mark);
  const observer=new MutationObserver(records=>{
   for(const m of records){
    if(m.type==='characterData')scan(m.target);
    else{
     mark(m.target.nodeType===1?m.target.closest('button'):null);
     for(const n of m.addedNodes)scan(n);
    }
   }
  });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
 }
 if(document.body)init();else document.addEventListener('DOMContentLoaded',init,{once:true});
})();
