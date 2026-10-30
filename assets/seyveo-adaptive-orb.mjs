/* SEYVEO adaptive sphere level 3. Observes existing card UI; no SVG edits. */
const home=document.getElementById('homePage');
const tiles=document.getElementById('seyveoLivingTiles');
if(home&&tiles){
 let pending=false;
 function refresh(){
  pending=false;
  const card=tiles.querySelector('.lm-field');
  const editor=card?.querySelector('.lm-mail-content:not([hidden]) textarea, .lm-document-content:not([hidden]) textarea');
  const expanded=card?.classList.contains('sv-card-expanded');
  const active=!!card&&card.dataset.lmMode==='preview'&&(!!expanded||!!editor);
  home.classList.toggle('sv-orb-level-3',active);
 }
 function queue(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(refresh);
 }
 new MutationObserver(queue).observe(tiles,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-lm-mode','hidden']});
 queue();
}
