/* SEYVEO · explicit demonstration switch; opt-in for this browser tab only.
 * This never writes to user business records and never enables an external API.
 * Education state is discarded when switching off or closing the tab.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const exit=$('pictureDemoExit'),label=$('pictureDemoLabel'),workspace=$('pictureDemoWorkspace');
// The visible demo toggle was retired from Management. Keep the
// internal compatibility API for old Pulse modules, but do not re-enable an
// invisible demonstration from a previous browser session.
if(!exit||!label||!workspace)return;
const KEY='seyveo-demo-session-v1';
let enabled=false;
try{sessionStorage.removeItem(KEY)}catch{}
function sync(){
 workspace.hidden=!enabled;
 exit.hidden=!enabled;
 // The numeric illustration is controlled separately by Picture.
 if(!enabled)label.hidden=true;
 document.documentElement.dataset.seyveoDemo=enabled?'on':'off';
}
function setMode(value){
 const next=!!value;
 if(enabled===next)return;
 enabled=next;
 try{if(enabled)sessionStorage.setItem(KEY,'on');else sessionStorage.removeItem(KEY)}catch{}
 sync();
 if(!enabled)window.dispatchEvent(new Event('seyveo:demo-mode-reset'));
 window.dispatchEvent(new CustomEvent('seyveo:demo-mode-changed',{detail:{enabled}}));
}
exit.addEventListener('click',()=>setMode(false));
window.SEYVEO_DEMO_MODE=Object.freeze({
 isEnabled:()=>enabled,
 setEnabled:setMode
});
sync();
})();
