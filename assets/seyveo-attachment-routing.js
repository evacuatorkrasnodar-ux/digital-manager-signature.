/* SEYVEO · attachment routing policy. Browser-local preferences only.
 * No provider, malware scanner, AI classifier or background mail fetch included.
 * A future authenticated provider must supply the account scope and its verified
 * safety/trust results. These browser checks are not a server security boundary.
 */
(()=>{
'use strict';
const KEY='seyveo.attachment-routing.v1';
const scopes=['personal','business'];
const categories=Object.freeze({contract:'Договоры',invoice:'Счета',act:'Акты',tax:'Налоги и отчётность',other:'Другие документы'});
const modes=['ask','auto','manual'];
const files=()=>window.SEYVEO_DOCUMENT_FILES;
function check(scope){if(!scopes.includes(scope))throw Error('Выберите личную или рабочую почту');}
function settings(scope){
 check(scope);
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||'{}')[scope]||{};
  const rules={};
  for(const id of Object.keys(categories))if(typeof raw.rules?.[id]==='string')rules[id]=raw.rules[id];
  return {mode:modes.includes(raw.mode)?raw.mode:'ask',rules};
 }catch{return {mode:'ask',rules:{}};}
}
function setSettings(scope,value){
 check(scope);if(!modes.includes(value.mode))throw Error('Неверный режим');
 const rules={};
 for(const id of Object.keys(categories))if(typeof value.rules?.[id]==='string'&&value.rules[id])rules[id]=value.rules[id];
 let all={};try{all=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{}
 all[scope]={mode:value.mode,rules};localStorage.setItem(KEY,JSON.stringify(all));return settings(scope);
}
async function folders(scope){check(scope);return (await files().list(scope)).filter(x=>x.kind==='folder');}
function validSource(scope,source){return source==='mail'||source==='work-chat'&&scope==='business'||source==='family-chat'&&scope==='personal';}
function connected(scope){return window.SEYVEO_CONNECTION_PROMPTS?.verified?.('mail',scope)===true;}
const types={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'};
function eligible(file){const ext=file?.name?.split('.').pop().toLowerCase();return file instanceof File&&file.size>0&&file.size<=20*1024*1024&&types[ext]===file.type;}
async function inspect(input){
 const {scope,source,file,category,safety,authenticated,trustedSender}=input||{};
 check(scope);
 if(!validSource(scope,source))return {action:'blocked',reason:'scope'};
 if(authenticated!==true||source==='mail'&&!connected(scope))return {action:'blocked',reason:'not-connected'};
 if(safety!=='clean'||!eligible(file))return {action:'blocked',reason:'unsafe-or-unsupported'};
 const head=new Uint8Array(await file.slice(0,5).arrayBuffer());
 const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='pdf'?![37,80,68,70,45].every((v,i)=>head[i]===v):!(head[0]===80&&head[1]===75&&head[2]===3&&head[3]===4))return {action:'blocked',reason:'invalid-format'};
 if(source!=='mail')return {action:'manual'};
 const cfg=settings(scope);
 if(cfg.mode==='manual')return {action:'manual'};
 const target=cfg.rules[category]||'';
 const folder=(await folders(scope)).find(f=>f.id===target);
 if(cfg.mode==='auto'&&trustedSender===true&&Object.prototype.hasOwnProperty.call(categories,category)&&folder)return {action:'save',folder:folder.id};
 return {action:'ask',folder:folder?.id||'',suggestedName:categories[category]||''};
}
async function receive(input){
 const plan=await inspect(input);
 if(plan.action!=='save')return plan;
 const saved=await files().saveAttachment(input.scope,input.file,input.source,plan.folder);
 return {action:'saved',...saved};
}
async function confirm(input,folder=''){
 const plan=await inspect(input);
 if(plan.action==='blocked')return plan;
 // Call only in response to a user's explicit Save action.
 const saved=await files().saveAttachment(input.scope,input.file,input.source,folder);
 return {action:'saved',...saved};
}
window.SEYVEO_ATTACHMENT_ROUTING=Object.freeze({categories,settings,setSettings,folders,inspect,receive,confirm});
})();
