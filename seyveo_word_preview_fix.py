from pathlib import Path
from datetime import datetime
import shutil

root = Path(__file__).resolve().parent
path = root / 'sayvi-chat-new.html'
if not path.is_file():
    raise SystemExit('ERROR: sayvi-chat-new.html not found next to this script.')
source = path.read_text(encoding='utf-8')
marker = "  }else{\n   const url=URL.createObjectURL(file);\n   const link=document.createElement('a');link.href=url;link.download=file.name;\n   document.body.append(link);link.click();link.remove();\n   setTimeout(()=>URL.revokeObjectURL(url),10000);\n  }\n }\n document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sentPdfViewer)closeSentPdf()});"
replacement = """  }else if(ext==='docx'){
   // DOCX is a ZIP container; browsers download it instead of displaying it.
   // Use the existing local, offline document extractor and show its text.
   closeSentPdf();
   const overlay=document.createElement('div');
   overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
   overlay.setAttribute('aria-label','Просмотр Word: '+file.name);
   overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:#151515;color:white;display:flex;flex-direction:column;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)';
   const bar=document.createElement('div');
   bar.style.cssText='display:flex;align-items:center;gap:12px;min-height:54px;padding:8px 16px;background:rgba(100,100,100,.13);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)';
   const back=document.createElement('button');back.type='button';back.textContent='‹ Назад';
   back.style.cssText='border:0;background:transparent;color:inherit;font:inherit;padding:10px 4px;cursor:pointer';
   back.addEventListener('click',closeSentPdf);
   const name=document.createElement('span');name.textContent=file.name;
   name.style.cssText='flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px';
   const download=document.createElement('button');download.type='button';download.textContent='Скачать';
   download.style.cssText='border:0;background:transparent;color:inherit;font:inherit;font-size:12px;padding:10px 4px;cursor:pointer';
   download.addEventListener('click',()=>{
    const u=URL.createObjectURL(file);const a=document.createElement('a');
    a.href=u;a.download=file.name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(u),10000);
   });
   bar.append(back,name,download);
   const pane=document.createElement('div');
   pane.style.cssText='flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:20px 18px 40px;background:#fafafa;color:#202020;-webkit-overflow-scrolling:touch';
   const notice=document.createElement('p');notice.textContent='Просмотр извлечённого текста Word. Оформление, таблицы и изображения могут отличаться от оригинала.';
   notice.style.cssText='font:12px/1.5 system-ui,sans-serif;color:#666;margin:0 0 16px';
   const text=document.createElement('div');text.textContent='Читаю документ…';
   text.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.65 system-ui,sans-serif';
   pane.append(notice,text);overlay.append(bar,pane);document.body.append(overlay);
   sentPdfViewer={overlay,url:null};back.focus({preventScroll:true});
   const current=overlay;
   (async()=>{
    try{
     const form=new FormData();form.append('file',file,file.name);
     const response=await fetch('/api/seyveo-document-text',{method:'POST',credentials:'same-origin',body:form});
     const data=await response.json().catch(()=>null);
     if(!response.ok)throw Error(data?.error||'Сервер не смог прочитать Word.');
     if(typeof data?.text!=='string'||!data.text.trim())throw Error('В документе нет доступного текста.');
     if(sentPdfViewer?.overlay!==current)return;
     text.textContent=data.text+(data.truncated?'\\n\\n[Показана только часть текста документа.]':'');
    }catch(e){
     if(sentPdfViewer?.overlay!==current)return;
     text.textContent='Не удалось открыть Word: '+String(e?.message||'ошибка')+'\\n\\nПроверь локальный сервер SEYVEO или скачай оригинал.';
    }
   })();
  }else{
   const url=URL.createObjectURL(file);
   const link=document.createElement('a');link.href=url;link.download=file.name;
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sentPdfViewer)closeSentPdf()});"""
if "Просмотр извлечённого текста Word" in source:
    raise SystemExit('INFO: Word preview fix is already installed. No changes made.')
if source.count(marker) != 1:
    raise SystemExit('ERROR: Expected code fragment not found exactly once. No changes made.')
# Closing a Word view has no blob URL, so do not call revokeObjectURL(null).
old_close = "  setTimeout(()=>URL.revokeObjectURL(viewer.url),10000);"
new_close = "  if(viewer.url)setTimeout(()=>URL.revokeObjectURL(viewer.url),10000);"
if source.count(old_close) != 1:
    raise SystemExit('ERROR: Viewer cleanup fragment does not match. No changes made.')
new_source = source.replace(marker, replacement).replace(old_close,new_close)
backup = path.with_name(path.name + '.backup-word-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
shutil.copy2(path, backup)
path.write_text(new_source,encoding='utf-8')
print('SUCCESS: Word text preview installed.')
print('Backup saved:',backup.name)
print('Updated:',path.name)
print('NOTE: Word layout/images may not be preserved; local server needed for text extraction.')
