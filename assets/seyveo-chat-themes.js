/* SEYVEO / chat wallpapers · 2026-11-22
 * Per-room local visual preferences, not a messaging or AI transport.
 * No synthetic media or photo uploads: wallpaper presets are CSS only.
 */
(()=>{
'use strict';
if(window.SEYVEO_CHAT_THEMES)return;
const KEY='seyveo-chat-wallpaper-v1';
const allowed=['pearl','sky','evening'];
const themes=[
 {id:'pearl',name:'Белый',hint:'Наш основной стиль'},
 {id:'sky',name:'Небо',hint:'Мягкие облака и голубой'},
 {id:'evening',name:'Вечер',hint:'Лавандовые сумерки'}
];
const id=id=>document.getElementById(id);
const node=(tag,cls,txt)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(txt!==undefined)n.textContent=txt;
 return n;
};
function load(){
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||'{}');
  return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 }catch{return {}}
}
function chosen(key){
 const data=load();
 const own=data[key];
 if(allowed.includes(own))return own;
 // Chat settings have one default wallpaper; explicit room themes may override it.
 if(key.startsWith('work:')&&key!=='work:default'&&allowed.includes(data['work:default']))
  return data['work:default'];
 return 'pearl';
}
function setWorkDefault(value){
 if(!allowed.includes(value))return false;
 const data=load();
 // A new all-chat selection replaces earlier room-specific wallpaper choices.
 for(const key of Object.keys(data))if(key.startsWith('work:'))delete data[key];
 data['work:default']=value;
 try{localStorage.setItem(KEY,JSON.stringify(data))}catch{return false}
 const room=id('svcpConversation')?.dataset.roomId;
 if(room)applyRoom(room);
 window.dispatchEvent(new CustomEvent('seyveo:chat-wallpaper-default-changed',{detail:{value}}));
 return true;
}
function store(key,value){
 if(!allowed.includes(value))return false;
 const next={...load(),[key]:value};
 try{localStorage.setItem(KEY,JSON.stringify(next));return true}
 catch{return false}
}
function display(parent,active){
 parent.querySelectorAll('[data-chat-wallpaper]').forEach(btn=>{
  const is=btn.dataset.chatWallpaper===active;
  btn.setAttribute('aria-pressed',String(is));
  btn.classList.toggle('is-selected',is);
 });
 const caption=parent.querySelector('.sv-chat-theme-current');
 if(caption)caption.textContent=themes.find(x=>x.id===active)?.hint||'';
}
function createChoices(parent,onChange,active){
 const choices=node('div','sv-chat-theme-choices');
 choices.setAttribute('role','group');
 choices.setAttribute('aria-label','Выберите оформление переписки');
 themes.forEach(item=>{
  const button=node('button','sv-chat-theme-option');
  button.type='button';
  button.dataset.chatWallpaper=item.id;
  button.setAttribute('aria-label',item.name);
  button.setAttribute('aria-pressed',String(active===item.id));
  const sample=node('span','sv-chat-theme-preview sv-chat-theme-preview-'+item.id);
  sample.setAttribute('aria-hidden','true');
  sample.append(node('i','sv-chat-theme-sample-in'),node('i','sv-chat-theme-sample-out'));
  const label=node('span','sv-chat-theme-option-name',item.name);
  button.append(sample,label);
  button.addEventListener('click',()=>{
   if(onChange(item.id)===false)return;
   display(parent,item.id);
  });
  choices.append(button);
 });
 parent.append(choices);
 const caption=node('p','sv-chat-theme-current',themes.find(t=>t.id===active)?.hint||'');
 parent.append(caption);
 const explain=node('p','sv-chat-theme-auto','Цвета сообщений автоматически подбираются к фону');
 parent.append(explain);
}
function applyRoom(roomId){
 const conversation=id('svcpConversation');
 if(!conversation||!roomId)return;
 // Respect the user's actual chat background choice. Header glass
 // is drawn independently of the wallpaper, never by forcing a new theme.
 const theme=chosen('work:'+roomId);
 conversation.dataset.chatWallpaper=theme;
 const profile=id('svcpRoomChatThemeSection');
 if(profile)display(profile,theme);
}
function syncRoom(roomId){
 applyRoom(roomId);
}
function buildWork(){
 // The wallpaper selector belongs to Chat Settings, not the Info sheet.
 // Remove any previously injected duplicate; keep existing saved preferences.
 id('svcpRoomChatThemeSection')?.remove();
}
function applyFamily(){
 const panel=id('seyveoFamilyDialog');
 if(!panel)return;
 const theme=chosen('family:main');
 panel.dataset.chatWallpaper=theme;
 if(familySheet)display(familySheet,theme);
}
let familySheet=null;
let familyTrigger=null;
function closeFamilySheet(){
 if(!familySheet)return;
 familySheet.hidden=true;
 familyTrigger?.setAttribute('aria-expanded','false');
 familyTrigger?.focus({preventScroll:true});
}
function buildFamily(){
 const dialog=id('seyveoFamilyDialog');
 const header=dialog?.querySelector('.svf-overline');
 if(!dialog||!header||dialog.querySelector('.sv-chat-family-trigger'))return;
 familyTrigger=node('button','sv-chat-family-trigger');
 familyTrigger.type='button';
 familyTrigger.setAttribute('aria-label','Оформление семейного чата');
 familyTrigger.setAttribute('aria-controls','svChatFamilyThemeSheet');
 familyTrigger.setAttribute('aria-expanded','false');
 const symbol=node('span',null,'◐');symbol.setAttribute('aria-hidden','true');
 familyTrigger.append(symbol);
 header.append(familyTrigger);
 familySheet=node('section','sv-chat-family-sheet');
 familySheet.id='svChatFamilyThemeSheet';
 familySheet.hidden=true;
 familySheet.setAttribute('role','dialog');
 familySheet.setAttribute('aria-modal','true');
 familySheet.setAttribute('aria-label','Оформление семейного чата');
 const head=node('div','sv-chat-family-sheet-head');
 const back=node('button','sv-chat-family-close','Назад');
 back.type='button';back.addEventListener('click',closeFamilySheet);
 head.append(back,node('strong',null,'Оформление'),node('span'));
 familySheet.append(head);
 createChoices(familySheet,value=>{
  const ok=store('family:main',value);
  if(!ok)return false;
  applyFamily();return true;
 },chosen('family:main'));
 dialog.querySelector('.svf-shell')?.append(familySheet);
 familyTrigger.addEventListener('click',()=>{
  const next=familySheet.hidden;
  familySheet.hidden=!next;
  familyTrigger.setAttribute('aria-expanded',String(next));
  if(next){
   display(familySheet,chosen('family:main'));
   back.focus({preventScroll:true});
  }
 });
 familySheet.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();closeFamilySheet()}
 });
 dialog.addEventListener('close',()=>{
  if(familySheet)familySheet.hidden=true;
  familyTrigger?.setAttribute('aria-expanded','false');
 });
}
function init(){
 buildWork();buildFamily();applyFamily();
 const current=id('svcpConversation')?.dataset.roomId;
 if(current)applyRoom(current);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
window.SEYVEO_CHAT_THEMES=Object.freeze({
 applyRoom,syncRoom,applyFamily,
 getWorkDefault:()=>chosen('work:default'),
 setWorkDefault,
});
})();