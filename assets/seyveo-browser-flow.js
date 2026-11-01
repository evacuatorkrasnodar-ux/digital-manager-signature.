/* SEYVEO Flow · developer-visible, consent-first browser workbench.
 * One card inside the EXISTING Feather Chat; no extra dock, fake AI or scraper.
 * Seven modules, using real local storage and honest native/AI boundaries. */
(()=>{'use strict';
const reader=document.getElementById('orbInlineReplyText');
if(!reader||window.SEYVEO_BROWSER_FLOW)return;
const icons={
 flow:'<path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3ZM19 18l.6 1.4L21 20l-1.4.6L19 22l-.6-1.4L17 20l1.4-.6L19 18Z"/>',
 spaces:'<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M4 9.5h16M9 5v14"/>',
 check:'<path d="m12 3 8 3.5V12c0 5-3.2 8-8 9-4.8-1-8-4-8-9V6.5L12 3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
 connect:'<path d="M8 7h-2a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-2M12 4h8v8M20 4 10 14"/>',
 translate:'<path d="M3 6h12M9 3v3m4 0c-.5 5-3 9-8 12m1-9c1 3 3 5 7 7M15 14l3-8 3 8m-5-2h4"/>',
 privacy:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
 continue:'<path d="M6 3h12v18l-6-4-6 4V3Z"/><path d="M9 10h6m-3-3v6"/>'
};
const entries=[
 ['flow','Понять','Подготовить вопрос Сэйви о содержимом страницы'],
 ['spaces','Пространства','Сохранить адрес в существующую коллекцию'],
 ['check','Проверка','Локальные признаки риска в адресе'],
 ['connect','Мой мир','Перенести ссылку и заметку в Блокнот'],
 ['translate','Перевод','Подготовить запрос на перевод отрывка'],
 ['privacy','Приватность','Управление локальной историей этого сайта'],
 ['continue','Продолжить','Сохранить адрес для возвращения позже']
];
const SPACE_KEY='seyveo-browser-collections-v1';
const CONTINUE_KEY='seyveo-browser-flow-continue-v1';
const HISTORY_KEY='seyveo-browser-history-v1',TIMES_KEY='seyveo-browser-history-times-v1';
let panel=null,active=false,mode='flow',url=null,tabId=null;
const icon=key=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">'+icons[key]+'</svg>';
function node(tag,className,text){
 const x=document.createElement(tag);if(className)x.className=className;
 if(text!==undefined)x.textContent=text;return x;
}
function button(label,action,kind=''){
 const b=node('button','svf-btn '+kind,label);b.type='button';b.dataset.svfDo=action;return b;
}
function load(key,fallback){
 try{const x=JSON.parse(localStorage.getItem(key)||'null');return x===null?fallback:x}catch{return fallback}
}
function save(key,value){
 try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}
}
function safe(raw){
 try{const x=new URL(raw);return x.protocol==='https:'&&!x.username&&!x.password?x.href:null}catch{return null}
}
function hostname(){try{return url?new URL(url).hostname.replace(/^www\./,''):''}catch{return ''}}
function isSameHost(a,b){try{return new URL(a).hostname===new URL(b).hostname}catch{return false}}
function spaces(){
 const x=load(SPACE_KEY,[]);
 return Array.isArray(x)?x.filter(i=>i&&typeof i.id==='string'&&typeof i.name==='string'&&Array.isArray(i.urls)).slice(0,30):[];
}
function continuing(){
 const x=load(CONTINUE_KEY,[]);
 return Array.isArray(x)?x.filter(i=>i&&safe(i.url)).slice(0,30):[];
}
function setNotice(msg){const x=panel?.querySelector('.svf-notice');if(x){x.textContent=msg;x.hidden=false;}}
function displayHeader(){
 if(!panel)return;
 panel.querySelector('.svf-source').textContent=url?'Сайт: '+hostname():'Нет открытой страницы · режим разработчика';
 panel.querySelector('.svf-context').textContent=url
  ?'Нажимай инструменты ниже. Содержимое страницы Сэйви не читает без твоего действия.'
  :'Открой любой сайт в браузере, затем нажми сферу. Пока можно изучить все семь возможностей.';
}
function caption(container,title,description){
 container.append(node('strong','svf-mode-title',title),node('p','svf-hint',description));
}
function inputField(holder,placeholder,kind='textarea'){
 const field=node(kind,'svf-field');
 field.placeholder=placeholder;
 field.setAttribute('aria-label',placeholder);
 if(kind==='textarea'){field.rows=3;field.maxLength=2500}
 holder.append(field);return field;
}
function chooseMode(id){
 mode=id;
 if(!panel)return;
 panel.querySelectorAll('[data-svf-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.svfMode===id)));
 const detail=panel.querySelector('.svf-detail');
 detail.replaceChildren();
 panel.querySelector('.svf-notice').hidden=true;
 if(id==='flow'){
  caption(detail,'Понять страницу','Сэйви не извлекает текст из чужих сайтов в веб-демо. Вставь отрывок вручную — запрос будет готов в чате.');
  inputField(detail,'Вставь текст, цену или условия со страницы');
  const row=node('div','svf-controls');
  row.append(button('Объяснить','explain','primary'),button('Сравнить','compare'),button('Условия','terms'));
  detail.append(row);
 }else if(id==='spaces'){
  caption(detail,'Мои пространства','Настоящее локальное сохранение адреса в существующие папки избранного браузера.');
  const select=node('select','svf-field');
  select.setAttribute('aria-label','Выбери пространство');
  const ss=spaces();
  for(const x of ss){const op=node('option','',x.name+' · '+x.urls.length);op.value=x.id;select.append(op);}
  if(!ss.length){const op=node('option','','Новая коллекция «Из браузера»');op.value='';select.append(op)}
  detail.append(select);
  if(!url)detail.append(node('p','svf-hint','Сначала открой сайт. Демо-страницы не сохраняем как настоящие.'));
  detail.append(button('Сохранить страницу','space-save','primary'));
 }else if(id==='check'){
  caption(detail,'SEYVEO Check','Первичная проверка только адреса. Это НЕ антивирус, НЕ онлайн-репутация сайта и НЕ гарантия безопасности.');
  const findings=node('div','svf-findings');detail.append(findings);
  if(!url){findings.textContent='Открой HTTPS-страницу: здесь появятся обнаруженные особенности адреса.';}
  else{
   const u=new URL(url),host=u.hostname,flags=[];
   if(host.startsWith('xn--')||host.includes('.xn--'))flags.push('Адрес содержит IDN/Punycode: проверь написание домена.');
   if(/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)||host.includes(':'))flags.push('В адресе указан IP вместо обычного домена.');
   if(host.split('.').length>5)flags.push('Много поддоменов: проверь настоящего владельца сайта.');
   if(host.length>65)flags.push('Необычно длинное доменное имя.');
   if(u.href.length>350)flags.push('Длинная ссылка: не переходи по ней без понимания источника.');
   if(!flags.length)flags.push('По простым признакам адреса предупреждений не выявлено. Это не проверка содержимого или репутации.');
   for(const f of flags)findings.append(node('p','',f));
   const origin=node('small','svf-host');origin.textContent='Хост: '+host;findings.append(origin);
  }
 }else if(id==='connect'){
  caption(detail,'В «Мой мир»','Сохраним ссылку и твоё описание в настоящий Блокнот SEYVEO. Для событий и бизнес-поручений подготовим текст Сэйви.');
  inputField(detail,'Короткая заметка (необязательно)','textarea');
  const row=node('div','svf-controls');
  row.append(button('В Блокнот','note-save','primary'),button('Создать дело','task-draft'));
  detail.append(row);
 }else if(id==='translate'){
  caption(detail,'Перевод с Сэйви','Вставь фрагмент на другом языке. Сэйви получит готовый запрос, но перевод не изображается без настоящего ИИ.');
  inputField(detail,'Текст для перевода на русский');
  detail.append(button('Подготовить перевод','translation','primary'));
 }else if(id==='privacy'){
  caption(detail,'Приватность','Сэйви сейчас не получает содержимое сайта автоматически. Доступ к камере, cookies и трекерам контролирует веб-движок, а не этот прототип.');
  detail.append(node('p','svf-findings','Доступ к содержимому: выключен. Веб-демо не читает страницу без вставленного тобой текста.'));
  detail.append(button('Удалить посещения этого сайта','clear-site-history'));
  detail.append(node('small','svf-hint','Это удаляет только локальные записи истории SEYVEO для домена. Cookies и кэш сайта не затрагиваются.'));
 }else if(id==='continue'){
  caption(detail,'Продолжить позже','Сохрани страницу локально без облака, регистрации или уведомлений.');
  detail.append(button('Отложить эту страницу','continue-save','primary'));
  const list=node('div','svf-saved');
  const items=continuing();
  if(!items.length)list.append(node('p','svf-hint','Пока нет отложенных страниц.'));
  items.slice(0,5).forEach((item,i)=>{
   const row=node('div','svf-saved-row'),open=button(item.label||new URL(item.url).hostname,'continue-open');
   open.dataset.svfIndex=String(i);open.title=item.url;
   const remove=button('×','continue-remove');
   remove.dataset.svfIndex=String(i);remove.setAttribute('aria-label','Удалить из отложенного');
   row.append(open,remove);list.append(row);
  });
  detail.append(list);
 }
}
function writeDraft(kind){
 const excerpt=panel?.querySelector('.svf-detail textarea')?.value.trim().slice(0,2500)||'';
 const origin=hostname()?'Сайт: '+hostname()+'.\n':'';
 const requests={
  explain:'Помоги понять информацию с веб-страницы простыми словами. Укажи, что подтверждено, а что нужно проверить.\n',
  compare:'Помоги сравнить варианты с этой страницы по цене, условиям и недостаткам. Не выдумывай отсутствующие данные.\n',
  terms:'Помоги найти риски и важные условия. Это предварительный разбор, не юридическая экспертиза.\n',
  task:'Помоги превратить найденную страницу в понятное дело: цель, шаги и срок. Ничего не отправляй и не создавай без подтверждения.\n',
  translation:'Переведи следующий текст на русский, сохрани смысл, цены и оговорки.\n'
 };
 if(!excerpt&&['explain','compare','terms','translation'].includes(kind)){
  setNotice('Сначала вставь фрагмент страницы — браузер пока не умеет читать её автоматически.');
  return;
 }
 const field=document.getElementById('question');
 if(!field){setNotice('Редактор Сэйви недоступен.');return}
 const prefix=requests[kind]||'';
 field.value=prefix+origin+(excerpt?'\nТекст:\n'+excerpt:'');
 field.dispatchEvent(new Event('input',{bubbles:true}));
 setNotice('Запрос подготовлен в поле Сэйви. Проверь его и нажми «Отправить».');
 field.focus({preventScroll:true});
}
function saveSpace(){
 if(!url){setNotice('Сначала открой настоящий сайт в браузере.');return}
 let all=spaces(),chosen=panel.querySelector('.svf-detail select')?.value;
 if(!chosen){const item={id:'svf-'+Date.now(),name:'Из браузера',urls:[]};all.push(item);chosen=item.id;}
 const place=all.find(x=>x.id===chosen);if(!place){setNotice('Коллекция не найдена.');return}
 place.urls=Array.from(new Set([...place.urls.filter(x=>safe(x)),url])).slice(-100);
 if(!save(SPACE_KEY,all)){setNotice('Не удалось сохранить: проверь память устройства.');return}
 setNotice('Сайт сохранён в коллекцию «'+place.name+'».');
}
function saveNote(){
 if(!url){setNotice('Сначала открой сайт, который хочешь сохранить.');return}
 const api=window.SEYVEO_NOTES_API;
 if(typeof api?.putNotes!=='function'||typeof api?.getNotes!=='function'){
  setNotice('Блокнот сейчас недоступен. Ссылка не сохранена.');return;
 }
 const note=panel.querySelector('.svf-detail textarea')?.value.trim().slice(0,2500)||'';
 const content='Из SEYVEO Browser · '+hostname()+'\n'+url+(note?'\n\n'+note:'');
 const current=api.getNotes();
 if(!Array.isArray(current)){setNotice('Не удалось прочитать Блокнот.');return}
 const entry={id:String(Date.now())+'-browser-flow',text:content,createdAt:Date.now()};
 if(api.putNotes([entry,...current]))setNotice('Ссылка добавлена в Блокнот «Мой мир».');
 else setNotice('Не удалось сохранить в Блокнот.');
}
function saveContinue(){
 if(!url){setNotice('Открой сайт, чтобы отложить его.');return}
 const items=continuing().filter(x=>x.url!==url);
 items.unshift({url,label:hostname(),addedAt:Date.now()});
 if(!save(CONTINUE_KEY,items.slice(0,30))){setNotice('Не удалось сохранить локально.');return}
 chooseMode('continue');setNotice('Ссылка отложена и сохранена на этом устройстве.');
}
function clearHistory(){
 if(!url){setNotice('Сначала открой нужный сайт.');return}
 if(!window.confirm('Удалить историю посещений '+hostname()+' из SEYVEO Browser? Cookies и данные сайта не изменятся.'))return;
 try{
  const old=load(HISTORY_KEY,[]);
  const entries=Array.isArray(old)?old:[];
  const rest=entries.filter(x=>typeof x!=='string'||!isSameHost(x,url));
  const times=load(TIMES_KEY,{});
  const clean=times&&typeof times==='object'&&!Array.isArray(times)?{...times}:{};
  for(const key of Object.keys(clean))if(isSameHost(key,url))delete clean[key];
  // localStorage writes can fail; restore original history in case of partial failure.
  const snapshot=localStorage.getItem(HISTORY_KEY),timeSnapshot=localStorage.getItem(TIMES_KEY);
  try{
   localStorage.setItem(HISTORY_KEY,JSON.stringify(rest));
   localStorage.setItem(TIMES_KEY,JSON.stringify(clean));
  }catch(err){
   if(snapshot===null)localStorage.removeItem(HISTORY_KEY);else localStorage.setItem(HISTORY_KEY,snapshot);
   if(timeSnapshot===null)localStorage.removeItem(TIMES_KEY);else localStorage.setItem(TIMES_KEY,timeSnapshot);
   throw err;
  }
  setNotice('Локальные записи посещений домена удалены. Данные сайтов и cookies не затронуты.');
 }catch{setNotice('Не удалось очистить историю на устройстве.')}
}
function navigateSaved(index){
 const item=continuing()[index];if(!item?.url)return;
 // Close the original Feather Chat, allowing Browser to resume its own dock.
 window.SEYVEO_CONVERSATION?.close?.();
 window.SEYVEO_BROWSER?.open?.(item.url);
}
function act(event){
 const switchMode=event.target.closest('[data-svf-mode]');
 if(switchMode){chooseMode(switchMode.dataset.svfMode);return}
 const target=event.target.closest('[data-svf-do]');if(!target)return;
 switch(target.dataset.svfDo){
  case 'close':active=false;panel.remove();break;
  case 'explain':case 'compare':case 'terms':writeDraft(target.dataset.svfDo);break;
  case 'translation':writeDraft('translation');break;
  case 'task-draft':writeDraft('task');break;
  case 'space-save':saveSpace();break;
  case 'note-save':saveNote();break;
  case 'continue-save':saveContinue();break;
  case 'continue-open':navigateSaved(Number(target.dataset.svfIndex));break;
  case 'continue-remove':{
   const items=continuing();items.splice(Number(target.dataset.svfIndex),1);
   if(save(CONTINUE_KEY,items))chooseMode('continue');else setNotice('Не удалось удалить запись.');break;
  }
  case 'clear-site-history':clearHistory();break;
 }
}
function build(){
 const section=node('section','svf-flow');section.id='seyveoFlow';
 section.setAttribute('aria-label','SEYVEO Flow — инструменты браузера');
 const header=node('div','svf-head');
 const heading=node('div','svf-heading');
 heading.append(node('strong','','SEYVEO  /  FLOW'),node('small','svf-source',''));
 header.append(heading,button('×','close','svf-close'));
 const context=node('p','svf-context','');
 const grid=node('div','svf-grid');
 entries.forEach(([id,name,description])=>{
  const action=node('button','svf-tool');action.type='button';action.dataset.svfMode=id;
  action.title=description;action.setAttribute('aria-label',name+' — '+description);
  action.innerHTML=icon(id);
  action.append(node('span','',name));grid.append(action);
 });
 const detail=node('div','svf-detail');
 const notice=node('p','svf-notice','');notice.setAttribute('role','status');notice.hidden=true;
 section.append(header,context,grid,detail,notice);
 section.addEventListener('click',act);return section;
}
function mount(target=reader){
 if(!active)return false;
 if(!panel)panel=build();
 if(panel.parentNode!==target)target.append(panel);
 displayHeader();return true;
}
function show(detail={}){
 const requested=safe(detail.url);
 url=requested;tabId=Number.isInteger(detail.tabId)?detail.tabId:null;
 active=true;mount();
 chooseMode('flow');
 requestAnimationFrame(()=>{if(active&&panel.isConnected)reader.scrollTop=reader.scrollHeight});
}
document.addEventListener('seyveo:browser-flow-open',event=>show(event.detail||{}));
document.addEventListener('seyveo:conversation-close',()=>{active=false;panel?.remove();url=null;tabId=null;});
window.SEYVEO_BROWSER_FLOW=Object.freeze({mount,show,isActive:()=>active});
})();
