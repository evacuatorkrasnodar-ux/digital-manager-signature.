/* SEYVEO Browser prototype: website viewer inside the existing app.
 * Full native WebView support belongs in the iOS/Android builds.
 * Restricted sites can refuse iframe embedding; never bypass their policy. */
(()=>{'use strict';
 const root=document.createElement('section');
 root.id='seyveoBrowser';root.className='seyveo-browser';root.hidden=true;
 root.setAttribute('role','dialog');root.setAttribute('aria-label','Браузер SEYVEO');
 root.innerHTML='<div class="seyveo-browser-top"><button type="button" data-close aria-label="Закрыть браузер">‹</button><strong>SEYVEO Browser</strong><span class="seyveo-browser-shield">◇</span></div><form class="seyveo-browser-bar"><input type="url" name="address" placeholder="Адрес сайта https://…" aria-label="Адрес сайта" required><button type="submit" aria-label="Перейти">→</button></form><div class="seyveo-browser-note">Приватный просмотр · без рекламных блоков SEYVEO. Некоторые сайты запрещают встроенный просмотр.</div><div class="seyveo-browser-content"><div class="seyveo-browser-empty">Введи адрес сайта или открой ссылку в чате.</div><iframe title="Веб-страница" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms allow-same-origin allow-popups" hidden></iframe></div><footer class="seyveo-browser-bottom"><button type="button" data-home>Начало</button><button type="button" data-external>Открыть отдельно ↗</button><button type="button" data-close>Готово</button></footer>';
 document.body.append(root);
 const input=root.querySelector('input'),frame=root.querySelector('iframe'),empty=root.querySelector('.seyveo-browser-empty');
 let current=null;
 function secureUrl(value){try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}
 function open(value){
  root.hidden=false;document.body.classList.add('seyveo-browser-open');
  const url=secureUrl(value);
  if(url){current=url;input.value=url;frame.hidden=false;empty.hidden=true;frame.src=url;}
  else{current=null;input.value='';frame.hidden=true;frame.removeAttribute('src');empty.hidden=false;input.focus();}
  return true;
 }
 function close(){root.hidden=true;document.body.classList.remove('seyveo-browser-open');frame.removeAttribute('src');}
 root.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
 root.querySelector('[data-home]').addEventListener('click',()=>open());
 root.querySelector('[data-external]').addEventListener('click',()=>{if(current)window.open(current,'_blank','noopener,noreferrer')});
 root.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const address=secureUrl(input.value);if(!address){input.setCustomValidity('Нужен безопасный адрес https://');input.reportValidity();return;}input.setCustomValidity('');open(address)});
 input.addEventListener('input',()=>input.setCustomValidity(''));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden)close()});
 document.addEventListener('click',e=>{
  if(root.hidden||!root.contains(e.target))return;
 });
 window.SEYVEO_BROWSER=Object.freeze({open,close});
})();
