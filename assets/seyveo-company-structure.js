/* SEYVEO · local company structure preview; no real identities, roles or invites. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const STORAGE='seyveo-company-structure-draft-v1';
 const SOURCE='seyveo-company-acquaintance-draft-v1';
 const dialog=$('svCompanyIntroOpen')?.closest('section') && document.querySelector('dialog.sv-company-dialog');
 if(!dialog)return;
 const panel=document.createElement('section');
 panel.className='sv-org-preview';
 panel.hidden=true;
 panel.innerHTML=`<div class="sv-org-heading"><h3>Структура компании</h3><p>Черновик · только на этом устройстве</p></div>
 <p id="svOrgCompany"></p>
 <div id="svOrgBranches" class="sv-org-branches"></div>
 <div class="sv-org-actions"><button type="button" id="svOrgAddBranch">＋ Филиал</button><button type="button" id="svOrgAddRole">＋ Должность</button></div>
 <div id="svOrgRoles" class="sv-org-roles"></div>
 <p class="sv-company-note">Это схема, а не реальные сотрудники. Доступы, приглашения и корпоративные данные не создаются.</p>
 <button type="button" id="svOrgSave" class="sv-company-primary">Сохранить структуру</button>
 <p id="svOrgStatus" role="status" aria-live="polite"></p>`;
 dialog.insertBefore(panel,$('svCompanyStatus'));
 let model=null;
 const safe=(n,cap)=>Number.isInteger(n)&&n>=0&&n<=cap;
 const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
 function init(){
   const source=read(SOURCE),existing=read(STORAGE);
   if(!source || source.version!==1)return;
   const same=existing?.sourceUpdatedAt===source.updatedAt;
   if(same && Array.isArray(existing.branches)&&Array.isArray(existing.roles)){
     model={company:existing.company||'',branches:existing.branches.slice(0,150),roles:existing.roles.slice(0,100)};
   }else{
     const n=source.mode==='manual'&&safe(source.branches,9999)?Math.max(1,source.branches):1;
     model={company:source.name||'Моя компания',branches:Array.from({length:Math.min(15,n)},(_,i)=>'Филиал '+(i+1)),
       roles:['Директор','Управляющий','Сотрудник']};
   }
   model.sourceUpdatedAt=source.updatedAt;
   render();
 }
 function render(){
   if(!model)return;
   panel.hidden=false;
   $('svOrgCompany').textContent=model.company;
   const branchBox=$('svOrgBranches'),roleBox=$('svOrgRoles');
   branchBox.replaceChildren();roleBox.replaceChildren();
   const draw=(items,host,kind)=>{
     items.forEach((value,index)=>{
       const row=document.createElement('div');row.className='sv-org-item';
       const field=document.createElement('input');field.value=value;field.maxLength=80;
       field.setAttribute('aria-label',(kind==='branch'?'Название филиала ':'Должность ')+(index+1));
       field.addEventListener('input',()=>{items[index]=field.value.slice(0,80)});
       const remove=document.createElement('button');remove.type='button';remove.textContent='×';
       remove.setAttribute('aria-label','Удалить '+(kind==='branch'?'филиал':'должность')+' '+(index+1));
       remove.addEventListener('click',()=>{items.splice(index,1);render()});
       row.append(field,remove);host.append(row);
     });
   };
   draw(model.branches,branchBox,'branch');draw(model.roles,roleBox,'role');
 }
 $('svOrgAddBranch').addEventListener('click',()=>{if(!model||model.branches.length>=150)return;model.branches.push('Новый филиал');render()});
 $('svOrgAddRole').addEventListener('click',()=>{if(!model||model.roles.length>=100)return;model.roles.push('Новая должность');render()});
 $('svOrgSave').addEventListener('click',()=>{
   const status=$('svOrgStatus');
   if(!model){status.textContent='Сначала заполните знакомство с компанией.';return}
   const clean=s=>s.trim();
   const branches=model.branches.map(clean),roles=model.roles.map(clean);
   if(!branches.length||!roles.length||[...branches,...roles].some(s=>!s)){status.textContent='Оставьте хотя бы один филиал и одну должность; заполните названия.';return}
   if(new Set(branches.map(s=>s.toLocaleLowerCase('ru'))).size!==branches.length||new Set(roles.map(s=>s.toLocaleLowerCase('ru'))).size!==roles.length){status.textContent='Названия филиалов и должностей не должны повторяться.';return}
   try{localStorage.setItem(STORAGE,JSON.stringify({version:1,sourceUpdatedAt:model.sourceUpdatedAt,company:model.company,branches,roles,updatedAt:new Date().toISOString()}));status.textContent='Структура сохранена только на этом устройстве.'}
   catch{status.textContent='Не удалось сохранить структуру.'}
 });
 $('svCompanyIntroOpen').addEventListener('click',()=>setTimeout(init,0));
 $('svCompanyApprove').addEventListener('click',()=>setTimeout(init,0));
})();
