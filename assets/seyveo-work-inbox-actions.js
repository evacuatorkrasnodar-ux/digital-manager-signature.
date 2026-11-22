/* SEYVEO · Chats: compact inbox actions, contacts and local preferences.
   Additive UI over the existing work-chat engine. No simulated delivery. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const screen=$('svcpWorkChatScreen'),list=$('svcpConversationList'),header=screen?.querySelector('.svcp-work-chat-header');
const history=$('svcpWorkHistoryTop');
if(!screen||!list||!header||!history)return;
const KEY='seyveo-workchat-inbox-layout-v1';
const defaults={compact:false,previews:true,rooms:{}};
let prefs;
try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');prefs={...defaults,...(raw&&typeof raw==='object'?raw:{}),rooms:(raw&&typeof raw.rooms==='object'&&!Array.isArray(raw.rooms)?raw.rooms:{})}}catch{prefs={...defaults}}
let sheetType='',activeRoom='',holdTimer=null,swipeOpen=null,processing=false;
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
function employee(){return window.SEYVEO_PREVIEW?.isEmployee?.()===true}
function openChat(id){closeSheet();closeMenu();window.SEYVEO_BUSINESS_COMMAND?.showChat?.(id)}
const menuButton=node('button','sv-inbox-options-button');
menuButton.type='button';menuButton.id='svcpInboxOptionsTop';
menuButton.setAttribute('aria-label','Настройки и действия с чатами');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-controls','svcpInboxMenu');
menuButton.innerHTML=svg('dots');
history.hidden=true;history.setAttribute('tabindex','-1');history.setAttribute('aria-hidden','true');history.classList.add('sv-inbox-history-proxy');
header.append(menuButton);
const menu=node('div','sv-inbox-popover');menu.id='svcpInboxMenu';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','Действия с сообщениями');
const menuItems=[['Новый чат','pen','new'],['Контакты','users','contacts'],['Создать группу','group','group'],['Настроить список','sliders','settings'],['Архив','archive','archives'],['История','clock','history']];
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
const back=button('','back',()=>closeSheet(),'sv-inbox-sheet-back');
back.setAttribute('aria-label','Назад к сообщениям');
const title=node('strong');title.id='svInboxSheetTitle';
top.append(back,title,node('span'));
const body=node('div','sv-inbox-sheet-body');
panel.append(node('span','sv-inbox-sheet-grab'),top,body);
overlay.append(backdrop,panel);screen.append(overlay);
backdrop.addEventListener('click',()=>closeSheet());
function closeSheet(){overlay.hidden=true;sheetType='';activeRoom=''}
function viewTitle(type){return {new:'Новое сообщение',contacts:'Контакты',group:'Новая группа',settings:'Отображение чатов',archives:'Архив',room:'Действия с чатом'}[type]||'Сообщения'}
function openSheet(type,id=''){
 closeMenu();sheetType=type;activeRoom=id;
 title.textContent=viewTitle(type);body.replaceChildren();overlay.hidden=false;
 if(type==='contacts'||type==='new')showContacts(type);
 else if(type==='group')showGroupForm();
 else if(type==='settings')showSettings();
 else if(type==='archives')showArchives();
 else if(type==='room')showRoomActions(id);
 back.focus({preventScroll:true});
}
function showContacts(type){
 const names=allRooms().filter(r=>r.kind==='personal'&&(!employee()||['dm-elena','dm-sayvi'].includes(r.id)));
 if(type==='new')body.append(node('p','sv-inbox-hint','Выберите собеседника'));
 names.forEach(r=>{
  const b=button(r.label,'chevron',()=>openChat(r.id),'sv-inbox-contact-row');
  const ico=node('span','sv-inbox-contact-avatar',r.label.slice(0,1));if(r.id==='dm-sayvi')ico.classList.add('is-sayvi');
  b.prepend(ico);
  if(r.hint)b.querySelector('span:not(.sv-inbox-contact-avatar)')?.append(node('small',null,r.hint.split(' · ')[0]));
  body.append(b);
 });
}
function showGroupForm(){
 if(employee()){body.append(node('p','sv-inbox-hint','Создание рабочих групп доступно руководителю.'));return}
 const form=node('form','sv-inbox-group-form');
 const label=node('label','sv-inbox-field-label','Название группы');
 const input=node('input','sv-inbox-text-input');input.required=true;input.maxLength=55;input.placeholder='Например, Новая смена';input.setAttribute('aria-label','Название новой группы');
 label.append(input);form.append(label,node('p','sv-inbox-hint','Участники группы'));
 const people=[['elena','Елена · кассир'],['anna','Анна · старший продавец'],['mikhail','Михаил · продавец']];
 people.forEach(([id,name])=>{
  const line=node('label','sv-inbox-check-row');const check=node('input');check.type='checkbox';check.name='participant';check.value=id;
  if(id==='elena')check.checked=true;line.append(check,node('span',null,name));form.append(line);
 });
 const submit=node('button','sv-inbox-submit','Создать группу');submit.type='submit';form.append(submit);
 const foot=node('p','sv-inbox-hint','Группа и сообщения сохраняются только в этом браузере.');form.append(foot);
 form.addEventListener('submit',e=>{
  e.preventDefault();const name=input.value.trim(),members=[...form.querySelectorAll('input[name="participant"]:checked')].map(c=>c.value);
  if(!name||!members.length){input.focus();return}
  const id=window.SEYVEO_BUSINESS_COMMAND?.createLocalGroup?.(name,members);
  if(id)openChat(id);else body.append(node('p','sv-inbox-hint','Не удалось сохранить группу. Проверьте локальное хранилище.'));
 });
 body.append(form);
}
function showSettings(){
 const items=[['compact','Компактный список','Больше разговоров на одном экране'],['previews','Показывать текст сообщений','Последнее сообщение под именем']];
 for(const [key,text,help] of items){
  const row=node('label','sv-inbox-toggle-row');const copy=node('span');copy.append(node('strong',null,text),node('small',null,help));
  const control=node('input');control.type='checkbox';control.checked=!!prefs[key];control.addEventListener('change',()=>{
   prefs[key]=control.checked;savePrefs();decorateRows();
  });
  row.append(copy,control);body.append(row);
 }
 body.append(node('p','sv-inbox-hint','Параметры отображения действуют только на этом устройстве.'));
}
function showArchives(){
 const archived=allRooms().filter(r=>roomState(r.id).archived&&(!employee()||['general','team','docs','dm-elena','dm-sayvi'].includes(r.id)));
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
 const r=$('svcpConversation')?.dataset.roomId;
 const toggle=$('svcpRoomProfileMute');
 if(!toggle||!r)return;
 const st=roomState(r);
 toggle.querySelector('.sv-inbox-mute-text').textContent=st.muted?'Включить уведомления':'Без звука';
 toggle.setAttribute('aria-pressed',String(!!st.muted));
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
   wrap.classList.toggle('is-unread',!!st.unread);
   wrap.classList.toggle('is-muted',!!st.muted);
   wrap.style.order=st.pinned?'-1':'0';
   const row=wrap.querySelector('.svcp-directory-item');
   if(!row)continue;
   let badges=row.querySelector('.sv-inbox-row-badges');
   if(!badges){badges=node('span','sv-inbox-row-badges');row.querySelector('.svcp-directory-item-head')?.append(badges)}
   badges.replaceChildren();
   if(st.pinned)badges.append(node('span','sv-inbox-mini-pin','•'));
   if(st.muted)badges.append(node('span','sv-inbox-mini-mute','◦'));
   row.setAttribute('aria-label',(roomInfo(wrap.dataset.roomId)?.label||'Чат')+(st.unread?', не прочитан':'')+(st.muted?', без звука':''));
  }
 }finally{processing=false}
}
let scheduled=false;
const observer=new MutationObserver(()=>{
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;decorateRows()});
});
observer.observe(list,{childList:true});
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