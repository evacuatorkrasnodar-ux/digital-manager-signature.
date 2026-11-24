/* SEYVEO Recruiting v1: local workspace, not an HH integration or hiring decision engine. */
(()=>{
'use strict';
const root=document.getElementById('seyveoRecruitment');if(!root)return;
const STORE='seyveo-recruiting-local-v1';
const STAGES=['Новый','Проверить опыт','Собеседование','Решение человека','Принят'];
const detail=document.getElementById('svRecruitDetail'),detailBody=document.getElementById('svRecruitDetailScroll');
if(!detail||!detailBody)return;
document.body.append(detail);
const $=s=>root.querySelector(s)||detail.querySelector(s);
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
const initial=()=>({vacancies:[],candidates:[]});
function load(){try{const p=JSON.parse(localStorage.getItem(STORE)||'null');return p&&Array.isArray(p.vacancies)&&Array.isArray(p.candidates)?p:initial()}catch{return initial()}}
const example=()=>({vacancies:[
{id:'demo-v1',title:'Менеджер по продажам',city:'Краснодар',criteria:['Работа с клиентами','Ведение CRM','Подготовка предложений']},
{id:'demo-v2',title:'Кассир',city:'Краснодар',criteria:['Работа с кассой','Обслуживание покупателей']}
],candidates:[
{id:'demo-c1',name:'Алексей Примеров',vacancyId:'demo-v1',source:'Учебный отклик',evidence:'В вымышленном резюме указаны работа с клиентами и ведение CRM.',stage:'Собеседование'},
{id:'demo-c2',name:'Мария Демова',vacancyId:'demo-v2',source:'Учебный отклик',evidence:'В вымышленном резюме указан опыт работы с кассой.',stage:'Проверить опыт'},
{id:'demo-c3',name:'Илья Образцов',vacancyId:'demo-v1',source:'Учебный отклик',evidence:'В вымышленном резюме указана подготовка предложений.',stage:'Новый'}
]});
let state=load();
let demo=!state.vacancies.length&&!state.candidates.length;
if(demo)state=example();
root.innerHTML=`<div class="svrec-head"><div><h3 class="svrec-title">Подбор персонала</h3><p class="svrec-desc">Вакансии, кандидаты и решения руководителя</p></div><button type="button" class="svrec-mode" id="svrecMode" aria-pressed="false"></button></div>
<div class="svrec-stats" aria-label="Состояние подбора"><div class="svrec-stat"><strong id="svrecVacancies">0</strong><small>Вакансий</small></div><div class="svrec-stat"><strong id="svrecCandidates">0</strong><small>Кандидатов</small></div><div class="svrec-stat"><strong id="svrecInterviews">0</strong><small>Интервью</small></div></div>
<div class="svrec-advice"><div class="svrec-advice-head"><span class="sv-sayvi-symbol" aria-hidden="true"></span><strong>Сэйви</strong></div><p class="svrec-status" id="svrecStatus" role="status" aria-live="polite">Сэйви поможет подготовить вакансию. Решение о найме принимает руководитель.</p></div><p id="svrecDemoNote" class="svrec-small" hidden>Все имена и отклики вымышлены. Изменения в примере не записываются в реальный подбор.</p>
<section class="svrec-section"><div class="svrec-section-head"><h4 class="svrec-section-title">01 · Вакансия</h4></div>
<form id="svrecVacancyForm" class="svrec-grid"><label class="svrec-field">Кого ищем<input name="title" maxlength="90" placeholder="Например, кассир" required></label><label class="svrec-field">Город<input name="city" maxlength="90" placeholder="Краснодар"></label><label class="svrec-field wide">Требования по работе<textarea name="criteria" maxlength="1200" required placeholder="По одному требованию с новой строки: опыт с кассой, работа с покупателями…"></textarea></label><div class="svrec-actions svrec-field wide"><button class="svrec-button primary" type="submit">Создать вакансию</button></div></form>
<div id="svrecVacancyList" class="svrec-candidates"></div>
<p class="svrec-small">Публикация вакансии требует подключения площадки и подтверждения работодателя.</p></section>
<section class="svrec-section"><div class="svrec-section-head"><h4 class="svrec-section-title">02 · Площадки и отклики</h4></div>
<p class="svrec-desc">Площадки пока не подключены. Отклики можно добавить вручную при наличии основания для обработки данных.</p>

<form id="svrecCandidateForm" class="svrec-grid"><label class="svrec-field wide">Кандидат<input name="name" maxlength="90" placeholder="Имя из разрешённого отклика" required></label><label class="svrec-field">Источник<input name="source" maxlength="90" placeholder="hh.ru / вручную"></label><label class="svrec-field">Вакансия<select name="vacancy" required></select></label><label class="svrec-field wide">Профессиональные факты из отклика<textarea name="evidence" maxlength="1800" placeholder="Опыт, конкретные навыки, примеры работ — только разрешённые данные" required></textarea></label>
<label class="svrec-consent svrec-field wide"><input type="checkbox" name="allowed" required><span>У меня есть законное основание обрабатывать данные кандидата для подбора. Не добавляю личные или чувствительные сведения.</span></label><div class="svrec-actions svrec-field wide"><button class="svrec-button primary" type="submit">Добавить отклик</button></div></form></section>
<section class="svrec-section"><div class="svrec-section-head"><h4 class="svrec-section-title">03 · Кандидаты и оценка Сэйви</h4></div><div id="svrecCandidateList" class="svrec-candidates"></div></section>
<section class="svrec-section"><h4 class="svrec-section-title">04 · Решение и адаптация</h4><p class="svrec-desc">Проверка фактов, собеседования и итоговые решения остаются под контролем руководителя.</p><button type="button" class="svrec-button" id="svrecClear">Очистить локальный подбор</button><p class="svrec-small">Данные остаются в этом браузере. Используйте только информацию, на обработку которой есть разрешение.</p></section>`;
// One compact disclosure per workflow, rather than four long sections at once.
const headings=['Вакансии','Отклики','Кандидаты','Управление'];
const sections=Array.from(root.querySelectorAll('.svrec-section'));
sections.forEach((section,i)=>{
 const heading=section.querySelector('.svrec-section-title');
 const fold=document.createElement('details');
 fold.className='svrec-fold';
 fold.dataset.kind=['vacancies','responses','candidates','settings'][i];
 const summary=document.createElement('summary');summary.className='svrec-fold-label';
 summary.textContent=headings[i]||'Дополнительно';
 const icon=document.createElement('span');icon.className='svrec-fold-chevron';
 icon.textContent='›';icon.setAttribute('aria-hidden','true');summary.append(icon);
 section.parentNode.insertBefore(fold,section);
 heading?.remove();
 fold.append(summary,section);
});
const vacancyForm=$('#svrecVacancyForm'),candidateForm=$('#svrecCandidateForm');
const detailContent=el('div','svrec-detail-content'),detailStatus=el('p','svrec-detail-status');
detailStatus.setAttribute('role','status');detailStatus.hidden=true;
function action(text,fn,cls='svrec-button'){const button=el('button',cls,text);button.type='button';button.addEventListener('click',fn);return button;}
const vacancyLaunch=action('Новая вакансия',()=>openDetail('vacancy'));
const responseLaunch=action('Добавить отклик',()=>openDetail('response'));
const vacancyList=$('#svrecVacancyList');
vacancyList.after(vacancyLaunch);
candidateForm.before(responseLaunch);
detailBody.append(vacancyForm,candidateForm,detailContent,detailStatus);
let currentMode='',currentId=null,returnTrigger=null;
function openDetail(mode,id=null,trigger=document.activeElement){
 currentMode=mode;currentId=id;returnTrigger=trigger;
 detail.querySelector('h2').textContent=mode==='vacancy'?'Новая вакансия':mode==='response'?'Новый отклик':mode==='vacancy-view'?'Вакансия':'Кандидат';
 vacancyForm.hidden=mode!=='vacancy';candidateForm.hidden=mode!=='response';
 detailContent.hidden=mode==='vacancy'||mode==='response';detailStatus.hidden=true;
 if(mode==='candidate')renderCandidateDetail();
 if(mode==='vacancy-view')renderVacancyDetail();
 if(!detail.open)detail.showModal();
 detailBody.scrollTop=0;
 window.SEYVEO_DOCK_CONTINUITY?.refresh?.();
}
detail.querySelector('header button').addEventListener('click',()=>detail.close());
detail.addEventListener('close',()=>{currentMode='';currentId=null;detailStatus.hidden=true;if(returnTrigger?.isConnected)returnTrigger.focus({preventScroll:true});});
function sayvi(message){$('#svrecStatus').textContent=message;if(detail.open){detailStatus.textContent=message;detailStatus.hidden=false;}}
function row(title,sub,initials,tag,fn){
 const button=el('button','svrec-list-row');button.type='button';
 // A single real click handler; title and secondary text remain accessible.
 const copy=el('span','svrec-list-copy');copy.append(el('strong',null,title),el('small',null,sub));
 if(initials)button.append(el('span','svrec-list-avatar',initials));
 button.append(copy);
 if(tag)button.append(el('span','svrec-tag',tag));
 const arrow=el('span','svrec-list-arrow','›');arrow.setAttribute('aria-hidden','true');button.append(arrow);
 button.addEventListener('click',()=>fn(button));return button;
}
function renderVacancyDetail(){
 const v=state.vacancies.find(x=>x.id===currentId);detailContent.replaceChildren();if(!v)return;
 detailContent.append(el('h3','svrec-detail-name',v.title),el('p','svrec-desc',(v.city||'Город не указан')+(demo?' · учебная вакансия':'')),el('h4','svrec-detail-heading','Требования'));
 const list=el('ul','svrec-criteria');v.criteria.forEach(c=>list.append(el('li',null,c)));detailContent.append(list,el('p','svrec-small','Публикация требует подключения площадки и подтверждения работодателя.'));
}
function renderCandidateDetail(){
 const c=state.candidates.find(x=>x.id===currentId);detailContent.replaceChildren();if(!c)return;
 const vacancy=state.vacancies.find(v=>v.id===c.vacancyId);
 const identity=el('div','svrec-identity');
 identity.append(el('span','svrec-list-avatar',c.name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()),el('h3','svrec-detail-name',c.name),el('p','svrec-desc',(vacancy?.title||'Вакансия')+' · '+c.source),el('span','svrec-tag',c.stage));detailContent.append(identity);
 detailContent.append(el('h4','svrec-detail-heading','Разбор Сэйви'),el('div','svrec-analysis',assess(c,vacancy)),el('h4','svrec-detail-heading','Этап подбора'));
 const stages=el('div','svrec-pipeline');
 STAGES.forEach(stage=>{const b=action(stage,()=>{const previous=c.stage;c.stage=stage;if(!persist()){c.stage=previous;return;}render();renderCandidateDetail();sayvi('Этап изменён. Решение принимает руководитель.');},'svrec-stage');b.setAttribute('aria-pressed',String(c.stage===stage));stages.append(b);});
 detailContent.append(stages,action('Удалить данные кандидата',()=>{if(!confirm('Удалить запись кандидата?'))return;const previous=state.candidates;state.candidates=previous.filter(x=>x.id!==c.id);if(!persist()){state.candidates=previous;return;}detail.close();render();sayvi('Запись удалена.');},'svrec-delete'));
}
function persist(){if(demo)return true;try{localStorage.setItem(STORE,JSON.stringify(state));return true}catch{sayvi('Не удалось сохранить изменения в браузере. Проверь свободное место.');return false}}
function cardTitle(parent,title,sub){const h=el('div','svrec-cardhead'),name=el('div');name.append(el('strong',null,title),el('small',null,sub));h.append(name);parent.append(h);return h}
function render(){
 $('#svrecMode').textContent=demo?'Пример · выйти':'Показать пример';
 $('#svrecMode').setAttribute('aria-pressed',String(demo));
 $('#svrecDemoNote').hidden=!demo;
 $('#svrecClear').textContent=demo?'Сбросить учебный пример':'Очистить локальный подбор';
 $('#svrecVacancies').textContent=String(state.vacancies.length);
 $('#svrecCandidates').textContent=String(state.candidates.length);
 $('#svrecInterviews').textContent=String(state.candidates.filter(x=>x.stage==='Собеседование').length);
 const list=$('#svrecVacancyList');list.replaceChildren();
 if(!state.vacancies.length)list.append(el('p','svrec-empty','Вакансий пока нет. Опиши первую должность — Сэйви подготовит основу.'));
 state.vacancies.forEach(v=>list.append(row(v.title,(v.city||'Город не указан')+' · '+v.criteria.length+' требований','', '',trigger=>openDetail('vacancy-view',v.id,trigger))));
 const select=$('#svrecCandidateForm [name=vacancy]'),chosen=select.value;select.replaceChildren();
 select.append(new Option('Выбрать вакансию',''));
 state.vacancies.forEach(v=>select.append(new Option(v.title,v.id)));
 if(state.vacancies.some(v=>v.id===chosen))select.value=chosen;
 const out=$('#svrecCandidateList');out.replaceChildren();
 if(!state.candidates.length)out.append(el('p','svrec-empty','Здесь появятся кандидаты после разрешённого отклика или ручного ввода. Сэйви подскажет, что подтвердить.'));
 state.candidates.slice().reverse().forEach(c=>{const vacancy=state.vacancies.find(v=>v.id===c.vacancyId);const initials=c.name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();out.append(row(c.name,vacancy?.title||'Вакансия',initials,c.stage,trigger=>openDetail('candidate',c.id,trigger)));});
}
function assess(candidate,vacancy){
 if(!vacancy)return 'Не найдена вакансия для сопоставления.';
 const facts=candidate.evidence.toLocaleLowerCase('ru-RU');
 const mentioned=[],unclear=[];
 for(const rule of vacancy.criteria){
  // Keyword appearance is a prompt to verify, never proof of competence or a hiring score.
  const words=rule.toLocaleLowerCase('ru-RU').match(/[а-яёa-z0-9]{4,}/g)||[];
  const has=words.length>0&&words.some(w=>facts.includes(w));
  (has?mentioned:unclear).push(rule);
 }
 const parts=['Факты из отклика: '+candidate.evidence];
 if(mentioned.length)parts.push('Есть упоминания по требованиям: '+mentioned.join('; ')+'. Это не подтверждение навыков.');
 if(unclear.length)parts.push('Уточнить на интервью: '+unclear.join('; ')+'.');
 parts.push('Следующий шаг: проверить опыт и задать профессиональный кейс. Сэйви не оценивает личность, не ставит рейтинг пригодности и не принимает решение о найме.');
 return parts.join('\n\n');
}
$('#svrecVacancyForm').addEventListener('submit',e=>{
 e.preventDefault();const f=new FormData(e.currentTarget);
 const title=String(f.get('title')||'').trim(),city=String(f.get('city')||'').trim();
 const criteria=String(f.get('criteria')||'').split(/[\n;]+/).map(x=>x.trim()).filter(Boolean).slice(0,20);
 if(!title||!criteria.length)return sayvi('Укажи должность и хотя бы одно профессиональное требование.');
 state.vacancies.push({id:'v'+Date.now().toString(36),title,city,criteria});
 if(!persist()){state=load();render();return}e.currentTarget.reset();detail.close();render();sayvi('Вакансия «'+title+'» создана. Следующий шаг — подтвердить публикацию на выбранной площадке после подключения.');
});
$('#svrecCandidateForm').addEventListener('submit',e=>{
 e.preventDefault();const form=e.currentTarget,f=new FormData(form);
 const name=String(f.get('name')||'').trim(),vacancyId=String(f.get('vacancy')||''),evidence=String(f.get('evidence')||'').trim();
 if(!f.has('allowed')||!name||!evidence||!state.vacancies.some(v=>v.id===vacancyId))return sayvi('Проверь вакансию, профессиональные факты и разрешение на обработку данных.');
 const item={id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name,vacancyId,evidence,source:String(f.get('source')||'Вручную').trim().slice(0,90)||'Вручную',stage:'Новый'};
 state.candidates.push(item);if(!persist()){state=load();return}form.reset();detail.close();render();
 sayvi('Появился кандидат '+name+'. Я подготовила разбор профессиональных требований ниже. Уточни непроверенные сведения перед собеседованием.');
});
$('#svrecMode').addEventListener('click',()=>{
 demo=!demo;state=demo?example():load();
 $('#svrecVacancyForm').reset();$('#svrecCandidateForm').reset();render();
 sayvi(demo?'Учебный подбор: два рабочих места и три вымышленных отклика. Попробуй менять этапы.':'Рабочие записи на этом устройстве. Решение о найме принимает руководитель.');
});
$('#svrecClear').addEventListener('click',()=>{
 if(demo){state=example();render();sayvi('Учебный пример восстановлен. Рабочие записи не изменены.');return;}
 if(!confirm('Удалить все вакансии и записи кандидатов из этого браузера?'))return;
 state=initial();if(persist()){render();sayvi('Локальная история подбора очищена.');}
});
render();
if(demo)sayvi('Учебный подбор: два рабочих места и три вымышленных отклика. Попробуй менять этапы.');
})();
