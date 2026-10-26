/* SEYVEO · unified Quiet Cinema navigation.
 * Decorates EXISTING buttons; never creates duplicate closes, changes routes,
 * writes persistent data, submits forms or replaces any app click handler.
 * Its only behavior is protecting unsaved changes in three existing editors. */
(()=>{'use strict';
 if(window.SEYVEO_NAVIGATION)return;
 const $=id=>document.getElementById(id);
 const redundant=new Set([
  'personalTaskDialog','calendarEventDialog','noteReviewDialog',
  'notePaperDialog','noteReadDialog','assistantChatHistoryDialog',
  'wakeVoiceConsent','homeWidgetsManageDialog','homeWidgetDetails',
  'seyveoAvatarDialog'
 ]);
 const nestedBack=new Set(['noteScanBack']);
 document.querySelectorAll('dialog > button.seyveo-dialog-close').forEach(button=>{
  const dialog=button.parentElement;
  if(!dialog)return;
  if(redundant.has(dialog.id)){
   button.classList.add('sv-nav-redundant');
   button.setAttribute('aria-hidden','true');
   button.tabIndex=-1;
   return;
  }
  if(nestedBack.has(button.id)){
   button.classList.add('sv-nav-back');
   return;
  }
  // Reuse the exact same closing button and handler; only its glyph changes.
  if(!button.classList.contains('seyveo-text-close')){
   button.replaceChildren(document.createTextNode('Готово'));
   button.classList.add('seyveo-text-close');
  }
  button.classList.add('sv-nav-done');
  const destination=dialog.getAttribute('aria-labelledby');
  const title=destination?$(destination)?.textContent.trim():'';
  button.setAttribute('aria-label',title?'Готово — закрыть '+title:'Готово — закрыть окно');
 });
 // These custom close buttons have their own, already-tested handlers.
 // The visible footer action serves the same purpose, so hide the duplicate.
 ['onboardClose','assistantQuickSettingsClose'].forEach(id=>{
  const button=$(id);
  if(!button)return;
  button.classList.add('sv-nav-redundant');
  button.hidden=true;
  button.tabIndex=-1;
 });
 // Existing page Back buttons are never repurposed to "Home".
 [
  'seyveoConversationBack','noteScanBack','manageThemeBack',
  'lifeBack','calendarMeasureBack','seyveoCleanBack','sayviVideoBack',
  'sayviAnswerBack','sayviSurfaceBack'
 ].forEach(id=>$(id)?.classList.add('sv-nav-back'));
 // On editable forms, cancel / Escape must not silently discard entered data.
 // We snapshot only fields after a dialog actually opens; saving uses the
 // original app submit handler untouched.
 const guarded=[
  ['noteReviewDialog','noteReviewForm',['noteReviewCancel']],
  ['personalTaskDialog','personalTaskForm',['personalTaskCancel']],
  ['calendarEventDialog','calendarEventForm',['calendarEventCancel']]
 ];
 const serializers=new WeakMap();
 function formSignature(form){
  return Array.from(form.elements).filter(el=>el.name||el.id)
   .filter(el=>!['submit','button','reset'].includes(el.type))
   .map(el=>{
    const selected=el.tagName==='SELECT'&&el.multiple
      ? Array.from(el.selectedOptions).map(x=>x.value).join(',')
      : el.type==='checkbox'||el.type==='radio' ? String(el.checked) : String(el.value);
    return (el.name||el.id)+':'+selected;
   }).join('\u001f');
 }
 guarded.forEach(([dialogId,formId,cancelIds])=>{
  const dialog=$(dialogId),form=$(formId);
  if(!dialog||!form)return;
  function capture(){
   if(dialog.open)serializers.set(dialog,formSignature(form));
   else serializers.delete(dialog);
  }
  const observer=new MutationObserver(capture);
  observer.observe(dialog,{attributes:true,attributeFilter:['open']});
  if(dialog.open)capture();
  function hasUnsaved(){
   return dialog.open&&serializers.has(dialog)&&
    serializers.get(dialog)!==formSignature(form);
  }
  function confirmLeaving(event){
   if(!hasUnsaved())return;
   if(window.confirm('Есть несохранённые изменения. Закрыть без сохранения?'))return;
   event.preventDefault();
   event.stopImmediatePropagation();
  }
  dialog.addEventListener('cancel',confirmLeaving);
  cancelIds.forEach(id=>{
   $(id)?.addEventListener('click',confirmLeaving,true);
  });
  // Some existing forms close when tapping outside the dialog.
  dialog.addEventListener('click',event=>{
   if(event.target===dialog)confirmLeaving(event);
  },true);
 });
 window.SEYVEO_NAVIGATION=Object.freeze({version:1});
})();