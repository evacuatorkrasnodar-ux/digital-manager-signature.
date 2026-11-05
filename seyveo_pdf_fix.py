from pathlib import Path
import shutil, sys

root = Path(__file__).resolve().parent
chat = root / 'sayvi-chat-new.html'
server = root / 'server' / 'real-app-local.mjs'
if not chat.is_file() or not server.is_file():
    print('ERROR: Put this script in the repository root, beside sayvi-chat-new.html and server folder.')
    input('Press Enter to exit...')
    sys.exit(1)

src = chat.read_text(encoding='utf-8')
start_token = ' function openSentDocument(file){'
end_token = ' function showSentFiles(turn,files){'
start = src.find(start_token)
end = src.find(end_token,start)
if start < 0 or end < 0:
    print('ERROR: Chat code changed. No files modified.')
    input('Press Enter to exit...')
    sys.exit(1)

new_function = ''' let sentPdfViewer=null;
 function closeSentPdf(){
  if(!sentPdfViewer)return;
  const viewer=sentPdfViewer;sentPdfViewer=null;
  viewer.overlay.remove();
  setTimeout(()=>URL.revokeObjectURL(viewer.url),10000);
 }
 function openSentDocument(file){
  if(!file){status.textContent='Файл недоступен после обновления страницы. Прикрепи его ещё раз.';return}
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  if(ext==='pdf'){
   closeSentPdf();
   const pdf=new Blob([file],{type:'application/pdf'});
   const url=URL.createObjectURL(pdf);
   const overlay=document.createElement('div');
   overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
   overlay.setAttribute('aria-label','Просмотр PDF: '+file.name);
   overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:#151515;color:white;display:flex;flex-direction:column;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)';
   const bar=document.createElement('div');
   bar.style.cssText='display:flex;align-items:center;gap:12px;min-height:54px;padding:8px 16px;background:rgba(100,100,100,.13);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)';
   const back=document.createElement('button');back.type='button';back.textContent='‹ Назад';
   back.style.cssText='border:0;background:transparent;color:inherit;font:inherit;padding:10px 4px;cursor:pointer';
   const name=document.createElement('span');name.textContent=file.name;
   name.style.cssText='flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px';
   const external=document.createElement('button');external.type='button';external.textContent='Открыть отдельно';
   external.style.cssText='border:0;background:transparent;color:inherit;font:inherit;font-size:12px;padding:10px 4px;cursor:pointer';
   external.addEventListener('click',()=>window.open(url,'_blank'));
   back.addEventListener('click',closeSentPdf);bar.append(back,name,external);
   const frame=document.createElement('iframe');frame.title='PDF: '+file.name;frame.src=url;
   frame.style.cssText='border:0;width:100%;flex:1;min-height:0;background:white';
   overlay.append(bar,frame);document.body.append(overlay);
   sentPdfViewer={overlay,url};back.focus({preventScroll:true});
  }else{
   const url=URL.createObjectURL(file);
   const link=document.createElement('a');link.href=url;link.download=file.name;
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sentPdfViewer)closeSentPdf()});
'''
server_src = server.read_text(encoding='utf-8')
old_csp = 'frame-src https:; worker-src'
new_csp = "frame-src 'self' blob: https:; worker-src"
if old_csp not in server_src and new_csp not in server_src:
    print('ERROR: Server CSP differs. No files modified.')
    input('Press Enter to exit...')
    sys.exit(1)
new_chat = src[:start] + new_function + src[end:]
new_server = server_src.replace(old_csp,new_csp)
if new_chat != src or new_server != server_src:
    for f in (chat, server):
        backup = f.with_suffix(f.suffix+'.before-pdf-fix.bak')
        if not backup.exists():
            shutil.copy2(f,backup)
    chat.write_text(new_chat,encoding='utf-8')
    server.write_text(new_server,encoding='utf-8')
print('SUCCESS: PDF preview updated. Backups saved beside modified files.')
print('Next: GitHub Desktop -> commit changed files -> Push origin. Restart local server.')
input('Press Enter to exit...')
