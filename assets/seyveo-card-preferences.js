/* SEYVEO Card Visibility · reversible local presentation preferences.
 * No source messages, documents, tasks or approvals are deleted here. */
(()=>{
 'use strict';
 const engine=window.SEYVEO_CARD_ENGINE;
 const manage=document.getElementById('manageOverview');
 if(!engine||!manage||document.getElementById('seyveoCardPreferencesLaunch'))return;
 const launch=document.createElement('button');
 launch.id='seyveoCardPreferencesLaunch';
 launch.type='button';launch.className='sv-card-preferences-launch';
 launch.textContent='Карточки Сэйви';
 launch.setAttribute('aria-haspopup','dialog');
 const section=document.createElement('section');
 section.className='manage-group sv-card-preferences-entry';
 section.setAttribute('aria-label','Настройка карточек Сэйви');
 const title=document.createElement('h2');title.textContent='Карточки Сэйви';
 const note=document.createElement('p');
 note.textContent='Какие карточки показывать на Главной. Поручения и документы остаются на месте.';
 section.append(title,note,launch);manage.append(section);
 const panel=document.createElement('dialog');
 panel.id='seyveoCardPreferences';
 panel.className='sv-card-preferences-dialog';
 panel.setAttribute('aria-labelledby','svCardPrefTitle');
 const heading=document.createElement('h2');
 heading.id='svCardPrefTitle';heading.textContent='Карточки Сэйви';
 const intro=document.createElement('p');
 intro.textContent='Настройки действуют на этом устройстве. Сами сообщения, задачи и документы не удаляются. Срочные и обязательные уведомления остаются видимыми.';
 const list=document.createElement('div');
 list.className='sv-card-preferences-list';list.setAttribute('aria-live','polite');
 const footer=document.createElement('div');footer.className='sv-card-preferences-footer';
 const reset=document.createElement('button');reset.type='button';reset.textContent='Вернуть все карточки';
 const close=document.createElement('button');close.type='button';close.textContent='Готово';
 footer.append(reset,close);panel.append(heading,intro,list,footer);document.body.append(panel);
 const catalogName=family=>engine.catalog[family]?.family||'Карточка';
 const button=(text,onClick)=>{
  const el=document.createElement('button');el.type='button';el.textContent=text;
  el.addEventListener('click',onClick);return el;
 };
 function render(){
  list.replaceChildren();
  const prefs=engine.getVisibility();
  if(!prefs.muted.length&&!prefs.hidden.length){
   const clean=document.createElement('p');clean.className='sv-card-preferences-empty';
   clean.textContent='Все категории карточек разрешены.';
   list.append(clean);reset.disabled=true;return;
  }
  reset.disabled=false;
  for(const family of prefs.muted){
   const row=document.createElement('div');row.className='sv-card-preferences-row';
   const label=document.createElement('span');label.textContent='Скрыта категория: '+catalogName(family);
   row.append(label,button('Вернуть',()=>{engine.muteFamily(family,false);render()}));list.append(row);
  }
  prefs.hidden.forEach((item,index)=>{
   const row=document.createElement('div');row.className='sv-card-preferences-row';
   const label=document.createElement('span');
   label.textContent='Скрытая карточка '+(index+1)+' · '+catalogName(item.family);
   const pieces=item.key.split('::');
   row.append(label,button('Вернуть',()=>{
    engine.hideCard({accountId:pieces[0],workspaceId:pieces[1],family:pieces[2],id:pieces.slice(3).join('::')},false);
    render();
   }));
   list.append(row);
  });
 }
 const open=()=>{render();if(panel.showModal)panel.showModal();else panel.setAttribute('open','')};
 const dismiss=()=>{if(panel.close)panel.close();else panel.removeAttribute('open')};
 launch.addEventListener('click',open);close.addEventListener('click',dismiss);
 reset.addEventListener('click',()=>{engine.restoreVisibility();render()});
 panel.addEventListener('click',event=>{if(event.target===panel)dismiss()});
 window.SEYVEO_CARD_PREFERENCES=Object.freeze({open,render});
})();
