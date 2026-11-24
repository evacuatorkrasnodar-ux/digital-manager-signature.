/* Local invitation draft, never sends credentials or grants permissions. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),dialog=$('svStaffInvitePage'),form=$('svStaffInviteForm'),open=$('svStaffInvite'),photo=$('svInvitePhoto'),image=$('svInvitePhotoPreview'),initials=$('svInviteInitials'),result=$('svInviteResult');
if(!dialog||!form||!open)return;
let method='link',photoUrl=null;
function clearResult(){result.hidden=true;$('svInviteQr').replaceChildren();$('svInviteQr').hidden=true;$('svInviteLink').hidden=true;}
function updateInitials(){initials.textContent=form.elements.name.value.trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'+';}
function choosePhoto(){photo.click()}
$('svInvitePhotoButton').addEventListener('click',choosePhoto);
$('svInvitePhotoText').addEventListener('click',choosePhoto);
photo.addEventListener('change',()=>{
 const file=photo.files?.[0];if(!file)return;
 if(!file.type.startsWith('image/'))return;
 if(photoUrl)URL.revokeObjectURL(photoUrl);
 photoUrl=URL.createObjectURL(file);image.src=photoUrl;image.hidden=false;initials.hidden=true;
 image.onerror=()=>{image.hidden=true;initials.hidden=false;URL.revokeObjectURL(photoUrl);photoUrl=null;image.removeAttribute('src');};
});
form.addEventListener('input',()=>{updateInitials();clearResult()});
form.querySelectorAll('[data-invite-method]').forEach(button=>button.addEventListener('click',()=>{
 method=button.dataset.inviteMethod;form.querySelectorAll('[data-invite-method]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));clearResult();
}));
open.addEventListener('click',()=>{
 if(dialog.open)return;clearResult();updateInitials();dialog.showModal();$('svStaffInvitePageScroll').scrollTop=0;window.SEYVEO_DOCK_CONTINUITY?.refresh?.();
});
$('svStaffInviteBack').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{if($('svcpManagerPeople')?.open)open.focus({preventScroll:true});});
form.addEventListener('submit',event=>{
 event.preventDefault();if(!form.reportValidity())return;
 clearResult();result.hidden=false;
 if(method==='qr'){
  const host=$('svInviteQr');host.hidden=false;
  try{if(!window.SEYVEO_INVITE_QR_PREVIEW)throw Error('QR unavailable');window.SEYVEO_INVITE_QR_PREVIEW(host);}
  catch{host.textContent='QR пока недоступен.';}
 }else $('svInviteLink').hidden=false;
 result.scrollIntoView({block:'nearest',behavior:'auto'});
});
})();
