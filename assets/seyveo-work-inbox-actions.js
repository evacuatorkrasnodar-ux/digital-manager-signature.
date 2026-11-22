/* SEYVEO · Chats: compact inbox actions, contacts and local preferences.
   Additive UI over the existing work-chat engine. No simulated delivery. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const screen=$('svcpWorkChatScreen'),list=$('svcpConversationList'),header=screen?.querySelector('.svcp-work-chat-header');
const history=$('svcpWorkHistoryTop');
if(!screen||!list||!header||!history)return;
const KEY='seyveo-workchat-inbox-layout-v1';
const defaults={compact:false,previews:true,showUnread:true,rooms:{}};
let prefs;
try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');prefs={...defaults,...(raw&&typeof raw==='object'?raw:{}),rooms:(raw&&typeof raw.rooms==='object'&&!Array.isArray(raw.rooms)?raw.rooms:{})}}catch{prefs={...defaults}}
let sheetType='',activeRoom='',holdTimer=null,swipeOpen=null,processing=false;
const sheetStack=[];
const icons={
 dots:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
 pen:'<path d="M12 5.5H5.5A2.5 2.5 0 0 0 3 8v10.5A2.5 2.5 0 0 0 5.5 21h11A2.5 2.5 0 0 0 19 18.5V12M13 9l7-7 2 2-7 7-4 1z"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M17 5.8a3 3 0 0 1 0 5.5M17 14a4.5 4.5 0 0 1 3.5 4.5V20"/>',
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
function updateRoom(id,prop,value){prefs.rooms[id]={...roomState(id),[prop]:value};savePrefs();decorateRows();syncProfile()}
/* Local avatar editing: Apple-style photo, monogram and emoji.
   No upload, no claim of changing colleagues' accounts or the SEYVEO assistant. */
