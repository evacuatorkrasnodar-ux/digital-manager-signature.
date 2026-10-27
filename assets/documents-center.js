/* SEYVEO Document Center — local workspace, no network, no simulated AI.
   Session-only tools. The personal/business switch is organizational, not
   a cryptographic security boundary: encrypted native vault is future work. */
(()=>{
'use strict';
const MAX_FILE=20*1024*1024;
const extensions=new Set(['pdf','txt','md','png','jpg','jpeg','webp']);
const tabNames={personal:'Личное',business:'Бизнес'};
let area='personal',view='file',host=null,previewUrl=null,readerToken=0;
let files={personal:null,business:null};
let drafts={personal:{title:'',text:''},business:{title:'',text:''}};
const el=(tag,cls,text)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(text!==undefined)n.textContent=text;
 return n;
};
function control(label,callback,cls=''){
 const b=el('button','sv-doc-action'+(cls?' '+cls:''),label);
 b.type='button';b.addEventListener('click',callback);return b;
}
function resetPreview(){
 ++readerToken;
 if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
}
function reset(){
 resetPreview();
 files={personal:null,business:null};
 drafts={personal:{title:'',text:''},business:{title:'',text:''}};
 view='file';
}
function setArea(next){
 if(!tabNames[next])return false;
 area=next;view='file';
 if(host)draw();
 return true;
}
function note(text){
 return el('p','sv-doc-note',text);
}
function announce(node,text){
 node.textContent=text;
}
function downloadDraft(status){
 const draft=drafts[area];
 if(!draft.text.trim()){announce(status,'Сначала введите текст документа.');return;}
 const safeName=(draft.title.trim()||'Документ-SEYVEO').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').slice(0,80);
 const blob=new Blob([draft.text],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const a=el('a');a.href=url;a.download=safeName+'.txt';document.body.append(a);a.click();a.remove();
 // The generated URL belongs only to this download, not to the preview.
 setTimeout(()=>URL.revokeObjectURL(url),30000);
 announce(status,'Текстовый документ подготовлен для скачивания. В архиве SEYVEO копия не сохраняется.');
}
async function shareDraft(status){
 const draft=drafts[area];
 if(!draft.text.trim()){announce(status,'Сначала введите текст документа.');return;}
 if(typeof navigator.share!=='function'){announce(status,'Системная отправка недоступна в этом браузере. Используйте «Скачать TXT».');return;}
 try{
  const name=(draft.title.trim()||'Документ-SEYVEO').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').slice(0,80);
  const f=new File([draft.text],name+'.txt',{type:'text/plain;charset=utf-8'});
  if(navigator.canShare?.({files:[f]}))await navigator.share({title:name,files:[f]});
  else await navigator.share({title:name,text:draft.text});
  announce(status,'Передано в системное меню отправки. Доставку получателю проверяйте в выбранном приложении.');
 }catch(error){
  if(error?.name!=='AbortError')announce(status,'Не удалось открыть отправку. Можно скачать документ и передать вручную.');
 }
}
function renderFile(panel,status,preview,tools){
 const file=files[area];resetPreview();preview.replaceChildren();tools.replaceChildren();
 if(!file){announce(status,'Документ пока не выбран.');return;}
 const extension=String(file.name.split('.').pop()||'').toLowerCase();
 if(!extensions.has(extension)||file.size>MAX_FILE){
  announce(status,'Поддерживаются PDF, TXT, MD и изображения до 20 МБ.');return;
 }
 announce(status,'Открыт: '+file.name);
 previewUrl=URL.createObjectURL(file);
 const activeUrl=previewUrl;
 const original=el('a','sv-doc-file-link','Открыть оригинал');
 original.href=activeUrl;original.target='_blank';original.rel='noopener noreferrer';
 tools.append(original);
 if(['png','jpg','jpeg','webp'].includes(extension)){
  const img=el('img','sv-deep-file-image');img.src=activeUrl;img.alt='Просмотр выбранного документа';preview.append(img);
 }else if(extension==='pdf'){
  const pdf=el('iframe','sv-deep-file-frame');pdf.title='Просмотр выбранного PDF';pdf.src=activeUrl;preview.append(pdf);
  preview.append(note('Поиск внутри PDF будет доступен после подключения отдельного движка распознавания.'));
 }else{
  const token=readerToken;
  file.text().then(content=>{
   if(token!==readerToken||!preview.isConnected)return;
   const pre=el('pre','sv-deep-file-text',content.slice(0,120000));
   preview.replaceChildren(pre);
   if(content.length>120000)preview.append(note('Показано начало файла — первые 120 000 символов.'));
   const search=el('input','sv-doc-search');search.type='search';search.placeholder='Найти в тексте';search.setAttribute('aria-label','Поиск в открытом тексте');
   const result=note('');
   search.addEventListener('input',()=>{
    const q=search.value.trim().toLocaleLowerCase();
    if(!q){result.textContent='';return;}
    const source=content.toLocaleLowerCase();
    let count=0,position=0;
    while((position=source.indexOf(q,position))!==-1){count++;position+=Math.max(1,q.length);if(count>=9999)break;}
    result.textContent=count?'Совпадений: '+count:'Не найдено';
   });
   tools.append(search,result);
  }).catch(()=>announce(status,'Не удалось прочитать текст файла.'));
 }
}
function draw(){
 if(!host)return;
 resetPreview();host.replaceChildren();
 const head=el('div','sv-doc-heading');
 head.append(el('strong','','Одно пространство · два раздела'),
             el('small','','Документы не смешиваются при переключении'));
 host.append(head);
 const tabs=el('div','sv-doc-switch');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Пространство документов');
 for(const key of ['personal','business']){
  const b=control(tabNames[key],()=>setArea(key),'sv-doc-tab');
  b.setAttribute('aria-pressed',String(area===key));tabs.append(b);
 }
 host.append(tabs);
 const nav=el('div','sv-doc-commands');nav.setAttribute('role','group');nav.setAttribute('aria-label','Инструменты документов');
 for(const [kind,label] of [['file','Открыть файл'],['draft','Создать документ']]){
  const b=control(label,()=>{view=kind;draw();},'sv-doc-command');
  b.setAttribute('aria-pressed',String(view===kind));nav.append(b);
 }
 host.append(nav);
 const panel=el('section','sv-doc-workspace');
 const live=el('p','sv-doc-status');live.setAttribute('role','status');
 if(view==='file'){
  panel.append(el('h2','sv-doc-subtitle',area==='personal'?'Личные документы':'Документы бизнеса'));
  const select=el('input');select.type='file';select.hidden=true;
  select.accept='.pdf,.txt,.md,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,image/png,image/jpeg,image/webp';
  select.addEventListener('change',()=>{
   const file=select.files?.[0];
   if(!file)return;
   const extension=String(file.name.split('.').pop()||'').toLowerCase();
   if(!extensions.has(extension)||file.size>MAX_FILE){
    live.textContent='Поддерживаются PDF, TXT, MD и изображения до 20 МБ.';
    select.value='';return;
   }
   files[area]=file;draw();select.value='';
  });
  const browse=control(files[area]?'Выбрать другой файл':'Выбрать файл',()=>select.click(),'sv-doc-primary');
  panel.append(select,browse,live);
  const tools=el('div','sv-doc-file-actions'),preview=el('div','sv-doc-preview');
  panel.append(tools,preview);
  renderFile(panel,live,preview,tools);
 }else{
  panel.append(el('h2','sv-doc-subtitle','Новый документ'));
  const name=el('input','sv-doc-input');name.type='text';name.maxLength=90;
  name.placeholder='Название документа';name.setAttribute('aria-label','Название документа');
  name.value=drafts[area].title;
  name.addEventListener('input',()=>drafts[area].title=name.value);
  const editor=el('textarea','sv-doc-editor');editor.placeholder='Текст документа…';
  editor.setAttribute('aria-label','Содержание документа');editor.rows=8;
  editor.value=drafts[area].text;
  editor.addEventListener('input',()=>drafts[area].text=editor.value);
  const buttons=el('div','sv-doc-file-actions');
  buttons.append(control('Скачать TXT',()=>downloadDraft(live),'sv-doc-primary'));
  buttons.append(control('Поделиться',()=>shareDraft(live)));
  panel.append(name,editor,buttons,live);
  panel.append(note('Это ручной редактор черновиков. Сэйви пока не генерирует и не проверяет содержание.'));
 }
 host.append(panel);
 const archive=el('details','sv-doc-vault-shell');
 const summary=el('summary','sv-doc-vault-summary');
 summary.append(el('span','sv-doc-vault-title','Защищённый архив'),
                el('small','','Сохранение с шифрованием · по паролю'));
 const archiveContents=el('div','sv-doc-vault');
 archive.append(summary,archiveContents);
 archive.addEventListener('toggle',()=>{
  if(!archive.open)return;
  window.SEYVEO_DOCUMENT_VAULT_UI?.mount?.(archiveContents,{
   area,
   currentArea:()=>area,
   selectedFile:()=>files[area],
   draft:()=>({...drafts[area]}),
   openFile(file,target){
    if(!tabNames[target])return;
    area=target;files[target]=file;view='file';draw();
   },
   clearSession(){reset();draw();}
  });
 });
 host.append(archive);
 host.append(note('Документы и черновики в редакторе остаются только до выхода из раздела. Для хранения откройте «Защищённый архив». В прототипе нет облачной резервной копии.'));
}
function mount(parent){
 reset();
 host=el('div','sv-doc-center');parent.append(host);draw();return true;
}
function destroy(){
 window.SEYVEO_DOCUMENT_VAULT?.lock?.();
 reset();host=null;
}
window.SEYVEO_DOCUMENT_CENTER=Object.freeze({mount,destroy,setArea});
})();
