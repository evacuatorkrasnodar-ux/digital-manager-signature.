/* SEYVEO Document Vault panel.
   Password unlock is explicit. No cloud upload or fake success states.
   UI is separate from document editor to keep one file/preview implementation. */
(()=>{
'use strict';
const $=(tag,cls,value)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(value!==undefined)node.textContent=value;
 return node;
};
const btn=(text,callback,cls='')=>{
 const b=$('button','sv-doc-action'+(cls?' '+cls:''),text);
 b.type='button';b.addEventListener('click',callback);return b;
};
const message=(line,kind='')=>{
 const p=$('p','sv-vault-status'+(kind?' sv-vault-'+kind:''),line);
 p.setAttribute('role','status');return p;
};
function passwordInput(placeholder){
 const i=$('input','sv-doc-input');
 i.type='password';i.autocomplete='off';i.placeholder=placeholder;
 i.setAttribute('aria-label',placeholder);i.minLength=12;
 return i;
}
function mount(slot,api){
 if(!slot||!slot.isConnected)return false;
 const vault=window.SEYVEO_DOCUMENT_VAULT;
 if(!vault){slot.append(message('Модуль архива недоступен.','error'));return false;}
 const area=api.area,live=message('Проверяем локальное хранилище...');
 const header=$('div','sv-vault-head');
 header.append($('strong','','Зашифрованный архив'),
               $('small','','Только на этом устройстве · доступ по паролю'));
 slot.replaceChildren(header,live);
 const valid=()=>slot.isConnected&&area===api.currentArea();
 async function run(job){
  try{await job()}catch(err){
   if(!valid())return;
   const details=err?.message||'Не удалось выполнить операцию.';
   const visible=slot.querySelector('.sv-vault-form .sv-vault-status');
   if(visible)visible.textContent=details;
   else slot.append(message(details,'error'));
  }
 }
 function lockedForm(initialized){
  if(!valid())return;
  // The parent disclosure already names the archive. Keep its inner view
  // focused on the password operation rather than repeating another heading.
  slot.replaceChildren();
  const notice=message(initialized
   ?'Архив заблокирован. Введите пароль, чтобы открыть личные и деловые документы.'
   :'Создайте пароль архива. При утере пароля восстановить сохранённые документы нельзя.');
  const form=$('form','sv-vault-form');
  const pass=passwordInput(initialized?'Пароль архива':'Новый пароль · минимум 12 символов');
  form.append(pass);
  let confirmation=null;
  if(!initialized){
   confirmation=passwordInput('Повторите пароль');
   form.append(confirmation);
  }
  const status=message('');
  const submit=$('button','sv-doc-action sv-doc-primary',initialized?'Открыть архив':'Создать архив');submit.type='submit';
  const actions=$('div','sv-doc-file-actions');actions.append(submit);
  form.append(actions,status);
  form.addEventListener('submit',event=>{
   event.preventDefault();
   if(!pass.value){status.textContent='Введите пароль.';return;}
   if(!initialized&&pass.value!==confirmation.value){status.textContent='Пароли не совпадают.';return;}
   submit.disabled=true;status.textContent='Работаем с зашифрованным архивом…';
   const task=initialized?vault.unlock(pass.value):vault.setup(pass.value);
   run(async()=>{
    await task;
    pass.value='';if(confirmation)confirmation.value='';
    if(valid())await unlockedView();
   }).finally(()=>{submit.disabled=false;});
  });
  slot.append(form,$('p','sv-doc-note',
   'В браузерной версии пароль не восстанавливается. Данные могут пропасть при очистке браузера или удалении приложения. Для важных документов пока необходима отдельная резервная копия.'));
 }
 function downloadLocal(file){
  // Decrypt only after the user requests an action. The copied file leaves
  // the encrypted browser vault, so never download as a background task.
  const url=URL.createObjectURL(file),a=document.createElement('a');
  a.href=url;a.download=file.name||'Документ';document.body.append(a);
  a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),90000);
 }
 async function printOriginal(item,status){
  const ext=String(item.name||'').split('.').pop().toLowerCase();
  if(!['pdf','png','jpg','jpeg','webp'].includes(ext)){
   status.textContent='Для печати Word или другого формата откройте скачанный оригинал в подходящем приложении либо подготовьте PDF с Сэйви.';
   return;
  }
  // Open a blank tab in the direct tap event; WebKit may otherwise block it.
  const tab=window.open('about:blank','_blank');
  if(!tab){status.textContent='Safari заблокировал новую вкладку. Откройте оригинал и выберите «Печать» в меню браузера.';return}
  try{
   const file=await vault.getFile(area,item.id);
   if(!valid()){tab.close();return}
   const url=URL.createObjectURL(file);
   tab.location.replace(url);
   setTimeout(()=>URL.revokeObjectURL(url),180000);
   status.textContent='Открыт оригинал. Для печати выберите «Поделиться» → «Печать» в Safari.';
  }catch(error){
   tab.close();
   status.textContent=error?.message||'Не удалось подготовить документ к печати.';
  }
 }
 async function shareOriginal(item,status){
  if(typeof navigator.share!=='function'){
   status.textContent='На этом устройстве системная отправка недоступна. Скачайте оригинал и прикрепите его в почте вручную.';
   return;
  }
  const file=await vault.getFile(area,item.id);
  if(!valid())return;
  if(navigator.canShare&&!navigator.canShare({files:[file]})){
   status.textContent='Safari не поддерживает отправку этого вложения. Скачайте оригинал и приложите к письму вручную.';
   return;
  }
  try{
   await navigator.share({files:[file],title:file.name});
   if(valid())status.textContent='Открыто системное меню отправки. Факт доставки проверяйте в выбранном приложении.';
  }catch(error){
   if(valid()&&error?.name!=='AbortError')status.textContent='Не удалось открыть отправку. Можно скачать файл и передать вручную.';
  }
 }
 async function unlockedView(){
  if(!valid())return;
  let items;
  try{items=await vault.list(area)}
  catch(error){
   slot.replaceChildren(header,message(error?.message||'Не удалось прочитать архив.','error'),
    btn('Заблокировать',()=>{vault.lock();api.clearSession();}));
   return;
  }
  if(!valid())return;
  slot.replaceChildren(header);
  const controls=$('div','sv-vault-controls');
  const locked=btn('Заблокировать',()=>{
   vault.lock();
   api.clearSession();
  });
  const counter=$('span','sv-vault-count',items.length+' '+(items.length===1?'документ':items.length<5?'документа':'документов'));
  controls.append(counter,locked);slot.append(controls);
  const selected=api.selectedFile();
  if(selected instanceof File){
   slot.append(btn('Сохранить выбранный файл',()=>{
    run(async()=>{
     const name=selected.name;
     await vault.addFile(area,selected);
     if(valid())api.savedFile?.(selected);
     if(valid())await unlockedView();
     if(valid())slot.append(message('«'+name+'» зашифрован и сохранён в архиве.'));
    });
   },'sv-doc-primary'));
  }
  const draft=api.draft();
  if(draft?.text?.trim()){
   slot.append(btn('Сохранить черновик',()=>{
    run(async()=>{
     const name=(draft.title.trim()||'Документ-SEYVEO').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').slice(0,80)+'.txt';
     await vault.addFile(area,new File([draft.text],name,{type:'text/plain;charset=utf-8'}));
     if(valid())await unlockedView();
     if(valid())slot.append(message('Черновик зашифрован и сохранён.'));
    });
   }));
  }
  const list=$('div','sv-vault-list');
  if(!items.length)list.append($('p','sv-doc-note','Здесь пока нет сохранённых документов.'));
  for(const item of items){
   const entry=$('div','sv-vault-row');
   const text=$('div','sv-vault-row-text');
   text.append($('strong','',item.name),
               $('small','',new Date(item.createdAt).toLocaleDateString('ru-RU')+' · '+Math.max(1,Math.ceil(item.size/1024))+' КБ'));
   const actions=$('div','sv-vault-row-actions');
   actions.append(btn('Открыть',()=>{
    run(async()=>{
     const file=await vault.getFile(area,item.id);
     if(valid())api.openFile(file,area);
    });
   }));
   const details=$('details','sv-vault-row-menu');
   const summary=$('summary','sv-vault-row-more','Действия');
   summary.setAttribute('aria-label','Действия с документом '+item.name);
   const options=$('div','sv-vault-row-options');
   const actionStatus=message('');
   const action=(label,fn)=>{
    const b=btn(label,fn,'sv-vault-option');
    options.append(b);return b;
   };
   action('Скачать оригинал',()=>run(async()=>{
    const file=await vault.getFile(area,item.id);
    if(valid()){downloadLocal(file);actionStatus.textContent='Оригинал подготовлен для скачивания.'}
   }));
   action('Печать',()=>{printOriginal(item,actionStatus)});
   action('Поделиться / почта',()=>run(()=>shareOriginal(item,actionStatus)));
   action('PDF / Word с Сэйви',()=>api.toSayvi?.('export'));
   action('Подписать КЭП',()=>{
    actionStatus.textContent='Квалифицированная электронная подпись ещё не подключена. Нужны сертификат, проверка полномочий и разрешённый сервис подписания.';
    api.showIntegrations?.();
   });
   action('Удалить из архива',()=>{
    if(!window.confirm('Удалить документ «'+item.name+'» из архива без возможности отмены?'))return;
    run(async()=>{await vault.remove(area,item.id);if(valid())await unlockedView()});
   });
   details.append(summary,options,actionStatus);actions.append(details);
   entry.append(text,actions);list.append(entry);
  }
  slot.append(list,$('p','sv-doc-note',
   'Содержимое и названия шифруются AES-GCM. Пароль не хранится. Защита действует для архива на этом устройстве — это ещё не системный защищённый сейф iOS/Android.'));
 }
 run(async()=>{
  const state=await vault.status();
  if(!valid())return;
  if(!state.supported)slot.replaceChildren(header,message('Архив недоступен: необходимо HTTPS и разрешённое хранилище браузера.','error'));
  else if(state.unlocked)await unlockedView();
  else lockedForm(state.initialized);
 });
 return true;
}
window.SEYVEO_DOCUMENT_VAULT_UI=Object.freeze({mount});
})();
