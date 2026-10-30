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
['Безопасность','Проверка доступа','Учебное событие входа','Посмотреть устройства','#B8D4E8','◇'],
['Проверка выкладки','Елена закончила выкладку','Фото ещё не получено','Попросить Елену прислать фото полки и ценников','#8FE3C3','▧'],
['Благодарность','Предложена звезда сотруднику','Коллега отметил помощь Елены','Проверить благодарность, не начисляя премию автоматически','#E7D2A2','✦'],
['Документооборот','Документ ожидает проверки','Учебный договор подготовлен','Проверить содержание и полномочия подписанта','#B8D4E8','▤']
];
if(!new URLSearchParams(location.search).has('seyveoStudio'))return;
const button=document.createElement('button');button.id='seyveoCardStudioLaunch';button.textContent='✧ Студия карточек';
document.body.append(button);
const page=document.createElement('section');page.id='seyveoCardStudio';page.hidden=true;
page.innerHTML='<div class="scs-wrap"><header><h2>Студия карточек Сэйви</h2><button type="button" data-close>Закрыть</button></header><p class="scs-note">Только учебные события. Ничего не отправляется.</p><div class="scs-grid"><div class="scs-panel"><label for="scsFamily">Семейство карточки</label><select id="scsFamily"></select><div class="scs-states"></div></div><div class="scs-panel" id="scsPreview"></div></div></div>';
document.body.append(page);
const select=page.querySelector('select'),states=page.querySelector('.scs-states'),preview=page.querySelector('#scsPreview');
entries.forEach((e,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=e[0];select.append(opt)});
const editor=document.createElement('div');editor.className='scs-editor';
editor.innerHTML='<label>Заголовок события<input data-edit="title" maxlength="140"></label><label>Что произошло<textarea data-edit="fact" maxlength="1200" rows="3"></textarea></label><label>Предложение Сэйви<textarea data-edit="suggestion" maxlength="1200" rows="3"></textarea></label><label>Приоритет<select data-edit="priority"><option value="normal">Обычный</option><option value="important">Важный</option><option value="urgent">Срочный</option></select></label>';
select.insertAdjacentElement('afterend',editor);
const fields=Object.fromEntries([...editor.querySelectorAll('[data-edit]')].map(x=>[x.dataset.edit,x]));
function fillEditor(){const e=entries[Number(select.value)];fields.title.value=e[1];fields.fact.value=e[2];fields.suggestion.value=e[3];fields.priority.value='normal'}
fillEditor();
editor.addEventListener('input',render);editor.addEventListener('change',render);
const queuePanel=document.createElement('div');queuePanel.className='scs-panel scs-queue';
queuePanel.innerHTML='<h3>Автоматическая очередь · демо</h3><p class="scs-note">Несколько событий → карточки по важности, без дублей.</p><button type="button" data-generate>Создать учебные события</button><div data-queue-result aria-live="polite"></div>';
page.querySelector('.scs-wrap').append(queuePanel);
const queueResult=queuePanel.querySelector('[data-queue-result]');
function demoQueue(){
 const engine=window.SEYVEO_CARD_ENGINE;
 if(!engine){queueResult.textContent='Движок недоступен';return}
 const types=Object.keys(engine.eventType);
 const importance=['normal','urgent','important','normal','important','normal','normal','important','normal','normal','urgent','normal','important','normal','important'];
 const events=entries.map((e,i)=>({id:'example-'+i,type:types[i],title:e[1],fact:e[2],suggestion:e[3],priority:importance[i],demo:true,source:'Студия'}));
 events.push({...events[0]});
 const cards=engine.fromEvents(events);
 queueResult.replaceChildren();
 const summary=document.createElement('p');summary.className='scs-note';summary.textContent='Событий: '+events.length+' · Уникальных карточек: '+cards.length+' · Срочные показаны первыми';queueResult.append(summary);
 const list=document.createElement('ol');list.className='scs-queue-list';
 cards.forEach(card=>{const item=document.createElement('li');const title=document.createElement('strong');title.textContent=card.title;const meta=document.createElement('span');meta.textContent=card.family+' · '+({urgent:'Срочно',important:'Важно',normal:'Обычно'})[card.priority];item.append(title,meta);list.append(item)});
 queueResult.append(list);
}
queuePanel.querySelector('[data-generate]').addEventListener('click',demoQueue);
const labels=['Новое','В работе','Позже','Завершено · демо','Ошибка · демо'];let stage=0;
labels.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{stage=i;render()});states.append(b)});
function render(){
 const e=entries[Number(select.value)];
 const engine=window.SEYVEO_CARD_ENGINE;
 const eventKey=Object.keys(engine?.eventType||{})[Number(select.value)];
 const card=engine?.buildCard({id:'studio-'+select.value,type:eventKey,title:fields.title.value,fact:fields.fact.value,suggestion:fields.suggestion.value,priority:fields.priority.value,source:'Студия разработчика',demo:true});

 preview.replaceChildren();
 const art=document.createElement('div');art.className='scs-icon';art.textContent=card?.icon||e[5];art.style.color=card?.accent||e[4];preview.append(art);
 for(const [cls,txt] of [['scs-label',e[0]+' · ДЕМО'],['',card?.title||'Заполните заголовок'],['scs-label','ЧТО ПРОИЗОШЛО'],['',card?.fact||'Добавьте событие'],['scs-label','✧ СЭЙВИ ПРЕДЛАГАЕТ'],['',card?.suggestion||'Предложение не задано'],['scs-note','Состояние: '+labels[stage]],['scs-note','Действия по правилам: '+(card?.actions.join(' · ')||'нет')],['scs-note',card?'Карточка автоматически собрана из события':'Нет зарегистрированного типа события']]){
  const p=document.createElement('p');p.className='scs-block '+cls;p.textContent=txt;preview.append(p);
 }
 [...states.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===stage)));
}
button.addEventListener('click',()=>{page.hidden=false;render()});
page.querySelector('[data-close]').addEventListener('click',()=>{page.hidden=true});
select.addEventListener('change',()=>{stage=0;fillEditor();render()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')page.hidden=true});
render();
})();