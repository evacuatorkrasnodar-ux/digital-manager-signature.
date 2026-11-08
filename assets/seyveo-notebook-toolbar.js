/* SEYVEO Paper · top glass controls. Reuses existing live notebook handlers. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const dialog=$('notePaperDialog');
 if(!dialog)return;

 // Keep the white thumb visually clean at rest. When moving, show its
 // exact line width on top of the knob, including on iPhone touch events.
 const thickness=$('notePaperWidth');
 const thicknessWrap=thickness?.closest('.sv-paper-size');
 if(thickness&&thicknessWrap){
  const syncThickness=()=>{
   const n=Math.max(Number(thickness.min)||1,Math.min(Number(thickness.max)||28,Number(thickness.value)||5));
   const max=Number(thickness.max)||28,min=Number(thickness.min)||1;
   const fraction=max===min ? 0.5 : (n-min)/(max-min);
   // Exact native slider travel (thumb 28 px). No tweening between steps.
   const track=Math.min(190,window.innerHeight*.36);
   thicknessWrap.style.setProperty('--sv-thumb-offset',((.5-fraction)*(track-28))+'px');
   thicknessWrap.dataset.width=String(n);
   thickness.setAttribute('aria-valuetext',String(n));
  };
  let lastDetent=Number(thickness.value);
  let dragging=false;
  const reveal=()=>{dragging=true;syncThickness();thicknessWrap.classList.add('sv-paper-size-active')};
  const hide=()=>{dragging=false;thicknessWrap.classList.remove('sv-paper-size-active')};
  thickness.addEventListener('pointerdown',reveal);
  thickness.addEventListener('input',()=>{
   const current=Number(thickness.value);
   if(current!==lastDetent){
    lastDetent=current;
    // Tiny haptic tick where the browser supports it; iOS Safari ignores it.
    if(dragging&&typeof navigator.vibrate==='function')navigator.vibrate(5);
   }
   syncThickness();
  });
  thickness.addEventListener('pointerup',hide);
  thickness.addEventListener('pointercancel',hide);
  thickness.addEventListener('change',hide);
  thickness.addEventListener('blur',hide);
  window.addEventListener('resize',syncThickness,{passive:true});
  new MutationObserver(()=>{if(dialog.open)syncThickness();else hide()})
   .observe(dialog,{attributes:true,attributeFilter:['open']});
  syncThickness();
 }

 const bar=dialog.querySelector('.paper-toolbar-primary');
 if(!dialog||!bar||$('notePaperSettings'))return;
 const pencil=dialog.querySelector('[data-paper-tool="pencil"]');
 pencil?.remove();
 const duplicate=$('notePaperDuplicate'),paper=dialog.querySelector('.paper-pattern-control');
 const photo=$('notePaperAddPhoto'),file=$('notePaperPhotoFile'),removePhoto=$('notePaperRemovePhoto');
 if(!duplicate||!paper||!photo||!file||!removePhoto)return;
 duplicate.remove();
 const settings=document.createElement('div');
 settings.className='sv-paper-settings';
 settings.innerHTML='<button id="notePaperSettings" type="button" title="Настройки" aria-label="Настройки листа" aria-expanded="false" aria-controls="notePaperSettingsMenu" aria-haspopup="true"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.1"/><path d="M10.1 2.9h3.8l.6 2.2 1.7.8 2.1-1.1 2.7 2.7-1.1 2.1.8 1.7 2.2.6v3.8l-2.2.6-.8 1.7 1.1 2.1-2.7 2.7-2.1-1.1-1.7.8-.6 2.2h-3.8l-.6-2.2-1.7-.8-2.1 1.1-2.7-2.7 1.1-2.1-.8-1.7-2.2-.6v-3.8l2.2-.6.8-1.7-1.1-2.1 2.7-2.7 2.1 1.1 1.7-.8Z"/></svg></button><div id="notePaperSettingsMenu" class="sv-paper-settings-menu" role="group" aria-label="Настройки листа" hidden><span class="sv-paper-settings-title">Фон листа</span><div class="sv-paper-backgrounds" role="group" aria-label="Цвет бумаги"><button type="button" data-paper-background="dark" aria-pressed="true">Тёмный</button><button type="button" data-paper-background="light" aria-pressed="false">Светлый</button></div></div>';
 const trigger=settings.querySelector('#notePaperSettings'),menu=settings.querySelector('#notePaperSettingsMenu');
 duplicate.innerHTML+='<span>Дублировать штрих</span>';
 duplicate.removeAttribute('title');
 menu.append(duplicate);
 removePhoto.querySelector('span')?.replaceChildren(document.createTextNode('Убрать фото'));
 menu.append(removePhoto);
 const sayvi=document.createElement('button');
 sayvi.type='button';sayvi.id='notePaperSayvi';sayvi.title='Сэйви';
 sayvi.setAttribute('aria-label','Открыть чат Сэйви');
 sayvi.innerHTML='<img src="assets/sayvi-mark.svg" alt="" aria-hidden="true">';
 const pen=bar.querySelector('[data-paper-tool="pen"]');
 const eraser=bar.querySelector('[data-paper-tool="eraser"]');
 bar.replaceChildren(pen,eraser,settings,paper,photo,file,sayvi);
 // SEYVEO signature icon family: consistent 24x24 drawing grid,
 // rounded 1.7px stroke and a single inherited silver-white ink color.
 // Keep all existing buttons/IDs/listeners and only replace their artwork.
 const glyph=(paths)=>'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
 const artwork={
  pen:'<path d="m5 16.8 10.5-10.5a2.1 2.1 0 0 1 3 3L8 19.8l-4 1 1-4Z"/><path d="m13.5 8.3 2.2 2.2"/>',
  eraser:'<path d="m5 14.2 8.3-8.3a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2.8L11.8 19H8L5 16a1.3 1.3 0 0 1 0-1.8Z"/><path d="m10.7 8.5 5 5"/><path d="M11.8 19H20"/>',
  settings:'<circle cx="12" cy="12" r="2.8"/><path d="M10 3.2h4l.5 2 1.65.7 1.8-1.05 2.75 2.75-1.05 1.8.7 1.65 2 .5v4l-2 .5-.7 1.65 1.05 1.8-2.75 2.75-1.8-1.05-1.65.7-.5 2h-4l-.5-2-1.65-.7-1.8 1.05-2.75-2.75 1.05-1.8-.7-1.65-2-.5v-4l2-.5.7-1.65-1.05-1.8L6.1 4.85l1.8 1.05 1.65-.7.45-2Z"/>',
  sheet:'<rect x="5.3" y="3.4" width="13.4" height="17.2" rx="2.1"/><path d="M8.7 9.2h6.6M8.7 12.6h6.6M8.7 16h4.1"/>',
  photo:'<rect x="3.2" y="4.3" width="17.6" height="15.4" rx="2.5"/><circle cx="8.4" cy="9.2" r="1.35"/><path d="m5.4 17.2 4.7-4.8 3.1 3.1 2.7-3.2 3.1 4"/>',
  sayvi:'<path d="M12 2.9c1.54 0 2.15 4.14 4.05 5.65 1.54 1.4 5.05 1.78 5.05 3.45s-3.51 2.05-5.05 3.45c-1.9 1.51-2.51 5.65-4.05 5.65s-2.15-4.14-4.05-5.65C6.41 14.05 2.9 13.67 2.9 12s3.51-2.05 5.05-3.45C9.85 7.04 10.46 2.9 12 2.9Z"/><circle cx="12" cy="12" r="1.55" fill="currentColor" stroke="none"/>'
 };
 const applyGlyph=(button,kind)=>{if(button)button.innerHTML=glyph(artwork[kind])};
 applyGlyph(pen,'pen');
 applyGlyph(eraser,'eraser');
 applyGlyph(trigger,'settings');
 applyGlyph(paper.querySelector('#notePaperPatternTrigger'),'sheet');
 applyGlyph(photo,'photo');
 applyGlyph(sayvi,'sayvi');

 bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Инструменты листа');
 dialog.querySelector('.paper-toolbar')?.setAttribute('aria-label','Инструменты и параметры листа');
 paper.querySelector('#notePaperPatternTrigger')?.setAttribute('title','Лист');
 paper.querySelector('#notePaperPatternTrigger')?.setAttribute('aria-label','Лист: выбрать тип бумаги');
 // Only icons in the capsule. Legacy captions/carets belong to old menus.
 $('notePaperPatternTrigger')?.querySelectorAll('span,.sv-paper-caret').forEach(node=>node.remove());
 photo.querySelectorAll('span').forEach(node=>node.remove());
 file.hidden=true;
 // The old floating ellipsis is removed, never duplicated in the top controls.
 dialog.querySelector('.sv-paper-extras')?.remove();
 const choices=[...settings.querySelectorAll('[data-paper-background]')];
 function sync(){
  const current=window.SEYVEO_PAPER?.getBackground?.();
  choices.forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.paperBackground===current)));
 }
 function close(focus=false){
  menu.hidden=true;trigger.setAttribute('aria-expanded','false');
  if(focus)trigger.focus({preventScroll:true});
 }
 trigger.addEventListener('click',()=>{
  $('notePaperPatternMenu')?.setAttribute('hidden','');
  $('notePaperPatternTrigger')?.setAttribute('aria-expanded','false');
  const opening=menu.hidden;menu.hidden=!opening;
  trigger.setAttribute('aria-expanded',String(opening));
  if(opening)sync();
 });
 choices.forEach(btn=>btn.addEventListener('click',()=>{
  window.SEYVEO_PAPER?.setBackground?.(btn.dataset.paperBackground);
  sync();close(true);
 }));
 paper.querySelector('#notePaperPatternTrigger')?.addEventListener('click',()=>close());
 photo.addEventListener('click',()=>close());
 duplicate.addEventListener('click',()=>close());
 removePhoto.addEventListener('click',()=>close());
 sayvi.addEventListener('click',()=>window.SEYVEO_PAPER?.openSayvi?.());
 document.addEventListener('pointerdown',event=>{
  if(!menu.hidden&&!settings.contains(event.target))close();
 });
 dialog.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!menu.hidden){event.preventDefault();event.stopPropagation();close(true);}
 });
 dialog.addEventListener('close',()=>close());
 new MutationObserver(()=>{if(dialog.open)sync()}).observe(dialog,{attributes:true,attributeFilter:['open']});
})();
