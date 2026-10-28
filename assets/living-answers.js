/* SEYVEO Living Answers v2 — living source lens without browser chrome.
 * One existing Sayvi sphere, one question box, three source-attributed scenes.
 * Replace knowledge adapter when trusted AI/search is connected later. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const page=$('sayviAnswerPage'),body=$('sayviAnswerBody'),back=$('sayviAnswerBack');
if(!page||!body||!back)return;
const scenarios=Object.freeze({
 roadster:{
  label:'ТЕХНОЛОГИИ · АВТОМОБИЛИ',
  title:'Roadster: правда ли он летает?',
  opener:'О, здесь самое интересное — отличить красивое обещание от подтверждённого полёта.',
  summary:'Tesla показала прототип нового Roadster в 2017 году. На сайте производителя описана версия Rocket с системой тяги для полёта. Это заявление о возможности комплектации, а не подтверждение, что летающий Roadster уже продаётся и летает у покупателей.',
  image:'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Tesla_roadster_2020_prototype.jpg/960px-Tesla_roadster_2020_prototype.jpg',
  imageAlt:'Реальный прототип Tesla Roadster, показанный на презентации в 2017 году',
  credit:'Фото: Smnt, CC BY-SA 4.0 · Wikimedia Commons',
  creditUrl:'https://commons.wikimedia.org/wiki/File:Tesla_roadster_2020_prototype.jpg',
  sourceUrl:'https://www.tesla.com/roadster',
  sourceName:'Tesla · официальный Roadster',
  facts:[['2017','Показ прототипа'],['Rocket','Заявленная лётная версия'],['Важно','Не путать с серийной продажей']],
  questions:[
   {id:'flight',label:'А правда летает?',title:'Заявление — ещё не испытание',answer:'Официальная страница Tesla описывает Rocket с двигателями холодного газа и утверждает, что он способен летать. При этом описание производителя само по себе не подтверждает независимые испытания или доступность серийной летающей машины. Проверять новости о запуске нужно отдельно.'},
   {id:'specs',label:'Что в нём необычного?',title:'Спорткар на границе с аэрокосмосом',answer:'Tesla рассказывает об активной аэродинамике, системе вентиляторов для прижимной силы, лёгких материалах и, для некоторых версий, газовых двигателях тяги. Конкретные характеристики и доступность зависят от исполнения; опубликованные значения — заявления производителя.'},
   {id:'price',label:'Сколько стоит?',title:'Цена зависит от реального предложения',answer:'На странице Tesla доступны сведения о бронировании и комплектациях, но я не буду выдавать старую цену брони за актуальную стоимость автомобиля. Когда подключим поиск, Сэйви будет получать действующую цену из проверенного источника и показывать дату обновления.'},
   {id:'inside',label:'А что внутри?',title:'Интерьер — часть проекта',answer:'Проект Roadster предполагает спортивную посадку и минималистичные органы управления. Я могу показать проверенные официальные изображения салона после подключения поиска медиа; здесь не буду выдавать вымышленный рендер за фотографию.'}
  ]
 },
 moon:{
  label:'КОСМОС · ИСТОРИЯ',
  title:'Как люди впервые добрались до Луны?',
  opener:'Представь: огромная ракета подняла троих людей, а двое из них потом шагнули на поверхность другого мира.',
  summary:'16 июля 1969 года ракета Saturn V запустила миссию Apollo 11. 20 июля лунный модуль сел на Луну. Нил Армстронг и Базз Олдрин вышли на поверхность, Майкл Коллинз оставался на орбите.',
  image:'https://planetary.s3.amazonaws.com/web/assets/pictures/20170216_apollo-11-liftoff.jpg',
  imageAlt:'Историческая фотография запуска ракеты Saturn V миссии Apollo 11',
  credit:'Фото: NASA, архивный снимок запуска Apollo 11',
  creditUrl:'https://www.planetary.org/space-images/apollo-11',
  sourceUrl:'https://www.nasa.gov/mission/apollo-11/',
  sourceName:'NASA · миссия Apollo 11',
  facts:[['16 июля','Запуск · 1969'],['20 июля','Высадка на Луну'],['3 человека','Экипаж Apollo 11']],
  questions:[
   {id:'flight',label:'Как летела ракета?',title:'Три ступени — одна большая цель',answer:'Saturn V запускалась с Земли в три этапа: ступени последовательно давали ускорение. Затем корабль направился к Луне, вышел на лунную орбиту, а посадочный модуль отделился для спуска. Фотография выше показывает настоящий старт.'},
   {id:'who',label:'Кто был на Луне?',title:'Трое отправились, двое высадились',answer:'Нил Армстронг и Эдвин «Базз» Олдрин работали на лунной поверхности. Майкл Коллинз пилотировал командный модуль на орбите, ожидая их возвращения.'},
   {id:'why',label:'Почему это было сложно?',title:'Нужно было не только долететь',answer:'Главные сложности — точное управление полётом, связь на огромном расстоянии, мягкая посадка без атмосферы и безопасное возвращение людей на Землю.'}
  ]
 },
 heart:{
  label:'НАУКА · ЧЕЛОВЕК',
  title:'Как работает человеческое сердце?',
  opener:'Давай заглянем внутрь. Сердце не просто бьётся — оно постоянно направляет кровь по двум кругам.',
  summary:'Сердце — мышечный насос с четырьмя камерами. Правая половина направляет кровь к лёгким, левая — по всему телу. Клапаны помогают крови двигаться в правильном направлении.',
  image:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Diagram_of_the_human_heart_%28multilingual%29.svg/921px-Diagram_of_the_human_heart_%28multilingual%29.svg.png',
  imageAlt:'Схема строения человеческого сердца с отмеченными камерами и сосудами',
  credit:'Схема: MesserWoland (по Yaddah), CC BY-SA 3.0 · Wikimedia Commons',
  creditUrl:'https://commons.wikimedia.org/wiki/File:Diagram_of_the_human_heart_(multilingual).svg',
  sourceUrl:'https://www.nhlbi.nih.gov/health/heart/anatomy',
  sourceName:'NIH · строение сердца',
  facts:[['4','Камеры сердца'],['2','Круга кровообращения'],['Клапаны','Помогают движению крови']],
  questions:[
   {id:'flow',label:'Покажи путь крови',title:'Два круга кровообращения',answer:'Кровь из тела попадает в правую половину сердца, затем направляется в лёгкие за кислородом. Из лёгких возвращается в левую половину, которая отправляет её по всему организму.'},
   {id:'pulse',label:'Почему есть пульс?',title:'Пульс — волна давления',answer:'Когда сердце сокращается, по артериям проходит волна давления. Её можно почувствовать на запястье или шее. Частота зависит от активности и множества факторов.'},
   {id:'measure',label:'А мой пульс?',title:'Заглянем в ваши записи',answer:'В SEYVEO уже есть локальные записи пульса и давления. Я могу открыть их — но не буду придумывать значения, которых вы не измеряли.',target:'health'}
  ]
 }
});
let active=null,answerId=null,expanded=false,sourceVisible=false,sourceReturnId=null;
const create=(tag,cls,copy)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(copy!==undefined)el.textContent=copy;return el};
function intent(label,fn,variant=''){
 const el=create('button','sa-intent'+(variant?' sa-intent--'+variant:''),label);
 el.type='button';el.addEventListener('click',fn);return el;
}
/* Every visible source invitation stays IN the Sayvi scene.
 * We do not iframe third-party websites, proxy them or impersonate their UI.
 * The lens is a clearly labelled prepared summary with provenance. */
