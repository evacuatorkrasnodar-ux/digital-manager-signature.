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
