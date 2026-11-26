/* SEYVEO OCR worker factory V121. Only language data may come from
   the official fallback; images and recognition stay in the browser. */
(()=>{
 'use strict';
 const languages=['rus','eng'];
 const assets=new URL('assets/',document.baseURI);
 const fallback='https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/4.1.0/';
 let sourcePromise;
 async function missing(lang){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
   const response=await fetch(new URL(lang+'.traineddata',assets),{method:'HEAD',signal:controller.signal,cache:'no-cache'});
   return response.status===404||response.status===410||
    (response.ok&&/text\/html/i.test(response.headers.get('content-type')||''));
  }catch{return false}
  finally{clearTimeout(timer)}
 }
 function languageSource(){
  if(navigator.onLine===false)return Promise.resolve(assets.href);
  if(!sourcePromise)sourcePromise=Promise.all(languages.map(missing)).then(results=>results.some(Boolean)?fallback:assets.href).finally(()=>{sourcePromise=null});
  return sourcePromise;
 }
 async function create(lib,logger){
  const langPath=await languageSource();
  if(langPath===fallback)logger?.({status:'loading language traineddata',progress:0});
  return new Promise((resolve,reject)=>{
   let settled=false;
   const finishError=error=>{
    if(settled)return;
    settled=true;clearTimeout(timer);
    const detail=String(error?.message||error||'');
    reject(new Error(/traineddata|network|404|fetch|timeout/i.test(detail)?
     'Не удалось загрузить языковые модели распознавания. Проверьте подключение или обновите файлы приложения.':
     'Не удалось запустить распознавание. Попробуйте ещё раз.'));
   };
   const timer=setTimeout(()=>finishError('timeout'),45000);
   Promise.resolve().then(()=>lib.createWorker(languages,1,{
    workerPath:new URL('seyveo-ocr-worker.min.js',assets).href,
    corePath:new URL('seyveo-ocr-core-lstm.wasm.js',assets).href,
    langPath,gzip:false,logger,
    errorHandler:finishError
   })).then(worker=>{
    if(settled){Promise.resolve(worker?.terminate?.()).catch(()=>{});return}
    settled=true;clearTimeout(timer);resolve(worker);
   },finishError);
  });
 }
 window.SEYVEO_OCR_WORKER=Object.freeze({create});
})();
