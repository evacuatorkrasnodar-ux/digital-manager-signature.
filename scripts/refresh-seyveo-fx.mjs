/* Public reference rates. No customer data, API keys or paid services. */
import {readFile,writeFile,rename} from 'node:fs/promises';
const output=new URL('../assets/seyveo-fx-rates.json',import.meta.url);
const endpoint='https://www.cbr-xml-daily.ru/daily_json.js';
const response=await fetch(endpoint,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{accept:'application/json,application/javascript'}});
if(!response.ok)throw Error('Rates HTTP '+response.status);
const raw=await response.json(),date=String(raw.Date||'').slice(0,10),rates={RUB:1};
for(const x of Object.values(raw.Valute||{})){
 const n=Number(x.Nominal),v=Number(x.Value);
 if(/^[A-Z]{3}$/.test(String(x.CharCode))&&Number.isFinite(n)&&n>0&&Number.isFinite(v)&&v>0)rates[x.CharCode]=v/n;
}
if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||Object.keys(rates).length<30||!rates.TRY||!rates.USD||!rates.EUR)throw Error('Invalid rate snapshot');
const previous=JSON.parse(await readFile(output,'utf8'));
if(previous.date>date)throw Error('Upstream returned older rates');
if(previous.date===date){console.log('Already current: '+date);process.exit(0);}
const payload={date,source:endpoint,rates:Object.fromEntries(Object.entries(rates).sort(([a],[b])=>a.localeCompare(b)))};
const tmp=new URL(output.href+'.tmp');await writeFile(tmp,JSON.stringify(payload,null,2)+'\n');await rename(tmp,output);
console.log('Rates updated: '+date);
