/* SEYVEO · Silk Swipe v1.
   Flat native iOS-friendly horizontal favorites. No extra sound engine.
   Personal preferences only; no notebook/calendar data is duplicated. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const rail=$('assistantQuickrail'),track=$('assistantQuickTrack'),pips=$('assistantQuickPages');
const dialog=$('assistantQuickSettings'),list=$('assistantQuickSettingsList');
if(!rail||!track||!pips||!dialog||!list)return;
const KEY='seyveo-assistant-quick-actions-v1',MAX=8;
const DEFAULT=['event','note','history','notes'];
const ITEMS=[
 ['event','Встреча','Создать событие','<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16M12 12.5v5M9.5 15h5"/>'],
 ['note','Заметка','Написать заметку','<path d="M6 3.5h9l3 3V21H6zM15 3.5V7h3M9 11h6M9 15h6"/>'],
 ['history','История','Обращения к помощнику','<path d="M5 5v5h5M5.5 10A7.5 7.5 0 1 1 5 15M12 7.8V12l3 2"/>'],
 ['notes','Мои записи','Открыть блокнот','<path d="M7 4.5h11v15H7zM10 8h5M10 12h5M10 16h3M4 7v12"/>'],
 ['calendar','Календарь','События и планы','<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16M8 14h2M13 14h2"/>'],
 ['world','Мой мир','Люди и важные даты','<circle cx="12" cy="12" r="8.3"/><path d="M3.7 12h16.6M12 3.7c-4.5 4.5-4.5 12.1 0 16.6M12 3.7c4.5 4.5 4.5 12.1 0 16.6"/>'],
 ['health','Здоровье','Личные показатели','<path d="M3 12h4l2.5-5 4.2 10 2.3-5H21"/>'],
 ['care','Забота','Личный уход и записи','<path d="M20.5 8.6c0 4.8-8.5 10.6-8.5 10.6S3.5 13.4 3.5 8.6A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 8.5 1.4Z"/>'],
 ['tasks','Дела','Поручения управляющего','<path d="M9 6h11M9 12h11M9 18h11M4 6h.5M4 12h.5M4 18h.5"/>'],
 ['picture','Картина','Показатели бизнеса','<path d="M4.5 19V14M9.5 19V9M14.5 19v-6M19.5 19V5"/>']
];
const byId=new Map(ITEMS.map(([id,name,description,icon])=>[id,{id,name,description,icon}]));
function load(){
 try{
  const raw=localStorage.getItem(KEY);
  if(raw===null)return DEFAULT.slice();
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed))return DEFAULT.slice();
  const valid=[...new Set(parsed.filter(id=>typeof id==='string'&&byId.has(id)))].slice(0,MAX);
  return valid.length?valid:DEFAULT.slice();
 }catch{return DEFAULT.slice()}
}
let selected=load();
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(selected));return true}catch{return false}
}
function feedback(){
 // Existing Silk Touch respects the user's sound preference. iOS browsers
 // cannot promise hardware haptics; never fake vibrations or emit loud audio.
 document.dispatchEvent(new Event('seyveo:silk-touch'));
}
function closeComposer(){
 if(!$('ask').hidden)$('hideInput').click();
}
function openSpace(id){
 const entry=$('calendarSpaces')?.querySelector('[data-calendar-space="'+id+'"]');
 if(entry)entry.click();
}
function perform(id){
 if(id==='note'){
  if($('ask').dataset.composerMode==='notes')$('composerExpandManual').click();
  else{
   $('composerModeNotes').click();
   // Keep the existing keyboard workflow: choosing Note must not require
   // another tap in the text field or induce page scrolling on iPhone.
   requestAnimationFrame(()=>$('question').focus({preventScroll:true}));
  }
  return;
 }
 if(id==='event'){
  closeComposer();
  location.hash='calendar';
  requestAnimationFrame(()=>{if(location.hash==='#calendar')$('calendarAdd')?.click()});
  return;
 }
 if(id==='history'){
  closeComposer();window.SEYVEO_CHAT_HISTORY?.open();return;
 }
 if(id==='notes'){
  closeComposer();window.dispatchEvent(new Event('seyveo:notes-open'));return;
 }
 if(['world','health','care'].includes(id)){
  closeComposer();openSpace(id);return;
 }
 if(['calendar','tasks','picture'].includes(id)){
  closeComposer();if(location.hash==='#'+id)window.dispatchEvent(new Event('hashchange'));
  else location.hash=id;
 }
}
function buttonFor(id){
 const item=byId.get(id),button=document.createElement('button');
 button.className='assistant-quick-item';button.type='button';
 button.dataset.quickAction=id;button.setAttribute('aria-label',item.description);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 svg.innerHTML=item.icon;const label=document.createElement('span');
 label.textContent=item.name;button.append(svg,label);return button;
}
function updatePips(){
 const count=Math.max(1,selected.length-2);
 const width=track.firstElementChild?.getBoundingClientRect().width||track.clientWidth/3||1;
 const position=Math.min(count-1,Math.max(0,Math.round(track.scrollLeft/width)));
 pips.replaceChildren();pips.hidden=count<=1;
 if(count<=1)return;
 for(let i=0;i<count;i++){
  const el=document.createElement('span');el.className='assistant-quick-dot';
  if(i===position)el.classList.add('is-current');
  pips.append(el);
 }
}
function render(){
 track.replaceChildren(...selected.map(buttonFor));
 rail.dataset.count=String(selected.length);
 track.scrollLeft=0;requestAnimationFrame(updatePips);
}
let gesture=null,suppressSwipeClick=false;
track.addEventListener('click',event=>{
 if(suppressSwipeClick){suppressSwipeClick=false;event.preventDefault();return}
 const button=event.target.closest('button[data-quick-action]');
 if(!button)return;
 feedback();perform(button.dataset.quickAction);
});
track.addEventListener('pointerdown',event=>{
 suppressSwipeClick=false;
 if(event.pointerType==='mouse')return;
 gesture={x:event.clientX,y:event.clientY};
});
track.addEventListener('pointerup',event=>{
 if(!gesture)return;
 const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
 if(Math.abs(dx)>30&&Math.abs(dx)>Math.abs(dy)*1.4){
  suppressSwipeClick=true;
  feedback();
  // iOS may deliver a click to the swiped element after touchend.
  setTimeout(()=>{suppressSwipeClick=false},350);
 }
 gesture=null;
});
track.addEventListener('pointercancel',()=>{gesture=null});
track.addEventListener('scroll',()=>requestAnimationFrame(updatePips),{passive:true});
track.addEventListener('keydown',event=>{
 if(event.key!=='ArrowRight'&&event.key!=='ArrowLeft')return;
 event.preventDefault();
 const slot=track.firstElementChild?.getBoundingClientRect().width||100;
 track.scrollBy({left:slot*(event.key==='ArrowRight'?1:-1),behavior:'smooth'});
 feedback();
});
window.addEventListener('resize',updatePips);
function rowFor(item,chosen,index){
 const row=document.createElement('div');row.className='assistant-quick-setting-row';
 row.dataset.quickSetting=item.id;
 const labels=document.createElement('span');labels.className='assistant-quick-setting-label';
 const title=document.createElement('strong');title.textContent=item.name;
 const desc=document.createElement('small');desc.textContent=item.description;
 labels.append(title,desc);row.append(labels);
 const controls=document.createElement('span');controls.className='assistant-quick-setting-controls';
 const options=chosen
  ?[['up','↑','Поднять выше',index===0],['down','↓','Опустить ниже',index===selected.length-1],['remove','−','Убрать',selected.length===1]]
  :[['add','Добавить','Добавить в избранное',selected.length>=MAX]];
 for(const [type,sign,label,disabled] of options){
  const btn=document.createElement('button');btn.type='button';btn.textContent=sign;
  btn.dataset.quickEdit=type;btn.setAttribute('aria-label',label+': '+item.name);
  btn.disabled=disabled;controls.append(btn);
 }
 row.append(controls);return row;
}
function renderSettings(){
 list.replaceChildren();
 selected.forEach((id,index)=>list.append(rowFor(byId.get(id),true,index)));
 const others=ITEMS.filter(([id])=>!selected.includes(id));
 if(others.length){
  const label=document.createElement('p');label.textContent='Другие действия';
  label.className='assistant-quick-setting-section';list.append(label);
  for(const [id] of others)list.append(rowFor(byId.get(id),false,-1));
 }
}
$('openAssistantQuickSettings').addEventListener('click',()=>{
 $('assistantQuickSettingsStatus').textContent='';
 renderSettings();dialog.showModal();
});
$('assistantQuickSettingsClose').addEventListener('click',()=>dialog.close());
$('assistantQuickSettingsDone').addEventListener('click',()=>dialog.close());
$('assistantQuickSettingsDefault').addEventListener('click',()=>{
 selected=DEFAULT.slice();const saved=save();render();renderSettings();
 $('assistantQuickSettingsStatus').textContent=saved?'Стартовый набор восстановлен.':'Настройка не сохранилась на устройстве.';
 feedback();
});
list.addEventListener('click',event=>{
 const btn=event.target.closest('button[data-quick-edit]');if(!btn)return;
 const id=btn.closest('[data-quick-setting]')?.dataset.quickSetting;
 if(!byId.has(id))return;
 const direction=btn.dataset.quickEdit,index=selected.indexOf(id);
 if(direction==='add'&&index<0&&selected.length<MAX)selected.push(id);
 else if(direction==='remove'&&index>=0&&selected.length>1)selected.splice(index,1);
 else if(direction==='up'&&index>0)[selected[index-1],selected[index]]=[selected[index],selected[index-1]];
 else if(direction==='down'&&index>=0&&index<selected.length-1)[selected[index],selected[index+1]]=[selected[index+1],selected[index]];
 else return;
 const saved=save();render();renderSettings();
 $('assistantQuickSettingsStatus').textContent=saved?'Изменения сохранены · '+selected.length+' действий':'Изменения не удалось сохранить на устройстве.';
 feedback();
});
render();
})();
