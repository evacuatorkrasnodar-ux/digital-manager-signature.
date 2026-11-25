/* Shared private editor transport. Documents and notes use the existing SEYVEO brain. */
(()=>{
'use strict';
const unavailable='Сэйви пока недоступна в этой версии приложения. Базовое оформление работает.';
function available(){return ['127.0.0.1','localhost'].includes(window.location.hostname);}
async function ask(message,{signal}={}){
 if(!available())throw Error(unavailable);
 if(typeof message!=='string'||!message.trim()||message.length>4000)throw Error('Сократите текст или выберите небольшой фрагмент.');
 const response=await window.fetch('/api/seyveo-ask',{method:'POST',credentials:'same-origin',signal,headers:{'content-type':'application/json'},body:JSON.stringify({message})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(response.status===404||response.status===405?unavailable:String(data.error||'Сэйви пока недоступна.'));
 const text=typeof data.text==='string'?data.text.trim():'';
 if(!text||text.length>12000)throw Error('Ответ пуст или слишком длинный.');
 return text;
}
window.SEYVEO_EDITOR_ASSISTANT=Object.freeze({available,ask,unavailable});
})();
