/* SEYVEO · Smart Snapshot: a local shareable card, never a screen recording.
 * No transmission without explicit user action. */
(()=>{'use strict';
const mount=document.getElementById('personalTaskDialog');
if(!mount)return;
const sheetStyle=document.createElement('style');
sheetStyle.textContent=`
.sv-task-snapshot{width:min(430px,calc(100vw - 26px));max-width:100%;padding:0;border:0;border-radius:26px;background:#fff;color:#17191d;box-shadow:0 20px 70px rgba(24,33,47,.15);overflow:hidden}
.sv-task-snapshot::backdrop{background:rgba(25,32,43,.3);backdrop-filter:blur(6px)}
.sv-task-snapshot-shell{padding:19px;display:grid;gap:13px;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif}
.sv-task-snapshot-head{display:flex;align-items:center;justify-content:space-between;gap:14px}
.sv-task-snapshot-head strong{font-size:18px;font-weight:600;letter-spacing:-.02em}
.sv-task-snapshot-close{display:grid;place-items:center;width:39px;height:39px;border:.7px solid rgba(164,170,184,.27);border-radius:50%;background:rgba(190,193,202,.1);font-size:22px;color:#1b2026}
.sv-task-snapshot-preview{display:block;width:100%;aspect-ratio:1200/700;object-fit:contain;border:1px solid #e6eaf0;border-radius:17px;background:#fafbfc}
.sv-task-snapshot-hint{margin:0;color:#656d78;font-size:12px;line-height:1.35}
.sv-task-snapshot-actions{display:grid;gap:8px}
.sv-task-snapshot-actions button{min-height:46px;padding:0 15px;border:.7px solid rgba(176,185,197,.4);border-radius:17px;background:rgba(190,193,202,.11);color:#191c21;font:550 14px -apple-system,BlinkMacSystemFont,system-ui,sans-serif;text-align:left}
.sv-task-snapshot-actions button:first-child{background:#272b32;color:#fff;text-align:center}
.sv-task-snapshot-status{min-height:16px;margin:0;color:#586371;font-size:12px}
`;
document.head.append(sheetStyle);
let active=null;
const safeText=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,300);
function dueLabel(item){
 const raw=String(item.due||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return 'Без срока';
 const date=new Date(raw+'T12:00:00');
 if(!Number.isFinite(date.getTime()))return 'Без срока';
 return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(date)+(item.time?' · '+item.time:'');
}
function roundRect(ctx,x,y,w,h,r){
 ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
 ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function renderImage(item){
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=700;
 const c=canvas.getContext('2d');if(!c)throw Error('Изображение недоступно');
 const gradient=c.createLinearGradient(0,0,1200,700);gradient.addColorStop(0,'#fff');gradient.addColorStop(1,'#f4f7fa');
 c.fillStyle=gradient;c.fillRect(0,0,1200,700);
 c.strokeStyle='rgba(155,168,183,.5)';c.lineWidth=2;roundRect(c,25,25,1150,650,43);c.stroke();
 c.fillStyle='#111820';c.font='600 35px -apple-system,Arial,sans-serif';c.fillText('SEYVEO',82,113);
 c.fillStyle='#687581';c.font='400 24px -apple-system,Arial,sans-serif';c.fillText('УМНЫЙ СНИМОК',83,153);
 const done=item.done===true;
 c.fillStyle=done?'#e9f5ee':'#eaf0f7';roundRect(c,82,197,done?255:212,56,28);c.fill();
 c.fillStyle=done?'#277144':'#334f6c';c.font='600 26px -apple-system,Arial,sans-serif';
 c.fillText(done?'✓  Выполнено':'Моё дело',105,234);
 const title=safeText(item.title)||'Дело';
 c.fillStyle='#121821';c.font='600 57px -apple-system,Arial,sans-serif';
 const words=title.split(' ');let line='',lines=[];
 for(const word of words){const next=line?line+' '+word:word;if(c.measureText(next).width>1030&&line){lines.push(line);line=word;}else line=next;}
 if(line)lines.push(line);if(lines.length>3){lines=lines.slice(0,3);lines[2]=lines[2].slice(0,39)+'…';}
 lines.forEach((part,index)=>c.fillText(part,86,332+index*75));
 const metaY=Math.max(475,335+lines.length*75);
 c.fillStyle='#5e6b7a';c.font='400 30px -apple-system,Arial,sans-serif';c.fillText(dueLabel(item),86,Math.min(565,metaY));
 c.strokeStyle='#e0e5eb';c.lineWidth=2;c.beginPath();c.moveTo(84,600);c.lineTo(1115,600);c.stroke();
 c.fillStyle='#7d8792';c.font='400 22px -apple-system,Arial,sans-serif';c.fillText('Подготовлено в SEYVEO · отправка по вашему выбору',86,641);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Не удалось создать изображение')),'image/png'));
}
async function open(item){
 if(active){active.dialog.close();active.url&&URL.revokeObjectURL(active.url);active.dialog.remove();active=null;}
 const title=safeText(item.title);if(!title){const status=document.getElementById('personalTaskStatus');if(status)status.textContent='Сначала напиши дело — я подготовлю снимок.';return;}
 const dialog=document.createElement('dialog');dialog.className='sv-task-snapshot';dialog.setAttribute('aria-label','Умный снимок дела');
 const shell=document.createElement('div');shell.className='sv-task-snapshot-shell';
 const head=document.createElement('div');head.className='sv-task-snapshot-head';
 const heading=document.createElement('strong');heading.textContent='Умный снимок';
 const close=document.createElement('button');close.type='button';close.className='sv-task-snapshot-close';close.textContent='×';close.setAttribute('aria-label','Закрыть');
 head.append(heading,close);
 const preview=document.createElement('img');preview.className='sv-task-snapshot-preview';preview.alt='Карточка дела SEYVEO';
 const hint=document.createElement('p');hint.className='sv-task-snapshot-hint';hint.textContent='Сэйви подготовила карточку. Выбери, куда её отправить — ничего не отправляется автоматически.';
 const actions=document.createElement('div');actions.className='sv-task-snapshot-actions';
 const share=document.createElement('button');share.type='button';share.textContent='Поделиться…';
 const save=document.createElement('button');save.type='button';save.textContent='Сохранить изображение';
 const copy=document.createElement('button');copy.type='button';copy.textContent='Скопировать текст для чата или почты';
 actions.append(share,save,copy);
 const status=document.createElement('p');status.className='sv-task-snapshot-status';status.setAttribute('role','status');
 shell.append(head,preview,hint,actions,status);dialog.append(shell);document.body.append(dialog);
 const state={dialog,url:'',file:null};active=state;
 function dismiss(){if(active!==state)return;dialog.close();dialog.remove();if(state.url)URL.revokeObjectURL(state.url);active=null;}
 close.addEventListener('click',dismiss);dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss()});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dismiss()});
 dialog.showModal();share.disabled=true;save.disabled=true;status.textContent='Готовлю изображение…';
 try{
  const blob=await renderImage(item);if(active!==state)return;
  state.file=new File([blob],'SEYVEO-дело.png',{type:'image/png'});
  state.url=URL.createObjectURL(blob);preview.src=state.url;share.disabled=false;save.disabled=false;status.textContent='';
 }catch{status.textContent='Не удалось подготовить снимок.';share.disabled=true;save.disabled=true;}
 share.addEventListener('click',async()=>{
  if(!state.file)return;
  const data={files:[state.file],title:'Дело SEYVEO',text:title};
  if(!navigator.share||navigator.canShare&&!navigator.canShare({files:[state.file]})){
   status.textContent='Отправка изображения недоступна здесь. Сохрани его или скопируй текст.';return;
  }
  try{await navigator.share(data)}catch(e){if(e?.name!=='AbortError')status.textContent='Не удалось открыть меню отправки.';}
 });
 save.addEventListener('click',()=>{if(!state.url)return;const link=document.createElement('a');link.href=state.url;link.download='SEYVEO-дело.png';document.body.append(link);link.click();link.remove();status.textContent='Изображение готово для сохранения.';});
 copy.addEventListener('click',async()=>{
  const text=(item.done?'✅ Дело выполнено':'Дело')+'\n'+title+'\n'+dueLabel(item);
  try{await navigator.clipboard.writeText(text);status.textContent='Текст скопирован. Его можно вставить в чат или письмо.';}
  catch{status.textContent='Копирование недоступно. Можно сохранить изображение.';}
 });
}
function openForDraft(){
 const title=document.getElementById('personalTaskTitle')?.value||'';
 const due=document.getElementById('personalTaskDue')?.value||'';
 const time=document.getElementById('personalTaskTime')?.value||'';
 return open({title,due,time,done:false});
}
window.SEYVEO_TASK_SNAPSHOT=Object.freeze({openForTask:open,openForDraft});
})();
