import './seyveo-private-core-overview.mjs';
/* Apply brand captions after dynamic screens render. No duplicate nodes. */
const captions=[
 ['#tasksPage .manage-heading .manage-caption','SEYVEO · ACTION MEMORY'],
 ['#picturePage .picture-head .manage-caption','SEYVEO · BUSINESS PULSE'],
 ['.life-eyebrow','SEYVEO · LIVING SPACE'],
 ['#manageOverview .manage-heading .manage-caption','SEYVEO · CONTROL CENTER']
];
const features=[
 ['[data-calendar-space="health"]','SEYVEO · VITAL CARE'],
 ['[data-calendar-space="care"]','SEYVEO · PERSONAL CARE'],
 ['[data-business-hub="documents"]','SEYVEO · SECURE FLOW'],
 ['[data-clean-section="security"]','SEYVEO · PRIVATE CORE']
];
const style=document.createElement('style');
style.textContent='.sv-technology-caption{display:block!important;font-size:10px!important;line-height:1.45!important;letter-spacing:.075em!important;color:var(--seyveo-emerald,#9bd5b7)!important;opacity:1!important;font-weight:550!important}.manage-caption.sv-signature,.life-eyebrow.sv-signature{color:var(--seyveo-emerald,#9bd5b7)!important;opacity:1!important;letter-spacing:.1em!important}';
document.head.append(style);
style.textContent+=' .sv-technology-caption{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}';
function apply(){
 for(const [selector,value] of captions){
  const el=document.querySelector(selector);
  if(!el)continue;
  if(el.textContent!==value)el.textContent=value;
  el.classList.add('sv-signature');
 }
 for(const [selector,value] of features){
  const item=document.querySelector(selector),sub=item?.querySelector('small');
  if(!sub)continue;
  if(sub.textContent!==value)sub.textContent=value;
  sub.classList.add('sv-technology-caption');
 }
}
apply();
let scheduled=false;
const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});};
new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});
window.addEventListener('hashchange',schedule);
window.addEventListener('pageshow',schedule);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