const AVATAR_COLORS=['#536f84','#4f8574','#7d78a1','#b27788','#be8a54','#606b79'];
const AVATAR_EMOJIS=['😊','😎','🌿','✨','💼','🐱','❤️','🎨'];
function safeAvatar(spec){
 if(!spec||typeof spec!=='object')return null;
 const kind=['monogram','emoji','photo'].includes(spec.kind)?spec.kind:'monogram';
 const color=AVATAR_COLORS.includes(spec.color)?spec.color:AVATAR_COLORS[0];
 const initials=[...String(spec.initials||'Я')].slice(0,2).join('').toLocaleUpperCase('ru-RU');
 const emoji=[...String(spec.emoji||'😊')].slice(0,2).join('');
 const image=typeof spec.image==='string'&&/^data:image\\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(spec.image)&&spec.image.length<320000?spec.image:'';
 return {kind:kind==='photo'&&!image?'monogram':kind,color,initials,emoji,image};
}
function paintAvatar(element,source){
 const spec=safeAvatar(source);
 if(!element||!spec)return;
 element.classList.add('sv-inbox-avatar-custom');
 element.dataset.svAvatarKind=spec.kind;
 element.style.setProperty('--sv-avatar-color',spec.color);
 element.style.setProperty('--sv-avatar-image',spec.kind==='photo'?'url("'+spec.image+'")':'none');
 element.textContent=spec.kind==='monogram'?(spec.initials||'Я'):spec.kind==='emoji'?spec.emoji:'';
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
 if(!target||!id||id==='dm-sayvi')return;
 const spec=roomState(id).avatar;
 if(spec)paintAvatar(target,spec);
 else if(target.classList.contains('sv-inbox-avatar-custom'))restoreAvatar(target,id);
}
function showAvatarEditor(id){
 const self=id==='self',info=self?null:roomInfo(id);
 if(!self&&(!info||info.person==='sayvi')){
  body.append(node('p','sv-inbox-hint','Фирменный значок Сэйви не изменяется.'));return;
 }
 const old=self?prefs.myProfile?.avatar:roomState(id).avatar;
 let draft=safeAvatar(old)||{
  kind:'monogram',color:AVATAR_COLORS[0],
  initials:String(self?(prefs.myProfile?.name||'Я'):(info?.label||'?')).trim().slice(0,1).toLocaleUpperCase('ru-RU'),
  emoji:'😊',image:''
 };
 const form=node('form','sv-inbox-avatar-editor');
 const previewWrap=node('div','sv-inbox-avatar-preview-wrap');
 const preview=node('span','sv-inbox-avatar-preview');
 preview.setAttribute('aria-hidden','true');
 const subtitle=node('p','sv-inbox-avatar-subtitle',self?'Ваш профиль':'Только для вас · '+info.label);
 previewWrap.append(preview,subtitle);
 form.append(previewWrap);
 let displayName=null,monogramInput=null;
 if(self){
  const nameLabel=node('label','sv-inbox-avatar-field');
  nameLabel.append(node('span',null,'Имя'));
  displayName=node('input','sv-inbox-text-input');
  displayName.type='text';displayName.maxLength=50;
  displayName.autocomplete='nickname';
  displayName.placeholder='Ваше имя';
  displayName.value=typeof prefs.myProfile?.name==='string'?prefs.myProfile.name:'';
  nameLabel.append(displayName);form.append(nameLabel);
 }
 const methods=node('div','sv-inbox-avatar-methods');
 methods.setAttribute('role','group');methods.setAttribute('aria-label','Тип аватара');
 const methodButtons=[];
 const panels=node('div','sv-inbox-avatar-customization');
 const monoPanel=node('div','sv-inbox-avatar-mode');
 const monoLabel=node('label','sv-inbox-avatar-field');
 monoLabel.append(node('span',null,'Буквы на аватаре'));
 monogramInput=node('input','sv-inbox-text-input');
 monogramInput.type='text';monogramInput.maxLength=2;
 monogramInput.placeholder='Р';
 monogramInput.value=draft.initials||'';
 monoLabel.append(monogramInput);monoPanel.append(monoLabel);
 const emojiPanel=node('div','sv-inbox-avatar-mode');
 const emojiGrid=node('div','sv-inbox-avatar-emoji-grid');
 emojiGrid.setAttribute('role','group');emojiGrid.setAttribute('aria-label','Выберите эмодзи');
 const emojiButtons=[];
 for(const emoji of AVATAR_EMOJIS){
  const b=node('button','sv-inbox-avatar-emoji',emoji);b.type='button';
  b.setAttribute('aria-label','Эмодзи '+emoji);
  b.addEventListener('click',()=>{draft.kind='emoji';draft.emoji=emoji;draw()});
  emojiButtons.push(b);emojiGrid.append(b);
 }
 emojiPanel.append(emojiGrid);
 const photoPanel=node('div','sv-inbox-avatar-mode');
 const photoLabel=node('label','sv-inbox-avatar-photo-select');
 photoLabel.append(node('span',null,'Выбрать фото из галереи'));
 const fileInput=node('input');
 fileInput.type='file';fileInput.accept='image/*';
 fileInput.setAttribute('aria-label','Загрузить фотографию аватара');
 photoLabel.append(fileInput);photoPanel.append(photoLabel);
 const monoButton=node('button','sv-inbox-avatar-method','Буквы');
 const emojiButton=node('button','sv-inbox-avatar-method','Эмодзи');
 const photoButton=node('button','sv-inbox-avatar-method','Фото');
 for(const [kind,b] of [['monogram',monoButton],['emoji',emojiButton],['photo',photoButton]]){
  b.type='button';b.addEventListener('click',()=>{
   if(kind==='photo'&&!draft.image){fileInput.click();return}
   draft.kind=kind;draw();
  });
  b.dataset.avatarMethod=kind;
  methodButtons.push(b);methods.append(b);
 }
 form.append(methods);
 panels.append(monoPanel,emojiPanel,photoPanel);
 form.append(panels);
 const palette=node('div','sv-inbox-avatar-palette');
 palette.setAttribute('role','group');palette.setAttribute('aria-label','Цвет фона');
 const swatches=[];
 for(const color of AVATAR_COLORS){
  const swatch=node('button','sv-inbox-avatar-swatch');swatch.type='button';
  swatch.style.setProperty('--sv-avatar-swatch',color);
  swatch.setAttribute('aria-label','Цвет '+color);
  swatch.addEventListener('click',()=>{draft.color=color;draw()});
  swatches.push(swatch);palette.append(swatch);
 }
 form.append(palette);
 const status=node('p','sv-inbox-avatar-status');
 status.setAttribute('role','status');
 const privacy=node('p','sv-inbox-hint','Фото и оформление хранятся только в этом браузере. Коллегам они не отправляются.');
 const actions=node('div','sv-inbox-avatar-actions');
 const reset=node('button','sv-inbox-avatar-reset','Сбросить');reset.type='button';
 const save=node('button','sv-inbox-submit','Сохранить');save.type='submit';
 actions.append(reset,save);
 form.append(status,privacy,actions);
 function draw(){
  const normalized=safeAvatar(draft);
  if(normalized){draft=normalized;paintAvatar(preview,draft)}
  for(const button of methodButtons)
   button.setAttribute('aria-pressed',String(button.dataset.avatarMethod===draft.kind));
  for(const b of emojiButtons)b.setAttribute('aria-pressed',String(b.textContent===draft.emoji));
  for(let i=0;i<swatches.length;i++)
   swatches[i].setAttribute('aria-pressed',String(AVATAR_COLORS[i]===draft.color));
  monoPanel.hidden=draft.kind!=='monogram';
  emojiPanel.hidden=draft.kind!=='emoji';
  photoPanel.hidden=draft.kind!=='photo';
  palette.hidden=draft.kind==='photo';
 }
 monogramInput.addEventListener('input',()=>{
  draft.kind='monogram';draft.initials=[...monogramInput.value.trim()].slice(0,2).join('').toLocaleUpperCase('ru-RU');draw();
 });
 fileInput.addEventListener('change',()=>{
  const file=fileInput.files?.[0];if(!file)return;
  if(!file.type.startsWith('image/')||file.size>8*1024*1024){
   status.textContent='Выберите изображение размером до 8 МБ.';fileInput.value='';return;
  }
  status.textContent='Подготавливаю фото…';save.disabled=true;
  const url=URL.createObjectURL(file),photo=new Image();
  const cleanup=()=>{URL.revokeObjectURL(url);fileInput.value='';save.disabled=false};
  photo.onload=()=>{
   try{
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');
    const w=photo.naturalWidth,h=photo.naturalHeight;
    if(!w||!h)throw new Error('image');
    const side=Math.min(w,h);
    ctx.drawImage(photo,(w-side)/2,(h-side)/2,side,side,0,0,256,256);
    const data=canvas.toDataURL('image/jpeg',.77);
    if(data.length>320000)throw new Error('size');
    draft.image=data;draft.kind='photo';status.textContent='';draw();
   }catch{status.textContent='Не удалось подготовить фото. Попробуйте другое изображение.'}
   cleanup();
  };
  photo.onerror=()=>{status.textContent='Формат фото не поддерживается этим браузером.';cleanup()};
  photo.src=url;
 });
 function persist(next){
  const previous=JSON.stringify(prefs);
  if(self)prefs.myProfile={name:displayName.value.trim().slice(0,50),avatar:next};
  else prefs.rooms[id]={...roomState(id),avatar:next};
  try{localStorage.setItem(KEY,JSON.stringify(prefs));return true}
  catch{
   try{prefs=JSON.parse(previous)}catch{}
   status.textContent='Не удалось сохранить: локальное хранилище заполнено.';
   return false;
  }
 }
 reset.addEventListener('click',()=>{
  if(!persist(null))return;
  if(self)delete prefs.myProfile;
  else delete prefs.rooms[id].avatar;
  savePrefs();decorateRows();closeSheet();
 });
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(save.disabled)return;
  if(draft.kind==='photo'&&!draft.image){status.textContent='Сначала выберите фотографию.';return}
  if(!persist(safeAvatar(draft)))return;
  decorateRows();closeSheet();
 });
 draw();body.append(form);
}
function employee(){return window.SEYVEO_PREVIEW?.isEmployee?.()===true}
function openChat(id){closeSheet();closeMenu();window.SEYVEO_BUSINESS_COMMAND?.showChat?.(id)}
const menuButton=node('button','sv-inbox-options-button');
menuButton.type='button';menuButton.id='svcpInboxOptionsTop';
menuButton.setAttribute('aria-label','Настройки и действия с чатами');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-controls','svcpInboxMenu');
menuButton.innerHTML=svg('dots');
history.hidden=true;history.setAttribute('tabindex','-1');history.setAttribute('aria-hidden','true');history.classList.add('sv-inbox-history-proxy');
header.append(menuButton);
const menu=node('div','sv-inbox-popover');menu.id='svcpInboxMenu';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','Действия с сообщениями');
const menuItems=[['Новый чат','pen','new'],['Новая группа','group','group'],['Сотрудники','users','staff'],['Имя и фото','users','my-avatar'],['Настройки сообщений','sliders','settings'],['Архив','archive','archives']];
for(const [label,icon,action] of menuItems){const b=button(label,icon,()=>chooseAction(action),'sv-inbox-menu-row');b.setAttribute('role','menuitem');menu.append(b)}
screen.append(menu);
function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false')}
function openMenu(){closeSheet();menu.hidden=false;menuButton.setAttribute('aria-expanded','true');menu.querySelector('button')?.focus({preventScroll:true})}
menuButton.addEventListener('click',()=>menu.hidden?openMenu():closeMenu());
function chooseAction(action){
 closeMenu();
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
panel.append(node('span','sv-inbox-sheet-grab'),top,body);
overlay.append(backdrop,panel);screen.append(overlay);
backdrop.addEventListener('click',()=>closeSheet());
function closeSheet(){overlay.hidden=true;sheetType='';activeRoom='';sheetStack.length=0}
function openSubSheet(type,parent){sheetStack.push({type:parent||sheetType,id:activeRoom});openSheet(type,'',true)}
function viewTitle(type){return {new:'Новое сообщение',staff:'Сотрудники',invite:'Подключить сотрудника',group:'Новая группа',settings:'Настройки сообщений','my-avatar':'Моё имя и фото','room-avatar':'Аватар чата',display:'Отображение',notifications:'Уведомления',appearance:'Тема',wallpapers:'Фон переписок',data:'История и данные',archives:'Архив',room:'Действия с чатом'}[type]||'Сообщения'}
function openSheet(type,id='',nested=false){
 if(!nested)sheetStack.length=0;
 closeMenu();sheetType=type;activeRoom=id;
 title.textContent=viewTitle(type);body.replaceChildren();overlay.hidden=false;
 overlay.classList.toggle('sv-inbox-sheet-notifications',type==='notifications');
 overlay.dataset.svInboxScreen=type;
 if(type==='new')showContacts(type);
 else if(type==='staff')showStaff();
 else if(type==='invite')showInvite();
 else if(type==='group')showGroupForm();
 else if(type==='settings')showSettings();
 else if(type==='my-avatar')showAvatarEditor('self');
 else if(type==='room-avatar')showAvatarEditor(id);
 else if(type==='notifications')showNotifications();
 else if(type==='archives')showArchives();
 else if(type==='room')showRoomActions(id);
 back.focus({preventScroll:true});
}
function makeContactRow(r,fn){
 const row=button(r.label,'chevron',fn,'sv-inbox-contact-row');
 row.dataset.svcpRoomPerson=r.person||'';
 const avatar=node('span','sv-inbox-contact-avatar',r.id==='dm-sayvi'?'':r.label.slice(0,1));
 if(r.id==='dm-sayvi')avatar.classList.add('is-sayvi','sv-sayvi-avatar');
 avatar.setAttribute('aria-hidden','true');
 row.prepend(avatar);
 if(r.person!=='sayvi')paintAvatar(avatar,roomState(r.id).avatar);
 const copy=row.querySelector('span:not(.sv-inbox-contact-avatar)');
 if(copy&&r.hint){
  const role=r.hint.split(' · ')[0].trim();
  if(role)copy.append(node('small',null,role));
 }
 return row;
}
function showContacts(){
 const names=allRooms().filter(r=>r.kind==='personal'&&(!employee()||['dm-elena','dm-sayvi'].includes(r.id)));
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
  const avatar=node('span','sv-inbox-contact-avatar',p.name.charAt(0));
  avatar.setAttribute('aria-hidden','true');
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
 menuLink('Моё имя и фото','Фото, эмодзи или монограмма на этом устройстве','users',()=>openSubSheet('my-avatar','settings'));
 sectionHeading('Темы чатов');
 body.append(makeChatWallpapers());
 sectionHeading('Сообщения');
 menuLink('Уведомления','Непрочитанные и тихие чаты','bell',()=>openSubSheet('notifications','settings'));
 sectionHeading('Список чатов');
 settingToggle('compact','Компактный список','Больше чатов на экране');
 settingToggle('previews','Предпросмотр','Текст последнего сообщения');
 sectionHeading('История');
 menuLink('История разговоров','Сообщения и поручения','clock',()=>{closeSheet();history.click()});
}
function showNotifications(){
 /* Compact iOS-like grouped settings. Labels and controls are connected;
    only existing local chat preferences are persisted. */
 function section(caption){
  const heading=node('h3','sv-inbox-notification-caption',caption);
  const group=node('div','sv-inbox-notification-group');
  body.append(heading,group);return group;
 }
 function iosSwitch(checked,label,handle){
  const control=node('input','sv-inbox-ios-switch');
  control.type='checkbox';
  control.checked=!!checked;
  control.setAttribute('aria-label',label);
  control.setAttribute('role','switch');
  control.addEventListener('change',()=>handle(control.checked));
  return control;
 }
 const display=section('В списке сообщений');
 const unread=node('label','sv-inbox-ios-row sv-inbox-ios-unread');
 const unreadCopy=node('span','sv-inbox-ios-copy');
 unreadCopy.append(node('strong',null,'Непрочитанные'),node('small',null,'Выделять в списке чатов'));
 unread.append(unreadCopy,iosSwitch(prefs.showUnread!==false,'Выделять непрочитанные',checked=>{
  prefs.showUnread=checked;savePrefs();decorateRows();
 }));
 display.append(unread);
 const quiet=section('Без звука');
 const allowed=allRooms().filter(r=>r.kind==='personal'&&r.person!=='sayvi'&&(!employee()||r.id==='dm-elena'));
 for(const r of allowed){
  const item=node('label','sv-inbox-ios-row sv-inbox-ios-person');
  const avatar=node('span','sv-inbox-ios-avatar',r.label.slice(0,1));
  avatar.setAttribute('aria-hidden','true');
  paintAvatar(avatar,roomState(r.id).avatar);
  const copy=node('span','sv-inbox-ios-copy');
  copy.append(node('strong',null,r.label));
  const control=iosSwitch(roomState(r.id).muted,'Без звука: '+r.label,checked=>updateRoom(r.id,'muted',checked));
  item.append(avatar,copy,control);quiet.append(item);
 }
 if(!allowed.length){
  quiet.append(node('p','sv-inbox-ios-empty','Нет доступных личных чатов'));
 }
}
function showData(){
 sectionHeading('Разные функции');
 menuLink('Архив','Скрытые из основного списка чаты; сообщения сохранены','archive',()=>openSubSheet('archives','data'));
 menuLink('История разговоров','Поиск и управление локальной историей сообщений и поручений','clock',()=>{
  closeSheet();history.click();
 });
 body.append(node('p','sv-inbox-hint','Архив не удаляет сообщения. История содержит разговоры и поручения, включая неархивные.'));
}
function showStaff(){
 const names=allRooms().filter(r=>r.kind==='personal'&&r.person!=='sayvi'&&(!employee()||r.id==='dm-elena'));
 sectionHeading('Команда');
 const list=node('div','sv-inbox-people-list');
 for(const r of names)list.append(makeContactRow(r,()=>openChat(r.id)));
 body.append(list);
 if(!employee()){
  sectionHeading('Управление');
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
 const archived=allRooms().filter(r=>roomState(r.id).archived&&(!employee()||['general','team','docs','dm-elena','dm-sayvi'].includes(r.id)||r.members?.includes('elena')));
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
 if(r.person!=='sayvi')body.append(button('Изменить аватар','users',()=>{
  sheetStack.push({type:'room',id});openSheet('room-avatar',id,true);
 },'sv-inbox-action-row'));
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
 const r=$('svcpConversation')?.dataset.roomId;
 const toggle=$('svcpRoomProfileMute');
 if(!toggle||!r)return;
 const st=roomState(r);
 toggle.querySelector('.sv-inbox-mute-text').textContent=st.muted?'Включить уведомления':'Без звука';
 toggle.setAttribute('aria-pressed',String(!!st.muted));
 updateHeaderAvatar();
}
const profileView=$('svcpRoomProfileViewSection');
if(profileView?.parentNode&&!$('svcpRoomProfileMute')){
 const section=node('section','svcp-room-profile-section sv-inbox-profile-settings');
 const control=button('Без звука','bell',()=>{
  const id=$('svcpConversation')?.dataset.roomId;if(id)updateRoom(id,'muted',!roomState(id).muted)
 },'sv-inbox-profile-mute');control.id='svcpRoomProfileMute';
 control.querySelector('span').className='sv-inbox-mute-text';
 section.append(control);profileView.parentNode.insertBefore(section,profileView);
 $('svcpConversationHeading')?.addEventListener('click',()=>requestAnimationFrame(syncProfile));
}
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
  if(roomState(id).unread){prefs.rooms[id]={...roomState(id),unread:false};savePrefs()}
 },true);
}
function decorateRows(){
 if(processing)return;processing=true;
 try{
  screen.classList.toggle('sv-inbox-compact',!!prefs.compact);
  screen.classList.toggle('sv-inbox-no-preview',!prefs.previews);
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
   if(avatar&&wrap.dataset.roomId!=='dm-sayvi'){
    if(st.avatar)paintAvatar(avatar,st.avatar);
    else if(avatar.classList.contains('sv-inbox-avatar-custom'))restoreAvatar(avatar,wrap.dataset.roomId,row);
   }
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
window.addEventListener('seyveo:work-role-preview',()=>{closeMenu();closeSheet();closeSwipe();requestAnimationFrame(decorateRows)});
})();