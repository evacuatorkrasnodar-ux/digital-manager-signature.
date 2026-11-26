/* SEYVEO · Currency reference table; no payments or personal data sent. */
(()=>{
'use strict';
const root=document.getElementById('sypCurrencyScreen');if(!root)return;
const $=id=>document.getElementById(id),from=$('sypFxFrom'),to=$('sypFxTo'),amount=$('sypFxAmount'),status=$('sypFxStatus'),table=$('sypFxTable'),refresh=root.querySelector('[data-fx="refresh"]');
const names={RUB:'₽ Рубль',TRY:'₺ Лира',USD:'$ Доллар',EUR:'€ Евро',AMD:'֏ Драм',AED:'Дирхам',THB:'฿ Бат',CNY:'¥ Юань',KZT:'₸ Тенге',GEL:'₾ Лари',BYN:'Бел. рубль',GBP:'£ Фунт',JPY:'¥ Иена',INR:'₹ Рупия',EGP:'Егип. фунт',VND:'₫ Донг',IDR:'Рупия Индонезии',UZS:'Сум',KRW:'₩ Вона',CHF:'Франк',SAR:'Риял',SGD:'Доллар Сингапура',HKD:'Доллар Гонконга',AZN:'Манат',KGS:'Сом',TJS:'Сомони',RSD:'Динар',AUD:'Доллар Австралии',CAD:'Доллар Канады',SEK:'Крона Швеции',NOK:'Крона Норвегии',PLN:'Злотый',CZK:'Крона Чехии',HUF:'Форинт',RON:'Лей',ZAR:'Рэнд',MXN:'Песо',BRL:'Реал'};
const key='seyveo-fx-cache-v1',prefs='seyveo-fx-prefs-v1';let data=null,loading=false,scale=1;
const flags={RUB:'🇷🇺',TRY:'🇹🇷',USD:'🇺🇸',EUR:'🇪🇺',AMD:'🇦🇲',AED:'🇦🇪',THB:'🇹🇭',CNY:'🇨🇳',KZT:'🇰🇿',GEL:'🇬🇪',BYN:'🇧🇾',GBP:'🇬🇧',JPY:'🇯🇵',INR:'🇮🇳',EGP:'🇪🇬',VND:'🇻🇳',IDR:'🇮🇩',UZS:'🇺🇿',KRW:'🇰🇷',CHF:'🇨🇭',SAR:'🇸🇦',SGD:'🇸🇬',HKD:'🇭🇰',AZN:'🇦🇿',KGS:'🇰🇬',TJS:'🇹🇯',RSD:'🇷🇸',AUD:'🇦🇺',CAD:'🇨🇦',SEK:'🇸🇪',NOK:'🇳🇴',PLN:'🇵🇱',CZK:'🇨🇿',HUF:'🇭🇺',RON:'🇷🇴',ZAR:'🇿🇦',MXN:'🇲🇽',BRL:'🇧🇷'};
const zones={'Europe/Istanbul':'TRY','Asia/Istanbul':'TRY','Asia/Yerevan':'AMD','Asia/Dubai':'AED','Asia/Bangkok':'THB','Asia/Tbilisi':'GEL','Asia/Almaty':'KZT','Asia/Tashkent':'UZS','Europe/Minsk':'BYN','Europe/London':'GBP','Asia/Tokyo':'JPY','Asia/Shanghai':'CNY','Africa/Cairo':'EGP','Asia/Ho_Chi_Minh':'VND','Asia/Jakarta':'IDR','Europe/Helsinki':'EUR','Europe/Paris':'EUR','Europe/Berlin':'EUR','Europe/Rome':'EUR','Europe/Madrid':'EUR','Europe/Athens':'EUR','Europe/Amsterdam':'EUR','America/New_York':'USD','America/Los_Angeles':'USD'};
let zoneCurrency='';try{zoneCurrency=zones[Intl.DateTimeFormat().resolvedOptions().timeZone]||'';}catch{}
const tripKey='seyveo-fx-trip-v1',uid=()=>crypto.randomUUID?.()||String(Date.now())+Math.random();
let trip={id:uid(),limit:0};try{const p=JSON.parse(localStorage.getItem(tripKey)||'null');if(p&&typeof p.id==='string'&&Number.isFinite(p.limit)&&p.limit>=0)trip=p;}catch{}
const tripStatus=$('sypFxTripStatus'),tripForm=$('sypFxExpenseForm'),tripLimit=$('sypFxTripLimit');
tripLimit.value=trip.limit?String(trip.limit):'';
function storeTrip(next){try{localStorage.setItem(tripKey,JSON.stringify(next));trip=next;return true;}catch{tripStatus.textContent='Не удалось сохранить бюджет на устройстве.';return false;}}
const parseAmount=s=>{const t=String(s).trim().replace(/\s/g,'').replace(',','.');return /^\d+(?:\.\d{1,2})?$/.test(t)?Number(t):NaN;};
function valid(d){return !!(d&&typeof d.date==='string'&&d.rates&&d.rates.RUB===1&&Object.values(d.rates).every(x=>typeof x==='number'&&Number.isFinite(x)&&x>0));}
try{const d=JSON.parse(localStorage.getItem(key)||'null');if(valid(d))data=d;}catch{}
for(const el of [from,to])for(const [code,n] of Object.entries(names)){const o=document.createElement('option');o.value=code;o.textContent=code+' · '+n;el.append(o);}
from.value='TRY';to.value='RUB';try{const p=JSON.parse(localStorage.getItem(prefs)||'null');if(p&&names[p.from]&&names[p.to]){from.value=p.from;to.value=p.to;}}catch{}
function renderTrip(){
 const records=window.SEYVEO_WALLET?.getTripExpenses?.(trip.id)||[];
 const total=records.reduce((a,b)=>a+b.amount,0);
 $('sypFxTripSpent').textContent=fmt(total)+' ₽';
 $('sypFxTripLeft').textContent=trip.limit?fmt(trip.limit-total)+' ₽':'—';
 $('sypFxTripBar').style.width=(trip.limit?Math.min(100,100*total/trip.limit):0)+'%';
 $('sypFxTripBar').classList.toggle('is-over',trip.limit>0&&total>trip.limit);
 const list=$('sypFxTripList');list.replaceChildren();
 for(const e of records.slice(0,5)){const row=document.createElement('div');row.className='syp-fx-triprow';const name=document.createElement('span'),sum=document.createElement('strong');name.textContent=e.title+' · '+fmt(e.foreign.amount)+' '+e.foreign.currency;sum.textContent=fmt(e.amount)+' ₽';row.append(name,sum);list.append(row);}
 const a=parseAmount(amount.value),r=from.value==='RUB'?1:data?.rates[from.value];
 root.querySelector('[data-fx="record"]').disabled=!(Number.isFinite(a)&&a>0&&r>0&&a*r<1e10);
 if(!tripForm.hidden)$('sypFxExpenseSummary').textContent=Number.isFinite(a)&&r>0?fmt(a)+' '+from.value+' ≈ '+fmt(a*r)+' ₽':'Нет курса для записи.';
}
const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n):'—';
const rateFmt=n=>new Intl.NumberFormat('ru-RU',{maximumSignificantDigits:6}).format(n);
function ratio(){const a=data?.rates[from.value],b=data?.rates[to.value];return a>0&&b>0?a/b:from.value===to.value?1:NaN;}
function render(){
 const r=ratio(),a=parseAmount(amount.value),fc=from.value,tc=to.value;
 $('sypFxFromFlag').textContent=flags[fc]||'';
 $('sypFxToFlag').textContent=flags[tc]||'';
 $('sypFxZoneHint').hidden=!zoneCurrency||zoneCurrency===fc||zoneCurrency===tc;
 $('sypFxZoneText').textContent=zoneCurrency?'Валюта по часовому поясу устройства: '+names[zoneCurrency]:'';
 for(const b of root.querySelectorAll('[data-fx-scale]'))b.setAttribute('aria-pressed',String(Number(b.dataset.fxScale)===scale));
 $('sypFxFromCode').textContent=fc;$('sypFxPair').textContent=fc+' → '+tc;
 $('sypFxResult').textContent=amount.value.trim()&&Number.isFinite(a)&&a>=0&&Number.isFinite(r)?fmt(a*r)+' '+tc:'—';
 $('sypFxRate').textContent=Number.isFinite(r)?'1 '+fc+' ≈ '+rateFmt(r)+' '+tc:'Нет курса для выбранной пары';
 $('sypFxDate').textContent=data?'Курсы на '+data.date.split('-').reverse().join('.'):'Курс пока не загружен';
 const values=['VND','IDR','UZS','KRW'].includes(fc)?[1000,5000,10000,20000,50000,100000,500000,1000000]:['JPY','KZT','AMD','HUF'].includes(fc)?[100,200,500,1000,2000,5000,10000,20000]:[10,20,50,100,200,500,1000,5000];
 table.replaceChildren(...values.map(v=>{const n=v*scale;const b=document.createElement('button');b.type='button';b.className='syp-fx-row';b.dataset.amount=String(n);const x=document.createElement('span'),y=document.createElement('span');x.textContent=fmt(n)+' '+fc;y.textContent=Number.isFinite(r)?fmt(n*r)+' '+tc:'—';b.append(x,y);return b;}));
 renderTrip();
}
async function load(force=false){
 if(loading)return;if(!force&&data&&Date.now()-data.fetchedAt<6*3600000){render();return;}
 loading=true;refresh.disabled=true;status.textContent='Обновляю курсы…';const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
 try{
 const response=await fetch('assets/seyveo-fx-rates.json',{signal:controller.signal,cache:'no-store',credentials:'same-origin'});
 if(!response.ok)throw Error('network');const raw=await response.json();
 const next={date:raw.date,rates:raw.rates,fetchedAt:Date.now()};if(!/^\d{4}-\d{2}-\d{2}$/.test(next.date)||!valid(next)||!next.rates.TRY||!next.rates.USD)throw Error('data');
 if(!data||next.date>=data.date){data=next;try{localStorage.setItem(key,JSON.stringify(data));}catch{}}
 const age=(Date.now()-Date.parse(data.date+'T00:00:00Z'))/86400000;
 status.textContent=age>4?'Доступен последний опубликованный файл. Проверьте дату курса.':'Курсы загружены.';
 }catch{status.textContent=data?'Нет связи. Использую сохранённые курсы на указанную дату.':'Не удалось загрузить курсы. Подключитесь к интернету и нажмите обновление.';}
 finally{clearTimeout(timer);loading=false;refresh.disabled=false;render();}
}
function changed(){try{localStorage.setItem(prefs,JSON.stringify({from:from.value,to:to.value}));}catch{}render();}
from.addEventListener('change',changed);to.addEventListener('change',changed);amount.addEventListener('input',render);

root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.fxScale){scale=Number(b.dataset.fxScale);render();return;}
 if(b.dataset.fx==='swap'){const v=from.value;from.value=to.value;to.value=v;changed();}
 else if(b.dataset.fx==='refresh')void load(true);
 else if(b.dataset.fx==='zone'&&zoneCurrency){from.value=zoneCurrency;changed();}
 else if(b.dataset.fx==='limit'){const n=parseAmount(tripLimit.value);if(!Number.isFinite(n)||n<=0||n>=1e10){tripStatus.textContent='Укажите положительный бюджет в рублях.';return;}if(storeTrip({...trip,limit:n})){tripStatus.textContent='Бюджет сохранён.';renderTrip();}}
 else if(b.dataset.fx==='record'){tripForm.hidden=false;$('sypFxExpenseName').value='';renderTrip();$('sypFxExpenseName').focus();}
 else if(b.dataset.fx==='cancel'){tripForm.hidden=true;tripStatus.textContent='';}
 else if(b.dataset.fx==='newtrip'){if(confirm('Начать новую поездку? Прошлые расходы останутся в финансах.')){if(storeTrip({id:uid(),limit:0})){tripLimit.value='';tripForm.hidden=true;tripStatus.textContent='Новая поездка начата.';renderTrip();}}}
 else if(b.dataset.amount){amount.value=b.dataset.amount;render();}
});
tripForm.addEventListener('submit',async e=>{
 e.preventDefault();const title=$('sypFxExpenseName').value.trim(),n=parseAmount(amount.value),currency=from.value,rate=currency==='RUB'?1:data?.rates[currency];
 if(!title||!Number.isFinite(n)||n<=0||!(rate>0)||n*rate>=1e10){tripStatus.textContent='Проверьте название, сумму и курс.';return;}
 if(!storeTrip(trip))return;
 const wallet=window.SEYVEO_WALLET;if(!wallet?.addTravelExpense){tripStatus.textContent='Финансы ещё загружаются. Повторите после загрузки.';return;}
 if(wallet.addTravelExpense({title,amount:n,currency,rate,date:currency==='RUB'?'':data?.date,tripId:trip.id})){tripForm.hidden=true;tripStatus.textContent='Покупка сохранена в финансах.';renderTrip();}
 else tripStatus.textContent='Не удалось сохранить покупку.';
});
document.getElementById('seyveoPayDialog').addEventListener('seyveo:finance-changed',renderTrip);
window.SEYVEO_FX=Object.freeze({open(){render();void load();}});
render();
})();
