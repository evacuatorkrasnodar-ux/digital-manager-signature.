/* SEYVEO · Chats: compact inbox actions, contacts and local preferences.
   Additive UI over the existing work-chat engine. No simulated delivery. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const screen=$('svcpWorkChatScreen'),list=$('svcpConversationList'),header=screen?.querySelector('.svcp-work-chat-header');
const history=$('svcpWorkHistoryTop');
if(!screen||!list||!header||!history)return;
const KEY='seyveo-workchat-inbox-layout-v1';
const defaults={compact:true,previews:true,showUnread:true,soundEnabled:true,rooms:{}};
let prefs;
try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');prefs={...defaults,...(raw&&typeof raw==='object'?raw:{}),rooms:(raw&&typeof raw.rooms==='object'&&!Array.isArray(raw.rooms)?raw.rooms:{})}}catch{prefs={...defaults}}
// iMessage-like single-line preview and compact rows are the fixed SEYVEO default.
// Override stale persisted switches left by older versions of the app.
prefs.compact=true;
prefs.previews=true;
let sheetType='',activeRoom='',holdTimer=null,swipeOpen=null,processing=false;
const sheetStack=[];
const icons={
 dots:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
 search:'<circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 4.2 4.2"/>',
 pen:'<path d="M12 5.5H5.5A2.5 2.5 0 0 0 3 8v10.5A2.5 2.5 0 0 0 5.5 21h11A2.5 2.5 0 0 0 19 18.5V12M13 9l7-7 2 2-7 7-4 1z"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M17 5.8a3 3 0 0 1 0 5.5M17 14a4.5 4.5 0 0 1 3.5 4.5V20"/>',
 groupAdd:'<circle cx="8" cy="8" r="3"/><path d="M2.5 20v-1.5a5.5 5.5 0 0 1 11 0V20M17 5.5v7M13.5 9h7"/>',
 portrait:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="9" r="2.5"/><path d="M6.5 18c.8-2.7 2.7-4 5.5-4s4.7 1.3 5.5 4"/>',
 group:'<circle cx="8" cy="8" r="3"/><circle cx="18" cy="9" r="2.2"/><path d="M2 20v-2a6 6 0 0 1 12 0v2M15.5 16a4 4 0 0 1 6.5 3v1"/>',
 sliders:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="var(--sv-inbox-panel-bg,#fff)"/><circle cx="16" cy="12" r="2" fill="var(--sv-inbox-panel-bg,#fff)"/><circle cx="10" cy="18" r="2" fill="var(--sv-inbox-panel-bg,#fff)"/>',
 archive:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8M9 13h6"/>',
 clock:'<path d="M4 11.5a8 8 0 1 1 2.2 6M4 6.5v5h5M12 7.5V12l3 2"/>',
 pin:'<path d="m8 4 8 8M13 3l8 8-3 2-3-2-4 4-2 5-2-2 5-2 4-4-2-3-2 3-2-3z"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 trash:'<path d="M4 6h16M9 6V4h6v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
 messages:'<path d="M20 11.6c0 4.3-3.6 7.3-8.2 7.3a10.5 10.5 0 0 1-3.2-.5L4 20l1.3-3.7A7.3 7.3 0 0 1 4 11.6C4 7.4 7.5 4 12 4s8 3.4 8 7.6Z"/><path d="M8.5 11.4h7"/>',
 file:'<path d="M13 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V9l-6-6Z"/><path d="M13 3v6h6M8.5 13h7M8.5 16.5h7"/>',
 back:'<path d="m15 5-7 7 7 7"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>'
};
function svg(name){return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+(icons[name]||icons.dots)+'</svg>'}
function node(tag,className,textValue){const e=document.createElement(tag);if(className)e.className=className;if(textValue!==undefined)e.textContent=textValue;return e}
function button(label,icon,fn,className){const b=node('button',className||'sv-inbox-action');b.type='button';if(icon)b.innerHTML=svg(icon);b.append(node('span',null,label));b.addEventListener('click',fn);return b}
function allRooms(){return window.SEYVEO_BUSINESS_COMMAND?.listRooms?.()||[]}
function roomInfo(id){return allRooms().find(r=>r.id===id)}
function roomState(id){return prefs.rooms[id]||{}}
function savePrefs(){try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch{/* no persistence in private mode */}}
/* Installed PWA badge · count locally marked unread CONVERSATIONS, not remote
   messages. Incoming message tracking and background delivery need auth + server.
   No invented counts, no permission prompts, and no separate app icons. */
function syncLocalChatBadge(){
 const installed=window.matchMedia?.('(display-mode: standalone)')?.matches===true||
  navigator.standalone===true;
 if(!installed)return;
 const rooms=allRooms();
 const count=rooms.reduce((total,room)=>total+(roomState(room.id).unread===true?1:0),0);
 // The browser/OS decides whether and where badges are displayed.
 try{
  if(count>0&&typeof navigator.setAppBadge==='function'){
   Promise.resolve(navigator.setAppBadge(count)).catch(()=>{});
  }else if(count===0&&typeof navigator.clearAppBadge==='function'){
   Promise.resolve(navigator.clearAppBadge()).catch(()=>{});
  }
 }catch{/* Unsupported or permission-restricted browser: no artificial badge. */}
}
function updateRoom(id,prop,value){
 prefs.rooms[id]={...roomState(id),[prop]:value};savePrefs();decorateRows();syncProfile();
 if(prop==='unread')syncLocalChatBadge();
}
/* Local avatar editing: Apple-style photo, monogram and emoji.
   The default is a flat initial; profile owners may explicitly choose artwork. */
const AVATAR_COLORS=['#E9EFF5','#E9F2EF','#EEEAF4','#F3EDE6','#E8F1F4','#F1EBF0'];
function automaticAvatarColor(name){
 const value=String(name||'').trim().toLocaleLowerCase('ru-RU');
 let hash=0;
 for(const letter of value)hash=(hash*31+letter.codePointAt(0))>>>0;
 return AVATAR_COLORS[hash%AVATAR_COLORS.length];
}
// Original avatar IDs are stable; the restored collection is additive.
const AVATAR_3D=[
 ['Космонавт','Космос'],['Супергерой','Герои'],['Путешественница','Космос'],['Робот','Космос'],
 ['Лисёнок','Мультики'],['Девочка','Мультики'],['Виноград','Фрукты'],['Клубника','Фрукты'],
 ['Персик','Фрукты'],['Яблоко','Фрукты'],['В очках','Мультики'],['Сердечки','Мультики']
];
AVATAR_3D.push(...(window.SEYVEO_AVATAR_ART?.catalog||[]),...(window.SEYVEO_SAYVI_HOLIDAY?.catalog||[]));
/* Saved avatar IDs remain stable across collection upgrades. */
const OWNER_AVATAR_KEY='seyveo-owner-avatar-v1',STAFF_AVATAR_KEY='seyveo-self-identity-avatar-v1';
function atlasMark(index){
 const m=node('span','sv-atlas-thumb');
 if(!window.SEYVEO_SAYVI_HOLIDAY?.paint(m,index)&&!window.SEYVEO_AVATAR_ART?.paint(m,index))m.style.backgroundPosition=`${(index%4)*100/3}% ${Math.floor(index/4)*50}%`;
 m.setAttribute('aria-hidden','true');
 return m;
}
function readActualSelfAvatar(){
 try{
  const isStaff=window.SEYVEO_PREVIEW?.isEmployee?.()===true;
  const record=JSON.parse(localStorage.getItem(isStaff?STAFF_AVATAR_KEY:OWNER_AVATAR_KEY)||'null');
  const item=isStaff?record?.elena:record;
  if(item?.kind==='photo'&&typeof item.data==='string'&&item.data.length<320000&&
   /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(item.data))
   return {kind:'photo',image:item.data};
  if(item?.kind==='atlas'&&item.customChosen===true&&Number.isInteger(item.index)&&item.index>=0&&item.index<AVATAR_3D.length)
   return {kind:'atlas',index:item.index};
  if(item?.kind==='preset'&&item.customChosen===true&&/^3d-\d{1,2}$/.test(item.id||'')){
   const index=Number(item.id.slice(3));
   if(index<AVATAR_3D.length)return {kind:'atlas',index};
  }
 }catch{}
 return {kind:'monogram',color:AVATAR_COLORS[0],initials:window.SEYVEO_PREVIEW?.isEmployee?.()===true?'Е':'Я'};
}
function safeAvatar(spec){
 if(!spec||typeof spec!=='object')return null;
 const image=typeof spec.image==='string'&&
  /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(spec.image)&&spec.image.length<320000
  ?spec.image:'';
 const initials=[...String(spec.initials||'Я')].slice(0,2).join('').toLocaleUpperCase('ru-RU');
 const atlasValid=spec.kind==='atlas'&&Number.isInteger(spec.index)&&
  spec.index>=0&&spec.index<AVATAR_3D.length;
 return {kind:spec.kind==='photo'&&image?'photo':atlasValid?'atlas':'monogram',
  initials:initials||'Я',color:AVATAR_COLORS.includes(spec.color)?spec.color:automaticAvatarColor(initials),image,index:atlasValid?spec.index:0};
}
function paintAvatar(element,source){
 const spec=safeAvatar(source);
 if(!element||!spec)return;
 element.classList.add('sv-inbox-avatar-custom');
 element.dataset.svAvatarKind=spec.kind;
 element.style.setProperty('--sv-avatar-color',spec.color);
 element.style.setProperty('--sv-avatar-image',spec.kind==='photo'?'url("'+spec.image+'")':'none');
 if(spec.kind==='atlas')element.replaceChildren(atlasMark(spec.index));
 else element.textContent=spec.kind==='monogram'?(spec.initials||'Я'):spec.kind==='emoji'?spec.emoji:'';
}
function clearAvatarStyle(element){
 element.classList.remove('sv-inbox-avatar-custom');
 delete element.dataset.svAvatarKind;
 element.style.removeProperty('--sv-avatar-color');
 element.style.removeProperty('--sv-avatar-image');
}
function restoreAvatar(element,id,row){
 clearAvatarStyle(element);
 const info=roomInfo(id);
 if((row?.dataset?.svcpRoomKind||info?.kind)==='groups'){
  element.innerHTML=svg(id==='general'?'messages':id==='docs'?'file':'users');
 }else element.textContent=String(info?.mark||info?.label?.slice(0,1)||'•');
}
function updateHeaderAvatar(){
 const conversation=$('svcpConversation'),target=$('svcpRoomAvatar');
 const id=conversation?.dataset.roomId;
 if(!target||!id)return;
 if(id==='dm-sayvi'){
  if(target.classList.contains('sv-inbox-avatar-custom'))clearAvatarStyle(target);
  return;
 }
 // Other people's avatars are not editable from the manager's browser.
}

