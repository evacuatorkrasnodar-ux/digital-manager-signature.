/* SEYVEO temporary frame inspector.
   Enabled only with ?frame-debug=1. No personal content or storage is read. */
(()=>{'use strict';
 if(new URLSearchParams(location.search).get('frame-debug')!=='1')return;
 const css='position:fixed!important;z-index:2147483646!important;box-sizing:border-box!important';
 const tag=e=>{
  if(!e)return 'none';
  let s=e.tagName.toLowerCase();
  if(e.id)s+='#'+e.id;
  else if(typeof e.className==='string'&&e.className.trim())s+='.'+e.className.trim().split(/\s+/).slice(0,3).join('.');
  return s.slice(0,100);
 };
 const val=(s,key)=>s?.getPropertyValue(key).trim().slice(0,90)||'-';
 const rect=e=>{
  const r=e.getBoundingClientRect();
  return [r.x,r.y,r.width,r.height].map(n=>Math.round(n*10)/10).join(',');
 };
 const props=e=>{
  if(!e)return '';
  const s=getComputedStyle(e);
  return [ 'rect='+rect(e), 'position='+val(s,'position'),
    'border='+[val(s,'border-top-width'),val(s,'border-right-width'),val(s,'border-bottom-width'),val(s,'border-left-width')].join('/'),
    'borderColor='+val(s,'border-left-color'),'radius='+val(s,'border-radius'),
    'outline='+val(s,'outline-width'),'shadow='+val(s,'box-shadow'),
    'bg='+val(s,'background-color'),'overflow='+val(s,'overflow'),
    'transform='+val(s,'transform')].join(' | ');
 };
 function report(){
  const w=innerWidth,h=innerHeight;
  const lines=['SEYVEO · ДИАГНОСТИКА ВНЕШНЕЙ РАМКИ',
    'Размер: '+w+' × '+h+' | DPR: '+devicePixelRatio+
    ' | visualViewport: '+(visualViewport?[visualViewport.width,visualViewport.height].join('×'):'-'),
    'Экран: '+document.documentElement.className,
    'Окна: '+[...document.querySelectorAll('dialog[open]')].map(tag).join(','),
    '--- СЛОИ НА КРАЯХ ---'];
  const coordinates=[[2,Math.floor(h/2)],[5,Math.floor(h/2)],[12,Math.floor(h/2)],
     [w-3,Math.floor(h/2)],[w-7,Math.floor(h/2)],
     [Math.floor(w/2),h-2],[Math.floor(w/2),h-7],[Math.floor(w/2),h-15]];
  for(const [x,y] of coordinates){
   const el=document.elementFromPoint(x,y);
   lines.push('('+x+','+y+') '+[...document.elementsFromPoint(x,y)].slice(0,5).map(tag).join(' > '));
   if(el)lines.push('  '+tag(el)+' '+props(el));
  }
  lines.push('--- ОБОЛОЧКИ И ПСЕВДОЭЛЕМЕНТЫ ---');
  const primary=[document.documentElement,document.body,document.querySelector('.app'),
   ...document.querySelectorAll('dialog[open]'),
   document.querySelector('#svCareScroll'),document.querySelector('#sayviMusicPage'),
   document.querySelector('#seyveoFamilyDialog'),document.querySelector('.svf-shell')].filter(Boolean);
  for(const el of [...new Set(primary)]){
   if(el.hidden)continue;
   lines.push(tag(el)+' '+props(el));
   for(const which of ['::before','::after']){
    const st=getComputedStyle(el,which);
    if(st.content!=='none'&&st.content!=='normal'&&st.display!=='none')
     lines.push('  '+which+' content='+val(st,'content')+' border='+val(st,'border')+
      ' shadow='+val(st,'box-shadow')+' radius='+val(st,'border-radius')+' position='+val(st,'position'));
   }
  }
  lines.push('--- КРУПНЫЕ ЭЛЕМЕНТЫ С КОНТУРОМ ---');
  let count=0;
  for(const el of document.querySelectorAll('body *')){
   if(count>=15)break;
   if(el===button||panel.contains(el)||el.closest('#svFrameInspector'))continue;
   const b=el.getBoundingClientRect(),st=getComputedStyle(el);
   if(b.width<w*.88||b.height<h*.72||b.height<=0||b.width<=0)continue;
   const bw=parseFloat(st.borderTopWidth)+parseFloat(st.borderLeftWidth)+parseFloat(st.borderRightWidth)+parseFloat(st.borderBottomWidth);
   if(bw>0||st.boxShadow!=='none'||(parseFloat(st.borderTopLeftRadius)>0)){
     lines.push(tag(el)+' '+props(el));count++;
   }
  }
  return lines.join('\n');
 }
 const button=document.createElement('button');
 button.id='svFrameInspector';
 button.type='button';button.textContent='ПРОВЕРКА РАМКИ';
 button.setAttribute('aria-label','Проверить внешний контур страницы');
 button.style.cssText=css+';right:12px!important;bottom:calc(105px + env(safe-area-inset-bottom,0px))!important;padding:8px 10px!important;border-radius:8px!important;border:1px solid #b6bec7!important;background:#38383A!important;color:white!important;font:600 10px system-ui!important;min-height:32px!important;';
 const panel=document.createElement('dialog');
 panel.id='svFrameInspectorPanel';
 panel.style.cssText='box-sizing:border-box!important;position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;margin:0!important;padding:calc(20px + env(safe-area-inset-top,0px)) 14px!important;max-width:none!important;max-height:none!important;border:0!important;border-radius:0!important;background:#111820!important;color:#fff!important;overflow-y:auto!important;z-index:2147483647!important;';
 panel.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong style="font:600 17px system-ui">Диагностика контура</strong><button type="button" id="svFrameInspectClose" style="font-size:17px;padding:12px;background:#38383A;color:#fff;border:0;border-radius:12px">Закрыть</button></div><p style="font:13px system-ui;color:#bac4cd">Только стили и размеры интерфейса. Медицинские сведения и личные данные не собираются.</p><button id="svFrameInspectCopy" type="button" style="font:600 15px system-ui;padding:14px;width:100%;background:#38383A;color:#fff;border:0;border-radius:12px">Скопировать отчёт</button><pre id="svFrameInspectReport" style="white-space:pre-wrap;overflow-wrap:anywhere;color:#dce3e8;font:11px/1.5 monospace"></pre>';
 document.body.append(button,panel);
 const activeHost=()=>{
  const open=[...document.querySelectorAll('dialog[open]')].filter(x=>x!==panel);
  return open.at(-1)||document.body;
 };
 const attach=()=>{if(!panel.open&&button.parentNode!==activeHost())activeHost().append(button)};
 const observer=new MutationObserver(attach);
 observer.observe(document.documentElement,{attributes:true,subtree:true,childList:true,attributeFilter:['open']});
 button.addEventListener('click',()=>{
  const output=report();
  panel.querySelector('#svFrameInspectReport').textContent=output;
  if(!panel.open)panel.showModal();
 });
 panel.querySelector('#svFrameInspectClose').addEventListener('click',()=>panel.close());
 panel.querySelector('#svFrameInspectCopy').addEventListener('click',async e=>{
  const value=panel.querySelector('#svFrameInspectReport').textContent;
  try{await navigator.clipboard.writeText(value);e.currentTarget.textContent='Скопировано';}
  catch{panel.querySelector('#svFrameInspectReport').focus();e.currentTarget.textContent='Выделите текст отчёта';}
 });
 attach();
})();