function sourceLink(label,kind='source'){
 const button=intent(label,()=>showSource(kind),'source-link');
 button.setAttribute('aria-label',label+' — посмотреть источник внутри Сэйви');
 return button;
}
function returnFromSource(){
 if(!sourceVisible||!active)return false;
 const previous=sourceReturnId;
 sourceVisible=false;
 detail(active);
 if(previous)showDetail(previous);
 return true;
}
function showSource(kind='source'){
 const record=scenarios[active];
 if(!record)return false;
 sourceReturnId=answerId;
 sourceVisible=true;
 const artwork=kind==='image';
 const origin=artwork?record.credit:record.sourceName;
 const originUrl=artwork?record.creditUrl:record.sourceUrl;
 const section=create('section','sa-source-reader');
 const opener=create('div','sa-source-reader-top');
 opener.append(create('small','sa-eyebrow','SEYVEO · ИСТОЧНИК ВНУТРИ ОТВЕТА'));
 opener.append(create('h1','sa-title',artwork?'Откуда это изображение':'Откуда эти сведения'));
 opener.append(create('p','sa-intro','Сэйви показывает подготовленное объяснение и происхождение материала. Это не полная копия внешнего сайта.'));
 section.append(opener);
 const provenance=create('div','sa-source-provenance');
 provenance.append(create('small','sa-small-label','ПЕРВОИСТОЧНИК'));
 provenance.append(create('strong','',origin));
 provenance.append(create('p','sa-source-location',originUrl));
 section.append(provenance);
 if(artwork){
  const picture=media(record,true);
  picture.classList.remove('sa-media--compact');
  picture.classList.add('sa-reader-media');
  section.append(picture);
  section.append(create('p','sa-source-explanation','Это изображение использовано как иллюстрация к истории. Подпись указывает автора или архив и условия использования, если они известны.'));
 }else{
  section.append(create('h2','sa-reader-heading','Главное из материала'));
  section.append(create('p','sa-summary',record.summary));
  section.append(facts(record));
  if(active==='roadster')section.append(create('p','sa-source-explanation','Слова производителя о полёте — не независимое подтверждение испытаний, продажи или доставки летающих машин.'));
  else section.append(create('p','sa-source-explanation','Сведения представлены в виде краткого обучающего пересказа. Для полной статьи и её свежих обновлений потребуется будущий защищённый читатель.'));
 }
 section.append(create('p','sa-reader-truth','Этот экран составлен в SEYVEO заранее. Полный текст внешней страницы не загружался и не преобразовывался.'));
 const action=intent('Вернуться к истории',returnFromSource,'reader-back');
 section.append(action);
 body.replaceChildren(section);
 return true;
}
function media(record,compact=false){
 const surface=create('div','sa-media'+(compact?' sa-media--compact':''));
 const img=create('img','sa-media-image');
 img.src=record.image;img.alt=record.imageAlt;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
 const fallback=create('p','sa-media-fallback','Изображение недоступно. Факты и источники остаются открытыми.');
 fallback.hidden=true;
 img.addEventListener('error',()=>{img.hidden=true;fallback.hidden=false});
 surface.append(img,fallback);
 if(!compact){
  const label=sourceLink(record.credit,'image');
  label.classList.add('sa-credit');
  surface.append(label);
  const zoom=intent('Рассмотреть крупнее',()=>{
   expanded=!expanded;surface.classList.toggle('sa-media--zoom',expanded);
   zoom.textContent=expanded?'Уменьшить':'Рассмотреть крупнее';
   zoom.setAttribute('aria-expanded',String(expanded));
  },'zoom');
  zoom.setAttribute('aria-expanded','false');
  surface.append(zoom);
 }
 return surface;
}
function facts(record){
 const dl=create('div','sa-facts');
 for(const [name,description] of record.facts){
  const item=create('div','sa-fact');item.append(create('strong','',name),create('span','',description));dl.append(item);
 }
 return dl;
}
function showDetail(id){
 const record=scenarios[active];const selected=record?.questions.find(q=>q.id===id);
 if(!selected)return;
 answerId=id;
 const answer=$('sayviAnswerFollowup');const controls=$('sayviAnswerIntents');
 if(!answer||!controls)return;
 answer.replaceChildren(create('span','sa-small-label','СЭЙВИ · ПРОДОЛЖАЕМ'),create('h2','',selected.title),create('p','',selected.answer));
 if(selected.target==='health'){
  answer.append(intent('Открыть мои показатели',()=>{
   const button=document.querySelector('#calendarSpaces [data-calendar-space="health"]');
   button?.click();
  },'inline'));
 }
 for(const button of controls.querySelectorAll('button[data-answer-id]')){
  button.setAttribute('aria-current',String(button.dataset.answerId===id));
 }
 answer.hidden=false;
 answer.classList.remove('sa-followup--show');
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  requestAnimationFrame(()=>answer.classList.add('sa-followup--show'));
}
function detail(key){
 const record=scenarios[key];if(!record)return false;
 active=key;answerId=null;expanded=false;sourceVisible=false;sourceReturnId=null;
 page.dataset.saTopic=key;
 const content=create('section','sa-scene');
 content.append(create('small','sa-eyebrow',record.label));
 content.append(create('h1','sa-title',record.title));
 content.append(create('p','sa-intro',record.opener));
 content.append(media(record));
 content.append(create('p','sa-summary',record.summary));
 content.append(facts(record));
 content.append(create('p','sa-caption','Что хочешь узнать дальше? Коснись фразы — ответ изменится здесь же.'));
 const controls=create('div','sa-intents');controls.id='sayviAnswerIntents';
 for(const q of record.questions){const el=intent(q.label,()=>showDetail(q.id));el.dataset.answerId=q.id;controls.append(el)}
 content.append(controls);
 const reply=create('section','sa-followup');reply.id='sayviAnswerFollowup';reply.hidden=true;reply.setAttribute('aria-live','polite');
 content.append(reply);
 const citation=create('footer','sa-sources');
 citation.append(create('span','','Источники и проверка: '),sourceLink(record.sourceName,'source'));
 citation.append(create('p','',key==='roadster'?'Важно: заявления производителя не равны независимому подтверждению серийного полёта.':'Это подготовленный познавательный пример, а не автоматический поиск.'));
 content.append(citation);
 body.replaceChildren(content);
 return true;
}
function gallery(){
 active=null;answerId=null;expanded=false;sourceVisible=false;sourceReturnId=null;page.dataset.saTopic='gallery';
 const grid=create('section','sa-gallery');
 grid.append(create('small','sa-eyebrow','SEYVEO · LIVING ANSWERS'));
 grid.append(create('h1','sa-title','Мир можно увидеть'));
 grid.append(create('p','sa-intro','Спроси Сэйви — и важное появится прямо здесь. Пока доступны три подготовленные истории.'));
 for(const [key,record] of Object.entries(scenarios)){
  const item=intent('',()=>detail(key),'topic');
  item.setAttribute('aria-label','Исследовать: '+record.title);
  const preview=media(record,true);
  preview.setAttribute('aria-hidden','true');
  item.append(preview,create('span','sa-topic-copy',record.title),create('span','sa-topic-arrow','›'));
  grid.append(item);
 }
 grid.append(create('p','sa-endnote','Демо без подключённого ИИ. Изображения загружаются из открытых источников. Свои вопросы по другим темам пока обрабатывает обычная Сэйви.'));
 body.replaceChildren(grid);
}
function understand(raw){
 if(typeof raw!=='string'||raw.length>500)return null;
 const v=raw.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
 if(/(?:живые ответы|живой ответ|покажи мир|исследовать мир|покажи что умеешь|покажи интересное)/.test(v))return 'gallery';
 if(/(?:маск|илон|тесл[аы]|tesla|roadster|родстер|летающ(?:ая|ие|ий) машин|машин.{0,28}летает|летает.{0,28}машин)/.test(v))return 'roadster';
 if(/(?:аполлон.?11|apollo.?11|сатурн.?5|saturn.?v|полет.{0,22}на лун|полетел.{0,22}на лун|летали на лун|высадк[аи] на лун|как.{0,45}лун|покажи лун)/.test(v))return 'moon';
 if(/(?:как.{0,55}сердц|как.{0,32}пульс|почему.{0,24}пульс|анатоми[яи].{0,20}сердц|кровообращен|покажи.{0,35}сердц)/.test(v))return 'heart';
 return null;
}
function open(key='gallery'){
 if(!key||!Object.hasOwn(scenarios,key))key='gallery';
 if(location.hash==='#sayvi-answer'){key==='gallery'?gallery():detail(key);return true}
 active=key;
 location.hash='#sayvi-answer';
 return true;
}
function sync(){
 if(location.hash!=='#sayvi-answer')return;
 if(active&&Object.hasOwn(scenarios,active))detail(active);
 else gallery();
}
back.addEventListener('click',()=>{
 if(returnFromSource())return;
 if(active){gallery();return}
 $('navHome')?.click();
});
$('sayviExploreFromComposer')?.addEventListener('click',()=>{ $('hideInput')?.click();open('gallery') });
window.addEventListener('hashchange',sync);
window.SEYVEO_LIVING_ANSWERS=Object.freeze({open,understand,sync,topics:()=>Object.keys(scenarios)});
sync();
})();