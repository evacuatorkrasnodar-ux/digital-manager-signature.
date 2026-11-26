/* SEYVEO Paper · deliberate handwriting-to-text, independent of ink editing.
   Native on-device recognition where present, local OCR fallback otherwise.
   No drawing is replaced, uploaded to SEYVEO, or saved without confirmation. */
(()=>{
 'use strict';
 const paper=window.SEYVEO_PAPER;
 const menu=document.getElementById('notePaperSettingsMenu');
 const tablet=document.getElementById('notePaperDialog');
 if(!paper?.getInkStrokes||!paper?.exportInkOcrPng||!menu||!tablet)return;

 const entry=document.createElement('button');
 entry.type='button';entry.className='sv-newdock-menu-action';
 entry.id='notePaperRecognizeOpen';
 entry.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><path d="m7 13 3 3 7-8"/></svg><span>Распознать рукопись</span>';
 menu.insertBefore(entry,menu.querySelector('.sv-newdock-clear'));

 const overlay=document.createElement('dialog');
 overlay.className='sv-paper-recognition';overlay.id='svPaperRecognition';
 overlay.setAttribute('aria-labelledby','svPaperRecognitionTitle');
 overlay.innerHTML=`
  <div class="sv-pr-head"><h2 id="svPaperRecognitionTitle">Рукопись → текст</h2><button type="button" data-pr-close aria-label="Закрыть распознавание">Готово</button></div>
  <p class="sv-pr-help">Напишите от руки и нажмите «Распознать». Проверьте текст, а затем добавьте его на лист или в заметку.</p>
  <div class="sv-pr-status" role="status" aria-live="polite">Напишите несколько слов на листе.</div>
  <textarea class="sv-pr-text" aria-label="Распознанный текст, можно исправить" placeholder="Здесь появится распознанный текст" spellcheck="true" rows="7"></textarea>
  <button type="button" class="sv-pr-script-fix" data-pr-fix-script hidden>Проверить похожие буквы</button>
  <div class="sv-pr-actions"><button type="button" data-pr-run class="sv-pr-primary">Распознать</button><button type="button" data-pr-sheet disabled>На лист</button><button type="button" data-pr-copy disabled>Копировать</button><button type="button" data-pr-save disabled>В заметку</button></div>
  <p class="sv-pr-note">Штрихи останутся на листе. Проверьте имена, числа и другие важные данные.</p>`;
 document.body.append(overlay);
 const runButton=overlay.querySelector('[data-pr-run]');
 const sheetButton=overlay.querySelector('[data-pr-sheet]');
 const copyButton=overlay.querySelector('[data-pr-copy]');
 const saveButton=overlay.querySelector('[data-pr-save]');
 const text=overlay.querySelector('textarea');
 const fixButton=overlay.querySelector('[data-pr-fix-script]');
 const status=overlay.querySelector('.sv-pr-status');
 const help=overlay.querySelector('.sv-pr-help');
 const chatMode=new URLSearchParams(location.search).get('seyveo-draw')==='chat';
 if(chatMode){saveButton.hidden=true;sheetButton.hidden=true;overlay.classList.add('sv-pr-chat')}
 let busy=false,loader=null,inkAvailable=false,savedText='',previousText='';
 const message=value=>{status.textContent=value};
 const latinTwins=Object.freeze({A:'А',B:'В',C:'С',E:'Е',H:'Н',K:'К',M:'М',O:'О',P:'Р',T:'Т',X:'Х',a:'а',c:'с',e:'е',k:'к',m:'м',o:'о',p:'р',t:'т',x:'х',y:'у'});
 // Suggest only visually confusable Latin glyphs inside predominantly Russian
 // words. Never invent a dictionary correction, translate, or change a name
 // without the author's explicit tap.
 function mixedScriptProposal(value){
  let count=0;
  const suggested=String(value).replace(/[A-Za-zА-Яа-яЁё]+/g,word=>{
   const russian=(word.match(/[А-Яа-яЁё]/g)||[]).length;
   const latin=(word.match(/[A-Za-z]/g)||[]);
   if(russian<2||!latin.length||russian<latin.length||!latin.every(letter=>latinTwins[letter]))return word;
   count+=latin.length;
   return word.replace(/[A-Za-z]/g,letter=>latinTwins[letter]);
  });
  return {text:suggested,count};
 }
 function updateScriptSuggestion(){
  if(previousText){fixButton.hidden=false;fixButton.textContent='Вернуть исходный текст';return}
  const proposal=mixedScriptProposal(text.value);
  fixButton.hidden=!proposal.count;
  fixButton.textContent=proposal.count===1?'Исправить похожую букву':'Исправить похожие буквы · '+proposal.count;
 }
 const sync=()=>{
  const hasText=Boolean(text.value.trim());
  runButton.disabled=busy||!inkAvailable;copyButton.disabled=busy||!hasText;
  sheetButton.disabled=busy||!hasText||chatMode;
  saveButton.disabled=busy||!hasText||text.value.trim().slice(0,8000)===savedText;
 };
 // Choose the larger clear region above or below the handwriting. The text
 // remains independently movable and editable on the original page.
 function textPlacement(value,strokes,height){
  const size=36,width=688,margin=76;
  const estimatedLines=value.split('\n').reduce((total,line)=>total+Math.max(1,Math.ceil(line.length/36)),0);
  const needed=estimatedLines*size*1.28;
  let first=height,last=0;
  for(const stroke of strokes)for(const point of stroke){
   first=Math.min(first,point[1]);last=Math.max(last,point[1]);
  }
  const belowStart=Math.max(margin,Math.ceil(last+38));
  const aboveRoom=Math.max(0,first-margin-24);
  const belowRoom=Math.max(0,height-belowStart-24);
  const y=belowRoom>=needed||belowRoom>=aboveRoom?belowStart:margin;
  return {text:value,x:margin,y:Math.min(height-120,y),size,width};
 }
 function show(){
  if(!tablet.open||busy)return;
  const strokes=paper.getInkStrokes();
  inkAvailable=Boolean(strokes.length);savedText='';
  overlay.classList.toggle('sv-pr-empty',!inkAvailable);
  if(!strokes.length){
   message('На листе пока нет рукописи. Напиши несколько слов ручкой или карандашом, затем вернись сюда.');
  }else message('Готово к распознаванию. Ваш рисунок останется без изменений.');
  help.textContent='Напишите от руки и нажмите «Распознать». Проверьте текст, а затем добавьте его на лист или в заметку.';
  text.value='';previousText='';updateScriptSuggestion();sync();
  menu.hidden=true;
  document.getElementById('notePaperSettings')?.setAttribute('aria-expanded','false');
  if(!overlay.open)overlay.showModal();
 }
 entry.addEventListener('click',show);
 overlay.querySelector('[data-pr-close]').addEventListener('click',()=>{if(!busy)overlay.close()});
 overlay.addEventListener('cancel',event=>{if(busy)event.preventDefault()});
 text.addEventListener('input',()=>{previousText='';updateScriptSuggestion();sync()});
 fixButton.addEventListener('click',()=>{
  if(busy)return;
  if(previousText){text.value=previousText;previousText='';message('Исходный распознанный текст восстановлен.');}
  else{
   const proposal=mixedScriptProposal(text.value);
   if(!proposal.count)return;
   previousText=text.value;text.value=proposal.text;
   message('Похожие буквы исправлены. Проверьте результат перед сохранением.');
  }
  updateScriptSuggestion();sync();
 });

 async function nativeRecognition(strokes){
  if(typeof navigator.createHandwritingRecognizer!=='function'||typeof window.HandwritingStroke!=='function'||window.top!==window)return '';
  let recognizer;
  try{
   // Do not silently force English on a Russian handwritten document.
   recognizer=await navigator.createHandwritingRecognizer({languages:['ru']});
   const drawing=recognizer.startDrawing({recognitionType:'text',alternatives:2});
   for(const points of strokes){
    const stroke=new window.HandwritingStroke();
    for(let index=0;index<points.length;index++){
     const [x,y]=points[index];stroke.addPoint({x,y,t:index*12});
    }
    drawing.addStroke(stroke);
   }
   const predictions=await drawing.getPrediction();
   drawing.clear();
   return String(predictions?.[0]?.text||'').trim();
  }catch{return ''}
  finally{try{recognizer?.finish()}catch{}}
 }
 function loadTesseract(){
  if(window.Tesseract?.createWorker)return Promise.resolve(window.Tesseract);
  if(loader)return loader;
  loader=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   const timer=window.setTimeout(()=>reject(new Error('Загрузка распознавания заняла слишком много времени.')),30000);
   script.src=new URL('assets/seyveo-ocr-tesseract.min.js',document.baseURI).href;
   script.async=true;
   script.onload=()=>{
    clearTimeout(timer);
    if(window.Tesseract?.createWorker)resolve(window.Tesseract);
    else reject(new Error('Модуль распознавания недоступен.'));
   };
   script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Не удалось загрузить языковые модели. Проверьте подключение.'))};
   document.head.append(script);
  }).catch(error=>{loader=null;throw error});
  return loader;
 }
 // The normal paragraph layout can miss short lines scattered around a page.
 // Retry once in sparse-text mode only when the first local OCR pass is weak.
 function ocrReading(result){
  const data=result?.data||{};
  return {text:String(data.text||'').trim(),
   confidence:Number.isFinite(data.confidence)?data.confidence:null};
 }
 function retrySparse(reading){
  return !reading.text||reading.confidence!==null&&reading.confidence<55;
 }
 function bestReading(first,second){
  if(!second?.text)return first;
  if(!first.text)return second;
  if(first.confidence===null)return first;
  if(second.confidence===null)return first;
  // Avoid accepting a confidently recognised stray symbol over a sentence.
  if(second.text.length<first.text.length*.55)return first;
  return second.confidence>first.confidence+3?second:first;
 }
 async function imageRecognition(){
  message('Подготавливаю рукопись и загружаю распознавание…');
  const image=paper.exportInkOcrPng();
  const lib=await loadTesseract();
  let worker;
  try{
   worker=await window.SEYVEO_OCR_WORKER.create(lib,info=>{
     if(!overlay.open)return;
     const stages={
      'loading tesseract core':'Загружаю движок',
      'initializing tesseract':'Запускаю распознавание',
      'loading language traineddata':'Загружаю языковые модели',
      'initializing api':'Подготавливаю русский язык',
      'recognizing text':'Читаю рукопись'
     };
     const label=stages[info.status];
     if(label)message(label+(Number.isFinite(info.progress)?': '+Math.round(info.progress*100)+'%':'…'));
   });
   await worker.setParameters?.({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
   const first=ocrReading(await worker.recognize(image));
   if(!retrySparse(first))return first;
   message('Проверяю раздельные строки другим способом…');
   await worker.setParameters?.({tessedit_pageseg_mode:'11'});
   const second=ocrReading(await worker.recognize(image));
   return bestReading(first,second);
  }finally{try{await worker?.terminate()}catch{}}
 }
 runButton.addEventListener('click',async()=>{
  if(busy)return;
  const strokes=paper.getInkStrokes();
  if(!strokes.length){message('Сначала напишите что-нибудь ручкой или карандашом.');return}
  busy=true;sync();
  try{
   message('Проверяю встроенное распознавание…');
   let found=await nativeRecognition(strokes);
   let confidence=null;
   if(!found){
    const local=await imageRecognition();
    found=local.text;confidence=local.confidence;
   }
   if(!overlay.open)return;
   if(!found){message('Текст не удалось определить. Попробуйте написать крупнее или исправить вручную.');return}
   text.value=found.slice(0,8000);previousText='';updateScriptSuggestion();
   const compact=found.replace(/\s/g,'');
   const letters=(compact.match(/[A-Za-zА-Яа-яЁё0-9]/g)||[]).length;
   const uncertain=(confidence!==null&&confidence<55)
    ||(compact.length>0&&letters/compact.length<.4);
   message(uncertain
    ?'Результат неуверенный: возможно, это рисунок или отдельные символы. Проверьте и исправьте текст вручную.'
    :'Готово. Проверьте результат — рукописный лист не изменён.');
  }catch(error){
   message((error?.message||'Распознавание недоступно.')+' Рисунок сохранён на листе.');
  }finally{busy=false;sync()}
 });
 copyButton.addEventListener('click',async()=>{
  if(busy||!text.value.trim())return;
  try{await navigator.clipboard.writeText(text.value);message('Текст скопирован. Лист не изменён.');}
  catch{message('Копирование недоступно. Выделите текст вручную.');text.focus();text.select()}
 });
 sheetButton.addEventListener('click',()=>{
  if(busy||chatMode||!text.value.trim())return;
  const value=text.value.trim();
  if(value.length>500&&!window.confirm('На лист можно добавить до 500 символов за раз. Добавить первые 500? Полный текст остаётся здесь для копирования или заметки.'))return;
  const content=value.slice(0,500);
  const geometry=paper.getEditGeometry?.();
  if(!geometry){message('Не удалось определить размер листа.');return}
  const item=textPlacement(content,paper.getInkStrokes(),geometry.height);
  item.color=paper.getBackground?.()==='dark'?'#f6f7fb':'#171e29';
  if(!paper.addTextObject?.(item)){
   message('Не удалось добавить текст. Возможно, на листе уже слишком много текстовых блоков.');
   return;
  }
  overlay.close();
  const opened=window.SEYVEO_PAPER_TEXT?.editLast?.();
  if(!opened){
   const paperStatus=document.getElementById('notePaperStatus');
   if(paperStatus)paperStatus.textContent='Текст добавлен. Его можно изменить через «Добавить текст» в действиях.';
  }
 });
 saveButton.addEventListener('click',()=>{
  if(busy||!text.value.trim())return;
  const api=window.SEYVEO_NOTES_API,list=api?.getNotes?.();
  if(!api||!Array.isArray(list)){message('Сохранение заметок сейчас недоступно.');return}
  const value=text.value.trim().slice(0,8000);
  const newNote={id:String(Date.now())+'-'+Math.random().toString(36).slice(2),text:value,createdAt:Date.now()};
  if(!api.putNotes([newNote,...list])){message('Недостаточно памяти для новой заметки.');return}
  savedText=value;
  message('Создана отдельная текстовая заметка. Рисунок остался без изменений.');
  sync();
 });
})();
