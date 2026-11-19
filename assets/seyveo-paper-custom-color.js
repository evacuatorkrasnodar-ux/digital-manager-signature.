/* SEYVEO Paper · precision color picker inside the existing Color menu. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const menu=document.getElementById('notePaperColorMenu');
 const pane=menu?.querySelector('[data-sv-menu-panel="colors"]');
 const trigger=document.getElementById('notePaperColorTrigger');
 const sheet=document.getElementById('notePaperSheet');
 const canvas=document.getElementById('notePaperCanvas');
 const paper=window.SEYVEO_PAPER;
 if(!dialog||!pane||!trigger||!sheet||!canvas||!paper?.setInkColor||pane.querySelector('.sv-ink-custom'))return;
 const hexPattern=/^#[0-9a-f]{6}$/i;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const pad=n=>Math.round(clamp(n,0,255)).toString(16).padStart(2,'0');
 const rgbHex=(r,g,b)=>'#'+pad(r)+pad(g)+pad(b);
 const fromHex=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 function rgbHsv(r,g,b){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0;
  if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h=(h*60+360)%360}
  return {h,s:max?d/max:0,v:max};
 }
 function hsvRgb(h,s,v){
  const c=v*s,x=c*(1-Math.abs(((h/60)%2)-1)),m=v-c;
  let rgb;
  if(h<60)rgb=[c,x,0];else if(h<120)rgb=[x,c,0];else if(h<180)rgb=[0,c,x];
  else if(h<240)rgb=[0,x,c];else if(h<300)rgb=[x,0,c];else rgb=[c,0,x];
  return rgb.map(n=>Math.round((n+m)*255));
 }
 let state={h:265,s:.75,v:.9};
 let lastHex='';
 const details=document.createElement('details');
 details.className='sv-ink-custom';
 details.innerHTML=
  '<summary><span class="sv-ink-summary-title">Настроить цвет</span></summary>'+
  '<div class="sv-ink-custom-body">'+
   '<div class="sv-ink-sv" role="slider" tabindex="0" aria-label="Насыщенность и яркость" aria-valuemin="0" aria-valuemax="100"><span class="sv-ink-sv-thumb" aria-hidden="true"></span></div>'+
   '<div class="sv-ink-hue-row">'+
    '<button type="button" class="sv-ink-pipette" aria-label="Пипетка: взять точный цвет с фотографии или рисунка" title="Взять цвет с листа"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5.5 4-4 4 4-4 4m-4-4 4 4-10.7 10.7a3.5 3.5 0 0 1-3 1l-2.2.6.6-2.2a3.5 3.5 0 0 1 1-3L14.5 5.5ZM5 19l-2 2"/></svg></button>'+
    '<input class="sv-ink-hue" type="range" min="0" max="360" step="1" value="265" aria-label="Оттенок">'+
    '<span class="sv-ink-preview" role="img" aria-label="Выбранный цвет"></span>'+
   '</div>'+
   '<div class="sv-ink-values">'+
    '<label class="sv-ink-hex-label"><span>HEX</span><input class="sv-ink-hex" type="text" inputmode="text" maxlength="7" spellcheck="false" autocapitalize="characters" aria-label="Цвет HEX"></label>'+
    '<div class="sv-ink-rgb" role="group" aria-label="Цвет RGB">'+
     '<label><span>R</span><input class="sv-ink-r" type="number" inputmode="numeric" min="0" max="255" step="1" aria-label="Красный RGB"></label>'+
     '<label><span>G</span><input class="sv-ink-g" type="number" inputmode="numeric" min="0" max="255" step="1" aria-label="Зелёный RGB"></label>'+
     '<label><span>B</span><input class="sv-ink-b" type="number" inputmode="numeric" min="0" max="255" step="1" aria-label="Синий RGB"></label>'+
    '</div>'+
   '</div>'+
  '</div>';
 pane.append(details);
 const field=details.querySelector('.sv-ink-sv');
 const thumb=details.querySelector('.sv-ink-sv-thumb');
 const hue=details.querySelector('.sv-ink-hue');
 const preview=details.querySelector('.sv-ink-preview');
 const hexInput=details.querySelector('.sv-ink-hex');
 const rgbInputs=['r','g','b'].map(c=>details.querySelector('.sv-ink-'+c));
 const pipette=details.querySelector('.sv-ink-pipette');
 // The same working pipette belongs beside the Palette title, not behind
 // "Настроить цвет". Move the real button rather than creating a duplicate.
 const colorHead=menu.querySelector('.sv-gradient-head');
 if(colorHead){
  colorHead.append(pipette);
  details.querySelector('.sv-ink-hue-row')?.classList.add('sv-ink-hue-row-full');
 }
 function render(commit,source){
  const rgb=hsvRgb(state.h,state.s,state.v);
  const hex=rgbHex(...rgb);
  const pure=rgbHex(...hsvRgb(state.h,1,1));
  field.style.background='linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,'+pure+')';
  thumb.style.left=state.s*100+'%';
  thumb.style.top=(1-state.v)*100+'%';
  thumb.style.background=hex;
  field.setAttribute('aria-valuenow',String(Math.round(state.s*100)));
  field.setAttribute('aria-valuetext','Насыщенность '+Math.round(state.s*100)+'%, яркость '+Math.round(state.v*100)+'%');
  preview.style.background=hex;preview.setAttribute('aria-label','Выбранный цвет '+hex.toUpperCase());
  hue.value=String(Math.round(state.h));
  if(source!=='hex')hexInput.value=hex.toUpperCase();
  rgbInputs.forEach((el,i)=>{if(source!=='rgb'||document.activeElement!==el)el.value=rgb[i]});
  lastHex=hex;
  if(commit)paper.setInkColor(hex);
 }
 function setColor(hex,commit){
  if(!hexPattern.test(hex))return false;
  const next=rgbHsv(...fromHex(hex));
  if(next.s===0)next.h=state.h;
  state=next;render(commit);
  return true;
 }
 function setPoint(event){
  const rect=field.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  state.s=clamp((event.clientX-rect.left)/rect.width,0,1);
  state.v=1-clamp((event.clientY-rect.top)/rect.height,0,1);
  render(true);
 }
 field.addEventListener('pointerdown',event=>{
  if(event.button!==0&&event.pointerType==='mouse')return;
  event.preventDefault();field.setPointerCapture?.(event.pointerId);setPoint(event);
 });
 field.addEventListener('pointermove',event=>{if(event.buttons||event.pressure>0){if(field.hasPointerCapture?.(event.pointerId))setPoint(event)}});
 field.addEventListener('keydown',event=>{
  let handled=true;
  if(event.key==='ArrowLeft')state.s=clamp(state.s-.01,0,1);
  else if(event.key==='ArrowRight')state.s=clamp(state.s+.01,0,1);
  else if(event.key==='ArrowUp')state.v=clamp(state.v+.01,0,1);
  else if(event.key==='ArrowDown')state.v=clamp(state.v-.01,0,1);
  else handled=false;
  if(handled){event.preventDefault();render(true)}
 });
 hue.addEventListener('input',()=>{state.h=Number(hue.value)%360;render(true)});
 hexInput.addEventListener('input',()=>{
  const value=hexInput.value.trim();
  hexInput.setAttribute('aria-invalid',String(!hexPattern.test(value)));
  if(hexPattern.test(value)){setColor(value,true);hexInput.setAttribute('aria-invalid','false')}
 });
 hexInput.addEventListener('change',()=>{
  const value=hexInput.value.trim();
  if(!setColor(value,true))hexInput.value=lastHex.toUpperCase();
  hexInput.setAttribute('aria-invalid','false');
 });
 function applyRgb(){
  const nums=rgbInputs.map(input=>Number(input.value));
  if(nums.some((n,i)=>!Number.isInteger(n)||n<0||n>255||rgbInputs[i].value.trim()===''))return;
  setColor(rgbHex(...nums),true);
 }
 rgbInputs.forEach(input=>{
  input.addEventListener('input',applyRgb);
  input.addEventListener('change',applyRgb);
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){input.blur();event.preventDefault()}});
 });
 details.addEventListener('toggle',()=>{
  pane.classList.toggle('sv-ink-editor-open',details.open);
  menu.classList.toggle('sv-ink-menu-expanded',details.open);
  if(details.open)setColor(paper.getInkColor()||lastHex||'#f6f7fb',false);
 });
 trigger.addEventListener('click',()=>{
  if(!menu.hidden&&details.open)setColor(paper.getInkColor()||lastHex||'#f6f7fb',false);
 });
 pane.querySelectorAll('[data-paper-color]').forEach(button=>button.addEventListener('click',()=>setColor(button.dataset.paperColor,false)));
 dialog.querySelectorAll('.sv-paper-swatches [data-paper-color]').forEach(button=>button.addEventListener('click',()=>{if(details.open)setColor(button.dataset.paperColor,false)}));
 setColor(paper.getInkColor()||'#f6f7fb',false);
 /* A temporary layer intercepts one tap; drawing listeners never see that tap. */
 const overlay=document.createElement('div');
 overlay.className='sv-ink-sample-overlay';
 overlay.hidden=true;
 overlay.innerHTML='<span class="sv-ink-sample-instruction"><span class="sv-ink-sample-message">Проведи по листу, отпусти для выбора</span><span class="sv-ink-sample-preview" aria-hidden="true"></span><span class="sv-ink-sample-value">#171E29</span></span>';
 sheet.append(overlay);
 const sampleMessage=overlay.querySelector('.sv-ink-sample-message');
 const samplePreview=overlay.querySelector('.sv-ink-sample-preview');
 const sampleValue=overlay.querySelector('.sv-ink-sample-value');
 const sampleCanvas=document.createElement('canvas');
 sampleCanvas.width=1;sampleCanvas.height=1;
 const sampleCtx=sampleCanvas.getContext('2d',{willReadFrequently:true});
 let picking=false;
 let sampleFrame=0,lastPointer=null;
 function stopSampling(reopen){
  if(!picking)return;
  if(sampleFrame){cancelAnimationFrame(sampleFrame);sampleFrame=0}
  lastPointer=null;
  picking=false;overlay.hidden=true;dialog.classList.remove('sv-ink-sampling');
  if(reopen&&dialog.open)requestAnimationFrame(()=>{if(menu.hidden)trigger.click();details.open=true});
 }
 function photoColor(x,y){
  const photo=document.getElementById('notePaperPhotoPreview');
  if(!photo||photo.hidden||!photo.complete||!photo.naturalWidth)return null;
  const imgRect=photo.getBoundingClientRect();
  const width=photo.naturalWidth,height=photo.naturalHeight;
  const fit=getComputedStyle(photo).objectFit||'contain';
  const scale=fit==='cover'?Math.max(imgRect.width/width,imgRect.height/height):Math.min(imgRect.width/width,imgRect.height/height);
  const renderedW=width*scale,renderedH=height*scale;
  const offsetX=imgRect.left+(imgRect.width-renderedW)/2,offsetY=imgRect.top+(imgRect.height-renderedH)/2;
  const ix=Math.floor((x-offsetX)/scale),iy=Math.floor((y-offsetY)/scale);
  if(ix<0||iy<0||ix>=width||iy>=height)return null;
  try{
   if(!sampleCtx)return null;
   sampleCtx.clearRect(0,0,1,1);
   sampleCtx.imageSmoothingEnabled=false;
   sampleCtx.drawImage(photo,ix,iy,1,1,0,0,1,1);
   const pixel=sampleCtx.getImageData(0,0,1,1).data;
   return pixel[3]>0?rgbHex(pixel[0],pixel[1],pixel[2]):null;
  }catch{return null}
 }
 function sampleAt(clientX,clientY){
  const rect=canvas.getBoundingClientRect();
  let background=paper.getBackground()==='light'?'#ffffff':'#202124';
  const photo=photoColor(clientX,clientY);
  // Selecting from a photograph must sample its own pixel, even if there
  // are pen strokes above it. Empty photo margins still sample the paper.
  if(photo)return photo;
  if(clientX<rect.left||clientX>rect.right||clientY<rect.top||clientY>rect.bottom)return background;
  const x=Math.floor(clamp((clientX-rect.left)/rect.width*canvas.width,0,canvas.width-1));
  const y=Math.floor(clamp((clientY-rect.top)/rect.height*canvas.height,0,canvas.height-1));
  try{
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   const pixel=ctx.getImageData(x,y,1,1).data;
   if(!pixel[3])return background;
   if(pixel[3]===255)return rgbHex(pixel[0],pixel[1],pixel[2]);
   const bg=fromHex(background),a=pixel[3]/255;
   return rgbHex(...[0,1,2].map(i=>pixel[i]*a+bg[i]*(1-a)));
  }catch{return background}
 }
 function previewAt(clientX,clientY){
  const color=sampleAt(clientX,clientY);
  samplePreview.style.backgroundColor=color;
  sampleValue.textContent=color.toUpperCase();
  return color;
 }
 function schedulePreview(clientX,clientY){
  lastPointer=[clientX,clientY];
  if(sampleFrame)return;
  sampleFrame=requestAnimationFrame(()=>{
   sampleFrame=0;
   if(picking&&lastPointer)previewAt(...lastPointer);
  });
 }
 function applySample(clientX,clientY){
  if(!picking)return;
  setColor(previewAt(clientX,clientY),true);
  stopSampling(true);
 }
 pipette.addEventListener('click',()=>{
  picking=true;
  menu.hidden=true;trigger.setAttribute('aria-expanded','false');
  const photo=document.getElementById('notePaperPhotoPreview');
  sampleMessage.textContent=photo&&!photo.hidden?'Проведи по фото, отпусти для выбора':'Проведи по листу, отпусти для выбора';
  samplePreview.style.backgroundColor=paper.getInkColor()||'#171e29';
  sampleValue.textContent=(paper.getInkColor()||'#171e29').toUpperCase();
  overlay.hidden=false;dialog.classList.add('sv-ink-sampling');
 });
 overlay.addEventListener('pointerdown',event=>{
  event.preventDefault();event.stopPropagation();
  try{overlay.setPointerCapture(event.pointerId)}catch{}
  schedulePreview(event.clientX,event.clientY);
 });
 overlay.addEventListener('pointermove',event=>{if(picking)schedulePreview(event.clientX,event.clientY)});
 overlay.addEventListener('pointerup',event=>{
  event.preventDefault();event.stopPropagation();
  applySample(event.clientX,event.clientY);
 });
 overlay.addEventListener('pointercancel',()=>stopSampling(true));
 // Safari may cancel PointerEvents around a modal. TouchEvents provide a
 // single safe fallback; applySample is idempotent after pointerup.
 overlay.addEventListener('touchmove',event=>{
  const touch=event.touches[0];if(!picking||!touch)return;
  if(event.cancelable)event.preventDefault();
  schedulePreview(touch.clientX,touch.clientY);
 },{passive:false});
 overlay.addEventListener('touchend',event=>{
  const touch=event.changedTouches[0];if(!picking||!touch)return;
  if(event.cancelable)event.preventDefault();
  applySample(touch.clientX,touch.clientY);
 },{passive:false});
 overlay.addEventListener('touchcancel',()=>stopSampling(true));
 overlay.addEventListener('click',event=>{event.preventDefault();event.stopPropagation()});
 document.addEventListener('keydown',event=>{if(picking&&event.key==='Escape'){event.preventDefault();stopSampling(true)}});
 dialog.addEventListener('close',()=>stopSampling(false));
})();
