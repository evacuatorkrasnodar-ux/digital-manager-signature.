/* SEYVEO Paper · compact brush chooser on the existing pen button.
 * Built AFTER Notebook and toolbar scripts; never adds a sixth dock icon. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const dock=document.getElementById('svPaperNewDock');
 const pen=dock?.querySelector('[data-paper-tool="pen"]');
 const engine=window.SEYVEO_PAPER;
 if(!dialog||!pen||!engine?.selectTool)return;
 const names={pen:'Ручка',pencil:'Карандаш',brush:'Кисть',spray:'Аэрограф',oil:'Масло',watercolor:'Акварель',marker:'Маркер',calligraphy:'Каллиграфия'};
 const glyphs={
  pen:'<path d="M4 18c3-3 4-8 7-7s2 5 6 3"/><path d="m16 7 3-3 2 2-3 3-3 1z"/>',
  pencil:'<path d="m4 20 4-1 12-12-3-3L5 16l-1 4zM14 7l3 3"/>',
  brush:'<path d="M15 4 20 9 11 18l-4-4 8-10Z"/><path d="M7 14c-4 1-4 4-4 7 3 0 7-1 8-4"/>',
  // Fine-art gravity-feed airbrush: needle, barrel, cup and finger trigger.
  // Distinct from a spray-paint aerosol can or a general-purpose sprayer.
  spray:'<path d="M2.7 13h3.4l1.1-1.2h11.3l2.7 1.2-2.7 1.2H7.2L6.1 13"/><path d="M12.4 11.8V8.7h4.3v3.1M13.2 8.7V6.2h2.7v2.5M14.2 6.2V4.7"/><path d="M10.4 11.8V9.9h1.7M15.3 14.2l-.9 4.8h-3.1l-.5-4.8"/>',
  // Oil paint: broad, recognisable flat paintbrush, never a thin syringe.
  oil:'<path d="M17.8 2.8a2.5 2.5 0 0 1 3.4 3.4l-7.6 7.6-3.4-3.4 7.6-7.6Z"/><path d="M10.2 10.4 7.8 12.8l3.4 3.4 2.4-2.4"/><path d="M7.8 12.8C4.5 13.1 3 16 3 21c4.8-.3 7.6-1.9 8.2-4.8"/><path d="M6 16.9c.8-.1 1.4-.5 1.9-1.1"/>',
  watercolor:'<path d="M12 2.8C9.8 6.4 5.1 11.1 5.1 15.2a6.9 6.9 0 0 0 13.8 0c0-4.1-4.7-8.8-6.9-12.4Z"/><path d="M8.3 16c.2 1.7 1.5 2.8 3.2 3.1"/><path d="M10.2 9.6c.5-.7 1.1-1.4 1.8-2.2"/>',
  marker:'<path d="m5 16.5 9.5-11a2.4 2.4 0 0 1 3.4-.2l1.4 1.3a2.4 2.4 0 0 1 .2 3.4l-9.5 11-5-4.5Z"/><path d="m5 16.5-1.5 4 6.5.5M12.8 7.5l4.3 3.8"/>',
  calligraphy:'<path d="M4 19.5c5-1.8 5.4-5 8-9.5l6.7-6.5 2.2 2.2-6.7 6.5c-4.2 2.8-7.5 4.5-10.2 7.3Z"/><path d="M5.5 17.2 8 19M15 9l3.2 3.2"/>'
 };
 const svg=tool=>'<svg viewBox="0 0 24 24" class="sv-newdock-glyph" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+glyphs[tool]+'</svg>';
 // The current settings pane contained a duplicate pen/pencil selector.
 // Reuse those exact controls in the popover to keep the UI consistent.
 const settings=document.getElementById('notePaperSettingsMenu');
 const oldChoices=settings?.querySelector('.sv-newdock-ink-choices');
 const heading=[...(settings?.querySelectorAll('.sv-newdock-menu-title')||[])]
  .find(node=>node.textContent.trim()==='Тип пера');
 const picker=document.createElement('div');
 picker.id='svPaperBrushPicker';picker.className='sv-paper-brush-picker';picker.hidden=true;
 picker.setAttribute('role','group');picker.setAttribute('aria-label','Инструменты рисования');
 const title=document.createElement('div');title.className='sv-brush-picker-title';
 title.textContent='Инструменты';
 const tools=document.createElement('div');tools.className='sv-brush-picker-grid';
 const existing=new Map([...(oldChoices?.querySelectorAll('[data-sv-tool-choice]')||[])]
  .map(node=>[node.dataset.svToolChoice,node]));
 for(const kind of Object.keys(names)){
  if(kind==='pen'||kind==='marker'){
   const heading=document.createElement('div');heading.className='sv-brush-picker-group';
   heading.textContent=kind==='pen'?'Рисование':'Письмо';tools.append(heading);
  }
  const btn=existing.get(kind)||document.createElement('button');
  btn.type='button';btn.dataset.svToolChoice=kind;
  btn.setAttribute('aria-label',names[kind]);
  btn.innerHTML=svg(kind)+'<span>'+names[kind]+'</span>';
  tools.append(btn);
 }
 heading?.remove();
 oldChoices?.remove();
 // The art tools get hidden state anchors so the proven engine's currentTool()
 // reads one active DOM node, including after eraser or shape selection.
 const hidden=document.createElement('div');hidden.hidden=true;
 for(const kind of ['brush','spray','oil','watercolor','marker','calligraphy']){
  const btn=document.createElement('button');
  btn.type='button';btn.hidden=true;btn.dataset.paperTool=kind;
  btn.setAttribute('aria-pressed','false');
  hidden.append(btn);
 }
 dialog.append(hidden);
 const tune=document.createElement('div');tune.className='sv-brush-opacity';
 tune.innerHTML='<label for="svBrushOpacity">Непрозрачность <output id="svBrushOpacityValue" for="svBrushOpacity">80%</output></label><input id="svBrushOpacity" type="range" min="10" max="100" step="5" value="80" aria-label="Непрозрачность выбранной кисти">';
 const range=tune.querySelector('input'),amount=tune.querySelector('output');
 picker.append(title,tools,tune);dialog.append(picker);
 pen.setAttribute('aria-haspopup','true');
 pen.setAttribute('aria-controls',picker.id);
 pen.setAttribute('aria-expanded','false');
 const selected=()=>engine.currentTool?.()||'pen';
 const ART=new Set(['brush','spray','oil','watercolor','marker','calligraphy']);
 let lastPaint='pen';
 function sync(){
  const current=selected();
  if(current!=='eraser'&&!['lasso','line','arrow','rect','circle','triangle','diamond'].includes(current))
   lastPaint=current in names?current:lastPaint;
  const shown=current in names?current:lastPaint;
  pen.innerHTML=svg(shown);
  // Prevent older toolbar sync from undoing the currently chosen icon.
  pen.dataset.svPencilActive=String(shown==='pencil');
  pen.setAttribute('aria-label',names[shown]+' · выбрать инструмент');
  pen.title=names[shown]+' · выбрать инструмент';
  tools.querySelectorAll('[data-sv-tool-choice]').forEach(btn=>
   btn.setAttribute('aria-pressed',String(btn.dataset.svToolChoice===shown)));
  tune.hidden=!ART.has(shown);
  if(ART.has(shown)){
   const value=Math.round((engine.getBrushOpacity?.(shown)||.8)*100);
   range.value=String(value);amount.textContent=value+'%';
  }
 }
 const close=()=>{
  if(picker.hidden)return;
  picker.hidden=true;pen.setAttribute('aria-expanded','false');
 };
 function toggle(){
  if(!picker.hidden){close();return}
  document.getElementById('notePaperSettingsMenu')?.setAttribute('hidden','');
  document.getElementById('notePaperSettings')?.setAttribute('aria-expanded','false');
  const pattern=document.getElementById('notePaperPatternMenu');
  if(pattern)pattern.hidden=true;
  document.getElementById('notePaperPatternTrigger')?.setAttribute('aria-expanded','false');
  picker.hidden=false;pen.setAttribute('aria-expanded','true');sync();
 }
 // Capture the existing pen's click BEFORE its legacy select-pen listener:
 // tapping the pen opens the tools instead of resetting Brush to Pen.
 pen.addEventListener('click',event=>{
  if(!dialog.open)return;
  event.preventDefault();event.stopImmediatePropagation();toggle();
 },true);
 // Existing pen/pencil options still have old click handlers; intercept on the
 // picker itself to prevent duplicate actions and the palette reopening.
 picker.addEventListener('click',event=>{
  const btn=event.target.closest?.('[data-sv-tool-choice]');
  if(!btn)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(engine.selectTool(btn.dataset.svToolChoice)){
   close();sync();
   requestAnimationFrame(sync);
  }
 },true);
 range.addEventListener('input',()=>{
  const kind=selected();
  if(!ART.has(kind))return;
  const value=Number(range.value);
  if(engine.setBrushOpacity?.(kind,value/100))amount.textContent=value+'%';
 });
 document.getElementById('notePaperSettings')?.addEventListener('click',close,true);
 document.getElementById('notePaperPatternTrigger')?.addEventListener('click',close,true);
 dock.querySelector('[data-paper-tool="eraser"]')?.addEventListener('click',close,true);
 dialog.addEventListener('sv-paper-tool-change',()=>{sync();requestAnimationFrame(sync)});
 document.addEventListener('pointerdown',event=>{
  if(!dialog.open||picker.hidden)return;
  if(picker.contains(event.target)||pen.contains(event.target))return;
  close();
  // A dismissing tap on the canvas is never a painted dot.
  if(event.target.closest?.('#notePaperStage')){
   if(event.cancelable)event.preventDefault();
   event.stopImmediatePropagation();
  }
 },true);
 document.addEventListener('touchstart',event=>{
  if(!dialog.open||picker.hidden)return;
  if(picker.contains(event.target)||pen.contains(event.target))return;
  close();
  if(event.target.closest?.('#notePaperStage')){
   if(event.cancelable)event.preventDefault();
   event.stopImmediatePropagation();
  }
 },{capture:true,passive:false});
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||picker.hidden)return;
  event.preventDefault();event.stopImmediatePropagation();close();
 });
 dialog.addEventListener('close',close);
 sync();
})();
