const status=document.querySelector('#status');
const messages=document.querySelector('#messages');
const composer=document.querySelector('#composer');
const question=document.querySelector('#question');
const submit=document.querySelector('#submit');
let ready=false,busy=false;
function showStatus(text,mode=''){
 status.textContent=text;status.className='status '+mode;
}
function append(text,who){
 const bubble=document.createElement('div');
 bubble.className='bubble '+who;
 const label=document.createElement('span');
 label.className='speaker';label.textContent=who==='user'?'Вы':'Феликс';
 bubble.appendChild(label);
 bubble.appendChild(document.createTextNode(text));
 messages.appendChild(bubble);
 messages.scrollTop=messages.scrollHeight;
}
async function check(){
 try{
  const response=await fetch('/api/status',{cache:'no-store'});
  const info=await response.json();
  ready=Boolean(info.online);
  showStatus(ready?'Локальный ИИ готов':'Открой Ollama на компьютере',ready?'ready':'error');
 }catch{ready=false;showStatus('Нет связи с локальной моделью','error')}
}
composer.addEventListener('submit',async event=>{
 event.preventDefault();
 if(busy)return;
 const text=question.value.trim();
 if(!text)return;
 if(!ready){await check();if(!ready)return}
 question.value='';
 append(text,'user');
 busy=true;submit.disabled=true;question.disabled=true;
 showStatus('Феликс думает…');
 try{
  const response=await fetch('/api/message',{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({message:text}),cache:'no-store'
  });
  const data=await response.json();
  append(data.text||data.error||'Не удалось получить ответ.','assistant');
 }catch{
  append('Нет связи с Феликсом. Проверь, что окно локального сервера открыто.','assistant');
 }finally{
  busy=false;submit.disabled=false;question.disabled=false;
  question.focus();await check();
 }
});
question.addEventListener('keydown',event=>{
 if(event.key==='Enter'&&!event.shiftKey){
  event.preventDefault();
  composer.requestSubmit();
 }
});
check();