/* Clean standalone avatar editor; separate fixed footer and one scroll area. */
function showAvatarEditor(){
 const staff=window.SEYVEO_PREVIEW?.isEmployee?.()===true;
 const initial=readActualSelfAvatar();
 let draft=safeAvatar(initial)||{kind:'monogram',initials:staff?'Е':'Я',color:AVATAR_COLORS[0]};
 let tab=draft.kind==='photo'?'photo':'atlas';
 const editor=node('form','sv-new-avatar-editor');
 editor.id='svNewAvatarForm';
 editor.noValidate=true;
 const hero=node('div','sv-new-avatar-hero');
 const preview=node('span','sv-new-avatar-preview');
 preview.setAttribute('aria-hidden','true');
 const identity=node('label','sv-new-avatar-identity');
 identity.setAttribute('aria-label','Имя профиля — нажмите для изменения');
 const nameInput=node('input','sv-new-avatar-inline-name');
 nameInput.type='text';nameInput.maxLength=50;nameInput.placeholder='Ваше имя';nameInput.autocomplete='nickname';
 nameInput.setAttribute('aria-label','Имя профиля');
 nameInput.value=staff?'Елена':String(prefs.myProfile?.name||'');
 if(staff)nameInput.readOnly=true;
 const identityChevron=node('span','sv-new-avatar-identity-chevron');
 identityChevron.innerHTML=svg('chevron');identityChevron.setAttribute('aria-hidden','true');
 identity.append(nameInput,identityChevron);
 hero.append(preview,identity);
 function sizeInlineName(){
  const value=nameInput.value||nameInput.placeholder;
  nameInput.style.width=Math.max(6,Math.min(23,[...value].length+1))+'ch';
 }
 const tabs=node('div','sv-new-avatar-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Способ оформления');
 const views=node('div','sv-new-avatar-views');
 const syncAvatarGlass=()=>overlay.classList.toggle('sv-avatar-under-scroll',views.scrollTop>2);
 views.addEventListener('scroll',syncAvatarGlass,{passive:true});
 overlay.classList.remove('sv-avatar-under-scroll');
 const gallery=node('div','sv-new-avatar-grid');
 const categoryBar=node('div','sv-avatar-categories');
 categoryBar.setAttribute('role','group');
 categoryBar.setAttribute('aria-label','Категории аватаров');
 let category='all';
 function avatarCategory(i){
  if(i>=76)return 'sayvi';
  if([6,7,8,9,10,11].includes(i))return 'emoji';
  if(i===4||(i>=52&&i<=59&&i!==57)||(i>=64&&i<=66))return 'animals';
  if([1,3,23,25,26,27,29,30,57,60,61,62,63,67].includes(i)||i>=68)return 'fantasy';
  return 'people';
 }
 const categoryButtons=[];
 for(const [key,label] of [['all','Все'],['emoji','Эмодзи'],['people','Персонажи'],['animals','Животные'],['fantasy','Фантазия'],['sayvi','Сэйви']]){
  if(key==='sayvi'&&!window.SEYVEO_SAYVI_HOLIDAY?.ready)continue;
  const b=node('button','sv-avatar-category',label);b.type='button';b.dataset.category=key;
  b.setAttribute('aria-pressed',String(key==='all'));
  b.addEventListener('click',()=>{category=key;paint()});categoryBar.append(b);categoryButtons.push(b);
 }
 const options=[['atlas','Аватары'],['photo','Фото']];
 const btns=[];
 for(const [mode,label] of options){
  const btn=node('button','sv-new-avatar-tab',label);btn.type='button';
  btn.addEventListener('click',()=>{
   if(tab!==mode){tab=mode;views.scrollTop=0;syncAvatarGlass()}
   paint();
  });
  btn.dataset.mode=mode;tabs.append(btn);btns.push(btn);
 }
 for(let i=0;i<AVATAR_3D.length;i++){
  if(i>=76&&!window.SEYVEO_SAYVI_HOLIDAY?.ready)continue;
  const choice=node('button','sv-new-avatar-choice');choice.type='button';
  choice.dataset.index=String(i);
  choice.dataset.category=avatarCategory(i);
  choice.setAttribute('aria-label','Выбрать аватар '+AVATAR_3D[i][0]);
  choice.append(atlasMark(i),node('small',null,AVATAR_3D[i][0]));
  choice.addEventListener('click',()=>{
   draft={kind:'atlas',index:i,initials:initialsFromName(),color:AVATAR_COLORS[0]};
   tab='atlas';paint();
  });
  gallery.append(choice);
 }
 const initialsFromName=()=>{
  const words=String(nameInput.value||'').trim().split(/\s+/u).filter(Boolean);
  return words.slice(0,2).map(word=>[...word][0]).join('').toLocaleUpperCase('ru-RU')||'Я';
 };
 nameInput.addEventListener('input',()=>paint());
 const photo=node('div','sv-new-avatar-photo');
 const photoChoices=node('div','sv-new-avatar-photo-choices');
 const makePhotoPicker=(label,camera)=>{
  const picker=node('label','sv-new-avatar-photo-pick');
  picker.append(node('span',null,label));
  const input=node('input');
  input.type='file';input.accept='image/*';
  if(camera)input.setAttribute('capture','user');
  input.setAttribute('aria-label',label);
  picker.append(input);photoChoices.append(picker);
  return input;
 };
 const cameraInput=makePhotoPicker('Сделать фото',true);
 const galleryInput=makePhotoPicker('Из галереи',false);
 photo.append(photoChoices);
 // The photo tools appear only after an actual image exists.
 const cropEditor=node('div','sv-avatar-crop-editor');
 cropEditor.hidden=true;
 const cropCanvas=node('canvas','sv-avatar-crop-canvas');
 cropCanvas.width=256;cropCanvas.height=256;
 cropCanvas.setAttribute('role','img');
 cropCanvas.setAttribute('aria-label','Предпросмотр кадрирования. Перемещайте снимок пальцем');
 const cropGuide=node('small','sv-avatar-crop-guide','Перемещайте фото пальцем · масштабируйте ниже');
 const zoomRow=node('label','sv-avatar-zoom-row');
 const zoomTitle=node('span',null,'Масштаб');
 const zoomInput=node('input','sv-avatar-zoom-input');
 zoomInput.type='range';zoomInput.min='1';zoomInput.max='3.5';zoomInput.step='0.05';zoomInput.value='1';
 zoomInput.setAttribute('aria-label','Масштаб фотографии');
 const centerButton=node('button','sv-avatar-crop-auto','Автокадр');
 centerButton.type='button';centerButton.setAttribute('aria-label','Автоматическое кадрирование по лицу, если поддерживается');
 zoomRow.append(zoomTitle,zoomInput,centerButton);
 cropEditor.append(cropCanvas,cropGuide,zoomRow);
 const filterBar=node('div','sv-new-avatar-photo-filters');
 filterBar.hidden=true;
 filterBar.setAttribute('role','group');
 filterBar.setAttribute('aria-label','Обработка фотографии');
 const filterButtons=[];
 let photoMode='auto',photoSource=null,photoCrop=null,photoToken=0,photoPending=false;
 let unbindPan=null;
 const studio=window.SEYVEO_AVATAR_STUDIO;
 const looks=[['original','Оригинал'],['auto','Авто'],['portrait','Портрет']];
 const status=node('p','sv-new-avatar-status');status.setAttribute('role','status');
 const photoHint=node('small','sv-new-avatar-photo-hint','');
 photoHint.hidden=true;
 function renderPhoto(){
  if(!photoSource||!studio||photoPending)return;
  photoPending=true;
  requestAnimationFrame(()=>{
   photoPending=false;
   if(!photoSource||!studio)return;
   try{
    photoCrop=studio.normalized(photoSource,photoCrop||studio.center());
    studio.draw(photoSource,photoCrop,photoMode,cropCanvas);
    const data=studio.exportImage(photoSource,photoCrop,photoMode);
    draft.kind='photo';draft.image=data;tab='photo';
    cropEditor.hidden=false;filterBar.hidden=false;
    zoomInput.value=String(photoCrop.zoom);
    status.textContent='';paint();
   }catch(error){status.textContent='Не удалось обработать фото. Выберите другой снимок.'}
  });
 }
 function setCrop(value){
  photoCrop=studio?.normalized(photoSource,value)||value;
  renderPhoto();
 }
 async function autoCrop(token=photoToken){
  if(!studio||!photoSource)return;
  status.textContent='Настраиваем кадр…';
  const image=photoSource;
  const result=await studio.suggest(image);
  if(token!==photoToken||image!==photoSource)return;
  photoCrop=studio.normalized(image,result);
  photoHint.textContent=result.detected?'Лицо найдено · кадр можно подвинуть':
   'Кадр готов · можно сдвинуть фотографию пальцем';
  photoHint.hidden=false;
  renderPhoto();
 }
 function bindCropGesture(){
  if(unbindPan)unbindPan();
  if(!studio||!photoSource)return;
  unbindPan=studio.bindPan(cropCanvas,()=>photoCrop||studio.center(),setCrop,photoSource);
 }
 for(const [mode,label] of looks){
  const filter=node('button','sv-new-avatar-photo-filter',label);
  filter.type='button';filter.dataset.photoMode=mode;
  filter.addEventListener('click',()=>{photoMode=mode;renderPhoto();paint()});
  filterBar.append(filter);filterButtons.push(filter);
 }
 zoomInput.addEventListener('input',()=>{
  if(!photoSource||!studio)return;
  setCrop({...photoCrop,zoom:Number(zoomInput.value)});
 });
 centerButton.addEventListener('click',()=>{if(photoSource)autoCrop()});
 photo.append(cropEditor,filterBar,photoHint);
 async function receivePhoto(input){
  const file=input.files?.[0];if(!file)return;
  input.value='';
  if(!file.type.startsWith('image/')||file.size>16*1024*1024){
   status.textContent='Выберите фотографию размером до 16 МБ.';return;
  }
  const token=++photoToken;
  const url=URL.createObjectURL(file),picture=new Image();
  status.textContent='Подготавливаю снимок…';
  picture.onload=()=>{
   URL.revokeObjectURL(url);
   if(token!==photoToken)return;
   photoSource=picture;photoMode='auto';photoCrop=studio?.center();
   photoHint.textContent='Подбираем лучший кадр…';photoHint.hidden=false;
   cropEditor.hidden=false;filterBar.hidden=false;
   bindCropGesture();
   renderPhoto();
   autoCrop(token);
  };
  picture.onerror=()=>{
   URL.revokeObjectURL(url);
   if(token===photoToken)status.textContent='Не удалось открыть снимок.';
  };
  picture.src=url;
 }
 cameraInput.addEventListener('change',()=>receivePhoto(cameraInput));
 galleryInput.addEventListener('change',()=>receivePhoto(galleryInput));
 // Saved portraits can also be cropped or reprocessed, entirely offline.
 if(draft.kind==='photo'&&draft.image){
  const token=++photoToken,existing=new Image();
  photoMode='original';
  existing.onload=()=>{
   if(token!==photoToken||photoSource)return;
   photoSource=existing;photoCrop=studio?.center();
   bindCropGesture();cropEditor.hidden=false;filterBar.hidden=false;
   photoHint.textContent='Перемещайте фото пальцем или выберите обработку.';
   photoHint.hidden=false;
   renderPhoto();
  };
  existing.src=draft.image;
 }
 views.append(categoryBar,gallery,photo);
 const pinnedHead=node('div','sv-new-avatar-pinned-head');
 pinnedHead.append(hero,tabs);
 editor.append(pinnedHead,views,status);
 // Fresh floating actions: no footer strip, backing card, or inherited button styles.
 const actions=node('div','sv-avatar-floating-actions');
 const reset=node('button','sv-avatar-action-reset','Сбросить');reset.type='button';
 const save=node('button','sv-avatar-action-save','Сохранить');save.type='submit';save.setAttribute('form',editor.id);
 actions.append(reset,save);
 function paint(){
  sizeInlineName();
  if(draft.kind==='monogram'){
   draft.initials=initialsFromName();
   draft.color=automaticAvatarColor(nameInput.value);
  }
  paintAvatar(preview,draft);
  for(const b of btns)b.setAttribute('aria-pressed',String(b.dataset.mode===tab));
  gallery.hidden=tab!=='atlas';categoryBar.hidden=tab!=='atlas';photo.hidden=tab!=='photo';
  for(const b of categoryButtons)b.setAttribute('aria-pressed',String(b.dataset.category===category));
  // Never show photo effects before a photo has been taken or chosen.
  filterBar.hidden=!photoSource;
  cropEditor.hidden=!photoSource;
   for(const choice of gallery.children){
    choice.hidden=category!=='all'&&choice.dataset.category!==category;
    choice.setAttribute('aria-pressed',String(draft.kind==='atlas'&&Number(choice.dataset.index)===draft.index));
   }
  for(const b of filterButtons)b.setAttribute('aria-pressed',String(b.dataset.photoMode===photoMode));
 }
 function persist(clear=false){
  if(draft.kind==='monogram'){
   draft.initials=initialsFromName();
   draft.color=automaticAvatarColor(nameInput.value);
  }
  const chosen=clear?{kind:'monogram',initials:initialsFromName(),color:automaticAvatarColor(nameInput.value)}:safeAvatar(draft);
  const payload=clear?staff?{kind:'monogram'}:{kind:'preset',id:'monogram'}:
   chosen.kind==='atlas'
    ?(staff?{kind:'atlas',index:chosen.index,customChosen:true}
      :{kind:'preset',id:'3d-'+chosen.index,customChosen:true}):
   chosen.kind==='photo'?{kind:'photo',data:chosen.image}:{kind:'monogram'};
  try{
   if(staff){
    const existing=JSON.parse(localStorage.getItem(STAFF_AVATAR_KEY)||'{}');
    const records=existing&&typeof existing==='object'&&!Array.isArray(existing)?existing:{};
    records.elena=payload;localStorage.setItem(STAFF_AVATAR_KEY,JSON.stringify(records));
    prefs.employeeProfile={...prefs.employeeProfile,name:'Елена',avatar:chosen};
   }else{
    localStorage.setItem(OWNER_AVATAR_KEY,JSON.stringify(payload));
    prefs.myProfile={...prefs.myProfile,name:nameInput.value.trim().slice(0,50),avatar:chosen};
   }
   localStorage.setItem(KEY,JSON.stringify(prefs));
  }catch{status.textContent='Не удалось сохранить данные на устройстве.';return}
  window.dispatchEvent(new Event('seyveo:avatar-changed'));
  window.dispatchEvent(new CustomEvent('seyveo:self-avatar-updated',{detail:{person:staff?'elena':'manager'}}));
  decorateRows();closeSheet();
 }
 reset.addEventListener('click',()=>{
  // No artwork selected: generate a personal letter avatar from the name.
  draft={kind:'monogram',initials:initialsFromName(),color:automaticAvatarColor(nameInput.value)};
  tab='atlas';paint();
  persist(true);
 });
 editor.addEventListener('submit',event=>{
  event.preventDefault();
  if(draft.kind==='photo'&&!draft.image){status.textContent='Выберите фотографию.';return}
  persist();
 });
 paint();
 body.append(editor);
 const measureAvatarHead=()=>editor.style.setProperty('--sv-avatar-head-height',pinnedHead.offsetHeight+'px');
 measureAvatarHead();
 if(typeof ResizeObserver==='function'){
  const observer=new ResizeObserver(measureAvatarHead);
  observer.observe(pinnedHead);
  releaseAvatarHead=()=>observer.disconnect();
 }else{
  window.addEventListener('resize',measureAvatarHead);
  releaseAvatarHead=()=>window.removeEventListener('resize',measureAvatarHead);
 }
 // Fixed at the bottom of the sheet, outside the only scrollable content area.
 panel.append(actions);
}
function employee(){return window.SEYVEO_PREVIEW?.isEmployee?.()===true}
function openChat(id){closeSheet();closeMenu();window.SEYVEO_BUSINESS_COMMAND?.showChat?.(id)}
const menuButton=node('button','sv-inbox-options-button');
menuButton.type='button';menuButton.id='svcpInboxOptionsTop';
menuButton.setAttribute('aria-label','Настройки и действия с чатами');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-controls','svcpInboxMenu');
menuButton.innerHTML=svg('dots');
history.hidden=true;history.setAttribute('tabindex','-1');history.setAttribute('aria-hidden','true');history.classList.add('sv-inbox-history-proxy');
// A single 44px round menu button. The long pill belongs below,
// to the four existing inbox filters, not to search/menu in this header.
header.append(menuButton);
function toggleDirectorySearch(forceOpen){
 const input=$('svcpHistorySearch');
 const bar=$('svcpDirectorySearchBar');
 if(!input||!bar)return;
 const opening=typeof forceOpen==='boolean'?forceOpen:bar.hidden;
 bar.hidden=!opening;
 screen.classList.toggle('svcp-directory-search-open',opening);
 if(opening){
  // User gesture opens a real visible search field; do not focus a hidden input.
  requestAnimationFrame(()=>input.focus({preventScroll:true}));
 }else{
  input.value='';
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.blur();
 }
}
$('svcpDirectorySearchClose')?.addEventListener('click',()=>toggleDirectorySearch(false));
window.addEventListener('seyveo:messages-open-search',()=>toggleDirectorySearch(true));
$('svcpHistorySearch')?.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();toggleDirectorySearch(false)}
});
const menu=node('div','sv-inbox-popover');menu.id='svcpInboxMenu';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','Действия с сообщениями');
const menuItems=[['Поиск сообщений','search','search'],['Новый чат','pen','new'],['Новая группа','groupAdd','group'],['Сотрудники','users','staff'],['Настройки сообщений','sliders','settings'],['Архив','archive','archives']];
for(const [label,icon,action] of menuItems){const b=button(label,icon,()=>chooseAction(action),'sv-inbox-menu-row');b.setAttribute('role','menuitem');menu.append(b)}
screen.append(menu);
function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false')}
function openMenu(){closeSheet();menu.hidden=false;menuButton.setAttribute('aria-expanded','true');menu.querySelector('button')?.focus({preventScroll:true})}
menuButton.addEventListener('click',()=>menu.hidden?openMenu():closeMenu());
function chooseAction(action){
 closeMenu();
 if(action==='search'){toggleDirectorySearch();return}
 if(action==='history'){history.click();return}
 openSheet(action);
}
const overlay=node('section','sv-inbox-overlay');overlay.id='svcpInboxSheet';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','svInboxSheetTitle');
const backdrop=node('button','sv-inbox-sheet-backdrop');backdrop.type='button';backdrop.setAttribute('aria-label','Закрыть меню чатов');
const panel=node('div','sv-inbox-sheet-panel');
const top=node('header','sv-inbox-sheet-head');
const back=button('','back',()=>{const previous=sheetStack.pop();if(previous)openSheet(previous.type,previous.id,true);else closeSheet()},'sv-inbox-sheet-back');
back.setAttribute('aria-label','Назад к сообщениям');
const title=node('strong');title.id='svInboxSheetTitle';
top.append(back,title,node('span'));
const body=node('div','sv-inbox-sheet-body');
// Existing overlay and Back handler are the sole navigation owners.
const sheetGrip=node('div','sv-inbox-shared-grip');sheetGrip.setAttribute('aria-hidden','true');sheetGrip.hidden=true;
panel.append(sheetGrip,top,body);
// Existing scrollports own their optical state; no duplicate scrolling layer.
const syncInboxGlass=()=>screen.classList.toggle('sv-inbox-under-scroll',list.scrollTop>2);
list.addEventListener('scroll',syncInboxGlass,{passive:true});
syncInboxGlass();
// Avatar optical state belongs to its gallery scrollport (showAvatarEditor).

