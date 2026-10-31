(()=>{'use strict';
const open=document.getElementById('seyveoOfflineManageOpen');
const dialog=document.getElementById('seyveoOfflineDialog');
if(!open||!dialog)return;
const list=document.getElementById('seyveoOfflineChoices');
const size=document.getElementById('seyveoOfflineSize');
const notice=document.getElementById('seyveoOfflineNotice');
const button=document.getElementById('seyveoOfflineConfirm');
const parts=[
 ['Безопасность и полезные знания','Первая помощь, путешествия, дом, обучение и бизнес'],
 ['Локальный интеллект','Общение и простые задачи без интернета'],
 ['Голос Сэйви','Разговор без сети, когда голосовой пакет будет доступен']
];
function render(){
 list.replaceChildren();
 const intro=document.createElement('p');
 intro.className='seyveo-offline-intro';
 intro.textContent='Один комплект вместо множества настроек.';
 list.append(intro);
 for(const [title,description] of parts){
  const section=document.createElement('div');section.className='seyveo-offline-feature';
  const mark=document.createElement('span');mark.className='seyveo-offline-feature-mark';mark.textContent='✓';mark.setAttribute('aria-hidden','true');
  const body=document.createElement('span');
  const name=document.createElement('strong');name.textContent=title;
  const details=document.createElement('small');details.textContent=description;
  body.append(name,details);section.append(mark,body);list.append(section);
 }
 size.textContent='≈ 3,5 ГБ';
 notice.textContent='Предварительная оценка, точный размер ещё не измерен. Комплект пока не опубликован.';
 button.textContent='Понятно';
 button.setAttribute('aria-label','Закрыть описание офлайн-комплекта');
}
open.addEventListener('click',()=>{
 render();
 if(typeof dialog.showModal==='function')dialog.showModal();
 else dialog.setAttribute('open','');
});
const close=()=>{if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open')};
document.getElementById('seyveoOfflineClose')?.addEventListener('click',close);
button?.addEventListener('click',close);
dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
})();