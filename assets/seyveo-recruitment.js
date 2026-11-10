/* SEYVEO Recruiting v1: local workspace, not an HH integration or hiring decision engine. */
(()=>{
'use strict';
const root=document.getElementById('seyveoRecruitment');if(!root)return;
const STORE='seyveo-recruiting-local-v1';
const STAGES=['Новый','Проверить опыт','Собеседование','Решение человека','Принят'];
const $=s=>root.querySelector(s);
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
const initial=()=>({vacancies:[],candidates:[]});
function load(){try{const p=JSON.parse(localStorage.getItem(STORE)||'null');return p&&Array.isArray(p.vacancies)&&Array.isArray(p.candidates)?p:initial()}catch{return initial()}}
let state=load();
root.innerHTML=`<div class="svrec-head"><div><h3 class="svrec-title">Подбор персонала</h3><p class="svrec-desc">Вакансии, кандидаты и решения руководителя</p></div><span class="svrec-state">На этом устройстве</span></div>
<div class="svrec-stats" aria-label="Состояние подбора"><div class="svrec-stat"><strong id="svrecVacancies">0</strong><small>Вакансий</small></div><div class="svrec-stat"><strong id="svrecCandidates">0</strong><small>Кандидатов</small></div><div class="svrec-stat"><strong id="svrecInterviews">0</strong><small>Интервью</small></div></div>
<p class="svrec-status" id="svrecStatus" role="status" aria-live="polite">Сэйви поможет подготовить вакансию. Решение о найме принимает руководитель.</p>
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
function sayvi(message){$('#svrecStatus').textContent='Сэйви: '+message;}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state));return true}catch{sayvi('Не удалось сохранить изменения в браузере. Проверь свободное место.');return false}}
function cardTitle(parent,title,sub){const h=el('div','svrec-cardhead'),name=el('div');name.append(el('strong',null,title),el('small',null,sub));h.append(name);parent.append(h);return h}
function render(){
 $('#svrecVacancies').textContent=String(state.vacancies.length);
 $('#svrecCandidates').textContent=String(state.candidates.length);
 $('#svrecInterviews').textContent=String(state.candidates.filter(x=>x.stage==='Собеседование').length);
 const list=$('#svrecVacancyList');list.replaceChildren();
 if(!state.vacancies.length)list.append(el('p','svrec-empty','Вакансий пока нет. Опиши первую должность — Сэйви подготовит основу.'));
 state.vacancies.forEach(v=>{
  const card=el('article','svrec-card');cardTitle(card,v.title,(v.city||'Город не указан')+' · '+v.criteria.length+' требований');
  const copy=el('p','svrec-small','Требования: '+v.criteria.join('; '));card.append(copy);list.append(card);
 });
 const select=$('#svrecCandidateForm [name=vacancy]'),chosen=select.value;select.replaceChildren();
 select.append(new Option('Выбрать вакансию',''));
 state.vacancies.forEach(v=>select.append(new Option(v.title,v.id)));
 if(state.vacancies.some(v=>v.id===chosen))select.value=chosen;
 const out=$('#svrecCandidateList');out.replaceChildren();
 if(!state.candidates.length)out.append(el('p','svrec-empty','Здесь появятся кандидаты после разрешённого отклика или ручного ввода. Сэйви подскажет, что подтвердить.'));
 state.candidates.slice().reverse().forEach(c=>{
  const vacancy=state.vacancies.find(v=>v.id===c.vacancyId);
  const card=el('article','svrec-card');
  const head=cardTitle(card,c.name,(vacancy?.title||'Вакансия')+' · '+c.source);head.append(el('span','svrec-tag',c.stage));
  const facts=el('div','svrec-analysis');facts.textContent=assess(c,vacancy);card.append(facts);
  const stages=el('div','svrec-pipeline');
  STAGES.forEach(stage=>{
   const b=el('button','svrec-stage',stage);b.type='button';b.setAttribute('aria-pressed',String(c.stage===stage));
   b.addEventListener('click',()=>{c.stage=stage;if(!persist())return;render();sayvi('Этап «'+stage+'» сохранён локально. Это не сообщение кандидату и не решение о найме.');});
   stages.append(b);
  });
  card.append(stages);
  const remove=el('button','svrec-button','Удалить данные кандидата');remove.type='button';remove.addEventListener('click',()=>{
   if(!confirm('Удалить локальную запись кандидата?'))return;
   state.candidates=state.candidates.filter(x=>x.id!==c.id);if(persist()){render();sayvi('Локальная запись удалена.');}
  });card.append(remove);out.append(card);
 });
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
 if(!persist()){state=load();return}e.currentTarget.reset();render();sayvi('Вакансия «'+title+'» создана. Следующий шаг — подтвердить публикацию на выбранной площадке после подключения.');
});
$('#svrecCandidateForm').addEventListener('submit',e=>{
 e.preventDefault();const form=e.currentTarget,f=new FormData(form);
 const name=String(f.get('name')||'').trim(),vacancyId=String(f.get('vacancy')||''),evidence=String(f.get('evidence')||'').trim();
 if(!f.has('allowed')||!name||!evidence||!state.vacancies.some(v=>v.id===vacancyId))return sayvi('Проверь вакансию, профессиональные факты и разрешение на обработку данных.');
 const item={id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name,vacancyId,evidence,source:String(f.get('source')||'Вручную').trim().slice(0,90)||'Вручную',stage:'Новый'};
 state.candidates.push(item);if(!persist()){state=load();return}form.reset();render();
 sayvi('Появился кандидат '+name+'. Я подготовила разбор профессиональных требований ниже. Уточни непроверенные сведения перед собеседованием.');
});
$('#svrecClear').addEventListener('click',()=>{
 if(!confirm('Удалить все вакансии и записи кандидатов из этого браузера?'))return;
 state=initial();if(persist()){render();sayvi('Локальная история подбора очищена.');}
});
render();
})();
