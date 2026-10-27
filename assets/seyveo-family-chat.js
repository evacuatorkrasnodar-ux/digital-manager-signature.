/* SEYVEO Family · local UI prototype only. No messages or files leave the device.
 * Future family transport must require accounts, participant opt-in and end-to-end
 * privacy analysis. Business membership never grants access to this space.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id),dialog=$('seyveoFamilyDialog');
if(!dialog||!$('svfChatForm'))return;
const MSG_KEY='seyveo-family-chat-demo-messages-v1';
const PLAN_KEY='seyveo-family-chat-demo-plans-v1';
const MAX_MSG=55,MAX_PLAN=40;
const read=(key)=>{
 try{const v=JSON.parse(sessionStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}
 catch{return []}
};
const persist=(key,value)=>{
 try{sessionStorage.setItem(key,JSON.stringify(value));return true}
 catch{status('Не удалось сохранить в этой вкладке. Проверьте настройки хранилища.');return false}
};
const validMessage=m=>m&&typeof m.text==='string'&&typeof m.at==='number';
const validPlan=p=>p&&typeof p.text==='string'&&typeof p.id==='string';
let messages=read(MSG_KEY).filter(validMessage).slice(-MAX_MSG);
let plans=read(PLAN_KEY).filter(validPlan).slice(-MAX_PLAN);
let selectedFile=null,previewUrl=null,pendingSuggestion=null;
const make=(tag,cls,txt)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node};
const button=(txt,fn,cls)=>{
 const node=make('button',cls,txt);node.type='button';node.addEventListener('click',fn);return node;
};
const status=txt=>{$('svfStatus').textContent=txt};
function changeTab(which){
 if(which!=='chat'&&which!=='plans')return;
 for(const tab of dialog.querySelectorAll('[data-svf-tab]')){
  const yes=tab.dataset.svfTab===which;
  tab.setAttribute('aria-selected',String(yes));tab.tabIndex=yes?0:-1;
 }
 for(const panel of dialog.querySelectorAll('[data-svf-panel]')){
  panel.hidden=panel.dataset.svfPanel!==which;
 }
 if(which==='chat')renderMessages();else renderPlans();
}
function open(){
 changeTab('chat');
 if(!dialog.open){
  if(typeof dialog.showModal==='function')dialog.showModal();
  else {status('Ваш браузер не поддерживает окно семейного чата.');return}
 }
}
function close(){if(dialog.open)dialog.close()}
function smartSuggestion(txt){
 if(/(?:купить|покупк|в магазин|закупить|заказать|молоко|хлеб|продукт)/i.test(txt)){
  return {text:txt,kind:'Список покупок',description:'Похоже на покупку. Добавить в семейные планы?'}
 }
 if(/(?:завтра|послезавтра|в субботу|в воскресенье|встреч|поедем|приедем|праздник|в выходные|день рождения)/i.test(txt)){
  return {text:txt,kind:'Семейная встреча',description:'Похоже на общий план. Сохранить его, чтобы не забыть?'}
 }
 if(/(?:не забудь|напомни|забрать|нужно|надо |сделать|успеть|помог|получить)/i.test(txt)){
  return {text:txt,kind:'Общее дело',description:'Похоже на просьбу или дело. Добавить в семейный список?'}
 }
 return null;
}
function suggestionView(){
 const wrap=$('svfSuggestion');wrap.replaceChildren();
 wrap.hidden=!pendingSuggestion;
 if(!pendingSuggestion)return;
 wrap.append(make('strong',null,'Сэйви · '+pendingSuggestion.kind),
  make('p',null,pendingSuggestion.description));
 wrap.append(button('Добавить в планы',()=>{
  if(!pendingSuggestion)return;
  plans.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,8),text:pendingSuggestion.text.slice(0,220),done:false});
  plans=plans.slice(-MAX_PLAN);persist(PLAN_KEY,plans);
  pendingSuggestion=null;suggestionView();changeTab('plans');
  status('Добавлено в локальные семейные планы. Родным пока не отправляется.');
 },'svf-action is-strong'));
 wrap.append(make('p',null,'Пока это подсказка по словам, без подключения ИИ и без чтения чужих переписок.'));
}
function renderMessages(){
 const thread=$('svfMessages');thread.replaceChildren();
 if(!messages.length){
  const empty=make('div','svf-empty');
  const svg=make('span');svg.innerHTML='<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 8h26v18H18l-8 7v-7H7zM13 15h14M13 20h9"/></svg>';
  empty.append(svg,make('strong',null,'Семья начинается с общения'),
   make('span',null,'Здесь появится ваш общий чат. Сейчас можно попробовать его внешний вид и умные подсказки без отправки сообщений.'));
  thread.append(empty);
 }else{
  for(const msg of messages){
   const bubble=make('div','svf-msg');
   bubble.append(make('strong',null,'Вы · только у вас'),make('span',null,msg.text.slice(0,1150)));
   thread.append(bubble);
  }
 }
 thread.scrollTop=thread.scrollHeight;
 suggestionView();
}
function renderPlans(){
 const container=$('svfPlanList');container.replaceChildren();
 if(!plans.length)container.append(make('p','svf-privacy','Пока нет семейных планов. Можно добавить первый или попросить Сэйви сохранить идею из сообщения.'));
 for(const [index,item] of plans.entries()){
  const row=make('div','svf-plan-entry');row.dataset.done=String(!!item.done);
  const label=make('label'),check=make('input');
  check.type='checkbox';check.checked=!!item.done;
  check.setAttribute('aria-label','Отметить выполнение '+item.text);
  check.addEventListener('change',()=>{item.done=check.checked;persist(PLAN_KEY,plans);renderPlans()});
  label.append(check,make('span',null,item.text.slice(0,220)));
  row.append(label,button('Убрать',()=>{plans.splice(index,1);persist(PLAN_KEY,plans);renderPlans()},'svf-button-lite'));
  container.append(row);
 }
}
function discardFile(){
 if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}
 selectedFile=null;
 const preview=$('svfAttachment');preview.hidden=true;preview.replaceChildren();
}
const fileInput=$('svfFile');
fileInput.addEventListener('change',()=>{
 discardFile();
 const file=fileInput.files?.[0];if(!file)return;
 const valid=/\.(jpe?g|png|webp|gif|heic|heif|pdf|docx?|xlsx?|txt)$/i.test(file.name);
 if(!valid||file.size>12*1024*1024){
  fileInput.value='';status('Выберите фото или документ до 12 МБ для локального предпросмотра.');
  return;
 }
 selectedFile=file;
 const preview=$('svfAttachment');preview.hidden=false;
 if(/\.(jpe?g|png|webp|gif)$/i.test(file.name)){
  previewUrl=URL.createObjectURL(file);
  const img=make('img');img.src=previewUrl;img.alt='Выбранное фото, локальный предпросмотр';
  preview.append(img);
 }
 preview.append(make('span',null,file.name+' · предпросмотр, без отправки'));
 preview.append(button('Убрать',()=>{fileInput.value='';discardFile()},'svf-button-lite'));
 status('Вложение пока видно только здесь. Файл не загружается на сервер.');
});
$('svfChatForm').addEventListener('submit',event=>{
 event.preventDefault();
 const field=$('svfMessageInput'),value=field.value.trim();
 if(!value&&!selectedFile){status('Напишите сообщение или выберите фото или документ.');return}
 const text=[value,selectedFile?'[Выбран файл: '+selectedFile.name+' · не отправлен и не сохранён]':''].filter(Boolean).join('\n');
 messages.push({text,at:Date.now()});messages=messages.slice(-MAX_MSG);
 persist(MSG_KEY,messages);
 pendingSuggestion=smartSuggestion(value);
 field.value='';fileInput.value='';discardFile();
 renderMessages();
 status('Запись только в этой вкладке. Родные её не видят.');
});
$('svfPlanForm').addEventListener('submit',event=>{
 event.preventDefault();
 const field=$('svfPlanText'),text=field.value.trim();
 if(!text)return;
 plans.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,8),text:text.slice(0,220),done:false});
 plans=plans.slice(-MAX_PLAN);persist(PLAN_KEY,plans);field.value='';
 renderPlans();status('Семейный план добавлен только в демо.');
});
for(const tab of dialog.querySelectorAll('[data-svf-tab]')){
 tab.addEventListener('click',()=>changeTab(tab.dataset.svfTab));
}
$('svfClose').addEventListener('click',close);
dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
dialog.addEventListener('close',()=>{fileInput.value='';discardFile()});
window.addEventListener('seyveo:family-open',open);
window.SEYVEO_FAMILY_CHAT=Object.freeze({open});
changeTab('chat');
})();
