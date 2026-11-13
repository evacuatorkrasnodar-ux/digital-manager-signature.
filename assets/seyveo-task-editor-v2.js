/* SEYVEO · New Task screen v2
   Reuses the real Work Shadow DOM header instead of reproducing its material
   and geometry with conflicting legacy task-dialog rules.
   Existing task IDs, submission logic and calendar picker stay unchanged. */
(()=>{
 'use strict';
 const dialog=document.getElementById('personalTaskDialog');
 const sheet=dialog?.querySelector('.personal-task-sheet');
 const legacy=sheet?.querySelector('.sv-task-original-controls');
 const back=document.getElementById('personalTaskCancel');
 const save=document.getElementById('personalTaskSave');
 const title=document.getElementById('personalTaskDialogTitle');
 const form=document.getElementById('personalTaskForm');
 const factory=window.SEYVEO_WORK_HEADER;
 if(!dialog||!sheet||!legacy||!back||!save||!title||!form||!factory?.create)return;
 if(sheet.querySelector('#svTaskSharedHeader'))return;
 const view=factory.create();
 const host=view.host;
 host.id='svTaskSharedHeader';
 host.setAttribute('aria-label','Навигация нового дела');
 const check=document.createElementNS('http://www.w3.org/2000/svg','svg');
 check.setAttribute('viewBox','0 0 24 24');
 check.setAttribute('aria-hidden','true');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('d','m5 12.3 4.5 4.5L19 7.4');
 check.append(path);
 view.add.replaceChildren(check);
 view.back.setAttribute('aria-label','Назад к моим делам');
 view.back.addEventListener('click',()=>back.click());
 // The due-date stage previously used an independent header with its own
 // grid and top offsets. Mount an IDENTICAL shared Work header instead:
 // same Shadow DOM, grid, vertical center, button material and safe areas.
 // Keep the original date Back button as the existing behavior delegate.
 const duePicker=sheet.querySelector('#seyveoTaskDuePicker');
 const oldDateHeader=duePicker?.querySelector(':scope > .sv-task-date-header');
 const oldDateBack=oldDateHeader?.querySelector('.sv-task-date-back');
 if(duePicker&&oldDateHeader&&oldDateBack&&!duePicker.querySelector('#svTaskDateSharedHeader')){
  const dateView=factory.create();
  dateView.host.id='svTaskDateSharedHeader';
  dateView.host.setAttribute('aria-label','Выбор срока дела');
  dateView.title.textContent='Выбрать срок';
  dateView.title.id='svTaskDateHeading';
  dateView.add.hidden=true;
  dateView.back.setAttribute('aria-label','Вернуться к новому делу');
  dateView.back.addEventListener('click',()=>oldDateBack.click());
  // Replace just the visible stage heading. The old handlers retain their
  // detached button references, so Save, Today, No Date and Back stay intact.
  duePicker.replaceChild(dateView.host,oldDateHeader);
  const dateTheme=()=>{dateView.host.dataset.theme=document.documentElement.dataset.theme==='dark'?'dark':'light'};
  new MutationObserver(dateTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  dateTheme();
 }
 view.add.addEventListener('click',()=>{
  if(save.disabled)return;
  if(typeof form.requestSubmit==='function')form.requestSubmit(save);
  else save.click();
 });
 // Match the actual on-screen circles of «Мои дела», not estimated
 // padding. Both headers are built from the same Shadow DOM factory, but
 // their parents have different horizontal gutters. Calibrate ONLY these
 // two buttons; do not move the title, form or 60px dock.
 const alignButtons=()=>{
  if(!dialog.open)return;
  const source=document.querySelector('#svWorkShell > seyveo-work-head');
  const sourceShadow=source?.shadowRoot;
  if(!sourceShadow)return;
  // In My Tasks the default Back slot is intentionally hidden and
  // replaced by Select in the exact same grid cell. Measure the VISIBLE
  // button, not the retired hidden Back (zero-size rect).
  const leftReference=source.dataset.taskTools==='true'
   ?sourceShadow.querySelector('.sv-history-select')
   :sourceShadow.querySelector('.control.back');
  const pairs=[
   [view.back,leftReference],
   [view.add,sourceShadow.querySelector('.control.action')]
  ];
  for(const [target,reference] of pairs){
   if(!target||!reference)continue;
   const match=reference.getBoundingClientRect();
   // If Work isn't the currently visible page (e.g. launched from Home),
   // leave the button in its ordinary shared-header grid position.
   if(!match.width||!match.height||match.top<0||match.top>140)continue;
   target.style.transform='none';
   const actual=target.getBoundingClientRect();
   const x=(match.left+match.width/2)-(actual.left+actual.width/2);
   const y=(match.top+match.height/2)-(actual.top+actual.height/2);
   target.style.transform='translate('+x.toFixed(2)+'px,'+y.toFixed(2)+'px)';
  }
 };
 // MutationObserver runs at the end of the same task as showModal(), before
 // the next paint, so there is no visible intermediate button movement.
 new MutationObserver(()=>{if(dialog.open)alignButtons();}).observe(dialog,{attributes:true,attributeFilter:['open']});
 window.addEventListener('resize',alignButtons,{passive:true});
 const sync=()=>{
  view.title.textContent=title.textContent||'Новое дело';
  view.add.disabled=save.disabled;
  check.style.opacity=save.disabled?'.32':'1';
  view.add.style.cursor=save.disabled?'default':'pointer';
  view.add.setAttribute('aria-disabled',String(save.disabled));
  view.add.setAttribute('aria-label',save.getAttribute('aria-label')||'Сохранить дело');
  view.add.title=save.title||'Сохранить дело';
 };
 sheet.insertBefore(host,legacy);
 // Keep actual original controls mounted for the existing task listeners.
 // Hide the entire old header only AFTER the shared header is ready.
 dialog.dataset.svTaskHeaderReady='true';
 legacy.hidden=true;
 sync();
 new MutationObserver(sync).observe(title,{childList:true,characterData:true,subtree:true});
 new MutationObserver(sync).observe(save,{attributes:true,attributeFilter:['disabled','aria-label','title']});
 const syncTheme=()=>{host.dataset.theme=document.documentElement.dataset.theme==='dark'?'dark':'light';};
 new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 dialog.addEventListener('close',()=>{
  view.back.style.transform='none';
  view.add.style.transform='none';
  sync();
 });
 window.SEYVEO_TASK_SCREEN=Object.freeze({version:2,sync});
})();
