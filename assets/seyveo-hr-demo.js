/* SEYVEO HR — demonstrational professional interview, no applicant scoring or external transmission. */
(()=>{'use strict';
const open=document.getElementById('seyveoHrDemoOpen');if(!open)return;
const questions=[
 {title:'Опыт работы',prompt:'Какой у вас опыт общения с покупателями?',choices:['Работал(а) с клиентами','Есть опыт в другой сфере','Пока нет опыта']},
 {title:'Рабочая ситуация',prompt:'Покупатель сообщает, что на товаре неправильный ценник. Что вы сделаете сначала?',choices:['Спокойно уточню проблему и проверю цену по правилам магазина','Сразу откажу в покупке','Изменю цену без проверки'],knowledge:0},
 {title:'Безопасность',prompt:'Вы заметили опасную ситуацию в торговом зале. Что сделаете?',choices:['Сообщу ответственному и ограничу риск по инструкции','Продолжу работать, не вмешиваясь','Размещу фото в личном чате'],knowledge:0},
 {title:'Обучение',prompt:'Что вы хотели бы освоить в первую очередь?',choices:['Работу с клиентами','Учёт товаров и процессов','Организацию работы команды']}
];
const dialog=document.getElementById('svHrInterview'),body=document.getElementById('svHrInterviewScroll');if(!dialog||!body)return;document.body.append(dialog);
dialog.querySelector('header button').addEventListener('click',()=>dialog.close());
let step=0,answers=[];
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};
const b=(txt,fn,cls)=>{const x=el('button',cls,txt);x.type='button';x.addEventListener('click',fn);return x};
function frame(title){body.replaceChildren();dialog.querySelector('h2').textContent=title;body.scrollTop=0;const avatar=el('img','svhr-avatar');avatar.src='assets/seyveo-sayvi-pearl-v1.webp';avatar.alt='';body.append(avatar);}
function render(){
 if(step>=questions.length){result();return}
 const q=questions[step];frame('Собеседование');body.append(el('p','svhr-tag','ДЕМО · вопрос '+(step+1)+' из '+questions.length));body.append(el('p',null,q.prompt));const opts=el('div','svhr-options');const next=b(step===questions.length-1?'Завершить':'Следующий вопрос',()=>{if(answers[step]===undefined)return;step++;render()},'svhr-next');next.disabled=answers[step]===undefined;
 q.choices.forEach((c,i)=>{const item=b(c,()=>{answers[step]=i;for(const opt of opts.children)opt.setAttribute('aria-pressed','false');item.setAttribute('aria-pressed','true');next.disabled=false},'svhr-choice');item.setAttribute('aria-pressed',String(answers[step]===i));opts.append(item)});body.append(opts,next);body.append(el('p','svhr-tag','Ответы не отправляются и не сохраняются. Для реальных собеседований нужны согласия, правила хранения и контроль кадровика.'))
}
function result(){frame('Карточка для руководителя');body.append(el('p','svhr-tag','ДЕМО · только рабочие ответы, без психологического профиля и автоматического решения о найме'));
questions.forEach((q,i)=>{const row=el('div','svhr-summary');row.append(el('strong',null,q.title),el('span',null,q.choices[answers[i]]||'Нет ответа'));if(q.knowledge!==undefined)row.append(el('p',null,answers[i]===q.knowledge?'Ответ совпал с учебным примером. Проверить применение на практике.':'Стоит дополнительно проверить знание процедуры.'));body.append(row)});
body.append(el('p',null,'Сэйви: «Спасибо! В ответах есть сведения о прошлом опыте и интересах кандидата. Я предлагаю уточнить их на личной встрече и проверить выполнение практического задания».'));body.append(b('Пройти заново',()=>{step=0;answers=[];render()},'svhr-next'))}
open.addEventListener('click',()=>{step=0;answers=[];render();if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');window.SEYVEO_DOCK_CONTINUITY?.refresh?.()});
dialog.addEventListener('close',()=>{answers=[];step=0;body.replaceChildren()});
})();
