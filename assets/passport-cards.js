/* SEYVEO · Passports. Original new module; old project consulted for ideas only.
   Local records; no verification with FNS, no connected account or server. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const brand=$('seyveoBrandPassport'),company=$('seyveoCompanyPassport');
const previewBox=$('homePassportPopover'),brandTrigger=$('homeBrandTrigger'),ownerTrigger=$('homeWorldTrigger');
const form=$('seyveoCompanyForm'),dialog=$('seyveoCompanyDialog'),studio=$('seyveoStudioDialog');
if(!brand||!company||!form||!dialog||!studio)return;
const KEY='seyveo-company-passport-v1';
const LABELS={npd:'Самозанятый',ip:'Индивидуальный предприниматель',org:'Организация'};
const PROPS=[
 ['name','Название для клиентов'],['legalName','Полное имя / юридическое наименование'],
 ['owner','Руководитель / представитель'],['industry','Сфера деятельности'],['city','Город'],
 ['inn','ИНН'],['kpp','КПП'],['ogrn','ОГРН'],['ogrnip','ОГРНИП'],
 ['address','Адрес'],['phone','Телефон'],['email','Электронная почта'],['website','Сайт'],
 ['bank','Банк'],['account','Расчётный счёт'],['bik','БИК'],['corr','Корреспондентский счёт']
];
const LENGTH={name:80,legalName:160,owner:100,industry:80,city:70,inn:12,kpp:9,ogrn:13,ogrnip:15,address:200,phone:50,email:120,website:180,bank:120,account:20,bik:9,corr:20};
function load(){
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
  const result={type:LABELS[raw.type]?raw.type:'npd'};
  for(const [key] of PROPS)result[key]=typeof raw[key]==='string'?raw[key].slice(0,LENGTH[key]):'';
  return result;
 }catch{return {}}
}
function store(card){try{localStorage.setItem(KEY,JSON.stringify(card));return true}catch{return false}}
const clean=value=>String(value||'').trim();
function status(dialogEl,message){const s=dialogEl.querySelector('[data-passport-status]');if(s)s.textContent=message}
function fillPreview(){
 const record=load(),saved=!!clean(record.name);
 // A developer-only sample; real company records remain completely untouched.
 let profilePerson='';
 try{
  const profile=JSON.parse(localStorage.getItem('seyveo-first-acquaintance-v1')||'null');
  if(typeof profile?.name==='string'&&clean(profile.name))profilePerson=clean(profile.name).slice(0,60);
 }catch{}
 // A company's legal name is never a substitute for the human owner's name.
 // Demo may show Roman, but filled user records must not inherit sample identities.
 const owner=saved?(clean(record.owner)||profilePerson||(record.type!=='org'?clean(record.legalName):'')||'Владелец'):(profilePerson||'Владелец');
 $('seyveoCompanyPreviewName').textContent='Мой бизнес';
 $('seyveoCompanyPreviewDesc').textContent=saved?(LABELS[record.type]||'Карточка компании'):'Карточка компании';
 $('seyveoCompanyPreviewOwner').textContent=saved?record.name:'Данные не заполнены';
 const preview=$('seyveoCompanyPreviewSubscription');
 if(preview)preview.textContent='Контакты и реквизиты';
 $('seyveoCompanySample').hidden=true;
 const logo=$('seyveoCompanyInitial');
 if(logo)logo.textContent=window.SEYVEO_AVATAR_LETTER?.(saved?record.name:'SEYVEO')||'S';
}
function selectedRows(card){
 const allowed=card.type==='org'?['name','legalName','owner','industry','city','inn','kpp','ogrn','address','phone','email','website','bank','account','bik','corr']:
 card.type==='ip'?['name','legalName','industry','city','inn','ogrnip','address','phone','email','website','bank','account','bik','corr']:
 ['name','legalName','industry','city','inn','address','phone','email','website','bank','account','bik','corr'];
 return [['Статус',LABELS[card.type]||'Не указан'],...PROPS.filter(([key])=>allowed.includes(key)&&clean(card[key])).map(([key,label])=>[label,clean(card[key])])];
}
function drawRows(){
 const rows=$('seyveoCompanyRows');rows.replaceChildren();
 const card=load(),entries=selectedRows(card);
 for(const [label,value] of entries){
  const row=document.createElement('div');row.className='seyveo-passport-row';
  const k=document.createElement('span');k.textContent=label;
  const v=document.createElement('strong');v.textContent=value;
  row.append(k,v);rows.append(row);
 }
 const saved=!!clean(card.name);
 $('seyveoCompanyNotFilled').hidden=saved;
 $('seyveoCompanyEditTop').querySelector('span').textContent=saved?'Изменить сведения':'Добавить сведения';
 $('seyveoCompanyEditTop').setAttribute('aria-label',saved?'Изменить сведения компании':'Добавить сведения компании');
 // The reader always shows the three operations so QR never feels lost.
 // Disabled actions explain that they need saved business details.
 const qrReady=canCreateCompanyQr(card);
 dialog.querySelector('.sv-company-actions').hidden=false;
 $('seyveoCompanyShare').disabled=!saved;
 $('seyveoCompanyPrint').disabled=!saved;
 $('seyveoCompanyQrOpen').disabled=!qrReady;
 $('seyveoCompanyQrHint').hidden=qrReady;
}
function canCreateCompanyQr(card){
 if(!clean(card.name))return false;
 if(clean(card.phone)||clean(card.email))return true;
 try{
  const url=new URL(clean(card.website));
  return url.protocol==='http:'||url.protocol==='https:';
 }catch{return false}
}
function toggleType(){
 const type=$('seyveoCompanyType').value;
 form.querySelectorAll('[data-passport-type]').forEach(w=>{
   const visible=w.dataset.passportType.split(' ').includes(type);
   w.hidden=!visible;
   for(const inp of w.querySelectorAll('input'))inp.disabled=!visible;
 });
}
const privateForm=$('seyveoCompanyPrivateForm');
const privateAbout=$('seyveoCompanyPrivateAbout');
const privateGoal=$('seyveoCompanyPrivateGoal');
const privateStatus=$('seyveoCompanyPrivateStatus');
let privateSnapshot='';
function privateSignature(){return JSON.stringify([privateAbout?.value||'',privateGoal?.value||''])}
function restorePrivateContext(){
 const data=window.SEYVEO_BUSINESS_MAP?.getState?.()||{};
 if(privateAbout)privateAbout.value=data.description||'';
 if(privateGoal)privateGoal.value=data.goal||'';
 if(privateStatus)privateStatus.textContent='';
 privateSnapshot=privateSignature();
 const panel=$('seyveoCompanyPrivate');if(panel)panel.open=false;
}
function privateDirty(){return privateSignature()!==privateSnapshot}
privateForm?.addEventListener('submit',event=>{
 event.preventDefault();
 const saved=window.SEYVEO_BUSINESS_MAP?.savePrivateBusinessContext?.(privateAbout.value,privateGoal.value);
 privateStatus.textContent=saved?.message||'Не удалось сохранить сведения.';
 if(saved?.ok)privateSnapshot=privateSignature();
});
let companyFormSnapshot='';
const companyView=$('seyveoCompanyView'),companyEditor=$('seyveoCompanyEditor');
const companyDone=dialog.querySelector('button.seyveo-dialog-close');
function companyEditing(){return dialog.dataset.svCompanyMode==='edit'}
function setCompanyMode(mode){
 const editing=mode==='edit';
 dialog.dataset.svCompanyMode=editing?'edit':'view';
 companyView.hidden=editing;
 companyEditor.hidden=!editing;
 if(companyDone){
  companyDone.textContent=editing?'Отмена':'Готово';
  companyDone.setAttribute('aria-label',editing?'Отменить редактирование и вернуться к карточке':'Готово — закрыть карточку компании');
 }
}
function restoreCompanyForm(){
 const record=load();
 for(const [key] of PROPS){const input=form.elements.namedItem(key);if(input)input.value=record[key]||''}
 $('seyveoCompanyType').value=record.type||'npd';
 const chosen=form.querySelector('input[name="companyTypeChoice"][value="'+$('seyveoCompanyType').value+'"]');
 if(chosen)chosen.checked=true;
 toggleType();
 companyFormSnapshot=companyFormSignature();
}
function discardCompanyEditing(){
 if(hasUnsavedCompanyChanges()&&!window.confirm('Есть несохранённые реквизиты. Отменить изменения?'))return false;
 restoreCompanyForm();
 restorePrivateContext();
 status(dialog,'');
 setCompanyMode('view');
 dialog.scrollTop=0;
 return true;
}
function companyFormSignature(){
 const values={type:$('seyveoCompanyType').value};
 for(const [key] of PROPS){
  const field=form.elements.namedItem(key);
  values[key]=field&&!field.disabled?String(field.value):'';
 }
 return JSON.stringify(values);
}
function hasUnsavedCompanyChanges(){
 return dialog.open&&(companyFormSignature()!==companyFormSnapshot||privateDirty());
}
function confirmCompanyExit(event){
 if(event.type==='cancel'&&companyEditing()){
  event.preventDefault();
  discardCompanyEditing();
  return;
 }
 if(!hasUnsavedCompanyChanges())return;
 if(window.confirm('Есть несохранённые реквизиты. Закрыть карточку без сохранения?'))return;
 event.preventDefault();
 event.stopPropagation();
 event.stopImmediatePropagation();
}
function openCompany(){
 restoreCompanyForm();
 restorePrivateContext();
 drawRows();status(dialog,'');
 setCompanyMode('view');
 if(!dialog.open)dialog.showModal();
 // Modal scroll positions survive reopens on Safari. Always show the title,
 // summary and Done first; focusing the exit must not jump the form.
 dialog.scrollTop=0;
 requestAnimationFrame(()=>{
  if(!dialog.open)return;
  dialog.scrollTop=0;
  dialog.querySelector('button.sv-nav-done,button.seyveo-dialog-close')
   ?.focus({preventScroll:true});
 });
}
function openStudio(){
 status(studio,'');
 if(!studio.open)studio.showModal();
}
function validate(card){
 if(!card.name)return 'Укажите название компании.';
 const digits=['inn','kpp','ogrn','ogrnip','account','bik','corr'];
 for(const key of digits)if(card[key]&&!/^\d+$/.test(card[key]))return 'В поле «'+(PROPS.find(([k])=>k===key)||['',key])[1]+'» допустимы только цифры.';
 if(card.inn&&card.inn.length!==(card.type==='org'?10:12))return 'ИНН: для организации 10 цифр, для ИП и самозанятого 12.';
 const lengths={kpp:9,ogrn:13,ogrnip:15,account:20,bik:9,corr:20};
 for(const key in lengths)if(card[key]&&card[key].length!==lengths[key])return 'Проверьте длину поля «'+PROPS.find(([k])=>k===key)[1]+'».';
 return '';
}
function save(event){
 event.preventDefault();
 const type=$('seyveoCompanyType').value;
 const card={type:LABELS[type]?type:'npd'};
 for(const [key] of PROPS){
  const input=form.elements.namedItem(key);
  card[key]=input&&!input.disabled?clean(input.value).slice(0,LENGTH[key]):'';
 }
 const error=validate(card);
 if(error){status(dialog,error);return}
 if(!store(card)){status(dialog,'Не удалось сохранить на устройстве. Проверьте память браузера.');return}
 fillPreview();drawRows();status(dialog,'Данные сохранены на этом устройстве. Проверьте их перед отправкой.');
 companyFormSnapshot=companyFormSignature();
 setCompanyMode('view');
 dialog.scrollTop=0;
 window.dispatchEvent(new CustomEvent('seyveo:company-changed'));
}
function plain(kind){
 if(kind==='studio')return [
  'ПАСПОРТ ПРОДУКТА · SEYVEO',
  'Студия: SEYVEO — технологическая студия искусственного интеллекта и автоматизации',
  'Продукт: Цифровой управляющий',
  'Фирменная подпись: SEYVEO · IT · AI · AUTOMATION',
  'Сборка: предварительная версия без подключённых внешних сервисов',
  'Подписка: пока не подключена',
  'Подключённый ИИ и внешние сервисы: отсутствуют',
  'Сведения о продукте представлены в приложении'
 ].join('\n');
 const card=load();
 return ['КАРТОЧКА КОМПАНИИ',...selectedRows(card).map(([k,v])=>k+': '+v),
  'Сведения внесены владельцем и не проверены по государственным реестрам.'].join('\n');
}
async function share(kind){
 if(kind==='company'&&!load().name){status(dialog,'Сначала сохраните данные компании.');return}
 const title=kind==='studio'?'Паспорт SEYVEO':'Карточка компании',message=plain(kind);
 const active=kind==='studio'?studio:dialog;
 if(typeof navigator.share==='function'){
  try{await navigator.share({title,text:message});status(active,'Данные переданы в меню отправки.');return}
  catch(e){if(e&&e.name==='AbortError'){status(active,'Отправка отменена.');return}}
 }
 try{
  if(navigator.clipboard&&navigator.clipboard.writeText){
   await navigator.clipboard.writeText(message);status(active,'Текст скопирован. Можете вставить его в сообщение.');return
  }
 }catch{}
 const area=document.createElement('textarea');area.value=message;area.readOnly=true;
 area.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(area);area.select();
 let copied=false;try{copied=document.execCommand('copy')}catch{}
 area.remove();status(active,copied?'Текст скопирован. Можете вставить его в сообщение.':'Не удалось скопировать. Попробуйте ещё раз.');
}
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function print(kind){
 const active=kind==='studio'?studio:dialog;
 if(kind==='company'&&!load().name){status(active,'Сначала сохраните данные компании.');return}
 const lines=plain(kind).split('\n').map(x=>'<p>'+escapeHtml(x)+'</p>').join('');
 const win=window.open('','_blank');
 if(!win){status(active,'Браузер заблокировал новое окно. Разрешите всплывающие окна для печати.');return}
 const title=kind==='studio'?'Паспорт SEYVEO':'Карточка компании';
 win.document.open();
 win.document.write('<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHtml(title)+'</title><style>body{font:15px/1.6 -apple-system,system-ui,sans-serif;color:#172033;max-width:720px;margin:30px auto;padding:0 22px}h1{font-size:25px}main{border:1px solid #c8d0da;border-radius:18px;padding:22px}p{margin:0 0 9px;overflow-wrap:anywhere}button{border:1px solid #adb7c8;border-radius:12px;padding:10px 20px;margin-bottom:16px;background:#fff;color:#172033}@media print{button{display:none}body{margin:0;padding:0}main{border:0;padding:0}}</style></head><body><button onclick="window.print()">Распечатать</button><main><h1>'+escapeHtml(title)+'</h1>'+lines+'</main></body></html>');
 win.document.close();
 try{win.focus();win.print()}catch{}
 status(active,'Открыта версия для печати. Если окно печати не появилось, нажмите «Распечатать» в новой вкладке.');
}
/* The logo keeps the studio passport preview. Company details now open
   directly from the business overview, without another Home header button. */
