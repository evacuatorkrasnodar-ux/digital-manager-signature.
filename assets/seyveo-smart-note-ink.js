/* SEYVEO Smart Notebook · one note, text and ink on the same page.
 * The existing text store and legacy handwriting/art pages are preserved. */
(()=>{
 'use strict';
 if(window.SEYVEO_SMART_NOTE_INK)return;
 const dlg=document.getElementById('noteReviewDialog');
 const form=document.getElementById('noteReviewForm');
 const bar=dlg?.querySelector('.sv-note-tools-compact');
 const textarea=document.getElementById('noteReviewText');
 const rich=document.getElementById('svNoteRichEditor');
 if(!dlg||!form||!bar||!textarea)return;
 const create=(id,label,body)=>{
  const el=document.createElement('button');el.type='button';el.dataset.svSmartTool=id;
  el.setAttribute('aria-label',label);el.title=label;
  el.innerHTML=body;return el;
 };
 const icon=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
 const textBtn=create('text','Текст и оформление','<span class="sv-smart-aa">Aa</span>');
 const tableBtn=create('table','Вставить таблицу',icon('<rect x="3.1" y="4.5" width="17.8" height="15" rx="1.4"/><path d="M3.1 10h17.8M3.1 15h17.8M10 4.5v15M16 4.5v15"/>'));
 const eraserBtn=create('eraser','Стереть рукопись',icon('<path d="m4.5 14 8.7-8.7a2.3 2.3 0 0 1 3.2 0l3.1 3.1a2.3 2.3 0 0 1 0 3.2L11.3 20H8.2zM9.4 9.1l7.1 7.1M12 20h8.5"/>'));
 const moreBtn=create('more','Дополнительные действия',icon('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'));
 const check=bar.querySelector('[data-note-tool="checklist"]');
 const attach=bar.querySelector('[data-note-tool="attachment"]');
 const draw=bar.querySelector('[data-note-tool="draw"]');
 if(!check||!attach||!draw)return;
 bar.insertBefore(textBtn,check);
 bar.insertBefore(tableBtn,attach);
 bar.append(eraserBtn,moreBtn);
 // Popovers must live outside the horizontally clipped scroller. Keep the
 // original nodes and their delegated handlers, never clone a working menu.
 for(const id of ['svNoteAttachmentMenu','svNoteFormatMenu']){
  const menu=document.getElementById(id);if(menu)dlg.append(menu);
 }
 bar.setAttribute('aria-label','Листаемые инструменты умной заметки');

 const W=840,STROKE_LIMIT=180,POINT_LIMIT=1200,BYTE_LIMIT=300000;
 const ink=document.createElement('canvas');ink.id='svSmartNoteInkCanvas';
 ink.className='sv-smart-ink-canvas';ink.setAttribute('aria-label','Рукопись поверх текста');
 ink.hidden=true;form.append(ink);
 const ctx=ink.getContext('2d');if(!ctx)return;
 let strokes=[],redo=[],mode='text',active=null,pointerId=null,noteId='';
 const getTarget=()=>rich&&!rich.hidden?rich:textarea;
 const report=text=>{const el=document.getElementById('noteReviewStatus');if(el){el.textContent=text;el.hidden=!text}};
 const buttons=[textBtn,draw,eraserBtn];
 function syncButtons(){
  textBtn.setAttribute('aria-pressed',String(mode==='text'));
  draw.setAttribute('aria-pressed',String(mode==='pen'));
  eraserBtn.setAttribute('aria-pressed',String(mode==='eraser'));
 }
 function geometry(){
  const rect=getTarget().getBoundingClientRect(),host=form.getBoundingClientRect();
  if(!rect.width||!rect.height)return null;
  return {rect,width:rect.width,height:rect.height,left:rect.left-host.left,top:rect.top-host.top};
 }
 function resize(){
  if(!dlg.open)return;
  const g=geometry();if(!g)return;
  ink.style.left=g.left+'px';ink.style.top=g.top+'px';
  ink.style.width=g.width+'px';ink.style.height=g.height+'px';
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const w=Math.max(1,Math.round(g.width*dpr)),h=Math.max(1,Math.round(g.height*dpr));
  if(ink.width!==w||ink.height!==h){ink.width=w;ink.height=h;}
  render();
 }
 function drawStroke(s){
  if(!s?.points?.length)return;
  ctx.save();
  ctx.globalCompositeOperation=s.tool==='eraser'?'destination-out':'source-over';
  ctx.lineWidth=s.width||5;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle=ctx.fillStyle='#171e29';
  ctx.beginPath();const pts=s.points;
  ctx.moveTo(pts[0][0],pts[0][1]);
  if(pts.length===1){ctx.arc(pts[0][0],pts[0][1],ctx.lineWidth/2,0,Math.PI*2);ctx.fill();}
  else {for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();}
  ctx.restore();
 }
 function render(){
  const width=ink.width,height=ink.height;
  if(!width||!height)return;
  const g=geometry();if(!g)return;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,width,height);
  const scale=width/W;
  ctx.setTransform(scale,0,0,scale,0,-(getTarget().scrollTop||0)*scale*W/g.width);
  strokes.forEach(drawStroke);if(active)drawStroke(active);
  ctx.setTransform(1,0,0,1,0,0);
 }
 function point(event){
  const g=geometry();if(!g)return [0,0,50];
  const k=W/g.width;
  return [Math.round(Math.max(0,Math.min(W,(event.clientX-g.rect.left)*k))*10)/10,
   Math.round(Math.max(0,(event.clientY-g.rect.top+getTarget().scrollTop)*k)*10)/10,
   Math.round(Math.min(100,Math.max(1,(event.pressure||.5)*100)))];
 }
 function save(){
  const api=window.SEYVEO_NOTES_API,editor=window.SEYVEO_NOTES_EDITOR;
  const id=editor?.ensureRecord?.();if(!id||!api)return false;
  const list=api.getNotes(),old=list.find(n=>n.id===id);if(!old)return false;
  const inlineInk={version:1,width:W,strokes:strokes.map(s=>({tool:s.tool,width:s.width,points:s.points.map(p=>p.slice())}))};
  if(JSON.stringify(inlineInk).length>BYTE_LIMIT){report('Слишком много рукописного текста на этом листе.');return false}
  const next=list.map(n=>n.id===id?{...n,inlineInk,updatedAt:Date.now()}:n);
  if(!api.putNotes(next)){report('Не удалось сохранить рукопись.');return false}
  noteId=id;return true;
 }
 function finish(event){
  if(pointerId===null||!active||event&&event.pointerId!==pointerId)return;
  if(strokes.length<STROKE_LIMIT&&active.points.length){strokes.push(active);redo=[];}
  pointerId=null;active=null;render();save();
 }
 function travelHistory(isRedo=false){
  if(active)return;
  if(isRedo){if(!redo.length)return;strokes.push(redo.pop());}
  else {if(!strokes.length)return;redo.push(strokes.pop());}
  render();save();
 }
 ink.addEventListener('pointerdown',event=>{
  if(mode==='text'||pointerId!==null||event.isPrimary===false||event.button>0)return;
  if(strokes.length>=STROKE_LIMIT){report('Лист заполнен. Сохраните заметку.');return}
  event.preventDefault();pointerId=event.pointerId;
  active={tool:mode,width:mode==='eraser'?35:5,points:[point(event)]};
  try{ink.setPointerCapture(event.pointerId)}catch{}
  render();
 });
 ink.addEventListener('pointermove',event=>{
  if(!active||event.pointerId!==pointerId)return;
  event.preventDefault();const p=point(event),last=active.points.at(-1);
  if(Math.hypot(p[0]-last[0],p[1]-last[1])>=1&&active.points.length<POINT_LIMIT){active.points.push(p);render();}
 });
 ink.addEventListener('pointerup',finish);ink.addEventListener('pointercancel',finish);
 ink.addEventListener('lostpointercapture',finish);
 function setMode(next,focus=false){
  if(!['text','pen','eraser'].includes(next))return;
  mode=next;dlg.classList.toggle('sv-smart-inking',next!=='text');
  ink.hidden=next==='text';
  if(next!=='text'&&dlg.contains(document.activeElement))document.activeElement?.blur?.();
  syncButtons();resize();
  if(focus&&next==='text')getTarget().focus({preventScroll:true});
 }
 function load(id){
  pointerId=null;active=null;mode='text';noteId=id||'';redo=[];
  const note=id?window.SEYVEO_NOTES_API?.getNotes()?.find(n=>n.id===id):null;
  strokes=Array.isArray(note?.inlineInk?.strokes)?note.inlineInk.strokes.slice(0,STROKE_LIMIT)
   .map(s=>({tool:s.tool==='eraser'?'eraser':'pen',width:Number(s.width)||5,
    points:Array.isArray(s.points)?s.points.slice(0,POINT_LIMIT).map(p=>p.slice(0,3)):[]})):[];
  ink.hidden=true;dlg.classList.remove('sv-smart-inking');syncButtons();
  requestAnimationFrame(resize);
 }
 dlg.addEventListener('seyveo:smart-note-open',event=>load(event.detail?.id||null));
 dlg.addEventListener('close',()=>{mode='text';ink.hidden=true;pointerId=null;active=null;dlg.classList.remove('sv-smart-inking');});
 dlg.addEventListener('scroll',render,true);
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
 observer?.observe(form);observer?.observe(textarea);if(rich)observer?.observe(rich);
 window.visualViewport?.addEventListener('resize',resize);
 window.addEventListener('resize',resize);
 // Capture ahead of the legacy drawing launcher: a pen now writes directly
 // on this very note, rather than navigating to the separate art tablet.
 dlg.addEventListener('click',event=>{
  if(mode!=='text'&&event.target.closest?.('#svNoteUndo')){
   event.preventDefault();event.stopImmediatePropagation();travelHistory();return;
  }
  const btn=event.target.closest?.('[data-note-tool="draw"]');if(!btn)return;
  event.preventDefault();event.stopImmediatePropagation();setMode('pen');
 },true);
 textBtn.addEventListener('click',()=>{
  if(mode!=='text'){setMode('text',true);return}
  dlg.querySelector('[data-note-tool="heading"]')?.click();
 });
 eraserBtn.addEventListener('click',()=>setMode('eraser'));
 tableBtn.addEventListener('click',()=>{
  setMode('text');
  const text='\n| Столбец 1 | Столбец 2 |\n| --- | --- |\n|   |   |\n';
  if(window.SEYVEO_NOTE_RICH?.isActive?.()){
   window.SEYVEO_NOTE_RICH.insertText(text);return;
  }
  const start=textarea.selectionStart,end=textarea.selectionEnd;
  textarea.setRangeText(text,start,end,'end');textarea.dispatchEvent(new Event('input',{bubbles:true}));
  textarea.focus({preventScroll:true});
 });
 moreBtn.addEventListener('click',()=>document.getElementById('svNoteMore')?.click());
 dlg.addEventListener('keydown',event=>{
  if(!dlg.open||mode==='text'||!((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='z'))return;
  event.preventDefault();travelHistory(event.shiftKey);
 });
 window.SEYVEO_SMART_NOTE_INK=Object.freeze({version:1,open:()=>setMode('pen'),text:()=>setMode('text'),getStrokes:()=>strokes.length});
 syncButtons();
})();
