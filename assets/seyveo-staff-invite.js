/* Local invitation draft, never sends credentials or grants permissions. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),dialog=$('svStaffInvitePage'),form=$('svStaffInviteForm'),open=$('svStaffInvite'),photo=$('svInvitePhoto'),image=$('svInvitePhotoPreview'),initials=$('svInviteInitials'),result=$('svInviteResult');
if(!dialog||!form||!open)return;
// Like staff and candidate detail, mount outside the cabinet's clipped shell.
if(dialog.parentElement!==document.body)document.body.appendChild(dialog);
let method='link',photoUrl=null;
const submit=form.querySelector('.sv-invite-primary');
function updateSubmit(){submit.disabled=!form.checkValidity()||!form.elements.name.value.trim()||!form.elements.job.value.trim();}
function clearResult(){result.hidden=true;$('svInviteQr').replaceChildren();$('svInviteQr').hidden=true;$('svInviteLink').hidden=true;}
function updateInitials(){const value=form.elements.name.value.trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();const icon=$('svInvitePersonIcon'),letters=$('svInviteLetters');if(icon&&letters){icon.hidden=!!value;letters.hidden=!value;letters.textContent=value;}else initials.textContent=value||'+';}
function choosePhoto(){photo.click()}
$('svInvitePhotoButton').addEventListener('click',choosePhoto);

photo.addEventListener('change',()=>{
 const file=photo.files?.[0];if(!file)return;
 if(!file.type.startsWith('image/'))return;
 if(photoUrl)URL.revokeObjectURL(photoUrl);
 photoUrl=URL.createObjectURL(file);image.src=photoUrl;image.hidden=false;initials.hidden=true;
 image.onerror=()=>{image.hidden=true;initials.hidden=false;URL.revokeObjectURL(photoUrl);photoUrl=null;image.removeAttribute('src');};
});
form.addEventListener('input',()=>{updateInitials();updateSubmit();clearResult()});
form.querySelectorAll('[data-invite-method]').forEach(button=>button.addEventListener('click',()=>{
 method=button.dataset.inviteMethod;form.querySelectorAll('[data-invite-method]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));clearResult();
}));
open.addEventListener('click',()=>{
 if(dialog.open)return;clearResult();updateInitials();updateSubmit();dialog.showModal();$('svStaffInvitePageScroll').scrollTop=0;
});
$('svStaffInviteBack').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{if($('svcpManagerPeople')?.open)open.focus({preventScroll:true});});
form.addEventListener('submit',event=>{
 event.preventDefault();updateSubmit();if(submit.disabled||!form.reportValidity())return;
 clearResult();result.hidden=false;
 if(method==='qr'){
  const host=$('svInviteQr');host.hidden=false;
  try{if(!window.SEYVEO_INVITE_QR_PREVIEW)throw Error('QR unavailable');window.SEYVEO_INVITE_QR_PREVIEW(host);}
  catch{host.textContent='QR пока недоступен.';}
 }else $('svInviteLink').hidden=false;
 result.scrollIntoView({block:'nearest',behavior:'auto'});
});
updateInitials();updateSubmit();
})();
