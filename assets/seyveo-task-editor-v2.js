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

 const dateRow=sheet.querySelector('.personal-task-field');
 if(dateRow&&!sheet.querySelector('#personalTaskTime')){
  const row=document.createElement('div');
  row.className='personal-task-field sv-task-time-row';
  row.innerHTML='<svg class="sv-task-clock-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.25"/><path d="M12 7.5v5l3.25 2"/></svg><span class="personal-task-field-caption">Время</span><span id="personalTaskTimeDisplay" class="sv-task-time-display">Не выбрано</span><svg class="personal-task-date-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg><input type="time" id="personalTaskTime" name="time" step="60" aria-label="Время выполнения дела"><button type="button" class="sv-task-time-open" aria-label="Выбрать время"></button><button type="button" class="sv-task-time-clear" hidden aria-label="Убрать время">×</button>';
  dateRow.insertAdjacentElement('afterend',row);
  const field=row.querySelector('input'),shown=row.querySelector('#personalTaskTimeDisplay'),clear=row.querySelector('.sv-task-time-clear');
  const trigger=row.querySelector('.sv-task-time-open');
  // Native time input is unreliable when fully transparent on some Safari
  // builds. Always keep a fully working fallback with real selects.
  const picker=document.createElement('div');
  picker.className='sv-task-time-picker';picker.hidden=true;
  picker.setAttribute('aria-label','Часы и минуты');
  const hours=document.createElement('select'),minutes=document.createElement('select');
  hours.setAttribute('aria-label','Часы');minutes.setAttribute('aria-label','Минуты');
  for(let n=0;n<24;n++){const o=document.createElement('option');o.value=String(n).padStart(2,'0');o.textContent=o.value;hours.append(o)}
  for(let n=0;n<60;n++){const o=document.createElement('option');o.value=String(n).padStart(2,'0');o.textContent=o.value;minutes.append(o)}
  const done=document.createElement('button');done.type='button';done.className='sv-task-time-done';done.textContent='Готово';
  picker.append(hours,minutes,done);row.insertAdjacentElement('afterend',picker);
  const openFallback=()=>{
   const parts=/^\d{2}:\d{2}$/.test(field.value)?field.value.split(':'):['12','00'];
   hours.value=parts[0];minutes.value=parts[1];picker.hidden=false;
   trigger.setAttribute('aria-expanded','true');
  };
  trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-controls','svTaskTimePicker');
  picker.id='svTaskTimePicker';
  trigger.addEventListener('click',()=>{
   // showPicker is explicitly invoked inside the original click activation.
   if(typeof field.showPicker==='function'){
    try{field.showPicker();return}catch(e){/* Safari support varies */}
   }
   openFallback();
  });
  done.addEventListener('click',()=>{
   field.value=hours.value+':'+minutes.value;
   field.dispatchEvent(new Event('change',{bubbles:true}));
   picker.hidden=true;trigger.setAttribute('aria-expanded','false');
  });
  dialog.addEventListener('close',()=>{picker.hidden=true;trigger.setAttribute('aria-expanded','false')});

  const refresh=()=>{
   const valid=/^([01]\d|2[0-3]):[0-5]\d$/.test(field.value);
   shown.textContent=valid?field.value:'Не выбрано';
   row.dataset.filled=String(valid);
   clear.hidden=!valid;
  };
  field.addEventListener('input',refresh);
  field.addEventListener('change',refresh);
  clear.addEventListener('click',()=>{field.value='';refresh();});
  dialog.addEventListener('close',refresh);
  dialog.addEventListener('sv-task-time-sync',refresh);
  refresh();
 }
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
 // Saving happens automatically when leaving the editor: no checkmark action.
 view.add.hidden=true;view.add.style.display='none';view.add.tabIndex=-1;
 view.add.setAttribute('aria-hidden','true');
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