function closeHeaderPassport(){
 if(!previewBox)return;
 previewBox.hidden=true;
 brand.hidden=true;company.hidden=true;
 const companyShell=$('seyveoCompanyPreviewShell');if(companyShell)companyShell.hidden=true;
 brandTrigger?.setAttribute('aria-expanded','false');
 ownerTrigger?.setAttribute('aria-expanded','false');
}
function toggleHeaderPassport(){
 if(!previewBox)return;
 const wasOpen=!previewBox.hidden&&!brand.hidden;
 closeHeaderPassport();
 if(wasOpen)return;
 window.SEYVEO_CLOSE_WORLD_MENU?.();
 previewBox.dataset.side='studio';
 previewBox.hidden=false;brand.hidden=false;
 brandTrigger?.setAttribute('aria-expanded','true');
}
function toggleOwnerPassport(){
 if(!previewBox)return;
 const wasOpen=!previewBox.hidden&&!company.hidden;
 closeHeaderPassport();
 if(wasOpen)return;
 window.SEYVEO_CLOSE_WORLD_MENU?.();
 fillPreview();
 previewBox.dataset.side='company';
 previewBox.hidden=false;company.hidden=false;
 const companyShell=$('seyveoCompanyPreviewShell');if(companyShell)companyShell.hidden=false;
 ownerTrigger?.setAttribute('aria-expanded','true');
}
brandTrigger?.addEventListener('click',toggleHeaderPassport);
ownerTrigger?.addEventListener('click',toggleOwnerPassport);
document.addEventListener('pointerdown',event=>{
 if(previewBox?.hidden)return;
 if(previewBox.contains(event.target)||brandTrigger?.contains(event.target)||ownerTrigger?.contains(event.target))return;
 closeHeaderPassport();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!previewBox?.hidden&&!studio.open&&!dialog.open){closeHeaderPassport();}
});
window.addEventListener('hashchange',closeHeaderPassport);
$('seyveoCompanyEditTop')?.addEventListener('click',()=>{
 if(privateDirty()){
  if(!window.confirm('Есть несохранённые сведения для Сэйви. Отменить их и перейти к реквизитам?'))return;
  restorePrivateContext();
 }
 setCompanyMode('edit');
 status(dialog,'');
 dialog.scrollTop=0;
 requestAnimationFrame(()=>{
  if(!dialog.open||!companyEditing())return;
  dialog.scrollTop=0;
  const field=form.elements.namedItem('name');
  field?.focus?.({preventScroll:true});
 });
});
brand.addEventListener('click',openStudio);
company.addEventListener('click',openCompany);
// Two Home shortcuts are retired visually. Their complete real dialogs
// remain available from Management, including company QR inside the dialog.
$('openStudioPassportFromManage')?.addEventListener('click',openStudio);
$('openCompanyPassportFromManage')?.addEventListener('click',openCompany);
window.SEYVEO_COMPANY_PASSPORT=Object.freeze({open:openCompany});
form.addEventListener('submit',save);
form.querySelectorAll('input[name="companyTypeChoice"]').forEach(input=>input.addEventListener('change',()=>{
 $('seyveoCompanyType').value=input.value;toggleType();
}));
$('seyveoStudioClose').addEventListener('click',()=>studio.close());
$('seyveoCompanyClose').addEventListener('click',()=>dialog.close());
dialog.addEventListener('cancel',confirmCompanyExit);
dialog.addEventListener('click',event=>{
 // Cancel editing inside the same sheet; never discard a draft silently.
 const button=event.target.closest?.('button.seyveo-dialog-close');
 if(companyEditing()&&(button||event.target===dialog)){
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  discardCompanyEditing();
  return;
 }
 if(button||event.target===dialog)confirmCompanyExit(event);
},true);
/* Company contact links follow interface language, not demo company data. */
const studioSite=()=>String(document.documentElement.lang||navigator.language||'ru').toLowerCase().startsWith('ru')?'https://seyveo.ru/':'https://seyveo.com/';
function updateStudioLinks(){
 const url=studioSite(),link=$('seyveoStudioWebsite');
 if(link){link.href=url;link.textContent=new URL(url).hostname+' ↗'}
 const note=$('seyveoStudioSiteNote');
 if(note)note.textContent=url.includes('.ru')?'Русский сайт seyveo.ru ещё может быть недоступен до публикации.':'Международный сайт seyveo.com.';
}
updateStudioLinks();
studio.querySelectorAll('[data-studio-mail]').forEach(link=>{
 const topics={idea:'Идея для SEYVEO',bug:'Ошибка в SEYVEO',other:'Письмо разработчикам SEYVEO'};
 const title=topics[link.dataset.studioMail]||topics.other;
 link.href='mailto:hello@seyveo.com?subject='+encodeURIComponent(title);
});
async function shareStudioLink(kind){
 const url=kind==='app'?'https://evacuatorkrasnodar-ux.github.io/digital-manager-signature./':studioSite();
 const title=kind==='app'?'SEYVEO — Цифровой управляющий':'SEYVEO — сайт студии';
 if(navigator.share){
  try{await navigator.share({title,url});status(studio,'Ссылка передана в меню отправки.');return}
  catch(e){if(e?.name==='AbortError')return}
 }
 try{await navigator.clipboard.writeText(url);status(studio,'Ссылка скопирована.')}catch{status(studio,'Ссылка: '+url)}
}
$('seyveoStudioShareSite')?.addEventListener('click',()=>shareStudioLink('site'));
$('seyveoStudioShareApp')?.addEventListener('click',()=>shareStudioLink('app'));
$('seyveoCompanyShare').addEventListener('click',()=>share('company'));
$('seyveoCompanyPrint').addEventListener('click',()=>print('company'));
for(const d of [studio,dialog])d.addEventListener('click',e=>{if(e.target===d)d.close()});
window.addEventListener('storage',e=>{
 if([KEY,'seyveo-first-acquaintance-v1'].includes(e.key))fillPreview();
});
window.addEventListener('seyveo:profile-changed',fillPreview);
window.addEventListener('seyveo:avatar-letter-ready',fillPreview);
function updateSubscriptionBadge(){
 const status='Подписка не подключена';
 const home=$('seyveoBrandSubscriptionStatus'),detail=$('seyveoStudioSubscriptionStatus');
 if(home)home.textContent=status;
 if(detail)detail.textContent=status;
}
window.addEventListener('seyveo:account-preview-changed',updateSubscriptionBadge);
updateSubscriptionBadge();

