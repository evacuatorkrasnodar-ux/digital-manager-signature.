/* SEYVEO Notebook · one in-flow Work tab, November 2026.
 * Legacy note APIs expect #notesDialog.open / show() / close().
 * Keep their storage, autosave and editors; never create a modal, duplicate
 * navigation/header, detached overlay, focus jump or moving dock. */
(()=>{
 'use strict';
 const page=document.getElementById('notesDialog');
 if(!page||page.tagName!=='SECTION')return;
 const tasks=document.getElementById('tasksPage');
 const calendar=document.getElementById('calendarPage');

 Object.defineProperty(page,'open',{
  configurable:true,
  get(){return page.hasAttribute('open');}
 });
 page.show=function(){
  if(page.open)return;
  // Notebook belongs to Work. If launched from another area, enter Work
  // first; the shared Work header/tabs remain the only navigation surface.
  if(tasks?.hidden&&calendar?.hidden){
   if(typeof window.SEYVEO_UNIFIED_TASKS?.openPersonal==='function')
    window.SEYVEO_UNIFIED_TASKS.openPersonal();
   else if(location.hash!=='#tasks')location.hash='#tasks';
  }
  page.hidden=false;
  page.setAttribute('open','');
  syncSamples();
  window.SEYVEO_WORK_SHELL?.sync?.();
 };
 page.showModal=page.show;
 page.close=function(){
  if(!page.open)return;
  page.removeAttribute('open');
  page.hidden=true;
  window.SEYVEO_WORK_SHELL?.sync?.();
  page.dispatchEvent(new Event('close'));
 };
 page.hidden=true;
 page.removeAttribute('open');

 // Temporary, explicit local fixture for the notebook prototype.
 // Use the original note writer and reader, never a parallel demo list.
 const samplePrefix='sv-note-example-20261124-';
 const sampleTexts=[
  'Идеи для SEYVEO\n\nЕдиный стиль, неподвижная навигация, спокойные цвета. Проверить удобство на небольшом экране.',
  'Список покупок\n\nМолоко\nХлеб\nЯблоки\nКофе\nОвощи',
  'План проекта\n\nЦель: подготовить новую витрину.\n1. Собрать материалы.\n2. Согласовать эскизы.\n3. Проверить результат.',
  'Мысль дня\n\nПростые решения часто оказываются самыми удобными.',
  'Итоги встречи\n\nОбсудили сроки, распределили задачи. Следующий шаг — уточнить требования к макету и согласовать бюджет.',
  'Рецепт яблочного пирога\n\nЯблоки, мука, яйца, сахар и немного корицы. Смешать ингредиенты, выложить в форму и выпекать до готовности.',
  'Список книг\n\nМаленький принц\nАтлант расправил плечи\nЦветы для Элджернона',
  'Маршрут выходного дня\n\nУтренняя прогулка по парку, кофе в центре, затем выставка и ужин дома.',
  'Заметка о дизайне\n\nКнопки одной высоты. Читаемый текст. Без лишних рамок. Длинные списки должны свободно прокручиваться.',
  'Черновик письма\n\nЗдравствуйте! Благодарим за встречу. Подготовим предложение и направим его после согласования деталей.',
  'Идеи для подарков\n\nКнига, настольная игра, билеты в театр, набор для творчества.',
  'План тренировки\n\nРазминка, упражнения на подвижность, основная часть, спокойная заминка.',
  'Домашние мелочи\n\nПроверить запас батареек и лампочек. Разобрать полку в прихожей.',
  'Рабочие наблюдения\n\nСотрудникам нужен быстрый доступ к расписанию, почте и документам. Важные сведения должны быть видны без лишних переходов.',
  'Смета для примера\n\nМатериалы — 3 500 ₽\nДоставка — 600 ₽\nПрочее — 900 ₽\nИтого — 5 000 ₽',
  'Идея для фотографии\n\nМягкий утренний свет, спокойный фон, один выразительный предмет в кадре.',
  'Сценарий презентации\n\nВведение: зачем нужен продукт.\nОсновная часть: три показательных сценария.\nФинал: следующий шаг и вопросы.',
  'Длинная запись для проверки\n\n'+Array.from({length:12},(_,i)=>'Раздел '+(i+1)+'. Проверяем чтение длинного текста, переносы строк и прокрутку. Верхняя панель должна оставаться доступной, а последние строки — полностью видимыми.').join('\n\n'),
  'Стихи для проверки строк\n\nТихий свет в окне,\nГород спит вдали,\nМысли на листе\nТихо ожили.',
  'Не забыть\n\nХорошие идеи стоит записывать сразу.'
 ];
 const sampleButton=document.createElement('button');
 sampleButton.type='button';sampleButton.id='svNotebookExampleLaunch';
 sampleButton.textContent='Добавить 20 примеров';sampleButton.hidden=true;
 page.insertBefore(sampleButton,document.getElementById('notesList'));
 function syncSamples(){
  const api=window.SEYVEO_NOTES_API;
  sampleButton.hidden=!api||api.getNotes().some(note=>note.id.startsWith(samplePrefix));
 }
 sampleButton.addEventListener('click',()=>{
  const api=window.SEYVEO_NOTES_API;if(!api)return;
  // Preserve even records excluded by the Notebook's visible filter.
  let raw;
  try{raw=JSON.parse(localStorage.getItem('seyveo-notes-v1')||'[]');}
  catch{api.message('Не удалось прочитать записи. Ничего не изменено.');return;}
  if(!Array.isArray(raw)){api.message('Не удалось прочитать записи. Ничего не изменено.');return;}
  if(raw.some(note=>typeof note?.id==='string'&&note.id.startsWith(samplePrefix))){syncSamples();return;}
  if(raw.length+sampleTexts.length>100){api.message('Не хватает места для 20 примеров. Ваши записи сохранены.');return;}
  const now=Date.now();
  const examples=sampleTexts.map((text,i)=>({
   id:samplePrefix+i,text,createdAt:now-i*86400000,updatedAt:now-i*86400000,
   ...(i===18?{preserveLines:true}:{}),sample:true
  }));
  if(!api.putNotes([...examples,...raw])){api.message('Не удалось сохранить примеры.');return;}
  api.message('');syncSamples();api.openNotes();
 });
 window.addEventListener('seyveo:notes-changed',syncSamples);
 document.addEventListener('DOMContentLoaded',syncSamples,{once:true});

 // Shared dock has its own original handlers; these only hide the Notebook,
 // never move, resize or reconstruct the dock.
 const dock=document.querySelector('footer.dock');
 const routes=new Set(['navHome','navTasks','navPicture','navManage','assistantButton']);
 dock?.addEventListener('click',event=>{
  if(!page.open)return;
  const button=event.target.closest?.('button');
  if(button&&routes.has(button.id))page.close();
 },true);
 window.SEYVEO_NOTEBOOK_SCREEN=Object.freeze({
  version:3,show:()=>page.show(),close:()=>page.close()
 });
})();
