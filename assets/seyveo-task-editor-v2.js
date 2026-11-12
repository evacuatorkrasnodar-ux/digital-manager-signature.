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
 view.add.addEventListener('click',()=>{
  if(save.disabled)return;
  if(typeof form.requestSubmit==='function')form.requestSubmit(save);
  else save.click();
 });
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
 dialog.addEventListener('close',sync);
 window.SEYVEO_TASK_SCREEN=Object.freeze({version:2,sync});
})();
