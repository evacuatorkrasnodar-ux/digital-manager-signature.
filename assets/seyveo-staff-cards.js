/* SEYVEO · People of the company. Black Velvet demo, all data fictional.
   No performance ranking, hiring/firing decision or network transfer.
   Optional portrait replacement stays in browser memory, never uploaded. */
(()=>{
'use strict';
const root=document.getElementById('seyveoStaffCards');
if(!root)return;
const people=[
 {id:'anna',name:'Анна С.',role:'Старший продавец',since:'2024-03-12',thanks:7,remarks:1,development:'Рост',skill:'Наставничество',hint:'Есть опыт наставничества',insight:'У Анны есть подтверждённый опыт помощи коллегам. Я предлагаю обсудить с ней возможность наставничества и дальнейшее профессиональное развитие.',next:['Обсудить интерес к роли наставника','Согласовать обучение новых коллег'],events:[
  {date:'12 октября',type:'good',title:'Помогала обучать новых сотрудников',sub:'Подтверждённое достижение · учебный пример'},
  {date:'20 сентября',type:'closed',title:'Рабочее замечание устранено после проверки',sub:'Закрыто · учебный пример'},
  {date:'12 августа',type:'good',title:'Благодарность за помощь команде',sub:'Подтверждено · учебный пример'}],hair:'#292125',skin:'#dd9c7f',jacket:'#1d3540',back:'#cad3d0',female:true},
 {id:'mikhail',name:'Михаил К.',role:'Продавец',since:'2026-07-01',thanks:3,remarks:2,development:'Обучение',skill:'Работа с возвратами',hint:'Нужно уточнить один эпизод',insight:'У Михаила есть три подтверждённые благодарности. Одно рабочее замечание ещё не проверено: прежде чем делать выводы, я предлагаю выслушать его объяснение и разобрать процесс возвратов.',next:['Проверить обстоятельства открытого замечания','Предложить практическое обучение возвратам'],events:[
  {date:'18 октября',type:'review',title:'Замечание по возврату требует проверки',sub:'Не подтверждено · запросить объяснение'},
  {date:'9 октября',type:'good',title:'Благодарность за помощь покупателю',sub:'Подтверждено · учебный пример'},
  {date:'14 сентября',type:'closed',title:'Замечание закрыто после уточнения',sub:'Закрыто · учебный пример'}],hair:'#2c2524',skin:'#c58e69',jacket:'#45505d',back:'#c4d0cb',female:false},
 {id:'elena',name:'Елена П.',role:'Администратор',since:'2022-10-05',thanks:9,remarks:0,development:'Развитие',skill:'Учёт товаров',hint:'Возможности профессионального роста',insight:'У Елены есть подтверждённый опыт в операционной работе и помощь коллегам. Я предлагаю обсудить её карьерные интересы и новые рабочие задачи, не делая выводов только по количеству благодарностей.',next:['Уточнить карьерные цели и интересы','Обсудить участие в улучшении учёта товаров'],events:[
  {date:'21 октября',type:'good',title:'Благодарность за улучшение учёта',sub:'Подтверждённое достижение · учебный пример'},
  {date:'4 сентября',type:'good',title:'Помогала разобраться со складскими остатками',sub:'Подтверждено · учебный пример'}],hair:'#483128',skin:'#deb08c',jacket:'#393b53',back:'#c4cbd7',female:true}
];
const photos=new Map();
const RECOGNITION_KEY='seyveo-peer-recognition-demo-v1';
const REVIEW_KEY='seyveo-recognition-review-demo-v1';
const badgeKind={help:['✦','Помощь коллеге'],mentor:['◇','Наставничество'],initiative:['✧','Инициатива'],reliable:['◆','Надёжность']};
const colleagues={tanya:'Таня',anna:'Анна',mikhail:'Михаил',elena:'Елена'};
function readRecords(key){try{const r=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(r)?r.slice(-100):[]}catch{return []}}
function peerRecognition(id){return readRecords(RECOGNITION_KEY).filter(x=>x&&x.to===id&&badgeKind[x.kind]&&typeof x.reason==='string').reverse()}
function savedReview(id){return readRecords(REVIEW_KEY).filter(x=>x&&x.personId===id).slice(-1)[0]||null}
function saveReview(personId,kind,note){
 if(!people.some(p=>p.id===personId)||!['bonus','discuss'].includes(kind)||note.trim().length<8)return false;
 const records=readRecords(REVIEW_KEY).concat({personId,kind,note:note.trim().slice(0,240),at:new Date().toISOString()}).slice(-100);
 try{localStorage.setItem(REVIEW_KEY,JSON.stringify(records));return true}catch{return false}
}
const style=document.createElement('style');
style.id='seyveo-staff-black-velvet';
style.textContent=[
'.svstaff-directory{margin:0 6px 14px;padding:8px 0 4px;color:var(--text)}',
'.svstaff-intro{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:5px 9px 12px}',
'.svstaff-intro strong{font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--text)}',
'.svstaff-intro small{font-size:10px;color:var(--secondary)}',
'.svstaff-tile{appearance:none;display:flex;gap:12px;align-items:center;width:100%;min-height:91px;padding:13px 10px;border:0;border-bottom:1px solid var(--soft-line);border-radius:0;background:transparent;color:var(--text);text-align:left;cursor:pointer;font:inherit}',
'.svstaff-tile:first-of-type{border-top:1px solid var(--soft-line)}',
'.svstaff-tile:hover,.svstaff-tile:focus-visible{background:rgba(58,140,98,.08);outline:0}',
'.svstaff-tile:focus-visible{box-shadow:inset 0 0 0 2px #74caa0;border-radius:12px}',
'.svstaff-thumb{width:55px;height:66px;border-radius:14px;object-fit:cover;object-position:center 15%;flex:none;background:#283830;border:1px solid rgba(255,255,255,.08)}',
'.svstaff-tile-copy{min-width:0;flex:1;display:grid;gap:4px}',
'.svstaff-tile-copy strong{font-size:14px;line-height:1.35;color:var(--text);font-weight:650}',
'.svstaff-tile-copy small{font-size:11px;color:var(--secondary);line-height:1.3}',
'.svstaff-tile-trend{font-size:11px;color:#66c998;line-height:1.4;white-space:normal}',
'.svstaff-tile-count{display:flex;gap:7px;align-items:center;color:var(--secondary);font-size:10px;white-space:nowrap}',
'.svstaff-tile-count b{color:var(--text);font-size:13px}',
'.svstaff-tile-count .svstaff-icon{display:inline-flex;width:15px;height:15px;color:#dbaf58}',
'.svstaff-tile-count .svstaff-icon svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
'.svstaff-tile-arrow{font-size:25px;color:#63b98b;align-self:center;line-height:1}',
'.svstaff-footnote{padding:12px 10px 2px;font-size:10px;color:var(--secondary);line-height:1.5;margin:0}',
'.svstaff-modal{width:min(520px,calc(100vw - 16px));max-width:none;max-height:min(92dvh,880px);margin:auto;padding:0;border:1px solid rgba(145,170,153,.21);border-radius:23px;background:#0c100f;color:#f4f6f4;box-shadow:0 20px 55px rgba(0,0,0,.4);overflow:auto;overscroll-behavior:contain;font-family:inherit}',
'.svstaff-modal::backdrop{background:rgba(0,0,0,.76)}',
'.svstaff-modal [hidden]{display:none!important}',
'.svstaff-modal *{box-sizing:border-box}',
'.svstaff-modal-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 16px;background:#0c100f;border-bottom:1px solid rgba(180,190,180,.12)}',
'.svstaff-modal-top span{font-size:11px;letter-spacing:.1em;color:#84cda4;font-weight:700}',
'.svstaff-close{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(171,191,179,.19);border-radius:50%;background:rgba(255,255,255,.04);color:#f0f4f1;font-size:21px;cursor:pointer}',
'.svstaff-content{padding:15px 19px max(20px,env(safe-area-inset-bottom))}',
'.svstaff-hero{display:flex;align-items:center;gap:17px;margin:0 0 21px}',
'.svstaff-photo{width:94px;height:111px;border-radius:20px;object-fit:cover;object-position:center 10%;background:#233328;flex:none;border:1px solid rgba(255,255,255,.09)}',
'.svstaff-hero-info{display:grid;gap:5px;min-width:0}',
'.svstaff-person-name{font-size:24px;letter-spacing:-.035em;font-weight:700;line-height:1.13;color:#f4f5f4}',
'.svstaff-person-role{font-size:14px;color:#c1c9c2;line-height:1.4}',
'.svstaff-tenure{font-size:12px;color:#99a69e;line-height:1.45}',
'.svstaff-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin:0 0 26px}',
'.svstaff-metric{text-align:center;min-width:0;display:grid;justify-items:center;align-content:start;gap:4px}',
'.svstaff-metric .svstaff-icon{display:inline-flex;height:27px;align-items:center;justify-content:center}',
'.svstaff-metric svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
'.svstaff-metric strong{font-size:24px;color:#f3f5f2;line-height:1.15;font-weight:720;letter-spacing:-.035em}',
'.svstaff-metric small{font-size:10px;line-height:1.4;color:#b2bdb6}',
'.svstaff-gold{color:#dbaf58}.svstaff-silver{color:#c8d0cb}.svstaff-green{color:#54dc8e}',
'.svstaff-section{margin:0 0 24px}',
'.svstaff-section h3{font-size:17px;line-height:1.3;font-weight:700;margin:0 0 14px;color:#f3f5f2}',
'.svstaff-event{display:flex;align-items:flex-start;gap:11px;margin:0 0 15px}',
'.svstaff-event-icon{width:19px;height:19px;flex:none;margin-top:1px}',
'.svstaff-event-icon svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}',
'.svstaff-event.good .svstaff-event-icon{color:#50d887}.svstaff-event.closed .svstaff-event-icon{color:#d0d8d2}.svstaff-event.review .svstaff-event-icon{color:#e9c077}',
'.svstaff-event-copy{display:grid;gap:3px;min-width:0}',
'.svstaff-event-copy strong{font-size:13px;line-height:1.4;font-weight:600;color:#e9eeea}',
'.svstaff-event-copy small{font-size:11px;color:#a9b7ae;line-height:1.4}',
'.svstaff-insight{border-top:1px solid rgba(205,218,209,.13);padding:18px 0 0;margin:0 0 18px}',
'.svstaff-insight-head{display:flex;align-items:center;gap:9px;margin:0 0 9px;color:#f3f5f2;font-size:16px;font-weight:700}',
'.svstaff-insight-head .svstaff-icon{color:#55e39a}',
'.svstaff-insight-head svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.8}',
'.svstaff-insight p{font-size:13px;color:#d9e1db;line-height:1.65;margin:0}',
'.svstaff-actions{display:flex;flex-wrap:wrap;gap:8px;padding:8px 0 12px}',
'.svstaff-action{padding:10px 14px;border-radius:999px;font-size:12px;min-height:41px;border:1px solid rgba(90,194,132,.49);background:rgba(38,97,66,.19);color:#e7f6eb;cursor:pointer;font:inherit}',
'.svstaff-action.secondary{border-color:rgba(185,197,187,.22);background:transparent;color:#b9c8bd}',
'.svstaff-plan{padding:12px 14px;border:1px solid rgba(84,190,128,.24);border-radius:16px;background:rgba(35,94,59,.13);font-size:12px;line-height:1.6;color:#d6e4da;margin-bottom:10px}',
'.svstaff-plan strong{display:block;margin-bottom:5px;color:#edf5ef;font-size:13px}',
'.svstaff-plan ol{padding-left:19px;margin:7px 0}',
'.svstaff-demo-note{padding:13px 0 2px;border-top:1px solid rgba(205,218,209,.12);font-size:10px;line-height:1.55;color:#9eaca3}',
'.svstaff-modal button:focus-visible{outline:2px solid #80dcb0;outline-offset:3px}',
'@media(max-width:365px){.svstaff-content{padding-inline:13px}.svstaff-hero{gap:12px}.svstaff-photo{width:78px;height:96px}.svstaff-person-name{font-size:21px}.svstaff-metric strong{font-size:22px}}',
'@media(prefers-reduced-motion:no-preference){.svstaff-modal[open]{animation:svstaffReveal .16s ease-out}@keyframes svstaffReveal{from{opacity:.65;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}}'
].join('\n');
document.head.append(style);
const iconPaths={
 star:'<path d="m12 2 3.1 6.3 7 1-5.1 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9L2 9.3l7-1z"/>',
 clipboard:'<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4h6v3H9zM9 13l2 2 4-4"/>',
 growth:'<path d="M3 17 9 11l4 4 8-9M15 6h6v6"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
 doc:'<path d="M7 2h8l4 4v16H7zM15 2v4h4M10 14l2 2 4-4"/>',
 warn:'<path d="M12 3 22 21H2zM12 9v5M12 18h.01"/>',
 spark:'<path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>'
};
const icon=(name,cls)=>{const sp=document.createElement('span');sp.className='svstaff-icon'+(cls?' '+cls:'');sp.setAttribute('aria-hidden','true');sp.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'+iconPaths[name]+'</svg>';return sp};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const button=(text,cls,fn)=>{const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n};
function portrait(p){
 const face=p.female?'<path d="M35 75Q26 58 32 36Q40 15 61 14Q86 16 91 39Q96 68 84 88L77 53H44z" fill="'+p.hair+'"/>':'<path d="M31 44Q28 15 60 13Q94 14 89 48Q84 27 64 30Q42 28 31 44z" fill="'+p.hair+'"/>';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="120" height="140" viewBox="0 0 120 140"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+p.back+'"/><stop offset="1" stop-color="#6c8583"/></linearGradient></defs><rect width="120" height="140" rx="13" fill="url(#b)"/><circle cx="94" cy="22" r="35" fill="#fff" opacity=".1"/><path d="M6 140Q13 104 39 98L54 88H67L81 98Q105 105 113 140" fill="'+p.jacket+'"/><path d="M48 94L60 114L72 94L67 87H54z" fill="#f2f1ec"/>'+face+'<ellipse cx="60" cy="57" rx="28" ry="35" fill="'+p.skin+'"/><path d="M34 42Q35 20 60 19Q85 18 88 44Q75 39 65 31Q51 43 34 42z" fill="'+p.hair+'"/><path d="M49 57h3M68 57h3" stroke="#41382f" stroke-width="2.6" stroke-linecap="round"/><path d="M56 72q5 4 10 0" stroke="#895d56" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M38 101L53 126L60 115L67 126L82 101" stroke="#fff" opacity=".32" fill="none" stroke-width="2"/></svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
const tenure=(since)=>{const start=new Date(since+'T12:00:00'),today=new Date();let y=today.getFullYear()-start.getFullYear(),m=today.getMonth()-start.getMonth();if(today.getDate()<start.getDate())m--;if(m<0){y--;m+=12}return y>0?(y+' г. '+m+' мес.'):m+' мес.'};
const photoFor=p=>photos.get(p.id)||portrait(p);
const shell=el('div','svstaff-directory');root.replaceChildren(shell);
const intro=el('div','svstaff-intro');intro.append(el('strong',null,'ЛЮДИ КОМПАНИИ'),el('small',null,'3 учебные карточки'));shell.append(intro);
const directory=el('div','svstaff-directory-list');shell.append(directory);
const note=el('p','svstaff-footnote','Учебные примеры: данные, истории и иллюстрированные портреты вымышлены. Настоящие кадровые данные пока не подключены.');shell.append(note);
const modal=el('dialog','svstaff-modal');modal.setAttribute('aria-label','Профессиональная история сотрудника');document.body.append(modal);
const top=el('div','svstaff-modal-top');top.append(el('span',null,'SEYVEO · КАДРЫ'),button('×','svstaff-close',()=>modal.close()));modal.append(top);
const body=el('div','svstaff-content');modal.append(body);
let chosen=null,showPlan=false,lastTrigger=null,leavingForChat=false;
function summaryStats(target,p){
 const metrics=el('div','svstaff-metrics');
 [['star','svstaff-gold',String(p.thanks),'Благодарностей'],['clipboard','svstaff-silver',String(p.remarks),p.remarks===1?'Замечание':'Замечаний'],['growth','svstaff-green',p.development,'Навыков']].forEach(([symbol,color,value,label])=>{
  const item=el('div','svstaff-metric');item.append(icon(symbol,color),el('strong',null,value),el('small',null,label));metrics.append(item);
 });
 target.append(metrics);
}
function renderDirectory(){
 directory.replaceChildren();
 people.forEach(p=>{
  const tile=button('','svstaff-tile',()=>openPerson(p,tile));
  tile.setAttribute('aria-label','Открыть профессиональную историю: '+p.name);
  const photo=el('img','svstaff-thumb');photo.src=photoFor(p);photo.alt='';photo.loading='lazy';
  const copy=el('span','svstaff-tile-copy');
  copy.append(el('strong',null,p.name),el('small',null,p.role+' · '+tenure(p.since)),el('span','svstaff-tile-trend','✦ Сэйви: '+p.hint));
  const count=el('span','svstaff-tile-count');count.append(icon('star','svstaff-gold'),el('b',null,String(p.thanks)));
  const arrow=el('span','svstaff-tile-arrow','›');arrow.setAttribute('aria-hidden','true');
  const newMarks=peerRecognition(p.id).length;
  if(newMarks)copy.append(el('span','svstaff-peer-preview','✦ Получено знаков: '+newMarks+' · демо'));
  tile.append(photo,copy,count,arrow);directory.append(tile);
 });
}
function openPerson(p,trigger){
 chosen=p;lastTrigger=trigger;showPlan=false;renderProfile();
 if(typeof modal.showModal==='function')modal.showModal();else modal.setAttribute('open','');
}
function renderProfile(){
 if(!chosen)return;const p=chosen;body.replaceChildren();
 const hero=el('section','svstaff-hero');const photo=el('img','svstaff-photo');photo.src=photoFor(p);photo.alt='Иллюстрированный портрет сотрудника '+p.name;
 const detail=el('div','svstaff-hero-info');detail.append(el('div','svstaff-person-name',p.name),el('div','svstaff-person-role',p.role),el('div','svstaff-tenure','В компании с '+new Date(p.since+'T12:00:00').toLocaleDateString('ru-RU',{month:'long',year:'numeric'})+' · '+tenure(p.since)));
 hero.append(photo,detail);body.append(hero);
 summaryStats(body,p);
 const history=el('section','svstaff-section');history.append(el('h3',null,'История работы'));
 p.events.forEach(item=>{
  const event=el('div','svstaff-event '+item.type);
  event.append(icon(item.type==='good'?'check':item.type==='closed'?'doc':'warn','svstaff-event-icon'));
  const copy=el('div','svstaff-event-copy');copy.append(el('strong',null,item.title),el('small',null,item.date+' · '+item.sub));event.append(copy);history.append(event);
 });
 body.append(history);
 const recognitions=peerRecognition(p.id);
 const badges=el('section','svstaff-peer-section');
 const title=el('div','svstaff-peer-head');
 title.append(el('h3',null,'✦ Знаки признания коллег'),el('span','svstaff-peer-count',String(recognitions.length)));
 badges.append(title);
 if(!recognitions.length)badges.append(el('p','svstaff-peer-empty','Пока нет новых знаков. Коллеги могут поблагодарить за помощь в рабочем чате.'));
 for(const record of recognitions.slice(0,12)){
  const entry=el('div','svstaff-peer-row'),description=el('div','svstaff-peer-copy');
  const day=new Date(record.at);
  const date=Number.isNaN(day.getTime())?'Дата не указана':day.toLocaleDateString('ru-RU');
  entry.append(el('span','svstaff-peer-symbol',badgeKind[record.kind][0]));
  description.append(el('strong',null,badgeKind[record.kind][1]),el('p',null,record.reason.slice(0,220)),
   el('small',null,'От: '+(colleagues[record.from]||'Коллега')+' · '+date+' · демо'));
  entry.append(description);badges.append(entry);
 }
 if(recognitions.length>12)badges.append(el('p','svstaff-peer-empty','Показаны последние 12 из '+recognitions.length+'.'));
 badges.append(el('p','svstaff-peer-disclaimer','Знаки — примеры конкретной помощи, а не рейтинг. Личности отправителей пока не подтверждены.'));
 body.append(badges);
 const review=el('section','svstaff-review');
 review.append(el('h3',null,'Решение руководителя'));
 const prior=savedReview(p.id);
 if(prior)review.append(el('p','svstaff-review-record',(prior.kind==='bonus'?'На рассмотрении: поощрение':'На рассмотрении: обсуждение')+' · '+prior.note));
 review.append(el('p','svstaff-review-note','Руководитель может предложить поощрение или обсудить рабочую ситуацию. Никакой автоматической премии или взыскания.'));
 const form=el('form','svstaff-review-form'),selector=el('select');
 selector.setAttribute('aria-label','Действие руководителя');
 for(const [key,label] of [['bonus','Рассмотреть поощрение'],['discuss','Обсудить развитие или обстоятельства']]){
  const opt=el('option',null,label);opt.value=key;selector.append(opt);
 }
 const note=el('textarea');note.rows=2;note.maxLength=240;note.minLength=8;note.required=true;
 note.placeholder='Укажите основание для рассмотрения…';note.setAttribute('aria-label','Основание решения руководителя');
 const feedback=el('p','svstaff-review-status');feedback.setAttribute('role','status');
 const submit=el('button','svstaff-review-submit','Сохранить для рассмотрения');submit.type='submit';
 form.append(selector,note,submit,feedback);
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!saveReview(p.id,selector.value,note.value)){feedback.textContent='Напишите конкретное основание (минимум 8 символов).';return}
  renderProfile();
 });
 review.append(form);body.append(review);
 const insight=el('section','svstaff-insight');const head=el('div','svstaff-insight-head');head.append(icon('spark'),el('span',null,'Сэйви · Анализ ситуации'));
 insight.append(head,el('p',null,p.insight));body.append(insight);
 const actions=el('div','svstaff-actions');
 actions.append(button('Написать лично','svstaff-action',()=>{
  // The demo chat uses the employee's stable internal ID, never a display-name match.
  // Close the employee card before opening its existing Business chat surface.
  const personId=p.id;
  leavingForChat=true;
  modal.close();
  window.SEYVEO_BUSINESS_COMMAND?.openPrivateChat?.(personId);
 }));
 actions.append(button(showPlan?'Скрыть план':'План развития','svstaff-action',()=>{showPlan=!showPlan;renderProfile()}));
 const inp=el('input');inp.type='file';inp.accept='image/*';inp.hidden=true;inp.setAttribute('aria-label','Загрузить фото для просмотра');inp.addEventListener('change',()=>{
  const file=inp.files&&inp.files[0];if(!file)return;
  if(!file.type.startsWith('image/')||file.size>5*1024*1024){alert('Выберите изображение размером до 5 МБ.');return}
  const existing=photos.get(p.id);if(existing&&existing.startsWith('blob:'))URL.revokeObjectURL(existing);
  photos.set(p.id,URL.createObjectURL(file));renderDirectory();renderProfile();
 });
 actions.append(button('Добавить фото','svstaff-action secondary',()=>inp.click()),inp);body.append(actions);
 if(showPlan){const plan=el('section','svstaff-plan');plan.append(el('strong',null,'Предлагаемые шаги · учебный пример'));
 const list=el('ol');p.next.forEach(x=>list.append(el('li',null,x)));plan.append(list,el('p',null,'Согласовать с самим сотрудником. Решение принимает руководитель, без автоматической оценки или наказания.'));body.append(plan)}
 body.append(el('p','svstaff-demo-note','Это демонстрационная карточка вымышленного сотрудника. Фото можно выбрать только для просмотра на этом устройстве — оно не загружается в сеть и не сохраняется. Рабочие замечания требуют проверки, права на ответ и исправление. Настоящий анализ Сэйви пока не подключён.'));
}
modal.addEventListener('close',()=>{chosen=null;showPlan=false;if(!leavingForChat)lastTrigger?.focus?.();leavingForChat=false});
modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
window.addEventListener('pagehide',()=>{photos.forEach(u=>{if(u.startsWith('blob:'))URL.revokeObjectURL(u)})});
window.SEYVEO_STAFF_CARDS=Object.freeze({open:personId=>{
 const person=people.find(p=>p.id===personId);
 if(!person)return false;
 if(location.hash!=='#manage')location.hash='#manage';
 document.querySelector('[data-clean-business="people"]')?.click();
 openPerson(person,null);
 return true;
}});
window.addEventListener('seyveo:recognition-changed',()=>{
 renderDirectory();
 if(modal.open&&chosen)renderProfile();
});
window.addEventListener('storage',event=>{
 if(event.key!==RECOGNITION_KEY&&event.key!==REVIEW_KEY)return;
 renderDirectory();
 if(modal.open&&chosen)renderProfile();
});
renderDirectory();
})();