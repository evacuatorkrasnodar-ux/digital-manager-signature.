(()=>{'use strict';
const open=document.getElementById('seyveoOfflineManageOpen');
const modal=document.getElementById('seyveoOfflineDialog');
if(!open||!modal)return;
const list=document.getElementById('seyveoOfflineChoices');
const size=document.getElementById('seyveoOfflineSize');
const notice=document.getElementById('seyveoOfflineNotice');
const entries=[
 ['safety','Безопасность и выживание',15],
 ['aid','Первая помощь',25],
 ['travel','Туризм и путешествия',35],
 ['maps','Офлайн-карты выбранного региона',250],
 ['home','Дом и быт',20],
 ['business','Бизнес и управление',50],
 ['education','Обучение и языки',50],
 ['companion','Мини-ИИ для бесед',1200],
 ['voice','Голос Сэйви без сети',1800]
];
const key='seyveo-offline-selection-v1';
let selection=new Set(['safety','aid']);
try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(saved))selection=new Set(saved.filter(id=>entries.some(e=>e[0]===id)))}catch{}
function render(){
 list.replaceChildren();
 for(const [id,title,mb] of entries){
  const label=document.createElement('label');label.className='seyveo-offline-option';
  const check=document.createElement('input');check.type='checkbox';check.checked=selection.has(id);
  check.addEventListener('change',()=>{check.checked?selection.add(id):selection.delete(id);update()});
  const body=document.createElement('span');body.className='seyveo-offline-option-text';
  const name=document.createElement('strong');name.textContent=title;
  const meta=document.createElement('small');meta.textContent='≈ '+(mb>=1000?(mb/1000).toFixed(1)+' ГБ':mb+' МБ');
  body.append(name,meta);label.append(check,body);list.append(label);
 }
 update();
}
function update(){
 const total=entries.reduce((n,[id,,mb])=>n+(selection.has(id)?mb:0),0);
 size.textContent=total>=1000?(total/1000).toFixed(2)+' ГБ':total+' МБ';
 notice.textContent='Оценка объёма, не измеренный размер. Реальных скачиваний пока нет.';
}
open.addEventListener('click',()=>{render();if(typeof modal.showModal==='function')modal.showModal();else modal.setAttribute('open','')});
document.getElementById('seyveoOfflineClose')?.addEventListener('click',()=>modal.close());
document.getElementById('seyveoOfflineConfirm')?.addEventListener('click',()=>{
 try{localStorage.setItem(key,JSON.stringify([...selection]));notice.textContent='Выбор сохранён в этом браузере. Пакеты пока не скачаны.'}
 catch{notice.textContent='Не удалось сохранить выбор на этом устройстве.'}
});
modal.addEventListener('click',event=>{if(event.target===modal)modal.close()});
})();