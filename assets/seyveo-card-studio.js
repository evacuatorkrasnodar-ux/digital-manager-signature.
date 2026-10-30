(()=>{
'use strict';
const entries=[
['Сообщения','Елена написала','Проверить выкладку товаров','Запросить фотографию','#8FE3C3','◎'],
['Почта','Письмо Андрея','Клиент спрашивает о доставке','Уточнить адрес доставки','#8FE3C3','✉'],
['Документы','Договор поставки','В учебном договоре нет срока','Предложить конкретный срок','#B8D4E8','▤'],
['Дела','Срок поручения','Учебное поручение ожидает','Проверить исполнение','#B8D4E8','☑'],
['Календарь','Скоро встреча','Запланировано событие','Подготовить материалы','#E7D2A2','▦'],
['Здоровье','Время передышки','Учебное напоминание об отдыхе','Сделать короткую паузу','#E8B8C7','♡'],
['Забота','Личное напоминание','Запланированное личное дело','Проверить расписание','#E8B8C7','♥'],
['Финансы','Проверка платежа','Учебный платёж ожидает','Проверить реквизиты','#E7D2A2','▱'],
['Бизнес','Новая продажа','Учебная запись о продаже','Посмотреть показатели','#A5D8BB','▥'],
['Сотрудники','Запрос сотрудника','Елена оставила запрос','Открыть обращение','#CBBFE9','♧'],
['Умный дом','Нет связи с устройством','Учебный датчик недоступен','Проверить соединение','#C2DED1','⌂'],
['Безопасность','Проверка доступа','Учебное событие входа','Посмотреть устройства','#B8D4E8','◇']
];
if(!new URLSearchParams(location.search).has('seyveoStudio'))return;
const button=document.createElement('button');button.id='seyveoCardStudioLaunch';button.textContent='✧ Студия карточек';
document.body.append(button);
const page=document.createElement('section');page.id='seyveoCardStudio';page.hidden=true;
page.innerHTML='<div class="scs-wrap"><header><h2>Студия карточек Сэйви</h2><button type="button" data-close>Закрыть</button></header><p class="scs-note">Только учебные события. Ничего не отправляется.</p><div class="scs-grid"><div class="scs-panel"><label for="scsFamily">Семейство карточки</label><select id="scsFamily"></select><div class="scs-states"></div></div><div class="scs-panel" id="scsPreview"></div></div></div>';
document.body.append(page);
const select=page.querySelector('select'),states=page.querySelector('.scs-states'),preview=page.querySelector('#scsPreview');
entries.forEach((e,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=e[0];select.append(opt)});
const labels=['Новое','В работе','Позже','Завершено · демо','Ошибка · демо'];let stage=0;
labels.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{stage=i;render()});states.append(b)});
function render(){
 const e=entries[Number(select.value)];
 preview.replaceChildren();
 const art=document.createElement('div');art.className='scs-icon';art.textContent=e[5];art.style.color=e[4];preview.append(art);
 for(const [cls,txt] of [['scs-label',e[0]+' · ДЕМО'],['',e[1]],['scs-label','ЧТО ПРОИЗОШЛО'],['',e[2]],['scs-label','✧ СЭЙВИ ПРЕДЛАГАЕТ'],['',e[3]],['scs-note','Состояние: '+labels[stage]]]){
  const p=document.createElement('p');p.className='scs-block '+cls;p.textContent=txt;preview.append(p);
 }
 [...states.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===stage)));
}
button.addEventListener('click',()=>{page.hidden=false;render()});
page.querySelector('[data-close]').addEventListener('click',()=>{page.hidden=true});
select.addEventListener('change',()=>{stage=0;render()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')page.hidden=true});
render();
})();