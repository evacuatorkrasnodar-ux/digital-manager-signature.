/* SEYVEO Business · guided presentation. Fictional in-memory scenario, NOT corporate access control. */
(()=>{
'use strict';
const root=document.getElementById('seyveoRoleDemo');
if(!root)return;
const state={vacancy:false,interviewOpened:false,hired:false,trained:false,onShift:false,taskDone:false,star:false};
let active=false,role='director',step=0;
const stages={
 director:[
  {eyebrow:'01 · Знакомство',title:'Бизнес работает. Сэйви рядом.',speech:'Я помогу организовать подбор, обучение, работу команды и покажу, где можно освободить время руководителя.',note:'Представим небольшой магазин. Всё ниже — демонстрационные события и вымышленные люди.',facts:()=>[['Компания','Демо-магазин'],['Сэйви','Цифровой управляющий']]},
  {eyebrow:'02 · Кадры',title:'Найти нового сотрудника',speech:'Составим вакансию продавца и подготовим её к размещению. Перед публикацией вы всё проверите.',note:'В реальном продукте для публикации потребуется официальный доступ к площадке и подтверждение владельца.',facts:()=>[['Вакансия',state.vacancy?'Учебный черновик подготовлен':'Продавец · новый магазин'],['Условия','График и зарплату определяет директор']],action:'Подготовить демо-вакансию',run:()=>{state.vacancy=true}},
  {eyebrow:'03 · Собеседование',title:'Сэйви знакомится с кандидатом',speech:'Я проведу учебное интервью. В отчёте будут ответы и профессиональные задания, а не выдуманные психологические качества.',note:'Открывается уже существующее демо интервью. Решение о приёме всегда принимает человек.',facts:()=>[['Кандидат','Мария К. · вымышленный пример'],['Результат','Ответы и рабочие кейсы для кадровика']],action:'Открыть собеседование',run:()=>{const btn=document.getElementById('seyveoHrDemoOpen');if(btn){btn.click();state.interviewOpened=true}}},
  {eyebrow:'04 · Приём',title:'Новый человек в команде',speech:'Когда вы приняли решение, я подготовлю приглашение и план первого дня. Рабочие права будут отделены от личных данных.',note:'Здесь только учебное приглашение, без учётной записи и уведомлений.',facts:()=>[['Решение','Директор подтверждает лично'],['Приглашение',state.hired?'Создано в демонстрации':'Ещё не подготовлено']],action:'Подготовить учебное приглашение',run:()=>{state.hired=true}},
  {eyebrow:'05 · Команда',title:'Сотруднику помогает Сэйви',speech:'Я объясню новичку первые задачи, помогу с инструкцией и зафиксирую результат учебной смены.',note:'Переключитесь на вид сотрудника: это другое рабочее пространство, а не копия пульта директора.',facts:()=>[['Адаптация',state.trained?'Учебный этап пройден':'Предстоит'],['Рабочая смена',state.onShift?'Начата в демонстрации':'Не начата'],['Задача',state.taskDone?'Отмечена как завершённая в демо':'В ожидании']],action:'Посмотреть глазами сотрудника',run:()=>{role='employee';step=0}},
  {eyebrow:'06 · Результат',title:'Директор видит главное',speech:'Вот подтверждённые события рабочего процесса. Я могу подсказать, что проверить, кого поблагодарить и где убрать лишнюю рутину.',note:'Это не настоящая аналитика и не подтверждённая экономия: финансовый эффект нужно измерять по фактическим данным.',facts:()=>[['Смена',state.onShift?'Отмечена в демо':'Нет отметки'],['Задача',state.taskDone?'Выполнена в демо':'Нет подтверждения'],['Благодарность',state.star?'Добавлена в демо':'Не отмечена']],action:'Отметить достижение в демо',run:()=>{if(state.taskDone)state.star=true},disabled:()=>!state.taskDone}
 ],
 employee:[
  {eyebrow:'01 · Личная Сэйви',title:'Добро пожаловать, Мария!',speech:'Я помогу тебе освоиться, выполнять поручения и развивать навыки. Твоя музыка и личные разговоры не являются отчётом директору.',note:'Это пример интерфейса сотрудника. Реальные права будут разграничены на сервере.',facts:()=>[['Моя работа','Продавец · учебная компания'],['Мой мир','Личное пространство отдельно']]},
  {eyebrow:'02 · Наставник',title:'Первый день без тревоги',speech:'Начнём со знакомства с обязанностями. Если инструкция непонятна, объясню ещё раз или помогу обратиться к наставнику.',note:'В этом демо инструкция учебная. В настоящей компании нужны утверждённые документы и права доступа.',facts:()=>[['Знакомство с процессом',state.trained?'Учебный этап отмечен':'В ожидании'],['Наставник','Подключается при сложных вопросах']],action:'Изучила учебную инструкцию',run:()=>{state.trained=true}},
  {eyebrow:'03 · Учёт времени',title:'Я на работе',speech:'Одно нажатие — и начало смены отмечено. Ты будешь видеть своё рабочее время и сможешь запросить исправление табеля.',note:'Учебный статус не влияет на реальный табель; переработки и оплата определяются по подтверждённым данным.',facts:()=>[['Текущая смена',state.onShift?'Начата · только демо':'Ещё не начата'],['Права работника','Прозрачные отметки и история исправлений']],action:'Я на работе · демо',run:()=>{state.onShift=true}},
  {eyebrow:'04 · Помощь в работе',title:'Сэйви, как выполнить поручение?',speech:'Я покажу шаги по разрешённой инструкции. Сложное уточню у наставника, а после выполнения помогу отправить подтверждение.',note:'Поручение и его завершение — вымышленные. Настоящего отчёта руководителю не отправляется.',facts:()=>[['Учебная задача','Проверить ценники на полке'],['Статус',state.taskDone?'Выполнено в демо':'В работе']],action:'Отметить учебную задачу',run:()=>{state.taskDone=true}},
  {eyebrow:'05 · Карьера и права',title:'Твой труд должен быть виден',speech:'Помогу вести учёт часов, разобраться в спорной записи и сохранить подтверждённые достижения для профессионального роста.',note:'Защита прав сотрудника важнее красивых рейтингов. Без автоматических наказаний и скрытой слежки.',facts:()=>[['Развитие','Наставничество и новые навыки'],['Достижение',state.star?'Благодарность за учебную задачу':'Можно отметить после проверки'],['Рабочие часы','Сверка по фактическому табелю']],action:'Показать результат руководителю',run:()=>{role='director';step=5}}
 ]
};
const css=document.createElement('style');
css.id='seyveo-guided-demo-style';
css.textContent=`
.sv-showcase{margin:8px 0 13px;border:1px solid var(--soft-line);border-radius:21px;overflow:hidden;background:var(--card);color:var(--text)}
.sv-showcase-head{display:flex;align-items:center;gap:10px;padding:14px 15px}
.sv-showcase-glyph{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;color:#9aefc4;background:radial-gradient(circle at 38% 24%,#41876b,#19322a 67%,#10241e);border:1px solid #35785b;flex:none;font-size:18px}
.sv-showcase-title{flex:1;min-width:0}.sv-showcase-title strong{display:block;font-size:14px}.sv-showcase-title small{display:block;color:var(--secondary);font-size:11px;line-height:1.5}
.sv-showcase button{font:inherit;cursor:pointer}
.sv-showcase-launch,.sv-showcase-action{border:1px solid #488f71;border-radius:999px;min-height:42px;background:#20553d;color:#f4fff8;padding:9px 15px;font-size:13px;font-weight:600}
.sv-showcase-launch{margin:0 14px 13px;display:block;width:calc(100% - 28px)}
.sv-showcase-body{padding:0 13px 14px}
.sv-showcase-tabs{display:flex;gap:6px;padding:4px;border:1px solid var(--soft-line);border-radius:999px;margin:6px 0 13px}
.sv-showcase-tabs button{min-width:0;flex:1;border:0;border-radius:999px;background:transparent;padding:9px 4px;color:var(--secondary);font-size:12px}
.sv-showcase-tabs button[aria-pressed=true]{background:rgba(53,139,96,.19);color:var(--text);box-shadow:inset 0 0 0 1px #4a9470}
.sv-showcase-progress{display:flex;gap:4px;margin:5px 0 13px}.sv-showcase-progress span{flex:1;height:3px;border-radius:5px;background:var(--soft-line)}.sv-showcase-progress span.is-current{background:#6bd6a2}
.sv-showcase-stage{border-top:1px solid var(--soft-line);padding:13px 2px 4px}
.sv-showcase-eyebrow{font-size:10px;letter-spacing:.07em;color:#75c49c;font-weight:650}
.sv-showcase-stage h3{font-size:17px;line-height:1.22;margin:7px 0 10px}
.sv-showcase-voice{border-left:2px solid #549b79;padding:4px 0 4px 12px;color:var(--text);font-size:13px;line-height:1.55}
.sv-showcase-facts{display:grid;gap:0;margin:12px 0;border-top:1px solid var(--soft-line)}
.sv-showcase-fact{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-bottom:1px solid var(--soft-line);padding:9px 2px;font-size:12px}
.sv-showcase-fact span:first-child{color:var(--secondary)}.sv-showcase-fact span:last-child{text-align:right;color:var(--text)}
.sv-showcase-note{font-size:11px;line-height:1.55;color:var(--secondary);margin:10px 0}
.sv-showcase-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}
.sv-showcase-actions button{border:1px solid var(--soft-line);background:transparent;border-radius:999px;padding:9px 13px;min-height:41px;color:var(--text);font-size:12px}
.sv-showcase-actions button:disabled,.sv-showcase-action:disabled{opacity:.45;cursor:not-allowed}
.sv-showcase-actions .sv-showcase-action{background:#20553d;color:#f4fff8;border-color:#488f71}
.sv-showcase-eyebrow,.sv-showcase-title strong{color:var(--text)}
.sv-showcase button:focus-visible{outline:2px solid #8ad9aa;outline-offset:2px}
@media(max-width:360px){.sv-showcase-fact{flex-direction:column;gap:2px}.sv-showcase-fact span:last-child{text-align:left}}
`;
document.head.append(css);
const element=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el};
const button=(name,fn,cls)=>{const b=element('button',cls,name);b.type='button';b.addEventListener('click',fn);return b};
function refresh(){root.replaceChildren();const card=element('section','sv-showcase');const head=element('div','sv-showcase-head');const orb=element('div','sv-showcase-glyph','✦');orb.setAttribute('aria-hidden','true');const title=element('div','sv-showcase-title');title.append(element('strong',null,'SEYVEO · Живое демо'),element('small',null,'Одна история компании. Два взгляда.'));head.append(orb,title);card.append(head);
 if(!active){const start=button('▶ Запустить демонстрацию',()=>{active=true;role='director';step=0;refresh()},'sv-showcase-launch');card.append(start);root.append(card);return}
 const body=element('div','sv-showcase-body');const tabs=element('div','sv-showcase-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Демонстрационная роль');
 [['director','Руководитель'],['employee','Сотрудник']].forEach(([id,label])=>{const b=button(label,()=>{role=id;step=0;refresh()});b.setAttribute('aria-pressed',String(role===id));tabs.append(b)});body.append(tabs);
 const steps=stages[role],scene=steps[step],progress=element('div','sv-showcase-progress');progress.setAttribute('aria-label','Шаг '+(step+1)+' из '+steps.length);steps.forEach((_,i)=>{const part=element('span',i<=step?'is-current':'');progress.append(part)});body.append(progress);
 const section=element('div','sv-showcase-stage');section.append(element('div','sv-showcase-eyebrow',scene.eyebrow),element('h3',null,scene.title),element('div','sv-showcase-voice',scene.speech));
 const facts=element('div','sv-showcase-facts');scene.facts().forEach(([key,value])=>{const line=element('div','sv-showcase-fact');line.append(element('span',null,key),element('span',null,value));facts.append(line)});section.append(facts,element('p','sv-showcase-note',scene.note));
 const actions=element('div','sv-showcase-actions');
 if(scene.action){const act=button(scene.action,()=>{scene.run();refresh()},'sv-showcase-action');if(scene.disabled?.())act.disabled=true;actions.append(act)}
 if(step>0)actions.append(button('Назад',()=>{step--;refresh()}));
 const isLast=step===steps.length-1;actions.append(button(isLast?'Сначала':'Далее',()=>{step=isLast?0:step+1;refresh()}));
 actions.append(button('Закрыть демо',()=>{active=false;refresh()}));
 section.append(actions);body.append(section);card.append(body);root.append(card)}
refresh();
window.SEYVEO_DEMO={start:()=>{active=true;role='director';step=0;refresh()},reset:()=>{Object.keys(state).forEach(k=>state[k]=false);active=false;role='director';step=0;refresh()}};
})();