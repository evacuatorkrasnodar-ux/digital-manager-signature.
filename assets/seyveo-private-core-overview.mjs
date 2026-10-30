/* PRIVATE CORE: transparent connection readiness, not device permission control. */
const root=document.querySelector('#manageOverview');
const section=[...(root?.querySelectorAll('details.seyveo-manage-fold')||[])].find(el=>el.querySelector('summary strong')?.textContent?.trim()==='Безопасность');
const host=section?.querySelector('.seyveo-manage-fold-body');
if(host&&!host.querySelector('.sv-private-core')){
 const css=document.createElement('style');
 css.textContent='.sv-private-core{margin:12px 4px;padding:13px 0;border-top:1px solid var(--soft-line,#ffffff28)}.sv-private-core h3{font-size:13px;font-weight:600;margin:0 0 8px}.sv-private-core p{font-size:11px;line-height:1.5;color:var(--secondary);margin:6px 0}.sv-private-core-row{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:39px;border-bottom:1px solid var(--soft-line,#ffffff1b);font-size:12px}.sv-private-core-state{font-size:11px;color:var(--secondary);text-align:right}.sv-private-core-kicker{font-size:10px;letter-spacing:.12em;color:var(--seyveo-emerald,var(--secondary))}';
 document.head.append(css);
 const box=document.createElement('section');box.className='sv-private-core';box.setAttribute('aria-label','PRIVATE CORE · состояние подключений');
 const kicker=document.createElement('p');kicker.className='sv-private-core-kicker';kicker.textContent='SEYVEO · PRIVATE CORE';
 const title=document.createElement('h3');title.textContent='Доступы Сэйви';
 const info=document.createElement('p');info.textContent='Здесь показана готовность интеграций SEYVEO, а не системные разрешения телефона.';
 box.append(kicker,title,info);
 for(const label of ['Почтовый сервис','Облачные документы','Управление устройствами']){
  const row=document.createElement('div');row.className='sv-private-core-row';
  const name=document.createElement('span');name.textContent=label;
  const state=document.createElement('span');state.className='sv-private-core-state';state.textContent='Не подключено';
  row.append(name,state);box.append(row);
 }
 const foot=document.createElement('p');foot.textContent='Системные разрешения камеры, микрофона и контактов управляются настройками iOS и Android. Подключать их здесь без реального API нельзя.';
 box.append(foot);host.append(box);
}
