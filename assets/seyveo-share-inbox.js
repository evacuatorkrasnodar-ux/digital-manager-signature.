/* SEYVEO · Android PWA share inbox. Explicit user choice before processing. */
(()=>{'use strict';
if('serviceWorker'in navigator&&location.protocol==='https:'){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}),{once:true});
}
const params=new URLSearchParams(location.search);
const shared=params.has('seyveoShared'),failed=params.has('seyveoShareError');
if(!shared&&!failed)return;
params.delete('seyveoShared');params.delete('seyveoShareError');
history.replaceState(history.state,'',location.pathname+(params.size?'?'+params:'')+location.hash);
const DB='seyveo-system-share-v1';
function connect(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('incoming'))r.result.createObjectStore('incoming',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function record(id,value,remove=false){
 const db=await connect();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction('incoming',remove||value?'readwrite':'readonly'),os=tx.objectStore('incoming');
  const req=remove?os.delete(id):value?os.put({...value,id}):os.get(id);
  let result=null;req.onsuccess=()=>{result=req.result};req.onerror=()=>reject(req.error);
  tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);
 });}finally{db.close()}
}
function sheet(item){
 const style=document.createElement('style');style.textContent=`
 .sv-share-dialog{border:0;background:transparent;padding:0;width:min(100vw - 20px,430px);max-height:calc(100dvh - 20px);color:#19191d}
 .sv-share-dialog::backdrop{background:rgba(19,20,25,.35);backdrop-filter:blur(7px)}
 .sv-share-shell{background:#fff;border-radius:25px;padding:20px;box-shadow:0 16px 70px #0002;font-family:-apple-system,BlinkMacSystemFont,sans-serif;overflow:auto;max-height:calc(100dvh - 30px)}
 .sv-share-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
 .sv-share-head h2{font-size:22px;font-weight:600;margin:0}.sv-share-head button{width:44px;height:44px;flex:none;border:0;background:#f2f2f5;border-radius:50%;font-size:25px;color:#222}
 .sv-share-lead{font-size:15px;line-height:1.45;color:#73747b;margin:12px 0 18px}
 .sv-share-preview{display:flex;align-items:center;gap:12px;padding:12px;background:#f5f5f7;border-radius:16px;min-width:0}
 .sv-share-preview img{width:76px;height:90px;object-fit:contain;border-radius:9px;flex:none}
 .sv-share-preview div{min-width:0}.sv-share-preview strong{font-size:15px;display:block;overflow-wrap:anywhere}.sv-share-preview small{display:block;font-size:12px;color:#85858d;margin-top:5px;overflow-wrap:anywhere}
 .sv-share-choices{display:grid;gap:10px;margin-top:20px}.sv-share-choices button{height:50px;text-align:left;padding:0 16px;background:#f2f2f5;border:1px solid #e8e8ec;border-radius:14px;color:#202024;font:500 16px -apple-system,BlinkMacSystemFont,sans-serif}
 .sv-share-choices button:first-child{background:#38383a;border-color:#38383a;color:#fff}
 .sv-share-foot{font-size:12px;line-height:1.5;color:#92939b;margin:16px 0 0}
 .sv-share-error{font-size:13px;color:#aa4545}
 `;document.head.append(style);
 const dlg=document.createElement('dialog');dlg.className='sv-share-dialog';dlg.setAttribute('aria-label','Сэйви получила файл');
 const shell=document.createElement('div');shell.className='sv-share-shell';
 shell.innerHTML='<div class="sv-share-head"><h2>Сэйви получила файл</h2><button type="button" data-share="dismiss" aria-label="Закрыть">×</button></div><p class="sv-share-lead">Что сделать с этим? Я помогу разобраться и попрошу подтверждение перед сохранением.</p><div class="sv-share-preview" id="svSharePreview"></div><div class="sv-share-choices"><button type="button" data-share="chat">Обсудить с Сэйви</button><button type="button" data-share="tasks">Добавить в Дела</button><button type="button" data-share="wallet">Записать расход в Кошелёк</button></div><p class="sv-share-foot">Ничего не сохранится в Дела или Кошелёк без твоего подтверждения. Полученный файл остаётся на этом устройстве.</p><p class="sv-share-error" id="svShareStatus" role="status"></p>';
 const files=(item?.files||[]).filter(x=>x&&x.size).map(f=>{
  if(f.type)return f;
  const ext=String(f.name||'').split('.').pop().toLowerCase();
  const type={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',pdf:'application/pdf',txt:'text/plain',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'}[ext]||'application/octet-stream';
  return new File([f],f.name||'Вложение',{type,lastModified:f.lastModified||Date.now()});
 });
 const preview=shell.querySelector('#svSharePreview'),previewName=document.createElement('div');
 const title=document.createElement('strong');title.textContent=files[0]?.name||item?.title||'Текст и ссылка';
 const details=document.createElement('small');details.textContent=files.length?(files.length+' вложений'):(item?.text||item?.url||'').slice(0,180);
 previewName.append(title,details);
 let objectUrl='';
 if(files[0]&&/^image\//i.test(files[0].type)){objectUrl=URL.createObjectURL(files[0]);const img=document.createElement('img');img.src=objectUrl;img.alt='Предпросмотр выбранной фотографии';preview.append(img)}
 preview.append(previewName);
 const file=files[0]||null;
 if(!file||!/^image\//i.test(file.type))shell.querySelector('[data-share="wallet"]').hidden=true;
 if(!file)shell.querySelector('[data-share="tasks"]').hidden=true;
 if(!file&&!item?.text&&!item?.url)shell.querySelector('[data-share="chat"]').hidden=true;
 dlg.append(shell);document.body.append(dlg);
 const status=shell.querySelector('#svShareStatus');
 const dismiss=async()=>{dlg.close();if(objectUrl)URL.revokeObjectURL(objectUrl);dlg.remove();try{await record('pending',null,true)}catch{}};
 dlg.addEventListener('click',async e=>{
  const action=e.target.closest('[data-share]')?.dataset.share;if(!action)return;
  if(action==='dismiss'){await dismiss();return;}
  if(action==='chat'){
   try{
    if(file){await record('pendingChat',{files:files.slice(0,4),at:Date.now()});}
    else sessionStorage.setItem('seyveo.sayvi.attachment-handoff.v1',JSON.stringify({type:'document',name:String(item.title||'Сообщение'),text:String(item.text||item.url||'').slice(0,2000),time:Date.now()}));
    await record('pending',null,true);
    location.assign('./sayvi-chat-new.html'+(file?'?seyveoSharedChat=1':'?attachmentHandoff=1'));
   }catch{status.textContent='Не удалось передать файл в чат. Попробуй снова.'}
   return;
  }
  if(action==='tasks'){
   const target=document.getElementById('personalTaskDialog');
   if(!target||!window.SEYVEO_TASK_ATTACHMENTS?.importFile){status.textContent='Редактор дел пока не загрузился. Повтори попытку.';return;}
   await dismiss();
   if(!target.open)target.showModal();
   window.SEYVEO_TASK_ATTACHMENTS.importFile(file);
  }
  if(action==='wallet'){
   const pay=document.getElementById('seyveoPayDialog');
   if(!pay||!window.SEYVEO_WALLET?.importReceipt){status.textContent='Кошелёк пока не загрузился. Повтори попытку.';return;}
   await dismiss();
   window.SEYVEO_WALLET.open();
   window.SEYVEO_WALLET.importReceipt(file);
  }
 });
 dlg.addEventListener('cancel',e=>{e.preventDefault();void dismiss()});
 dlg.showModal();
}
window.addEventListener('DOMContentLoaded',async()=>{
 if(failed){sheet({title:'Не удалось принять файл',text:'Попробуй отправить фотографию заново. Поддерживаются изображения, PDF и текст до 12 МБ.'});return;}
 try{const item=await record('pending');if(item&&Date.now()-item.at<24*60*60*1000)sheet(item);else sheet({title:'Файл не найден',text:'Возможно, браузер очистил временные данные. Отправь фотографию ещё раз.'});}
 catch{sheet({title:'Файл недоступен',text:'Проверь разрешения хранилища браузера.'});}
},{once:true});
})();
