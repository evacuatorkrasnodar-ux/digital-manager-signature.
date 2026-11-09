/* SEYVEO Paper · NEW top toolbar, November 2026.
   Independent seven-button component; no legacy toolbar markup, wrappers,
   pseudo-selection circles, or accumulated toolbar event handlers.
   Existing notebook-paper.js retains ownership of drawing and saving. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const dialog=$('notePaperDialog'),dock=$('svPaperNewDock');
 if(!dialog||!dock)return;

 const pen=dock.querySelector('[data-paper-tool="pen"]');
 const eraser=dock.querySelector('[data-paper-tool="eraser"]');
 const duplicate=$('notePaperDuplicate');
 const sheet=$('notePaperPatternTrigger');
 const paperMenu=$('notePaperPatternMenu');
 const patternLabel=$('notePaperPatternLabel');
 const photo=$('notePaperAddPhoto');
 const removePhoto=$('notePaperRemovePhoto');
 if(!pen||!eraser||!duplicate||!sheet||!paperMenu||!photo||!removePhoto)return;

 // One fresh icon language: every path shares a 24x24 grid and 1.7px stroke.
 const icon=paths=>'<svg class="sv-newdock-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
 const icons={
  pen:'<path d="M4.4 17.8c2-1.4 4.1-5.7 6.3-5.7 2.1 0 .1 4.3 2 4.3 1.1 0 2.6-2.2 4.2-2.2 1.2 0 .3 2.2 2.9 1.7M16.5 6.1l2.8-2.8 1.8 1.8-2.8 2.8-3 1.1z"/>',
  eraser:'<path d="m4.5 14.1 9-9a2.2 2.2 0 0 1 3.1 0l3.3 3.3a2.2 2.2 0 0 1 0 3.1L11.6 20H8.2l-3.7-3.7a1.6 1.6 0 0 1 0-2.2Z"/><path d="m10.5 8.2 6 6M11.6 20h9.2"/>',
  duplicate:'<rect x="8.8" y="8.6" width="12" height="12" rx="2.5"/><path d="M16.8 8.6V6.2a2.4 2.4 0 0 0-2.4-2.4H6.2a2.4 2.4 0 0 0-2.4 2.4v8.2a2.4 2.4 0 0 0 2.4 2.4h2.6"/>',
  settings:'<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2.5" fill="#202124"/><circle cx="16" cy="12" r="2.5" fill="#202124"/><circle cx="10" cy="18" r="2.5" fill="#202124"/>',
  sheet:'<rect x="5.5" y="3" width="13" height="18" rx="2"/><path d="M9 8.2h6M9 11.7h6M9 15.2h4"/>',
  photo:'<rect x="2.8" y="4" width="18.4" height="16" rx="2.6"/><circle cx="8" cy="9" r="1.4"/><path d="m4.8 17.4 4.5-4.8 3.3 3.2 2.6-3 3.5 4.6"/>',
  sayvi:'<path d="M12 2.5c1.7 0 2.1 4.6 3.7 6.1s5.7 2 5.7 3.4-4.1 2-5.7 3.5-2 6.1-3.7 6.1-2.1-4.6-3.7-6.1S2.6 13.5 2.6 12s4.1-1.9 5.7-3.4S10.3 2.5 12 2.5Z"/><circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none"/>'
 };
 const settings=document.createElement('button');
 settings.type='button';settings.id='notePaperSettings';
 settings.setAttribute('aria-label','Настройки листа');
 settings.title='Настройки';
 settings.setAttribute('aria-controls','notePaperSettingsMenu');
 settings.setAttribute('aria-haspopup','true');
 settings.setAttribute('aria-expanded','false');
 const sayvi=document.createElement('button');
 sayvi.type='button';sayvi.id='notePaperSayvi';
 sayvi.setAttribute('aria-label','Открыть Сэйви');sayvi.title='Сэйви';
 // Keep only the five tools used most while drawing.
 // Move original DOM nodes (not clones) for photo/duplicate into Settings,
 // preserving every existing drawing engine listener.
 const buttons=[pen,eraser,sheet,settings,sayvi];
 const names=['pen','eraser','sheet','settings','sayvi'];
 buttons.forEach((button,index)=>{
  button.className='sv-newdock-button';
  const key=names[index];
  button.innerHTML=icon(icons[key]);
  button.dataset.svAction=key;
  button.setAttribute('data-sv-active','false');
 });
 // notebook-paper.js holds the original pattern-label DOM node, retain it.
 patternLabel.className='sv-paper-visually-hidden';
 sheet.append(patternLabel);
 sheet.setAttribute('aria-label','Лист и фигуры');
 sheet.setAttribute('aria-haspopup','true');
 sheet.setAttribute('aria-controls','notePaperPatternMenu');
 sheet.setAttribute('aria-expanded','false');
 dock.replaceChildren(...buttons);
 // Secondary actions remain accessible in the flat graphite settings menu.
 dialog.append(paperMenu);
 const settingsHost=document.createElement('div');
 settingsHost.className='sv-newdock-settings-host';
 settingsHost.innerHTML='<div id="notePaperSettingsMenu" class="sv-newdock-settings-panel" role="group" aria-label="Настройки листа" hidden><span class="sv-newdock-menu-title">Фон листа</span><div class="sv-newdock-backgrounds"><button type="button" data-paper-background="dark" aria-pressed="true">Тёмный</button><button type="button" data-paper-background="light" aria-pressed="false">Светлый</button></div></div>';
 dialog.append(settingsHost);
 const settingsMenu=$('notePaperSettingsMenu');
 const clear=document.createElement('button');
 clear.type='button';clear.id='notePaperClearSheet';clear.className='sv-newdock-clear';
 clear.innerHTML=icon('<path d="M4 7h16M9 7V4.5h6V7M7 7l.8 13h8.4L17 7M10 10.5v6M14 10.5v6"/>')+'<span>Очистить весь лист</span>';
 removePhoto.querySelector('span')?.replaceChildren(document.createTextNode('Убрать фото'));
 const actionHeading=document.createElement('span');
 actionHeading.className='sv-newdock-menu-title sv-newdock-actions-heading';
 actionHeading.textContent='Действия';
 duplicate.className='sv-newdock-menu-action';
 duplicate.innerHTML=icon(icons.duplicate)+'<span>Дублировать штрих</span>';
 duplicate.title='Дублировать последний штрих';
 photo.className='sv-newdock-menu-action';
 photo.innerHTML=icon(icons.photo)+'<span>Добавить фото</span>';
 photo.title='Добавить фото';
 settingsMenu.append(actionHeading,photo,duplicate,removePhoto,clear);
 const backgroundButtons=[...settingsMenu.querySelectorAll('[data-paper-background]')];
 const syncBackground=()=>{
  const value=window.SEYVEO_PAPER?.getBackground?.();
  backgroundButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paperBackground===value)));
 };
 const closeSettings=(focus=false)=>{
  settingsMenu.hidden=true;settings.setAttribute('aria-expanded','false');
  if(focus)settings.focus({preventScroll:true});
 };
 const closePaper=()=>{
  paperMenu.hidden=true;sheet.setAttribute('aria-expanded','false');
 };
 settings.addEventListener('click',()=>{
  closePaper();
  const opening=settingsMenu.hidden;
  settingsMenu.hidden=!opening;settings.setAttribute('aria-expanded',String(opening));
  if(opening)syncBackground();
  syncActive();
 });
 sheet.addEventListener('click',()=>{closeSettings();requestAnimationFrame(syncActive)});
 backgroundButtons.forEach(b=>b.addEventListener('click',()=>{
  window.SEYVEO_PAPER?.setBackground?.(b.dataset.paperBackground);
  syncBackground();closeSettings();syncActive();
 }));
 clear.addEventListener('click',()=>{if(window.SEYVEO_PAPER?.clearSheet?.())closeSettings()});
 removePhoto.addEventListener('click',()=>closeSettings());
 duplicate.addEventListener('click',()=>closeSettings());
 photo.addEventListener('click',()=>closeSettings());
 sayvi.addEventListener('click',()=>window.SEYVEO_PAPER?.openSayvi?.());
 const activeTool=()=>dialog.querySelector('[data-paper-tool][aria-pressed="true"]')?.dataset.paperTool||'pen';
 const shapeNames=new Set(['line','arrow','rect','circle','triangle','diamond']);
 const paperChoices=[...paperMenu.querySelectorAll('[data-paper-pattern]')];
 let pickedPaper=false;
 function syncActive(){
  const tool=activeTool();
  const current=settingsMenu.hidden
   ?(!paperMenu.hidden||pickedPaper||shapeNames.has(tool)?'sheet':tool==='eraser'?'eraser':'pen')
   :'settings';
  buttons.forEach(b=>{
   b.setAttribute('data-sv-active',String(b.dataset.svAction===current));
  });
 }
 [pen,eraser].forEach(b=>b.addEventListener('click',()=>{
  pickedPaper=false;closeSettings();requestAnimationFrame(syncActive);
 }));
 paperMenu.querySelectorAll('[data-paper-tool]').forEach(b=>b.addEventListener('click',()=>{
  pickedPaper=false;requestAnimationFrame(syncActive);
 }));
 paperChoices.forEach(b=>b.addEventListener('click',()=>{
  pickedPaper=true;requestAnimationFrame(syncActive);
 }));
 // The drawing engine changes aria-pressed on these existing nodes.
 const observer=new MutationObserver(()=>syncActive());
 [pen,eraser,...paperMenu.querySelectorAll('[data-paper-tool]')].forEach(b=>
  observer.observe(b,{attributes:true,attributeFilter:['aria-pressed']}));
 observer.observe(settings,{attributes:true,attributeFilter:['aria-expanded']});
 observer.observe(sheet,{attributes:true,attributeFilter:['aria-expanded']});
 observer.observe(dialog,{attributes:true,attributeFilter:['open']});
 dock.addEventListener('click',()=>requestAnimationFrame(syncActive));
 // Dismissal must never create a dot on the canvas. Use capture phase so
 // this runs before the handwriting engine's canvas pointerdown listener.
 const colorMenu=$('notePaperColorMenu'),colorTrigger=$('notePaperColorTrigger');
 const dismissOpenMenus=()=>{
  if(!settingsMenu.hidden)closeSettings();
  if(!paperMenu.hidden)closePaper();
  if(colorMenu&&!colorMenu.hidden){
   colorMenu.hidden=true;
   colorTrigger?.setAttribute('aria-expanded','false');
  }
  syncActive();
 };
 document.addEventListener('pointerdown',event=>{
  if(!dialog.open)return;
  const colorOpen=Boolean(colorMenu&&!colorMenu.hidden);
  if(settingsMenu.hidden&&paperMenu.hidden&&!colorOpen)return;
  const target=event.target;
  if(!(target instanceof Element))return;
  // A click inside the active menu or on its own trigger is not a dismissal.
  if((!settingsMenu.hidden&&(settingsMenu.contains(target)||settings.contains(target)))
   ||(!paperMenu.hidden&&(paperMenu.contains(target)||sheet.contains(target)))
   ||(colorOpen&&(colorMenu.contains(target)||colorTrigger?.contains(target))))return;
  dismissOpenMenus();
  // First tap on drawing area ONLY dismisses. Do not deliver it to the
  // canvas pen listener, regardless of touch, mouse or stylus.
  if(target.closest('#notePaperStage')&&!target.closest('.sv-paper-size')){
   if(event.cancelable)event.preventDefault();
   event.stopImmediatePropagation();
  }
 },{capture:true});
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||settingsMenu.hidden)return;
  event.preventDefault();event.stopImmediatePropagation();
  closeSettings();syncActive();
 });
 dialog.addEventListener('close',()=>{closeSettings();pickedPaper=false});
 syncActive();
 // Retain existing thickness mechanics and the drawing-engine input.
 const range=$('notePaperWidth'),wrap=range?.closest('.sv-paper-size');
 if(range&&wrap){
  const syncWidth=()=>{
   const n=Number(range.value)||5,min=Number(range.min)||1,max=Number(range.max)||28;
   const travel=Math.min(190,window.innerHeight*.36)-28;
   wrap.style.setProperty('--sv-thumb-offset',((.5-(n-min)/(max-min))*travel)+'px');
   wrap.dataset.width=String(n);range.setAttribute('aria-valuetext',String(n));
  };
  let last=Number(range.value);
  range.addEventListener('input',()=>{
   const now=Number(range.value);
   if(now!==last&&typeof navigator.vibrate==='function')navigator.vibrate(5);
   last=now;syncWidth();
  });
  range.addEventListener('pointerdown',()=>wrap.classList.add('sv-paper-size-active'));
  for(const name of ['pointerup','pointercancel','blur','change'])
   range.addEventListener(name,()=>wrap.classList.remove('sv-paper-size-active'));
  window.addEventListener('resize',syncWidth,{passive:true});
  new MutationObserver(syncWidth).observe(dialog,{attributes:true,attributeFilter:['open']});
  syncWidth();
 }
 // Separate circular canvas cursor; never interferes with pointer drawing.
 const canvas=$('notePaperCanvas'),stage=$('notePaperStage'),paper=$('notePaperSheet');
 if(canvas&&stage){
  const ring=document.createElement('div');ring.className='sv-paper-eraser-ring';
  ring.setAttribute('aria-hidden','true');stage.append(ring);
  const hide=()=>ring.classList.remove('is-visible');
  const update=e=>{
   if(!dialog.open)return;
   if(e.pointerType==='touch'&&e.buttons===0)return;
   const box=canvas.getBoundingClientRect(),root=stage.getBoundingClientRect();
   if(!box.width)return;
   const x=Math.max(box.left,Math.min(box.right,e.clientX));
   const y=Math.max(box.top,Math.min(box.bottom,e.clientY));
   ring.style.left=(x-root.left)+'px';ring.style.top=(y-root.top)+'px';
   const erase=activeTool()==='eraser';
   const px=(Number(range?.value)||5)*box.width/840;
   const dia=Math.max(erase?19:15,Math.min(44,(erase?15:12)+px*1.4));
   ring.style.width=dia+'px';ring.style.height=dia+'px';
   ring.classList.toggle('sv-paper-cursor-brush',!erase);
   ring.classList.toggle('sv-paper-cursor-eraser',erase);
   ring.classList.toggle('on-light',paper?.dataset.inkBackground==='light');
   ring.classList.add('is-visible');
  };
  for(const ev of ['pointerenter','pointerdown','pointermove'])
   canvas.addEventListener(ev,update,{passive:true});
  for(const ev of ['pointerleave','pointercancel'])
   canvas.addEventListener(ev,hide,{passive:true});
  canvas.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')hide()},{passive:true});
  canvas.addEventListener('lostpointercapture',hide,{passive:true});
  dialog.addEventListener('close',hide);
  dock.addEventListener('click',hide);
  dialog.classList.add('sv-paper-cursor-mode');
 }
})();
