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
 // Mixed examples use exactly the production paper/ink/OCR result formats.
 const mediaPrefix='sv-note-media-example-20261124-';
 const stroke=(points,color='#171e29',width=5,tool='pen')=>({tool,color,width,points});
 const ellipse=(x,y,rx,ry)=>Array.from({length:65},(_,i)=>[Math.round(x+rx*Math.cos(i*Math.PI/32)),Math.round(y+ry*Math.sin(i*Math.PI/32))]);
 const paper=(pattern,strokes,extra={})=>({pattern,background:'light',height:1188,strokes,texts:[],...extra});
 // Real vector strokes, not a flattened image of ink. The letters can be
 // erased/edited individually in the same handwriting editor.
 const glyphs={
  'П':[[[0,48],[0,0],[34,0],[34,48]]],
  'Л':[[[0,48],[15,0],[34,48]]],
  'А':[[[0,48],[17,0],[34,48]],[[7,30],[27,30]]],
  'Н':[[[0,0],[0,48]],[[34,0],[34,48]],[[0,24],[34,24]]],
  'Д':[[[0,48],[7,48],[13,0],[30,0],[30,48],[38,48],[38,59]],[[0,59],[0,48],[38,48]]],
  'Е':[[[34,0],[0,0],[0,48],[34,48]],[[0,24],[27,24]]],
  'И':[[[0,0],[0,48],[34,0],[34,48]]],
  'М':[[[0,48],[0,0],[17,28],[34,0],[34,48]]],
  'О':[[[17,0],[3,5],[0,24],[5,43],[17,48],[30,43],[34,24],[30,5],[17,0]]],
  'Р':[[[0,48],[0,0],[25,0],[34,10],[31,23],[0,26]]],
  'К':[[[0,0],[0,48]],[[34,0],[0,25],[34,48]]],
  'Т':[[[0,0],[34,0]],[[17,0],[17,48]]],
  'С':[[[34,5],[18,0],[4,9],[0,26],[8,43],[23,48],[34,40]]],
  'У':[[[0,0],[17,28]],[[34,0],[17,28],[10,48]]],
  'Ч':[[[0,0],[0,20],[14,27],[34,23]],[[34,0],[34,48]]],
  'Я':[[[34,48],[34,0],[8,0],[0,12],[8,24],[34,24]],[[34,24],[0,48]]]
 };
 function inkWords(lines,lined=false,previous=false){
  const result=[];
  lines.forEach((line,row)=>Array.from(line).forEach((letter,col)=>{
   (glyphs[letter]||[]).forEach(points=>result.push(stroke(points.map(([x,y])=>[60+col*45+x,lined?(previous?84+y:77+y*.82)+row*132:90+row*110+y+Math.round(Math.sin(col+row)*3)]))));
  }));
  return result;
 }
 function documentPhoto(heading,lines,framed=false){
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=960;
  const ctx=canvas.getContext('2d');if(!ctx)return '';
  ctx.fillStyle='#fff';ctx.fillRect(0,0,720,960);
  if(framed){ctx.fillStyle='#e8e6e1';ctx.fillRect(0,0,720,960);ctx.fillStyle='#fffefb';ctx.fillRect(24,24,672,912);}
  ctx.fillStyle='#262b33';ctx.font='bold 34px Arial';ctx.fillText(heading,60,108);
  ctx.strokeStyle='#c7c9cc';ctx.beginPath();ctx.moveTo(60,145);ctx.lineTo(660,145);ctx.stroke();
  ctx.font='24px Arial';lines.forEach((line,i)=>ctx.fillText(line,60,202+i*47));
  ctx.font='20px Arial';ctx.fillStyle='#737981';ctx.fillText('Вымышленный образец · SEYVEO',60,880);
  return canvas.toDataURL('image/jpeg',.78);
 }
 const handwritingExamples=[['План дня',['ПЛАН ДНЯ','ДЕЛА','ИДЕИ']],['Идеи',['ИДЕИ','ПЛАН','РАСКЛАД']],['Список дел',['ДЕЛА','ПЛАН','ОТЧЕТ']],['Заметка от руки',['МЕЧТА','ПЛАН','ДЕЛО']]];
 // Only untouched, explicitly marked test fixtures may be aligned. A real
 // note or a sample the user has edited is returned unchanged.
 function alignExample(note){
  if(note?.sample!==true||note.noteKind!=='handwriting'||note.paper?.pattern!=='lines')return note;
  const index=handwritingExamples.findIndex((_,i)=>note.id===mediaPrefix+i);
  if(index<0||index%2)return note;
  const lines=handwritingExamples[index][1];
  const actual=JSON.stringify(note.paper.strokes);
  if(actual!==JSON.stringify(inkWords(lines))&&actual!==JSON.stringify(inkWords(lines,true,true)))return note;
  return {...note,paper:{...note.paper,strokes:inkWords(lines,true)}};
 }
  const docs=[
   ['Скан · список покупок',['Хлеб — 1 шт.','Молоко — 2 шт.','Яблоки — 1 кг','Кофе — 1 пачка']],
   ['Скан · накладная',['Учебная накладная № 014','Бумага — 5 пачек','Папки — 10 шт.','Всего: 2 450 руб.']]
  ];
 function polishScanExample(note){
  if(note?.sample!==true||note.sampleKind!=='scan-photo'||note.paper?.strokes?.length||note.paper?.texts?.length)return note;
  const i=docs.findIndex((_,index)=>note.id===mediaPrefix+(8+index));
  if(i<0)return note;
  const [title,lines]=docs[i],heading=title.replace('Скан · ','');
  if(note.paper.photo!==documentPhoto(heading,lines,true))return note;
  return {...note,paper:{...note.paper,photo:documentPhoto(heading,lines)}};
 }
 function mediaExamples(){
  const hand=handwritingExamples.map(([title,lines],i)=>({
   title,text:title,noteKind:'handwriting',paper:paper(i%2?'blank':'lines',inkWords(lines,i%2===0))
  }));
  const art=[
   {title:'Горы и солнце',strokes:[stroke([[50,650],[270,290],[450,650],[610,390],[790,650]],'#27609b',9),stroke(ellipse(620,190,66,66),'#ffb525',14),stroke([[50,690],[790,690]],'#258463',8)]},
   {title:'Цветок',strokes:[...Array.from({length:6},(_,i)=>stroke(ellipse(420+95*Math.cos(i*Math.PI/3),350+95*Math.sin(i*Math.PI/3),69,69),'#c54a51',12)),stroke(ellipse(420,350,40,40),'#ffb525',17),stroke([[420,460],[408,760]],'#258463',14),stroke([[414,615],[300,530],[330,640],[414,655]],'#258463',10)]},
   {title:'Схема проекта',strokes:[stroke([[70,140],[320,260]],'#27609b',6,'rect'),stroke([[520,140],[770,260]],'#258463',6,'rect'),stroke([[320,200],[520,200]],'#171e29',6,'arrow'),stroke([[420,260],[420,490]],'#171e29',6,'arrow'),stroke([[260,490],[580,610]],'#7954a3',6,'rect')],texts:[{text:'Идея',x:100,y:170,size:36,width:200,color:'#27609b'},{text:'План',x:550,y:170,size:36,width:200,color:'#258463'},{text:'Результат',x:290,y:520,size:36,width:270,color:'#7954a3'}]},
   {title:'Геометрия',strokes:[stroke([[90,150],[360,420]],'#3b77df',9,'rect'),stroke(ellipse(570,290,135,135),'#ff7a27',10),stroke([[125,780],[270,510],[415,780],[125,780]],'#258463',10),stroke([[520,650],[680,800]],'#7954a3',9,'diamond')]}
  ].map((item,i)=>({title:item.title,text:'Рисунок',noteKind:'art',paper:paper(i===2?'grid':'blank',item.strokes,{texts:item.texts||[]})}));

  const scans=docs.map(([title,lines])=>({title,text:'Рисунок',noteKind:'art',sampleKind:'scan-photo',paper:paper('blank',[],{photo:documentPhoto(title.replace('Скан · ',''),lines),photoLayout:{x:420,y:594,scale:.9}})}));
  const recognized=[
   {text:'Скан · распознанный список\\n\\nЧай\\nПеченье\\nБумажные салфетки\\nВода',preserveLines:true,sampleKind:'scan-text'},
   {text:'Скан · распознанный документ\\n\\nУчебный протокол № 02\\nТема: подготовка проекта.\\nРешение: согласовать материалы и сроки.\\nЭто вымышленный результат OCR.',preserveLines:true,sampleKind:'scan-text'}
  ].map(n=>({...n,text:n.text.replace(/\\n/g,'\n')}));
  return [...hand,...art,...scans,...recognized].map((item,i)=>({...item,id:mediaPrefix+i,sample:true}));
 }
 const sampleButton=document.createElement('button');
 sampleButton.type='button';sampleButton.id='svNotebookExampleLaunch';
 sampleButton.textContent='Добавить 20 примеров';sampleButton.hidden=true;
 page.insertBefore(sampleButton,document.getElementById('notesList'));
 function syncSamples(){
  const api=window.SEYVEO_NOTES_API;
  const notes=api?.getNotes()||[];
  const hasText=notes.some(n=>n.id.startsWith(samplePrefix));
  sampleButton.hidden=!api||notes.some(n=>n.id.startsWith(mediaPrefix));
  sampleButton.textContent=hasText?'Добавить рисунки и сканы · 12':'Добавить 20 разных примеров';
 }
 sampleButton.addEventListener('click',()=>{
  const api=window.SEYVEO_NOTES_API;if(!api)return;
  let raw;
  try{raw=JSON.parse(localStorage.getItem('seyveo-notes-v1')||'[]');}
  catch{api.message('Не удалось прочитать записи. Ничего не изменено.');return;}
  if(!Array.isArray(raw)){api.message('Не удалось прочитать записи. Ничего не изменено.');return;}
  if(raw.some(n=>typeof n?.id==='string'&&n.id.startsWith(mediaPrefix))){syncSamples();return;}
  const hasText=raw.some(n=>typeof n?.id==='string'&&n.id.startsWith(samplePrefix));
  const texts=hasText?[]:[...sampleTexts.slice(0,6),sampleTexts[17],sampleTexts[18]].map((text,i)=>({id:samplePrefix+i,text,sample:true,preserveLines:i===7}));
  const media=mediaExamples();
  const mixed=hasText?media:[...media.slice(0,4),...texts.slice(0,4),...media.slice(4,8),...texts.slice(4),...media.slice(8)];
  if(raw.length+mixed.length>100){api.message('Не хватает места для примеров. Ваши записи сохранены.');return;}
  const now=Date.now();
  const examples=mixed.map((note,i)=>({...note,createdAt:now-i*86400000,updatedAt:now-i*86400000}));
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
  version:4,show:()=>page.show(),close:()=>page.close(),alignExample,polishScanExample
 });
})();
