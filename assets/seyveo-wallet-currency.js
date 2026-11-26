/* SEYVEO · Currency reference table; no payments or personal data sent. */
(()=>{
'use strict';
const root=document.getElementById('sypCurrencyScreen');if(!root)return;
const $=id=>document.getElementById(id),from=$('sypFxFrom'),to=$('sypFxTo'),amount=$('sypFxAmount'),status=$('sypFxStatus'),table=$('sypFxTable'),refresh=root.querySelector('[data-fx="refresh"]');
const names={RUB:'₽ Рубль',TRY:'₺ Лира',USD:'$ Доллар',EUR:'€ Евро',AMD:'֏ Драм',AED:'Дирхам',THB:'฿ Бат',CNY:'¥ Юань',KZT:'₸ Тенге',GEL:'₾ Лари',BYN:'Бел. рубль',GBP:'£ Фунт',JPY:'¥ Иена',INR:'₹ Рупия',EGP:'Егип. фунт',VND:'₫ Донг',IDR:'Рупия Индонезии',UZS:'Сум',KRW:'₩ Вона',CHF:'Франк',SAR:'Риял',SGD:'Доллар Сингапура',HKD:'Доллар Гонконга',AZN:'Манат',KGS:'Сом',TJS:'Сомони',RSD:'Динар',AUD:'Доллар Австралии',CAD:'Доллар Канады',SEK:'Крона Швеции',NOK:'Крона Норвегии',PLN:'Злотый',CZK:'Крона Чехии',HUF:'Форинт',RON:'Лей',ZAR:'Рэнд',MXN:'Песо',BRL:'Реал'};
const key='seyveo-fx-cache-v1',prefs='seyveo-fx-prefs-v1';let data=null,loading=false;
function valid(d){return !!(d&&typeof d.date==='string'&&d.rates&&d.rates.RUB===1&&Object.values(d.rates).every(x=>typeof x==='number'&&Number.isFinite(x)&&x>0));}
try{const d=JSON.parse(localStorage.getItem(key)||'null');if(valid(d))data=d;}catch{}
for(const el of [from,to])for(const [code,n] of Object.entries(names)){const o=document.createElement('option');o.value=code;o.textContent=code+' · '+n;el.append(o);}
from.value='TRY';to.value='RUB';try{const p=JSON.parse(localStorage.getItem(prefs)||'null');if(p&&names[p.from]&&names[p.to]){from.value=p.from;to.value=p.to;}}catch{}
const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n):'—';
const rateFmt=n=>new Intl.NumberFormat('ru-RU',{maximumSignificantDigits:6}).format(n);
function ratio(){const a=data?.rates[from.value],b=data?.rates[to.value];return a>0&&b>0?a/b:from.value===to.value?1:NaN;}
function render(){
 const r=ratio(),a=Number(amount.value.trim().replace(/\s/g,'').replace(',','.')),fc=from.value,tc=to.value;
 $('sypFxFromCode').textContent=fc;$('sypFxPair').textContent=fc+' → '+tc;
 $('sypFxResult').textContent=amount.value.trim()&&Number.isFinite(a)&&a>=0&&Number.isFinite(r)?fmt(a*r)+' '+tc:'—';
 $('sypFxRate').textContent=Number.isFinite(r)?'1 '+fc+' ≈ '+rateFmt(r)+' '+tc:'Нет курса для выбранной пары';
 $('sypFxDate').textContent=data?'Курсы на '+data.date.split('-').reverse().join('.'):'Курс пока не загружен';
 const values=['VND','IDR','UZS','KRW'].includes(fc)?[1000,5000,10000,20000,50000,100000,500000,1000000]:['JPY','KZT','AMD','HUF'].includes(fc)?[100,200,500,1000,2000,5000,10000,20000]:[10,20,50,100,200,500,1000,5000];
 table.replaceChildren(...values.map(n=>{const b=document.createElement('button');b.type='button';b.className='syp-fx-row';b.dataset.amount=String(n);const x=document.createElement('span'),y=document.createElement('span');x.textContent=fmt(n)+' '+fc;y.textContent=Number.isFinite(r)?fmt(n*r)+' '+tc:'—';b.append(x,y);return b;}));
}
async function load(force=false){
 if(loading)return;if(!force&&data&&Date.now()-data.fetchedAt<6*3600000){render();return;}
 loading=true;refresh.disabled=true;status.textContent='Обновляю курсы…';const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
 try{
 const response=await fetch('https://www.cbr-xml-daily.ru/daily_json.js',{signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
 if(!response.ok)throw Error('network');const raw=await response.json(),rates={RUB:1};
 for(const x of Object.values(raw.Valute||{})){const v=Number(x.Value)/Number(x.Nominal);if(typeof x.CharCode==='string'&&Number.isFinite(v)&&v>0)rates[x.CharCode]=v;}
 const date=String(raw.Date||'').slice(0,10);const next={date,rates,fetchedAt:Date.now()};if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!valid(next)||!rates.TRY||!rates.USD)throw Error('data');
 data=next;try{localStorage.setItem(key,JSON.stringify(data));}catch{}status.textContent='Курсы обновлены.';
 }catch{status.textContent=data?'Нет связи. Использую сохранённые курсы на указанную дату.':'Не удалось загрузить курсы. Подключитесь к интернету и нажмите обновление.';}
 finally{clearTimeout(timer);loading=false;refresh.disabled=false;render();}
}
function changed(){try{localStorage.setItem(prefs,JSON.stringify({from:from.value,to:to.value}));}catch{}render();}
from.addEventListener('change',changed);to.addEventListener('change',changed);amount.addEventListener('input',render);
root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.fx==='swap'){const x=from.value;from.value=to.value;to.value=x;changed();}else if(b.dataset.fx==='refresh')void load(true);else if(b.dataset.amount){amount.value=b.dataset.amount;render();}});
window.SEYVEO_FX=Object.freeze({open(){render();void load();}});
render();
})();
