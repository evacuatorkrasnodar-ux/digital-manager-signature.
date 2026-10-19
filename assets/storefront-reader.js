/* SEYVEO · Public storefront · opt-in reader v1.
   Browser only. NO backend, proxy, cookies, CORS bypass, AI or automatic crawling.
   Remote HTML is read solely after the owner taps "Проверить страницу".
   Extracted descriptions/products are never persisted without "Сохранить". */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const pane=$('businessMapStorefront');
if(!pane)return;
const address=$('businessMapStorefrontAddress'),status=$('businessMapStorefrontStatus');
const title=$('businessMapStorefrontTitle'),summary=$('businessMapStorefrontSummary');
const productList=$('businessMapStorefrontProducts'),scanButton=$('businessMapStorefrontScan');
const saveButton=$('businessMapStorefrontSave'),manualInput=$('businessMapStorefrontManual');
const note=$('businessMapStorefrontPrevious');
let current=null,obtained=null,controller=null,reading=false,round=0;
const norm=(text,limit)=>String(text||'').replace(/\s+/g,' ').trim().slice(0,limit);
function clearResult(){
 obtained=null;
 title.textContent='';summary.textContent='';
 productList.replaceChildren();
 $('businessMapStorefrontResult').hidden=true;saveButton.hidden=true;
}
function setResult(found){
 obtained=found;
 title.textContent=found.title||'Название страницы не найдено';
 summary.textContent=found.summary||'Описание страницы не найдено.';
 productList.replaceChildren();
 if(found.products.length){
  for(const value of found.products){
   const li=document.createElement('li');li.textContent=value;productList.append(li);
  }
 }
 $('businessMapStorefrontProductsWrap').hidden=!found.products.length;
 $('businessMapStorefrontResult').hidden=false;
 saveButton.hidden=!(found.title||found.summary||found.products.length);
}
function stop(){
 round++;
 if(controller){try{controller.abort()}catch{}}
 controller=null;reading=false;scanButton.disabled=false;
}
window.addEventListener('seyveo:storefront-open',event=>{
 stop();clearResult();manualInput.value='';
 current=event.detail?.url||null;
 if(!current)return;
 address.textContent=current;
 const link=$('businessMapStorefrontExternal');
 link.href=current;link.target='_blank';link.rel='noopener noreferrer';
 status.textContent='Проверка запускается только после вашего нажатия. Сайт может запретить чтение страниц из браузера.';
 const old=event.detail?.existing;
 note.textContent=old?(old.method==='owner'
  ?'Ранее сохранено со слов владельца: ':'Ранее сохранено после проверки страницы: ')+
  (old.summary||old.title||old.products.join(', ')).slice(0,350):'Пока нет сохранённого описания витрины.';
 $('businessMapStorefrontPrevious').hidden=false;
});
window.addEventListener('pagehide',stop);
$('businessMapStorefrontBack').addEventListener('click',()=>{stop();current=null});
function validProductName(value){return norm(value,100)}
function parsePage(html){
 if(typeof DOMParser!=='function')throw Error('parser');
 const doc=new DOMParser().parseFromString(html,'text/html');
 const pick=(selector,attr)=>{const el=doc.querySelector(selector);return norm(el&&(attr?el.getAttribute(attr):el.textContent),attr==='content'?580:140)};
 const name=pick('meta[property="og:title"]','content')||pick('h1')||pick('title');
 const text=pick('meta[name="description"]','content')||pick('meta[property="og:description"]','content');
 const products=[],dedupe=new Set();let inspected=0;
 const push=x=>{
  const name=validProductName(x);
  if(!name)return;
  const lower=name.toLocaleLowerCase('ru-RU');
  if(!dedupe.has(lower)){dedupe.add(lower);products.push(name)}
 };
 const walk=(node,depth=0)=>{
  if(!node||depth>7||inspected++>150||products.length>=8)return;
  if(Array.isArray(node)){node.slice(0,35).forEach(child=>walk(child,depth+1));return}
  if(typeof node!=='object')return;
  const type=node['@type'];
  const types=Array.isArray(type)?type:[type];
  if(types.some(t=>typeof t==='string'&&/(^|\/)Product$/i.test(t)))push(node.name);
  if(node.item&&typeof node.item==='object')walk(node.item,depth+1);
  for(const k of ['@graph','itemListElement','mainEntity','hasVariant']){
   if(node[k])walk(node[k],depth+1);
  }
 };
 for(const block of [...doc.querySelectorAll('script[type="application/ld+json"]')].slice(0,14)){
  const text=block.textContent||'';
  if(text.length>75000)continue;
  try{walk(JSON.parse(text))}catch{}
  if(products.length>=8)break;
 }
 return {title:name,summary:text,products:products.slice(0,8)};
}
async function readHtml(url,signal){
 const response=await fetch(url,{
  method:'GET',mode:'cors',credentials:'omit',redirect:'error',
  referrerPolicy:'no-referrer',signal,headers:{Accept:'text/html'}
 });
 if(!response.ok)throw Error('http');
 const type=(response.headers.get('content-type')||'').toLowerCase();
 if(type&&!/(?:text\/html|application\/xhtml\+xml)/.test(type))throw Error('format');
 const size=Number(response.headers.get('content-length')||0);
 if(size>350000)throw Error('size');
 const max=250000;
 if(response.body?.getReader){
  const reader=response.body.getReader(),decoder=new TextDecoder();
  let total=0,content='';
  try{
   for(let i=0;i<150;i++){
    const step=await reader.read();if(step.done)break;
    total+=step.value?.length||0;
    if(total>max)throw Error('size');
    content+=decoder.decode(step.value,{stream:true});
   }
  }finally{try{await reader.cancel()}catch{}}
  return content+decoder.decode();
 }
 const content=await response.text();
 if(content.length>max)throw Error('size');
 return content;
}
scanButton.addEventListener('click',async()=>{
 if(!current||reading||typeof fetch!=='function')return;
 stop();const id=round;
 controller=new AbortController();reading=true;scanButton.disabled=true;
 clearResult();
 status.textContent='Проверяю только эту публичную страницу…';
 const timeout=setTimeout(()=>{try{controller?.abort()}catch{}},8500);
 try{
  const html=await readHtml(current,controller.signal);
  if(id!==round)return;
  const found=parsePage(html);
  if(!found.title&&!found.summary&&!found.products.length){
   status.textContent='Страница открылась, но публичное описание и товары не обнаружены. Можно рассказать об ассортименте вручную.';
  }else{
   setResult(found);
   status.textContent=found.products.length
    ?'Найдены названия '+found.products.length+' товаров в публичной разметке. Проверьте их перед сохранением.'
    :'Найдено описание страницы. Достоверный список товаров автоматически не обнаружен.';
  }
 }catch(err){
  if(id!==round)return;
  status.textContent=err?.message==='size'?'Страница слишком большая для безопасной проверки в браузере.':
   err?.message==='format'?'По ссылке не HTML-страница, поэтому распознать товары не удалось.':
   'Сайт не разрешил автоматическое чтение из приложения либо недоступен. Это обычное ограничение браузера; вы можете открыть страницу и описать ассортимент вручную.';
 }finally{
  clearTimeout(timeout);
  if(id===round){controller=null;reading=false;scanButton.disabled=false}
 }
});
saveButton.addEventListener('click',()=>{
 if(!current||!obtained)return;
 const detail={url:current,method:'public-page',...obtained};
 window.dispatchEvent(new CustomEvent('seyveo:storefront-save',{detail}));
 status.textContent=detail.result?.message||'Не удалось сохранить сведения.';
 if(detail.result?.ok){saveButton.hidden=true;note.textContent='Данные обновлены после вашей проверки.'}
});
$('businessMapStorefrontManualSave').addEventListener('click',()=>{
 const info=norm(manualInput.value,580);
 if(!current){status.textContent='Сначала укажите ссылку на источник в Карте бизнеса.';return}
 if(info.length<5){status.textContent='Коротко опишите товары, услуги или ассортимент — минимум пять символов.';return}
 if(/(?:парол[ья]|password|access[_ -]?token|api[_ -]?key|client[_ -]?secret|bearer\s|otp|код\s+доступа|секретн)/i.test(info)){
  status.textContent='Не вводите пароли, ключи и секретные данные.';return
 }
 const detail={url:current,method:'owner',summary:info,title:'Ассортимент со слов владельца',products:[]};
 window.dispatchEvent(new CustomEvent('seyveo:storefront-save',{detail}));
 status.textContent=detail.result?.message||'Не удалось сохранить сведения.';
 if(detail.result?.ok){note.textContent='Записано со слов владельца.';manualInput.value='';clearResult()}
});
})();
