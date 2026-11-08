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
   const track=Math.min(190,window.innerHeight*.36);
   thicknessWrap.style.setProperty('--sv-thumb-offset',((.5-fraction)*(track-20))+'px');
   thicknessWrap.dataset.width=String(n);
   thickness.setAttribute('aria-valuetext',String(n));
  };
  const reveal=()=>{syncThickness();thicknessWrap.classList.add('sv-paper-size-active')};
  const hide=()=>thicknessWrap.classList.remove('sv-paper-size-active');
  thickness.addEventListener('pointerdown',reveal);
  thickness.addEventListener('input',reveal);
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