const swipeSafeViews=new Set(['new','staff','team-structure','one','archives']);
window.SEYVEO_SHEET_NAVIGATION?.attach(sheetGrip,null,()=>{
 if(!overlay.hidden&&swipeSafeViews.has(sheetType))back.click();
});
overlay.append(backdrop,panel);screen.append(overlay);
backdrop.addEventListener('click',()=>closeSheet());
let releaseAvatarHead=()=>{};
function closeSheet(){releaseAvatarHead();releaseAvatarHead=()=>{};overlay.classList.remove('sv-avatar-under-scroll');panel.querySelector(':scope > .sv-avatar-floating-actions')?.remove();overlay.hidden=true;sheetType='';activeRoom='';sheetStack.length=0}
function openSubSheet(type,parent){sheetStack.push({type:parent||sheetType,id:activeRoom});openSheet(type,'',true)}
function viewTitle(type){return {new:'Новое сообщение',staff:'Сотрудники','team-structure':'Структура чатов',invite:'Подключить сотрудника',group:'Новая группа',settings:'Настройки сообщений',colleague:'Личное приглашение',one:'SEYVEO One','my-avatar':'Моё имя и фото','room-avatar':'Аватар чата',display:'Отображение',notifications:'Уведомления','muted-chats':'Чаты без звука',appearance:'Тема',wallpapers:'Фон переписок',data:'История и данные',archives:'Архив',room:'Действия с чатом'}[type]||'Сообщения'}
function openSheet(type,id='',nested=false){
 releaseAvatarHead();releaseAvatarHead=()=>{};
 if(!nested)sheetStack.length=0;
 closeMenu();sheetType=type;activeRoom=id;
 title.textContent=type==='my-avatar'?'':viewTitle(type);body.replaceChildren();
 title.hidden=type==='my-avatar';
 if(type==='my-avatar'){
  overlay.setAttribute('aria-label','Настройки фотографии и аватара');
  overlay.removeAttribute('aria-labelledby');
 }else{
  overlay.removeAttribute('aria-label');
  overlay.setAttribute('aria-labelledby','svInboxSheetTitle');
 }
 panel.querySelector(':scope > .sv-avatar-floating-actions')?.remove();
 overlay.hidden=false;
 overlay.classList.toggle('sv-inbox-sheet-notifications',type==='notifications'||type==='muted-chats');
 overlay.dataset.svInboxScreen=type;
 const safeSwipe=swipeSafeViews.has(type);
 sheetGrip.hidden=!safeSwipe;
 overlay.classList.toggle('sv-inbox-shared-swipe',safeSwipe);
 if(type==='new')showContacts(type);
 else if(type==='staff')showStaff();
 else if(type==='team-structure')showTeamStructure();
 else if(type==='colleague')showColleagueInvite(id);
 else if(type==='invite')showInvite();
 else if(type==='group')showGroupForm();
 else if(type==='settings')showSettings();
 else if(type==='my-avatar')showAvatarEditor();
 else if(type==='one')showOneInfo();
 else if(type==='room-avatar')showRoomActions(id);
 else if(type==='notifications')showNotifications();
 else if(type==='muted-chats')showMutedChats();
 else if(type==='archives')showArchives();
 else if(type==='room')showRoomActions(id);
 back.focus({preventScroll:true});
}
function makeContactRow(r,fn){
 const row=button(r.label,'chevron',fn,'sv-inbox-contact-row');
 row.dataset.svcpRoomPerson=r.person||'';
 const avatar=node('span','sv-inbox-contact-avatar svcp-directory-avatar');
 avatar.setAttribute('aria-hidden','true');
 // Reuse the real person portrait from the chat directory; no letter placeholders.
 const painted=window.SEYVEO_BUSINESS_COMMAND?.paintContactAvatar?.(avatar,r.id)===true;
 if(!painted&&r.id==='dm-sayvi')avatar.classList.add('is-sayvi','sv-sayvi-avatar');
 if(!painted&&r.kind==='groups')avatar.innerHTML=svg(r.id==='general'?'messages':r.id==='docs'?'file':'users');
 row.prepend(avatar);
 // Contact picture is supplied by the contact's own identity.
 const copy=Array.from(row.children).find(child=>child.tagName==='SPAN'&&!child.classList.contains('sv-inbox-contact-avatar'));
 if(copy&&r.hint){
  const role=r.hint.split(' · ')[0].trim();
  if(role)copy.append(node('small',null,role));
 }
 return row;
}
/* Employee directory: only open existing, authorised work rooms.
   Other colleagues are discoverable for a voluntary personal invitation,
   not by exposing their manager-only demo conversations. */
