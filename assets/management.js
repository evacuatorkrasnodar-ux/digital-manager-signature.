/* SEYVEO · Management v1. Original local-only functionality.
   No external service connections and no user data uploads. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const connect=$('manageConnectionsDialog'),dataDialog=$('manageDataDialog');
if(!connect||!dataDialog)return;
const KEYS=Object.freeze({
 app:'dm-signature-living-v2',
 previous:'dm-signature-living-v1',
 notes:'seyveo-notes-v1',
 draft:'seyveo-draft-v1'
});
function read(key){
 try{return localStorage.getItem(key)}catch{return null}
}
function parsed(raw,fallback){
 try{return raw===null?fallback:JSON.parse(raw)}catch{return fallback}
}
function snapshot(){
 const state=parsed(read(KEYS.app),{});
 const notes=parsed(read(KEYS.notes),[]);
 const oldState=parsed(read(KEYS.previous),null);
 const draft=read(KEYS.draft);
 return {
  product:'SEYVEO',
  exportedAt:new Date().toISOString(),
  source:'local browser storage on this device',
  state:state&&typeof state==='object'&&!Array.isArray(state)?state:{},
  oldState:oldState&&typeof oldState==='object'&&!Array.isArray(oldState)?oldState:null,
  notes:Array.isArray(notes)?notes:[],
  draft:typeof draft==='string'?draft:''
 };
}
function countOf(list){return Array.isArray(list)?list.length:0}
function drawData(){
 const record=snapshot(),list=$('manageDataSummary');
 list.replaceChildren();
 const parts=[
  ['Мои записи',String(countOf(record.notes))],
  ['Черновик',record.draft.trim()?'Сохранён':'Нет'],
  ['Поручения в истории',String(countOf(record.state.history))],
  ['Данные', 'На этом устройстве']
 ];
 for(const [label,value] of parts){
  const row=document.createElement('div');row.className='manage-data-item';
  const a=document.createElement('span');a.textContent=label;
  const b=document.createElement('strong');b.textContent=value;
  row.append(a,b);list.append(row);
 }
 $('manageExportStatus').textContent='';
}
function saveFile(){
 try{
  const info=snapshot();
  const blob=new Blob([JSON.stringify(info,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='seyveo-local-data-'+new Date().toISOString().slice(0,10)+'.json';
  a.style.display='none';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
  $('manageExportStatus').textContent='Копия подготовлена. Проверьте загрузки или файлы устройства.';
 }catch{
  $('manageExportStatus').textContent='Не удалось создать копию. Проверьте разрешения браузера.';
 }
}
$('openManageConnections').addEventListener('click',()=>connect.showModal());
$('manageConnectionsClose').addEventListener('click',()=>connect.close());
$('openManageData').addEventListener('click',()=>{drawData();dataDialog.showModal()});
$('manageDataClose').addEventListener('click',()=>dataDialog.close());
$('manageExportData').addEventListener('click',saveFile);
for(const dialog of [connect,dataDialog]){
 dialog.addEventListener('click',event=>{
  if(event.target===dialog){dialog.close()}
 });
}
})();
