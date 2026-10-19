/* SEYVEO · First acquaintance v1
 * Independent, local-only profile, never edits demo cases or sends data. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const dialog=$('onboardDialog'),entry=$('openOnboarding'),form=$('onboardForm');
  if(!dialog||!entry||!form)return;
  const PROFILE='seyveo-first-acquaintance-v1';
  // Presets from the approved naming concept. These are gender preferences,
  // not guaranteed synthetic voice models (availability varies by OS).
  const ASSISTANT_NAMES=Object.freeze({'Феликс':'male','Филя':'male','Милисса':'female','Мили':'female','Бэйси':'female','Боня':'male','Торик':'male'});
  const nameInput=$('onboardAssistantName');
  const nameChoices=[...form.querySelectorAll('[data-assistant-name]')];
  function markName(){
    const value=trim(nameInput.value,40);
    nameChoices.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.assistantName===value)));
  }
  nameChoices.forEach(button=>button.addEventListener('click',()=>{
    nameInput.value=button.dataset.assistantName;
    markName();
  }));
  nameInput.addEventListener('input',()=>{
    markName();
  });
  const SKIPPED='seyveo-first-acquaintance-skipped-v1';
  const CHOICES=Object.freeze({
    life:'Life',start:'Business Start',pro:'Business Pro',max:'Business Max'
  });
  const safeRead=key=>{try{return localStorage.getItem(key)}catch{return null}};
  const safeWrite=(key,value)=>{try{localStorage.setItem(key,value);return true}catch{return false}};
  const safeRemove=key=>{try{localStorage.removeItem(key)}catch{}};
  const trim=(s,max)=>String(s||'').trim().slice(0,max);
  function existing(){
    try{
      const value=JSON.parse(safeRead(PROFILE)||'null');
      if(!value||typeof value!=='object'||!CHOICES[value.focus])return null;
      // Old preview spelling stays compatible without rewriting stored preferences.
      if(value.assistantName==='Мелисса')return {...value,assistantName:'Милисса',assistantAliases:['Милисса','Мили','Мелисса']};
      return value;
    }catch{return null}
  }
  function overview(){
    const old=existing();
    const label=$('onboardManageSummary');
    label.textContent=old?CHOICES[old.focus]:'Не настроено';
    const sub=$('onboardManageDescription');
    sub.textContent=old?(old.assistantName?'Помощник '+trim(old.assistantName,22)+' · можно изменить':old.name?'Для '+trim(old.name,22)+' · можно изменить':'Имя помощника и жизненный этап · сохранено'):'Имя помощника и жизненный этап';
  }
  function show(){
    const old=existing();
    $('onboardName').value=old?.name||'';
    nameInput.value=old?.assistantName||'';
    markName();
    const focus=CHOICES[old?.focus]?old.focus:'life';
    const radio=form.querySelector('input[name="onboardFocus"][value="'+focus+'"]');
    if(radio)radio.checked=true;
    $('onboardSaveStatus').textContent='';
    $('onboardSave').disabled=false;
    if(!dialog.open)dialog.showModal();
  }
  function skip(){
    const wasEmpty=!existing();
    if(wasEmpty)safeWrite(SKIPPED,'1');
    dialog.close();
  }
  function save(event){
    event.preventDefault();
    const focus=form.querySelector('input[name="onboardFocus"]:checked')?.value;
    if(!CHOICES[focus])return;
    const current=existing();
    const assistantName=trim(nameInput.value,40);
    const value={
      schemaVersion:1,
      name:trim($('onboardName').value,60),
      assistantName,
      assistantVoice:ASSISTANT_NAMES[assistantName]||null,
      assistantAliases:assistantName==='Феликс'?['Феликс','Филя']:assistantName==='Милисса'?['Милисса','Мили','Мелисса']:assistantName?[assistantName]:[],
      focus,
      lifeIncluded:true,
      updatedAt:new Date().toISOString(),
      createdAt:current?.createdAt||new Date().toISOString()
    };
    if(!safeWrite(PROFILE,JSON.stringify(value))){
      $('onboardSaveStatus').textContent='Не удалось сохранить на устройстве. Проверьте настройки браузера.';
      return;
    }
    safeRemove(SKIPPED);
    overview();
    dialog.close();
    window.dispatchEvent(new CustomEvent('seyveo:profile-changed',{detail:{focus:value.focus}}));
  }
  entry.addEventListener('click',show);
  form.addEventListener('submit',save);
  $('onboardSkip').addEventListener('click',skip);
  $('onboardClose').addEventListener('click',skip);
  dialog.addEventListener('cancel',()=>{if(!existing())safeWrite(SKIPPED,'1')});
  dialog.addEventListener('click',event=>{if(event.target===dialog)skip()});
  window.addEventListener('storage',event=>{if(event.key===PROFILE)overview()});
  overview();
  // First-install welcome is handled separately by welcome.js.
  // Keep this compact editor available from Management for existing users.
  window.addEventListener('seyveo:profile-changed',overview);
})();