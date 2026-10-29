/* SEYVEO · Company acquaintance: local demonstration, no AI, no server. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const manage=$('seyveoCleanManageMenu');
 if(!manage || $('svCompanyIntroOpen'))return;
 const block=document.createElement('section');
 block.className='manage-group sv-company-entry';
 block.innerHTML='<h2>Компания</h2><div class="manage-card"><button type="button" class="manage-row" id="svCompanyIntroOpen"><span class="sv-company-entry-symbol" aria-hidden="true">✧</span><span class="manage-text"><strong>Познакомить Сэйви с компанией</strong><small>Создать структуру · рассказать или заполнить вручную</small></span><span class="manage-chevron" aria-hidden="true">›</span></button></div>';
 const development=manage.querySelector('.seyveo-development-group');
 if(development)manage.insertBefore(block,development); else manage.append(block);
 const dialog=document.createElement('dialog');
 dialog.className='sv-company-dialog';
 dialog.setAttribute('aria-labelledby','svCompanyIntroTitle');
 dialog.innerHTML=`
 <div class="sv-company-head"><div><p>SEYVEO · AUTONOM ENTERPRISE</p><h2 id="svCompanyIntroTitle">Знакомство с компанией</h2></div><button type="button" id="svCompanyClose" aria-label="Закрыть">×</button></div>
 <p class="sv-company-note">Учебный прототип. Сэйви пока не анализирует рассказ с помощью ИИ. Данные сохраняются только в браузере на этом устройстве — после вашего подтверждения.</p>
 <div class="sv-company-methods" role="group" aria-label="Способ знакомства"><button type="button" data-sv-company-mode="story" aria-pressed="true">Рассказать Сэйви</button><button type="button" data-sv-company-mode="manual" aria-pressed="false">Заполнить вручную</button></div>
 <form id="svCompanyForm">
 <div id="svCompanyStory"><label for="svCompanyStoryText">Расскажите о своём бизнесе</label><textarea id="svCompanyStoryText" rows="5" maxlength="2000" placeholder="У меня пять продуктовых магазинов, два региональных руководителя и 45 сотрудников…"></textarea><button type="button" id="svCompanyVoice">🎙 Продиктовать</button><small id="svCompanyVoiceNote">Диктовка доступна, если её поддерживает браузер.</small></div>
 <div id="svCompanyManual" hidden><label>Название компании<input id="svCompanyName" maxlength="100" autocomplete="organization" placeholder="Например, Север"></label><label>Сфера деятельности<input id="svCompanySector" maxlength="120" placeholder="Розничная торговля"></label><div class="sv-company-numbers"><label>Филиалов<input id="svCompanyBranches" type="number" min="1" max="9999" value="1"></label><label>Сотрудников<input id="svCompanyStaff" type="number" min="1" max="999999" value="1"></label></div></div>
 <button type="submit" class="sv-company-primary">Продолжить</button></form>
 <section id="svCompanyReview" hidden aria-live="polite"><h3>Проверим структуру</h3><p id="svCompanySummary"></p><p class="sv-company-note">Это черновик структуры. Должности, сотрудники и права пока не создаются; приглашения никому не отправляются.</p><button type="button" id="svCompanyApprove" class="sv-company-primary">Сохранить черновик на устройстве</button><button type="button" id="svCompanyEdit">Исправить</button></section>
 <p id="svCompanyStatus" role="status" aria-live="polite"></p>`;
 document.body.append(dialog);
 const intro=$('svCompanyIntroOpen'), form=$('svCompanyForm'), review=$('svCompanyReview'), status=$('svCompanyStatus');
 let mode='story',draft=null,recognition=null;
 const hide=()=>{if(recognition)try{recognition.stop()}catch{};dialog.close();intro.focus()};
 intro.addEventListener('click',()=>{dialog.showModal();$('svCompanyStoryText').focus()});
 $('svCompanyClose').addEventListener('click',hide);
 dialog.addEventListener('cancel',event=>{event.preventDefault();hide()});
 dialog.querySelectorAll('[data-sv-company-mode]').forEach(button=>button.addEventListener('click',()=>{
   mode=button.dataset.svCompanyMode;
   dialog.querySelectorAll('[data-sv-company-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   $('svCompanyStory').hidden=mode!=='story';$('svCompanyManual').hidden=mode!=='manual';
   review.hidden=true;form.hidden=false;status.textContent='';
 }));
 $('svCompanyVoice').addEventListener('click',()=>{
   const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
   if(!Speech){status.textContent='Для голосового ввода воспользуйтесь системным микрофоном клавиатуры.';return}
   if(recognition){recognition.stop();return}
   recognition=new Speech(); recognition.lang='ru-RU';recognition.interimResults=false;
   recognition.onresult=e=>{const spoken=Array.from(e.results).map(x=>x[0].transcript).join(' ');$('svCompanyStoryText').value=($('svCompanyStoryText').value+' '+spoken).trim().slice(0,2000)};
   recognition.onerror=()=>{status.textContent='Не удалось распознать речь. Можно продолжить текстом.'};
   recognition.onend=()=>{recognition=null;$('svCompanyVoice').textContent='🎙 Продиктовать'};
   $('svCompanyVoice').textContent='Остановить диктовку';
   try{recognition.start()}catch{recognition=null;status.textContent='Микрофон недоступен.'}
 });
 form.addEventListener('submit',event=>{
   event.preventDefault();status.textContent='';
   if(mode==='story'){
     const story=$('svCompanyStoryText').value.trim();
     if(story.length<15){status.textContent='Расскажите немного подробнее о компании.';return}
     draft={mode,story};
     $('svCompanySummary').textContent=story;
   } else {
     const name=$('svCompanyName').value.trim(),sector=$('svCompanySector').value.trim(),
       branches=Number($('svCompanyBranches').value),staff=Number($('svCompanyStaff').value);
     if(!name||!sector||!Number.isInteger(branches)||branches<1||branches>9999||!Number.isInteger(staff)||staff<1||staff>999999){status.textContent='Проверьте название, сферу и количество сотрудников и филиалов.';return}
     draft={mode,name,sector,branches,staff};
     $('svCompanySummary').textContent=name+' · '+sector+' · '+branches+' филиалов · '+staff+' сотрудников';
   }
   form.hidden=true;review.hidden=false;$('svCompanyApprove').focus();
 });
 $('svCompanyEdit').addEventListener('click',()=>{review.hidden=true;form.hidden=false});
 $('svCompanyApprove').addEventListener('click',()=>{
   if(!draft)return;
   try{localStorage.setItem('seyveo-company-acquaintance-draft-v1',JSON.stringify({version:1,...draft,updatedAt:new Date().toISOString()}));status.textContent='Черновик сохранён только на этом устройстве. Это не корпоративная регистрация.'}
   catch{status.textContent='Не удалось сохранить черновик в браузере. Проверьте доступность хранилища.'}
 });
})();
