/* SEYVEO goals: amounts in integer kopecks, separate from financial ledger. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),root=$('sypGoalsScreen'),editor=$('sypGoalEditor');if(!root||!editor)return;
const key='seyveo-wallet-goals-v1',uid=()=>crypto.randomUUID?.()||String(Date.now())+Math.random(),MAX=999999999999;
function cents(raw){const s=String(raw).trim().replace(/\s/g,'').replace(',','.');if(!/^\d+(?:\.\d{1,2})?$/.test(s))return NaN;const [a,b='']=s.split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));return Number.isSafeInteger(n)&&n>0&&n<=MAX?n:NaN;}
function day(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
const fmt=n=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:2,minimumFractionDigits:0}).format(n/100);
const moneyOK=n=>Number.isSafeInteger(n)&&n>=0&&n<=MAX;
let goals=[],mode='new',activeId=null;try{const a=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(a))goals=a.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&x.name.length<=60&&moneyOK(x.target)&&x.target>0&&moneyOK(x.saved)&&(!x.date||day(x.date))).slice(0,100);}catch{}
function save(next){try{localStorage.setItem(key,JSON.stringify(next));goals=next;return true;}catch{return false;}}
const form=$('sypGoalForm'),status=$('sypGoalsStatus'),editorStatus=$('sypGoalEditorStatus');
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const plus='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const dots='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>';
function action(kind,id,label,icon){const b=make('button',kind==='edit'?'syp-goals-circle':'');b.type='button';b.dataset.goal=kind;b.dataset.id=id;b.setAttribute('aria-label',label);if(icon)b.innerHTML=icon;if(kind!=='edit')b.append(document.createTextNode(label));return b;}
function hint(x){if(x.saved>=x.target)return 'Цель достигнута';const remain=x.target-x.saved;if(!x.date)return 'Осталось '+fmt(remain);const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());const days=Math.ceil((Date.parse(x.date)-today)/86400000);const date=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(x.date));return days>0?'До '+date+' · по '+fmt(Math.ceil(remain/days))+' в день':(days===0?'Срок сегодня':'Срок прошёл')+' · осталось '+fmt(remain);}
function render(){
 $('sypGoalsTotal').textContent=fmt(goals.reduce((a,x)=>a+x.saved,0));
 $('sypGoalsCount').textContent=goals.length?goals.filter(x=>x.saved>=x.target).length+' из '+goals.length+' целей достигнуто':'Нет целей';
 $('sypGoalsEmpty').hidden=goals.length>0;
 const list=$('sypGoalsList');list.replaceChildren();
 for(const x of goals){
  const card=make('article','syp-goal-card'),head=make('div','syp-goal-cardhead'),title=make('h4','',x.name),edit=action('edit',x.id,'Изменить цель',dots);head.append(title,edit);
  const sum=make('div','syp-goal-amount');sum.append(make('strong','',fmt(x.saved)),make('span','','из '+fmt(x.target)));
  const bar=make('div','syp-goal-bar'),fill=make('i');const p=Math.min(100,Math.floor(x.saved/x.target*100));fill.style.width=p+'%';bar.append(fill);bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',x.name);bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow',String(p));
  const controls=make('div','syp-goal-actions'),add=action('deposit',x.id,'Пополнить',plus),withdraw=action('withdraw',x.id,'Снять'),remove=action('delete',x.id,'Удалить');withdraw.disabled=!x.saved;controls.append(add,withdraw,remove);
  card.append(head,sum,bar,make('div','syp-goal-hint',p+'% · '+hint(x)),controls);list.append(card);
 }
}
function open(kind,x){
 mode=kind;activeId=x?.id||null;editorStatus.textContent='';const money=kind==='deposit'||kind==='withdraw';
 $('sypGoalFields').hidden=money;$('sypGoalMoneyFields').hidden=!money;
 $('sypGoalEditorTitle').textContent=money?(kind==='deposit'?'Пополнение':'Снятие'):(kind==='edit'?'Изменить цель':'Новая цель');
 $('sypGoalName').value=x?.name||'';$('sypGoalTarget').value=x?String(x.target/100):'';$('sypGoalDate').value=x?.date||'';$('sypGoalMoney').value='';
 $('sypGoalMoneyLabel').textContent=(kind==='withdraw'?'Снять из копилки':'Отложить')+', ₽';
 if(!editor.open)editor.showModal();
}
function cancel(){if(editor.open)editor.close();}
form.addEventListener('submit',e=>{
 e.preventDefault();const x=goals.find(y=>y.id===activeId);let next;
 if(mode==='new'||mode==='edit'){
  const name=$('sypGoalName').value.trim(),target=cents($('sypGoalTarget').value),date=$('sypGoalDate').value;
  if(!name||!Number.isFinite(target)||(date&&!day(date))){editorStatus.textContent='Проверьте название, сумму и срок.';return;}
  if(mode==='new'){if(goals.length>=100){editorStatus.textContent='Достигнут лимит 100 целей.';return;}next=[{id:uid(),name,target,date,saved:0},...goals];}
  else if(x)next=goals.map(y=>y.id===x.id?{...y,name,target,date}:y);
 }else if(x){
  const n=cents($('sypGoalMoney').value),saved=x.saved+(mode==='deposit'?n:-n);
  if(!Number.isFinite(n)||!moneyOK(saved)){editorStatus.textContent=mode==='withdraw'?'Сумма превышает накопления или введена неверно.':'Проверьте сумму пополнения.';return;}
  next=goals.map(y=>y.id===x.id?{...y,saved}:y);
 }
 if(!next||!save(next)){editorStatus.textContent='Не удалось сохранить запись.';return;}
 cancel();render();status.textContent='Сохранено.';
});
root.addEventListener('click',e=>{const b=e.target.closest('[data-goal]');if(!b)return;const kind=b.dataset.goal,x=goals.find(y=>y.id===b.dataset.id);if(kind==='new')open(kind);else if(kind==='delete'&&x){if(confirm('Удалить цель «'+x.name+'» и её учёт накоплений?')){if(save(goals.filter(y=>y.id!==x.id))){render();status.textContent='Цель удалена.';}else status.textContent='Не удалось удалить цель.';}}else if(x&&['edit','deposit','withdraw'].includes(kind))open(kind,x);});
editor.addEventListener('click',e=>{if(e.target.closest('[data-goal="cancel"]'))cancel();});
editor.addEventListener('cancel',e=>{e.preventDefault();cancel();});
window.SEYVEO_GOALS=Object.freeze({render});render();
})();
