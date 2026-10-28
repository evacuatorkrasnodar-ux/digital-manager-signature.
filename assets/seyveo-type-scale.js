/* SEYVEO Typography preference.
 * One local preference for all app text surfaces; decorative artwork is untouched.
 */
(()=>{
 'use strict';
 const key='seyveo-type-size-v1';
 const valid=new Set(['normal','large','extra']);
 const root=document.documentElement;
 function read(){
  try{const x=localStorage.getItem(key);return valid.has(x)?x:'normal'}
  catch{return 'normal'}
 }
 function apply(size){
  const chosen=valid.has(size)?size:'normal';
  root.dataset.svTextSize=chosen;
  document.querySelectorAll('[data-sv-text-choice]').forEach(button=>
   button.setAttribute('aria-pressed',String(button.dataset.svTextChoice===chosen)));
 }
 // Restore preference even when settings screen is not opened.
 apply(read());
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-sv-text-choice]');
  if(!button)return;
  const chosen=button.dataset.svTextChoice;
  if(!valid.has(chosen))return;
  apply(chosen);
  try{localStorage.setItem(key,chosen)}catch{}
 });
 window.addEventListener('storage',event=>{if(event.key===key)apply(read())});
})();