fillPreview();
})();

/* SEYVEO Black Velvet · Signature Portrait.
   Only one local avatar value, with graceful migration from former presets. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const picker=$('seyveoAvatarDialog'),gallery=$('seyveoAvatarGallery'),file=$('seyveoAvatarFile');
const status=$('seyveoAvatarStatus'),entry=$('seyveoCompanyAvatarEdit');
if(!picker||!gallery||!file||!entry)return;
const KEY='seyveo-owner-avatar-v1';
const OPTIONS=[
 ['monogram','Буква','Первая буква имени'],
 ['silhouette','Силуэт','Нейтральный образ без фото']
];
const valid=new Set(OPTIONS.map(item=>item[0]));
const renamed={onyx:'silhouette',silver:'silhouette',orbit:'silhouette',prism:'silhouette',line:'silhouette',velvet:'silhouette'};
/* One alphabetic character for every person or business, including Cyrillic.
   Displayed identity is the source of truth; never use two-letter initials. */
function initial(name){
 const match=String(name||'').trim().match(/\p{L}/u);
 return match?match[0].toLocaleUpperCase('ru-RU'):'•';
}
window.SEYVEO_AVATAR_LETTER=initial;
window.dispatchEvent(new Event('seyveo:avatar-letter-ready'));

function getInitials(){
 let name=$('seyveoCompanyPreviewName')?.textContent?.trim();
 if(!name) {
  try{
   const profile=JSON.parse(localStorage.getItem('seyveo-first-acquaintance-v1')||'null');
   name=profile?.name;
  }catch{}
 }
 return initial(name||'Роман');
}
function read(){
 try{
  const obj=JSON.parse(localStorage.getItem(KEY)||'null');
  if(obj?.kind==='preset'){
   const id=renamed[obj.id]||obj.id;
   if(valid.has(id))return {kind:'preset',id};
  }
  if(obj?.kind==='photo'&&typeof obj.data==='string'&&obj.data.length<320000
     &&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(obj.data))return obj;
 }catch{}
 return {kind:'preset',id:'monogram'};
}
let choice=read();
function paintAvatar(node,data){
 if(!node)return;
 node.className='seyveo-avatar seyveo-avatar--'+(data.kind==='photo'?'photo':data.id)
   +(node.id==='seyveoOwnerAvatarPreview'?' seyveo-owner-avatar':'');
 node.replaceChildren();
 if(data.kind==='photo'){
  const img=document.createElement('img');img.alt='';img.src=data.data;node.append(img);
 }else if(data.id==='monogram'){
  const mark=document.createElement('span');mark.className='seyveo-avatar-initials';
  mark.textContent=getInitials();node.append(mark);
 }
}
function paint(){
 // The company emblem in the Home header is a permanent brand image.
  // Personal portrait choices stay local to the owner preview and dialog.
  for(const id of ['seyveoOwnerAvatarPreview','seyveoAvatarHero']){
  paintAvatar($(id),choice);
 }
 const selected=choice.kind==='photo'?['Фото','Ваше изображение']:
   (OPTIONS.find(([id])=>id===choice.id)||OPTIONS[0]).slice(1);
 const title=$('seyveoAvatarHeroName'),sub=$('seyveoAvatarHeroHint');
 if(title)title.textContent=selected[0];
 if(sub)sub.textContent=selected[1];
 for(const b of gallery.querySelectorAll('button[data-avatar]')){
  b.setAttribute('aria-pressed',String(choice.kind==='preset'&&choice.id===b.dataset.avatar));
 }
}
function save(next){
 try{localStorage.setItem(KEY,JSON.stringify(next))}
 catch{status.textContent='Не удалось сохранить на устройстве. Проверьте свободное место.';return false}
 choice=next;paint();window.dispatchEvent(new Event('seyveo:avatar-changed'));return true;
}
for(const [id,name] of OPTIONS){
 const b=document.createElement('button');b.type='button';
 b.className='seyveo-avatar-choice';b.dataset.avatar=id;
 b.setAttribute('aria-label','Выбрать образ: '+name);
 const icon=document.createElement('span');paintAvatar(icon,{kind:'preset',id});
 const caption=document.createElement('small');caption.textContent=name;
 b.append(icon,caption);gallery.append(b);
}
gallery.addEventListener('click',event=>{
 const b=event.target.closest('button[data-avatar]');
 if(!b||!valid.has(b.dataset.avatar))return;
 if(save({kind:'preset',id:b.dataset.avatar})){
  status.textContent='Образ выбран и сохранён на этом устройстве.';
 }
});
entry.addEventListener('click',()=>{status.textContent='';paint();picker.showModal()});
$('seyveoAvatarPickPhoto')?.addEventListener('click',()=>file.click());
$('seyveoAvatarClose')?.addEventListener('click',()=>picker.close());
$('seyveoAvatarReset')?.addEventListener('click',()=>{
 if(save({kind:'preset',id:'monogram'})){
  status.textContent='Показаны инициалы без фотографии.';
 }
});
file.addEventListener('change',()=>{
 const imageFile=file.files?.[0];file.value='';
 if(!imageFile)return;
 if(!['image/jpeg','image/png','image/webp'].includes(imageFile.type)||imageFile.size>6*1024*1024){
  status.textContent='Выберите JPG, PNG или WebP размером до 6 МБ.';return;
 }
 const reader=new FileReader();
 reader.onerror=()=>{status.textContent='Не удалось прочитать фотографию.'};
 reader.onload=()=>{
  const img=new Image();
  img.onerror=()=>{status.textContent='Файл не удалось открыть как изображение.'};
  img.onload=()=>{
   try{
    const side=Math.min(img.naturalWidth,img.naturalHeight);
    if(!side)throw Error('empty photo');
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw Error('canvas unavailable');
    ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,256,256);
    const data=canvas.toDataURL('image/jpeg',.78);
    if(data.length>320000)throw Error('photo too large');
    if(save({kind:'photo',data})){
     status.textContent='Фотография сохранена только на этом устройстве.';
    }
   }catch{status.textContent='Не удалось подготовить фотографию. Попробуйте другую.'}
  };
  img.src=String(reader.result||'');
 };
 reader.readAsDataURL(imageFile);
});
window.addEventListener('seyveo:profile-changed',paint);
window.addEventListener('seyveo:company-changed',paint);
window.addEventListener('storage',event=>{
 if(event.key===KEY)choice=read();
 if([KEY,'seyveo-company-passport-v1','seyveo-first-acquaintance-v1'].includes(event.key))paint();
});
paint();
})();
