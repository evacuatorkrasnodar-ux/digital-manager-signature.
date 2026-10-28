/* SEYVEO · First acquaintance v1
 * Independent, local-only profile, never edits demo cases or sends data. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const dialog=$('onboardDialog'),entry=$('openOnboarding'),form=$('onboardForm');
  if(!dialog||!entry||!form)return;
  const PROFILE='seyveo-first-acquaintance-v1';
  const SKIPPED='seyveo-first-acquaintance-skipped-v1';
  const CHOICES=Object.freeze({
    life:'ONE',start:'RISE',pro:'AUTONOM',max:'Крупная компания · сценарий'
  });
  const safeRead=key=>{try{return localStorage.getItem(key)}catch{return null}};
  const safeWrite=(key,value)=>{try{localStorage.setItem(key,value);return true}catch{return false}};
  const safeRemove=key=>{try{localStorage.removeItem(key)}catch{}};
  const trim=(s,max)=>String(s||'').trim().slice(0,max);
  function existing(){
    try{
      const value=JSON.parse(safeRead(PROFILE)||'null');
      if(!value||typeof value!=='object'||!CHOICES[value.focus])return null;
      return value;
    }catch{return null}
  }
  function overview(){
    const old=existing();
    const label=$('onboardManageSummary');
    label.textContent=old?'Настроено':'По желанию';
    const sub=$('onboardManageDescription');
    sub.textContent=old?'Имя и приоритеты · сохранены':'Продолжить знакомство · можно позже';
  }
  function show(){
    const old=existing();
    $('onboardName').value=old?.name||'';
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
    const assistantName='Сэйви';
    const value={
      schemaVersion:1,
      name:trim($('onboardName').value,60),
      assistantName,
      assistantVoice:'female',
      assistantAliases:['Сэйви','Сэй','SEYVEO'],
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
  // Keep the single personal profile editor available in Management as "Обо мне".
  window.addEventListener('seyveo:profile-changed',overview);
})();