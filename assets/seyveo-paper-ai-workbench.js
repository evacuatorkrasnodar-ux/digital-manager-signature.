/* One honest entry into the existing Paper tools, without a second editor. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const menu=document.getElementById('notePaperSettingsMenu');
 const sayvi=document.getElementById('notePaperSayvi');
 const paper=window.SEYVEO_PAPER;
 const engine=window.SEYVEO_PAPER_REQUESTS;
 if(!dialog||!sayvi||!engine?.plan)return;
 // One entry point: the existing Sayvi symbol in the drawing toolbar.
 // Capture prevents the older hand-off handler from navigating to chat before
 // the person can choose whether to edit this drawing or open a conversation.
 sayvi.setAttribute('aria-label','Сэйви — помощь с рисунком или чат');
 sayvi.title='Сэйви';

 const modal=document.createElement('dialog');modal.id='svPaperAskSayvi';modal.className='sv-paper-ai-workbench';
 modal.setAttribute('aria-labelledby','svPaperAskSayviTitle');
 modal.innerHTML=`<div class="sv-pa-head"><h2 id="svPaperAskSayviTitle">Сэйви · мастерская</h2><button type="button" data-pa-close>Готово</button></div>
  <p class="sv-pa-intro">Расскажи, что сделать с листом. Я покажу доступные инструменты и честно отмечу, что ещё требует ИИ-модели.</p>
  <textarea data-pa-request aria-label="Что Сэйви должна сделать с листом" placeholder="Например: сделай линии ровнее, прочитай рукопись и проверь ошибки" maxlength="600" rows="3"></textarea>
  <button type="button" class="sv-pa-plan" data-pa-plan>Разобрать просьбу</button>
  <button type="button" class="sv-pa-chat" data-pa-chat>Перейти в чат с Сэйви</button>
  <div data-pa-steps class="sv-pa-steps" role="status" aria-live="polite"></div>
  <div data-pa-preview class="sv-pa-preview" hidden><p data-pa-preview-title>Эскиз Сэйви · предварительный просмотр</p><canvas width="840" height="1188" aria-label="Предложенный моделью эскиз"></canvas><div class="sv-pa-preview-actions"><button type="button" data-pa-cancel>Отмена</button><button type="button" data-pa-apply>На лист</button></div></div>
  <p class="sv-pa-foot">Действия запускаются только по твоему нажатию. В локальной версии ПК команда «Создать» передаёт текст просьбы локальной модели; рисунок и личные образцы не отправляются. На публичном сайте модель не подключена.</p>`;
 document.body.append(modal);
 const field=modal.querySelector('[data-pa-request]');
 const results=modal.querySelector('[data-pa-steps]');
 const preview=modal.querySelector('[data-pa-preview]');
 const canvas=preview.querySelector('canvas');
 let draft=null,busy=false;
 const localPC=()=>['127.0.0.1','localhost'].includes(location.hostname);
 async function localModelStatus(){
  if(!localPC())return {enabled:false,status:'public'};
  try{
   const response=await fetch('/api/seyveo-paper-status',{credentials:'same-origin'});
   const data=response.ok?await response.json():null;
   if(data?.localOnly!==true)return {enabled:false,status:'unavailable'};
   return {enabled:data.enabled===true&&data.status==='ready',status:data.status};
  }catch{return {enabled:false,status:'unavailable'}}
 }
 function clearPreview(){draft=null;preview.hidden=true;canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height)}
 function show(){
  if(!dialog.open)return;
  menu.hidden=true;document.getElementById('notePaperSettings')?.setAttribute('aria-expanded','false');
  results.replaceChildren();clearPreview();if(!modal.open)modal.showModal();
 }
 sayvi.addEventListener('click',event=>{
  if(!dialog.open)return;
  event.preventDefault();event.stopImmediatePropagation();
  show();
 },true);
 modal.querySelector('[data-pa-chat]').addEventListener('click',()=>{
  if(busy)return;
  modal.close();
  paper?.openSayvi?.();
 });
 modal.querySelector('[data-pa-close]').addEventListener('click',()=>modal.close());
 async function drawDraft(request){
  if(busy||!localPC()||!paper?.getEditableStrokes)return;
  const geometry=paper.getEditGeometry?.();
  if(!geometry){results.textContent='Лист недоступен.';return}
  busy=true;clearPreview();results.textContent='Локальная модель готовит черновик. Лист пока не изменяется…';
  try{
   const response=await fetch('/api/seyveo-paper-draft',{method:'POST',credentials:'same-origin',
    headers:{'content-type':'application/json'},body:JSON.stringify({mode:'draw',request,width:geometry.width,height:geometry.height})});
   if(!response.ok)throw Error('Локальная модель недоступна. Проверь её запуск на ПК.');
   const verified=engine.verifyDraft(await response.json(),geometry);
   if(!verified)throw Error('Модель вернула неподходящий рисунок. Лист не изменён.');
   if(!modal.open)return;
   const context=canvas.getContext('2d');
   if(!context)throw Error('Предпросмотр недоступен.');
   canvas.width=geometry.width;canvas.height=geometry.height;
   context.clearRect(0,0,canvas.width,canvas.height);
   context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
   for(const stroke of verified.strokes){
    context.beginPath();context.moveTo(stroke.points[0][0],stroke.points[0][1]);
    for(const point of stroke.points.slice(1))context.lineTo(point[0],point[1]);
    context.strokeStyle=stroke.color;context.lineWidth=stroke.width;context.lineCap='round';context.lineJoin='round';context.stroke();
   }
   draft=verified;preview.querySelector('[data-pa-preview-title]').textContent=verified.title+' · черновик';
   preview.hidden=false;results.textContent='Это предложение модели. Проверь рисунок и реши, добавлять ли его на лист.';
  }catch(error){if(modal.open)results.textContent=error?.message||'Не удалось подготовить эскиз.'}
  finally{busy=false}
 }
 async function render(){
  if(busy)return;
  results.replaceChildren();clearPreview();
  const result=engine.plan(field.value);
  if(!result.request){results.textContent='Напиши просьбу — например, «прочитай и выровняй».';return}
  if(result.unmatched){results.textContent='Пока не могу надёжно выбрать действие. Попробуй «выровнять», «распознать рукопись», «мой почерк» или «нарисуй». Ничего не изменено.';return}
  const localStatus=await localModelStatus();
  const localReady=localStatus.enabled;
  for(const step of result.steps){
   const row=document.createElement('div');row.className='sv-pa-step';
   const label=document.createElement('span');label.textContent=step.label;
   const button=document.createElement('button');button.type='button';
   if(step.status==='future'){
    if(step.id==='draw'&&localReady){
     button.textContent='Создать на ПК';
     button.addEventListener('click',()=>drawDraft(result.request));
    }else{button.textContent='Нужна ИИ-модель';button.disabled=true}
   }else{
    const target=document.getElementById(step.target);
    button.textContent=target?'Открыть':'Недоступно';button.disabled=!target;
    if(target)button.addEventListener('click',()=>{
     modal.close();target.click();
    });
   }
   row.append(label,button);results.append(row);
  }
  if(localPC()&&!localReady&&result.steps.some(step=>step.id==='draw')){
   const help=document.createElement('p');help.className='sv-pa-model-hint';
   help.textContent=localStatus.status==='model-not-installed'
    ?'На ПК ещё нет модели рисования. Запусти server/start-paper-ai.cmd — он спросит разрешение на скачивание.'
    :localStatus.status==='ollama-offline'
    ?'Ollama на ПК не запущена. Открой Ollama, затем server/start-paper-ai.cmd.'
    :localStatus.status==='disabled'
    ?'Локальный ИИ выключен. Запусти server/start-paper-ai.cmd.'
    :'Модель сейчас недоступна. Исходный рисунок не изменён.';
   results.append(help);
  }
 }
 modal.querySelector('[data-pa-plan]').addEventListener('click',render);
 preview.querySelector('[data-pa-cancel]').addEventListener('click',clearPreview);
 preview.querySelector('[data-pa-apply]').addEventListener('click',()=>{
  if(!draft||busy)return;
  const old=paper?.getEditableStrokes?.([]);
  if(!Array.isArray(old)||old.length+draft.strokes.length>250){results.textContent='На листе недостаточно места для новых штрихов.';return}
  if(!paper.applyStrokeEdit?.([...old,...draft.strokes])){results.textContent='Не удалось добавить рисунок. Исходный лист сохранён.';return}
  clearPreview();modal.close();
 });
 field.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();render()}});
})();
