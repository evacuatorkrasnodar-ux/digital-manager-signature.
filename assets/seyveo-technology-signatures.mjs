/* SEYVEO technology signatures: semantic screen labels, no extra UI rows. */
const signatures=[
 ['#tasksPage .manage-heading .manage-caption','SEYVEO · ACTION MEMORY'],
 ['#picturePage .picture-head .manage-caption','SEYVEO · BUSINESS PULSE'],
 ['#lifeTitle','.life-eyebrow','SEYVEO · LIVING SPACE']
];
function setCaption(selector,caption){
 const el=document.querySelector(selector);
 if(el&&el.textContent!==caption)el.textContent=caption;
}
setCaption(signatures[0][0],signatures[0][1]);
setCaption(signatures[1][0],signatures[1][1]);
setCaption(signatures[2][1],signatures[2][2]);