function colleagueRecords(){
 return allRooms().filter(r=>r.kind==='personal'&&r.person&&r.person!=='sayvi');
}
function showEmployeeDirectory(){
 sectionHeading('Рабочие чаты');
 const groups=node('div','sv-inbox-people-list');
 for(const r of allRooms().filter(r=>r.id==='general'||r.id==='team'||r.id==='docs')){
  groups.append(makeContactRow(r,()=>openChat(r.id)));
 }
 body.append(groups);
 sectionHeading('Написать коллеге');
 const list=node('div','sv-inbox-people-list');
 // These IDs are distinct from the manager's private conversations with employees.
 const colleagues=allRooms().filter(r=>r.section==='staff-direct');
 for(const r of colleagues){
  const row=makeContactRow(r,()=>openChat(r.id));
  row.setAttribute('aria-label','Открыть рабочий личный чат с '+r.label);
  list.append(row);
 }
 if(!colleagues.length)list.append(node('p','sv-inbox-hint','Коллеги пока не подключены.'));
 body.append(list);
 body.append(node('p','sv-inbox-colleague-note',
  'В демо сообщения сохраняются только в этом браузере. Для переписки между телефонами потребуется подключение мессенджера.'));
}
function showColleagueInvite(id){
 const colleague=colleagueRecords().find(r=>r.id===id);
 if(!colleague){body.append(node('p','sv-inbox-hint','Коллега не найден.'));return}
 const panel=node('div','sv-inbox-colleague-detail');
 const avatar=node('span','sv-inbox-colleague-avatar',colleague.label.slice(0,1));
 avatar.setAttribute('aria-hidden','true');
 panel.append(avatar,node('strong',null,colleague.label),
   node('p',null,'Для личного общения вне работы можно пригласить коллегу в SEYVEO One. Личная переписка будет отдельной от рабочего пространства.'));
 const note=node('p','sv-inbox-colleague-note',
  'Приглашения и доставка личных сообщений пока не подключены. Сейчас можно только подготовить текст приглашения.');
 panel.append(note);
 const text='Привет! Давай общаться вне работы в SEYVEO One. Когда личные чаты станут доступны, я пришлю приглашение. Это добровольно и отдельно от рабочего чата.';
 const copy=node('button','sv-inbox-colleague-copy','Скопировать приглашение');
 copy.type='button';
 copy.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(text);copy.textContent='Текст скопирован'}
  catch{copy.textContent='Не удалось скопировать'}
 });
 panel.append(copy);
 body.append(panel);
}
function showContacts(){
 if(employee()){showEmployeeDirectory();return}
 const names=allRooms().filter(r=>r.kind==='personal'&&r.person&&r.person!=='sayvi');
 const list=node('div','sv-inbox-people-list');
 for(const r of names)list.append(makeContactRow(r,()=>openChat(r.id)));
 body.append(list);
}
function showGroupForm(){
 if(employee()){
  body.append(node('p','sv-inbox-hint','Создавать рабочие группы может руководитель.'));
  return;
 }
 const form=node('form','sv-inbox-group-form');
 const label=node('label','sv-inbox-field-label','Название');
 const input=node('input','sv-inbox-text-input');
 input.required=true;input.maxLength=55;input.placeholder='Название группы';input.setAttribute('aria-label','Название новой группы');
 label.append(input);form.append(label);
 const heading=node('h3','sv-inbox-form-caption','Участники');
 form.append(heading);
 const list=node('div','sv-inbox-participant-list');
 const people=[
  {id:'elena',name:'Елена',role:'Кассир'},
  {id:'anna',name:'Анна',role:'Старший продавец'},
  {id:'mikhail',name:'Михаил',role:'Продавец'}
 ];
 for(const p of people){
  const line=node('label','sv-inbox-participant-row');
  const avatar=node('span','sv-inbox-contact-avatar svcp-directory-avatar');
  avatar.setAttribute('aria-hidden','true');
  // Same person-owned avatar used by the main chat list. No temporary letters.
  window.SEYVEO_BUSINESS_COMMAND?.paintContactAvatar?.(avatar,'dm-'+p.id);
  const copy=node('span','sv-inbox-participant-copy');
  copy.append(node('strong',null,p.name),node('small',null,p.role));
  const check=node('input','sv-inbox-participant-check');
  check.type='checkbox';check.name='participant';check.value=p.id;
  check.setAttribute('aria-label','Добавить: '+p.name);
  if(p.id==='elena')check.checked=true;
  line.append(avatar,copy,check);list.append(line);
 }
 form.append(list);
 const status=node('p','sv-inbox-inline-status');status.setAttribute('role','status');
 status.hidden=true;form.append(status);
 const submit=node('button','sv-inbox-submit','Создать группу');
 submit.type='submit';form.append(submit);
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const name=input.value.trim();
  const members=[...form.querySelectorAll('input[name="participant"]:checked')].map(item=>item.value);
  if(!name||!members.length){
   status.textContent='Выберите хотя бы одного участника';
   status.hidden=false;return;
  }
  const id=window.SEYVEO_BUSINESS_COMMAND?.createLocalGroup?.(name,members);
  if(id)openChat(id);
  else{status.textContent='Не удалось создать группу';status.hidden=false}
 });
 body.append(form);
}

