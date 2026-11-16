/* SEYVEO · Optional, user-entered Home and Work addresses.
 * No geolocation, implicit persistence, cloud synchronization or background
 * sharing. People can always inspect, change and erase both addresses. */
((root)=>{
 'use strict';
 const KEY='seyveo-personal-places-v1';
 const TYPES=['home','work'];
 function cleanAddress(value){
  if(typeof value!=='string')return '';
  const text=value.replace(/[\x00-\x1f<>]/gu,' ').replace(/\s+/gu,' ').trim();
  return text.length>=6&&text.length<=160&&/[\p{L}]/u.test(text)?text:'';
 }
 function read(){
  try{
   const saved=JSON.parse(root?.localStorage?.getItem(KEY)||'null');
   if(!saved||saved.version!==1)return {};
   const result={};
   for(const kind of TYPES){const address=cleanAddress(saved[kind]);if(address)result[kind]=address}
   return result;
  }catch{return {}}
 }
 function write(next){
  try{
   const value={version:1,updatedAt:new Date().toISOString()};
   for(const kind of TYPES)if(next[kind])value[kind]=next[kind];
   if(!value.home&&!value.work)root.localStorage.removeItem(KEY);
   else root.localStorage.setItem(KEY,JSON.stringify(value));
   root.dispatchEvent?.(new Event('seyveo:saved-places-changed'));
   return true;
  }catch{return false}
 }
 function set(kind,value){
  if(!TYPES.includes(kind))return false;
  const address=cleanAddress(value);
  if(!address)return false;
  return write({...read(),[kind]:address});
 }
 function remove(kind){
  if(!TYPES.includes(kind))return false;
  const next=read();delete next[kind];return write(next);
 }
 function city(){
  const saved=read(),text=saved.home||saved.work||'';
  const match=text.match(/(?:^|[,\s])(?:г\.?\s*)?(Краснодар|Москва|Сочи|Казань|Новосибирск|Екатеринбург|Санкт-Петербург)(?=\s*,|\s|$)/iu);
  if(match)return match[1];
  const first=text.split(',')[0]?.trim().replace(/^г\.\s*/iu,'');
  if(first&&!/^(?:ул\.?|улица|проспект|пр\.|переулок|пер\.)\s/iu.test(first)&&
   /^[\p{L} -]{2,60}$/u.test(first))return first;
  return '';
 }
 let sheet=null;
 function openEditor(){
  const doc=root?.document;
  if(!doc?.body)return false;
  sheet?.remove();
  const overlay=doc.createElement('div');overlay.className='sv-personal-places-overlay';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Мои места — Дом и Работа');
  const card=doc.createElement('div');card.className='sv-personal-places-sheet';
  const heading=doc.createElement('div');heading.className='sv-personal-places-heading';
  const title=doc.createElement('strong');title.textContent='Мои места';
  const close=doc.createElement('button');close.type='button';close.textContent='×';
  close.setAttribute('aria-label','Закрыть');
  const dismiss=()=>{overlay.remove();if(sheet===overlay)sheet=null};
  close.addEventListener('click',dismiss);heading.append(title,close);card.append(heading);
  const copy=doc.createElement('p');copy.className='sv-personal-places-explain';
  copy.textContent='Если хочешь, запомню адрес дома и работы. Это необязательно. Адреса хранятся только на этом устройстве — их можно изменить или удалить.';
  card.append(copy);
  const saved=read(),fields={};
  for(const [kind,label] of [['home','Дом'],['work','Работа']]){
   const row=doc.createElement('label');row.className='sv-personal-places-field';
   const caption=doc.createElement('span');caption.textContent=label;
   const input=doc.createElement('input');input.type='text';input.maxLength=160;
   input.autocomplete='off';input.placeholder='Город, улица, дом';input.value=saved[kind]||'';
   input.setAttribute('aria-label','Адрес · '+label);fields[kind]=input;
   row.append(caption,input);card.append(row);
  }
  const foot=doc.createElement('div');foot.className='sv-personal-places-actions';
  const reset=doc.createElement('button');reset.type='button';reset.textContent='Удалить адреса';
  reset.addEventListener('click',()=>{
   if(!root.confirm?.('Удалить сохранённые адреса дома и работы с этого устройства?'))return;
   if(write({})){fields.home.value='';fields.work.value='';message.textContent='Адреса удалены'};
  });
  const save=doc.createElement('button');save.type='button';save.textContent='Сохранить';
  save.className='is-primary';
  const message=doc.createElement('p');message.className='sv-personal-places-message';message.setAttribute('role','status');
  save.addEventListener('click',()=>{
   const next={};
   for(const kind of TYPES){
    const raw=fields[kind].value.trim();
    if(raw&&!cleanAddress(raw)){message.textContent='Укажи понятный адрес или оставь поле пустым.';return}
    if(raw)next[kind]=cleanAddress(raw);
   }
   if(!write(next)){message.textContent='Не удалось сохранить адреса на этом устройстве.';return}
   dismiss();
  });
  foot.append(reset,save);card.append(foot,message);overlay.append(card);doc.body.append(overlay);
  overlay.addEventListener('click',event=>{if(event.target===overlay)dismiss()});
  overlay.addEventListener('keydown',event=>{if(event.key==='Escape')dismiss()});
  sheet=overlay;close.focus?.({preventScroll:true});return true;
 }
 const api=Object.freeze({read,set,remove,city,openEditor});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SEYVEO_SAVED_PLACES=api;
})(typeof window!=='undefined'?window:null);
