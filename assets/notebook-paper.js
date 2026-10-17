/* SEYVEO Paper · offline editable ink (no cloud, no automatic saving).
   Basic stroke smoothing only; handwriting correction needs a future AI service. */
(function(){
'use strict';
const W=840,H=1188,MAX_STROKES=250,MAX_POINTS=1300,MAX_BYTES=350000,MAX_PHOTO=155000;
const tools=['pen','pencil','eraser'],patterns=['blank','lines','dots'];
const $=id=>document.getElementById(id);
const dialog=$('notePaperDialog'),canvas=$('notePaperCanvas');
if(!dialog||!canvas||!canvas.getContext('2d'))return;
const sheet=$('notePaperSheet'),pattern=$('notePaperPattern'),status=$('notePaperStatus');
let data={pattern:'blank',strokes:[]},editID=null,pending=null,pointerID=null,changed=false,penTime=0,returnToList=false;
const photoView=$('notePaperPhotoPreview'),photoFile=$('notePaperPhotoFile');
const photoCache=new Map();
function photoImage(photo,redraw){
 if(!photo)return null;
 let entry=photoCache.get(photo);
 if(!entry){
  const image=new Image();entry={image,ready:false,callbacks:[]};
  if(photoCache.size>=5)photoCache.delete(photoCache.keys().next().value);
  photoCache.set(photo,entry);
  image.onload=()=>{entry.ready=true;for(const callback of entry.callbacks.splice(0))callback()};
  image.onerror=()=>{for(const callback of entry.callbacks.splice(0))callback()};
  image.src=photo;
 }
 if(redraw&&!entry.ready)entry.callbacks.push(redraw);
 return entry.ready?entry.image:null;
}
const clamp=(n,max)=>Math.max(0,Math.min(max,Math.round(Number(n)||0)));
function normalize(obj){
 const p=obj&&typeof obj==='object'?obj:{};
 return{pattern:patterns.includes(p.pattern)?p.pattern:'blank',
 photo:typeof p.photo==='string'&&p.photo.length<MAX_PHOTO&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.photo)?p.photo:'',
 strokes:(Array.isArray(p.strokes)?p.strokes:[]).slice(0,MAX_STROKES)
 .filter(stroke=>stroke&&tools.includes(stroke.tool)&&Array.isArray(stroke.points))
 .map(stroke=>({tool:stroke.tool,points:stroke.points.slice(0,MAX_POINTS)
 .filter(point=>Array.isArray(point)&&point.length>=2&&Number.isFinite(Number(point[0]))&&Number.isFinite(Number(point[1])))
 .map(point=>[clamp(point[0],W),clamp(point[1],H),clamp(point.length>2?point[2]:50,100)])}))};
}
function paintStroke(ctx,s){
 if(!s.points.length)return;
 const erase=s.tool==='eraser',base=erase?28:s.tool==='pencil'?3.5:4.8;
 ctx.save();ctx.globalCompositeOperation=erase?'destination-out':'source-over';
 ctx.lineJoin='round';ctx.lineCap='round';
 ctx.strokeStyle=ctx.fillStyle=erase?'#111':s.tool==='pencil'?'rgba(32,39,52,.62)':'#171e29';
 const width=p=>base*(erase?1:.65+.007*p);
 const pts=s.points;
 if(pts.length===1){
  const [x,y,p]=pts[0];ctx.beginPath();ctx.arc(x,y,width(p)/2,0,2*Math.PI);ctx.fill();
 }else for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i];
  // Smooth joins without replacing the user's actual handwriting.
  ctx.beginPath();ctx.lineWidth=width((a[2]+b[2])/2);
  ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
 }
 ctx.restore();
}
function paint(target,obj,background=false){
 const ctx=target.getContext('2d');if(!ctx)return;
 const p=normalize(obj);
 ctx.save();ctx.setTransform(target.width/W,0,0,target.height/H,0,0);
 ctx.clearRect(0,0,W,H);for(const s of p.strokes)paintStroke(ctx,s);
 if(background){
  const photo=p.photo;
  const bitmap=photoImage(photo,()=>paint(target,p,true));
  if(bitmap){
   ctx.save();ctx.globalCompositeOperation='destination-over';
   const scale=Math.min(W/bitmap.naturalWidth,H/bitmap.naturalHeight);
   const w=bitmap.naturalWidth*scale,h=bitmap.naturalHeight*scale;
   ctx.drawImage(bitmap,(W-w)/2,(H-h)/2,w,h);ctx.restore();
  }
  // Add the template beneath strokes so the eraser never damages the paper.
  ctx.save();ctx.globalCompositeOperation='destination-over';
  ctx.strokeStyle='rgba(95,110,136,.18)';ctx.fillStyle='rgba(95,110,136,.22)';
  if(p.pattern==='lines')for(let y=66;y<H;y+=66){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  if(p.pattern==='dots')for(let y=35;y<H;y+=45)for(let x=35;x<W;x+=45){ctx.beginPath();ctx.arc(x,y,1.6,0,2*Math.PI);ctx.fill()}
  ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.restore();
 }
 ctx.restore();
}
function render(){
 sheet.dataset.pattern=data.pattern;pattern.value=data.pattern;
 if(photoView){photoView.hidden=!data.photo;if(data.photo&&photoView.src!==data.photo)photoView.src=data.photo;if(!data.photo)photoView.removeAttribute('src')}
 if($('notePaperRemovePhoto'))$('notePaperRemovePhoto').hidden=!data.photo;
 paint(canvas,data);$('notePaperUndo').disabled=!data.strokes.length;
}
function report(text){status.textContent=text||''}
function currentTool(){return document.querySelector('[data-paper-tool][aria-pressed=true]')?.dataset.paperTool||'pen'}
function selectTool(name){if(!tools.includes(name))return;
 document.querySelectorAll('[data-paper-tool]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.paperTool===name)));
}
function point(e){
 const box=canvas.getBoundingClientRect();
 return [clamp((e.clientX-box.left)/box.width*W,W),clamp((e.clientY-box.top)/box.height*H,H),clamp((e.pointerType==='pen'?e.pressure:.5)*100,100)];
}
function down(e){
 if(e.button!==0||e.isPrimary===false)return;
 if(e.pointerType==='pen')penTime=Date.now()+2800;
 if(e.pointerType==='touch'&&Date.now()<penTime)return;
 if(data.strokes.length>=MAX_STROKES){report('Лист заполнен. Начните следующий.');return}
 e.preventDefault();pointerID=e.pointerId;pending={tool:currentTool(),points:[point(e)]};
 try{canvas.setPointerCapture(e.pointerId)}catch{}
}
function move(e){
 if(!pending||e.pointerId!==pointerID)return;
 e.preventDefault();
 const batches=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[e];
 for(const ev of batches){
  if(pending.points.length>=MAX_POINTS)break;
  const now=point(ev),last=pending.points[pending.points.length-1];
  if(Math.hypot(now[0]-last[0],now[1]-last[1])>=2)pending.points.push(now);
 }
 paint(canvas,{pattern:data.pattern,strokes:[...data.strokes,pending]});
}
function up(e){
 if(!pending||e.pointerId!==pointerID)return;
 e.preventDefault();
 if(pending.points.length<MAX_POINTS){
  const now=point(e),last=pending.points[pending.points.length-1];
  if(Math.hypot(now[0]-last[0],now[1]-last[1])>=1)pending.points.push(now);
 }
 data.strokes.push(pending);pending=null;pointerID=null;changed=true;render();
}
canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.querySelectorAll('[data-paper-tool]').forEach(btn=>btn.addEventListener('click',()=>selectTool(btn.dataset.paperTool)));
pattern.addEventListener('change',()=>{if(!patterns.includes(pattern.value))return;data.pattern=pattern.value;changed=true;render()});
$('notePaperUndo').addEventListener('click',()=>{if(!data.strokes.length)return;data.strokes.pop();changed=true;render();report('Последний штрих отменён.')});
function open(note=null){
 data=normalize(note?.paper);editID=note?.id||null;changed=false;pending=null;pointerID=null;penTime=0;returnToList=true;
 $('notePaperTitle').textContent=editID?'Мой лист':'Чистый лист';selectTool('pen');report('');
 if(!dialog.open)dialog.showModal();
 requestAnimationFrame(render);
}
function discard(){
 if(changed&&!window.confirm('Закрыть лист без сохранения?'))return;
 dialog.close();
}
$('notePaperCancel').addEventListener('click',discard);$('notePaperBack').addEventListener('click',discard);
dialog.addEventListener('cancel',e=>{if(changed&&!window.confirm('Закрыть лист без сохранения?'))e.preventDefault()});
dialog.addEventListener('close',()=>{pending=null;pointerID=null;if(returnToList){returnToList=false;window.SEYVEO_NOTES_API?.openNotes()}});
$('notePaperSave').addEventListener('click',()=>{
 if(pending)return;
 if(!data.strokes.length&&!data.photo){report('Напишите, нарисуйте или добавьте фотографию.');return}
 const api=window.SEYVEO_NOTES_API,list=api?.getNotes();
 if(!api||!list){report('Блокнот недоступен.');return}
 const page=normalize(data);
 if(JSON.stringify(page).length>MAX_BYTES){report('Слишком много штрихов для одного листа.');return}
 let updated;
 if(editID){
  if(!list.some(n=>n.id===editID)){report('Запись не найдена.');return}
  updated=list.map(n=>n.id===editID?{...n,paper:page,updatedAt:Date.now()}:n);
 }else updated=[{id:String(Date.now())+'-'+Math.random().toString(36).slice(2),text:'Рукописный лист',paper:page,createdAt:Date.now()},...list];
 if(!api.putNotes(updated)){report('Не хватает места для сохранения. Лист пока открыт.');return}
 changed=false;dialog.close();
});
async function png(p){
 if(p?.photo)await new Promise(resolve=>{const image=photoImage(p.photo,resolve);if(image)resolve()});
 const out=document.createElement('canvas');out.width=W;out.height=H;
 paint(out,p,true);return out.toDataURL('image/png');
}
async function share(note){
 try{
  const encoded=await png(note.paper);
  if(typeof File!=='undefined'&&navigator.share&&navigator.canShare){
   const decoded=atob(encoded.split(',')[1]),bytes=new Uint8Array(decoded.length);
   for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
   const file=new File([bytes],'SEYVEO-Paper.png',{type:'image/png'});
   if(navigator.canShare({files:[file]})){
    navigator.share({title:'Мой лист · SEYVEO',files:[file]}).catch(e=>{
     if(e?.name!=='AbortError')window.SEYVEO_NOTES_API?.message('Отправка листа не удалась.');
    });return;
   }
  }
  const link=document.createElement('a');link.href=encoded;link.download='SEYVEO-Paper.png';link.click();
  window.SEYVEO_NOTES_API?.message('Лист подготовлен как PNG.');
 }catch{window.SEYVEO_NOTES_API?.message('Не удалось подготовить изображение.')}
}
async function print(note){
 const win=window.open('','_blank');
 if(!win){window.SEYVEO_NOTES_API?.message('Разрешите новое окно для печати.');return}
 try{
  const encoded=await png(note.paper);win.opener=null;win.document.open();
  win.document.write('<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>SEYVEO Paper</title>'
   +'<style>@page{size:A4;margin:10mm}body{margin:0}img{display:block;max-width:100%;max-height:95vh;margin:auto}</style></head>'
   +'<body><img id="page" alt="Лист" src="'+encoded+'"></body></html>');
  win.document.close();const picture=win.document.getElementById('page');
  const show=()=>{win.focus();win.print()};
  if(picture.complete)show();else picture.addEventListener('load',show,{once:true});
 }catch{try{win.close()}catch{}window.SEYVEO_NOTES_API?.message('Печать не удалась.')}
}
/* Camera and gallery: image stays local, compressed and stored with this page.
   No photo is uploaded. Only one picture per page to respect iPhone storage. */
async function compressPhoto(file){
 if(!file||!file.type.startsWith('image/')||file.type==='image/svg+xml'||file.size>15*1024*1024)
  throw new Error('Выберите фотографию размером до 15 МБ.');
 const url=URL.createObjectURL(file);
 try{
  const bitmap=await new Promise((resolve,reject)=>{
   const image=new Image();image.onload=()=>resolve(image);
   image.onerror=()=>reject(new Error('Не удалось открыть изображение.'));
   image.src=url;
  });
  const temp=document.createElement('canvas');
  const ctx=temp.getContext('2d');if(!ctx)throw new Error('Браузер не может обработать фото.');
  for(const maxSide of [1050,850,700,560]){
   const factor=Math.min(1,maxSide/Math.max(bitmap.naturalWidth,bitmap.naturalHeight));
   temp.width=Math.max(1,Math.round(bitmap.naturalWidth*factor));
   temp.height=Math.max(1,Math.round(bitmap.naturalHeight*factor));
   ctx.fillStyle='#fff';ctx.fillRect(0,0,temp.width,temp.height);
   ctx.drawImage(bitmap,0,0,temp.width,temp.height);
   for(const quality of [.78,.62,.48]){
    const encoded=temp.toDataURL('image/jpeg',quality);
    if(encoded.length<MAX_PHOTO)return encoded;
   }
  }
  throw new Error('Фотография слишком большая для локального Блокнота.');
 }finally{URL.revokeObjectURL(url)}
}
async function importPhoto(file){
 if(!file)return;
 report('Готовлю фотографию…');
 try{
  const image=await compressPhoto(file);
  data.photo=image;data.pattern='blank';changed=true;render();
  report('Фото добавлено. Можно писать поверх и сохранить лист.');
 }catch(error){report(error?.message||'Не получилось добавить фотографию.')}
}
$('notePaperAddPhoto')?.addEventListener('click',()=>photoFile?.click());
photoFile?.addEventListener('change',()=>{
 const file=photoFile.files?.[0];photoFile.value='';
 if(file)importPhoto(file);
});
$('notePaperRemovePhoto')?.addEventListener('click',()=>{
 if(!data.photo)return;
 if(!window.confirm('Убрать фотографию с листа? Штрихи останутся.'))return;
 data.photo='';changed=true;render();report('Фотография убрана.');
});
window.SEYVEO_PAPER=Object.freeze({open,preview:(target,p)=>paint(target,p,true),share,print,normalize,importPhoto,compressPhoto});
})();