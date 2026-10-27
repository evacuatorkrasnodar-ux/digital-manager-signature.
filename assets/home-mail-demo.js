/* SEYVEO · reusable Home decisions, first live demo: an incoming business letter.
 * Render into the EXISTING dynamic/decision-card Living Ink component.
 * The helper owns only fictional, in-memory data: no inbox account, CRM,
 * localStorage, sessionStorage for letters, network, email delivery or AI.
 * Future template kinds reuse the approved surface without new card designs.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const home=$('homePage'),dynamic=$('dynamic'),tasks=$('tasksPage');
if(!home||!dynamic||!tasks)return;
const TYPES=Object.freeze({
 mail:Object.freeze({name:'Письмо',icon:'mail',actions:['Отправить','Исправить','Подробнее','Позже']}),
 task:Object.freeze({name:'Дело',icon:'task',actions:['Исполнить','Подробнее','Позже']}),
 document:Object.freeze({name:'Документ',icon:'contract',actions:['Проверить','Подробнее','Позже']}),
 client:Object.freeze({name:'Клиент',icon:'mail',actions:['Ответить','Подробнее','Позже']}),
 reminder:Object.freeze({name:'Напоминание',icon:'task',actions:['Готово','Подробнее','Позже']})
});
const SEED=Object.freeze({
 kind:'mail',id:'DEMO-MAIL-ANDREY',person:'Андрей',source:'Рабочая почта · учебный пример',
 sender:'Андрей · адрес отправителя отсутствует',subject:'Стоимость доставки',
 incoming:'Здравствуйте! Подскажите, сколько будет стоить доставка?',
 to:'Андрей · учебный адрес не подключён',
 draft:'Здравствуйте, Андрей! Спасибо за обращение. Уточните, пожалуйста, адрес доставки, чтобы мы могли рассчитать стоимость.'
});
let draft=SEED.draft,phase='inbox',note='';
const enabled=()=>window.SEYVEO_DEMO_MODE?.isEnabled?.()===true;
const visible=()=>enabled()&&phase!=='later';
function make(tag,klass,value){
 const node=document.createElement(tag);
 if(klass)node.className=klass;
 if(value!==undefined)node.textContent=value;
 return node;
}
function action(label,kind,callback){
 const button=make('button','btn'+(kind==='send'?' primary':''),label);
 button.type='button';button.dataset.mailAction=kind;
 button.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();callback();
 });
 return button;
}
function changed(){syncLater();window.dispatchEvent(new Event('seyveo:home-demo-updated'))}
function setPhase(p){phase=p;note='';changed()}
function reset(){draft=SEED.draft;phase='inbox';note='';changed()}
function syncLater(){
 const holder=$('seyveoDemoMailLater');
 if(!holder)return;
 holder.hidden=!(enabled()&&phase==='later');
}
function renderInto(root){
 if(!visible())return false;
 const card=make('article','decision-card sv-home-mail-card');
 card.dataset.ownerAdvice='true';
 card.dataset.demoMail='true';
 card.setAttribute('aria-label','Сэйви · учебное письмо Андрея');
 const main=make('div','card-main');
 const copy=make('div','event-copy');
 copy.append(make('strong','',phase==='done'?'Учебный ответ проверен':'Важное письмо · Андрей'),
  make('small','','Сэйви · Письмо · ДЕМО'));
 main.append(copy);card.append(main);
 if(phase==='done'){
  card.append(make('p','card-tag','Учебный шаг завершён. Настоящего отправления и подтверждения доставки нет.'));
 }else{
  card.append(make('p','card-tag','Андрей спрашивает о стоимости доставки. Я подготовила ответ:'));
  card.append(make('p','sv-home-mail-draft',draft));
 }
 if(phase==='confirm'){
  const check=make('section','sv-home-mail-check');
  check.setAttribute('aria-label','Проверка получателя и текста');
  check.append(make('strong','', 'Перед отправкой · проверка'),
   make('small','', 'Кому: '+SEED.to),
   make('small','', 'Тема: '+SEED.subject),
   make('p','',draft),
   make('small','', 'ДЕМО: адрес не подключён. Сообщение не может быть отправлено.'));
  card.append(check);
 }
 if(phase==='edit'){
  const form=make('div','sv-home-mail-edit');
  const label=make('label','','Исправить черновик · только демо');
  const input=make('textarea','',draft);
  input.value=draft;input.rows=4;input.maxLength=1200;
  input.id='svHomeMailEditor';label.htmlFor=input.id;
  form.append(label,input);
  card.append(form);
  const buttons=make('div','actions');
  buttons.append(action('Сохранить текст','save',()=>{
   const value=input.value.trim();
   if(!value){note='Введите текст ответа, чтобы сохранить черновик.';const msg=card.querySelector('.sv-home-mail-status');if(msg)msg.textContent=note;return}
   draft=value.slice(0,1200);setPhase('inbox');
  }),action('Отмена','cancel',()=>setPhase('inbox')));
  card.append(buttons);
 }else{
  const buttons=make('div','actions');
  if(phase==='inbox'){
   buttons.append(action('Отправить','send',()=>setPhase('confirm')),
    action('Исправить','edit',()=>setPhase('edit')),
    action('Подробнее','details',openDetails),
    action('Позже','later',()=>setPhase('later')));
  }else if(phase==='confirm'){
   buttons.append(action('Подтвердить в демо','confirm',()=>setPhase('done')),
    action('Исправить','edit',()=>setPhase('edit')),
    action('Отмена','cancel',()=>setPhase('inbox')));
  }else{
   buttons.append(action('Повторить пример','reset',reset),
    action('Подробнее','details',openDetails),
    action('Позже','later',()=>setPhase('later')));
  }
  card.append(buttons);
 }
 const msg=make('p','sv-home-mail-status',note||(
  phase==='done'?'Никому не отправлено · внешняя почта не подключена.':
  'Учебное письмо. Отправка, изменение клиентских данных и фактическая доставка отсутствуют.'
 ));
 msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');
 card.append(msg);
 root.replaceChildren(card);
 return true;
}
function openDetails(){
 if(!enabled())return;
 const api=window.SEYVEO_SAYVI_SURFACES;
 if(api?.open)api.open('mail');
 else location.hash='#sayvi-mail';
}
function mountLater(){
 const section=make('section','sv-home-mail-later');
 section.id='seyveoDemoMailLater';
 section.hidden=true;
 section.setAttribute('aria-label','Отложенное учебное письмо');
 section.append(make('small','', 'ДЕМО · ОТЛОЖЕННОЕ ПИСЬМО'),
  make('strong','', 'Андрей · стоимость доставки'),
  make('p','', 'Сэйви сохранила пример в учебной очереди «Позже». В личные дела ничего не записано.'));
 const row=make('div','actions');
 row.append(action('Вернуть на Главную','restore',()=>{
  phase='inbox';note='';changed();$('navHome')?.click();
 }),action('Открыть письмо','details',openDetails));
 section.append(row);
 const personal=tasks.querySelector('.personal-tasks-panel');
 if(personal)tasks.insertBefore(section,personal);
 else tasks.append(section);
 syncLater();
}
function detail(root){
 if(!enabled())return false;
 const section=make('section','sv-home-mail-original');
 section.append(make('small','', 'ДЕМО · ИСХОДНОЕ ПИСЬМО'),
  make('h2','',SEED.subject),
  make('p','', 'От: '+SEED.sender),
  make('p','', 'Источник: '+SEED.source),
  make('blockquote','',SEED.incoming),
  make('strong','', 'Черновик ответа · не отправлен'),
  make('p','',draft));
 if(phase==='done')section.append(make('p','', 'Результат тренировки: подтвердили пример. Реальной отправки или доставки не было.'));
 const controls=make('div','actions');
 controls.append(action('На Главную','home',()=>$('navHome')?.click()),
  action('Исправить на Главной','edit',()=>{
   phase='edit';note='';changed();$('navHome')?.click();
  }));
 section.append(controls);
 root.append(section);
 return true;
}
window.addEventListener('seyveo:demo-mode-reset',()=>{draft=SEED.draft;phase='inbox';note='';syncLater()});
window.addEventListener('seyveo:demo-mode-changed',()=>{syncLater()});
window.SEYVEO_HOME_MAIL_DEMO=Object.freeze({
 kinds:TYPES,isVisible:visible,renderInto,renderDetail:detail,
 state:()=>Object.freeze({phase,draft,enabled:enabled()}),
 restore:()=>{phase='inbox';changed();}
});
mountLater();
})();
