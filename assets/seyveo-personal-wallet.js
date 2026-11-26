/* SEYVEO · Личный кошелёк. Все операции локальны; без банков и платежей. */
(()=>{'use strict';
const dialog=document.getElementById('seyveoPayDialog');
if(!dialog||dialog.querySelector('[data-syp-screen="budget"]'))return;
const KEY='seyveo-personal-wallet-v1';
const CATS=['Кофе','Продукты','Кафе','Транспорт','Бензин','Дом','Здоровье','Покупки','Другое'];
const icons={'Кофе':'☕','Продукты':'🛒','Кафе':'🍽','Транспорт':'🚕','Бензин':'⛽','Дом':'⌂','Здоровье':'♡','Покупки':'◈','Другое':'•'};
const screen=document.createElement('section');screen.className='syp-screen sw-screen';screen.dataset.sypScreen='budget';screen.hidden=true;
screen.innerHTML=`<div class="sw-summary">
 <div class="sw-month sv-month-nav"><strong id="swMonth" class="sv-month-name"></strong><div class="sv-month-controls" role="group" aria-label="Переключение месяца"><button type="button" data-sw="previous" aria-label="Предыдущий месяц"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14.5 5-7 7 7 7"/></svg></button><button type="button" data-sw="next" aria-label="Следующий месяц"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9.5 5 7 7-7 7"/></svg></button></div></div>
 <span class="sw-overline">Остаток по записям</span><strong class="sw-balance" id="swBalance">0 ₽</strong><p class="sw-balance-note" id="swBalanceNote"></p>
 <div class="sw-totals"><div><span>Доходы</span><strong class="sw-income" id="swIncome">0 ₽</strong></div><div><span>Расходы</span><strong id="swExpense">0 ₽</strong></div></div>
 </div>
 <div class="sw-editor"><div class="sw-title-row"><h3>Добавить операцию</h3><span>Сэйви понимает несколько записей</span></div>
 <div class="sw-kind"><button type="button" data-sw-kind="expense" aria-pressed="true">Расход</button><button type="button" data-sw-kind="income" aria-pressed="false">Доход</button></div>
 <label class="sw-field"><span>Напиши Сэйви</span><textarea id="swText" rows="2" placeholder="Кофе 250, бензин 1500"></textarea></label>
 <p class="sw-hint">Например: «зарплата 85000» или «кофе 250, продукты 2300»</p>
 <div class="sw-editor-actions"><button type="button" class="sw-primary" data-sw="parse">Разобрать</button><button type="button" class="sw-secondary" data-sw="manual">Вручную</button></div>
 <div class="sw-photos"><button type="button" class="sw-secondary" data-sw="camera">📷 Сфотографировать чек</button><button type="button" class="sw-secondary" data-sw="photo">📎 Фото из файлов</button></div>
 <input id="swCamera" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden><input id="swPhoto" type="file" accept="image/jpeg,image/png,image/webp" hidden>
 <div id="swReceipt" class="sw-receipt" hidden><img id="swReceiptPreview" alt="Выбранный чек"><p id="swReceiptStatus" role="status">Читаю чек…</p><button type="button" class="sw-secondary" data-sw="discard-receipt">Убрать фото</button></div>
 <div class="sw-manual" id="swManual" hidden><label>Сумма, ₽<input id="swAmount" type="text" inputmode="decimal" placeholder="250"></label><label>Название<input id="swTitle" maxlength="100" placeholder="Кофе"></label><label>Категория<select id="swCategory"></select></label><label>Дата<input id="swDate" type="date"></label><button type="button" class="sw-primary" data-sw="save">Сохранить</button><button type="button" class="sw-secondary" data-sw="cancel-edit" hidden>Отмена</button></div>
 <div id="swReview" class="sw-review" hidden></div><p id="swMessage" class="sw-message" role="status" aria-live="polite"></p>
 </div>
 <div class="sw-block"><div class="sw-title-row"><h3>Куда уходят деньги</h3><span id="swCategoryPeriod"></span></div><div id="swChart" class="sw-chart" hidden><div class="sw-ring" id="swRing"><div><small>Расходы</small><strong id="swRingTotal"></strong></div></div></div><div id="swCategories"></div></div>
 <div class="sw-block"><div class="sw-title-row"><h3>История</h3><span id="swCount"></span></div><div id="swHistory"></div></div>
 <p class="sw-privacy">Личные записи хранятся только в этом браузере. Это не банковский баланс. Если очистить данные сайта, записи могут исчезнуть.</p>`;
dialog.querySelector('.syp-shell').appendChild(screen);
// The original SEYVEO PAY card and its QR/buttons stay in the "Карта" screen.
// This new node owns ONLY income/expense records; do not move card markup here.
screen.id='sypBudgetScreen';
const $=id=>screen.querySelector('#'+id);
const rub=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n)+' ₽';
const monthText=d=>new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(d);
const dateText=s=>{const [y,m,d]=s.split('-');return d+'.'+m+'.'+y;};
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let entries=[];try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(v))entries=v.filter(x=>x&&['income','expense'].includes(x.kind)&&Number.isFinite(x.amount)&&x.amount>0&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)).slice(0,10000);}catch{}
let selected=new Date();selected.setDate(1);let kind='expense',editing=null,pending=[],scannedReceiptHash='',receiptObjectURL='';
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(entries));dialog.dispatchEvent(new CustomEvent('seyveo:finance-changed'));return true;}catch{message('Не удалось сохранить. Проверь свободное место и настройки браузера.');return false;}};
const message=t=>{$('swMessage').textContent=t;};
const amountValue=s=>{let t=String(s).trim().replace(/\s/g,'').replace(',','.');const n=Number(t);return /^\d+(?:\.\d{1,2})?$/.test(t)&&n>0&&n<1e10?Math.round(n*100)/100:NaN;};
const category=t=>{t=t.toLowerCase();if(/кофе|капучино|латте|американо|эспрессо/.test(t))return 'Кофе';if(/продукт|магазин|молок|хлеб|пятёроч|магнит/.test(t))return 'Продукты';if(/кафе|ресторан|обед|ужин|пицц/.test(t))return 'Кафе';if(/бензин|заправ|топлив/.test(t))return 'Бензин';if(/такси|автобус|метро|проезд/.test(t))return 'Транспорт';if(/аптек|врач|лекарств/.test(t))return 'Здоровье';if(/квартир|аренд|коммунал/.test(t))return 'Дом';if(/одежд|обув|покупк/.test(t))return 'Покупки';return 'Другое';};
const incomeHint=t=>/зарплат|зп\b|аванс|доход|получил|поступил|преми|подарили|заработал/i.test(t);
function parseOne(part){
 const m=part.match(/(?:^|\s)(\d[\d\s]*(?:[.,]\d{1,2})?)\s*(тыс(?:яч[аиу]?)?|к|руб(?:лей|ля|ль)?|₽)?(?=\s|$)/i);
 if(!m)return null;
 let n=amountValue(m[1]);if(!Number.isFinite(n))return null;
 if(m[2]&&/^(тыс|к$)/i.test(m[2]))n*=1000;
 if(!Number.isFinite(n)||n>=1e10)return null;
 const title=part.replace(m[0],' ').replace(/\b(рублей|рубля|рубль|₽)\b/gi,'').trim().replace(/\s+/g,' ');
 if(!title)return null;
 const entryKind=incomeHint(title)?'income':kind;
 return {id:crypto.randomUUID?.()||String(Date.now())+Math.random(),kind:entryKind,title:title.slice(0,100),amount:n,category:entryKind==='income'?'Доход':category(title),date:today()};
}
function discardReceipt(){
 scanGeneration++;
 if(receiptObjectURL)URL.revokeObjectURL(receiptObjectURL);
 receiptObjectURL='';scannedReceiptHash='';$('swReceipt').hidden=true;$('swCamera').value='';$('swPhoto').value='';
}
let ocrLoader=null,scanGeneration=0;
function loadOcr(){
 if(window.Tesseract)return Promise.resolve(window.Tesseract);
 if(ocrLoader)return ocrLoader;
 ocrLoader=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.async=true;
  script.src='https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
  script.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(Error('OCR недоступен'));
  script.onerror=()=>reject(Error('Не удалось загрузить распознавание'));
  document.head.append(script);
 }).catch(error=>{ocrLoader=null;throw error});
 return ocrLoader;
}
async function scanReceipt(file){
 if(!file)return;
 if(!/^image\/(?:jpeg|png|webp)$/i.test(file.type)||file.size>6*1024*1024||!file.size){message('Выбери JPG, PNG или WebP до 6 МБ.');return;}
 discardReceipt();const token=scanGeneration;receiptObjectURL=URL.createObjectURL(file);$('swReceiptPreview').src=receiptObjectURL;$('swReceipt').hidden=false;$('swReceiptStatus').textContent='Сэйви читает чек на устройстве…';
 kind='expense';updateKind();editing=null;
 let worker=null;
 try{
  if(crypto.subtle){const hash=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());scannedReceiptHash=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');}
  if(scannedReceiptHash&&entries.some(x=>x.sourceHash===scannedReceiptHash)){$('swReceiptStatus').textContent='Такое фото чека уже использовалось. Проверь историю, прежде чем сохранять повторно.';return;}
  const OCR=await loadOcr();worker=await OCR.createWorker(['rus','eng'],1);
  const result=await worker.recognize(file);const content=String(result?.data?.text||'').replace(/\r/g,'');
  if(token!==scanGeneration)return;
  const lines=content.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  let sum=NaN;
  for(const line of lines.filter(x=>/итого|к оплате|всего|сумма|total/i.test(x)).reverse()){
   const values=[...line.matchAll(/(\d[\d ]{0,8}[,.]\d{2}|\d{2,8})\s*(?:₽|руб)?/g)].map(x=>amountValue(x[1])).filter(Number.isFinite);
   if(values.length){sum=values[values.length-1];break;}
  }
  const shop=lines.find(x=>/[а-яёa-z]{3}/i.test(x)&&!/кассов|фискаль|оператор|приход|сумма|чек|инн|ндс/i.test(x))||'Покупка по чеку';
  const matchCount=lines.length;
  showManual({kind:'expense',amount:Number.isFinite(sum)?sum:'',title:shop.slice(0,65),category:category(shop),date:today()});
  $('swReceiptStatus').textContent=Number.isFinite(sum)?'Сэйви нашла возможную сумму '+rub(sum)+'. Сверь с чеком и нажми «Сохранить».':'Текст найден ('+matchCount+' строк), но итоговая сумма не определена. Введи сумму вручную и проверь перед сохранением.';
 }catch{
  if(token!==scanGeneration)return;
  showManual({kind:'expense',title:'Покупка по чеку',amount:'',category:'Другое',date:today()});
  $('swReceiptStatus').textContent='Не удалось автоматически прочитать чек. Введи сумму с фотографии вручную.';
 }finally{if(worker)try{await worker.terminate()}catch{}}
}
function addBatch(batch){
 const original=entries.slice();entries=[...batch,...entries];if(!persist()){entries=original;return false;}
 pending=[];$('swReview').hidden=true;$('swText').value='';render();message('Сэйви сохранила '+batch.length+' '+(batch.length===1?'операцию.':'операции.'));return true;
}
function render(){
 const prefix=selected.getFullYear()+'-'+String(selected.getMonth()+1).padStart(2,'0');
 const month=entries.filter(x=>x.date.startsWith(prefix));
 const income=month.filter(x=>x.kind==='income').reduce((a,x)=>a+x.amount,0),expense=month.filter(x=>x.kind==='expense').reduce((a,x)=>a+x.amount,0);
 const total=entries.reduce((a,x)=>a+(x.kind==='income'?x.amount:-x.amount),0);
 $('swMonth').textContent=monthText(selected);$('swBalance').textContent=rub(total);
 $('swBalanceNote').textContent='За всё время: доходы минус расходы. Начальные деньги не учтены.';
 $('swIncome').textContent='+'+rub(income);$('swExpense').textContent='−'+rub(expense);
 $('swCategoryPeriod').textContent=monthText(selected);
 const sums={};month.filter(x=>x.kind==='expense').forEach(x=>sums[x.category]=(sums[x.category]||0)+x.amount);
 const cats=Object.entries(sums).sort((a,b)=>b[1]-a[1]);
 const palette=['#459773','#5c87cb','#e7a64f','#9b83c6','#d87982','#67a6aa','#778497','#b3a46b','#8ea985'];let pos=0;
 $('swChart').hidden=!cats.length;
 if(cats.length){const stops=cats.map(([name,n],i)=>{const a=pos;pos+=100*n/expense;return palette[i%palette.length]+' '+a+'% '+pos+'%';});$('swRing').style.background='conic-gradient('+stops.join(',')+')';$('swRingTotal').textContent=rub(expense);}

 $('swCategories').innerHTML=cats.length?cats.map(([name,n],i)=>`<div class="sw-category"><span class="sw-category-label"><i class="sw-cat-dot" style="background:${palette[i%palette.length]}"></i>${icons[name]||'•'} ${escape(name)}</span><strong>${rub(n)}</strong><div class="sw-bar"><i style="width:${expense?100*n/expense:0}%"></i></div></div>`).join(''):'<p class="sw-empty">Пока нет расходов за этот месяц.</p>';
 $('swCount').textContent=month.length+' записей';
 $('swHistory').innerHTML=month.length?month.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<div class="sw-row"><div class="sw-row-main"><span class="sw-row-icon">${x.kind==='income'?'↗':icons[x.category]||'•'}</span><div><strong>${escape(x.title)}</strong><small>${dateText(x.date)} · ${escape(x.category)}${x.foreign?' · '+escape(String(x.foreign.amount)+' '+x.foreign.currency):''}</small></div></div><strong class="${x.kind==='income'?'sw-income':''}">${x.kind==='income'?'+':'−'}${rub(x.amount)}</strong><div class="sw-row-tools"><button type="button" data-sw="edit" data-id="${escape(x.id)}" aria-label="Изменить запись">✎</button><button type="button" data-sw="delete" data-id="${escape(x.id)}" aria-label="Удалить запись">×</button></div></div>`).join(''):'<p class="sw-empty">Записей пока нет. Расскажи Сэйви о первой покупке или доходе.</p>';
}
function showManual(x){
 $('swManual').hidden=false;$('swReview').hidden=true;$('swAmount').value=x?.amount??'';$('swTitle').value=x?.title??'';$('swCategory').value=x?.category??(kind==='income'?'Доход':'Другое');$('swDate').value=x?.date||today();
 kind=x?.kind||kind;updateKind();screen.querySelector('[data-sw="cancel-edit"]').hidden=!x;$('swAmount').focus();
}
function updateKind(){screen.querySelectorAll('[data-sw-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.swKind===kind)));$('swCategory').value=kind==='income'?'Доход':$('swCategory').value==='Доход'?'Другое':$('swCategory').value;}
$('swCategory').innerHTML=['Доход',...CATS].map(c=>`<option>${c}</option>`).join('');$('swDate').value=today();
screen.addEventListener('click',ev=>{
 const b=ev.target.closest('button');if(!b)return;
 if(b.dataset.swKind){kind=b.dataset.swKind;updateKind();return;}
 const action=b.dataset.sw;
 if(action==='previous'||action==='next'){selected.setMonth(selected.getMonth()+(action==='next'?1:-1));render();}
 if(action==='manual'){discardReceipt();editing=null;showManual(null);message('');}
 if(action==='camera')$('swCamera').click();
 if(action==='photo')$('swPhoto').click();
 if(action==='discard-receipt')discardReceipt();
 if(action==='cancel-edit'){editing=null;$('swManual').hidden=true;message('');}
 if(action==='parse'){
 const raw=$('swText').value.trim();
 const parts=raw.split(/\s*[,;\n]+\s*(?=[а-яёa-z])/i).filter(Boolean);
 pending=parts.map(parseOne).filter(Boolean);
 if(!pending.length||pending.length!==parts.length){$('swReview').hidden=true;message('Не удалось уверенно разобрать все суммы. Укажи название и сумму для каждого расхода или введи вручную.');return;}
 $('swManual').hidden=true;$('swReview').hidden=false;$('swReview').innerHTML='<strong>Сэйви поняла:</strong>'+pending.map(x=>`<p>${escape(x.title)} · ${x.kind==='income'?'+':'−'}${rub(x.amount)}</p>`).join('')+'<button type="button" class="sw-primary" data-sw="confirm">Сохранить '+pending.length+'</button><button type="button" class="sw-secondary" data-sw="dismiss">Изменить текст</button>';
 message('Проверь суммы перед сохранением.');
 }
 if(action==='dismiss'){$('swReview').hidden=true;pending=[];message('Исправь текст и нажми «Разобрать».');}
 if(action==='confirm'&&pending.length)addBatch(pending);
 if(action==='save'){
 const n=amountValue($('swAmount').value),title=$('swTitle').value.trim(),date=$('swDate').value;
 if(!Number.isFinite(n)||!title||!/^\d{4}-\d{2}-\d{2}$/.test(date)){message('Проверь сумму, название и дату.');return;}
 const prior=editing?entries.find(x=>x.id===editing):null;
 const entry={id:editing||crypto.randomUUID?.()||String(Date.now()),kind,title:title.slice(0,100),amount:n,date,category:kind==='income'?'Доход':$('swCategory').value,...(scannedReceiptHash?{sourceHash:scannedReceiptHash}:{}),...(prior?.foreign&&kind==='expense'?{foreign:prior.foreign,tripId:prior.tripId}:{})};
 const before=entries.slice();entries=editing?entries.map(x=>x.id===editing?entry:x):[entry,...entries];
 if(!persist()){entries=before;return;}editing=null;$('swManual').hidden=true;discardReceipt();render();message('Сохранено.');
 }
 if(action==='edit'){const x=entries.find(x=>x.id===b.dataset.id);if(x){discardReceipt();editing=x.id;showManual(x);}}
 if(action==='delete'){const x=entries.find(x=>x.id===b.dataset.id);if(x&&confirm('Удалить запись «'+x.title+'»?')){const before=entries.slice();entries=entries.filter(y=>y.id!==x.id);if(!persist())entries=before;render();}}
});
$('swCamera').addEventListener('change',ev=>{const file=ev.target.files?.[0];if(file)void scanReceipt(file);});
$('swPhoto').addEventListener('change',ev=>{const file=ev.target.files?.[0];if(file)void scanReceipt(file);});
dialog.addEventListener('close',discardReceipt);
render();
window.SEYVEO_WALLET=Object.freeze({
 open:()=>window.SEYVEO_PAY?.open?.('finances'),
 render,
 importReceipt:async file=>{
  await window.SEYVEO_PAY?.open?.('finances');
  return scanReceipt(file);
 },
 addTravelExpense({title,amount,currency,rate,date,tripId}){
  if(typeof title!=='string'||!title.trim()||!Number.isFinite(amount)||amount<=0||!Number.isFinite(rate)||rate<=0||! /^[A-Z]{3}$/.test(currency)||typeof tripId!=='string')return false;
  const rubAmount=Math.round(amount*rate*100)/100;if(!Number.isFinite(rubAmount)||rubAmount<=0||rubAmount>=1e10)return false;
  const before=entries.slice();
  entries=[{id:crypto.randomUUID?.()||String(Date.now())+Math.random(),kind:'expense',title:title.trim().slice(0,100),amount:rubAmount,category:category(title),date:today(),tripId,foreign:{amount,currency,rate,rateDate:String(date||'')}},...entries];
  if(!persist()){entries=before;return false;}render();return true;
 },
 getTripExpenses:tripId=>entries.filter(e=>e.kind==='expense'&&e.tripId===tripId&&e.foreign&&Number.isFinite(e.foreign.amount)).map(e=>({...e,foreign:{...e.foreign}})),
 getSummary:()=>({entries:entries.length,balance:entries.reduce((a,x)=>a+(x.kind==='income'?x.amount:-x.amount),0)})
});
})();
