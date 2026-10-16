/* SEYVEO · Passports. Original new module; old project consulted for ideas only.
   Local records; no verification with FNS, no connected account or server. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const brand=$('seyveoBrandPassport'),company=$('seyveoCompanyPassport');
const previewBox=$('homePassportPopover'),brandTrigger=$('homeBrandTrigger'),companyTrigger=$('homeCompanyTrigger');
const form=$('seyveoCompanyForm'),dialog=$('seyveoCompanyDialog'),studio=$('seyveoStudioDialog');
if(!brand||!company||!form||!dialog||!studio)return;
const KEY='seyveo-company-passport-v1';
const DEV_PREVIEW_KEY='seyveo-developer-tier-preview-v1';
const TIERS=Object.freeze([
  {id:'start',name:'Business Start',short:'START',
   audience:'Начинаю своё дело',
   features:['Проверка бизнес-идеи','Расчёты и план запуска','Первые клиенты'],
   state:'В планах'},
  {id:'pro',name:'Business Pro',short:'PRO',
   audience:'У меня работает компания',
   features:['Всё из Start','Клиенты, поручения и процессы','Финансы и бизнес-аналитика'],
   state:'В планах'},
  {id:'max',name:'Business Max',short:'MAX',
   audience:'Несколько команд и направлений',
   features:['Всё из Pro','Филиалы и роли сотрудников','Координация и масштабная автоматизация'],
   state:'В планах'}
]);
function readPreview(){
 try{const raw=localStorage.getItem(DEV_PREVIEW_KEY);return TIERS.some(t=>t.id===raw)?raw:'pro'}
 catch{return 'pro'}
}
function setPreview(next){
 if(!TIERS.some(t=>t.id===next))return;
 try{localStorage.setItem(DEV_PREVIEW_KEY,next)}catch{}
 drawPreview();
 window.dispatchEvent(new CustomEvent('seyveo:plan-preview-changed',{detail:{tier:next}}));
}
function drawPreview(){
 const id=readPreview(),tier=TIERS.find(t=>t.id===id)||TIERS[1],index=TIERS.indexOf(tier);
 for(const button of studio.querySelectorAll('[data-seyveo-preview-tier]')){
   const active=button.dataset.seyveoPreviewTier===id;
   button.setAttribute('aria-pressed',String(active));
   const status=button.querySelector('[data-seyveo-current]');if(status)status.textContent=active?'Смотрим':'Посмотреть';
 }
 const tierName=$('seyveoPreviewName'),features=$('seyveoPreviewFeatures');
 if(tierName)tierName.textContent='SEYVEO '+tier.name;
 if(features){
   features.replaceChildren();
   tier.features.forEach(item=>{const li=document.createElement('li');li.textContent=item;features.append(li)});
 }
 const lower=$('seyveoPreviewLower'),higher=$('seyveoPreviewHigher');
 lower.disabled=index===0;higher.disabled=index===TIERS.length-1;
 lower.textContent=index>0?'← '+TIERS[index-1].short:'Начало линейки';
 higher.textContent=index<TIERS.length-1?'↑ '+TIERS[index+1].short:'Флагман MAX';
 const summary=$('seyveoPassportPreviewTier');
 if(summary)summary.textContent='Предпросмотр '+tier.short;
}

const LABELS={npd:'Самозанятый',ip:'Индивидуальный предприниматель',org:'Организация'};
const PROPS=[
 ['name','Название для клиентов'],['legalName','Полное имя / юридическое наименование'],
 ['owner','Руководитель / представитель'],['industry','Сфера деятельности'],['city','Город'],
 ['inn','ИНН'],['kpp','КПП'],['ogrn','ОГРН'],['ogrnip','ОГРНИП'],
 ['address','Адрес'],['phone','Телефон'],['email','Электронная почта'],['website','Сайт'],
 ['bank','Банк'],['account','Расчётный счёт'],['bik','БИК'],['corr','Корреспондентский счёт']
];
const LENGTH={name:80,legalName:160,owner:100,industry:80,city:70,inn:12,kpp:9,ogrn:13,ogrnip:15,address:200,phone:50,email:120,website:180,bank:120,account:20,bik:9,corr:20};
function load(){
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
  const result={type:LABELS[raw.type]?raw.type:'npd'};
  for(const [key] of PROPS)result[key]=typeof raw[key]==='string'?raw[key].slice(0,LENGTH[key]):'';
  return result;
 }catch{return {}}
}
function store(card){try{localStorage.setItem(KEY,JSON.stringify(card));return true}catch{return false}}
const clean=value=>String(value||'').trim();
function status(dialogEl,message){const s=dialogEl.querySelector('[data-passport-status]');if(s)s.textContent=message}
function fillPreview(){
 const record=load();
 $('seyveoCompanyPreviewName').textContent=record.name||'Моя компания';
 $('seyveoCompanyPreviewDesc').textContent=record.name?(record.city||LABELS[record.type]||'Компания'):'Добавьте данные';
}
function selectedRows(card){
 const allowed=card.type==='org'?['name','legalName','owner','industry','city','inn','kpp','ogrn','address','phone','email','website','bank','account','bik','corr']:
 card.type==='ip'?['name','legalName','industry','city','inn','ogrnip','address','phone','email','website','bank','account','bik','corr']:
 ['name','legalName','industry','city','inn','address','phone','email','website','bank','account','bik','corr'];
 return [['Статус',LABELS[card.type]||'Не указан'],...PROPS.filter(([key])=>allowed.includes(key)&&clean(card[key])).map(([key,label])=>[label,clean(card[key])])];
}
function drawRows(){
 const rows=$('seyveoCompanyRows');rows.replaceChildren();
 const card=load(),entries=selectedRows(card);
 for(const [label,value] of entries){
  const row=document.createElement('div');row.className='seyveo-passport-row';
  const k=document.createElement('span');k.textContent=label;
  const v=document.createElement('strong');v.textContent=value;
  row.append(k,v);rows.append(row);
 }
 $('seyveoCompanyNotFilled').hidden=!!card.name;
}
function toggleType(){
 const type=$('seyveoCompanyType').value;
 form.querySelectorAll('[data-passport-type]').forEach(w=>{
   const visible=w.dataset.passportType.split(' ').includes(type);
   w.hidden=!visible;
   for(const inp of w.querySelectorAll('input'))inp.disabled=!visible;
 });
}
function openCompany(){
 const record=load();
 for(const [key] of PROPS){const input=form.elements.namedItem(key);if(input)input.value=record[key]||''}
 $('seyveoCompanyType').value=record.type||'npd';
 toggleType();drawRows();status(dialog,'');
 if(!dialog.open)dialog.showModal();
}
function openStudio(){
 status(studio,'');
 drawPreview();
 if(!studio.open)studio.showModal();
}
function validate(card){
 if(!card.name)return 'Укажите название компании.';
 const digits=['inn','kpp','ogrn','ogrnip','account','bik','corr'];
 for(const key of digits)if(card[key]&&!/^\d+$/.test(card[key]))return 'В поле «'+(PROPS.find(([k])=>k===key)||['',key])[1]+'» допустимы только цифры.';
 if(card.inn&&card.inn.length!==(card.type==='org'?10:12))return 'ИНН: для организации 10 цифр, для ИП и самозанятого 12.';
 const lengths={kpp:9,ogrn:13,ogrnip:15,account:20,bik:9,corr:20};
 for(const key in lengths)if(card[key]&&card[key].length!==lengths[key])return 'Проверьте длину поля «'+PROPS.find(([k])=>k===key)[1]+'».';
 return '';
}
function save(event){
 event.preventDefault();
 const type=$('seyveoCompanyType').value;
 const card={type:LABELS[type]?type:'npd'};
 for(const [key] of PROPS){
  const input=form.elements.namedItem(key);
  card[key]=input&&!input.disabled?clean(input.value).slice(0,LENGTH[key]):'';
 }
 const error=validate(card);
 if(error){status(dialog,error);return}
 if(!store(card)){status(dialog,'Не удалось сохранить на устройстве. Проверьте память браузера.');return}
 fillPreview();drawRows();status(dialog,'Данные сохранены на этом устройстве. Проверьте их перед отправкой.');
 window.dispatchEvent(new CustomEvent('seyveo:company-changed'));
}
function plain(kind){
 if(kind==='studio')return [
  'ПАСПОРТ ПРОДУКТА · SEYVEO',
  'Студия: SEYVEO — технологическая студия искусственного интеллекта и автоматизации',
  'Продукт: Цифровой управляющий',
  'Фирменная подпись: SEYVEO · IT · AI · AUTOMATION',
  'Сборка: демонстрационная версия',
  'Линейка: SEYVEO Business Start → Business Pro → Business Max',
  'SEYVEO Life: отдельное направление, доступное вместе с бизнес-уровнем',
  'Предпросмотр разработчика: '+(TIERS.find(t=>t.id===readPreview())||TIERS[1]).name,
  'Подписка и лицензия: не подключены. Предпросмотр не является покупкой',
  'Подключённый ИИ и внешние сервисы: отсутствуют',
  'Сведения о продукте представлены в приложении'
 ].join('\n');
 const card=load();
 return ['КАРТОЧКА КОМПАНИИ',...selectedRows(card).map(([k,v])=>k+': '+v),
  'Сведения внесены владельцем и не проверены по государственным реестрам.'].join('\n');
}
async function share(kind){
 if(kind==='company'&&!load().name){status(dialog,'Сначала сохраните данные компании.');return}
 const title=kind==='studio'?'Паспорт SEYVEO':'Карточка компании',message=plain(kind);
 const active=kind==='studio'?studio:dialog;
 if(typeof navigator.share==='function'){
  try{await navigator.share({title,text:message});status(active,'Данные переданы в меню отправки.');return}
  catch(e){if(e&&e.name==='AbortError'){status(active,'Отправка отменена.');return}}
 }
 try{
  if(navigator.clipboard&&navigator.clipboard.writeText){
   await navigator.clipboard.writeText(message);status(active,'Текст скопирован. Можете вставить его в сообщение.');return
  }
 }catch{}
 const area=document.createElement('textarea');area.value=message;area.readOnly=true;
 area.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(area);area.select();
 let copied=false;try{copied=document.execCommand('copy')}catch{}
 area.remove();status(active,copied?'Текст скопирован. Можете вставить его в сообщение.':'Не удалось скопировать. Попробуйте ещё раз.');
}
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function print(kind){
 const active=kind==='studio'?studio:dialog;
 if(kind==='company'&&!load().name){status(active,'Сначала сохраните данные компании.');return}
 const lines=plain(kind).split('\n').map(x=>'<p>'+escapeHtml(x)+'</p>').join('');
 const win=window.open('','_blank');
 if(!win){status(active,'Браузер заблокировал новое окно. Разрешите всплывающие окна для печати.');return}
 const title=kind==='studio'?'Паспорт SEYVEO':'Карточка компании';
 win.document.open();
 win.document.write('<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHtml(title)+'</title><style>body{font:15px/1.6 -apple-system,system-ui,sans-serif;color:#172033;max-width:720px;margin:30px auto;padding:0 22px}h1{font-size:25px}main{border:1px solid #c8d0da;border-radius:18px;padding:22px}p{margin:0 0 9px;overflow-wrap:anywhere}button{border:1px solid #adb7c8;border-radius:12px;padding:10px 20px;margin-bottom:16px;background:#fff;color:#172033}@media print{button{display:none}body{margin:0;padding:0}main{border:0;padding:0}}</style></head><body><button onclick="window.print()">Распечатать</button><main><h1>'+escapeHtml(title)+'</h1>'+lines+'</main></body></html>');
 win.document.close();
 try{win.focus();win.print()}catch{}
 status(active,'Открыта версия для печати. Если окно печати не появилось, нажмите «Распечатать» в новой вкладке.');
}
for(const button of studio.querySelectorAll('[data-seyveo-preview-tier]')){
 button.addEventListener('click',()=>setPreview(button.dataset.seyveoPreviewTier));
}
$('seyveoPreviewLower').addEventListener('click',()=>{
 const index=TIERS.findIndex(t=>t.id===readPreview());if(index>0)setPreview(TIERS[index-1].id);
});
$('seyveoPreviewHigher').addEventListener('click',()=>{
 const index=TIERS.findIndex(t=>t.id===readPreview());if(index>=0&&index<TIERS.length-1)setPreview(TIERS[index+1].id);
});
window.addEventListener('storage',event=>{if(event.key===DEV_PREVIEW_KEY)drawPreview()});
drawPreview();
/* Restore the original header behavior: logo opens developer passport, person icon opens company card.
   Exactly one preview at a time; there is no duplicate Management entry. */