function sectionHeading(textValue){body.append(node('h3','sv-inbox-section-heading',textValue))}
function menuLink(label,help,icon,fn){
 const row=button(label,icon,fn,'sv-inbox-setting-link');
 if(help){const labelNode=row.querySelector('span');if(labelNode)labelNode.append(node('small',null,help))}
 const chev=node('span','sv-inbox-link-chevron');chev.innerHTML=svg('chevron');row.append(chev);
 body.append(row);return row;
}
/* Chat wallpapers only. App-wide White/Dark themes stay in Management. */
const CHAT_WALLPAPERS=[
 {id:'pearl',label:'Обычная',detail:'Без оформления'},
 {id:'sky',label:'Небо',detail:'Голубой'},
 {id:'evening',label:'Вечер',detail:'Лавандовый'}
];
function makeChatWallpapers(){
 const group=node('div','sv-inbox-wallpaper-grid');
 group.setAttribute('role','group');
 group.setAttribute('aria-label','Оформление рабочих переписок');
 for(const t of CHAT_WALLPAPERS){
  const b=node('button','sv-inbox-wallpaper-card');b.type='button';
  b.dataset.svWallpaperSelect=t.id;
  const preview=node('span','sv-chat-theme-preview sv-chat-theme-preview-'+t.id);
  preview.setAttribute('aria-hidden','true');
  preview.append(node('i','sv-chat-theme-sample-in'),node('i','sv-chat-theme-sample-out'));
  const title=node('strong',null,t.label);
  const note=node('small',null,t.detail);
  const mark=node('span','sv-inbox-wallpaper-check');mark.innerHTML=svg('check');mark.setAttribute('aria-hidden','true');
  b.append(preview,title,note,mark);
  b.setAttribute('aria-label',t.label+' — '+t.detail);
  b.addEventListener('click',()=>{
   const ok=window.SEYVEO_CHAT_THEMES?.setWorkDefault?.(t.id);
   if(ok){
    group.querySelectorAll('[data-sv-wallpaper-select]').forEach(option=>
     option.setAttribute('aria-pressed',String(option.dataset.svWallpaperSelect===t.id)));
   }
  });
  group.append(b);
 }
 const selected=window.SEYVEO_CHAT_THEMES?.getWorkDefault?.()||'pearl';
 group.querySelectorAll('[data-sv-wallpaper-select]').forEach(option=>
  option.setAttribute('aria-pressed',String(option.dataset.svWallpaperSelect===selected)));
 return group;
}
function sectionHeading(textValue){body.append(node('h3','sv-inbox-section-heading',textValue))}
function menuLink(label,help,icon,fn){
 const row=button(label,icon,fn,'sv-inbox-setting-link');
 if(help){const labelNode=row.querySelector('span');if(labelNode)labelNode.append(node('small',null,help))}
 const chev=node('span','sv-inbox-link-chevron');chev.innerHTML=svg('chevron');row.append(chev);
 body.append(row);return row;
}
function settingToggle(key,label,help){
 const row=node('label','sv-inbox-toggle-row sv-inbox-settings-toggle');
 const copy=node('span');copy.append(node('strong',null,label));
 if(help)copy.append(node('small',null,help));
 const control=node('input','sv-inbox-settings-switch');
 control.type='checkbox';control.checked=!!prefs[key];
 control.setAttribute('role','switch');control.setAttribute('aria-label',label);
 control.addEventListener('change',()=>{prefs[key]=control.checked;savePrefs();decorateRows()});
 row.append(copy,control);body.append(row);return control;
}
function showSettings(){
 sectionHeading('Профиль');
 const avatarEntry=menuLink('Моё имя и фото','Аватар, буквы или своё фото','users',()=>openSubSheet('my-avatar','settings'));
 avatarEntry.querySelector(':scope > svg')?.remove();
 const avatarThumb=node('span','sv-inbox-avatar-settings-preview');
 paintAvatar(avatarThumb,readActualSelfAvatar());
 avatarEntry.prepend(avatarThumb);
 sectionHeading('Темы чатов');
 body.append(makeChatWallpapers());
 sectionHeading('Сообщения');
 menuLink('Уведомления','Непрочитанные и тихие чаты','bell',()=>openSubSheet('notifications','settings'));
 // Quiet discovery for the owner only; never mix personal content with work data.
 if(!employee()){
  const invite=node('button','sv-inbox-one-promo');
  invite.type='button';
  invite.setAttribute('aria-label','О SEYVEO One: личные и семейные чаты');
  const emblem=node('span','sv-inbox-one-mark');emblem.setAttribute('aria-hidden','true');
  const info=node('span','sv-inbox-one-copy');
  info.append(node('strong',null,'Личное общение · SEYVEO One'),
              node('small',null,'Семья и друзья — отдельно от работы'));
  const chevron=node('span','sv-inbox-one-chevron');chevron.innerHTML=svg('chevron');
  chevron.setAttribute('aria-hidden','true');
  invite.append(emblem,info,chevron);
  invite.addEventListener('click',()=>openSubSheet('one','settings'));
  body.append(invite);
 }
}
function showOneInfo(){
 const info=node('div','sv-inbox-one-detail');
 const mark=node('span','sv-inbox-one-detail-mark');mark.setAttribute('aria-hidden','true');
 info.append(mark,node('strong',null,'SEYVEO One'),
  node('p',null,'Для разговоров с семьёй и друзьями — отдельное личное пространство, не связанное с рабочими чатами.'));
 const benefits=node('p','sv-inbox-one-detail-note',
  'Семейные чаты входят в предложение SEYVEO One. Доступ и условия подписки уточняются при подключении.');
 info.append(benefits);
 // The shared header back button already returns to Settings.
 body.append(info);
}
function notificationSection(caption){
 const heading=node('h3','sv-inbox-notification-caption',caption);
 const group=node('div','sv-inbox-notification-group');
 body.append(heading,group);return group;
}
function notificationSwitch(checked,label,handle){
 const control=node('input','sv-inbox-ios-switch');
 control.type='checkbox';control.checked=!!checked;
 control.setAttribute('aria-label',label);control.setAttribute('role','switch');
 control.addEventListener('change',()=>handle(control.checked));
 return control;
}
function notificationSetting(label,description,checked,handler){
 const row=node('label','sv-inbox-ios-row sv-inbox-ios-unread');
 const copy=node('span','sv-inbox-ios-copy');
 copy.append(node('strong',null,label),node('small',null,description));
 row.append(copy,notificationSwitch(checked,label,handler));
 return row;
}
function showNotifications(){
 const general=notificationSection('Сообщения');
 general.append(notificationSetting(
  'Выделять непрочитанные','Подсветка чатов с новыми сообщениями',
  prefs.showUnread!==false,checked=>{
   prefs.showUnread=checked;savePrefs();decorateRows();
  }));
 general.append(notificationSetting(
  'Звук сообщений','Общее правило для всех чатов',
  prefs.soundEnabled!==false,checked=>{
   prefs.soundEnabled=checked;savePrefs();
   window.dispatchEvent(new CustomEvent('seyveo:chat-sound-setting-changed',
    {detail:{enabled:checked}}));
  }));
 const exclusions=notificationSection('Исключения');
 const mutedCount=()=>allRooms().filter(r=>roomState(r.id).muted===true).length;
 const row=button('Чаты без звука','bell',
  ()=>openSubSheet('muted-chats','notifications'),'sv-inbox-ios-row sv-inbox-muted-link');
 const icon=row.querySelector(':scope > svg');
 icon?.setAttribute('aria-hidden','true');
 const text=row.querySelector(':scope > span');
 const counter=node('small','sv-inbox-muted-count');
 counter.textContent=mutedCount()+' '+(mutedCount()===1?'чат':'чатов');
 text?.append(counter);
 const chevron=node('span','sv-inbox-muted-chevron');
 chevron.innerHTML=svg('chevron');chevron.setAttribute('aria-hidden','true');
 row.append(chevron);exclusions.append(row);
}
function showMutedChats(){
 // Compact exceptions manager: 100+ rooms remain discoverable through search.
 // By default show only muted rooms; search and "Все чаты" cover all real rooms.
 let scope='muted';
 const lookup=node('div','sv-inbox-muted-search-wrap');
 const lens=node('span','sv-inbox-muted-search-icon');
 lens.innerHTML=svg('search');lens.setAttribute('aria-hidden','true');
 const search=node('input','sv-inbox-muted-search');
 search.type='search';search.placeholder='Найти чат';search.autocomplete='off';
 search.setAttribute('aria-label','Поиск по всем чатам');
 lookup.append(lens,search);body.append(lookup);
 const tabs=node('div','sv-inbox-muted-tabs');
 tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Фильтр чатов');
 const mutedTab=button('Без звука',null,()=>setScope('muted'),'sv-inbox-muted-tab');
 const allTab=button('Все чаты',null,()=>setScope('all'),'sv-inbox-muted-tab');
 tabs.append(mutedTab,allTab);body.append(tabs);
 const group=notificationSection('Чаты');
 const summary=node('p','sv-inbox-muted-summary');
 summary.setAttribute('role','status');body.append(summary);
 function setScope(next){scope=next;repaint()}
 function repaint(){
  const query=search.value.trim().toLocaleLowerCase('ru-RU');
  mutedTab.setAttribute('aria-pressed',String(scope==='muted'));
  allTab.setAttribute('aria-pressed',String(scope==='all'));
  const rooms=allRooms().filter(r=>r&&r.id&&r.label);
  const muted=rooms.filter(r=>roomState(r.id).muted===true);
  const candidates=query?rooms:(scope==='muted'?muted:rooms);
  const visible=candidates.filter(r=>String(r.label).toLocaleLowerCase('ru-RU').includes(query))
   .sort((a,b)=>Number(roomState(b.id).muted===true)-Number(roomState(a.id).muted===true)
    ||String(a.label).localeCompare(String(b.label),'ru-RU'));
  group.replaceChildren();
  for(const r of visible){
   const isMuted=roomState(r.id).muted===true;
   const row=node('div','sv-inbox-ios-row sv-inbox-muted-person');
   const avatar=node('span','sv-inbox-ios-avatar',(r.label||'?').slice(0,1));
   avatar.setAttribute('aria-hidden','true');
   const copy=node('span','sv-inbox-ios-copy');
   copy.append(node('strong',null,r.label));
   const toggle=button(isMuted?'Включить звук':'Без звука',null,()=>{
    updateRoom(r.id,'muted',!isMuted);
    repaint();
   },'sv-inbox-muted-unmute');
   toggle.setAttribute('aria-label',(isMuted?'Включить звук для ':'Отключить звук для ')+r.label);
   toggle.setAttribute('aria-pressed',String(isMuted));
   row.append(avatar,copy,toggle);group.append(row);
  }
  if(!visible.length){
   group.append(node('p','sv-inbox-ios-empty',
    query?'Ничего не найдено':scope==='muted'?'Все чаты со звуком':'Чатов пока нет'));
  }
  const n=muted.length;
  summary.textContent='Без звука: '+n+' из '+rooms.length+'. Изменения сохраняются для каждого чата.';
 }
 search.addEventListener('input',repaint);
 repaint();
}
function showData(){
 sectionHeading('Разные функции');
 menuLink('Архив','Скрытые из основного списка чаты; сообщения сохранены','archive',()=>openSubSheet('archives','data'));
 body.append(node('p','sv-inbox-hint','Для поиска старой переписки используйте лупу в Сообщениях. Архив скрывает чат из списка, но не удаляет сообщения.'));
}
function showTeamStructure(){
 // Read live local demo rooms. Do not invent branches, users or server-side permissions.
 const intro=node('p','sv-inbox-structure-intro',
  'Текущая демонстрация · одна команда. Филиалы, назначение управляющих и сводки директора пока в планах.');
 body.append(intro);
 const tree=node('div','sv-inbox-structure-tree');
 const company=node('div','sv-inbox-structure-node');
 company.append(node('strong',null,'Компания'),node('small',null,'Руководитель · управление рабочими группами'));
 tree.append(company);
 const branch=node('div','sv-inbox-structure-node sv-inbox-structure-node-child');
 branch.append(node('strong',null,'Команда · демо'),node('small',null,'Елена, Анна и Михаил · учебные сотрудники'));
 tree.append(branch);
 body.append(tree);
 sectionHeading('Групповые чаты команды');
 const groups=node('div','sv-inbox-people-list');
 const available=allRooms().filter(r=>r.kind==='groups');
 for(const r of available){
  const link=makeContactRow(r,()=>openChat(r.id));
  link.setAttribute('aria-label','Открыть рабочий групповой чат '+r.label);
  groups.append(link);
 }
 if(!available.length)groups.append(node('p','sv-inbox-hint','Группы ещё не созданы.'));
 body.append(groups);
 if(!employee()){
  sectionHeading('Состав групп');
  menuLink('Создать рабочую группу','Добавлять участников может руководитель','groupAdd',
   ()=>openSubSheet('group','team-structure'));
 }
 body.append(node('p','sv-inbox-structure-foot',
  'Сотрудники общаются и голосуют в своих группах. Директору в будущем показываем важные события и результаты, а не все сообщения.'));
}
function showStaff(){
 if(employee()){showEmployeeDirectory();return}
 const names=allRooms().filter(r=>r.kind==='personal'&&r.person!=='sayvi'&&(!employee()||r.id==='dm-elena'));
 sectionHeading('Команда');
 const list=node('div','sv-inbox-people-list');
 for(const r of names)list.append(makeContactRow(r,()=>openChat(r.id)));
 body.append(list);
 if(!employee()){
  sectionHeading('Управление');
  menuLink('Структура рабочих чатов','Команда, группы и права участников','users',()=>openSubSheet('team-structure','staff'));
  menuLink('Подключить сотрудника','Подготовить приглашение','users',()=>openSubSheet('invite','staff'));
  menuLink('Карточки сотрудников','История и достижения','users',()=>{
   closeSheet();
   window.SEYVEO_UNIFIED_TASKS?.openPeople?.('team');
  });
 }
}
function showInvite(){
 body.append(node('p','sv-inbox-hint','Реальная выдача доступа ещё не подключена. Здесь можно подготовить текст приглашения, но он не создаёт учётную запись и не отправляет сообщение сотруднику.'));
 const form=node('form','sv-inbox-group-form');
 const field=node('label','sv-inbox-field-label','Имя сотрудника');
 const input=node('input','sv-inbox-text-input');input.required=true;input.maxLength=65;input.autocomplete='off';input.placeholder='Имя сотрудника';field.append(input);form.append(field);
 const roleField=node('label','sv-inbox-field-label','Должность');
 const role=node('input','sv-inbox-text-input');role.required=true;role.maxLength=85;role.placeholder='Например, кассир';roleField.append(role);form.append(roleField);
 const create=node('button','sv-inbox-submit','Подготовить текст');create.type='submit';form.append(create);
 const result=node('section','sv-inbox-invite-result');result.hidden=true;
 const message=node('p','sv-inbox-invite-copy');
 const copy=button('Скопировать текст','check',async()=>{
  const text=message.textContent||'';
  try{await navigator.clipboard.writeText(text);copy.querySelector('span').textContent='Скопировано'}catch{
   const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(message);selection?.removeAllRanges();selection?.addRange(range);
   copy.querySelector('span').textContent='Выделено — скопируйте вручную';
  }
 },'sv-inbox-invite-copy-action');
 result.append(node('strong',null,'Черновик для отправки вручную'),message,copy);
 form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!form.reportValidity())return;
  const person=input.value.trim(),job=role.value.trim();
  if(!person||!job)return;
  message.textContent='Здравствуйте, '+person+'! Готовим ваше подключение к рабочему пространству SEYVEO на должность «'+job+'». Когда защищённые приглашения станут доступны, руководитель выдаст вам отдельный доступ и согласует права.';
  result.hidden=false;copy.querySelector('span').textContent='Скопировать текст';
 });
 body.append(form,result);
}
function showArchives(){
 const archived=allRooms().filter(r=>roomState(r.id).archived);
 if(!archived.length){body.append(node('p','sv-inbox-hint','В архиве пока нет переписок.'));return}
 archived.forEach(r=>{
  const row=node('div','sv-inbox-archive-row');
  const open=button(r.label,'chevron',()=>openChat(r.id),'sv-inbox-contact-row');
  const restore=button('Вернуть','archive',()=>{updateRoom(r.id,'archived',false);showArchivesAgain()},'sv-inbox-restore');
  row.append(open,restore);body.append(row);
 });
}
function showArchivesAgain(){body.replaceChildren();showArchives()}
function showRoomActions(id){
 const r=roomInfo(id);if(!r){closeSheet();return}
 title.textContent=r.label;
 const st=roomState(id);
 const actions=[
  [st.pinned?'Открепить':'Закрепить','pin',()=>updateRoom(id,'pinned',!st.pinned)],
  [st.muted?'Включить уведомления':'Без звука','bell',()=>updateRoom(id,'muted',!st.muted)],
  [st.unread?'Отметить прочитанным':'Отметить непрочитанным','check',()=>updateRoom(id,'unread',!st.unread)],
  [st.archived?'Вернуть из архива':'В архив','archive',()=>updateRoom(id,'archived',!st.archived)]
 ];
 for(const [label,icon,fn] of actions){body.append(button(label,icon,()=>{fn();closeSheet()},'sv-inbox-action-row'))}

 if(!employee()){
  const del=button('Очистить переписку','trash',()=>{
   if(!window.confirm('Удалить сообщения этой переписки из локального хранилища? Отменить нельзя.'))return;
   const ok=window.SEYVEO_BUSINESS_COMMAND?.clearLocalRoom?.(id);
   if(ok){closeSheet();decorateRows()}
  },'sv-inbox-action-row is-destructive');
  body.append(del);
 }
}
function syncProfile(){
 updateHeaderAvatar();
 updateProfileMute();
}
document.querySelector('#svcpRoomInfo .sv-inbox-profile-settings')?.remove();
// Reuse the same stored mute preference from inbox actions and notification settings.
// Tapping a person's name opens this profile, where the room's sound is editable.
const roomProfile=$('svcpRoomInfo');
const roomProfileActions=roomProfile?.querySelector('.svcp-room-profile-actions');
const roomMute=button('Звук сообщений','bell',()=>{
 const id=$('svcpConversation')?.dataset.roomId;
 if(!roomInfo(id))return;
 updateRoom(id,'muted',!roomState(id).muted);
},'sv-inbox-profile-mute sv-inbox-profile-mute-row');
const roomMuteStatus=node('small','sv-inbox-profile-mute-status');
roomMute.append(roomMuteStatus);
roomMute.hidden=true;
roomProfileActions?.insertAdjacentElement('afterend',roomMute);
function updateProfileMute(){
 if(!roomProfileActions?.isConnected)return;
 const id=$('svcpConversation')?.dataset.roomId,r=roomInfo(id);
 const available=!!r&&r.person!=='sayvi';
 roomMute.hidden=!available;
 if(!available)return;
 const muted=roomState(id).muted===true;
 roomMute.setAttribute('aria-pressed',String(muted));
 roomMute.setAttribute('aria-label',(muted?'Включить':'Отключить')+' звук в чате '+r.label);
 roomMuteStatus.textContent=muted?'Без звука':'Включён';
}
if(roomProfile)new MutationObserver(updateProfileMute).observe(roomProfile,{attributes:true,attributeFilter:['hidden']});

