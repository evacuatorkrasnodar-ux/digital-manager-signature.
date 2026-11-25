/* SEYVEO · one standard for connecting external services.
 * A prompt is an honest gateway, not a fake login. No credentials or tokens
 * are stored here; a resource name in Business Map is NOT authentication.
 *
 * Future authenticated adapter contract:
 * window.SEYVEO_VERIFIED_CONNECTIONS.isConnected(service, scope) === true
 * only AFTER provider-side verification. After each verified sign-in/out,
 * dispatch window event "seyveo:verified-connection-changed".
 * No user-facing checkbox, storage flag, or click can set "connected".
 */
(()=>{
 'use strict';
 const SETTINGS_HASH='#manage';
 const ICONS=Object.freeze({
  mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4.5 7.5 7.5 6 7.5-6"/>',
  pulse:'<path d="M3 17h4l3-7 4 9 3-5h4"/><path d="M3 5h18"/>',
  music:'<path d="M8 18V6l12-3v12"/><ellipse cx="5.5" cy="18.5" rx="2.5" ry="2"/><ellipse cx="17.5" cy="15.5" rx="2.5" ry="2"/>',
  documents:'<path d="M12.5 3.5H6.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2H14M12.5 3.5 17 8v3M12.5 3.5V8H17M8 11h4.5M8 14h3" /><path d="M15 16l1.7-1.7a2.5 2.5 0 0 1 3.5 3.5l-1.7 1.7a2.5 2.5 0 0 1-3.5 0" opacity=".85"/><path d="m17.6 16.4-2.1 2.1a2.5 2.5 0 0 1-3.5-3.5l1.6-1.6a2.5 2.5 0 0 1 3.5 0" opacity=".65"/>'
 });
 const COPY=Object.freeze({
  mail:{
   heading:'Подключить почту',
   caption:'Чтобы получать и отправлять письма'
  },
  pulse:{
   heading:'Подключить источники бизнеса',
   caption:'Касса, банк или CRM — для реальных показателей'
  },
  music:{
   heading:'Подключить музыкальный сервис',
   caption:'Подписки работают после разрешённого подключения'
  },
  documents:{
   heading:'Подключить документы',
   caption:'1С · ЭДО · серверы'
  }
 });
 const instances=new Set();
 function verified(service,scope){
  const check=window.SEYVEO_VERIFIED_CONNECTIONS?.isConnected;
  if(typeof check!=='function')return false;
  try{
   const yes=(s,context)=>check.call(window.SEYVEO_VERIFIED_CONNECTIONS,s,context)===true;
   if(service==='mail')return scope==='all'
    ?yes('mail','personal')&&yes('mail','business')
    :yes('mail',scope==='business'?'business':'personal');
   if(service==='pulse')return ['bank','accounting','pos','crm'].some(s=>yes(s,'business'));
   if(service==='music')return ['apple-music','spotify','yandex-music','vk-music'].some(s=>yes(s,'personal'));
   if(service==='documents')return scope==='business'
    ?['documents','edo','1c','accounting','document-server'].some(s=>yes(s,'business'))
    :['documents','cloud-storage'].some(s=>yes(s,'personal'));
   return yes(service,scope);
  }catch{return false}
 }
 function svg(markup,kind){
  const el=document.createElementNS('http://www.w3.org/2000/svg','svg');
  el.setAttribute('viewBox','0 0 24 24');
  el.setAttribute('aria-hidden','true');el.setAttribute('focusable','false');
  el.setAttribute('fill','none');el.setAttribute('stroke','currentColor');
  el.setAttribute('stroke-width',kind==='arrow'?'1.7':'1.55');
  el.setAttribute('stroke-linecap','round');el.setAttribute('stroke-linejoin','round');
  el.innerHTML=markup;return el;
 }
 function node(tag,className,text){
  const el=document.createElement(tag);el.className=className;
  if(text!==undefined)el.textContent=text;return el;
 }
 function displayCopy(service,scope){
  const copy=COPY[service];
  if(!copy)return null;
  if(service==='mail'){
   if(scope==='personal')return {...copy,heading:'Подключить личную почту'};
   if(scope==='business')return {...copy,heading:'Подключить рабочую почту'};
  }
  if(service==='documents'&&scope==='personal')
   return {heading:'Подключить хранилище',caption:'Для синхронизации документов между устройствами'};
  return copy;
 }
 function refreshOne(item){
  const button=item.button;
  const scope=typeof item.scope==='function'?item.scope():item.scope;
  const connected=verified(item.service,scope);
  const allowed=typeof item.visible==='function'?item.visible():true;
  const showStatus=item.service==='documents'&&connected;
  button.hidden=!allowed||(connected&&!showStatus);
  if(item.service==='documents')button.dataset.svDocumentConnected=String(showStatus);
  if(button.hidden)return;
  const content=showStatus
   ?{heading:scope==='business'?'Документы подключены':'Хранилище подключено',caption:'Подключение подтверждено'}
   :displayCopy(item.service,scope);
  // Provider names are only shown when an actual verified adapter supplies one.
  if(showStatus){
   const adapter=window.SEYVEO_VERIFIED_CONNECTIONS;
   try{
    const info=adapter?.getConnectionInfo?.('documents',scope);
    if(info?.verified===true&&typeof info.providerName==='string'&&info.providerName.trim()){
     content.heading=info.providerName.trim().slice(0,80);
     const statuses={syncing:'Синхронизация…',synced:'Синхронизировано',error:'Ошибка синхронизации',paused:'Синхронизация приостановлена'};
     if(Object.prototype.hasOwnProperty.call(statuses,info.syncStatus))content.caption=statuses[info.syncStatus];
    }
   }catch{/* Verified generic status remains the fallback. */}
  }
  if(!content)return;
  item.heading.textContent=content.heading;
  item.caption.textContent=content.caption;
  button.setAttribute('aria-label',content.heading+'. '+content.caption+'. Открыть настройки подключений.');
 }
 function refresh(){
  for(const item of instances){
   if(!item.button.isConnected){instances.delete(item);continue}
   refreshOne(item);
  }
 }
 function register(button,service,options={}){
  if(!button||!COPY[service])return null;
  if(button.dataset.svConnectionPrompt==='true')return button;
  button.dataset.svConnectionPrompt='true';
  button.dataset.svConnectionService=service;
  button.classList.add('sv-connect-prompt','sv-connect-prompt--'+service);
  button.type='button';
  const icon=node('span','sv-connect-prompt-icon');
  icon.setAttribute('aria-hidden','true');icon.append(svg(service==='documents'&&options.scope!=='business'?'<path d="M6.5 18a4.5 4.5 0 0 1-.6-9 6.2 6.2 0 0 1 11.8 1.2A3.9 3.9 0 1 1 18 18Z"/>':ICONS[service]));
  const copy=node('span','sv-connect-prompt-copy');
  const heading=node('strong','sv-connect-prompt-title');
  const caption=node('small','sv-connect-prompt-caption');
  copy.append(heading,caption);
  const arrow=node('span','sv-connect-prompt-arrow');
  arrow.setAttribute('aria-hidden','true');
  arrow.append(svg('<path d="m9 5 7 7-7 7"/>','arrow'));
  button.replaceChildren(icon,copy,arrow);
  if(options.addClick!==false)button.addEventListener('click',()=>open(service));
  const item={button,service,scope:options.scope,visible:options.visible,heading,caption};
  instances.add(item);
  // New prompts may still be detached while their host is being assembled.
  // Render them now; a later refresh can safely prune stale detached nodes.
  refreshOne(item);
  return button;
 }
 function open(service){
  if(service==='documents'&&typeof window.SEYVEO_SMART_CONNECTIONS?.open==='function'){
   window.SEYVEO_SMART_CONNECTIONS.open('services');
   return;
  }
  // Use the EXISTING Management > Connections destination.
  // Nothing here claims that OAuth/IMAP, banking or a music provider is live.
  window.location.hash=SETTINGS_HASH;
  const entry=document.querySelector('#seyveoCleanManageMenu [data-clean-section="connections"]')
   ||document.getElementById('openManageConnections');
  if(entry)entry.click();
  const topic=service==='mail'?'mail':service==='pulse'?'bank':null;
  if(topic)window.SEYVEO_CONNECTION_COACH?.open?.({type:topic});
 }
 function mount({host,after,service}){
  if(!host||!COPY[service])return null;
  const existing=host.querySelector('[data-sv-connection-service="'+service+'"]');
  if(existing)return existing;
  const button=register(node('button',''),service);
  if(after?.parentNode===host)after.insertAdjacentElement('afterend',button);
  else host.prepend(button);
  refresh();
  return button;
 }
 // One notice in each relevant external-service workspace.
 const pulse=document.getElementById('picturePage');
 const pulseContent=document.getElementById('picturePageScroll')||pulse;
 mount({host:pulseContent,after:pulseContent?.querySelector('#pictureLead'),service:'pulse'});
 // Do not obstruct offline music. Show only in the external-sources panel.
 const music=document.getElementById('sayviMusicSourcesPanel');
 mount({host:music,after:music?.querySelector('.sv-music-providers-desc'),service:'music'});
 ['seyveo:verified-connection-changed','seyveo:auth-changed','seyveo:session-changed'].forEach(
  name=>window.addEventListener(name,refresh));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 window.addEventListener('pageshow',refresh);
 window.SEYVEO_CONNECTION_PROMPTS=Object.freeze({register,refresh,open,verified});
})();