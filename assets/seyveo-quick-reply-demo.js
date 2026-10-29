(()=>{'use strict';
 const root=document.getElementById('seyveoQuickReplyDemo');
 if(!root)return;
 const compose=root.querySelector('.sq-compose'),field=root.querySelector('textarea'),hint=root.querySelector('.sq-hint');
 const suggested='Спасибо, Елена! Пришли, пожалуйста, фото выкладки — я проверю.';
 root.querySelector('[data-sq="sayvi"]').addEventListener('click',()=>{
  compose.hidden=false;field.value=suggested;hint.textContent='Черновик Сэйви · проверь перед отправкой. Реальный чат пока не подключён.';field.focus();
 });
 root.querySelector('[data-sq="own"]').addEventListener('click',()=>{
  compose.hidden=false;field.value='';hint.textContent='Ваш черновик · реальная отправка пока не подключена.';field.focus();
 });
 root.querySelector('[data-sq="close"]').addEventListener('click',()=>{compose.hidden=true;field.value='';});
 root.querySelector('[data-sq="copy"]').addEventListener('click',async()=>{
  if(!field.value.trim())return;
  try{await navigator.clipboard.writeText(field.value);hint.textContent='Текст скопирован. Сообщение не отправлено.'}
  catch{field.focus();field.select();hint.textContent='Выделен текст для копирования. Сообщение не отправлено.'}
 });
})();
