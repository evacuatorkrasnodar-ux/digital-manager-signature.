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
  <p class="sv-pr-help">Напишите от руки и нажмите «Распознать». Текст можно проверить и исправить перед сохранением.</p>
  <div class="sv-pr-status" role="status" aria-live="polite">Напишите несколько слов на листе.</div>
  <textarea class="sv-pr-text" aria-label="Распознанный текст, можно исправить" placeholder="Здесь появится распознанный текст" spellcheck="true" rows="7"></textarea>
  <div class="sv-pr-actions"><button type="button" data-pr-run class="sv-pr-primary">Распознать</button><button type="button" data-pr-copy disabled>Копировать</button><button type="button" data-pr-save disabled>В заметку</button></div>
  <p class="sv-pr-note">Штрихи останутся на листе. Проверьте имена, числа и другие важные данные.</p>`;
 document.body.append(overlay);
 const runButton=overlay.querySelector('[data-pr-run]');
 const copyButton=overlay.querySelector('[data-pr-copy]');
 const saveButton=overlay.querySelector('[data-pr-save]');
 const text=overlay.querySelector('textarea');
 const status=overlay.querySelector('.sv-pr-status');
 const chatMode=new URLSearchParams(location.search).get('seyveo-draw')==='chat';
 if(chatMode){saveButton.hidden=true;overlay.classList.add('sv-pr-chat')}
 let busy=false,loader=null,inkAvailable=false,savedText='';
 const message=value=>{status.textContent=value};
 const sync=()=>{
  const hasText=Boolean(text.value.trim());
  runButton.disabled=busy||!inkAvailable;copyButton.disabled=busy||!hasText;
  saveButton.disabled=busy||!hasText||text.value.trim().slice(0,8000)===savedText;
 };
 function show(){
  if(!tablet.open||busy)return;
  const strokes=paper.getInkStrokes();
  inkAvailable=Boolean(strokes.length);savedText='';
  if(!strokes.length){
   message('На листе пока нет рукописных штрихов.');
  }else message('Готово к распознаванию. Ваш рисунок останется без изменений.');
  text.value='';sync();
  menu.hidden=true;
  document.getElementById('notePaperSettings')?.setAttribute('aria-expanded','false');
  if(!overlay.open)overlay.showModal();
 }
 entry.addEventListener('click',show);
 overlay.querySelector('[data-pr-close]').addEventListener('click',()=>{if(!busy)overlay.close()});
 overlay.addEventListener('cancel',event=>{if(busy)event.preventDefault()});
 text.addEventListener('input',sync);

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
 async function imageRecognition(){
  message('Подготавливаю рукопись и загружаю распознавание…');
  const image=paper.exportInkOcrPng();
  const lib=await loadTesseract();
  let worker;
  try{
   worker=await lib.createWorker(['rus','eng'],1,{
    workerPath:new URL('assets/seyveo-ocr-worker.min.js',document.baseURI).href,
    corePath:new URL('assets/seyveo-ocr-core-lstm.wasm.js',document.baseURI).href,
    langPath:new URL('assets/',document.baseURI).href,
    gzip:false,
    logger:info=>{
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
    }
   });
   await worker.setParameters?.({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
   const result=await worker.recognize(image);
   return {text:String(result?.data?.text||'').trim(),
    confidence:Number.isFinite(result?.data?.confidence)?result.data.confidence:null};
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
   text.value=found.slice(0,8000);
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
