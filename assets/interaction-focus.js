/* SEYVEO · precise input modality for iOS Safari PWA.
   A finger tap must not leave a white outline on Back/Close and other controls.
   Hardware-keyboard navigation restores the existing accessible focus rings. */
(()=>{
  'use strict';
  const root=document.documentElement;
  // iPhone may programmatically focus a dialog button before the first tap.
  if(window.matchMedia?.('(hover:none) and (pointer:coarse)').matches){
    root.dataset.seyveoInput='touch';
  }
  const touch=()=>root.dataset.seyveoInput='touch';
  document.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'||event.pointerType==='pen')touch();
    else if(event.pointerType==='mouse')root.dataset.seyveoInput='mouse';
  },{capture:true,passive:true});
  if(!window.PointerEvent){
    document.addEventListener('touchstart',touch,{capture:true,passive:true});
  }
  document.addEventListener('keydown',event=>{
    if(event.metaKey||event.ctrlKey||event.altKey)return;
    if(['Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      root.dataset.seyveoInput='keyboard';
    }
  },true);
})();
