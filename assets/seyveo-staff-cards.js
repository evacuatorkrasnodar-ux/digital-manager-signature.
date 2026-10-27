/* SEYVEO staff cards: fictional UI examples, no real HR data, no automated personnel verdicts. */
(()=>{'use strict';
const root=document.getElementById('seyveoStaffCards');if(!root)return;
const people=[
 {name:'Анна С.',role:'Старший продавец',since:'2024-03-12',wins:7,notes:1,learning:'Наставничество',facts:['7 подтверждённых благодарностей за помощь коллегам','Одно рабочее замечание: исправлено после проверки'],next:'Обсудить возможность наставничества и развитие управленческих навыков.'},
 {name:'Михаил К.',role:'Продавец',since:'2026-07-01',wins:3,notes:2,learning:'Работа с возвратами',facts:['3 благодарности за обслуживание покупателей','2 рабочих замечания: одно закрыто, одно ожидает проверки'],next:'Уточнить обстоятельства открытого замечания, предложить обучение и повторную проверку навыка.'},
 {name:'Елена П.',role:'Администратор',since:'2022-10-05',wins:9,notes:0,learning:'Учёт товаров',facts:['9 подтверждённых благодарностей','Нет зарегистрированных рабочих замечаний'],next:'Обсудить карьерные интересы и возможности профессионального роста.'}
];
const css=document.createElement('style');css.textContent='.svstaff-list{display:grid;gap:7px;padding:8px 9px 13px}.svstaff-card{border:1px solid var(--soft-line);border-radius:15px;background:var(--card);padding:11px}.svstaff-top{display:flex;align-items:center;gap:11px}.svstaff-avatar{height:39px;width:39px;display:grid;place-items:center;background:rgba(46,125,88,.17);border:1px solid #327257;border-radius:50%;color:var(--text);font-weight:600;flex:none}.svstaff-meta{flex:1;min-width:0}.svstaff-name{font-size:14px;font-weight:650}.svstaff-role{font-size:12px;color:var(--secondary)}.svstaff-expand{background:transparent;border:0;color:var(--text);font-size:12px;text-decoration:underline;min-height:35px}.svstaff-details{margin-top:10px;border-top:1px solid var(--soft-line);padding-top:10px;color:var(--secondary);font-size:12px;line-height:1.6}.svstaff-details p{margin:5px 0}.svstaff-details strong{color:var(--text)}.svstaff-note{padding:9px;border-radius:12px;background:rgba(39,114,78,.11)}';document.head.append(css);
root.classList.add('svstaff-list');
const h=document.createElement('p');h.className='seyveo-hr-intro';h.textContent='Учебные карточки вымышленных сотрудников. Фото, оценки, претензии и рабочая история реальных людей не подключены. Руководитель видит только подтверждённые события в рамках прав доступа.';root.append(h);
const duration=date=>{const m=Math.max(0,Math.floor((Date.now()-Date.parse(date))/(86400000*30.4375)));return Math.floor(m/12)+' г. '+m%12+' мес.'};
people.forEach((person,i)=>{
 const card=document.createElement('article');card.className='svstaff-card';
 const top=document.createElement('div');top.className='svstaff-top';
 const avatar=document.createElement('span');avatar.className='svstaff-avatar';avatar.textContent=person.name.slice(0,1);avatar.setAttribute('aria-label','Инициалы вместо фотографии');
 const meta=document.createElement('div');meta.className='svstaff-meta';
 const name=document.createElement('div');name.className='svstaff-name';name.textContent=person.name;
 const role=document.createElement('div');role.className='svstaff-role';role.textContent=person.role+' · '+duration(person.since);
 meta.append(name,role);
 const btn=document.createElement('button');btn.className='svstaff-expand';btn.type='button';btn.textContent='Подробнее';btn.setAttribute('aria-expanded','false');
 const details=document.createElement('div');details.className='svstaff-details';details.hidden=true;
 const facts=document.createElement('p');facts.textContent='Благодарности: '+person.wins+' · Замечания: '+person.notes+' · Навык: '+person.learning;
 const ul=document.createElement('ul');person.facts.forEach(f=>{const li=document.createElement('li');li.textContent=f;ul.append(li)});
 const next=document.createElement('p');next.className='svstaff-note';next.textContent='Сэйви предлагает следующий рабочий шаг: '+person.next;
 const foot=document.createElement('p');foot.textContent='Демо без рейтинга личности и без рекомендаций об увольнении. Любое замечание нужно проверить, дать сотруднику возможность ответить и исправить запись.';
 details.append(facts,ul,next,foot);top.append(avatar,meta,btn);card.append(top,details);root.append(card);
 btn.addEventListener('click',()=>{details.hidden=!details.hidden;btn.textContent=details.hidden?'Подробнее':'Свернуть';btn.setAttribute('aria-expanded',String(!details.hidden))});
});
})();