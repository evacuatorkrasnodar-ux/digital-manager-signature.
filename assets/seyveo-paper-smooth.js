/* SEYVEO Paper · gentle local handwriting cleanup with an explicit preview.
   Coordinates alone change; strokes, pressure, color, text and photos remain owned
   by the original Notebook engine. The user approves every committed edit. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const sheet=document.getElementById('notePaperSheet');
 const menu=document.getElementById('notePaperSettingsMenu');
 const dock=document.getElementById('svPaperNewDock');
 const actions=menu?.querySelector('[data-sv-menu-panel="actions"]');
 const paper=window.SEYVEO_PAPER;
 if(!dialog||!sheet||!actions||!paper?.getEditableStrokes||!paper?.applyStrokeEdit||actions.querySelector('#notePaperSmoothInk'))return;
 const eligible=stroke=>['pen','pencil'].includes(stroke.tool)&&stroke.points?.length>=5;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const round=n=>Math.round(n*10)/10;
 // A short-range, corner-aware low-pass filter. Preserve both endpoints,
 // pressure, tilt, ink color, gaps between strokes and recognisable corners.
 function smoothPoints(points){
  if(!Array.isArray(points)||points.length<5)return points.map(point=>point.slice());
  let current=points.map(point=>point.slice());
  for(const amount of [.5,.34]){
   const next=current.map(point=>point.slice());
   for(let i=2;i<current.length-2;i++){
    const a=current[i-1],b=current[i],c=current[i+1];
    const ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-b[0],vy=c[1]-b[1];
    const before=Math.hypot(ux,uy),after=Math.hypot(vx,vy);
    if(before<.35||after<.35||Math.max(before,after)>48)continue;
    const cosine=clamp((ux*vx+uy*vy)/(before*after),-1,1);
    // Wide deliberate turns have longer sides; short alternating wiggles
    // are the jitter to suppress, even if their angles look sharp.
    const corner=Math.max(before,after)>10?clamp((cosine+.5)/1.3,.12,1):1;
    const strength=amount*corner;
    const limit=clamp(Math.min(before,after)*.55,.7,4.5);
    const shiftX=clamp(((a[0]+c[0])/2-b[0])*strength,-limit,limit);
    const shiftY=clamp(((a[1]+c[1])/2-b[1])*strength,-limit,limit);
    next[i][0]=round(b[0]+shiftX);next[i][1]=round(b[1]+shiftY);
   }
   current=next;
  }
  return current;
 }

 const action=document.createElement('button');
 action.type='button';action.id='notePaperSmoothInk';action.className='sv-newdock-menu-action';
 action.setAttribute('aria-label','Сэйви: сделать рукописный почерк аккуратнее');
 action.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 15.5c3.5-5.6 5.2-5.6 8.1-1.6s5.3 3.9 8.9-2.1"/><path d="M4 20h16M16.5 6.5l1-3 1 3 3 1-3 1-1 3-1-3-3-1z"/></svg><span>Сделать аккуратнее</span>';
 actions.insertBefore(action,actions.querySelector('#notePaperAddPhoto'));

 const layer=document.createElement('div');layer.className='sv-paper-smooth-layer';layer.hidden=true;
 layer.setAttribute('aria-label','Предпросмотр аккуратного почерка');
 const bar=document.createElement('div');bar.className='sv-paper-smooth-bar';
 bar.setAttribute('role','group');bar.setAttribute('aria-label','До и после сглаживания');
 const before=document.createElement('button');before.type='button';before.textContent='До';
 before.setAttribute('aria-label','Посмотреть исходный почерк');
 const after=document.createElement('button');after.type='button';after.textContent='После';
 after.setAttribute('aria-label','Посмотреть аккуратный почерк');
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Отмена';
 cancel.setAttribute('aria-label','Не менять исходный почерк');
 const apply=document.createElement('button');apply.type='button';apply.textContent='Применить';
 apply.className='sv-paper-smooth-apply';
 apply.setAttribute('aria-label','Применить аккуратный почерк с возможностью отмены');
 bar.append(before,after,cancel,apply);layer.append(bar);sheet.append(layer);
 let active=false,original=null,proposal=null,showAfter=true;
 function positionBar(){
  const top=sheet.getBoundingClientRect().top;
  const bottom=dock?.getBoundingClientRect().bottom||top+60;
  bar.style.top=Math.max(74,Math.ceil(bottom-top+14))+'px';
 }
 function compare(next){
  showAfter=next;
  before.setAttribute('aria-pressed',String(!next));
  after.setAttribute('aria-pressed',String(next));
  paper.previewStrokeEdit(next?proposal:original);
 }
 function stop(commit=false,restore=true){
  if(!active)return;
  active=false;layer.hidden=true;
  dialog.classList.remove('sv-paper-smooth-mode');
  action.setAttribute('aria-pressed','false');
  if(commit){
   if(!paper.applyStrokeEdit(proposal)&&restore)paper.previewStrokeEdit(original);
  }else if(restore)paper.previewStrokeEdit(original);
  original=null;proposal=null;
 }
 function start(){
  if(active){stop();return}
  if(dialog.classList.contains('sv-paper-text-mode'))document.getElementById('notePaperTextAction')?.click();
  if(dialog.classList.contains('sv-paper-photo-mode'))document.getElementById('notePaperEditPhoto')?.click();
  paper.cancelActiveStroke?.();
  original=paper.getEditableStrokes([]);
  const indices=original.flatMap((stroke,index)=>eligible(stroke)?[index]:[]);
  if(!indices.length){original=null;return}
  proposal=paper.getEditableStrokes(indices);
  let changed=0;
  for(const index of indices){
   const stroke=proposal[index],next=smoothPoints(stroke.points);
   for(let i=0;i<next.length;i++)if(Math.hypot(next[i][0]-stroke.points[i][0],next[i][1]-stroke.points[i][1])>.1)changed++;
   stroke.points=next;
  }
  if(!changed){original=null;proposal=null;return}
  active=true;layer.hidden=false;
  dialog.classList.add('sv-paper-smooth-mode');action.setAttribute('aria-pressed','true');
  positionBar();compare(true);
 }
 action.addEventListener('click',()=>{
  menu.hidden=true;document.getElementById('notePaperSettings')?.setAttribute('aria-expanded','false');
  start();
 });
 before.addEventListener('click',()=>compare(false));
 after.addEventListener('click',()=>compare(true));
 cancel.addEventListener('click',()=>stop(false));
 apply.addEventListener('click',()=>stop(true));
 dialog.addEventListener('click',event=>{
  if(active&&event.target.closest('#svPaperNewDock [data-paper-tool],#notePaperSave,#notePaperBack,#notePaperSayvi'))stop(false);
 },{capture:true});
 dialog.addEventListener('sv-paper-render',()=>{
  action.hidden=!paper.getEditableStrokes([]).some(eligible);
  // Undo or another external edit wins; never apply a stale proposal.
  if(active)stop(false,false);
 });
 dialog.addEventListener('close',()=>stop(false,false));
 window.addEventListener('resize',()=>{if(active)positionBar()});
 document.addEventListener('keydown',event=>{
  if(active&&event.key==='Escape'){event.preventDefault();stop(false)}
 });
 action.hidden=!paper.getEditableStrokes([]).some(eligible);
})();
