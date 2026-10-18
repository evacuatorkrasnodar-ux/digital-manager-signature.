/* SEYVEO · Intent Navigation v1
 * Small explicit navigation grammar: local, safe, no LLM, network or writes.
 * Uses existing sections and their actual event listeners only.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const labels=Object.freeze({
 home:'Главная',tasks:'Дела',picture:'Картина',manage:'Управление',
 life:'Личное пространство',calendar:'Календарь',notes:'Блокнот',
 health:'Здоровье',care:'Забота',world:'Мой мир',help:'Первая помощь'
});
const aliases=[
 ['home',/^(?:главн(?:ая|ую|ой|ое)|домой|домашн(?:ий экран|юю страницу)|начальн(?:ый|ую) экран)$/],
 ['calendar',/^(?:календар(?:ь|я|е|ю)|расписани(?:е|я|ю)|планы на день)$/],
 ['notes',/^(?:блокнот(?:а|е)?|записк(?:и|ах|ам)|заметк(?:и|ах|у)|мои записи|моих запис(?:ях|ей))$/],
 ['tasks',/^(?:дела|мо[ьи] дел(?:а|ах)|задач(?:и|ах|у)|поручени(?:я|ях)|список задач|список дел)$/],
 ['picture',/^(?:картин(?:а|у|ы)|мо[яю] картин(?:а|у|ы)|показател(?:и|ей) бизнеса|бизнес показатели|статистик(?:а|у) бизнеса|аналитик(?:а|у))$/],
 ['manage',/^(?:управлени(?:е|я|ю)|настройк(?:и|ах|у)|настройки приложения|настройки помощника)$/],
 ['life',/^(?:личн(?:ое|ого|ом) пространств(?:о|а|е)|личны(?:е|х) раздел(?:ы|ах)|мой мир|моего мира|моем мире)$/],
 ['health',/^(?:здоровь(?:е|я)|показател(?:и|ей) здоровья|давлени(?:е|я)|пульс|шаги)$/],
 ['care',/^(?:забот(?:а|у|е|ы)|заботу о себе)$/],
 ['world',/^(?:контакт(?:ы|ах)|люд(?:и|ей)|мои контакты|мои люди)$/],
 ['help',/^(?:перв(?:ая|ую) помощ(?:ь|и)|инструкци(?:я|ю)|обучени(?:е|я)|как пользоваться приложением)$/]
];
function toolFor(target){
 for(const [tool,re] of aliases)if(re.test(target))return tool;
 return null;
}
function understand(input){
 if(typeof input!=='string'||input.length>180||/[\n\r;]/.test(input))return null;
 let q=input.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').trim();
 q=q.replace(/^(?:(?:сейвео|севео|сейво|seyveo)[\s,!:.]+)?(?:пожалуйста[,\s]+)?/i,'').trim();
 q=q.replace(/[\s.!?]+$/g,'').replace(/\s+/g,' ');
 q=q.replace(/\s+пожалуйста$/,'').trim();
 // The request must consist of a navigation verb and ONE known destination.
 // Questions, long utterances and real-world actions pass to existing parsers.
 const command=q.match(/^(?:открой(?:те)?|открыть|покажи(?:те)?|показать|перейди(?:те)?|перейти|зайди(?:те)?|зайти|найди(?:те)?|найти|где (?:находится|найти)|как открыть|как попасть в|хочу посмотреть|мне (?:нужен|нужна|нужно)|проведи (?:меня )?в)\s+(.+)$/);
 if(!command)return null;
 let target=command[1].trim();
 let tool=toolFor(target);
 if(!tool){
  target=target.replace(/^(?:мне|на|в|во|раздел|страницу|вкладку)\s+/,'').trim();
  tool=toolFor(target);
 }
 if(!tool)return null;
 return Object.freeze({kind:'navigate',tool,label:labels[tool]});
}
let hideTimer=0;
function notice(message){
 let element=$('seyveoNavNotice');
 if(!element){
  element=document.createElement('div');
  element.id='seyveoNavNotice';
  element.className='seyveo-nav-notice';
  element.setAttribute('role','status');
  element.setAttribute('aria-live','polite');
  element.hidden=true;
  document.body.append(element);
 }
 element.textContent=message;
 element.hidden=false;
 clearTimeout(hideTimer);
 hideTimer=setTimeout(()=>{element.hidden=true},3400);
}
function execute(plan){
 if(!plan||plan.kind!=='navigate'||!labels[plan.tool])return null;
 if(document.querySelector('dialog[open]')){
  const message='Сначала закройте открытое окно. Затем покажу нужный раздел.';
  notice(message);return {ok:false,message};
 }
 // Close the EXISTING composer, whose close handler persists any unfinished
 // draft. This also releases the iPhone keyboard before changing screens.
 if($('ask')&&!$('ask').hidden){
  $('hideInput')?.click();
 }
 let succeeded=false;
 const space=key=>document.querySelector('#calendarSpaces [data-calendar-space="'+key+'"]');
 switch(plan.tool){
  case 'home':$('navHome')?.click();succeeded=!!$('navHome');break;
  case 'tasks':$('navTasks')?.click();succeeded=!!$('navTasks');break;
  case 'picture':$('navPicture')?.click();succeeded=!!$('navPicture');break;
  case 'manage':$('navManage')?.click();succeeded=!!$('navManage');break;
  case 'life':location.hash='life';succeeded=true;break;
  case 'calendar':case 'notes':case 'health':case 'care':case 'world':{
   const button=space(plan.tool);
   if(button){button.click();succeeded=true}
   break;
  }
  case 'help':
   if(typeof window.SEYVEO_FIRST_HELP?.start==='function'){
    window.SEYVEO_FIRST_HELP.start();
    succeeded=window.SEYVEO_FIRST_HELP.isActive();
   }
   break;
 }
 const message=succeeded?(plan.tool==='help'?'Показываю знакомство с SEYVEO.':
  'Открываю «'+plan.label+'».'):'Не удалось открыть «'+plan.label+'». Попробуйте ещё раз.';
 notice(message);
 return {ok:succeeded,message,tool:plan.tool};
}
window.SEYVEO_INTENT_NAV=Object.freeze({understand,execute});
})();