$('svcpConversationHeading')?.addEventListener('click',()=>requestAnimationFrame(syncProfile));
function closeSwipe(){if(swipeOpen){swipeOpen.classList.remove('is-swiped');swipeOpen=null}}
function attachRow(row){
 const id=row.dataset.svcpRoomId;if(!id||row.parentElement?.classList.contains('sv-inbox-row-shell'))return;
 const wrap=node('div','sv-inbox-row-shell');wrap.dataset.roomId=id;
 const actions=node('div','sv-inbox-row-quick');
 const archive=button('Архив','archive',()=>{updateRoom(id,'archived',true);closeSwipe()},'sv-inbox-quick-archive');
 const more=button('Ещё','dots',()=>{closeSwipe();openSheet('room',id)},'sv-inbox-quick-more');
 actions.append(archive,more);row.before(wrap);wrap.append(actions,row);
 let start=null,blocked=false;
 row.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;start={x:e.touches[0].clientX,y:e.touches[0].clientY};blocked=false;clearTimeout(holdTimer);
  holdTimer=setTimeout(()=>{if(start&&!blocked){blocked=true;openSheet('room',id)}},520);
 },{passive:true});
 row.addEventListener('touchmove',e=>{if(!start)return;if(Math.abs(e.touches[0].clientX-start.x)>12||Math.abs(e.touches[0].clientY-start.y)>12)clearTimeout(holdTimer)},{passive:true});
 row.addEventListener('touchend',e=>{
  clearTimeout(holdTimer);if(!start)return;
  const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;start=null;
  if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.25){blocked=true;e.preventDefault();if(dx<0){closeSwipe();wrap.classList.add('is-swiped');swipeOpen=wrap}else closeSwipe()}
 },{passive:false});
 row.addEventListener('touchcancel',()=>{clearTimeout(holdTimer);start=null},{passive:true});
 row.addEventListener('contextmenu',e=>{e.preventDefault();openSheet('room',id)});
 row.addEventListener('click',e=>{if(blocked){e.preventDefault();e.stopImmediatePropagation();blocked=false;return}if(swipeOpen){e.preventDefault();e.stopImmediatePropagation();closeSwipe();return}
  if(roomState(id).unread){prefs.rooms[id]={...roomState(id),unread:false};savePrefs();syncLocalChatBadge()}
 },true);
}
function decorateRows(){
 if(processing)return;processing=true;
 try{
  screen.classList.add('sv-inbox-compact');
  screen.classList.remove('sv-inbox-no-preview');
  const rows=[...list.querySelectorAll(':scope > .svcp-directory-item')];
  for(const row of rows)attachRow(row);
  for(const wrap of list.querySelectorAll(':scope > .sv-inbox-row-shell')){
   const st=roomState(wrap.dataset.roomId);
   wrap.classList.toggle('is-archived',!!st.archived);
   wrap.classList.toggle('is-pinned',!!st.pinned);
   wrap.classList.toggle('is-unread',!!st.unread&&prefs.showUnread!==false);
   wrap.classList.toggle('is-muted',!!st.muted);
   wrap.style.order=st.pinned?'-1':'0';
   const row=wrap.querySelector('.svcp-directory-item');
   if(!row)continue;
   const avatar=row.querySelector('.svcp-directory-avatar');
   if(avatar&&row.dataset.svcpRoomKind==='groups'&&!avatar.dataset.svInboxGlyph){
    const id=wrap.dataset.roomId;
    avatar.innerHTML=svg(id==='general'?'messages':id==='docs'?'file':'users');
    avatar.dataset.svInboxGlyph='true';
   }
   // No leader-owned avatar overrides are drawn on colleagues' identities.
   if(avatar?.classList.contains('sv-inbox-avatar-custom'))clearAvatarStyle(avatar);
   // No tiny dots in the time column: mute/pin state is accessible from
   // the conversation actions and preserved in its local settings.
   row.querySelector('.sv-inbox-row-badges')?.remove();
   row.setAttribute('aria-label',(roomInfo(wrap.dataset.roomId)?.label||'Чат')+(st.unread?', не прочитан':'')+(st.muted?', без звука':''));
  }
  updateHeaderAvatar();
 }finally{processing=false}
}
let scheduled=false;
const observer=new MutationObserver(()=>{
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;decorateRows()});
});
observer.observe(list,{childList:true});
const conversation=$('svcpConversation');
// One vertical baseline: Back is screen-relative, the actual call pair
// is conversation-relative. Resolve the offset once per real layout change.
let callAlignFrame=0;
const alignCallControls=()=>{
 callAlignFrame=0;
 if(screen.hidden||screen.dataset.view!=='room')return;
 const back=$('svcpWorkChatBack'),pair=conversation?.querySelector('.svcp-call-actions');
 const parent=pair?.offsetParent;
 if(!back||!pair||!parent||!back.getClientRects().length||!pair.getClientRects().length)return;
 const target=back.getBoundingClientRect().top-parent.getBoundingClientRect().top-parent.clientTop+parent.scrollTop;
 const top=Math.round(target*100)/100+'px';
 if(pair.style.getPropertyValue('--svcp-call-control-top')!==top)
  pair.style.setProperty('--svcp-call-control-top',top);
};
const scheduleCallAlignment=()=>{
 if(!callAlignFrame)callAlignFrame=requestAnimationFrame(alignCallControls);
};
new MutationObserver(scheduleCallAlignment).observe(screen,{attributes:true,attributeFilter:['hidden','data-view','style']});
if(conversation)new MutationObserver(scheduleCallAlignment).observe(conversation,{attributes:true,attributeFilter:['hidden','data-room-id','data-chat-wallpaper']});
if(typeof ResizeObserver==='function'){
 const callAlignObserver=new ResizeObserver(scheduleCallAlignment);
 for(const node of [screen,conversation,$('svcpWorkChatBack')])if(node)callAlignObserver.observe(node);
}
window.addEventListener('resize',scheduleCallAlignment,{passive:true});
window.visualViewport?.addEventListener('resize',scheduleCallAlignment,{passive:true});
window.addEventListener('pageshow',scheduleCallAlignment);
scheduleCallAlignment();
if(conversation)new MutationObserver(updateHeaderAvatar).observe(conversation,{attributes:true,attributeFilter:['data-room-id']});
decorateRows();
document.addEventListener('pointerdown',e=>{
 if(!menu.hidden&&!menu.contains(e.target)&&!menuButton.contains(e.target))closeMenu();
 if(swipeOpen&&!swipeOpen.contains(e.target))closeSwipe();
},true);
screen.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 if(!overlay.hidden){e.preventDefault();closeSheet()}
 else if(!menu.hidden){e.preventDefault();closeMenu();menuButton.focus({preventScroll:true})}
 else closeSwipe();
});
screen.addEventListener('click',e=>{
 if(e.target.closest('#svcpWorkChatBack,#svcpConversationBack,#svcpConversationList .svcp-directory-item'))closeMenu();
});
window.addEventListener('seyveo:work-chat-closing',()=>{closeMenu();closeSheet();closeSwipe()});
window.addEventListener('seyveo:work-role-preview',()=>{closeMenu();closeSheet();closeSwipe();requestAnimationFrame(decorateRows);syncLocalChatBadge()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncLocalChatBadge()});
window.addEventListener('pageshow',syncLocalChatBadge);
syncLocalChatBadge();
})();