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

 // SEYVEO signature ink · intentionally drawn as one six-symbol family.
 // All marks share a 28-unit optical grid and polished silver linework.
 const glyph=(content)=>'<svg class="sv-paper-signature" viewBox="0 0 28 28" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">'+content+'</svg>';
 const artwork={
  pen:
    '<path class="sv-paper-icon-shade" d="m5.3 20.7 12-12 3 3-12 12-3.8 1Z"/>'+
    '<path d="m4.4 24.7 1.2-4.6L17.3 8.4a3.0 3.0 0 0 1 4.3 4.3L9.8 24.4l-5.4.3Z"/>'+
    '<path d="m15.1 10.6 4.3 4.3M5.8 20.6l3.5 3.5"/>'+
    '<path d="m17.8 7.8 2.4-2.4a1.6 1.6 0 0 1 2.2 2.2l-.9.9"/>',
  eraser:
    '<path class="sv-paper-icon-shade" d="m5.5 16.5 10-10 6.1 6.1-10 10H9.1Z"/>'+
    '<path d="M5.7 16.7 15.6 6.8a2.6 2.6 0 0 1 3.7 0l2.5 2.5a2.6 2.6 0 0 1 0 3.7l-9.9 9.9H9.1l-3.4-3.4a2 2 0 0 1 0-2.8Z"/>'+
    '<path d="m11.4 11.1 6.2 6.2M11.9 22.9h11.9"/>',
  settings:
    '<path d="M4.3 7.2h8.3m5.7 0h5.4M4.3 14h3.8m5.7 0h9.9M4.3 20.8h12.3m5.5 0h1.6"/>'+
    '<circle class="sv-paper-icon-knob" cx="15.4" cy="7.2" r="2.8"/>'+
    '<circle class="sv-paper-icon-knob" cx="10.9" cy="14" r="2.8"/>'+
    '<circle class="sv-paper-icon-knob" cx="19.3" cy="20.8" r="2.8"/>',
  sheet:
    '<path class="sv-paper-icon-shade" d="M17.5 3.2v5.1h5.1Z"/>'+
    '<path d="M7.6 3.2h9.9l5.1 5.1v14.2a2.4 2.4 0 0 1-2.4 2.4H7.6a2.4 2.4 0 0 1-2.4-2.4V5.6a2.4 2.4 0 0 1 2.4-2.4Z"/>'+
    '<path d="M17.5 3.4v5h5M9.5 12.5h8.5M9.5 16.4h8.5M9.5 20.3h5.5"/>',
  photo:
    '<rect class="sv-paper-icon-shade" x="3.4" y="4.5" width="21.2" height="19.1" rx="3.1"/>'+
    '<rect x="3.4" y="4.5" width="21.2" height="19.1" rx="3.1"/>'+
    '<circle cx="9.2" cy="10.4" r="1.65"/>'+
    '<path d="m5.4 20.5 5.3-5.7 3.8 3.8 3.1-3.4 5 5.3"/>',
  sayvi:
    '<path class="sv-paper-icon-shade" d="M14 2.5c1.8 0 2.4 5.5 4.5 7s7 2.7 7 4.5-4.9 2.9-7 4.5-2.7 7-4.5 7-2.4-5.5-4.5-7-7-2.7-7-4.5 4.9-2.9 7-4.5 2.7-7 4.5-7Z"/>'+
    '<path d="M14 2.5c1.8 0 2.4 5.5 4.5 7s7 2.7 7 4.5-4.9 2.9-7 4.5-2.7 7-4.5 7-2.4-5.5-4.5-7-7-2.7-7-4.5 4.9-2.9 7-4.5 2.7-7 4.5-7Z"/>'+
    '<circle class="sv-paper-icon-core" cx="14" cy="14" r="1.65"/>'
 };
 const applyGlyph=(button,kind)=>{if(button)button.innerHTML=glyph(artwork[kind])};
 applyGlyph(pen,'pen');
 applyGlyph(eraser,'eraser');
 applyGlyph(trigger,'settings');
 applyGlyph(paper.querySelector('#notePaperPatternTrigger'),'sheet');
 applyGlyph(photo,'photo');
 applyGlyph(sayvi,'sayvi');
 // The native crosshair was misleading for erasing. One decorative,
 // pointer-events-free ring follows the actual pointer on the canvas.
 // The drawing engine and its pointer capture stay untouched.
 const previewCanvas=$('notePaperCanvas');
 const previewStage=$('notePaperStage');
 const previewSheet=$('notePaperSheet');
 if(previewCanvas&&previewStage&&eraser){
  const ring=document.createElement('div');
  ring.className='sv-paper-eraser-ring';
  ring.setAttribute('aria-hidden','true');
  previewStage.appendChild(ring);
  const erasing=()=>eraser.getAttribute('aria-pressed')==='true'&&dialog.open;
  const hideRing=()=>{ring.classList.remove('is-visible')};
  const syncEraser=()=>{
   const active=erasing();
   dialog.classList.toggle('sv-paper-eraser-mode',active);
   if(!active)hideRing();
  };
  const positionRing=event=>{
   if(!erasing())return;
   if(event.pointerType==='touch'&&event.buttons===0)return;
   const box=previewCanvas.getBoundingClientRect();
   if(!box.width||!box.height)return;
   const x=Math.min(box.right,Math.max(box.left,event.clientX));
   const y=Math.min(box.bottom,Math.max(box.top,event.clientY));
   const stageBox=previewStage.getBoundingClientRect();
   ring.style.left=(x-stageBox.left)+'px';
   ring.style.top=(y-stageBox.top)+'px';
   const width=Number(thickness?.value)||5;
   const rendered=width*box.width/840;
   const diameter=Math.max(20,Math.min(46,18+rendered*1.45));
   ring.style.width=diameter+'px';
   ring.style.height=diameter+'px';
   ring.classList.toggle('on-light',previewSheet?.dataset.inkBackground==='light');
   ring.classList.add('is-visible');
  };
  eraser.addEventListener('click',syncEraser);
  pen?.addEventListener('click',syncEraser);
  new MutationObserver(syncEraser).observe(eraser,{attributes:true,attributeFilter:['aria-pressed']});
  previewCanvas.addEventListener('pointerenter',positionRing,{passive:true});
  previewCanvas.addEventListener('pointerdown',positionRing,{passive:true});
  previewCanvas.addEventListener('pointermove',positionRing,{passive:true});
  previewCanvas.addEventListener('pointerleave',hideRing,{passive:true});
  previewCanvas.addEventListener('pointerup',event=>{
   if(event.pointerType==='touch'||event.pointerType==='pen')hideRing();
  },{passive:true});
  previewCanvas.addEventListener('pointercancel',hideRing,{passive:true});
  previewStage.addEventListener('pointerdown',event=>{
   if(!previewCanvas.contains(event.target))hideRing();
  },{passive:true});
  dialog.addEventListener('close',()=>{hideRing();dialog.classList.remove('sv-paper-eraser-mode')});
  syncEraser();
 }


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
