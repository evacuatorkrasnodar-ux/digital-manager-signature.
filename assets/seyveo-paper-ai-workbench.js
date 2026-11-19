/* One honest entry into the existing Paper tools, without a second editor. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const menu=document.getElementById('notePaperSettingsMenu');
 const actions=menu?.querySelector('[data-sv-menu-panel="actions"]');
 const engine=window.SEYVEO_PAPER_REQUESTS;
 if(!dialog||!actions||!engine?.plan||actions.querySelector('#notePaperAskSayvi'))return;
 const entry=document.createElement('button');
 entry.id='notePaperAskSayvi';entry.type='button';entry.className='sv-newdock-menu-action';
 entry.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 6.5h16M4 12h12M4 17.5h8"/><path d="m18.5 15 1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1z"/></svg><span>Попросить Сэйви</span>';
 actions.insertBefore(entry,actions.firstElementChild);

 const modal=document.createElement('dialog');modal.id='svPaperAskSayvi';modal.className='sv-paper-ai-workbench';
 modal.setAttribute('aria-labelledby','svPaperAskSayviTitle');
 modal.innerHTML=`<div class="sv-pa-head"><h2 id="svPaperAskSayviTitle">Сэйви · мастерская</h2><button type="button" data-pa-close>Готово</button></div>
  <p class="sv-pa-intro">Расскажи, что сделать с листом. Я покажу доступные инструменты и честно отмечу, что ещё требует ИИ-модели.</p>
  <textarea data-pa-request aria-label="Что Сэйви должна сделать с листом" placeholder="Например: сделай линии ровнее, прочитай рукопись и проверь ошибки" maxlength="600" rows="3"></textarea>
  <button type="button" class="sv-pa-plan" data-pa-plan>Разобрать просьбу</button>
  <div data-pa-steps class="sv-pa-steps" role="status" aria-live="polite"></div>
  <p class="sv-pa-foot">Действия запускаются только по твоему нажатию. Лист и личные образцы не отправляются с этой панели на сервер.</p>`;
 document.body.append(modal);
 const field=modal.querySelector('[data-pa-request]');
 const results=modal.querySelector('[data-pa-steps]');
 function show(){
  if(!dialog.open)return;
  menu.hidden=true;document.getElementById('notePaperSettings')?.setAttribute('aria-expanded','false');
  results.replaceChildren();if(!modal.open)modal.showModal();
 }
 entry.addEventListener('click',show);
 modal.querySelector('[data-pa-close]').addEventListener('click',()=>modal.close());
 function render(){
  results.replaceChildren();
  const result=engine.plan(field.value);
  if(!result.request){results.textContent='Напиши просьбу — например, «прочитай и выровняй».';return}
  if(result.unmatched){results.textContent='Пока не могу надёжно выбрать действие. Попробуй «выровнять», «распознать рукопись», «мой почерк» или «нарисуй». Ничего не изменено.';return}
  for(const step of result.steps){
   const row=document.createElement('div');row.className='sv-pa-step';
   const label=document.createElement('span');label.textContent=step.label;
   const button=document.createElement('button');button.type='button';
   if(step.status==='future'){
    button.textContent='Нужна ИИ-модель';button.disabled=true;
   }else{
    const target=document.getElementById(step.target);
    button.textContent=target?'Открыть':'Недоступно';button.disabled=!target;
    if(target)button.addEventListener('click',()=>{
     modal.close();target.click();
    });
   }
   row.append(label,button);results.append(row);
  }
 }
 modal.querySelector('[data-pa-plan]').addEventListener('click',render);
 field.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();render()}});
})();
