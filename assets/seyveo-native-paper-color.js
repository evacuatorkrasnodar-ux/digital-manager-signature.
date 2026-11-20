/* Single native color input for the separate Drawing editor.
 * The original color menu is only used for GRADIENTS, never solid colors.
 * Safari/iOS requires direct taps on the input element, not showPicker(). */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const trigger=document.getElementById('notePaperColorTrigger');
 const control=trigger?.closest('.paper-color-control');
 const palette=dialog?.querySelector('.sv-paper-swatches');
 const menu=document.getElementById('notePaperColorMenu');
 const api=window.SEYVEO_PAPER;
 if(!dialog||!trigger||!control||!palette||!menu||!api?.setInkColor)return;
 if(document.getElementById('notePaperNativeColor'))return;
 const native=document.createElement('input');
 native.id='notePaperNativeColor';native.type='color';
 native.setAttribute('aria-label','Цвет пера — системная палитра устройства');
 native.value=api.getInkColor?.()||'#171e29';
 // A visible hit target over the rainbow swatch. Input receives direct tap.
 control.insertBefore(native,menu);
 const sync=()=>{
  const color=api.getInkColor?.();
  if(/^#[a-f0-9]{6}$/i.test(String(color||'')))native.value=color;
 };
 native.addEventListener('pointerdown',()=>{
  sync();
  if(!menu.hidden){
   menu.hidden=true;
   trigger.setAttribute('aria-expanded','false');
  }
 });
 native.addEventListener('input',event=>api.setInkColor(event.currentTarget.value));
 native.addEventListener('change',event=>api.setInkColor(event.currentTarget.value));
 dialog.addEventListener('click',event=>{
  if(event.target.closest?.('.sv-paper-swatches [data-paper-color]'))sync();
 });
 dialog.addEventListener('close',()=>{menu.hidden=true;sync();});
 const gradientButton=document.createElement('button');
 gradientButton.id='notePaperGradientTrigger';gradientButton.type='button';
 gradientButton.setAttribute('aria-label','Градиенты для кисти');
 gradientButton.title='Градиенты';
 gradientButton.innerHTML='<span aria-hidden="true"></span>';
 palette.prepend(gradientButton);
 gradientButton.addEventListener('click',()=>{
  if(menu.hidden)trigger.click();
  const tab=document.getElementById('notePaperColorMenu-gradients-tab');
  if(tab)tab.click();
  else{
   // Graceful fallback if menu polishing is unavailable.
   menu.querySelector('.sv-gradient-solid-grid')?.setAttribute('hidden','');
   menu.querySelector('.sv-gradient-presets')?.removeAttribute('hidden');
  }
 });
 // For the gradient entry, keep the original brush presets and editor.
 window.SEYVEO_NATIVE_PAPER_COLOR={input:native,gradientButton};
})();
