/* SEYVEO HR — demonstrational professional interview, no applicant scoring or external transmission. */
(()=>{'use strict';
const open=document.getElementById('seyveoHrDemoOpen');if(!open)return;
const questions=[
 {title:'Опыт работы',prompt:'Какой у вас опыт общения с покупателями?',choices:['Работал(а) с клиентами','Есть опыт в другой сфере','Пока нет опыта']},
 {title:'Рабочая ситуация',prompt:'Покупатель сообщает, что на товаре неправильный ценник. Что вы сделаете сначала?',choices:['Спокойно уточню проблему и проверю цену по правилам магазина','Сразу откажу в покупке','Изменю цену без проверки'],knowledge:0},
 {title:'Безопасность',prompt:'Вы заметили опасную ситуацию в торговом зале. Что сделаете?',choices:['Сообщу ответственному и ограничу риск по инструкции','Продолжу работать, не вмешиваясь','Размещу фото в личном чате'],knowledge:0},
 {title:'Обучение',prompt:'Что вы хотели бы освоить в первую очередь?',choices:['Работу с клиентами','Учёт товаров и процессов','Организацию работы команды']}
];
const css=document.createElement('style');css.textContent='.svhr-dialog{width:min(94vw,450px);max-height:85dvh;overflow:auto;border:1px solid var(--soft-line);border-radius:23px;padding:18px;background:var(--bg);color:var(--text);box-shadow:0 12px 60px #0007}.svhr-dialog::backdrop{background:#000b}.svhr-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.svhr-head h2{font-size:19px;margin:0}.svhr-dialog p{line-height:1.5;font-size:14px}.svhr-tag{font-size:11px;color:var(--secondary)}.svhr-options{display:grid;gap:8px;margin:14px 0}.svhr-options button,.svhr-close,.svhr-next{border:1px solid var(--soft-line);border-radius:15px;padding:11px 13px;background:var(--card);color:var(--text);text-align:left;min-height:43px}.svhr-options button[aria-pressed=true]{border-color:#62bd91;background:rgba(58,142,102,.18)}.svhr-next{background:#236548;color:#fff;text-align:center;width:100%}.svhr-next:disabled{opacity:.35}.svhr-summary{padding:10px 0;border-bottom:1px solid var(--soft-line);font-size:13px}.svhr-summary strong{display:block;margin-bottom:5px}.svhr-demo-trigger{border:1px solid #419573;border-radius:999px;background:rgba(44,125,89,.12);color:var(--text);padding:11px 15px;margin:8px 0;min-height:44px}';document.head.append(css);
const dialog=document.createElement('dialog');dialog.className='svhr-dialog';dialog.setAttribute('aria-label','Сэйви — демонстрационное собеседование');document.body.append(dialog);
let step=0,answers=[];
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};
const b=(txt,fn,cls)=>{const x=el('button',cls,txt);x.type='button';x.addEventListener('click',fn);return x};
function frame(title){dialog.replaceChildren();const header=el('div','svhr-head'),h=el('h2',null,title);header.append(h,b('Закрыть',()=>dialog.close(),'svhr-close'));dialog.append(header)}
function render(){
 if(step>=questions.length){result();return}
 const q=questions[step];frame('Сэйви · знакомство');dialog.append(el('p','svhr-tag','ДЕМО · вопрос '+(step+1)+' из '+questions.length));dialog.append(el('p',null,q.prompt));const opts=el('div','svhr-options');const next=b(step===questions.length-1?'Завершить':'Следующий вопрос',()=>{if(answers[step]===undefined)return;step++;render()},'svhr-next');next.disabled=answers[step]===undefined;
 q.choices.forEach((c,i)=>{const item=b(c,()=>{answers[step]=i;for(const opt of opts.children)opt.setAttribute('aria-pressed','false');item.setAttribute('aria-pressed','true');next.disabled=false});item.setAttribute('aria-pressed',String(answers[step]===i));opts.append(item)});dialog.append(opts,next);dialog.append(el('p','svhr-tag','Ответы не отправляются и не сохраняются. Для реальных собеседований нужны согласия, правила хранения и контроль кадровика.'))
}
function result(){frame('Карточка для руководителя');dialog.append(el('p','svhr-tag','ДЕМО · только рабочие ответы, без психологического профиля и автоматического решения о найме'));
questions.forEach((q,i)=>{const row=el('div','svhr-summary');row.append(el('strong',null,q.title),el('span',null,q.choices[answers[i]]||'Нет ответа'));if(q.knowledge!==undefined)row.append(el('p',null,answers[i]===q.knowledge?'Ответ совпал с учебным примером. Проверить применение на практике.':'Стоит дополнительно проверить знание процедуры.'));dialog.append(row)});
dialog.append(el('p',null,'Сэйви: «Спасибо! В ответах есть сведения о прошлом опыте и интересах кандидата. Я предлагаю уточнить их на личной встрече и проверить выполнение практического задания».'));dialog.append(b('Пройти заново',()=>{step=0;answers=[];render()},'svhr-next'))}
open.addEventListener('click',()=>{step=0;answers=[];render();if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','')});
dialog.addEventListener('close',()=>{answers=[];step=0;dialog.replaceChildren()});
})();
