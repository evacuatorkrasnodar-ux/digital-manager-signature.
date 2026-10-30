/* SEYVEO · learning laboratory. Developer-only local preview.
 * Does not record conversations automatically or train model weights.
 */
(()=>{
'use strict';
const dev=new URLSearchParams(location.search).get('seyveo_dev')==='1';
if(!dev||!['127.0.0.1','localhost'].includes(location.hostname))return;
const style=document.createElement('style');
style.textContent=[
 '.slab-open{position:fixed;right:12px;top:max(12px,env(safe-area-inset-top));z-index:8100;padding:9px 14px;border:1px solid #5fa78b88;border-radius:25px;background:#10251edc;color:#c6f5de;font:600 12px system-ui;backdrop-filter:blur(16px)}',
 '.slab{color:#e6f6ee;background:linear-gradient(145deg,#0b1c17,#10231d 58%,#081410);border:1px solid #5aab8799;border-radius:24px;box-shadow:0 20px 70px #0009;box-sizing:border-box;width:min(95vw,610px);max-height:min(86dvh,770px);padding:0;overflow:hidden}',
 '.slab::backdrop{background:#000b;backdrop-filter:blur(8px)}',
 '.slab *{box-sizing:border-box}.slab-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #b9e4cb25}',
 '.slab-title{font:600 17px system-ui;letter-spacing:.04em}.slab-sub{font:12px system-ui;color:#a7c6b5;margin-top:4px}',
 '.slab-close{color:#d7eadc;background:transparent;border:0;font:23px system-ui;padding:3px 8px}',
 '.slab-body{padding:18px 20px 28px;overflow:auto;max-height:calc(min(86dvh,770px) - 80px);font:14px/1.45 system-ui}',
 '.slab-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:0 0 18px}',
 '.slab-stat{background:#c1efd10a;border:1px solid #b2e1c522;border-radius:14px;padding:11px 8px;min-width:0;text-align:center}',
 '.slab-stat strong{display:block;font-size:22px;color:#a0efd0}.slab-stat small{display:block;font-size:11px;color:#9cbaa9}',
 '.slab h3{font:600 15px system-ui;margin:18px 0 8px}.slab p{margin:7px 0 12px;color:#b0cabc;font-size:12px}',
 '.slab input:not([type=checkbox]),.slab textarea{width:100%;background:#06130fbf;border:1px solid #a1d9b645;border-radius:12px;color:#f0fff5;font:14px system-ui;padding:11px 12px;margin:4px 0 9px}',
 '.slab textarea{min-height:74px;resize:vertical}.slab button{cursor:pointer}.slab-btn{border:1px solid #74c8a277;border-radius:15px;background:#24533d;color:#eefcf4;padding:9px 13px;font:600 12px system-ui}',
 '.slab-btn.ghost{background:transparent;color:#bdd9c7}.slab-row{display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap}',
 '.slab-entry{border-bottom:1px solid #b3dac622;padding:10px 0}.slab-entry strong{font-weight:600;overflow-wrap:anywhere}.slab-entry p{white-space:pre-wrap;overflow-wrap:anywhere;margin:5px 0}',
 '.slab-actions{display:flex;gap:7px;flex-wrap:wrap}.slab-error{color:#f7bdad!important}.slab-ok{color:#8eecbf!important}',
 '.slab-consent{display:flex;gap:9px;align-items:flex-start;color:#c9dcd0;font:12px/1.45 system-ui;margin:5px 0 12px}',
 '@media(max-width:450px){.slab-body{padding:12px 14px 25px}.slab-head{padding:13px 15px}.slab-stats{gap:4px}.slab-stat strong{font-size:19px}}'
].join('');
document.head.append(style);
const open=document.createElement('button');
open.type='button';open.className='slab-open';open.textContent='✦ Обучение · DEV';
open.setAttribute('aria-label','Открыть лабораторию обучения SEYVEO');
const dialog=document.createElement('dialog');
dialog.className='slab';dialog.setAttribute('aria-label','SEYVEO · лаборатория обучения');
dialog.innerHTML=[
 '<div class="slab-head"><div><div class="slab-title">✦ SEYVEO · LEARNING ENGINE</div>',
 '<div class="slab-sub">Лаборатория разработчика · только этот компьютер</div></div>',
 '<button class="slab-close" type="button" aria-label="Закрыть">×</button></div>',
 '<div class="slab-body">',
 '<div class="slab-stats"><div class="slab-stat"><strong id="slab-private-count">–</strong><small>Личная память</small></div>',
 '<div class="slab-stat"><strong id="slab-approved-count">–</strong><small>Одобрено локально</small></div>',
 '<div class="slab-stat"><strong id="slab-pending-count">–</strong><small>На проверке</small></div></div>',
 '<h3>Для одного человека</h3>',
 '<p>Сэйви использует подтверждённые заметки только в твоём локальном диалоге. Ничего не записывается автоматически.</p>',
 '<form id="slab-private-form"><input id="slab-note" maxlength="180" required placeholder="Например: отвечай коротко и по делу" aria-label="Что запомнить" />',
 '<button class="slab-btn" type="submit">Запомнить после подтверждения</button></form>',
 '<div id="slab-memories"></div>',
 '<h3>Для всех · будущая общая Сэйви</h3>',
 '<p>Здесь мы готовим проверенные учебные примеры. Пока они действуют только в локальном SEYVEO на этом ПК. Никакой отправки другим людям и обучения весов модели нет.</p>',
 '<form id="slab-shared-form"><input id="slab-question" maxlength="600" required placeholder="Вымышленный пример вопроса" aria-label="Учебный вопрос" />',
 '<textarea id="slab-answer" maxlength="1800" required placeholder="Как Сэйви должна правильно ответить" aria-label="Эталонный ответ"></textarea>',
 '<label class="slab-consent"><input id="slab-consent" type="checkbox" required />Я подтверждаю: пример вымышленный, без личных данных, и разрешаю сохранить его для проверки.</label>',
 '<button class="slab-btn" type="submit">Отправить на проверку</button></form>',
 '<div class="slab-row"><h3>Очередь обучения</h3><button id="slab-reload" class="slab-btn ghost" type="button">Обновить</button></div>',
 '<div id="slab-proposals"></div><p id="slab-notice" role="status" aria-live="polite"></p>',
 '</div>'
].join('');
const $=id=>dialog.querySelector('#'+id);
dialog.querySelector('.slab-close').addEventListener('click',()=>dialog.close());
const note=$('slab-notice');
function message(value,bad=false){note.textContent=value;note.className=bad?'slab-error':'slab-ok';}
async function json(path,body){
 const response=await fetch(path,body===undefined?{credentials:'same-origin'}:{
  method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(body)
 });
 const data=await response.json();
 if(!response.ok)throw Error(data.error||'Не удалось выполнить действие.');
 return data;
}
function smallButton(label,handler){
 const button=document.createElement('button');button.type='button';button.className='slab-btn ghost';
 button.textContent=label;button.addEventListener('click',handler);return button;
}
async function refresh(){
 const [dashboard,memory]=await Promise.all([
  json('/api/seyveo-learning-dashboard'),json('/api/seyveo-memory')
 ]);
 $('slab-private-count').textContent=String(dashboard.privateCount);
 $('slab-approved-count').textContent=String(dashboard.approvedCount);
 $('slab-pending-count').textContent=String(dashboard.pendingCount);
 const memories=$('slab-memories');memories.replaceChildren();
 if(!memory.items.length){const p=document.createElement('p');p.textContent='Пока нет сохранённых предпочтений.';memories.append(p)}
 for(const item of memory.items){
  const row=document.createElement('div');row.className='slab-entry slab-row';
  const txt=document.createElement('span');txt.textContent=item.text;row.append(txt);
  row.append(smallButton('Удалить',async()=>{
   if(!confirm('Удалить эту личную заметку?'))return;
   try{await json('/api/seyveo-memory',{action:'remove',id:item.id});await refresh();message('Личная заметка удалена.')}
   catch(e){message(e.message,true)}
  }));memories.append(row);
 }
 const proposals=$('slab-proposals');proposals.replaceChildren();
 if(!dashboard.proposals.length){const p=document.createElement('p');p.textContent='Учебных примеров пока нет.';proposals.append(p)}
 for(const item of dashboard.proposals){
  const row=document.createElement('section');row.className='slab-entry';
  const title=document.createElement('strong');title.textContent=item.question;row.append(title);
  const answer=document.createElement('p');answer.textContent=item.answer;row.append(answer);
  const status=document.createElement('p');
  status.textContent=item.status==='pending'?'Ожидает решения':item.status==='approved'?'Одобрен локально':'Отклонён';
  row.append(status);
  const actions=document.createElement('div');actions.className='slab-actions';
  const change=action=>async()=>{
   const prompt=action==='approve'?'Одобрить пример для локальной библиотеки?':action==='reject'?'Отклонить этот пример?':'Удалить эту запись?';
   if(!confirm(prompt))return;
   try{await json('/api/seyveo-learning-proposal',{action,id:item.id});await refresh();message('Статус примера обновлён.')}
   catch(e){message(e.message,true)}
  };
  if(item.status==='pending'){actions.append(smallButton('Одобрить',change('approve')),smallButton('Отклонить',change('reject')))}
  actions.append(smallButton('Удалить',change('delete')));
  row.append(actions);proposals.append(row);
 }
}
open.addEventListener('click',async()=>{
 dialog.showModal();message('');try{await refresh()}catch(e){message(e.message,true)}
});
$('slab-reload').addEventListener('click',async()=>{try{await refresh();message('Обновлено.')}catch(e){message(e.message,true)}});
$('slab-private-form').addEventListener('submit',async event=>{
 event.preventDefault();const value=$('slab-note').value.trim();
 if(!confirm('Сохранить эту заметку только на данном компьютере?\n\n'+value))return;
 try{await json('/api/seyveo-memory',{action:'add',text:value});$('slab-note').value='';await refresh();message('Личная память обновлена.')}
 catch(e){message(e.message,true)}
});
$('slab-shared-form').addEventListener('submit',async event=>{
 event.preventDefault();
 const question=$('slab-question').value.trim(),answer=$('slab-answer').value.trim();
 if(!confirm('Добавить обезличенный учебный пример в локальную очередь для ручной проверки?'))return;
 try{
  await json('/api/seyveo-learning-proposal',{action:'propose',question,answer,confirmed:$('slab-consent').checked});
  $('slab-question').value='';$('slab-answer').value='';$('slab-consent').checked=false;
  await refresh();message('Пример ожидает ручного одобрения.');
 }catch(e){message(e.message,true)}
});
document.body.append(open,dialog);
})();
