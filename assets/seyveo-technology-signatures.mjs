/* SEYVEO signature captions. Only existing labels; no new navigation or rows. */
const signatures=[
 ['#tasksPage .manage-heading .manage-caption','SEYVEO · ACTION MEMORY'],
 ['#picturePage .picture-head .manage-caption','SEYVEO · BUSINESS PULSE'],
 ['.life-eyebrow','SEYVEO · LIVING SPACE'],
 ['#manageOverview .manage-heading .manage-caption','SEYVEO · CONTROL CENTER']
];
function applySignatures(){
 for(const [selector,caption] of signatures){
  const label=document.querySelector(selector);
  if(label&&label.textContent!==caption)label.textContent=caption;
 }
}
applySignatures();

/* Small signatures on existing function tiles, not extra menu items. */
const featureCaptions=[
 ['[data-calendar-space="health"]','SEYVEO · VITAL CARE'],
 ['[data-calendar-space="care"]','SEYVEO · PERSONAL CARE'],
 ['[data-business-hub="documents"]','SEYVEO · SECURE FLOW'],
 ['[data-clean-section="security"]','SEYVEO · PRIVATE CORE']
];
for(const [selector,caption] of featureCaptions){
 const tile=document.querySelector(selector);
 const subtitle=tile?.querySelector('small');
 if(subtitle){subtitle.textContent=caption;subtitle.classList.add('sv-technology-caption');}
}
const techStyle=document.createElement('style');
techStyle.textContent='.sv-technology-caption{font-size:9px!important;letter-spacing:.06em!important;color:var(--seyveo-emerald,var(--secondary))!important;font-weight:550!important}';
document.head.append(techStyle);
