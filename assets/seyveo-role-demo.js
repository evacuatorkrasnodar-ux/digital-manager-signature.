/* SEYVEO role demo: fictional data; no actual employee access controls. */
(()=>{'use strict';const root=document.getElementById('seyveoRoleDemo');if(!root)return;
const data={
director:[
 ['Сегодня','Три сотрудника на смене · один новичок проходит адаптацию.'],
 ['Команда','Анна: 7 благодарностей. Михаил: нужна проверка замечания, предложено обучение.'],
 ['Кадры','Новый кандидат прошёл учебные вопросы. Открыть собеседование можно из раздела «Кадры».'],
 ['Эффект','Сэйви помогает сокращать ручную рутину. Фактическая экономия пока не измеряется.']],
employee:[
 ['Моя смена','Нажми «Я на работе» в разделе «Команда → Моя смена и мои часы».'],
 ['Сэйви помогает','Не знаешь процедуру? Сэйви сможет объяснить утверждённую инструкцию или позвать наставника.'],
 ['Мои часы','График, завершённые смены, часы сверх плана и запрос исправления табеля.'],
 ['Мой рост','Благодарности, подтверждённые навыки и добровольный карьерный план.']]};
let role='director',index=0;
const style=document.createElement('style');style.textContent='.svrole{padding:12px;margin-top:8px;border:1px solid var(--soft-line);border-radius:20px;background:var(--card)}.svrole h3{font-size:16px;margin:0 0 6px}.svrole p{font-size:13px;line-height:1.55;margin:7px 0;color:var(--secondary)}.svrole-controls{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.svrole button{border:1px solid var(--soft-line);color:var(--text);background:transparent;border-radius:999px;padding:9px 13px;min-height:40px;font-size:13px}.svrole button[aria-pressed=true]{border-color:#55ba8b;background:rgba(50,125,87,.16)}.svrole-step{border-top:1px solid var(--soft-line);padding:12px 0;min-height:119px}.svrole-step strong{font-size:14px}.svrole-caption{font-size:11px!important}.svrole-progress{color:#55bb89!important}';document.head.append(style);
const wrap=document.createElement('div');wrap.className='svrole';root.append(wrap);
const txt=(tag,value,cls)=>{const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el};
const button=(name,fn)=>{const el=document.createElement('button');el.type='button';el.textContent=name;el.addEventListener('click',fn);return el};
function paint(){wrap.replaceChildren();wrap.append(txt('h3','Живое демо · SEYVEO Business'),txt('p','Покажите, как одна Сэйви помогает руководителю и сотруднику. Роли здесь только демонстрационные.'));
const controls=document.createElement('div');controls.className='svrole-controls';[['director','Руководитель'],['employee','Сотрудник']].forEach(([id,name])=>{const b=button(name,()=>{role=id;index=0;paint()});b.setAttribute('aria-pressed',String(id===role));controls.append(b)});wrap.append(controls);
const stage=document.createElement('div');stage.className='svrole-step';const item=data[role][index];stage.append(txt('p','Сцена '+(index+1)+' из '+data[role].length,'svrole-progress'),txt('strong',item[0]),txt('p',item[1]));wrap.append(stage);
const actions=document.createElement('div');actions.className='svrole-controls';actions.append(button(index===data[role].length-1?'Начать сначала':'Дальше',()=>{index=(index+1)%data[role].length;paint()}));if(index>0)actions.append(button('Назад',()=>{index--;paint()}));wrap.append(actions,txt('p','Презентационный сценарий с вымышленными сведениями. Переключатель не меняет права доступа и не скрывает реальные разделы приложения.','svrole-caption'))}
paint();
})();