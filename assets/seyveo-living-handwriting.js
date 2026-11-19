/* SEYVEO Living Handwriting · opt-in samples, local storage, vector preview.
 * Only the user's explicit "На лист" changes ink; Paper owns Undo and Save.
 */
(()=>{
 'use strict';
 const core=window.SEYVEO_LIVING_HANDWRITING_CORE;
 const paper=window.SEYVEO_PAPER;
 const menu=document.getElementById('notePaperSettingsMenu');
 const tablet=document.getElementById('notePaperDialog');
 if(!core||!paper?.applyStrokeEdit||!paper?.getEditableStrokes||!menu||!tablet)return;
 const KEY='seyveo-paper-personal-ink-v1';
 let alphabet={};
 const read=()=>{
  try{return core.cleanAlphabet(localStorage.getItem(KEY)||'')}
  catch{return {}}
 };
 alphabet=read();

 const entry=document.createElement('button');
 entry.type='button';entry.id='notePaperMyHandwriting';entry.className='sv-newdock-menu-action';
 entry.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 18c2-2.6 3.6-8.7 5.5-8.7 2 0-.1 7.6 2.2 7.6 1.9 0 2.4-6.3 4.7-6.3 2.5 0-.5 5.7 1.4 5.7 1 0 2.3-.9 3.1-2"/><path d="M16.2 5.2 18.4 3l2.3 2.3-2.2 2.2-3.6 1.1z"/></svg><span>Мой почерк</span>';
 // Later Apple-style menu polish moves actions into a nested pane.
 // Insert beside Clear in its *actual* parent, never against a stale menu root.
 const clearAction=menu.querySelector('.sv-newdock-clear');
 if(clearAction?.parentElement)clearAction.parentElement.insertBefore(entry,clearAction);
 else menu.append(entry);

 const modal=document.createElement('dialog');
 modal.id='svLivingHandwriting';modal.className='sv-lh-dialog';
 modal.setAttribute('aria-labelledby','svLivingHandwritingTitle');
 modal.innerHTML=`
  <div class="sv-lh-shell">
   <header class="sv-lh-head"><div><small>SEYVEO LIVING HANDWRITING · БЕТА</small><h2 id="svLivingHandwritingTitle">Мой почерк</h2></div><button type="button" data-lh-close>Готово</button></header>
   <p class="sv-lh-intro">Покажи Сэйви, как ты пишешь буквы. Она соберёт из твоих штрихов текст — без чужого шрифта.</p>
   <section class="sv-lh-section" aria-labelledby="svLhSampleTitle">
    <div class="sv-lh-row"><h3 id="svLhSampleTitle">1. Образец буквы</h3><label>Буква <input data-lh-letter aria-label="Буква для образца" autocomplete="off" spellcheck="false" maxlength="1" value="м"></label></div>
    <div class="sv-lh-sample-pad"><canvas data-lh-pad width="640" height="340" aria-label="Напиши выбранную букву пальцем или стилусом"></canvas></div>
    <div class="sv-lh-row sv-lh-controls"><button type="button" data-lh-clear>Очистить</button><button type="button" class="sv-lh-primary" data-lh-remember>Запомнить букву</button></div>
    <p class="sv-lh-count" data-lh-count>Нет образцов</p>
   </section>
   <section class="sv-lh-section" aria-labelledby="svLhTypeTitle">
    <h3 id="svLhTypeTitle">2. Текст моим почерком</h3>
    <textarea data-lh-text rows="2" maxlength="240" spellcheck="false" aria-label="Текст для воспроизведения моим почерком">мама</textarea>
    <div class="sv-lh-preview-frame"><canvas data-lh-preview width="840" height="370" aria-label="Предпросмотр текста из ваших рукописных букв"></canvas></div>
    <div class="sv-lh-row sv-lh-controls"><p class="sv-lh-hint" data-lh-hint></p><button type="button" class="sv-lh-primary" data-lh-apply disabled>На лист</button></div>
   </section>
   <footer class="sv-lh-foot"><span data-lh-status role="status" aria-live="polite">Образцы остаются на этом устройстве. Удалить их можно здесь.</span><button type="button" data-lh-forget>Удалить мои образцы</button></footer>
   <p class="sv-lh-note">Первая версия: одна буква — один образец. Соединения букв ещё не изучаются. Подписи и документы Сэйви не воспроизводит. Экспорт «Мои данные» содержит образцы в обычном JSON.</p>
  </div>`;
 document.body.append(modal);
 const $=selector=>modal.querySelector(selector);
 const pad=$('[data-lh-pad]'),preview=$('[data-lh-preview]');
 const sampleLetter=$('[data-lh-letter]'),typed=$('[data-lh-text]');
 const remember=$('[data-lh-remember]'),apply=$('[data-lh-apply]');
 const count=$('[data-lh-count]'),hint=$('[data-lh-hint]'),status=$('[data-lh-status]');
 let sample=[],active=null,pointerId=null,generated=null;
 const say=message=>{status.textContent=message};
 const context=pad.getContext('2d');
 const previewContext=preview.getContext('2d');
 if(!context||!previewContext){entry.remove();modal.remove();return}

 function drawSample(){
  const ctx=context;
  ctx.setTransform(pad.width/core.WIDTH,0,0,pad.height/core.HEIGHT,0,0);
  ctx.clearRect(0,0,core.WIDTH,core.HEIGHT);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,core.WIDTH,core.HEIGHT);
  ctx.strokeStyle='#e1e6ed';ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(12,core.BASELINE);ctx.lineTo(core.WIDTH-12,core.BASELINE);ctx.stroke();
  ctx.lineWidth=2.5;ctx.strokeStyle='#20242e';ctx.fillStyle='#20242e';ctx.lineCap='round';ctx.lineJoin='round';
  for(const points of sample){
   if(!points.length)continue;
   if(points.length===1){ctx.beginPath();ctx.arc(points[0][0],points[0][1],1.6,0,Math.PI*2);ctx.fill();continue}
   ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
   for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
   ctx.stroke();
  }
 }
 function point(event){
  const r=pad.getBoundingClientRect();
  return [
   Math.round(Math.max(0,Math.min(core.WIDTH,(event.clientX-r.left)/r.width*core.WIDTH))*10)/10,
   Math.round(Math.max(0,Math.min(core.HEIGHT,(event.clientY-r.top)/r.height*core.HEIGHT))*10)/10,
   Math.round(Math.max(10,Math.min(100,(event.pointerType==='pen'?event.pressure:.5)*100)))
  ];
 }
 pad.addEventListener('pointerdown',event=>{
  if(!modal.open||active||event.isPrimary===false)return;
  event.preventDefault();pointerId=event.pointerId;
  active=[point(event)];sample.push(active);
  try{pad.setPointerCapture(pointerId)}catch{}
  drawSample();
 });
 pad.addEventListener('pointermove',event=>{
  if(!active||event.pointerId!==pointerId)return;
  event.preventDefault();
  const events=typeof event.getCoalescedEvents==='function'?event.getCoalescedEvents():[event];
  for(const current of events.length?events:[event]){
   const next=point(current),last=active[active.length-1];
   if(Math.hypot(next[0]-last[0],next[1]-last[1])>=.75&&active.length<320)active.push(next);
  }
  drawSample();
 });
 const endStroke=event=>{
  if(!active||event.pointerId!==pointerId)return;
  event.preventDefault();
  if(event.type==='pointercancel')sample.pop();
  else{
   const last=active[active.length-1],next=point(event);
   if(Math.hypot(next[0]-last[0],next[1]-last[1])>=.75&&active.length<320)active.push(next);
  }
  active=null;pointerId=null;drawSample();
 };
 pad.addEventListener('pointerup',endStroke);
 pad.addEventListener('pointercancel',endStroke);
 $('[data-lh-clear]').addEventListener('click',()=>{sample=[];active=null;pointerId=null;drawSample()});
 sampleLetter.addEventListener('input',()=>{sample=[];active=null;pointerId=null;drawSample()});

 const lettersMissing=()=>core.composeText(typed.value,alphabet,{height:2000}).missing;
 function setCount(){
  const n=Object.keys(alphabet).length;
  count.textContent=n?n+' букв и знаков сохранено на этом устройстве':'Пока нет образцов';
 }
 function strokePreview(result){
  const h=Math.max(250,Math.min(1800,Math.ceil(result.bottom+75)||370));
  preview.height=h;
  const ctx=previewContext;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,840,h);
  ctx.strokeStyle='#e9edf2';ctx.lineWidth=1;
  for(let y=175;y<h;y+=84.8){ctx.beginPath();ctx.moveTo(50,y+14);ctx.lineTo(790,y+14);ctx.stroke()}
  for(const stroke of result.strokes){
   const points=stroke.points;
   if(!points.length)continue;
   ctx.strokeStyle='#171e29';ctx.fillStyle='#171e29';ctx.lineWidth=stroke.width;
   ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
   if(points.length===1){ctx.arc(points[0][0],points[0][1],stroke.width*.5,0,Math.PI*2);ctx.fill();continue}
   for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
   ctx.stroke();
  }
 }
 function previewText(){
  generated=core.composeText(typed.value,alphabet,{height:2000});
  strokePreview(generated);
  const missing=generated.missing;
  if(!typed.value.trim())hint.textContent='Напиши текст для просмотра.';
  else if(missing.length)hint.textContent='Нужны образцы: '+missing.slice(0,18).join(' ') + (missing.length>18?'…':'');
  else if(generated.overflow)hint.textContent='Текст слишком длинный. Уменьши его.';
  else hint.textContent='Предпросмотр из твоих штрихов. Можно добавить на лист.';
  apply.disabled=!typed.value.trim()||Boolean(missing.length)||generated.overflow||!generated.strokes.length;
 }
 typed.addEventListener('input',previewText);
 remember.addEventListener('click',()=>{
  const letter=sampleLetter.value.trim();
  if(!core.supported(letter)){say('Выбери одну русскую или латинскую букву, цифру либо знак.');return}
  const glyph=core.makeGlyph(sample);
  if(!glyph){say('Напиши выбранную букву в поле, затем нажми «Запомнить».');return}
  if(alphabet[letter]&&!window.confirm('Образец «'+letter+'» уже есть. Заменить его новым?'))return;
  if(!alphabet[letter]&&Object.keys(alphabet).length>=core.MAX_GLYPHS){say('Лимит образцов достигнут. Можно удалить ненужные и начать заново.');return}
  const next={...alphabet,[letter]:glyph};
  const raw=JSON.stringify({version:1,glyphs:next,updatedAt:Date.now()});
  if(raw.length>900000){say('На этом устройстве образцы слишком большие. Попробуй более короткие штрихи.');return}
  try{localStorage.setItem(KEY,raw)}
  catch{say('Не удалось сохранить почерк: возможно, память браузера заполнена.');return}
  alphabet=next;sample=[];active=null;pointerId=null;drawSample();setCount();previewText();
  const missing=lettersMissing();
  if(missing.length){sampleLetter.value=missing[0];say('Букву «'+letter+'» запомнила. Теперь покажи «'+missing[0]+'».')}
  else say('Букву «'+letter+'» запомнила. Теперь твой текст готов к просмотру.');
 });
 apply.addEventListener('click',()=>{
  if(!tablet.open||!typed.value.trim())return;
  const previous=paper.getEditableStrokes([]);
  const remaining=250-previous.length;
  if(remaining<1){say('На этом листе больше нет места для новых штрихов.');return}
  const geometry=paper.getEditGeometry();
  if(!geometry){say('Размер листа сейчас недоступен. Попробуй открыть его снова.');return}
  let base=175;
  for(const stroke of previous)for(const p of stroke.points||[])base=Math.max(base,p[1]+110);
  for(const item of paper.getTextObjects?.()||[])base=Math.max(base,item.y+item.size*2+65);
  const color=paper.getBackground?.()==='dark'?'#f6f7fb':'#171e29';
  const usedPoints=previous.reduce((count,stroke)=>count+(stroke.points?.length||0),0);
  const remainingPoints=Math.max(0,10000-usedPoints);
  if(!remainingPoints){say('Этот лист уже большой. Для нового текста открой чистый лист.');return}
  const composed=core.composeText(typed.value,alphabet,{height:geometry.height,width:geometry.width,
   baseline:base,color,maxStrokes:Math.min(200,remaining),maxPoints:Math.min(5500,remainingPoints)});
  if(composed.missing.length){say('Добавь недостающие образцы, чтобы не подменять твой почерк шрифтом.');return}
  if(composed.overflow||!composed.strokes.length){say('На листе не хватает свободного места. Можно открыть новый чистый лист.');return}
  if(!paper.applyStrokeEdit([...previous,...composed.strokes])){say('Не удалось добавить штрихи. Исходный лист сохранён.');return}
  modal.close();paper.announce?.('Текст добавлен твоими рукописными штрихами. Можно отменить и сохранить лист.');
 });
 $('[data-lh-forget]').addEventListener('click',()=>{
  if(!Object.keys(alphabet).length){say('Образцов уже нет.');return}
  if(!window.confirm('Удалить все образцы личного почерка с этого устройства? Существующие листы останутся без изменений.'))return;
  try{localStorage.removeItem(KEY)}catch{say('Не удалось удалить образцы из браузера.');return}
  alphabet={};setCount();previewText();say('Все образцы удалены с этого устройства. Ранее сохранённые листы не изменены.');
 });
 entry.addEventListener('click',()=>{
  if(!tablet.open)return;
  alphabet=read();setCount();sample=[];active=null;pointerId=null;drawSample();previewText();
  menu.hidden=true;document.getElementById('notePaperSettings')?.setAttribute('aria-expanded','false');
  if(!modal.open)modal.showModal();
 });
 $('[data-lh-close]').addEventListener('click',()=>modal.close());
 modal.addEventListener('close',()=>{sample=[];active=null;pointerId=null});
 window.addEventListener('storage',event=>{if(event.key===KEY){alphabet=read();setCount();previewText()}});
 setCount();drawSample();previewText();
})();
