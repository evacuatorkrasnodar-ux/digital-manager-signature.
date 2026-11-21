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
 modal.innerHTML=`<header class="sv-pa-head"><h2 id="svPaperAskSayviTitle">Сэйви · рисование</h2><button type="button" data-pa-close>Готово</button></header>
  <p class="sv-pa-intro">Помогу довести набросок до аккуратного рисунка.</p>
  <section class="sv-pa-quick-section" aria-label="Помощь с рисунком">
   <div class="sv-pa-quick-title">Творческие действия</div>
   <div class="sv-pa-quick-grid" role="group" aria-label="Творческие действия с рисунком">
    <button type="button" data-pa-quick="smooth"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16c3-7 5 4 9-3s6-5 9-8M3 20h18"/></svg><span>Выровнять линии</span></button>
    <button type="button" data-pa-quick="shape"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15c1-8 10-12 14-3s-5 10-10 4M5 5h4M5 5v4M15 19h4v-4"/></svg><span>Узнать фигуру</span></button>
    <div class="sv-pa-quick-divider" role="note">Будущие возможности Сэйви</div>
    <button type="button" data-pa-quick="draw" data-pa-prompt="Нарисуй " class="sv-pa-planned"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3Z"/></svg><span>Нарисовать <small>ИИ на ПК</small></span></button>
    <button type="button" data-pa-quick="extend" data-pa-prompt="Дорисуй мой набросок: " class="sv-pa-planned"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17c4-5 7-2 11-7M18 6v6m-3-3h6"/></svg><span>Дорисовать <small>В планах</small></span></button>
    <button type="button" data-pa-quick="colorize" data-pa-prompt="Раскрась мой рисунок: " class="sv-pa-planned"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17 15 5l4 4-10 10H5v-2Zm8-8 3 3M19 16c0 2-1 3-2 3s-2-1-2-3c0-1 2-3 2-3s2 2 2 3Z"/></svg><span>Раскрасить <small>В планах</small></span></button>
    <button type="button" data-pa-quick="style" data-pa-prompt="Преобразуй мой рисунок в стиль: " class="sv-pa-planned"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9c0-2-2-2-4-2h-1c-2 0-2-2-2-3 0-2-1-4-2-4Z"/><circle cx="7" cy="12" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="16" cy="14" r="1"/></svg><span>Изменить стиль <small>В планах</small></span></button>
    <button type="button" data-pa-quick="erase" data-pa-prompt="Удали лишний объект с моего рисунка: " class="sv-pa-planned"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 14 9-9 5 5-9 9H7l-2-2v-3Zm7 5h8"/></svg><span>Убрать лишнее <small>В планах</small></span></button>
    <button type="button" data-pa-quick="enhance" data-pa-prompt="Сделай мой рисунок более красивым и выразительным: " class="sv-pa-planned"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z"/></svg><span>Улучшить рисунок <small>В планах</small></span></button>
    <button type="button" data-pa-quick="understand" data-pa-prompt="Что изображено на моём рисунке? " class="sv-pa-planned sv-pa-quick-wide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.4"/></svg><span>Понять рисунок <small>В планах</small></span></button>
   </div>
  </section>
  <div class="sv-pa-custom">
   <label class="sv-pa-field-label" for="svPaperAskSayviRequest">Что ты хочешь создать или исправить?</label>
   <textarea id="svPaperAskSayviRequest" data-pa-request aria-label="Что Сэйви должна сделать с листом" placeholder="Например: нарисуй дерево, поправь контуры домика" maxlength="600" rows="3"></textarea>
   <button type="button" class="sv-pa-plan" data-pa-plan>Подобрать действие</button>
  </div>
  <div data-pa-steps class="sv-pa-steps" role="status" aria-live="polite"></div>
  <div data-pa-preview class="sv-pa-preview" hidden><p data-pa-preview-title>Эскиз Сэйви · предварительный просмотр</p><canvas width="840" height="1188" aria-label="Предложенный моделью эскиз"></canvas><div class="sv-pa-preview-actions"><button type="button" data-pa-cancel>Отмена</button><button type="button" data-pa-apply>На лист</button></div></div>
  <button type="button" class="sv-pa-chat" data-pa-chat><span>Открыть чат с Сэйви</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>
  <details class="sv-pa-foot"><summary>Как работает Сэйви</summary><p>Действия выполняются только по твоему выбору; исходный рисунок не изменяется без подтверждения. Создание рисунков по описанию доступно только при подключённой локальной модели на ПК. В этом режиме модели передаётся текст просьбы, а не рисунок или личные образцы.</p></details>`;
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
  results.replaceChildren();clearPreview();
  if(!modal.open)modal.showModal();
 }
 sayvi.addEventListener('click',event=>{
  if(!dialog.open)return;
  event.preventDefault();event.stopImmediatePropagation();
  show();
 },true);
 // Creative actions use the real preview-based stroke engine.
 // The shape helper currently supports only a few recognisable figures,
 // not arbitrary image recognition.
 const smoothAction=document.getElementById('notePaperSmoothInk');
 modal.querySelectorAll('[data-pa-quick]').forEach(button=>button.addEventListener('click',()=>{
  if(busy||!dialog.open)return;
  const kind=button.dataset.paQuick;
  if(button.dataset.paPrompt){
   field.value=button.dataset.paPrompt;
   results.textContent=kind==='draw'
    ?'Опиши, что нарисовать. На локальном ПК создание эскиза доступно с подключённой моделью.'
    :'Возможность добавлена в план Сэйви, но пока не выполняется. Можно уточнить просьбу — Сэйви покажет её статус.';
   field.focus({preventScroll:true});
   field.setSelectionRange(field.value.length,field.value.length);
   return;
  }
  if(!smoothAction||smoothAction.disabled){
   results.textContent='Инструмент выравнивания сейчас недоступен. Рисунок не изменён.';
   return;
  }
  if(!paper?.getEditableStrokes?.([])?.some(stroke=>
    (stroke.tool==='pen'||stroke.tool==='pencil')&&stroke.points?.length>=5)){
   results.textContent='Сначала нарисуй несколько штрихов, затем Сэйви поможет их исправить или определить фигуру.';
   return;
  }
  modal.close();
  smoothAction.click();
  if(kind==='shape'&&dialog.classList.contains('sv-paper-smooth-mode')){
   // Open the existing "Это…" hint; its suggestion remains subject to
   // the original before/after preview and the user's Apply confirmation.
   const suggest=dialog.querySelector('.sv-paper-smooth-bar [aria-label^="Подсказать Сэйви"], .sv-paper-smooth-bar [aria-label^="Сэйви предполагает"]');
   suggest?.click();
  }
 }));
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
  if(result.unmatched){results.textContent='Пока не могу подобрать действие. Уточни, что хочешь нарисовать или изменить; исходный рисунок не затронут.';return}
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
    }else{button.textContent=step.id==='draw'?'Нет модели':'В разработке';button.disabled=true}
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