function closeHeaderPassport(){
 if(!previewBox)return;
 previewBox.hidden=true;
 brand.hidden=true;company.hidden=true;
 brandTrigger?.setAttribute('aria-expanded','false');
 companyTrigger?.setAttribute('aria-expanded','false');
}
function toggleHeaderPassport(which){
 if(!previewBox)return;
 const trigger=which==='studio'?brandTrigger:companyTrigger;
 const card=which==='studio'?brand:company;
 const wasOpen=!previewBox.hidden&&!card.hidden;
 closeHeaderPassport();
 if(wasOpen)return;
 previewBox.hidden=false;card.hidden=false;
 trigger?.setAttribute('aria-expanded','true');
}
brandTrigger?.addEventListener('click',()=>toggleHeaderPassport('studio'));
companyTrigger?.addEventListener('click',()=>toggleHeaderPassport('company'));
document.addEventListener('pointerdown',event=>{
 if(previewBox?.hidden)return;
 if(previewBox.contains(event.target)||brandTrigger?.contains(event.target)||companyTrigger?.contains(event.target))return;
 closeHeaderPassport();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!previewBox?.hidden&&!studio.open&&!dialog.open){closeHeaderPassport();}
});
window.addEventListener('hashchange',closeHeaderPassport);
$('seyveoCompanyEditTop')?.addEventListener('click',()=>{
 const field=form.elements.namedItem('name');
 if(field&&typeof field.focus==='function')field.focus();
});
brand.addEventListener('click',openStudio);
company.addEventListener('click',openCompany);
form.addEventListener('submit',save);
$('seyveoCompanyType').addEventListener('change',toggleType);
$('seyveoStudioClose').addEventListener('click',()=>studio.close());
$('seyveoCompanyClose').addEventListener('click',()=>dialog.close());
$('seyveoStudioShare').addEventListener('click',()=>share('studio'));
$('seyveoStudioPrint').addEventListener('click',()=>print('studio'));
$('seyveoCompanyShare').addEventListener('click',()=>share('company'));
$('seyveoCompanyPrint').addEventListener('click',()=>print('company'));
for(const d of [studio,dialog])d.addEventListener('click',e=>{if(e.target===d)d.close()});
window.addEventListener('storage',e=>{if(e.key===KEY)fillPreview()});
fillPreview();
})();