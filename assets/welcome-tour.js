/* SEYVEO · First Look: read-only first-install tour. */
(()=>{'use strict';
const root=document.getElementById('welcomeTour');if(!root)return;
root.innerHTML=`
<div class="tour-count"><span id="tourCounter">ВОЗМОЖНОСТИ · 01 / 04</span><small>СЕВЕР АВТО · ДЕМО</small></div>
<section class="tour-scene" data-tour-scene="0"><p class="welcome-kicker">ГЛАВНАЯ · РЕКОМЕНДАЦИИ</p>
<h2 class="welcome-title">Я замечаю важное.</h2><p class="welcome-description">Это вымышленная компания «Север Авто». Покажу на её примере.</p>
<div class="tour-card"><div class="tour-top"><span>Рекомендация</span><small>ДЕМО</small></div>
<strong class="tour-title">Три обращения ждут ответа</strong>
<p>За день поступило 12 обращений. Феликс подготовил три черновика ответа.</p>
<div class="tour-actions"><button type="button" id="tourDetails" aria-expanded="false">Подробнее</button><button type="button" class="tour-accent" id="tourApprove">Согласовать · демо</button></div>
<p class="tour-feedback" id="tourDetailsText" hidden>Например, клиент спрашивает время приезда. Ответ — только черновик. У владельца всегда последнее слово.</p>
<p class="tour-feedback" id="tourApproveText" role="status"></p></div></section>
<section class="tour-scene" data-tour-scene="1" hidden><p class="welcome-kicker">КАРТИНА БИЗНЕСА</p>
<h2 class="welcome-title">Важные цифры — понятно.</h2><p class="welcome-description">Выбери период. Все числа учебные, но график работает.</p>
<div class="tour-card"><div class="tour-top"><span>Север Авто · показатели</span><small>ДЕМО</small></div>
<div class="tour-periods" id="tourPeriods"><button type="button" data-tour-period="week" aria-pressed="false">Неделя</button><button type="button" data-tour-period="month" aria-pressed="true">Месяц</button><button type="button" data-tour-period="year" aria-pressed="false">Год</button></div>
<div class="tour-figures"><div><small>Выручка</small><strong id="tourRevenue">—</strong></div><div><small>Расходы</small><strong id="tourCosts">—</strong></div><div><small>Результат</small><strong id="tourProfit">—</strong></div><div><small>Обращения</small><strong id="tourLeads">—</strong></div></div>
<div id="tourChart" class="tour-chart" role="img" aria-label="Учебный график"></div><p class="tour-fine">Реальные показатели появятся только после разрешённых подключений.</p></div></section>
<section class="tour-scene" data-tour-scene="2" hidden><p class="welcome-kicker">МОЙ МИР · ЛИЧНОЕ</p>
<h2 class="welcome-title">Всё важное — рядом.</h2><p class="welcome-description">Нажми на раздел, чтобы узнать, зачем он нужен.</p>
<div class="tour-card"><div class="tour-top"><span>Мой мир</span><small>ОБЗОР</small></div>
<div id="tourWorld" class="tour-world"><button type="button" data-tour-world="calendar">Календарь</button><button type="button" data-tour-world="notes">Блокнот</button><button type="button" data-tour-world="health">Здоровье</button><button type="button" data-tour-world="care">Забота</button><button type="button" data-tour-world="people">Люди и связи</button></div>
<p class="tour-world-text" id="tourWorldText">Календарь помогает помнить о встречах и важных датах.</p></div></section>
<section class="tour-scene" data-tour-scene="3" hidden><p class="welcome-kicker">ТВОЯ ИСТОРИЯ</p>
<h2 class="welcome-title">Теперь познакомимся.</h2><p class="welcome-description">Ты увидел, как мы можем работать. Теперь узнаю, что важно именно тебе.</p>
<div class="tour-card"><div class="tour-top"><span>Наши первые шаги</span><small>БЕЗ СПЕШКИ</small></div><ol class="tour-next">
<li><span>01</span>Познакомимся и определим цель.</li>
<li><span>02</span>Узнаем, какие сервисы у тебя есть.</li>
<li><span>03</span>Предложу одно полезное подключение с твоего согласия.</li></ol>
<p class="tour-fine">Все примеры не сохраняются. Реальный ИИ и внешние сервисы пока не подключены.</p></div></section>`;
const $=id=>root.querySelector('#'+id);
const slides=[...root.querySelectorAll('[data-tour-scene]')];
const words={
 calendar:'Календарь — встречи, планы и важные даты.',
 notes:'Блокнот — заметки, мысли и тексты. Можно писать самому или вместе с помощником.',
 health:'Здоровье — показатели и напоминания. Медицинский доступ только с разрешения.',
 care:'Забота — деликатные напоминания о личном.',
 people:'Люди и связи — близкие и важные контакты. В демо доступ к телефонной книге не нужен.'
};
const format=new Intl.NumberFormat('ru-RU');
const rub=n=>format.format(n)+' ₽';
let period='month';
function chart(){
 const model=window.SEYVEO_PULSE_DEMO?.picture?.(period),box=$('tourChart');
 root.querySelectorAll('[data-tour-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tourPeriod===period)));
 box.replaceChildren();
 if(!model?.trend?.length){box.textContent='Учебный график недоступен.';return}
 $('tourRevenue').textContent=rub(model.total.revenue);
 $('tourCosts').textContent=rub(model.total.cost);
 $('tourProfit').textContent=rub(model.total.revenue-model.total.cost);
 $('tourLeads').textContent=format.format(model.total.leads);
 const max=Math.max(1,...model.trend.map(x=>x.revenue));
 for(const point of model.trend){
  const col=document.createElement('div');col.className='tour-column';
  const track=document.createElement('span');track.className='tour-track';
  const bar=document.createElement('span');bar.className='tour-bar';
  bar.style.height=(point.revenue?Math.max(4,Math.round(point.revenue/max*100)):0)+'%';
  track.append(bar);
  const label=document.createElement('small');label.textContent=point.label;
  col.append(track,label);box.append(col);
 }
 box.setAttribute('aria-label','Учебный график. Выручка '+rub(model.total.revenue)+', расходы '+rub(model.total.cost));
}
$('tourDetails').addEventListener('click',()=>{
 const p=$('tourDetailsText');p.hidden=!p.hidden;
 $('tourDetails').setAttribute('aria-expanded',String(!p.hidden));
});
$('tourApprove').addEventListener('click',()=>{
 $('tourApprove').disabled=true;$('tourApprove').textContent='Согласовано · демо';
 $('tourApproveText').textContent='Согласовано в учебном примере. Ничего не отправлено.';
});
$('tourPeriods').addEventListener('click',e=>{
 const b=e.target.closest?.('[data-tour-period]');
 if(!b||!['week','month','year'].includes(b.dataset.tourPeriod))return;
 period=b.dataset.tourPeriod;chart();
});
$('tourWorld').addEventListener('click',e=>{
 const b=e.target.closest?.('[data-tour-world]');
 if(!b||!Object.prototype.hasOwnProperty.call(words,b.dataset.tourWorld))return;
 $('tourWorldText').textContent=words[b.dataset.tourWorld];
 root.querySelectorAll('[data-tour-world]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
});
function reset(){
 period='month';$('tourDetailsText').hidden=true;$('tourDetails').setAttribute('aria-expanded','false');
 $('tourApprove').disabled=false;$('tourApprove').textContent='Согласовать · демо';
 $('tourApproveText').textContent='';$('tourWorldText').textContent='Календарь помогает помнить о встречах и важных датах.';
 root.querySelectorAll('[data-tour-world]').forEach(x=>x.setAttribute('aria-pressed','false'));
}
function render(n){
 root.hidden=n<0||n>=slides.length;if(root.hidden)return;
 slides.forEach((s,i)=>{s.hidden=i!==n});
 $('tourCounter').textContent='ВОЗМОЖНОСТИ · '+String(n+1).padStart(2,'0')+' / 04';
 if(n===1)chart();
}
window.SEYVEO_WELCOME_TOUR=Object.freeze({reset,render,count:slides.length});
reset();render(-1);
})();