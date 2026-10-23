/* SEYVEO subscriptions: informational until real billing and auth are available. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const dialog=$('seyveoAccountDemo');
const launch=$('openSeyveoAccountDemo'),owner=$('openSeyveoAccountFromOwner');
if(!dialog||!launch)return;
function preview(){return {demo:false,activated:false,plan:null,short:null,expires:null,expirationShort:null,renewal:false};}
window.SEYVEO_GET_ACCOUNT_PREVIEW=preview;
function open(fromOwner=false){
 if(fromOwner){const company=$('seyveoCompanyDialog');if(company?.open)company.close();}
 if(!dialog.open)dialog.showModal();
}
window.SEYVEO_OPEN_ACCOUNT_DEMO=()=>open(false);
launch.addEventListener('click',()=>open(false));
owner?.addEventListener('click',()=>open(true));
$('seyveoAccountClose')?.addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
window.dispatchEvent(new CustomEvent('seyveo:account-preview-changed',{detail:preview()}));
})();
