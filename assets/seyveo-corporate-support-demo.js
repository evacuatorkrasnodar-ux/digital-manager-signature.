/* SEYVEO corporate support: demo only. No messages, tickets or chats are sent. */
(()=>{
'use strict';
const root=document.getElementById('seyveoCorporateSupportDemo');if(!root)return;
const scenarios=[
  {title:'Не работают поручения',type:'Рабочие процессы',priority:'Высокий',answer:'Я помогу проверить доступ и состояние подключения. Если проблема не решится, подготовлю запрос для технического специалиста.'},
  {title:'Проблема с интеграцией',type:'Интеграции',priority:'Обычный',answer:'Можно проверить разрешения интеграции и последнюю синхронизацию. Для изменений на сервере потребуется специалист SEYVEO.'},
  {title:'Критический сбой',type:'Доступность сервиса',priority:'Критический',answer:'Это может влиять на работу команды. Я подготовлю срочное обращение с описанием последствий, но пока ничего не отправляю.'}
];
let selected=0,drafted=false;
const styles=document.createElement('style');styles.id='seyveo-corporate-support-demo-styles';styles.textContent=`
.sv-support-demo{padding:5px 11px 14px;display:grid;gap:10px}
.sv-support-demo p{font-size:12px;line-height:1.5;color:var(--secondary);margin:2px 0}
.sv-support-select{display:grid;gap:7px}
.sv-support-select button{background:var(--card);color:var(--text);border:1px solid var(--soft-line);border-radius:13px;text-align:left;padding:10px 11px;font-size:12px;min-height:40px}
.sv-support-select button[aria-pressed=true]{border-color:#4d9d76;background:rgba(52,126,86,.12)}
.sv-support-dialogue{border-left:2px solid #4b9470;padding:5px 0 5px 11px}
.sv-support-dialogue strong{font-size:12px;color:var(--text)}
.sv-support-ticket{padding:11px;border:1px solid #427657;border-radius:15px;background:rgba(40,112,72,.1)}
.sv-support-ticket strong{display:block;font-size:13px;color:var(--text);margin-bottom:5px}
.sv-support-action{border-radius:999px;background:#1c6040;color:#f3fff5;border:1px solid #47916b;font-size:13px;padding:11px 14px;min-height:42px;font-weight:600}
.sv-support-demo button:focus-visible{outline:2px solid #76caa0;outline-offset:2px}
`;document.head.append(styles);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const btn=(text,fn,cls)=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b};
function render(){root.replaceChildren();const panel=el('div','sv-support-demo');
panel.append(el('p',null,'Показываем путь от Сэйви к живой команде поддержки. Это демонстрация сценария, не работающий онлайн-чат.'));
const choices=el('div','sv-support-select');
scenarios.forEach((s,i)=>{const b=btn(s.title,()=>{selected=i;drafted=false;render()});b.setAttribute('aria-pressed',String(i===selected));choices.append(b)});panel.append(choices);
const s=scenarios[selected],answer=el('div','sv-support-dialogue');answer.append(el('strong',null,'Сэйви'),el('p',null,s.answer));panel.append(answer);
if(!drafted){panel.append(btn('Подготовить обращение человеку',()=>{drafted=true;render()},'sv-support-action'))}
else{const ticket=el('div','sv-support-ticket');ticket.append(el('strong',null,'Черновик обращения · НЕ ОТПРАВЛЕН'),el('p',null,'Тема: '+s.type+' · Приоритет для демонстрации: '+s.priority),el('p',null,'Специалист получит заявку только после подключения настоящего корпоративного чата, авторизации и подтверждения отправки.'));panel.append(ticket,btn('Другой вопрос',()=>{drafted=false;render()},'sv-support-action'))}
panel.append(el('p',null,'Цель для AUTONOM Enterprise: приём обращений 24/7 и прямой контакт с дежурным специалистом по согласованному SLA. До запуска службы нет гарантии круглосуточного ответа человека.'));
root.append(panel)}
render();
})();
